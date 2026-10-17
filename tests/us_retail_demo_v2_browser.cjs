const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const out=path.join(__dirname,'../artifacts/us-retail-demo');
 fs.mkdirSync(out,{recursive:true});
 const url=pathToFileURL(path.join(__dirname,'../Marketing_calc.HTML')).href+'?demo=us-retail-12m';
 const results=[];
 try{
 for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:900},locale:'ru-RU',acceptDownloads:true});
   await page.route(/^https?:\/\//,r=>r.abort());
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const prior=JSON.stringify({version:2,currency:'EUR',skus:[{id:'own-saved',name:'Keep my private draft'}]});
   await page.addInitScript(value=>{localStorage.setItem('marketingCalcPortfolioV2',value);},prior);
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.PortfolioV2UI?.getState?.()?.skus?.length===10,{timeout:25000});
   const report=await page.evaluate(()=>{
     const state=PortfolioV2UI.getState();
     const out=PortfolioV2Engine.build(state);
     const tax=Nomad360SalesTaxV2.project(out,{mode:'sales_tax',ratePct:6.25});
     return {state,ready:out.ready,months:out.months.length,salesHorizon:out.salesHorizon,
       principal:out.financing.principal,bullet:out.months.at(-1).principalRepayment,
       totalSalesTax:tax.salesTaxSummary.salesTax,
       personal:localStorage.getItem('marketingCalcPortfolioV2'),
       demo:localStorage.getItem('marketingCalcPortfolioV2USRetailDemo'),
       banner:document.querySelector('#us-retail-demo-notice')?.textContent||''};
   });
   assert.equal(report.ready,true);
   assert.equal(report.state.skus.length,10);
   assert.equal(report.state.resources.length,14);
   assert.equal(report.months,12);
   assert.equal(report.salesHorizon,12);
   assert.equal(report.principal,report.bullet);
   assert.equal(report.personal,prior,'Demo must not overwrite an existing personal draft');
   assert.equal(JSON.parse(report.demo).skus.length,10);
   assert.match(report.banner,/Учебный пример магазина США/);
   await page.screenshot({path:path.join(out,'ru-'+width+'-v2-shop.png'),fullPage:true});
   await page.locator('#portfolio-v2-root [data-p2-new]').click();
   const empty=await page.evaluate(()=>({
     mine:localStorage.getItem('marketingCalcPortfolioV2'),
     demo:PortfolioV2UI.getState(),saved:localStorage.getItem('marketingCalcPortfolioV2USRetailDemo')
   }));
   assert.equal(empty.mine,prior);
   assert.equal(empty.demo.skus.length,1);
   assert.equal(empty.demo.skus[0].name,'');
   assert.equal(empty.demo.resources.length,0);
   await page.evaluate(()=>Nomad360UI.setLanguage('en'));
   await page.locator('#portfolio-v2-root [data-p2-home]').click();
   assert.match(await page.locator('#us-retail-demo-launch').innerText(),/US shop study/);
   await page.locator('#us-retail-demo-launch').click();
   assert.equal(await page.evaluate(()=>PortfolioV2UI.getState().skus.length),10);
   results.push({width,tax:report.totalSalesTax,loan:report.principal,restored:true,isolated:true});
   await page.close();
 }
 console.log('US_RETAIL_DEMO_BROWSER_GREEN',JSON.stringify(results));
 }finally{await browser.close();}
})().catch(e=>{console.error('US_RETAIL_DEMO_BROWSER_RED',e.stack||e);process.exit(1);});
