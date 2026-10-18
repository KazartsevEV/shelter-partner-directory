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
   // Test the actual requested language explicitly; navigator.locale alone is
   // insufficient to prove all three translations were rendered.
   await page.evaluate(next=>window.Nomad360UI.setLanguage(next),lang);
   await page.waitForFunction(next=>window.Nomad360UI.getLanguage()===next&&
     document.documentElement.lang===next,lang);
   const translation=await page.evaluate(next=>{
    const words=window.Nomad360LocaleCore.locales('interface.header')[next];
    const info=document.querySelector('#nomad360-information');
    const displayed=sel=>info.querySelector(sel)?.textContent||'';
    const cards=[...info.querySelectorAll('.nomad-about-card')];
    const normalized=s=>String(s).replace(/\s+/g,' ').trim();
    return {
     language:window.Nomad360UI.getLanguage(),
     title:normalized(displayed('#nomad360-about .nomad-about-scene-copy > h2'))===normalized(words.about),
     brand:normalized(displayed('.nomad-about-brand'))===normalized(words.aboutBrand),
     caption:normalized(displayed('.nomad-about-caption'))===
       normalized(words.flowBefore+words.flowEmphasis+words.flowAfter),
     contact:normalized(displayed('#nomad360-contacts h2'))===normalized(words.contact),
     contactTopics:normalized(displayed('.nomad-topics'))===normalized(words.contactTopics),
     titles:cards.every((card,i)=>normalized(card.querySelector('h3')?.textContent)===normalized(words.flow[i].title)),
     questions:cards.every((card,i)=>normalized(card.querySelector('p')?.textContent)===normalized(words.flow[i].question)),
     mottos:cards.every((card,i)=>normalized(card.querySelector('.nomad-about-card-motto')?.textContent)===
       normalized(words.aboutMotto[[2,0,1][i]])),
     captionCount:info.querySelectorAll('.nomad-about-caption').length
    };
   },lang);
   assert.equal(translation.language,lang,'Real selected locale must match requested RU/EN/KK');
   for(const key of ['title','brand','caption','contact','contactTopics','titles','questions','mottos'])
    assert.ok(translation[key],lang+': real visible '+key+' must match source dictionary');
   assert.equal(translation.captionCount,1,'Exactly one translated automation caption');
   const ruRows=page.locator('#nomad360-about .nomad-about-brand-row');
   if(lang==='ru'){
    assert.deepEqual(await ruRows.allTextContents(),
      ['Nomad 360 - зонтичный бренд','интеллектуальных сервисов','для предпринимателей.'],
      'Mobile Russian sentence must use precisely three requested rows');
    const original=await page.locator('#nomad360-about .nomad-about-brand').textContent();
    assert.equal(original,'Nomad 360 - зонтичный бренд интеллектуальных сервисов для предпринимателей.','Row breaks must not change the translated text');
    if(width<=700){
     const rows=await ruRows.evaluateAll(els=>els.map(e=>{
      const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scroll:e.scrollWidth,client:e.clientWidth};
     }));
     assert.ok(rows[0].y<rows[1].y&&rows[1].y<rows[2].y,
       'All three RU rows must be vertically stacked on phones');
     assert.ok(rows.every(x=>x.scroll<=x.client+2),'No Russian line may clip on a phone');
    }
   }else assert.equal(await ruRows.count(),0,'EN/KK copy must retain original text rendering');
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
    const box=el=>{const r=el.getBoundingClientRect();return {top:r.top-rect.top,bottom:r.bottom-rect.top,height:r.height,width:r.width};};
    const scenicCopy=section.querySelector('.nomad-about-scene-copy');
    const heading=scenicCopy?.querySelector('h2');
    const opening=section.querySelector('.nomad-about-opening');
    const caption=section.querySelector('.nomad-about-caption');
    const captionBand=section.querySelector('.nomad-about-caption-band');
    const flow=section.querySelector('.nomad-about-flow');
    const contactBlock=section.querySelector('#nomad360-contacts');
    const cardBoxes=cards.map(box);
    const cardMinHeights=cards.map(el=>parseFloat(getComputedStyle(el).minHeight));
    const cardsClip=cards.some(el=>el.scrollHeight>el.clientHeight+2);
    return {sceneSource:scenic.backgroundImage,sceneSize:scenic.backgroundSize,
      scenePosition:scenic.backgroundPosition,scenicWidth:parseFloat(scenic.width),
      scenicHeight:parseFloat(scenic.height),originalWidth:img.naturalWidth,originalHeight:img.naturalHeight,
      background:getComputedStyle(section).backgroundColor,
      cardCount:cards.length,links:linked,contacts,sectionWidth:rect.width,
      viewport:innerWidth,docScroll:document.documentElement.scrollWidth,
      captionAfterFlow:Boolean(flow.compareDocumentPosition(caption)&Node.DOCUMENT_POSITION_FOLLOWING),
      captionBeforeContacts:Boolean(caption.compareDocumentPosition(section.querySelector('#nomad360-contacts'))&Node.DOCUMENT_POSITION_FOLLOWING),
      captionInBand:caption.parentElement===captionBand,
      openingRight:section.querySelector('.nomad-about-opening').getBoundingClientRect().right-rect.left,
      aboutLeft:sr.left,
      scenicCopyBox:scenicCopy?box(scenicCopy):null,headingBox:heading?box(heading):null,
      openingBox:box(opening),captionBox:box(caption),
      captionBandBox:captionBand?box(captionBand):null,
      flowBox:box(flow),contactBox:box(contactBlock),cardBoxes,cardMinHeights,cardsClip,
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
   assert.ok(layout.captionAfterFlow&&layout.captionBeforeContacts&&layout.captionInBand,
     'One translated automation caption must appear after services and before contacts');
   assert.ok(layout.captionBandBox,'Caption must have its own vertically centered band');
   const topGap=layout.captionBox.top-layout.captionBandBox.top;
   const bottomGap=layout.captionBandBox.bottom-layout.captionBox.bottom;
   assert.ok(Math.abs(topGap-bottomGap)<=2,
     'Automation caption must be vertically centered in band with equal top/bottom spacing');
   assert.ok(layout.captionBandBox.top>=layout.flowBox.bottom-1,
     'No translated automation paragraph remains above service cards');
   assert.ok(layout.contactBox.top>=layout.captionBandBox.bottom-1,
     'Contact block must begin after caption');
   assert.ok(layout.docScroll<=width+1,'No sideways scroll at '+width+'px');
   assert.equal(errors.length,0,'No JavaScript page errors');
   if(width>=1021)assert.ok(layout.openingRight<layout.sectionWidth*.56,'Text stays left of moon');
   if(width>=1001){
    assert.ok(layout.cardMinHeights.every(height=>height<=185),
      'Desktop service cards must have compact responsive minimum heights');
    assert.ok(!layout.cardsClip,'No localized desktop card text may be clipped');
    assert.ok(layout.flowBox.top>=layout.scenicHeight*.72,
      'Desktop service cards must start in the navy-darkened lower photo area');
    assert.ok(layout.captionBandBox.top-layout.flowBox.bottom<=12,
      'Desktop caption band must immediately follow the compact service grid');
    assert.ok(layout.contactBox.top-layout.captionBandBox.bottom<=3,
      'Desktop contacts immediately follow the vertically centered caption band');
    assert.ok(layout.leftVeil.includes('67%'),
      'Left scrim must fade completely by two-thirds of panorama');
   }
   if(width<=700){
    assert.ok(layout.scenicCopyBox,
      'Translated mobile brand copy must be in the image section');
    if(lang==='ru'){
     assert.ok(layout.openingBox.top>=layout.headingBox.bottom
        &&layout.openingBox.top<layout.scenicHeight*.56,
       'RU intro must begin directly beneath unchanged project heading in navy sky');
     assert.ok(layout.flowBox.top>=layout.scenicHeight*.70,
       'Service cards must stay in the dark lower portion of the unmodified panorama');
     assert.ok(layout.flowBox.top-layout.openingBox.bottom<=120,
       'No excessive blank blue band between the compact three-line sentence and service cards');
    }else{
     assert.ok(layout.openingBox.top>130&&layout.openingBox.top<layout.scenicHeight,
       'Other languages must retain existing scenic-copy arrangement');
     assert.ok(layout.flowBox.top>=layout.scenicHeight-2,
       'EN KK services stay beneath original image'); 
    }
    assert.ok(layout.scenicCopyBox.bottom<=Math.max(layout.scenicHeight,layout.openingBox.bottom)+45,
      'Mobile scenic area must not reserve the old automation paragraph space');
    assert.ok(layout.captionBox.top>=layout.flowBox.bottom,
      'Highlighted mobile automation caption must follow all service cards');
    if(lang==='en'||lang==='kk')
      assert.ok(layout.headingBox&&layout.headingBox.width<layout.sectionWidth*.61,
        'Translated EN/KK heading must stay in safe left column, not across the moon');
   }
   const file=lang+'-'+width+'-about.png';
   await page.locator('#nomad360-information').screenshot({path:path.join(out,file)});
   if(width===390){
    const next=lang==='ru'?'en':lang==='en'?'kk':'ru';
    await page.evaluate(next=>Nomad360UI.setLanguage(next),next);
    assert.equal(await page.locator('#nomad360-information .nomad-about-card').count(),3);
    assert.equal(await page.locator('#nomad360-information .nomad-about-caption-band > .nomad-about-caption').count(),1);
    const orderOk=await page.evaluate(()=>{
      const flow=document.querySelector('#nomad360-information .nomad-about-flow');
      const caption=document.querySelector('#nomad360-information .nomad-about-caption');
      const contacts=document.querySelector('#nomad360-contacts');
      return !!(flow.compareDocumentPosition(caption)&Node.DOCUMENT_POSITION_FOLLOWING)
       && !!(caption.compareDocumentPosition(contacts)&Node.DOCUMENT_POSITION_FOLLOWING);
    });
    assert.ok(orderOk,'Changing RU/EN/KK must retain caption after three service links');
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
