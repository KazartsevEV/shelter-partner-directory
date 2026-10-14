'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/localization-acceptance');fs.mkdirSync(out,{recursive:true});
const url=process.env.NOMAD360_TEST_URL||pathToFileURL(path.join(root,'Marketing_calc.HTML')).href;
const widths=[320,360,390,430,768,1280],cases=[];
const unusual='Выручка » <b> "14.5" {name} $&';
async function settle(page){await page.waitForTimeout(100)}
async function language(page,code){await page.locator('#nomad360-lang-select').selectOption(code);await settle(page)}
const state=()=>({version:2,currency:'USD',marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,periodMonths:2,cacReservePct:100},skus:[{id:'locale-name',name:'Выручка',source:'resale',unitCost:20,marginPct:25,mixPct:100,batchUnits:20,initialCashOut:400,fulfillmentPerOrder:3,storagePerUnitDay:0,acquiringPct:0}],resources:[],funding:{kind:'credit',annualRatePct:12,months:3,reservePct:10},tax:{type:'profit',pct:6,vatPct:12}});
async function inspect(page,scenario,width,lang){
 const evidence=await page.evaluate(()=>{
  const node=document.querySelector('#portfolio-v2-screen:not(.hidden),#full-service-screen:not(.hidden),#product-screen:not(.hidden)');
  const structural=[...document.querySelectorAll('[data-i18n]')].filter(e=>e.children.length&&!e.matches('input,select,textarea')).map(e=>e.dataset.i18n);
  const moneyLineErrors=[...document.querySelectorAll('#p2-results .nd-v2-number-value,#full-service-report .nd-full-service-ledger-row strong')].filter(e=>e.getClientRects().length).map(e=>{const range=document.createRange();range.selectNodeContents(e);const tops=[...range.getClientRects()].map(r=>Math.round(r.top));return {text:e.textContent,lines:new Set(tops).size}}).filter(e=>e.lines>1);
  const scalar=[...document.querySelectorAll('[data-i18n]')].filter(e=>!e.children.length&&!e.matches('input,select,textarea')).map(e=>({key:e.dataset.i18n,actual:e.textContent,expected:Nomad360LocaleCore.t(e.dataset.i18n,Nomad360UI.getLanguage(),JSON.parse(e.dataset.i18nParams||'{}'))}));
  const offenders=[...document.querySelectorAll('body *')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().right>innerWidth+2&&!e.closest('.overflow-x-auto')).slice(0,8).map(e=>({id:e.id,tag:e.tagName,class:e.className,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width}));
  return {offenders,locale:document.documentElement.lang,root:node?.id,overflow:document.documentElement.scrollWidth>innerWidth+1,gaps:Nomad360LocaleCore.auditVisibleGaps(),scalarErrors:scalar.filter(e=>e.actual!==e.expected),structuralErrors:structural,moneyLineErrors,markers:node?.textContent.match(/⟦[^⟧]*⟧/g)||[]};
 });
 if(evidence.overflow){await page.screenshot({path:path.join(out,`overflow-${scenario}-${lang}-${width}.png`)});console.log('OVERFLOW',JSON.stringify({scenario,width,lang,...evidence}));}
 A.equal(evidence.locale,lang);A.equal(evidence.overflow,false);A.deepEqual(evidence.gaps,[]);A.deepEqual(evidence.scalarErrors,[]);A.deepEqual(evidence.structuralErrors,[],'User strings must never create HTML children');A.deepEqual(evidence.markers,[]);A.deepEqual(evidence.moneyLineErrors,[],'Financial values must stay on one line');
 if([320,390,1280].includes(width)){
  await page.screenshot({path:path.join(out,`${scenario}-${lang}-${width}.png`),fullPage:true});
  const target=scenario==='standalone-name'?'#p2-results .nd-v2-financial-grid':scenario==='full-service-name'?'#full-service-report':'#completed-product-forms [data-completed-product-id]';
  const detail=page.locator(target).first();if(await detail.isVisible())await detail.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));await page.screenshot({path:path.join(out,`${scenario}-${lang}-${width}-detail.png`)});
 }
 cases.push({scenario,width,language:lang,...evidence});
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.NOMAD360_CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:\/\//,r=>url.startsWith('http')&&r.request().url().startsWith(new URL('./',url).href)?r.continue():r.abort());
  await page.goto(url,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(root,'artifacts/l0-utilities.css')});
  await page.evaluate(s=>{localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(s));openPortfolioV2(true);},state());await settle(page);
  const before=await page.evaluate(()=>JSON.stringify({state:PortfolioV2UI.getState(),result:Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState())}));
  for(const lang of ['ru','en','kk']){
   await language(page,lang);await inspect(page,'standalone-name',width,lang);
   A.equal(await page.locator('#p2-results [data-nomad-no-translate]').filter({hasText:'Выручка'}).count()>0,true,'SKU name colliding with label must stay unchanged');
   A.equal(await page.evaluate(()=>JSON.stringify({state:PortfolioV2UI.getState(),result:Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState())})),before);
   const caption=await page.locator('#p2-results').textContent();
   if(lang==='ru')A.ok(caption.includes('Прибыль базового месяца до процентов по кредиту'));
   if(lang==='en')A.ok(caption.includes('Base-month profit before loan interest'));
  }
  const input={months:2,monthlyForecast:[10,8],capacity:20,priceGross:112,vatPct:12,discountPct:0,taxType:'profit',taxPct:15,unitCashCost:20,commissionPct:3,fixedCashMonthly:50,equipmentPurchase:500,equipmentAmortMonthly:10,reservePct:10,funding:'credit',annualRatePct:12,creditMonths:3};
  await page.evaluate(({input,name})=>Nomad360FullServiceUI.open(input,{kind:'offline',name}),{input,name:unusual});await settle(page);
  const fullBefore=await page.evaluate(()=>JSON.stringify({input:Nomad360FullServiceUI.getInput(),result:Nomad360FullServiceUI.getResult()}));
  A.ok(await page.evaluate(()=>!!Nomad360FullServiceUI.getResult()),'Full service must calculate a valid result');
  for(const lang of ['ru','en','kk']){
   await language(page,lang);await inspect(page,'full-service-name',width,lang);
   A.ok((await page.locator('.nd-full-service-eyebrow').textContent()).includes(unusual));
   A.equal(await page.evaluate(()=>JSON.stringify({input:Nomad360FullServiceUI.getInput(),result:Nomad360FullServiceUI.getResult()})),fullBefore);
  }
  const demo=new URL(url);demo.searchParams.set('demo','shopper');demo.searchParams.set('finance','cash');await page.goto(demo.href,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(root,'artifacts/l0-utilities.css')});await page.waitForFunction(()=>document.title.startsWith('ДЕМО')&&productPortfolio.length>0);
  await page.evaluate(name=>{productPortfolio[0].name=name;productName=name;currentProductSequence=Number(productPortfolio[0].id);document.getElementById('product-name-input').value=name;returnToProductBusinessSummary();window.print=()=>{};},unusual);await settle(page);
  if(width===320){
   const baselineCss=execFileSync('git',['show','9e5a7f51b22ff9240cb9a520203182e0b448d623:nomad360_design_system.css'],{cwd:root,encoding:'utf8'});
   await page.evaluate(()=>document.querySelector('link[href*="nomad360_design_system"]').disabled=true);
   const old=await page.addStyleTag({content:baselineCss});await settle(page);
   const red=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   A.equal(red,true,'Original frozen-record action layout must reproduce overflow');
   await old.evaluate(e=>e.remove());await page.evaluate(()=>document.querySelector('link[href*="nomad360_design_system"]').disabled=false);await settle(page);
   A.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Corrected actions must fit');
   console.log('LOCALIZATION_L6_FROZEN_ACTIONS_BASELINE_RED_CONFIRMED');
  }
  const nativeBefore=await page.evaluate(()=>JSON.stringify({model:productPortfolio,output:calculateProductPortfolio(),cash:calculateProductCashFlow(calculateProductPortfolio())}));
  for(const lang of ['ru','en','kk']){
   await language(page,lang);await inspect(page,'native-v1-name',width,lang);
   A.equal(await page.evaluate(()=>JSON.stringify({model:productPortfolio,output:calculateProductPortfolio(),cash:calculateProductCashFlow(calculateProductPortfolio())})),nativeBefore);
   const keys=await page.locator('#completed-product-forms [data-completed-product-id]').count();A.ok(keys>0,'Actual native V1 parameterized labels must be present');
  }
  for(const lang of ['ru','en','kk']){
   await language(page,lang);
   const report=await page.evaluate(()=>{
    const ok=exportProductCalculationPdf(),sheet=document.getElementById('nomad360-print-sheet');
    const leaks=[],walker=document.createTreeWalker(sheet,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode()))if(!node.parentElement.closest('[data-nomad-no-translate]')&&/[А-Яа-яЁё]/.test(node.nodeValue)&&Nomad360UI.getLanguage()==='en')leaks.push(node.nodeValue);
    return {ok,name:sheet.querySelector('[data-nomad-no-translate]')?.textContent,leaks,headers:[...sheet.querySelectorAll('h1,h2')].map(e=>e.textContent),cells:sheet.querySelectorAll('td').length};
   });
   A.equal(report.ok,true);A.equal(report.name,unusual);A.deepEqual(report.leaks,[],'Native PDF must localize every non-user label');A.ok(report.cells>40);
  }
  A.deepEqual(errors,[]);await page.close();console.log('LOCALIZATION_L6_WIDTH_COMPLETE',width);
 }
 const summary={cases:cases.length,widths:widths.length,languages:3,financialResultsUnchanged:true,userNamesPreserved:true,scalarMessagesVerified:true,financialValuesSingleLine:true,frozenActionsBaselineRedConfirmed:true,nativePdfLanguagesVerified:3,pageOverflowCases:0,visibleGapCases:0};
 fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({summary,cases},null,2)+'\n');console.log('LOCALIZATION_L6_ACCEPTANCE_GREEN',JSON.stringify(summary));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
