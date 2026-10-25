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
 // Exact ledger-row names below are Russian; simulate an explicit RU choice.
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
   const taxNote=page.locator('#service-agent-tax-note');
   A.equal(await taxNote.isVisible(),role==='agent','after-tax caption shown only to the agent');
   if(role==='agent'){
    A.equal(await taxNote.innerText(),'ПОСЛЕ уплаты моих налогов.');
    A.equal(await taxNote.evaluate(el=>getComputedStyle(el).color),
      'rgb(255, 145, 63)','agent tax caption uses brand orange');
    A.equal(await page.evaluate(()=>Nomad360LocaleCore.translate('ПОСЛЕ уплаты моих налогов.','en')),
      'AFTER paying my taxes.');
    A.equal(await page.evaluate(()=>Nomad360LocaleCore.translate('ПОСЛЕ уплаты моих налогов.','kk')),
      'Менің салықтарымды төлегеннен КЕЙІН.');
    const myTaxInput=page.locator('#in-agentTaxTurnover');
    A.equal(await myTaxInput.count(),1,'agent must have its own rate input');
    A.equal(await myTaxInput.isVisible(),true,'agent rate input should be rendered');
    A.equal(await myTaxInput.inputValue(),'0','explicit default 0 percent');
    A.deepEqual(await page.locator('#inputs-container > div').evaluateAll(rows=>
      rows.map(row=>row.querySelector('input[id^="in-"]')?.id).filter(Boolean).slice(-2)),
      ['in-taxTurnover','in-agentTaxTurnover'],'agent tax input follows principal tax at end of form');
    A.equal(await myTaxInput.evaluate(el=>getComputedStyle(el.parentElement).borderLeftColor),
      'rgb(56, 103, 139)','agent rate input uses the approved secondary-blue section marker');
    const partner=await last(table,'Накопленный поток принципала').getAttribute('data-nomad-display-number');
    A.notEqual(amount,Number(partner),'agent cannot display principal cash as their own');
    A.match(await page.locator('#mode-context').innerText(),/Принципал/i);
    A.doesNotMatch(await page.locator('#calculator-screen').innerText(),/Партн[её]р/i);
    A.equal(await page.evaluate(()=>Nomad360LocaleCore.translate('Принципал','en')),'Principal');
    A.equal(await page.evaluate(()=>Nomad360LocaleCore.translate('Принципал','kk')),'Принципал');
    A.equal(await page.locator('#calculator-screen').evaluate(el=>el.classList.contains('nd-agent-mode')),true);
    A.ok(await page.locator('.nd-agent-payer-group').count()>0,'agent inputs expose shared payer skin');
    const payerSkin=await page.locator('.nd-agent-payer-group').first().evaluate(el=>({
     background:getComputedStyle(el).backgroundColor,
     radio:getComputedStyle(el.querySelector('input[type=radio]')).accentColor,
     width:el.scrollWidth,clientWidth:el.clientWidth
    }));
    A.equal(payerSkin.background,'rgb(255, 255, 255)','agent controls reuse V1 soft surface');
    A.equal(payerSkin.radio,'rgb(23, 59, 88)','agent payer selector uses shared navy');
    A.ok(payerSkin.width<=payerSkin.clientWidth+1,'agent payer group stays within mobile card');
    A.ok(await page.locator('#summary-table .nd-agent-number-highlight').count()>0,
     'positive agent figures use named, brand-neutral financial emphasis');
   } else {
    A.equal(await page.locator('#calculator-screen').evaluate(el=>el.classList.contains('nd-agent-mode')),false,
     'non-agent mode cannot inherit agent-only skin');
   }
   await page.evaluate(()=>{currentValues.months=2;calculate()});
   A.match(await page.locator('#service-simple-free-cash-detail').innerText(),/2 месяца/);
   approx(Number(await page.locator('#service-simple-free-cash-value').getAttribute('data-nomad-display-number')),
     Number(await last(table,key).getAttribute('data-nomad-display-number')),
     '2-month update, '+role);
   if(role==='agent'){
    await page.locator('#in-agentPct').fill('15');
    await page.locator('#in-agentTaxTurnover').fill('0');
    const fee=Number(await last(table,'Моё вознаграждение до расходов')
      .getAttribute('data-nomad-display-number'));
    const principalTaxBefore=Number(await last(table,'Налог принципала на оборот*')
      .getAttribute('data-nomad-display-number'));
    const cashBefore=Number(await page.locator('#service-simple-free-cash-value')
      .getAttribute('data-nomad-display-number'));
    await page.locator('#in-agentTaxTurnover').fill('7');
    const ownTax=Number(await last(table,'Мой налог на оборот*')
      .getAttribute('data-nomad-display-number'));
    const cashAfter=Number(await page.locator('#service-simple-free-cash-value')
      .getAttribute('data-nomad-display-number'));
    const principalTaxAfter=Number(await last(table,'Налог принципала на оборот*')
      .getAttribute('data-nomad-display-number'));
    approx(ownTax,fee*.07,'agent turnover tax based on agency commission');
    approx(cashBefore-cashAfter,ownTax,'agent tax rate reduces spendable cash');
    approx(principalTaxBefore,principalTaxAfter,'principal tax independent of agent rate');
    await page.locator('#in-agentTaxTurnover').fill('0');
    await page.locator('#in-agentPct').fill('0');
   }
  }
  await page.evaluate(()=>{
    selectServiceMode('agent');
    currentValues.months=3;
    agentPayers.site=null;
    calculate();
  });
  A.equal(await page.locator('#service-simple-free-cash-value').innerText(),'—',
   'missing payer never leaves a stale numeric agent cash result');
  A.equal(await page.locator('#service-agent-tax-note').isVisible(),false,
   'invalid agent cash does not claim taxes were deducted');
  await page.evaluate(()=>{
    selectServiceMode('self');currentValues.months=121;calculate();
  });
  A.equal(await page.locator('#service-simple-free-cash-value').innerText(),'—',
   'invalid period cannot display spendable cash');
  A.equal(await page.locator('#service-agent-tax-note').isVisible(),false,
   'self service must not inherit agent caption');
  // Responsive agent components remain inside the viewport. Sitewide header/footer
  // have an independent 768px bleed; do not conflate that with the agent layout.
  const contained=selector=>page.evaluate(selector=>{
   const root=document.querySelector(selector);
   if(!root)return false;
   const nodes=[root,...root.querySelectorAll('button,.card,.nd-agent-payer-group')];
   return nodes.every(el=>{
    const r=el.getBoundingClientRect(),css=getComputedStyle(el);
    return css.display==='none'||css.visibility==='hidden'||
     (r.left>=-1&&r.right<=innerWidth+1&&r.width<=innerWidth+1);
   });
  },selector);
  await page.evaluate(()=>{serviceFinancialMode='simple';showAgentChooser()});
  // Assert final brand styling, not an in-between RGB transition frame.
  // This test-only override leaves the application and production CSS intact.
  await page.addStyleTag({content:
    '#agent-screen button.nd-agent-percentage-cta{transition:none!important;animation:none!important}'});
  for(const width of [320,390,768]){
   await page.setViewportSize({width,height:844});
   await page.evaluate(()=>showAgentChooser());
   // A prior click can leave the desktop mouse over this CTA after resizing.
   // Keep the mouse outside the CTA while verifying its base fill.
   await page.mouse.move(1,1);
   A.equal(await page.locator('#agent-screen').isVisible(),true);
   A.equal(await page.locator('#agent-screen .nd-agent-eyebrow').evaluate(el=>getComputedStyle(el).color),
    'rgb(23, 59, 88)');
   const orangeAction=page.locator('#agent-screen button.nd-agent-percentage-cta');
   A.equal(await orangeAction.evaluate(el=>el.matches(':hover')),false,
     'CTA must not be hovered during base-color verification at '+width);
   A.equal(await orangeAction.evaluate(el=>
     getComputedStyle(document.documentElement).getPropertyValue('--nd-cta-orange').trim()),
     '#FF913F','Authoritative orange brand token at '+width);
   A.equal(await orangeAction.evaluate(el=>getComputedStyle(el).backgroundColor),
     'rgb(255, 145, 63)','Unhovered agent CTA uses the exact brand orange at '+width);
   A.equal(await orangeAction.locator('.font-semibold').evaluate(el=>getComputedStyle(el).color),
     'rgb(23, 59, 88)','navy text on agent CTA at '+width);
   A.equal(await page.locator('#agent-screen button[onclick="showAgentComplex()"]').evaluate(el=>getComputedStyle(el).backgroundColor),
     'rgb(255, 255, 255)','secondary agent choice stays white');
   A.ok(await contained('#agent-screen'),'agent chooser elements overflow '+width);
   await page.evaluate(()=>showAgentComplex());
   A.equal(await page.locator('#agent-complex-screen').isVisible(),true);
   A.ok(await contained('#agent-complex-screen'),'agent custom elements overflow '+width);
   await page.evaluate(()=>showAgentChooser());
   await page.locator('#agent-screen button.nd-agent-percentage-cta').click();
   A.equal(await page.locator('#calculator-screen').isVisible(),true,'CTA opens the simplified agent calculator');
   A.ok(await contained('#calculator-screen'),'agent calculation panels overflow '+width);
  }
  await page.setViewportSize({width:390,height:844});
  // Full V1 agent has the same white/navy panel and separate per-expense payer rows.
  await page.evaluate(()=>{serviceFinancialMode='full';selectServiceMode('agent')});
  A.equal(await page.locator('#product-screen').isVisible(),true);
  await page.locator('#product-name-input').fill('Агентская услуга');
  await page.locator('#product-intro-submit-label').click();
  A.equal(await page.locator('#service-v1-agent-panel').isVisible(),true);
  A.equal(await page.locator('#service-v1-agent-panel').evaluate(el=>getComputedStyle(el).backgroundColor),
   'rgb(255, 255, 255)','full agent panel uses same V1 paper');
  A.ok(await contained('#service-v1-agent-panel'),'full V1 agent panel overflow');
  console.log('AGENT_SHARED_CSS_GREEN');
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
