'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
const Linked=require('../portfolio_v2_linked_engine.js');
const arg=(key,fallback)=>process.argv.find(v=>v.startsWith('--'+key+'='))?.split('=').slice(1).join('=')||fallback;
const stage=Number(arg('stage','1'));
const directory=path.resolve(arg('root',path.join(__dirname,'..')));
const artifacts=path.resolve(arg('artifacts','artifacts/v2-containers'));
const utilities=path.resolve(arg('utilities','artifacts/v2-utilities.css'));
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
 const targets=route==='standalone'?['#portfolio-v2-root','#p2-stage-production','#p2-results']:
  ['#portfolio-v2-root','#linked-resources','#linked-results'];
 for(let i=0;i<targets.length;i++){
  if(i===0)await page.evaluate(()=>scrollTo(0,0));
  else await page.locator(targets[i]).evaluate(el=>el.scrollIntoView({block:'start'}));
  await page.screenshot({path:path.join(artifacts,name,key+'-'+['top','resources','results'][i]+'.png')});
 }
 await page.evaluate(()=>scrollTo(0,0));
}
async function assertColors(page,route){
 const result=await page.evaluate(()=>{
  const root=document.getElementById('portfolio-v2-root'),style=el=>getComputedStyle(el);
  const sections=[...root.querySelectorAll('.nd-v2-section,.nd-v2-hero,.nd-v2-result-frame')];
  const text=[...root.querySelectorAll('.nd-v2-title,.nd-v2-description,.nd-v2-eyebrow,.nd-v2-status,.nd-v2-section-link')];
  return {background:style(document.body).backgroundColor,
   sections:sections.map(el=>({background:style(el).backgroundColor,radius:style(el).borderRadius,shadow:style(el).boxShadow})),
   text:text.map(el=>({text:el.textContent.slice(0,60),color:style(el).color})),
   fields:[...root.querySelectorAll('.input-field')].map(el=>({color:style(el).color,background:style(el).backgroundColor}))};
 });
 A.equal(result.background,'rgb(255, 255, 255)');
 A.ok(result.sections.length>=(route==='standalone'?11:7));
 for(const s of result.sections){A.equal(s.background,'rgb(22, 55, 90)');A.equal(s.shadow,'none');A.ok(parseFloat(s.radius)<=4);}
 A.ok(result.text.length>=8);
 for(const t of result.text)A.equal(t.color,'rgb(255, 255, 255)',JSON.stringify(t));
 for(const f of result.fields){A.equal(f.color,'rgb(22, 55, 90)');A.equal(f.background,'rgb(255, 255, 255)');}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const receipts={},baseline=stage===1?JSON.parse(fs.readFileSync(path.join(artifacts,'before','receipts.json'),'utf8')):null;
 try{
  for(const route of ['standalone','linked'])for(const condition of ['ready','unready'])
  for(const language of languages)for(const width of widths){
   const key=[route,condition,language,width].join('-');
   const context=await browser.newContext({locale:language==='kk'?'kk-KZ':language==='en'?'en-US':'ru-RU',viewport:{width,height:900}});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,r=>r.abort());
   await page.goto(pathToFileURL(path.join(directory,'Marketing_calc.HTML')).href,{waitUntil:'domcontentloaded'});
   await page.evaluate(language=>Nomad360UI.setLanguage(language),language);
   await page.addStyleTag({path:utilities});
   const initial=JSON.parse(JSON.stringify(await seed(page,route,condition)));
   A.equal(initial.finance.ready,condition==='ready',key+': '+JSON.stringify(initial.finance.errors));
   const snapshot=JSON.parse(JSON.stringify(await page.evaluate(visibleSnapshot)));
   receipts[key]={...initial,...snapshot};
   if(stage===1){
    const before=baseline[key];
    A.deepEqual(initial.state,before.state,'saved business state '+key);
    A.deepEqual(initial.finance,before.finance,'financial results '+key);
    A.deepEqual(snapshot.fields,before.fields,'control values, geometry and colors '+key);
    A.deepEqual(snapshot.resources,before.resources,'resource cards remain unchanged '+key);
    A.deepEqual(snapshot.regions.map(x=>x.rect),before.regions.map(x=>x.rect),'section geometry '+key);
    A.ok(snapshot.metrics.scroll<=Math.max(width,before.metrics.scroll),'no new document overflow '+key);
    await assertColors(page,route);
   }
   const stateBefore=JSON.stringify(initial.state);
   await page.locator(route==='standalone'?'[data-p2-save]':'[data-linked-save]').click();
   await page.evaluate(route=>route==='standalone'?PortfolioV2UI.open({resume:true}):LinkedPortfolioV2UI.resume(),route);
   const restored=await page.evaluate(route=>JSON.stringify((route==='standalone'?PortfolioV2UI:LinkedPortfolioV2UI).getState()),route);
   A.equal(restored,stateBefore,'save/resume '+key);
   if(condition==='ready'&&[390,1280].includes(width))await pictures(page,route,key);
   A.deepEqual(errors,[],key);
   await context.close();
  }
  if(stage===1)for(const route of ['standalone','linked']){
   const page=await browser.newPage({locale:'en-US',viewport:{width:390,height:900}});
   await page.route(/^https?:\/\//,r=>r.abort());
   await page.goto(pathToFileURL(path.join(directory,'Marketing_calc.HTML')).href,{waitUntil:'domcontentloaded'});
   await seed(page,route,'ready');await assertColors(page,route);await page.close();
  }
  fs.writeFileSync(path.join(artifacts,name,'receipts.json'),JSON.stringify(receipts,null,2));
  console.log('V2_CONTAINERS_'+name.toUpperCase()+'_GREEN '+Object.keys(receipts).length+' cases');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
