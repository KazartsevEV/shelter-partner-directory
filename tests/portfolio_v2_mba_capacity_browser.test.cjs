const {chromium}=require('playwright'),A=require('node:assert/strict');
const path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',x=>errors.push(x.message));
 await page.route(/^https?:\/\//,r=>r.abort());
 const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
 const p={tax:{type:'turnover',pct:0},skus:[
  {id:'a',name:'Store',source:'own',unitCost:20,forecastUnitsPerMonth:10,adBudget:100,
   baseCac:10,priceMin:100,priceMax:500,maxDiscountPct:10,minimumMarginPct:10,
   targetMarginPct:20,salesFixedMonthly:0,adManagement:0,variableSalesPct:0,
   creditServiceMonthly:0,vatPct:0,inventoryQty:15,materialsBatchTotal:300,
   productionTotal:0,reserveAmount:0},
  {id:'s',name:'Manicure',source:'offline-service',unitCost:20,
   serviceMaterialsUnit:12,serviceElectricityUnit:0,serviceFixedMonthly:80,serviceCapacity:30,
   forecastUnitsPerMonth:10,adBudget:100,baseCac:10,priceMin:100,priceMax:500,
   maxDiscountPct:10,minimumMarginPct:10,targetMarginPct:20,salesFixedMonthly:0,
   adManagement:0,variableSalesPct:0,creditServiceMonthly:0,vatPct:0,inventoryQty:0,
   materialsBatchTotal:120,productionTotal:80,reserveAmount:0}]};
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.evaluate(x=>LinkedPortfolioV2UI.importFromV1(x),p);
  await page.locator('[data-linked-add]').click();
  await page.locator('[data-linked-path="resources.0.kind"]').selectOption('workers');
  await page.locator('[data-linked-path="resources.0.allocation"]').selectOption('usage');
  await page.locator('[data-linked-path="resources.0.usageMode"]').selectOption('per-unit');
  await page.locator('[data-linked-path="resources.0.amount"]').fill('100');
  await page.locator('[data-linked-path="resources.0.capacity"]').fill('35');
  await page.locator('[data-linked-path="resources.0.loadPerUnit.a"]').fill('1');
  await page.locator('[data-linked-path="resources.0.loadPerUnit.s"]').fill('2');
  let outcome=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(outcome.ready,true,JSON.stringify(outcome.errors));
  A.ok(Math.abs(outcome.resources[0].projectedLoad-30)<.001);
  await page.locator('[data-basket-action="add"]').click();
  await page.locator('[data-basket-field="mode"]').selectOption('bundle');
  await page.locator('[data-basket-field="attachPct"]').fill('50');
  outcome=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(outcome.ready,false);
  A.match(outcome.errors.join(' '),/Связанные покупки требуют/);
  await page.locator('[data-linked-path="resources.0.capacity"]').fill('40');
  outcome=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(outcome.ready,true,JSON.stringify(outcome.errors));
  A.ok(Math.abs(outcome.resources[0].projectedLoad-40)<.001);
  A.ok(Math.abs(outcome.totals.monthlyResources-100)<.001);
  A.match(await page.locator('#linked-results').textContent(),/Мощность ресурса/);
  await page.locator('[data-linked-save]').click();
  await page.evaluate(()=>window.showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  A.equal(await page.locator('[data-linked-path="resources.0.usageMode"]').inputValue(),'per-unit');
  A.equal(await page.locator('[data-linked-path="resources.0.loadPerUnit.s"]').inputValue(),'2');
  A.deepEqual(errors,[]);
  console.log('MBA_CAPACITY_BROWSER_GREEN',JSON.stringify({load:40,cap:40,resources:100}));
 }finally{await browser.close();}
})().catch(err=>{console.error('MBA_CAPACITY_BROWSER_RED',err.stack||err);process.exitCode=1});
