const {test}=require('node:test'),A=require('node:assert/strict'),E=require('../portfolio_v2_linked_engine.js');
const close=(a,b,m)=>A.ok(Number.isFinite(a)&&Math.abs(a-b)<.0001,m+': '+a+' vs '+b);
const state=()=>E.fromV1({tax:{type:'turnover',pct:6},skus:[
 {id:'a',name:'Product A',source:'own',unitCost:20,forecastUnitsPerMonth:10,adBudget:100,baseCac:10,
   priceMin:100,priceMax:200,maxDiscountPct:15,minimumMarginPct:10,targetMarginPct:20,
   salesFixedMonthly:0,adManagement:0,variableSalesPct:10,creditServiceMonthly:0,
   vatPct:20,inventoryQty:25,materialsBatchTotal:250,productionTotal:250,reserveAmount:0},
 {id:'b',name:'Product B',source:'dropship',unitCost:10,forecastUnitsPerMonth:10,adBudget:100,
   baseCac:10,priceMin:80,priceMax:140,maxDiscountPct:15,minimumMarginPct:10,
   targetMarginPct:20,salesFixedMonthly:0,adManagement:0,variableSalesPct:5,
   creditServiceMonthly:0,vatPct:0,inventoryQty:0,dropshipDeliveryDays:0,
   dropshipPayoutLagDays:0,dropshipPayoutMode:'before',reserveAmount:0}]});
const offer=(extra={})=>({id:'kit',mode:'bundle',anchorSkuId:'a',attachPct:40,
 overlapPct:0,items:[{skuId:'b',qty:1}],...extra});
test('percent bundle discount pro rata GROSS, mixed 20%/0% VAT, net receipts, fees and tax',()=>{
 const x=state();x.offers=[offer({bundleDiscountPct:10})];
 const out=E.build(x);A.equal(out.ready,true,JSON.stringify(out.errors));
 const a=out.items[0],b=out.items[1],e=out.basket.bundleEvents[0];
 close(e.transactions,4,'kit transactions');
 close(e.standaloneGross,a.priceGross+b.priceGross,'undiscounted customer price');
 close(e.discountGrossPerBundle,.1*(a.priceGross+b.priceGross),'single gross kit discount');
 close(e.finalGrossPerBundle,.9*(a.priceGross+b.priceGross),'buyer pays');
 close(e.allocations[0].netDiscountPerBundle,a.priceNet*.1,'A net discount VAT 20');
 close(e.allocations[1].netDiscountPerBundle,b.priceNet*.1,'B net discount VAT 0');
 close(a.revenue,(10-4*.1)*a.priceNet,'A earned VAT-exclusive revenue');
 close(b.revenue,(14-4*.1)*b.priceNet,'B earned VAT-exclusive revenue');
 close(out.totals.revenue,a.revenue+b.revenue,'portfolio recognized revenue');
 close(out.totals.tax,out.totals.revenue*.06,'turnover tax on net receipts');
 close(a.commission,a.revenue*.1,'A processing commissions on discounted revenue');
 close(b.commission,b.revenue*.05,'B commissions once');
 close(out.cashflow.months.reduce((v,m)=>v+m.receipt,0),out.totals.revenue,'actual cash receipts');
 close(out.basket.bundleNetDiscount,4*(a.priceNet+b.priceNet)*.1,'discount never deducted twice');
 const expectedProfit=out.totals.revenue-out.totals.cogs-a.commission-b.commission-200-out.totals.tax;
 close(out.totals.netProfit,expectedProfit,'full accrual profit');
});
test('fixed kit discount is allocated across mixed VAT lines by GROSS weight, not equal split',()=>{
 const x=state();x.offers=[offer({bundleDiscountAmount:30})];
 const out=E.build(x);A.equal(out.ready,true,JSON.stringify(out.errors));
 const a=out.items[0],b=out.items[1],kit=out.basket.bundleEvents[0];
 const ratio=30/(a.priceGross+b.priceGross);
 close(kit.discountGrossPerBundle,30,'fixed customer discount');
 close(kit.allocations[0].netDiscountPerBundle,a.priceNet*ratio,'A VAT net allocation');
 close(kit.allocations[1].netDiscountPerBundle,b.priceNet*ratio,'B net allocation');
 close(kit.finalGrossPerBundle,a.priceGross+b.priceGross-30,'customer basket settlement');
 close(a.revenue,a.priceNet*(10-4*ratio),'A accrual');
 close(b.revenue,b.priceNet*(14-4*ratio),'B accrual');
 close(out.cashflow.months.reduce((v,m)=>v+m.receipt,0),out.totals.revenue,'no phantom cash');
});
test('bundle with overlap still discounts every observed kit line without inventing new demand',()=>{
 const x=state();x.offers=[offer({overlapPct:50,bundleDiscountPct:10})];
 const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 close(r.items[1].forecastOrders,12,'two B units increment, two already independent');
 close(r.basket.events[0].items[0].overlapUnits,2,'overlap units conserved');
 close(r.basket.bundleEvents[0].transactions,4,'four real kits not just two new B units');
 close(r.basket.bundleNetDiscount,4*.1*(r.items[0].priceNet+r.items[1].priceNet),
  'four kit discounts charged, never two');
});
test('commercial guard: no dual/fake discounted bundle, no overlapping attach buyers, no duplicate directed SKU',()=>{
 const x=state();
 x.offers=[offer({bundleDiscountPct:15,bundleDiscountAmount:20})];
 A.equal(E.build(x).ready,false);
 x.offers=[offer({bundleDiscountAmount:999999})];
 A.equal(E.build(x).ready,false);
 x.offers=[offer({bundleDiscountPct:100})];
 A.equal(E.build(x).ready,false);
 x.offers=[offer(),{id:'cross',mode:'cross_sell',anchorSkuId:'a',attachPct:65,overlapPct:0,items:[{skuId:'b',qty:1}]}];
 const full=E.build(x);A.equal(full.ready,false);
 A.ok(full.errors.some(e=>e.includes('100%')));
 A.ok(full.errors.some(e=>e.includes('одна пара')||e.includes('Одна пара')));
});
test('observed association cannot silently assume independent overlap equals zero',()=>{
 const x=state();x.offers=[{id:'observed-1',mode:'cross_sell',anchorSkuId:'a',
   attachPct:30,overlapPct:'',observedRuleId:'a=>b',items:[{skuId:'b',qty:1}]}];
 let r=E.build(x);A.equal(r.ready,false);
 A.ok(r.errors.some(e=>e.includes('вручную укажите пересечение')));
 x.offers[0].overlapPct=0;r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
});
test('no automatic online agent bundle discount against a commission presented as customer price',()=>{
 const x=state();
 x.skus.push({id:'agent',name:'Agent deal',source:'online-agent',onlineContract:true,
 onlineGrossPerDeal:100,onlineTaxPct:10,onlineDemandBudget:100,onlineExternalAdBudget:0,
 onlinePartner:{agentCommissionPerDeal:20,customerGrossPerDeal:100,acquiringPct:0,taxTurnoverPct:5,
 adBudget:0,management:0,hosting:0,domain:0,capex:0},
 unitCost:0,forecastUnitsPerMonth:5,adBudget:100,baseCac:20,priceMin:20,priceMax:20,
 maxDiscountPct:0,minimumMarginPct:0,targetMarginPct:0,salesFixedMonthly:0,
 adManagement:0,variableSalesPct:0,creditServiceMonthly:0,vatPct:0,inventoryQty:0,
 reserveAmount:0});
 x.offers=[{id:'offer-online',mode:'bundle',anchorSkuId:'agent',attachPct:20,
   overlapPct:0,bundleDiscountPct:10,items:[{skuId:'b',qty:1}]}];
 const bad=E.build(x);A.equal(bad.ready,false);
 A.ok(bad.errors.some(e=>e.includes('онлайн-услугой')));
});
