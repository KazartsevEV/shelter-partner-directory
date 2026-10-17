'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),A=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/codex-first-banner-r2-cta');
fs.mkdirSync(out,{recursive:true});
const types={'.HTML':'text/html','.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port+'/',browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const widths=[320,360,390,430,768,1280,1440],langs=['ru','en','kk'],all=[];
 const expected={ru:'↓ Рассчитать',en:'↓ Calculate',kk:'↓ Есептеу'};
 try{for(const lang of langs)for(const width of widths){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce',deviceScaleFactor:1});
   const errors=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))missing.push(r.url());});
   await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
   try{
     await page.goto(origin+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
     await page.locator('#nomad360-lang-select').selectOption(lang);
     await page.waitForFunction(l=>document.documentElement.lang===l&&document.querySelector('#nomad360-commercial-banner .nomad-intro-cta')?.textContent.trim().length>0,lang,{timeout:25000});
     await page.waitForFunction(()=>document.querySelector('.nomad-seo-logo')?.src.startsWith('data:image/png;base64,'),null,{timeout:25000});
     await page.evaluate(()=>document.fonts.ready);
     const state=await page.evaluate(()=>{
       const banner=document.querySelector('#nomad360-commercial-banner'),hero=banner.querySelector('#nomad360-hero'),
         art=getComputedStyle(banner,'::before'),cta=hero.querySelector('.nomad-intro-cta'),sub=hero.querySelector('h3'),
         intro=banner.querySelector('#nomad360-intro'),logo=banner.querySelector('.nomad-seo-logo'),
         r=e=>e.getBoundingClientRect(),css=e=>getComputedStyle(e);
       const ctar=r(cta),subr=r(sub),hr=r(hero),br=r(banner);
       const value=n=>Math.round(n*10)/10;
       return {
         lang:document.documentElement.lang,width:innerWidth,heroWidth:value(br.width),
         label:cta.textContent.trim(),href:cta.getAttribute('href'),
         arrow:cta.textContent.trim().charAt(0),
         topGap:value(ctar.top-subr.bottom),bottomGap:value(hr.bottom-ctar.bottom),
         bannerLeft:value(br.left),bannerRight:value(br.right),
         photo:art.backgroundImage.includes('hero.webp'),
         sceneryAtTop:art.backgroundPosition,
         navy:getComputedStyle(banner).backgroundColor,orange:css(cta).backgroundColor,ctaText:css(cta).color,
         imageSrc:logo.getAttribute('src')?.slice(0,30),
         numBenefits:intro.querySelectorAll('li').length,
         saleAnchor:!!document.querySelector('#nomad360-selling-choice'),
         overflow:document.documentElement.scrollWidth-innerWidth,
         financialInputs:document.querySelectorAll('[id^="product-"],[id^="portfolio-"]').length,
         mobileComposition:{
           topPad:parseFloat(css(banner).paddingTop),
           imageBetweenHeadlineAndCopy:css(sub,'::before').backgroundImage.includes('hero.webp'),
           sceneryLead:parseFloat(css(sub).paddingTop),
           headingEndsBeforeCopy:r(hero.querySelector('h2')).bottom<r(sub).bottom,
           sceneryPseudoHeight:css(sub,'::before').height,
           captionStartsAt:Math.round(r(sub).top),
           titleTop:Math.round(r(hero.querySelector('h2')).top)
         }
       };
     });
     A.deepEqual(errors,[],'JS runtime '+lang+width);A.deepEqual(missing,[],'assets '+lang+width);
     A.equal(state.label,expected[lang],'short localized CTA '+lang+width);
     A.equal(state.href,'#nomad360-selling-choice');
     A.ok(Math.abs(state.topGap-state.bottomGap)<=2,'CTA must be centered between narrative and divider '+JSON.stringify(state));
     A.equal(state.navy,'rgb(23, 59, 88)');
     A.equal(state.orange,'rgb(255, 145, 63)');
     A.equal(state.ctaText,'rgb(23, 59, 88)');
     A.ok(state.photo&&state.numBenefits===3&&state.saleAnchor);
     if(width<=600){
       A.ok(state.mobileComposition.topPad<=24,'no invented top scenery panel');
       A.ok(state.mobileComposition.imageBetweenHeadlineAndCopy,'preserve Codex image between headline and description');
       A.equal(state.mobileComposition.sceneryLead,150,'keep original 150px scenery slot');
       A.ok(state.mobileComposition.headingEndsBeforeCopy,'headlines precede narrative');
     }
     A.ok(state.imageSrc?.startsWith('data:image/png'),'recolor existing wolf only');
     A.ok(state.bannerLeft>=-1&&state.bannerRight<=width+1,'not clipped '+lang+width);
     await page.locator('#nomad360-commercial-banner').screenshot({path:path.join(out,lang+'-'+width+'-banner.png')});
     if(lang==='ru')await page.screenshot({path:path.join(out,lang+'-'+width+'-viewport.png')});
     await page.locator('#nomad360-commercial-banner .nomad-intro-cta').click();
     const nav=await page.evaluate(()=>({hash:location.hash,target:!!document.querySelector('#nomad360-selling-choice')}));
     A.ok(nav.hash==='#nomad360-selling-choice'&&nav.target,'live CTA navigation');
     all.push({...state,nav});
     console.log('CODEX_R2_FIRST_HERO_OK '+lang+' '+width+' top/bottom gap '+state.topGap+'/'+state.bottomGap);
   }finally{await page.close();}
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(all,null,2)+'\n');
 A.equal(all.length,21);console.log('CODEX_R2_FIRST_HERO_GREEN 21/21');
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
