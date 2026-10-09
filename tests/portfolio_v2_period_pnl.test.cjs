const {test}=require('node:test');
const A=require('node:assert/strict');
const E=require('../portfolio_v2_linked_engine.js');
const Adapter=require('../portfolio_v2_online_adapter.js');
const close=(x,y,msg)=>A.ok(Number.isFinite(x)&&Math.abs(x-y)<.00001,
 msg+': actual '+x+', expected '+y);
const sum=(rows,key)=>rows.reduce((v,m)=>v+m[key],0);
const goods=(id,stock=40)=>({
 id,name:id,source:'resale',unitCost:20,forecastUnitsPerMonth:20,
 adBudget:100,baseCac:5,priceMin:20,priceMax:250,maxDiscountPct:0,
 minimumMarginPct:10,targetMarginPct:25,salesFixedMonthly:0,adManagement:0,
 variableSalesPct:0,creditServiceMonthly:0,creditPrincipal:0,creditMonths:0,
 vatPct:0,inventoryQty:stock,materialsBatchTotal:stock*20,productionTotal:0,
 reserveAmount:0
});
const scenario=(skus,months=2,tax={type:'turnover',pct:5})=>{
 const x=E.fromV1({skus,tax});x.forecastMonths=months;x.recurringDemandApproved=true;return x;
};
const verified=s=>{
 const r=E.build(s);A.equal(r.ready,true,JSON.stringify(r.errors));
 A.equal(r.cashflow.periodPnl.ready,true);
 A.equal(r.cashflow.periodPnl.pricePolicy,'full-period-actual-sku-margin-pricing');
 return r;
};
test('F2A physical COGS accrues on SOLD units; batch money paid once, never twice',()=>{
 const r=verified(scenario([goods('a',40)])),p=r.cashflow.periodPnl;
 const rev=20*r.items[0].standaloneNet;
 A.equal(p.months.length,2);
 for(const m of p.months){
  close(m.revenue,rev,'20 paid orders revenue');
  close(m.cogs,400,'20 sold units COGS, not full stock cash');
  close(m.marketing,100,'one own-media expense');
  close(m.ebitda,rev-400-100,'EBITDA');
  close(m.taxAccrued,rev*.05,'turnover on VAT-net realized orders');
  close(m.netProfit,rev*.95-500,'net profit');
 }
 close(sum(r.cashflow.months,'stockPurchase'),800,'full batch cash purchase exactly once');
 close(p.netProfit,2*(rev*.95-500),'H profit equals sum, not owner cash');
 close(p.netMargin,p.netProfit/p.revenue*100,'H weighted margin');
 A.equal(p.invariants.revenueConserved,true);
 A.equal(p.invariants.marketingConserved,true);
});
test('F2A campaign stays committed after sellout: month zero-revenue loss reduces period margin',()=>{
 const s=scenario([goods('a',20),goods('b',100)],5);
 s.resources=[{id:'c',label:'common',kind:'campaign',amount:200,
  cadence:'monthly',pool:'adBudget',allocation:'usage',usageMode:'fixed',
  usage:{a:1,b:1},skuIds:['a','b'],includedBySku:{a:100,b:100}}];
 const r=verified(s),p=r.cashflow.periodPnl;
 const price=r.items[0].standaloneNet;
 close(p.revenue,20*r.items.find(s=>s.id==='a').standaloneNet+
  100*r.items.find(s=>s.id==='b').standaloneNet,'only 20+100 actually sold at their respective prices');
 close(p.months[3].marketing,200,'month4 still-paid campaign');
 close(p.months[3].revenue,0,'month4 no buyers');
 close(p.months[3].netProfit,-200,'month4 loss');
 A.equal(p.months[3].netMargin,null,'undefined margin without sales');
 close(p.months[4].netProfit,-200,'month5 loss');
 close(p.netProfit,120*price*.95-120*20-5*200,'full 5-month profit');
 A.ok(p.netMargin<r.items[0].targetMarginPct,
  '30-day target does NOT prove 5-month target');
 close(sum(r.cashflow.months,'ad'),1000,'marketing cash conserved');
});
test('F2A offline salon rent is not embedded in COGS again',()=>{
 const salon={...goods('salon',0),source:'offline-service',
  serviceMaterialsUnit:5,serviceElectricityUnit:0,
  serviceFixedMonthly:300,serviceCapacity:30,
  materialsBatchTotal:100,productionTotal:300,unitCost:20};
 const r=verified(scenario([salon],2)),p=r.cashflow.periodPnl;
 for(const month of p.months){
  close(month.cogs,100,'visits only consumables');
  close(month.serviceFixed,300,'salon rent payroll paid once');
  close(month.marketing,100,'one V1 campaign');
  close(month.ebitda,month.revenue-500,'materials+rent+media counted once');
 }
 close(sum(r.cashflow.months,'stockPurchase'),600,'rent paid at start each month');
});
test('F2A dropship receipt delay separates tax accrual, cash tax and credit demand',()=>{
 const drop={...goods('drop',0),source:'dropship',materialsBatchTotal:0,
  dropshipDeliveryDays:30,dropshipPayoutLagDays:10,
  dropshipPayoutMode:'after'};
 const r=verified(scenario([drop],2)),p=r.cashflow.periodPnl;
 close(p.revenue,40*r.items[0].standaloneNet,'all fulfilled invoiced orders');
 close(p.taxAccrued,p.revenue*.05,'tax accrued on sale not payout');
 A.ok(p.taxTimingDifference>0,'tax cash lags booked revenue');
 A.ok(r.cashflow.months.length>p.months.length,'payment tail beyond H retained');
 close(p.netProfit,p.revenue*.95-40*20-200,'margin with fulfilled costs');
});
test('F2A profit tax uses accrued gross operating earnings, loan principal cash-only',()=>{
 const s=scenario([goods('a',40)],2,{type:'profit',pct:10});
 s.skus[0].creditPrincipal=500;s.skus[0].creditServiceMonthly=5;s.skus[0].creditMonths=3;
 const r=verified(s),p=r.cashflow.periodPnl;
 const rev=20*r.items[0].standaloneNet;
 for(const month of p.months){
  close(month.interest,5,'monthly interest expense');
  close(month.ebitda,rev-500,'operations unaffected by financing');
  close(month.taxAccrued,Math.max(0,rev-505)*.1,'profit tax after interest');
 }
 close(p.postHorizonInterest,5,'debt tail visible beyond H');
 close(sum(r.cashflow.months,'principalRepaid'),500,'principal paid, not COGS');
});
test('F2A once-only startup assets have cash impact but uncertain amortization explicitly disclosed',()=>{
 const s=scenario([goods('a',40)],2);
 s.resources.push({id:'eq',label:'Equipment',kind:'equipment',amount:1000,
  cadence:'once',pool:'none',allocation:'usage',usageMode:'fixed',
  usage:{a:1},skuIds:['a'],includedBySku:{}});
 const r=verified(s),p=r.cashflow.periodPnl;
 A.equal(p.onceAssetAmortizationUnverified,true);
 close(sum(r.cashflow.months,'shared'),1000,'real startup equipment money');
 close(p.netProfit,2*(20*r.items[0].standaloneNet*.95-500),
  'asset purchase not silently expensed as monthly rent');
});
test('F2A period margin undefined if no sales, not falsely reported zero',()=>{
 const s=scenario([goods('a',20)],2);
 s.resources=[{id:'c',label:'common',kind:'campaign',amount:100,
  cadence:'monthly',pool:'adBudget',allocation:'usage',usageMode:'fixed',
  usage:{a:1},skuIds:['a'],includedBySku:{a:100}}];
 const r=verified(s);
 close(r.cashflow.periodPnl.months[1].netProfit,-100,'contractual campaign loss');
 A.equal(r.cashflow.periodPnl.months[1].netMargin,null);
});

test('F2A owner-only agent revenue and tax never includes partner gross turnover',()=>{
 const vals={months:3,monthlyBudget:400,cpc:4,ctr:2,cvrLead:20,cvrDeal:50,
  costConsult:100,costPack:200,ltv:30,mgmt:0,site:0,hosting:0,dom:0,
  magnet:0,acq:10,taxTurnover:5,agentPct:20,agentTaxTurnover:10,markup:25};
 const online=Adapter.build({id:'agent',name:'Agency fee',mode:'agent',
  values:vals,period:{deals:25,grossRevenue:3525,agentIncome:705,executorCost:2820},
  payers:{monthlyBudget:'partner',mgmt:'me',site:'me',hosting:'me',dom:'me',magnet:'me'}});
 const r=verified(scenario([goods('a',60),online],3,{type:'turnover',pct:3}));
 const p=r.cashflow.periodPnl,good=r.items.find(s=>s.id==='a');
 const agent=r.items.find(s=>s.id==='agent');
 const ownAgencyRevenue=online.forecastUnitsPerMonth*agent.standaloneNet*3;
 const goodsRevenue=20*good.standaloneNet*3;
 close(p.revenue,ownAgencyRevenue+goodsRevenue,
  'owner fee plus own physical revenue, not partner GMV');
 close(p.taxAccrued,ownAgencyRevenue*.10+goodsRevenue*.03,
  'agent separate turnover tax only on own fee');
 close(sum(p.months,'marketing'),300,
  'partner-funded acquisition not charged as owner OPEX');
});
