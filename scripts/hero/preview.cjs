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
   A.equal(await p.locator('#nomad360-intro > ul > li').count(),3);
   // Read the real localization registry, not a hardcoded expectation.
   await p.evaluate(next=>Nomad360UI.setLanguage(next),lang);
   A.equal(await p.locator('#nomad360-intro .nomad-hero-process-step').count(),3);
   const texts=await p.locator('#nomad360-intro .nomad-hero-process-step').allTextContents();
   A.deepEqual(texts,await p.evaluate(next=>[1,2,3].map(n=>
     Nomad360LocaleCore.t('interface.shell.introStep'+n,next)),lang),
     'RU/EN/KK three-step translation must match visible DOM');
   const process=await p.evaluate(()=>{
     const els=[...document.querySelectorAll('#nomad360-intro .nomad-hero-process-step')];
     const arrows=els.slice(0,2).map(el=>getComputedStyle(el,'::after').borderTopColor);
     const boxes=els.map(el=>{const r=el.getBoundingClientRect();
       return {x:r.left,y:r.top,overflow:el.scrollWidth-el.clientWidth}});
     return {arrows,boxes};
   });
   A.deepEqual(process.arrows,['rgb(255, 145, 63)','rgb(255, 145, 63)'],
     'Both arrows must inherit standard Nomad360 orange CSS');
   A.ok(process.boxes.every(box=>box.overflow<=2),'No step text clips horizontally');
   if(width<=1000)A.ok(process.boxes[0].y<process.boxes[1].y&&process.boxes[1].y<process.boxes[2].y,
     'Stages stack vertically on phone and tablet');
   else A.ok(process.boxes[0].x<process.boxes[1].x&&process.boxes[1].x<process.boxes[2].x,
     'Stages progress horizontally on desktop');
   A.equal(await p.locator('#nomad360-hero .nomad-intro-cta').count(),1);
   A.equal(await p.locator('#nomad360-hero .nomad-intro-cta').getAttribute('href'),'#nomad360-selling-choice');
   A.equal(await p.locator('#nomad360-hero h2').textContent(),await p.evaluate(()=>Nomad360LocaleCore.t('interface.shell.sub',Nomad360UI.getLanguage())));
   A.equal(await p.locator('#nomad360-seo-banner .nomad-seo-logo').getAttribute('src'),await p.locator('#nomad360-header .nomad-logo').getAttribute('src'));
   if(lang==='en'||lang==='kk'){
    const phrase=lang==='en'?'for me?':'айналысқан тиімді?';
    const finalLine=await p.locator('#nomad360-hero h2 .nomad-hero-title-mobile-final').evaluate(el=>{
      const heading=el.parentElement,rect=el.getBoundingClientRect(),full=heading.getBoundingClientRect();
      return {text:el.textContent,display:getComputedStyle(el).display,
        lineHeight:parseFloat(getComputedStyle(heading).lineHeight),
        lineIndex:(rect.top-full.top)/parseFloat(getComputedStyle(heading).lineHeight),
        fits:rect.width<=full.width+1};
    });
    A.equal(finalLine.text,phrase,'Full EN/KK final phrase must be kept intact');
    if(width===390){
      A.equal(finalLine.display,'block','Mobile phrase forms its own line');
      A.ok(Math.abs(finalLine.lineIndex-2)<0.4,
        'EN/KK final phrase must begin on mobile line three');
      A.ok(finalLine.fits,'EN/KK mobile final phrase must fit the heading');
    }
    if(width===1440)A.equal(finalLine.display,'inline','Desktop must retain natural wrapping');
   }

   const geometry=await p.evaluate(()=>{
    const banner=document.querySelector('#nomad360-commercial-banner').getBoundingClientRect();
    const headline=document.querySelector('#nomad360-hero h2').getBoundingClientRect();
    const background=getComputedStyle(document.querySelector('#nomad360-commercial-banner')).backgroundColor;
    const arts=getComputedStyle(document.querySelector('#nomad360-commercial-banner'),'::before').backgroundImage;
    return {bannerWidth:banner.width,headlineRight:headline.right-banner.left,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,background,art:arts};
   });
   if(width===390){
    const mobileVisual=await p.evaluate(()=>{
      const header=document.querySelector('#nomad360-header');
      const h2=document.querySelector('#nomad360-hero h2').getBoundingClientRect();
      const cta=document.querySelector('#nomad360-hero .nomad-intro-cta').getBoundingClientRect();
      const summary=document.querySelector('#nomad360-hero-summary').getBoundingClientRect();
      return {headerBackground:getComputedStyle(header).backgroundColor,
        headlineTop:h2.top,ctaTop:cta.top,summaryTop:summary.top};
    });
    A.equal(mobileVisual.headerBackground,'rgb(23, 59, 88)','Header must join the approved navy hero');
    A.ok(mobileVisual.headlineTop>=95&&mobileVisual.headlineTop<=165,
      'Mobile heading follows approved composition, not the old separate picture strip');
    A.ok(mobileVisual.ctaTop>mobileVisual.headlineTop&&mobileVisual.ctaTop<390,
      'Mobile CTA remains below live text inside scenic composition');
    A.ok(mobileVisual.summaryTop>mobileVisual.ctaTop&&mobileVisual.summaryTop<470,
      'Benefits panel begins below the mobile scenic CTA');
   }
   if(width>=1280){
    const desktopBand=await p.evaluate(()=>{
      const banner=document.querySelector('#nomad360-commercial-banner');
      const scenic=getComputedStyle(banner,'::before');
      const fade=getComputedStyle(banner,'::after');
      const wrapper=banner.getBoundingClientRect();
      const summary=document.querySelector('#nomad360-hero-summary').getBoundingClientRect();
      const summaryStyles=getComputedStyle(document.querySelector('#nomad360-hero-summary'));
      return {sceneHeight:parseFloat(scenic.height),sceneWidth:parseFloat(scenic.width),
        sceneSize:scenic.backgroundSize,fadeHeight:parseFloat(fade.height),
        summaryBg:summaryStyles.backgroundColor,summaryBorder:summaryStyles.borderTopWidth,
        cardTop:summary.top,cardBottom:summary.bottom,bandBottom:wrapper.bottom};
    });
    A.ok(Math.abs(desktopBand.sceneWidth-width)<=2,'Sunset image must span every desktop viewport');
    A.ok(['100%','100% auto'].includes(desktopBand.sceneSize),'Panorama must keep natural aspect ratio; Chromium may canonicalize 100% auto to 100%');
    A.ok(Math.abs(desktopBand.sceneHeight-desktopBand.fadeHeight)<=2,'Navy gradient covers scenic height');
    A.equal(desktopBand.summaryBorder,'0px','Benefits no longer live inside separate bordered card');
    A.equal(desktopBand.summaryBg,'rgba(0, 0, 0, 0)','Benefits live in seamless navy hero backdrop');
    A.ok(desktopBand.cardBottom<=desktopBand.bandBottom+2,
      'Desktop summary content must fit within hero');
   }
   if(width>=1280){
    await p.waitForFunction(()=>{
     const n=document.querySelector('#nomad360-hero h3');
     const c=document.querySelector('#nomad360-hero .nomad-intro-cta');
     const bottom=document.querySelector('#nomad360-hero-summary');
     if(!n||!c||!bottom)return false;
     const upper=c.getBoundingClientRect().top-n.getBoundingClientRect().bottom;
     const lower=bottom.getBoundingClientRect().top-c.getBoundingClientRect().bottom;
     return upper>0&&lower>0&&Math.abs(upper-lower)<=4;
    },{timeout:8000});
    const spacing=await p.evaluate(()=>{
     const narrative=document.querySelector('#nomad360-hero h3').getBoundingClientRect();
     const cta=document.querySelector('#nomad360-hero .nomad-intro-cta').getBoundingClientRect();
     const benefits=document.querySelector('#nomad360-hero-summary').getBoundingClientRect();
     return {above:cta.top-narrative.bottom,below:benefits.top-cta.bottom,
      translate:getComputedStyle(document.querySelector('#nomad360-hero .nomad-intro-cta')).transform};
    });
    A.ok(Math.abs(spacing.above-spacing.below)<=4,'CTA vertically centered between narrative and benefit section in '+lang+' '+width);
    A.ok(spacing.above>=14&&spacing.below>=14,'CTA remains clear of both elements');
   }
   A.equal(geometry.background,'rgb(23, 59, 88)','Main approved navy');
   A.match(geometry.art,/hero-alpenglow-fullbleed\.webp/,'Approved full-bleed scenery layer');
   if(width>=768)A.ok(Math.abs(geometry.bannerWidth-width)<=2,'HERO must be edge-to-edge, not isolated card');
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
    A.deepEqual(await p.locator('#nomad360-intro .nomad-hero-process-step').allTextContents(),
      await p.evaluate(next=>[1,2,3].map(n=>Nomad360LocaleCore.t('interface.shell.introStep'+n,next)),next),
      'Language switching must update all three steps');
   }
   // Windows-style reserved scrollbar gutter must not make the HERO 100vw
   // wide when the document's visible client area is narrower.
   if(lang==='ru'&&width===1440){
    const gutterStyle=await p.addStyleTag({content:'html{scrollbar-gutter:stable!important}'});
    await p.evaluate(()=>window.dispatchEvent(new Event('resize')));
    await p.waitForFunction(()=>{
     const e=document.querySelector('#nomad360-commercial-banner');
     return Math.abs(e.getBoundingClientRect().width-document.documentElement.clientWidth)<2;
    },{timeout:8000});
    const g=await p.evaluate(()=>({
     client:document.documentElement.clientWidth,
     windowWidth:innerWidth,
     hero:document.querySelector('#nomad360-commercial-banner').getBoundingClientRect().width,
     scroll:document.documentElement.scrollWidth
    }));
    A.ok(Math.abs(g.hero-g.client)<2,'Full-bleed HERO excludes reserved Windows scrollbar width');
    A.ok(g.scroll<=g.client+1,'Reserved scrollbar does not create horizontal scrolling');
    await gutterStyle.evaluate(el=>el.remove());
    await p.evaluate(()=>window.dispatchEvent(new Event('resize')));
   }
   cases.push({lang,width,geometry,errors:errors.slice(0,5)});
   await context.close();
  }
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({cases,screens},null,2)+'\n');
  console.log('HERO-03_SCREENSHOTS_DONE',screens.length,'screenshots');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
