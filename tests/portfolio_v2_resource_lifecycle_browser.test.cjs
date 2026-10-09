// Browser E2E for #31D shared-resource lifetime, exercised through mobile controls.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const approx=(x,y,label)=>assert.ok(Math.abs(x-y)<.011,label+': '+x+' vs '+y);
const mk=(id,stock)=>({
 id,name:id,source:'resale',unitCost:20,forecastUnitsPerMonth:20,
 adBudget:100,baseCac:5,priceMin:20,priceMax:150,
 maxDiscountPct:0,minimumMarginPct:10,targetMarginPct:25,
 salesFixedMonthly:0,adManagement:0,variableSalesPct:0,
 creditServiceMonthly:0,creditPrincipal:0,creditMonths:0,vatPct:0,
 inventoryQty:stock,materialsBatchTotal:stock*20,productionTotal:0,reserveAmount:0
});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try{
  await page.goto(pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href,{waitUntil:'domcontentloaded'});
  await page.evaluate(payload=>LinkedPortfolioV2UI.importFromV1(payload),
   {tax:{type:'turnover',pct:5},skus:[mk('fast',20),mk('slow',60)]});
  const baseline=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  assert.equal(baseline.ready,true,JSON.stringify(baseline.errors));
  assert.equal(baseline.cashflow.months.length,3);
  await page.locator('[data-linked-add]').click();
  await page.locator('[data-linked-path="resources.0.amount"]').fill('300');
  await page.locator('[data-linked-path="resources.0.allocation"]').selectOption('usage');
  await page.locator('[data-linked-path="resources.0.usageMode"]').selectOption('per-unit');
  await page.locator('[data-linked-path="resources.0.loadPerUnit.fast"]').fill('1');
  await page.locator('[data-linked-path="resources.0.loadPerUnit.slow"]').fill('1');
  const after=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  assert.equal(after.ready,true,JSON.stringify(after.errors));
  assert.equal(after.cashflow.months.length,3);
  for(const m of after.cashflow.months)approx(m.shared,300,'shared calendar month '+m.month);
  assert.ok(after.items[0].priceList>baseline.items[0].priceList);
  assert.ok(after.items[1].priceList>after.items[0].priceList);
  assert.match(await page.locator('#linked-results').textContent(),/Общие ресурсы оплачиваются один раз/);
  await page.locator('[data-linked-save]').click();
  await page.locator('[data-linked-back]').click();
  await page.evaluate(()=>showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  const resumed=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  assert.equal(resumed.ready,true,JSON.stringify(resumed.errors));
  resumed.cashflow.months.forEach(m=>approx(m.shared,300,'saved month '+m.month));
  assert.deepEqual(errors,[]);
  console.log('V2_31D_SHARED_RESOURCE_BROWSER_GREEN',JSON.stringify({
   months:after.cashflow.months.length,shared:after.cashflow.months.map(m=>m.shared),
   price:after.items.map(x=>x.priceList)}));
 }finally{await browser.close();}
})().catch(e=>{console.error('V2_31D_SHARED_RESOURCE_BROWSER_RED',e.stack||e);process.exitCode=1});
