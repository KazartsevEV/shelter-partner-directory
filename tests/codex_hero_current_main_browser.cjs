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
 try{for(const lang of ['ru','en','kk'])for(const width of [320,360,390,430,768,1280,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',deviceScaleFactor:1});
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
   return {
    lang:document.documentElement.lang,width:innerWidth,viewportHeight:innerHeight,
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
  await page.screenshot({path:path.join(out,lang+'-'+width+'-viewport.png')});
  await page.locator('#nomad360-commercial-banner').screenshot({path:path.join(out,lang+'-'+width+'-hero.png')});
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
  console.log('CODEX_HERO_CASE '+lang+' '+width+' '+(failures.length?'FAIL: '+failures.join(' | '):'PASS'));
  await context.close();
 }}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(records,null,2)+'\n');
 const fails=records.filter(r=>r.failures.length);
 console.log('CODEX_HERO_AUDIT',JSON.stringify({total:records.length,pass:records.length-fails.length,fail:fails.length}));
 A.equal(records.length,21,'All language/width cases must be tested');
 A.equal(fails.length,0,'Hero and approved TASK10 site must be compatible on every route/viewport');
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
