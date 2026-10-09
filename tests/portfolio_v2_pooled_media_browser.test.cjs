const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const close=(x,y,label)=>A.ok(Math.abs(x-y)<.01,label+': '+x+' vs '+y);
const sku=(id,stock)=>({
 id,name:id,source:'resale',unitCost:20,forecastUnitsPerMonth:20,
 adBudget:100,baseCac:5,priceMin:30,priceMax:500,maxDiscountPct:0,
 minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:0,
 adManagement:0,variableSalesPct:0,creditServiceMonthly:0,
 creditPrincipal:0,creditMonths:0,vatPct:0,inventoryQty:stock,
 materialsBatchTotal:stock*20,productionTotal:0,reserveAmount:0
});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try{
  await page.goto(pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href,
   {waitUntil:'domcontentloaded'});
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
  let before=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(before.ready,false);
  A.match(before.errors.join(' '),/Подтвердите/);
  await page.locator('[data-linked-path="recurringDemandApproved"]').check();
  let r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  A.deepEqual(r.temporal.months.map(x=>Math.round(x.orders.a)),[20,0,0,0,0]);
  A.deepEqual(r.temporal.months.map(x=>Math.round(x.orders.b)),[20,40,40,0,0]);
  r.temporal.months.forEach((m,i)=>{
   close(m.media.ownerPaid,200,'paid month '+(i+1));
   close(m.media.ownerPaid,m.media.allocated+m.media.unattributed,
    'allocation month '+(i+1));
   close(r.cashflow.months[i].ad,m.media.ownerPaid,'cash month '+(i+1));
  });
  close(r.temporal.months[3].media.unattributed,200,'committed media idle');
  A.match(await page.locator('#linked-results').textContent(),/Нераспределено/);
  A.match(await page.locator('#linked-results').textContent(),/Неисполненный спрос/);
  await page.locator('[data-linked-save]').click();
  await page.locator('[data-linked-back]').click();
  await page.evaluate(()=>showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  r=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(r.ready,true,JSON.stringify(r.errors));
  A.equal(r.temporal.months.length,5);
  close(r.temporal.months[4].media.unattributed,200,'idle survives save/back/resume');
  A.deepEqual(errors,[]);
  console.log('POOLED_MEDIA_31F1_BROWSER_GREEN',JSON.stringify({
   months:5,paid:r.temporal.months.map(x=>x.media.ownerPaid),
   idle:r.temporal.months.map(x=>x.media.unattributed)}));
 }finally{await browser.close()}
})().catch(e=>{console.error('POOLED_MEDIA_31F1_BROWSER_RED',e.stack||e);process.exitCode=1});
