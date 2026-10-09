const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','Marketing_calc.HTML'),'utf8');
const slice=(start,end)=>{
 const a=html.indexOf('function '+start),b=html.indexOf('function '+end,a);
 assert.ok(a>=0&&b>a,'missing boundary '+start);
 return html.slice(a,b);
};
const funcs=[
 slice('aggregateQuantityDetails(item)','aggregatePricingMetrics(item)'),
 slice('calculateAggregateCredit(item)','updateAggregateCredit(item)'),
 slice('calculateDropshipCashFlow(model)','priceListRequiredCustomerPrice('),
 slice('priceListRequiredCustomerPrice(','updatePriceListRange(item)')
].join('\n');
const fixture=()=>({
 id:1,name:'Майка',source:'dropship',
 materialsUnitCost:50,materialsBatchQty:1,materialsBatchTotal:50,
 productionQty:1,productionTotal:0,productionUnitCost:0,productionDefectPct:0,
 logisticsQty:20,logisticsUnitCost:5,warehouseInboundUnitCost:0,
 warehouseStorageUnitCost:0,warehouseDayCost:0,
 customerDeliveryPct:10,customerReturnPct:0,salesQty:20,
 salesFixedMonthly:200,salesVariablePct:5,penaltiesPct:0,
 adManagement:100,adBudget:900,forecastUnitsPerMonth:20,
 dropshipDeliveryDays:15,dropshipPayoutLagDays:0,dropshipPayoutMode:'after',
 planning:{fundingMode:'cash',creditRatePct:12,creditTermMonths:6,
  targetMarginPct:30,reservePct:10,maxDiscountPct:20,minimumMarginPct:10},
 inputs:{'resale-buy-total':'50','resale-buy-qty':'1','dropship-delivery-days':'15',
  'own-product-ad-budget':'900','own-product-ad-cpc':'4.5',
  'own-product-ad-ctr':'2','own-product-ad-click-lead':'20',
  'own-product-ad-lead-sale':'50','own-product-ad-management':'100'}
});
const engine=(goods,taxType='turnover')=>
 new Function('productPortfolio','productBusinessTaxType','productNumber','aggregatePricingMetrics',
   funcs+';return {aggregateQuantityDetails,aggregatePlanMetrics,calculateProductPortfolio,calculateAggregateCredit,calculateProductCashFlow,calculatePriceListRange};'
 )(goods,taxType,id=>id==='own-business-tax-pct'?6:0,
   ()=>({salesVatChoice:'no',vatReady:false,vatPct:0}));
const close=(a,b,msg)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-7,msg+': '+a+' != '+b);
test('dropship ad budget/CAC drives demand; no warehouse, no production',()=>{
 const x=fixture(),e=engine([x]);
 const plan=e.aggregatePlanMetrics(x),m=e.calculateProductPortfolio();
 assert.deepEqual(e.aggregateQuantityDetails(x),[]);
 close(m.items[0].forecastSales,20,'forecast');
 close(plan.supplierFloat,550,'financed orders');
 close(plan.baseRequiredCapital,1750,'starting cash before reserve');
 close(plan.reserveAmount,175,'liquidity reserve');
 close(plan.requiredCapital,1925,'starting cash with reserve');
 close(plan.nonRevenueCosts,2300,'operating spend independent of cash funding');
 close(plan.warehouseTotal,0,'warehouse');
 close(plan.productionTotal,0,'manufacture');
 close(plan.totalCycleDays,45,'settlement horizon');
 assert.equal(m.pricingReady,true);
 assert.ok(m.items[0].price>100);
 assert.equal(e.calculatePriceListRange(x).ready,true);
});
test('delivery shifts receipts; cash flow keeps advertising, supplier and commission separate',()=>{
 const x=fixture(),e=engine([x]),m=e.calculateProductPortfolio(),f=e.calculateProductCashFlow(m);
 assert.equal(f.ready,true);
 assert.equal(f.months.length,2);
 close(f.months[0].financedInflow,1925,'initial capital (not profit)');
 const salesRevenue=20*m.items[0].price*m.taxPriceMultiplier;
 close(f.months.reduce((s,x)=>s+x.inflow-x.financedInflow,0),salesRevenue,'revenue');
 close(f.months.reduce((s,x)=>s+x.outflow-x.taxPaid,0),2300+salesRevenue*.05,'cycle operating payments');
 close(f.months.reduce((s,x)=>s+x.taxPaid,0),salesRevenue*.06,'turnover tax');
 assert.ok(f.months[1].inflow>0,'delayed payout is in month 2');
 close(f.freeCumulativeEnd,f.cumulativeEnd-175,'reserve not available cash');
});
test('early customer payout removes supplier financing float, not actual cost of orders',()=>{
 const x=fixture(),e=engine([x]);
 const after=e.aggregatePlanMetrics(x);
 x.dropshipPayoutMode='before';
 const before=e.aggregatePlanMetrics(x);
 close(before.supplierFloat,0,'supplier cash float');
 close(before.requiredCapital,1320,'advertising+management+fixed+reserve');
 close(before.nonRevenueCosts,after.nonRevenueCosts,'total spend unchanged');
 assert.equal(e.calculateProductCashFlow(e.calculateProductPortfolio()).ready,true);
});
test('loan cost per forecast purchase, repayment and interest, including slow delivery',()=>{
 const x=fixture(),e=engine([x]),cashPrice=e.calculateProductPortfolio().items[0].price;
 x.planning.fundingMode='credit';
 const credit=e.calculateAggregateCredit(x),m=e.calculateProductPortfolio();
 assert.equal(m.pricingReady,true);
 close(m.items[0].creditServicePerUnit,credit.totalInterest/20,'interest per forecast order');
 assert.ok(m.items[0].price>cashPrice);
 const flow=e.calculateProductCashFlow(m);
 assert.equal(flow.ready,true);
 assert.equal(flow.months.length,6);
 close(flow.months.reduce((s,x)=>s+x.interestPaid,0),credit.totalInterest,'interest paid');
 close(flow.months.reduce((s,x)=>s+x.principalRepaid,0),credit.principal,'principal repaid');
});
test('cannot price supplier without price, delivery time or ad forecast',()=>{
 const x=fixture(),e=engine([x]);
 x.inputs['resale-buy-total']='';
 assert.equal(e.calculateProductPortfolio().pricingReady,false);
 x.inputs['resale-buy-total']='50';
 x.inputs['dropship-delivery-days']='';
 assert.ok(e.aggregateQuantityDetails(x).some(v=>v.kind==='logistics'));
 x.inputs['dropship-delivery-days']='15';
 x.forecastUnitsPerMonth=0;
 assert.ok(e.aggregateQuantityDetails(x).some(v=>v.kind==='ads'));
});
test('own manufacturing still enforces inputs and product defects',()=>{
 const x=fixture(),e=engine([x]);
 x.source='own';x.productionQty=10;x.productionDefectPct=10;x.materialsBatchQty=10;x.logisticsQty=10;
 assert.ok(e.aggregateQuantityDetails(x).some(v=>v.kind==='materials'));
});
