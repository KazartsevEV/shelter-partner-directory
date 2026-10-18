'use strict';
// L0 discovery, NOT L6 acceptance: record gaps/overflow without hiding them.
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
const root=path.join(__dirname,'..'),out=path.join(root,'artifacts/localization-l0');fs.mkdirSync(out,{recursive:true});
const url=process.env.NOMAD360_TEST_URL||pathToFileURL(path.join(root,'Marketing_calc.HTML')).href;
const texts=new Map(),cases=[];
const widths=process.env.NOMAD360_L0_WIDTHS?process.env.NOMAD360_L0_WIDTHS.split(',').map(Number):[320,360,390,430,768,1280];
A.ok(widths.length&&widths.every(w=>[320,360,390,430,768,1280].includes(w)),'Unsupported census width');
const catalogs=require('../docs/localization/l0/catalog.json').catalogs;
const knownKK=new Set(catalogs.map(c=>c.translations.kk?.replace(/\s+/g,' ').trim()).filter(Boolean));
async function settle(page){await page.waitForTimeout(100)}
async function finance(page){return page.evaluate(()=>{
 const standalone=PortfolioV2UI.getState(),linked=LinkedPortfolioV2UI.getState();
 // Only diagnostic prose is expected to change with locale. Preserve its
 // shape/count and every numerical value, enum, ID and user-owned string.
 function canonical(v,key=''){
  const prose=['errors','warnings','message','error'].includes(key);
  if(typeof v==='string'&&prose)return '<localized diagnostic>';
  if(Array.isArray(v))return v.map(x=>typeof x==='string'&&prose?'<localized diagnostic>':canonical(x));
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,canonical(x,k)]));
  return v;
 }
 return {
 currency:Nomad360Currency.get(),
 inputs:[...document.querySelectorAll('input,select,textarea')].filter(e=>e.id!=='nomad360-lang-select'&&e.type!=='file').map(e=>({key:e.id||e.name||e.dataset.p2Path||e.dataset.linkedPath||e.tagName,value:e.value})),
 v1:typeof productPortfolio==='undefined'?null:productPortfolio,
 standalone,linked,
 full:Nomad360FullServiceUI.getInput(),
 results:canonical({standalone:standalone?Nomad360PaymentUI.buildPortfolio(standalone):null,
 linked:linked?LinkedPortfolioV2Engine.build(linked):null,
 full:Nomad360FullServiceUI.getResult(),v1:typeof productPortfolio!=='undefined'&&productPortfolio.length?calculateProductPortfolio():null})
 };
})}
async function examine(page,stage,width){
 const before=await finance(page);
 for(const lang of ['ru','en','kk']){
  await page.locator('#nomad360-lang-select').selectOption(lang);await settle(page);
  const semantic=await page.evaluate(language=>({
   mismatches:[...document.querySelectorAll('[data-i18n]')].filter(node=>!node.children.length&&!node.matches('input,select,textarea')).map(node=>{const p=JSON.parse(node.getAttribute('data-i18n-params')||'{}');return {key:node.dataset.i18n,actual:node.textContent,expected:Nomad360LocaleCore.t(node.dataset.i18n,language,p)}}).filter(x=>x.actual!==x.expected),
   heading:document.getElementById('nomad360-selling-heading').textContent,
   expectedHeading:Nomad360LocaleCore.t('business.whatYouSell',language),
   currency:document.getElementById('business-currency-question').textContent,
   expectedCurrency:Nomad360LocaleCore.t('business.currencyQuestion',language)
  }),lang);
  A.deepEqual(semantic.mismatches,[],'Semantic presentation and immutable parameters '+lang);
  A.equal(semantic.heading,semantic.expectedHeading,'Semantic heading '+lang);
  A.equal(semantic.currency,semantic.expectedCurrency,'Semantic currency label '+lang);
  A.deepEqual(await finance(page),before,'language changed source data at '+stage+' '+width+' '+lang);
  const census=await page.evaluate(()=>{
   const records=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
   let n;while((n=walker.nextNode())){
    const p=n.parentElement,t=n.nodeValue?.replace(/\s+/g,' ').trim();
    if(!p||!t||!p.getClientRects().length||p.closest('script,style,noscript,template,pre,code,textarea,[hidden],.hidden,[aria-hidden="true"],.product-name-live,[contenteditable="true"]'))continue;
    const guard=p.closest('[data-nomad-no-translate]');
    if(guard&&!['nomad360-hero','nomad360-footer','nomad360-portfolio-tools','nomad360-language-chooser'].includes(guard.id)&&!p.closest('[data-i18n]'))continue;
    records.push({kind:'text',context:p.closest('[id]')?.id||p.tagName,text:t});
   }
   for(const e of document.querySelectorAll('[placeholder],[title],[aria-label],[aria-description],[alt]')){
    if(!e.getClientRects().length||e.closest('[hidden],.hidden'))continue;
    for(const a of ['placeholder','title','aria-label','aria-description','alt'])if(e.getAttribute(a))records.push({kind:a,context:e.id||e.closest('[id]')?.id||e.tagName,text:e.getAttribute(a)});
   }
   const nodes=[...document.querySelectorAll('#home-screen,#portfolio-v2-screen,#service-work-screen,#service-screen,#product-screen,#full-service-screen,#calculator-screen,#agent-screen,#agent-complex-screen')].filter(e=>e.getClientRects().length&&!e.hidden&&!e.classList.contains('hidden')).map(e=>e.id);
   const print=document.querySelector('#nomad360-print-sheet');
   if(print?.textContent.trim())records.push({kind:'print-sheet',context:'nomad360-print-sheet',text:print.textContent.replace(/\s+/g,' ').trim()});
   return {language:document.documentElement.lang,records,nodes,gaps:Nomad360LocaleCore.auditVisibleGaps(),pageOverflow:document.documentElement.scrollWidth>innerWidth+1};
  });
  A.ok(census.records.length>0,'empty census '+stage);
  A.equal(census.language,lang,'wrong document language '+stage);
  const expectedRoot=stage==='landing-header-footer'?'home-screen':stage==='full-service-validation-panel'?'full-service-screen':stage.startsWith('standalone')||stage.startsWith('linked')?'portfolio-v2-screen':stage.startsWith('v1-online-simple')?'calculator-screen':'product-screen';
  A.ok(census.nodes.includes(expectedRoot),'Expected '+expectedRoot+' at '+stage+', found '+census.nodes.join(','));
  const refs=census.records.map(r=>{const key=lang+'|'+r.kind+'|'+r.context+'|'+r.text;if(!texts.has(key))texts.set(key,{id:'observed-'+texts.size,language:lang,...r});return texts.get(key).id;});
  const findings=census.gaps.map(g=>({...g,classification:lang==='kk'&&knownKK.has(g.original.replace(/\s+/g,' ').trim())?'known-kk-module-copy':'requires-triage'}));
  if(process.env.NOMAD360_LOCALE_ACCEPTANCE==='1'&&lang==='en'){
   const leaks=census.records.filter(r=>r.kind!=='text'&&/[А-Яа-яЁё]/.test(r.text));
   A.deepEqual(leaks,[],'Untranslated visible accessibility/placeholder attributes: '+stage);
  }
  if(process.env.TYPE02_ROLE_AUDIT==='1'){
   const typography=await page.evaluate(()=>{
    const visible=e=>e.getClientRects().length&&!e.closest('[hidden],.hidden,#nomad360-print-sheet');
    const issues=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while((n=walker.nextNode())){const e=n.parentElement;if(!n.textContent.trim()||!visible(e)||e.closest('script,style,select,textarea,svg,[aria-hidden=true],.nomad-lite'))continue;const s=getComputedStyle(e);
      // HERO-03 has separately accepted display typography (12px eyebrow,
      // 11px brand motto, 13px benefit copy, Inter variable 450/650/750).
      // Never exempt finance, navigation, product, legal or footer text.
      const approvedHero=!!e.closest('#nomad360-commercial-banner');
      const approvedAbout=!!document.querySelector('script[src$="nomad360_about_banner.js"]')&&
        !!e.closest('#nomad360-about,#nomad360-contacts');
      const approvedContactLink=approvedAbout&&!!e.closest('#nomad360-contacts .nomad-links a');
      const min=approvedHero?(e.closest('.nomad-seo-tagline')?11:e.closest('#nomad360-hero h1')?12:e.closest('.nomad-benefit-copy')?13:14):
        approvedContactLink?12:14;
      const weights=approvedHero||approvedAbout?['400','450','500','600','650','700','750']:['400','500','600','700'];
      if(parseFloat(s.fontSize)<min||!weights.includes(s.fontWeight))issues.push({text:n.textContent.trim().slice(0,90),root:e.closest('[id]')?.id,cls:e.className,size:s.fontSize,weight:s.fontWeight});}
    return issues;
   });
   A.deepEqual(typography,[],'TYPE-02 readable role weights: '+stage+' '+width+' '+lang);
  }
  cases.push({stage,width,language:lang,roots:census.nodes,strings:refs,gaps:findings,pageOverflow:census.pageOverflow,financialInputsUnchanged:true,financialResultsUnchanged:true});
 }
 await page.locator('#nomad360-lang-select').selectOption('ru');await settle(page);
}
const standalone=()=>({version:2,currency:'USD',marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,periodMonths:2,cacReservePct:100},skus:[{id:'l0',name:'L0 test product',source:'resale',unitCost:20,marginPct:25,mixPct:100,batchUnits:20,initialCashOut:400,fulfillmentPerOrder:3,storagePerUnitDay:0,acquiringPct:0}],resources:[],funding:{kind:'cash',reservePct:10},tax:{type:'turnover',pct:6,vatPct:12}});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.NOMAD360_CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
 for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:\/\//,r=>url.startsWith('http')&&r.request().url().startsWith(new URL('./',url).href)?r.continue():r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.Nomad360LocaleCore&&window.Nomad360UI);
  const css=path.join(root,'artifacts/l0-utilities.css');A.ok(fs.existsSync(css)&&fs.statSync(css).size>10000,'Offline Tailwind CSS must be built with directives');await page.addStyleTag({path:css});
  await examine(page,'landing-header-footer',width);
  await page.evaluate(()=>showProductBranch());
  for(const source of ['own','resale','dropship','offline-service']){
   await page.evaluate(s=>selectProductSource(s),source);await settle(page);await examine(page,'v1-'+source+'-form',width);
  }
  for(const channel of ['online','offline'])for(const depth of ['simple','full']){
   await page.evaluate(({channel,depth})=>{showServiceWorkChooser();selectServiceFinancialMode(depth);chooseServiceChannel(channel);},{channel,depth});
   if(channel==='offline'&&depth==='simple'){
    await page.locator('#product-name-input').fill('L0 test service');await page.evaluate(()=>submitProductIntro({preventDefault(){}}));await settle(page);
    await examine(page,'v1-offline-simple',width);continue;
   }
   for(const role of ['self','hired','agent']){
    await page.evaluate(r=>selectServiceMode(r),role);await settle(page);
    if(depth==='full'){
     await page.locator('#product-name-input').fill('L0 test service');await page.evaluate(()=>submitProductIntro({preventDefault(){}}));await settle(page);
     A.equal(await page.locator('#product-own-form').isVisible(),true,'Full service expense form must be open');
    }
    await examine(page,'v1-'+channel+'-'+depth+'-'+role,width);
   }
  }
  await page.evaluate(()=>Nomad360FullServiceUI.open({},{kind:'offline',name:'L0 test service',role:'self'}));await settle(page);await examine(page,'full-service-validation-panel',width);
  await page.evaluate(()=>openPortfolioV2(false));await settle(page);await examine(page,'standalone-empty',width);
  await page.evaluate(s=>{localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(s));openPortfolioV2(true);},standalone());
  await settle(page);await examine(page,'standalone-ready-vat',width);
  await page.locator('[data-nomad-price-toggle]').click();await settle(page);await examine(page,'standalone-price-excel-actions',width);
  await page.evaluate(()=>{const s=PortfolioV2UI.getState();s.skus[0].payments={unitCost:Nomad360Payments.record(s.skus[0].unitCost,'CNY','USD',Nomad360Currency.valid)};localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(s));openPortfolioV2(true);});
  await settle(page);await examine(page,'standalone-foreign-payment-pending',width);
  const p=fixture();await page.evaluate(p=>{
   LinkedPortfolioV2UI.importFromV1({currency:'USD',skus:p.skus.filter(s=>s.source!=='online-service'),tax:p.tax});LinkedPortfolioV2UI.appendOnline(p.skus.find(s=>s.source==='online-service'));
   const s=LinkedPortfolioV2UI.getState();s.resources=p.resources;s.offers=p.offers;s.forecastMonths=p.forecastMonths;s.recurringDemandApproved=true;localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify(s));LinkedPortfolioV2UI.resume();
  },p);
  await settle(page);await examine(page,'linked-ready-credit-resources-bundles',width);
  await page.locator('[data-nomad-price-toggle]').click();await settle(page);await examine(page,'linked-price-excel-actions',width);
  await page.evaluate(()=>{window.print=()=>{};Nomad360UI.savePrint('report');});await settle(page);await examine(page,'linked-pdf-report',width);
  const file=page.locator('[data-mba-file]');await file.setInputFiles({name:'l0-invalid.json',mimeType:'application/json',buffer:Buffer.from('{')});await settle(page);await examine(page,'linked-mba-import-error',width);
  await page.reload({waitUntil:'domcontentloaded'});if(fs.existsSync(css))await page.addStyleTag({path:css});await page.evaluate(()=>LinkedPortfolioV2UI.resume());await settle(page);await examine(page,'linked-restored',width);
  for(const funding of ['cash','credit']){
   const demo=new URL(url);demo.searchParams.set('demo','shopper');demo.searchParams.set('finance',funding);
   await page.goto(demo.href,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});
   await page.waitForFunction(()=>document.title.startsWith('ДЕМО')&&productPortfolio.length>0);await settle(page);
   await examine(page,'v1-current-shopper-'+funding,width);
  }
  A.deepEqual(errors,[],'Unexpected JS errors at '+width);await page.close();console.log('L0_WIDTH_COMPLETE',width);
 }
 const summary={cases:cases.length,languages:3,widths:widths.length,stages:[...new Set(cases.map(c=>c.stage))],observedStrings:texts.size,visibleGapCases:cases.filter(c=>c.gaps.length).length,knownKKModuleCopyCases:cases.filter(c=>c.gaps.some(g=>g.classification==='known-kk-module-copy')).length,unresolvedDiagnosticCases:cases.filter(c=>c.gaps.some(g=>g.classification==='requires-triage')).length,pageOverflowCases:cases.filter(c=>c.pageOverflow).length,financialInputsUnchanged:true,financialResultsUnchanged:true};
 if(process.env.NOMAD360_LOCALE_ACCEPTANCE==='1'){A.equal(summary.visibleGapCases,0,'L6 untranslated visible text');A.equal(summary.pageOverflowCases,0,'L6 page overflow');console.log('LOCALIZATION_L6_MATRIX_GREEN',JSON.stringify(summary));}
 fs.writeFileSync(path.join(out,'browser-census.json'),JSON.stringify({schemaVersion:1,summary,cases,texts:[...texts.values()]},null,2)+'\n');console.log('LOCALIZATION_L0_BROWSER_GREEN',JSON.stringify(summary));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
