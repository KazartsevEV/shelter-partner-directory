'use strict';
// Actual before/after styles on independent SEO, help and legal page families.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),A=require('node:assert/strict');
const {chromium}=require('../palette/node_modules/playwright'),s=require('../../tests/helpers/paint-scope.cjs');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.argv[2]||'artifacts/paint');
const entries=['en/index.html','en/business-idea/index.html','en/cash-flow/index.html','en/pricing/index.html','en/for-consultants/index.html','ru/help/index.html','en/help/index.html','kk/help/index.html','license/index.html','license/en/index.html','license/kk/index.html'];
const widths=[320,360,390,430,768,1280],hash=s.hash;
(async()=>{
 const server=http.createServer((req,res)=>{try{A.equal(req.method,'GET');let rel=decodeURIComponent(new URL(req.url,'http://local').pathname).slice(1);const variant=rel.startsWith('before/')?'before':'after';rel=rel.replace(/^(before|after)\//,'');if(rel.endsWith('/'))rel+='index.html';const file=path.resolve(root,rel);A.ok(file.startsWith(root+path.sep));res.setHeader('Content-Type',({'.html':'text/html','.HTML':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(variant==='before'&&s.sources[rel]?s.sources[rel].before:fs.readFileSync(file));}catch(_){res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,args:['--no-sandbox']}),cases=[];
 try{
 for(const entry of entries)for(const width of widths){const pair={};for(const variant of ['before','after']){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await page.goto(origin+'/'+variant+'/'+entry,{waitUntil:'domcontentloaded'});await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'});await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const data=await page.evaluate(origin=>{const canon=v=>v.replaceAll(origin+'/before/',origin+'/variant/').replaceAll(origin+'/after/',origin+'/variant/');const all=(e,p)=>{const c=getComputedStyle(e,p);return p&&['none','normal'].includes(c.content)?[['content',c.content]]:[...c].sort().map(k=>[k,canon(c.getPropertyValue(k))]);};return {lang:document.documentElement.lang,text:document.body.innerText,overflow:document.documentElement.scrollWidth>innerWidth+1,documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,styles:[...document.querySelectorAll('body *')].filter(e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})).map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,rect:[r.x,r.y,r.width,r.height],style:all(e),before:all(e,'::before'),after:all(e,'::after')};})};},origin);
  A.deepEqual(errors,[]);if(data.overflow)A.match(entry,/^(ru|en|kk)\/help\/index\.html$/,'Only the pre-existing help-page overflow may be observed');let png=null;
  if([320,1280].includes(width)){const name='static-'+entry.replaceAll('/','_')+'-'+width+'-'+variant+'.png';png={file:name,sha256:hash(await page.screenshot({path:path.join(out,name),animations:'disabled'}))};}
  pair[variant]={hash:hash(JSON.stringify(data)),lang:data.lang,nodes:data.styles.length,overflow:data.overflow,documentWidth:data.documentWidth,viewportWidth:data.viewportWidth,png};await context.close();
 }
 A.deepEqual({...pair.before,png:null},{...pair.after,png:null},entry+'/'+width);if(pair.before.png)A.equal(pair.before.png.sha256,pair.after.png.sha256);cases.push({entry,width,...pair});console.log('C58_STATIC_CASE_GREEN',entry,width);
 }
 fs.writeFileSync(path.join(out,'static-protocol.json'),JSON.stringify({base:s.base,cases,comparisons:cases.length,screenshotPairs:cases.filter(x=>x.before.png).length,baselineOverflow:cases.filter(x=>x.before.overflow).map(x=>({entry:x.entry,width:x.width,documentWidth:x.before.documentWidth}))},null,2)+'\n');console.log('C58_STATIC_GREEN',JSON.stringify({pairs:cases.length}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
