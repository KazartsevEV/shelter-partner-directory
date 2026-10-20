const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
const close=(a,b,label)=>A.ok(Number.isFinite(a)&&Math.abs(a-b)<.011,
 label+': '+a+' vs '+b);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
 // Preserve explicit RU-copy test intent under first-visit English default.
 await page.addInitScript(()=>{try{localStorage.setItem('nomad360PreferredLanguage','ru')}catch(_){}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try{
  await page.goto(pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href,
   {waitUntil:'domcontentloaded'});
  const payload=fixture();
  // Real online adapter receipt is appended through the UI entry path.
  // Shared resources/offers are loaded as an existing, saved V2 draft,
  // exercising exactly the same persistence/resume path as returning users.
  await page.evaluate(p=>{
   LinkedPortfolioV2UI.importFromV1({skus:p.skus.filter(s=>s.source!=='online-service'),tax:p.tax});
   LinkedPortfolioV2UI.appendOnline(p.skus.find(s=>s.source==='online-service'));
   const state=LinkedPortfolioV2UI.getState();
   state.resources=p.resources;state.offers=p.offers;
   state.forecastMonths=p.forecastMonths;
   state.recurringDemandApproved=p.recurringDemandApproved;
   localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify(state));
   LinkedPortfolioV2UI.resume();
  },payload);
  let r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  A.equal(r.items.length,5);
  A.equal(r.temporal.months.length,3);
  A.equal(r.cashflow.months.length,5);
  // The summary cards display a comparable monthly scenario, not the
  // 3-month accrued result or the 5-month loan/payment settlement calendar.
  const monthly=page.locator('#linked-results');
  A.equal(await monthly.getByText('Выручка без НДС / месяц',{exact:true}).count(),1);
  A.equal(await monthly.getByText('Чистая прибыль / месяц',{exact:true}).count(),1);
  A.ok((await monthly.getByText('Маржа за период',{exact:true}).count())>=1,'period margin column exists');
  A.doesNotMatch(await monthly.textContent(),/Cash flow отражает первые 30 дней|Продано позиций за 30 дней/);
  A.match(await page.locator('[data-linked-cashflow-note]').innerText(),/План продаж из V1:\s*3\s*мес/);
  A.match(await page.locator('[data-linked-cashflow-note]').innerText(),/Месяцев в денежном календаре:\s*5/);
  for(const [id,price] of Object.entries({own:48.27,resale:39.61,drop:28.14,salon:55.85,agent:20}))
   close(r.items.find(s=>s.id===id).priceList,price,id+' real H price');
  for(const m of r.temporal.months){
   close(m.orders.own,15,'own 15/mo');
   close(m.orders.resale,20,'resale 20/mo');
   close(m.orders.drop,13,'dropship upsell 13/mo');
   close(m.orders.salon,9.5,'salon attached visits 9.5/mo');
   close(m.orders.agent,6,'agent V1 deals 6/mo');
  }
  close(r.cashflow.periodPnl.revenue,7518.843,'5-source VAT-net revenue');
  close(r.cashflow.periodPnl.netProfit,2119.40085,'3-month enterprise accrued income');
  for(const [k,revenue] of [2140.461,2445.311,2506.281,365.82,60.97].entries())
   close(r.cashflow.months[k].receipt,revenue,'month '+(k+1)+' actual receipt');
  A.match(await page.locator('#linked-results').textContent(),/Проверка цены и маржи SKU за весь период/);
  A.match(await page.locator('#linked-results').textContent(),/Поступления без НДС/);
  A.equal(await page.locator('[data-linked-path="forecastMonths"]').inputValue(),'3');
  A.equal(await page.locator('[data-linked-path="recurringDemandApproved"]').isChecked(),true);
  await page.locator('[data-linked-path="resources.2.capacity"]').fill('18');
  const overflow=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(overflow.ready,false);
  A.match(overflow.errors.join(' '),/мощност|ресурс/);
  await page.locator('[data-linked-path="resources.2.capacity"]').fill('25');
  r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  await page.locator('[data-linked-save]').click();
  await page.locator('[data-linked-back]').click();
  await page.evaluate(()=>showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  close(r.cashflow.periodPnl.netProfit,2119.40085,'saved 5-source balance');
  const resumed=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  A.equal(resumed.offers.length,3);
  A.equal(resumed.resources.length,3);
  A.equal(resumed.skus.length,5);
  A.deepEqual(errors,[]);
  console.log('MIXED_F3_BROWSER_GREEN',JSON.stringify({
   sources:5,offers:3,resources:3,horizon:3,receipts:5,
   profit:r.cashflow.periodPnl.netProfit,
   vatBasis:r.cashflow.vatCashBasis}));
 }finally{await browser.close()}
})().catch(e=>{console.error('MIXED_F3_BROWSER_RED',e.stack||e);process.exitCode=1});
