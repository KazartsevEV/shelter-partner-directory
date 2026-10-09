// Deterministic real-Chromium walkthrough: fill form top-to-bottom, compare to independent arithmetic.
// Run: node tests/marketing_calc_browser_e2e.cjs  (requires npm install playwright & Chromium)
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const numericalFindings = [];
const approx = (actual, expected, label, epsilon=0.011) => {
    if (!Number.isFinite(actual) || Math.abs(actual-expected)>epsilon) {
       const diff = actual-expected;
       numericalFindings.push({label,actual,expected,diff});
       console.log('NUMERIC_DEFECT',label,'observed',actual,'expected',expected,'delta',diff);
       return;
    }
    console.log('PASS',label,'observed',actual.toFixed(4),'expected',expected.toFixed(4));
};
const number = txt => {
  // Extract the first localized numeric token; ignore dots in the suffix "у.е.*".
  const match = String(txt || '').match(/-?\d[\d\s\u00a0]*(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(/\s|\u00a0/g, '').replace(',', '.')) : NaN;
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
 await put('own-materials-batch-qty',106);
 await force('recalculateMaterialsLandedCost');
 const mat=200;
 approx(await field('own-materials-landed-unit-cost'),mat,'Materials/1');
 console.log('INPUTS MATERIALS OK');

 // Step 3: own production, 100 units monthly, rental 1000, electricity 2/unit, defects 5%.
 await choose('[data-yn-group="productionPremises"][data-yn-value="yes"]');
 await put('own-production-premises-monthly',1000);
 await choose('[data-yn-group="equipmentRental"][data-yn-value="no"]');
 await choose('[data-yn-group="equipmentPurchase"][data-yn-value="no"]');
 await choose('[data-production-labor-mode="workers"]');
 await put('own-production-workers-count',2);
 await put('own-production-worker-gross',200);
 approx(await field('own-production-workers-gross-total'),400,'KZ wage gross');
 approx(await field('own-production-workers-taxes-total'),70,'KZ employer charges');
 approx(await field('own-production-workers-total'),470,'KZ full wage cost');
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

 // Planning: fully sell 100 items at 24/month, and hold 10% reserve.
 await choose('#assortment-complete-button');
 const sel='[data-business-product-id="1"]';
 for(const [key,v] of [['supplyDays',7],['advancePct',50],['advanceLeadDays',3],['productionDays',10],['reservePct',10]])
   await page.locator(sel+' input[oninput*="'+key+'"]').fill(String(v));
 // Enter a physically impossible raw-material quantity; the warning and
 // price gate must activate, and both must recover when quantity is corrected.
 const rawInput=page.locator(sel+' input[data-aggregate-qty-kind="materials"]');
 await rawInput.fill('105');
 assert.equal(await page.locator(sel+' [data-aggregate-qty-error="materials"]').isVisible(),true);
 assert.match(await page.locator(sel+' [data-aggregate-qty-error="materials"]').textContent(),/106/);
 assert.equal(await rawInput.getAttribute('aria-invalid'),'true');
 await rawInput.fill('106');
 assert.equal(await page.locator(sel+' [data-aggregate-qty-error="materials"]').isVisible(),false);
 assert.equal(await rawInput.getAttribute('aria-invalid'),'false');
 const qty=100,days=125;
 const stockStorage=10*qty+.5*qty*days/2;
 const materialTotal=106*200,productionTotal=production*qty;
 const costBase=materialTotal+productionTotal+stockStorage+delivery*qty+(1000+1020)*days/30;
 const reserve=costBase*.1,capital=costBase+reserve;
 approx(await shown(sel+' [data-aggregate-final="baseRequiredCapital"]'),costBase,'Cycle expenses');
 approx(await shown(sel+' [data-aggregate-final="reserveAmount"]'),reserve,'10% protected funds');
 approx(await shown(sel+' [data-aggregate-final="requiredCapital"]'),capital,'Capital incl reserve');
 assert.equal(await page.locator(sel+' [data-quantity-warning]').isVisible(),false);
 await choose(sel+' [data-funding-choice="cash"]');
 await page.locator(sel+' input[oninput*="updateAggregateMargin"]').fill('30');
 await choose('[data-yn-group="salesVat"][data-yn-value="yes"]');
 await put('own-sales-vat-pct',12);
 await choose(sel+' [data-pricing-decision="tax"]');
 await choose('[data-business-tax-type="turnover"]');
 await put('own-business-tax-pct',6);
 const fullStorage=.5*days/2;
 const cogs=materialTotal/qty+production+10+delivery+fullStorage;
 const basePrice=(cogs+900/orders+reserve/qty)/.7;
 const taxMultiplier=.89/.83;
 approx(await shown(sel+' [data-aggregate-price="priceBeforeTax"]'),basePrice,'Unit base selling price');
 approx(await shown('[data-tax-price-product-id="1"] .final-buyer-price'),basePrice*taxMultiplier*1.12,'Tax+VAT buyer price');
 await page.locator('[data-tax-price-product-id="1"] [data-discount-choice="yes"]').click();
 await page.locator('[data-tax-price-product-id="1"] input[oninput*="maxDiscountPct"]').fill('20');
 await page.locator('[data-tax-price-product-id="1"] input[oninput*="minimumMarginPct"]').fill('10');
 const load=cogs+900/orders+1120/orders+reserve/qty;
 const floor=Math.ceil(load/(.73)*1.12/.8*100)/100;
 const target=Math.ceil(load/(.53)*1.12/.8*100)/100;
 const prices=await page.evaluate(()=>calculatePriceListRange(productPortfolio[0]));
 approx(prices.minPrice,floor,'List floor protecting net 10%',1e-8);
 approx(prices.maxPrice,target,'List target protecting net 30%',1e-8);
 const model=await page.evaluate(()=>calculateProductPortfolio());
 const rev=basePrice*orders,fees=.11*rev;
 approx(model.totalRevenue,rev,'Monthly gross sales model');
 approx(model.totalEbitdaBeforeShared,rev-cogs*orders-900-fees,'Product EBITDA');
 approx(model.businessEbitda,rev-cogs*orders-900-fees-1120,'Business EBITDA');
 approx(model.adjustedRevenue,rev*taxMultiplier,'Net-of-VAT adjusted sales');
 approx(model.adjustedTax,rev*taxMultiplier*.06,'Turnover tax on sales, not reserve');
 const cf=await page.evaluate(()=>calculateProductCashFlow(calculateProductPortfolio()));
 assert.equal(cf.months.length,5);
 let running=0,totalSold=0;
 for(let i=0;i<5;i++){
   const begin=Math.max(17,i*30),end=Math.min(142,(i+1)*30),active=Math.max(0,end-begin);
   const sold=active*.8;totalSold+=sold;
   const netSales=sold*basePrice*taxMultiplier,tax=netSales*.06;
   const inflow=netSales+(i===0?capital:0);
   let outflow=netSales*.11+tax+sold*delivery+(1000+1020)/30*active;
   if(active){const a=begin-17,b=end-17;outflow+=.5*(100*(b-a)-.8*(b*b-a*a)/2);}
   if(i===0)outflow+=materialTotal+productionTotal+1000;
   running+=inflow-outflow;
   const month=cf.months[i];
   approx(month.inflow,inflow,'month '+(i+1)+' inflow');
   approx(month.outflow,outflow,'month '+(i+1)+' outflow');
   approx(month.taxPaid,tax,'month '+(i+1)+' business tax');
   approx(month.cashFlow,inflow-outflow,'month '+(i+1)+' net');
   approx(month.cumulative,running,'month '+(i+1)+' cumulative');
   approx(month.freeCumulative,running-reserve,'month '+(i+1)+' live money');
 }
 approx(totalSold,qty,'Total sold units',1e-8);
 approx(cf.reserveLocked,reserve,'Protected reserve');
 approx(cf.freeCumulativeEnd,running-reserve,'End disposable cash');
 const summaryText=await page.locator('#product-portfolio-business-summary').textContent();
 assert.ok(summaryText.includes('ЖИВЫЕ ДЕНЬГИ'),'Live money headline');
 assert.ok(summaryText.includes((model.adjustedNetProfit/model.adjustedRevenue*100).toLocaleString('ru-RU',{maximumFractionDigits:2})+'%'),'Business return separate');

 // Interest-only, BULLET principal due at end of sixth month.
 await choose(sel+' [data-funding-choice="credit"]');
 await page.locator(sel+' input[oninput*="creditRatePct"]').fill('12');
 await page.locator(sel+' input[oninput*="creditTermMonths"]').fill('6');
 const interest=capital*.01;
 approx(await shown(sel+' [data-credit-amount]'),capital,'Credit principal');
 approx(await shown(sel+' [data-credit-monthly-service]'),interest,'Monthly interest');
 approx(await shown(sel+' [data-credit-unit-load]'),interest*6/qty,'Total interest per unit');
 approx(await shown(sel+' [data-credit-total-interest]'),interest*6,'Full loan interest');
 const cashLoan=await page.evaluate(()=>calculateProductCashFlow(calculateProductPortfolio()));
 assert.equal(cashLoan.months.length,6);
 approx(cashLoan.months[0].financedInflow,capital,'Credit cash received');
 approx(cashLoan.months[5].principalRepaid,capital,'Principal bullet repayment');
 approx(cashLoan.months.reduce((z,m)=>z+m.interestPaid,0),interest*6,'6 monthly interest payments');
 assert.ok((await page.evaluate(()=>calculatePriceListRange(productPortfolio[0]))).minPrice>floor,'Borrowing adds price load');
 await choose('[data-tax-price-product-id="1"] button[onclick*="toggleProjectSupport"]');
 assert.equal(await page.locator('[data-tax-price-product-id="1"] [data-project-support]').isVisible(),true);
 await choose('[data-tax-price-product-id="1"] button[onclick*="addProductFromBusinessAdvice"]');
 assert.equal(await page.evaluate(()=>currentProductSequence),2);
 assert.equal(await page.evaluate(()=>productPortfolio[0].name),'Хлопковый шоппер — контрольный SKU');
 assert.deepEqual(browserLog,[]);
 assert.deepEqual(numericalFindings,[],'No monetary differences');
 console.log('BROWSER_E2E_GREEN',JSON.stringify({costBase,reserve,capital,cogs,floor,target,freeCash:cf.freeCumulativeEnd}));
 await browser.close();
 }catch(error){await browser.close();throw error}
})().catch(error=>{console.error('BROWSER_E2E_RED',error.stack||error);process.exitCode=1});
