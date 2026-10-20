const A=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
 // This legacy fixture tests RU copy explicitly; default first-visit UI is English.
 await page.addInitScript(()=>{try{localStorage.setItem('nomad360PreferredLanguage','ru')}catch(_){}});
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
  A.equal(await page.locator('#product-production-quantity-panel').isVisible(),false,
    'Service production quantity must not be a customer-input field');
  A.equal(await page.locator('#product-sales-quantity-panel').isVisible(),false,
    'Service sold quantity must not be a customer-input field');
  A.equal(await page.locator('#own-sales-fixed-per-unit').textContent(),'—',
    'Before advertising, service unit sales costs cannot be fabricated');
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
  A.doesNotMatch(await page.locator('#service-v1-agent-panel').innerText(),/Партн[её]р/i);
  A.equal(await page.evaluate(()=>selectedServiceRole),'agent');
  A.equal(await page.locator('#product-production-quantity-panel').isVisible(),false);
  A.equal(await page.locator('#product-sales-quantity-panel').isVisible(),false);
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
    /Экономика принципала по месяцам/);
  await page.evaluate(()=>{window.print=()=>{window.__nativeV1Printed=true}});
  const nativeExport=await page.evaluate(()=>exportProductCalculationPdf());
  A.equal(nativeExport,true,'Real V1 print export is prepared');
  A.equal(await page.evaluate(()=>window.__nativeV1Printed),true);
  A.equal(await page.locator('#nomad360-print-sheet').getAttribute('data-mode'),'v1-product');
  const sheetText=await page.locator('#nomad360-print-sheet').textContent();
  A.match(sheetText,/Экономика принципала/);
  A.match(sheetText,/Денежный поток по месяцам/);
  const screenCount=await page.evaluate(()=>calculateProductCashFlow(calculateProductPortfolio()).months.length);
  A.equal(await page.locator('#nomad360-print-sheet table').count(),4,
    'V1 print includes quote, PnL, month cash-flow and partner PnL');
  A.equal(await page.locator('#nomad360-print-sheet table').nth(2).locator('tbody tr').count(),
    screenCount,'Printed V1 month count matches real cash ledger');
  const agentReportPdf=await page.pdf({format:'A4',printBackground:true});
  A.equal(agentReportPdf.subarray(0,4).toString('ascii'),'%PDF');
  console.log('NOMAD360_NATIVE_V1_AGENT_PDF',JSON.stringify({bytes:agentReportPdf.length,
    rows:screenCount,printTables:await page.locator('#nomad360-print-sheet table').count()}));
  A.ok(agentReportPdf.length>4000,'Native V1 agent PDF has complete rendered report');
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
  const agentV2=await page.evaluate(()=>{
    const ok=openLinkedPortfolioFromProducts();
    const state=LinkedPortfolioV2UI.getState();
    const model=state?LinkedPortfolioV2Engine.build(state):null;
    return {ok,state,ready:model?.ready,errors:model?.errors,
      partner:model?.cashflow?.periodPnl?.bySku?.['v1-1']?.partner};
  });
  A.equal(agentV2.ok,true,'Restored native agent V1 exports to multi-SKU V2');
  A.equal(agentV2.ready,true,JSON.stringify(agentV2.errors));
  A.equal(agentV2.state.skus[0].fullServiceRole,'agent');
  A.ok(agentV2.partner?.months?.length===12,'Partner PnL survives all 12 months of V1→V2');
  A.ok(agentV2.partner.months[0].profit!==null);
  A.match(await page.locator('#portfolio-v2-root').innerText(),/Экономика принципала/);
  await page.evaluate(()=>window.print=()=>{window.__v2PrintRequested=true});
  A.equal(await page.evaluate(()=>Nomad360UI.savePrint('report')),true,
    'V2 PDF export works for an imported agent contract');
  A.equal(await page.evaluate(()=>window.__v2PrintRequested),true);
  A.equal(await page.locator('#nomad360-print-sheet').getAttribute('data-mode'),'report');
  const partnerPdfText=await page.locator('#nomad360-print-sheet').textContent();
  A.match(partnerPdfText,/Экономика принципала/);
  A.match(partnerPdfText,/Налог принципала/);
  const agentPortfolioPdf=await page.pdf({format:'A4',printBackground:true});
  A.equal(agentPortfolioPdf.subarray(0,4).toString('ascii'),'%PDF');
  A.ok(agentPortfolioPdf.length>4000,'V2 PDF contains a rendered partner financial report');
  // Payer attribution must stick to a named expense after deleting an
  // earlier row. Index-based rental.0/rental.1 reuse silently charged the
  // wrong business, including after V1 save/restore.
  await page.evaluate(()=>{
    addEquipmentRentalRow();
    const rows=document.querySelectorAll('.equipment-rental-row');
    rows[1].querySelector('.equipment-rental-name').value='Second rental';
    rows[1].querySelector('.equipment-rental-cost').value='17';
    updateEquipmentRentalTotal();
    refreshServiceAgencyLinePayers();
  });
  A.equal(await page.locator('#service-agent-line-payers [data-agent-line-key="rental.1"]').count(),1);
  // The customer is currently looking at the V2 PDF; the V1 form is hidden.
  // Mutate the hidden draft using the same DOM change handler, not Playwright's
  // visible-only selectOption action.
  await page.evaluate(()=>{
    const select=document.querySelector('#service-agent-line-payers [data-agent-line-key="rental.1"]');
    select.value='partner';
    select.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.evaluate(()=>{
    const first=document.querySelector('.equipment-rental-row');
    removeEquipmentRow(first.querySelector('button[onclick*="removeEquipmentRow"]'),'rental');
    refreshServiceAgencyLinePayers();
  });
  A.equal(await page.locator('#service-agent-line-payers [data-agent-line-key="rental.1"]').inputValue(),
    'partner','Deleting earlier rental must preserve the remaining partner payer');
  A.equal(await page.locator('#service-agent-line-payers [data-agent-line-key="rental.0"]').count(),0);
  await page.evaluate(()=>{
    addEquipmentRentalRow();
    const rows=document.querySelectorAll('.equipment-rental-row');
    rows[1].querySelector('.equipment-rental-name').value='New third rental';
    rows[1].querySelector('.equipment-rental-cost').value='9';
    updateEquipmentRentalTotal();
    refreshServiceAgencyLinePayers();
  });
  A.equal(await page.locator('#service-agent-line-payers [data-agent-line-key="rental.2"]').inputValue(),
    '','New expense requires a new payer decision, never inherits deleted rental.0');
  const stablePayers=await page.evaluate(()=>currentProductPortfolioSnapshot().serviceAgency.lineItems
    .filter(x=>x.key.startsWith('rental.')).map(x=>({key:x.key,payer:x.payer,amount:x.monthly})));
  A.deepEqual(stablePayers,[{key:'rental.1',payer:'partner',amount:17},
    {key:'rental.2',payer:'',amount:9}]);
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
  A.equal(await page.locator('#product-production-quantity-panel').isVisible(),false);
  A.equal(await page.locator('#product-sales-quantity-panel').isVisible(),false);
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
  // Only advertising can change the unit denominator. The old hidden
  // quantity fields must not override it, including after editing a draft.
  const exactUnit=await page.evaluate(()=>{
    const sales=document.getElementById('own-sales-monthly-qty');
    const made=document.getElementById('own-production-monthly-qty');
    sales.value='999';made.value='999';
    productOwnChoices.payroll='yes';
    document.getElementById('own-payroll-rewards').value='200';
    recalculateSalesCostSummary();recalculateProductionUnitCost();
    const actual=productNumberFromText('own-sales-fixed-per-unit');
    const prodQty=productNumberFromText('own-product-ad-units');
    const isHidden=document.getElementById('product-sales-quantity-panel').hidden;
    productOwnChoices.payroll='no';
    document.getElementById('own-payroll-rewards').value='0';
    syncOfflineServiceForecast();
    return {actual,prodQty,isHidden,
      restoredSales:sales.value,restoredMade:made.value};
  });
  A.equal(exactUnit.actual,10,'200 payroll ÷ 20 advertising clients = 10 per service');
  A.equal(exactUnit.prodQty,20);
  A.equal(exactUnit.isHidden,true);
  A.equal(exactUnit.restoredSales,'20');
  A.equal(exactUnit.restoredMade,'20');
  const capacityGate=await page.evaluate(()=>{
    const field=document.getElementById('offline-service-monthly-capacity');
    field.value='5';syncOfflineServiceForecast();
    const blocked=aggregateQuantityIssues(currentProductPortfolioSnapshot());
    field.value='250';syncOfflineServiceForecast();
    return blocked;
  });
  A.ok(capacityGate.some(s=>s.includes('превышает')),
    'Existing capacity gate rejects funnel demand above physical service throughput');
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
  // Full native V1 own-funds PDF: real month rows, no phantom loan section.
  await page.evaluate(()=>{window.print=()=>{window.__ownV1Print=true}});
  A.equal(await page.evaluate(()=>exportProductCalculationPdf()),true);
  A.equal(await page.evaluate(()=>window.__ownV1Print),true);
  A.equal(await page.locator('#nomad360-print-sheet').getAttribute('data-mode'),'v1-product');
  const nativeOwnPrint=await page.locator('#nomad360-print-sheet').innerText();
  A.match(nativeOwnPrint,/Массаж/);
  A.match(nativeOwnPrint,/Денежный поток по месяцам/);
  A.doesNotMatch(nativeOwnPrint,/Возврат тела кредита|Проценты|Непогашенный кредит/,
    'Cash-only native V1 print must not display any credit concepts');
  A.equal(await page.locator('#nomad360-print-sheet table').nth(2).locator('tbody tr').count(),12);
  const ownNativePdf=await page.pdf({format:'A4',printBackground:true});
  A.equal(ownNativePdf.subarray(0,4).toString('ascii'),'%PDF');
  A.ok(ownNativePdf.length>4000);
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
  A.equal(linked.state.forecastMonths,6,'V2 inherits the approved V1 service period');
  A.equal(linked.state.recurringDemandApproved,true);
  A.equal(await page.locator('[data-temporal-controls] [data-linked-path="forecastMonths"]').count(),0,
    'Full-service V1 horizon must not be requested again in V2');
  A.equal(await page.locator('[data-temporal-controls] [data-linked-path="recurringDemandApproved"]').count(),0,
    'V1 approved service forecast must not require second consent');
  A.match(await page.locator('[data-temporal-controls]').textContent(),/Период из полного расчёта V1/);
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
  // Acceptance suite for every native service path, including the actual
  // 320px customer viewport. Existing tests above cover computed monetary
  // examples and agent restore; this catches broken navigation/field branching.
  const acceptance=await browser.newPage({viewport:{width:320,height:740},locale:'ru-RU'});
  // This legacy fixture tests RU copy explicitly; default first-visit UI is English.
  await acceptance.addInitScript(()=>{try{localStorage.setItem('nomad360PreferredLanguage','ru')}catch(_){}});
  const acceptanceErrors=[];
  acceptance.on('pageerror',err=>acceptanceErrors.push(err.message));
  await acceptance.route(/^https?:\/\//,route=>route.abort());
  const appUrl=pathToFileURL(path.resolve(__dirname,'../Marketing_calc.HTML')).href;
  for(const channel of ['online','offline']){
    for(const role of ['self','hired','agent']){
      await acceptance.goto(appUrl,{waitUntil:'domcontentloaded'});
      await acceptance.locator('#start-service').click();
      await acceptance.locator('#service-mode-full').click();
      await acceptance.locator('#service-work-'+channel).click();
      if(role==='agent'){
        await acceptance.locator('#service-screen button[onclick="showAgentChooser()"]').click();
        await acceptance.locator('#agent-screen button[onclick="selectServiceMode(\'agent\')"]').click();
      }else await acceptance.locator('#service-screen button[onclick="selectServiceMode(\''+role+'\')"]').click();
      A.equal(await acceptance.locator('#product-screen').isVisible(),true,
        channel+'/'+role+' enters native V1');
      A.equal(await acceptance.locator('#full-service-screen').isVisible(),false,
        channel+'/'+role+' bypasses retired full-service UI');
      await acceptance.locator('#product-name-input').fill('Приёмка '+channel+' '+role);
      await acceptance.locator('#product-intro-submit-label').click();
      A.equal(await acceptance.locator('#product-own-form').isVisible(),true);
      A.equal(await acceptance.locator('#service-v1-horizon-panel').isVisible(),true);
      A.equal(await acceptance.locator('#service-v1-agent-panel').isVisible(),role==='agent');
      A.equal(await acceptance.locator('#offline-service-capacity').isVisible(),channel==='offline');
      A.equal(await acceptance.locator('#product-production-quantity-panel').isVisible(),false,
        channel+'/'+role+' cannot type expected service production');
      A.equal(await acceptance.locator('#product-sales-quantity-panel').isVisible(),false,
        channel+'/'+role+' cannot type expected service sales');
      const routeState=await acceptance.evaluate(()=>({
        source:productSource,channel:serviceChannel,role:selectedServiceRole,
        labor:productionLaborMode,
        route:{full:serviceFinancialMode==='full'},
        width:innerWidth,scroll:document.documentElement.scrollWidth
      }));
      A.equal(routeState.source,'offline-service');
      A.equal(routeState.channel,channel);
      A.equal(routeState.role,role);
      A.equal(routeState.labor,role==='hired'?'workers':'self');
      A.equal(routeState.route.full,true);
      A.ok(routeState.scroll<=routeState.width+1,
        channel+'/'+role+' viewport overflow: '+JSON.stringify(routeState));
      // Single-step tree navigation: completed service details go back to
      // the service-name step, then to the executor selection. Do not skip
      // the intermediate V1 step or discard the user's entered name.
      await acceptance.locator('#product-main-back').click();
      A.equal(await acceptance.locator('#product-screen').isVisible(),true,
        channel+'/'+role+' first back stays in the service name step');
      A.equal(await acceptance.locator('#product-own-form').isVisible(),false,
        channel+'/'+role+' first back hides service expense fields');
      A.equal(await acceptance.locator('#product-name-input').inputValue(),
        'Приёмка '+channel+' '+role,
        channel+'/'+role+' back preserves the entered service name');
      await acceptance.locator('#product-main-back').click();
      if(role==='agent'){
        A.equal(await acceptance.locator('#agent-screen').isVisible(),true,
          channel+'/'+role+' second back returns to agent commission choice');
        await acceptance.locator('#agent-screen > button.nd-agent-back').click();
      }
      A.equal(await acceptance.locator('#service-screen').isVisible(),true,
        channel+'/'+role+' back chain returns to executor selection');
    }
  }
  // Previously saved goods V1: do not treat old data without service metadata
  // as a full service, and never auto-load it on a fresh visit.
  await acceptance.goto(appUrl,{waitUntil:'domcontentloaded'});
  const legacyStored=await acceptance.evaluate(()=>{
    const prior={savedAt:'2026-10-09T12:00:00.000Z',activeProductId:7,
      productPortfolio:[{
        id:7,name:'Архивная майка',source:'resale',
        inputs:{'resale-buy-total':'100','own-product-ad-budget':'100'},
        uiState:{choices:{salesVat:'no'},productionLaborMode:'self'},
        planning:{fundingMode:'cash',targetMarginPct:25,reservePct:0}
      }],taxType:'turnover',businessTaxPct:6,salesVat:'no',salesVatPct:0};
    localStorage.setItem('marketingCalcProductResultV1',JSON.stringify(prior));
    return JSON.stringify(readSavedProductCalculation().productPortfolio.map(i=>[i.id,i.name,i.source]));
  });
  A.match(legacyStored,/Архивная майка/);
  await acceptance.reload({waitUntil:'domcontentloaded'});
  A.equal(await acceptance.locator('#product-screen').isVisible(),false,
    'Saved legacy goods V1 must not open without an explicit resume');
  A.equal(await acceptance.evaluate(()=>resumeSavedProductCalculation()),true);
  A.equal(await acceptance.locator('#product-screen').isVisible(),true);
  const legacyState=await acceptance.evaluate(()=>({
    name:productName,source:productSource,
    count:productPortfolio.length,vat:productOwnChoices.salesVat,
    tax:productBusinessTaxType
  }));
  A.deepEqual(legacyState,{name:'Архивная майка',source:'resale',
    count:1,vat:'no',tax:'turnover'});
  A.equal(await acceptance.locator('#product-sales-quantity-panel').isVisible(),true,
    'Original goods V1 retains its editable monthly sales field');
  // Own-made goods also keep an independent physical production quantity.
  await acceptance.evaluate(()=>{
    productSource='own';setResaleProductPanels();
    configureOfflineServiceView();
  });
  A.equal(await acceptance.locator('#product-production-quantity-panel').isVisible(),true,
    'Goods V1 keeps editable quantity of physically manufactured stock');
  // Goods V1 provides batch and monthly demand. V2 derives the sale horizon.
  const goodsHorizon=await acceptance.evaluate(()=>{
    localStorage.removeItem('marketingCalcLinkedPortfolioV2');
    LinkedPortfolioV2UI.importFromV1({tax:{type:'turnover',pct:3},skus:[{
      id:'batch-horizon',name:'Batch 60',source:'resale',
      unitCost:20,forecastUnitsPerMonth:20,adBudget:100,baseCac:5,
      priceMin:90,priceMax:200,maxDiscountPct:0,
      minimumMarginPct:10,targetMarginPct:25,
      salesFixedMonthly:0,adManagement:0,variableSalesPct:0,
      vatPct:0,inventoryQty:60,materialsBatchTotal:1200,productionTotal:0,
      supplyDays:15,productionDays:0,reserveAmount:0
    }]});
    const state=LinkedPortfolioV2UI.getState();
    const built=LinkedPortfolioV2Engine.build(state);
    return {months:state.forecastMonths,inherited:state.v1HorizonInherited,
      approved:state.recurringDemandApproved,
      controls:document.querySelectorAll('[data-temporal-controls] [data-linked-path="forecastMonths"]').length,
      temporal:built.temporal?.months?.length};
  });
  A.equal(goodsHorizon.months,4,'60 units at 20/month + 15-day lead require four calendar months');
  A.equal(goodsHorizon.inherited,true);
  A.equal(goodsHorizon.approved,true);
  A.equal(goodsHorizon.controls,0,'V1 batch horizon must not be requested again');
  A.equal(goodsHorizon.temporal,4,'V2 monthly sales use inherited V1 horizon');
  A.deepEqual(acceptanceErrors,[],'No runtime errors across six V1 routes + old goods restore');
  await acceptance.close();
  A.deepEqual(errors,[]);
  console.log('TZ02_FULL_SERVICE_BROWSER_GREEN',{capital:seed.fixedCashMonthly+1160,rows:r.months.length});
 }finally{await browser.close()}
})().catch(err=>{console.error('TZ02_FULL_SERVICE_BROWSER_RED',err.stack||err);process.exitCode=1});
