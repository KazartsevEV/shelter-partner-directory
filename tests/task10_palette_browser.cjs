'use strict';
const fs=require('node:fs'),path=require('node:path'),A=require('node:assert/strict'),H=require('./helpers/task10-palette.cjs');
const out=path.join(H.root,'artifacts/task10-palette'),baseline=process.env.TASK10_BASELINE_ROOT||'/workspace/scratch/palette-10-baseline',fixture=require('./fixtures/sales-tax-7b/vat-inputs.json');fs.mkdirSync(out,{recursive:true});
const service={months:2,monthlyForecast:[10,8],capacity:20,priceGross:112,vatPct:12,discountPct:0,taxType:'profit',taxPct:15,unitCashCost:20,commissionPct:3,fixedCashMonthly:50,equipmentPurchase:500,equipmentAmortMonthly:10,reservePct:10,funding:'credit',annualRatePct:12,creditMonths:3};
async function route(p,kind){
 if(kind==='home')return p.evaluate(()=>showHome());
 if(kind==='v1')return p.evaluate(()=>showProductBranch());
 if(kind==='standalone'||kind==='linked'){const input=fixture.cases.find(c=>c.kind===kind&&c.id.endsWith('profit-vat12-credit-3')).input;return p.evaluate(({kind,input})=>{localStorage.setItem(kind==='standalone'?'marketingCalcPortfolioV2':'marketingCalcLinkedPortfolioV2',JSON.stringify(input));kind==='standalone'?PortfolioV2UI.open({resume:true}):LinkedPortfolioV2UI.resume();},{kind,input});}
 if(kind==='full-service')return p.evaluate(input=>Nomad360FullServiceUI.open(input,{kind:'offline',name:'TASK10 · толық сервис'}),service);
 if(kind==='offline')return p.evaluate(()=>{showServiceWorkChooser();selectServiceFinancialMode('simple');chooseServiceChannel('offline');startOfflineServiceCalculation();});
 return p.evaluate(role=>{showServiceWorkChooser();selectServiceFinancialMode('simple');chooseServiceChannel('online');selectServiceMode(role);},kind.slice('simple-'.length));
}
async function model(p,kind){return p.evaluate(kind=>{if(kind==='v1'){const v=calculateProductPortfolio();return {model:v,cash:calculateProductCashFlow(v)};}if(kind==='standalone'){const s=PortfolioV2UI.getState();return Nomad360PaymentUI.buildPortfolio(s);}if(kind==='linked')return LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState());if(kind==='full-service')return Nomad360FullServiceUI.getResult();return null;},kind);}
async function settle(p){await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(180);}
(async()=>{const servers={before:await H.serve(baseline),after:await H.serve()},browser=await H.launch(),cases=[],numbers=new Map(),extras=[];
try{for(const variant of ['before','after'])for(const lang of process.argv.includes('--quick')?['ru']:['ru','en','kk'])for(const width of process.argv.includes('--quick')?[390]:[320,360,390,430,768,1280,1440]){
 const ctx=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true,reducedMotion:'reduce'}),p=await ctx.newPage();await H.ready(p,servers[variant].base,`Marketing_calc.HTML?lang=${lang}&demo=shopper&finance=cash`);await p.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');
 for(const kind of ['v1','home','standalone','linked','full-service','simple-self','simple-hired','simple-agent','offline']){
  await route(p,kind);await settle(p);const value=await model(p,kind),key=[lang,width,kind].join(':');if(value){if(variant==='before')numbers.set(key,value);else A.deepEqual(value,numbers.get(key),'numerical regression '+key);}
  const result=await H.audit(p);cases.push({variant,lang,width,kind,numericParity:value?variant==='after':null,...result});console.log('PALETTE_CASE '+variant+' '+key+' '+JSON.stringify({colors:result.errors.length,contrast:result.contrast.length,fonts:result.fonts.length,overflow:result.overflow}));
  if(variant==='after'&&lang==='ru'&&[390,1280].includes(width)&&['home','v1','standalone','full-service'].includes(kind)){const target=kind==='home'?'#home-screen':kind==='v1'?'#product-materials-block':kind==='standalone'?'#p2-results':'#full-service-screen';await p.locator(target).screenshot({path:path.join(out,`ru-${width}-${kind}.png`)});}
 }
 if(variant==='after'){
  await route(p,'standalone');const before=await model(p,'standalone');for(const next of ['en','kk','ru',lang])await p.locator('#nomad360-lang-select').selectOption(next);A.deepEqual(await model(p,'standalone'),before,'language switch keeps numerical results');
  await p.reload({waitUntil:'domcontentloaded'});await p.addStyleTag({path:path.join(out,'utilities.css')});await p.evaluate(()=>PortfolioV2UI.open({resume:true}));await settle(p);A.deepEqual(await model(p,'standalone'),before,'restore keeps numerical results');
  await route(p,'home');await p.locator('[data-nomad-embed-toggle]').click();await p.evaluate(()=>document.querySelectorAll('#nomad360-footer details').forEach(e=>e.open=true));await settle(p);extras.push({type:'open-footer',lang,width,...await H.audit(p)});
  const button=p.locator('.nomad-intro-cta');await button.hover();await button.focus();await settle(p);extras.push({type:'hover-focus',lang,width,...await H.audit(p)});
  await p.locator('#nomad360-bug-launcher').click();await settle(p);extras.push({type:'bug-form',lang,width,...await H.audit(p)});await p.keyboard.press('Escape');
 }
 await ctx.close();
 }
 for(const entry of ['en/','en/business-idea/','en/pricing/','en/cash-flow/','en/for-consultants/','license/','license/en/','license/kk/'])for(const width of process.argv.includes('--quick')?[390]:[320,360,390,430,768,1280,1440]){const p=await browser.newPage({viewport:{width,height:1000}});await H.ready(p,servers.after.base,entry);const result=await H.audit(p);extras.push({type:'static',entry,width,...result});console.log('PALETTE_STATIC '+entry+' '+width+' '+JSON.stringify({colors:result.errors.length,contrast:result.contrast.length,fonts:result.fonts.length,overflow:result.overflow}));await p.close();}
 const after=cases.filter(c=>c.variant==='after'),failures=[...after,...extras].flatMap(c=>[...(c.errors||[]).map(e=>({...e,case:[c.lang,c.width,c.kind||c.type,c.entry]})),...(c.contrast||[]),...(c.fonts||[]),...(c.overflow?[{error:'horizontal overflow',case:c}]:[])]);
 fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({baseline:require('./fixtures/task10-palette/base.json').source,basePath:H.prefix,cases,extras,failures},null,2)+'\n');A.deepEqual(failures,[]);console.log('TASK10_PALETTE_GREEN '+JSON.stringify({cases:after.length,extras:extras.length,numericParity:after.filter(c=>c.numericParity).length,elements:after.reduce((s,c)=>s+c.elements,0)}));
}finally{await browser.close();await Promise.all(Object.values(servers).map(s=>s.close()));}})().catch(e=>{console.error(e.stack);process.exitCode=1});
