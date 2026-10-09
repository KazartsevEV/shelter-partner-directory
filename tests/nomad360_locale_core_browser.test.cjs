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

const localeVisibleCensus=async(page,stage)=>page.evaluate(stage=>{
 const skips='script,style,template,noscript,pre,code,textarea,[data-nomad-no-translate],#nomad360-hero,#nomad360-footer,#nomad360-portfolio-tools,#nomad360-print-sheet,#nomad360-language-chooser';
 const nodes=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const lines=new Map();
 let node;
 while((node=nodes.nextNode())){
  const parent=node.parentElement;
  if(!parent||parent.closest(skips)||!node.nodeValue?.trim())continue;
  if(!parent.getClientRects().length||parent.closest('[hidden],.hidden'))continue;
  const text=node.nodeValue.replace(/\s+/g,' ').trim();
  if(!/[А-ЯЁа-яё]/.test(text))continue;
  if(text.length<3)continue;
  const context=parent.closest('[id]')?.id||parent.tagName.toLowerCase();
  lines.set(context+'::'+text,{context,text:text.slice(0,200)});
 }
 return {stage,language:document.documentElement.lang,leaks:[...lines.values()].slice(0,160),
  total:lines.size};
},stage);


const assertEnglishLocaleClean=async(page,stage)=>{
 const census=await localeVisibleCensus(page,stage);
 console.log('NOMAD360_L47_CENSUS',JSON.stringify(census));
 A.equal(census.total,0,'EN untranslated UI nodes on '+stage+': '+JSON.stringify(census.leaks));
};
const localeA11yCensus=async(page,stage)=>page.evaluate(stage=>{
 const controls=[...document.querySelectorAll('button,input,select,textarea,[role="button"]')]
  .filter(el=>!el.closest('[hidden],.hidden,[aria-hidden="true"]') &&
    el.getClientRects().length>0 && el.getAttribute('type')!=='hidden');
 const failures=[];
 for(const el of controls){
  const refs=(el.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean)
    .map(id=>document.getElementById(id)?.textContent?.trim()||'').join(' ').trim();
  const labels=[...el.labels||[]].map(node=>node.textContent?.trim()||'').join(' ').trim();
  const name=el.getAttribute('aria-label')||refs||labels||el.getAttribute('title')||
    (el.tagName==='BUTTON'?el.textContent?.trim():'');
  if(!name){
    failures.push({tag:el.tagName,id:el.id||null,type:el.type||null,
      placeholder:el.getAttribute('placeholder')||null,
      selector:el.getAttribute('data-linked-path')||el.getAttribute('data-key')||
       el.getAttribute('data-p2-path')||el.getAttribute('data-mba-filter')||null});
  }
 }
 return {stage,controls:controls.length,unlabeled:failures.length,examples:failures.slice(0,45)};
},stage);

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
    // Direct presentation-only V1 probe: reformat existing money without
    // triggering calculate(), and restore the selected language afterward.
    await page.evaluate(()=>{
      const value=document.createElement('output');
      value.id='nomad-v1-money-locale-probe';
      document.body.append(value);
      setV1DisplayedMoney(value.id,1234.5);
    });
    const transient=expected==='en'?'kk':'en';
    await page.locator('#nomad360-lang-select').selectOption(transient);
    await page.waitForFunction(language=>{
      const node=document.getElementById('nomad-v1-money-locale-probe');
      if(!node||document.documentElement.lang!==language)return false;
      const desired=new Intl.NumberFormat(Nomad360LocaleCore.displayLocale(),
       {minimumFractionDigits:2,maximumFractionDigits:2}).format(1234.5);
      const suffix=language==='en'?'currency units*':language==='kk'?'ш.б.*':'у.е.*';
      return node.textContent===desired+' '+suffix;
    },transient);
    await page.locator('#nomad360-lang-select').selectOption(expected);
    await page.waitForFunction(language=>document.documentElement.lang===language,expected);
    A.equal(await page.locator('#nomad-v1-money-locale-probe').getAttribute('data-nomad-display-number'),'1234.5');
    await page.evaluate(()=>showServiceWorkChooser());
    await page.waitForFunction(code=>document.querySelector('#service-work-screen')?.textContent?.includes(code),
      expected==='kk'?'Қызмет':expected==='en'?'Service':'Услуга');
    if(expected==='en'){
      for(const mode of ['self','hired','agent']){
        await page.evaluate(selected=>selectServiceMode(selected),mode);
        await afterTick(page);
        await assertEnglishLocaleClean(page,'online-'+mode);
      }
      await page.evaluate(()=>openPortfolioV2(false));
      await afterTick(page);
      await assertEnglishLocaleClean(page,'experimental-v2');
    }
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
    // A11y attributes set after insertion must localize without touching values.
    await page.evaluate(()=>{
      const wrap=document.createElement('div');
      wrap.id='nomad360-locale-attribute-regression';
      const field=document.createElement('input');
      field.id='locale-a11y-probe';
      field.type='text';
      field.value='Товар';
      field.setAttribute('placeholder','Например: кофемашина, футболка, набор свечей');
      field.setAttribute('aria-label','Название');
      field.setAttribute('title','Введите название товара');
      wrap.append(field);
      document.body.append(wrap);
    });
    const expectedPlaceholder=expected==='en'?'For example: coffee machine, T-shirt, candle set':
      expected==='kk'?'Мысалы: кофе машинасы, футболка, шам жиынтығы':
      'Например: кофемашина, футболка, набор свечей';
    await page.waitForFunction(text=>document.querySelector('#locale-a11y-probe')?.getAttribute('placeholder')===text,
      expectedPlaceholder);
    await page.evaluate(()=>document.getElementById('locale-a11y-probe')
      .setAttribute('aria-label','Введите название товара'));
    const expectedAria=expected==='en'?'Enter product name':
      expected==='kk'?'Тауар атауын енгізіңіз':'Введите название товара';
    await page.waitForFunction(text=>document.querySelector('#locale-a11y-probe')?.getAttribute('aria-label')===text,
      expectedAria);
    A.equal(await page.locator('#locale-a11y-probe').inputValue(),'Товар');
    const displayAmount=await page.evaluate(()=>({
      locale:Nomad360LocaleCore.displayLocale(),
      output:formatNum(1234.5),
      expected:new Intl.NumberFormat(Nomad360LocaleCore.displayLocale(),
        {minimumFractionDigits:2,maximumFractionDigits:2}).format(1234.5)
    }));
    A.equal(displayAmount.locale,expected==='en'?'en-US':expected==='kk'?'kk-KZ':'ru-RU');
    A.equal(displayAmount.output,displayAmount.expected,'V1 output uses display-only locale');
    const expectedMeta=expected==='en'?'Nomad360 — free business calculator.':
      expected==='kk'?'Nomad360 — тегін бизнес-калькулятор.':
      'Nomad360 — бесплатный калькулятор бизнеса.';
    A.ok((await page.locator('meta[name="description"]').getAttribute('content')).startsWith(expectedMeta));
    await page.evaluate(()=>{
      productName='Товар';
      updateProductAssortmentGate();
    });
    await page.waitForFunction(locale=>{
      const button=document.getElementById('assortment-complete-button');
      if(!button)return false;
      const label=button.textContent||'';
      return locale==='en'?label.includes('This is my only product'):
       locale==='kk'?label.includes('Бұл менің жалғыз тауарым'):
       label.includes('Это мой единственный товар');
    },expected);
    A.equal((await page.locator('#assortment-complete-button [data-nomad-no-translate]').textContent()).trim(),
      '«Товар»','user-entered V1 product name never translates');
    const formattedMoney=await page.evaluate(()=>formatMoney(1234.5));
    A.ok(formattedMoney.endsWith(expected==='en'?'currency units*':expected==='kk'?'ш.б.*':'у.е.*'),
      'display currency unit localized without changing numeric value');
    if(expected==='en')await assertEnglishLocaleClean(page,'v1-product');
    const a11y_v1_product=await localeA11yCensus(page,'v1-product');
    A.equal(a11y_v1_product.unlabeled,0,JSON.stringify(a11y_v1_product.examples));
    if(expected==='en')console.log('NOMAD360_L47_A11Y',JSON.stringify(a11y_v1_product));
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
    if(expected==='en')await assertEnglishLocaleClean(page,'v2-linked');
    const a11y_v2_linked=await localeA11yCensus(page,'v2-linked');
    A.equal(a11y_v2_linked.unlabeled,0,JSON.stringify(a11y_v2_linked.examples));
    if(expected==='en')console.log('NOMAD360_L47_A11Y',JSON.stringify(a11y_v2_linked));
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
    // Existing rendered amount must reformat in-place, without resume/rebuild,
    // losing active input values or touching the financial source state.
    await page.waitForFunction(()=>{
      const node=document.querySelector('[data-linked-sku="0"] [data-linked-price-list]');
      if(!node)return false;
      const raw=node.getAttribute('data-nomad-display-number');
      if(raw===null)return false;
      return node.textContent===Number(raw).toLocaleString(Nomad360LocaleCore.displayLocale(),
        {minimumFractionDigits:2,maximumFractionDigits:2});
    });
    const beforeRerender=await page.evaluate(()=>({
      state:JSON.stringify(LinkedPortfolioV2UI.getState()),
      price:document.querySelector('[data-linked-sku="0"] [data-linked-price-list]')?.textContent
    }));
    A.equal(beforeRerender.state,baseline.state,'in-place locale display switch cannot change portfolio source');
    await page.evaluate(()=>LinkedPortfolioV2UI.resume());
    await afterTick(page);
    A.equal((await page.locator('[data-linked-sku="0"] [data-nomad-no-translate]').textContent()).trim(),'Товар','user-entered SKU name may not be localized');
    A.equal(await page.evaluate(()=>JSON.stringify(LinkedPortfolioV2UI.getState())),baseline.state,
     'locale selector may not mutate or overwrite business data');
    const after=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
    A.equal(after.ready,true,JSON.stringify(after.errors));
    A.deepEqual(after.items.map(x=>x.priceList),itemPrice);
    const displayV2=await page.evaluate(()=>{
      const amount=LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()).items[0].priceList;
      return {
        shown:document.querySelector('[data-linked-sku="0"] [data-linked-price-list]')?.textContent,
        expected:Number(amount).toLocaleString(Nomad360LocaleCore.displayLocale(),
          {minimumFractionDigits:2,maximumFractionDigits:2}),
        numberInput:document.querySelector('[data-linked-path="forecastMonths"]')?.value
      };
    });
    A.equal(displayV2.shown,displayV2.expected,'V2 prices re-render in selected display locale');
    A.equal(displayV2.numberInput,String(payload.forecastMonths),'forecast inputs stay canonical');
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
      return code==='en'?/Customer forecast for “Маникюр” \(9\.50\) exceeds available 8 monthly appointments\./.test(text):
       /«Маникюр» клиент болжамы \(9\.50\) қолжетімді айлық 8 қабылдаудан асады\./.test(text);
    },changed);
    const displayErrors=await page.locator('#linked-results .bg-rose-100').allTextContents();
    A.ok(displayErrors.some(s=>s.includes('Маникюр')),'product name must survive translation in an error');
    A.ok((await page.locator('#linked-results [data-nomad-no-translate]').allTextContents()).includes('Товар'),'user SKU name in summary must stay in original language');
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
