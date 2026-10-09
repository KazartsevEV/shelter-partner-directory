/* #47 localization regression: current V1/V2 copy, browser language,
 * user override persistence, DOM recreation; all calculation data frozen.
 */
'use strict';
const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
const afterTick=page=>page.evaluate(()=>new Promise(done=>setTimeout(done,40)));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [navigatorLocale,expected,title] of [
   ['ru-RU','ru','Калькулятор моего бизнеса'],
   ['kk-KZ','kk','Менің бизнес-калькуляторым'],
   ['en-US','en','My business calculator']]){
   const ctx=await browser.newContext({locale:navigatorLocale,viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message)));
   await page.route(/^https?:\/\//,route=>route.abort());
   try{
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.Nomad360LocaleCore?.translationCount);
    await page.waitForFunction(wanted=>document.querySelector('#home-screen h1')?.textContent===wanted,title);
    A.equal(await page.locator('html').getAttribute('lang'),expected);
    A.ok(await page.evaluate(()=>Nomad360LocaleCore.translationCount)>170,
     'static localized source covers primary navigation and multiple business inputs');
    await page.evaluate(()=>showServiceWorkChooser());
    await page.waitForFunction(code=>document.querySelector('#service-work-screen')?.textContent?.includes(code),
      expected==='kk'?'Қызмет':expected==='en'?'Service':'Услуга');
    // Representative V1 form, including dynamic strings, remains translated.
    await page.evaluate(()=>showProductBranch());
    await afterTick(page);
    const localeState=await page.evaluate(()=>({
      language:document.documentElement.lang,
      productText:document.querySelector('#product-screen')?.textContent||'',
      selectors:[...document.querySelectorAll('input[data-key],input[data-linked-path]')]
        .slice(0,10).map(e=>({type:e.type,name:e.name,value:e.value}))
    }));
    A.equal(localeState.language,expected);
    if(expected==='en')A.ok(localeState.productText.includes('Production')||localeState.productText.includes('Cost'),'translated V1 product text');
    if(expected==='kk')A.ok(localeState.productText.includes('Өндіріс')||localeState.productText.includes('Өзіндік құн'),'translated V1 product text');
    const payload=fixture();
    await page.evaluate(p=>{
      LinkedPortfolioV2UI.importFromV1({skus:p.skus.filter(x=>x.source!=='online-service'),tax:p.tax});
      LinkedPortfolioV2UI.appendOnline(p.skus.find(x=>x.source==='online-service'));
      const state=LinkedPortfolioV2UI.getState();
      state.resources=p.resources;state.offers=p.offers;
      // Deliberately use a Russian UI phrase as the user-entered product name.
      // It must stay verbatim, even in English and Kazakh result tables.
      state.skus[0].name='Товар';
      state.skus.find(s=>s.id==='salon').name='Маникюр';
      state.forecastMonths=p.forecastMonths;
      state.recurringDemandApproved=p.recurringDemandApproved;
      localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify(state));
      LinkedPortfolioV2UI.resume();
    },payload);
    await afterTick(page);
    const baseline=await page.evaluate(()=>({
      state:JSON.stringify(LinkedPortfolioV2UI.getState()),
      result:LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState())
    }));
    A.equal(baseline.result.ready,true,JSON.stringify(baseline.result.errors));
    A.equal(baseline.result.items.length,5);
    const itemPrice=baseline.result.items.map(x=>x.priceList);
    const changed=expected==='en'?'kk':'en';
    await page.locator('#nomad360-lang-select').selectOption(changed);
    await page.waitForFunction(code=>document.documentElement.lang===code,changed);
    await page.evaluate(()=>LinkedPortfolioV2UI.resume());
    await afterTick(page);
    A.equal((await page.locator('[data-linked-sku="0"] [data-nomad-no-translate]').textContent()).trim(),'Товар','user-entered SKU name may not be localized');
    A.equal(await page.evaluate(()=>JSON.stringify(LinkedPortfolioV2UI.getState())),baseline.state,
     'locale selector may not mutate or overwrite business data');
    const after=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
    A.equal(after.ready,true,JSON.stringify(after.errors));
    A.deepEqual(after.items.map(x=>x.priceList),itemPrice);
    A.equal(after.cashflow.periodPnl.netProfit,baseline.result.cashflow.periodPnl.netProfit);
    // Real dynamically generated engine validation with the same user-entered
    // product name and month, rendered through the unchanged finance engine.
    const invalid=await page.evaluate(()=>{
      const key='marketingCalcLinkedPortfolioV2';
      const draft=JSON.parse(localStorage.getItem(key));
      draft.skus.find(s=>s.id==='salon').serviceCapacity=8;
      localStorage.setItem(key,JSON.stringify(draft));
      LinkedPortfolioV2UI.resume();
      return LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState());
    });
    A.equal(invalid.ready,false,'over-capacity service must fail closed');
    console.log('NOMAD360_I18N_DIAG_OBSERVED',JSON.stringify(await page.evaluate(()=>({
      lang:document.documentElement.lang,
      message:(document.querySelector('#linked-results')?.textContent||'').slice(0,1200),
      sample:[...document.querySelectorAll('#linked-results .bg-rose-100,[data-linked-error]')].map(e=>e.textContent).slice(0,10),
      raw:LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()).errors?.slice(0,6)
    }))));
    await page.waitForFunction(code=>{
      const text=[...document.querySelectorAll('#linked-results .bg-rose-100')].map(e=>e.textContent).join(' ');
      return code==='en'?/Month \d+: Service “/.test(text):
       /\d+-ай: «/.test(text);
    },changed);
    const displayErrors=await page.locator('#linked-results .bg-rose-100').allTextContents();
    A.ok(displayErrors.some(s=>s.includes('Маникюр')),'product name must survive translation in an error');
    await page.evaluate(source=>{
      localStorage.setItem('marketingCalcLinkedPortfolioV2',source);
      LinkedPortfolioV2UI.resume();
    },baseline.state);
    const restored=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
    A.equal(restored.ready,true,JSON.stringify(restored.errors));
    A.equal(restored.cashflow.periodPnl.netProfit,baseline.result.cashflow.periodPnl.netProfit);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(code=>document.documentElement.lang===code,changed);
    A.equal(await page.locator('#nomad360-lang-select').inputValue(),changed,
     'explicit preferred UI language must survive reload');
    A.deepEqual(errors,[]);
    console.log('NOMAD360_I18N_CORE_BROWSER_GREEN',JSON.stringify({
     start:navigatorLocale,initial:expected,selected:changed,
     sources:5,pricesUnchanged:true,profitUnchanged:true,savedStateUnchanged:true}));
   }finally{await ctx.close()}
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('NOMAD360_I18N_CORE_BROWSER_RED',e.stack||e);process.exitCode=1});
