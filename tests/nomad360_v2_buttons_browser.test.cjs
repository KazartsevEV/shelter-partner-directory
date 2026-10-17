'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const arg=(key,fallback)=>process.argv.find(v=>v.startsWith('--'+key+'='))?.split('=').slice(1).join('=')||fallback;
const root=path.resolve(__dirname,'..'),baseline=path.resolve(arg('baseline','/tmp/nomad-v2-baseline'));
const artifacts=path.resolve(arg('artifacts','artifacts/v2-buttons'));
const utilities=path.resolve(arg('utilities','artifacts/v2-utilities.css'));
const fixtures=JSON.parse(fs.readFileSync('artifacts/v2-containers/after/receipts.json','utf8'));
async function business(page,route){return page.evaluate(route=>{
 const ui=route==='standalone'?PortfolioV2UI:LinkedPortfolioV2UI,engine=route==='standalone'?PortfolioV2Engine:LinkedPortfolioV2Engine;
 const state=ui.getState();return {state,finance:engine.build(state)};
},route);}
async function seed(page,route,state){
 await page.evaluate(({route,state})=>{
  localStorage.setItem(route==='standalone'?'marketingCalcPortfolioV2':'marketingCalcLinkedPortfolioV2',JSON.stringify(state));
  if(route==='standalone')PortfolioV2UI.open({resume:true});else LinkedPortfolioV2UI.resume();
 },{route,state});await page.waitForTimeout(60);
}
async function styles(page,selector){return page.locator(selector).first().evaluate(el=>{
 const s=getComputedStyle(el);return {background:s.backgroundColor,color:s.color,outline:s.outlineColor,
  outlineWidth:s.outlineWidth,shadow:s.boxShadow,focus:el.matches(':focus-visible'),disabled:el.disabled,
  contrast:NomadContrast.painted(el).ratio};
});}
async function states(page,route,language,receipts){
 const state=await business(page,route),save=route==='standalone'?'[data-p2-save]':'[data-linked-save]';
 const add=route==='standalone'?'[data-p2-add-sku]':'[data-linked-add]';
 const back=route==='standalone'?'[data-p2-home]':'[data-linked-back]';
 for(const width of [320,360,390,430,768,1280]){
  await page.setViewportSize({width,height:900});await page.mouse.move(0,0);
  await page.waitForTimeout(200); // settle the previous hover before a normal-state audit
  A.deepEqual((await page.evaluate(()=>NomadButtons.audit(document.getElementById('portfolio-v2-root')))).failures,[]);
  const output={};
  for(const [name,selector,hover,active,color] of [
   ['primary',save,'rgb(255, 145, 63)','rgb(255, 145, 63)','rgb(23, 59, 88)'],
   ['secondary',add,'rgb(23, 59, 88)','rgb(23, 59, 88)','rgb(255, 255, 255)'],
   ['outline',back,'rgb(23, 59, 88)','rgb(23, 59, 88)','rgb(255, 255, 255)']]){
   const el=page.locator(selector).first();await el.hover();await page.waitForTimeout(180);
   const h=await styles(page,selector);A.equal(h.background,hover,name+' hover '+width);A.equal(h.color,color);A.ok(h.contrast>=4.5);
   await page.mouse.down();await page.waitForTimeout(180);
   const a=await styles(page,selector);A.equal(a.background,active,name+' active '+width);A.ok(a.contrast>=4.5);
   await page.mouse.move(0,0);await page.mouse.up();
   await page.keyboard.press('Tab');await el.focus();
   const f=await styles(page,selector);A.ok(f.focus);A.equal(f.outline,'rgb(23, 59, 88)');A.equal(f.outlineWidth,'3px');A.match(f.shadow,/rgb\(255, 255, 255\)/);
   output[name]={hover:h,active:a,focus:f};
   if([320,1280].includes(width)&&name==='primary')await page.screenshot({path:path.join(artifacts,route+'-'+language+'-'+width+'-focus.png')});
  }
  if(route==='linked'){
   const pseudo=await page.locator('[data-mba-file]').evaluate(el=>{
    const s=getComputedStyle(el,'::file-selector-button');return {background:s.backgroundColor,color:s.color};
   });A.deepEqual(pseudo,{background:'rgb(56, 103, 139)',color:'rgb(255, 255, 255)'});output.fileButton=pseudo;
  }
  receipts[route+'-'+language+'-'+width+'-states']=output;
 }
 A.deepEqual(await business(page,route),state,'hover, press and focus do not change business data');
 await page.setViewportSize({width:390,height:900});await page.mouse.move(0,0);
}
async function interactions(page,route,state,language,version,receipts){
 const trace=[],record=async action=>trace.push({action,...await business(page,route)});
 const press=async(selector,key)=>{await page.locator(selector).last().focus();await page.keyboard.press(key);await page.waitForTimeout(40);};
 await record('initial');
 await press(route==='standalone'?'[data-p2-save]':'[data-linked-save]','Enter');await record('save with Enter');
 if(route==='standalone'){
  await press('[data-p2-add-sku]','Enter');A.equal((await business(page,route)).state.skus.length,state.skus.length+1);await record('add SKU');
  await page.locator('[data-p2-remove-sku]').last().click();A.equal((await business(page,route)).state.skus.length,state.skus.length);await record('remove SKU');
  await page.locator('[data-p2-add-resource="website"]').click();A.equal((await business(page,route)).state.resources.length,state.resources.length+1);await record('add resource');
  await press('[data-p2-delete-resource]','Space');A.equal((await business(page,route)).state.resources.length,state.resources.length);await record('remove resource with Space');
  await page.locator('[data-p2-new]').click();const empty=(await business(page,route)).state;
  A.equal(empty.skus.length,1);A.equal(empty.resources.length,0);A.equal(empty.marketing.budget,'');await record('new portfolio');
  await seed(page,route,state);await page.locator('[data-p2-save]').click();
  await page.locator('[data-p2-home]').click();A.equal(await page.locator('#portfolio-v2-screen').isVisible(),false);
  await page.evaluate(()=>PortfolioV2UI.open({resume:true}));await record('home and resume');
 }else{
  const exportState=await business(page,route);
  await page.locator('#nomad360-portfolio-tools').screenshot({path:path.join(artifacts,version+'-linked-'+language+'-390-export.png')});
  await page.locator('[data-nomad-price-toggle]').click();
  A.equal(await page.locator('#nomad360-price-preview').isVisible(),true);
  await page.locator('#nomad360-portfolio-tools').screenshot({path:path.join(artifacts,version+'-linked-'+language+'-390-price.png')});
  await page.mouse.move(0,0);await page.waitForTimeout(200);
  if(version==='after')A.deepEqual((await page.evaluate(()=>NomadButtons.audit(document.getElementById('portfolio-v2-root')))).failures,[],'opened preview actions');
  await page.evaluate(()=>{window.__buttonPrintCalls=0;window.print=()=>window.__buttonPrintCalls++;});
  for(const mode of ['price','report']){
   await page.locator('[data-nomad-export=\"'+mode+'\"]').click();
   const sheet=await page.locator('#nomad360-print-sheet').evaluate(el=>({mode:el.dataset.mode,html:el.innerHTML}));
   A.equal(sheet.mode,mode);A.ok(sheet.html.length>100);trace.push({action:'print '+mode,...sheet});
  }
  A.equal(await page.evaluate(()=>window.__buttonPrintCalls),2);
  await page.locator('[data-nomad-hide-price]').click();A.equal(await page.locator('#nomad360-price-preview').isVisible(),false);
  A.deepEqual(await business(page,route),exportState,'existing price/PDF controls do not change the business model');await record('price preview and PDF');
  await press('[data-linked-add]','Enter');A.equal((await business(page,route)).state.resources.length,state.resources.length+1);await record('add resource');
  await page.locator('[data-linked-delete]').last().click();A.equal((await business(page,route)).state.resources.length,state.resources.length);await record('remove resource');
  await page.locator('[data-basket-action="add"]').click();await record('add offer');
  const index=(await business(page,route)).state.offers.length-1;
  await page.locator('[data-basket-action="add-item"][data-i="'+index+'"]').click();await record('add offer item');
  await page.locator('[data-basket-action="remove-item"][data-i="'+index+'"]').last().click();await record('remove offer item');
  await page.locator('[data-basket-action="remove"][data-i="'+index+'"]').click();await record('remove offer');
  await page.locator('[data-linked-delete-sku]').last().click();A.equal((await business(page,route)).state.skus.length,state.skus.length-1);await record('remove linked SKU');
  const history=JSON.parse(JSON.stringify(fixtures['linked-history-'+language+'-390'].state));history.offers=[];
  await seed(page,route,history);
  for(const format of ['csv','json']){
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-mba-download="'+format+'"]').click()]);
   const stream=await download.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);
   const text=Buffer.concat(chunks).toString('utf8');A.ok(text.length>100);A.match(download.suggestedFilename(),new RegExp('\\.'+format+'$'));
   if(format==='json')A.equal(JSON.parse(text).orders.length,3);
   trace.push({action:'download '+format,filename:download.suggestedFilename(),content:text});
  }
  const beforeApproval=await business(page,route);
  await page.locator('[data-mba-transfer]').first().scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(artifacts,version+'-linked-'+language+'-390-approval.png')});
  await page.locator('[data-mba-transfer]').first().click();A.deepEqual(await business(page,route),beforeApproval,'overlap remains required');
  if(version==='after')A.ok(await page.locator('[data-mba-message]').evaluate(el=>NomadContrast.painted(el).ratio>=4.5),'approval refusal is readable');
  await page.locator('[data-mba-overlap]').first().fill('20');await page.locator('[data-mba-transfer]').first().click();
  const approved=await business(page,route);A.equal(approved.state.offers.length,1);A.equal(approved.state.offers[0].overlapPct,20);await record('approve observed forecast');
  await page.locator('[data-mba-clear]').click();A.equal((await business(page,route)).state.mbaHistory,null);await record('clear history');
  await page.locator('[data-mba-file]').setInputFiles({name:'orders.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify([
   {order_id:'test',sku_id:history.skus[0].id,date:'2026-09-01',quantity:1,unit_price:100,currency:'USD',channel:'web',status:'completed'}]))});
  await page.locator('[data-mba-clear]').waitFor();A.equal((await business(page,route)).state.mbaHistory.source.rawLines,1);await record('upload history');
  await page.locator('[data-linked-save]').click();await page.locator('[data-linked-back]').click();A.equal(await page.locator('#portfolio-v2-screen').isVisible(),false);
  await page.evaluate(()=>LinkedPortfolioV2UI.resume());await record('V1 and resume');
  const single={...state,skus:state.skus.slice(0,1),offers:[],resources:[]};await seed(page,route,single);
  const disabled=page.locator('[data-basket-action="add"]');A.equal(await disabled.isDisabled(),true);
  const blocked=await business(page,route);await disabled.evaluate(el=>el.click());A.deepEqual(await business(page,route),blocked,'disabled offer action is inert');await record('disabled offer');
  if(version==='after'){
   await page.mouse.move(0,0);await page.waitForTimeout(200);
   A.deepEqual((await page.evaluate(()=>NomadButtons.audit(document.getElementById('portfolio-v2-root')))).failures,[]);
   await disabled.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,'linked-'+language+'-390-disabled.png')});
  }
 }
 receipts[version+'-'+route+'-'+language+'-trace']=trace;
 if(version==='after')A.deepEqual(trace,receipts['before-'+route+'-'+language+'-trace'],'same actions, stored data and finance '+route+' '+language);
}
(async()=>{
 fs.mkdirSync(artifacts,{recursive:true});const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),receipts={};
 try{
  for(const version of ['before','after'])for(const route of ['standalone','linked'])for(const language of ['ru','en','kk']){
   const context=await browser.newContext({locale:language==='kk'?'kk-KZ':language==='en'?'en-US':'ru-RU',viewport:{width:390,height:900},acceptDownloads:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   await page.route(/^https?:\/\//,r=>r.abort());
   await page.goto(pathToFileURL(path.join(version==='before'?baseline:root,'Marketing_calc.HTML')).href,{waitUntil:'domcontentloaded'});
   await page.addStyleTag({path:utilities});await page.addScriptTag({path:path.join(__dirname,'helpers/contrast.cjs')});
   await page.addScriptTag({path:path.join(__dirname,'helpers/v2-buttons.cjs')});await page.evaluate(language=>Nomad360UI.setLanguage(language),language);
   const state=fixtures[route+'-ready-'+language+'-390'].state;await seed(page,route,state);
   if(version==='after')await states(page,route,language,receipts);
   await interactions(page,route,state,language,version,receipts);A.deepEqual(errors,[]);await context.close();
  }
  fs.writeFileSync(path.join(artifacts,'receipts.json'),JSON.stringify(receipts,null,2));
  console.log('V2_BUTTON_ACTIONS_GREEN 6 before/after action traces; 36 hover/active/focus cases; disabled, native upload, keyboard and finance parity');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
