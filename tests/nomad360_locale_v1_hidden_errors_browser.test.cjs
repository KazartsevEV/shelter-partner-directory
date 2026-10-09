/* #47AV: V1 negative paths must localize errors without saving/altering a draft.
 * Real RU/KK/EN Chromium coverage for unsaved V1→V2, empty draft,
 * demo save block and dynamically displayed Kazakh payroll reference.
 */
'use strict';
const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const base=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
const errorTexts={
 empty:'Сначала выберите ветку и укажите название товара или услуги.',
 linked:'Сначала рассчитайте и сохраните хотя бы один товар.',
 demo:'Это учебный пример. Чтобы сохранять свои данные, начните собственный расчёт с нуля.',
 payroll:'Казахстан, 2026: 5% соцотчисления + 3% ОСМС + 3,5% ОПВР + 6% соцналог (17,5% для применимых работников, без предельных баз); пенсионные и медицинские удержания работника не являются надбавкой к gross. ОПВР зависит от категории и возраста.'
};
async function switchLanguage(page,language){
 await page.locator('#nomad360-lang-select').selectOption(language);
 await page.waitForFunction(lang=>document.documentElement.lang===lang,language);
 await page.waitForTimeout(70);
}
async function checkText(page,id,raw,language){
 const actual=await page.locator(id).textContent();
 const expected=await page.evaluate(({raw,language})=>
  Nomad360LocaleCore.translate(raw,language),{raw,language});
 A.equal(actual.trim(),expected.trim(),id+' wrong '+language+' display');
 if(language!=='ru')A.notEqual(actual.trim(),raw,'source RU error leaked '+id+' '+language);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const navigatorLocale of ['ru-RU','en-US','kk-KZ']){
   const ctx=await browser.newContext({locale:navigatorLocale,viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,r=>r.abort());
   try{
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!Nomad360LocaleCore?.translate);
    const failed=await page.evaluate(()=>{
     showProductBranch();
     return {save:saveProductCalculationToBrowser(),
      transfer:openLinkedPortfolioFromProducts(),
      draft:JSON.stringify(productPortfolio),
      local:localStorage.getItem('marketingCalcProductPortfolio')};
    });
    A.equal(failed.save,false);
    A.equal(failed.transfer,false);
    A.equal(failed.draft,'[]');
    for(const language of ['en','kk','ru']){
     await switchLanguage(page,language);
     await checkText(page,'#product-browser-save-status',errorTexts.empty,language);
     await checkText(page,'#linked-v2-entry-error',errorTexts.linked,language);
     A.equal(await page.evaluate(()=>JSON.stringify(productPortfolio)),'[]');
    }
    await page.goto(base+'?demo=shopper&finance=cash',{waitUntil:'domcontentloaded'});
    await page.locator('#product-demo-banner').waitFor({state:'visible',timeout:10000});
    const blocked=await page.evaluate(()=>({
     accepted:saveProductCalculationToBrowser(),
     state:JSON.stringify(productPortfolio),
     payroll:(updateProductionWorkersCost(),document.getElementById('own-production-workers-note').textContent)
    }));
    A.equal(blocked.accepted,false,'sample must not overwrite own draft');
    A.equal(blocked.payroll,errorTexts.payroll,'KZ payroll note path not exercised');
    for(const language of ['en','kk','ru']){
     await switchLanguage(page,language);
     await checkText(page,'#product-browser-save-status',errorTexts.demo,language);
     await checkText(page,'#own-production-workers-note',errorTexts.payroll,language);
     A.equal(await page.evaluate(()=>JSON.stringify(productPortfolio)),blocked.state,
      'language change mutated demo business data');
    }
    A.deepEqual(errors,[]);
    console.log('NOMAD360_L47_AV_BROWSER_GREEN',JSON.stringify({navigatorLocale,
     cases:['empty-save','V2-not-ready','sample-save-block','KZ-payroll-reference'],
     locales:['ru','kk','en']}));
   }finally{await ctx.close()}
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('NOMAD360_L47_AV_BROWSER_RED',e.stack||e);process.exitCode=1});
