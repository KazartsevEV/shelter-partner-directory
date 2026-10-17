const {test}=require('node:test');
const A=require('node:assert/strict');
const E=require('../portfolio_v2_linked_engine.js');
const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
const close=(a,b,label,tol=1e-5)=>A.ok(Number.isFinite(a)&&Math.abs(a-b)<tol,
 label+': '+a+' vs '+b);
const prices={own:48.27,resale:39.61,drop:28.14,salon:55.85,agent:20};
const units={own:15,resale:20,drop:13,salon:9.5,agent:6};
const discount={own:.3,resale:.3,drop:0,salon:0,agent:0};
const unitCost={own:20,resale:20,drop:12,salon:5,agent:0};
const byMonth=Object.fromEntries(Object.keys(prices).map(id=>[
 id,(units[id]-discount[id])*prices[id]]));
const regular=byMonth.own+byMonth.resale+byMonth.salon+byMonth.agent;
const gross=regular+byMonth.drop;
const taxAccrual=(gross-byMonth.agent)*.05+byMonth.agent*.10;
const stockPaid=45*20+100*20;
const wagesSpace=180+90,mediaCash=200+100+100,offlineFixed=90;
const perOrderCash=13*12+9.5*5;
const soldCOGS=15*20+20*20+perOrderCash;
const expectedProfitMonth=gross-soldCOGS-mediaCash-wagesSpace-offlineFixed-5-taxAccrual;
const expectedReceipt=[regular,
 regular+25/30*byMonth.drop,
 regular+byMonth.drop,
 byMonth.drop,
 5/30*byMonth.drop];
const expectedTaxes=expectedReceipt.map((v,i)=>i<3?
 (v-byMonth.agent)*.05+byMonth.agent*.10:v*.05);
const expectedPurchases=[stockPaid+offlineFixed,offlineFixed,offlineFixed,0,0];
const expectedAds=[400,400,400,0,0],expectedShared=[270,270,270,0,0];
const expectedInterest=[5,5,5,5,0],expectedPrincipal=[0,0,0,500,0];
const expectedCashflow=expectedReceipt.map((v,i)=>v+(i===0?500:0)-
 (i<3?perOrderCash:0)-expectedPurchases[i]-expectedAds[i]-
 expectedShared[i]-expectedTaxes[i]-expectedInterest[i]-expectedPrincipal[i]);
function state(type='turnover'){
 const {skus,resources,offers,tax,forecastMonths,recurringDemandApproved}=fixture(type);
 const s=E.fromV1({skus,tax});
 return Object.assign(s,{resources,offers,forecastMonths,recurringDemandApproved});
}
function good(){const result=E.build(state());A.equal(result.ready,true,JSON.stringify(result.errors));return result;}
test('F3 independent 5-source Oracle: every month, buyer revenues and basket quantities',()=>{
 const r=good(),M=r.temporal.months;
 A.equal(M.length,3);
 const projected={...units};
 for(let k=0;k<3;k++){
  for(const id of Object.keys(units)){
   close(M[k].orders[id],projected[id],'demand '+id+' period '+(k+1));
   close(M[k].discountedUnits[id]||0,discount[id],'bundle discount '+id+' period '+(k+1));
   close(r.items.find(s=>s.id===id).priceList,prices[id],'actual after-tax H price '+id);
   close(r.cashflow.periodPnl.bySku[id].months[k].revenue,byMonth[id],
    'owner sales net-VAT '+id+' month '+(k+1));
  }
  close(M[k].remainingStock.own,45-(k+1)*15,'own inventory conserved');
  close(M[k].remainingStock.resale,100-(k+1)*20,'resale inventory conserved');
  close(r.cashflow.periodPnl.months[k].revenue,gross,'all actual fulfilled owner sales');
  close(r.cashflow.periodPnl.months[k].cogs,soldCOGS,'independent sold COGS');
  close(r.cashflow.periodPnl.months[k].marketing,mediaCash,'owner media / no partner spend');
  close(r.cashflow.periodPnl.months[k].operatingShared,wagesSpace,'one rent plus one master');
  close(r.cashflow.periodPnl.months[k].serviceFixed,offlineFixed,'salon rent once');
  close(r.cashflow.periodPnl.months[k].interest,5,'loan interest accrued this month');
  close(r.cashflow.periodPnl.months[k].taxAccrued,taxAccrual,
   'business 5% and agent only own 10%');
  close(r.cashflow.periodPnl.months[k].netProfit,expectedProfitMonth,
   'pure external after-tax P&L');
 }
 close(r.cashflow.periodPnl.revenue,3*gross,'entire H revenue');
 close(r.cashflow.periodPnl.netProfit,3*expectedProfitMonth,'H profit');
 close(r.cashflow.periodPnl.postHorizonInterest,5,'remaining loan interest disclosed');
 close(r.cashflow.periodPnl.bySku.agent.revenue,360,'agent commission only');
 A.ok(r.cashflow.periodPnl.bySku.agent.revenue<1800,'partner GMV never becomes owner-agent income');
 close(r.cashflow.periodPnl.bySku.own.interest,15,'own finance attributed');
 close(r.cashflow.periodPnl.bySku.own.futureInterest,5,'own post-H finance burden');
 const rent=180*3,staff=90*3;
 close(r.cashflow.periodPnl.bySku.own.operatingShared,rent/2,'premises share own');
 close(r.cashflow.periodPnl.bySku.salon.operatingShared,rent/2+
  staff*9.5/(10+9.5),'premises plus demand-weighted staff for salon');
 close(r.cashflow.periodPnl.bySku.resale.operatingShared,
  staff*10/(10+9.5),'demand-weighted staff for resale');
 for(const id of ['own','resale','drop','salon','agent'])
  A.ok(r.cashflow.periodPnl.bySku[id].netMargin>=25||
   id==='agent','target margin by owner SKU');
 close(100-60,40,'remaining resale is unsold inventory asset, not extra COGS');
});
test('F3 independent 5-source cash oracle: delayed dropship, one batch payment, credit and owner tax',()=>{
 const r=good(),C=r.cashflow.months;A.equal(C.length,5);
 for(let k=0;k<5;k++){
  close(C[k].receipt,expectedReceipt[k],'cash receipts including delayed dropship '+k);
  close(C[k].stockPurchase,expectedPurchases[k],'procurement once / monthly salon '+k);
  close(C[k].ad,expectedAds[k],'actual owner advertising '+k);
  close(C[k].shared,expectedShared[k],'actual shared rent/master '+k);
  close(C[k].tax,expectedTaxes[k],'tax on cash receipts and owner commission '+k);
  close(C[k].interest,expectedInterest[k],'credit interest '+k);
  close(C[k].principalRepaid,expectedPrincipal[k],'credit principal '+k);
  close(C[k].cashFlow,expectedCashflow[k],'independent cashflow monthly '+k);
  close(C[k].operatingOutflow,expectedPurchases[k]+expectedAds[k]+
   expectedShared[k]+(k<3?perOrderCash:0),'cash paid actual lines '+k);
 }
 close(C.reduce((v,m)=>v+m.loanDraw,0),500,'borrowed principal received once');
 close(C.reduce((v,m)=>v+m.principalRepaid,0),500,'principal repaid once');
 close(C.reduce((v,m)=>v+m.tax,0),expectedTaxes.reduce((v,t)=>v+t,0),
  'actual paid tax vs distinct P&L accrual');
 const cum=expectedCashflow.reduce((v,x)=>v+x,0);
 close(r.cashflow.finalCash,r.cashflow.ownerCapital+cum,'cash closing identity');
 close(r.cashflow.freeCash,r.cashflow.finalCash-r.cashflow.reserve,
  'owner protected reserve is financing not a P&L expense');
 const hTax=r.cashflow.periodPnl.taxAccrued,
   hPaid=expectedTaxes.slice(0,3).reduce((v,t)=>v+t,0);
 close(r.cashflow.periodPnl.taxTimingDifference,hTax-hPaid,
  'tax accrual differs from bank-cash tax because 35-day payout');
});
test('F3 independently reconstruct day-by-day max deficit and required owner capital',()=>{
 const r=good();let balance=0,peak=0;
 for(let d=0;d<150;d++){
  const month=Math.floor(d/30);
  const saleActive=d<90;
  const draw=d===0?500:0;
  const receipts=(saleActive?regular/30:0)+
   (d>=35&&d<125?byMonth.drop/30:0);
  const operating=(saleActive?(perOrderCash+mediaCash+wagesSpace)/30:0);
  const supplier=d===0?stockPaid:0;
  const salonCash=(d===0||d===30||d===60)?offlineFixed:0;
  const tax=d%30===29?expectedTaxes[month]:0;
  const interest=d===29||d===59||d===89||d===119?5:0;
  const principal=d===119?500:0;
  balance+=draw+receipts-operating-supplier-salonCash-tax-interest-principal;
  peak=Math.min(peak,balance);
 }
 close(r.cashflow.ownerCapital,Math.max(0,-peak),'daily peak cash deficit from independent bank events',.0001);
 close(r.cashflow.peakOperatingDeficit,-peak,'same peak deficit label',.0001);
});
test('F3 mixed profit tax with DISJOINT regular-owner resources is allowed and reconciled',()=>{
 const s=state('profit'),r=E.build(s);
 A.equal(r.ready,true,JSON.stringify(r.errors));
 const p=r.cashflow.periodPnl;
 close(p.taxAccrued,p.months.reduce((v,m)=>v+m.taxAccrued,0),'enterprise tax conservation');
 for(const m of p.months){
  const regularPretax=m.preTaxProfit-120;
  const expected=Math.max(0,regularPretax)*.05+12;
  close(m.taxAccrued,expected,'profit tax only on regular-owner business + agent turnover');
 }
 close(p.bySku.agent.taxAccrued,36,'agent turnover remains its own tax regime');
 close(Object.values(p.bySku).reduce((v,x)=>v+x.netProfit,0),p.netProfit,
  'mixed tax-owner profit allocated exactly');
});
test('F3 fail-closed when shared worker touches agent entity under regular profit tax',()=>{
 const s=state('profit');
 s.resources[2].skuIds.push('agent');s.resources[2].loadPerUnit.agent=1;
 s.resources[2].capacity=40; // avoid capacity gate hiding the ownership gate
 const r=E.build(s);
 A.equal(r.ready,false);
 A.match(r.errors.join(' '),/неподтверждённое разделение налоговых расходов/);
});
test('F3 fail-closed when salon month 1 demand+cross-sell exceeds appointments',()=>{
 const s=state();s.skus.find(x=>x.id==='salon').serviceCapacity=8;
 const r=E.build(s);
 A.equal(r.ready,false);
 A.match(r.errors.join(' '),/посещени|мощност/);
});
test('F3 fail-closed when shared worker capacity lower than resale+salon demand',()=>{
 const s=state();s.resources.find(x=>x.id==='workers').capacity=18;
 const r=E.build(s);A.equal(r.ready,false);
 A.match(r.errors.join(' '),/мощност|ресурс/);
});
test('F3 fail-closed when online V1 source period < selected repeat horizon',()=>{
 const s=state();s.skus.find(x=>x.id==='agent').onlineProvenance.periodMonths=2;
 const r=E.build(s);A.equal(r.ready,false);
 A.match(r.errors.join(' '),/период V1 не подтверждает 3 месяцев/);
});
test('F3 row ordering cannot change exact buyer prices, monthly cash or owner tax',()=>{
 const a=good(),s=state();
 s.skus.reverse();s.resources.reverse();s.offers.reverse();
 const b=E.build(s);
 A.equal(b.ready,true,JSON.stringify(b.errors));
 for(const id of Object.keys(prices)){
  close(b.items.find(x=>x.id===id).priceList,
   a.items.find(x=>x.id===id).priceList,'permuted price '+id);
  close(b.cashflow.periodPnl.bySku[id].netProfit,
   a.cashflow.periodPnl.bySku[id].netProfit,'permuted SKU P&L '+id);
 }
 for(let k=0;k<5;k++){
  close(b.cashflow.months[k].receipt,a.cashflow.months[k].receipt,'cash order '+k);
  close(b.cashflow.months[k].tax,a.cashflow.months[k].tax,'tax order '+k);
 }
});
test('F3 owner VAT exclusion and unsold physical asset remain separate',()=>{
 const r=good();
 A.equal(r.cashflow.vatCashBasis,'net-of-vat-operating');
 close(r.temporal.finalStock.own,0,'own production all sold');
 close(r.temporal.finalStock.resale,40,'resale leftovers 40 physical units');
 // Purchase 100 at 20; 60 realized COGS, 40 units valued 800 not expensed.
 close(r.cashflow.months[0].stockPurchase-stockPaid,offlineFixed,
  'stock purchase does not disappear from cash');
 close(r.cashflow.periodPnl.bySku.resale.cogs,60*20,
  'resale realized cost excludes 800 unsold asset');
 close(40*20,800,'closing inventory at source cost');
});
