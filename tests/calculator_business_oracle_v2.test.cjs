/* External arithmetic oracles for mixed V2 portfolio.
   Expected amounts are computed from physical units and contract rates,
   not derived by summing V2's precomputed COGS/profit figures. */
const {test}=require('node:test');
const A=require('node:assert/strict');
const E=require('../portfolio_v2_linked_engine.js');
const close=(a,b,name,tol=.011)=>A.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,
 name+': got '+a+', independently expected '+b);
const fixture=()=>E.fromV1({tax:{type:'turnover',pct:0},skus:[
 {id:'salon',name:'Маникюр',source:'offline-service',
  unitCost:35,serviceMaterialsUnit:5,serviceElectricityUnit:0,serviceFixedMonthly:300,
  serviceCapacity:30,forecastUnitsPerMonth:10,adBudget:100,baseCac:10,
  priceMin:80,priceMax:180,maxDiscountPct:20,minimumMarginPct:10,targetMarginPct:20,
  salesFixedMonthly:0,adManagement:0,variableSalesPct:0,creditServiceMonthly:0,
  vatPct:0,inventoryQty:0,materialsBatchTotal:50,productionTotal:300,reserveAmount:0},
 {id:'cream',name:'Крем',source:'dropship',unitCost:20,
  forecastUnitsPerMonth:10,adBudget:100,baseCac:10,priceMin:80,priceMax:120,
  maxDiscountPct:20,minimumMarginPct:10,targetMarginPct:20,
  salesFixedMonthly:0,adManagement:0,variableSalesPct:0,creditServiceMonthly:0,
  vatPct:0,inventoryQty:0,dropshipDeliveryDays:0,dropshipPayoutLagDays:0,
  dropshipPayoutMode:'before',reserveAmount:0}
]});
function model(x){const out=E.build(x);A.equal(out.ready,true,JSON.stringify(out.errors));return out;}
function independentlyExpected(out,units,prices,otherCosts=0){
 const revenue=units.salon*prices.salon+units.cream*prices.cream;
 // One fixed salon payroll and rent payment; materials only on visits.
 const rawCosts=300+5*units.salon+20*units.cream;
 return {revenue,cogs:rawCosts,ebitda:revenue-rawCosts-200-otherCosts};
}
test('V2 standalone salon & dropship: one ad funnel, one fixed rent, exact cash economics',()=>{
 const x=fixture(),r=model(x);
 const p={salon:r.items[0].priceNet,cream:r.items[1].priceNet};
 const expected=independentlyExpected(r,{salon:10,cream:10},p);
 close(r.totals.revenue,expected.revenue,'revenue');
 close(r.totals.cogs,expected.cogs,'COGS 300 fixed + material + supplier');
 close(r.totals.media,200,'advertising from V1');
 close(r.totals.ebitda,expected.ebitda,'EBITDA');
 close(r.totals.netProfit,expected.ebitda,'net no tax');
 close(r.cashflow.months.reduce((s,m)=>s+m.receipt,0),expected.revenue,'cash receipts');
 close(r.cashflow.freeCash-r.cashflow.ownerCapital+r.cashflow.reserve,expected.ebitda,'free cash vs accrual');
});
test('V2 cross-sell: 4 additional creams, zero additional CAC, exact marginal contribution',()=>{
 const x=fixture();
 x.offers=[{id:'cross',mode:'cross_sell',anchorSkuId:'salon',attachPct:40,overlapPct:0,items:[{skuId:'cream',qty:1}]}];
 const r=model(x),p={salon:r.items[0].priceNet,cream:r.items[1].priceNet};
 const expected=independentlyExpected(r,{salon:10,cream:14},p);
 close(r.basket.events[0].transactions,4,'attached checks');
 close(r.items[0].forecastOrders,10,'visits');
 close(r.items[1].forecastOrders,14,'creams');
 close(r.totals.revenue,expected.revenue,'revenue');
 close(r.totals.cogs,expected.cogs,'physical variable costs');
 close(r.totals.ebitda,expected.ebitda,'joint EBITDA');
 close(r.totals.media,200,'CAC spent once');
 close(r.basket.revenueLift,4*p.cream,'incremental gross demand (net VAT)');
 close(r.basket.variableContributionLift,4*(p.cream-20),'incremental unit profit before fixed');
});
test('V2 overlapping cross-sell: 50% of attached demand replaces forecast independently',()=>{
 const x=fixture();
 x.offers=[{id:'cross',mode:'cross_sell',anchorSkuId:'salon',attachPct:40,overlapPct:50,items:[{skuId:'cream',qty:1}]}];
 const r=model(x),p={salon:r.items[0].priceNet,cream:r.items[1].priceNet};
 const expected=independentlyExpected(r,{salon:10,cream:12},p);
 close(r.totals.revenue,expected.revenue,'net-overlap revenue');
 close(r.totals.cogs,expected.cogs,'net-overlap COGS');
 close(r.totals.ebitda,expected.ebitda,'net-overlap EBITDA');
 close(r.basket.events[0].items[0].overlapUnits,2,'not new sales');
});
test('V2 upsell replaces base visits; salon fixed expense still paid once',()=>{
 const x=fixture();
 x.offers=[{id:'upgrade',mode:'upsell',anchorSkuId:'salon',attachPct:40,overlapPct:0,items:[{skuId:'cream',qty:1}]}];
 const r=model(x),p={salon:r.items[0].priceNet,cream:r.items[1].priceNet};
 const expected=independentlyExpected(r,{salon:6,cream:14},p);
 close(r.items[0].forecastOrders,6,'retained base visits');
 close(r.items[1].forecastOrders,14,'new creams');
 close(r.totals.revenue,expected.revenue,'substitution revenues');
 close(r.totals.cogs,expected.cogs,'salon fixed payment remains');
 close(r.totals.ebitda,expected.ebitda,'upsell profit');
 close(r.basket.revenueLift,4*(p.cream-p.salon),'replaced-base price effect');
});
test('V2 bundle: one anchor + child, one ad budget; VAT excluded before turnover tax',()=>{
 const x=fixture();
 x.skus.forEach(s=>s.vatPct=20);
 x.tax={type:'turnover',pct:6};
 x.offers=[{id:'combo',mode:'bundle',anchorSkuId:'salon',attachPct:40,overlapPct:0,items:[{skuId:'cream',qty:1}]}];
 const r=model(x),p={salon:r.items[0].priceNet,cream:r.items[1].priceNet};
 const expected=independentlyExpected(r,{salon:10,cream:14},p);
 close(r.totals.revenue,expected.revenue,'revenue excluding VAT');
 close(r.totals.cogs,expected.cogs,'physical COGS');
 close(r.totals.tax,expected.revenue*.06,'turnover tax on net VAT revenue');
 close(r.totals.netProfit,expected.ebitda-expected.revenue*.06,'after-tax profit');
 close(r.items[0].priceGross/1.2,r.items[0].priceNet,'customer VAT service');
 close(r.items[1].priceGross/1.2,r.items[1].priceNet,'customer VAT product');
 close(r.totals.media,200,'no duplicated shared CAC');
});
test('V2 shared salon wages: remove V1 embedded cost & cash and replace once',()=>{
 const x=fixture(),baseline=model(x);
 x.resources.push({id:'rent',kind:'workers',label:'Мастера',amount:200,
  cadence:'monthly',pool:'unitCost',cashOrigin:'production',allocation:'usage',
  skuIds:['salon'],includedBySku:{salon:300},usage:{salon:1}});
 const r=model(x),units={salon:10,cream:10};
 const revenue=units.salon*r.items[0].priceNet+units.cream*r.items[1].priceNet;
 const cost=units.salon*5+units.cream*20+200;
 close(r.totals.revenue,revenue,'total shared revenue');
 close(r.totals.cogs,250,'variable COGS with extracted salary');
 close(r.totals.monthlyResources,200,'wages paid once');
 close(r.totals.netProfit,revenue-cost-200,'P&L after salary replacement');
 close(r.cashflow.freeCash-r.cashflow.ownerCapital+r.cashflow.reserve,r.totals.netProfit,'cash and profit');
 A.ok(r.totals.netProfit>baseline.totals.netProfit,'salary consolidation lowers costs');
});
test('V2 3-month loan: check interest in cash horizon, one-month accounting remains explicit',()=>{
 const x=fixture();x.skus[1].creditPrincipal=600;x.skus[1].creditMonths=3;x.skus[1].creditServiceMonthly=6;
 const r=model(x);
 close(r.totals.interest,6,'single accounting month loan load');
 close(r.cashflow.months.reduce((s,m)=>s+m.interest,0),18,'full loan interest term');
 close(r.cashflow.months.reduce((s,m)=>s+m.principalRepaid,0),600,'principal returned');
 close(r.cashflow.freeCash-r.cashflow.ownerCapital+r.cashflow.reserve,
    r.totals.netProfit-12,'full-horizon interest vs monthly profit');
});
test('V2 breaks on genuine operational insufficiency, not a fake positive profit',()=>{
 const x=fixture();x.skus[0].serviceCapacity=8;
 let r=E.build(x);A.equal(r.ready,false);
 A.ok(r.errors.some(e=>e.includes('Прогноз клиентов')));
 A.equal(r.cashflow,undefined);
 const y=fixture();y.skus[1].source='resale';y.skus[1].inventoryQty=9;
 y.skus[1].materialsBatchTotal=180;
 r=E.build(y);A.equal(r.ready,false);
 A.ok(r.errors.some(e=>e.includes('превышает запас')));
});
