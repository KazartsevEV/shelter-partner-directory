'use strict';
/* CONSULTING-01: screenshot ACTUAL production markup, images and CSS.
 * All copy/controls are real DOM from nomad360_header.js; compares button
 * functionality and all three locales without replacing any model code. */
const A=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'artifacts/consulting-01');
fs.mkdirSync(out,{recursive:true});
const mime={'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
function assetCheck(){
 const desktop=fs.readFileSync(path.join(root,'assets/nomad360-banners/consulting-horizontal-desktop-3200x941.svg'),'utf8');
 const mobile=fs.readFileSync(path.join(root,'assets/nomad360-banners/consulting-horizontal-mobile-1200x1671.svg'),'utf8');
 for(const [s,w,h] of [[desktop,3200,941],[mobile,1200,1671]]){
  A.match(s,new RegExp('width="'+w+'" height="'+h+'"'));
  A.ok((s.match(/data:image\/webp;base64,/g)||[]).length===3,'Image extended from the original, not regenerated or rasterized text');
  A.doesNotMatch(s,/<text[\s>]|<foreignObject|<button[\s>]/i,'Live text and UI must not be baked into art');
 }
 A.match(desktop,/clip-path="url\(#right\)" filter="url\(#blur\)" opacity="\.28"/,
  'Far-right extension cannot show a sharp mirrored third ram');
}
(async()=>{
 assetCheck();
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[],captures=[];
 try{
  for(const lang of ['ru','en','kk'])for(const width of [320,390,768,1280,1440,2560]){
   if(lang!=='ru'&&![390,1440].includes(width))continue;
   const context=await browser.newContext({
    viewport:{width,height:1750},locale:lang==='ru'?'ru-RU':lang==='kk'?'kk-KZ':'en-US',reducedMotion:'reduce',acceptDownloads:true
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',res=>{if(/consulting-horizontal/.test(res.url())&&res.status()!==200)errors.push(res.status()+' '+res.url());});
   await page.route(/^https?:\/\//,route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await page.goto(base+'/Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
   await page.addStyleTag({path:path.join(out,'utilities.css')});
   await page.waitForSelector('#nomad360-embed .nomad-embed-b2b-card');
   await page.evaluate(next=>Nomad360UI.setLanguage(next),lang);
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('#nomad360-embed').scrollIntoViewIfNeeded();
   const state=await page.evaluate(()=>{
    const section=document.querySelector('#nomad360-embed');
    const rect=section.getBoundingClientRect();
    const art=getComputedStyle(section,'::before');
    const cards=[...section.querySelectorAll('.nomad-embed-b2b-card')].map(e=>e.getBoundingClientRect().toJSON());
    const btn=section.querySelector('[data-nomad-embed-toggle]'),button=btn.getBoundingClientRect();
    return {
     viewport:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,
     width:rect.width,left:rect.left,right:rect.right,height:rect.height,
     heading:section.querySelector('.nomad-embed-b2b-title').textContent,
     cards,button:button.toJSON(),
     copyBoxes:[...section.querySelectorAll('.nomad-embed-b2b-copy')].map(e=>e.getBoundingClientRect().toJSON()),
     badgeBoxes:[...section.querySelectorAll('.nomad-embed-b2b-number')].map(e=>e.getBoundingClientRect().toJSON()),
     artWidth:parseFloat(art.width),artHeight:parseFloat(art.height),
     artSrc:art.backgroundImage,artSize:art.backgroundSize,
     brandDisplay:getComputedStyle(section.querySelector('.nomad-embed-b2b-brand')).display,
     cardFill:getComputedStyle(section.querySelector('.nomad-embed-b2b-card')).backgroundColor
    };
   });
   A.ok(Math.abs(state.left)<=2&&Math.abs(state.right-state.viewport)<=2,
    'CONSULTING must reach BOTH viewport edges at '+width+': '+JSON.stringify(state));
   A.ok(state.scrollWidth<=state.viewport+2,'No horizontal document overflow '+width);
   A.equal(state.brandDisplay,'none','Old B2B wolf must not be shown');
   // The global TASK-10 palette also uses !important in a named cascade layer.
   // A screenshot alone did not catch opaque navy cards. Assert computed alpha.
   A.equal(state.cardFill, 'rgba(23, 59, 88, '+(width<=700?'0.82':'0.78')+')',
    'CONSULTING cards must retain their scoped translucent fill in the browser');
   A.equal(state.cards.length,3,'Exactly three live, localized B2B cards');
   A.ok(state.heading.length>0,'Localized heading must exist');
   A.match(state.artSrc,width<=700?/consulting-horizontal-mobile/:/consulting-horizontal-desktop/,
    'Use the actual approved original scenery without replacing');
   A.ok(state.artHeight>0&&state.artWidth>=state.viewport-2,'Scene must span viewport');
   if(width>=1200)A.ok(state.cards[0].x<state.cards[1].x&&state.cards[1].x<state.cards[2].x,
    'Desktop uses three columns');
   if(width<=700){
    A.ok(state.cards[0].y<state.cards[1].y&&state.cards[1].y<state.cards[2].y,
     'Mobile uses three readable rows');
    for(let n=0;n<3;n++)A.ok(state.copyBoxes[n].top>=state.badgeBoxes[n].bottom,
     'Mobile card copy must span a separate full-width row below the markers');
   }
   for(const c of state.cards)A.ok(c.left>=-1&&c.right<=state.viewport+1,'Card stays within screen at '+width);
   const shot=lang+'-'+width+'-consulting.png';
   await page.locator('#nomad360-embed').screenshot({path:path.join(out,shot),animations:'disabled',timeout:15000});
   captures.push(shot);
   if((width===390||width===1440)&&lang==='ru'){
    // Classic scrollbar reserve must not make the full-bleed banner overflow.
    await page.addStyleTag({content:'html { scrollbar-gutter: stable; } html::-webkit-scrollbar { width: 17px; }'});
    const gutter=await page.locator('#nomad360-embed').evaluate(e=>{
      const rect=e.getBoundingClientRect();return {left:rect.left,right:rect.right,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth};
    });
    A.ok(Math.abs(gutter.left)<=2&&gutter.right<=gutter.client+2&&
     gutter.right>=gutter.client-20&&gutter.scroll<=gutter.client+2,
     'Full-bleed B2B section must fit visible content box (17px scrollbar gutter): '+JSON.stringify(gutter));
    const button=page.locator('#nomad360-embed [data-nomad-embed-toggle]');
    A.equal(await button.getAttribute('aria-expanded'),'false','Comparison is initially closed');
    await button.click();
    A.equal(await button.getAttribute('aria-expanded'),'true','Existing CTA still opens comparison');
    A.equal(await page.locator('#nomad360-embed-comparison').isVisible(),true,'Comparison is visible');
    A.equal(await page.locator('#nomad360-embed-comparison table').count(),1,'Free / White Label table preserved');
    const open='ru-'+width+'-consulting-comparison-open.png';
    await page.locator('#nomad360-embed').screenshot({path:path.join(out,open),animations:'disabled'});
    captures.push(open);
    await page.evaluate(()=>Nomad360UI.setLanguage('en'));
    A.equal(await page.locator('[data-nomad-embed-toggle]').getAttribute('aria-expanded'),'true',
     'Changing RU to EN must not close B2B comparison');
    A.equal(await page.locator('#nomad360-embed .nomad-embed-b2b-card').count(),3,
     'Three live B2B benefits preserved after language switch');
    // Verify actual portable download, not only the nominal export function.
    const downloadPromise=page.waitForEvent('download',{timeout:30000});
    await page.locator('#nomad360-embed [data-nomad-download-html]').click();
    const download=await downloadPromise;
    const exported=fs.readFileSync(await download.path(),'utf8');
    A.ok(exported.includes('data-nomad-embedded'),'Snapshot must mark embedded mode');
    A.ok((exported.match(/data:image\/svg\+xml;base64,/g)||[]).length>=2,
     'Portable HTML must contain both original landscape SVG data URLs');
    A.doesNotMatch(exported,/url\(["']?\.\/assets\/nomad360-banners\/consulting-horizontal-/,
     'Standalone HTML must not depend on remote/relative B2B scenery paths');
   }
   A.equal(errors.length,0,'Page JS/asset errors: '+errors.join('; '));
   results.push({lang,width,...state});
   await context.close();
  }
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({screens:captures,results},null,2)+'\n');
  console.log('CONSULTING-01 PASS',results.length,'browser viewport-language combinations',captures.length,'screenshots');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
