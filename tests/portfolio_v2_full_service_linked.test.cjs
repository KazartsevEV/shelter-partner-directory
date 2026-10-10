'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict');
const Full=require('../portfolio_v2_full_service.js');
const Linked=require('../portfolio_v2_linked_engine.js');
const close=(a,b,label,tol=.015)=>A.ok(Number.isFinite(a)&&Math.abs(a-b)<tol,
 label+': '+a+' vs '+b);
const base={months:3,monthlyForecast:200,capacity:250,priceGross:100,vatPct:12,
 discountPct:0,unitCashCost:8,commissionPct:0,fixedCashMonthly:10000,
 equipmentPurchase:0,equipmentAmortMonthly:0,taxType:'profit',taxPct:10,
 reservePct:10,funding:'own'};
const sku=(input,kind='offline',id='svc')=>Full.toPortfolioSku(input,{id,name:'Service '+id,kind});
const state=(rows,months=3,taxType='profit')=>{
 const s=Linked.fromV1({tax:{type:taxType,pct:10},skus:rows});
 s.forecastMonths=months;s.recurringDemandApproved=true;
 return s;
};
const product=()=>({id:'good',name:'Goods',source:'resale',
 fixedPriceFromV1:true,unitCost:10,forecastUnitsPerMonth:10,
 adBudget:0,baseCac:0,priceMin:100,priceMax:100,vatPct:12,
 maxDiscountPct:0,minimumMarginPct:0,targetMarginPct:0,
 salesFixedMonthly:0,adManagement:0,variableSalesPct:0,
 inventoryQty:10,materialsBatchTotal:100,productionTotal:0,reserveAmount:0});
test('TZ02 full offline V2 shares N=3 exact tax/VAT/net cash with pure full-service',()=>{
 const simple=Full.build(base),s=state([sku(base)]);
 const r=Linked.build(s);A.equal(r.ready,true,JSON.stringify(r.errors));
 A.equal(r.cashflow.periodPnl.months.length,3);
 for(let i=0;i<3;i++){
  close(r.cashflow.periodPnl.months[i].revenue,simple.months[i].revenue,'net receipts');
  close(r.cashflow.periodPnl.months[i].taxAccrued,simple.months[i].tax,'tax accrual');
  close(r.cashflow.periodPnl.months[i].netProfit,simple.months[i].profit,'profit');
  close(r.cashflow.months[i].tax,simple.months[i].tax,'cash tax');
 }
 close(r.cashflow.ownerCapital,simple.capital,'own capital includes reserved liquidity');
 close(r.cashflow.reserve,simple.reserve,'same reserve');
 close(r.cashflow.finalCash,simple.cashOnHand,'same final cash');
});
test('TZ02 full online joins enterprise profit-tax base, not legacy turnover bucket',()=>{
 const input={...base,equipmentPurchase:3000,equipmentAmortMonthly:250};
 const model=Full.build(input),r=Linked.build(state([sku(input,'online')]));
 A.equal(r.ready,true,JSON.stringify(r.errors));
 for(let i=0;i<3;i++){
  close(r.cashflow.periodPnl.months[i].taxAccrued,model.months[i].tax,'online profit tax');
  close(r.cashflow.periodPnl.months[i].amort,250,'online accrued amort');
  close(r.cashflow.periodPnl.months[i].netProfit,model.months[i].profit,'online accounting');
 }
 close(r.cashflow.months[0].stockPurchase,3000,'only initial CAPEX');
 close(r.cashflow.months[1].stockPurchase,0,'no further equipment cash');
 close(r.cashflow.finalCash,model.cashOnHand,'end cash online');
});
test('TZ02 full bullet loan leaves principal OUTSIDE 2-month horizon, matches interest',()=>{
 const x={...base,months:2,funding:'credit',annualRatePct:24,creditMonths:12};
 const model=Full.build(x),r=Linked.build(state([sku(x)],2));
 A.equal(r.ready,true,JSON.stringify(r.errors));
 A.equal(r.cashflow.months.length,2,'no forced loan-maturity month');
 close(r.cashflow.borrowedCapital,model.capital,'bullet borrowed at day zero');
 close(r.cashflow.outstandingPrincipal,model.capital,'debt remains after N');
 close(r.cashflow.months[0].interest,model.months[0].interest,'interest 1');
 close(r.cashflow.months[1].interest,model.months[1].interest,'interest 2');
 A.equal(r.cashflow.months.reduce((n,m)=>n+m.principalRepaid,0),0);
 A.equal(r.cashflow.ownerCapital,0,'loan already finances its reserve');
});
test('TZ02 shared premises paid once, replacing embedded offline fixed cost',()=>{
 const x={...base,vatPct:0},s=state([sku(x),product()]);
 s.resources.push({id:'room',label:'Shared room',kind:'premises',
   amount:1000,cadence:'monthly',pool:'unitCost',cashOrigin:'production',
   allocation:'usage',usage:{svc:1,good:1},
   skuIds:['svc','good'],includedBySku:{svc:2000}});
 const r=Linked.build(s);A.equal(r.ready,true,JSON.stringify(r.errors));
 for(let i=0;i<3;i++){
  close(r.cashflow.months[i].shared,1000,'shared rent once month '+i);
  close(r.cashflow.periodPnl.months[i].serviceFixed,8000,'original 10000 minus 2000');
 }
 close(r.cashflow.months[0].stockPurchase,8100,'goods purchase 100 and adjusted rent 8000');
 const c=r.cashflow.periodPnl;
 close(Object.values(c.bySku).reduce((z,v)=>z+v.netProfit,0),c.netProfit,'by-SKU PnL');
});
test('TZ02 fail closed on mismatched owner tax and excess service capacity',()=>{
 const x={...base};
 const invalid=state([sku(x)],3,'turnover'),r=Linked.build(invalid);
 A.equal(r.ready,false);A.match(r.errors.join(' '),/единый налоговый режим/);
 const small=state([sku({...x,monthlyForecast:5,capacity:5})],3);
 small.offers=[];small.skus[0].serviceCapacity=4;
 const capacity=Linked.build(small);
 A.equal(capacity.ready,false);
 A.match(capacity.errors.join(' '),/Прогноз клиентов|посещени|мощност/);
});
test('TZ02 full service monthly forecast vector follows N without retroactive rewriting',()=>{
 const input={...base,months:3,monthlyForecast:[5,7,9],capacity:15};
 const r=Linked.build(state([sku(input)]));
 A.equal(r.ready,true,JSON.stringify(r.errors));
 A.deepEqual(r.temporal.months.map(m=>m.orders.svc),[5,7,9]);
});

test('TZ02 two FULL services pool one premises payment exactly once across 3 months',()=>{
 const v={...base,vatPct:0};
 const a=sku(v,'offline','svc'),b=sku(v,'offline','svc2'),s=state([a,b]);
 s.resources.push({id:'one-room',kind:'premises',label:'One room',
   cadence:'monthly',amount:1000,pool:'none',
   poolBySku:{svc:'unitCost',svc2:'unitCost'},
   cashOriginBySku:{svc:'production',svc2:'production'},
   allocation:'usage',skuIds:['svc','svc2'],usage:{svc:1,svc2:1},
   includedBySku:{svc:1000,svc2:1000}});
 const r=Linked.build(s);A.equal(r.ready,true,JSON.stringify(r.errors));
 const month=r.cashflow.periodPnl.months[0],cash=r.cashflow.months[0];
 close(month.revenue,40000,'two full service net revenue');
 close(month.cogs,3200,'consumables only accrued as COGS');
 close(month.serviceFixed,18000,'two original fixed minus two embedded amounts');
 close(month.operatingShared,1000,'only one shared rent');
 close(month.taxAccrued,1780,'enterprise profit tax after pooled costs');
 close(month.netProfit,16020,'portfolio profit after tax');
 close(cash.stockPurchase,18000,'both fixed cash paid day zero');
 close(cash.shared,1000,'shared room paid just once');
 close(r.cashflow.reserve,2220,'10% reserve against REAL pooled expenses');
 close(r.cashflow.ownerCapital,21220,'pooled reserve reduces required startup capital');
 for(let m=0;m<3;m++)
   close(r.cashflow.months[m].shared,1000,'no extra rent month '+m);
});
test('TZ02 per-source pool moves SAME rent from offline COGS and online salesFixed',()=>{
 const v={...base,vatPct:0};
 const a=sku(v,'offline','off'),b=sku(v,'online','on'),s=state([a,b]);
 s.resources.push({id:'office',kind:'premises',label:'Shared office',
   cadence:'monthly',amount:1000,pool:'none',poolBySku:{off:'unitCost',on:'salesFixed'},
   cashOriginBySku:{off:'production'},
   allocation:'usage',skuIds:['off','on'],usage:{off:1,on:1},
   includedBySku:{off:1000,on:1000}});
 const r=Linked.build(s);A.equal(r.ready,true,JSON.stringify(r.errors));
 const m=r.cashflow.periodPnl.months[0];
 close(m.revenue,40000,'full online and offline revenue');
 close(m.serviceFixed,9000,'offline adjusted fixed');
 close(m.operatingShared,10000,'online adjusted 9000 + shared room 1000');
 close(m.taxAccrued,1780,'one business profit-tax base');
 close(m.netProfit,16020,'no double rent across online and offline');
 close(r.cashflow.months[0].shared,10000,'online fixed + one shared room cash');
 A.equal(r.cashflow.periodPnl.bySku.off.taxAccrued>=0,true);
 A.equal(r.cashflow.periodPnl.bySku.on.taxAccrued>=0,true);
 close(Object.values(r.cashflow.periodPnl.bySku).reduce((a,b)=>a+b.netProfit,0),
   r.cashflow.periodPnl.netProfit,'per-SKU mixed profit conservation');
});
