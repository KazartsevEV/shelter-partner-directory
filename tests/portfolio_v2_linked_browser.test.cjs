const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
 const payload={tax:{type:'turnover',pct:3},skus:[
 {id:'v1-1',name:'Товары А',source:'own',unitCost:30,forecastUnitsPerMonth:25,adBudget:250,baseCac:10,
 priceMin:90,priceMax:180,maxDiscountPct:20,minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:200,
 adManagement:100,variableSalesPct:5,creditServiceMonthly:0,vatPct:0,inventoryQty:25,materialsBatchTotal:500,
 productionTotal:125,reserveAmount:100},
 {id:'v1-2',name:'Товары Б',source:'dropship',unitCost:20,forecastUnitsPerMonth:20,adBudget:200,baseCac:10,
 priceMin:80,priceMax:170,maxDiscountPct:15,minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:200,
 adManagement:100,variableSalesPct:3,creditServiceMonthly:0,vatPct:0,inventoryQty:0,
 dropshipDeliveryDays:12,dropshipPayoutLagDays:5,dropshipPayoutMode:'after',reserveAmount:80}]};
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const modules=await page.evaluate(()=>({linked:!!window.LinkedPortfolioV2UI,engine:!!window.LinkedPortfolioV2Engine}));
  assert.equal(modules.linked,true);assert.equal(modules.engine,true);
  await page.evaluate(payload=>window.LinkedPortfolioV2UI.importFromV1(payload),payload);
  assert.equal(await page.locator('#portfolio-v2-screen').isVisible(),true);
  assert.equal(await page.locator('[data-linked-sku]').count(),2);
  assert.equal(await page.locator('[data-linked-path*="priceSelected"]').count(),0);
  assert.equal(await page.locator('[data-linked-price-list]').count(),2);
  assert.equal(await page.locator('#linked-results').getByText('Конечные цены покупателей').count(),1);
  assert.equal(await page.locator('#linked-results').getByText('Стартовый капитал и Cash flow').count(),1);
  let current=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  assert.equal(current.ready,true,JSON.stringify(current.errors));
  assert.ok(current.items.every(s=>s.priceList>=s.priceMin&&s.priceList<=s.priceMax));
  assert.ok(current.cashflow.ownerCapital>current.cashflow.reserve);
  const oldProfit=current.totals.netProfit;
  await page.locator('[data-linked-add]').click();
  await page.locator('[data-linked-path="resources.0.kind"]').selectOption('salesStaff');
  await page.locator('[data-linked-path="resources.0.pool"]').selectOption('salesFixed');
  await page.locator('[data-linked-path="resources.0.amount"]').fill('200');
  await page.locator('[data-linked-path="resources.0.includedBySku.v1-1"]').fill('200');
  await page.locator('[data-linked-path="resources.0.includedBySku.v1-2"]').fill('200');
  current=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  assert.equal(current.ready,true,JSON.stringify(current.errors));
  assert.ok(Math.abs(current.totals.netProfit-oldProfit-200)<1e-6);
  assert.ok(current.invariants.resourcesConserved);
  await page.locator('[data-linked-path="skus.0.discountSelected"]').fill('15');
  current=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  assert.equal(current.ready,true,JSON.stringify(current.errors));
  assert.ok(Math.abs(current.items[0].priceGross-current.items[0].priceList*.85)<1e-7);
  await page.locator('[data-linked-back]').click();
  await page.evaluate(()=>window.showHome());
  assert.equal(await page.locator('#portfolio-v2-linked-resume-home').isVisible(),true);
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  assert.equal(await page.locator('[data-linked-sku]').count(),2);
  assert.equal(await page.locator('[data-linked-resource]').count(),1);
  assert.equal(await page.locator('[data-linked-path="skus.0.discountSelected"]').inputValue(),'15');
  assert.equal(await page.locator('#linked-basket-panel').count(),1);
  await page.locator('[data-basket-action="add"]').click();
  assert.equal(await page.locator('[data-basket-offer]').count(),1);
  await page.locator('[data-basket-field="attachPct"]').fill('20');
  let basketState=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  assert.equal(basketState.offers.length,1);
  assert.equal(Number(basketState.offers[0].attachPct),20);
  let basket=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  assert.equal(basket.ready,true,JSON.stringify(basket.errors));
  assert.equal(basket.basket.events[0].mode,'cross_sell');
  assert.ok(basket.basket.orders['v1-2']>basket.basket.baseOrders['v1-2']);
  // Reimporting V1 with an additional item retains linked offers and shared expenses.
  const expanded={...payload,skus:[...payload.skus,
    {...payload.skus[1],id:'v1-3',name:'Товар В'}]};
  await page.evaluate(next=>LinkedPortfolioV2UI.importFromV1(next),expanded);
  const afterExpansion=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  assert.equal(afterExpansion.skus.length,3);
  assert.equal(afterExpansion.offers.length,1);
  assert.equal(afterExpansion.resources.length,1);
  assert.deepEqual(afterExpansion.resources[0].skuIds,['v1-1','v1-2']);
  assert.equal(await page.locator('[data-linked-sku]').count(),3);
  assert.equal(await page.locator('[data-basket-offer]').count(),1);
  await page.locator('[data-linked-save]').click();
  await page.locator('[data-linked-back]').click();
  await page.evaluate(()=>showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  assert.equal(await page.locator('[data-basket-offer]').count(),1,'offer survives navigation');
  await page.locator('[data-basket-action="remove"]').click();
  assert.equal(await page.locator('[data-basket-offer]').count(),0);
  await page.goto(url+'?demo=shopper&finance=cash',{waitUntil:'domcontentloaded'});
  await page.locator('#product-demo-banner').waitFor({state:'visible'});
  const imported=await page.evaluate(()=>openLinkedPortfolioFromProducts());
  assert.equal(imported,true,'Completed V1 demo must transfer exact computed SKU');
  const transfer=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  assert.equal(transfer.skus.length,1);
  assert.ok(transfer.skus[0].priceMax>transfer.skus[0].priceMin);
  assert.ok(transfer.skus[0].baseCac>0);
  assert.equal(transfer.tax.type,'turnover');
  assert.deepEqual(errors,[]);
  console.log('LINKED_V2_BROWSER_GREEN',JSON.stringify({skus:2,profit:current.totals.netProfit,
   price:current.items[0].priceList,paid:current.items[0].priceGross,capital:current.cashflow.startupCapital}));
 }finally{await browser.close()}
})().catch(e=>{console.error('LINKED_V2_BROWSER_RED',e.stack||e);process.exitCode=1});
