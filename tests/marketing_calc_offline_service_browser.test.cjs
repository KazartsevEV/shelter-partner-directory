const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,r=>r.abort());
 const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#start-service').click();
  assert.equal(await page.locator('#service-work-screen').isVisible(),true);
  assert.equal(await page.locator('#service-screen').isVisible(),false);
  await page.locator('#service-work-online').click();
  assert.equal(await page.locator('#service-screen').isVisible(),true);
  assert.equal(await page.getByRole('button',{name:'Я сам'}).count(),1);
  assert.equal(await page.getByRole('button',{name:'Нанимаю другого'}).count(),1);
  assert.equal(await page.getByRole('button',{name:'Я агент'}).count(),1);
  await page.evaluate(()=>showServiceWorkChooser());
  await page.locator('#service-work-offline').click();
  assert.equal(await page.locator('#product-screen').isVisible(),true);
  assert.equal(await page.locator('#product-intro-title').textContent(),'Какую услугу оказываете?');
  await page.locator('#product-name-input').fill('Маникюр с покрытием');
  await page.locator('#product-intro-submit-label').click();
  assert.equal(await page.locator('#product-source-block').isVisible(),false);
  assert.equal(await page.locator('#product-own-form').isVisible(),true);
  for(const id of ['#product-logistics-block','#logistics-unit-result','#production-defect-panel',
    '#materials-import-prompt','#purchase-inbound-delivery-panel','#materials-qty-entry-panel']){
   assert.equal(await page.locator(id).isVisible(),false,id+' should be excluded');
  }
  for(const id of ['#product-materials-block','#product-production-block','#production-unit-result',
    '#offline-service-capacity','#product-ad-block']){
   assert.equal(await page.locator(id).isVisible(),true,id+' should be available');
  }
  await page.locator('[data-material-cost-mode="known"]').click();
  await page.locator('#own-materials-cost').fill('8');
  await page.locator('[data-yn-group="productionPremises"][data-yn-value="yes"]').click();
  await page.locator('#own-production-premises-monthly').fill('600');
  await page.locator('[data-production-labor-mode="workers"]').click();
  await page.locator('#own-production-workers-count').fill('2');
  await page.locator('#own-production-worker-gross').fill('300');
  await page.locator('#offline-service-monthly-capacity').fill('30');
  await page.locator('#own-product-ad-budget').fill('900');
  await page.locator('#own-product-ad-cpc').fill('4.5');
  await page.locator('#own-product-ad-ctr').fill('2');
  await page.locator('#own-product-ad-click-lead').fill('20');
  await page.locator('#own-product-ad-lead-sale').fill('50');
  const check=await page.evaluate(()=>{
   const item=currentProductPortfolioSnapshot();
   return {source:item.source,capacity:item.offlineServiceCapacity,forecast:item.forecastUnitsPerMonth,
    material:item.materialsUnitCost,consumables:item.materialsBatchTotal,
    fixed:item.productionFixedMonthly,unit:item.productionUnitCost,
    warehouse:item.warehouseStageTotal,issues:aggregateQuantityDetails(item),
    capital:aggregatePlanMetrics(item).requiredCapital};
  });
  assert.equal(check.source,'offline-service');
  assert.equal(check.capacity,30);
  assert.equal(check.forecast,20);
  assert.equal(check.material,8);
  assert.equal(check.consumables,160);
  assert.ok(check.fixed>1200);
  assert.ok(check.unit>60);
  assert.equal(check.warehouse,0);
  assert.deepEqual(check.issues,[]);
  assert.ok(check.capital>2000);
  await page.locator('#offline-service-monthly-capacity').fill('15');
  const invalid=await page.evaluate(()=>aggregateQuantityDetails(currentProductPortfolioSnapshot()));
  assert.ok(invalid.some(x=>x.kind==='service-capacity'));
  await page.locator('#offline-service-monthly-capacity').fill('30');
  await page.locator('#product-draft-toolbar button').click();
  assert.match(await page.locator('#product-draft-save-status').textContent(),/Сохранено/);
  await page.goto(url+'?resume=1',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#product-screen').isVisible(),true);
  assert.equal(await page.locator('#product-intro-title').textContent(),'Какую услугу оказываете?');
  assert.equal(await page.locator('#product-source-block').isVisible(),false);
  assert.equal(await page.locator('#offline-service-monthly-capacity').inputValue(),'30');
  assert.equal(await page.locator('#own-materials-cost').inputValue(),'8');
  assert.equal(await page.locator('#own-production-workers-count').inputValue(),'2');
  assert.equal(await page.locator('#own-production-premises-monthly').inputValue(),'600');
  assert.equal(await page.locator('#product-logistics-block').isVisible(),false);
  assert.equal((await page.evaluate(()=>productPortfolio[0])).source,'offline-service');
  assert.deepEqual(errors,[]);
  console.log('OFFLINE_SERVICE_BROWSER_GREEN',JSON.stringify(check));
 }finally{await browser.close();}
})().catch(e=>{console.error('OFFLINE_SERVICE_BROWSER_RED',e.stack||e);process.exitCode=1});
