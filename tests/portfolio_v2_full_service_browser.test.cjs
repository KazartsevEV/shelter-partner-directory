const A=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
 page.setDefaultTimeout(8000);
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try{
  await page.goto(pathToFileURL(path.resolve(__dirname,'../Marketing_calc.HTML')).href,{waitUntil:'domcontentloaded'});
  A.equal(await page.evaluate(()=>typeof Nomad360FullServiceV2.build),'function');
  await page.locator('#start-service').click();
  A.equal(await page.locator('#service-work-screen').isVisible(),true);
  A.equal(await page.locator('#service-mode-simple').getAttribute('aria-pressed'),'true');
  // Simple mode must remain the original V1 route.
  await page.locator('#service-work-online').click();
  await page.locator('#service-screen button[onclick="selectServiceMode(\'self\')"]').click();
  A.equal(await page.locator('#full-service-online-entry').isVisible(),false,
    'Simple V1 must not display full-service single-item action');
  A.equal(await page.locator('#online-v2-entry').isVisible(),true);
  A.equal(await page.locator('#online-v2-add').isVisible(),true);
  A.equal(await page.locator('#service-results-column').isVisible(),true);
  await page.evaluate(()=>showServiceWorkChooser());
  await page.locator('#service-mode-full').click();
  A.equal(await page.locator('#service-mode-full').getAttribute('aria-pressed'),'true');
  await page.locator('#service-work-online').click();
  A.equal(await page.evaluate(()=>serviceChannel),'online');
  await page.locator('#service-screen button[onclick="selectServiceMode(\'self\')"]').click();
  A.equal(await page.locator('#product-screen').isVisible(),true,
    'Full online self uses canonical product V1');
  A.equal(await page.locator('#full-service-screen').isVisible(),false,
    'No secondary financial screen');
  A.match(await page.locator('#product-intro-category').textContent(),/Онлайн-услуга/);
  A.equal(await page.locator('#offline-service-capacity').isVisible(),false,
    'Online service has no physical capacity requirement');
  await page.locator('#product-main-back').click();
  A.equal(await page.locator('#service-screen').isVisible(),true);
  await page.locator('#service-screen button[onclick="selectServiceMode(\'hired\')"]').click();
  A.equal(await page.evaluate(()=>productionLaborMode),'workers');
  A.equal(await page.locator('#product-screen').isVisible(),true);
  await page.locator('#product-main-back').click();
  await page.locator('#service-screen button[onclick="showAgentChooser()"]').click();
  A.equal(await page.locator('#agent-screen').isVisible(),true);
  await page.locator('#agent-screen button[onclick="selectServiceMode(\'agent\')"]').click();
  A.equal(await page.locator('#product-screen').isVisible(),true);
  A.equal(await page.locator('#service-v1-agent-panel').isVisible(),false,
    'Agent finance fields appear once a service name is entered');
  await page.locator('#product-name-input').fill('Агентская онлайн-услуга');
  await page.locator('#product-intro-submit-label').click();
  A.equal(await page.locator('#service-v1-agent-panel').isVisible(),true);
  A.equal(await page.evaluate(()=>selectedServiceRole),'agent');
  await page.locator('#service-agent-partner-price').fill('100');
  await page.locator('#service-agent-fee-pct').fill('20');
  await page.locator('#service-agent-partner-vat').fill('10');
  await page.locator('#service-agent-partner-tax-pct').fill('5');
  await page.locator('#own-product-ad-budget').fill('900');
  await page.locator('#service-agent-line-payers select[data-agent-line-key="advertising"]').selectOption('partner');
  await page.locator('#own-product-ad-cpc').fill('4.5');
  await page.locator('#own-product-ad-ctr').fill('2');
  await page.locator('#own-product-ad-click-lead').fill('20');
  await page.locator('#own-product-ad-lead-sale').fill('50');
  const agencyFlow=await page.evaluate(()=>{
    selectProductYesNo('salesVat','yes');
    document.getElementById('own-sales-vat-pct').value='12';
    setProductBusinessTaxType('turnover');
    document.getElementById('own-business-tax-pct').value='6';
    saveCurrentProductToPortfolio();
    const item=productPortfolio[0];
    Object.assign(item.planning,{fundingMode:'cash',targetMarginPct:30,
      reservePct:10,maxDiscountPct:0,minimumMarginPct:10});
    const model=calculateProductPortfolio(),cash=calculateProductCashFlow(model);
    return {pricing:model.pricingReady,ready:cash.ready,reason:cash.reason,
      source:item.source,channel:item.serviceChannel,role:item.serviceRole,
      price:model.items[0]?.price,month:cash.months[0],
      ownAd:item.serviceAgency?.lineItems?.find(x=>x.key==='advertising')?.payer};
  });
  A.equal(agencyFlow.pricing,true,'Contractual agency commission is the V1 unit price');
  A.equal(agencyFlow.ready,true,JSON.stringify(agencyFlow));
  A.equal(agencyFlow.channel,'online');
  A.equal(agencyFlow.role,'agent');
  A.equal(agencyFlow.ownAd,'partner');
  A.ok(Math.abs(agencyFlow.price-20/1.12)<.01,
    'Owner fee excludes owner VAT, not the partner gross sale');
  A.ok(Math.abs(agencyFlow.month.partnerRevenue-20*100/1.1)<.02,
    'Partner turnover and partner VAT are accounted separately');
  A.ok(Math.abs(agencyFlow.month.taxPaid-(agencyFlow.month.inflow-agencyFlow.month.financedInflow)*0.06)<.02,
    'Agent turnover tax applies only to the agency fee');
  A.ok(agencyFlow.month.partnerCosts>=900,
    'Partner-paid advertising cannot silently become an agency expense');
  A.ok(agencyFlow.month.partnerTax>0);
  A.ok(agencyFlow.month.outflow<agencyFlow.month.partnerCosts,
    'Partner advertising does not debit the agent cash balance');
  // Exact expense-line allocation: rent, payroll gross, employer tax,
  // each rental/purchase row, materials and variable sales commission.
  await page.locator('[data-material-cost-mode="known"]').click();
  await page.locator('#own-materials-cost').fill('8');
  await page.locator('[data-yn-group="productionPremises"][data-yn-value="yes"]').click();
  await page.locator('#own-production-premises-monthly').fill('200');
  await page.locator('[data-yn-group="equipmentRental"][data-yn-value="yes"]').click();
  await page.locator('.equipment-rental-cost').first().fill('30');
  await page.locator('[data-yn-group="equipmentPurchase"][data-yn-value="yes"]').click();
  await page.locator('.equipment-purchase-cost').first().fill('600');
  await page.locator('.equipment-useful-life').first().fill('12');
  await page.locator('[data-production-labor-mode="workers"]').click();
  await page.locator('#own-production-workers-count').fill('2');
  await page.locator('#own-production-worker-gross').fill('100');
  await page.locator('[data-yn-group="salesCommission"][data-yn-value="yes"]').click();
  await page.locator('#own-sales-commission-pct').fill('5');
  const requiredKeys=['material.known','premises','rental.0','purchase.0',
    'worker.gross','worker.charges','advertising','sales.commission'];
  for(const key of requiredKeys){
    const control=page.locator('#service-agent-line-payers select[data-agent-line-key="'+key+'"]');
    A.equal(await control.count(),1,'Payer exists for individual expense: '+key);
    await control.selectOption(['premises','worker.gross','purchase.0','advertising'].includes(key)?
      'partner':'agent');
  }
  const split=await page.evaluate(()=>{
    const rows=serviceAgencyExpenseLines();
    const item=currentProductPortfolioSnapshot();
    const receipts=20*20/1.12;
    const ledger=serviceAgencyExpenseSplit(item,receipts);
    saveCurrentProductToPortfolio();
    const s=productPortfolio[0];
    Object.assign(s.planning,{fundingMode:'cash',targetMarginPct:30,
      reservePct:10,maxDiscountPct:0,minimumMarginPct:10});
    const model=calculateProductPortfolio(),cash=calculateProductCashFlow(model);
    return {rows,ledger,agency:s.serviceAgency,issues:aggregateQuantityIssues(s),
      ready:model.pricingReady&&cash.ready,month:cash.months?.[0]};
  });
  A.equal(split.issues.length,0,JSON.stringify(split.issues));
  A.equal(split.ready,true,JSON.stringify(split));
  A.equal(split.agency.lineItems.find(x=>x.key==='worker.gross').payer,'partner');
  A.equal(split.agency.lineItems.find(x=>x.key==='worker.charges').payer,'agent');
  A.equal(split.agency.lineItems.find(x=>x.key==='purchase.0').payer,'partner');
  A.ok(split.ledger.partner.production>=200,'Partner pays both rent and gross payroll');
  A.ok(split.ledger.agent.production>0,'Employer statutory payroll charge stays with agent');
  A.equal(split.ledger.agent.capex,0,'Partner equipment does not spend agent cash');
  A.ok(split.ledger.partner.capex>=600,'Partner equipment is attributed once');
  A.ok(split.month.partnerCosts>split.month.outflow,'Principal gross spend is separate');
  await page.evaluate(()=>setProductAssortmentChoice('complete'));
  // User confirms the V1 pricing step before the common tax/CF report opens.
  // User confirms self-financing to expose the standard goods-V1
  // target-price controls before selecting the tax stage.
  await page.locator('[data-business-product-id="1"] [data-funding-choice="cash"]').click();
  await page.locator('[data-business-product-id="1"] [data-pricing-decision="tax"]').click();
  await page.evaluate(()=>updateProductPortfolioBusinessSummary());
  A.equal(await page.locator('#product-portfolio-business-summary').isVisible(),true,
    'Confirmed V1 tax stage exposes the canonical cash-flow report');
  A.match(await page.locator('#product-portfolio-business-summary').innerText(),
    /Экономика партнёра по месяцам/);
  const agentReportPdf=await page.pdf({format:'A4',printBackground:true});
  A.equal(agentReportPdf.subarray(0,4).toString('ascii'),'%PDF');
  console.log('NOMAD360_NATIVE_V1_AGENT_PDF',JSON.stringify({bytes:agentReportPdf.length,
    visibleReport:await page.locator('#product-portfolio-business-summary').isVisible(),
    textLength:(await page.locator('#product-portfolio-business-summary').innerText()).length}));
  A.ok(agentReportPdf.length>1400,'Native V1 agent PDF includes rendered content');
  const saveAgent=await page.evaluate(()=>saveProductCalculationToBrowser());
  A.equal(saveAgent,true,'Native V1 agent with expense payers saves');
  const originalRows=await page.evaluate(()=>readSavedProductCalculation().productPortfolio[0].serviceAgency.lineItems);
  await page.reload({waitUntil:'domcontentloaded'});
  A.equal(await page.evaluate(()=>resumeSavedProductCalculation()),true);
  const restored=await page.evaluate(()=>({
    channel:serviceChannel,role:selectedServiceRole,
    choices:[...document.querySelectorAll('#service-agent-line-payers [data-agent-line-key]')]
      .map(x=>[x.dataset.agentLineKey,x.value]),
    rows:currentProductPortfolioSnapshot().serviceAgency.lineItems
  }));
  A.equal(restored.channel,'online');
  A.equal(restored.role,'agent');
  A.deepEqual(restored.rows.map(x=>[x.key,x.payer]),originalRows.map(x=>[x.key,x.payer]),
    'Restored per-expense payer choices match saved V1');
  A.equal(restored.choices.find(x=>x[0]==='worker.gross')?.[1],'partner');
  A.equal(restored.choices.find(x=>x[0]==='worker.charges')?.[1],'agent');
  await page.setViewportSize({width:360,height:780});
  const mobileNative=await page.evaluate(()=>({
    viewport:innerWidth,page:document.documentElement.scrollWidth,
    agentPanel:document.getElementById('service-v1-agent-panel').getBoundingClientRect().width
  }));
  A.ok(mobileNative.page<=mobileNative.viewport+1,
    'The native 360px V1 agent expense form does not overflow: '+JSON.stringify(mobileNative));
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>showServiceWorkChooser());
  // New V1 architecture: online/offline x role, then the SAME product V1.
  // Full offline must never ask for a secondary standalone finance screen.
  await page.locator('#service-work-offline').click();
  A.equal(await page.locator('#service-screen').isVisible(),true,
    'Full offline asks for self/hired/agent before the V1 economics');
  A.equal(await page.evaluate(()=>serviceChannel),'offline');
  A.match(await page.locator('#service-screen h1').textContent(),/офлайн-услугу/);
  await page.locator('#service-screen button[onclick="selectServiceMode(\'hired\')"]').click();
  A.equal(await page.locator('#product-screen').isVisible(),true,
    'Full offline hired should open the native product V1');
  A.equal(await page.evaluate(()=>productionLaborMode),'workers');
  A.equal(await page.evaluate(()=>productSource),'offline-service');
  A.equal(await page.locator('#full-service-screen').isVisible(),false);
  A.equal(await page.locator('#full-service-offline-entry').isVisible(),false);
  A.equal(await page.locator('#product-screen').evaluate(e=>e.classList.contains('nd-full-single-offline')),false,
    'Do not hide the product V1 financial report and V2 handoff');
  await page.locator('#product-main-back').click();
  A.equal(await page.locator('#service-screen').isVisible(),true,
    'Back returns to chosen role, not a reset microbusiness screen');
  await page.locator('#service-screen button[onclick="selectServiceMode(\'self\')"]').click();
  A.equal(await page.evaluate(()=>productionLaborMode),'self');
  A.equal(await page.locator('#product-screen').isVisible(),true);
  await page.locator('#product-name-input').fill('Массаж');
  await page.locator('#product-intro-submit-label').click();
  A.equal(await page.locator('#product-own-form').isVisible(),true,
    'Service cost form is the actual product V1 form');
  await page.locator('[data-material-cost-mode="known"]').click();
  await page.locator('#own-materials-cost').fill('8');
  await page.locator('#offline-service-monthly-capacity').fill('250');
  await page.locator('#own-product-ad-budget').fill('900');
  await page.locator('#own-product-ad-cpc').fill('4.5');
  await page.locator('#own-product-ad-ctr').fill('2');
  await page.locator('#own-product-ad-click-lead').fill('20');
  await page.locator('#own-product-ad-lead-sale').fill('50');
  const snapshot=await page.evaluate(()=>currentProductPortfolioSnapshot());
  A.equal(snapshot.source,'offline-service');
  A.equal(snapshot.forecastUnitsPerMonth,20);
  A.equal(snapshot.offlineServiceCapacity,250);
  A.equal(snapshot.materialsUnitCost,8);
  await page.locator('#assortment-complete-button').click();
  A.equal(await page.locator('#product-tax-block').isVisible(),true,
    'Native V1 business tax stage follows completed single service');
  A.equal(await page.locator('#full-service-offline-entry').isVisible(),false);
  A.equal(await page.locator('#full-service-screen').isVisible(),false);
  A.equal(await page.locator('#product-v1-aggregate-report').count(),1);
  A.equal(await page.locator('#product-v1-export-buttons').count(),1);
  A.equal(await page.locator('#product-v2-portfolio-gateway').count(),1);
  const native=await page.evaluate(()=>{
    const item=productPortfolio[0];
    Object.assign(item.planning,{fundingMode:'cash',targetMarginPct:30,
      reservePct:10,maxDiscountPct:0,minimumMarginPct:10});
    setProductBusinessTaxType('turnover');
    selectProductYesNo('salesVat','no');
    document.getElementById('own-business-tax-pct').value='10';
    const model=calculateProductPortfolio(),cash=calculateProductCashFlow(model);
    return {ready:model.pricingReady,cash:cash.ready,months:cash.months,
      capital:aggregatePlanMetrics(item).requiredCapital,
      price:model.items[0]?.price,reason:cash.reason};
  });
  A.equal(native.ready,true,'V1 canonical service tariff ready');
  A.equal(native.cash,true,JSON.stringify(native));
  A.equal(native.months.length,12,'Service forecast horizon is controlled by V1 field');
  A.ok(Math.abs(native.capital-1166)<.03,'Own capital covers first service month plus reserve');
  A.ok(native.months.every(m=>m.principalRepaid===0&&m.interestPaid===0));
  A.ok(native.months.every(m=>m.taxPaid>=0));
  A.ok(native.months[1].cashFlow>0,'Service generates receipts in subsequent months');
  await page.evaluate(()=>updateProductPortfolioBusinessSummary());
  A.equal((await page.locator('#product-portfolio-business-summary').textContent()).includes('Проценты по кредиту'),false,
    'Own funds do not expose loan columns in V1 report');
  const finance=await page.evaluate(()=>{
    const item=productPortfolio[0];
    item.planning.fundingMode='credit';
    item.planning.creditRatePct=12;
    item.planning.creditTermMonths=3;
    const model=calculateProductPortfolio(),cash=calculateProductCashFlow(model);
    return {ready:cash.ready,months:cash.months,
      price:model.items[0]?.price,capital:calculateAggregateCredit(item).principal};
  });
  A.equal(finance.ready,true);
  A.ok(finance.price>native.price,
    'Loan interest raises the full-service V1 target unit price');
  A.ok(finance.months[0].interestPaid>0,'Loan interest included as recurring cash expense');
  A.ok(finance.months[2].principalRepaid>0,'Bullet principal repaid in contract month');
  A.ok(Math.abs(finance.months[2].principalRepaid-finance.capital)<.02);
  A.ok(finance.months.slice(3).every(m=>m.interestPaid===0));
  await page.evaluate(()=>{
    const item=productPortfolio[0];item.planning.fundingMode='cash';
    saveProductCalculationToBrowser();
  });
  const savedV1=await page.evaluate(()=>readSavedProductCalculation());
  A.equal(savedV1.productPortfolio[0].serviceFinanceMode,'full');
  A.equal(savedV1.productPortfolio[0].serviceChannel,'offline');
  A.equal(savedV1.productPortfolio[0].serviceHorizonMonths,12);
  A.equal(savedV1.productPortfolio[0].serviceRole,'self');
  const v2Native=await page.evaluate(()=>{
    const okay=openLinkedPortfolioFromProducts();
    const state=LinkedPortfolioV2UI.getState();
    return {okay,error:document.getElementById('linked-v2-entry-error')?.textContent,source:state?.skus?.[0]?.source,full:state?.skus?.[0]?.fullServiceV2,
      months:state?.forecastMonths,priceFixed:state?.skus?.[0]?.fixedPriceFromV1};
  });
  A.equal(v2Native.okay,true,JSON.stringify(v2Native));
  A.equal(v2Native.source,'offline-service');
  A.equal(v2Native.full,true);
  A.equal(v2Native.priceFixed,true);
  // Isolate the compatibility assertions below from this new V1→V2 import.
  // Its persistent browser draft is deliberately retained and tested above.
  await page.evaluate(()=>localStorage.removeItem('marketingCalcLinkedPortfolioV2'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>showServiceWorkChooser());
  // Legacy full-service engine remains tested below for compatibility only,
  // never as the full offline customer route.
  // Production screenshot regression: a forecast array is formatted for humans,
  // never pasted into the heading as a long comma-separated float dump.
  await page.evaluate(()=>Nomad360FullServiceUI.open({
    monthlyForecast:[2.386363636363636,4.772727272727272,4.772727272727272],
    capacity:30,priceGross:63.30,vatPct:0,taxType:'turnover',taxPct:6,
    months:3,unitCashCost:8,fixedCashMonthly:150,commissionPct:0,
    reservePct:0,funding:'own',annualRatePct:0,creditMonths:0
  },{kind:'online',name:'Психолог'}));
  const forecastLabel=await page.locator('.nd-full-service-overview strong').nth(1).textContent();
  A.match(forecastLabel,/2,39/);
  A.match(forecastLabel,/4,77/);
  A.doesNotMatch(forecastLabel,/2,3863636|4,7727272/);
  A.ok(forecastLabel.length<75,'Forecast must be brief even with per-month demand series');
  A.equal(await page.locator('#full-service-credit-fields').isVisible(),false,
    'Own money hides the entire loan section, even for restored loan values');
  A.equal(await page.locator('.nd-full-service-metrics .nd-full-service-metric').count(),3,
    'Primary result has only the three core financial indicators');
  A.equal(await page.locator('.nd-full-service-details').isVisible(),true);
  A.equal(await page.locator('#full-service-settings-title').textContent(),'1. Условия расчёта');
  A.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,
    'A mobile viewport must not expand from forecast text or the wide monthly table');
  await page.locator('#full-service-funding').selectOption('credit');
  A.equal(await page.locator('#full-service-credit-fields').isVisible(),true);
  A.equal(await page.locator('#full-service-term').inputValue(),'1',
    'Only selecting credit normalizes an unset loan term');
  await page.locator('#full-service-term').fill('3');
  await page.locator('#full-service-rate').fill('12');
  A.equal(await page.evaluate(()=>Nomad360FullServiceUI.getInput().funding),'credit');
  await page.locator('#full-service-funding').selectOption('own');
  A.equal(await page.locator('#full-service-credit-fields').isVisible(),false);
  A.equal(await page.locator('.nd-full-service-details').textContent().then(v=>v.includes('Непогашенный кредит')),false,
    'No debt metric is displayed for own-funds financing');
  const ownHeaders=await page.locator('#full-service-report .nd-full-service-table th').allTextContents();
  A.equal(ownHeaders.some(x=>/Проценты|Тело кредита/.test(x)),false,
    'Own funds report has neither interest nor loan principal columns');
  A.ok(ownHeaders.some(x=>x.includes('Свои вложения')));
  await page.evaluate(()=>window.print=()=>{});
  await page.locator('#full-service-pdf').click();
  const ownPdf=await page.locator('#nomad360-print-sheet').textContent();
  A.equal(/Проценты|Тело кредита|Непогашенный кредит/.test(ownPdf),false,
    'Own funds PDF excludes all loan-only information');
  // Real API through the same V2 module used by the user-facing full-finance screen.
  const seed={monthlyForecast:200,capacity:250,priceGross:100,vatPct:12,
    taxType:'profit',taxPct:10,months:3,unitCashCost:8,
    fixedCashMonthly:10000,equipmentPurchase:0,equipmentAmortMonthly:0,
    commissionPct:0,reservePct:10,funding:'own',annualRatePct:24,creditMonths:3};
  await page.evaluate(data=>Nomad360FullServiceUI.open(data,{kind:'offline',name:'Массаж'}),seed);
  A.equal(await page.locator('#full-service-screen').isVisible(),true);
  A.equal(await page.locator('.nd-full-service-month-card').count(),3,
    'One readable cash reconciliation per month');
  const month1=await page.locator('.nd-full-service-month-card').first().innerText();
  A.match(month1,/Выручка без НДС/);
  A.ok(month1.includes('17')&&month1.includes('857,14'));
  A.match(month1,/Вложено своих денег/);
  A.match(month1,/Осталось на конец месяца/);
  A.doesNotMatch(month1,/Кредит|Проценты|Тело кредита/);
  A.equal(await page.locator('.nd-full-service-technical').getAttribute('open'),null,
    'Technical ledger is collapsed by default');
  A.equal(await page.locator('#full-service-report table tbody tr').count(),3);
  let r=await page.evaluate(()=>Nomad360FullServiceUI.getResult());
  A.ok(Math.abs(r.capital-11160)<.01);
  A.ok(Math.abs(r.months[0].revenue-17857.142857)<.01);
  A.equal(r.firstPositiveMonth,1);
  A.equal(r.paybackMonth,2);
  A.equal(await page.locator('#full-service-credit-fields').isVisible(),false,
    'Own-funds scenario has no loan fields');
  const originalTax=r.tax;
  await page.locator('#full-service-tax-pct').fill('20');
  A.ok((await page.evaluate(()=>Nomad360FullServiceUI.getResult().tax))>originalTax,
    'Tax-rate input must affect the real financial engine');
  await page.locator('#full-service-tax-pct').fill('10');
  A.ok(Math.abs((await page.evaluate(()=>Nomad360FullServiceUI.getResult().tax))-originalTax)<.01);
  await page.locator('#full-service-vat').fill('0');
  const larger=await page.evaluate(()=>Nomad360FullServiceUI.getResult().revenue);
  A.ok(larger>r.revenue);
  await page.locator('#full-service-tax').selectOption('turnover');
  r=await page.evaluate(()=>Nomad360FullServiceUI.getResult());
  A.ok(Math.abs(r.months[0].tax-r.months[0].revenue*.1)<.01);
  await page.locator('#full-service-funding').selectOption('credit');
  A.equal(await page.locator('#full-service-credit-fields').isVisible(),true);
  await page.locator('#full-service-term').fill('5');
  A.ok((await page.locator('#full-service-report .nd-full-service-table').textContent()).includes('Тело кредита'),
    'Loan principal column returns when credit is selected');
  r=await page.evaluate(()=>Nomad360FullServiceUI.getResult());
  A.ok(r.outstandingPrincipal>0);
  A.equal(r.creditRepaid,0);
  await page.locator('#full-service-horizon').fill('6');
  r=await page.evaluate(()=>Nomad360FullServiceUI.getResult());
  A.equal(r.outstandingPrincipal,0);
  A.ok(r.creditRepaid>0);
  const creditCard=await page.locator('.nd-full-service-month-card').first().innerText();
  A.match(creditCard,/Получен кредит/);
  A.doesNotMatch(creditCard,/Вложено своих денег/);
  A.ok(Math.abs(r.months[0].netCashFlow-
    (r.months[0].revenue-r.months[0].variable-r.months[0].fixed-r.months[0].tax-
     r.months[0].interest-r.months[0].assetCash-r.months[0].principalDue+r.months[0].financeIn))<.01,
     'Month card reconciliation must agree with financing ledger');
  A.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,
    'Mobile financial results must not overflow the viewport');
  await page.locator('#full-service-save').click();
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('nomad360-full-service-v2')));
  A.equal(draft.schema,2);
  A.equal(draft.input.months,6);
  A.equal(draft.input.creditMonths,5);
  A.equal(Object.hasOwn(draft,'result'),false,'No duplicated derived 180-day cash ledger in storage');
  await page.evaluate(()=>showServiceWorkChooser());
  A.equal(await page.locator('#service-full-saved-entry').isVisible(),false,
    'Rejected standalone model is not exposed as a full V1 resume route');
  A.equal(await page.evaluate(()=>Nomad360FullServiceUI.openSaved()),true,
    'Old stored data remain readable for explicit future migration');
  A.equal(await page.locator('#full-service-screen').isVisible(),true);
  A.equal(await page.evaluate(()=>Nomad360FullServiceUI.getInput().months),6);
  await page.locator('#full-service-back').click();
  A.equal(await page.locator('#service-work-screen').isVisible(),true);
  await page.evaluate(()=>Nomad360FullServiceUI.openSaved());
  await page.evaluate(()=>window.print=()=>{window.__printInvoked=true});
  await page.locator('#full-service-pdf').click();
  A.equal(await page.evaluate(()=>window.__printInvoked),true);
  A.equal(await page.locator('#nomad360-print-sheet table').count(),2);
  // Audit the full-service PRINT payload, not merely the print() click.
  const screenLines=await page.locator('#full-service-report .nd-full-service-table tbody tr').allTextContents();
  const printLines=await page.locator('#nomad360-print-sheet .nomad-export-table:last-of-type tbody tr').allTextContents();
  A.deepEqual(printLines.map(x=>x.replace(/\s+/g,' ').trim()),
    screenLines.map(x=>x.replace(/\s+/g,' ').trim()),
    'Printed month-by-month numbers must match the on-screen financial report');
  A.equal(printLines.length,6,'Full-service export retains all selected months');
  const pdf=await page.pdf({format:'A4',printBackground:true});
  A.equal(pdf.subarray(0,4).toString('ascii'),'%PDF','A real PDF is produced by Chromium');
  A.ok(pdf.byteLength>3500,'Full-service PDF must have meaningful contents');
  console.log('TZ02_FULL_SERVICE_PDF_GREEN',JSON.stringify({bytes:pdf.byteLength,
    reportRows:screenLines.length,printRows:printLines.length}));
  // Switching RU -> EN -> KK -> RU may relabel the document, never recalculate
  // cash flows differently or discard the prepared complete service scenario.
  const beforeLocale=await page.evaluate(()=>({
    ...Nomad360FullServiceUI.getResult(),
    input:Nomad360FullServiceUI.getInput()
  }));
  await page.evaluate(()=>Nomad360UI.setLanguage('en'));
  A.equal(await page.locator('#full-service-save').textContent(),'Save calculation');
  A.equal(await page.locator('#full-service-add-portfolio').textContent(),'Add to V2 portfolio');
  await page.evaluate(()=>Nomad360UI.setLanguage('kk'));
  A.equal(await page.locator('#full-service-save').textContent(),'Есепті сақтау');
  await page.evaluate(()=>Nomad360UI.setLanguage('ru'));
  A.equal(await page.locator('#full-service-save').textContent(),'Сохранить расчёт');
  const afterLocale=await page.evaluate(()=>({
    ...Nomad360FullServiceUI.getResult(),
    input:Nomad360FullServiceUI.getInput()
  }));
  A.deepEqual(afterLocale,beforeLocale,'Language cycle preserves model and input exactly');
  // Real user route: full finance result -> saved linked portfolio -> identical
  // V2 enterprise tax and confirmed recurring horizon.
  await page.locator('#full-service-add-portfolio').click();
  A.equal(await page.locator('#portfolio-v2-screen').isVisible(),true);
  const linked=await page.evaluate(()=>{
    const state=LinkedPortfolioV2UI.getState();
    const model=LinkedPortfolioV2Engine.build(state);
    return {state,ready:model.ready,errors:model.errors,
      months:model.cashflow?.periodPnl?.months.length,kind:model.items?.[0]?.source};
  });
  A.equal(linked.state.skus.length,1);
  A.equal(linked.state.skus[0].fullServiceV2,true);
  A.equal(linked.state.tax.type,'turnover');
  A.equal(linked.state.forecastMonths,6);
  A.equal(linked.ready,true,JSON.stringify(linked.errors));
  A.equal(linked.months,6);
  A.equal(linked.kind,'offline-service');
  // Multi-source UI: one payment can replace offline cost of service AND
  // an online service's selling fixed cost, with separate source-pool selectors.
  await page.evaluate(()=>{
    const current=Nomad360FullServiceUI.getInput();
    const extra=Nomad360FullServiceV2.toPortfolioSku(
      {...current,equipmentPurchase:0,equipmentAmortMonthly:0},
      {id:'extra-online',name:'Онлайн консультация',kind:'online'});
    LinkedPortfolioV2UI.appendFullService(extra);
  });
  await page.locator('[data-linked-add]').click();
  await page.locator('[data-linked-path="resources.0.amount"]').fill('1000');
  const members=await page.evaluate(()=>LinkedPortfolioV2UI.getState().skus.map(s=>s.id));
  const offlineId=members.find(id=>id!=='extra-online');
  A.ok(offlineId);
  await page.locator('[data-linked-path="resources.0.poolBySku.'+offlineId+'"]').selectOption('unitCost');
  await page.locator('[data-linked-path="resources.0.cashOriginBySku.'+offlineId+'"]').selectOption('production');
  await page.locator('[data-linked-path="resources.0.poolBySku.extra-online"]').selectOption('salesFixed');
  await page.locator('[data-linked-path="resources.0.includedBySku.'+offlineId+'"]').fill('1000');
  await page.locator('[data-linked-path="resources.0.includedBySku.extra-online"]').fill('1000');
  const mixed=await page.evaluate(()=>{
    const x=LinkedPortfolioV2UI.getState(),r=LinkedPortfolioV2Engine.build(x);
    return {ready:r.ready,errors:r.errors,
      shared:r.cashflow?.months[0]?.shared,
      pools:x.resources[0].poolBySku,sourceCount:x.skus.length};
  });
  A.equal(mixed.sourceCount,2);
  A.equal(mixed.pools[offlineId],'unitCost');
  A.equal(mixed.pools['extra-online'],'salesFixed');
  A.equal(mixed.ready,true,JSON.stringify(mixed.errors));
  const overflows=await page.evaluate(()=>({
    viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    elements:[...document.querySelectorAll('#portfolio-v2-screen *')].filter(e=>{
      const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
      return r.right>innerWidth+2&&r.width>0&&cs.position!=='fixed'&&cs.display!=='none';
    }).slice(0,15).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,75),
      id:e.id,right:Math.round(e.getBoundingClientRect().right),
      width:Math.round(e.getBoundingClientRect().width)}))
  }));
  console.log('TZ02_MOBILE_OVERFLOW_DIAG',JSON.stringify(overflows));
  const trail=await page.evaluate(()=>{
    const candidates=[...document.querySelectorAll('#portfolio-v2-screen table')];
    let e=candidates.find(e=>e.getBoundingClientRect().width>innerWidth);
    const nodes=[];
    for(let i=0;i<10&&e;i++,e=e.parentElement){
      const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
      nodes.push({tag:e.tagName,id:e.id,cls:String(e.className).slice(0,90),
        left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),
        client:e.clientWidth,scroll:e.scrollWidth,overflowX:cs.overflowX});
    }
    return nodes;
  });
  console.log('TZ02_MOBILE_ANCESTRY',JSON.stringify(trail));
  A.equal(overflows.scrollWidth>overflows.viewport+1,false);
  A.deepEqual(errors,[]);
  console.log('TZ02_FULL_SERVICE_BROWSER_GREEN',{capital:seed.fixedCashMonthly+1160,rows:r.months.length});
 }finally{await browser.close()}
})().catch(err=>{console.error('TZ02_FULL_SERVICE_BROWSER_RED',err.stack||err);process.exitCode=1});
