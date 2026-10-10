const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,r=>r.abort());
 const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#start-own-product').click();
  await page.locator('#product-name-input').fill('Майка');
  await page.getByRole('button',{name:'Рассчитать мой товар'}).click();
  await page.locator('[data-product-source="dropship"]').click();
  assert.equal(await page.locator('#resale-buy-panel').isVisible(),true);
  assert.equal((await page.locator('#materials-step-name').textContent()).trim(),'Ассортимент и поставщики');
   assert.equal((await page.locator('#materials-step-help').textContent()).trim(),'С расчётом оборотных средств.');
  for(const id of ['#product-production-block','#production-unit-result','#warehouse-inbound-panel',
    '#warehouse-storage-panel','#purchase-inbound-delivery-panel','#logistics-quantity-panel']){
   assert.equal(await page.locator(id).isVisible(),false,'Unexpected '+id);
  }
  assert.equal(await page.locator('#dropship-delivery-terms').isVisible(),true);
  assert.equal(await page.locator('#own-materials-landed-unit-cost').count(),1);
  await page.locator('#resale-buy-qty').fill('1');
  await page.locator('#resale-buy-total').fill('50');
  await page.locator('#dropship-delivery-days').fill('15');
  await page.locator('[data-logistics-payer-key="customerDelivery"][data-logistics-payer-value="me"]').click();
  await page.locator('#own-customer-delivery-pct').fill('10');
  await page.locator('#own-product-ad-budget').fill('900');
  await page.locator('#own-product-ad-cpc').fill('4.5');
  await page.locator('#own-product-ad-ctr').fill('2');
  await page.locator('#own-product-ad-click-lead').fill('20');
  await page.locator('#own-product-ad-lead-sale').fill('50');
  const vals=await page.evaluate(()=>{
   const item=currentProductPortfolioSnapshot();
   const plan=aggregatePlanMetrics(item);
   return {source:item.source,unit:item.materialsUnitCost,shipping:item.logisticsUnitCost,
     production:item.productionTotal,warehouse:item.warehouseStageTotal,forecast:item.forecastUnitsPerMonth,
     capital:plan.requiredCapital,float:plan.supplierFloat};
  });
  assert.equal(vals.source,'dropship');
  assert.equal(vals.production,0);
  assert.equal(vals.warehouse,0);
  assert.equal(vals.forecast,20);
  assert.equal(vals.unit,50);
  assert.equal(vals.shipping,5);
  assert.ok(vals.capital>900);
  await page.locator('#product-draft-toolbar button').click();
  assert.match(await page.locator('#product-draft-save-status').textContent(),/Сохранено/);
  await page.goto(url+'?resume=1',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#resale-buy-total').inputValue(),'50');
  assert.equal(await page.locator('#dropship-delivery-days').inputValue(),'15');
  assert.equal(await page.locator('#product-production-block').isVisible(),false);
  const persisted=await page.evaluate(()=>productPortfolio.find(x=>x.name==='Майка'));
  assert.equal(persisted.source,'dropship');
  assert.equal(persisted.dropshipDeliveryDays,15);
  assert.deepEqual(errors,[]);
  console.log('DROPSHIP_BROWSER_GREEN',JSON.stringify(vals));
 }finally{await browser.close()}
})().catch(err=>{console.error('DROPSHIP_BROWSER_RED',err.stack||err);process.exitCode=1});
