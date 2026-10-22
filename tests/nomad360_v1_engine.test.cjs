'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const E=require('../nomad360_v1_engine.js');
const baseline=require('./fixtures/v1-engine/accepted-main.json');
const json=value=>JSON.parse(JSON.stringify(value));
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const close=(a,b)=>A.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,a+' != '+b);

test('42 accepted-main goods/service cases preserve full pricing, tax, capital, credit and cash calendars',()=>{
 A.equal(baseline.scenarios.length,42);
 for(const scenario of baseline.scenarios){
  const input=freeze(json(scenario.input)),before=JSON.stringify(input),e=E.create(input);
  const portfolio=e.calculateProductPortfolio();
  const actual={portfolio,cash:e.calculateProductCashFlow(portfolio),
   plans:input.portfolio.map(e.aggregatePlanMetrics),credit:input.portfolio.map(e.calculateAggregateCredit),
   pricing:input.portfolio.map(e.calculatePriceListRange),vat:input.portfolio.map(e.aggregatePricingMetrics),
   quantity:input.portfolio.map(e.aggregateQuantityDetails)};
  A.deepEqual(json(actual),scenario.expected,scenario.name);
  A.equal(JSON.stringify(input),before,scenario.name+' mutated input');
 }
});

test('27 accepted-main simple online cases preserve every period and monthly result for self, hired and agent',()=>{
 A.equal(baseline.simpleCases.length,27);
 for(const scenario of baseline.simpleCases){
  const input=freeze(json(scenario.input)),before=JSON.stringify(input),actual=E.calculateSimpleService(input);
  A.equal(actual.ready,true,scenario.name);const {ready,...numbers}=actual;
  A.deepEqual(json(numbers),scenario.expected,scenario.name);
  A.equal(JSON.stringify(input),before,scenario.name+' mutated input');
 }
});

test('independent simple-service oracle separates depreciation, capital spending, tax and agent receipts',()=>{
 const fixture=baseline.simpleCases.find(x=>x.name==='self-3-me').input;
 const self=E.calculateSimpleService(fixture);
 // The accepted ramp halves first-month deals and again halves revenue;
 // subsequent months have 24 consultations and 6 packages.
 const firstRevenue=(24*.5*150)*.5+(24*.5*.25*.5*300)*.5;
 const laterRevenue=24*150+6*300,revenue=firstRevenue+2*laterRevenue;
 const cash=revenue*(1-.03-.06)-900*3-120-30-10-600-120;
 close(self.totalMonth.mRevTotal,revenue);close(self.cumCash,cash);
 close(self.accountingNetProfit,cash+720-720*3/12);
 const agent=E.calculateSimpleService({...fixture,mode:'agent'});
 close(agent.totalMonth.mAgentIncome,revenue*.2);
 close(agent.totalMonth.mAgentTax,revenue*.2*.03);
 close(agent.simpleSpendableCash,revenue*.2*(1-.03)-(900*3+120+600+30+10+120));
 A.notEqual(agent.simpleSpendableCash,agent.cumCash,'agent income is distinct from principal cash');
});

test('pending foreign payments and invalid models cannot produce financial conclusions',()=>{
 const input=json(baseline.scenarios[0].input);
 input.portfolio[0].payments={unitCost:{active:true,status:'conversion-required'}};
 const e=E.create(input),model=e.calculateProductPortfolio();
 A.equal(model.pricingReady,false);A.equal(model.paymentPending,true);
 A.equal(e.aggregatePlanMetrics(input.portfolio[0]).requiredCapital,null);
 A.equal(e.calculateProductCashFlow(model).ready,false);
 const simple=json(baseline.simpleCases[0].input);simple.values.cpc=0;
 const invalid=E.calculateSimpleService(simple);A.equal(invalid.ready,false);
 A.ok(invalid.issues.some(x=>x.key==='cpc'));A.equal(invalid.totalMonth,undefined);
 simple.values.cpc=3;simple.mode='agent';simple.payers={};
 const pending=E.calculateSimpleService(simple);A.equal(pending.ready,false);
 A.equal(pending.unassignedPayers.length,6);
});

test('calculation instances keep independent explicit tax and portfolio state',()=>{
 const first=json(baseline.scenarios.find(x=>x.name==='own-turnover-cash').input);
 const second={...json(first),businessTaxType:'profit',businessTaxPct:20,salesVatChoice:'no'};
 const a=E.create(first),b=E.create(second),before=json(a.calculateProductPortfolio());
 A.notEqual(b.calculateProductPortfolio().tax,before.tax);
 A.deepEqual(json(a.calculateProductPortfolio()),before);
 A.equal(Object.isFrozen(E),true);A.equal(Object.isFrozen(a),true);
});
