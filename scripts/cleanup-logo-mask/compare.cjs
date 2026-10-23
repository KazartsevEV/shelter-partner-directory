'use strict';
// C2 paired presentation check. Source fixtures and financial formulae are unchanged.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),A=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {chromium}=require('../palette/node_modules/playwright'),scope=require('../../tests/helpers/cleanup-logo-mask-scope.cjs'),{buildPackage}=require('../partners/build.cjs');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.argv[2]||'artifacts/cleanup-c2'),baselineRoot=process.env.C2_BASELINE_ROOT;
const widths=[320,360,390,430,599,600,601,660,768,1199,1200,1280],languages=['ru','en','kk'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function settle(page){await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function snapshot(page){
 await settle(page);
 return page.evaluate(()=>{
  const selectors=['.nomad-header .nomad-logo-mask','.nomad-seo-brand','.nomad-seo-logo-mask','.nomad-seo-logo-mask .nomad-seo-logo','.nomad-embed-b2b-logo-mask','.nomad-embed-b2b-logo-mask img'];
  const logos=selectors.flatMap(selector=>[...document.querySelectorAll(selector)].map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {selector,styles:[...s].sort().map(p=>[p,s.getPropertyValue(p)]),rect:[r.x,r.y,r.width,r.height],natural:e instanceof HTMLImageElement?[e.naturalWidth,e.naturalHeight]:null};}));
  const props=['display','position','width','height','min-width','max-width','padding','margin','gap','grid-template-columns','color','background-color','font-family','font-size','line-height','transform','overflow'];
  const visible=[...document.querySelectorAll('body *')].filter(e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})).map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,rect:[r.x,r.y,r.width,r.height],style:props.map(p=>s.getPropertyValue(p))};});
  const probe=document.createElement('div');probe.className='nomad-seo-logo-mask';probe.style.position='fixed';probe.style.left='-9999px';document.body.append(probe);const s=getComputedStyle(probe),fallback={width:s.width,height:s.height,background:s.backgroundColor,radius:s.borderRadius};probe.remove();
  return {logos,visible,domCount:document.querySelectorAll('body *').length,fallback,overflow:document.documentElement.scrollWidth>innerWidth+1};
 });
}
(async()=>{
 A.ok(baselineRoot,'Set C2_BASELINE_ROOT to a clean accepted checkout');A.equal(fs.readFileSync(path.join(baselineRoot,scope.file),'utf8'),scope.original);fs.mkdirSync(out,{recursive:true});
 const css=path.join(out,'utilities.css');A.ok(fs.existsSync(css),'Compile pinned utilities');const launch=()=>chromium.launch({headless:true,args:['--no-sandbox']});
 const config=require('../../tests/fixtures/partner-build/example.json'),before=await buildPackage(config,{repositoryRoot:baselineRoot,browserFactory:launch}),after=await buildPackage(config,{browserFactory:launch}),packages={before,after};
 const unchanged=p=>p.manifest.resources.filter(r=>r.path!==scope.file).sort((a,b)=>a.path.localeCompare(b.path));A.deepEqual(unchanged(before),unchanged(after));
 A.equal(Buffer.byteLength(before.html)-Buffer.byteLength(after.html),Buffer.byteLength(scope.removed));
 const server=http.createServer((req,res)=>{try{const url=new URL(req.url,'http://local');let rel=decodeURIComponent(url.pathname).slice(1),variant=rel.startsWith('before/')?'before':'after';rel=rel.replace(/^(before|after)\//,'').replace(/^shelter-partner-directory\//,'');if(req.method!=='GET')throw Error('GET only');
 if(rel==='standalone.html'){res.setHeader('Content-Type','text/html');return res.end(packages[variant].html);}const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile())throw Error('file');res.setHeader('Content-Type',({'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(rel===scope.file&&variant==='before'?scope.original:fs.readFileSync(file));}catch(_){res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,browser=await launch(),cases=[],timing=[];
 try{
  for(const entry of ['Marketing_calc.HTML','US_Retail_Demo.HTML','standalone.html'])for(const width of entry==='standalone.html'?[320,600,601,1280]:widths)for(const language of languages){
   const pair={};
   for(const variant of ['before','after']){
    const ctx=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
    await page.goto(origin+'/'+variant+'/'+entry+'?lang='+language,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});await page.waitForFunction(()=>window.Nomad360UI&&document.querySelector('.nomad-seo-logo-mask'));
    await page.locator('#nomad360-lang-select').selectOption(language);await page.evaluate(()=>showHome());
    const image=page.locator('.nomad-seo-logo-mask img');await image.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll('.nomad-logo-mask img,.nomad-seo-logo-mask img')].every(x=>x.complete&&x.naturalWidth>0));await page.evaluate(()=>scrollTo(0,0));await settle(page);
    const rows=[];
    for(const view of ['home','menu','embed']){
     if(view==='menu'){const button=page.locator('#nomad360-header .nomad-burger');if(await button.isVisible()){await button.click();await page.waitForFunction(()=>document.querySelector('#nomad360-header .nomad-burger').getAttribute('aria-expanded')==='true');}else await page.locator('#nomad360-header a').first().focus();}
     if(view==='embed'){await page.keyboard.press('Escape');await page.locator('[data-nomad-embed-toggle]').click();}
     const data=await snapshot(page);A.equal(data.overflow,false,[entry,width,language,variant,view].join('/'));A.equal(data.fallback.width,(width<=600?64:140)+'px');A.equal(data.fallback.height,data.fallback.width);A.equal(data.fallback.background,'rgb(255, 255, 255)');A.equal(data.fallback.radius,'50%');
     let screenshot=null;if(view==='home'&&entry==='Marketing_calc.HTML'&&[320,600,601,1280].includes(width)){const name=language+'-'+width+'-'+variant+'.png';const bytes=await page.locator('#nomad360-seo-banner').screenshot({path:path.join(out,name),animations:'disabled',caret:'hide'});screenshot={file:name,sha256:hash(bytes)};}
     rows.push({view,domNodes:data.domCount,visibleNodes:data.visible.length,logoHash:hash(JSON.stringify(data.logos)),visibleHash:hash(JSON.stringify(data.visible)),fallback:data.fallback,screenshot});
    }
    A.deepEqual(errors,[]);pair[variant]=rows;await ctx.close();
   }
   for(let i=0;i<pair.before.length;i++){const a=pair.before[i],b=pair.after[i];A.deepEqual({...a,screenshot:null},{...b,screenshot:null},[entry,width,language,a.view].join('/'));if(a.screenshot)A.equal(a.screenshot.sha256,b.screenshot.sha256,'unchanged PNG');}
   cases.push({entry,width,language,before:pair.before,after:pair.after});console.log('C2_CASE_GREEN',entry,width,language);
  }
  for(const width of [390,1280])for(let repeat=0;repeat<3;repeat++)for(const variant of repeat%2?['after','before']:['before','after']){
   const ctx=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'}),page=await ctx.newPage(),cdp=await ctx.newCDPSession(page);await cdp.send('Performance.enable');await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());const start=performance.now();await page.goto(origin+'/'+variant+'/Marketing_calc.HTML?lang=ru',{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});await page.waitForFunction(()=>window.Nomad360UI&&document.querySelector('.nomad-seo-logo-mask'));await settle(page);const readyMs=performance.now()-start;await cdp.send('HeapProfiler.collectGarbage');const m=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));timing.push({width,repeat,variant,readyMs,listeners:m.JSEventListeners,heapBytes:m.JSHeapUsedSize});await ctx.close();
  }
  for(const width of [390,1280])for(let repeat=0;repeat<3;repeat++){const pair=timing.filter(x=>x.width===width&&x.repeat===repeat);A.equal(pair[0].listeners,pair[1].listeners);}
  const size=s=>({bytes:Buffer.byteLength(s),gzip:zlib.gzipSync(s,{level:9}).length,brotli:zlib.brotliCompressSync(s).length});A.equal(cases.length,84);
  const report={base:scope.base,cases,comparisons:cases.length*3,screenshotPairs:12,sizes:{before:size(scope.original),after:size(scope.candidate)},timing,packages:Object.fromEntries(Object.entries(packages).map(([k,p])=>[k,{revision:p.manifest.sourceRevision,bytes:Buffer.byteLength(p.html),resources:p.manifest.resources}]))};fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify(report,null,2)+'\n');console.log('C2_BROWSER_GREEN',JSON.stringify({cases:84,comparisons:252,screenshotPairs:12}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
