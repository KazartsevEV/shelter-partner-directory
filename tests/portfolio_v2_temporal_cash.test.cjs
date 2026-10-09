const {test}=require('node:test');
const A=require('node:assert/strict');
const E=require('../portfolio_v2_linked_engine.js');
const Adapter=require('../portfolio_v2_online_adapter.js');
const close=(actual,expected,label)=>A.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<.012,
 label+': actual='+actual+' expected='+expected);
const goods=(id,stock)=>({
 id,name:id,source:'resale',unitCost:20,forecastUnitsPerMonth:20,
 adBudget:100,baseCac:5,priceMin:20,priceMax:250,maxDiscountPct:0,
 minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:0,adManagement:0,
 variableSalesPct:0,creditServiceMonthly:0,creditMonths:0,creditPrincipal:0,
 vatPct:0,inventoryQty:stock,materialsBatchTotal:stock*20,
 productionTotal:0,reserveAmount:0
});
const salon=()=>({
 ...goods('salon',0),source:'offline-service',unitCost:20,
 serviceMaterialsUnit:5,serviceElectricityUnit:0,
 serviceFixedMonthly:300,serviceCapacity:30,
 materialsBatchTotal:100,productionTotal:300
});
const offer=(mode='bundle')=>({
 id:'kit',mode,anchorSkuId:'A',attachPct:50,overlapPct:0,
 bundleDiscountPct:mode==='bundle'?10:0,
 items:[{skuId:'B',qty:1}]
});
function scenario(skus,months=5,tax=5){
 const x=E.fromV1({skus,tax:{type:'turnover',pct:tax}});
 x.forecastMonths=months;x.recurringDemandApproved=true;return x;
}
function verified(x){
 const r=E.build(x);A.equal(r.ready,true,JSON.stringify(r.errors));
 A.equal(r.cashflow.temporal,true);
 return r;
}
function total(rows,field){return rows.reduce((v,m)=>v+m[field],0)}
test('#31E2 physical bundle receipts use EACH month\'s observed planned discount and never sell nonexistent stock',()=>{
 const x=scenario([goods('A',60),goods('B',100)]);
 x.offers=[offer()];
 const r=verified(x),m=r.cashflow.months,pa=r.items[0].standaloneNet,pb=r.items[1].standaloneNet;
 A.equal(m.length,5);
 for(let k=0;k<3;k++){
  close(m[k].receipt,19*pa+29*pb,'bundle month '+(k+1)+' VAT-net receipts');
  close(m[k].ad,200,'two SKU media month '+(k+1));
 }
 close(m[3].receipt,10*pb,'only residual child month 4');
 close(m[3].ad,50,'child runs half month');
 close(m[4].receipt,0,'no phantom month 5');
 close(m[4].ad,0,'no advertising after all stock gone');
 close(total(m,'stockPurchase'),3200,'one batch purchase per SKU');
 close(total(m,'tax'),total(m,'receipt')*.05,'tax on actual discounted receipts');
 close(total(m,'cashFlow'),total(m,'receipt')-3200-total(m,'ad')-total(m,'tax'),
  'cash identity excluding original owner contribution');
 close(total(m,'receipt'),19*pa*3+29*pb*3+10*pb,'total actual receipts');
});
test('#31E2 offline service rent/consumables recur, attachments stop with anchor stock',()=>{
 const x=scenario([goods('A',60),{...salon(),id:'B',name:'B'}]);
 x.offers=[offer('cross_sell')];
 const r=verified(x),m=r.cashflow.months,pa=r.items[0].standaloneNet,pb=r.items[1].standaloneNet;
 A.deepEqual(r.temporal.months.map(k=>k.orders.B),[30,30,30,20,20]);
 for(let i=0;i<3;i++)close(m[i].receipt,20*pa+30*pb,'attached month '+i);
 for(let i=3;i<5;i++)close(m[i].receipt,20*pb,'no anchor month '+i);
 close(total(m,'stockPurchase'),1200+300*5,'physical inventory + monthly salon rent');
 close(total(m,'ad'),100*3+100*5,'SKU media stops, salon continues');
 close(total(m,'cashFlow'),total(m,'receipt')-(1200+300*5)-
   5*(30*3+20*2)-total(m,'ad')-total(m,'tax'),'actual consumables cash');
});
test('#31E2 delayed dropship receipts extend cash horizon after scenario ends',()=>{
 const drop={...goods('drop',0),source:'dropship',
  dropshipDeliveryDays:30,dropshipPayoutLagDays:10,dropshipPayoutMode:'after',
  materialsBatchTotal:0};
 const x=scenario([goods('A',40),drop],2);
 const r=verified(x),m=r.cashflow.months;
 A.equal(m.length,4,'40 days payout after final forecast day requires month 4');
 close(total(m,'receipt'),40*r.items[0].standaloneNet+40*r.items[1].standaloneNet,
  'all contracted receipt net-of-VAT');
 A.ok(m[0].receipt<40*r.items[0].standaloneNet,'dropship payout not in month 1');
 A.ok(m[3].receipt>0,'last payouts not clamped early');
 close(total(m,'tax'),total(m,'receipt')*.05,'cash-basis turnover settlement');
});
test('#31E2 one shared worker payment over mixed goods + salon service, never per beneficiary',()=>{
 const x=scenario([goods('A',20),{...salon(),id:'B',name:'B'}],3);
 x.resources.push({id:'labor',kind:'workers',label:'Shared master',amount:300,
  cadence:'monthly',pool:'none',allocation:'usage',usageMode:'per-unit',
  loadPerUnit:{A:1,B:1},skuIds:['A','B'],includedBySku:{}});
 const r=verified(x),m=r.cashflow.months;
 A.deepEqual(m.map(z=>Math.round(z.shared)),[300,300,300]);
 close(total(m,'shared'),900,'one real resource paid monthly');
 close(total(m,'stockPurchase'),400+900,'one physical purchase and recurring salon rent');
});
test('#31E2 credit interest and bullet principal remain separate from operating costs',()=>{
 const x=scenario([goods('A',40)],2);
 x.skus[0].creditPrincipal=500;x.skus[0].creditServiceMonthly=5;x.skus[0].creditMonths=3;
 const r=verified(x),m=r.cashflow.months;
 A.equal(m.length,3);
 close(total(m,'interest'),15,'all loan interest');
 close(total(m,'principalRepaid'),500,'bullet paid once');
 close(total(m,'loanDraw'),500,'loan drawn once');
 close(total(m,'stockPurchase'),800,'principal not reclassified into procurement');
});
test('#31E2 agent recognizes only its commission + owner tax; partner GMV excluded',()=>{
 const values={months:3,monthlyBudget:400,cpc:4,ctr:2,cvrLead:20,cvrDeal:50,
  costConsult:100,costPack:200,ltv:30,mgmt:0,site:0,hosting:0,dom:0,
  magnet:0,acq:10,taxTurnover:5,agentPct:20,agentTaxTurnover:10,markup:25};
 const agent=Adapter.build({mode:'agent',values,period:{
  deals:25,grossRevenue:3525,agentIncome:705,executorCost:2820},
  payers:{monthlyBudget:'partner',mgmt:'me',site:'me',
   hosting:'me',dom:'me',magnet:'me'},id:'agent',name:'Agent'});
 const x=scenario([goods('A',60),agent],3,3);
 const r=verified(x),m=r.cashflow.months;
 const ag=r.items.find(s=>s.id==='agent'),physical=r.items.find(s=>s.id==='A');
 const grossOwner=3*(agent.forecastUnitsPerMonth*ag.standaloneNet);
 close(total(m,'receipt'),3*20*physical.standaloneNet+grossOwner,'owner-only income');
 close(total(m,'tax'),(3*20*physical.standaloneNet)*.03+grossOwner*.10,
  'separate owner turnover tax, never tax partner GMV');
 close(total(m,'ad'),300,'partner-funded advertising excluded');
 A.equal(r.cashflow.vatCashBasis,'net-of-vat-operating');
});
