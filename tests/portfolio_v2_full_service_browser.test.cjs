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
  await page.locator('#service-mode-full').click();
  A.equal(await page.locator('#service-mode-full').getAttribute('aria-pressed'),'true');
  await page.locator('#service-work-offline').click();
  A.equal(await page.locator('#full-service-offline-entry').isVisible(),true);
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
  const entered=await page.evaluate(()=>openFullServiceFromOffline());
  A.equal(entered,true,'Full branch imports the populated V1 service form');
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
  A.deepEqual(errors,[]);
  console.log('TZ02_FULL_SERVICE_BROWSER_GREEN',{capital:seed.fixedCashMonthly+1160,rows:r.months.length});
 }finally{await browser.close()}
})().catch(err=>{console.error('TZ02_FULL_SERVICE_BROWSER_RED',err.stack||err);process.exitCode=1});
