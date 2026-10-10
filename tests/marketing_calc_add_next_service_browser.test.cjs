// Real mobile route: add offline service -> save -> home -> next service,
// then a goods SKU. Previously adding next service reset the form in place.
const {chromium}=require('playwright');
const A=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({locale:'ru-RU',viewport:{width:390,height:844}});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route(new RegExp('^https?://'),route=>route.abort());
 const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
 const names=()=>page.evaluate(()=>productPortfolio.map(p=>({id:p.id,name:p.name,source:p.source,cost:p.materialsUnitCost})));
 const saved=()=>page.evaluate(()=>readSavedProductCalculation()?.productPortfolio.map(p=>({id:p.id,name:p.name,source:p.source,cost:p.materialsUnitCost})));
 const enterOffline=async(name,cost)=>{
   await page.locator('#start-service').click();
   await page.locator('#service-work-offline').click();
   await page.locator('#product-name-input').fill(name);
   await page.locator('#product-intro-submit-label').click();
   await page.locator('[data-material-cost-mode="known"]').click();
   await page.locator('#own-materials-cost').fill(String(cost));
 };
 const next=async()=>{
   await page.evaluate(()=>setProductAssortmentChoice('more'));
   const b=page.locator('#add-product-button');
   A.equal(await b.isVisible(),true);
   A.equal(await b.innerText(),'+ Добавить товар или услугу');
   await b.click();
   A.equal(await page.locator('#home-screen').isVisible(),true);
   A.equal(await page.locator('#saved-product-entry').isVisible(),true);
   const landing=await page.evaluate(()=>{
     const node=document.getElementById('nomad360-selling-choice');
     const header=document.getElementById('nomad360-header');
     return {top:node.getBoundingClientRect().top,
       headerHeight:header?.getBoundingClientRect().height||0,
       scrollY:window.scrollY,visible:node.getBoundingClientRect().bottom>0};
   });
   A.ok(landing.scrollY>90,'Append item must scroll past the hero, not return to page top');
   A.ok(landing.top>=0&&landing.top<=landing.headerHeight+40&&landing.visible,
     'The What do you sell decision must be directly visible');
 };
 try{
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await enterOffline('Массаж',8);
   await next();
   A.match(await page.locator('#saved-product-summary').innerText(),/1 услуга/);
   A.deepEqual((await saved()).map(x=>[x.id,x.name,x.source]),[[1,'Массаж','offline-service']]);
   await enterOffline('Маникюр',12);
   A.equal(await page.evaluate(()=>currentProductSequence),2);
   A.equal(await page.evaluate(()=>productPortfolio.length),1);
   await next();
   A.match(await page.locator('#saved-product-summary').innerText(),/2 услуги/);
   A.deepEqual((await saved()).map(x=>[x.id,x.name,x.source]),
     [[1,'Массаж','offline-service'],[2,'Маникюр','offline-service']]);
   // The same "add next" branch can accept a goods product, not only another service.
   await page.locator('#start-own-product').click();
   A.equal(await page.evaluate(()=>currentProductSequence),3);
   A.equal((await names()).length,2);
   await page.locator('#product-name-input').fill('Крем');
   await page.locator('#product-intro-submit-label').click();
   await page.evaluate(()=>selectProductSource('resale'));
   A.equal(await page.evaluate(()=>saveProductCalculationToBrowser()),true);
   A.deepEqual((await saved()).map(x=>[x.id,x.name,x.source]),
     [[1,'Массаж','offline-service'],[2,'Маникюр','offline-service'],[3,'Крем','resale']]);
   await next(); // The exact same CTA also routes from a finished goods form.
   A.deepEqual((await saved()).map(x=>[x.id,x.name,x.source]),
     [[1,'Массаж','offline-service'],[2,'Маникюр','offline-service'],[3,'Крем','resale']]);
   await page.goto(url+'?resume=1',{waitUntil:'domcontentloaded'});
   A.deepEqual((await names()).map(x=>[x.id,x.name,x.source]),
     [[1,'Массаж','offline-service'],[2,'Маникюр','offline-service'],[3,'Крем','resale']]);
   await page.evaluate(()=>editSavedProduct(1));
   A.equal(await page.locator('#own-materials-cost').inputValue(),'8');
   await page.evaluate(()=>editSavedProduct(2));
   A.equal(await page.locator('#own-materials-cost').inputValue(),'12');
   A.deepEqual(errors,[]);
   console.log('NEXT_SERVICE_ROUTING_BROWSER_GREEN',{names:await names()});
 }finally{await browser.close()}
})().catch(e=>{console.error('NEXT_SERVICE_ROUTING_BROWSER_RED',e.stack||e);process.exitCode=1});
