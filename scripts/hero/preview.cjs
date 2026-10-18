'use strict';
/* HERO-03 visual receipts: render the actual production HTML, unchanged scenic pixels. */
const A=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'artifacts/hero-03');
fs.mkdirSync(out,{recursive:true});
const mime={'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
(async()=>{
 const server=http.createServer((req,res)=>{
  const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');
  fs.createReadStream(p).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const cases=[],screens=[];
 try{
  for(const lang of ['ru','en','kk'])for(const width of [320,390,768,1280,1440]){
   const context=await browser.newContext({locale:lang==='ru'?'ru-RU':lang==='kk'?'kk-KZ':'en-US',viewport:{width,height:1750},reducedMotion:'reduce'});
   const p=await context.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.route(/^https?:\/\//,route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await p.goto(base+'/Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
   await p.addStyleTag({path:path.join(out,'utilities.css')});
   await p.evaluate(()=>document.fonts.ready);
   await p.waitForFunction(()=>document.querySelector('.nomad-seo-logo')?.complete&&document.querySelector('.nomad-seo-logo')?.naturalWidth>0);
   await p.waitForTimeout(100);
   A.equal(await p.locator('#nomad360-commercial-banner').count(),1);
   A.equal(await p.locator('#nomad360-seo-banner .nomad-seo-copy').count(),0,'No duplicated SEO promotion');
   A.equal(await p.locator('#nomad360-intro li').count(),3);
   A.equal(await p.locator('#nomad360-hero .nomad-intro-cta').count(),1);
   A.equal(await p.locator('#nomad360-hero .nomad-intro-cta').getAttribute('href'),'#nomad360-selling-choice');
   A.equal(await p.locator('#nomad360-hero h2').textContent(),await p.evaluate(()=>Nomad360LocaleCore.t('interface.shell.sub',Nomad360UI.getLanguage())));
   A.equal(await p.locator('#nomad360-seo-banner .nomad-seo-logo').getAttribute('src'),await p.locator('#nomad360-header .nomad-logo').getAttribute('src'));
   const geometry=await p.evaluate(()=>{
    const banner=document.querySelector('#nomad360-commercial-banner').getBoundingClientRect();
    const headline=document.querySelector('#nomad360-hero h2').getBoundingClientRect();
    const background=getComputedStyle(document.querySelector('#nomad360-commercial-banner')).backgroundColor;
    const arts=getComputedStyle(document.querySelector('#nomad360-commercial-banner'),'::before').backgroundImage;
    return {bannerWidth:banner.width,headlineRight:headline.right-banner.left,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,background,art:arts};
   });
   A.equal(geometry.background,'rgb(23, 59, 88)','Main approved navy');
   A.match(geometry.art,/hero\.webp/,'Approved scenery layer');
   A.ok(geometry.scrollWidth<=width+1,'No horizontal page scroll');
   if(width>=768)A.ok(geometry.headlineRight < geometry.bannerWidth*.60,'Headline must remain left of opaque scenery');
   const f=lang+'-'+width+'-hero.png';
   await p.locator('#nomad360-commercial-banner').screenshot({path:path.join(out,f)});
   screens.push(f);
   if(width===390||width===1440){
    const full=lang+'-'+width+'-home.png';
    await p.locator('#home-screen').screenshot({path:path.join(out,full)});
    screens.push(full);
    // Capture the real header alongside the hero; the home-screen element
    // screenshot excludes the separately mounted site header.
    const pageView=lang+'-'+width+'-viewport.png';
    await p.screenshot({path:path.join(out,pageView)});
    screens.push(pageView);
   }
   if(width===390){
    const next=lang==='ru'?'en':lang==='en'?'kk':'ru';
    await p.evaluate(next=>Nomad360UI.setLanguage(next),next);
    A.equal(await p.locator('#nomad360-hero h2').textContent(),await p.evaluate(()=>Nomad360LocaleCore.t('interface.shell.sub',Nomad360UI.getLanguage())));
    A.equal(await p.locator('#nomad360-seo-banner .nomad-seo-logo').count(),1,'Logo preserved across language changes');
    A.equal(await p.locator('#nomad360-hero .nomad-intro-cta').count(),1);
   }
   cases.push({lang,width,geometry,errors:errors.slice(0,5)});
   await context.close();
  }
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({cases,screens},null,2)+'\n');
  console.log('HERO-03_SCREENSHOTS_DONE',screens.length,'screenshots');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
