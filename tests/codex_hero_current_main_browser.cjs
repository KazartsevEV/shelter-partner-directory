'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/codex-hero-audit');
const types={'.HTML':'text/html','.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const marker='<link rel="stylesheet" href="./nomad360_palette.css">';
const bannerCSS='<link rel="stylesheet" href="./artifacts/codex-hero-audit/codex-hero.css">';
const bridgeCSS='<link rel="stylesheet" href="./nomad360_banner_theme_bridge.css">';
const bannerJS='<script src="./artifacts/codex-hero-audit/codex-hero.js"></script>';
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
 if(path.basename(file)==='Marketing_calc.HTML'){
   let html=fs.readFileSync(file,'utf8');
   if(new URL(req.url,'http://local').searchParams.has('baseline'))return res.end(html);
   A.ok(html.includes(marker)&&html.includes('</body>'));
   html=html.replace(marker,marker+'\n'+bannerCSS+'\n'+bridgeCSS).replace('</body>',bannerJS+'\n</body>');
   return res.end(html);
 }
 fs.createReadStream(file).pipe(res);
});
function eqHex(value){const m=value.match(/\d+/g)||[];return m.slice(0,3).join(',');}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port+'/',browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const records=[];
 const viewports=[{"width":320,"height":568},{"width":360,"height":640},{"width":375,"height":667},{"width":390,"height":844},{"width":393,"height":873},{"width":414,"height":896},{"width":430,"height":932},{"width":600,"height":960},{"width":768,"height":1024},{"width":820,"height":1180},{"width":1024,"height":768},{"width":1280,"height":720},{"width":1280,"height":800},{"width":1366,"height":768},{"width":1440,"height":900},{"width":1536,"height":864},{"width":1600,"height":900},{"width":1920,"height":1080},{"width":2560,"height":1440},{"width":3440,"height":1440}];
 try{for(const lang of ['ru','en','kk'])for(const {width,height} of viewports){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',deviceScaleFactor:1});
  const page=await context.newPage(),errors=[],bad=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))bad.push({status:r.status(),url:r.url().split('/').at(-1)});});
  await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  await page.goto(origin+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#nomad360-commercial-banner',{timeout:25000});
  await page.locator('#nomad360-lang-select').selectOption(lang);
  await page.waitForFunction(l=>document.documentElement.lang===l&&!!document.querySelector('#nomad360-commercial-banner #nomad360-hero h2'),lang,{timeout:25000});
  await page.evaluate(()=>document.fonts.ready);
  const state=await page.evaluate(()=>{
   const banner=document.querySelector('#nomad360-commercial-banner'),hero=banner.querySelector('#nomad360-hero'),
      intro=banner.querySelector('#nomad360-intro'),cta=hero.querySelector('.nomad-intro-cta'),
      logo=banner.querySelector('.nomad-seo-logo'),originalSeo=document.querySelector('.nomad-seo-copy'),
      accent=hero.querySelector('.nomad-hero-title-accent'),
      style=(x,p)=>getComputedStyle(x)[p],
      rect=x=>{let r=x.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}},
      css=getComputedStyle(banner);
   const fold=(x)=>{if(!x)return null;
    const r=x.getBoundingClientRect(),rects=[...x.getClientRects()];
    const tops=rects.length?rects.map(z=>z.top):[r.top],bottoms=rects.length?rects.map(z=>z.bottom):[r.bottom];
    const top=Math.min(...tops),bottom=Math.max(...bottoms),visible=getComputedStyle(x).visibility!=='hidden'&&getComputedStyle(x).display!=='none';
    return {top:Math.round(top),bottom:Math.round(bottom),status:!visible?'hidden':top>=0&&bottom<=innerHeight?'full':top<innerHeight&&bottom>0?'partial':bottom<=0?'above':'below'};
   };
   const benefitRows=[...intro.querySelectorAll('li')];
   const foldParts={
      navigation:fold(document.querySelector('#nomad360-header')),
      eyebrow:fold(hero.querySelector('h1')),
      headline:fold(hero.querySelector('h2')),
      subtitle:fold(hero.querySelector('h3')),
      cta:fold(cta),
      introduction:fold(intro.querySelector('.nomad-intro-lead')),
      advantages:benefitRows.map(fold),
      conclusion:fold(intro.querySelector('.nomad-intro-result')),
      wolf:fold(logo),
      seoHeading:fold(document.querySelector('#nomad360-seo-heading')),
      seoText:fold(document.querySelector('.nomad-seo-copy p')),
      bannerEnd:fold(banner),
      selling:fold(document.querySelector('#nomad360-selling-choice')),
   };
   return {
    lang:document.documentElement.lang,width:innerWidth,viewportHeight:innerHeight,foldParts,
    banner:rect(banner),hero:rect(hero),cta:rect(cta),ctaHref:cta.getAttribute('href'),
    selling:!!document.querySelector('#nomad360-selling-choice'),
    seoVisible:!!originalSeo&&[...originalSeo.querySelectorAll('*')].some(e=>!!e.getClientRects().length),
    seoComputed:originalSeo?{display:getComputedStyle(originalSeo).display,visibility:getComputedStyle(originalSeo).visibility,parentDisplay:getComputedStyle(originalSeo.parentElement).display,rect:rect(originalSeo)}:null,
    seoText:originalSeo?.innerText.slice(0,160)||'',
    bannerBg:css.backgroundColor,ctaBg:style(cta,'backgroundColor'),ctaFg:style(cta,'color'),
    eyebrow:style(hero.querySelector('h1'),'color'),accent:accent?style(accent,'color'):null,
    logoPresent:!!logo,logoSrc:logo?.src.slice(0,28),logoDimensions:logo?rect(logo):null,
    font:style(hero.querySelector('h2'),'fontFamily'),
    gradient:getComputedStyle(banner,'::before').backgroundImage.slice(0,200),
    overflow:document.documentElement.scrollWidth-innerWidth,
    outliers:[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,id:el.id,cls:String(el.className||'').slice(0,55),r:el.getBoundingClientRect().right})).filter(x=>x.r>innerWidth+3).slice(0,12),
    cards:intro?.querySelectorAll('li').length||0,
    contents:[...banner.children].map(x=>x.id),
    otherFooter:!!document.querySelector('#nomad360-footer')
   };
  });
  // Record every case BEFORE a failure so that genuine screenshots of defects remain visible.
  if(lang==='ru'||[390,768,1366,1920].includes(width))
    await page.screenshot({path:path.join(out,lang+'-'+width+'x'+height+'-viewport.png')});
  if(lang==='ru'&&[320,390,768,1280,1440,1920].includes(width))
    await page.locator('#nomad360-commercial-banner').screenshot({path:path.join(out,lang+'-'+width+'x'+height+'-hero.png')});
  const failures=[];
  if(errors.length)failures.push('javascript errors '+errors.join('; '));
  if(bad.length)failures.push('missing local resources '+JSON.stringify(bad));
  // Existing header/footer overflow is audited against the untouched-main baseline below.
  // Do not misattribute the pre-existing 24px to Codex's hero.
  if(state.banner.x < -1 || state.banner.right>width+1)failures.push('banner outside viewport '+JSON.stringify(state.banner));
  if(state.bannerBg!=='rgb(23, 59, 88)')failures.push('background not TASK10 navy: '+state.bannerBg);
  if(state.ctaBg!=='rgb(255, 145, 63)')failures.push('CTA not TASK10 orange: '+state.ctaBg);
  if(state.ctaFg!=='rgb(23, 59, 88)')failures.push('CTA ink incorrect: '+state.ctaFg);
  if(state.eyebrow!=='rgb(255, 145, 63)')failures.push('eyebrow orange incorrect: '+state.eyebrow);
  if(state.accent!=='rgb(255, 145, 63)')failures.push('headline highlight incorrect: '+state.accent);
  if(!state.logoPresent||!state.logoSrc.startsWith('data:image/png'))failures.push('approved LOGO-01 not reused');
  if(!state.seoVisible||!state.seoText.trim())failures.push('SEO original copy hidden or deleted');
  if(!state.selling||state.ctaHref!=='#nomad360-selling-choice')failures.push('original calculator CTA route lost');
  if(state.cards!==3||!state.otherFooter)failures.push('intro/footer structure damaged');
  // Capture a real transition to calculator without trusting a static href.
  await page.locator('#nomad360-commercial-banner .nomad-intro-cta').click({timeout:8000});
  const route=await page.evaluate(()=>({hash:location.hash,focus:document.activeElement?.id||'',visible:!!document.querySelector('#nomad360-selling-choice')?.getClientRects().length}));
  if(route.hash!=='#nomad360-selling-choice'&&!route.visible)failures.push('CTA click did not route to selling-choice '+JSON.stringify(route));
  await page.goto(origin+'Marketing_calc.HTML?baseline=1',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#nomad360-hero');
  const baseOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  if(state.overflow>baseOverflow+1)failures.push('Codex banner adds '+(state.overflow-baseOverflow)+' px overflow above baseline');
  records.push({...state,baselineOverflow:baseOverflow,route,failures});
  console.log('CODEX_HERO_CASE '+lang+' '+width+'x'+height+' '+(failures.length?'FAIL: '+failures.join(' | '):'PASS'));
  await context.close();
 }}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(records,null,2)+'\n');
 const fails=records.filter(r=>r.failures.length);
 const summary=records.map(r=>({lang:r.lang,width:r.width,height:r.viewportHeight,
  visible:Object.entries(r.foldParts).filter(([k,v])=>Array.isArray(v)?v.some(x=>x&&['full','partial'].includes(x.status)):v&&['full','partial'].includes(v.status)).map(([k,v])=>k),
  parts:Object.fromEntries(Object.entries(r.foldParts).map(([k,v])=>[k,Array.isArray(v)?v.map(x=>x?.status):v?.status])),
  bannerBottom:r.foldParts.bannerEnd?.bottom,sellingTop:r.foldParts.selling?.top
 }));
 fs.writeFileSync(path.join(out,'first-screen-matrix.json'),JSON.stringify(summary,null,2)+'\\n');
 console.log('CODEX_HERO_AUDIT',JSON.stringify({total:records.length,pass:records.length-fails.length,fail:fails.length}));
 A.equal(records.length,viewports.length*3,'All language/resolution cases must be tested');
 A.equal(fails.length,0,'Hero and approved TASK10 site must be compatible on every route/viewport');
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
