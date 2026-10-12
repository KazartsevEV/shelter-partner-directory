const {test}=require('node:test');
const A=require('node:assert/strict');
const P=require('../nomad360_payments.js');
const Engine=require('../portfolio_v2_engine.js');
const valid=c=>['USD','EUR','CNY','KZT'].includes(c);
const model=()=>({version:2,currency:'USD',marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,periodMonths:2,cacReservePct:100},
 skus:[{id:'a',name:'Product',source:'resale',unitCost:20,marginPct:25,mixPct:100,batchUnits:100,initialCashOut:2000,fulfillmentPerOrder:2,storagePerUnitDay:0,acquiringPct:0}],
 resources:[],funding:{kind:'cash',reservePct:10},tax:{type:'turnover',pct:6,vatPct:0}});
test('payment selection preserves the original amount, without an implicit exchange rate',()=>{
 A.deepEqual(P.record('1000','CNY','USD',valid),{businessCurrency:'USD',paymentCurrency:'CNY',paymentAmount:1000,convertedAmount:null,status:'conversion-required'});
 A.equal(P.record('1000','USD','USD',valid).convertedAmount,1000);
 A.equal(P.record('0','CNY','USD',valid).convertedAmount,0);
 A.equal(P.record('','EUR','USD',valid).paymentAmount,null);
 for(const v of ['-1','Infinity','not a number'])A.equal(P.record(v,'USD','USD',valid).status,'invalid');
 A.equal(P.record(100,'BAD','USD',valid).status,'invalid');
});
test('legacy portfolio and same-currency metadata preserve the complete financial result',()=>{
 const m=model(),before=JSON.stringify(m),baseline=Engine.build(m);
 A.equal(baseline.ready,true);
 A.deepEqual(Engine.build(P.normalizePortfolio(m,valid).model),baseline);
 A.equal(JSON.stringify(m),before);
 m.skus[0].payments={unitCost:P.record(20,'USD','USD',valid),initialCashOut:P.record(2000,'USD','USD',valid)};
 A.deepEqual(Engine.build(P.normalizePortfolio(m,valid).model),baseline);
});
test('foreign payments never enter the financial engine before conversion',()=>{
 const m=model();m.skus[0].payments={unitCost:P.record(20,'CNY','USD',valid)};
 A.deepEqual(P.normalizePortfolio(m,valid),{model:null,pending:true});
 const restored=JSON.parse(JSON.stringify(m));
 A.deepEqual(restored,m);A.equal(P.pending(restored.skus[0].payments),true);
 // A stale or invented normalized number does not override the raw payment.
 restored.skus[0].payments.unitCost.convertedAmount=123;
 A.equal(P.normalizePortfolio(restored,valid).pending,true);
 restored.skus[0].payments.unitCost.paymentCurrency='USD';
 A.equal(P.normalizePortfolio(restored,valid).model.skus[0].unitCost,20);
});
test('selectors follow economic meaning and do not attach to aggregate/domestic expenses',()=>{
 A.deepEqual(P.fields({source:'own'}),['initialCashOut']);
 A.deepEqual(P.fields({source:'resale'}),['unitCost','initialCashOut']);
 A.deepEqual(P.fields({source:'dropship'}),['unitCost','fulfillmentPerOrder']);
 A.deepEqual(P.fields({source:'offline-service'}),[]);
});
test('real V1 capital and credit functions reject an unconverted payment before running financial formulas',()=>{
 const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','Marketing_calc.HTML'),'utf8');
 const source=html.slice(html.indexOf('function aggregatePlanMetrics(item) {'),html.indexOf('function calculateProductPortfolio() {'));
 const calculate=new Function('item',source+';return aggregatePlanMetrics(item);');
 for(const source of ['own','resale','dropship','offline-service']){
  const item={source,planning:{reservePct:10,creditRatePct:12,creditTermMonths:6},payments:{purchase:P.record(1000,'CNY','USD',valid)}};
  const out=calculate(item);A.equal(out.paymentPending,true);A.equal(out.requiredCapital,null);A.equal(out.advanceAmount,null);
  const creditSource=html.slice(html.indexOf('function calculateAggregateCredit(item) {'),html.indexOf('function updateAggregateCredit(item) {'));
  const credit=new Function('item','aggregatePlanMetrics',creditSource+';return calculateAggregateCredit(item);')(item,calculate);
  A.equal(credit.principal,null);A.equal(credit.monthlyServiceCost,null);A.equal(credit.totalRepayment,null);
 }
});
