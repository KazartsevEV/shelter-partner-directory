'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),A=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/codex-pr175-original-first-fold');
fs.mkdirSync(out,{recursive:true});
const mime={'.HTML':'text/html','.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml','.ico':'image/x-icon'};
const resolutions=[
[320,568],[360,640],[375,667],[390,844],[393,873],[414,896],[430,932],
[600,960],[768,1024],[820,1180],[1024,768],[1280,720],[1280,800],
[1366,768],[1440,900],[1536,864],[1600,900],[1920,1080],[2560,1440],[3440,1440]
];
const server=http.createServer((request,response)=>{
 const reqPath=decodeURIComponent(new URL(request.url,'http://local').pathname);
 const filename=path.resolve(root,'.'+reqPath);
 if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){response.writeHead(404);response.end();return;}
 response.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
 fs.createReadStream(filename).pipe(response);
});
const fnum=n=>Math.round(n*10)/10;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const reports=[];
 try {
  for(const lang of ['ru','en','kk']){
   for(const [width,height] of resolutions){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
    const page=await context.newPage(),jsErrors=[];
    page.on('pageerror',e=>jsErrors.push(e.message));
    await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
    try {
      await page.goto(origin+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
      await page.waitForSelector('#nomad360-commercial-banner #nomad360-hero',{timeout:20000});
      await page.locator('#nomad360-lang-select').selectOption(lang);
      await page.waitForFunction(lang=>document.documentElement.lang===lang&&document.querySelector('#nomad360-commercial-banner .nomad-intro-lead'),lang,{timeout:20000});
      await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0)});
      const data=await page.evaluate(()=>{
        const fnum=n=>Math.round(n*10)/10;
        const banner=document.querySelector('#nomad360-commercial-banner');
        const hero=banner.querySelector('#nomad360-hero');
        const intro=banner.querySelector('#nomad360-intro');
        const result=intro.querySelector('.nomad-intro-result');
        const logo=banner.querySelector('.nomad-seo-brand');
        const box=element=>{
         if(!element)return {status:'missing'};
         const style=getComputedStyle(element),r=element.getBoundingClientRect();
         if(style.display==='none'||style.visibility==='hidden')return {status:'hidden'};
         let status='below';
         if(r.bottom<=0)status='above';
         else if(r.top<innerHeight&&r.bottom>0){
           status=r.top>=0&&r.bottom<=innerHeight?'full':'partial';
         }
         return {top:fnum(r.top),bottom:fnum(r.bottom),status};
        };
        // Do not inspect any later site section; only Codex first banner.
        const elements={
          label:box(hero.querySelector('h1')),
          title:box(hero.querySelector('h2')),
          description:box(hero.querySelector('h3')),
          cta:box(hero.querySelector('.nomad-intro-cta')),
          intro:box(intro.querySelector('.nomad-intro-lead')),
          advantages:[...intro.querySelectorAll('li')].map(box),
          closing:box(result),
          wolf:box(logo),
          banner:box(banner)
        };
        return {viewport:{width:innerWidth,height:innerHeight},scrollY,
          bannerHeight:fnum(banner.getBoundingClientRect().height),bannerTop:fnum(banner.getBoundingClientRect().top),
          elements,headline:hero.querySelector('h2')?.textContent.trim().slice(0,100),
          originalArt:getComputedStyle(banner,'::before').backgroundImage.includes('hero.webp')};
      });
      data.language=lang;
      data.jsErrors=jsErrors;
      if(lang==='ru'||(lang!=='ru'&&[390,1366,1920].includes(width)))
        await page.screenshot({path:path.join(out,lang+'-'+width+'x'+height+'-first-screen.png')});
      reports.push(data);
      const visible=Object.entries(data.elements).filter(([k,v])=>(k==='advantages'?v.some(p=>p.status==='full'||p.status==='partial'):v.status==='full'||v.status==='partial')).map(([k])=>k);
      console.log('ORIGINAL_CODEX_PR175_FIRST_FOLD '+lang+' '+width+'x'+height+' '+JSON.stringify({bannerH:data.bannerHeight,headerOffset:data.bannerTop,visible,advantages:data.elements.advantages.map(x=>x.status),closing:data.elements.closing.status,wolf:data.elements.wolf.status}));
      A.ok(data.originalArt,'Codex original scenic image must be loaded unchanged');
      A.equal(data.scrollY,0);
      A.equal(data.elements.advantages.length,3);
      A.deepEqual(jsErrors,[],'No JS exceptions in original banner');
    }finally{await context.close();}
   }
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 fs.writeFileSync(path.join(out,'original-first-banner-fold-matrix.json'),JSON.stringify(reports,null,2)+'\n');
 console.log('ORIGINAL_CODEX_PR175_FIRST_FOLD_DONE '+reports.length+' unchanged-source browser tests');
 A.equal(reports.length,resolutions.length*3);
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
