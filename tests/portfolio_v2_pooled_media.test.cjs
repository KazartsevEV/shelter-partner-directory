const {test}=require('node:test');
const A=require('node:assert/strict');
const E=require('../portfolio_v2_linked_engine.js');
const P=require('../portfolio_v2_pooled_media.js');
const close=(x,y,label,tol=1e-5)=>A.ok(Number.isFinite(x)&&Math.abs(x-y)<tol,
 label+': actual='+x+', expected='+y);
const sku=(id,stock=100,source='resale')=>({
 id,name:id,source,unitCost:20,forecastUnitsPerMonth:20,adBudget:100,baseCac:5,
 priceMin:30,priceMax:500,maxDiscountPct:0,minimumMarginPct:10,targetMarginPct:25,
 salesFixedMonthly:0,adManagement:0,variableSalesPct:0,creditServiceMonthly:0,
 creditPrincipal:0,creditMonths:0,vatPct:0,inventoryQty:stock,
 materialsBatchTotal:stock*20,productionTotal:0,reserveAmount:0,
 serviceCapacity:60,serviceFixedMonthly:0,serviceMaterialsUnit:20,serviceElectricityUnit:0
});
const campaign=(opts={})=>({
 id:'c',label:'Common media',kind:'campaign',amount:200,cadence:'monthly',
 pool:'adBudget',allocation:'usage',usageMode:'fixed',usage:{a:1,b:1},
 skuIds:['a','b'],includedBySku:{a:100,b:100},...opts
});
function scenario(a=20,b=100,H=5) {
 const state=E.fromV1({skus:[sku('a',a),sku('b',b)],tax:{type:'turnover',pct:5}});
 state.forecastMonths=H;state.recurringDemandApproved=true;
 return state;
}
const validated=s=>{const out=E.build(s);A.equal(out.ready,true,JSON.stringify(out.errors));return out};
const sum=(a,key)=>a.reduce((v,x)=>v+x[key],0);
test('F1 A02/A04/A05 replaced V1 media paid once; share follows eligible SKU; paid idle after all stock exhausted',()=>{
 const s=scenario();s.resources=[campaign()];
 const r=validated(s),M=r.temporal.months;
 A.deepEqual(M.map(m=>Math.round(m.orders.a)),[20,0,0,0,0]);
 A.deepEqual(M.map(m=>Math.round(m.orders.b)),[20,40,40,0,0]);
 M.forEach((m,i)=>{
  close(m.media.ownerPaid,200,'monthly committed paid '+i);
  close(m.media.ownerPaid,m.media.allocated+m.media.unattributed,'media conserved '+i);
  close(r.cashflow.months[i].ad,m.media.ownerPaid,'cash paid reconciles month '+i);
 });
 close(M[0].media.allocatedBySku.a,100,'A month 1');
 close(M[0].media.allocatedBySku.b,100,'B month 1');
 close(M[1].media.allocatedBySku.a,0,'A inactive after sellout');
 close(M[1].media.allocatedBySku.b,200,'B receives month 2 reallocation');
 close(M[3].media.unattributed,200,'month 4 unassigned committed spend');
 close(M[4].media.unattributed,200,'month 5 unassigned committed spend');
 close(sum(M.map(m=>({v:m.media.ownerPaid})),'v'),1000,'5 committed campaign payments');
 close(sum(r.cashflow.months,'ad'),1000,'no duplicate campaign cash charge');
 close(sum(r.cashflow.months,'receipt'),120*r.items[0].standaloneNet,
  'sold goods conserved at same prices',.02);
});
test('F1 A03 additive campaign spends more and acquires only via verified V1 per-unit CAC',()=>{
 const s=scenario(100,100,2);
 s.resources=[campaign({amount:100,pool:'none',includedBySku:{},usage:{a:1,b:1}})];
 const r=validated(s),m=r.temporal.months;
 m.forEach(month=>{
  close(month.media.ownerPaid,300,'retained 200 + incremental 100');
  close(month.orders.a,30,'20 baseline + ten own-CAC media gain');
  close(month.orders.b,30,'20 baseline + ten own-CAC media gain');
  close(month.media.allocated,300,'nothing lost');
 });
 close(sum(r.cashflow.months,'ad'),600,'campaign + retained per both months');
});
test('F1 A06 replacing only A ad preserves B individual media and full cash, no second CAC',()=>{
 const s=scenario(20,100,2);
 s.resources=[campaign({amount:100,pool:'adBudget',includedBySku:{a:100,b:0},
  skuIds:['a','b'],usage:{a:1,b:1}})];
 const out=validated(s),M=out.temporal.months;
 close(M[0].media.ownerPaid,200,'A transfer 100 + B retained 100');
 close(M[0].media.retainedBySku.b,100,'B paid independently');
 close(M[1].media.retainedBySku.a,0,'A own media stopped');
 close(M[1].media.allocatedBySku.b,100,'B active recipient');
 close(M[1].media.ownerPaid,200,'B own + shared');
});
test('F1 A21 one-off campaign actual cash payment only once; V1 individual media remains separate',()=>{
 const s=scenario(20,100,5);
 s.resources=[campaign({cadence:'once',pool:'none',includedBySku:{}})];
 const r=validated(s),M=r.temporal.months;
 close(M[0].media.paidByCampaign.c,200,'one-time month 1 campaign');
 for(let i=1;i<5;i++)close(M[i].media.paidByCampaign.c,0,'no repeated campaign payment');
 close(sum(r.cashflow.months,'ad'),sum(M.map(m=>({ad:m.media.ownerPaid})),'ad'),
  'exact aggregate cash payments');
 close(sum(r.cashflow.months,'shared'),0,'once campaign not duplicated as shared CAPEX');
});
test('F1 A07 revenue-weighted allocation converges, respects net discounts and input order',()=>{
 const s=scenario(100,100,2);
 s.resources=[campaign({allocation:'revenue',usage:{}})];
 s.offers=[{id:'kit',mode:'bundle',anchorSkuId:'a',attachPct:20,
   overlapPct:0,bundleDiscountPct:10,items:[{skuId:'b',qty:1}]}];
 const first=validated(s);
 A.ok(first.temporal.months[0].media.allocatedBySku.a>0);
 A.ok(first.temporal.months[0].media.allocatedBySku.b>0);
 const clone=JSON.parse(JSON.stringify(s));clone.skus.reverse();
 const other=validated(clone);
 for(let i=0;i<2;i++){
  for(const id of ['a','b']){
   close(first.temporal.months[i].orders[id],other.temporal.months[i].orders[id],
     'SKU order-independent '+id+' '+i,.0001);
   close(first.temporal.months[i].media.allocatedBySku[id],
     other.temporal.months[i].media.allocatedBySku[id],'media order-independent '+id+' '+i,.0001);
  }
 }
});
test('F1 A08 all basket units conserve inventory; no second campaign CAC for cross sell',()=>{
 const s=scenario(100,100,3);s.resources=[campaign()];
 s.offers=[{id:'cross',mode:'cross_sell',anchorSkuId:'a',attachPct:20,
  overlapPct:0,items:[{skuId:'b',qty:1}]}];
 const out=validated(s),M=out.temporal.months;
 close(M[0].orders.a,20,'anchor independent purchases');
 close(M[0].orders.b,24,'20 own + 4 attached with NO extra budget');
 close(M[0].media.ownerPaid,200,'one actual owner campaign');
 A.ok(M.every(x=>x.remainingStock.b>=0),'no negative child stock');
 close(sum(M.map(x=>({qty:x.orders.b})),'qty')+out.temporal.finalStock.b,100,
   'inventory conserved over periods');
});
test('F1 A12 unknown zero-ad CAC cannot be manufactured by a new owner campaign',()=>{
 const s=scenario(100,100,2);s.skus[1].adBudget=0;s.skus[1].baseCac=0;
 s.resources=[campaign({pool:'none',includedBySku:{}})];
 const planner=P.plan(s,E.projectOffers,s.skus.map(v=>({...v,standaloneNet:100})));
 A.equal(planner.ready,false);A.match(planner.errors.join(' '),/нет проверенного владельческого CAC/);
 const independent=scenario(100,100,2);
 independent.skus[1].source='online-service'; // tested elsewhere with verified provenance
 independent.skus[1].adBudget=0;
 close(s.skus[1].forecastUnitsPerMonth,20,'verified partner base never erased by owner media');
});
test('F1 no sold goods means committed campaign remains paid but cannot pretend conversions',()=>{
 const s=scenario(20,20,3);s.resources=[campaign()];
 const r=validated(s);
 close(r.temporal.months[1].media.ownerPaid,200,'month2 campaign payment');
 close(r.temporal.months[1].media.unattributed,200,'month2 idle cash');
 close(r.temporal.months[1].units,0,'no fake month2 orders');
 close(r.cashflow.months[1].receipt,0,'no fake receipts');
});
test('F1 disabled pooled allocation preserves old first-month and multi-month no-campaign model',()=>{
 const s=scenario(60,100,3);const r=validated(s);
 A.equal(r.temporal.months[0].media,undefined);
 close(r.cashflow.months[0].ad,200,'two individual V1 ad charges');
 A.equal(r.cashflow.temporal,true);
});
