'use strict';
/* IRBIS-07: real Chromium screenshots and interaction assertions; NEVER transfer money. */
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'artifacts/irbis-07');
fs.mkdirSync(out,{recursive:true});
for(const [file,sha] of [
 ['assets/nomad360-banners/support-wide.webp','937c35a1c0e0e5203c9cd949789219e1cbe0d541'],
 ['assets/nomad360-banners/support-mobile.webp','30db5bffa26f3e1f6cc3f6370fe95648e84e4362']
])A.equal(execFileSync('git',['hash-object',file],{cwd:root,encoding:'utf8'}).trim(),sha,'No changes to the approved snow-leopard image');
const types={'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon'};
(async()=>{
 const server=http.createServer((req,res)=>{
  const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');
  fs.createReadStream(p).pipe(res);
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
  for(const lang of ['ru','en','kk'])for(const width of [320,360,390,430,768,1280,1440]){
   const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',acceptDownloads:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
   await page.goto(base+'/Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
   await page.addStyleTag({path:path.join(out,'utilities.css')});
   await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(language=>window.Nomad360UI.setLanguage(language),lang);
   await page.waitForFunction(language=>document.documentElement.lang===language&&!!document.querySelector('#nomad360-irbis-banner'),lang);
   const banner=page.locator('#nomad360-irbis-banner');
   A.equal(await banner.count(),1);
   A.equal(await page.locator('#nomad360-return').count(),1);
   A.equal(await page.locator('#nomad360-support').count(),1);
   A.equal(await page.locator('#nomad360-product-details').count(),1);
   A.equal(await page.locator('.nomad-footer-inner').evaluate(e=>e.lastElementChild?.id),'nomad360-irbis-banner',
    'The scenic banner is the final visible footer block, not an earlier promo');
   A.equal(await banner.locator('#nomad360-license').count(),1,'Existing license lives inside scenic footer');
   A.equal(await banner.locator('#nomad360-data').count(),1,'Existing privacy statement lives inside scenic footer');
   A.equal(await banner.locator('#nomad360-official').count(),1,'Official contact is inside scenic footer');
   A.equal(await banner.locator('#nomad360-official details').count(),0,'Official email is a plain link, not a disclosure');
   A.equal(await banner.locator('#nomad360-official a').getAttribute('href'),
    'mailto:nomad260393@gmail.com','Original official mailto is unchanged');
   A.equal(await banner.locator('.nomad-footer-meta').evaluate(e=>e.lastElementChild?.id),
    'nomad360-official','Official contact is the final item inside scenic footer');
   const sectionIds=['nomad360-irbis-support-disclosure','nomad360-product-details','nomad360-license','nomad360-data'];
   A.deepEqual(await banner.evaluate(()=>{
    const root=document.getElementById('nomad360-irbis-banner');
    return [...root.querySelectorAll('#nomad360-irbis-support-disclosure,#nomad360-product-details,#nomad360-license,#nomad360-data')].map(e=>e.id);
   }),sectionIds,'Visible disclosure order: support, funds, license, privacy');
   const sectionGeometry=await banner.evaluate((root,ids)=>ids.map(id=>{
    const el=document.getElementById(id);
    const summary=el.querySelector(':scope > summary');
    const box=summary.getBoundingClientRect();
    const css=getComputedStyle(summary),border=getComputedStyle(el);
    return {id,border:border.borderTopColor,top:border.borderTopWidth,
     summaryDisplay:css.display,alignItems:css.alignItems,inset:parseFloat(css.paddingLeft),
     minHeight:parseFloat(css.minHeight),actualHeight:box.height};
   }),sectionIds);
   A.ok(sectionGeometry.every(x=>x.border==='rgb(56, 103, 139)'&&x.top==='1px'
    &&x.summaryDisplay==='flex'&&x.alignItems==='center'
    &&x.inset>=12&&x.minHeight>=70&&x.actualHeight>=70),
    'All four disclosure headings are inset and vertically centered between #38678B rules: '+JSON.stringify(sectionGeometry));
   A.deepEqual(await banner.locator('[data-return-platform]').evaluateAll(xs=>xs.map(x=>x.dataset.returnPlatform)),['windows','ios','android']);
   A.equal(await banner.locator('.nomad-irbis-platform-icon').count(),3);
   const actualTitle=await banner.locator('#nomad360-return h2').textContent();
   const expected=await page.evaluate(()=>window.Nomad360LocaleCore.t('return.title'));
   A.equal(actualTitle,expected,'Existing localized title must remain exact');
   A.equal(await banner.locator('.nomad-return-note').count(),2);
   const support=banner.locator('#nomad360-irbis-support-disclosure'),projects=banner.locator('#nomad360-product-details');
   A.equal(await support.getAttribute('open'),null,'Donations collapsed initially');
   A.equal(await projects.getAttribute('open'),null,'Project details collapsed initially');
   const license=banner.locator('#nomad360-license'),privacy=banner.locator('#nomad360-data');
   A.equal(await license.getAttribute('open'),null,'License disclosure initially collapsed');
   A.equal(await privacy.getAttribute('open'),null,'Privacy disclosure initially collapsed');
   await license.locator(':scope > summary').click();
   await privacy.locator(':scope > summary').click();
   A.equal(await license.getAttribute('open'),'','Existing license opens in the banner');
   A.equal(await privacy.getAttribute('open'),'','Existing data disclosure opens in the banner');
   A.match(await license.locator('a').getAttribute('href'),
    /^https:\/\/kazartsevev\.github\.io\/shelter-partner-directory\/license\//,
    'Original legal URL is retained');
   A.equal(await license.locator(':scope > summary').textContent(),
    await page.locator('#nomad360-header [data-nomad-go="nomad360-license"]').textContent(),
    'Footer license uses exactly the existing translated navigation label');
   // Closed-state screenshots must show the *normal* visitor experience.
   await license.locator(':scope > summary').click();
   await privacy.locator(':scope > summary').click();
   const bg=await banner.evaluate(e=>({
    scene:getComputedStyle(e,'::before').backgroundImage,
    phone:getComputedStyle(e.querySelector('.nomad-irbis-mobile-art')).backgroundImage,
    footer:getComputedStyle(e).backgroundColor,
    scroll:document.documentElement.scrollWidth,viewport:innerWidth,
    buttons:[...e.querySelectorAll('[data-return-platform]')].map(x=>{const r=x.getBoundingClientRect();return {width:r.width,right:r.right};})
   }));
   A.equal(bg.footer,'rgb(23, 59, 88)');
   A.ok(bg.scene.includes('support-wide.webp'),'Use exact approved wide art');
   if(width<=700)A.ok(bg.phone.includes('support-mobile.webp'),'Display separate text-free mobile art');
   A.ok(bg.scroll<=bg.viewport+2,'No horizontal viewport overflow');
   A.ok(bg.buttons.every(x=>x.width>44&&x.right<=bg.viewport+2),'Shortcuts must fit viewport');
   if(lang==='ru')await banner.screenshot({path:path.join(out,'ru-'+width+'-closed.png')});
   await support.locator(':scope > summary').click();
   A.equal(await support.getAttribute('open'),'','Genuine details disclosure');
   A.equal(await banner.locator('iframe.nomad-crypto-frame').count(),1,'Actual NOWPayments iframe retained');
   A.equal(await banner.locator('.nomad-pay-kaspi').count(),1,'Kaspi retained');
   A.equal(await banner.locator('.nomad-pay-bank').count(),1,'SWIFT/IBAN retained');
   A.ok((await banner.locator('[data-nomad-copy],.nomad-copy').count())>0,'Copy controls retained');

   const paymentRows=await banner.locator('.nomad-irbis-methods > details').evaluateAll(elements=>elements.map(el=>{
    const summary=el.querySelector(':scope > summary');
    const rule=getComputedStyle(el),heading=getComputedStyle(summary);
    return {id:el.id,color:rule.borderTopColor,width:rule.borderTopWidth,
     display:heading.display,alignItems:heading.alignItems,inset:parseFloat(heading.paddingLeft),
     background:rule.backgroundColor,textColor:heading.color};
   }));
   A.equal(paymentRows.length,lang==='ru'?4:3,'Payment disclosures match active locale');
   A.ok(paymentRows.every(x=>x.color==='rgb(56, 103, 139)'&&x.width==='1px'
    &&x.display==='flex'&&x.alignItems==='center'&&x.inset>=12),
    'Every nested payment disclosure uses inset centered text and palette separator: '+JSON.stringify(paymentRows));
   const bankRow=paymentRows.find(x=>x.id==='nomad360-irbis-bank');
   A.ok(bankRow,'Original SWIFT/IBAN disclosure must exist in every locale');
   A.equal(bankRow.background,'rgb(23, 59, 88)',
    'SWIFT/IBAN must not render as a legacy white card on the navy banner');
   A.equal(bankRow.textColor,'rgb(255, 255, 255)',
    'SWIFT/IBAN disclosure summary uses approved white text');
   const bankDetails=banner.locator('.nomad-irbis-methods > details.nomad-pay-bank');
   await bankDetails.locator(':scope > summary').click();
   A.equal(await bankDetails.getAttribute('open'),'','SWIFT/IBAN disclosure remains functional');
   A.equal(await bankDetails.locator('.nomad-bank-value').first().evaluate(e=>getComputedStyle(e).color),
    'rgb(255, 255, 255)','SWIFT/IBAN expanded bank values keep readable white text');
   await bankDetails.locator(':scope > summary').click();

   if(lang==='ru')await banner.screenshot({path:path.join(out,'ru-'+width+'-support-open.png')});
   // Verify legal/data restoration independently from the visitor-default image.
   await license.locator(':scope > summary').click();
   await privacy.locator(':scope > summary').click();
   // No duplicated text or newly invented locale strings: after switching, all
   // disclosure state and payment fields continue to belong to the real header.
   const next=lang==='ru'?'en':'ru';
   await page.evaluate(x=>window.Nomad360UI.setLanguage(x),next);
   await page.waitForFunction(x=>document.documentElement.lang===x,next);
   A.equal(await page.locator('#nomad360-irbis-support-disclosure').getAttribute('open'),'','Open state survives language switch');
   A.equal(await page.locator('#nomad360-license').getAttribute('open'),'','Legal state survives language switch');
   A.equal(await page.locator('#nomad360-data').getAttribute('open'),'','Privacy state survives language switch');
   A.equal(await page.locator('.nomad-footer-inner').evaluate(e=>e.lastElementChild?.id),
    'nomad360-irbis-banner','Footer order survives native locale redraw');
   A.equal(await page.locator('#nomad360-irbis-banner').count(),1);
   A.equal(await page.locator('#nomad360-return h2').textContent(),await page.evaluate(()=>window.Nomad360LocaleCore.t('return.title')));
   A.equal(await page.locator('#nomad360-irbis-banner .nomad-irbis-brand').count(),1,'Brand survives native locale rerender');
   A.equal(await page.locator('#nomad360-irbis-banner .nomad-irbis-platform-icon').count(),3,'Icon layer survives native locale rerender');
   A.equal(await page.locator('#nomad360-irbis-banner .nomad-irbis-mobile-art').count(),1,'Mobile art survives native locale rerender');
   await page.locator('#nomad360-irbis-support-disclosure > summary').click();
   await page.locator('#nomad360-return [data-return-platform="ios"]').click();
   A.equal(await page.locator('#nomad360-return-help').evaluate(e=>e.open),true,'Actual iOS help works');
   await page.keyboard.press('Escape');
   A.deepEqual(errors,[],'No uncaught errors');
   results.push({width,lang,buttons:3,payments:true,sourceArt:true,languageState:true,errors});
   await context.close();
  }
  // Non-overlay scrollbar gutters narrow documentElement.clientWidth beneath innerWidth.
  // Full bleed must follow the actual content viewport, not 100vw.
  const gutter=await browser.newPage({viewport:{width:1280,height:900}});
  await gutter.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await gutter.goto(base+'/Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
  await gutter.addStyleTag({content:'html{scrollbar-gutter:stable;overflow-y:scroll}'});
  await gutter.waitForFunction(()=>{
   const banner=document.getElementById('nomad360-irbis-banner');
   return banner&&Math.abs(banner.getBoundingClientRect().width-document.documentElement.getBoundingClientRect().width)<1;
  });
  const edges=await gutter.locator('#nomad360-irbis-banner').evaluate(el=>{
   const rect=el.getBoundingClientRect();
   return {left:rect.left,right:rect.right,documentWidth:document.documentElement.getBoundingClientRect().width};
  });
  A.ok(edges.left>=-1&&edges.right<=edges.documentWidth+1,
   'Scrollbar-safe full bleed cannot exceed document edges: '+JSON.stringify(edges));
  await gutter.close();
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({result:'PASS',cases:results},null,2)+'\n');
  console.log('IRBIS_07_PASS',results.length);
 }finally{await browser.close();await new Promise(done=>server.close(done));}
})().catch(error=>{console.error(error);process.exitCode=1;});
