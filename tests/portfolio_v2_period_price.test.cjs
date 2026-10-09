const {test}=require('node:test');
const A=require('node:assert/strict');
const E=require('../portfolio_v2_linked_engine.js');
const Adapter=require('../portfolio_v2_online_adapter.js');
const close=(x,y,why,tol=.011)=>A.ok(Number.isFinite(x)&&Math.abs(x-y)<tol,
 why+'; actual='+x+' vs expected='+y);
const goods=(id,stock=40)=>({id,name:id,source:'resale',unitCost:20,
 forecastUnitsPerMonth:20,adBudget:100,baseCac:5,priceMin:20,priceMax:250,
 maxDiscountPct:0,minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:0,
 adManagement:0,variableSalesPct:0,creditServiceMonthly:0,creditPrincipal:0,
 creditMonths:0,vatPct:0,inventoryQty:stock,materialsBatchTotal:stock*20,
 productionTotal:0,reserveAmount:0});
const state=(skus,H=5,tax={type:'turnover',pct:5})=>{
 const s=E.fromV1({skus,tax});s.forecastMonths=H;s.recurringDemandApproved=true;
 return s;
};
const campaign=()=>({id:'c',label:'Media',kind:'campaign',amount:200,
 cadence:'monthly',pool:'adBudget',allocation:'usage',usageMode:'fixed',
 usage:{a:1,b:1},skuIds:['a','b'],includedBySku:{a:100,b:100}});
const pooled=(cap=250,H=5)=>{
 const s=state([{...goods('a',20),priceMax:cap},goods('b',100)],H);
 s.resources=[campaign()];return s;
};
const verified=s=>{const r=E.build(s);A.equal(r.ready,true,JSON.stringify(r.errors));
 A.equal(r.cashflow.periodPnl.pricePolicy,'full-period-actual-sku-margin-pricing');return r;};
const conserved=r=>{
 const P=r.cashflow.periodPnl;
 const total=Object.values(P.bySku).reduce((v,s)=>v+s.netProfit,0);
 close(total,P.netProfit,'sum allocated SKU profit is portfolio profit',.00001);
 for(let i=0;i<P.months.length;i++){
   close(Object.values(P.bySku).reduce((v,s)=>v+s.months[i].netProfit,0),
    P.months[i].netProfit,'month '+(i+1)+' profit identity',.00001);
 }
 A.equal(r.invariants.periodSkuProfitConserved,true);
};
test('F2B 1-month legacy price, V1 source and cash oracle remain unchanged',()=>{
 const s=state([goods('a',40)],1);
 const r=E.build(s);
 A.equal(r.ready,true,JSON.stringify(r.errors));
 A.equal(r.cashflow.periodPnl,undefined);
 close(r.items[0].priceList,35.72,'legacy 30-day price');
 A.equal(s.skus[0].priceSelected,250,'V1 untouched');
});
test('F2B one SKU: exact price 35.72 from 20 units/mo x2, goods COGS and owner media',()=>{
 const r=verified(state([goods('a',40)],2)),i=r.items[0];
 close(i.priceList,35.72,'(20+5)/(.95-.25) cents');
 close(r.cashflow.periodPnl.bySku.a.revenue,40*35.72,'exact H sales');
 A.ok(i.periodMargin>=25);
 A.equal(i.status,'TARGET_MET');conserved(r);
});
test('F2B pooled committed advertising after sellout changes SKU prices, exact independent target oracle',()=>{
 const r=verified(pooled()),P=r.cashflow.periodPnl;
 const a=r.items.find(s=>s.id==='a'),b=r.items.find(s=>s.id==='b');
 // a: 400 sold COGS + 100 first month + 2x100 idle = 700;
 // b: 2000 COGS +100 first + 2x200 transfer + 2x100 idle = 2700.
 // Target after 5% turnover tax & 25% net margin implies 70% contribution.
 close(a.priceList,50,'700/(.70*20) = 50');
 close(b.priceList,38.58,'2700/(.70*100) rounded up');
 A.ok(a.periodMargin>=25&&b.periodMargin>=25);
 A.ok(P.netMargin>=25);
 A.equal(P.priceIterations>=1,true);
 close(P.bySku.a.marketing,300,'A pays committed share incl idle');
 close(P.bySku.b.marketing,700,'B pays transferred plus idle');
 close(r.cashflow.months.reduce((v,m)=>v+m.ad,0),1000,'campaign cash paid only once');
 conserved(r);
});
test('F2B V1 max 45: MINIMUM_ONLY on one SKU, do not mark entire portfolio target green',()=>{
 const r=verified(pooled(45)),a=r.items.find(s=>s.id==='a');
 close(a.priceList,45,'ceiling cannot be exceeded');
 A.equal(a.status,'MINIMUM_ONLY');
 A.ok(a.periodMargin>10&&a.periodMargin<25);
 A.equal(r.cashflow.periodPnl.targetMet,false);
 close(a.requiredTargetPrice,50,'report price needed beyond V1');
 conserved(r);
});
test('F2B V1 max 39: minimum impossible, fail closed with computed required floor',()=>{
 const r=E.build(pooled(39));
 A.equal(r.ready,false);A.equal(r.items.find(s=>s.id==='a').status,'INFEASIBLE');
 A.ok(r.errors.some(s=>s.includes('минимальная маржа')&&s.includes('41.18')));
 A.equal(r.items.find(s=>s.id==='a').priceList,39);
 A.ok(r.cashflow.periodPnl.netMargin>0,'no fake zero or hidden subsidy');
});
test('F2B H change 3 to 5 reprices same physical stock to recover committed campaign',()=>{
 const r3=verified(pooled(250,3)),r5=verified(pooled(250,5));
 close(r3.temporal.finalStock.a,0,'stock ended in H3');
 close(r5.temporal.finalStock.a,0,'same stock ends H5');
 A.ok(r5.items[0].priceList>r3.items[0].priceList+5);
 A.ok(r5.cashflow.periodPnl.targetMet);
 conserved(r3);conserved(r5);
});
test('F2B bundle discount and attached extra units priced at true H net realized receipts',()=>{
 const s=state([goods('a',100),goods('b',120)],3);
 s.offers=[{id:'kit',mode:'bundle',anchorSkuId:'a',attachPct:20,overlapPct:0,
  bundleDiscountPct:10,items:[{skuId:'b',qty:1}]}];
 const r=verified(s);
 close(r.items.find(x=>x.id==='a').priceList,36.45,'discounted anchor price');
 close(r.items.find(x=>x.id==='b').priceList,35.11,'discounted attached price');
 A.ok(r.items.every(x=>x.periodMargin>=25));
 close(r.temporal.months.reduce((v,x)=>v+x.orders.b,0),72,'attached units');
 conserved(r);
});
test('F2B common rent gets charged once and shared across eligible full-horizon SKUs',()=>{
 const s=state([goods('a',40),goods('b',40)],3);
 s.resources=[{id:'r',label:'Rent',kind:'premises',amount:300,cadence:'monthly',
  pool:'none',allocation:'usage',usageMode:'fixed',usage:{a:1,b:1},
  skuIds:['a','b'],includedBySku:{}}];
 const r=verified(s);
 r.items.forEach(x=>close(x.priceList,46.43,'one real common monthly rent split once'));
 close(r.cashflow.periodPnl.bySku.a.operatingShared,300,'A 2x150');
 close(r.cashflow.periodPnl.bySku.b.operatingShared,300,'B 2x150');
 conserved(r);
});
test('F2B contractual credit tail raises price but interest is not reclassified into H profit',()=>{
 const s=state([goods('a',40)],2,{type:'turnover',pct:5});
 s.skus[0].creditPrincipal=500;s.skus[0].creditMonths=4;
 s.skus[0].creditServiceMonthly=10;
 const r=verified(s),p=r.cashflow.periodPnl;
 close(p.postHorizonInterest,20,'2 future interest payments');
 close(p.bySku.a.futureInterest,20,'borrowing SKU burden');
 A.ok(r.items[0].priceList>35.72,'future interest adds cost to required price');
 A.ok(r.items[0].periodPricingMargin>=25,'price policy covers future interest');
 A.ok(r.items[0].periodMargin>r.items[0].periodPricingMargin,'H accounting stays distinct');
 close(r.cashflow.months.reduce((v,m)=>v+m.principalRepaid,0),500,'bullet financing not expense');
 conserved(r);
});
test('F2B fixed source price remains immutable and agent owner turnover excludes partner revenue',()=>{
 const values={months:3,monthlyBudget:400,cpc:4,ctr:2,cvrLead:20,cvrDeal:50,
 costConsult:100,costPack:200,ltv:30,mgmt:0,site:0,hosting:0,dom:0,
 magnet:0,acq:10,taxTurnover:5,agentPct:20,agentTaxTurnover:10,markup:25};
 const online=Adapter.build({id:'agent',name:'Agent',mode:'agent',values,
  period:{deals:25,grossRevenue:3525,agentIncome:705,executorCost:2820},
  payers:{monthlyBudget:'partner',mgmt:'me',site:'me',
   hosting:'me',dom:'me',magnet:'me'}});
 const r=verified(state([goods('a',60),online],3,{type:'turnover',pct:3}));
 const fee=r.items.find(x=>x.id==='agent');
 close(fee.priceList,online.priceMin,'source verified client-facing price never moved');
 close(r.cashflow.periodPnl.bySku.agent.taxAccrued,
   r.cashflow.periodPnl.bySku.agent.revenue*.10,'agent only own commission');
 A.ok(r.cashflow.periodPnl.revenue<3525*3,'no partner GMV invented');
 conserved(r);
});
test('F2B SKU order permutation does not change price, revenue, tax or period cash',()=>{
 const a=pooled(),b=JSON.parse(JSON.stringify(a));b.skus.reverse();
 const x=verified(a),y=verified(b);
 for(const id of ['a','b']){
   close(x.items.find(s=>s.id===id).priceList,y.items.find(s=>s.id===id).priceList,'order-insensitive price '+id);
   close(x.cashflow.periodPnl.bySku[id].netProfit,y.cashflow.periodPnl.bySku[id].netProfit,'order-insensitive profit '+id);
 }
 close(x.cashflow.periodPnl.netProfit,y.cashflow.periodPnl.netProfit,'same group profit');
});
