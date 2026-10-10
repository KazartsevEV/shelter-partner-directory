const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
const entry=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
async function browserCase(browser,locale,expected){
 const context=await browser.newContext({locale,viewport:{width:390,height:844}});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try{
  await page.goto(entry,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#nomad360-hero h2');
  A.equal(await page.locator('html').getAttribute('lang'),expected.lang);
  A.match(await page.locator('#nomad360-hero').textContent(),expected.tagline);
  const approved={
   ru:['Бизнес-калькулятор','Каким бизнесом мне выгодно заниматься?',
     'Рассчитайте идею или существующий бизнес за 20 минут и узнайте, что принесет живые деньги.'],
   en:['Business calculator','Which business would be most profitable for me?',
     'Calculate your business idea or existing business in 20 minutes and see what will generate actual cash.'],
   kk:['Бизнес-калькулятор','Маған қандай бизнеспен айналысқан тиімді?',
     'Бизнес-идеяңызды немесе жұмыс істеп тұрған бизнесіңізді 20 минутта есептеп, нақты ақшаны қай бағыт әкелетінін анықтаңыз.']
  };
  A.deepEqual(await page.locator('#nomad360-hero h1, #nomad360-hero h2, #nomad360-hero h3').allTextContents(),approved[expected.lang],
    'Approved H1 → H2 → H3 must have exact text and order');
  A.equal(await page.locator('#nomad360-calculation-list ul > li').count(),6,
    'Original six-point calculation list must remain visible');
  A.equal(await page.locator('#nomad360-calculation-list ul').isVisible(),true);
  const lead={ru:'После расчёта вы получите:',en:'After the calculation, you get:',kk:'Есеп нәтижесінде аласыз:'}[expected.lang];
  await page.waitForFunction(v=>document.querySelector('#nomad360-calculation-list p')?.textContent?.trim()===v,lead);
  const bullets=await page.locator('#nomad360-calculation-list ul li').allTextContents();
  A.match(bullets[0],{ru:/Себестоимость/,en:/Cost per product/,kk:/өзіндік құны/}[expected.lang]);
  A.match(bullets[5],{ru:/Денежный поток/,en:/Monthly cash flow/,kk:/Ай сайынғы ақша ағыны/}[expected.lang]);
  A.equal(await page.locator('#home-screen').evaluate(el=>
    [...el.children].findIndex(child=>child.id==='nomad360-hero')+1===
    [...el.children].findIndex(child=>child.id==='nomad360-calculation-list')),true,
    'Calculation list must directly follow heading block');
  A.equal(await page.locator('#home-screen > .card > h1').count(),0,
    'Do not duplicate a second homepage H1');
  const presentation=await page.evaluate(()=>{
    const hero=document.getElementById('nomad360-hero');
    const footer=document.getElementById('nomad360-footer');
    const heroStyle=getComputedStyle(hero),footerStyle=getComputedStyle(footer);
    return {
      heroBackground:heroStyle.backgroundImage,
      heroFill:heroStyle.backgroundColor,
      heroShadow:heroStyle.boxShadow,
      heroDecoration:getComputedStyle(hero,'::after').content,
      footerBackground:footerStyle.backgroundColor,
      footerShadow:footerStyle.boxShadow
    };
  });
  A.equal(presentation.heroBackground,'none','No green gradient behind homepage H1-H3');
  A.ok(presentation.heroFill==='rgba(0, 0, 0, 0)'||presentation.heroFill==='transparent',
    'Homepage hero must be transparent, not a banner');
  A.equal(presentation.heroShadow,'none','Homepage hero must not cast a card shadow');
  A.equal(presentation.heroDecoration,'none','Remove green banner ornament');
  A.equal(presentation.footerBackground,'rgb(22, 55, 90)',
    'Claude footer must retain approved navy background');
  A.equal(presentation.footerShadow,'none','Support footer should not look like a colored banner');
  for(const id of ['saved-product-entry','portfolio-v2-linked-resume-home']){
    A.equal(await page.locator('#'+id).evaluate(e=>e.className.includes('emerald')),false,
      'Home saved-state UI should use neutral colors: '+id);
  }

  const choice=page.locator('#nomad360-selling-choice');
  const choiceTexts={
    ru:['Что вы продаете?','Товар','Услугу','У меня уже много разного'],
    en:['What do you sell?','Product','A service','I already sell several different things'],
    kk:['Не сатасыз?','Тауар','Қызмет','Менде әртүрлі тауарлар мен қызметтер бар']
  }[expected.lang];
  await page.waitForFunction(text=>document.querySelector('#nomad360-selling-heading')?.textContent?.trim()===text,
    choiceTexts[0]);
  A.equal(await choice.locator('h4').count(),1);
  A.equal(await choice.locator('button').count(),3,'Selection block must have three equivalent buttons');
  A.deepEqual((await choice.locator('button').allTextContents()).map(x=>x.trim()),choiceTexts.slice(1,4));
  A.equal(await choice.locator('a').count(),0,'Third item must be a real button, not a text link');
  A.equal(await choice.locator('.nd-cta-primary').count(),3,'Primary routes use semantic CTA roles');
  A.equal(await page.locator('#nomad360-license .nomad-embed-download').count(),1,
    'CTA-01 preserves the real embed-download button');
  A.equal(await page.locator('link[href="./nomad360_design_system.css"]').count(),1);
  // TYPE-01: one brand font with an explicit readable type scale and high
  // contrast, even at 390px outdoors. The footer/header have separate owners.
  const typography=await page.evaluate(()=>{
    const root=getComputedStyle(document.documentElement),at=selector=>{
      const node=document.querySelector(selector),css=getComputedStyle(node);
      return {font:css.fontFamily,px:parseFloat(css.fontSize),weight:Number(css.fontWeight),
        color:css.color,lineHeight:parseFloat(css.lineHeight)};
    };
    return {
      font:root.getPropertyValue('--nd-font').trim(),
      body:root.getPropertyValue('--nd-type-body').trim(),
      note:root.getPropertyValue('--nd-type-note').trim(),
      outcome:at('#nomad360-calculation-list li'),
      noteCopy:at('#nomad360-home-secondary .nomad-recovery-note'),
      hero:at('#nomad360-hero h3'),
      recoveryTitle:at('#nomad360-home-secondary .nomad-recovery-title'),
      example:at('#nomad360-home-secondary .nomad-example-link')
    };
  });
  A.match(typography.font,/IBM Plex Sans/,'Nomad360 must declare one coherent brand typeface');
  A.equal(typography.body,'17px');
  A.equal(typography.note,'15px');
  A.ok(typography.outcome.px>=17&&typography.outcome.weight>=500,'Result explanations cannot be fine print');
  A.ok(typography.noteCopy.px>=15,'Secondary notes remain readable on a phone');
  A.ok(typography.hero.px>=17,'Subtitle remains legible on mobile');
  A.ok(typography.recoveryTitle.weight>=700,'Saved work gets a visible text hierarchy');
  A.ok(typography.example.px>=16,'Auxiliary links stay tappable and legible');
  A.equal(typography.noteCopy.color,'rgb(64, 84, 106)','Muted copy must use legible dark blue-gray');
   const exampleLink=await page.locator('#nomad360-home-secondary .nomad-example-link').evaluate(node=>{
     const css=getComputedStyle(node);return {
       color:css.color,underline:css.textDecorationColor,style:css.textDecorationLine,
       thickness:css.textDecorationThickness
     };
   });
   A.equal(exampleLink.color,'rgb(22, 55, 90)','Secondary link stays on-brand navy');
   A.equal(exampleLink.underline,'rgb(184, 87, 58)','Secondary link underline stays terracotta');
   A.match(exampleLink.style,/underline/,'Link should have a real underline, not a bar border');
   A.equal(exampleLink.thickness,'2px','Underline is conspicuous without becoming a CTA');
   const recoveryText=await page.locator('#resume-own-product').textContent();
   A.equal(recoveryText.trim(),{ru:'Продолжить работу с товарами',
     en:'Continue working on my products',kk:'Тауарлармен жұмысты жалғастыру'}[expected.lang],
     'Short saved-work action remains localized');

  const mobileGeometry=await choice.locator('button').evaluateAll(buttons=>buttons.map(button=>{
    const rect=button.getBoundingClientRect(),style=getComputedStyle(button);
    return {width:Math.round(rect.width),height:Math.round(rect.height),
      radius:style.borderTopLeftRadius,borderColor:style.borderTopColor,
      font:style.fontFamily,background:style.backgroundColor,color:style.color,
      fontSize:parseFloat(style.fontSize),labelContent:getComputedStyle(button,'::before').content};
  }));
  A.equal(new Set(mobileGeometry.map(x=>x.width)).size,1,'Three choices must have identical mobile widths');
  A.equal(new Set(mobileGeometry.map(x=>x.height)).size,1,'Three choices must have identical mobile heights');
  A.equal(new Set(mobileGeometry.map(x=>x.radius)).size,1,'All choices share the same border geometry');
  A.equal(new Set(mobileGeometry.map(x=>x.background)).size,1,'All choices share the same background');
  A.ok(mobileGeometry.every(x=>x.width>200&&x.height>=84&&x.height<=110),'Choice buttons keep proportionate 84–110px tap targets');
  A.ok(mobileGeometry.every(x=>x.background==='rgb(237, 142, 99)' && x.color==='rgb(22, 55, 90)'),
    'All three primary routes must use warm orange with navy text');
  A.ok(mobileGeometry.every(x=>x.fontSize>=19&&x.fontSize<=22),
    'Mobile choice text remains readable but proportional to each tap target');
  A.ok(mobileGeometry.every(x=>x.labelContent==='none'),
    'Remove the small 01/02/03 labels from the decision buttons');
  const savedTreatment=await page.locator('#saved-product-entry').evaluate(el=>{
    const card=getComputedStyle(el),action=getComputedStyle(el.querySelector('button'));
    return {border:card.borderLeftWidth,bg:card.backgroundColor,
      actionBg:action.backgroundColor,actionText:action.color};
  });
  A.equal(savedTreatment.border,'1px','Saved work uses a restrained single-pixel border');
  A.equal(savedTreatment.actionBg,'rgb(255, 255, 255)',
    'Resume calculation should remain secondary to main selling choices');
  A.equal(savedTreatment.actionText,'rgb(22, 55, 90)',
    'Resume calculation keeps sufficient contrast and a clear action label');
  A.equal(await page.locator('#nomad360-home-secondary').evaluate(e=>getComputedStyle(e).boxShadow),'none',
    'No legacy floating/nested homepage card shadow');
  A.match(await page.locator('#nomad360-calculation-list li').first().evaluate(
    e=>getComputedStyle(e,'::before').content),/counter\(deliverable/,'Outcomes use a numbered CSS counter');
  await choice.locator('#start-service').click();
  A.equal(await page.locator('#service-work-screen').isVisible(),true,'Service must open online/offline branch');
  const pathColors=await page.locator('#service-work-screen .nd-path-card').evaluateAll(buttons=>buttons.map(b=>({
    background:getComputedStyle(b).backgroundColor,
    label:getComputedStyle(b.querySelector('div')).color
  })));
  A.equal(pathColors.length,2,'Two online/offline routes use semantic path choices');
  A.ok(pathColors.every(x=>x.background==='rgb(237, 142, 99)'&&x.label==='rgb(17, 40, 63)'),
    'Service path choices must share orange surface and navy readable labels');
  await page.evaluate(()=>showHome());
  await choice.locator('#start-own-product').click();
  A.equal(await page.locator('#product-screen').isVisible(),true,'Product must open product branch');
  const productCta=await page.locator('#product-screen button[type="submit"].nd-cta-primary').evaluate(e=>{
    const x=getComputedStyle(e);return {background:x.backgroundColor,color:x.color};
  });
  A.equal(productCta.background,'rgb(237, 142, 99)','V1 calculate CTA is orange');
  A.equal(productCta.color,'rgb(22, 55, 90)','V1 CTA label is navy');
  const typeField=await page.locator('#product-name-input').evaluate(el=>({
    size:parseFloat(getComputedStyle(el).fontSize),weight:Number(getComputedStyle(el).fontWeight)
  }));
  A.ok(typeField.size>=17&&typeField.weight>=500,'Product form fields use standard readable type');
  await page.evaluate(()=>{showHome();window.scrollTo({top:0,behavior:'instant'});});
  await page.waitForTimeout(250);
  await page.evaluate(()=>{
    const el=document.getElementById('start-multi-portfolio');
    window.__nomadV2Trace=[];
    const traceEvent=e=>window.__nomadV2Trace.push({phase:e.type,id:e.target.id,tag:e.target.tagName,
      text:e.target.textContent.slice(0,65), trusted:e.isTrusted});
    document.addEventListener('pointerdown',traceEvent,true);
    document.addEventListener('click',traceEvent,true);
    el.addEventListener('click',e=>window.__nomadV2Trace.push({phase:'target',isTrusted:e.isTrusted}),{capture:true,once:true});
    const f=window.openPortfolioV2;
    window.openPortfolioV2=function(...args){
      window.__nomadV2Trace.push({phase:'handler',args});
      const result=f.apply(this,args);
      window.__nomadV2Trace.push({phase:'after',hidden:document.getElementById('portfolio-v2-screen').hidden});
      return result;
    };
  });
  await choice.locator('#start-multi-portfolio').scrollIntoViewIfNeeded();
  await choice.locator('#start-multi-portfolio').click();
  await page.waitForTimeout(120);
  const v2Visible=await page.locator('#portfolio-v2-screen').isVisible();
  const v2Diagnostics=await page.evaluate(()=>({
    active:document.querySelectorAll('body > section:not([hidden])').length,
    portfolioHidden:document.getElementById('portfolio-v2-screen').hidden,
    portfolioClass:document.getElementById('portfolio-v2-screen').className,
    homeHidden:document.getElementById('home-screen').hidden,
    portfolioFn:typeof window.openPortfolioV2,
    screenStyle:getComputedStyle(document.getElementById('portfolio-v2-screen')).display,
    handler:document.getElementById('start-multi-portfolio').getAttribute('onclick'),
    errors:window.__test_errors||[],
    formState:document.getElementById('product-screen').hidden,
    trace:window.__nomadV2Trace||[],
    target:document.querySelector('#start-multi-portfolio').getBoundingClientRect().toJSON(),
    atCenter:(()=>{
      const r=document.querySelector('#start-multi-portfolio').getBoundingClientRect();
      const el=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return {id:el?.id,tag:el?.tagName,text:el?.textContent.slice(0,70)}
    })()
  }));
  A.equal(v2Visible,true,'Third choice button must open V2 '+locale+': '+JSON.stringify({...v2Diagnostics,pageErrors:errors}));
  await page.mouse.move(0,0);
  await page.waitForTimeout(220); // let hover/transition settle before measuring normal state
  const v2Action=await page.locator('[data-p2-save]').evaluate(e=>{
    const x=getComputedStyle(e);return {background:x.backgroundColor,color:x.color};
  });
  A.equal(v2Action.background,'rgb(237, 142, 99)','V2 primary save CTA is orange');
  A.equal(v2Action.color,'rgb(22, 55, 90)','V2 CTA label is navy');
  A.equal(await page.locator('[data-p2-add-sku]').evaluate(e=>getComputedStyle(e).backgroundColor),
    'rgb(22, 55, 90)','Add a SKU stays a blue operational action');
  const v2Type=await page.locator('[data-p2-path="marketing.budget"]').evaluate(el=>({
    size:parseFloat(getComputedStyle(el).fontSize),
    labelSize:parseFloat(getComputedStyle(el.closest('label').querySelector('span')).fontSize)
  }));
  A.ok(v2Type.size>=17&&v2Type.labelSize>=15,'V2 data-entry typography must match V1');
  A.ok(await page.evaluate(()=>PortfolioV2UI.load()),'V2 should create a draft on first visit');
  await page.evaluate(()=>{
    const draft=PortfolioV2UI.load();
    draft.skus[0].name='retained-v2-item';
    localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(draft));
    showHome();
  });
  await choice.locator('#start-multi-portfolio').click();
  A.equal((await page.evaluate(()=>PortfolioV2UI.getState())).skus[0].name,'retained-v2-item',
    'Third choice must resume an existing V2 draft, not overwrite it');
  await page.evaluate(()=>showHome());


  // Recovered Claude header: mobile drawer and all valid local anchors.
  const header=page.locator('#nomad360-header');
  A.equal(await header.count(),1);
  A.equal(await header.locator('.nomad-logo').getAttribute('src'),'./nomad360_wolf_open_circle.png');
  A.equal(await header.locator('.nomad-nav a').count(),5);
  A.equal(await header.locator('#nomad360-lang-select').count(),1);
  A.equal(await header.locator('.nomad-burger').getAttribute('aria-expanded'),'false');
  await header.locator('.nomad-burger').click();
  A.equal(await header.locator('.nomad-burger').getAttribute('aria-expanded'),'true');
  A.equal(await header.locator('.nomad-nav').isVisible(),true);
  const targets=await header.locator('[data-nomad-go]').evaluateAll(links=>links.map(x=>
    ({target:x.dataset.nomadGo,exists:!!document.getElementById(x.dataset.nomadGo)})));
  A.ok(targets.every(x=>x.exists),'header destination missing: '+JSON.stringify(targets));
  await page.keyboard.press('Escape');
  A.equal(await header.locator('.nomad-burger').getAttribute('aria-expanded'),'false');
  A.equal(await header.locator('.nomad-nav').isVisible(),false);
  await header.locator('.nomad-burger').click();
  await header.locator('a[data-nomad-go="nomad360-about"]').click();
  A.equal(await header.locator('.nomad-burger').getAttribute('aria-expanded'),'false');
  A.equal(await page.locator('#nomad360-information .nomad-info-block').count(),2,
    'About and Contacts stay above the unified navy footer');
  A.doesNotMatch(await page.locator('#nomad360-about').textContent(),/20 минут|20 minutes|20 минут/,'calculator figures belong only in hero');
  A.equal(await page.locator('#nomad360-contacts a[href="https://t.me/Kazartsev_EV"]').count(),1);

  await page.setViewportSize({width:1440,height:900});
  A.equal(await header.locator('.nomad-burger').isVisible(),false,
    'desktop must show horizontal menu instead of mobile toggle');
  A.equal(await header.locator('.nomad-nav').isVisible(),true);
  A.equal(await header.locator('.nomad-cta').isVisible(),true);
  const supportStyle=await header.locator('.nomad-cta').evaluate(e=>{
    const x=getComputedStyle(e);return {background:x.backgroundColor,color:x.color};
  });
  A.equal(supportStyle.background,'rgb(237, 142, 99)');
  A.equal(supportStyle.color,'rgb(22, 55, 90)');
  const desktopChoiceRects=await choice.locator('button').evaluateAll(buttons=>buttons.map(b=>{
    const r=b.getBoundingClientRect();return {x:r.x,width:r.width,height:r.height};
  }));
  A.ok(desktopChoiceRects[0].x<desktopChoiceRects[1].x &&
    desktopChoiceRects[1].x<desktopChoiceRects[2].x,'Three choice nodes share a desktop row');
  A.ok(Math.max(...desktopChoiceRects.map(x=>x.width))-Math.min(...desktopChoiceRects.map(x=>x.width))<2,
    'All desktop choice nodes have equal width');
  const homeBounds=await choice.evaluate(el=>({
    viewport:innerWidth,area:el.getBoundingClientRect().toJSON(),
    content:el.scrollWidth,inner:el.clientWidth,
    choices:[...el.querySelectorAll('.nomad-choice-button')].map(b=>b.getBoundingClientRect().toJSON())
  }));
  A.ok(homeBounds.area.x>=-1 && homeBounds.area.right<=homeBounds.viewport+1,
    'Choice card must fit within desktop viewport: '+JSON.stringify(homeBounds));
  A.ok(homeBounds.content<=homeBounds.inner+1,
    'Choice card must not overflow horizontally: '+JSON.stringify(homeBounds));
  await page.setViewportSize({width:390,height:844});
  A.equal(await header.locator('.nomad-burger').isVisible(),true);

  A.doesNotMatch(await page.locator('#nomad360-hero').textContent(),/MBA|дорогие консультанты|expensive consulting/);
  A.match(await page.locator('#nomad360-footer').textContent(),/AI-маркетолог|AI Marketer/i);
  const footer=await page.locator('#nomad360-footer').textContent();
  A.ok(footer.includes('+7 777 129 56 93')&&footer.includes('+7 977 986 74 41'));
  A.equal(await page.locator('#nomad360-footer').count(),1,'Exactly one new footer');
  A.equal(await page.locator('body > footer').count(),1,'Remove the old duplicate legal footer');
  A.equal(await page.locator('#nomad360-footer .nomad-unit-note').textContent(),
    {ru:'* у.е. — деньги в вашей валюте.',
     en:'* currency units — amounts are shown in your chosen currency.',
     kk:'* ш.б. — сіздің валютаңыздағы ақша.'}[expected.lang]);
  A.equal(await page.locator('#nomad360-footer .nomad-product').count(),2,'AI Marketer and Content Factory cards preserved');
  A.equal(await page.locator('#nomad360-footer .nomad-qr').count(),2,'Crypto QR codes preserved');
  A.equal(await page.locator('#nomad360-footer .nomad-copy').count(),5,'All five payment methods must retain copy actions');
  A.equal(await page.locator('#nomad360-footer #nomad360-license').count(),1,'License is in new footer');
  A.equal(await page.locator('#nomad360-footer #nomad360-data').count(),1,'Data statement is in new footer');
  A.equal(await page.locator('#nomad360-footer #nomad360-official').count(),1,'Official contact is in new footer');
  A.equal(await page.locator('#nomad360-footer a.nomad-official-mail').getAttribute('href'),
    'mailto:nomad260393@gmail.com');
  A.ok(footer.includes('Платите за то, что покупаете.')||footer.includes('Pay for what you buy.')||
    footer.includes('Сатып алғаныңызға ғана төлеңіз.'),'AI Marketer copy survived');
  A.equal(await page.locator('#nomad360-contacts a[href^="mailto:"]').count(),1);
  A.ok(await page.locator('#nomad360-contacts a[href*="threads.com/@nomad260393"]').count());
  const payload=fixture();
  await page.evaluate(p=>{
    LinkedPortfolioV2UI.importFromV1({skus:p.skus.filter(x=>x.source!=='online-service'),tax:p.tax});
    LinkedPortfolioV2UI.appendOnline(p.skus.find(x=>x.source==='online-service'));
    const state=LinkedPortfolioV2UI.getState();
    state.resources=p.resources;state.offers=p.offers;
    state.forecastMonths=p.forecastMonths;
    state.recurringDemandApproved=p.recurringDemandApproved;
    localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify(state));
    LinkedPortfolioV2UI.resume();
  },payload);
  const before=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(before.ready,true,JSON.stringify(before.errors));
  A.equal(before.items.length,5);
  A.equal(await page.locator('[data-nomad-price-toggle]').isEnabled(),true);
  await page.locator('[data-nomad-price-toggle]').click();
  const preview=page.locator('#nomad360-price-preview');
  A.equal(await preview.isVisible(),true);
  A.equal(await preview.locator('tbody tr').count(),5);
  const visible=await preview.textContent();
  for(const title of ['own','resale','drop','salon','agent'])A.ok(visible.includes(title),title+' missing from price list');
  A.ok(visible.includes('48,27')||visible.includes('48.27'),'own price 48.27 expected');
  await page.evaluate(()=>{window.__nomadPrintCount=0;window.print=()=>window.__nomadPrintCount++});
  await page.locator('[data-nomad-export="price"]').click();
  A.equal(await page.evaluate(()=>window.__nomadPrintCount),1);
  A.equal(await page.locator('#nomad360-print-sheet tbody tr').count(),5);
  A.equal(await page.locator('#nomad360-print-sheet').getAttribute('data-mode'),'price');
  await page.locator('[data-nomad-export="report"]').click();
  A.equal(await page.evaluate(()=>window.__nomadPrintCount),2);
  A.equal(await page.locator('#nomad360-print-sheet').getAttribute('data-mode'),'report');
  const printable=await page.locator('#nomad360-print-sheet').textContent();
  A.match(printable.replace(/[\u00a0\u202f]/g,' '),/2[\s,]*119/,'income from approved 5-SKU scenario');
  A.equal(await page.locator('#nomad360-print-sheet .nomad-export-table').count()>=3,true);
  await page.emulateMedia({media:'print'});
  const pdf=await page.pdf({format:'A4',printBackground:true});
  A.equal(pdf.subarray(0,4).toString(),'%PDF');
  A.ok(pdf.length>6000,'nontrivial PDF report');
  await page.emulateMedia({media:'screen'});
  // Changing locale must retranslate the already OPEN price preview and the
  // previously generated report sheet without rerunning window.print().
  for(const chosen of ['en','kk','ru']){
   await page.locator('#nomad360-lang-select').selectOption(chosen);
   A.equal(await page.locator('html').getAttribute('lang'),chosen);
   A.equal(await page.locator('#nomad360-footer .nomad-unit-note').textContent(),
     {ru:'* у.е. — деньги в вашей валюте.',
      en:'* currency units — amounts are shown in your chosen currency.',
      kk:'* ш.б. — сіздің валютаңыздағы ақша.'}[chosen],
     'Footer currency note must track language switches');
   A.equal(await page.evaluate(()=>window.__nomadPrintCount),2,'locale change must not open another print dialog');
   A.equal(await preview.isVisible(),true,'price preview must remain open after locale change');
   A.equal(await preview.locator('tbody tr').count(),5);
   A.equal(await page.locator('#nomad360-print-sheet').getAttribute('data-mode'),'report');
   const heading={en:'Financial summary',kk:'Қаржылық қорытынды',ru:'Финансовый итог'}[chosen];
   A.ok((await page.locator('#nomad360-print-sheet').textContent()).includes(heading),'print sheet must use selected '+chosen+' language');
   const cadence={en:/Monthly|One-time/,kk:/Ай сайын|Бір рет/,ru:/Ежемесячно|Разово/}[chosen];
   A.match(await page.locator('#nomad360-print-sheet').textContent(),cadence,'report resource cadence translated to '+chosen);
   const localeTag={ru:'ru-RU',kk:'kk-KZ',en:'en-US'}[chosen];
   const browserPrices=await page.evaluate(({localeTag,items})=>{
     const fmt=value=>new Intl.NumberFormat(localeTag,
       {minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
     return items.map(item=>({list:fmt(item.priceList),buyer:fmt(item.priceGross)}));
   },{localeTag,items:before.items});
   const reportPrices=await page.locator('#nomad360-print-sheet .nomad-export-table').first().locator('tbody tr').all();
   A.equal(reportPrices.length,before.items.length);
   for(let i=0;i<before.items.length;i++){
    A.equal((await reportPrices[i].locator('td').nth(2).textContent()).trim(),
      browserPrices[i].list,'print list price must equal approved V2 math in '+chosen);
    A.equal((await reportPrices[i].locator('td').nth(4).textContent()).trim(),
      browserPrices[i].buyer,'print buyer price must equal approved V2 math in '+chosen);
   }
   const previewAction={en:'Create price list',kk:'Прайс-парақ жасау',ru:'Сформировать прайс-лист'}[chosen];
   A.match(await preview.locator('h3').textContent(),new RegExp(previewAction),'open price preview translated to '+chosen);
  }
  await page.locator('#nomad360-lang-select').selectOption('en');
  A.equal(await page.locator('#nomad360-header #nomad360-lang-select').count(),1,
    'header should keep one live language selector after retranslation');
  A.equal(await page.locator('#nomad360-header .nomad-nav a').first().textContent(),'Calculator');
  A.equal(await page.locator('#nomad360-information #nomad360-about h2').textContent(),'About Nomad360');

  A.equal(await page.locator('html').getAttribute('lang'),'en');
  A.match(await page.locator('#nomad360-hero h2').textContent(),/Which business would be most profitable/);
  const after=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(after.cashflow.periodPnl.netProfit,before.cashflow.periodPnl.netProfit,'language cannot touch financial model');
  A.equal(after.items.length,5);
  await page.locator('[data-linked-save]').click();
  await page.locator('[data-linked-back]').click();
  await page.evaluate(()=>showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  const restored=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(restored.ready,true,JSON.stringify(restored.errors));
  A.equal(restored.items.length,5);
  A.equal(restored.cashflow.periodPnl.netProfit,before.cashflow.periodPnl.netProfit);
  // Even after a previously valid PDF is prepared, reducing service capacity
  // invalidates it. A stale sheet cannot be printed as a valid calculation.
  const approvedDraft=await page.evaluate(()=>JSON.stringify(LinkedPortfolioV2UI.getState()));
  const rejected=await page.evaluate(()=>{
    const draft=LinkedPortfolioV2UI.getState();
    draft.skus.find(item=>item.id==='salon').serviceCapacity=1;
    localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify(draft));
    LinkedPortfolioV2UI.resume();
    return LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState());
  });
  A.equal(rejected.ready,false,'capacity failure blocks portfolio approval');
  A.equal(await page.locator('#nomad360-print-sheet').count(),0,
    'previous printable report must be revoked after invalidating calculation');
  A.equal(await page.evaluate(()=>Nomad360UI.savePrint('report')),false);
  A.equal(await page.evaluate(()=>window.__nomadPrintCount),2,
    'invalid portfolio cannot launch a print dialog');
  A.equal(await page.locator('[data-nomad-export="report"]').isDisabled(),true);
  await page.evaluate(draft=>{
    localStorage.setItem('marketingCalcLinkedPortfolioV2',draft);
    LinkedPortfolioV2UI.resume();
  },approvedDraft);
  A.equal(await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()).ready),true);
  A.deepEqual(errors,[]);
  console.log('NOMAD360_UI_PACKAGING_BROWSER_GREEN',JSON.stringify({
    locale,lang:expected.lang,portfolio:5,pdfBytes:pdf.length,priceRows:5,
    printActions:2,financialChanges:0}));
 }finally{await context.close()}
}
async function sourceChoiceCase(browser) {
 const context=await browser.newContext({locale:'ru-RU',viewport:{width:390,height:844}});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try {
  await page.goto(entry,{waitUntil:'domcontentloaded'});
  await page.locator('#start-own-product').click();
   await page.locator('#product-name-input').fill('Футболка');
   await page.locator('#product-screen button[type="submit"]').click();
   A.equal(await page.locator('#product-source-block').isVisible(),true,
     'Product entry should display product sourcing choices');
   A.deepEqual(await page.locator('#product-source-block [data-product-source]').evaluateAll(
     nodes=>nodes.map(n=>n.dataset.productSource)),['own','resale','dropship'],
     'Offline service is accessible only through Service → Offline, never from Product sourcing');
   const routeCards=await page.locator('button.nd-path-card').evaluateAll(nodes=>nodes.map(el=>{
     const label=el.querySelector('div:first-child');
     const css=getComputedStyle(label);
     return {label:el.textContent.trim(),parts:el.children.length,
       hasNote:!!el.querySelector('p,.text-xs,.text-sm'),
       titleSize:parseFloat(css.fontSize),balance:css.textWrap};
   }));
   A.equal(routeCards.length,10,'All ten buying/service/agency path options remain available');
   A.ok(routeCards.every(x=>x.parts===1&&!x.hasNote),
     'Orange path cards contain only the choice label, with no explanatory copy: '+JSON.stringify(routeCards));
   A.ok(routeCards.every(x=>x.titleSize>=18&&x.titleSize<=21),
     'Sourcing, service and agency labels remain proportional to card geometry');
   A.ok(routeCards.every(x=>x.balance==='balance'),
     'Path labels balance lines without orphan words');
   A.equal(await page.locator('#product-source-block [data-product-source="offline-service"]').count(),0,
     'Offline service is not a product procurement route');
  A.deepEqual(errors,[],'Source routing should not throw');
  console.log('NOMAD360_LABEL_ONLY_ROUTE_CHOICES_GREEN');
 }finally{await context.close()}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  await browserCase(browser,'ru-RU',{lang:'ru',tagline:/Каким бизнесом мне выгодно заниматься/});
  await browserCase(browser,'kk-KZ',{lang:'kk',tagline:/Маған қандай бизнеспен айналысқан тиімді/});
  await browserCase(browser,'en-US',{lang:'en',tagline:/Which business would be most profitable/});
  await sourceChoiceCase(browser);
 }finally{await browser.close()}
})().catch(e=>{console.error('NOMAD360_UI_PACKAGING_BROWSER_RED',e.stack||e);process.exitCode=1});
