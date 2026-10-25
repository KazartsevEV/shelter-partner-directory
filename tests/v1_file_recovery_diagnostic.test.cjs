// Diagnostic only: file:// V1 storage persistence and startup rendering.
// Never writes application files, alters the draft contract or retries a failure.
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fileUrl=pathToFileURL(path.resolve(__dirname,'../Marketing_calc.HTML')).href;
const key='marketingCalcProductResultV1';
const digest=value=>value==null?null:crypto.createHash('sha256').update(value).digest('hex').slice(0,16);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({locale:'ru-RU',viewport:{width:390,height:844}});
 await context.addInitScript(storageKey=>{
   window.__v1Early={href:location.href,origin:location.origin,ready:document.readyState};
   try {window.__v1Early.raw=localStorage.getItem(storageKey);}
   catch(e) {window.__v1Early.storageError=String(e);}
 },key);
 const page=await context.newPage(), errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try {
   await page.goto(fileUrl,{waitUntil:'domcontentloaded'});
   const draft={savedAt:'2026-10-24T00:00:00.000Z',currency:'USD',activeProductId:1,
      productPortfolio:[{id:1,source:'own',name:'Diagnostic fixture',inputs:{}}],
      taxType:null,businessTaxPct:0,salesVat:'no',salesVatPct:0};
   const expected=JSON.stringify(draft);
   const seed=await page.evaluate(([storageKey,value])=>{
     localStorage.setItem(storageKey,value);
     return {written:localStorage.getItem(storageKey)===value,
       valid:!!window.Nomad360DraftStore?.readV1()};
   },[key,expected]);
   assert.deepEqual(seed,{written:true,valid:true},'Initial V1 fixture must be stored and valid');
   for(let i=1;i<=50;i++){
     await page.reload({waitUntil:'domcontentloaded'});
     const actual=await page.evaluate(storageKey=>{
       const card=document.getElementById('saved-product-entry');
       const raw=localStorage.getItem(storageKey);
       return {raw,early:window.__v1Early,ready:document.readyState,
         validated:!!window.Nomad360DraftStore?.readV1(),
         card:{exists:!!card,hidden:card?.hidden,classes:card?.className,
           display:card?getComputedStyle(card).display:null},
         applicationReady:typeof updateSavedProductEntry};
     },key);
     const earlyRaw=actual.early?.raw;
     const cardVisible=actual.card.exists&&!actual.card.hidden&&
       actual.card.display!=='none'&&!actual.card.classes?.split(/\s+/).includes('hidden');
     if(actual.raw!==expected||earlyRaw!==expected||!actual.validated||!cardVisible||errors.length){
       console.error('V1_FILE_DIAGNOSTIC_FAILURE',JSON.stringify({
         iteration:i,origin:actual.early?.origin,
         expectedHash:digest(expected),earlyHash:digest(earlyRaw),actualHash:digest(actual.raw),
         expectedBytes:expected.length,earlyBytes:earlyRaw?.length,actualBytes:actual.raw?.length,
         storageError:actual.early?.storageError,valid:actual.validated,card:actual.card,
         ready:actual.ready,applicationReady:actual.applicationReady,errors}));
       throw new Error('V1 file storage/DOM contract failed on reload '+i);
     }
     if(i%10===0)console.log('V1_FILE_DIAGNOSTIC_PROGRESS',JSON.stringify({iterations:i,sha:digest(actual.raw),origin:actual.early.origin}));
   }
   console.log('V1_FILE_DIAGNOSTIC_GREEN',JSON.stringify({iterations:50,origin:'file://',syntheticFixture:true,appSourceUnchanged:true}));
 }finally{await browser.close();}
})().catch(error=>{console.error('V1_FILE_DIAGNOSTIC_RED',error.stack||String(error));process.exitCode=1});
