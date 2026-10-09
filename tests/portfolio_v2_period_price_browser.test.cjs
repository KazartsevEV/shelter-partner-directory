const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const eq=(x,y,msg)=>A.ok(Math.abs(x-y)<.012,msg+': '+x+' vs '+y);
const sku=(id,stock,cap=250)=>({
 id,name:id,source:'resale',unitCost:20,forecastUnitsPerMonth:20,
 adBudget:100,baseCac:5,priceMin:20,priceMax:cap,maxDiscountPct:0,
 minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:0,
 adManagement:0,variableSalesPct:0,creditServiceMonthly:0,
 creditPrincipal:0,creditMonths:0,vatPct:0,inventoryQty:stock,
 materialsBatchTotal:stock*20,productionTotal:0,reserveAmount:0
});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try{
  await page.goto(pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href,{waitUntil:'domcontentloaded'});
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
  await page.locator('[data-linked-path="forecastMonths"]').fill('5');
  await page.locator('[data-linked-path="recurringDemandApproved"]').check();
  let r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  eq(r.items.find(x=>x.id==='a').priceList,50,'A full-period target price');
  eq(r.items.find(x=>x.id==='b').priceList,38.58,'B full-period target price');
  A.ok(r.items.every(x=>x.status==='TARGET_MET'));
  A.ok(r.cashflow.periodPnl.netMargin>=25);
  A.ok(r.invariants.periodSkuProfitConserved);
  const text=await page.locator('#linked-results').textContent();
  A.match(text,/расчётная цена за весь период/);
  A.match(text,/Проверка цены и маржи SKU за весь период/);
  A.match(text,/Целевая маржа подтверждена/);
  await page.locator('[data-linked-save]').click();
  await page.locator('[data-linked-back]').click();
  await page.evaluate(()=>showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  eq(r.items.find(x=>x.id==='a').priceList,50,'price survives back/resume');
  // Fail closed at actual V1 price ceiling (not a secret out-of-range price).
  await page.evaluate(p=>LinkedPortfolioV2UI.importFromV1(p),
    {skus:[sku('a',20,39),sku('b',100)],tax:{type:'turnover',pct:5}});
  await page.locator('[data-linked-path="forecastMonths"]').fill('5');
  await page.locator('[data-linked-path="recurringDemandApproved"]').check();
  // Saved campaign remains attached to canonical SKUs after V1 reimport.
  const blocked=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(blocked.ready,false);
  eq(blocked.items.find(x=>x.id==='a').priceList,39,'V1 ceiling respected');
  A.equal(blocked.items.find(x=>x.id==='a').status,'INFEASIBLE');
  A.match(blocked.errors.join(' '),/минимальная маржа/);
  A.deepEqual(errors,[]);
  console.log('PERIOD_PRICE_31F2B_BROWSER_GREEN',JSON.stringify({
   targetPrices:[50,38.58],hardCeiling:39,blocked:true,scenarioMonths:5}));
 }finally{await browser.close()}
})().catch(e=>{console.error('PERIOD_PRICE_31F2B_BROWSER_RED',e.stack||e);process.exitCode=1});
