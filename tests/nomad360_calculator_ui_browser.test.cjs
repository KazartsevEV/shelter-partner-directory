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
   ru:['Бизнес-калькулятор','Из чего состоит этот бизнес и чем и как выгодно заниматься?',
     'Рассчитайте идею или существующий бизнес за 20 минут и узнайте, что приносит живые деньги.'],
   en:['Business calculator','What makes up this business, and which activities are profitable?',
     'Calculate your business idea or existing business in 20 minutes and see what generates actual cash.'],
   kk:['Бизнес-калькулятор','Бұл бизнес неден тұрады және қай бағыт тиімді?',
     'Бизнес-идеяңызды немесе жұмыс істеп тұрған бизнесіңізді 20 минутта есептеп, нақты ақшаны қай бағыт әкелетінін біліңіз.']
  };
  A.deepEqual(await page.locator('#nomad360-hero h1, #nomad360-hero h2, #nomad360-hero h3').allTextContents(),approved[expected.lang],
    'Approved H1 → H2 → H3 must have exact text and order');
  A.equal(await page.locator('#nomad360-calculation-list ol > li').count(),6,
    'Original six-point calculation list must remain visible');
  A.equal(await page.locator('#nomad360-calculation-list ol').isVisible(),true);
  A.equal(await page.locator('#home-screen').evaluate(el=>
    [...el.children].findIndex(child=>child.id==='nomad360-hero')+1===
    [...el.children].findIndex(child=>child.id==='nomad360-calculation-list')),true,
    'Calculation list must directly follow heading block');
  A.equal(await page.locator('#home-screen > .card > h1').count(),0,
    'Do not duplicate a second homepage H1');

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
  A.equal(await page.locator('#nomad360-information .nomad-info-block').count(),6);
  A.doesNotMatch(await page.locator('#nomad360-about').textContent(),/20 минут|20 minutes|20 минут/,'calculator figures belong only in hero');
  A.equal(await page.locator('#nomad360-contacts a[href="https://t.me/Kazartsev_EV"]').count(),1);

  await page.setViewportSize({width:1440,height:900});
  A.equal(await header.locator('.nomad-burger').isVisible(),false,
    'desktop must show horizontal menu instead of mobile toggle');
  A.equal(await header.locator('.nomad-nav').isVisible(),true);
  A.equal(await header.locator('.nomad-cta').isVisible(),true);
  await page.setViewportSize({width:390,height:844});
  A.equal(await header.locator('.nomad-burger').isVisible(),true);

  A.doesNotMatch(await page.locator('#nomad360-hero').textContent(),/MBA|дорогие консультанты|expensive consulting/);
  A.match(await page.locator('#nomad360-footer').textContent(),/AI-маркетолог|AI marketer|AI-маркетолог/);
  const footer=await page.locator('#nomad360-footer').textContent();
  A.ok(footer.includes('+7 777 129 56 93')&&footer.includes('+7 977 986 74 41'));
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
  A.match(await page.locator('#nomad360-hero h2').textContent(),/What makes up this business/);
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
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  await browserCase(browser,'ru-RU',{lang:'ru',tagline:/Из чего состоит этот бизнес/});
  await browserCase(browser,'kk-KZ',{lang:'kk',tagline:/Бұл бизнес неден тұрады/});
  await browserCase(browser,'en-US',{lang:'en',tagline:/What makes up this business/});
 }finally{await browser.close()}
})().catch(e=>{console.error('NOMAD360_UI_PACKAGING_BROWSER_RED',e.stack||e);process.exitCode=1});
