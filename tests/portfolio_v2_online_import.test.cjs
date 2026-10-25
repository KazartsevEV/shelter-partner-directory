'use strict';
/* Current V1 period ledger -> supported V2 DTO. Production formulas are frozen.
   The archived first-month DTO is characterized, never silently reinterpreted. */
const {test}=require('node:test'),A=require('node:assert/strict');
const V1=require('../nomad360_v1_engine.js'),Adapter=require('../portfolio_v2_online_adapter.js'),E=require('../portfolio_v2_linked_engine.js');
const eq=(got,want,label)=>A.ok(Number.isFinite(got)&&Math.abs(got-want)<1e-7,label+': '+got+' versus '+want);
const defaults=()=>({months:3,monthlyBudget:400,cpc:4,ctr:2,cvrLead:20,cvrDeal:50,costConsult:100,costPack:200,ltv:30,mgmt:0,site:0,hosting:0,dom:0,magnet:0,acq:10,taxTurnover:5,agentPct:20,agentTaxTurnover:10,markup:25});
const expenseKeys=['monthlyBudget','mgmt','site','hosting','dom','magnet'];
const payers=side=>Object.fromEntries(expenseKeys.map(key=>[key,side]));
function scenario(mode,overrides={},owners=payers('me')){
 const values={...defaults(),...overrides},before=JSON.stringify({values,owners});
 const ledger=V1.calculateSimpleService({mode,values,payers:owners});A.equal(ledger.ready,true,JSON.stringify(ledger.issues));
 const t=ledger.totalMonth,period={deals:t.mDeals,grossRevenue:t.mGrossSales,agentIncome:t.mAgentIncome,executorCost:t.mExecutor,monthlyDeals:ledger.monthData.map(m=>m.mDeals)};
 const input={mode,values,payers:owners,period,id:'online-'+mode,name:'Online '+mode},sku=Adapter.build(input);
 A.equal(JSON.stringify({values,owners}),before,'V1 inputs/payers are immutable');
 return {values,owners,ledger,input,sku};
}
const state=(...skus)=>E.fromV1({skus,tax:{type:'turnover',pct:0}});
function build(...skus){const out=E.build(state(...skus));A.equal(out.ready,true,JSON.stringify(out.errors));return out;}
const goods=()=>({id:'goods',name:'Cream',source:'resale',unitCost:20,forecastUnitsPerMonth:10,adBudget:100,baseCac:10,priceMin:200,priceMax:200,maxDiscountPct:20,minimumMarginPct:10,targetMarginPct:20,salesFixedMonthly:0,adManagement:0,variableSalesPct:0,creditServiceMonthly:0,vatPct:0,inventoryQty:100,materialsBatchTotal:2000,productionTotal:0,reserveAmount:0});
test('self: actual 3-month V1 ledger, not the retired first-month template, defines the monthly V2 result',()=>{
 const s=scenario('self'),out=build(s.sku);eq(s.ledger.totalMonth.mDeals,25,'ramped deals');eq(s.ledger.totalMonth.mGrossSales,3525,'period receipts');
 eq(s.sku.forecastUnitsPerMonth,25/3,'monthly normalization');eq(s.sku.priceMax,141,'contract price per deal');eq(out.totals.revenue,1175,'monthly gross');
 eq(out.items[0].commission,117.5,'acquiring once');eq(out.totals.tax,58.75,'turnover tax once');eq(out.totals.netProfit,598.75,'independent monthly profit');eq(out.totals.netProfit,s.ledger.accountingNetProfit/3,'V1 ledger reconciliation');
});
test('hired: contractor cost stays direct, a genuine loss does not reprice the agreed V1 sale',()=>{
 const s=scenario('hired'),out=build(s.sku);eq(s.sku.unitCost,112.8,'2820 paid for 25 deals');eq(out.totals.cogs,940,'monthly contractor expense');
 eq(out.totals.revenue,1175,'gross, not netted against contractor');eq(out.totals.netProfit,-341.25,'loss');eq(out.items[0].priceGross,141,'fixed client price');A.equal(out.items[0].status,'LOSS');
});
test('agent: commission alone is owner revenue; principal gross remains provenance, not owner turnover',()=>{
 const s=scenario('agent'),out=build(s.sku);eq(s.sku.onlineProvenance.partnerGrossRevenue,3525,'principal period receipts');eq(out.totals.revenue,235,'705 commission over 3 months');
 eq(out.totals.tax,23.5,'owner commission tax');eq(out.totals.netProfit,-188.5,'owner loss after own media');eq(out.items[0].commission,0,'no second principal acquiring');eq(out.totals.netProfit,s.ledger.agentNetScenario/3,'actual V1 agent result');
});
test('partner-paid advertising creates demand without fictitious owner CAC or cash expense',()=>{
 const s=scenario('agent',{},payers('partner')),out=build(s.sku);eq(s.sku.adBudget,0,'owner media');eq(s.sku.baseCac,0,'owner CAC');
 eq(out.totals.forecast,25/3,'externally generated demand');eq(out.totals.media,0,'no owner ad cash');eq(out.totals.netProfit,211.5,'commission after own tax only');
 A.equal(s.sku.onlineProvenance.originalPayers.monthlyBudget,'partner');
});
test('negative agent income does not shelter profit-taxed goods; owner tax streams remain separate',()=>{
 for(const assets of [{},{site:120,magnet:60}]){
  const s=state(goods(),scenario('agent',assets).sku);s.tax={type:'profit',pct:20};const out=E.build(s);A.equal(out.ready,true,JSON.stringify(out.errors));
  const item=out.items.find(i=>i.id==='goods');eq(item.revenue,2000,'goods gross');eq(item.preTaxProfit,1700,'goods taxable profit before the independent 20% tax');
  eq(out.totals.tax,363.5,'340 goods plus 23.5 agent, also with online CAPEX');
 }
});
test('a shared resource is paid once across two services; fixed V1 prices are not silently increased',()=>{
 const self=scenario('self').sku,agent=scenario('agent').sku,s=state(self,agent);s.resources=[{id:'rent',kind:'premises',cadence:'monthly',amount:90,skuIds:[self.id,agent.id],allocation:'revenue',pool:'none'}];
 const out=E.build(s);A.equal(out.ready,true,JSON.stringify(out.errors));eq(out.totals.monthlyResources,90,'one shared payment');eq(out.totals.netProfit,320.25,'598.75-188.5-90');
 eq(out.items.find(i=>i.id===self.id).priceGross,141,'self price');eq(out.items.find(i=>i.id===agent.id).priceGross,28.2,'agent fee');
});
test('startup assets are full cash acquisition once and 12-month depreciation once in monthly P&L',()=>{
 const s=scenario('self',{site:120,magnet:60}),out=build(s.sku);eq(s.sku.onlineCapex,180,'paid upfront');eq(s.sku.onlineAmortMonthly,15,'monthly depreciation');
 eq(out.totals.netProfit,583.75,'598.75 less 15 depreciation');eq(out.cashflow.freeCash-out.cashflow.ownerCapital+out.cashflow.reserve,418.75,'598.75 operating result less full 180 acquisition');
 eq(s.ledger.simpleSpendableCash,1616.25,'actual whole V1 period cash, not a one-month balance');
});
test('all 64 agent expense-payer combinations conserve owner revenue, tax, operating expenses and capital',()=>{
 for(let mask=0;mask<64;mask++){
  const owners=Object.fromEntries(expenseKeys.map((key,i)=>[key,mask&(1<<i)?'me':'partner']));
  const s=scenario('agent',{mgmt:30,hosting:15,dom:3,site:120,magnet:60},owners),out=build(s.sku),own=key=>owners[key]==='me';
  const ads=own('monthlyBudget')?400:0,operations=((own('mgmt')?30:0)+(own('hosting')?15:0)+(own('dom')?3:0))/3;
  const capital=(own('site')?120:0)+(own('magnet')?60:0),amort=capital/12;
  eq(out.totals.revenue,235,'commission '+mask);eq(out.totals.media,ads,'own ads '+mask);eq(out.totals.tax,23.5,'own tax '+mask);
  eq(out.totals.netProfit,211.5-ads-operations-amort,'independent owner P&L '+mask);eq(s.sku.onlineCapex,capital,'cash capital '+mask);
  eq(s.sku.onlineProvenance.partnerGrossRevenue,3525,'principal gross retained '+mask);
 }
});
test('unassigned nonzero payer and zero demand block import rather than inventing a plausible result',()=>{
 const s=scenario('agent');A.throws(()=>Adapter.build({...s.input,payers:{}}),/Не распределены/);
 A.throws(()=>Adapter.build({...s.input,period:{...s.input.period,deals:0}}),/прогноза сделок/);
 const invalid=V1.calculateSimpleService({mode:'self',values:{...defaults(),cpc:0},payers:{}});A.equal(invalid.ready,false);
});
test('current provenance and fixed-price guards reject corrupted input and discounting, without dropping margin checks for goods',()=>{
 for(const patch of [{fixedPriceFromV1:false},{onlineProvenance:null},{ownerTax:{type:'profit',pct:10}},{discountSelected:10}]){
  const s=state({...scenario('self').sku,...patch});if(patch.discountSelected)s.skus[0].discountSelected=10;A.equal(E.build(s).ready,false,JSON.stringify(patch));
 }
 const bad=goods();bad.minimumMarginPct=0;A.equal(E.build(state(bad)).ready,false);
});
test('shared overhead keeps principal-funded demand separate from owner media',()=>{
 const a=scenario('agent',{},payers('partner')).sku,s=state(a,goods());s.resources=[{id:'shared',kind:'premises',cadence:'monthly',amount:60,skuIds:[a.id,'goods'],allocation:'revenue',pool:'none'}];
 const out=E.build(s);A.equal(out.ready,true,JSON.stringify(out.errors));eq(out.totals.media,100,'only goods advertising');eq(out.totals.monthlyResources,60,'one shared resource');eq(out.items.find(i=>i.id===a.id).adBudgetEffective,0,'principal campaign excluded');
});
test('V1 snapshot and generated source stay unchanged across repeated calculations and saved-state restoration',()=>{
 const s=scenario('hired',{site:120}),before=JSON.stringify(s.input),original=JSON.stringify(s.sku),one=build(s.sku),two=build(JSON.parse(original));
 A.deepEqual(two,one);A.equal(JSON.stringify(s.input),before);A.equal(JSON.stringify(s.sku),original);
});
test('legacy first-month factory retains its old numbers and is explicitly not a supported modern portfolio DTO',()=>{
 for(const role of ['self','hired','agent']){
  const s=Adapter.fromOnlineV1({mode:role,name:'Legacy',values:defaults(),payers:payers('me')});eq(s.forecastUnitsPerMonth,5,'legacy month-1 deals');eq(s.onlineGrossPerDeal,65,'legacy month-1 gross/deal');
  eq(s.priceMax,role==='agent'?13:65,'legacy contract price');A.equal(E.build(state(s)).ready,false,'never reinterpret a retired DTO as a valid current calculation');
 }
});
