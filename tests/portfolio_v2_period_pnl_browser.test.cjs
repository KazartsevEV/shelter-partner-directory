const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const close=(x,y,label)=>A.ok(Math.abs(x-y)<.01,label+': '+x+' vs '+y);
const sku=(id,stock)=>({
 id,name:id,source:'resale',unitCost:20,forecastUnitsPerMonth:20,
 adBudget:100,baseCac:5,priceMin:20,priceMax:250,maxDiscountPct:0,
 minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:0,adManagement:0,
 variableSalesPct:0,creditServiceMonthly:0,creditPrincipal:0,creditMonths:0,
 vatPct:0,inventoryQty:stock,materialsBatchTotal:stock*20,productionTotal:0,
 reserveAmount:0
});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try{
  await page.goto(pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href,
   {waitUntil:'domcontentloaded'});
  await page.evaluate(p=>LinkedPortfolioV2UI.importFromV1(p),
   {skus:[sku('a',20),sku('b',100)],tax:{type:'turnover',pct:5}});
  await page.locator('[data-linked-add]').click();
  await page.locator('[data-linked-path="resources.0.kind"]').selectOption('campaign');
  await page.locator('[data-linked-path="resources.0.pool"]').selectOption('adBudget');
  await page.locator('[data-linked-path="resources.0.amount"]').fill('200');
  await page.locator('[data-linked-path="resources.0.includedBySku.a"]').fill('100');
  await page.locator('[data-linked-path="resources.0.includedBySku.b"]').fill('100');
  await page.locator('[data-linked-path="resources.0.allocation"]').selectOption('usage');
  await page.locator('[data-linked-path="resources.0.usage.a"]').fill('1');
  await page.locator('[data-linked-path="resources.0.usage.b"]').fill('1');
  await page.locator('[data-linked-path="forecastMonths"]').fill('3');
  await page.locator('[data-linked-path="recurringDemandApproved"]').check();
  let r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  let p=r.cashflow.periodPnl;
  A.equal(p.months.length,3);
  const firstProfit=p.netProfit;
  const baseline={a:35.72,b:35.72};
  const baselinePnl3=await page.evaluate(prices=>
    LinkedPortfolioV2Engine.build({...LinkedPortfolioV2UI.getState(),
      __periodPriceCandidate:prices}).cashflow.periodPnl,baseline);
  close(p.netMargin,p.netProfit/p.revenue*100,'three-month margin');
  A.ok(p.netMargin>=25,'period-target margin, not merely month 1');
  await page.locator('[data-linked-path="forecastMonths"]').fill('5');
  r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  p=r.cashflow.periodPnl;
  A.equal(p.months.length,5);
  const baselinePnl5=await page.evaluate(prices=>
    LinkedPortfolioV2Engine.build({...LinkedPortfolioV2UI.getState(),
      __periodPriceCandidate:prices}).cashflow.periodPnl,baseline);
  close(baselinePnl5.netProfit,baselinePnl3.netProfit-400,
    'identical-price counterfactual isolates idle ad expense');
  close(p.months[3].netProfit,-200,'month4 actual idle campaign loss');
  close(p.months[4].netProfit,-200,'month5 actual idle campaign loss');
  close(r.items.find(s=>s.id==='a').priceList,50,'A full-H repriced with idle exposure');
  close(r.items.find(s=>s.id==='b').priceList,38.58,'B full-H repriced');
  A.ok(p.netMargin>=25,'actual period price solver restores target margin');
  A.ok(p.netProfit>baselinePnl5.netProfit,'repricing covers additional campaign payments');
  A.equal(p.months[3].netMargin,null);
  A.match(await page.locator('#linked-results').textContent(),/Экономика за 5 мес/);
  A.match(await page.locator('#linked-results').textContent(),/Маржа за период/);
  A.match(await page.locator('#linked-results').textContent(),/Целевая маржа подтверждена/);
  await page.locator('[data-linked-save]').click();
  await page.locator('[data-linked-back]').click();
  await page.evaluate(()=>showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  close(r.cashflow.periodPnl.netProfit,p.netProfit,'repriced period profit survives resume');
  A.deepEqual(errors,[]);
  console.log('PERIOD_PNL_31F2A_BROWSER_GREEN',JSON.stringify({
   horizon:5,firstProfit,periodProfit:r.cashflow.periodPnl.netProfit,
   realizedMargin:r.cashflow.periodPnl.netMargin}));
 }finally{await browser.close()}
})().catch(e=>{console.error('PERIOD_PNL_31F2A_BROWSER_RED',e.stack||e);process.exitCode=1});
