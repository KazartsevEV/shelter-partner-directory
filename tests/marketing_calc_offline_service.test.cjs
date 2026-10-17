const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','Marketing_calc.HTML'),'utf8');
function slice(a,b){const i=html.indexOf('function '+a),j=html.indexOf('function '+b,i);assert.ok(i>=0&&j>i,'missing function '+a);return html.slice(i,j)}
const script=[
 slice('aggregateQuantityDetails(item)','aggregatePricingMetrics(item)'),
 slice('calculateAggregateCredit(item)','updateAggregateCredit(item)'),
 slice('calculateOfflineServiceCashFlow(model)','priceListRequiredCustomerPrice('),
 slice('priceListRequiredCustomerPrice(','updatePriceListRange(item)')
].join('\n');
const fixture=()=>({
 id:1,name:'Маникюр с покрытием',source:'offline-service',
 materialsUnitCost:8,materialsBatchQty:20,materialsBatchTotal:160,
 materialsVariableUnit:8,materialsFixedBatch:0,productionUnitCost:61,
 productionFixedMonthly:1200,productionElectricityPerUnit:1,
 productionDefectPct:0,productionQty:20,productionTotal:1220,
 logisticsQty:20,logisticsUnitCost:0,warehouseInboundUnitCost:0,
 warehouseStorageUnitCost:0,warehouseDayCost:0,warehouseStageTotal:0,
 customerDeliveryPct:0,customerReturnPct:0,
 offlineServiceCapacity:30,salesQty:20,salesFixedMonthly:0,salesVariablePct:4,
 penaltiesPct:0,forecastUnitsPerMonth:20,adBudget:900,adManagement:100,
 planning:{fundingMode:'cash',creditRatePct:12,creditTermMonths:3,reservePct:10,
 targetMarginPct:30,minimumMarginPct:10,maxDiscountPct:20},
 inputs:{'offline-service-monthly-capacity':'30','own-product-ad-budget':'900',
 'own-product-ad-cpc':'4.5','own-product-ad-ctr':'2','own-product-ad-click-lead':'20',
 'own-product-ad-lead-sale':'50','own-product-ad-management':'100'}
});
const engine=(items)=>new Function('productPortfolio','productBusinessTaxType','productNumber','aggregatePricingMetrics',
 script+';return {aggregateQuantityDetails,aggregatePlanMetrics,calculateProductPortfolio,calculateAggregateCredit,calculateProductCashFlow,calculatePriceListRange};'
)(items,'turnover',id=>id==='own-business-tax-pct'?6:0,
 ()=>({salesVatChoice:'no',vatReady:false,vatPct:0}));
const eq=(a,b,msg)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<.000001,(msg||'mismatch')+': '+a+' != '+b);
test('service consumes per-visit materials, fixed rent and wages, no warehouse and no defects',()=>{
 const item=fixture(),e=engine([item]),plan=e.aggregatePlanMetrics(item);
 assert.deepEqual(e.aggregateQuantityDetails(item),[]);
 eq(plan.consumablesTotal,160);
 eq(plan.premisesWorkersMonthly,1200);
 eq(plan.productionTotal,1220);
 eq(plan.warehouseTotal,0);
 eq(plan.nonRevenueCosts,2380);
 eq(plan.requiredCapital,2618);
 eq(plan.totalCycleDays,30);
 const result=e.calculateProductPortfolio();
 assert.equal(result.pricingReady,true);
 assert.ok(result.items[0].price>item.productionUnitCost+item.materialsUnitCost);
 assert.equal(e.calculatePriceListRange(item).ready,true);
});
test('physical capacity caps advertising demand; no fictitious inventory error',()=>{
 const item=fixture(),e=engine([item]);item.offlineServiceCapacity=15;
 const issues=e.aggregateQuantityDetails(item);
 assert.equal(issues.length,1);
 assert.equal(issues[0].kind,'service-capacity');
 assert.ok(!issues.some(x=>/склад|материала для/.test(x.message)));
 assert.equal(e.calculateProductPortfolio().pricingReady,false);
 item.offlineServiceCapacity=0;
 assert.ok(e.aggregateQuantityDetails(item).some(x=>x.kind==='service-capacity'));
 item.offlineServiceCapacity=30;item.forecastUnitsPerMonth=0;
 assert.ok(e.aggregateQuantityDetails(item).some(x=>x.kind==='ads'));
});
test('service credit/taxes/discounts/cash flow use existing price engine',()=>{
 const item=fixture(),e=engine([item]);
 const before=e.calculateProductPortfolio().items[0].price;
 item.planning.fundingMode='credit';
 const credit=e.calculateAggregateCredit(item),m=e.calculateProductPortfolio();
 assert.equal(m.pricingReady,true);
 assert.ok(m.items[0].price>before);
 eq(m.items[0].creditServicePerUnit,credit.totalInterest/20);
 const cf=e.calculateProductCashFlow(m);
 assert.equal(cf.ready,true);
 eq(cf.months.reduce((a,x)=>a+x.interestPaid,0),credit.totalInterest);
 eq(cf.months.reduce((a,x)=>a+x.principalRepaid,0),credit.principal);
 const rev=m.items[0].price*20*m.taxPriceMultiplier;
 eq(cf.months.reduce((a,x)=>a+x.inflow-x.financedInflow,0),rev);
 eq(cf.months.reduce((a,x)=>a+x.taxPaid,0),rev*.06);
 assert.equal(cf.months.length,3);
});
test('old own-manufacturing and resale still enforce physical inventory sequence',()=>{
 const first=fixture();first.source='own';first.materialsBatchQty=5;
 first.productionQty=20;first.productionDefectPct=5;first.logisticsQty=20;
 assert.ok(engine([first]).aggregateQuantityDetails(first).some(x=>x.kind==='materials'));
 const resale=fixture();resale.source='resale';resale.materialsBatchQty=10;
 resale.logisticsQty=20;resale.inputs['resale-buy-total']='80';
 assert.ok(engine([resale]).aggregateQuantityDetails(resale).some(x=>x.kind==='materials'));
});
