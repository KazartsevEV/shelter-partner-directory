'use strict';
// TASK-10 LOGO-01 visual acceptance: the original raster wolf stays unchanged,
// while the browser applies only the approved color substitution and CSS crop.
const A=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'artifacts/task10-logo');
fs.mkdirSync(out,{recursive:true});
const types={'.HTML':'text/html','.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port+'/';
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const records=[];
  try{
    for(const lang of ['ru','en','kk'])for(const width of [390,1280]){
      const context=await browser.newContext({viewport:{width,height:940},reducedMotion:'reduce'});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
      await page.goto(origin+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
      await page.locator('#nomad360-lang-select').selectOption(lang);
      await page.waitForFunction(()=>[...document.querySelectorAll('.nomad-logo-mask .nomad-logo,.nomad-seo-logo-mask .nomad-seo-logo,.nomad-embed-b2b-logo-mask img')].length===3
       &&[...document.querySelectorAll('.nomad-logo-mask .nomad-logo,.nomad-seo-logo-mask .nomad-seo-logo,.nomad-embed-b2b-logo-mask img')].every(n=>n.getAttribute('src')?.startsWith('data:image/png;base64,')&&n.complete&&n.naturalWidth>0),null,{timeout:20000});
      const state=await page.evaluate(()=>{
        const images=[...document.querySelectorAll('.nomad-logo-mask .nomad-logo,.nomad-seo-logo-mask .nomad-seo-logo,.nomad-embed-b2b-logo-mask img')];
        const img=images[0];
        const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
        const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
        const data=ctx.getImageData(0,0,c.width,c.height).data;
        const counts={blue:0,white:0,orange:0,unexpected:0};
        for(let i=0;i<data.length;i+=4){
          if(data[i+3]<252)continue;const x=data[i],y=data[i+1],z=data[i+2];
          if(x===23&&y===59&&z===88)counts.blue++;
          else if(x===255&&y===255&&z===255)counts.white++;
          else if(x===255&&y===145&&z===63)counts.orange++;
          else counts.unexpected++;
        }
        const mask=document.querySelector('.nomad-seo-logo-mask');
        return {dimensions:[c.width,c.height],counts,
          allSameUrl:images.every(e=>e.getAttribute('src')===img.getAttribute('src')),
          maskSize:mask.getBoundingClientRect().width,
          scale:getComputedStyle(mask.querySelector('img')).transform,
          logoTransforms:images.map(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);
            return {scaleX:m.a,scaleY:m.d,dx:m.e/e.offsetWidth,dy:m.f/e.offsetHeight};}),
          headerMask:!!document.querySelector('.nomad-logo-mask'),
          bannerMask:!!mask,embeddedMask:!!document.querySelector('.nomad-embed-b2b-logo-mask')};
      });
      A.equal(errors.length,0,'JavaScript errors: '+errors.join('; '));
      A.ok(state.allSameUrl,'all three actual images are recolored identically');
      A.ok(state.headerMask&&state.bannerMask&&state.embeddedMask);
      A.ok(state.counts.blue>100&&state.counts.orange>20&&state.counts.white>100,
        'approved colors are present in full-opacity source details '+JSON.stringify(state.counts));
      A.ok(state.counts.unexpected<state.counts.blue+state.counts.orange+state.counts.white,
        'raster recolor should preserve large solid areas');
      A.notEqual(state.scale,'none','original wolf enlarged inside cropped white rim');
      A.ok(state.maskSize>=50&&state.maskSize<=145);
      A.ok(state.logoTransforms.every(t=>Math.abs(t.scaleX-1.38)<0.001
        &&Math.abs(t.scaleY-1.38)<0.001&&Math.abs(t.dx-0.012)<0.001
        &&Math.abs(t.dy-0.009)<0.001),
        'the same proportional adjustment applies to the complete mark across all mask sizes');
      // Sample the *rendered* ring, rather than assuming the PNG canvas is centered.
      // This checks the actual orbit against the white circular mask; it excludes
      // the asymmetric wolf silhouette, which must not be moved independently.
      const b2bShot=await page.locator('.nomad-embed-b2b-logo-mask').screenshot({
        path:path.join(out,lang+'-'+width+'-b2b-logo.png')
      });
      const orbitCenter=await page.evaluate(async base64=>{
        const image=new Image();
        image.src='data:image/png;base64,'+base64;
        await image.decode();
        const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
        const ctx=c.getContext('2d',{willReadFrequently:true});
        ctx.drawImage(image,0,0);
        const {data}=ctx.getImageData(0,0,c.width,c.height);
        const left=[],right=[];
        for(let y=Math.round(c.height*.45);y<=Math.round(c.height*.55);y++){
          for(let x=0;x<c.width;x++){
            const i=(y*c.width+x)*4;
            // Target dark orbit; exclude the older, darker banner background.
            const ring=data[i]>=23&&data[i]<=42&&data[i+1]>=58&&data[i+1]<=85
              &&data[i+2]>=78&&data[i+2]<=120;
            if(!ring)continue;
            if(x>c.width*.05&&x<c.width*.23)left.push(x);
            if(x>c.width*.77&&x<c.width*.95)right.push(x);
          }
        }
        if(!left.length||!right.length)return null;
        const mean=xs=>xs.reduce((sum,x)=>sum+x,0)/xs.length;
        return {ringX:(mean(left)+mean(right))/2,maskX:(c.width-1)/2,
          leftPx:left.length,rightPx:right.length};
      },b2bShot.toString('base64'));
      A.ok(orbitCenter,'both sides of the circular orbit must be visible');
      A.ok(Math.abs(orbitCenter.ringX-orbitCenter.maskX)<0.95,
        'orbit must be centered within the white circle: '+JSON.stringify(orbitCenter));
      await page.locator('#nomad360-header').screenshot({path:path.join(out,lang+'-'+width+'-header.png')});
      await page.locator('#nomad360-seo-banner').screenshot({path:path.join(out,lang+'-'+width+'-commercial.png')});
      records.push({lang,width,...state});
      await context.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(records,null,2)+'\n');
  console.log('TASK10_ORIGINAL_WOLF_LOGO_GREEN',JSON.stringify(records.map(x=>({lang:x.lang,width:x.width,counts:x.counts,maskSize:x.maskSize}))));
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
