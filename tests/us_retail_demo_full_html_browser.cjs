const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
 const here=path.resolve(__dirname,'..');
 const standalone=path.join(here,'artifacts/us-retail-demo/US_Retail_Demo_FILLED.html');
 const model=JSON.parse(fs.readFileSync(path.join(here,'docs/demos/us-main-street-12m/model.json'),'utf8'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
   for(const width of [390,1280]){
     const page=await browser.newPage({viewport:{width,height:900},locale:'ru-RU',acceptDownloads:true});
     const errors=[];const external=[];
     page.on('pageerror',e=>errors.push(e.message));
     page.on('request',r=>{if(/^https?:/.test(r.url())){external.push(r.url());r.abort?.();}});
     await page.route(/^https?:\/\//,r=>r.abort());
     await page.goto(pathToFileURL(standalone).href,{waitUntil:'domcontentloaded',timeout:120000});
     await page.waitForFunction(()=>window.PortfolioV2UI?.getState?.()?.skus?.length===10,{timeout:20000});
     const result=await page.evaluate(()=>{
       const state=PortfolioV2UI.getState();
       const out=PortfolioV2Engine.build(state);
       return {count:state.skus.length,costs:state.resources.length,ready:out.ready,months:out.months?.length,
        last:out.months?.at(-1).principalRepayment,principal:out.financing?.principal,
        panelVisible:document.querySelector('#portfolio-v2-screen')?.getBoundingClientRect().width>0,
        hasInputs:document.querySelectorAll('#portfolio-v2-root [data-p2-path]').length,
        totalRevenue:out.months.reduce((n,m)=>n+m.receipt,0),
        standaloneTag:document.querySelector('[data-study-autostart]')!==null,
        missing:performance.getEntriesByType('resource').filter(x=>/\.(?:css|js)$/.test(x.name)).map(x=>x.name)};
     });
     assert.equal(result.count,10);assert.equal(result.costs,14);
     assert.equal(result.ready,true);assert.equal(result.months,12);
     assert.equal(result.last,result.principal);assert.equal(result.panelVisible,true);
     assert.ok(result.hasInputs>100);assert.equal(result.standaloneTag,true);
     assert.equal(result.missing.length,0,'Standalone must have no script or stylesheet file dependency');
     assert.equal(external.length,0,'Standalone should work with all remote calls blocked');
     assert.equal(errors.length,0,JSON.stringify(errors));
     const inRu=await page.evaluate(()=>PortfolioV2UI.getState());
     assert.equal(inRu.skus[0].name,'Подарочный набор ручной работы');
     assert.equal(inRu.resources[0].label,'Аренда торгового помещения');
     await page.screenshot({path:path.join(here,'artifacts/us-retail-demo/US-Retail-V2-'+width+'px.png'),fullPage:true});
     if(width===1280){
       const financial=async()=>page.evaluate(()=>{
         const r=PortfolioV2Engine.build(PortfolioV2UI.getState());
         return [r.totalRevenue,r.finalCash,r.financing.principal,r.months.length].join('|');
       });
       const before=await financial();
       for(const [locale,sku,resource] of [
         ['en','Handmade holiday gift box','Retail storefront lease'],
         ['kk','Қолдан жасалған сыйлық жиынтығы','Дүкен үй-жайын жалға алу']
       ]){
         await page.evaluate(l=>Nomad360UI.setLanguage(l),locale);
         const translated=await page.evaluate(()=>PortfolioV2UI.getState());
         assert.equal(translated.skus[0].name,sku);
         assert.equal(translated.resources[0].label,resource);
         assert.equal(await financial(),before);
         await page.screenshot({path:path.join(here,'artifacts/us-retail-demo/US-Retail-V2-1280px-'+locale+'.png'),fullPage:true});
       }
     }
     if(width===390){
       await page.locator('#portfolio-v2-root [data-p2-path="skus.0.name"]').fill('Review the demo directly');
       assert.equal(await page.evaluate(()=>PortfolioV2UI.getState().skus[0].name),'Review the demo directly');
       await page.locator('#portfolio-v2-root [data-p2-new]').click();
       assert.equal(await page.evaluate(()=>PortfolioV2UI.getState().skus[0].name),'');
     }
     console.log('US_RETAIL_FULL_HTML_GREEN',JSON.stringify({width,...result}));
     await page.close();
   }
   // The English deliverable must itself open on the English interface,
   // not require the reviewer to find and flip a language selector.
   for(const width of [390,1280]){
     const page=await browser.newPage({viewport:{width,height:900},locale:'ru-RU'});
     const errors=[];page.on('pageerror',e=>errors.push(e.message));
     await page.route(/^https?:\\/\\//,r=>r.abort());
     await page.goto(pathToFileURL(path.join(here,'artifacts/us-retail-demo/US_Retail_Demo_EN_FILLED.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
     await page.waitForFunction(()=>window.PortfolioV2UI?.getState?.()?.skus?.length===10);
     const report=await page.evaluate(()=>{
       const s=PortfolioV2UI.getState(),o=PortfolioV2Engine.build(s);
       const host=document.querySelector('#portfolio-v2-root');
       const textWalker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
       const remains=[];let text;
       while((text=textWalker.nextNode())){
         if(!/[А-Яа-яЁё]/.test(text.textContent))continue;
         const el=text.parentElement;
         if(!el||!el.getClientRects().length)continue;
         remains.push(text.textContent.trim().replace(/\\s+/g,' ').slice(0,180));
       }
       return {language:Nomad360UI.getLanguage(),htmlLang:document.documentElement.lang,
         ready:o.ready,skus:s.skus.length,resources:s.resources.length,
         firstSku:s.skus[0].name,firstResource:s.resources[0].label,
         revenue:o.totalRevenue,loan:o.financing.principal,cash:o.finalCash,remains:[...new Set(remains)]};
     });
     assert.equal(report.language,'en');assert.equal(report.ready,true);
     assert.equal(report.skus,10);assert.equal(report.resources,14);
     assert.equal(report.firstSku,'Handmade holiday gift box');
     assert.equal(report.firstResource,'Retail storefront lease');
     assert.equal(report.loan,45232);
     assert.equal(errors.length,0,JSON.stringify(errors));
     console.log('US_RETAIL_EN_VISIBLE_COPY',JSON.stringify({width,remains:report.remains}));
     await page.screenshot({path:path.join(here,'artifacts/us-retail-demo/US-Retail-V2-EN-'+width+'px.png'),fullPage:true});
     await page.close();
     // Second deliverable: the same editable calculation opened directly
     // in the existing EN language, without localization by hand or rewrites.
     const english=await browser.newPage({viewport:{width,height:900},locale:'ru-RU'});
     const enErrors=[],enExternal=[];
     english.on('pageerror',e=>enErrors.push(e.message));
     english.on('request',r=>{if(/^https?:/.test(r.url()))enExternal.push(r.url());});
     await english.route(/^https?:\\/\\//,r=>r.abort());
     await english.goto(pathToFileURL(path.join(here,'artifacts/us-retail-demo/US_Retail_Demo_EN_FILLED.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
     await english.waitForFunction(()=>window.PortfolioV2UI?.getState?.()?.skus?.length===10,{timeout:25000});
     await english.waitForFunction(()=>document.querySelector('#p2-results .nd-v2-financial-grid')!==null,{timeout:25000});
     await english.waitForTimeout(200);
     const en=await english.evaluate(()=>{
       const state=PortfolioV2UI.getState();
       const out=PortfolioV2Engine.build(state);
       const host=document.getElementById('portfolio-v2-root');
       const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
       const untranslated=[];
       while(walker.nextNode()){
         const node=walker.currentNode,parent=node.parentElement;
         const label=node.nodeValue?.trim()||'';
         if(!/[А-Яа-яЁё]/.test(label)||parent?.closest('[data-nomad-no-translate],script,style,textarea,[contenteditable]'))continue;
         untranslated.push(label.slice(0,140));
       }
       return {language:Nomad360UI.getLanguage(),docLang:document.documentElement.lang,
         skus:state.skus.length,resources:state.resources.length,
         first:state.skus[0].name,resource:state.resources[0].label,
         ready:out.ready,months:out.months.length,loan:out.financing.principal,
         free:out.freeCash,revenue:out.totalRevenue,
         formInputs:host.querySelectorAll('[data-p2-path]').length,
         header:host.querySelector('.nd-v2-hero h1')?.innerText||'',
         untranslated:untranslated.slice(0,40),untranslatedCount:untranslated.length,
         numeric:host.querySelector('#p2-results .nd-v2-number-value')?.innerText||''};
     });
     assert.equal(en.language,'en');
     assert.equal(en.docLang,'en');
     assert.equal(en.first,'Handmade holiday gift box');
     assert.equal(en.resource,'Retail storefront lease');
     assert.equal(en.skus,10);assert.equal(en.resources,14);
     assert.equal(en.ready,true);assert.equal(en.months,12);
     assert.equal(en.loan,45232);
     assert.ok(Math.abs(en.free-41301.03315789475)<0.01);
     assert.ok(Math.abs(en.revenue-29790.48245614035)<0.01);
     assert.ok(en.formInputs>100);
     assert.equal(enExternal.length,0);
     assert.equal(enErrors.length,0,JSON.stringify(enErrors));
     await english.screenshot({path:path.join(here,'artifacts/us-retail-demo/US-Retail-V2-EN-'+width+'px.png'),fullPage:true});
     console.log('US_RETAIL_ENGLISH_HTML_GREEN',JSON.stringify({width,...en}));
     await english.close();
   }
 }finally{await browser.close();}
})().catch(e=>{console.error('US_RETAIL_FULL_HTML_RED',e.stack||e);process.exitCode=1});
