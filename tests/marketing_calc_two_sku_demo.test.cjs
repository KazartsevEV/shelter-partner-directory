// Exact public opt-in demo smoke test on 390px mobile Chromium.
// Run: node tests/marketing_calc_two_sku_demo.test.cjs
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
const expected={
 cash:{first:519.9040050125313,second:382.0946428571429,weight:.6711610405024351,live:63274.668053258145},
 credit:{first:555.0982453132832,second:405.59889285714286,weight:.6724408498627492,live:9395.889476428541}
};
const near=(actual,match,msg)=>assert.ok(Math.abs(actual-match)<.015,msg+' got '+actual+', expected '+match);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const finance of ['cash','credit']){
   const page=await browser.newPage({viewport:{width:390,height:844}});
   const faults=[];page.on('pageerror',e=>faults.push(e.message));
   await page.route(/^https?:\/\//,r=>r.abort());
   await page.goto(url+'?demo=shopper&second=shirt&finance='+finance,{waitUntil:'domcontentloaded'});
   await page.locator('#product-demo-banner').waitFor({state:'visible',timeout:10000});
   const banner=await page.locator('#product-demo-banner').textContent();
   assert.match(banner,/ДЕМО: два заполненных товара/);
   assert.match(banner,/НЕ автоматизировано/);
   assert.equal(await page.locator('#demo-edit-first').isVisible(),true);
   for(const link of await page.locator('#product-demo-banner a[href*="finance="]').all()){
     const href=await link.getAttribute('href');
     assert.match(href,/second=shirt/);
   }
   const r=await page.evaluate(()=>{
     const model=calculateProductPortfolio(),cash=calculateProductCashFlow(model);
     return {
       names:productPortfolio.map(x=>x.name),
       count:productPortfolio.length,
       stock:productPortfolio.map(x=>x.logisticsQty),
       materials:productPortfolio.map(x=>x.materialsBatchQty),
       monthlySales:productPortfolio.map(x=>x.forecastUnitsPerMonth),
       ads:productPortfolio.map(x=>x.adBudget),
       marketer:productPortfolio.map(x=>x.adManagement),
       salesStaff:productPortfolio.map(x=>x.salesFixedMonthly),
       unitCosts:model.items.map(x=>x.unitCost),
       prices:model.items.map(x=>x.price),
       weights:model.items.map(x=>x.revenueWeight),
       ready:model.pricingReady&&cash.ready,
       shared:model.sharedBusinessCosts,
       months:cash.months.length,
       live:cash.freeCumulativeEnd,
       taxType:productBusinessTaxType,
       vatInputs:document.querySelectorAll('#own-sales-vat-pct').length,
       frozen:document.querySelectorAll('[data-completed-product-id="1"]').length,
       funding:productPortfolio.map(x=>x.planning.fundingMode),
       inputs:productPortfolio.map(x=>({
         materialsUnitCost:x.materialsUnitCost,materialsBatchTotal:x.materialsBatchTotal,
         productionUnitCost:x.productionUnitCost,productionTotal:x.productionTotal,
         warehouseDayCost:x.warehouseDayCost,warehouseInboundUnitCost:x.warehouseInboundUnitCost,
         customerDeliveryPct:x.customerDeliveryPct,customerReturnPct:x.customerReturnPct,
         logisticsUnitCost:x.logisticsUnitCost,adBudget:x.adBudget,adManagement:x.adManagement,
         defect:x.productionDefectPct,planning:x.planning
       })),
       baseCac:model.items.map(x=>x.baseCac)
     };
   });
   assert.equal(r.count,2);
   assert.equal(r.ready,true);
   assert.match(r.names[0],/шоппер/i);
   assert.match(r.names[1],/Майка/);
   assert.deepEqual(r.materials,[106,54]);
   assert.deepEqual(r.stock,[100,50]);
   assert.deepEqual(r.monthlySales,[24,16]);
   assert.deepEqual(r.ads,[900,600]);
   assert.deepEqual(r.marketer,[120,60]);
   assert.deepEqual(r.salesStaff,[1000,0]);
   assert.equal(r.shared,1180);
   assert.equal(r.taxType,'turnover');
   assert.equal(r.vatInputs,1,'Only one global VAT input');
   assert.equal(r.frozen,1,'Original filled form preserved exactly once');
   assert.deepEqual(r.funding,[finance,finance]);
   assert.equal(r.months,finance==='credit'?6:5);
   console.log('TWO_SKU_DEMO_DIAGNOSTIC',JSON.stringify(r));
   const exp=expected[finance];
   near(r.prices[0],exp.first,'First SKU unit price');
   near(r.prices[1],exp.second,'Second SKU unit price');
   near(r.weights[0],exp.weight,'Revenue share');
   near(r.weights[0]+r.weights[1],1,'Weights sum to one');
   near(r.live,exp.live,'Portfolio end free cash');

   // The link must actually recover first SKU's editable original data.
   await page.locator('#demo-edit-first').click();
   assert.equal(await page.locator('#own-materials-cost').inputValue(),'200');
   assert.equal(await page.locator('#own-production-premises-monthly').inputValue(),'1000');
   assert.equal(await page.evaluate(()=>productPortfolio.length),2,'SKU #2 must survive editing SKU #1');
   assert.deepEqual(faults,[]);
   console.log('TWO_SKU_PREFILLED_GREEN',JSON.stringify({
      finance,months:r.months,materials:r.materials,stocks:r.stock,
      sales:r.monthlySales,prices:r.prices,weights:r.weights,
      totalAdBudget:1500,commonModelExpenses:r.shared,freeCash:r.live
   }));
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('TWO_SKU_PREFILLED_RED',e.stack||e);process.exitCode=1});
