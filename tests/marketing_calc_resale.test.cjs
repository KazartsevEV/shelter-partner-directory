// Resale uses finished-goods lots, never manufactured material, while preserving finance.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','Marketing_calc.HTML'),'utf8');
const slice=(from,to)=>{
  const a=html.indexOf(from),b=html.indexOf(to,a);
  assert.ok(a>=0&&b>a, 'Missing function boundary '+from);
  return html.slice(a,b);
};
const src=[
 slice('function aggregateQuantityDetails(item) {','function calculateProductPortfolio() {'),
 slice('function calculateProductPortfolio() {','function aggregatePricingMetrics(item) {'),
 slice('function calculateAggregateCredit(item) {','function updateAggregateCredit(item) {'),
 slice('function calculateProductCashFlow(model) {','function updatePriceListRange(item) {')
].join('\n');
const app=items=>new Function('productPortfolio','productBusinessTaxType','productNumber','aggregatePricingMetrics',
  src+';return {aggregateQuantityDetails,allocatedMaterialCostPerGood,aggregatePlanMetrics,calculateProductPortfolio,calculateAggregateCredit,calculateProductCashFlow,calculatePriceListRange};'
)(items,'turnover',id=>id==='own-business-tax-pct'?6:0,
  ()=>({salesVatChoice:'yes',vatReady:true,vatPct:12}));
const resale=(id,name,cost,qty)=>({
 id,name,source:'resale',materialsBatchQty:qty,materialsBatchTotal:cost*qty,materialsUnitCost:cost,
 materialsVariableUnit:cost,materialsFixedBatch:0,
 productionQty:qty,productionTotal:0,productionUnitCost:0,productionDefectPct:0,
 logisticsQty:qty,logisticsUnitCost:0,warehouseInboundUnitCost:0,warehouseDayCost:0,warehouseStorageUnitCost:0,
 customerDeliveryPct:0,customerReturnPct:0,salesQty:qty,salesFixedMonthly:0,salesVariablePct:5,penaltiesPct:0,
 forecastUnitsPerMonth:10,adBudget:300,adManagement:0,
 planning:{supplyDays:7,advancePct:50,advanceLeadDays:3,productionDays:999,
  fundingMode:'cash',creditRatePct:12,creditTermMonths:3,
  reservePct:10,targetMarginPct:30,maxDiscountPct:20,minimumMarginPct:10},
 inputs:{'resale-buy-total':String(cost*qty),'resale-buy-qty':String(qty),
  'own-product-ad-budget':'300','own-product-ad-cpc':'3','own-product-ad-ctr':'2',
  'own-product-ad-click-lead':'20','own-product-ad-lead-sale':'50'}
});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,'got '+a+' expected '+b);
test('one wholesale line is one SKU; no manufacturing expense, scrap or production days',()=>{
 const x=resale(1,'Кофта',50,20),a=app([x]);
 assert.deepEqual(a.aggregateQuantityDetails(x),[]);
 close(a.allocatedMaterialCostPerGood(x),50);
 const cycle=a.aggregatePlanMetrics(x);
 close(cycle.productionTotal,0);
 close(cycle.productionDays,0);
 close(cycle.sellThroughDays,60);
 close(cycle.totalCycleDays,63);
 close(cycle.advanceAmount,500);
 assert.ok(cycle.requiredCapital>=1000);
 const result=a.calculateProductPortfolio();
 assert.equal(result.pricingReady,true);
 assert.ok(result.items[0].price>50);
 const list=a.calculatePriceListRange(x);
 assert.equal(list.ready,true);
 assert.ok(list.maxPrice>list.minPrice);
});
test('two different resale items never become one averaged material cost',()=>{
 const aItem=resale(1,'Кофта',50,20);
 const bItem=resale(2,'Куртка',210,8);
 bItem.forecastUnitsPerMonth=4;
 bItem.adBudget=120;
 bItem.inputs['own-product-ad-budget']='120';
 const e=app([aItem,bItem]),m=e.calculateProductPortfolio();
 assert.equal(m.pricingReady,true);
 assert.equal(m.items.length,2);
 close(e.allocatedMaterialCostPerGood(aItem),50);
 close(e.allocatedMaterialCostPerGood(bItem),210);
 assert.ok(m.items[1].unitCost>m.items[0].unitCost);
 assert.ok(m.items[1].price>m.items[0].price);
 close(m.items[0].cogs,m.items[0].unitCost*m.items[0].forecastSales);
 close(m.items[1].cogs,m.items[1].unitCost*m.items[1].forecastSales);
});
test('invalid or missing purchase values and oversold inventory invalidate pricing',()=>{
 const x=resale(1,'Кофта',50,20),a=app([x]);
 x.inputs['resale-buy-total']='';
 assert.ok(a.aggregateQuantityDetails(x).some(e=>e.kind==='materials'));
 assert.equal(a.calculateProductPortfolio().pricingReady,false);
 x.inputs['resale-buy-total']='1000';
 x.logisticsQty=21;
 assert.ok(a.aggregateQuantityDetails(x).some(e=>e.kind==='materials'));
 assert.equal(a.calculateProductPortfolio().pricingReady,false);
});
test('credit, tax and cash flow remain connected to finished-goods resale',()=>{
 const x=resale(1,'Кофта',50,20),e=app([x]);
 const cashPrice=e.calculateProductPortfolio().items[0].price;
 x.planning.fundingMode='credit';
 const credit=e.calculateAggregateCredit(x);
 assert.ok(credit.totalInterest>0);
 const m=e.calculateProductPortfolio();
 assert.equal(m.pricingReady,true);
 assert.ok(m.items[0].price>cashPrice);
 close(m.items[0].creditServicePerUnit,credit.totalInterest/20);
 close(m.tax,m.totalRevenue*.06);
 const flow=e.calculateProductCashFlow(m);
 assert.equal(flow.ready,true);
 close(flow.months.reduce((s,t)=>s+t.interestPaid,0),credit.totalInterest);
 close(flow.months.reduce((s,t)=>s+t.principalRepaid,0),credit.principal);
});
test('old detailed own-production branch retains its physical validation',()=>{
 const x=resale(1,'Моя футболка',30,10);
 x.source='own';
 x.productionQty=10;x.productionDefectPct=5;x.materialsBatchQty=9;
 assert.ok(app([x]).aggregateQuantityDetails(x).some(issue=>issue.message.includes('материала')));
});
