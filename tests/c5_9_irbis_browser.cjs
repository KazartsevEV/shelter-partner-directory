// CSS-only paired browser oracle for C5-9: two HTML entrypoints, three locales,
// real responsive boundaries and actual footer/banner. No financial/runtime edits.
'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {chromium}=require('../scripts/palette/node_modules/playwright');
const root=path.resolve(__dirname,'..'),cssName='nomad360_irbis_banner.css';
const beforeCss=execFileSync('git',['show','050bce789259867096d2d312e5b0dbea51454d5d:'+cssName],{encoding:'utf8',maxBuffer:24e6});
const selects=['#nomad360-irbis-banner','#nomad360-irbis-banner #nomad360-return','#nomad360-irbis-banner #nomad360-return h2','#nomad360-irbis-banner .nomad-irbis-mobile-art','#nomad360-irbis-banner #nomad360-product-details[open]','#nomad360-irbis-banner .nomad-irbis-methods'];
const server=http.createServer((req,res)=>{
 try{
  if(req.method!=='GET')throw Error('method');
  const u=new URL(req.url,'http://localhost'),bits=decodeURIComponent(u.pathname).split('/').filter(Boolean);
  const variant=bits.shift(),rel=bits.join('/');
  if(!['before','after'].includes(variant)||!rel)throw Error('route');
  const resolved=path.resolve(root,rel);
  if(!resolved.startsWith(root+path.sep)||!fs.statSync(resolved).isFile())throw Error('file');
  res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'application/javascript','.woff2':'font/woff2','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(rel).toLowerCase()]||'application/octet-stream');
  res.end(variant==='before'&&rel===cssName?beforeCss:fs.readFileSync(resolved));
 }catch(error){res.writeHead(404);res.end();}
});
const capture=async page=>page.evaluate(selects=>{
 const result={};
 for(const selector of selects){
  result[selector]=[...document.querySelectorAll(selector)].map(e=>{
   const c=getComputedStyle(e),r=e.getBoundingClientRect(),canonical=v=>v.replaceAll(location.origin+'/before/',location.origin+'/variant/').replaceAll(location.origin+'/after/',location.origin+'/variant/');
   return {tag:e.tagName,hidden:!e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}),
      style:[...c].sort().map(prop=>[prop,canonical(c.getPropertyValue(prop))]),
      rect:[r.x,r.y,r.width,r.height],text:e.textContent?.trim()};
  });
 }
 return {result,lang:document.documentElement.lang,domCount:document.querySelectorAll('body *').length};
},selects);
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port, browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let cases=0;
 try{
 for(const entry of ['Marketing_calc.HTML','US_Retail_Demo.HTML'])for(const width of [320,390,600,601,1280])for(const lang of ['ru','en','kk']){
  const pair={};
  for(const variant of ['before','after']){
   const context=await browser.newContext({viewport:{width,height:940},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
   await page.goto(origin+'/'+variant+'/'+entry,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.Nomad360UI&&document.readyState==='complete');
   await page.locator('#nomad360-lang-select').selectOption(lang);
   await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   pair[variant]=await capture(page);
   A.deepEqual(errors,[],entry+'/'+variant+'/'+lang);
   await context.close();
  }
  A.deepEqual(pair.before,pair.after,entry+'/'+width+'/'+lang);
  cases++;
 }
 console.log('C59_BROWSER_GREEN',JSON.stringify({cases,selectors:selects.length,cssOnly:true,baseline:'050bce7'}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error('C59_BROWSER_RED',e.stack||e);process.exitCode=1});
