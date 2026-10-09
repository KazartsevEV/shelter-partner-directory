const {test}=require('node:test');
const A=require('node:assert/strict');
const E=require('../portfolio_v2_linked_engine.js');
const eq=(a,b)=>A.ok(Math.abs(a-b)<.00001, a+' ≠ '+b);
function sample(){return E.fromV1({tax:{type:'turnover',pct:3},skus:[
{id:'a',name:'Shirt',source:'own',unitCost:30,forecastUnitsPerMonth:25,adBudget:250,baseCac:10,priceMin:90,priceMax:180,maxDiscountPct:20,minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:200,adManagement:100,variableSalesPct:5,creditServiceMonthly:0,vatPct:0,inventoryQty:25,materialsBatchTotal:500,productionTotal:125,reserveAmount:100},
{id:'b',name:'Bag',source:'dropship',unitCost:20,forecastUnitsPerMonth:20,adBudget:200,baseCac:10,priceMin:80,priceMax:170,maxDiscountPct:15,minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:200,adManagement:100,variableSalesPct:3,creditServiceMonthly:0,vatPct:0,inventoryQty:0,dropshipDeliveryDays:12,dropshipPayoutLagDays:5,dropshipPayoutMode:'after',reserveAmount:80}]})}
const common=(kind,amount,pool='none')=>({id:'r-'+kind,kind,label:kind,amount,cadence:'monthly',pool,allocation:'revenue',skuIds:['a','b'],includedBySku:{},usage:{}});
test('prices automatic inside V1 bounds; monetary weight sums to one',()=>{
const x=sample();x.skus[0].priceSelected=9000;const r=E.build(x);
A.equal(r.ready,true,JSON.stringify(r.errors));
A.ok(r.items.every(s=>s.priceList>=s.priceMin&&s.priceList<=s.priceMax));
A.ok(r.items.every(s=>s.targetMarginMet));A.ok(r.items[0].priceList<9000);
eq(r.items.reduce((a,s)=>a+s.revenueWeight,0),1);
});
test('shared worker paid once and V1 duplicated salary removed',()=>{
const x=sample(),baseline=E.build(x);const r=common('salesStaff',200,'salesFixed');
r.includedBySku={a:200,b:200};x.resources.push(r);
const y=E.build(x);A.equal(y.ready,true,JSON.stringify(y.errors));
eq(y.totals.netProfit-baseline.totals.netProfit,200);eq(y.totals.monthlyResources,200);
A.ok(y.invariants.resourcesConserved);
});
test('campaign amount conserved and changes monetary-weight demand',()=>{
const x=sample(),r=common('campaign',360,'adBudget');
r.includedBySku={a:250,b:200};x.resources.push(r);x.skus[0].inventoryQty=100;
const y=E.build(x);A.equal(y.ready,true,JSON.stringify(y.errors));
eq(y.totals.media,360);eq(y.totals.forecast,36);eq(y.items.reduce((a,s)=>a+s.adBudgetEffective,0),360);
x.skus[0].discountSelected=20;const z=E.build(x);A.equal(z.ready,true,JSON.stringify(z.errors));
A.ok(z.items.some((s,i)=>Math.abs(s.revenueWeight-y.items[i].revenueWeight)>1e-6));
});
test('discount capped and formula gives customer final price',()=>{
const x=sample();x.skus[0].discountSelected=15;const y=E.build(x);
A.equal(y.ready,true,JSON.stringify(y.errors));eq(y.items[0].priceGross,y.items[0].priceList*.85);
x.skus[0].discountSelected=21;A.equal(E.build(x).ready,false);
});
test('price impossible inside range and stock shortage are explicit, not fake green',()=>{
const x=sample();x.skus[0].priceMin=35;x.skus[0].priceMax=40;let y=E.build(x);A.equal(y.ready,false);
A.ok(y.errors.some(e=>e.includes('минимум рентабельности')));A.equal(y.cashflow,undefined);
x.skus[0].priceMin=90;x.skus[0].priceMax=180;x.skus[0].inventoryQty=5;y=E.build(x);
A.equal(y.ready,false);A.ok(y.errors.some(e=>e.includes('превышает запас V1')));
});
test('certificate cannot cover several SKUs without coverage and capacity',()=>{
const x=sample(),r=common('certification',120);r.cadence='once';r.allocation='usage';
r.usage={a:60,b:50};r.capacity=100;x.resources.push(r);
let y=E.build(x);A.equal(y.ready,false);A.ok(y.errors.some(e=>e.includes('мощность')));
r.capacity=110;r.validFor='Georgia: clothes and bags';r.validUntil='2099-12-31';r.confirmedCoverage=true;
A.equal(E.build(x).ready,true);
});
test('mixed cashflow uses daily peak, accrual profit and delayed receipt',()=>{
const x=sample(),r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
const f=r.cashflow;A.ok(f.ownerCapital>f.reserve);A.ok(f.months.length>=2);
eq(f.startupCapital,f.ownerCapital+f.borrowedCapital);
eq(f.months.reduce((a,m)=>a+m.receipt,0),r.totals.revenue);
eq(f.freeCash-f.ownerCapital+f.reserve,r.totals.netProfit);
});
test('credit draw and bullet body repayment from V1 remain finance, not EBITDA',()=>{
const x=sample();x.skus[0].creditPrincipal=600;x.skus[0].creditMonths=3;x.skus[0].creditServiceMonthly=6;
const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
eq(r.cashflow.borrowedCapital,600);eq(r.cashflow.months.reduce((v,m)=>v+m.principalRepaid,0),600);
eq(r.cashflow.months.reduce((v,m)=>v+m.interest,0),18);
});