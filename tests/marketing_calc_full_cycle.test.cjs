// Run: node --test tests/marketing_calc_full_cycle.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'..','Marketing_calc.HTML'),'utf8');
const slice=(start,end)=>{
  const a=html.indexOf(start),b=html.indexOf(end,a);
  assert.ok(a>=0&&b>a,'Missing source '+start);
  return html.slice(a,b);
};
const scripts=[
 slice('function aggregateQuantityDetails(item) {','function calculateProductPortfolio() {'),
 slice('function calculateProductPortfolio() {','function aggregatePricingMetrics(item) {'),
 slice('function calculateAggregateCredit(item) {','function updateAggregateCredit(item) {'),
 slice('function calculateProductCashFlow(model) {','function updatePriceListRange(item) {')
].join('\n');
const qty=100,raw=106,defect=.05,prod=(10+2)/(1-defect);
const warehouseDaily=.5,delivery=(200+prod)*.08*1.05;
const logistics=10+1+delivery;
const fixture=()=>({
 id:1,name:'Хлопковый шоппер',source:'own',
 materialsBatchQty:raw,materialsBatchTotal:raw*200,materialsUnitCost:200,
 productionQty:qty,productionTotal:prod*qty,productionUnitCost:prod,productionDefectPct:5,
 logisticsQty:qty,logisticsUnitCost:logistics,warehouseInboundUnitCost:10,
 warehouseDayCost:warehouseDaily,warehouseStorageUnitCost:1,
 customerDeliveryPct:8,customerReturnPct:5,salesQty:qty,salesFixedMonthly:1000,
 salesVariablePct:10,penaltiesPct:1,forecastUnitsPerMonth:24,adBudget:900,adManagement:120,
 planning:{
  supplyDays:7,advancePct:50,advanceLeadDays:3,productionDays:10,
  reservePct:10,fundingMode:'cash',targetMarginPct:30,maxDiscountPct:20,minimumMarginPct:10,
  creditRatePct:12,creditTermMonths:6
 },
 inputs:{
  'own-product-ad-budget':900,'own-product-ad-cpc':3,'own-product-ad-ctr':2,
  'own-product-ad-click-lead':20,'own-product-ad-lead-sale':40,
  'own-product-ad-management':120
 }
});
const close=(actual,expected,msg,tol=1e-7)=>assert.ok(
 Number.isFinite(actual)&&Math.abs(actual-expected)<tol,
 msg+': got '+actual+' expected '+expected
);
function app(items,taxType='turnover',tax=6) {
 const env=new Function('productPortfolio','productBusinessTaxType','productNumber','aggregatePricingMetrics',
 scripts+';return {aggregateQuantityIssues,aggregatePlanMetrics,allocatedMaterialCostPerGood,projectedStoragePerUnit,calculateProductPortfolio,calculateAggregateCredit,calculateProductCashFlow,calculatePriceListRange};'
 );
 return env(items,taxType,id=>id==='own-business-tax-pct'?tax:0,
 ()=>({salesVatChoice:'yes',vatReady:true,vatPct:12}));
}
test('Batch quantity preserves units and rejects unmanufacturable orders',()=>{
 const item=fixture(),a=app([item]);
 assert.deepEqual(a.aggregateQuantityIssues(item),[]);
 close(a.allocatedMaterialCostPerGood(item),212,'actual raw consumed per finished unit');
 item.materialsBatchQty=105;
 assert.ok(a.aggregateQuantityIssues(item).some(s=>s.includes('106')));
 assert.equal(a.calculateProductPortfolio().pricingReady,false);
 item.materialsBatchQty=106;
 item.logisticsQty=101;
 assert.ok(a.aggregateQuantityIssues(item).some(s=>s.includes('меньше')));
 item.logisticsQty=100;
 item.salesQty=101;
 assert.ok(a.aggregateQuantityIssues(item).length>0);
});
test('Storage runs until last unit sold; not limited to two entry-form days',()=>{
 const item=fixture(),a=app([item]);
 const cycle=a.aggregatePlanMetrics(item);
 close(cycle.sellThroughDays,125,'cycle days');
 close(a.projectedStoragePerUnit(item),31.25,'warehouse per sold unit');
 close(cycle.warehouseTotal,4125,'full warehouse cost');
 const expectedBase=21200+prod*100+4125+delivery*100+1000*125/30+1020*125/30;
 close(cycle.nonRevenueCosts,expectedBase,'all cycle expenses');
 close(cycle.reserveAmount,expectedBase*.1,'liquidity buffer');
 close(cycle.requiredCapital,expectedBase*1.1,'cash / loan principal');
 const model=a.calculateProductPortfolio();
 assert.equal(model.pricingReady,true);
 close(model.items[0].unitCost,212+prod+10+31.25+delivery,'full unit economics');
});
test('Business price list funds reserve and holding time, never taxes the reserve itself',()=>{
 const item=fixture(),a=app([item]),model=a.calculateProductPortfolio();
 const x=a.calculatePriceListRange(item);
 assert.equal(x.ready,true);
 const base=model.items[0].unitCost+900/24+1120/24+a.aggregatePlanMetrics(item).reserveAmount/100;
 const expectedMin=Math.ceil(base/(1-.11-.06-.10)*1.12/.8*100)/100;
 const expectedMax=Math.ceil(base/(1-.11-.06-.30)*1.12/.8*100)/100;
 close(x.minPrice,expectedMin,'list minimum');
 close(x.maxPrice,expectedMax,'list maximum');
 close(model.tax,model.totalRevenue*.06,'tax is only on turnover, not on injected reserve');
 close(model.adjustedTax,model.adjustedRevenue*.06,'tax-adjusted revenue tax');
});
test('Cash-flow includes owner funding, sales tax and distinct protected reserve',()=>{
 const item=fixture(),a=app([item]),model=a.calculateProductPortfolio();
 const cash=a.calculateProductCashFlow(model);
 assert.equal(cash.ready,true);
 assert.equal(cash.months.length,5);
 const cycle=a.aggregatePlanMetrics(item);
 close(cash.months[0].financedInflow,cycle.requiredCapital,'owner investment');
 close(cash.reserveLocked,cycle.reserveAmount,'locked reserve');
 close(cash.freeCumulativeEnd,cash.cumulativeEnd-cycle.reserveAmount,'free cash');
 const sales=100*model.items[0].price*model.taxPriceMultiplier;
 const tax=sales*.06;
 close(cash.months.reduce((sum,m)=>sum+m.inflow-m.financedInflow,0),sales,'all sales until stock zero');
 close(cash.months.reduce((sum,m)=>sum+m.taxPaid,0),tax,'cash business tax');
 close(cash.months.reduce((sum,m)=>sum+m.cashFlow,0),cash.cumulativeEnd,'cash continuity');
 assert.ok(cash.months.every((m,i)=>i===0||m.freeCumulative>cash.months[i-1].freeCumulative));
});
test('Bullet credit repaid in full; all interest spread over entire stock, not one month of sales',()=>{
 const item=fixture();item.planning.fundingMode='credit';
 const a=app([item]),cycle=a.aggregatePlanMetrics(item),credit=a.calculateAggregateCredit(item);
 close(credit.principal,cycle.requiredCapital,'loan principal incl reserve');
 close(credit.monthlyServiceCost,cycle.requiredCapital*.01,'monthly interest');
 close(credit.totalInterest,cycle.requiredCapital*.01*6,'term interest');
 close(credit.servicePerUnit,credit.totalInterest/100,'interest per stock unit');
 const model=a.calculateProductPortfolio(),cash=a.calculateProductCashFlow(model);
 assert.equal(cash.ready,true);
 assert.equal(cash.months.length,6);
 close(cash.months[0].financedInflow,credit.principal,'credit payout');
 close(cash.months[5].principalRepaid,credit.principal,'bullet principal repayment');
 close(cash.months.reduce((sum,m)=>sum+m.interestPaid,0),credit.totalInterest,'cash interest');
 close(model.items[0].creditServicePerUnit,credit.totalInterest/100,'pricing includes all term interest');
 assert.ok(cash.months[5].cashFlow<0,'bullet repayment visible as a cash gap');
});
test('Business profitability is not SKU margin',()=>{
 const a=app([fixture()]),m=a.calculateProductPortfolio();
 const skuTarget=.30,businessMargin=m.adjustedNetProfit/m.adjustedRevenue;
 assert.ok(Math.abs(businessMargin-skuTarget)>.01);
 assert.ok(businessMargin>0);
});
