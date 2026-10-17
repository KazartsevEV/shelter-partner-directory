/* Strict F3 five-source fixture: independent control inputs, not from V2
   outputs. The oracle in the tests uses only contract prices and quantities. */
'use strict';
const Adapter=require('../portfolio_v2_online_adapter.js');
const good=(id,source,forecast,stock,unitCost)=>({
 id,name:id,source,unitCost,forecastUnitsPerMonth:forecast,
 adBudget:100,baseCac:100/forecast,priceMin:20,priceMax:250,
 maxDiscountPct:20,minimumMarginPct:10,targetMarginPct:25,
 salesFixedMonthly:0,adManagement:0,variableSalesPct:0,
 creditServiceMonthly:0,creditPrincipal:0,creditMonths:0,
 vatPct:0,inventoryQty:stock,materialsBatchTotal:stock*unitCost,
 productionTotal:0,reserveAmount:0,serviceCapacity:40
});
function fixture(taxType='turnover'){
 const own={...good('own','own',15,45,20),
   creditPrincipal:500,creditMonths:4,creditServiceMonthly:5};
 const resale=good('resale','resale',20,100,20);
 const drop={...good('drop','dropship',10,0,12),materialsBatchTotal:0,
   dropshipDeliveryDays:15,dropshipPayoutLagDays:20,dropshipPayoutMode:'after'};
 const salon={...good('salon','offline-service',8,0,5),
   serviceMaterialsUnit:5,serviceElectricityUnit:0,serviceFixedMonthly:90,
   serviceCapacity:25,materialsBatchTotal:40,productionTotal:90};
 const agent=Adapter.build({mode:'agent',name:'agent',id:'agent',
   values:{months:3,monthlyBudget:200,cpc:5,ctr:2,cvrLead:20,cvrDeal:50,
    costConsult:100,costPack:200,ltv:30,mgmt:0,site:0,hosting:0,dom:0,
    magnet:0,acq:0,taxTurnover:5,agentPct:20,agentTaxTurnover:10,markup:25},
   payers:{monthlyBudget:'partner',mgmt:'me',site:'me',hosting:'me',
    dom:'me',magnet:'me'},
   period:{deals:18,grossRevenue:1800,agentIncome:360,executorCost:1440}});
 const resources=[
  {id:'campaign',label:'Media pooled',kind:'campaign',amount:200,
   cadence:'monthly',pool:'adBudget',allocation:'usage',usageMode:'fixed',
   usage:{own:1,resale:1},skuIds:['own','resale'],
   includedBySku:{own:100,resale:100}},
  {id:'premises',label:'Space',kind:'premises',amount:180,cadence:'monthly',
   pool:'none',allocation:'usage',usageMode:'fixed',
   usage:{own:1,salon:1},skuIds:['own','salon'],includedBySku:{}},
  {id:'workers',label:'Master',kind:'workers',amount:90,cadence:'monthly',
   pool:'none',allocation:'usage',usageMode:'per-unit',
   loadPerUnit:{resale:0.5,salon:1},skuIds:['resale','salon'],
   capacity:25,includedBySku:{}}
 ];
 const offers=[
  {id:'kit',mode:'bundle',anchorSkuId:'own',attachPct:20,
   overlapPct:0,bundleDiscountPct:10,items:[{skuId:'resale',qty:1}]},
  {id:'upsell',mode:'upsell',anchorSkuId:'resale',attachPct:15,
   overlapPct:0,bundleDiscountPct:0,items:[{skuId:'drop',qty:1}]},
  {id:'cross',mode:'cross_sell',anchorSkuId:'own',attachPct:10,
   overlapPct:0,bundleDiscountPct:0,items:[{skuId:'salon',qty:1}]}
 ];
 return {skus:[own,resale,drop,salon,agent],resources,offers,
  tax:{type:taxType,pct:5},forecastMonths:3,recurringDemandApproved:true};
}
module.exports={fixture};
