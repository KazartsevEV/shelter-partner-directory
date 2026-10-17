'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/seo/evidence');
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.woff2':'font/woff2','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true}),cases=[];
 try{for(const name of ['home-en','pricing-en'])for(const width of [320,390,768,1280]){
  const ctx=await browser.newContext({viewport:{width,height:900},javaScriptEnabled:false}),page=await ctx.newPage(),errors=[],requests=[];
  page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/docs/seo/mockups/'+name+'.html');
  // evaluate is a test inspection even though page scripts are disabled.
  const data=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,lang:document.documentElement.lang,robots:document.querySelector('meta[name=robots]').content,overflow:document.documentElement.scrollWidth>innerWidth+1,text:document.querySelector('main').textContent.length}));
  A.equal(data.h1,1);A.equal(data.lang,'en');A.equal(data.robots,'noindex,nofollow');A.equal(data.overflow,false);A.ok(data.text>700);A.deepEqual(errors,[]);
  A.ok(requests.every(url=>url.startsWith(base+'/')),'Preview must not request external resources');
  A.equal(await page.locator('.intro-logo').getAttribute('src'),'../../../nomad360_wolf_open_circle.png');
  A.equal(requests.filter(u=>u.endsWith('/nomad360_wolf_open_circle.png')).length,1,'One existing logo request shared with header');
  await page.keyboard.press('Tab');A.equal(await page.locator('nav a').first().evaluate(e=>e===document.activeElement),true);
  A.equal(await page.locator('nav a').first().evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
  for(const a of await page.locator('a[href]').all()){
   const href=await a.getAttribute('href');if(href.startsWith('https:')){A.match(href,/\/shelter-partner-directory\/Marketing_calc.HTML#nomad360-selling-choice$/);continue;}
   A.equal((await page.request.get(new URL(href,page.url()).href)).status(),200);
  }
  let screenshot=null;if([390,1280].includes(width)){screenshot=`mock-${name}-${width}.png`;await page.screenshot({path:path.join(out,screenshot),fullPage:true});}
  cases.push({name,width,...data,requests:requests.length,screenshot});await ctx.close();
 }fs.writeFileSync(path.join(out,'mockups-check.json'),JSON.stringify({cases},null,2)+'\n');console.log('SEO_PHASE_A_MOCKUPS_GREEN',JSON.stringify({cases:cases.length,screenshots:cases.filter(c=>c.screenshot).length}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
