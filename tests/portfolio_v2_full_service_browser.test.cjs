const A=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
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
  await page.locator('#service-screen button[onclick="selectServiceMode(\'self\')"]').click();
  A.equal(await page.locator('#full-service-online-route').count(),0,
    'Full single-service V1 must have no duplicate introductory banner');
  A.equal(await page.locator('#full-service-online-entry').isVisible(),true);
  A.equal(await page.locator('#online-v2-entry').isVisible(),false,
    'Multi-item portfolio V2 does not belong inside the single-service V1 form');
  A.equal(await page.locator('#service-results-column').isVisible(),false,
    'The simplified results of V1 must not duplicate the full single-service report');
  A.equal(await page.locator('#full-service-online-action').isVisible(),true);
  A.match(await page.locator('#service-v1-heading').textContent(),/Полный расчёт онлайн-услуги/);
  const onlineOrder=await page.evaluate(()=>({
    inputs:document.getElementById('inputs-container').getBoundingClientRect().top,
    action:document.getElementById('full-service-online-action').getBoundingClientRect().top
  }));
  A.ok(onlineOrder.action>onlineOrder.inputs,
    'Complete-service calculation follows the input fields, never precedes them');
  await page.evaluate(()=>showServiceWorkChooser());
  await page.locator('#service-work-offline').click();
  A.equal(await page.locator('#full-service-offline-route').count(),0,
    'No duplicate heading or premature CTA in one offline V1 service');
  A.equal(await page.locator('#full-service-offline-entry').isVisible(),false,
    'Full result action appears only after the business tax/price stage');
  A.match(await page.locator('#product-intro-category').textContent(),/Полный расчёт/);
  A.equal(await page.locator('#product-screen').isVisible(),true);
  // Integration: read actual V1 service field values and equipment rows.
  await page.locator('#product-name-input').fill('Массаж');
  await page.locator('#product-intro-submit-label').click();
  await page.locator('[data-material-cost-mode="known"]').click();
  await page.locator('#own-materials-cost').fill('8');
  await page.locator('[data-yn-group="productionPremises"][data-yn-value="yes"]').click();
  await page.locator('#own-production-premises-monthly').fill('10000');
  await page.locator('#offline-service-monthly-capacity').fill('250');
  await page.locator('#own-product-ad-budget').fill('900');
  await page.locator('#own-product-ad-cpc').fill('4.5');
  await page.locator('#own-product-ad-ctr').fill('2');
  await page.locator('#own-product-ad-click-lead').fill('20');
  await page.locator('#own-product-ad-lead-sale').fill('50');
  await page.locator('[data-yn-group="equipmentPurchase"][data-yn-value="yes"]').click();
  await page.locator('#own-equipment-purchase-rows .equipment-purchase-cost').first().fill('3000');
  await page.locator('#own-equipment-purchase-rows .equipment-useful-life').first().fill('12');
  const original=await page.evaluate(()=>{
    const item=currentProductPortfolioSnapshot();
    // V1 prices remain the authority: stub only the approved V1 quote, not costs,
    // inventory, capacity, amortization or the service funnel.
    productBusinessTaxType='turnover';
    document.getElementById('own-business-tax-pct').value='10';
    calculateProductPortfolio=()=>({pricingReady:true,items:[{id:currentProductSequence,price:100}],taxPriceMultiplier:1});
    return {forecast:item.forecastUnitsPerMonth,fixed:item.productionFixedMonthly};
  });
  A.equal(original.forecast,20,'Actual V1 ad funnel determines monthly service demand');
  const beforeAssortment=await page.evaluate(()=>({
    mode:serviceFinancialMode,source:productSource,taxHidden:document.getElementById('product-tax-block').hidden,
    actionHidden:document.getElementById('full-service-offline-entry').hidden,
    parent:document.getElementById('full-service-offline-entry').parentElement?.id
  }));
  await page.locator('#assortment-complete-button').click();
  const afterAssortment=await page.evaluate(()=>{
    const tax=document.getElementById('product-tax-block'),a=document.getElementById('full-service-offline-entry');
    return {mode:serviceFinancialMode,source:productSource,taxHidden:tax.hidden,taxCls:tax.className,
      actionHidden:a.hidden,actionCls:a.className,parent:a.parentElement?.id,
      actionCss:getComputedStyle(a).display,taxCss:getComputedStyle(tax).display,
      ownHidden:document.getElementById('product-own-form').hidden,
      ancestorIds:[a,a.parentElement,a.parentElement?.parentElement,a.parentElement?.parentElement?.parentElement].map(x=>[x?.id,x?.hidden,x?.className])
    };
  });
  console.log('TZ02_SINGLE_V1_OFFLINE_GATE_DIAG',JSON.stringify({before:beforeAssortment,after:afterAssortment}));
  A.equal(await page.locator('#full-service-offline-entry').isVisible(),true,
    'Single-service result action is only available after confirming the service');
  A.equal(await page.locator('#product-v2-portfolio-gateway').isVisible(),false,
    'V2 is a separate portfolio, not the full calculation of one service');
  A.equal(await page.locator('#product-v1-aggregate-report').isVisible(),false,
    'Hide obsolete simplified V1 monthly results in full mode');
  await page.locator('#full-service-offline-action').click();
  A.equal(await page.locator('#full-service-screen').isVisible(),true,
    'Real user click computes full V1 finance for ONE service');
  A.match(await page.locator('.nd-full-service-header > p').textContent(),/^V1 ·/);
  const adapted=await page.evaluate(()=>Nomad360FullServiceUI.getInput());
  A.equal(adapted.monthlyForecast,20);
  A.equal(adapted.capacity,250);
  A.equal(adapted.unitCashCost,8);
  A.equal(adapted.equipmentPurchase,3000);
  A.ok(Math.abs(adapted.equipmentAmortMonthly-250)<.001);
  A.equal(adapted.taxPct,10);
  A.ok(Math.abs(adapted.fixedCashMonthly-original.fixed+250-900)<.01,
    'CAPEX depreciation excluded from monthly cash expenses, ad spend included');
  A.equal(await page.locator('#full-service-screen').isVisible(),true);
  const v1Parity=await page.evaluate(()=>{
    const item=productPortfolio.find(x=>x.source==='offline-service');
    const fixed=item.productionFixedMonthly;
    item.productionFixedMonthly=fixed-250; // V1 simplified oracle without purchased equipment.
    const cash=calculateOfflineServiceCashFlow(calculateProductPortfolio());
    item.productionFixedMonthly=fixed;
    return {ready:cash.ready,tax:cash.months[0]?.taxPaid,
      operatingCash:cash.months[0]?.cashFlow-cash.months[0]?.financedInflow};
  });
  A.equal(v1Parity.ready,true);
  const fullParity=await page.evaluate(data=>Nomad360FullServiceV2.build({
    ...data,vatPct:0,months:1,funding:'own',equipmentPurchase:0,
    equipmentAmortMonthly:0,taxType:'turnover'
  }),adapted);
  A.ok(Math.abs(fullParity.months[0].tax-v1Parity.tax)<.01,
    'N=1, VAT 0, turnover tax: full service matches unchanged V1 tax');
  A.ok(Math.abs(fullParity.months[0].operatingCash-v1Parity.operatingCash)<.01,
    'N=1, VAT 0, equity: full service matches V1 operating cash before startup capital');
  await page.locator('#full-service-back').click();
  A.equal(await page.locator('#product-screen').isVisible(),true);
  // Real API through the same V2 module used by the user-facing full-finance screen.
  const seed={monthlyForecast:200,capacity:250,priceGross:100,vatPct:12,
    taxType:'profit',taxPct:10,months:3,unitCashCost:8,
    fixedCashMonthly:10000,equipmentPurchase:0,equipmentAmortMonthly:0,
    commissionPct:0,reservePct:10,funding:'own',annualRatePct:24,creditMonths:3};
  await page.evaluate(data=>Nomad360FullServiceUI.open(data,{kind:'offline',name:'Массаж'}),seed);
  A.equal(await page.locator('#full-service-screen').isVisible(),true);
  A.equal(await page.locator('#full-service-report table tbody tr').count(),3);
  let r=await page.evaluate(()=>Nomad360FullServiceUI.getResult());
  A.ok(Math.abs(r.capital-11160)<.01);
  A.ok(Math.abs(r.months[0].revenue-17857.142857)<.01);
  A.equal(r.firstPositiveMonth,1);
  A.equal(r.paybackMonth,2);
  await page.locator('#full-service-vat').fill('0');
  const larger=await page.evaluate(()=>Nomad360FullServiceUI.getResult().revenue);
  A.ok(larger>r.revenue);
  await page.locator('#full-service-tax').selectOption('turnover');
  r=await page.evaluate(()=>Nomad360FullServiceUI.getResult());
  A.ok(Math.abs(r.months[0].tax-r.months[0].revenue*.1)<.01);
  await page.locator('#full-service-funding').selectOption('credit');
  await page.locator('#full-service-term').fill('5');
  r=await page.evaluate(()=>Nomad360FullServiceUI.getResult());
  A.ok(r.outstandingPrincipal>0);
  A.equal(r.creditRepaid,0);
  await page.locator('#full-service-horizon').fill('6');
  r=await page.evaluate(()=>Nomad360FullServiceUI.getResult());
  A.equal(r.outstandingPrincipal,0);
  A.ok(r.creditRepaid>0);
  A.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,
    'Mobile financial results must not overflow the viewport');
  await page.locator('#full-service-save').click();
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('nomad360-full-service-v2')));
  A.equal(draft.schema,2);
  A.equal(draft.input.months,6);
  A.equal(draft.input.creditMonths,5);
  A.equal(Object.hasOwn(draft,'result'),false,'No duplicated derived 180-day cash ledger in storage');
  await page.evaluate(()=>showServiceWorkChooser());
  A.equal(await page.locator('#service-full-saved-entry').isVisible(),true,'Saved model can be reopened');
  await page.locator('#service-full-saved-entry').click();
  A.equal(await page.locator('#full-service-screen').isVisible(),true);
  A.equal(await page.evaluate(()=>Nomad360FullServiceUI.getInput().months),6);
  await page.locator('#full-service-back').click();
  A.equal(await page.locator('#service-work-screen').isVisible(),true,'Saved mode returns to chooser, not an empty V1 form');
  await page.locator('#service-full-saved-entry').click();
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
