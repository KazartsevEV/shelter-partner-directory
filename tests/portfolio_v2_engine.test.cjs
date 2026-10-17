const {test}=require('node:test');
const assert=require('node:assert/strict');
const calc=require('../portfolio_v2_engine.js');
const close=(a,b,title,delta=1e-7)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=delta,title+': '+a+' vs '+b);
const base=()=>({
 marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,
   periodMonths:2,cacReservePct:100},
 skus:[
 {id:'a',name:'Майка',source:'own',unitCost:20,marginPct:25,mixPct:50,
   acquiringPct:0,initialCashOut:0,batchUnits:0,storagePerUnitDay:0},
 {id:'b',name:'Сумка',source:'resale',unitCost:60,marginPct:30,mixPct:50,
   acquiringPct:0,initialCashOut:0,batchUnits:0,storagePerUnitDay:0}
 ],resources:[],funding:{kind:'cash',reservePct:10,months:6,annualRatePct:12},
 tax:{type:'turnover',pct:6,vatPct:12}
});
test('Pure marketing engine reuses CAC funnel and CTR impressions',()=>{
 let f=calc.marketingFunnel(base().marketing);
 close(f.clicks,200,'clicks');close(f.impressions,10000,'impressions');
 close(f.leads,40,'leads');close(f.orders,10,'orders');close(f.baseCAC,100,'CAC');
 f=calc.marketingFunnel({...base().marketing,cacReservePct:75});
 close(f.guardedCAC,100/.75,'75% historical coefficient');
});
test('Four SKU inputs, raw price, revenue mix, weighted CAC and ad budget conservation',()=>{
 const r=calc.build(base());assert.equal(r.ready,true,JSON.stringify(r.errors));
 const [a,b]=r.items;
 close(a.forecastOrders,5,'A unit mix');close(b.forecastOrders,5,'B units');
 close(a.price,120/.75,'A price');close(b.price,160/.70,'B price');
 const ra=5*a.price,rb=5*b.price,wa=ra/(ra+rb),wb=1-wa;
 close(a.revenueWeight,wa,'A revenue-weight');close(b.revenueWeight,wb,'B revenue-weight');
 close(a.adBudget,1000*wa,'A ad budget');close(b.adBudget,1000*wb,'B ad budget');
 close(a.weightedCAC,100*wa/.5,'A weighted CAC');
 close(b.weightedCAC,100*wb/.5,'B weighted CAC');
 close(a.weightedCAC*5,a.adBudget,'A allocated CAC recovers budget');
 close(b.weightedCAC*5,b.adBudget,'B allocated CAC recovers budget');
 close(r.invariants.mixSum,1,'qty mix conserved');close(r.invariants.weightSum,1,'revenue mix conserved');
 close(r.invariants.adDiff,0,'ad budget conserved');
 close(r.skuEbitda,ra+rb-20*5-60*5-1000,'SKU P&L reconciled');
 assert.notEqual(a.realizedMarginPct,25,'Actual margin is not fake product target');
 close(a.priceWithVat,a.price*1.12,'VAT buyer price only');
});
test('Same rented workplace, workers and warehouse + distinct materials: shared monthly paid exactly once',()=>{
 const x=base();
 x.resources=[
 {id:'room',kind:'premises',label:'Общая аренда',amount:400,cadence:'monthly',skuIds:['a','b'],allocation:'revenue'},
 {id:'team',kind:'workers',label:'Общие рабочие',amount:600,cadence:'monthly',skuIds:['a','b'],allocation:'usage',usage:{a:40,b:60},capacity:100},
 {id:'stock',kind:'warehouse',label:'Склад аренда',amount:90,cadence:'monthly',skuIds:['a','b'],allocation:'revenue'}
 ];
 const r=calc.build(x);assert.equal(r.ready,true,JSON.stringify(r.errors));
 close(r.resourceMonthly,1090,'one rent/team/warehouse per month');
 close(r.resources.length,3,'three shared ledger entries');
 close(r.resources.find(y=>y.id==='team').bySku.a,240,'worker cost allocated by usage');
 close(r.resources.find(y=>y.id==='team').bySku.b,360,'other share');
 assert.ok(r.invariants.resourceAllocated);
 close(r.months[0].shared,1090,'month 1 shared paid once');
 close(r.months[1].shared,1090,'month 2 shared paid once');
 close(r.months.reduce((n,m)=>n+m.shared,0),2180,'entire period no duplicate charge');
});
test('Independent premises and team create two separate payments',()=>{
 const x=base();x.resources=[
 {id:'roomA',kind:'premises',amount:400,cadence:'monthly',skuIds:['a']},
 {id:'roomB',kind:'premises',amount:600,cadence:'monthly',skuIds:['b']},
 {id:'workersA',kind:'workers',amount:250,cadence:'monthly',skuIds:['a']},
 {id:'workersB',kind:'workers',amount:300,cadence:'monthly',skuIds:['b']}
 ];const r=calc.build(x);assert.equal(r.ready,true,JSON.stringify(r.errors));
 close(r.resourceMonthly,1550,'all separate expenses paid');
 assert.ok(r.invariants.resourceAllocated);
});
test('One certificate paid once only if valid for all covered SKUs; different certificates sum',()=>{
 let x=base();
 x.resources=[{id:'certificate',kind:'certification',amount:900,cadence:'once',
  skuIds:['a','b'],allocation:'revenue',confirmedCoverage:true,
  validFor:'KZ valid certificate for both clothing & textile bags',validUntil:'2027-12-31'}];
 let r=calc.build(x);assert.equal(r.ready,true,JSON.stringify(r.errors));
 close(r.resourceOnce,900,'one certificate');close(r.months[0].oneOff,900,'one time only');
 close(r.months[1].oneOff,0,'not duplicated next month');
 x.resources[0].confirmedCoverage=false;
 assert.equal(calc.build(x).ready,false,'unverified certificate cannot silently be shared');
 x.resources=[
 {id:'certA',kind:'certification',amount:900,cadence:'once',skuIds:['a']},
 {id:'certB',kind:'certification',amount:700,cadence:'once',skuIds:['b']}
 ];
 r=calc.build(x);assert.equal(r.ready,true,JSON.stringify(r.errors));
 close(r.resourceOnce,1600,'separate certificates both charged');
});
test('One common media campaign vs independent campaigns both conserve total advertising',()=>{
 let x=base();let r=calc.build(x);
 close(r.marketingBudget,1000,'common budget');
 close(r.items.reduce((n,s)=>n+s.adBudget,0),1000,'all SKU allocation');
 x.marketing.budget=0;
 x.resources=[
 {id:'A-ad',kind:'campaign',amount:400,cadence:'monthly',skuIds:['a']},
 {id:'B-ad',kind:'campaign',amount:600,cadence:'monthly',skuIds:['b']}
 ];
 r=calc.build(x);assert.equal(r.ready,true,JSON.stringify(r.errors));
 close(r.marketingBudget,1000,'two targeted campaigns');
 close(r.items[0].adBudget,400,'A only');
 close(r.items[1].adBudget,600,'B only');
 close(r.months[0].ad,1000,'one campaign spend in cash flow');
 close(r.resourceMonthly,0,'media not silently recharged as an overhead');
 close(r.invariants.adDiff,0,'campaign spend conservation');
});
test('Three source adapters: own/resale upfront supplier advance vs dropship settlement after sale',()=>{
 const x=base();
 x.marketing.periodMonths=2;
 x.skus[0]={id:'a',name:'Factory stock',source:'own',unitCost:20,batchUnits:10,
  initialCashOut:120,marginPct:25,mixPct:50,storagePerUnitDay:.5,acquiringPct:0};
 x.skus[1]={id:'b',name:'No warehouse supplier',source:'dropship',unitCost:60,
  marginPct:30,mixPct:50,initialCashOut:0,batchUnits:0,fulfillmentPerOrder:8,acquiringPct:0};
 let r=calc.build(x);assert.equal(r.ready,true,JSON.stringify(r.errors));
 close(r.months[0].initialPurchase,120,'actual starting outflow');
 close(r.months[0].supplierSettlement, (20-120/10)*5+60*5,'factory advance netted plus dropship after-sale COGS');
 close(r.months[0].storage,.5*30*(10+5)/2,'warehouse item-days');
 close(r.months[1].initialPurchase,0,'advance is one-time');
 close(r.months[1].supplierSettlement,(20-12)*5+60*5,'no repeated downpayment');
 close(r.months.reduce((z,m)=>z+m.initialPurchase+m.supplierSettlement,0),
  20*10+60*10,'supplier money paid once per sold unit across batch');
 x.skus[1].initialCashOut=100;
 assert.equal(calc.build(x).ready,false,'dropship forbids stock purchase');
 x.skus[1].initialCashOut=0;
 x.skus[0].initialCashOut=201;
 assert.equal(calc.build(x).ready,false,'advance > goods batch total fails');
});
test('Credit bullet cash flow: borrowed money never becomes revenue/tax; principal paid once',()=>{
 const x=base();x.skus=[{id:'a',name:'Resale',source:'resale',unitCost:50,
  marginPct:30,mixPct:100,batchUnits:10,initialCashOut:300,acquiringPct:2,fulfillmentPerOrder:3}];
 x.funding={kind:'credit',annualRatePct:12,months:6,reservePct:10};
 const r=calc.build(x);assert.equal(r.ready,true,JSON.stringify(r.errors));
 assert.equal(r.months.length,6);
 close(r.months[0].loanDraw,r.financing.principal,'loan funds once');
 close(r.months.slice(1).reduce((n,m)=>n+m.loanDraw,0),0,'no second credit draw');
 close(r.months[5].principalRepayment,r.financing.principal,'loan returned at month6');
 close(r.months.slice(0,5).reduce((n,m)=>n+m.principalRepayment,0),0,'no premature body');
 close(r.months.reduce((n,m)=>n+m.interest,0),r.financing.totalInterest,'interest all six');
 close(r.months.reduce((n,m)=>n+m.tax,0),r.months.reduce((n,m)=>n+m.receipt,0)*.06,'credit draw untaxed');
 close(r.freeCash,r.finalCash-r.financing.reserve,'disposable excludes reserve');
 close(r.months.reduce((n,m)=>n+m.cashFlow,0),r.finalCash,'cash flow reconciled');
});
test('Validation gates non-100% quantity mix, overbooked workers and invalid source',()=>{
 const x=base();x.skus[1].mixPct=48;
 assert.equal(calc.build(x).ready,false);
 x.skus[1].mixPct=50;
 x.resources=[{id:'team',kind:'workers',amount:500,cadence:'monthly',allocation:'usage',
   usage:{a:70,b:60},capacity:100,skuIds:['a','b']}];
 assert.equal(calc.build(x).ready,false,'cannot reuse overbooked team');
 x.resources=[];x.skus[0].source='unsupported';
 assert.equal(calc.build(x).ready,false);
});

test('Monthly group resources and targeted campaigns stop when their beneficiary sells out',()=>{
 const x=base();
 x.marketing.periodMonths=1;
 x.skus[0].batchUnits=5;
 x.skus[1].batchUnits=15;
 x.resources=[
  {id:'a-team',kind:'workers',label:'A team',amount:100,cadence:'monthly',skuIds:['a']},
  {id:'b-team',kind:'workers',label:'B team',amount:200,cadence:'monthly',skuIds:['b']},
  {id:'a-ad',kind:'campaign',label:'A media',amount:50,cadence:'monthly',skuIds:['a']},
  {id:'b-ad',kind:'campaign',label:'B media',amount:100,cadence:'monthly',skuIds:['b']}
 ];
 const r=calc.build(x);
 assert.equal(r.ready,true,JSON.stringify(r.errors));
 assert.equal(r.months.length,3);
 close(r.months[0].shared,300,'both teams month1');
 close(r.months[1].shared,200,'only B team month2');
 close(r.months[2].shared,200,'only B team month3');
 close(r.months[0].ad,1150,'global and two campaign budgets month1');
 close(r.months[1].ad,1100,'A targeted campaign ended, B still running');
 close(r.months[2].ad,1100,'A campaign is not billed after its stock sells out');
});

test('Shared marketing cannot be redirected to unit/usage ratio against revenue weights',()=>{
 const x=base();
 x.marketing.budget=0;
 x.resources=[{id:'global-media',kind:'campaign',amount:1000,cadence:'monthly',
  allocation:'usage',usage:{a:90,b:10},skuIds:['a','b']}];
 const r=calc.build(x);
 assert.equal(r.ready,true,JSON.stringify(r.errors));
 close(r.items[0].adBudget,r.items[0].revenueWeight*1000,'Revenue weighting overrides arbitrary ad usage');
 close(r.items[1].adBudget,r.items[1].revenueWeight*1000,'Other SKU weighted correctly');
 close(r.invariants.adDiff,0,'Full pool conserved');
});
