// Deterministic real-Chromium walkthrough: fill form top-to-bottom, compare to independent arithmetic.
// Run: node tests/marketing_calc_browser_e2e.cjs  (requires npm install playwright & Chromium)
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const approx = (actual, expected, label, epsilon=0.011) => {
    assert.ok(Number.isFinite(actual) && Math.abs(actual-expected)<=epsilon,
      label+': observed '+actual+', independently expected '+expected);
    console.log('PASS',label,'observed',actual.toFixed(4),'expected',expected.toFixed(4));
};
const number = txt => {
  const cleaned = String(txt||'').replace(/\s|\u00a0/g,'').replace(',','.').replace(/[^0-9.-]/g,'');
  return Number(cleaned);
};
const browserLog = [];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 page.on('pageerror',e=>browserLog.push(String(e.message)));
 await page.route(/^https?:\/\//,route=>route.abort()); // offline local HTML; no CDN required for logic
 await page.goto(pathToFileURL(path.resolve(__dirname,'..','Marketing_calc.HTML')).href,{waitUntil:'domcontentloaded'});
 const put=async(id,value)=>page.locator('#'+id).fill(String(value));
 const choose=async(q)=>page.locator(q).first().click();
 const field=async(id)=>number(await page.locator('#'+id).textContent());
 const shown=async(q)=>number(await page.locator(q).first().textContent());
 const force=async(name)=>page.evaluate(name=>window[name](),name);

 // Step 1: name and sourcing.
 await page.evaluate(()=>showProductBranch());
 await put('product-name-input','Хлопковый шоппер — контрольный SKU');
 await page.locator('#product-name-input').press('Enter');
 await choose('[data-product-source="own"]');
 assert.equal(await page.locator('#product-own-form').isVisible(),true);

 // Step 2: material cost per finished item; cost already contains its purchase VAT.
 await choose('[data-material-cost-mode="known"]');
 await put('own-materials-cost',200);
 await choose('[data-yn-group="vatIncluded"][data-yn-value="yes"]');
 // The materials price already includes VAT: the VAT-rate control is intentionally hidden.
 await choose('[data-yn-group="inboundIncluded"][data-yn-value="yes"]');
 await choose('[data-yn-group="materialsImported"][data-yn-value="no"]');
 await put('own-materials-batch-qty',100);
 await force('recalculateMaterialsLandedCost');
 const mat=200;
 approx(await field('own-materials-landed-unit-cost'),mat,'Materials/1');
 console.log('INPUTS MATERIALS OK');

 // Step 3: own production, 100 units monthly, rental 1000, electricity 2/unit, defects 5%.
 await choose('[data-yn-group="productionPremises"][data-yn-value="yes"]');
 await put('own-production-premises-monthly',1000);
 await choose('[data-yn-group="equipmentRental"][data-yn-value="no"]');
 await choose('[data-yn-group="equipmentPurchase"][data-yn-value="no"]');
 await choose('[data-production-labor-mode="self"]');
 await put('own-production-defect-pct',5);
 await choose('[data-yn-group="productionGas"][data-yn-value="no"]');
 await choose('[data-yn-group="productionElectricity"][data-yn-value="yes"]');
 await put('own-production-electricity-tariff',2);
 await put('own-production-electricity-usage',1);
 await choose('[data-yn-group="productionOverheads"][data-yn-value="no"]');
 await put('own-production-monthly-qty',100);
 await force('recalculateProductionUnitCost');
 const production=(1000/100+2)/.95;
 approx(await field('own-production-electricity-total'),2,'Electricity/1');
 approx(await field('own-production-unit-cost'),production,'Production with 5% defect/1');

 // Step 4: 10 per unit inbound, storage 0.5 per unit-day for two days,
 // customer delivery 8% of material+production with 5% return uplift.
 await choose('[data-logistics-payer-key="warehouseInbound"][data-logistics-payer-value="me"]');
 await put('own-warehouse-inbound-unit-cost',10);
 await choose('[data-logistics-payer-key="warehouse"][data-logistics-payer-value="me"]');
 await put('own-warehouse-cost',0.5);
 await put('own-warehouse-days',2);
 await choose('[data-logistics-payer-key="customerDelivery"][data-logistics-payer-value="me"]');
 await put('own-customer-delivery-pct',8);
 await put('own-return-rate',5);
 await put('own-logistics-qty',100);
 await force('recalculateLogisticsUnitCost');
 const delivery=(mat+production)*.08*1.05;
 const logistics=10+0.5*2+delivery;
 approx(await field('own-logistics-unit-cost'),logistics,'Logistics/1');
 approx(await field('own-logistics-selected-total'),logistics*100,'Logistics x100');

 // Step 5: sales payroll 1000/month, 10% commission, 1% penalties.
 await choose('[data-yn-group="salesCommission"][data-yn-value="yes"]');
 await put('own-sales-commission-pct',10);
 await choose('[data-yn-group="payroll"][data-yn-value="yes"]');
 await put('own-payroll-rewards',1000);
 await choose('[data-yn-group="platformPenalties"][data-yn-value="yes"]');
 await put('own-platform-penalties-pct',1);
 await choose('[data-yn-group="employees"][data-yn-value="no"]');
 await put('own-sales-monthly-qty',100);
 await force('recalculateSalesCostSummary');
 approx(await field('own-sales-fixed-monthly'),1000,'Sales monthly fixed');
 approx(await field('own-sales-fixed-per-unit'),10,'Sales fixed/1');
 assert.match(await page.locator('#own-sales-variable-total-pct').textContent(),/11/);

 // Step 6: ad funnel, independently 300 clicks, 15000 impressions, 60 leads, 24 sales.
 await put('own-product-ad-budget',900);
 await put('own-product-ad-cpc',3);
 await put('own-product-ad-ctr',2);
 await put('own-product-ad-click-lead',20);
 await put('own-product-ad-lead-sale',40);
 await put('own-product-ad-management',120);
 await force('recalculateProductAdFunnel');
 const orders=(900/3)*.20*.40;
 approx(await field('own-product-ad-impressions'),15000,'Ad impressions');
 approx(await field('own-product-ad-clicks'),300,'Ad clicks');
 approx(await field('own-product-ad-leads'),60,'Ad leads');
 approx(await field('own-product-ad-orders'),orders,'Ad orders');
 approx(await field('own-product-ad-cac-unit'),900/orders,'Media CAC/1');
 approx(await field('own-product-ad-management-unit'),120/orders,'Marketing management/1');
 approx(await field('own-product-ad-full-unit'),1020/orders,'Full ad/1');

 // Step 7: finished product, staged capital, margins, VAT and turnover tax.
 await choose('#assortment-complete-button');
 assert.equal(await page.locator('#product-tax-block').isVisible(),true);
 const productSelector='[data-business-product-id="1"]';
 for(const [key,value] of [['supplyDays',7],['advancePct',50],['advanceLeadDays',3],['productionDays',10]]) {
   await page.locator(productSelector+' input[oninput*="'+key+'"]').fill(String(value));
 }
 const quantity=100, soldPerMonth=24;
 const sellingDays=quantity/soldPerMonth*30;
 const warehouseTotal=10*quantity+0.5*quantity*sellingDays/2;
 const productionTotal=production*quantity;
 const deliveryTotal=delivery*quantity;
 const capital=200*quantity+productionTotal+warehouseTotal+
   1000*sellingDays/30+1020*sellingDays/30+deliveryTotal;
 approx(await shown(productSelector+' [data-aggregate-final="requiredCapital"]'),capital,'Business required capital');
 approx(await shown(productSelector+' [data-aggregate-final="totalCycleDays"]'),3+10+sellingDays,'Business cycle days');
 await choose(productSelector+' [data-funding-choice="cash"]');
 await page.locator(productSelector+' input[oninput*="updateAggregateMargin"]').fill('30');
 await choose('[data-yn-group="salesVat"][data-yn-value="yes"]');
 await put('own-sales-vat-pct',12);
 // The tax selector is gated by the explicit "calculate with tax" decision.
 await choose(productSelector+' [data-pricing-decision="tax"]');
 await choose('[data-business-tax-type="turnover"]');
 await put('own-business-tax-pct',6);

 const cogs=mat+production+logistics;
 const basePrice=(cogs+900/orders)/(1-.30);
 const taxMultiplier=(1-.11)/(1-.11-.06);
 const taxAdjustedPrice=basePrice*taxMultiplier;
 approx(await shown(productSelector+' [data-aggregate-price="priceBeforeTax"]'),basePrice,'Target margin base price');
 approx(await shown('[data-tax-price-product-id="1"] .final-buyer-price'),taxAdjustedPrice*1.12,'Final buyer price VAT+turnover tax');

 // Step 8: maximum discount 20%; minimum NET margin 10%, target NET margin 30%.
 await page.locator('[data-tax-price-product-id="1"] input[oninput*="maxDiscountPct"]').fill('20');
 await page.locator('[data-tax-price-product-id="1"] input[oninput*="minimumMarginPct"]').fill('10');
 const sharedCostPerUnit=(1000+120)/orders;
 const unitLoad=cogs+900/orders+sharedCostPerUnit;
 const expectedFloor=Math.ceil(unitLoad/(1-.11-.06-.10)*1.12/.8*100)/100;
 const expectedCeiling=Math.ceil(unitLoad/(1-.11-.06-.30)*1.12/.8*100)/100;
 const priceList=await page.evaluate(()=>calculatePriceListRange(productPortfolio[0]));
 assert.equal(priceList.ready,true);
 approx(priceList.minPrice,expectedFloor,'List minimum price',0.00000001);
 approx(priceList.maxPrice,expectedCeiling,'List maximum price',0.00000001);
 const shownRange=await page.locator('[data-tax-price-product-id="1"] [data-price-list-range]').textContent();
 assert.ok(shownRange.includes(expectedFloor.toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})),'Displayed min price');
 assert.ok(shownRange.includes(expectedCeiling.toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})),'Displayed max price');

 // Compare all core enterprise aggregate values against independent calculations.
 const monthlyRevenue=basePrice*orders;
 const variableExpenses=monthlyRevenue*.11;
 const monthlyEbitda=monthlyRevenue-cogs*orders-900-variableExpenses-1120;
 const monthlyTax=monthlyRevenue*.06;
 const business=await page.evaluate(()=>calculateProductPortfolio());
 approx(business.totalRevenue,monthlyRevenue,'Enterprise monthly revenue');
 approx(business.totalEbitdaBeforeShared,monthlyRevenue-cogs*orders-900-variableExpenses,'EBITDA pre-shared');
 approx(business.sharedBusinessCosts,1120,'Shared monthly business costs');
 approx(business.businessEbitda,monthlyEbitda,'Enterprise EBITDA');
 approx(business.profitBeforeTax,monthlyEbitda,'Before business tax');
 approx(business.tax,monthlyTax,'Turnover tax');
 approx(business.netProfit,monthlyEbitda-monthlyTax,'Net profit after tax');
 approx(business.adjustedRevenue,monthlyRevenue*taxMultiplier,'Tax-adjusted revenue');
 approx(business.adjustedTax,monthlyRevenue*taxMultiplier*.06,'Adjusted turnover tax');

 // Step 9: optional credit branch, 12% APR, 6 months; verify all financing outputs.
 await choose(productSelector+' [data-funding-choice="credit"]');
 await page.locator(productSelector+' input[oninput*="creditRatePct"]').fill('12');
 await page.locator(productSelector+' input[oninput*="creditTermMonths"]').fill('6');
 const monthlyService=capital*.12/12;
 approx(await shown(productSelector+' [data-credit-amount]'),capital,'Loan principal');
 approx(await shown(productSelector+' [data-credit-monthly-service]'),monthlyService,'Loan monthly interest');
 approx(await shown(productSelector+' [data-credit-unit-load]'),monthlyService/orders,'Loan load/1');
 approx(await shown(productSelector+' [data-credit-total-interest]'),monthlyService*6,'Loan total interest');
 approx(await shown(productSelector+' [data-credit-total]'),capital+monthlyService*6,'Loan repayment total');
 const creditModel=await page.evaluate(()=>calculateProductPortfolio());
 approx(creditModel.financingCostsMonthly,monthlyService,'Credit monthly business burden');
 assert.ok((await page.evaluate(()=>calculatePriceListRange(productPortfolio[0]))).minPrice>expectedFloor,'Borrowed money increases list floor');

 // Step 10: test donation and edit/add controls without modifying original data.
 await choose('[data-tax-price-product-id="1"] button[onclick*="toggleProjectSupport"]');
 assert.equal(await page.locator('[data-tax-price-product-id="1"] [data-project-support]').isVisible(),true);
 assert.ok((await page.locator('[data-tax-price-product-id="1"]').textContent()).includes('nomad260393@gmail.com')===false,
     'Mail contact exists as href');
 assert.equal(await page.locator('[data-tax-price-product-id="1"] a[href^="mailto:nomad260393"]').count(),1);
 const beforeSku=await page.evaluate(()=>({count:productPortfolio.length,id:productPortfolio[0].id,name:productPortfolio[0].name}));
 await choose('[data-tax-price-product-id="1"] button[onclick*="addProductFromBusinessAdvice"]');
 const afterSku=await page.evaluate(()=>({count:productPortfolio.length,next:currentProductSequence,original:productPortfolio[0].name}));
 assert.equal(afterSku.count,beforeSku.count);
 assert.equal(afterSku.next,2);
 assert.equal(afterSku.original,beforeSku.name);

 assert.deepEqual(browserLog,[],'No page JS errors');
 console.log('BROWSER_E2E_GREEN',JSON.stringify({sku:'Хлопковый шоппер',cogs,basePrice,taxAdjustedPrice,capital,expectedFloor,expectedCeiling,monthlyService}));
 await browser.close();
 } catch(err){await browser.close();throw err}
})().catch(err=>{console.error('BROWSER_E2E_RED',err.stack||err);process.exitCode=1});
