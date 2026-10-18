const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const out=path.join(__dirname,'../artifacts/us-retail-demo');
 fs.mkdirSync(out,{recursive:true});
 const homeUrl=pathToFileURL(path.join(__dirname,'../Marketing_calc.HTML')).href;
 const url=pathToFileURL(path.join(__dirname,'../US_Retail_Demo.HTML')).href+'?demo=us-retail-12m';
 const results=[];
 try{
 for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:900},locale:'ru-RU',acceptDownloads:true});
   await page.route(/^https?:\/\//,r=>r.abort());
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const prior=JSON.stringify({version:2,currency:'EUR',skus:[{id:'own-saved',name:'Keep my private draft'}]});
   await page.addInitScript(value=>{localStorage.setItem('marketingCalcPortfolioV2',value);},prior);
   // Verify the live-calculator entry rather than only loading an isolated URL.
   await page.goto(homeUrl,{waitUntil:'domcontentloaded'});
   await page.locator('#us-retail-v2-live-link').waitFor();
   for(const [locale,label] of [
     ['ru','Пример V2: магазин в США · 12 месяцев'],
     ['en','V2 example: US retail store · 12 months'],
     ['kk','V2 мысалы: АҚШ дүкені · 12 ай']
   ]){
     await page.evaluate(l=>Nomad360UI.setLanguage(l),locale);
     const entry=page.locator('#us-retail-v2-live-link');
     assert.equal(await entry.innerText(),label);
     assert.ok((await entry.getAttribute('href')).endsWith('US_Retail_Demo.HTML?demo=us-retail-12m&lang='+locale));
   }
   await page.evaluate(()=>{
     document.documentElement.setAttribute('data-nomad-embedded','');
     document.dispatchEvent(new Event('nomad360:languagechange'));
   });
   assert.match(await page.locator('#us-retail-v2-live-link').getAttribute('href'),
     /^https:\/\/kazartsevev\.github\.io\/shelter-partner-directory\/US_Retail_Demo\.HTML/);
   await page.evaluate(()=>{
     document.documentElement.removeAttribute('data-nomad-embedded');
     Nomad360UI.setLanguage('ru');
     document.dispatchEvent(new Event('nomad360:languagechange'));
   });
   await page.locator('#us-retail-v2-live-link').click();
   await page.waitForURL(/US_Retail_Demo/);
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
   assert.doesNotMatch(report.banner,/Личный портфель не изменяется|Новый портфель.*очищает поля/);
   const taxCards=page.locator('[data-p2-sales-tax-summary] [data-tax-sku]');
   assert.equal(await taxCards.count(),10,'exactly one reference-month row per projected SKU');
   assert.match(await page.locator('[data-p2-sales-tax-summary]').innerText(),/Базовый месяц/);
   const projectedResourceCount=await page.evaluate(()=>{
    const state=PortfolioV2UI.getState();
    return Nomad360PaymentUI.buildPortfolio(Nomad360SalesTaxV2.prepareStandalone(state,{mode:'sales_tax',ratePct:state.tax.salesTaxPct})).resources.length;
   });
   assert.equal(await page.locator('[data-p2-resource-row]').count(),projectedResourceCount,
    'render exactly the resources the engine projects; campaign expenses remain separate');
   assert.equal((await page.locator('[data-p2-allocated-skus] li').count())>0,true);
   const exportTruth=await page.evaluate(()=>{
    const state=PortfolioV2UI.getState();
    const raw=Nomad360PaymentUI.buildPortfolio(Nomad360SalesTaxV2.prepareStandalone(state,{mode:'sales_tax',ratePct:state.tax.salesTaxPct}));
    const out=Nomad360SalesTaxV2.project(raw,{mode:'sales_tax',ratePct:state.tax.salesTaxPct});
    const xlsx=Nomad360PriceExport.document({state,out,kind:'standalone'},'ru');
    return {tax:out.salesTaxSummary.salesTax,net:out.salesTaxSummary.net,buyer:out.salesTaxSummary.customerTotal,
     taxTable:xlsx.taxTable,notes:xlsx.notes};
   });
   assert.equal(exportTruth.taxTable.rows.length,10);
   assert.ok(Math.abs(exportTruth.tax-exportTruth.taxTable.totals[4])<1e-8);
   assert.ok(Math.abs(exportTruth.net-exportTruth.taxTable.totals[3])<1e-8);
   assert.ok(Math.abs(exportTruth.buyer-exportTruth.taxTable.totals[5])<1e-8);
   assert.ok(exportTruth.notes.every(n=>!/^sku-\\d+.*Sales Tax/.test(n)),'Excel Notes have no unstructured SKU tax ledger');
   assert.equal(report.state.skus[0].name,'Подарочный набор ручной работы');
   assert.equal(report.state.resources[0].label,'Аренда торгового помещения');
   const financialFingerprint=async()=>page.evaluate(()=>{
     const out=PortfolioV2Engine.build(PortfolioV2UI.getState());
     return JSON.stringify({net:out.totalRevenue,cash:out.finalCash,loan:out.financing.principal,months:out.months.length});
   });
   const financialBefore=await financialFingerprint();
   await page.evaluate(()=>Nomad360UI.setLanguage('en'));
   assert.equal(await page.evaluate(()=>PortfolioV2UI.getState().skus[0].name),'Handmade holiday gift box');
   assert.equal(await page.evaluate(()=>PortfolioV2UI.getState().resources[0].label),'Retail storefront lease');
   assert.match(await page.locator('#us-retail-demo-notice').innerText(),/US retail study example/);
   assert.equal(await financialFingerprint(),financialBefore,'EN language switch must not change finance');
   await page.evaluate(()=>Nomad360UI.setLanguage('kk'));
   assert.equal(await page.evaluate(()=>PortfolioV2UI.getState().skus[0].name),'Қолдан жасалған сыйлық жиынтығы');
   assert.equal(await page.evaluate(()=>PortfolioV2UI.getState().resources[0].label),'Дүкен үй-жайын жалға алу');
   assert.match(await page.locator('#us-retail-demo-notice').innerText(),/АҚШ дүкенінің оқу мысалы/);
   assert.equal(await financialFingerprint(),financialBefore,'KK language switch must not change finance');
   await page.locator('[data-p2-path="skus.0.name"]').fill('Reviewer manually renamed');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.PortfolioV2UI?.getState?.()?.skus?.[0]?.name==='Reviewer manually renamed',{timeout:25000});
   assert.equal(await page.evaluate(()=>localStorage.getItem('marketingCalcPortfolioV2')),prior,'Reload must preserve private draft');
   await page.evaluate(()=>Nomad360UI.setLanguage('ru'));
   assert.equal(await page.evaluate(()=>PortfolioV2UI.getState().skus[0].name),'Reviewer manually renamed','Never translate edited personal content');
   assert.equal(await page.evaluate(()=>PortfolioV2UI.getState().skus[1].name),'Именной деревянный сувенир');
   await page.locator('[data-p2-path="skus.0.name"]').fill('Подарочный набор ручной работы');
   assert.equal(await financialFingerprint(),financialBefore,'Returning to RU must preserve values');
   await page.screenshot({path:path.join(out,'ru-'+width+'-v2-shop.png'),fullPage:true});
   // Reload with an edited high-numbered ID to guard against duplicate SKU IDs.
   await page.evaluate(()=>{
     const draft=PortfolioV2UI.getState();
     draft.skus[0].id='sku-124';
     draft.resources.forEach(r=>{r.skuIds=(r.skuIds||[]).map(id=>id==='sku-1'?'sku-124':id)});
     localStorage.setItem('marketingCalcPortfolioV2USRetailDemo',JSON.stringify(draft));
   });
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.PortfolioV2UI?.getState?.()?.skus?.[0]?.id==='sku-124',{timeout:25000});
   await page.locator('#portfolio-v2-root [data-p2-add-sku]').click();
   const ids=await page.evaluate(()=>PortfolioV2UI.getState().skus.map(s=>s.id));
   assert.equal(new Set(ids).size,ids.length,'Resumed study must generate unique SKU IDs');
   await page.locator('#portfolio-v2-root [data-p2-new]').click();
   const empty=await page.evaluate(()=>({
     mine:localStorage.getItem('marketingCalcPortfolioV2'),
     demo:PortfolioV2UI.getState(),saved:localStorage.getItem('marketingCalcPortfolioV2USRetailDemo')
   }));
   assert.equal(empty.mine,prior);
   assert.equal(empty.demo.skus.length,1);
   assert.equal(empty.demo.skus[0].name,'');
   assert.equal(empty.demo.resources.length,0);
   // After an explicit reset, a newly edited one-SKU study must not be lost.
   await page.locator('[data-p2-path="marketing.budget"]').fill('50');
   await page.evaluate(()=>Nomad360UI.setLanguage('en'));
   await page.locator('#portfolio-v2-root [data-p2-home]').click();
   await page.locator('#us-retail-demo-launch').click();
   assert.equal(Number((await page.evaluate(()=>PortfolioV2UI.getState())).marketing.budget),50);
   assert.equal(await page.evaluate(()=>PortfolioV2UI.getState().skus.length),1);
   await page.locator('#portfolio-v2-root [data-p2-new]').click();
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
