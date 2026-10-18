'use strict';
/* IRBIS-07: real Chromium screenshots and interaction assertions; NEVER transfer money. */
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'artifacts/irbis-07');
fs.mkdirSync(out,{recursive:true});
for(const [file,sha] of [
 ['assets/nomad360-banners/support-wide.webp','937c35a1c0e0e5203c9cd949789219e1cbe0d541'],
 ['assets/nomad360-banners/support-mobile.webp','30db5bffa26f3e1f6cc3f6370fe95648e84e4362']
])A.equal(execFileSync('git',['hash-object',file],{cwd:root,encoding:'utf8'}).trim(),sha,'No changes to the approved snow-leopard image');
const types={'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon'};
(async()=>{
 const server=http.createServer((req,res)=>{
  const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');
  fs.createReadStream(p).pipe(res);
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
  for(const lang of ['ru','en','kk'])for(const width of [320,360,390,430,768,1280,1440]){
   const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',acceptDownloads:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
   await page.goto(base+'/Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
   await page.addStyleTag({path:path.join(out,'utilities.css')});
   await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(language=>window.Nomad360UI.setLanguage(language),lang);
   await page.waitForFunction(language=>document.documentElement.lang===language&&!!document.querySelector('#nomad360-irbis-banner'),lang);
   const banner=page.locator('#nomad360-irbis-banner');
   A.equal(await banner.count(),1);
   A.equal(await page.locator('#nomad360-return').count(),1);
   A.equal(await page.locator('#nomad360-support').count(),1);
   A.equal(await page.locator('#nomad360-product-details').count(),1);
   A.deepEqual(await banner.locator('[data-return-platform]').evaluateAll(xs=>xs.map(x=>x.dataset.returnPlatform)),['windows','ios','android']);
   A.equal(await banner.locator('.nomad-irbis-platform-icon').count(),3);
   const actualTitle=await banner.locator('#nomad360-return h2').textContent();
   const expected=await page.evaluate(()=>window.Nomad360LocaleCore.t('return.title'));
   A.equal(actualTitle,expected,'Existing localized title must remain exact');
   A.equal(await banner.locator('.nomad-return-note').count(),2);
   const support=banner.locator('#nomad360-irbis-support-disclosure'),projects=banner.locator('#nomad360-product-details');
   A.equal(await support.getAttribute('open'),null,'Donations collapsed initially');
   A.equal(await projects.getAttribute('open'),null,'Project details collapsed initially');
   const bg=await banner.evaluate(e=>({
    scene:getComputedStyle(e,'::before').backgroundImage,
    phone:getComputedStyle(e.querySelector('.nomad-irbis-mobile-art')).backgroundImage,
    footer:getComputedStyle(e).backgroundColor,
    scroll:document.documentElement.scrollWidth,viewport:innerWidth,
    buttons:[...e.querySelectorAll('[data-return-platform]')].map(x=>{const r=x.getBoundingClientRect();return {width:r.width,right:r.right};})
   }));
   A.equal(bg.footer,'rgb(23, 59, 88)');
   A.ok(bg.scene.includes('support-wide.webp'),'Use exact approved wide art');
   if(width<=700)A.ok(bg.phone.includes('support-mobile.webp'),'Display separate text-free mobile art');
   A.ok(bg.scroll<=bg.viewport+2,'No horizontal viewport overflow');
   A.ok(bg.buttons.every(x=>x.width>44&&x.right<=bg.viewport+2),'Shortcuts must fit viewport');
   if(lang==='ru')await banner.screenshot({path:path.join(out,'ru-'+width+'-closed.png')});
   await support.locator('summary').click();
   A.equal(await support.getAttribute('open'),'','Genuine details disclosure');
   A.equal(await banner.locator('iframe.nomad-crypto-frame').count(),1,'Actual NOWPayments iframe retained');
   A.equal(await banner.locator('.nomad-pay-kaspi').count(),1,'Kaspi retained');
   A.equal(await banner.locator('.nomad-pay-bank').count(),1,'SWIFT/IBAN retained');
   A.ok((await banner.locator('[data-nomad-copy],.nomad-copy').count())>0,'Copy controls retained');
   if(lang==='ru')await banner.screenshot({path:path.join(out,'ru-'+width+'-support-open.png')});
   // No duplicated text or newly invented locale strings: after switching, all
   // disclosure state and payment fields continue to belong to the real header.
   const next=lang==='ru'?'en':'ru';
   await page.evaluate(x=>window.Nomad360UI.setLanguage(x),next);
   await page.waitForFunction(x=>document.documentElement.lang===x,next);
   A.equal(await page.locator('#nomad360-irbis-support-disclosure').getAttribute('open'),'','Open state survives language switch');
   A.equal(await page.locator('#nomad360-irbis-banner').count(),1);
   A.equal(await page.locator('#nomad360-return h2').textContent(),await page.evaluate(()=>window.Nomad360LocaleCore.t('return.title')));
   await page.locator('#nomad360-irbis-support-disclosure summary').click();
   await page.locator('#nomad360-return [data-return-platform="ios"]').click();
   A.equal(await page.locator('#nomad360-return-help').evaluate(e=>e.open),true,'Actual iOS help works');
   await page.keyboard.press('Escape');
   A.deepEqual(errors,[],'No uncaught errors');
   results.push({width,lang,buttons:3,payments:true,sourceArt:true,languageState:true,errors});
   await context.close();
  }
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({result:'PASS',cases:results},null,2)+'\n');
  console.log('IRBIS_07_PASS',results.length);
 }finally{await browser.close();await new Promise(done=>server.close(done));}
})().catch(error=>{console.error(error);process.exitCode=1;});
