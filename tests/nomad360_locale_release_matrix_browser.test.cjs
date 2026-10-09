/* #47AX release-scope interactive locale census.
 * Each path must survive RU/KK/EN switches without changing editable values,
 * and screen-reader attributes must not leak untranslated Russian labels.
 * Does not modify model fields or report a human linguistic sign-off.
 */
'use strict';
const A=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const pageUrl=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;

async function settle(page) {
 await page.waitForTimeout(90);
}
async function switchTo(page,code) {
 await page.locator('#nomad360-lang-select').selectOption(code);
 await page.waitForFunction(lang=>document.documentElement.lang===lang,code);
 await settle(page);
}
async function examine(page,stage,locale) {
 const result=await page.evaluate(stage=>{
  const code=document.documentElement.lang;
  const gaps=Nomad360LocaleCore.auditVisibleGaps();
  const excluded='script,style,noscript,template,textarea,pre,code,[data-nomad-no-translate],'+
   '#nomad360-hero,#nomad360-footer,#nomad360-portfolio-tools,#nomad360-print-sheet,'+
   '#nomad360-language-chooser';
  const nodes=[...document.querySelectorAll('input,select,textarea,button,a,[role="button"],img')];
  const attrs=['placeholder','aria-label','aria-description','title','alt'];
  const leaks=[];
  for(const el of nodes){
   if(el.closest(excluded)||el.closest('[hidden],.hidden,[aria-hidden="true"]')||
      !el.getClientRects().length)continue;
   for(const key of attrs){
    const value=el.getAttribute(key);
    if(code==='en'&&/[А-ЯЁа-яё]/.test(value||''))leaks.push({
     attr:key,value,id:el.id||el.tagName,stage
    });
   }
  }
  const inputs=[...document.querySelectorAll('input,select,textarea')]
   .filter(el=>!el.disabled&&el.type!=='file').map(el=>({
    path:el.id||el.name||el.getAttribute('data-linked-path')||
     el.getAttribute('data-p2-path')||el.getAttribute('data-key')||'anonymous',
    value:el.value
   }));
  return {language:code,gaps,leaks,inputs};
 },stage);
 A.equal(result.language,locale,stage+' html.lang');
 A.deepEqual(result.gaps,[],stage+' missing RU-to-'+locale+' visible catalog entries');
 A.deepEqual(result.leaks,[],stage+' untranslated accessibility attributes');
 return result;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const navigatorLocale of ['en-US','kk-KZ']){
   const ctx=await browser.newContext({locale:navigatorLocale,viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route(/^https?:\/\//,route=>route.abort());
   try{
    await page.goto(pageUrl,{waitUntil:'domcontentloaded'});
    const first=navigatorLocale==='en-US'?'en':'kk';
    const second=first==='en'?'kk':'en';
    await page.waitForFunction(lang=>document.documentElement.lang===lang,first);
    await examine(page,'landing',first);
    // Three online service paths, including the agent screen where payer
    // selectors and monthly finance blocks appear conditionally.
    await page.evaluate(()=>showServiceWorkChooser());
    await settle(page);
    for(const mode of ['self','hired','agent']){
     await page.evaluate(value=>selectServiceMode(value),mode);
     await settle(page);
     const original=await examine(page,'online-'+mode,first);
     await switchTo(page,second);
     const alternate=await examine(page,'online-'+mode+'-switched',second);
     A.deepEqual(alternate.inputs,original.inputs,
      'editing fields changed on service locale switch '+mode);
     await switchTo(page,first);
     A.deepEqual((await examine(page,'online-'+mode+'-restored',first)).inputs,original.inputs);
    }
    // Four product sources: own manufacture, resale, fulfillment and salon.
    await page.evaluate(()=>showProductBranch());
    await settle(page);
    for(const source of ['own','resale','dropship','offline-service']){
     await page.evaluate(value=>selectProductSource(value),source);
     await settle(page);
     const original=await examine(page,'product-'+source,first);
     await switchTo(page,second);
     const alternate=await examine(page,'product-'+source+'-switched',second);
     A.deepEqual(alternate.inputs,original.inputs,
      'V1 product input changed by locale in '+source);
     await switchTo(page,first);
    }
    await page.evaluate(()=>openPortfolioV2(false));
    await settle(page);
    const exp=await examine(page,'experimental-V2',first);
    await switchTo(page,second);
    const alt=await examine(page,'experimental-V2-switched',second);
    A.deepEqual(alt.inputs,exp.inputs,'experimental V2 inputs modified by locale switch');
    A.deepEqual(errors,[],'unexpected JS errors');
    console.log('NOMAD360_L47_AX_GREEN',JSON.stringify({
     navigatorLocale,first,second,stages:1+3*3+4*2+2,
     accessibilityAttributesChecked:true,financialInputsImmutable:true
    }));
   }finally{await ctx.close()}
  }
 }finally{await browser.close()}
})().catch(error=>{
 console.error('NOMAD360_L47_AX_RED',error.stack||error);
 process.exitCode=1;
});
