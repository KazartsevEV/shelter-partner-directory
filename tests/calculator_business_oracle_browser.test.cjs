/* Independent numeric oracle for online service end-to-end UI.
   Expected results are from manually computed transactions, NOT calculator functions. */
const {test,before,after}=require('node:test');
const A=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
let browser;
const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
before(async()=>{browser=await chromium.launch({headless:true,args:['--no-sandbox']});});
after(async()=>{await browser?.close();});
const fmt=s=>{const m=String(s||'').replace(/[\u00a0\u202f]/g,' ').match(/[-+]?\d[\d ]*(?:[,.]\d+)?/);return m?Number(m[0].replace(/ /g,'').replace(',','.')):NaN;};
const eq=(a,b,label)=>A.ok(Math.abs(a-b)<.011,label+' actual '+a+' expected '+b);
async function setup(mode,overrides={}){
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,r=>r.abort());
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.locator('#start-service').click();
 await page.locator('#service-work-online').click();
 if(mode==='agent'){
  await page.getByRole('button',{name:'Я агент'}).click();
  await page.getByRole('button',{name:'Мне платят % с объёма продаж'}).click();
 }else{
  await page.getByRole('button',{name:mode==='hired'?'Нанимаю другого':'Я сам'}).click();
 }
 const data={months:3,monthlyBudget:400,cpc:4,ctr:2,cvrLead:20,cvrDeal:50,
    costConsult:100,costPack:200,ltv:30,mgmt:0,site:0,hosting:0,
    dom:0,magnet:0,acq:10,taxTurnover:5,
    ...(mode==='hired'?{markup:25}:{}),
    ...(mode==='agent'?{agentPct:20,agentTaxTurnover:10}:{}),...overrides};
 for(const [key,value] of Object.entries(data))
  await page.locator('#in-'+key).fill(String(value));
 return {page,errors};
}
async function cell(page,table,label,which='last'){
 const row=page.locator('#'+table+' tr').filter({has:page.locator('td:first-child', {hasText:label})}).first();
 A.equal(await row.count(),1,'row '+label);
 return fmt(await row.locator('td').last().textContent());
}
async function summary(page,label){
 const row=page.locator('#summary-table tr').filter({hasText:label}).first();
 A.equal(await row.count(),1,'summary '+label);
 return fmt(await row.locator('td').last().textContent());
}
const monthRevenue=325+1600+1600; // month 1: 5 leads, 0.75 packs, extra 0.5 revenue ramp
const acquisition=monthRevenue*.10;
const turnover=monthRevenue*.05;
test('SELF: real UI period revenue, one acquiring charge, tax and ledger reconciliation',async()=>{
 const {page,errors}=await setup('self');
 try{
  eq(await cell(page,'monthly-table','Общая выручка'),monthRevenue,'monthly earned revenue');
  eq(await cell(page,'monthly-table','Комиссия эквайринга'),acquisition,'acquiring once');
  eq(await summary(page,'Общая выручка Revenue'),monthRevenue,'summary revenue matches 3-month cash ledger');
  eq(await summary(page,'Комиссия эквайринга'),acquisition,'summary acquisition');
  eq(await cell(page,'monthly-table','Денежный поток'),monthRevenue-acquisition-1200-turnover,'cash after one fee and tax');
  eq(await summary(page,'Чистая прибыль после налогов'),monthRevenue-acquisition-1200-turnover,'summary net equals monthly cash');
  A.deepEqual(errors,[]);
 }finally{await page.close();}
});
test('HIRED: performer receives exact reverse markup; totals reconcile across monthly, tax, cash',async()=>{
 const {page,errors}=await setup('hired');
 try{
  const executor=monthRevenue/1.25;
  eq(await cell(page,'monthly-table','Оплата исполнителю'),executor,'hired performer');
  eq(await summary(page,'Оплата исполнителю'),executor,'performer in summary');
  eq(await summary(page,'Чистая прибыль после налогов'),
     monthRevenue-acquisition-executor-1200-turnover,'profit after hired cost');
  A.deepEqual(errors,[]);
 }finally{await page.close();}
});
test('AGENT: partner pays acquisition, agent pays media, both tax bases and ledgers balance',async()=>{
 const {page,errors}=await setup('agent');
 try{
  const payers={monthlyBudget:'me',mgmt:'partner',site:'partner',
   hosting:'partner',dom:'partner',magnet:'partner'};
  for(const [key,payer]of Object.entries(payers))
   await page.locator('input[name="payer-'+key+'"][value="'+payer+'"]').check();
  const commission=monthRevenue*.2,ownTax=commission*.1;
  eq(await cell(page,'monthly-table','Моё вознаграждение до расходов'),commission,'agent commission');
  eq(await cell(page,'monthly-table','Мой налог на оборот'),ownTax,'agent tax');
  eq(await cell(page,'monthly-table','Мне остаётся после расходов и налога'),
    commission-1200-ownTax,'agent monthly net');
  eq(fmt(await page.locator('#res-profit').textContent()),commission-1200-ownTax,'agent hero net');
  eq(await cell(page,'monthly-table','Комиссия эквайринга партнёра'),acquisition,'partner acquiring');
  eq(await summary(page,'Чистая прибыль партнёра после налогов'),
    monthRevenue-acquisition-commission-turnover,'partner profit');
  A.deepEqual(errors,[]);
 }finally{await page.close();}
});
test('ZERO DEMAND: zero ad / leads must never manufacture 0.1 orders, income or tax',async()=>{
 const {page,errors}=await setup('self',{monthlyBudget:0,mgmt:0,acq:0,taxTurnover:0});
 try{
   eq(await cell(page,'monthly-table','Количество сделок'),0,'no ghost deals');
   eq(await summary(page,'Общая выручка Revenue'),0,'no ghost revenue');
   A.deepEqual(errors,[]);
 }finally{await page.close();}
});

test('CAPEX: website & lead magnet are one-time cash outflows, amortized in P&L, never double expensed',async()=>{
 const {page,errors}=await setup('agent',{site:120,magnet:60,mgmt:30,hosting:12,dom:6});
 try{
  for(const key of ['monthlyBudget'])await page.locator('input[name="payer-'+key+'"][value="me"]').check();
  for(const key of ['mgmt','site','hosting','dom','magnet'])
   await page.locator('input[name="payer-'+key+'"][value="partner"]').check();
  const partnerEBITDA=monthRevenue-acquisition-monthRevenue*.2-(30+12+6);
  const capex=120+60,amort=(120+60)*3/12;
  const partnerProfit=partnerEBITDA-turnover-amort;
  const partnerCash=partnerEBITDA-turnover-capex;
  eq(await summary(page,'Амортизация сайта'),30,'site monthly accrual over 3 months');
  eq(await summary(page,'Амортизация лид-магнита'),15,'lead magnet accrual over 3 months');
  eq(await summary(page,'Чистая прибыль партнёра после налогов'),partnerProfit,'profit excludes CAPEX but includes depreciation');
  eq(await cell(page,'monthly-table','Денежный поток партнёра'),partnerCash,'cash includes full up-front CAPEX');
  eq(fmt(await page.locator('#res-cpa').textContent()),partnerCash,'partner hero is cash');
  A.deepEqual(errors,[]);
 }finally{await page.close();}
});

test('AGENT payer matrix: all 64 expense ownership combinations conserve partner+agent money',async()=>{
 const {page,errors}=await setup('agent',{mgmt:30,site:120,hosting:12,dom:6,magnet:60});
 const keys=['monthlyBudget','mgmt','site','hosting','dom','magnet'];
 const amounts={monthlyBudget:1200,mgmt:30,site:120,hosting:12,dom:6,magnet:60};
 const baseAgent=monthRevenue*.2,agentTax=baseAgent*.1;
 const partnerTax=monthRevenue*.05,acq=monthRevenue*.1;
 try{
  for(let mask=0;mask<64;mask++){
   const payers=Object.fromEntries(keys.map((key,i)=>[key,mask&(1<<i)?'me':'partner']));
   const view=await page.evaluate(payers=>{
      for(const [key,payer]of Object.entries(payers))
        document.querySelector('input[name="payer-'+key+'"][value="'+payer+'"]').click();
      const val=(table,label)=>{
        const row=Array.from(document.querySelectorAll('#'+table+' tr'))
          .find(tr=>tr.querySelector('td')?.textContent?.trim()===label);
        return row?.querySelector('td:last-child')?.textContent||'NOT_FOUND';
      };
      return {
        agent:val('summary-table','Мне остаётся после моих расходов и налога'),
        profit:val('summary-table','Чистая прибыль партнёра после налогов'),
        cash:val('monthly-table','Денежный поток партнёра'),
        error:document.querySelector('#res-profit').textContent
      };
    },payers);
   const mine=keys.filter(key=>payers[key]==='me').reduce((a,k)=>a+amounts[k],0);
   const partnerBudget=payers.monthlyBudget==='partner'?1200:0;
   const partnerOpex=['mgmt','hosting','dom']
     .filter(k=>payers[k]==='partner').reduce((a,k)=>a+amounts[k],0);
   const partnerCapex=['site','magnet']
     .filter(k=>payers[k]==='partner').reduce((a,k)=>a+amounts[k],0);
   const operating=monthRevenue-acq-baseAgent-partnerTax-partnerBudget-partnerOpex;
   const pProfit=operating-partnerCapex*3/12,pCash=operating-partnerCapex;
   const myNet=baseAgent-agentTax-mine;
   eq(fmt(view.agent),myNet,'agent payer mask '+mask);
   eq(fmt(view.profit),pProfit,'partner P&L mask '+mask);
   eq(fmt(view.cash),pCash,'partner cash mask '+mask);
   eq(fmt(view.agent)+fmt(view.cash),
      monthRevenue-acq-partnerTax-agentTax-(1200+30+120+12+6+60),
      'system cash conservation mask '+mask);
  }
  A.deepEqual(errors,[]);
 }finally{await page.close();}
});

test('AMORTIZATION horizon 24 months never depreciates 12-month intangible twice',async()=>{
 const {page,errors}=await setup('self',{months:24,site:120,magnet:60});
 try{
  const revenue=325+1600*23,acq=revenue*.10,tax=revenue*.05;
  eq(await summary(page,'Амортизация сайта'),120,'12-month site cap');
  eq(await summary(page,'Амортизация лид-магнита'),60,'12-month magnet cap');
  eq(await summary(page,'Чистая прибыль после налогов'),
     revenue-acq-400*24-tax-120-60,'year-two does not depreciate exhausted asset');
  A.deepEqual(errors,[]);
 }finally{await page.close();}
});

test('INVALID INPUT: impossible conversions, zero CTR with spend, negatives & noninteger months fail closed',async()=>{
 const {page,errors}=await setup('self');
 try{
  for(const [key,value]of [
    ['cvrLead',150],['acq',110],['ctr',0],['cpc',0],
    ['months',1.5],['monthlyBudget',-100]
  ]){
   await page.locator('#in-'+key).fill(String(value));
   A.equal(await page.locator('#in-'+key).getAttribute('aria-invalid'),'true',
       key+' must be rejected');
   A.match(await page.locator('#summary-table').textContent(),/Недопустимая модель/);
   A.equal((await page.locator('#res-profit').textContent()).trim(),'—');
   const replacement={cvrLead:20,acq:10,ctr:2,cpc:4,months:3,monthlyBudget:400}[key];
   await page.locator('#in-'+key).fill(String(replacement));
   A.notEqual(await page.locator('#in-'+key).getAttribute('aria-invalid'),'true');
  }
  A.deepEqual(errors,[]);
 }finally{await page.close();}
});

test('ALL HERO KPIs: CPA/CAC match displayed period totals, never the un-ramped old funnel',async()=>{
 for(const mode of ['self','hired']){
  for(const months of [1,3,6]){
   const {page,errors}=await setup(mode,{months});
   try{
    const revenue=325+(months-1)*1600;
    const deals=5+(months-1)*10; // first month: 10 base deals × 50% ramp; revenue has an additional 50% ramp
    const budget=400*months;
    const acquiring=revenue*.10,contractor=mode==='hired'?revenue/1.25:0;
    const costs=budget+acquiring+contractor;
    const net=revenue-costs-revenue*.05;
    eq(fmt(await page.locator('#res-cpa').textContent()),budget/deals,mode+'/'+months+' hero CPA');
    eq(fmt(await page.locator('#res-cac').textContent()),costs/deals,mode+'/'+months+' hero CAC');
    eq(await summary(page,'CPA (цена клиента реклама)'),budget/deals,mode+'/'+months+' table CPA');
    eq(await summary(page,'CAC (цена клиента полная)'),costs/deals,mode+'/'+months+' table CAC');
    eq(fmt(await page.locator('#res-profit').textContent()),net,mode+'/'+months+' profit');
    eq(await cell(page,'monthly-table','Количество сделок'),deals,mode+'/'+months+' deals');
    eq(await cell(page,'monthly-table','Денежный поток'),net,mode+'/'+months+' cash');
    A.deepEqual(errors,[]);
   }finally{await page.close();}
  }
 }
});
