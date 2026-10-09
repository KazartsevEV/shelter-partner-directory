const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
const close=(a,b,label)=>A.ok(Number.isFinite(a)&&Math.abs(a-b)<.011,
 label+': '+a+' vs '+b);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
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
