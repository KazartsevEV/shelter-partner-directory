'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict');
const Tax=require('../nomad360_sales_tax_v2.js');
const Standalone=require('../portfolio_v2_engine.js');
const Linked=require('../portfolio_v2_linked_engine.js');
const near=(a,b)=>A.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-7,a+' != '+b);

function standalone(){
 return {
  marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,
    periodMonths:2,cacReservePct:100},
  skus:[
   {id:'a',name:'T-shirt',source:'own',unitCost:20,marginPct:25,mixPct:50,
    acquiringPct:0,initialCashOut:0,batchUnits:0,storagePerUnitDay:0},
   {id:'b',name:'Bag',source:'resale',unitCost:60,marginPct:30,mixPct:50,
    acquiringPct:0,initialCashOut:0,batchUnits:0,storagePerUnitDay:0}
  ],resources:[],funding:{kind:'cash',reservePct:10,months:6,annualRatePct:12},
  tax:{type:'turnover',pct:6,vatPct:12}
 };
}
function good(id){
 return {id,name:id,source:'resale',unitCost:20,
  forecastUnitsPerMonth:10,adBudget:100,baseCac:10,priceMin:80,priceMax:180,
  maxDiscountPct:20,minimumMarginPct:10,targetMarginPct:20,salesFixedMonthly:0,
  adManagement:0,variableSalesPct:0,creditServiceMonthly:0,vatPct:12,
  inventoryQty:100,materialsBatchTotal:200,productionTotal:0,reserveAmount:0};
}
test('VAT mode returns exact legacy inputs/results (identity, no new VAT computation)',()=>{
 const state=standalone(),before=JSON.stringify(state);
 const legacy=Standalone.build(state);
 A.equal(legacy.ready,true);
 A.strictEqual(Tax.prepareStandalone(state,{mode:'vat'}),state);
 A.strictEqual(Tax.project(legacy,{mode:'vat'}),legacy);
 A.equal(JSON.stringify(state),before);
 const linked=Linked.fromV1({skus:[good('a'),good('b')],tax:{type:'turnover',pct:3}});
 A.strictEqual(Tax.prepareLinked(linked,{mode:'vat'}),linked);
 A.strictEqual(Tax.prepareLinked(linked,{}),linked);
});
test('Standalone two-SKU Sales Tax: 100 net +8 tax, P&L and credit unchanged',()=>{
 const state=standalone(),original=JSON.stringify(state);
 const prepared=Tax.prepareStandalone(state,{mode:'sales_tax',ratePct:'8'});
 A.equal(prepared.tax.vatPct,0);A.equal(prepared.tax.taxRegime,'sales_tax');
 A.equal(state.tax.vatPct,12);A.equal(JSON.stringify(state),original);
 const model=Standalone.build(prepared);
 A.equal(model.ready,true,JSON.stringify(model.errors));
 const projected=Tax.project(model,{mode:'sales_tax',ratePct:'8'});
 A.equal(projected.salesTaxSummary.lines.length,2);
 near(projected.salesTaxSummary.salesTax,model.totalRevenue*.08);
 near(projected.salesTaxSummary.customerTotal,model.totalRevenue*1.08);
 for(const i of projected.items){
  near(i.customerTax.salesTax,i.revenue*.08);
  near(i.customerTax.customerTotal,i.revenue*1.08);
  near(i.priceWithVat,i.price); // old VAT intentionally switched off
 }
 A.strictEqual(projected.months,model.months,'standalone payment schedule stays the original object');
 A.strictEqual(projected.financing,model.financing,'original capital/loan schedule');
 A.equal(projected.netProfit,model.netProfit,'original net profit');
 A.equal(projected.tax,model.tax,'original independent business tax');
 A.equal(JSON.stringify(model.items[0].customerTax),undefined);
});
test('Linked V1 import: clear input VAT without changing SKU price limits or owner tax',()=>{
 const state=Linked.fromV1({skus:[good('a'),good('b')],tax:{type:'turnover',pct:3}});
 const frozen=JSON.stringify(state);
 const prepared=Tax.prepareLinked(state,{mode:'sales_tax',ratePct:8});
 A.deepEqual(prepared.skus.map(s=>s.vatPct),[0,0]);
 A.deepEqual(prepared.skus.map(s=>s.priceMax),state.skus.map(s=>s.priceMax));
 A.equal(JSON.stringify(state),frozen);
 const model=Linked.build(prepared);
 A.equal(model.ready,true,JSON.stringify(model.errors));
 const v2=Tax.project(model,{mode:'sales_tax',ratePct:8});
 near(v2.salesTaxSummary.salesTax,v2.totals.revenue*.08);
 near(v2.salesTaxSummary.customerTotal,v2.totals.revenue*1.08);
 // Linked V2 may have a priced scenario without an approved temporal
 // horizon. Never fabricate monthly sales/tax for an absent period ledger.
 if(model.cashflow?.periodPnl?.months?.length)
  near(v2.salesTaxSummary.byMonth.reduce((a,m)=>a+m.salesTax,0),
    model.cashflow.periodPnl.revenue*.08);
 else A.equal(v2.salesTaxSummary.byMonth.length,0,'no invented months');
 A.strictEqual(v2.cashflow,model.cashflow);
 A.strictEqual(v2.totals,model.totals);
 A.equal(v2.salesTaxSummary.lines.length,2);
});
test('Discounts and bundles are already in net V2 revenue: no double application',()=>{
 const input={ready:true,items:[{id:'a',revenue:90,discountSelected:10},
    {id:'b',revenue:270,bundleExposure:.10}],
  totals:{netProfit:42},cashflow:{periodPnl:{ready:true,months:[{},{}],bySku:{
   a:{revenue:90,months:[{revenue:50},{revenue:40}]},
   b:{revenue:270,months:[{revenue:150},{revenue:120}]}
  }}}};
 const frozen=JSON.stringify(input);
 const out=Tax.project(input,{mode:'sales_tax',ratePct:8});
 near(out.salesTaxSummary.net,360);
 near(out.salesTaxSummary.salesTax,28.8);
 near(out.salesTaxSummary.customerTotal,388.8);
 A.deepEqual(out.salesTaxSummary.byMonth.map(m=>m.salesTax),[16,12.8]);
 A.equal(JSON.stringify(input),frozen);
 A.strictEqual(out.cashflow,input.cashflow);
 A.strictEqual(out.totals,input.totals);
});
test('Agent principal is the Sales Tax base, never the owner commission',()=>{
 const input={ready:true,items:[{id:'agent',fullServiceRole:'agent',revenue:200}],
  totals:{revenue:200,netProfit:150},cashflow:{periodPnl:{ready:true,months:[{},{}],bySku:{
   agent:{months:[{revenue:120},{revenue:80}],
     partner:{revenue:1000,months:[{revenue:600},{revenue:400}]}}
  }}}};
 const out=Tax.project(input,{mode:'sales_tax',ratePct:8});
 near(out.salesTaxSummary.net,1000);near(out.salesTaxSummary.salesTax,80);
 near(out.salesTaxSummary.customerTotal,1080);
 A.deepEqual(out.salesTaxSummary.byMonth.map(m=>m.salesTax),[48,32]);
 A.equal(out.totals.revenue,200);
 A.throws(()=>Tax.project({...input,cashflow:null},{mode:'sales_tax',ratePct:8}),
  /Principal customer sales ledger/);
});
test('None means no sales tax; invalid Sales Tax rates fail closed',()=>{
 const state=standalone();
 const no=Tax.prepareStandalone(state,{mode:'none',ratePct:'not a rate'});
 A.equal(no.tax.vatPct,0);
 const model=Standalone.build(no);
 const view=Tax.project(model,{mode:'none',ratePct:'not a rate'});
 near(view.salesTaxSummary.salesTax,0);
 for(const bad of ['',null,-8,NaN,'not-a-number']){
  A.throws(()=>Tax.prepareStandalone(state,{mode:'sales_tax',ratePct:bad}),RangeError);
  A.throws(()=>Tax.project(model,{mode:'sales_tax',ratePct:bad}),RangeError);
 }
 A.throws(()=>Tax.prepareStandalone(state,{mode:'bogus'}),RangeError);
});


test('7B-4 real five-SKU linked engine: online agent principal turnover, owner commission and 3 months',()=>{
 const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
 const f=fixture(),s=Linked.fromV1({skus:f.skus,tax:f.tax});
 Object.assign(s,{resources:f.resources,offers:f.offers,forecastMonths:3,
   recurringDemandApproved:true});
 const baseline=Linked.build(s);
 A.equal(baseline.ready,true,JSON.stringify(baseline.errors));
 const withTax=Linked.build(Tax.prepareLinked(s,{mode:'sales_tax',ratePct:8}));
 A.equal(withTax.ready,true,JSON.stringify(withTax.errors));
 const actual=Tax.project(withTax,{mode:'sales_tax',ratePct:8});
 const agency=actual.salesTaxSummary.lines.find(x=>x.id==='agent');
 A.equal(agency.base,'principal');
 near(agency.net,1800);near(agency.salesTax,144);near(agency.customerTotal,1944);
 near(withTax.cashflow.periodPnl.bySku.agent.revenue,360);
 near(withTax.cashflow.periodPnl.bySku.agent.taxAccrued,36);
 near(withTax.cashflow.periodPnl.bySku.agent.revenue,
   baseline.cashflow.periodPnl.bySku.agent.revenue);
 near(withTax.cashflow.periodPnl.revenue,baseline.cashflow.periodPnl.revenue);
 near(withTax.cashflow.periodPnl.netProfit,baseline.cashflow.periodPnl.netProfit);
 near(withTax.cashflow.freeCash,baseline.cashflow.freeCash);
 A.equal(actual.salesTaxSummary.byMonth.length,3);
 for(let month=0;month<3;month++){
   const ownerMonth=withTax.cashflow.periodPnl.bySku.agent.months[month].revenue;
   near(ownerMonth,120);
   // Independent approved V1 fixture: 18 principal orders × 100 / 3 months.
   const principalMonth=600;
   const otherMonth=Object.entries(withTax.cashflow.periodPnl.bySku)
     .filter(([id])=>id!=='agent')
     .reduce((sum,[,sku])=>sum+sku.months[month].revenue,0);
   const expectedBuyerNet=otherMonth+principalMonth;
   near(actual.salesTaxSummary.byMonth[month].net,expectedBuyerNet);
   near(actual.salesTaxSummary.byMonth[month].salesTax,expectedBuyerNet*.08);
   near(actual.salesTaxSummary.byMonth[month].customerTotal,expectedBuyerNet*1.08);
   near(actual.cashflow.months[month].freeCumulative,
     baseline.cashflow.months[month].freeCumulative);
 }
 console.log('7B4_ONLINE_AGENT_REAL_GREEN '+JSON.stringify({
   principalNet:agency.net,agentCommission:withTax.cashflow.periodPnl.bySku.agent.revenue,
   transitTax:agency.salesTax,customerTotal:agency.customerTotal,months:3
 }));
});
