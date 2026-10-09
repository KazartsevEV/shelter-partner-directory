// Current-state probe: 2nd SKU on both the self-funded and credit demo.
// Run node tests/marketing_calc_second_sku_probe.cjs after installing playwright/chromium.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
const events=[];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  for(const finance of ['cash','credit']){
   const page=await browser.newPage({viewport:{width:390,height:844}});
   const errors=[];
   page.on('pageerror',x=>errors.push(x.message));
   await page.route(/^https?:\/\//,r=>r.abort());
   await page.goto(url+'?demo=shopper&finance='+finance,{waitUntil:'domcontentloaded'});
   await page.locator('#product-demo-banner').waitFor({state:'visible'});
   const before=await page.evaluate(()=>({
     original:productPortfolio[0].name,
     taxType:productBusinessTaxType,
     vatMode:productOwnChoices.salesVat,
     vatPct:document.getElementById('own-sales-vat-pct').value,
     taxPct:document.getElementById('own-business-tax-pct').value,
     firstUnit:productPortfolio[0].materialsUnitCost,
     firstRent:productPortfolio[0].inputs['own-production-premises-monthly'],
     forecast:productPortfolio[0].forecastUnitsPerMonth,
     reserved:aggregatePlanMetrics(productPortfolio[0]).reserveAmount
   }));
   const chosen=await page.evaluate(()=>addAnotherProduct());
   assert.equal(chosen,true);
   assert.equal(await page.evaluate(()=>currentProductSequence),2);
   for(const source of ['resale','dropship']){
     await page.locator('#product-source-block [data-product-source="'+source+'"]').click();
     const status=await page.evaluate(()=>({
       source:productSource,ownFormVisible:!document.getElementById('product-own-form').hidden,
       savedCount:productPortfolio.length
     }));
     events.push({finance,probe:source,status});
     assert.equal(status.source,source);
     assert.equal(status.ownFormVisible,true,'Detailed form should be available for '+source);
     assert.equal(status.savedCount,1,'Choosing a branch never creates an unwanted product');
   }
   await page.locator('#product-source-block [data-product-source="own"]').click();
   await page.locator('#additional-product-name-input').fill('Майка — второй товар');
   const fill=async(id,v)=>page.locator('#'+id).fill(String(v));
   const choose=async(q)=>page.locator(q).last().click();
   await choose('[data-material-cost-mode="known"]');
   await fill('own-materials-cost',150);
   await choose('[data-yn-group="vatIncluded"][data-yn-value="yes"]');
   await choose('[data-yn-group="inboundIncluded"][data-yn-value="yes"]');
   await choose('[data-yn-group="materialsImported"][data-yn-value="no"]');
   await fill('own-materials-batch-qty',54);
   await choose('[data-yn-group="productionPremises"][data-yn-value="no"]');
   await choose('[data-yn-group="equipmentRental"][data-yn-value="no"]');
   await choose('[data-yn-group="equipmentPurchase"][data-yn-value="no"]');
   await choose('[data-production-labor-mode="self"]');
   await fill('own-production-defect-pct',5);
   await choose('[data-yn-group="productionGas"][data-yn-value="no"]');
   await choose('[data-yn-group="productionElectricity"][data-yn-value="yes"]');
   await fill('own-production-electricity-tariff',1);
   await fill('own-production-electricity-usage',1);
   await choose('[data-yn-group="productionOverheads"][data-yn-value="no"]');
   await fill('own-production-monthly-qty',50);
   await choose('[data-logistics-payer-key="warehouseInbound"][data-logistics-payer-value="me"]');
   await fill('own-warehouse-inbound-unit-cost',10);
   await choose('[data-logistics-payer-key="warehouse"][data-logistics-payer-value="me"]');
   await fill('own-warehouse-cost',.5);
   await fill('own-warehouse-days',2);
   await choose('[data-logistics-payer-key="customerDelivery"][data-logistics-payer-value="me"]');
   await fill('own-customer-delivery-pct',8);
   await fill('own-return-rate',5);
   await fill('own-logistics-qty',50);
   await choose('[data-yn-group="salesCommission"][data-yn-value="yes"]');
   await fill('own-sales-commission-pct',10);
   await choose('[data-yn-group="payroll"][data-yn-value="no"]');
   await choose('[data-yn-group="platformPenalties"][data-yn-value="yes"]');
   await fill('own-platform-penalties-pct',1);
   await choose('[data-yn-group="employees"][data-yn-value="no"]');
   await fill('own-sales-monthly-qty',50);
   await fill('own-product-ad-budget',600);
   await fill('own-product-ad-cpc',3);
   await fill('own-product-ad-ctr',2);
   await fill('own-product-ad-click-lead',20);
   await fill('own-product-ad-lead-sale',40);
   await fill('own-product-ad-management',60);
   await choose('#assortment-complete-button');
   const sel='[data-business-product-id="2"]';
   for(const [key,v] of [['supplyDays',7],['advancePct',50],['advanceLeadDays',3],['productionDays',10],['reservePct',10]])
       await page.locator(sel+' input[oninput*="'+key+'"]').fill(String(v));
   await choose(sel+' [data-funding-choice="'+finance+'"]');
   if(finance==='credit'){
      await page.locator(sel+' input[oninput*="creditRatePct"]').fill('12');
      await page.locator(sel+' input[oninput*="creditTermMonths"]').fill('6');
   }
   await page.locator(sel+' input[oninput*="updateAggregateMargin"]').fill('30');
   await choose('[data-yn-group="salesVat"][data-yn-value="yes"]');
   const vatNodes = await page.evaluate(()=>Array.from(document.querySelectorAll('#own-sales-vat-pct')).map(el=>({
      outer:el.outerHTML.slice(0,250),
      parent:el.parentElement?.outerHTML.slice(0,260),
      inFrozen:!!el.closest('[data-completed-product-id]'),
      inTaxBlock:!!el.closest('#product-tax-block'),
      inSourceBlock:!!el.closest('#product-source-block'),
      ancestors:Array.from((function*(v){while(v){yield {tag:v.tagName,id:v.id,cl:v.className,completedId:v.dataset?.completedProductId};v=v.parentElement}})(el)).slice(0,9)
   })));
   console.log('VAT_DOM_PROBE',JSON.stringify(vatNodes));
   await page.locator('#product-tax-block #own-sales-vat-pct').fill('12');
   await choose(sel+' [data-pricing-decision="tax"]');
   await choose('[data-business-tax-type="turnover"]');
   await fill('own-business-tax-pct',6);
   await page.locator('[data-tax-price-product-id="2"] [data-discount-choice="yes"]').click();
   await page.locator('[data-tax-price-product-id="2"] input[oninput*="maxDiscountPct"]').fill('20');
   await page.locator('[data-tax-price-product-id="2"] input[oninput*="minimumMarginPct"]').fill('10');
   const after=await page.evaluate(()=>{
      const m=calculateProductPortfolio(),c=calculateProductCashFlow(m);
      return {
        productCount:productPortfolio.length,
        names:productPortfolio.map(x=>x.name),
        materialCosts:productPortfolio.map(x=>x.materialsUnitCost),
        rent:productPortfolio.map(x=>x.inputs['own-production-premises-monthly']),
        salesStaff:productPortfolio.map(x=>x.salesFixedMonthly),
        management:productPortfolio.map(x=>x.adManagement),
        stock:productPortfolio.map(x=>x.logisticsQty),
        forecast:productPortfolio.map(x=>x.forecastUnitsPerMonth),
        businessTaxType:productBusinessTaxType,
        taxPct:document.getElementById('own-business-tax-pct').value,
        vatPct:document.getElementById('own-sales-vat-pct').value,
        model:m,cash:c,
        sourceButtons:Array.from(document.querySelectorAll('.product-source-choice')).map(x=>x.dataset.productSource)
      };
   });
   assert.equal(after.productCount,2);
   assert.equal(after.names[0],before.original,'Original SKU remains');
   assert.equal(after.materialCosts[0],before.firstUnit);
   assert.equal(after.materialCosts[1],150);
   assert.equal(after.rent[0],before.firstRent);
   assert.equal(after.salesStaff[0],1000);
   assert.equal(after.salesStaff[1],0);
   assert.equal(after.businessTaxType,'turnover');
   assert.equal(Number(after.taxPct),6);
   assert.equal(Number(after.vatPct),12);
   assert.ok(after.model.pricingReady);
   assert.equal(after.model.items.length,2);
   const weights=after.model.items.map(x=>x.revenueWeight);
   assert.ok(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-9);
   assert.equal(after.model.sharedBusinessCosts,1000+120+60,'sales staff max not sum; marketer fees sum');
   assert.ok(after.cash.ready);
   events.push({finance,probe:'own-2sku',first:before,after:{
     names:after.names,salesStaff:after.salesStaff,management:after.management,
     revenueWeights:weights,unitCosts:after.model.items.map(x=>x.unitCost),
     prices:after.model.items.map(x=>x.price),
     monthCount:after.cash.months.length,freeCumulative:after.cash.freeCumulativeEnd,
     sumAdBudget:after.model.totalAdBudget,sharedBusinessCosts:after.model.sharedBusinessCosts,
     capital:after.model.items.map(x=>x.id)
   }});
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('PORTFOLIO_CURRENT_STATE_AUDIT_GREEN',JSON.stringify(events));
 }finally{await browser.close()}
})().catch(e=>{console.error('PORTFOLIO_CURRENT_STATE_AUDIT_RED',e.stack||e);process.exitCode=1});
