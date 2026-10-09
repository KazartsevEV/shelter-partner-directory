const {test}=require('node:test');
const A=require('node:assert/strict');
const E=require('../portfolio_v2_linked_engine.js');
const P=require('../portfolio_v2_temporal.js');
const close=(x,y,message)=>A.ok(Number.isFinite(x)&&Math.abs(x-y)<1e-8,message+': '+x+' vs '+y);
const sku=(id,stock,source='resale')=>({
 id,name:id,source,unitCost:20,forecastUnitsPerMonth:20,adBudget:100,
 baseCac:5,priceMin:20,priceMax:150,maxDiscountPct:0,minimumMarginPct:10,
 targetMarginPct:25,salesFixedMonthly:0,adManagement:0,variableSalesPct:0,
 creditServiceMonthly:0,creditPrincipal:0,creditMonths:0,vatPct:0,
 inventoryQty:stock,materialsBatchTotal:stock*20,productionTotal:0,
 reserveAmount:0,serviceCapacity:40,serviceMaterialsUnit:20,serviceElectricityUnit:0,
 serviceFixedMonthly:0
});
const basket=(mode='bundle')=>({
 id:'offer',mode,anchorSkuId:'A',attachPct:50,overlapPct:0,
 bundleDiscountPct:mode==='bundle'?10:0,items:[{skuId:'B',qty:1}]
});
const state=(a=60,b=100)=>E.fromV1({tax:{type:'turnover',pct:5},skus:[sku('A',a),sku('B',b)]});
const plan=(s)=>P.plan(s,Object.fromEntries(s.skus.map(x=>[x.id,x.forecastUnitsPerMonth])),E.projectOffers);
test('#31E explicit opt-in required; never extrapolate V1 unapproved',()=>{
 const x=state();x.forecastMonths=3;
 let y=plan(x);A.equal(y.ready,false);A.match(y.errors.join(' '),/Подтвердите/);
 x.recurringDemandApproved=true;y=plan(x);A.equal(y.ready,true,JSON.stringify(y.errors));
 A.equal(y.months.length,3);
});
test('#31E bundle consumes physical children exactly once, discounts only available components',()=>{
 const x=state();x.forecastMonths=5;x.recurringDemandApproved=true;x.offers=[basket()];
 const r=plan(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 A.deepEqual(r.months.map(m=>m.orders.A),[20,20,20,0,0]);
 A.deepEqual(r.months.map(m=>m.orders.B),[30,30,30,10,0]);
 A.deepEqual(r.months.map(m=>m.remainingStock.B),[70,40,10,0,0]);
 close(r.months.reduce((v,m)=>v+m.orders.B,0),100,'stock conserved');
 close(r.months.reduce((v,m)=>v+(m.discountedUnits.B||0),0),3,
   'three months x ten children x 10% discount exposure');
});
test('#31E stock shortage blocks basket rather than inventing or silently overselling child',()=>{
 const x=state(60,20);x.forecastMonths=3;x.recurringDemandApproved=true;x.offers=[basket()];
 const r=plan(x);A.equal(r.ready,false);
 A.match(r.errors.join(' '),/Месяц 1.*превышает оставшийся запас/);
});
test('#31E upsell anchored in sold-out stock stops, base cannot amplify recursively',()=>{
 const x=state(20,100);x.forecastMonths=3;x.recurringDemandApproved=true;
 x.offers=[basket('upsell')];const r=plan(x);
 A.equal(r.ready,true,JSON.stringify(r.errors));
 A.deepEqual(r.months.map(m=>m.orders.A),[10,0,0]);
 A.deepEqual(r.months.map(m=>m.orders.B),[30,20,20]);
});
test('#31E offline service monthly capacity cannot be exceeded by cross-sell',()=>{
 const x=state(60,0);x.skus[1]=sku('B',0,'offline-service');
 x.skus[1].serviceCapacity=25;
 x.forecastMonths=2;x.recurringDemandApproved=true;x.offers=[basket('cross_sell')];
 const r=plan(x);
 A.equal(r.ready,false);A.match(r.errors.join(' '),/Месяц 1.*мощности 25/);
 x.skus[1].serviceCapacity=30;
 const fixed=plan(x);A.equal(fixed.ready,true,JSON.stringify(fixed.errors));
});
test('#31E shared per-unit worker capacity checked in EACH forecast month',()=>{
 const x=state();x.forecastMonths=3;x.recurringDemandApproved=true;x.offers=[basket('bundle')];
 x.resources=[{id:'worker',label:'Team',kind:'workers',usageMode:'per-unit',
  capacity:50,loadPerUnit:{A:1,B:2},skuIds:['A','B']}];
 const result=plan(x);A.equal(result.ready,false);
 A.match(result.errors.join(' '),/Месяц 1.*ресурс/);
 x.resources[0].capacity=80;
 A.equal(plan(x).ready,true);
});
test('#31E midmonth physical supply reduces first-month demand, no fictional backorders',()=>{
 const x=state(60,100);x.forecastMonths=3;x.recurringDemandApproved=true;
 x.skus[0].supplyDays=15;
 const r=plan(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 A.deepEqual(r.months.map(m=>m.orders.A),[10,20,20]);
 A.deepEqual(r.months.map(m=>m.remainingStock.A),[50,30,10]);
});
test('#31E online contract cannot be repeated beyond verified V1 source period',()=>{
 const x=state(100,0);x.skus[1]=sku('B',0,'online-service');
 x.skus[1].onlineProvenance={periodMonths:1};
 x.forecastMonths=3;x.recurringDemandApproved=true;
 const r=plan(x);A.equal(r.ready,false);A.match(r.errors.join(' '),/период V1 не подтверждает/);
 x.skus[1].onlineProvenance.periodMonths=3;
 A.equal(plan(x).ready,true);
});
test('#31E invalid horizon is rejected without cash estimates',()=>{
 const x=state();x.forecastMonths=121;x.recurringDemandApproved=true;
 const r=plan(x);A.equal(r.ready,false);A.equal(r.months.length,0);
});
