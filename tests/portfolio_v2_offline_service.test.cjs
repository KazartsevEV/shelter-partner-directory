const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../portfolio_v2_linked_engine.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<.001,a+' != '+b);
const service=()=>({id:'v1-service',name:'Маникюр с покрытием',source:'offline-service',
 unitCost:68,serviceMaterialsUnit:8,serviceElectricityUnit:0,serviceFixedMonthly:1200,
 serviceCapacity:50,forecastUnitsPerMonth:20,adBudget:1000,baseCac:50,
 priceMin:120,priceMax:400,maxDiscountPct:20,minimumMarginPct:10,targetMarginPct:30,
 salesFixedMonthly:0,adManagement:0,variableSalesPct:0,creditServiceMonthly:0,
 vatPct:0,inventoryQty:0,materialsBatchTotal:160,productionTotal:1200,reserveAmount:100});
const state=()=>E.fromV1({skus:[service()],tax:{type:'turnover',pct:6}});
test('salon V2 recomputes rent and master wage load when advertising changes bookings',()=>{
 const s=state(),baseline=E.build(s);
 assert.equal(baseline.ready,true,JSON.stringify(baseline.errors));
 near(baseline.items[0].forecastOrders,20);
 near(baseline.items[0].unitCostEffective,68);
 near(baseline.items[0].priceList,184.39);
 s.resources.push({id:'campaign',kind:'campaign',label:'Реклама',
   amount:2000,cadence:'monthly',pool:'adBudget',allocation:'usage',
   skuIds:['v1-service'],includedBySku:{'v1-service':1000},usage:{'v1-service':1}});
 const doubled=E.build(s);assert.equal(doubled.ready,true,JSON.stringify(doubled.errors));
 near(doubled.items[0].forecastOrders,40);
 near(doubled.items[0].unitCostEffective,38);
 near(doubled.items[0].priceList,137.51);
 assert.ok(doubled.cashflow.ownerCapital>0);
 assert.ok(doubled.invariants.mediaConserved);
});
test('master-room capacity forbids excess appointments regardless of profitable projected price',()=>{
 const s=state();s.skus[0].serviceCapacity=15;
 const bad=E.build(s);assert.equal(bad.ready,false);
 assert.ok(bad.errors.some(x=>x.includes('Прогноз клиентов')));
 assert.equal(bad.cashflow,undefined);
});
test('shared salon rent is charged once in portfolio price AND cashflow',()=>{
 const s=state(),baseline=E.build(s);
 s.resources.push({id:'rent',kind:'premises',label:'Общий салон',
  amount:1000,cadence:'monthly',pool:'unitCost',cashOrigin:'production',allocation:'usage',
  skuIds:['v1-service'],includedBySku:{'v1-service':1200},usage:{'v1-service':1}});
 const real=E.build(s);assert.equal(real.ready,true,JSON.stringify(real.errors));
 near(real.items[0].unitCostEffective,8);
 near(real.totals.monthlyResources,1000);
 near(real.totals.netProfit-baseline.totals.netProfit,200);
 near(real.cashflow.freeCash-real.cashflow.ownerCapital+real.cashflow.reserve,real.totals.netProfit);
});
test('offline service can coexist with product SKU in linked V2 without stock requirement for services',()=>{
 const s=state();
 s.skus.push({id:'v1-product',name:'Масло для ногтей',source:'resale',
  unitCost:10,forecastUnitsPerMonth:5,adBudget:50,baseCac:10,priceMin:40,priceMax:100,
  maxDiscountPct:10,minimumMarginPct:10,targetMarginPct:30,salesFixedMonthly:0,adManagement:0,
  variableSalesPct:0,creditServiceMonthly:0,vatPct:0,inventoryQty:5,
  materialsBatchTotal:50,productionTotal:0,reserveAmount:5});
 const x=E.build(s);assert.equal(x.ready,true,JSON.stringify(x.errors));
 assert.equal(x.items.length,2);
 near(x.items.reduce((v,i)=>v+i.revenueWeight,0),1);
});
