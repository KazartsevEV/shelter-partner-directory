'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),A=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {chromium}=require('../palette/node_modules/playwright'),scope=require('../../tests/helpers/cleanup-canvas-scope.cjs'),{buildPackage}=require('../partners/build.cjs');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.argv[2]||'artifacts/cleanup-c5'),baselineRoot=process.env.C5_BASELINE_ROOT;
const widths=[320,360,390,430,699,700,701,768,999,1000,1001,1280,1440,1920,2560],languages=['ru','en','kk'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function settle(page){await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function snapshot(page,origin){
 await settle(page);
 return page.evaluate(origin=>{
  const info=document.querySelector('#nomad360-information');
  const canonical=s=>s.replaceAll(origin+'/before/',origin+'/variant/').replaceAll(origin+'/after/',origin+'/variant/');
  const style=(e,pseudo)=>{const s=getComputedStyle(e,pseudo);if(pseudo&&['none','normal'].includes(s.content))return [['content',s.content]];return [...s].sort().map(p=>[p,canonical(s.getPropertyValue(p))]);};
  const nodes=[info,...info.querySelectorAll('*')].map(e=>{
   const r=e.getBoundingClientRect();
   return {tag:e.tagName,id:e.id,classes:e.getAttribute('class'),text:e.textContent,href:e.getAttribute('href'),rect:[r.x,r.y,r.width,r.height],style:style(e),before:style(e,'::before'),after:style(e,'::after')};
  });
  const r=info.getBoundingClientRect();
  return {nodes,domNodes:document.querySelectorAll('body *').length,overflow:document.documentElement.scrollWidth>innerWidth+1,fullWidth:Math.abs(r.width-document.documentElement.clientWidth)<=1,language:document.documentElement.lang};
 },origin);
}
(async()=>{
 A.ok(baselineRoot,'Set C5_BASELINE_ROOT to a clean accepted checkout');
 A.equal(fs.readFileSync(path.join(baselineRoot,scope.file),'utf8'),scope.original);fs.mkdirSync(out,{recursive:true});
 const css=path.join(out,'utilities.css');A.ok(fs.existsSync(css),'Compile pinned utilities');
 const launch=()=>chromium.launch({headless:true,args:['--no-sandbox']}),config=require('../../tests/fixtures/partner-build/example.json');
 const packages={before:await buildPackage(config,{repositoryRoot:baselineRoot,browserFactory:launch}),after:await buildPackage(config,{browserFactory:launch})};
 const unchanged=p=>p.manifest.resources.filter(r=>r.path!==scope.file).sort((a,b)=>a.path.localeCompare(b.path));
 A.deepEqual(unchanged(packages.before),unchanged(packages.after),'Every other packaged resource is exact');
 const deletedBytes=Buffer.byteLength(scope.original)-Buffer.byteLength(scope.candidate);
 A.equal(Buffer.byteLength(packages.before.html)-Buffer.byteLength(packages.after.html),deletedBytes);
 const server=http.createServer((req,res)=>{try{
  let rel=decodeURIComponent(new URL(req.url,'http://local').pathname).slice(1),variant=rel.startsWith('before/')?'before':'after';
  rel=rel.replace(/^(before|after)\//,'').replace(/^shelter-partner-directory\//,'');A.equal(req.method,'GET');
  if(rel==='standalone.html'){res.setHeader('Content-Type','text/html');return res.end(packages[variant].html);}
  const file=path.resolve(root,rel);A.ok(file.startsWith(root+path.sep)&&fs.statSync(file).isFile());
  res.setHeader('Content-Type',({'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');
  res.end(rel===scope.file&&variant==='before'?scope.original:fs.readFileSync(file));
 }catch(_){res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,browser=await launch(),cases=[],timing=[],resizes=[];
 try{
  for(const entry of ['Marketing_calc.HTML','standalone.html'])for(const width of entry==='standalone.html'?[320,700,701,1000,1001,1280,2560]:widths)for(const language of languages){
   const pair={};
   for(const variant of ['before','after']){
    const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
    await page.goto(origin+'/'+variant+'/'+entry+'?lang='+language,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'});
    await page.waitForFunction(()=>window.Nomad360UI&&document.querySelector('#nomad360-information'));
    await page.locator('#nomad360-lang-select').selectOption(language);await page.evaluate(()=>showHome());
    await page.evaluate(async()=>{const scene=getComputedStyle(document.querySelector('#nomad360-information'),'::before').backgroundImage;const url=scene.match(/^url\("?(.*?)"?\)$/)?.[1];if(!url)throw Error('Missing scenic image');const image=new Image();image.src=url;await image.decode();});
    const rows=[];
    for(const view of ['default','service-hover','contact-focus']){
     if(view==='default')await page.locator('#nomad360-information').scrollIntoViewIfNeeded();
     if(view==='service-hover')await page.locator('#nomad360-information .nomad-about-card').first().hover();
     if(view==='contact-focus')await page.locator('#nomad360-information .nomad-links a').first().focus();
     const data=await snapshot(page,origin);A.equal(data.overflow,false,[entry,width,language,variant,view].join('/'));A.ok(data.fullWidth,'Full-width banner');A.equal(data.language,language);
     let screenshot=null;
     if(view==='default'&&entry==='Marketing_calc.HTML'&&[320,700,701,1000,1001,1280].includes(width)){
      const name=language+'-'+width+'-'+variant+'.png',bytes=await page.locator('#nomad360-information').screenshot({path:path.join(out,name),animations:'disabled',caret:'hide'});
      screenshot={file:name,sha256:hash(bytes)};
     }
     rows.push({view,domNodes:data.domNodes,bannerNodes:data.nodes.length,allStylesAndGeometryHash:hash(JSON.stringify(data.nodes)),fullWidth:data.fullWidth,screenshot});
    }
    A.deepEqual(errors,[]);pair[variant]=rows;await ctx.close();
   }
   for(let i=0;i<pair.before.length;i++){const a=pair.before[i],b=pair.after[i];A.deepEqual({...a,screenshot:null},{...b,screenshot:null},[entry,width,language,a.view].join('/'));if(a.screenshot)A.equal(a.screenshot.sha256,b.screenshot.sha256,'Byte-identical banner PNG');}
   cases.push({entry,width,language,scenic:true,...pair});console.log('C5_CASE_GREEN',entry,width,language);
  }
  for(const language of languages){
   const pair={};
   for(const variant of ['before','after']){
    const ctx=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'reduce'}),page=await ctx.newPage();await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
    await page.goto(origin+'/'+variant+'/Marketing_calc.HTML?lang='+language,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});await page.waitForSelector('#nomad360-information');await page.locator('#nomad360-lang-select').selectOption(language);
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'});
    const rows=[];
    for(const width of [390,1280,700,701,1000,1001,320]){
     await page.setViewportSize({width,height:1000});
     await page.waitForFunction(()=>Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nomad-about-viewport-width'))-document.documentElement.clientWidth)<1);
     await page.locator('#nomad360-information').scrollIntoViewIfNeeded();const data=await snapshot(page,origin);A.ok(data.fullWidth);A.equal(data.overflow,false);
     rows.push({width,domNodes:data.domNodes,hash:hash(JSON.stringify(data.nodes))});
    }
    pair[variant]=rows;await ctx.close();
   }
   A.deepEqual(pair.before,pair.after,'Live resize canvas geometry/styles: '+language);resizes.push({language,...pair});
  }
  // Negative browser control: restore the old inset canvas and detect lost full width.
  const negativePage=await browser.newPage({viewport:{width:320,height:1000},reducedMotion:'reduce'});
  await negativePage.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await negativePage.goto(origin+'/after/Marketing_calc.HTML?lang=ru',{waitUntil:'domcontentloaded'});await negativePage.addStyleTag({path:css});await negativePage.waitForSelector('#nomad360-information');
  const control=await snapshot(negativePage,origin);await negativePage.addStyleTag({content:'@media(max-width:700px){#nomad360-information.nomad-information{width:calc(100vw - 20px)!important;max-width:440px!important}}'});
  const mutated=await snapshot(negativePage,origin);A.ok(control.fullWidth);A.equal(mutated.fullWidth,false);A.notEqual(hash(JSON.stringify(control.nodes)),hash(JSON.stringify(mutated.nodes)),'Comparator detects the old inset canvas');await negativePage.close();
  for(const width of [390,1280])for(let repeat=0;repeat<9;repeat++)for(const variant of repeat%2?['after','before']:['before','after']){
   const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await ctx.newPage(),cdp=await ctx.newCDPSession(page);await cdp.send('Performance.enable');
   await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());const start=performance.now();
   await page.goto(origin+'/'+variant+'/Marketing_calc.HTML?lang=ru',{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});await page.waitForFunction(()=>window.Nomad360UI&&document.querySelector('#nomad360-information'));await settle(page);
   const readyMs=performance.now()-start;await cdp.send('HeapProfiler.collectGarbage');const m=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
   timing.push({width,repeat,variant,readyMs,listeners:m.JSEventListeners,heapBytes:m.JSHeapUsedSize});await ctx.close();
  }
  for(const width of [390,1280])for(let repeat=0;repeat<9;repeat++){const pair=timing.filter(x=>x.width===width&&x.repeat===repeat);A.equal(pair[0].listeners,pair[1].listeners);}
  A.equal(cases.length,66);const size=s=>({bytes:Buffer.byteLength(s),gzip:zlib.gzipSync(s,{level:9}).length,brotli:zlib.brotliCompressSync(s).length});
  const report={base:scope.base,cases,comparisons:cases.length*3,screenshotPairs:18,resizes,resizePairs:21,negativeCanvasDetected:true,sizes:{before:size(scope.original),after:size(scope.candidate)},timing,packages:Object.fromEntries(Object.entries(packages).map(([k,p])=>[k,{revision:p.manifest.sourceRevision,bytes:Buffer.byteLength(p.html),resources:p.manifest.resources}]))};
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify(report,null,2)+'\n');console.log('C5_BROWSER_GREEN',JSON.stringify({cases:cases.length,comparisons:cases.length*3,resizePairs:21,screenshotPairs:18,negativeCanvasDetected:true}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
