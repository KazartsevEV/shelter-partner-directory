'use strict';
// Current MKT-L10N-01, main 538565e; earlier marketing specifications are obsolete.
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/marketing-current');fs.mkdirSync(out,{recursive:true});
const widths=(process.env.MARKETING_WIDTHS||'320,360,390,430,768,1280,1440').split(',').map(Number);
let portable='';
function audit(){const visible=e=>e.getClientRects().length&&!e.closest('[hidden],.hidden');const hosts=['#nomad360-intro','#nomad360-about','#nomad360-embed','#nomad360-license','#nomad360-data','#nomad360-official'];const bad=[];for(const host of hosts)for(const e of document.querySelectorAll(host+' *'))if(visible(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const s=getComputedStyle(e);const heroText=!!e.closest('#nomad360-commercial-banner');const aboutText=!!document.querySelector('script[src$="nomad360_about_banner.js"]')&&!!e.closest('#nomad360-about,#nomad360-contacts');const weights=heroText||aboutText?['400','450','500','600','650','700','750']:['400','500','600','700'];const approvedRuMobileBrand=aboutText&&document.documentElement.lang==='ru'&&innerWidth<=700&&!!e.closest('.nomad-about-brand-ru-mobile');const minimum=approvedRuMobileBrand?13.5:(heroText&&e.closest('.nomad-benefit-copy')?13:14);if(parseFloat(s.fontSize)<minimum||!weights.includes(s.fontWeight))bad.push({text:e.textContent,font:s.font});}return {overflow:document.documentElement.scrollWidth>innerWidth+1,bad,gaps:Nomad360LocaleCore.auditVisibleGaps()};}
async function settle(p){await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(120);}
(async()=>{
 const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;if(name==='/portable.html'){res.setHeader('Content-Type','text/html');res.end(portable);return;}const file=path.resolve(root,'.'+decodeURIComponent(name));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),cases=[],exports=[];
 try{for(const lang of ['ru','en','kk'])for(const width of widths){
  const ctx=await browser.newContext({locale:lang==='kk'?'kk-KZ':lang==='en'?'en-US':'ru-RU',viewport:{width,height:1000},acceptDownloads:true,reducedMotion:'reduce'});
  await ctx.addInitScript(language=>{try{localStorage.setItem('nomad360PreferredLanguage',language)}catch(_){}},lang);
  const p=await ctx.newPage(),errors=[],downloads=[];let htmlRequests=0;
  p.on('pageerror',e=>errors.push(e.message));p.on('download',d=>downloads.push(d));p.on('request',r=>{if(r.url().endsWith('/Marketing_calc.HTML'))htmlRequests++;});
  await p.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await p.route('**/nomad360_repo_traffic.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({status:'ok',source:'github-repository-traffic',repository:'KazartsevEV/shelter-partner-directory',updatedAt:new Date().toISOString(),visitors14:63})}));
  await p.goto(base+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});await p.addStyleTag({path:path.join(out,'utilities.css')});await settle(p);
  const tr=k=>p.evaluate(k=>Nomad360LocaleCore.t(k),k);

  A.deepEqual(await p.locator('#nomad360-lang-select option').evaluateAll(nodes=>nodes.map(e=>e.value)),
   ['en','kk','ru'],'Header locale options: English first, Kazakh second, Russian third');
  A.equal(await p.locator('#nomad360-lang-select').inputValue(),lang,'Stored visitor locale is honored');
  const ctaStyle=await p.locator('#nomad360-hero .nomad-intro-cta').evaluate(a=>{
   const css=getComputedStyle(a),box=a.getBoundingClientRect();
   return {font:parseFloat(css.fontSize),align:css.textAlign,height:box.height,href:a.getAttribute('href'),
    scroll:document.documentElement.scrollWidth-innerWidth};
  });
  A.ok(ctaStyle.font >= (width<=700?19:width<=1020?20:23),
   'New HERO CTA text must be enlarged at mobile/tablet/desktop: '+JSON.stringify({lang,width,ctaStyle}));
  A.equal(ctaStyle.align,'center','Hero CTA label is centered');
  A.ok(ctaStyle.height>= (width<=700?60:48),'CTA text cannot clip after enlargement');
  A.equal(ctaStyle.href,'#nomad360-selling-choice','CTA still opens original scenario');
  A.ok(ctaStyle.scroll<=1,'CTA must not cause horizontal overflow');
  const offer=await p.locator('#nomad360-hero h1,#nomad360-hero h2,#nomad360-hero h3').allTextContents();
  if(lang==='ru')A.deepEqual(offer,['Бизнес-калькулятор','Каким бизнесом мне выгодно заниматься?','Рассчитайте идею или существующий бизнес за 20 минут и узнайте, что принесет живые деньги.']);
  const modernHero=await p.locator('script[src$="nomad360_hero_banner.js"]').count()===1;
   if(modernHero)A.equal(await p.locator('#nomad360-commercial-banner #nomad360-hero-summary').evaluate(e=>[...e.children].map(n=>n.id).join(',')),'nomad360-intro,nomad360-seo-banner','Approved hero summary preserves intro then brand');
   else A.equal(await p.locator('#nomad360-seo-banner').evaluate(e=>e.nextElementSibling.id),'nomad360-intro');
   A.equal(await p.locator('#home-screen h1').count(),1);
  A.equal(await p.locator('#nomad360-intro li').count(),3);
   const currentProcess=await p.locator('#nomad360-intro .nomad-hero-process').count()===1;
   if(modernHero)A.equal(currentProcess,true,'Live HERO must retain the approved three-step introduction');
   A.equal(await p.locator('#nomad360-intro p').count(),currentProcess?1:2);
   if(currentProcess){
      A.equal(await p.locator('#nomad360-intro .nomad-hero-process-step[role="listitem"]').count(),3,
        'Approved HERO has three translated business-plan steps');
   }
   A.equal(await p.locator('#nomad360-intro a').count(),0);
  if(lang==='en')A.match(await p.locator('.nomad-intro-lead').textContent(),/validation/);if(lang==='ru')A.doesNotMatch(await p.locator('#nomad360-intro').textContent(),/validation/);
  A.equal(await p.locator('#nomad360-seo-banner li').count(),0);
   A.equal(await p.locator('#nomad360-seo-banner h2').count(),modernHero?0:1,'No duplicated obsolete SEO heading');
   if(!modernHero)A.equal(await p.locator('#nomad360-seo-banner p').isVisible(),true);
   A.equal(await p.locator('#nomad360-seo-banner img').count(),1);
  if(modernHero){
     A.equal(await p.locator('#home-screen #nomad360-commercial-banner').count(),1);
     A.equal(await p.locator('#nomad360-commercial-banner #nomad360-intro').count(),1);
     A.equal(await p.locator('#nomad360-commercial-banner #nomad360-seo-banner').count(),1);
   }else A.equal(await p.locator('#home-screen').evaluate(e=>[...e.children].filter(n=>!['nomad360-hero','nomad360-intro'].includes(n.id)).slice(0,2).map(n=>n.id).join(',')),'nomad360-seo-banner,nomad360-selling-choice');
  await p.locator('.nomad-intro-cta').focus();await p.keyboard.press('Enter');await settle(p);A.ok(await p.locator('#nomad360-selling-choice').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.top<innerHeight;}));
  const about=p.locator('#nomad360-about');
  const approvedAbout=await p.locator('script[src$="nomad360_about_banner.js"]').count()===1;
  A.equal(await about.locator('.nomad-about-opening .nomad-about-motto span').count(),3);
  A.equal(await about.locator('.nomad-about-flow>li').count(),3);
  const caption=approvedAbout?p.locator('#nomad360-contacts .nomad-about-caption-band .nomad-about-caption'):about.locator(':scope>p');
  A.equal(await caption.count(),1);
  const emphasis=caption.locator('em');
  A.equal(await emphasis.count(),1);
  A.equal(await emphasis.evaluate(e=>getComputedStyle(e).fontStyle),'italic');
  if(approvedAbout){
   A.ok(await p.locator('#nomad360-contacts').evaluate(e=>{
    const a=e.querySelector('h2'),b=e.querySelector('.nomad-topics'),c=e.querySelector('.nomad-links'),d=e.querySelector('.nomad-about-caption');
    return !!a&&!!b&&!!c&&!!d&&!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING)&&
      !!(b.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)&&
      !!(c.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_FOLLOWING);
   }),'Translated contact subtitle immediately below heading and closing statement after links');
  }
  if(approvedAbout){
    A.equal(await about.locator('.nomad-about-scene-copy').count(),1);
    A.equal(await about.locator('.nomad-about-flow>li>a.nomad-about-card').count(),3);
    A.equal(await about.locator('.nomad-about-card-motto').count(),3);
  }
  if(lang==='ru'){
    A.deepEqual(await about.locator('li h3').allTextContents(),['Калькулятор','AI Маркетолог','Контент Фабрика']);
    A.equal(await caption.textContent(),'Применяя автоматизацию с Nomad 360, вы можете достичь больших целей быстрее, освободив личное время на то, что действительно важно.');
    A.equal(await emphasis.textContent(),'действительно важно');
  }
  const flow=await about.locator('li').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));if(width>=(approvedAbout?701:900))A.ok(flow[0].left<flow[1].left&&flow[1].left<flow[2].left&&Math.abs(flow[0].top-flow[2].top)<1,'Approved three-column ABOUT grid at '+width);else A.ok(flow[0].top<flow[1].top&&flow[1].top<flow[2].top,'Mobile ABOUT links stack at '+width);
  const embed=p.locator('#nomad360-embed'),toggle=embed.locator('[data-nomad-embed-toggle]'),panel=embed.locator('#nomad360-embed-comparison');
  A.equal(await toggle.getAttribute('aria-expanded'),'false');A.equal(await panel.isVisible(),false);A.equal(await embed.locator('button:visible').count(),1);
  const consultingTitles={ru:'Занимаетесь консалтингом?',en:'Do you work in consulting?',kk:'Консалтингпен айналысасыз ба?'};
  A.equal(await embed.locator('h2').textContent(),consultingTitles[lang]);
  const benefits=embed.locator('.nomad-embed-b2b-benefits');A.equal(await benefits.locator('li').count(),3);
  for(let i=0;i<3;i++){
   A.equal(await benefits.locator('li').nth(i).textContent().then(t=>t.trim()),String(i+1)+await tr('interface.header.embedB2BPoints.'+i));
   A.equal(await benefits.locator('li').nth(i).locator('svg[aria-hidden]').count(),0);
   A.equal(await benefits.locator('li').nth(i).locator('[aria-hidden="true"] svg').count(),1);
  }
  A.equal(await benefits.locator('em').count(),1);A.equal(await benefits.locator('em').textContent(),await tr('interface.header.embedB2BFocus'));
  A.equal(await benefits.locator('em').evaluate(e=>getComputedStyle(e).fontStyle),'italic');
  A.equal(await embed.locator('.nomad-embed-b2b-slogan').textContent(),await tr('interface.header.embedB2BSlogan'));
  await p.waitForFunction(()=>[...document.querySelectorAll('.nomad-logo,.nomad-seo-logo,.nomad-embed-b2b-logo-mask img')].every(e=>e.getAttribute('src')?.startsWith('data:image/png;base64,')));
  A.match(await embed.locator('.nomad-embed-b2b-logo-mask img').getAttribute('src'),/^data:image\/png;base64,/);
  A.equal(await p.locator('.nomad-logo-mask .nomad-logo').count(),1);
  A.equal(await p.locator('.nomad-seo-logo-mask .nomad-seo-logo').count(),1);
  // HERO-LOGO-TRANSPARENCY-01: a global palette !important once painted an
  // opaque navy rectangle over the approved panorama and adjacent live text.
  // Test the ACTUAL computed cascade on all viewport sizes / RU EN KK.
  if(modernHero){
   const logoPaint=await p.locator('#nomad360-commercial-banner #nomad360-seo-banner').evaluate(e=>{
    const brand=e.querySelector('.nomad-seo-brand');
    const mask=e.querySelector('.nomad-seo-logo-mask');
    const img=e.querySelector('.nomad-seo-logo');
    return {
     wrapper:getComputedStyle(e).backgroundColor,
     brand:getComputedStyle(brand).backgroundColor,
     image:getComputedStyle(img).backgroundColor,
     mask:getComputedStyle(mask).backgroundColor,
     asset:img.getAttribute('src').startsWith('data:image/png;base64,'),
     text:e.querySelector('.nomad-seo-tagline').textContent.trim()
    };
   });
   A.equal(logoPaint.wrapper,'rgba(0, 0, 0, 0)','Hero logo container must not paint navy patch');
   A.equal(logoPaint.brand,'rgba(0, 0, 0, 0)','Hero logo brand wrapper must be transparent');
   A.equal(logoPaint.image,'rgba(0, 0, 0, 0)','Imported wolf PNG element must have transparent CSS background');
   A.equal(logoPaint.mask,'rgb(255, 255, 255)','Preserve approved original white circular emblem');
   A.equal(logoPaint.asset,true,'Preserve existing recolored original wolf PNG');
   A.match(logoPaint.text,/Sky allows,\s*guys deliver/,'Brand slogan remains live English text');
   if(width<=700){
    const clash=await p.locator('#nomad360-commercial-banner').evaluate(section=>{
     const logo=section.querySelector('.nomad-seo-brand').getBoundingClientRect();
     const lead=section.querySelector('.nomad-intro-lead').getBoundingClientRect();
     const first=section.querySelector('#nomad360-intro li:first-child').getBoundingClientRect();
     return {logoLeft:logo.left,leadRight:lead.right,firstRight:first.right};
    });
    A.ok(clash.leadRight+4<=clash.logoLeft,
     'Mobile brand lead must not run under the original wolf emblem: '+JSON.stringify(clash));
    A.ok(clash.firstRight+4<=clash.logoLeft,
     'First live benefit must not run beneath wolf logo and slogan: '+JSON.stringify(clash));
   }
  }

  A.ok(await p.locator('.nomad-logo-mask .nomad-logo').evaluate(e=>getComputedStyle(e).transform!=='none'));
  A.equal(await embed.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(23, 59, 88)');
  A.equal(await embed.locator('h2').evaluate(e=>getComputedStyle(e).color),'rgb(255, 255, 255)');
  const cardRects=await benefits.locator('li').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
  if(width>=900)A.ok(cardRects[0].left<cardRects[1].left&&cardRects[1].left<cardRects[2].left,'B2B desktop cards in row');
  if(width<=760)A.ok(cardRects[0].top<cardRects[1].top&&cardRects[1].top<cardRects[2].top,'B2B mobile cards stacked');
  // HERO-SNAPSHOT-01: the CTA keyboard smoke test above scrolls the page
  // to the scenario choices. With a sticky desktop header, taking an element
  // screenshot while scrolled paints that header in the *middle* of the tall
  // #home-screen image. It is a screenshot artefact, not the live header order.
  // Reset viewport before capture, and independently verify real header order.
  await p.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
  await p.waitForFunction(()=>window.scrollY===0);
  const headerAtTop=await p.locator('#nomad360-header').evaluate(header=>{
   const home=document.getElementById('home-screen');
   const r=header.getBoundingClientRect();
   return {position:getComputedStyle(header).position,top:r.top,
    beforeHome:!!(header.compareDocumentPosition(home)&Node.DOCUMENT_POSITION_FOLLOWING)};
  });
  A.equal(headerAtTop.beforeHome,true,'Live header precedes the hero in DOM');
  if(width>=1200){
   A.equal(headerAtTop.position,'sticky','Desktop header stays sticky, not embedded in the hero');
   A.ok(Math.abs(headerAtTop.top)<=2,'At scroll 0 the desktop header is at the page top, not halfway down');
  }
  const files=[];async function shot(name,selector){const f=`${lang}-${width}-${name}.png`;await p.locator(selector).screenshot({path:path.join(out,f)});files.push(f);}
  // A true initial viewport screenshot, including the actual site header, for
  // accurate owner review; keep the home-only art image as a separate artifact.
  if(lang==='ru'&&(width===1280||width===1440)){
   const name=`${lang}-${width}-header-top.png`;
   await p.screenshot({path:path.join(out,name),fullPage:false});files.push(name);
  }
  await shot('home','#home-screen');await shot('about','#nomad360-about');await shot('b2b-closed','#nomad360-embed');
  for(const id of ['nomad360-license','nomad360-data','nomad360-product-details'])A.equal(await p.locator('#'+id).evaluate(e=>e.open),false,id+' default closed');
  A.equal(await p.locator('#nomad360-official').locator('details').count(),0);A.equal(await p.locator('#nomad360-official a').isVisible(),true);A.equal((await p.locator('#nomad360-official a').textContent()).trim(),'nomad260393@gmail.com');A.equal(await p.locator('#nomad360-official p').count(),1);
  const ozon=p.locator('#nomad360-support .nomad-pay-ozon');
  A.equal(await ozon.count(),lang==='ru'?1:0,'Ozon card must exist only in RU, not just be hidden in EN/KK');
  A.equal(await p.locator('#nomad360-support .nomad-russian-transfer').count(),0,'Legacy disclosure removed');
  if(lang==='ru'){
   A.equal(await ozon.locator('.nomad-ru-flag').textContent(),'🇷🇺');
   A.equal(await ozon.locator('.nomad-pay-value').textContent(),'+7 977 986 74 41');
   A.equal(await ozon.locator('[data-nomad-copy]').count(),1);
   const fonts=await p.evaluate(()=>['.nomad-pay-kaspi','.nomad-pay-ozon'].map(sel=>['.nomad-pay-label','.nomad-pay-value','.nomad-copy'].map(child=>{
     const st=getComputedStyle(document.querySelector(sel+' '+child));return [st.fontFamily,st.fontSize,st.fontWeight];
   })));
   A.deepEqual(fonts[1],fonts[0],'Ozon matches Kaspi typography for label, value and copy');
  }
  await shot('footer-closed','.nomad-footer-meta');
  await toggle.focus();await p.keyboard.press('Enter');A.equal(await toggle.getAttribute('aria-expanded'),'true');A.equal(await panel.isVisible(),true);A.equal(downloads.length,0);A.equal(htmlRequests,1,'Disclosure must not start the HTML generator');
  if(width<=600){const rowWidths=await panel.locator('tbody th').evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,parent:e.parentElement.getBoundingClientRect().width})));A.ok(rowWidths.every(x=>Math.abs(x.width-x.parent)<2),'Mobile row labels occupy the full row');}
  A.equal(await panel.locator('tbody tr').count(),5);A.equal(await panel.locator('thead th').count(),3);A.equal(await panel.locator('thead th').nth(2).textContent(),lang==='ru'?'Собственный калькулятор':lang==='en'?'Your own calculator':'Өз калькуляторыңыз');
  await p.waitForFunction(()=>document.querySelector('[data-nomad-traffic-value]')?.textContent==='63');A.match(await panel.locator('[data-nomad-traffic-stats]').textContent(),/GitHub/);
  A.equal(await panel.locator('[data-nomad-download-html]').evaluate(e=>e.closest('td').querySelectorAll('[data-nomad-traffic-stats]').length),1);
  const mail=await panel.locator('.nomad-embed-contact').getAttribute('href');A.ok(mail.startsWith('mailto:nomad260393@gmail.com?subject='));
  await shot('b2b-open','#nomad360-embed');
  if(width===390){
   const next=lang==='ru'?'en':lang==='en'?'kk':'ru';
   await p.evaluate(next=>Nomad360UI.setLanguage(next),next);await settle(p);
   A.equal(await embed.locator('h2').textContent(),consultingTitles[next]);
   A.equal(await embed.locator('.nomad-embed-b2b-slogan').textContent(),await tr('interface.header.embedB2BSlogan'));
   A.equal(await benefits.locator('li').count(),3);
   A.equal(await benefits.locator('li').nth(1).textContent().then(x=>x.trim()),'2'+await tr('interface.header.embedB2BPoints.1'));
   A.equal(await toggle.getAttribute('aria-expanded'),'true','Open comparison survives language switch');
   A.equal(await panel.isVisible(),true);
   await p.evaluate(lang=>Nomad360UI.setLanguage(lang),lang);await settle(p);
   A.equal(await embed.locator('h2').textContent(),consultingTitles[lang]);
   A.equal(await panel.isVisible(),true);
  }
  await toggle.click();A.equal(await panel.isVisible(),false);await toggle.click();
  for(const id of ['nomad360-license','nomad360-data']){const d=p.locator('#'+id);await d.locator('summary').focus();await p.keyboard.press('Enter');A.equal(await d.evaluate(e=>e.open),true);}
  A.equal((await p.locator('#nomad360-license .nomad-license-terms>p').first().textContent()),await tr('interface.header.licenseCopy'));A.equal(await p.locator('#nomad360-data>p').textContent(),await tr('interface.header.dataCopy'));A.equal(await p.locator('#nomad360-license .nomad-license-terms a').getAttribute('href'),'https://kazartsevev.github.io/shelter-partner-directory/license/'+(lang==='en'?'en/':lang==='kk'?'kk/':''));
  await shot('footer-open','.nomad-footer-meta');
  await p.addScriptTag({path:path.join(root,'tests/helpers/contrast.cjs')});const contrast=await p.evaluate(()=>Object.fromEntries(['#nomad360-intro','#nomad360-about','#nomad360-embed','.nomad-footer-meta'].map(s=>{const a=NomadContrast.audit(document.querySelector(s));return [s,{count:a.count,minimum:a.minimum,failures:a.failures}]})));for(const v of Object.values(contrast))A.deepEqual(v.failures,[]);
  const geometry=await p.evaluate(audit);A.equal(geometry.overflow,false);A.deepEqual(geometry.bad,[]);A.deepEqual(geometry.gaps,[]);A.deepEqual(errors,[]);
  if(width===390){
   // IRBIS-07 retains the actual payment controls inside deliberately collapsed disclosures.
   // Open them as a real visitor would: do not bypass visibility or fabricate payment state.
   const irbis=await p.locator('#nomad360-irbis-support-disclosure').count()===1;
   if(irbis){
    await p.locator('#nomad360-irbis-support-disclosure > summary').click();
    await p.locator('#nomad360-irbis-kaspi > summary').click();
    if(lang==='ru')await p.locator('#nomad360-irbis-ozon > summary').click();
   }
   await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:base});await p.locator('.nomad-pay-kaspi [data-nomad-copy]').click();A.equal(await p.evaluate(()=>navigator.clipboard.readText()),'+7 777 129 56 93');if(lang==='ru'){await p.locator('.nomad-pay-ozon [data-nomad-copy]').click();A.equal(await p.evaluate(()=>navigator.clipboard.readText()),'+7 977 986 74 41');}
   // Existing header links must reveal their collapsed targets.
   const burger=p.locator('.nomad-burger');if(await burger.isVisible())await burger.click();await p.locator('[data-nomad-go="nomad360-ai"]').click();await settle(p);A.equal(await p.locator('#nomad360-product-details').evaluate(e=>e.open),true);
   await p.route('**/Marketing_calc.HTML',r=>r.abort());await p.locator('[data-nomad-download-html]').click();await p.waitForFunction(()=>!document.querySelector('[data-nomad-download-html]').disabled);A.equal(await p.locator('[data-nomad-embed-retry]').isVisible(),false);await p.unroute('**/Marketing_calc.HTML');
   let wait=p.waitForEvent('download');await p.locator('[data-nomad-download-html]').click();let d=await wait;A.equal(await d.failure(),null);A.equal(d.suggestedFilename(),'Nomad360-calculator-embed.html');portable=fs.readFileSync(await d.path(),'utf8');A.match(portable,/data:font\/woff2;base64/);A.doesNotMatch(portable,/src="\.\/|href="\.\/[^"#]+\.css/);
   A.equal(await p.locator('[data-nomad-embed-status]').textContent(),await tr('interface.header.embedReady'));A.equal(await p.locator('[data-nomad-embed-retry]').isVisible(),true);wait=p.waitForEvent('download');await p.locator('[data-nomad-retry-download]').click();d=await wait;A.equal(await d.failure(),null);A.equal(fs.readFileSync(await d.path(),'utf8'),portable);
   const saved=await ctx.newPage();await saved.goto(base+'portable.html',{waitUntil:'domcontentloaded'});await saved.addStyleTag({path:path.join(out,'utilities.css')});await saved.evaluate(l=>Nomad360UI.setLanguage(l),lang);await settle(saved);
   for(const id of ['nomad360-intro','nomad360-about','nomad360-ai','nomad360-factory','nomad360-contacts','nomad360-support','nomad360-license','nomad360-data','nomad360-official'])A.equal(await saved.locator('#'+id).count(),1);
   A.equal(await saved.locator('#nomad360-support .nomad-pay-ozon').count(),lang==='ru'?1:0,'Portable HTML retains RU-only Ozon visibility');
   A.match(await saved.locator('.nomad-logo').getAttribute('src'),/^data:image/);A.equal(await saved.locator('[data-nomad-embed-toggle]').getAttribute('aria-expanded'),'false');A.equal(await saved.locator('#nomad360-official a').isVisible(),true);A.equal((await saved.evaluate(audit)).overflow,false);
   await saved.locator('#nomad360-about').screenshot({path:path.join(out,`${lang}-390-portable.png`)});exports.push({lang,bytes:Buffer.byteLength(portable),downloads:2,complete:true});await saved.close();
  }
  cases.push({lang,width,offer,geometry,flow,contrast,files});await ctx.close();
 }
 fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({specBase:'538565e',cases,exports},null,2));console.log('MARKETING_CURRENT_GREEN',JSON.stringify({cases:cases.length,screenshots:cases.reduce((n,c)=>n+c.files.length,0)+exports.length,exports:exports.length,downloads:exports.length*2}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error('MARKETING_CURRENT_RED',e);process.exitCode=1;});
