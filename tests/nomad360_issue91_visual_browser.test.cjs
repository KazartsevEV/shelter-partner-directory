'use strict';
// #91 visual acceptance screenshots are CI artifacts, never a change to Pages.
const A=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const dest=path.resolve(__dirname,'../artifacts/issue91-visual');
 fs.mkdirSync(dest,{recursive:true});
 const url=pathToFileURL(path.resolve(__dirname,'../Marketing_calc.HTML')).href;
 const summary=[];
 try{
  for(const width of [320,390,1440]){
   const page=await browser.newPage({viewport:{width,height:850},locale:'ru-RU'});
   page.setDefaultTimeout(8000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,route=>route.abort());
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('#start-service').click();
   await page.locator('#service-mode-full').click();
   await page.locator('#service-work-offline').click();
   await page.locator('#service-screen button[onclick="selectServiceMode(\'self\')"]').click();
   await page.locator('#product-name-input').fill('Маникюр · поздний старт');
   await page.locator('#product-intro-submit-label').click();
   await page.locator('#service-v1-horizon').fill('3');
   await page.locator('#service-v1-monthly-demand').fill('0\n10\n15');
   await page.locator('[data-material-cost-mode="known"]').click();
   await page.locator('#own-materials-cost').fill('8');
   await page.locator('#offline-service-monthly-capacity').fill('25');
   await page.locator('[data-yn-group="productionPremises"][data-yn-value="yes"]').click();
   await page.locator('#own-production-premises-monthly').fill('200');
   await page.locator('#own-product-ad-budget').fill('900');
   const current=await page.evaluate(()=>{
    const item=currentProductPortfolioSnapshot();
    return {service:productSource,profile:serviceDemandProfile(item),
      capacity:item.offlineServiceCapacity,draft:item.serviceMonthlyDemand};
   });
   A.equal(current.service,'offline-service');
   A.equal(current.profile.valid,true,JSON.stringify(current.profile));
   A.deepEqual(current.profile.months,[0,10,15]);
   A.equal(current.capacity,25);
   const panel=page.locator('#service-v1-horizon-panel');
   A.equal(await panel.isVisible(),true);
   const panelBox=await panel.boundingBox();
   A.ok(panelBox&&panelBox.width<=width+1,
     'Demand input extends outside '+width+'px viewport');
   await panel.screenshot({path:path.join(dest,'monthly-demand-'+width+'.png'),
     animations:'disabled'});
   const prepared=await page.evaluate(()=>{
    setProductAssortmentChoice('complete');
    const item=productPortfolio[0];
    Object.assign(item.planning,{fundingMode:'cash',targetMarginPct:30,
      reservePct:10,maxDiscountPct:0,minimumMarginPct:10});
    setProductBusinessTaxType('turnover');
    selectProductYesNo('salesVat','no');
    document.getElementById('own-business-tax-pct').value='6';
    const model=calculateProductPortfolio(),flow=calculateProductCashFlow(model);
    showAggregateTaxPricing(item.id,null);
    updateProductPortfolioBusinessSummary();
    return {ready:model.pricingReady&&flow.ready,reason:flow.reason||'',
      revenue:flow.months.map(m=>m.inflow-m.financedInflow),
      quantities:flow.months.map(m=>m.serviceQuantity),
      outflow:flow.months.map(m=>m.outflow)};
   });
   A.equal(prepared.ready,true,JSON.stringify(prepared));
   A.deepEqual(prepared.quantities,[0,10,15]);
   A.equal(prepared.revenue[0],0);
   A.ok(prepared.outflow[0]>0);
   const report=page.locator('#product-portfolio-business-summary');
   A.equal(await report.isVisible(),true,'Monthly report is visible');
   A.match(await report.textContent(),/Оказано услуг/);
   await report.screenshot({path:path.join(dest,'monthly-cash-'+width+'.png'),
     animations:'disabled'});
   const overflow=await page.evaluate(()=>({
      viewport:innerWidth,document:document.documentElement.scrollWidth,
      report:document.getElementById('product-portfolio-business-summary').getBoundingClientRect().width
   }));
   A.ok(overflow.document<=overflow.viewport+1,
      'Document overflow '+JSON.stringify(overflow));
   A.equal(await page.evaluate(()=>saveProductCalculationToBrowser()),true);
   await page.reload({waitUntil:'domcontentloaded'});
   A.equal(await page.evaluate(()=>resumeSavedProductCalculation()),true);
   A.equal(await page.locator('#service-v1-monthly-demand').inputValue(),'0\n10\n15',
      'Custom plan survives reload '+width);
   const linked=await page.evaluate(()=>{
      const okay=openLinkedPortfolioFromProducts();
      const state=LinkedPortfolioV2UI.getState();
      const model=LinkedPortfolioV2Engine.build(state);
      return {okay,ready:model.ready,errors:model.errors,
        forecast:state.skus[0]?.fullServiceForecast,
        quantities:model.temporal?.months?.map(m=>m.orders['v1-1']),
        revenue:model.cashflow?.periodPnl?.months?.map(m=>m.revenue)};
   });
   A.equal(linked.okay,true,JSON.stringify(linked));
   A.equal(linked.ready,true,JSON.stringify(linked.errors));
   A.deepEqual(linked.forecast,[0,10,15]);
   A.deepEqual(linked.quantities,[0,10,15]);
   for(let i=0;i<3;i++)
     A.ok(Math.abs(linked.revenue[i]-prepared.revenue[i])<.015,
       'V1/V2 native import keeps month '+(i+1)+' revenue');
   if(width===390)await page.locator('#portfolio-v2-root').screenshot({
      path:path.join(dest,'portfolio-v2-monthly-390.png'),animations:'disabled'});
   A.deepEqual(errors,[],'Browser errors at '+width);
   summary.push({width,quantities:prepared.quantities,revenue:prepared.revenue,
      viewportOverflow:false,restored:true});
   await page.close();
  }
  console.log('ISSUE91_VISUAL_RECEIPT',JSON.stringify(summary));
 }finally{await browser.close();}
})().catch(e=>{console.error('ISSUE91_VISUAL_RED',e.stack||e);process.exitCode=1});
