'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
const Linked=require('../portfolio_v2_linked_engine.js');
const arg=(key,fallback)=>process.argv.find(v=>v.startsWith('--'+key+'='))?.split('=').slice(1).join('=')||fallback;
const stage=Number(arg('stage','1'));
const layout=Number(arg('layout','1'));
const Observed=require('../portfolio_v2_mba_observed.js');
const Full=require('../portfolio_v2_full_service.js');
const directory=path.resolve(arg('root',path.join(__dirname,'..')));
const artifacts=path.resolve(arg('artifacts','artifacts/v2-containers'));
const utilities=path.resolve(arg('utilities','artifacts/v2-utilities.css'));
const rejectedStyles=path.resolve(arg('rejected-styles','/tmp/nomad-v2-rejected.css'));
if(stage===1){
 const baseline=path.resolve(arg('baseline','/tmp/nomad-v2-baseline'));
 const frozen=['Marketing_calc.HTML','nomad360_calculator_ui.js','nomad360_calculator_ui.css',
  'nomad360_header.js','nomad360_locale_core.js','nomad360_navigation.js','nomad360_currency.js',
  'portfolio_v2_engine.js','portfolio_v2_linked_engine.js','portfolio_v2_full_service.js',
  'portfolio_v2_full_service_ui.js','portfolio_v2_online_adapter.js','portfolio_v2_mba_observed.js',
  'portfolio_v2_temporal.js','portfolio_v2_temporal_cash.js','portfolio_v2_pooled_media.js','portfolio_v2_period_price.js'];
 for(const file of frozen)A.ok(fs.readFileSync(path.join(directory,file)).equals(fs.readFileSync(path.join(baseline,file))),
  'Protected source must be unchanged: '+file);
 if(layout===2){
  const normalize=s=>s.split('\n/* V2_FIELDS_PRESENTATION_START')[0].replace(/\sclass="[^"]*"/g,'').trimEnd();
  for(const file of ['portfolio_v2_ui.js','portfolio_v2_linked_ui.js','portfolio_v2_basket_ui.js','portfolio_v2_mba_observed_ui.js'])
   A.equal(normalize(fs.readFileSync(path.join(directory,file),'utf8')),normalize(fs.readFileSync(path.join(baseline,file),'utf8')),
    'UI code and copy unchanged outside presentation classes: '+file);
 }else for(const file of ['portfolio_v2_ui.js','portfolio_v2_linked_ui.js']){
  const resource=dir=>fs.readFileSync(path.join(dir,file),'utf8').split('function resourceCard(')[1]
   .split(file==='portfolio_v2_ui.js'?'function stageResources(':'function render(')[0];
  A.equal(resource(directory),resource(baseline),'Resource-card template must be unchanged: '+file);
 }
}
const name=stage===0?'before':'after';
fs.mkdirSync(path.join(artifacts,name),{recursive:true});
const widths=[320,360,390,430,768,1280],languages=['ru','en','kk'];
const standalone=()=>({version:2,currency:'USD',
 marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,periodMonths:2,cacReservePct:100},
 skus:[{id:'a',name:'Майка — ұзын атау / long product name',source:'own',unitCost:20,marginPct:25,mixPct:50,
  acquiringPct:0,initialCashOut:0,batchUnits:0,storagePerUnitDay:0},
  {id:'b',name:'Сумка',source:'resale',unitCost:60,marginPct:30,mixPct:50,
   acquiringPct:0,initialCashOut:0,batchUnits:0,storagePerUnitDay:0}],
 resources:[{id:'room',kind:'premises',label:'Общая аренда',amount:400,cadence:'monthly',skuIds:['a','b'],allocation:'revenue'},
  {id:'team',kind:'workers',label:'Общие рабочие',amount:600,cadence:'monthly',skuIds:['a','b'],allocation:'usage',usage:{a:40,b:60},capacity:100},
  {id:'website',kind:'website',label:'Сайт',amount:120,cadence:'once',skuIds:['a','b'],allocation:'revenue'},
  {id:'campaign',kind:'campaign',label:'Дополнительная кампания',amount:200,cadence:'monthly',skuIds:['b'],allocation:'revenue'},
  {id:'certificate',kind:'certification',label:'Сертификат',amount:90,cadence:'once',skuIds:['a','b'],allocation:'revenue',
   validFor:'Kazakhstan: clothing and bags',validUntil:'2027-12-31',confirmedCoverage:true}],
 funding:{kind:'cash',reservePct:10,months:6,annualRatePct:12},tax:{type:'turnover',pct:6,vatPct:12}});
const linked=()=>{
 const p=fixture(),state=Linked.fromV1({...p,currency:'USD'});
 return {...state,resources:p.resources,offers:p.offers,forecastMonths:p.forecastMonths,
  recurringDemandApproved:true,importedAt:'2026-10-12T00:00:00Z'};
};
function visibleSnapshot(){
 const root=document.getElementById('portfolio-v2-root');
 const visible=el=>el.getClientRects().length&&!el.closest('[hidden],.hidden');
 const round=v=>Math.round(v*100)/100;
 const rect=el=>{const r=el.getBoundingClientRect();return [r.x,r.y+scrollY,r.width,r.height].map(round);};
 const key=el=>['data-p2-path','data-linked-path','data-p2-resource-member','data-linked-member','data-basket-field','data-mba-format','data-mba-file','data-mba-filter'].map(a=>el.hasAttribute(a)?a+':'+el.getAttribute(a):'').filter(Boolean).join('|')+'|'+(el.dataset.i||'')+'|'+(el.dataset.j||'')+'|'+(el.type==='checkbox'?el.value:'');
 const fields=[...root.querySelectorAll('input,select,textarea')].filter(visible).map(el=>({key:key(el),
  value:el.value,checked:el.checked,type:el.type,rect:rect(el),label:el.closest('label')?rect(el.closest('label')):null,
  resource:!!el.closest('[data-p2-resource],[data-linked-resource]'),
  color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}));
 const resources=[...root.querySelectorAll('[data-p2-resource],[data-linked-resource]')].filter(visible).map(el=>({
  html:el.outerHTML,color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor,rect:rect(el)}));
 const regions=[...root.children].map(el=>({id:el.id,rect:rect(el)}));
 const metrics={client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
  fieldsOutside:fields.filter(f=>f.rect[0]<-1||f.rect[0]+f.rect[2]>innerWidth+1).map(f=>f.key)};
 return {fields,resources,regions,metrics};
}
async function seed(page,route,condition){
 const state=route==='standalone'?standalone():linked();
 if(layout===2){
  state.skus[0].name='ОченьДлинноеНазваниеБезПробеловДляПроверкиПереносаНаТелефоне_ҰзынАтау';
  state.resources[0].label='ОбщийРесурсСОченьДлиннымНазваниемБезПробеловДляПереноса';
  if(route==='standalone'){
   state.resources.push({id:'warehouse',kind:'warehouse',label:'Склад',amount:30,cadence:'monthly',skuIds:['a','b'],allocation:'revenue'},
    {id:'sales',kind:'salesStaff',label:'Команда продаж',amount:20,cadence:'monthly',skuIds:['a','b'],allocation:'revenue'});
   if(condition==='credit')state.funding.kind='credit';
   if(condition==='dropship')state.skus[0].source='dropship';
  }else{
   state.resources.push({id:'certificate',kind:'certification',label:'Сертификат',amount:90,cadence:'once',pool:'none',skuIds:['own','resale'],allocation:'revenue',includedBySku:{},validFor:'Kazakhstan: clothing',validUntil:'2027-12-31',confirmedCoverage:true},
    {id:'warehouse',kind:'warehouse',label:'Склад',amount:30,cadence:'monthly',pool:'none',skuIds:['own','resale'],allocation:'revenue',includedBySku:{}});
   if(condition==='full-service'){
    state.skus[3]=Full.toPortfolioSku({months:3,monthlyForecast:8,capacity:25,priceGross:100,vatPct:0,
     discountPct:0,unitCashCost:5,commissionPct:0,fixedCashMonthly:90,equipmentPurchase:0,
     equipmentAmortMonthly:0,taxType:'turnover',taxPct:5,reservePct:0,funding:'own'},
     {id:'salon',name:'Полная услуга',kind:'offline'});
    state.resources[1]={...state.resources[1],pool:'unitCost',cashOrigin:'production',
     poolBySku:{own:'none',salon:'unitCost'},cashOriginBySku:{salon:'production'},includedBySku:{salon:30}};
   }
   if(['history','unmapped'].includes(condition)){
    const records=['a','b'].flatMap(order_id=>['own','resale'].map(sku_id=>({order_id,sku_id:condition==='unmapped'?'UnknownSKU_'+sku_id:sku_id,date:'2026-09-01',quantity:1,unit_price:100,currency:'USD',channel:'web',status:'completed'})));
    state.mbaHistory={source:Observed.read(JSON.stringify(records),'json'),mapping:{},filter:{channel:'all',from:'2026-09-01',to:'2026-09-30'},fileName:'orders.json'};
   }
  }
 }
 if(condition==='unready'){
  if(route==='standalone')state.marketing.cpc='';
  else state.skus[0].priceMax=0;
 }
 await page.evaluate(({state,route})=>{
  const key=route==='standalone'?'marketingCalcPortfolioV2':'marketingCalcLinkedPortfolioV2';
  localStorage.setItem(key,JSON.stringify(state));
  if(route==='standalone')PortfolioV2UI.open({resume:true});else LinkedPortfolioV2UI.resume();
 },{state,route});
 await page.waitForTimeout(70);
 return page.evaluate(route=>{
  const ui=route==='standalone'?PortfolioV2UI:LinkedPortfolioV2UI;
  const engine=route==='standalone'?PortfolioV2Engine:LinkedPortfolioV2Engine;
  const state=ui.getState();return {state,finance:engine.build(state)};
 },route);
}
async function pictures(page,route,key){
 const targets=route==='standalone'?['#portfolio-v2-root','#p2-stage-skus','#p2-stage-production','#p2-results']:
  ['#portfolio-v2-root','[data-linked-sku="0"]','#linked-resources','#linked-results'];
 for(let i=0;i<targets.length;i++){
  if(i===0)await page.evaluate(()=>scrollTo(0,0));
  else await page.locator(targets[i]).evaluate(el=>el.scrollIntoView({block:'start'}));
  await page.screenshot({path:path.join(artifacts,name,key+'-'+['top','sku','resources','results'][i]+'.png')});
 }
 await page.evaluate(()=>scrollTo(0,0));
}
async function prepareForms(page){
 await page.locator('#portfolio-v2-root details').evaluateAll(nodes=>nodes.forEach(el=>{el.open=true;}));
 await page.evaluate(()=>window.Nomad360V2Fields?.refresh());
 await page.waitForTimeout(70);
}
async function formPictures(page,route,condition,key){
 let targets;
 if(route==='standalone'){
  targets=condition==='credit'?[['#p2-stage-financing','financing'],['#p2-stage-skus','sku']]:
   condition==='dropship'?[['#p2-stage-skus','sku'],['#p2-stage-skus details','extras']]:
   condition==='unready'?[['#p2-stage-marketing','marketing'],['#p2-results','results']]:
   [['#p2-stage-marketing','marketing'],['#p2-stage-skus','sku'],['#p2-stage-purchase','certification'],
    ['label:has([data-p2-path$=".validFor"])','certificate-dates'],
    ['#p2-stage-production','resources'],['#p2-stage-financing','financing'],['#p2-results','results']];
 }else{
  targets=condition==='full-service'?[['[data-linked-resource="1"]','resource-origin'],
   ['label:has([data-linked-path="resources.1.poolBySku.salon"])','resource-pools'],['[data-linked-sku="3"]','full-service']]:
   ['history','unmapped'].includes(condition)?[['label:has([data-mba-filter="channel"])','history'],['#linked-basket-panel','basket']]:
   condition==='unready'?[['[data-linked-sku="0"]','sku'],['#linked-results','results']]:
   [['[data-linked-sku="0"]','sku'],['#linked-resources','resources'],['label:has([data-mba-format])','history'],
    ['#linked-basket-panel','basket'],['#linked-results','results']];
 }
 for(const [selector,label] of targets){
  await page.locator(selector).first().evaluate(el=>el.scrollIntoView({block:'start'}));
  await page.screenshot({path:path.join(artifacts,name,key+'-'+label+'.png')});
 }
 await page.evaluate(()=>scrollTo(0,0));
}
async function exerciseFields(page,route,condition){
 const initial=await page.evaluate(route=>(route==='standalone'?PortfolioV2UI:LinkedPortfolioV2UI).getState(),route);
 if(route==='standalone'){
  await page.locator('[data-p2-path="marketing.budget"]').fill('1200');
  A.equal(await page.evaluate(()=>Number(PortfolioV2UI.getState().marketing.budget)),1200);
  await page.locator('[data-p2-path="marketing.budget"]').fill(String(initial.marketing.budget));
  await page.locator('[data-p2-path="funding.kind"]').selectOption('credit');
  A.equal(await page.locator('[data-p2-path="funding.months"]').count(),1);
  await page.locator('[data-p2-path="funding.kind"]').selectOption('cash');
  A.equal(await page.locator('[data-p2-path="funding.months"]').count(),0);
  await page.locator('[data-p2-path="funding.kind"]').selectOption(initial.funding.kind);
  const member=page.locator('[data-p2-resource-member="0"][value="b"]');
  await member.uncheck();A.equal(await page.evaluate(()=>PortfolioV2UI.getState().resources[0].skuIds.includes('b')),false);
  await member.check();
 }else{
  await page.locator('[data-linked-path="skus.0.discountSelected"]').fill('5');
  A.equal(await page.evaluate(()=>Number(LinkedPortfolioV2UI.getState().skus[0].discountSelected)),5);
  await page.locator('[data-linked-path="skus.0.discountSelected"]').fill(String(initial.skus[0].discountSelected));
  await page.locator('[data-basket-field="mode"][data-i="0"]').selectOption('cross_sell');
  A.equal(await page.evaluate(()=>LinkedPortfolioV2UI.getState().offers[0].mode),'cross_sell');
  await page.locator('[data-basket-field="mode"][data-i="0"]').selectOption(initial.offers[0].mode);
  await page.locator('[data-basket-field="bundleDiscountPct"][data-i="0"]').fill(String(initial.offers[0].bundleDiscountPct));
  if(condition==='history'){
   const input=page.locator('[data-mba-overlap]').first();
   await input.scrollIntoViewIfNeeded();
   const reachable=await input.evaluate(el=>{
    const r=el.getBoundingClientRect(),p=el.closest('.overflow-x-auto').getBoundingClientRect();
    return r.left>=p.left-1&&r.right<=p.right+1;
   });
   A.ok(reachable,'report input is reachable through local table scrolling');
  }
 }
 // Restore the original fixture through its existing resume route. This also
 // checks that presentation notes never become saved business fields.
 await page.evaluate(({route,initial})=>{
  localStorage.setItem(route==='standalone'?'marketingCalcPortfolioV2':'marketingCalcLinkedPortfolioV2',JSON.stringify(initial));
  if(route==='standalone')PortfolioV2UI.open({resume:true});else LinkedPortfolioV2UI.resume();
 },{route,initial});
 await prepareForms(page);
 if(condition==='ready'){
  for(const [width,language] of [[320,'en'],[768,'kk'],[1200,'en'],[1280,'kk'],[390,'ru']]){
   await page.setViewportSize({width,height:900});
   await page.evaluate(language=>Nomad360UI.setLanguage(language),language);
   await prepareForms(page);
   A.deepEqual((await page.evaluate(()=>NomadLayout.audit(document.getElementById('portfolio-v2-root')))).failures,[],
    'same-page resize/language refresh '+route+' '+width+' '+language);
  }
 }
 const current=await page.evaluate(route=>(route==='standalone'?PortfolioV2UI:LinkedPortfolioV2UI).getState(),route);
 A.deepEqual(current,initial,'interactive controls leave fixture recoverable '+route+' '+condition);
}
async function assertColors(page,route){
 const result=await page.evaluate(()=>{
  const root=document.getElementById('portfolio-v2-root'),style=el=>getComputedStyle(el);
  const sections=[...root.querySelectorAll('.nd-v2-section,.nd-v2-hero,.nd-v2-result-frame')];
  const text=[...root.querySelectorAll('.nd-v2-title,.nd-v2-description,.nd-v2-eyebrow,.nd-v2-status,.nd-v2-section-link,.nd-v2-product-card [data-p2-remove-sku],.nd-v2-product-card [data-linked-delete-sku]')];
  return {background:style(document.body).backgroundColor,
   sections:sections.map(el=>({background:style(el).backgroundColor,radius:style(el).borderRadius,shadow:style(el).boxShadow})),
   text:text.map(el=>({text:el.textContent.slice(0,60),color:style(el).color})),
   resources:[...root.querySelectorAll('[data-p2-resource],[data-linked-resource]')].map(el=>({color:style(el).color,background:style(el).backgroundColor})),
   fields:[...root.querySelectorAll('.input-field,.nd-v2-upload-control')].map(el=>({color:style(el).color,background:style(el).backgroundColor}))};
 });
 A.equal(result.background,'rgb(255, 255, 255)');
 A.ok(result.sections.length>=(route==='standalone'?11:7));
 for(const s of result.sections){A.equal(s.background,'rgb(22, 55, 90)');A.equal(s.shadow,'none');A.ok(parseFloat(s.radius)<=4);}
 A.ok(result.text.length>=8);
 for(const t of result.text)A.equal(t.color,'rgb(255, 255, 255)',JSON.stringify(t));
 for(const f of result.fields){A.equal(f.color,'rgb(22, 55, 90)');A.equal(f.background,'rgb(255, 255, 255)');}
 for(const r of result.resources){A.equal(r.color,'rgb(22, 55, 90)');A.equal(r.background,'rgb(255, 255, 255)');}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const receipts={},baseline=stage===1?JSON.parse(fs.readFileSync(path.join(artifacts,'before','receipts.json'),'utf8')):null;
 const contrastFailures=[],layoutFailures=[],numericFailures=[];
 try{
  for(const route of ['standalone','linked'])for(const condition of layout===2?(route==='standalone'?['ready','unready','credit','dropship']:['ready','unready','history','unmapped','full-service']):['ready','unready'])
  for(const language of languages)for(const width of widths){
   const key=[route,condition,language,width].join('-');
   const context=await browser.newContext({locale:language==='kk'?'kk-KZ':language==='en'?'en-US':'ru-RU',viewport:{width,height:900}});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,r=>r.abort());
   await page.goto(pathToFileURL(path.join(directory,'Marketing_calc.HTML')).href,{waitUntil:'domcontentloaded'});
   await page.evaluate(language=>Nomad360UI.setLanguage(language),language);
   await page.addStyleTag({path:utilities});
   await page.addScriptTag({path:path.join(__dirname,'helpers/contrast.cjs')});
   const initial=JSON.parse(JSON.stringify(await seed(page,route,condition)));
   A.equal(initial.finance.ready,condition!=='unready',key+': '+JSON.stringify(initial.finance.errors));
   if(layout===2){
    await page.addScriptTag({path:path.join(__dirname,'helpers/v2-layout.cjs')});
    await page.addScriptTag({path:path.join(__dirname,'helpers/v2-money-lines.cjs')});
    await prepareForms(page);
   }
   const snapshot=JSON.parse(JSON.stringify(await page.evaluate(visibleSnapshot)));
   const contrast=await page.evaluate(()=>NomadContrast.audit(document.getElementById('portfolio-v2-root')));
   const geometry=layout===2?await page.evaluate(()=>NomadLayout.audit(document.getElementById('portfolio-v2-root'))):null;
   const numbers=layout===2?await page.evaluate(route=>NomadMoneyLines.audit(
    document.getElementById(route==='standalone'?'p2-results':'linked-results')),route):null;
   receipts[key]={...initial,...snapshot,contrast,...(geometry?{geometry,numbers}: {})};
   if(stage===1){
    const before=baseline[key];
    A.deepEqual(initial.state,before.state,'saved business state '+key);
    A.deepEqual(initial.finance,before.finance,'financial results '+key);
    // Only upload background and inherited resource checkbox foreground change.
    // Text input colors, control geometry, values and checked state are frozen.
    const controls=fields=>fields.map(f=>({...f,
     background:f.type==='file'?'file-upload-surface':f.background,
     color:f.type==='checkbox'&&f.resource?'resource-checkbox-ink':f.color}));
    if(layout===1){
     A.deepEqual(controls(snapshot.fields),controls(before.fields),'control values, geometry and colors '+key);
     const resources=cards=>cards.map(({color,background,...card})=>card);
     A.deepEqual(resources(snapshot.resources),resources(before.resources),'resource DOM and geometry '+key);
     A.deepEqual(snapshot.regions.map(x=>x.rect),before.regions.map(x=>x.rect),'section geometry '+key);
    }else{
     const payload=fields=>fields.map(({rect,label,...field})=>field);
     A.deepEqual(payload(snapshot.fields),payload(before.fields),'same fields, values, types and colors '+key);
     if(geometry.failures.length){
      layoutFailures.push({key,failures:geometry.failures});
      console.log('LAYOUT_FAILURE '+key+' '+JSON.stringify(geometry.failures.slice(0,10)));
     }
     if(numbers.failures.length){
      numericFailures.push({key,failures:numbers.failures});
      console.log('NUMERIC_LINE_FAILURE '+key+' '+JSON.stringify(numbers.failures.slice(0,8)));
     }
    }
    A.ok(snapshot.metrics.scroll<=Math.max(width,before.metrics.scroll),'no new document overflow '+key);
    await assertColors(page,route);
    A.ok(contrast.count>100,'visible text audit '+key);
    if(contrast.failures.length){
     contrastFailures.push({key,failures:contrast.failures});
     console.log('CONTRAST_FAILURE '+key+' '+JSON.stringify(contrast.failures.slice(0,12)));
    }
    if(layout===1&&condition==='ready'&&language==='ru'&&width===390){
     await page.locator('link[href*="nomad360_design_system.css"]').evaluate(el=>{el.disabled=true;});
     const rejected=await page.addStyleTag({path:rejectedStyles});
     const previous=await page.evaluate(()=>NomadContrast.audit(document.getElementById('portfolio-v2-root')));
     const failures=previous.failures.filter(v=>v.resource!==null);
     A.ok(failures.length>0,'negative regression detects rejected resource contrast '+key);
     receipts[key].rejectedResourceFailures=failures;
     console.log('REJECTED_RESOURCE_CONTRAST '+key+' '+failures.length+' failures; min '+Math.min(...failures.map(v=>v.ratio)));
     await rejected.evaluate(el=>el.remove());
     await page.locator('link[href*="nomad360_design_system.css"]').evaluate(el=>{el.disabled=false;});
    }
   }
   const stateBefore=JSON.stringify(initial.state);
   await page.locator(route==='standalone'?'[data-p2-save]':'[data-linked-save]').click();
   await page.evaluate(route=>route==='standalone'?PortfolioV2UI.open({resume:true}):LinkedPortfolioV2UI.resume(),route);
   const restored=await page.evaluate(route=>JSON.stringify((route==='standalone'?PortfolioV2UI:LinkedPortfolioV2UI).getState()),route);
   A.equal(restored,stateBefore,'save/resume '+key);
   if(layout===2){
    await prepareForms(page);
    if(stage===1&&language==='ru'&&width===390)await exerciseFields(page,route,condition);
    if((condition==='ready'&&[320,390,1280].includes(width))||(condition!=='ready'&&width===390))await formPictures(page,route,condition,key);
   }else if((condition==='ready'&&[320,390,1280].includes(width))||(condition==='unready'&&width===390))await pictures(page,route,key);
   A.deepEqual(errors,[],key);
   await context.close();
  }
  if(stage===1)for(const route of ['standalone','linked'])for(const condition of layout===2?
   (route==='standalone'?['ready','credit','dropship']:['ready','history','unmapped','full-service']):['ready']){
   const page=await browser.newPage({locale:'en-US',viewport:{width:390,height:900}});
   await page.route(/^https?:\/\//,r=>r.abort());
   await page.goto(pathToFileURL(path.join(directory,'Marketing_calc.HTML')).href,{waitUntil:'domcontentloaded'});
   await seed(page,route,condition);await assertColors(page,route);
   if(layout===2){await page.addScriptTag({path:path.join(__dirname,'helpers/v2-layout.cjs')});await page.addScriptTag({path:path.join(__dirname,'helpers/contrast.cjs')});await prepareForms(page);
    A.deepEqual((await page.evaluate(()=>NomadLayout.audit(document.getElementById('portfolio-v2-root')))).failures,[],'layout without optional utilities '+route);
    A.deepEqual((await page.evaluate(()=>NomadContrast.audit(document.getElementById('portfolio-v2-root')))).failures,[],'contrast without optional utilities '+route);}
   await page.close();
  }
  fs.writeFileSync(path.join(artifacts,name,'receipts.json'),JSON.stringify(receipts,null,2));
  A.deepEqual(layoutFailures,[],'no clipped labels, field/checkbox overlap or unreadable selections');
  A.deepEqual(numericFailures,[],'result values are one line and fit their cards');
  if(layout===2&&stage===1){
   A.ok(baseline['standalone-ready-ru-320'].geometry.failures.length>0,'baseline reproduces standalone mobile defects');
   A.ok(baseline['linked-ready-ru-320'].geometry.failures.length>0,'baseline reproduces linked mobile defects');
  }
  A.deepEqual(contrastFailures,[],'composited text contrast >= 4.5 in all cases');
  console.log((layout===2?'V2_FIELDS_':'V2_CONTAINERS_')+name.toUpperCase()+'_GREEN '+Object.keys(receipts).length+' cases');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
