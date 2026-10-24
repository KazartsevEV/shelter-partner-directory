'use strict';
const fs=require('node:fs'),path=require('node:path'),A=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const H=require('../../tests/helpers/task10-palette.cjs'),scope=require('../../tests/helpers/cleanup-palette-scope.cjs'),{route,model}=require('./scenarios.cjs'),{buildPackage}=require('../partners/build.cjs');
const out=path.resolve(process.argv[2]||'artifacts/cleanup-c4'),baseline=process.env.C4_BASELINE_ROOT,quick=process.argv.includes('--quick');
const widths=quick?[320]:[320,360,390,430,768,1280],languages=quick?['ru']:['ru','en','kk'];
const kinds=['v1','home','standalone','linked','full-service','simple-self','simple-hired','simple-agent','offline'];
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
async function settle(p){await p.evaluate(()=>document.fonts.ready);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function snapshot(p){
 await settle(p);
 return p.evaluate(()=>{
  const normalize=s=>s.replace(/http:\/\/127\.0\.0\.1:\d+\//g,'http://paired/');
  const full=e=>{const s=getComputedStyle(e);return [...s].sort().map(p=>[p,normalize(s.getPropertyValue(p))]);};
  const selectors=['body:has(#home-screen) .nomad-seo-tagline span+span','body:has(#home-screen)','body:has(#home-screen) #nomad360-hero h1','body:has(#home-screen) #nomad360-calculation-list li','body:has(#home-screen) #nomad360-home-secondary .nomad-example-link','body:has(#home-screen) #full-service-screen .nd-full-service-label','body:has(#home-screen) #full-service-screen .nd-full-service-secondary'];
  const affected=selectors.map(selector=>({selector,elements:[...document.querySelectorAll(selector)].map(full)}));
  const props=['display','position','width','height','padding','margin','gap','color','background-color','background-image','border-color','border-width','font-family','font-size','font-weight','line-height','outline','opacity','transform','grid-template-columns','--p10-fg','--p10-line','--p10-muted','--p10-accent'];
  const visible=[...document.querySelectorAll('body *')].filter(e=>!e.matches('script,style,link')&&e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName,rect:[r.x,r.y,r.width,r.height],style:props.map(p=>normalize(s.getPropertyValue(p)))};});
  return {affected,visible,domNodes:document.querySelectorAll('body *').length,overflow:document.documentElement.scrollWidth>innerWidth+1};
 });
}
(async()=>{
 A.ok(baseline);A.equal(fs.readFileSync(path.join(baseline,scope.file),'utf8'),scope.original);fs.mkdirSync(out,{recursive:true});
 const config=require('../../tests/fixtures/partner-build/example.json'),packages={before:await buildPackage(config,{repositoryRoot:baseline,browserFactory:H.launch}),after:await buildPackage(config,{browserFactory:H.launch})};
 const resources=p=>p.manifest.resources.filter(r=>r.path!==scope.file);A.deepEqual(resources(packages.before),resources(packages.after));A.equal(packages.before.html.length-packages.after.html.length,904);
 A.equal(scope.packageDelta(packages.before,packages.after),904);
 for(const [variant,p] of Object.entries(packages)){const dir=variant==='before'?path.join(baseline,'artifacts/cleanup-c4'):out;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'standalone.html'),p.html);}
 const servers={before:await H.serve(baseline),after:await H.serve()},browser=await H.launch(),cases=[],timing=[];
 try{
  for(const entry of ['Marketing_calc.HTML','artifacts/cleanup-c4/standalone.html'])for(const language of languages)for(const width of entry==='Marketing_calc.HTML'?widths:quick?[320]:[320,1280]){
   const pair={};
   for(const variant of ['before','after']){
    const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
    await H.ready(p,servers[variant].base,entry+'?lang='+language+'&demo=shopper&finance=cash');if(entry!=='Marketing_calc.HTML')await p.addStyleTag({path:path.join(out,'utilities.css')});
    await p.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}'});
    await p.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');await p.locator('#nomad360-lang-select').selectOption(language);
    const rows=[];
    for(const kind of kinds){
     await route(p,kind);await p.evaluate(()=>scrollTo(0,0));await settle(p);const value=await model(p,kind),data=await snapshot(p);
     A.equal(data.overflow,false,[variant,entry,language,width,kind].join('/'));
     let screenshot=null;if(entry==='Marketing_calc.HTML'&&language==='ru'&&[320,1280].includes(width)&&['home','v1','standalone','full-service'].includes(kind)){
      const name=`ru-${width}-${kind}-${variant}.png`,bytes=await p.screenshot({path:path.join(out,name),animations:'disabled',caret:'hide'});screenshot={file:name,sha256:hash(bytes)};
     }
     rows.push({kind,model:value,domNodes:data.domNodes,visibleNodes:data.visible.length,stylesAndGeometry:hash(JSON.stringify(data)),screenshot});
    }
    await route(p,'standalone');const saved=await model(p,'standalone');await p.reload({waitUntil:'domcontentloaded'});await p.addStyleTag({path:path.join(out,'utilities.css')});await p.evaluate(()=>PortfolioV2UI.open({resume:true}));await settle(p);A.deepEqual(await model(p,'standalone'),saved,'Restored V2 exact');
    A.deepEqual(errors,[]);pair[variant]=rows;await ctx.close();
   }
   for(let i=0;i<pair.before.length;i++){const a=pair.before[i],b=pair.after[i];A.deepEqual({...a,screenshot:null},{...b,screenshot:null},[entry,language,width,a.kind].join('/'));if(a.screenshot)A.equal(a.screenshot.sha256,b.screenshot.sha256,'Exact paired screenshot');}
   cases.push({entry,language,width,...pair});console.log('C4_CASE_GREEN',entry,language,width);
  }
  // A real browser must keep the last restoration after an intervening override.
  const probe=await browser.newPage();const input='@layer nomad360-palette{.x{color:white}.x{color:blue}.x{color:white}}';
  const reduced=require('../palette/deduplicate.cjs').deduplicate(input).css;
  for(const css of [input,reduced]){await probe.setContent('<style>'+css+'</style><div class="x">cascade</div>');A.equal(await probe.locator('.x').evaluate(e=>getComputedStyle(e).color),'rgb(255, 255, 255)');}
  await probe.setContent('<style>@layer nomad360-palette{.x{color:white}.x{color:blue}}</style><div class="x">cascade</div>');A.equal(await probe.locator('.x').evaluate(e=>getComputedStyle(e).color),'rgb(0, 0, 255)');await probe.close();
  for(const width of [390,1280])for(let repeat=0;repeat<9;repeat++)for(const variant of repeat%2?['after','before']:['before','after']){
   const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),p=await ctx.newPage(),cdp=await ctx.newCDPSession(p);await cdp.send('Performance.enable');const start=performance.now();await H.ready(p,servers[variant].base);await settle(p);const readyMs=performance.now()-start;await cdp.send('HeapProfiler.collectGarbage');const m=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));timing.push({width,repeat,variant,readyMs,listeners:m.JSEventListeners,heapBytes:m.JSHeapUsedSize});await ctx.close();
  }
  for(const width of [390,1280])for(let repeat=0;repeat<9;repeat++){const rows=timing.filter(r=>r.width===width&&r.repeat===repeat);A.equal(rows[0].listeners,rows[1].listeners);}
  A.equal(cases.length,quick?2:24);const size=s=>({bytes:Buffer.byteLength(s),gzip:zlib.gzipSync(s,{level:9}).length,brotli:zlib.brotliCompressSync(s).length});
  const report={profile:quick?'diagnostic':'full',base:scope.base,cases,comparisons:cases.length*kinds.length,screenshotPairs:quick?4:8,negativeCascadeDetected:true,timing,sizes:{before:size(scope.original),after:size(scope.candidate)},packages:Object.fromEntries(Object.entries(packages).map(([k,p])=>[k,{revision:p.manifest.sourceRevision,bytes:Buffer.byteLength(p.html),resources:p.manifest.resources}]))};
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify(report,null,2)+'\n');console.log(quick?'C4_DIAGNOSTIC_GREEN':'C4_BROWSER_GREEN',JSON.stringify({cases:cases.length,comparisons:report.comparisons,screenshotPairs:report.screenshotPairs}));
 }finally{await browser.close();await Promise.all(Object.values(servers).map(s=>s.close()));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
