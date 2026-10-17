/* #47AS regression: currency display must never be business-model input. */
'use strict';
const A=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const navigatorLocale of ['ru-RU','en-US','kk-KZ']){
   const context=await browser.newContext({locale:navigatorLocale,viewport:{width:390,height:844}});
   const page=await context.newPage(),pageErrors=[];
   page.on('pageerror',err=>pageErrors.push(err.message));
   await page.route(/^https?:\/\//,route=>route.abort());
   try{
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.Nomad360LocaleCore?.displayLocale);
    await page.evaluate(()=>{
     showProductBranch();
     productOwnChoices.payroll='yes';
     productOwnChoices.employees='yes';
     const set=(id,value)=>{document.getElementById(id).value=String(value)};
     set('own-insurance-country','KZ');
     set('own-employees-count',2);
     set('own-employee-salary',1200);
     set('own-insurance-contribution-pct',10);
     set('own-payroll-rewards',2400);
     set('own-sales-monthly-qty',4);
     updateEmployeeContributionEstimate();
     set('own-product-ad-budget',9000);
     set('own-product-ad-cpc',2);
     set('own-product-ad-ctr',5);
     set('own-product-ad-click-lead',50);
     set('own-product-ad-lead-sale',75);
     set('own-product-ad-management',100);
     recalculateProductAdFunnel();
    });
    const ids=[
     'own-payroll-gross-estimate','own-employer-mandatory-total-estimate',
     'own-sales-fixed-monthly','own-sales-fixed-per-unit',
     'own-product-ad-impressions','own-product-ad-units',
     'own-product-ad-cac-unit','own-sales-variable-total-pct'
    ];
    const baseline=await page.evaluate(ids=>{
     const source=Object.fromEntries(ids.map(id=>[id,Number(document.getElementById(id).dataset.nomadDisplayNumber)]));
     const inputs=Object.fromEntries(['own-employees-count','own-employee-salary',
      'own-payroll-rewards','own-product-ad-budget','own-product-ad-cpc',
      'own-product-ad-lead-sale','own-sales-monthly-qty'].map(id=>
      [id,document.getElementById(id).value]));
     return {source,inputs};
    },ids);
    A.equal(baseline.source['own-payroll-gross-estimate'],2400);
    A.ok(baseline.source['own-employer-mandatory-total-estimate']>0);
    A.ok(baseline.source['own-sales-fixed-monthly']>2400);
    A.equal(baseline.source['own-product-ad-units'],1687.5);
    A.ok(baseline.source['own-product-ad-impressions']>1000);
    for(const language of ['en','kk','ru','en']){
     await page.locator('#nomad360-lang-select').selectOption(language);
     await page.waitForFunction(lang=>document.documentElement.lang===lang,language);
     await page.waitForTimeout(70);
     const state=await page.evaluate(ids=>{
      const locale=Nomad360LocaleCore.displayLocale();
      const records=ids.map(id=>{
       const node=document.getElementById(id);
       const value=Number(node.getAttribute('data-nomad-display-number'));
       const precision=node.getAttribute('data-nomad-display-fractions');
       const min=precision==='2'?2:0,max=precision==='0'?0:2;
       const suffix=node.getAttribute('data-nomad-display-suffix')||'';
       return {id,value,actual:node.textContent,expected:value.toLocaleString(locale,
        {minimumFractionDigits:min,maximumFractionDigits:max})+suffix,
        consumed:productNumberFromText(id)};
      });
      const inputs=Object.fromEntries(['own-employees-count','own-employee-salary',
       'own-payroll-rewards','own-product-ad-budget','own-product-ad-cpc',
       'own-product-ad-lead-sale','own-sales-monthly-qty'].map(id=>
       [id,document.getElementById(id).value]));
      return {records,inputs,locale};
     },ids);
     A.deepEqual(state.inputs,baseline.inputs,'numeric inputs changed when selecting '+language);
     for(const record of state.records){
      A.equal(record.value,baseline.source[record.id],record.id+' source changed with '+language);
      A.equal(record.consumed,record.value,record.id+' consumed localized display string '+language);
      A.equal(record.actual,record.expected,record.id+' did not update display for '+language);
     }
     A.equal(state.records.find(x=>x.id==='own-sales-fixed-per-unit').consumed,
      state.records.find(x=>x.id==='own-sales-fixed-monthly').consumed/4,
      'fixed costs remain allocated to correct monthly sales quantity');
     console.log('NOMAD360_L47_AS_LOCALE',JSON.stringify({navigatorLocale,language,
      sales:state.records.find(x=>x.id==='own-sales-fixed-monthly').consumed,
      units:state.records.find(x=>x.id==='own-product-ad-units').consumed}));
    }
    A.deepEqual(pageErrors,[],'browser runtime errors in '+navigatorLocale);
   }finally{await context.close()}
  }
 }finally{await browser.close()}
})().catch(err=>{console.error('NOMAD360_L47_AS_RED',err.stack||err);process.exitCode=1});
