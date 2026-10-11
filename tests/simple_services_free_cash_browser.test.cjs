/* Real Chromium acceptance: spendable cash comes FIRST in simple V1 services.
 * Compare visible numbers with the same detailed monthly ledger for own/hired/agent,
 * and independently recover offline cumulative cash from ledger entries.
 */
'use strict';
const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
const approx=(a,b,label)=>A.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<.015,
 label+': '+a+' vs '+b);
const last=(table,label)=>table.locator('tbody tr').filter({hasText:label}).last().locator('td').last();
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
 const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.route(/^https?:\/\//,r=>r.abort());
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  for(const role of ['self','hired','agent']){
   await page.evaluate(role=>{
    selectServiceMode(role);
    currentValues.months=4;
    if(role==='agent'){
     for(const key of Object.keys(agentPayers))agentPayers[key]='partner';
     agentPayers.monthlyBudget='me';agentPayers.site='me';
    }
    calculate();
   },role);
   A.equal(await page.locator('#service-simple-free-cash').isVisible(),true);
   const order=await page.evaluate(()=>Boolean(
    document.getElementById('service-simple-free-cash').compareDocumentPosition(
     document.getElementById('res-profit')) & Node.DOCUMENT_POSITION_FOLLOWING));
   A.ok(order,'spendable cash must precede profit in '+role);
   const amount=await page.locator('#service-simple-free-cash-value')
      .evaluate(el=>Number(el.dataset.nomadDisplayNumber));
   const table=page.locator('#monthly-breakdown-table');
   const key=role==='agent'?'Накопленно мне остаётся':'Накопленный поток';
   const raw=await last(table,key).getAttribute('data-nomad-display-number');
   approx(amount,Number(raw),'4-month spendable cash, '+role);
   A.match(await page.locator('#service-simple-free-cash-detail').innerText(),/4 месяца/);
   if(role==='agent'){
    const partner=await last(table,'Накопленный поток партнёра').getAttribute('data-nomad-display-number');
    A.notEqual(amount,Number(partner),'agent cannot display principal cash as their own');
   }
   await page.evaluate(()=>{currentValues.months=2;calculate()});
   A.match(await page.locator('#service-simple-free-cash-detail').innerText(),/2 месяца/);
   approx(Number(await page.locator('#service-simple-free-cash-value').getAttribute('data-nomad-display-number')),
     Number(await last(table,key).getAttribute('data-nomad-display-number')),
     '2-month update, '+role);
  }
  await page.evaluate(()=>{
    selectServiceMode('agent');
    currentValues.months=3;
    agentPayers.site=null;
    calculate();
  });
  A.equal(await page.locator('#service-simple-free-cash-value').innerText(),'—',
   'missing payer never leaves a stale numeric agent cash result');
  await page.evaluate(()=>{
    selectServiceMode('self');currentValues.months=121;calculate();
  });
  A.equal(await page.locator('#service-simple-free-cash-value').innerText(),'—',
   'invalid period cannot display spendable cash');
  console.log('SIMPLE_ONLINE_FREE_CASH_GREEN');
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{serviceFinancialMode='simple';startOfflineServiceCalculation()});
  A.equal(await page.locator('#service-v1-horizon').inputValue(),'1',
    'microbusiness mode must preserve the previous one-month default');
  await page.locator('#product-name-input').fill('Маникюр, простой расчёт');
  await page.locator('#product-intro-submit-label').click();
  A.equal(await page.locator('#service-v1-horizon-panel').isVisible(),true,
    'period control is visible after service inputs open');
  await page.locator('[data-material-cost-mode="known"]').click();
  await page.locator('#own-materials-cost').fill('8');
  await page.locator('[data-yn-group="productionPremises"][data-yn-value="yes"]').click();
  await page.locator('#own-production-premises-monthly').fill('600');
  await page.locator('[data-production-labor-mode="workers"]').click();
  await page.locator('#own-production-workers-count').fill('2');
  await page.locator('#own-production-worker-gross').fill('300');
  await page.locator('#offline-service-monthly-capacity').fill('30');
  await page.locator('#own-product-ad-budget').fill('900');
  await page.locator('#own-product-ad-cpc').fill('4.5');
  await page.locator('#own-product-ad-ctr').fill('2');
  await page.locator('#own-product-ad-click-lead').fill('20');
  await page.locator('#own-product-ad-lead-sale').fill('50');
  await page.locator('#assortment-complete-button').click();
  const sel='[data-business-product-id="1"]';
  await page.locator(sel+' [data-funding-choice="cash"]').click();
  await page.locator(sel+' input[oninput*="updateAggregateMargin"]').fill('30');
  await page.locator('[data-yn-group="salesVat"][data-yn-value="no"]').click();
  await page.locator(sel+' [data-pricing-decision="tax"]').click();
  await page.locator('[data-business-tax-type="turnover"]').click();
  await page.locator('#own-business-tax-pct').fill('6');
  const original=await page.evaluate(()=>calculateProductCashFlow(calculateProductPortfolio()));
  A.equal(original.ready,true,'simple offline finance inputs complete');
  A.equal(original.months.length,1,'one month default');
  const card=page.locator('#offline-simple-free-cash');
  A.equal(await card.isVisible(),true);
  const first=await page.evaluate(()=>Boolean(
    document.getElementById('offline-simple-free-cash').compareDocumentPosition(
      document.getElementById('product-portfolio-business-summary')) & Node.DOCUMENT_POSITION_FOLLOWING));
  A.ok(first,'offline spendable cash precedes P&L');
  const check=async(demand,calendar)=>{
   const cf=await page.evaluate(()=>calculateProductCashFlow(calculateProductPortfolio()));
   A.equal(cf.ready,true);
   A.equal(cf.operatingMonths,demand);
   A.equal(cf.months.length,calendar);
   const visible=await page.locator('#offline-simple-free-cash-value [data-nomad-display-number]')
       .getAttribute('data-nomad-display-number');
   approx(Number(visible),cf.freeCumulativeEnd,'offline '+demand+' months');
   let cum=0;
   for(const month of cf.months){
    cum+=month.inflow-month.outflow;
    approx(month.cashFlow,month.inflow-month.outflow,'monthly CF');
    approx(month.cumulative,cum,'cumulative CF');
    approx(month.freeCumulative,cum-cf.reserveLocked,'free cumulative CF');
   }
   approx(cf.freeCumulativeEnd,cum-cf.reserveLocked,'cash final');
   for(let i=demand;i<calendar;i++){
    approx(cf.months[i].inflow-cf.months[i].financedInflow,0,
      'loan tail has no fictitious service revenue');
   }
   return cf;
  };
  await check(1,1);
  await page.locator('#service-v1-horizon').fill('3');
  A.equal(await page.evaluate(()=>productPortfolio[0].serviceHorizonMonths),3,
    'editing the visible period synchronizes the underlying active offline service');
  const month3=await check(3,3);
  approx(month3.months[1].inflow-month3.months[1].financedInflow,
    month3.months[0].inflow-month3.months[0].financedInflow,
    'monthly service revenue repeats until selected horizon');
  await page.locator(sel+' [data-funding-choice="credit"]').click();
  await page.locator(sel+' input[oninput*="creditRatePct"]').fill('12');
  await page.locator(sel+' input[oninput*="creditTermMonths"]').fill('6');
  const loan=await check(3,6);
  A.ok(loan.months[5].principalRepaid>0,'bullet principal is paid in sixth month');
  A.ok(loan.months[5].interestPaid>0);
  A.deepEqual(errs,[],'no page exceptions');
  console.log('SIMPLE_OFFLINE_FREE_CASH_GREEN',
    JSON.stringify({months:3,calendar:6,freeCash:loan.freeCumulativeEnd}));
 }finally{await browser.close()}
})().catch(e=>{console.error('SIMPLE_SERVICES_FREE_CASH_RED',e.stack||e);process.exitCode=1});
