'use strict';
// Paired C1 verification. No changes to calculator code or numerical expectations.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),A=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {chromium}=require('../palette/node_modules/playwright');
const scope=require('../../tests/helpers/paint-scope.cjs'),{buildPackage}=require('../partners/build.cjs');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.argv[2]||'artifacts/paint'),baselineRoot=process.env.C58_BASELINE_ROOT;
const vat=require('../../tests/fixtures/sales-tax-7b/vat-inputs.json'),v1=require('../../tests/fixtures/v1-engine/accepted-main.json');
const widths=[320,360,390,430,559,560,561,600,601,700,701,760,761,768,1020,1021,1280,1920],languages=['ru','en','kk'];
const full={months:2,monthlyForecast:[10,8],capacity:20,priceGross:112,vatPct:12,discountPct:0,taxType:'profit',taxPct:15,unitCashCost:20,commissionPct:3,fixedCashMonthly:50,equipmentPurchase:500,equipmentAmortMonthly:10,reservePct:10,funding:'credit',annualRatePct:12,creditMonths:3};
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
async function route(page,kind){
 if(kind==='home')return page.evaluate(()=>showHome());
 if(kind==='full')return page.evaluate(x=>Nomad360FullServiceUI.open(x,{kind:'offline',name:'C1 fixture'}),full);
 if(['standalone','linked'].includes(kind)){const input=vat.cases.find(x=>x.kind===kind&&x.id.endsWith('profit-vat12-credit-3')).input;return page.evaluate(({kind,input})=>{localStorage.setItem(kind==='standalone'?'marketingCalcPortfolioV2':'marketingCalcLinkedPortfolioV2',JSON.stringify(input));if(kind==='standalone')PortfolioV2UI.open({resume:true});else LinkedPortfolioV2UI.resume();},{kind,input});}
 if(kind==='offline')return page.evaluate(()=>{showServiceWorkChooser();selectServiceFinancialMode('simple');chooseServiceChannel('offline');startOfflineServiceCalculation();});
 return page.evaluate(({mode,input})=>{showServiceWorkChooser();selectServiceFinancialMode('simple');chooseServiceChannel('online');selectServiceMode(mode);Object.assign(currentValues,input.values);Object.assign(agentPayers,input.payers);initInputs();calculate();},{mode:kind,input:v1.simpleCases.find(x=>x.input.mode===kind).input});
}
async function snapshot(page,kind){await require('../../tests/helpers/approved-ui-comparison.cjs').align(page);
 await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 return page.evaluate(({kind,origin,selectors})=>{
  scrollTo(0,0);const canonical=v=>v.replaceAll(origin+'/before/',origin+'/variant/').replaceAll(origin+'/after/',origin+'/variant/');
  const affected=new Set(selectors.flatMap(selector=>[...document.querySelectorAll(selector.replace(/::(?:before|after)/g,''))]));
  const all=(e,p)=>{const c=getComputedStyle(e,p);return p&&['none','normal'].includes(c.content)?[['content',c.content]]:[...c].sort().map(k=>[k,canonical(c.getPropertyValue(k))]);};
  const props=['display','position','box-sizing','width','height','min-width','max-width','padding','margin','gap','grid-template-columns','grid-template-rows','flex-direction','flex-wrap','align-items','justify-content','color','background-color','background-image','border','border-radius','font-family','font-size','font-weight','line-height','overflow-x','overflow-y','white-space'];
  const visible=[...document.querySelectorAll('body *')].filter(e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}));
  const styles=visible.map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,classes:e.className?.baseVal??e.className,rect:[r.x,r.y,r.width,r.height],style:props.map(p=>canonical(s.getPropertyValue(p))),all:affected.has(e)?all(e):null,before:all(e,'::before'),after:all(e,'::after')};});
  const grids=[...document.querySelectorAll('#full-service-screen .nd-full-service-inputs')];
  const gridStyle=kind==='full'?grids.map(grid=>[...getComputedStyle(grid)].sort().map(p=>[p,getComputedStyle(grid).getPropertyValue(p)])):null;
  let numbers=null;if(kind==='full')numbers=Nomad360FullServiceUI.getResult();else if(kind==='standalone')numbers=Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState());else if(kind==='linked')numbers=LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState());else if(['self','hired','agent'].includes(kind))numbers={model:Nomad360V1Engine.calculateSimpleService({values:currentValues,mode:serviceMode,payers:agentPayers}),summary:document.getElementById("summary-table").textContent,monthly:document.getElementById("monthly-table").textContent};
  return {styles,gridStyle,numbers,visibleText:document.body.innerText,totalNodes:document.querySelectorAll('body *').length,overflow:document.documentElement.scrollWidth>innerWidth+1};
 },{kind,origin:new URL(page.url()).origin,selectors:[...new Set(Object.values(scope.receipt.files).flatMap(r=>(r.proof||[]).map(x=>x.selector)))]});
}
(async()=>{
 A.ok(baselineRoot);for(const [file,r]of Object.entries(scope.sources))A.equal(fs.readFileSync(path.join(baselineRoot,file),'utf8'),r.before);
 fs.mkdirSync(out,{recursive:true});A.ok(fs.existsSync(path.join(out,'utilities.css')),'Compile pinned utilities first');
 const launch=()=>chromium.launch({headless:true,args:['--no-sandbox']});
 const config=require('../../tests/fixtures/partner-build/example.json');
 const beforePackage=await buildPackage(config,{repositoryRoot:baselineRoot,browserFactory:launch}),afterPackage=await buildPackage(config,{browserFactory:launch});
 const comparableAfter=require('../../tests/helpers/v1-operations-scope.cjs').packageProjection(afterPackage);
 A.equal(beforePackage.html,scope.restoreStandalone(comparableAfter.html));A.deepEqual(beforePackage.manifest.resources.map(scope.normalizeResource),comparableAfter.manifest.resources.map(scope.normalizeResource));A.equal(Buffer.byteLength(beforePackage.html)-Buffer.byteLength(comparableAfter.html),6114);
 const packages={before:beforePackage,after:afterPackage};
 const server=http.createServer((req,res)=>{try{
  const url=new URL(req.url,'http://local');let rel=decodeURIComponent(url.pathname).slice(1),variant=rel.startsWith('before/')?'before':'after';rel=rel.replace(/^(before|after)\//,'').replace(/^shelter-partner-directory\//,'');
  if(req.method!=='GET')throw Error('GET only');
  if(rel==='standalone.html'){res.setHeader('Content-Type','text/html');return res.end(packages[variant].html);}
  const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile())throw Error('file');
  res.setHeader('Content-Type',({'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');
  res.end(scope.sources[rel]&&variant==='before'?scope.sources[rel].before:fs.readFileSync(file));
 }catch(_){res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port,browser=await launch(),cases=[],timing=[];
 try{
  for(const entry of ['Marketing_calc.HTML','US_Retail_Demo.HTML','standalone.html'])for(const width of entry==='standalone.html'?[320,390,700,701,1021,1280]:widths)for(const language of languages){
   const pair={};
   for(const variant of ['before','after']){
    const ctx=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
    await page.goto(origin+'/'+variant+'/'+entry+'?lang='+language,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(out,'utilities.css')});await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'});await page.waitForFunction(()=>window.Nomad360FullServiceUI&&window.Nomad360UI);await page.locator('#nomad360-lang-select').selectOption(language);
    const rows=[];
    for(const kind of ['full','self','hired','agent','offline','standalone','linked','home']){
     await route(page,kind);const data=await snapshot(page,kind);if(kind==='full')fs.writeFileSync(path.join(out,[entry,width,language,variant,'grid.json'].join('-')),JSON.stringify(data.gridStyle,null,2));A.equal(data.overflow,false,[entry,width,language,variant,kind].join('/'));
     let screenshot=null;
     if(entry==='Marketing_calc.HTML'&&((kind==='full'&&[320,1280].includes(width))||(kind==='home'&&[320,390,700,701,1020,1021,1280,1920].includes(width)))){
      const name=kind+'-'+language+'-'+width+'-'+variant+'.png';const bytes=await page.locator(kind==='home'?'#nomad360-commercial-banner':'#full-service-screen .nd-full-service-settings').screenshot({path:path.join(out,name),animations:'disabled',caret:'hide'});screenshot={file:name,sha256:hash(bytes)};
     }
     let focusHash=null;if(kind==='full'){await page.keyboard.press('Tab');await page.locator('#full-service-screen input').first().focus();await page.locator('#full-service-screen input').first().hover();focusHash=hash(JSON.stringify(await snapshot(page,kind)));await page.mouse.move(0,0);}
     rows.push({kind,focusHash,styleHash:hash(JSON.stringify(data.styles)),gridHash:hash(JSON.stringify(data.gridStyle)),numbersHash:hash(JSON.stringify(data.numbers)),textHash:hash(data.visibleText),totalNodes:data.totalNodes,visibleNodes:data.styles.length,screenshot});
    }
    A.deepEqual(errors,[]);pair[variant]=rows;await ctx.close();
   }
   for(let i=0;i<pair.before.length;i++){const a=pair.before[i],b=pair.after[i];A.deepEqual({...a,screenshot:null},{...b,screenshot:null},[entry,width,language,a.kind].join('/'));if(a.screenshot)A.equal(a.screenshot.sha256,b.screenshot.sha256,'pixel-identical input panel');}
   cases.push({entry,width,language,routes:pair.after,exactStylesAndNumbers:true});console.log('C58_CASE_GREEN',entry,width,language);
  }
  const banners=[];
  for(const width of [320,360,390,430,768,1280])for(const language of languages){
   const pair={};
   for(const variant of ['before','after']){
    const page=await browser.newPage({viewport:{width,height:950},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>r.request().method()==='GET'&&r.request().url().startsWith(origin+'/')?r.continue():r.abort());
    await page.goto(origin+'/'+variant+'/Marketing_calc.HTML?lang='+language,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(out,'utilities.css')});await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'});await page.waitForFunction(()=>window.Nomad360UI);await page.locator('#nomad360-lang-select').selectOption(language);await route(page,'home');
    const rows=[];
    for(const state of ['closed','products-open','support-open','bank-open']){
     if(state!=='closed')await page.evaluate(state=>{const id=({'products-open':'nomad360-product-details','support-open':'nomad360-irbis-support-disclosure','bank-open':'nomad360-irbis-bank'})[state],e=document.getElementById(id);if(!e||e.tagName!=='DETAILS')throw Error('Missing disclosure '+id);e.open=true;},state);
     const data=await snapshot(page,'home');A.equal(data.overflow,false);const png=[];
     if([320,1280].includes(width)&&['closed','products-open'].includes(state))for(const selector of ['#nomad360-about','#nomad360-irbis-banner']){
      const node=page.locator(selector);A.equal(await node.count(),1,selector);const name='banner-'+selector.slice(1)+'-'+state+'-'+language+'-'+width+'-'+variant+'.png';const bytes=await node.screenshot({path:path.join(out,name),animations:'disabled'});png.push({file:name,sha256:hash(bytes)});
     }
     rows.push({state,styleHash:hash(JSON.stringify(data.styles)),textHash:hash(data.visibleText),numbersHash:hash(JSON.stringify(data.numbers)),png});
    }
    A.deepEqual(errors,[]);pair[variant]=rows;await page.close();
   }
   for(let i=0;i<pair.before.length;i++){A.deepEqual({...pair.before[i],png:null},{...pair.after[i],png:null});A.deepEqual(pair.before[i].png.map(x=>x.sha256),pair.after[i].png.map(x=>x.sha256));}
   banners.push({width,language,...pair});console.log('C58_BANNER_GREEN',width,language);
  }
  const negative=await browser.newPage({viewport:{width:390,height:950}});await negative.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());await negative.goto(origin+'/after/Marketing_calc.HTML?lang=ru');await negative.addStyleTag({path:path.join(out,'utilities.css')});await route(negative,'home');const correct=await snapshot(negative,'home');await negative.addStyleTag({content:'html body #home-screen #nomad360-commercial-banner{padding-top:123px!important}'});A.notEqual(hash(JSON.stringify(correct.styles)),hash(JSON.stringify((await snapshot(negative,'home')).styles)),'Geometry regression must be detected');await negative.close();
  // Three paired repetitions on identical fresh-context cases, alternating order.
  for(const width of [390,1280])for(let repeat=0;repeat<3;repeat++)for(const variant of repeat%2?['after','before']:['before','after']){
   const ctx=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'}),page=await ctx.newPage(),cdp=await ctx.newCDPSession(page);await cdp.send('Performance.enable');await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
   const start=performance.now();await page.goto(origin+'/'+variant+'/Marketing_calc.HTML?lang=ru',{waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(out,'utilities.css')});await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'});await page.waitForFunction(()=>window.Nomad360FullServiceUI);await route(page,'full');await page.evaluate(()=>document.fonts.ready);const readyMs=performance.now()-start;
   await cdp.send('HeapProfiler.collectGarbage');const m=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));timing.push({width,repeat,variant,readyMs,listeners:m.JSEventListeners,heapBytes:m.JSHeapUsedSize});await ctx.close();
  }
  for(const width of [390,1280]){const a=timing.filter(x=>x.width===width&&x.variant==='before').map(x=>x.listeners),b=timing.filter(x=>x.width===width&&x.variant==='after').map(x=>x.listeners);A.deepEqual(a,b,'listener parity');}
  const sizes=s=>({bytes:Buffer.byteLength(s),gzip:zlib.gzipSync(s,{level:9}).length,brotli:zlib.brotliCompressSync(s).length});
  const report={negativeGeometryDetected:true,base:scope.base,sizes:Object.fromEntries(Object.entries(scope.sources).map(([f,r])=>[f,{before:sizes(r.before),after:sizes(r.after)}])),cases,banners,comparisons:cases.length*8+ banners.length*4,timing,packages:Object.fromEntries(Object.entries(packages).map(([k,p])=>[k,{revision:p.manifest.sourceRevision,htmlBytes:Buffer.byteLength(p.html),resources:p.manifest.resources}]))};
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify(report,null,2)+'\n');console.log('C58_BROWSER_GREEN',JSON.stringify({cases:cases.length,comparisons:report.comparisons,pairedTimings:timing.length}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
