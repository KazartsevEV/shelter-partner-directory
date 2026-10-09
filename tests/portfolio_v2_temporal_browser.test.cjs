// Mobile browser: opt-in repeated demand, physical availability and offer stock block.
const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const sku=(id,stock,source='resale')=>({
 id,name:id,source,unitCost:20,forecastUnitsPerMonth:20,adBudget:100,
 baseCac:5,priceMin:20,priceMax:150,maxDiscountPct:0,minimumMarginPct:10,
 targetMarginPct:25,salesFixedMonthly:0,adManagement:0,variableSalesPct:0,
 creditServiceMonthly:0,vatPct:0,inventoryQty:stock,materialsBatchTotal:stock*20,
 productionTotal:0,reserveAmount:0
});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try{
  await page.goto(pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href,{waitUntil:'domcontentloaded'});
  const payload={tax:{type:'turnover',pct:5},skus:[sku('a',60),sku('b',100)]};
  await page.evaluate(p=>LinkedPortfolioV2UI.importFromV1(p),payload);
  A.equal(await page.locator('[data-temporal-controls]').isVisible(),true);
  await page.locator('[data-linked-path="forecastMonths"]').fill('5');
  let result=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(result.ready,false);
  A.match(result.errors.join(' '),/Подтвердите/);
  await page.locator('[data-linked-path="recurringDemandApproved"]').check();
  result=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(result.ready,true,JSON.stringify(result.errors));
  A.equal(result.temporal.months.length,5);
  A.deepEqual(result.temporal.months.map(m=>m.orders.a),[20,20,20,0,0]);
  A.match(await page.locator('#linked-temporal-result').textContent(),/Остатки и мощности проверены/);
  await page.locator('[data-linked-save]').click();
  await page.locator('[data-linked-back]').click();await page.evaluate(()=>showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  A.equal(await page.locator('[data-linked-path="forecastMonths"]').inputValue(),'5');
  A.equal(await page.locator('[data-linked-path="recurringDemandApproved"]').isChecked(),true);
  // Physical stock 20 cannot fund standalone 20 plus 50%-attach child.
  await page.evaluate(p=>LinkedPortfolioV2UI.importFromV1(p),
    {tax:{type:'turnover',pct:5},skus:[sku('a',60),sku('b',20)]});
  await page.locator('[data-linked-path="forecastMonths"]').fill('3');
  await page.locator('[data-linked-path="recurringDemandApproved"]').check();
  await page.locator('[data-basket-action="add"]').click();
  await page.locator('[data-basket-field="mode"]').selectOption('bundle');
  await page.locator('[data-basket-field="attachPct"]').fill('50');
  const blocked=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(blocked.ready,false);
  A.match(blocked.errors.join(' '),/Месяц 1.*превышает оставшийся запас/);
  A.equal(blocked.cashflow,undefined,'no misleading cashflow for impossible bundle');
  A.deepEqual(errors,[]);
  console.log('TEMPORAL_31E_BROWSER_GREEN',JSON.stringify({checked:5,blocked:true}));
 }finally{await browser.close()}
})().catch(e=>{console.error('TEMPORAL_31E_BROWSER_RED',e.stack||e);process.exitCode=1});
