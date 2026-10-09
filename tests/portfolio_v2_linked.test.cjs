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
test('embedded V1 production wage is removed from original cash payment as well as COGS',()=>{
 const x=sample(),baseline=E.build(x);
 const r=common('workers',30,'unitCost');r.cashOrigin='production';
 r.includedBySku={a:50};x.resources.push(r);
 const y=E.build(x);A.equal(y.ready,true,JSON.stringify(y.errors));
 eq(y.totals.netProfit-baseline.totals.netProfit,20);
 eq(y.items[0].cashOffsets.production,50);
 eq(y.cashflow.freeCash-y.cashflow.ownerCapital+y.cashflow.reserve,y.totals.netProfit);
 const bad=sample();bad.resources.push({...r,cashOrigin:''});
 let z=E.build(bad);A.equal(z.ready,false);
 A.ok(z.errors.some(message=>message.includes('исходный денежный платёж')));
 bad.resources[0].cashOrigin='materials';bad.resources[0].includedBySku={a:600};
 z=E.build(bad);A.equal(z.ready,false);
 A.ok(z.errors.some(message=>message.includes('превышает сумму выбранного')));
});

test('MBA cross-sell adds only incremental units without charging a second advertising budget',()=>{
 const x=sample();x.skus[0].inventoryQty=100;
 const baseline=E.build(x);
 x.offers=[{id:'offer-1',mode:'cross_sell',anchorSkuId:'a',attachPct:20,
   overlapPct:0,items:[{skuId:'b',qty:2}]}];
 const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(r.basket.baseOrders.a,25);eq(r.basket.baseOrders.b,20);
 eq(r.basket.events[0].transactions,5);
 eq(r.basket.orders.a,25);eq(r.basket.orders.b,30);
 eq(r.items.find(s=>s.id==='b').forecastOrders,30);
 eq(r.totals.media,baseline.totals.media);
 A.ok(r.totals.revenue>baseline.totals.revenue);
 eq(r.cashflow.months.reduce((v,m)=>v+m.receipt,0),r.totals.revenue);
});
test('MBA overlap discounts previously projected standalone purchases exactly once',()=>{
 const x=sample();x.skus[0].inventoryQty=100;
 x.offers=[{id:'offer-1',mode:'cross_sell',anchorSkuId:'a',attachPct:20,
   overlapPct:50,items:[{skuId:'b',qty:2}]}];
 const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(r.basket.events[0].items[0].grossUnits,10);
 eq(r.basket.events[0].items[0].overlapUnits,5);
 eq(r.basket.adjustments.b,5);
 eq(r.basket.orders.b,25);
});
test('MBA upsell replaces anchor demand rather than charging both standalone purchases',()=>{
 const x=sample();x.skus[0].inventoryQty=100;
 x.offers=[{id:'upgrade',mode:'upsell',anchorSkuId:'a',attachPct:20,
   overlapPct:0,items:[{skuId:'b',qty:1}]}];
 const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(r.basket.orders.a,20);eq(r.basket.orders.b,25);
 eq(r.totals.forecast,45);
 A.ok(r.basket.revenueLift!==0);
});
test('MBA bundle is a tuple with one anchor line and multiple goods/service components',()=>{
 const x=sample();x.skus[0].inventoryQty=100;
 x.skus.push({id:'service',name:'Nail design',source:'offline-service',
   unitCost:20,serviceMaterialsUnit:8,serviceElectricityUnit:0,serviceFixedMonthly:120,
   serviceCapacity:30,forecastUnitsPerMonth:10,adBudget:100,baseCac:10,
   priceMin:80,priceMax:300,maxDiscountPct:10,minimumMarginPct:10,targetMarginPct:25,
   salesFixedMonthly:0,adManagement:0,variableSalesPct:0,creditServiceMonthly:0,vatPct:0,
   inventoryQty:0,materialsBatchTotal:80,productionTotal:120,reserveAmount:0});
 x.offers=[{id:'combo',mode:'bundle',anchorSkuId:'a',attachPct:20,
   overlapPct:0,items:[{skuId:'b',qty:2},{skuId:'service',qty:1}]}];
 const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(r.basket.orders.a,25);eq(r.basket.orders.b,30);eq(r.basket.orders.service,15);
 eq(r.basket.events[0].transactions,5);
 A.ok(r.items.find(s=>s.id==='service').priceList<=300);
 x.skus[2].serviceCapacity=14;
 const over=E.build(x);A.equal(over.ready,false);
 A.ok(over.errors.some(message=>message.includes('Прогноз клиентов')));
});
test('MBA validates exclusive offer shares, invalid tuples and overlapping existing demand',()=>{
 const x=sample();x.skus[0].inventoryQty=100;
 x.offers=[
  {id:'one',mode:'upsell',anchorSkuId:'a',attachPct:60,overlapPct:0,items:[{skuId:'b',qty:1}]},
  {id:'two',mode:'bundle',anchorSkuId:'a',attachPct:50,overlapPct:0,items:[{skuId:'b',qty:1}]}];
 let r=E.build(x);A.equal(r.ready,false);A.ok(r.errors.some(s=>s.includes('100%')));
 x.offers=[{id:'one',mode:'cross_sell',anchorSkuId:'a',attachPct:100,
    overlapPct:100,items:[{skuId:'b',qty:2}]}];
 r=E.build(x);A.equal(r.ready,false);A.ok(r.errors.some(s=>s.includes('независимый спрос')));
 x.offers[0].items=[{skuId:'a',qty:1}];
 r=E.build(x);A.equal(r.ready,false);A.ok(r.errors.some(s=>s.includes('не повторяться')));
});
test('MBA cycles do not recursively acquire customers or multiply attached units',()=>{
 const x=sample();x.skus[0].inventoryQty=100;
 x.offers=[
  {id:'a-to-b',mode:'cross_sell',anchorSkuId:'a',attachPct:20,overlapPct:0,
    items:[{skuId:'b',qty:1}]},
  {id:'b-to-a',mode:'cross_sell',anchorSkuId:'b',attachPct:20,overlapPct:0,
    items:[{skuId:'a',qty:1}]}];
 const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(r.basket.orders.a,29);eq(r.basket.orders.b,25);
 eq(r.basket.attributedTransactions,9);
 eq(r.basket.adjustments.a+r.basket.adjustments.b,9);
});

test('bundle-level 10% discount is applied across all sold components without duplicate CAC',()=>{
 const x=sample();x.skus[0].inventoryQty=100;
 x.offers=[{id:'combo',mode:'bundle',anchorSkuId:'a',attachPct:20,
   overlapPct:0,bundleDiscountPct:10,items:[{skuId:'b',qty:1}]}];
 const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 const a=r.items.find(s=>s.id==='a'),b=r.items.find(s=>s.id==='b');
 const normal=a.standaloneNet*25+b.standaloneNet*25;
 const savings=5*.1*(a.standaloneNet+b.standaloneNet);
 eq(a.forecastOrders,25);eq(b.forecastOrders,25);
 eq(r.totals.revenue,normal-savings);
 eq(r.basket.bundleSavingsNet,savings);
 eq(r.basket.bundleSavingsGross,5*.1*(a.priceGross+b.priceGross));
 eq(r.basket.revenueLift,r.totals.revenue-(a.standaloneNet*25+b.standaloneNet*20));
 eq(r.cashflow.months.reduce((v,m)=>v+m.receipt,0),r.totals.revenue);
 eq(r.totals.media,450);
});
test('discount counterfactual remains negative for all-existing purchases and does not invent uplift',()=>{
 const x=sample();x.skus[0].inventoryQty=100;
 x.offers=[{id:'combo',mode:'bundle',anchorSkuId:'a',attachPct:20,
   overlapPct:100,bundleDiscountPct:10,items:[{skuId:'b',qty:1}]}];
 const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 A.ok(r.basket.revenueLift<0);
 A.ok(r.basket.variableContributionLift<0);
 eq(r.basket.adjustments.a,0);eq(r.basket.adjustments.b,0);
});
test('bundle discount VAT gross, net and turnover tax are based on actual discounted receipts',()=>{
 const x=sample();x.skus[0].inventoryQty=100;
 x.skus[0].vatPct=20;x.skus[1].vatPct=10;
 x.offers=[{id:'combo',mode:'bundle',anchorSkuId:'a',attachPct:20,
   overlapPct:0,bundleDiscountPct:15,items:[{skuId:'b',qty:2}]}];
 const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 const a=r.items[0],b=r.items[1];
 eq(a.priceNet,a.priceGross/1.2*(1-5*.15/25));
 eq(b.priceNet,b.priceGross/1.1*(1-10*.15/30));
 eq(r.totals.tax,r.totals.revenue*.03);
 eq(r.cashflow.months.reduce((v,m)=>v+m.tax,0),r.totals.tax);
 eq(r.basket.bundleSavingsGross,5*.15*(a.priceGross+2*b.priceGross));
});
test('bundle discount fails closed if contract fixed, >100 or a price ceiling cannot fund it',()=>{
 const x=sample();x.skus[0].inventoryQty=100;
 x.offers=[{id:'combo',mode:'bundle',anchorSkuId:'a',attachPct:20,
   overlapPct:0,bundleDiscountPct:120,items:[{skuId:'b',qty:1}]}];
 let r=E.build(x);A.equal(r.ready,false);
 A.ok(r.errors.some(x=>x.includes('Скидка комплекта')));
 x.offers[0].bundleDiscountPct=95;
 x.offers[0].attachPct=100; // 95% off every anchor unit is economically impossible at V1 max
 r=E.build(x);A.equal(r.ready,false);
 A.ok(r.errors.some(x=>x.includes('минимум рентабельности')));
 x.offers[0].bundleDiscountPct=10;
 x.offers[0].attachPct=20;
 x.skus[1].fixedPriceFromV1=true;
 r=E.build(x);A.equal(r.ready,false);
 A.ok(r.errors.some(x=>x.includes('Фиксированное онлайн-вознаграждение')||
   x.includes('исходные условия')));
});


test('price from exact target, not a damped cent above the target',()=>{
 const x=sample();
 x.tax={type:'turnover',pct:5};
 x.skus=[{...x.skus[0],unitCost:20,forecastUnitsPerMonth:20,adBudget:100,
   baseCac:5,priceMin:20,priceMax:150,maxDiscountPct:0,
   minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:0,adManagement:0,
   variableSalesPct:0,creditServiceMonthly:0,creditPrincipal:0,creditMonths:0,
   vatPct:0,inventoryQty:20,materialsBatchTotal:400,productionTotal:0,
   reserveAmount:0}];
 let r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(r.items[0].requiredTargetPrice,25/.7);
 eq(r.items[0].priceList,35.72);
 x.skus[0].priceMin=40;
 r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(r.items[0].priceList,40);
});


function inventoryOracle(stock=100, monthly=20) {
  return E.fromV1({tax:{type:'turnover',pct:5},skus:[{
    id:'inventory-one', name:'Resale test SKU', source:'resale',
    unitCost:20,forecastUnitsPerMonth:monthly,adBudget:100,baseCac:5,
    priceMin:20,priceMax:150,maxDiscountPct:0,
    minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:0,
    adManagement:0,variableSalesPct:0,creditServiceMonthly:0,creditMonths:0,
    creditPrincipal:0,vatPct:0,inventoryQty:stock,
    materialsBatchTotal:stock*20,productionTotal:0,reserveAmount:0
  }]});
}
test('31A independent sell-through oracle conserves stock and repeat monthly media over 1/3/5/10 months',()=>{
  for(const stock of [20,60,100,200]){
    const result=E.build(inventoryOracle(stock));
    A.equal(result.ready,true,JSON.stringify(result.errors));
    const f=result.cashflow, months=stock/20;
    A.equal(f.months.length,months);
    const total=field=>f.months.reduce((sum,m)=>sum+m[field],0);
    eq(total('receipt'),stock*result.items[0].priceNet);
    eq(total('stockPurchase'),20*stock);
    eq(total('ad'),100*months);
    eq(total('tax'),stock*result.items[0].priceNet*.05);
    eq(total('cashFlow'),total('receipt')-total('stockPurchase')-
       total('ad')-total('tax'));
    for(const month of f.months)eq(month.receipt,20*result.items[0].priceNet);
  }
});
test('31A daily warehouse integral equals falling inventory, with no second per-sale storage payment',()=>{
  const state=inventoryOracle(100),s=state.skus[0],perDay=.5;
  const saleDays=100/(20/30);
  s.warehouseDayCost=perDay;
  s.unitCost=20+perDay*saleDays/2; // independent V1 full-cycle accrued COGS
  const r=E.build(state);A.equal(r.ready,true,JSON.stringify(r.errors));
  const f=r.cashflow;
  eq(f.months.reduce((v,m)=>v+m.operatingOutflow-m.stockPurchase-m.ad-m.shared,0),
     perDay*100*saleDays/2);
  for(let index=0;index<5;index++){
    const start=index*30,end=(index+1)*30,rate=20/30;
    const holding=perDay*(100*(end-start)-rate*(end*end-start*start)/2);
    eq(f.months[index].operatingOutflow-f.months[index].stockPurchase-
       f.months[index].ad-f.months[index].shared,holding);
  }
});
test('31A full term interest and reserve change SKU target price; loan principal stays cash-only',()=>{
  const s=inventoryOracle(20),item=s.skus[0];
  item.creditPrincipal=500;item.creditServiceMonthly=5;
  let last=0;
  for(const term of [1,3,6,12]){
    item.creditMonths=term;
    const r=E.build(s);A.equal(r.ready,true,JSON.stringify(r.errors));
    A.ok(r.items[0].priceList>last,'term '+term+' must raise required price');
    last=r.items[0].priceList;
    eq(r.cashflow.months.reduce((v,m)=>v+m.interest,0),5*term);
    eq(r.cashflow.months.reduce((v,m)=>v+m.principalRepaid,0),500);
    eq(r.cashflow.months.reduce((v,m)=>v+m.loanDraw,0),500);
  }
  item.creditServiceMonthly=0;item.creditMonths=0;item.creditPrincipal=0;
  const priceWithoutReserve=E.build(s).items[0].priceList;
  item.reserveAmount=100;
  const withReserve=E.build(s);
  A.equal(withReserve.ready,true,JSON.stringify(withReserve.errors));
  A.ok(withReserve.items[0].priceList>priceWithoutReserve);
  eq(withReserve.cashflow.reserve,100);
});
test('31A supplier advance and remainder are paid at their declared dates',()=>{
  const x=inventoryOracle(50),s=x.skus[0];
  s.supplyDays=40;s.advancePct=50;s.advanceLeadDays=35;
  const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
  A.equal(r.cashflow.months.length,4);
  eq(r.cashflow.months[0].stockPurchase,500); // day 5 advance
  eq(r.cashflow.months[1].stockPurchase,500); // day 40 settlement
  eq(r.cashflow.months[0].receipt,0);         // goods unavailable before day 40
  eq(r.cashflow.months.reduce((v,m)=>v+m.stockPurchase,0),1000);
});

test('#31C two physical SKUs have different 1/3 month sell-through, no ghost advertising',()=>{
 const state=E.fromV1({tax:{type:'turnover',pct:5},skus:[
  {id:'fast',name:'Fast',source:'resale',unitCost:20,
   forecastUnitsPerMonth:20,adBudget:100,baseCac:5,priceMin:20,priceMax:150,
   maxDiscountPct:0,minimumMarginPct:10,targetMarginPct:25,
   salesFixedMonthly:0,adManagement:0,variableSalesPct:0,
   creditServiceMonthly:0,creditMonths:0,creditPrincipal:0,vatPct:0,
   inventoryQty:20,materialsBatchTotal:400,productionTotal:0,reserveAmount:0},
  {id:'slow',name:'Slow',source:'resale',unitCost:20,
   forecastUnitsPerMonth:20,adBudget:100,baseCac:5,priceMin:20,priceMax:150,
   maxDiscountPct:0,minimumMarginPct:10,targetMarginPct:25,
   salesFixedMonthly:0,adManagement:0,variableSalesPct:0,
   creditServiceMonthly:0,creditMonths:0,creditPrincipal:0,vatPct:0,
   inventoryQty:60,materialsBatchTotal:1200,productionTotal:0,reserveAmount:0}
 ]});
 const result=E.build(state);
 A.equal(result.ready,true,JSON.stringify(result.errors));
 const m=result.cashflow.months;
 A.equal(m.length,3,'physical total horizon');
 eq(m[0].receipt,20*result.items[0].priceNet+20*result.items[1].priceNet);
 eq(m[1].receipt,20*result.items[1].priceNet);
 eq(m[2].receipt,20*result.items[1].priceNet);
 eq(m[0].ad,200);eq(m[1].ad,100);eq(m[2].ad,100);
 eq(m[0].stockPurchase,1600);
 eq(m[1].stockPurchase,0);eq(m[2].stockPurchase,0);
 const receipt=20*result.items[0].priceNet+60*result.items[1].priceNet;
 eq(m.reduce((v,x)=>v+x.receipt,0),receipt);
 eq(m.reduce((v,x)=>v+x.tax,0),receipt*.05);
 eq(m.reduce((v,x)=>v+x.cashFlow,0),receipt-1600-400-receipt*.05);
});
