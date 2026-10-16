'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'../..'),out=path.join(root,'artifacts/seo-banner');fs.mkdirSync(out,{recursive:true});
const win={};new Function('window','document',execFileSync('git',['show','85d98d9:nomad360_locale_core.js'],{cwd:root,encoding:'utf8'}))(win,{readyState:'loading',addEventListener(){}});const original=win.Nomad360LocaleCore;
(async()=>{
 let portable='';const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/portable.html'){res.setHeader('Content-Type','text/html');return res.end(portable);}
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.HTML':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true}),cases=[],exports=[];
 try{for(const lang of ['ru','en','kk'])for(const width of [320,360,390,430,768,1280,1440]){
  const ctx=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true,reducedMotion:'reduce'}),p=await ctx.newPage(),errors=[],requests=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
  await ctx.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await p.goto(base+'Marketing_calc.HTML?lang='+lang);await p.addStyleTag({path:path.join(root,'artifacts/seo-banner-utilities.css')});await p.evaluate(()=>document.fonts.ready);
  A.deepEqual(await p.locator('#nomad360-hero h1,#nomad360-hero h2,#nomad360-hero h3').allTextContents(),['headline','sub','narrative'].map(k=>original.t('interface.shell.'+k,lang)),'The exact original offer must stay intact');
  const banner=p.locator('#nomad360-seo-banner');await banner.scrollIntoViewIfNeeded();
  A.equal(await p.locator('#nomad360-calculation-list').count(),0,'The previous six-point block is removed');
  A.equal(await banner.locator('li').count(),3);A.equal(await banner.locator('h2').count(),1);A.equal(await banner.locator('p').count(),1);
  for(const [selector,key] of [['h2','interface.shell.introLead'],['p','interface.shell.introResult']])A.equal(await banner.locator(selector).textContent(),await p.evaluate(([key,lang])=>Nomad360LocaleCore.t(key,lang),[key,lang]));
  await p.waitForFunction(()=>document.querySelector('.nomad-seo-logo')?.complete&&document.querySelector('.nomad-seo-logo')?.naturalWidth===1024);
  A.equal(await banner.locator('img').getAttribute('src'),await p.locator('#nomad360-header .nomad-logo').getAttribute('src'));
  A.equal(requests.filter(u=>u.endsWith('/nomad360_wolf_open_circle.png')).length,1,'One shared original image URL');
  const geometry=await banner.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el.querySelector('p')).color,font:parseFloat(getComputedStyle(el.querySelector('p')).fontSize),overflow:document.documentElement.scrollWidth>innerWidth+1,clipped:[...el.querySelectorAll('h2,p')].some(e=>e.scrollWidth>e.clientWidth+1)}));
  A.equal(geometry.background,'rgb(22, 55, 90)');A.equal(geometry.color,'rgb(255, 255, 255)');A.ok(geometry.font>=17);A.equal(geometry.overflow,false);A.equal(geometry.clipped,false);
  A.deepEqual(await p.evaluate(()=>Nomad360LocaleCore.auditVisibleGaps()),[]);A.deepEqual(errors,[]);
  const files=[];if([320,1280].includes(width)){const name=`${lang}-${width}-banner.png`;await banner.screenshot({path:path.join(out,name)});files.push(name);}if(width===390){const name=`${lang}-390-home.png`;await p.locator('#home-screen').screenshot({path:path.join(out,name)});files.push(name);}
  if(width===390){
   await p.locator('.nomad-intro-cta').click();A.equal(await p.locator('#nomad360-selling-choice').isVisible(),true);await p.locator('[data-nomad-embed-toggle]').click();
   let wait=p.waitForEvent('download');await p.locator('[data-nomad-download-html]').click();const d=await wait;A.equal(await d.failure(),null);portable=fs.readFileSync(await d.path(),'utf8');
   const saved=await ctx.newPage();await saved.goto(base+'portable.html?lang='+lang);await saved.addStyleTag({path:path.join(root,'artifacts/seo-banner-utilities.css')});await saved.locator('#nomad360-seo-banner').scrollIntoViewIfNeeded();
   await saved.waitForFunction(()=>document.querySelector('.nomad-seo-logo')?.complete&&document.querySelector('.nomad-seo-logo')?.naturalWidth===1024);
   A.match(await saved.locator('.nomad-seo-logo').getAttribute('src'),/^data:image/);A.equal(await saved.locator('.nomad-seo-logo').getAttribute('src'),await saved.locator('#nomad360-header .nomad-logo').getAttribute('src'));
   A.deepEqual(await saved.locator('#nomad360-hero h1,#nomad360-hero h2,#nomad360-hero h3').allTextContents(),['headline','sub','narrative'].map(k=>original.t('interface.shell.'+k,lang)));
   A.equal(await saved.locator('#nomad360-seo-banner p').textContent(),await p.locator('#nomad360-seo-banner p').textContent());exports.push({lang,portableLogoAndOffer:true});await saved.close();
  }
  cases.push({lang,width,geometry,originalOffer:true,sharedLogo:true,files});await ctx.close();
 }fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({cases,exports},null,2)+'\n');console.log('SEO_ORIGINAL_OFFER_BANNER_GREEN',JSON.stringify({cases:cases.length,screenshots:cases.flatMap(c=>c.files).length,exports:exports.length}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
