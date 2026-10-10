'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict');
const {build}=require('../portfolio_v2_full_service.js');
const near=(a,b,label,eps=.012)=>A.ok(Math.abs(a-b)<eps,label+': '+a+' vs '+b);
const base={months:3,monthlyForecast:200,capacity:250,priceGross:100,vatPct:12,
 discountPct:0,unitCashCost:8,commissionPct:0,fixedCashMonthly:10000,
 equipmentPurchase:0,equipmentAmortMonthly:0,taxType:'profit',taxPct:10,
 reservePct:10,funding:'own'};
test('TZ02 corrected control oracle: own capital, day-0 deficit, N=3',()=>{
 const r=build(base);
 near(r.netUnitPrice,89.285714,'net price');
 near(r.months[0].revenue,17857.142857,'revenue');
 near(r.months[0].variable,1600,'variable cost');
 near(r.preTaxPeakDeficit,10000,'day-0 deficit');
 near(r.reserve,1160,'locked reserve');
 near(r.capital,11160,'initial capital');
 near(r.months[0].ebt,6257.142857,'pre-tax income');
 near(r.months[0].tax,625.7142857,'profit tax');
 near(r.months[0].operatingCash,5631.42857,'month op cash');
 near(r.months[2].operatingCumulative,16894.285714,'three-month op cash');
 A.equal(r.paybackMonth,2);A.equal(r.firstPositiveMonth,1);
 A.equal(r.outstandingPrincipal,0);
 A.equal(r.daily[0].fixed,10000);
});
test('TZ02 credit interest monthly, bullet principal only at term, remainder outside horizon',()=>{
 const full=build({...base,funding:'credit',annualRatePct:24,creditMonths:3});
 near(full.capital,11160,'borrowed principal');
 near(full.months[0].interest,223.2,'month one interest');
 near(full.months[0].tax,603.3942857,'profit tax with interest');
 near(full.months[0].operatingCash,5430.54857,'month CF with interest');
 near(full.months[2].operatingCumulative,16291.645714,'three-month CF');
 A.deepEqual(full.months.map(m=>m.principalDue),[0,0,11160]);
 A.equal(full.outstandingPrincipal,0);
 const short=build({...base,months:2,funding:'credit',annualRatePct:24,creditMonths:12});
 A.equal(short.creditRepaid,0);near(short.outstandingPrincipal,short.capital,'debt held');
 A.ok(short.months.every(m=>m.principalDue===0));
});
test('TZ02 VAT pass-through and both tax types',()=>{
 const v0=build({...base,vatPct:0});
 const v12=build(base);
 A.ok(v0.months[0].revenue>v12.months[0].revenue);
 near(v12.months[0].revenue,200*100/1.12,'VAT excluded from CF');
 const turnover=build({...base,taxType:'turnover'});
 near(turnover.months[0].tax,turnover.months[0].revenue*.1,'turnover tax');
 near(turnover.months[0].operatingCash,4471.42857,'turnover CF');
 const profit=build({...base,fixedCashMonthly:25000});
 A.equal(profit.months[0].tax,0,'no negative profit tax');
});
test('TZ02 capacity rejects excess even without UI, no implicit capping',()=>{
 A.throws(()=>build({...base,monthlyForecast:251}),/превышает мощность/);
 A.throws(()=>build({...base,monthlyForecast:[200,260,200]}),/Прогноз месяца 2/);
});
test('TZ02 CAPEX day 0; depreciation accrual not paid twice',()=>{
 const x=build({...base,equipmentPurchase:3000,equipmentAmortMonthly:250});
 near(x.preTaxPeakDeficit,13000,'CAPEX in required cash at day zero');
 near(x.months[0].assetCash,3000,'one-time equipment payment');
 near(x.months[1].assetCash,0,'no repeat CAPEX');
 near(x.months[0].depreciation,250,'monthly accrual');
 near(x.months[0].ebt,6007.142857,'depreciation in EBT');
 const baseline=build({...base,equipmentPurchase:3000,equipmentAmortMonthly:0});
 near(x.months[0].operatingCash-baseline.months[0].operatingCash,25,
   'profit tax shield, not repeated depreciation cash outflow');
});
test('TZ02 horizon changes do not alter earlier month rows with own funds',()=>{
 const n1=build({...base,months:1}),n6=build({...base,months:6});
 for(const field of ['quantity','revenue','variable','fixed','tax','interest','operatingCash','profit']){
   near(n1.months[0][field],n6.months[0][field],'first month '+field,1e-9);
 }
});
test('TZ02 handles initially unprofitable service and 10-pass convergence rule',()=>{
 const x=build({...base,fixedCashMonthly:20000,months:3,funding:'credit',annualRatePct:20,creditMonths:12});
 A.ok(x.capital>x.preTaxPeakDeficit);
 A.ok(x.months[0].operatingCash<0);
 A.equal(x.paybackMonth,null);
 A.equal(x.firstPositiveMonth,null);
 near(x.outstandingPrincipal,x.capital,'outstanding debt');
});

test('TZ02 V1 online month-by-month demand is preserved, later horizon extends last observed month',()=>{
 const projected=build({...base,months:5,monthlyForecast:[5,9,12]});
 A.deepEqual(projected.months.map(m=>m.quantity),[5,9,12,12,12]);
 const first=build({...base,months:3,monthlyForecast:[5,9,12]});
 for(let i=0;i<3;i++){
   near(first.months[i].revenue,projected.months[i].revenue,'V1 demand month '+(i+1));
 }
});

test('TZ02 equivalent one-SKU goods and service share VAT, tax and interest bases',()=>{
 const Goods=require('../portfolio_v2_linked_engine.js');
 const own=Goods.fromV1({tax:{type:'profit',pct:10},skus:[{
   id:'sku-test',name:'Equivalent sale',source:'own',fixedPriceFromV1:true,
   unitCost:8,forecastUnitsPerMonth:200,adBudget:100,baseCac:.5,
   priceMin:100,priceMax:100,maxDiscountPct:0,minimumMarginPct:0,
   targetMarginPct:0,salesFixedMonthly:9900,adManagement:0,
   variableSalesPct:0,creditPrincipal:11160,creditServiceMonthly:223.2,
   creditMonths:3,vatPct:12,inventoryQty:200,materialsBatchTotal:1600,
   productionTotal:0,reserveAmount:1160
 }]});
 const product=Goods.build(own);
 A.equal(product.ready,true,JSON.stringify(product.errors));
 const service=build({...base,funding:'credit',annualRatePct:24,creditMonths:3});
 near(product.items[0].revenue,service.months[0].revenue,'item net VAT revenue',.01);
 near(product.items[0].creditMonthly,service.months[0].interest,'item monthly interest');
 near(product.items[0].actualAfterTaxMargin,
   service.months[0].revenue>0?service.months[0].profit/service.months[0].revenue*100:0,
   'item after tax profit margin',.05);
});

test('TZ02 reserve covers ALL monthly variable cash including commission, not just consumables',()=>{
 const x=build({...base,commissionPct:5});
 const commission=200*(100/1.12)*.05;
 near(x.months[0].commission,commission,'commission cash');
 near(x.reserve,(1600+commission+10000)*.1,'first-month variable plus fixed reserve');
 near(x.capital,10000+x.reserve,'startup working liquidity');
});

test('TZ02 daily financing ledger reconciles to monthly cash and principal maturity',()=>{
 for(const funding of ['own','credit']){
   const x=build({...base,funding,annualRatePct:24,creditMonths:3});
   near(x.daily[0].financingIn,x.capital,'day-zero funding');
   near(x.daily[0].netCashFlow,x.daily[0].financingIn+x.daily[0].revenue-
     x.daily[0].variable-x.daily[0].fixed-x.daily[0].asset-
     x.daily[0].interest-x.daily[0].tax,'day-zero cash ordering');
   for(const m of x.months){
     const days=x.daily.slice((m.month-1)*30,m.month*30);
     near(days.reduce((sum,d)=>sum+d.netCashFlow,0),m.netCashFlow,'month '+m.month+' net CF');
     near(days[29].cashOnHand,m.cashOnHand,'month '+m.month+' closing cash');
     near(days[29].freeCash,m.freeCash,'month '+m.month+' free cash');
   }
   near(x.daily[89].principalDue,funding==='credit'?x.capital:0,'principal only at maturity');
   A.equal(x.daily[88].principalDue,0);
 }
 const short=build({...base,months:2,funding:'credit',annualRatePct:24,creditMonths:12});
 A.ok(short.daily.every(day=>day.principalDue===0),'future bullet excluded from visible period');
 near(short.daily[59].cashOnHand,short.cashOnHand,'short horizon cash');
 near(short.outstandingPrincipal,short.capital,'outstanding principal');
});

test('TZ02 matrix: independent accrual and cash oracles across VAT/tax/funding/horizon',()=>{
 for(const vatPct of [0,12,20])for(const taxType of ['turnover','profit'])
 for(const funding of ['own','credit'])for(const months of [1,3,5]){
   const x=build({...base,vatPct,taxType,funding,months,
     annualRatePct:18,creditMonths:4,commissionPct:3,
     equipmentPurchase:1800,equipmentAmortMonthly:150,discountPct:7});
   const sale=200*100*(1-.07)/(1+vatPct/100);
   const variable=1600+sale*.03;
   const interest=funding==='credit'?x.capital*.18/12:0;
   near(x.reserve,(variable+10000)*.1,'reserve '+vatPct+taxType+funding+months);
   for(const m of x.months){
     const accrualInterest=funding==='credit'&&m.month<=4?interest:0;
     const ebt=sale-variable-10000-150-accrualInterest;
     const tax=taxType==='turnover'?sale*.1:Math.max(0,ebt)*.1;
     const cash=sale-variable-10000-tax-accrualInterest;
     near(m.revenue,sale,'independent net-VAT revenue');
     near(m.variable,variable,'independent variable including commission');
     near(m.ebt,ebt,'independent pretax profit');
     near(m.tax,tax,'independent '+taxType+' tax');
     near(m.profit,ebt-tax,'independent after-tax accounting profit');
     near(m.operatingCash,cash,'independent operating cash');
     near(m.principalDue,funding==='credit'&&m.month===4?x.capital:0,
       'only contractual maturity repays principal');
     const days=x.daily.slice((m.month-1)*30,m.month*30);
     near(days.reduce((acc,d)=>acc+d.netCashFlow,0),m.netCashFlow,
       'bank daily/monthly reconciliation');
   }
   near(x.daily[x.daily.length-1].cashOnHand,x.cashOnHand,'closing bank cash');
   near(x.daily[x.daily.length-1].freeCash,x.freeCash,'closing available cash');
   const auditedPeak=-Math.min(0,...x.daily.flatMap(d=>
     [d.beforeServiceOperatingCumulative,d.operatingCumulative]));
   near(auditedPeak,x.peakDeficit,'intra-day operational peak before customer receipts');
   near(x.totalDepreciation,150*months,'depreciation accrual over selected months');
 }
});
