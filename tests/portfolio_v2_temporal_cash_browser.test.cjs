const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const close=(actual,expected,label)=>A.ok(Math.abs(actual-expected)<.012,
 label+': '+actual+' vs '+expected);
const item=(id,stock)=>({
 id,name:id,source:'resale',unitCost:20,forecastUnitsPerMonth:20,
 adBudget:100,baseCac:5,priceMin:20,priceMax:200,maxDiscountPct:0,
 minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:0,adManagement:0,
 variableSalesPct:0,creditServiceMonthly:0,creditPrincipal:0,creditMonths:0,
 vatPct:0,inventoryQty:stock,materialsBatchTotal:stock*20,
 productionTotal:0,reserveAmount:0
});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try{
  await page.goto(pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href,
   {waitUntil:'domcontentloaded'});
  const salon={...item('salon',0),source:'offline-service',unitCost:20,
    serviceMaterialsUnit:5,serviceElectricityUnit:0,
    serviceFixedMonthly:300,serviceCapacity:30,
    materialsBatchTotal:100,productionTotal:300};
  await page.evaluate(p=>LinkedPortfolioV2UI.importFromV1(p),
    {tax:{type:'turnover',pct:5},skus:[item('goods',60),salon]});
  await page.locator('[data-linked-path="forecastMonths"]').fill('5');
  await page.locator('[data-linked-path="recurringDemandApproved"]').check();
  await page.locator('[data-basket-action="add"]').click();
  await page.locator('[data-basket-field="mode"]').selectOption('cross_sell');
  await page.locator('[data-basket-field="attachPct"]').fill('50');
  const r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  A.equal(r.cashflow.temporal,true);
  A.deepEqual(r.temporal.months.map(m=>m.orders.goods),[20,20,20,0,0]);
  A.deepEqual(r.temporal.months.map(m=>m.orders.salon),[30,30,30,20,20]);
  const a=r.items.find(s=>s.id==='goods').standaloneNet;
  const b=r.items.find(s=>s.id==='salon').standaloneNet;
  r.cashflow.months.forEach((m,i)=>{
    close(m.receipt,i<3?20*a+30*b:20*b,'Month '+(i+1)+' cash receipts');
    close(m.tax,.05*m.receipt,'Month '+(i+1)+' turnover tax');
    close(m.ad,i<3?200:100,'Month '+(i+1)+' own advertising');
    close(m.stockPurchase,i===0?1200+300:300,
      'Month '+(i+1)+' stock-once, recurring rent');
  });
  A.match(await page.locator('#linked-results').textContent(),/Поступления без НДС/);
  await page.locator('[data-linked-save]').click();
  await page.locator('[data-linked-back]').click();
  await page.evaluate(()=>showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  const resumed=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(resumed.ready,true,JSON.stringify(resumed.errors));
  A.equal(resumed.cashflow.months.length,5);
  A.equal(resumed.cashflow.temporal,true);
  A.deepEqual(errors,[]);
  console.log('TEMPORAL_31E2_MIXED_BROWSER_GREEN',JSON.stringify({
   months:r.cashflow.months.length,receipts:r.cashflow.months.map(x=>x.receipt)}));
 }finally{await browser.close()}
})().catch(e=>{console.error('TEMPORAL_31E2_MIXED_BROWSER_RED',e.stack||e);process.exitCode=1});
