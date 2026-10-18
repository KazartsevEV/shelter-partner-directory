'use strict';
/* ABOUT-01: production HTML/JS/CSS, approved scene integrity + browser receipts. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'artifacts/about-01');
fs.mkdirSync(out,{recursive:true});
const image='assets/nomad360-banners/about-bozzhyra-approved.webp';
const expectedGitBlob='303328b9be8afb985f0e057e6f57000676bea493';
assert.equal(execFileSync('git',['hash-object',image],{cwd:root,encoding:'utf8'}).trim(),expectedGitBlob,
 'Approved original moon scene must remain byte-for-byte unchanged');
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
 const reports=[];
 try{
  for(const lang of ['ru','en','kk'])for(const width of [320,390,768,1280,1440]){
   const ctx=await browser.newContext({locale:lang==='ru'?'ru-RU':lang==='kk'?'kk-KZ':'en-US',
    viewport:{width,height:1750},reducedMotion:'reduce'});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await page.goto(base+'/Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
   await page.addStyleTag({path:path.join(out,'utilities.css')});
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForSelector('#nomad360-information #nomad360-about');
   const layout=await page.evaluate(async()=>{
    const section=document.querySelector('#nomad360-information');
    const scenic=getComputedStyle(section,'::before'),rect=section.getBoundingClientRect();
    const cards=[...section.querySelectorAll('.nomad-about-card')];
    const linked=cards.map(a=>({hash:a.getAttribute('href'),label:a.querySelector('.nomad-about-card-motto')?.textContent,
      title:a.querySelector('h3')?.textContent}));
    const contacts=[...section.querySelectorAll('.nomad-links a')].map(a=>a.href);
    const img=new Image();img.src='./assets/nomad360-banners/about-bozzhyra-approved.webp';
    await img.decode();
    const sr=section.querySelector('#nomad360-about').getBoundingClientRect();
    const box=el=>{const r=el.getBoundingClientRect();return {top:r.top-rect.top,bottom:r.bottom-rect.top,height:r.height};};
    const scenicCopy=section.querySelector('.nomad-about-scene-copy');
    const opening=section.querySelector('.nomad-about-opening');
    const caption=section.querySelector('.nomad-about-caption');
    const flow=section.querySelector('.nomad-about-flow');
    const contactBlock=section.querySelector('#nomad360-contacts');
    const cardBoxes=cards.map(box);
    return {sceneSource:scenic.backgroundImage,sceneSize:scenic.backgroundSize,
      scenePosition:scenic.backgroundPosition,scenicWidth:parseFloat(scenic.width),
      scenicHeight:parseFloat(scenic.height),originalWidth:img.naturalWidth,originalHeight:img.naturalHeight,
      background:getComputedStyle(section).backgroundColor,
      cardCount:cards.length,links:linked,contacts,sectionWidth:rect.width,
      viewport:innerWidth,docScroll:document.documentElement.scrollWidth,
      cardOrder:section.querySelector('.nomad-about-caption').compareDocumentPosition(section.querySelector('.nomad-about-flow'))&Node.DOCUMENT_POSITION_FOLLOWING,
      openingRight:section.querySelector('.nomad-about-opening').getBoundingClientRect().right-rect.left,
      aboutLeft:sr.left,
      scenicCopyBox:scenicCopy?box(scenicCopy):null,
      openingBox:box(opening),captionBox:box(caption),
      flowBox:box(flow),contactBox:box(contactBlock),cardBoxes,
      leftVeil:getComputedStyle(section,'::after').backgroundImage};
   });
   assert.ok(layout.sceneSource.includes('assets/nomad360-banners/about-bozzhyra-approved.webp'),'Approved full-width image must be used');
   assert.equal(layout.sceneSize,'100% 100%','Never crop original art with cover');
   assert.equal(layout.originalWidth,1672);assert.equal(layout.originalHeight,941);
   assert.ok(Math.abs(layout.scenicWidth/layout.scenicHeight-1672/941)<0.025,'Scene must retain source aspect ratio');
   if(width>=701)assert.ok(Math.abs(layout.scenicWidth-layout.sectionWidth)<=2,
     'Full-width desktop photo must span the complete banner');
   if(width<=700)assert.ok(layout.scenicWidth>layout.sectionWidth+80,
     'On mobile, crop away the left portion, never stretch or isolate the photo');
   assert.equal(layout.background,'rgb(23, 59, 88)','Brand navy');
   assert.equal(layout.cardCount,3,'All three links preserved');
   assert.deepEqual(layout.links.map(c=>c.hash),['#nomad360-selling-choice','#nomad360-ai','#nomad360-factory']);
   assert.ok(layout.links.every(c=>c.title&&c.label),'Localized motto and title for every service');
   assert.equal(layout.contacts.length,4,'All four contact links preserved');
   assert.ok(layout.cardOrder,'Highlighted paragraph must precede service links');
   assert.ok(layout.docScroll<=width+1,'No sideways scroll at '+width+'px');
   assert.equal(errors.length,0,'No JavaScript page errors');
   if(width>=1021)assert.ok(layout.openingRight<layout.sectionWidth*.56,'Text stays left of moon');
   if(width>=1001){
    assert.ok(layout.cardBoxes.every(card=>card.height<=235),
      'Desktop service cards must be compact, not old 242px minimum');
    assert.ok(layout.contactBox.top-layout.flowBox.bottom<=30,
      'Desktop contacts directly follow the service grid');
    assert.ok(layout.leftVeil.includes('67%'),
      'Left scrim must fade completely by two-thirds of panorama');
   }
   if(width<=700){
    assert.ok(layout.scenicCopyBox,
      'Translated mobile brand copy must be in the image section');
    assert.ok(layout.openingBox.top>130&&layout.openingBox.top<layout.scenicHeight,
      'Brand introduction should occupy former caption position within scene');
    assert.ok(layout.captionBox.top>=layout.scenicHeight+12,
      'Highlighted mobile automation caption must start below image on solid navy');
    assert.ok(layout.captionBox.top>=layout.openingBox.bottom,
      'Localized text order and spacing must be preserved');
   }
   const file=lang+'-'+width+'-about.png';
   await page.locator('#nomad360-information').screenshot({path:path.join(out,file)});
   if(width===390){
    const next=lang==='ru'?'en':lang==='en'?'kk':'ru';
    await page.evaluate(next=>Nomad360UI.setLanguage(next),next);
    assert.equal(await page.locator('#nomad360-information .nomad-about-card').count(),3);
    assert.equal(await page.locator('#nomad360-information .nomad-about-card-motto').count(),3);
    assert.equal(await page.locator('#nomad360-information .nomad-about-contact-icon').count(),4);
    assert.equal(await page.locator('#nomad360-information .nomad-about-opening .nomad-about-brand').count(),1);
    assert.equal((await page.locator('#nomad360-information .nomad-about-flow .nomad-about-card').first().getAttribute('href')),'#nomad360-selling-choice');
   }
   reports.push({lang,width,...layout});
   await ctx.close();
  }
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({sourceBlob:expectedGitBlob,reports},null,2));
  console.log('ABOUT-01 GREEN source SHA, locale, geometry, links, contacts',reports.length);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
