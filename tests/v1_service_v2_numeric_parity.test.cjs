'use strict';
// Source-faithful V1 ↔ V2 contract audit for one service, six delivery/role
// branches, two finance modes, two owner taxes, two VAT choices: 48 fixtures.
// Loads the real V1 functions from the production HTML (never parallel math).
const {test}=require('node:test');
const A=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Linked=require('../portfolio_v2_linked_engine.js');
const html=fs.readFileSync(path.join(__dirname,'..','Marketing_calc.HTML'),'utf8');
function between(begin,end){
  const a=html.indexOf(begin),b=html.indexOf(end,a);
  A.ok(a>=0&&b>a,'V1 source fragment missing: '+begin);
  return html.slice(a,b);
}
const source=[
  between('function serviceAgencyExpenseSplit(item,receipts=0){',
    'function currentProductPortfolioSnapshot() {'),
  between('function aggregateQuantityDetails(item) {','function calculateProductPortfolio() {'),
  between('function calculateProductPortfolio() {','function aggregatePricingMetrics(item) {'),
  between('function calculateAggregateCredit(item) {','function updateAggregateCredit(item) {'),
  between('function calculateCanonicalV1ServiceCashFlow(model,finishV1FinancialLedger) {',
    'function updatePriceListRange(item) {'),
  between('function v1FullServiceSku(item,row,model,draftSku,cycle,credit,ownerTaxType,ownerTaxPct) {',
    'function openLinkedPortfolioFromProducts() {')
].join('\n');
const factory=new Function('productPortfolio','productBusinessTaxType','productNumber',
  'aggregatePricingMetrics',source+';return {calculateProductPortfolio,calculateProductCashFlow,aggregatePlanMetrics,calculateAggregateCredit,v1FullServiceSku};');
const EPS=.015;
const n=x=>Number(x)||0;
function fixture(channel,role,funding,taxType,vat,creditMonths=2){
  const line=(key,bucket,monthly=0,capex=0,amort=0,ratePct=0,payer='agent')=>
    ({key,label:key,bucket,monthly,capex,amort,ratePct,payer});
  const agency={grossPrice:100,feePct:20,fixedFee:0,partnerVatPct:10,
    partnerTaxType:'turnover',partnerTaxPct:5,payers:{},
    lineItems:[
      line('material.known','direct',160),
      line('premises','production',100),
      line('electricity','electricity',40),
      line('purchase.0','equipment',0,600,50),
      line('advertising','advertising',900,0,0,0,'partner'),
      line('management','management',60),
      line('sales.fixed','selling',100),
      line('sales.commission','commission',0,0,0,5),
      line('sales.penalties','commission',0,0,0,1)
    ]};
  const horizon=3,qty=20,base={id:1,name:channel+'-'+role,source:'offline-service',
    serviceChannel:channel,serviceRole:role,serviceFinanceMode:'full',
    serviceAgency:role==='agent'?agency:null,serviceHorizonMonths:horizon,
    serviceCapex:600,serviceAmortMonthly:50,
    materialsUnitCost:8,materialsVariableUnit:8,materialsFixedBatch:0,
    materialsBatchQty:20,materialsBatchTotal:160,
    offlineServiceCapacity:channel==='offline'?40:0,
    productionUnitCost:9.5,productionFixedMonthly:150,
    productionElectricityPerUnit:2,productionDefectPct:0,
    productionQty:20,productionTotal:190,logisticsUnitCost:0,
    logisticsQty:20,salesQty:20,warehouseInboundUnitCost:0,warehouseDayCost:0,
    warehouseStorageUnitCost:0,customerDeliveryPct:0,customerReturnPct:0,
    salesFixedMonthly:100,salesVariablePct:5,penaltiesPct:1,
    forecastUnitsPerMonth:qty,adBudget:900,adManagement:60,
    planning:{fundingMode:funding,creditRatePct:12,creditTermMonths:creditMonths,
      targetMarginPct:30,reservePct:10,maxDiscountPct:0,minimumMarginPct:10},
    inputs:{'own-product-ad-budget':'900','own-product-ad-cpc':'4.5',
      'own-product-ad-ctr':'2','own-product-ad-click-lead':'20',
      'own-product-ad-lead-sale':'50','own-product-ad-management':'60',
      'own-sales-vat-pct':vat?'12':'0'},
    uiState:{choices:{salesVat:vat?'yes':'no'}}};
  return base;
}
function metrics(channel,role,funding,taxType,vat,creditMonths=2){
  const item=fixture(channel,role,funding,taxType,vat,creditMonths),taxPct=6,vatPct=vat?12:0;
  const api=factory([item],taxType,id=>id==='own-business-tax-pct'?taxPct:0,
    ()=>({salesVatChoice:vat?'yes':'no',vatReady:true,vatPct}));
  const model=api.calculateProductPortfolio(),cycle=api.aggregatePlanMetrics(item);
  const credit=api.calculateAggregateCredit(item);
  const v1=api.calculateProductCashFlow(model);
  A.equal(model.pricingReady,true,channel+'/'+role+'/'+funding+'/'+taxType+'/vat'+vat+
    ' '+JSON.stringify(cycle.quantityIssues));
  A.equal(v1.ready,true,JSON.stringify(v1));
  const row=model.items[0];
  const draft={id:'v1-1',name:item.name,source:item.source,
    unitCost:row.unitCost,forecastUnitsPerMonth:row.forecastSales,
    adBudget:row.adBudget,baseCac:row.baseCac,priceMin:1,priceMax:500,
    maxDiscountPct:0,minimumMarginPct:10,targetMarginPct:30,
    salesFixedMonthly:item.salesFixedMonthly,adManagement:item.adManagement,
    variableSalesPct:item.salesVariablePct+item.penaltiesPct,
    creditServiceMonthly:funding==='credit'?credit.monthlyServiceCost:0,
    creditPrincipal:funding==='credit'?credit.principal:0,
    creditMonths:funding==='credit'?credit.termMonths:0,
    reserveAmount:cycle.reserveAmount,inventoryQty:0,
    serviceCapacity:item.offlineServiceCapacity,serviceMaterialsUnit:item.materialsUnitCost,
    serviceElectricityUnit:item.productionElectricityPerUnit,
    serviceFixedMonthly:item.productionFixedMonthly,
    materialsBatchTotal:item.materialsBatchTotal,productionTotal:item.productionTotal,
    warehouseInboundUnitCost:0,warehouseDayCost:0,vatPct};
  const sku=api.v1FullServiceSku(item,row,model,draft,cycle,credit,taxType,taxPct);
  const state=Linked.fromV1({tax:{type:taxType,pct:taxPct},skus:[sku]});
  state.forecastMonths=sku.fullServiceHorizon;state.recurringDemandApproved=true;
  const v2=Linked.build(state);
  A.equal(v2.ready,true,channel+'/'+role+'/'+funding+'/'+taxType+'/vat'+vat+
    ' V2 '+JSON.stringify(v2.errors||[]));
  const p=v2.cashflow.periodPnl.months,cm=v2.cashflow.months;
  return {item,sku,v1,v2,v1Monthly:v1.months,v2Pnl:p,v2Cash:cm,tag:
    [channel,role,funding,taxType,'vat'+vat].join('/')};
}
const delta=(a,b)=>Math.round((a-b)*1e5)/1e5;
test('Canonical full V1→V2 numeric parity: 6 roles × own/credit × turnover/profit × VAT',()=>{
  let worst={abs:0},count=0;
  const report=[];
  for(const channel of ['online','offline'])
    for(const role of ['self','hired','agent'])
      for(const funding of ['cash','credit'])
        for(const taxType of ['turnover','profit'])
          for(const vat of [false,true]){
            const r=metrics(channel,role,funding,taxType,vat);count++;
            const a=r.v1Monthly[0],p=r.v2Pnl[0],c=r.v2Cash[0];
            const checks={
              revenue:delta(a.inflow-a.financedInflow,p.revenue),
              profitBeforeTax:delta(a.taxableProfit,p.preTaxProfit),
              tax:delta(a.taxPaid,p.taxAccrued),
              interest:delta(a.interestPaid,c.interest),
              capex:delta(a.capexPaid,c.capex),
              principal:delta(r.v1Monthly[1].principalRepaid,c.principalRepaid+
                (r.v2Cash[1]?.principalRepaid||0)),
              totalOwnerCapital:delta(a.financedInflow,
                r.v2.cashflow.ownerCapital+r.v2.cashflow.borrowedCapital),
              reserve:delta(r.v1.reserveLocked,r.v2.cashflow.reserve)
            };
            for(const [metric,difference] of Object.entries(checks))
              if(Math.abs(difference)>worst.abs)worst={abs:Math.abs(difference),tag:r.tag,metric,difference};
            report.push({tag:r.tag,...checks});
          }
  console.log('NOMAD360_V1_V2_MATRIX',JSON.stringify({count,worst,
    sample:report.filter((x,i)=>i%8===0)}));
  A.equal(count,48);
  for(const item of report)
    for(const k of ['revenue','profitBeforeTax','tax','interest','capex','reserve'])
      A.ok(Math.abs(item[k])<=EPS,item.tag+' '+k+' V1-V2 delta='+item[k]);
});


// Long bullet loan: the owner's approved V1 cash calendar outlasts the
// chosen three-month service horizon. V2 must retain maturity, not hide debt.
test('Native V1→V2 long-credit maturity: six roles x profit/turnover x VAT',()=>{
  let checked=0;
  for(const channel of ['online','offline'])
    for(const role of ['self','hired','agent'])
      for(const taxType of ['turnover','profit'])
        for(const vat of [false,true]){
          const r=metrics(channel,role,'credit',taxType,vat,5);checked++;
          A.equal(r.v1Monthly.length,5,r.tag+' source loan calendar');
          A.equal(r.v2Cash.length,5,r.tag+' V2 maturity calendar');
          A.ok(Math.abs(r.v1Monthly[4].principalRepaid-r.v2Cash[4].principalRepaid)<.015,
            r.tag+' principal maturity');
          A.ok(Math.abs(r.v1Monthly[0].interestPaid-r.v2Cash[0].interest)<.015,
            r.tag+' interest in first month');
          for(let i=0;i<5;i++){
            A.ok(Math.abs((r.v1Monthly[i].inflow-r.v1Monthly[i].financedInflow)-
              r.v2Pnl[i].revenue)<.015,r.tag+' revenue month '+(i+1));
            A.ok(Math.abs(r.v1Monthly[i].taxPaid-r.v2Pnl[i].taxAccrued)<.015,
              r.tag+' tax month '+(i+1));
          }
        }
  A.equal(checked,24);
  console.log('NOMAD360_LONG_CREDIT_PARITY_GREEN',checked);
});
