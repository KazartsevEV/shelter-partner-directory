const {test}=require('node:test');
const A=require('node:assert/strict');
const Adapter=require('../portfolio_v2_online_adapter.js');
const E=require('../portfolio_v2_linked_engine.js');
const eq=(actual,expected,label)=>A.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<.001,label+': '+actual+' vs '+expected);
const values=()=>({months:3,monthlyBudget:400,cpc:4,ctr:2,cvrLead:20,cvrDeal:50,
 costConsult:100,costPack:200,ltv:30,mgmt:0,site:0,hosting:0,dom:0,magnet:0,
 acq:10,taxTurnover:5,agentPct:20,agentTaxTurnover:10,markup:25});
const period={deals:25,grossRevenue:3525,agentIncome:705,executorCost:2820};
function online(role,overrides={},payerOverrides={}){
 const v={...values(),...overrides},payers={monthlyBudget:'me',mgmt:'me',site:'me',
  hosting:'me',dom:'me',magnet:'me',...payerOverrides};
 return Adapter.build({mode:role,values:v,payers,period,name:role,id:'online-'+role});
}
function build(...skus){return E.build(E.fromV1({tax:{type:'turnover',pct:0},skus}));}
test('online self: exact V1 first-month-ramped ledger normalized to one V2 month',()=>{
 const item=online('self'),r=build(item);
 A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(item.priceMin,141,'contractual basket price per deal');
 eq(item.forecastUnitsPerMonth,25/3,'average month uses approved ramp');
 eq(r.totals.revenue,1175,'owner gross');
 eq(r.totals.media,400,'owner CAC');
 eq(r.totals.cogs,0,'no phantom contractor');
 eq(r.totals.tax,58.75,'owner tax');
 eq(r.totals.netProfit,598.75,'owner net');
 eq(r.cashflow.months.reduce((v,m)=>v+m.tax,0),58.75,'cash tax');
});
test('online hired: payer contractor is a variable direct expense, negative net is displayed rather than repriced',()=>{
 const r=build(online('hired'));
 A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(r.totals.revenue,1175,'owner revenue');
 eq(r.totals.cogs,940,'performer paid');
 eq(r.totals.netProfit,-341.25,'loss with unchanged V1 client price');
 A.equal(r.items[0].status,'LOSS');
 eq(r.items[0].priceList,141,'fixed V1 price cannot rise');
});
test('online agent: include agent commission not third-party partner turnover, and own tax only',()=>{
 const r=build(online('agent'));
 A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(r.totals.revenue,235,'commission is revenue, not partner 1175');
 eq(r.totals.media,400,'agent paid campaign');
 eq(r.totals.tax,23.5,'agent tax on commission');
 eq(r.totals.netProfit,-188.5,'agent net for 30 days');
 A.equal(r.items[0].status,'LOSS');
 A.equal(r.items[0].onlineProvenance.partnerGrossRevenue,3525);
});
test('online agent partner-paid media creates partner-driven orders with NO agent CAC',()=>{
 const item=online('agent',{}, {monthlyBudget:'partner'}),r=build(item);
 A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(item.adBudget,0,'owner pays no ads');
 eq(r.totals.forecast,25/3,'demand still created externally by partner');
 eq(r.totals.media,0,'no fictitious agent media');
 eq(r.totals.tax,23.5,'agent still owes turnover tax');
 eq(r.totals.netProfit,211.5,'commission after tax only');
});
test('online startup assets: cash paid once and 12-month amortization appears once in P&L',()=>{
 const item=online('self',{site:120,magnet:60}),r=build(item);
 A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(item.onlineCapex,180,'true cash acquisition');
 eq(item.onlineAmortMonthly,15,'3 month V1 period amort averaged');
 eq(r.totals.netProfit,583.75,'EBITDA less amort and tax');
 eq(r.cashflow.freeCash-r.cashflow.ownerCapital+r.cashflow.reserve,418.75,
  'cash equals EBITDA tax minus full capex, not amortized capex');
});
test('online and goods: reconcile owner taxes by line without charging agent partner sales',()=>{
 const goods={id:'goods',name:'Крем',source:'resale',unitCost:20,
  forecastUnitsPerMonth:10,adBudget:100,baseCac:10,priceMin:80,priceMax:180,
  maxDiscountPct:20,minimumMarginPct:10,targetMarginPct:20,salesFixedMonthly:0,
  adManagement:0,variableSalesPct:0,creditServiceMonthly:0,vatPct:0,inventoryQty:10,
  materialsBatchTotal:200,productionTotal:0,reserveAmount:0};
 const state=E.fromV1({skus:[goods,online('agent',{}, {monthlyBudget:'partner'})],
  tax:{type:'turnover',pct:3}});
 state.offers=[{id:'cross',mode:'cross_sell',anchorSkuId:'online-agent',
  attachPct:20,overlapPct:0,items:[{skuId:'goods',qty:1}]}];
 // No selling more stock than physically available: V2 must block before proceeding.
 const bad=E.build(state);
 A.equal(bad.ready,false);A.ok(bad.errors.some(x=>x.includes('превышает запас')));
 state.skus[0].inventoryQty=15;
 const r=E.build(state);
 A.equal(r.ready,true,JSON.stringify(r.errors));
 eq(r.totals.tax,r.items.find(x=>x.id==='goods').revenue*.03+
   r.items.find(x=>x.id==='online-agent').revenue*.10,'two owner taxable streams');
 eq(r.cashflow.months.reduce((x,m)=>x+m.tax,0),r.totals.tax,'cash tax reconciliation');
 eq(r.totals.media,100,'partner media excluded from owner portfolio');
});
test('reject online import when agent expense payer is unresolved or there is no V1 demand',()=>{
 A.throws(()=>Adapter.build({id:'x',name:'Agent',mode:'agent',
   values:values(),payers:{},period}),/Не распределены/);
 A.throws(()=>Adapter.build({id:'x',mode:'self',values:values(),
   period:{...period,deals:0}}),/прогноза сделок/);
});
