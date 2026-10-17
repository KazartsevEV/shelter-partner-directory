'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/first-hero-02');
fs.mkdirSync(out,{recursive:true});
const types={'.HTML':'text/html','.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port+'/',browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const records=[];
 try{for(const lang of ['ru','en','kk'])for(const width of [320,360,390,430,768,1280,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  await page.goto(origin+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#nomad360-commercial-banner .nomad-first-hero-art',{state:'attached'});
  await page.locator('#nomad360-lang-select').selectOption(lang);
  await page.waitForFunction(l=>document.documentElement.lang===l&&document.querySelector('#nomad360-commercial-banner .nomad-first-hero-art')&&document.querySelector('.nomad-seo-logo')?.src.startsWith('data:image/png;base64,'),lang,{timeout:25000});
  await page.evaluate(()=>document.fonts.ready);
  const state=await page.evaluate(()=>{
   const banner=document.querySelector('#nomad360-commercial-banner'),hero=banner.querySelector('#nomad360-hero');
   const art=banner.querySelector('.nomad-first-hero-art'),narrative=hero.querySelector('h3'),cta=hero.querySelector('.nomad-intro-cta');
   const intro=banner.querySelector('#nomad360-intro'),seo=banner.querySelector('.nomad-seo-copy');
   const br=x=>{const a=x.getBoundingClientRect();return {top:a.top,bottom:a.bottom,width:a.width,height:a.height}};
   const hue=x=>getComputedStyle(x).color,bg=x=>getComputedStyle(x).backgroundColor;
   const css=getComputedStyle(banner),pic=getComputedStyle(art);
   return {
    viewport:innerWidth,lang:document.documentElement.lang,heroWidth:br(banner).width,
    overflow:banner.scrollWidth-banner.clientWidth,
    pageOverflow:document.documentElement.scrollWidth-innerWidth,
    art:br(art),artDisplay:pic.display,narrative:br(narrative),
    cta:{href:cta.getAttribute('href'),bg:bg(cta),text:hue(cta)},
    headerColor:hue(hero.querySelector('h1')),
    benefits:[...intro.querySelectorAll('li')].map(e=>({icon:!!e.querySelector('svg'),label:e.querySelector('strong')?hue(e.querySelector('strong')):null})),
    seoKeys:[...seo.querySelectorAll('[data-i18n]')].map(e=>({key:e.dataset.i18n,visible:!!e.getClientRects().length,content:e.textContent.trim()})),
    blue:bg(banner),heroGradient:getComputedStyle(banner,'::before').backgroundImage.slice(0,170),
    artGradient:pic.backgroundImage.slice(0,170),heroChildren:[...banner.children].map(x=>x.id),
    logoSrc:banner.querySelector('.nomad-seo-brand img')?.src.slice(0,22),
    logoTransform:getComputedStyle(banner.querySelector('.nomad-seo-brand img')).transform,
    sellExists:!!document.querySelector('#nomad360-selling-choice'),
    others:[!!document.querySelector('#nomad360-about'),!!document.querySelector('#nomad360-support'),!!document.querySelector('#nomad360-embed')]
   };
  });
  A.deepEqual(errors,[],'JS errors '+lang+' '+width);
  A.equal(state.blue,'rgb(23, 59, 88)','new blue background');
  A.equal(state.cta.bg,'rgb(255, 145, 63)','new orange CTA');
  A.equal(state.cta.href,'#nomad360-selling-choice');
  A.equal(state.headerColor,'rgb(255, 145, 63)');
  A.equal(state.cta.text,'rgb(23, 59, 88)');
  A.ok(state.benefits.length===3&&state.benefits.every(x=>x.icon&&x.label==='rgb(255, 145, 63)'));
  A.deepEqual(state.seoKeys.map(x=>x.key).sort(),['business.ideaSeoCopy','business.ideaSeoTitle']);
  A.ok(state.seoKeys.every(x=>x.visible&&x.content),'SEO must remain visible and localized');
  A.equal(state.logoSrc,'data:image/png;base64,','approved logo must be dynamically reused');
  A.ok(state.logoTransform!=='none','approved centered logo CSS reused');
  A.ok(state.sellExists&&state.others.every(Boolean),'other DOM remains untouched');
  A.ok(state.overflow<=1,'horizontal overflow '+JSON.stringify(state));
  if(width<=430){
    A.ok(state.art.height>100&&state.artDisplay==='block','mobile art is in the text flow');
    A.ok(state.narrative.top-state.art.bottom>=8,
     'art cannot cover the narrative: '+JSON.stringify({width,lang,art:state.art,narrative:state.narrative}));
    A.ok(state.artGradient.includes('23, 59, 88'),'mobile art fades to new blue');
  }else{
    A.ok(state.heroGradient.includes('23, 59, 88'),'desktop background fades to new blue');
  }
  await page.locator('#nomad360-commercial-banner').screenshot({path:path.join(out,lang+'-'+width+'-banner.png')});
  records.push(state);
  await context.close();
 }}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(records,null,2)+'\n');
 console.log('UNIFIED_HERO_02_GREEN '+records.length+' responsive cases; 3 locales; approved palette, logo, art separation and visible SEO');
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
