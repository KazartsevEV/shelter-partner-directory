// #31B: source-faithful V1 versus linked V2 bank-ledger reconciliation.
// Keep independent financial accounting definitions. Never compare different list prices.
const {test}=require('node:test');
const A=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../portfolio_v2_linked_engine.js');
const html=fs.readFileSync(path.join(__dirname,'..','Marketing_calc.HTML'),'utf8');
function between(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a);
 A.ok(a>=0&&b>a,'V1 API changed: '+start);
 return html.slice(a,b);
}
const source=[
 between('function aggregateQuantityDetails(item) {','function calculateProductPortfolio() {'),
 between('function calculateProductPortfolio() {','function aggregatePricingMetrics(item) {'),
 between('function calculateAggregateCredit(item) {','function updateAggregateCredit(item) {'),
 between('function calculateProductCashFlow(model) {','function updatePriceListRange(item) {')
].join('\n');
const constructV1=new Function('productPortfolio','productBusinessTaxType','productNumber',
 'aggregatePricingMetrics',source+
 ';return {calculateProductPortfolio,aggregatePlanMetrics,calculateAggregateCredit,calculateProductCashFlow};');
function close(a,b,what,epsilon=.012){
 A.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=epsilon,
  what+': V1='+a+' V2='+b+' Δ='+(a-b));
}
function fixture(stock,options={}){
 const monthly=options.monthly||20,supply=options.supply||0,prodDays=options.prodDays||0;
 const salary=options.fixed||0,mgmt=options.manager||0,storage=options.storage||0;
 const commission=options.commission||0,deliveryPct=options.delivery||0;
 const prodUnit=options.prodUnit??3,rawUnit=20;
 const priceDelivery=(rawUnit+prodUnit)*deliveryPct/100;
 const interestMonths=options.term||0;
 const input={
  id:1,name:'Parity owned goods',source:'own',
  materialsBatchQty:stock,materialsBatchTotal:rawUnit*stock,materialsUnitCost:rawUnit,
  productionQty:stock,productionTotal:prodUnit*stock,productionUnitCost:prodUnit,
  productionDefectPct:0,logisticsQty:stock,logisticsUnitCost:priceDelivery,
  warehouseInboundUnitCost:0,warehouseDayCost:storage,warehouseStorageUnitCost:0,
  customerDeliveryPct:deliveryPct,customerReturnPct:0,
  salesQty:stock,salesFixedMonthly:salary,salesVariablePct:commission,
  penaltiesPct:0,forecastUnitsPerMonth:monthly,adBudget:100,adManagement:mgmt,
  planning:{supplyDays:supply,advancePct:options.advancePct||0,
   advanceLeadDays:options.advanceLeadDays??supply,productionDays:prodDays,
   reservePct:options.reservePct||0,
   fundingMode:interestMonths?'credit':'cash',
   targetMarginPct:25,maxDiscountPct:0,minimumMarginPct:10,
   creditRatePct:12,creditTermMonths:interestMonths||6},
  inputs:{'own-product-ad-budget':100,'own-product-ad-cpc':5,
   'own-product-ad-ctr':2,'own-product-ad-click-lead':100,
   'own-product-ad-lead-sale':100,'own-product-ad-management':mgmt}
 };
 return input;
}
function run(stock,options={}){
 const input=fixture(stock,options);
 const tax=5;
 const app=constructV1([input],'turnover',
  id=>id==='own-business-tax-pct'?tax:0,
  ()=>({salesVatChoice:'no',vatReady:true,vatPct:0}));
 const model=app.calculateProductPortfolio();
 A.equal(model.pricingReady,true,'V1 inputs must be fully valid');
 const row=model.items[0],cycle=app.aggregatePlanMetrics(input),
  credit=app.calculateAggregateCredit(input),onCredit=!!options.term;
 const linked=E.fromV1({tax:{type:'turnover',pct:tax},skus:[{
  id:'v1-'+input.id,name:input.name,source:input.source,
  unitCost:row.unitCost,forecastUnitsPerMonth:row.forecastSales,
  adBudget:row.adBudget,baseCac:row.baseCac,
  priceMin:1,priceMax:500,maxDiscountPct:0,minimumMarginPct:10,targetMarginPct:25,
  salesFixedMonthly:input.salesFixedMonthly,adManagement:input.adManagement,
  variableSalesPct:input.salesVariablePct+input.penaltiesPct,
  creditServiceMonthly:onCredit?credit.monthlyServiceCost:0,
  creditPrincipal:onCredit?credit.principal:0,creditMonths:onCredit?credit.termMonths:0,
  reserveAmount:cycle.reserveAmount,inventoryQty:input.logisticsQty,
  materialsBatchTotal:input.materialsBatchTotal,productionTotal:input.productionTotal,
  warehouseInboundUnitCost:input.warehouseInboundUnitCost,
  warehouseDayCost:input.warehouseDayCost,
  supplyDays:input.planning.supplyDays,advancePct:input.planning.advancePct,
  advanceLeadDays:input.planning.advanceLeadDays,
  productionDays:input.planning.productionDays,vatPct:0
 }]});
 const v2=E.build(linked);
 A.equal(v2.ready,true,JSON.stringify(v2.errors));
 // V1 uses its own baseline price and a turnover-tax price multiplier.
 // Match the *actual net buyer receipt* from linked V2 without changing
 // the tax/commission/sales schedule or either cashflow implementation.
 model.items[0].price=v2.items[0].priceNet/model.taxPriceMultiplier;
 const v1=app.calculateProductCashFlow(model),cf=v2.cashflow;
 A.equal(v1.ready,true);
 A.equal(v1.months.length,cf.months.length,
  'Same physical sell-through + loan horizon');
 const sum=(rows,fn)=>rows.reduce((v,m)=>v+fn(m),0);
 for(let i=0;i<v1.months.length;i++){
  const a=v1.months[i],b=cf.months[i];
  close(a.inflow-a.financedInflow,b.receipt,'m'+(i+1)+' sales receipts');
  close(a.taxPaid,b.tax,'m'+(i+1)+' tax remittance');
  close(a.interestPaid,b.interest,'m'+(i+1)+' credit interest');
  close(a.principalRepaid,b.principalRepaid,'m'+(i+1)+' bullet principal');
  // Owner contributions deliberately excluded: V1 finances full planned
  // budget, V2 chooses worst-day cash deficit and may have debt.
  close(a.inflow-a.financedInflow-a.outflow,
        b.cashFlow-b.loanDraw,'m'+(i+1)+' unfinanced net cash');
 }
 close(sum(v1.months,m=>m.inflow-m.financedInflow),
       sum(cf.months,m=>m.receipt),'whole cycle receipts');
 close(sum(v1.months,m=>m.outflow),
       sum(cf.months,m=>m.operatingOutflow+m.tax+m.interest+m.principalRepaid),
       'whole cycle payments');
 if(onCredit){
  close(sum(cf.months,m=>m.interest),credit.totalInterest,'whole loan interest');
  close(sum(cf.months,m=>m.principalRepaid),credit.principal,'loan principal');
 }
 // Pricing/financing policies not required to agree: explicitly check
 // origin of the difference, rather than comparing biased "final cash".
 close(v1.months[0].financedInflow,cycle.requiredCapital,
  'V1 pre-financed total planned capital');
 close(cf.startupCapital,cf.ownerCapital+cf.borrowedCapital,'V2 funding identity');
 return {v1,cf,v2,cycle};
}
for(const stock of [20,60,100,200]){
 test('#31B equal-price V1/V2 single stock '+stock+' sold at 20/month',()=>{
  const {cf}=run(stock);A.equal(cf.months.length,stock/20);
 });
}
test('#31B multi-month advances/production/warehouse/storage/fees/fixed expenses',()=>{
 const {cf}=run(100,{supply:40,advancePct:50,advanceLeadDays:35,
  prodDays:15,storage:.5,commission:10,delivery:8,fixed:150,manager:40,reservePct:10});
 A.ok(cf.months.length>=7);
});
for(const term of [1,3,6,12]){
 test('#31B credit term '+term+' months conserves interest/principal at equal price',()=>{
  run(100,{term,commission:8,storage:.2,manager:15});
 });
}
