const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [320,390,768]){
   const page=await browser.newPage({locale:'ru-RU',viewport:{width,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,route=>route.abort());
   await page.goto(url,{waitUntil:'domcontentloaded'});
   A.equal(await page.locator('#business-currency').inputValue(),'USD');
   A.ok(await page.locator('#business-currency-settings').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
   A.match(await page.locator('#business-currency option[value="KZT"]').textContent(),/🇰🇿 KZT/);
   await page.locator('#business-currency').selectOption('KZT');
   await page.locator('#start-own-product').click();
   await page.locator('#product-name-input').fill('USD у.е. — имя моего товара');
   await page.locator('#product-intro-submit-label').click();
   await page.evaluate(()=>selectProductSource('own'));
   await page.locator('[data-material-cost-mode="known"]').click();
   await page.locator('#own-materials-cost').fill('123.45');
   await page.evaluate(()=>saveProductCalculationToBrowser());
   const saved=await page.evaluate(()=>readSavedProductCalculation());
   A.equal(saved.currency,'KZT');A.equal(saved.productPortfolio[0].currency,'KZT');
   for(const language of ['en','kk','ru']){
    await page.locator('#nomad360-lang-select').selectOption(language);
    await page.waitForFunction(lang=>document.documentElement.lang===lang&&Nomad360Currency.get()==='KZT',language);
     A.equal(await page.locator('#nomad360-footer .nomad-unit-note').count(),0,
       'Currency remains in the model and selector, not a redundant Irbis footer label');
    A.equal(await page.locator('#own-materials-cost').inputValue(),'123.45');
    A.equal(await page.locator('#product-name-input').inputValue(),'USD у.е. — имя моего товара');
    A.match(await page.locator('.product-name-live').first().textContent(),/USD у\.е\./);
    A.equal(await page.evaluate(()=>JSON.stringify(readSavedProductCalculation())),JSON.stringify(saved));
    A.match(await page.locator('[data-business-currency-note]').first().textContent(),/KZT/);
   }
   await page.evaluate(()=>showHome());
   await page.locator('#business-currency').selectOption('EUR');
   A.equal(await page.evaluate(()=>Nomad360Currency.get()),'KZT');
   await page.goto(url+'?resume=1',{waitUntil:'domcontentloaded'});
   A.equal(await page.evaluate(()=>Nomad360Currency.get()),'KZT');
   A.equal(await page.locator('#own-materials-cost').inputValue(),'123.45');
   // A validated linked portfolio must carry its own currency into price/PDF.
   await page.evaluate(model=>{
    localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify({...model,version:3,source:'v1-calculated',currency:'EUR'}));
    LinkedPortfolioV2UI.resume();window.print=()=>{};
   },fixture());
   await page.waitForFunction(()=>Nomad360Currency.get()==='EUR');
   const modelBefore=await page.evaluate(()=>JSON.stringify(LinkedPortfolioV2UI.getState()));
   await page.locator('[data-nomad-price-toggle]').click();
   A.match(await page.locator('#nomad360-price-preview').textContent(),/EUR/);
   await page.locator('[data-nomad-export="price"]').click();
   A.match(await page.locator('#nomad360-print-sheet').textContent(),/EUR/);
   await page.locator('#nomad360-lang-select').selectOption('kk');
   A.equal(await page.evaluate(()=>JSON.stringify(LinkedPortfolioV2UI.getState())),modelBefore);
   A.match(await page.locator('#nomad360-print-sheet').textContent(),/EUR/);
   A.deepEqual(errors,[]);
   await page.close();
  }
  console.log('CURRENCY_BROWSER_GREEN');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
