/* F4 release gate: independent conservation, source contracts and causality.
   No test derives its expected receipts from a V2 helper under test. */
const {test}=require('node:test');
const A=require('node:assert/strict');
const Engine=require('../portfolio_v2_linked_engine.js');
const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
const close=(a,b,label,tol=1e-5)=>A.ok(Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=tol,label+' actual='+a+' expected='+b);
const sum=(arr,key)=>arr.reduce((v,x)=>v+(typeof key==='function'?key(x):Number(x[key])||0),0);
const make=(type='turnover',H=3)=>{
 const {skus,resources,offers,tax}=fixture(type);
 const s=Engine.fromV1({skus,tax});Object.assign(s,{resources,offers,
  recurringDemandApproved:true,forecastMonths:H});return s;
};
const run=s=>{const r=Engine.build(s);A.equal(r.ready,true,JSON.stringify(r.errors));return r};
function invariant(r,scenario){
 const P=r.cashflow.periodPnl,C=r.cashflow;
 A.ok(P.ready);A.ok(r.invariants.periodSkuProfitConserved);
 A.equal(P.months.length,scenario.forecastMonths);
 const keys=['revenue','cogs','marketing','operatingShared','serviceFixed','amort',
  'interest','taxAccrued','ebitda','netProfit'];
 for(const key of keys){
  for(let k=0;k<P.months.length;k++){
   const fromSkus=sum(Object.values(P.bySku),sku=>sku.months[k][key]);
   close(fromSkus,P.months[k][key],'SKU allocated '+key+' month '+(k+1));
  }
  if(['revenue','interest','taxAccrued','ebitda','netProfit','amort'].includes(key))
   close(sum(P.months,key),P[key],'period '+key);
 }
 close(sum(Object.values(P.bySku),'netProfit'),P.netProfit,'aggregate after-tax profit');
 close(sum(Object.values(P.bySku),'revenue'),P.revenue,'aggregate owner revenue');
 close(sum(P.months,'marketing'),sum(C.months.slice(0,P.horizonMonths),'ad'),
  'P&L owner ad vs cash ad');
 const receipt=sum(C.months,'receipt'),outflow=sum(C.months,'operatingOutflow'),
   taxes=sum(C.months,'tax'),interest=sum(C.months,'interest'),
   principal=sum(C.months,'principalRepaid'),loan=sum(C.months,'loanDraw');
 const calculated=receipt+loan-outflow-taxes-interest-principal;
 close(sum(C.months,'cashFlow'),calculated,'entire financed bank ledger');
 close(C.finalCash,C.ownerCapital+calculated,'bank balance identity');
 close(C.freeCash,C.finalCash-C.reserve,'protected reserve only in liquidity');
 close(C.startupCapital,C.ownerCapital+C.borrowedCapital,'capital sources independent');
 const stock=Object.fromEntries(scenario.skus.filter(s=>['own','resale'].includes(s.source))
  .map(s=>[s.id,s.inventoryQty]));
 for(const month of r.temporal.months){
  for(const id of Object.keys(stock)){
   stock[id]-=month.orders[id];
   close(stock[id],month.remainingStock[id],'actual closing stock '+id+' m'+month.month);
   A.ok(stock[id]>-1e-6,'no invented negative stock');
  }
 }
 for(const sku of r.items){
  const original=scenario.skus.find(s=>s.id===sku.id);
  A.ok(sku.priceList>=original.priceMin-1e-6&&
    sku.priceList<=original.priceMax+1e-6,'immutable V1 price range '+sku.id);
  A.ok(!sku.fixedPriceFromV1||Math.abs(sku.priceList-original.priceMin)<1e-6,
   'fixed online price not changed');
 }
 A.equal(C.vatCashBasis,'net-of-vat-operating');
}
test('F4 release: five-source H=3 scenario fully reconciles every cash and P&L line',()=>{
 const s=make(),r=run(s);invariant(r,s);
 close(r.cashflow.periodPnl.revenue,7518.843,'external accepted 5-source net-VAT revenue');
 close(r.cashflow.periodPnl.netProfit,2119.40085,'external accepted 5-source profit');
 for(const [i,receipt] of [2140.461,2445.311,2506.281,365.82,60.97].entries())
  close(r.cashflow.months[i].receipt,receipt,'cash receipt '+i);
});
test('F4 release: disjoint entity profit-tax + owner agent remains reconcileable',()=>{
 const s=make('profit'),r=run(s);invariant(r,s);
 A.ok(r.cashflow.periodPnl.bySku.agent.taxAccrued>0);
 A.ok(r.cashflow.periodPnl.bySku.agent.revenue<1800);
});
test('F4 release: independent isolated 1-SKU price and V1 equality at H=1',()=>{
 const s=make();
 s.skus=s.skus.filter(x=>x.id==='resale');s.resources=[];s.offers=[];
 s.forecastMonths=1;s.recurringDemandApproved=false;
 const r=run(s);
 A.equal(r.cashflow.periodPnl,undefined);
 A.ok(r.items[0].priceList>=s.skus[0].priceMin);
 A.ok(r.items[0].priceList<=s.skus[0].priceMax);
 A.equal(s.skus[0].priceSelected,s.skus[0].priceMax);
});
test('F4 release: VAT=20% uses VAT-net receipts; H pricing and cash remain independent',()=>{
 const s=make();
 s.resources=[];s.offers=[];
 s.skus=s.skus.filter(x=>x.id==='resale');
 s.skus[0].vatPct=20;s.skus[0].discountSelected=10;
 s.forecastMonths=2;
 const frozen=JSON.parse(JSON.stringify(s));
 const fixedPrice=120;
 const r=run({...s,__periodPriceCandidate:{resale:fixedPrice}});
 const unitsSold=40,netPerUnit=fixedPrice*.9/1.2;
 close(r.cashflow.periodPnl.revenue,unitsSold*netPerUnit,'VAT net H sales');
 close(sum(r.cashflow.months,'receipt'),unitsSold*netPerUnit,'VAT-net operating cash receipts');
 close(r.cashflow.periodPnl.taxAccrued,unitsSold*netPerUnit*.05,'VAT excluded from tax base');
 A.equal(r.cashflow.vatCashBasis,'net-of-vat-operating');
 A.equal(JSON.stringify(s),JSON.stringify(frozen),'V1 source object not mutated');
});
test('F4 release: no phantom commission tax on partner-funded agent media',()=>{
 const s=make(),originalAgent=s.skus.find(x=>x.id==='agent');
 A.equal(originalAgent.adBudget,0);
 A.equal(originalAgent.onlineProvenance.ownerRevenueInPeriod,360);
 const r=run(s);
 close(r.cashflow.periodPnl.bySku.agent.revenue,360,'only owner agent fee');
 close(r.cashflow.periodPnl.bySku.agent.taxAccrued,36,'owner commission tax');
 close(r.cashflow.periodPnl.bySku.agent.marketing,0,'no invented owner ad');
});
test('F4 release: shared cost split does not create a second expense',()=>{
 const s=make(),r=run(s);
 close(sum(Object.values(r.cashflow.periodPnl.bySku),'operatingShared'),
  3*(180+90),'rent plus worker paid once per period');
 close(sum(r.cashflow.months,'shared'),810,'shared cash expense actually paid once');
 close(sum(r.cashflow.months,'ad'),1200,'owner ad paid once, partner ad excluded');
});
test('F4 release: resource tax-owner ambiguity and shared master overload remain HOLD',()=>{
 const s=make('profit');s.resources[2].skuIds.push('agent');
 s.resources[2].loadPerUnit.agent=1;s.resources[2].capacity=50;
 const blocked=Engine.build(s);
 A.equal(blocked.ready,false);A.match(blocked.errors.join(' '),/неподтверждённое разделение/);
 const c=make();c.resources[2].capacity=18;
 const overload=Engine.build(c);A.equal(overload.ready,false);
 A.match(overload.errors.join(' '),/ресурс|мощност/);
});
test('F4 release: unconfirmed amortization is never silently treated as zero cost certainty',()=>{
 const s=make();s.resources.push({id:'once-asset',label:'Shared equipment',
  kind:'equipment',amount:900,cadence:'once',pool:'none',
  allocation:'usage',usageMode:'fixed',usage:{resale:1},
  skuIds:['resale'],includedBySku:{}});
 const r=run(s);
 close(sum(r.cashflow.months,'shared')-810,900,'equipment paid cash once');
 A.equal(r.cashflow.periodPnl.onceAssetAmortizationUnverified,true);
 // Until useful life/ownership are confirmed the margin must not be
 // represented as definitively achieved on a full accounting basis.
 A.equal(r.cashflow.periodPnl.accountingCompleteness,'PROVISIONAL');
 A.equal(r.cashflow.periodPnl.targetMet,false);
});
test('F4 release: price cap and no-feasible minimum never green',()=>{
 const s=make();s.skus.find(x=>x.id==='own').priceMax=25;
 const r=Engine.build(s);A.equal(r.ready,false);
 A.ok(r.errors.some(x=>/минимальная маржа/.test(x)),'explicit real price shortfall');
 A.ok(r.items.find(x=>x.id==='own').priceList<=25);
});
test('F4 release: offline and dropship stays out of physical warehouse',()=>{
 const s=make();
 s.resources[1].kind='warehouse';
 const r=Engine.build(s);A.equal(r.ready,false);
 A.match(r.errors.join(' '),/Складской ресурс нельзя распределять/);
});
