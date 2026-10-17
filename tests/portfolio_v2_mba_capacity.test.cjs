const {test}=require('node:test'),A=require('node:assert/strict'),E=require('../portfolio_v2_linked_engine.js');
const close=(a,b,label)=>A.ok(Math.abs(a-b)<1e-6,label+': '+a+' vs '+b);
function fixture(){
 const x=E.fromV1({tax:{type:'turnover',pct:0},skus:[
  {id:'a',name:'Товар',source:'own',unitCost:20,forecastUnitsPerMonth:10,
   adBudget:100,baseCac:10,priceMin:100,priceMax:500,maxDiscountPct:10,
   minimumMarginPct:10,targetMarginPct:20,salesFixedMonthly:0,adManagement:0,
   variableSalesPct:0,creditServiceMonthly:0,vatPct:0,inventoryQty:15,
   materialsBatchTotal:300,productionTotal:0,reserveAmount:0},
  {id:'s',name:'Сервис',source:'offline-service',unitCost:20,
   serviceMaterialsUnit:12,serviceElectricityUnit:0,serviceFixedMonthly:80,serviceCapacity:30,
   forecastUnitsPerMonth:10,adBudget:100,baseCac:10,priceMin:100,priceMax:500,
   maxDiscountPct:10,minimumMarginPct:10,targetMarginPct:20,
   salesFixedMonthly:0,adManagement:0,variableSalesPct:0,creditServiceMonthly:0,
   vatPct:0,inventoryQty:0,materialsBatchTotal:120,productionTotal:80,reserveAmount:0}
 ]});
 x.resources=[{id:'worker',kind:'workers',label:'Мастер',amount:100,
   cadence:'monthly',pool:'none',allocation:'usage',usageMode:'per-unit',
   skuIds:['a','s'],usage:{},loadPerUnit:{a:1,s:2},
   capacity:35,includedBySku:{}}];
 return x;
}
test('MBA combined transactions consume dynamic worker capacity, not standalone V1 forecast',()=>{
 const x=fixture(),baseline=E.build(x);
 A.equal(baseline.ready,true,JSON.stringify(baseline.errors));
 close(baseline.resources[0].projectedLoad,30,'10 goods + 20 treatments');
 close(baseline.resources[0].bySku.a,100/3,'one resource 1/3');
 close(baseline.resources[0].bySku.s,200/3,'one resource 2/3');
 x.offers=[{id:'b',mode:'bundle',anchorSkuId:'a',attachPct:50,overlapPct:0,
   bundleDiscountPct:0,items:[{skuId:'s',qty:1}]}];
 const result=E.build(x);A.equal(result.ready,false);
 A.ok(result.errors.some(e=>e.includes('Связанные покупки требуют')));
 close(result.resources[0].projectedLoad,40,'10 A + 15 services * 2');
 x.resources[0].capacity=40;const good=E.build(x);
 A.equal(good.ready,true,JSON.stringify(good.errors));
 close(good.resources[0].projectedLoad,40,'exact ceiling');
 close(good.resources[0].remainingCapacity,0,'no remaining worker hours');
 close(good.resources[0].bySku.a,25,'allocation equals actual load');
 close(good.resources[0].bySku.s,75,'allocation equals actual load');
 close(good.totals.monthlyResources,100,'shared worker billed once, not twice');
 close(good.cashflow.months.reduce((t,m)=>t+m.receipt,0),good.totals.revenue,'cash equals revenue');
});
test('capacity reacts to cross-sell ratios and tuple quantities',()=>{
 const x=fixture();x.resources[0].capacity=50;
 x.offers=[{id:'x',mode:'cross_sell',anchorSkuId:'a',attachPct:50,overlapPct:0,
  items:[{skuId:'s',qty:2}]}];
 const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 close(r.items[1].forecastOrders,20,'10 baseline + 10 attached');
 close(r.resources[0].projectedLoad,50,'10 goods + 40 service resource');
 x.offers[0].items[0].qty=3;
 const invalid=E.build(x);A.equal(invalid.ready,false);
 A.ok(invalid.errors.some(e=>e.includes('Связанные покупки требуют')));
});
test('negative/missing input is not coerced into phantom capacity or extra allocations',()=>{
 const x=fixture();
 x.resources[0].loadPerUnit.s=-2;let r=E.build(x);
 A.equal(r.ready,false);A.ok(r.errors.some(e=>e.includes('Норма ресурса')));
 x.resources[0].loadPerUnit.s=0;x.resources[0].loadPerUnit.a=0;
 r=E.build(x);A.equal(r.ready,false);
 A.ok(r.errors.some(e=>e.includes('хотя бы для одной позиции')));
 x.resources[0].loadPerUnit.a=1;
 x.resources[0].kind='warehouse';
 r=E.build(x);A.equal(r.ready,false);
 A.ok(r.errors.some(e=>e.includes('Загрузка на единицу')));
});
test('legacy manual usage continues to have identical meaning; no resource double billing',()=>{
 const x=fixture();x.resources[0].usageMode='fixed';
 x.resources[0].usage={a:10,s:20};
 x.resources[0].capacity=30;
 const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 close(r.resources[0].bySku.a,100/3,'manual old allocation');
 close(r.resources[0].bySku.s,200/3,'manual old allocation');
 x.resources[0].usage.s=21;
 const over=E.build(x);A.equal(over.ready,false);
 A.ok(over.errors.some(e=>e.includes('Загрузка общего ресурса')));
});
