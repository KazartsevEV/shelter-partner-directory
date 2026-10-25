'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),T=require('../nomad360_draft_transfer.js');
const fixtures=require('./fixtures/v1-engine/accepted-main.json'),vat=require('./fixtures/sales-tax-7b/vat-inputs.json');
const siteRoot=path.resolve(process.env.DRAFT_SITE_ROOT||root);
const out=path.join(root,'artifacts/draft-transfer');fs.mkdirSync(out,{recursive:true});
const css=path.join(out,'utilities.css');
const us=JSON.parse(fs.readFileSync(path.join(root,'docs/demos/us-main-street-12m/model.json'),'utf8'));
function server(){return http.createServer((req,res)=>{
 const url=new URL(req.url,'http://local');let name=decodeURIComponent(url.pathname).replace(/^\/shelter-partner-directory(?=\/)/,'');if(name.endsWith('/'))name+='index.html';
 const file=path.resolve(siteRoot,'.'+name);
 if(!file.startsWith(siteRoot+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
})}
(async()=>{
 const old=server(),fresh=server();await Promise.all([old,fresh].map(s=>new Promise(ok=>s.listen(0,'127.0.0.1',ok))));
 const oldOrigin='http://127.0.0.1:'+old.address().port,newOrigin='http://127.0.0.1:'+fresh.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),cases=[],badRequests=[];
 try{
  const widths=(process.env.DRAFT_WIDTHS||'320,360,390,430,768,1280').split(',').map(Number);
  const langs=(process.env.DRAFT_LANGS||'en,ru,kk').split(',');
  for(const width of widths)for(const language of langs){
   const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await context.route('**/*',r=>{
    const req=r.request(),url=req.url();
    if(req.method()!=='GET'){badRequests.push({method:req.method()});return r.abort();}
    if(url.startsWith(oldOrigin+'/')||url.startsWith(newOrigin+'/'))return r.continue();
    if(['script','stylesheet','font','image'].includes(req.resourceType()))return r.abort();
    if(req.frame().url().includes('/drafts/'))badRequests.push({type:req.resourceType()});return r.abort();
   });
   const selected=['own','resale','dropship','service-simple','service-full','service-agent','service-online'];
   const name=selected[cases.length%selected.length]+'-turnover-credit';
   const fixture=fixtures.scenarios.find(x=>x.name===name);
   const entry=cases.length%2?'US_Retail_Demo.HTML':'Marketing_calc.HTML';
   const shopper=name.startsWith('own-');
   await page.goto(oldOrigin+'/'+entry+'?lang='+language+(shopper?'&demo=shopper&finance=credit':''),{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});
   if(shopper){await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');await page.evaluate(()=>{const url=new URL(location.href);url.searchParams.delete('demo');history.replaceState(null,'',url)})}
   const before=await page.evaluate(({fixture,vat,us})=>{
    const f=fixture.input,item=JSON.parse(JSON.stringify(f.portfolio[0]));item.id=1;
    const payload={currency:'USD',activeProductId:1,productPortfolio:[item],taxType:f.businessTaxType,businessTaxPct:f.businessTaxPct,salesVat:f.salesVatChoice,salesVatPct:f.salesVatPct};
    if(!fixture.name.startsWith('own-')){Nomad360DraftStore.writeV1(payload);if(!resumeSavedProductCalculation())throw Error('V1 resume failed');addMaterialRow();addEquipmentRentalRow();addEquipmentPurchaseRow();}
    const material=document.querySelector('#own-material-rows .material-cost-name');if(material)material.value='Ткань Қап Cotton';
    if(!saveProductCalculationToBrowser())throw Error('V1 save failed');
    const standalone=vat.cases.find(x=>x.kind==='standalone'&&x.id.endsWith('profit-vat12-credit-3')).input;
    const linked=vat.cases.find(x=>x.kind==='linked'&&x.id.endsWith('profit-vat12-credit-3')).input;
    const foreign=standalone.skus.find(s=>s.source==='resale');foreign.payments={unitCost:Nomad360Payments.apply(foreign.unitCost,'CNY',standalone.currency,Nomad360Currency.valid,{rate:70,date:'2026-01-02',source:'manual',sourceLabel:'Scenario bank quote'})};
    localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(standalone));
    localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify(linked));
    localStorage.setItem('marketingCalcPortfolioV2USRetailDemo',JSON.stringify(us));
    localStorage.setItem('marketingCalcPortfolioV2USRetailReset','1');
    localStorage.setItem('nomad360SalesTaxSimpleV1',JSON.stringify({mode:'sales_tax',rate:'8.2500'}));
    localStorage.setItem('nomad360-full-service-v2',JSON.stringify({schema:2,currency:'USD',input:{months:2,monthlyForecast:[10,8],capacity:20,priceGross:112,vatPct:12,discountPct:0,taxType:'profit',taxPct:15,unitCashCost:20,commissionPct:3,fixedCashMonthly:50,equipmentPurchase:500,equipmentAmortMonthly:10,reservePct:10,funding:'credit',annualRatePct:12,creditMonths:3},source:{kind:'offline',name:'Saved service'}}));
    localStorage.setItem('partnerEmail','NEVER_TRANSFER_CONTACT');
    localStorage.setItem('unrelated-key','KEEP_OUT');
    const p=calculateProductPortfolio(),cash=calculateProductCashFlow(p);Nomad360FullServiceUI.openSaved();const service=Nomad360FullServiceUI.getResult();
    return {v1:p,cash,standalone:Nomad360PaymentUI.buildPortfolio(standalone),linked:LinkedPortfolioV2Engine.build(linked),us:PortfolioV2Engine.build(us),service};
   },{fixture,vat,us});
   if(shopper)A.equal(before.cash.ready,true,'Real shopper must stay calculable');
   A.equal(before.standalone.ready,true);A.equal(before.linked.ready,true);A.equal(before.us.ready,true);A.equal(before.service.ready,true);
   if(width===widths[0]){
    await page.goto(oldOrigin+'/shelter-partner-directory/'+language+'/help/');
    await page.locator('a[href="../../drafts/?lang='+language+'"]').click();
   }else await page.goto(oldOrigin+'/drafts/?lang='+language);
   await page.waitForFunction(()=>window.Nomad360DraftMarkup);
   const validation=await page.evaluate(()=>{
    try{return {text:Nomad360DraftTransfer.exportFile(localStorage,Nomad360DraftMarkup.validate)}}
    catch(error){return {error:error.code,html:JSON.parse(localStorage.getItem('marketingCalcProductResultV1')).productPortfolio[0].uiState?.dynamic}}
   });
   A.equal(validation.error,undefined,JSON.stringify(validation));
   A.doesNotMatch(validation.text,/NEVER_TRANSFER_CONTACT|KEEP_OUT|unrelated-key|partnerEmail/);
   const downloadPromise=page.waitForEvent('download');await page.locator('#draft-export').click();const download=await downloadPromise;
   const filename=path.join(out,language+'-'+width+'.json');await download.saveAs(filename);A.deepEqual(JSON.parse(fs.readFileSync(filename,'utf8')).records,JSON.parse(validation.text).records);
   await page.goto(newOrigin+'/drafts/?lang='+language);A.equal(await page.evaluate(()=>localStorage.length),0,'Different origin must not inherit storage');
   if(cases.length===0){const chooser=page.waitForEvent('filechooser');await page.locator('#draft-choose').click();await(await chooser).setFiles(filename)}else await page.locator('#draft-file').setInputFiles(filename);
   await page.waitForFunction(()=>!document.getElementById('draft-import').disabled);
   A.equal(await page.locator('#draft-preview li').count(),7);await page.locator('#draft-import').click();await page.waitForFunction(()=>document.getElementById('draft-import-status').dataset.state==='loaded');
   const loaded=await page.evaluate(()=>Nomad360DraftTransfer.snapshot(localStorage));const file=JSON.parse(validation.text);
   for(const row of file.records)A.equal(loaded[row.key],row.value,'Raw bytes must survive origin transfer');
   await page.evaluate(()=>document.fonts.ready);A.equal(await page.evaluate(()=>document.documentElement.lang),language);
   A.equal(await page.locator('h1').textContent(),{en:'Transfer saved calculations',ru:'Перенести сохранённые расчёты',kk:'Сақталған есептерді тасымалдау'}[language]);
   A.equal(await page.locator('[data-copy]').evaluateAll(nodes=>nodes.some(n=>n.textContent==='undefined')),false);
   A.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   A.equal(await page.evaluate(()=>getComputedStyle(document.body).fontFamily.includes('Inter')&&[...document.fonts].some(font=>font.family.replaceAll('\"','').replaceAll("'",'')==='Inter'&&font.status==='loaded')),true);
   if([320,1280].includes(width))await page.screenshot({path:path.join(out,language+'-'+width+'.png'),fullPage:true});
   await page.goto(newOrigin+'/'+entry+'?lang='+language);await page.addStyleTag({path:css});
   const after=await page.evaluate(()=>{
    if(!resumeSavedProductCalculation())throw Error('V1 restore failed');
    const p=calculateProductPortfolio(),cash=calculateProductCashFlow(p);
    const standalone=JSON.parse(localStorage.getItem('marketingCalcPortfolioV2')),linked=JSON.parse(localStorage.getItem('marketingCalcLinkedPortfolioV2'));
    PortfolioV2UI.open({resume:true});const s=Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState());
    LinkedPortfolioV2UI.resume();const l=LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState());
    Nomad360FullServiceUI.openSaved();const service=Nomad360FullServiceUI.getResult();
    return {v1:p,cash,standalone:s,linked:l,us:PortfolioV2Engine.build(JSON.parse(localStorage.getItem('marketingCalcPortfolioV2USRetailDemo'))),service};
   });
   A.deepEqual(after,before,'All restored numerical results must be identical');
   // Preview a conflicting file: replacing requires both a backup and permission.
   await page.goto(newOrigin+'/drafts/?lang='+language);
   const conflict=JSON.parse(validation.text);const v=JSON.parse(conflict.records[0].value);v.currency='EUR';conflict.records[0].value=JSON.stringify(v);
   await page.locator('#draft-file').setInputFiles({name:'different.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(conflict))});
   await page.waitForFunction(()=>!document.getElementById('draft-replace-label').hidden);await page.locator('#draft-replace').check();A.equal(await page.locator('#draft-import').isDisabled(),true);
   const backupPromise=page.waitForEvent('download');await page.locator('#draft-export').click();await backupPromise;A.equal(await page.locator('#draft-import').isDisabled(),false);
   // Do not replace the valid fixture; verify rejection instead.
   const malicious=JSON.parse(validation.text);const bad=JSON.parse(malicious.records[0].value);bad.productPortfolio[0].uiState={dynamic:{materials:{html:'<img src=x onerror="window.BAD_TRANSFER=1">',fields:[]}}};malicious.records[0].value=JSON.stringify(bad);
   await page.locator('#draft-file').setInputFiles({name:'unsafe.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(malicious))});
   await page.waitForFunction(()=>document.getElementById('draft-import-status').textContent.length>0);
   A.equal(await page.locator('#draft-import').isDisabled(),true);A.equal(await page.evaluate(()=>window.BAD_TRANSFER),undefined);
   const attacks=['<svg onload="alert(1)"></svg>','<script>alert(1)</script>','<iframe src="https://example.invalid"></iframe>','<input oninput="updateCalculatedMaterialsCost();alert(1)">','<button onclick="removeEquipmentRow(this, String(alert(1)))">x</button>','<div style="background:url(https://example.invalid)">x</div>','<input formaction="https://example.invalid">','<input value="java&#x73;cript:alert(1)">','<div id="product-name-input">x</div>','<math><mtext>x</mtext></math>','<div data-original="&lt;img src=x onerror=alert(1)&gt;">x</div>'];
   A.deepEqual(await page.evaluate(attacks=>attacks.map(html=>Nomad360DraftMarkup.validate(html)),attacks),attacks.map(()=>false));
   const same=await page.evaluate(()=>Nomad360DraftTransfer.snapshot(localStorage));for(const row of file.records)A.equal(same[row.key],row.value);
   if(cases.length===0){
    // Actual next-page recovery after an interrupted write.
    await page.evaluate(({key,before})=>{
     const after=JSON.stringify({...JSON.parse(before),currency:'EUR'});
     localStorage.setItem(Nomad360DraftTransfer.journalKey,JSON.stringify([{key,before,after}]));localStorage.setItem(key,after);
    },{key:file.records[0].key,before:file.records[0].value});
    await page.reload();await page.waitForFunction(()=>document.getElementById('draft-import-status').dataset.state==='recovered');
    A.equal(await page.evaluate(key=>localStorage.getItem(key),file.records[0].key),file.records[0].value);
    // Another real tab invalidates the preview rather than overwriting its edit.
    await page.locator('#draft-file').setInputFiles(filename);await page.waitForFunction(()=>!document.getElementById('draft-import').disabled);
    const other=await context.newPage();await other.goto(newOrigin+'/drafts/?lang='+language);
    await other.evaluate(key=>localStorage.setItem(key,JSON.stringify({...JSON.parse(localStorage.getItem(key)),currency:'EUR'})),file.records[0].key);
    await page.waitForFunction(()=>document.getElementById('draft-import-status').dataset.state==='concurrent');
    A.equal(await page.locator('#draft-import').isDisabled(),true);await other.close();
   }
   A.deepEqual(errors,[]);cases.push({language,width,entry,scenario:shopper?'actual-shopper-credit':name,records:7,v1CashReady:before.cash.ready===true,foreignFxPreserved:true,numericParity:true,conflictBlocked:true,markupRejected:true});
   console.log('DRAFT_TRANSFER_CASE_GREEN',language,width,name);await context.close();
  }
  A.deepEqual(badRequests,[]);fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({cases,originsDistinct:true,noProviderWrites:true},null,2));
  console.log('DRAFT_TRANSFER_BROWSER_GREEN',JSON.stringify({cases:cases.length,records:cases.length*7,numericParity:true,originsDistinct:true}));
 }finally{await browser.close();await Promise.all([old,fresh].map(s=>new Promise(ok=>s.close(ok))));}
})().catch(error=>{console.error(error);process.exitCode=1});
