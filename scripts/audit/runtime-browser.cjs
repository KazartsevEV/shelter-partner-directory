'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),A=require('node:assert/strict');
const {createRequire}=require('node:module'),{capture,sha,BASE}=require('./runtime-inventory.cjs');
const tools=createRequire(path.resolve(__dirname,'../palette/package.json')),{chromium}=tools('playwright');
const ROOT=path.resolve(__dirname,'../..'),out=path.resolve(process.argv[2]||'artifacts/runtime-audit'),fixture=require('../../tests/fixtures/sales-tax-7b/vat-inputs.json'),serviceFixture=require('../../tests/fixtures/v1-engine/accepted-main.json');
const quick=process.env.AUDIT_QUICK==='1',prefix='/shelter-partner-directory/',widths=quick?[390]:[320,360,390,430,768,1280],langs=quick?['en']:['en','ru','kk'];
const debugMaps=new WeakMap();
async function attach(context,page){const client=await context.newCDPSession(page),scripts=new Map();debugMaps.set(client,scripts);client.on('Debugger.scriptParsed',x=>scripts.set(x.scriptId,{path:x.url.includes(prefix)?x.url.split(prefix)[1].split('?')[0]:x.url.startsWith('http')?'external':x.url||'anonymous',startLine:x.startLine}));await client.send('Debugger.enable');await client.send('Performance.enable');return client;}
const full={months:2,monthlyForecast:[10,8],capacity:20,priceGross:112,vatPct:12,discountPct:0,taxType:'profit',taxPct:15,unitCashCost:20,commissionPct:3,fixedCashMonthly:50,equipmentPurchase:500,equipmentAmortMonthly:10,reservePct:10,funding:'credit',annualRatePct:12,creditMonths:3};
const numericLeaves=(value,prefix='',rows=[])=>{if(typeof value==='number')rows.push([prefix,Number.isFinite(value)?value:String(value)]);else if(value&&typeof value==='object')for(const key of Object.keys(value).sort())numericLeaves(value[key],prefix+'.'+key,rows);return rows;};
const union=ranges=>{const out=[];for(const range of [...ranges].sort((a,b)=>a.start-b.start||a.end-b.end)){const last=out.at(-1);if(last&&last.end>=range.start)last.end=Math.max(last.end,range.end);else out.push({...range});}return out;};
function usedV8Ranges(functions){
 const events=new Map(),active=new Map(),used=[];let id=0,previous=0;
 for(const fn of functions)for(const range of fn.ranges){const key=id++;for(const [offset,start] of [[range.startOffset,true],[range.endOffset,false]]){if(!events.has(offset))events.set(offset,[]);events.get(offset).push({key,start,range});}}
 for(const offset of [...events.keys()].sort((a,b)=>a-b)){
  let winner=null;for(const range of active.values())if(!winner||range.endOffset-range.startOffset<winner.endOffset-winner.startOffset||(range.endOffset-range.startOffset===winner.endOffset-winner.startOffset&&range.count===0))winner=range;
  if(winner?.count>0&&offset>previous)used.push({start:previous,end:offset});
  for(const event of events.get(offset)){if(event.start)active.set(event.key,event.range);else active.delete(event.key);}previous=offset;
 }return union(used);
}
async function route(page,kind){
 if(kind==='home')return page.evaluate(()=>showHome());
 if(kind==='v1')return page.evaluate(()=>showProductBranch());
 if(['resale','dropship'].includes(kind))return page.evaluate(source=>{showProductBranch();selectProductSource(source);},kind);
 if(['standalone','linked'].includes(kind)){
  const input=fixture.cases.find(x=>x.kind===kind&&x.id.endsWith('profit-vat12-credit-3')).input;
  return page.evaluate(({kind,input})=>{localStorage.setItem(kind==='standalone'?'marketingCalcPortfolioV2':'marketingCalcLinkedPortfolioV2',JSON.stringify(input));if(kind==='standalone')PortfolioV2UI.open({resume:true});else LinkedPortfolioV2UI.resume();},{kind,input});
 }
 if(kind==='full-service')return page.evaluate(input=>Nomad360FullServiceUI.open(input,{kind:'offline',name:'AUDIT · fixture'}),full);
 if(kind==='offline')return page.evaluate(()=>{showServiceWorkChooser();selectServiceFinancialMode('simple');chooseServiceChannel('offline');startOfflineServiceCalculation();});
 if(kind.startsWith('simple-'))return page.evaluate(({mode,input})=>{showServiceWorkChooser();selectServiceFinancialMode('simple');chooseServiceChannel('online');selectServiceMode(mode);Object.assign(currentValues,input.values);Object.assign(agentPayers,input.payers);initInputs();calculate();},{mode:kind.slice(7),input:serviceFixture.simpleCases.find(x=>x.input.mode===kind.slice(7)).input});
 if(kind==='footer')return page.evaluate(()=>{showHome();document.querySelector('[data-nomad-embed-toggle]').click();document.querySelectorAll('#nomad360-footer details').forEach(e=>e.open=true);});
 if(kind==='partner'){await page.locator('#nomad360-partner-trigger').click();return;}
 if(kind==='bug'){await page.locator('#nomad360-bug-launcher').click();return;}
 throw Error('Unknown audit route '+kind);
}
async function metrics(page,client){
 await client.send('HeapProfiler.collectGarbage');
 const data=Object.fromEntries((await client.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
 for(const metric of ['JSEventListeners','JSHeapUsedSize','JSHeapTotalSize','LayoutCount','LayoutDuration','ScriptDuration','TaskDuration'])A.ok(Number.isFinite(data[metric]),'Missing CDP metric '+metric);
 const group='audit-listeners',listeners=[];
 try{
  for(const [expression,depth] of [['window',1],['document',-1]]){
   const object=await client.send('Runtime.evaluate',{expression,objectGroup:group});
   const result=await client.send('DOMDebugger.getEventListeners',{objectId:object.result.objectId,depth,pierce:true});
   for(const item of result.listeners)listeners.push({target:expression,event:item.type,source:debugMaps.get(client)?.get(item.scriptId)||null,scriptLine:item.lineNumber+1,capture:item.useCapture,passive:item.passive,once:item.once});
  }
 }finally{await client.send('Runtime.releaseObjectGroup',{objectGroup:group});}
 const dom=await page.evaluate(()=>({nodes:document.querySelectorAll('*').length,visible:[...document.querySelectorAll('body *')].filter(e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})).length,overflow:document.documentElement.scrollWidth>innerWidth+1}));
 return {dom,metrics:{jsEventListeners:data.JSEventListeners,heapUsedBytes:data.JSHeapUsedSize,heapTotalBytes:data.JSHeapTotalSize,layoutCount:data.LayoutCount,layoutSeconds:data.LayoutDuration,scriptSeconds:data.ScriptDuration,taskSeconds:data.TaskDuration},listenerDescriptors:listeners};
}
async function run(){
 fs.mkdirSync(out,{recursive:true});const inventory=capture(),cssFile=path.join(out,'utilities.css');
 if(!fs.existsSync(cssFile))throw Error('Compile the existing pinned Tailwind utilities into '+cssFile);
 fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify(inventory,null,2)+'\n');
 const {buildPackage}=require('../partners/build.cjs');
 const standalone=await buildPackage(require('../../tests/fixtures/partner-build/example.json'),{browserFactory:()=>chromium.launch({headless:true,args:['--no-sandbox']})});
 console.log('RUNTIME_AUDIT_PACKAGE',JSON.stringify({sourceRevision:standalone.manifest.sourceRevision,resources:standalone.manifest.resources.length,bytes:Buffer.byteLength(standalone.html)}));
 const server=http.createServer((req,res)=>{
  try{
   if(req.method!=='GET'||!req.url.startsWith(prefix))throw Error('path');
   if(new URL(req.url,'http://local').pathname===prefix+'__audit_standalone.html'){res.setHeader('Content-Type','text/html');return res.end(standalone.html);}
   let file=path.resolve(ROOT,decodeURIComponent(new URL(req.url,'http://local').pathname.slice(prefix.length)));
   if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   if(!file.startsWith(ROOT+path.sep)||fs.realpathSync(file)!==file||!fs.statSync(file).isFile())throw Error('path');
   res.setHeader('Content-Type',({'.HTML':'text/html','.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  }catch(_){res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+prefix;
 let browser,browserVersion;const cases=[],loads=[],coverage=new Map(),missingCoverageSources=[],seenSelectors=new Set(),unsupportedSelectors=new Set(),pendingSelectors=new Set(inventory.cssRules.flatMap(x=>x.selectors)),goldens={},failures=[],blockedHosts=new Set();
 function addCoverage(records,type){for(const record of records){const text=type==='js'?record.source:record.text,ranges=type==='js'?usedV8Ranges(record.functions):record.ranges,url=record.url.startsWith(base)?record.url.slice(base.length).split('?')[0]:record.url.startsWith('http')?'external':record.url||'inline-or-injected';if(typeof text!=='string'){missingCoverageSources.push({type,url});continue;}const key=type+':'+sha(text);if(!coverage.has(key))coverage.set(key,{type,url,sha256:sha(text),bytes:Buffer.byteLength(text),ranges:[],text});coverage.get(key).ranges.push(...ranges);}}
 async function observe(page,kind,language,width,client){
  await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const snapshot=await metrics(page,client);
  const matches=await page.evaluate(selectors=>{const matched=[],unsupported=[];for(const selector of selectors){try{if(selector.includes('::')){unsupported.push(selector);continue;}if(document.querySelector(selector))matched.push(selector);}catch(_){unsupported.push(selector);}}return {matched,unsupported};},[...pendingSelectors]);
  for(const s of matches.matched){seenSelectors.add(s);pendingSelectors.delete(s);}for(const s of matches.unsupported){unsupportedSelectors.add(s);pendingSelectors.delete(s);}
  if(snapshot.dom.overflow)failures.push({kind,language,width,error:'horizontal-overflow'});
  cases.push({kind,language,width,...snapshot});
 }
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});browserVersion=browser.version();
  for(const width of widths)for(const language of langs){
   const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],client=await attach(context,page);
   page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>{if(r.request().url().startsWith(base))return r.continue();try{blockedHosts.add(new URL(r.request().url()).hostname);}catch(_){}return r.abort();});
   await page.coverage.startCSSCoverage({resetOnNavigation:false});await page.coverage.startJSCoverage({resetOnNavigation:false,reportAnonymousScripts:true});
   const started=performance.now();await page.goto(base+'Marketing_calc.HTML?lang='+language+'&demo=shopper&finance=cash',{waitUntil:'domcontentloaded'});await page.addStyleTag({path:cssFile});await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');await page.evaluate(()=>document.fonts.ready);
   loads.push({width,language,readyWallMs:performance.now()-started,...await page.evaluate(()=>({navigation:(()=>{const n=performance.getEntriesByType('navigation')[0];return {domContentLoadedMs:n.domContentLoadedEventEnd,loadMs:n.loadEventEnd,transferBytes:n.transferSize,encodedBytes:n.encodedBodySize};})(),resources:performance.getEntriesByType('resource').filter(x=>x.name.startsWith(location.origin)).map(x=>({path:new URL(x.name).pathname.replace('/shelter-partner-directory/',''),encodedBytes:x.encodedBodySize,transferBytes:x.transferSize,durationMs:x.duration,initiator:x.initiatorType}))}))});
   const initialV1=await page.evaluate(()=>{const model=calculateProductPortfolio();return {model,cash:calculateProductCashFlow(model)};});
   const nums=numericLeaves(initialV1);if(!goldens.v1)goldens.v1=nums;else A.deepEqual(nums,goldens.v1,'V1 language/width numeric baseline');
   for(const kind of ['v1','home','resale','dropship','standalone','linked','full-service','simple-self','simple-hired','simple-agent','offline','footer','partner','bug']){
    if(['partner','bug'].includes(kind)){await page.evaluate(()=>showHome());if(await page.locator('dialog[open]').count())await page.keyboard.press('Escape');}
    await route(page,kind);await observe(page,kind,language,width,client);
    if(['standalone','linked','full-service'].includes(kind)){
     const value=await page.evaluate(kind=>kind==='standalone'?Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()):kind==='linked'?LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()):Nomad360FullServiceUI.getResult(),kind),nums=numericLeaves(value);
     if(!goldens[kind])goldens[kind]=nums;else A.deepEqual(nums,goldens[kind],kind+' numeric baseline across language/width');
    }
    if(['partner','bug'].includes(kind))await page.keyboard.press('Escape');
   }
   await route(page,'standalone');const saved=await page.evaluate(()=>localStorage.getItem('marketingCalcPortfolioV2'));
   const repeated=[];for(let repeat=0;repeat<5;repeat++){await route(page,'home');await route(page,'standalone');repeated.push((await metrics(page,client)).metrics);}cases.push({kind:'repeated-render',width,language,samples:repeated});
   await page.reload({waitUntil:'domcontentloaded'});await page.addStyleTag({path:cssFile});await page.evaluate(()=>PortfolioV2UI.open({resume:true}));await observe(page,'restore-standalone',language,width,client);
   A.equal(await page.evaluate(()=>localStorage.getItem('marketingCalcPortfolioV2')),saved,'draft bytes after actual reload');
   addCoverage(await page.coverage.stopCSSCoverage(),'css');addCoverage(await page.coverage.stopJSCoverage(),'js');
   if(errors.length)failures.push({width,language,error:'pageerror',messages:errors});await context.close();console.log('RUNTIME_AUDIT_CASE',width,language);
  }
  for(const entry of ['en/help/','ru/help/','kk/help/','US_Retail_Demo.HTML?demo=us-retail-12m&lang=en','US_Retail_Demo_FILLED.html'])for(const width of quick?[390]:[320,1280]){
   const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage(),client=await attach(context,page);await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());await page.goto(base+entry,{waitUntil:'domcontentloaded'});if(entry.includes('Demo'))await page.addStyleTag({path:cssFile});await observe(page,entry,entry.startsWith('ru')?'ru':entry.startsWith('kk')?'kk':'en',width,client);await context.close();
  }
  for(const width of quick?[390]:[320,1280])for(const language of langs){
   const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage(),client=await attach(context,page);await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
   await page.goto(base+'__audit_standalone.html?lang='+language+'&demo=shopper&finance=cash',{waitUntil:'domcontentloaded'});await page.addStyleTag({path:cssFile});await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');
   const value=await page.evaluate(()=>{const model=calculateProductPortfolio();return {model,cash:calculateProductCashFlow(model)};});A.deepEqual(numericLeaves(value),goldens.v1,'fresh standalone V1 parity');
   for(const kind of ['v1','resale','dropship','standalone','linked','full-service','simple-self','simple-hired','simple-agent','offline']){await route(page,kind);await observe(page,'autonomous-'+kind,language,width,client);}
   await context.close();
  }
  const covered=[...coverage.values()].map(({text,ranges,...rest})=>{const merged=union(ranges);return {...rest,usedBytes:merged.reduce((s,r)=>s+Buffer.byteLength(text.slice(r.start,r.end)),0),usedRanges:merged};});
  const report={schemaVersion:1,baseRevision:BASE,standaloneManifest:standalone.manifest,sourceHashes:Object.fromEntries(inventory.files.map(x=>[x.file,x.sha256])),toolVersions:{node:process.version,playwright:tools('playwright/package.json').version,chromium:browserVersion},method:{quick,localOnly:true,externalHostsBlocked:[...blockedHosts].sort(),injectedUtilitiesSha256:sha(fs.readFileSync(cssFile)),injectedUtilitiesBytes:fs.statSync(cssFile).size,forcedGCBeforeHeap:true,timingIsLabOnly:true,selectorMatchingIsDomPresenceNotCssApplication:true,noAppCodeInstrumented:true},loads,cases,numericBaseline:goldens,coverage:covered,missingCoverageSources,selectors:{observed:[...seenSelectors].sort(),notObserved:[...pendingSelectors].sort(),unsupported:[...unsupportedSelectors].sort()},failures};
  fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(report,null,2)+'\n');A.deepEqual(failures,[]);console.log('RUNTIME_AUDIT_GREEN',JSON.stringify({cases:cases.length,loads:loads.length,coverageSources:covered.length,selectorsObserved:seenSelectors.size,notObserved:pendingSelectors.size}));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
if(require.main===module)run().catch(error=>{console.error(error.stack);process.exitCode=1;});
module.exports={union,numericLeaves,usedV8Ranges};
