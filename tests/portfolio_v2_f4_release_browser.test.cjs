/* F4 release UI gate: never show green target when actual asset life is
   unspecified. Verify live calculations survive the mobile back/resume path. */
const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const sku={id:'single',name:'Production A',source:'resale',unitCost:20,
 forecastUnitsPerMonth:20,adBudget:100,baseCac:5,
 priceMin:20,priceMax:250,maxDiscountPct:0,minimumMarginPct:10,
 targetMarginPct:25,salesFixedMonthly:0,adManagement:0,
 variableSalesPct:0,creditServiceMonthly:0,creditPrincipal:0,
 creditMonths:0,vatPct:0,inventoryQty:40,materialsBatchTotal:800,
 productionTotal:0,reserveAmount:0};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try{
  await page.goto(pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href,
   {waitUntil:'domcontentloaded'});
  await page.evaluate(p=>LinkedPortfolioV2UI.importFromV1(p),
   {skus:[sku],tax:{type:'turnover',pct:5}});
  await page.locator('[data-linked-path="forecastMonths"]').fill('2');
  await page.locator('[data-linked-path="recurringDemandApproved"]').check();
  let r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  A.equal(r.cashflow.periodPnl.accountingCompleteness,'COMPLETE');
  A.equal(r.cashflow.periodPnl.targetMet,true);
  await page.locator('[data-linked-add]').click();
  await page.locator('[data-linked-path="resources.0.kind"]').selectOption('equipment');
  await page.locator('[data-linked-path="resources.0.cadence"]').selectOption('once');
  await page.locator('[data-linked-path="resources.0.allocation"]').selectOption('usage');
  await page.locator('[data-linked-path="resources.0.amount"]').fill('1000');
  await page.locator('[data-linked-path="resources.0.usage.single"]').fill('1');
  r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  A.equal(r.cashflow.periodPnl.accountingCompleteness,'PROVISIONAL');
  A.equal(r.cashflow.periodPnl.targetMet,false);
  A.equal(r.cashflow.periodPnl.minimumMet,false);
  A.equal(r.items[0].status,'PROVISIONAL');
  A.equal(r.items[0].targetMarginMet,false);
  const block=await page.locator('#linked-results').textContent();
  A.match(block,/ПРЕДВАРИТЕЛЬНЫЙ РАСЧЁТ/);
  A.match(block,/целевая маржа за весь период НЕ подтверждена/);
  A.doesNotMatch(block,/Целевая маржа подтверждена по фактическому плану/);
  A.ok(r.cashflow.months.reduce((v,m)=>v+m.shared,0)>=1000,
   'one real equipment cash payment remains visible');
  await page.locator('[data-linked-save]').click();
  await page.locator('[data-linked-back]').click();
  await page.evaluate(()=>showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  const restored=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(restored.ready,true,JSON.stringify(restored.errors));
  A.equal(restored.cashflow.periodPnl.accountingCompleteness,'PROVISIONAL');
  A.deepEqual(errors,[]);
  console.log('F4_PROVISIONAL_ASSET_BROWSER_GREEN',JSON.stringify({
   H:2,resourceCost:1000,targetMet:false,status:restored.items[0].status,
   viewport:390}));
 }finally{await browser.close()}
})().catch(e=>{console.error('F4_PROVISIONAL_ASSET_BROWSER_RED',e.stack||e);process.exitCode=1});
