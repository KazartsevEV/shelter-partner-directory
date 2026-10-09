/* Immutable online-service -> V2 economic normalization.
 * One V2 period is 30 days; the V1 first-month ramp is respected by dividing
 * the actual period ledger totals, not rebuilding the un-ramped funnel.
 * Agent financial ownership: only the agent's commission is its own revenue.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.LinkedPortfolioOnlineAdapter=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const amount=x=>Number.isFinite(Number(x))?Number(x):0;
 const pos=x=>Math.max(0,amount(x));
 const modeLabel={self:'Онлайн · я сам',hired:'Онлайн · нанимаю исполнителя',agent:'Онлайн · агент'};
 function build(input){
  const {mode,values:v,payers={},period={},name,id}=input||{};
  if(!modeLabel[mode])throw Error('Неизвестный сценарий онлайн-услуги.');
  const months=Number(v?.months);
  if(!Number.isInteger(months)||months<1||months>120)throw Error('Недопустимый период онлайн-услуги.');
  const deals=Number(period.deals);
  if(!Number.isFinite(deals)||deals<=0)throw Error('Воронка не содержит подтверждённого прогноза сделок.');
  const ownerGross=Number(mode==='agent'?period.agentIncome:period.grossRevenue);
  if(!Number.isFinite(ownerGross)||ownerGross<=0)throw Error('Не рассчитан доход владельца онлайн-услуги.');
  const owns=key=>mode!=='agent'||payers[key]==='me';
  if(mode==='agent'&&['monthlyBudget','mgmt','site','hosting','dom','magnet']
      .some(key=>pos(v[key])>0&&!['me','partner'].includes(payers[key])))
   throw Error('Не распределены расходы агента и партнёра.');
  const ownerCampaign=owns('monthlyBudget')?pos(v.monthlyBudget):0;
  const ownerAd=ownerCampaign;
  const ownerOperating=['mgmt','hosting','dom'].reduce((a,k)=>a+(owns(k)?pos(v[k]):0),0);
  const capex=['site','magnet'].reduce((a,k)=>a+(owns(k)?pos(v[k]):0),0);
  // Current V1 rule: assets amortize over 12 months, no more than original cost.
  const amortPeriod=capex*Math.min(months,12)/12;
  const contracted=mode==='hired'?pos(period.executorCost):0;
  const ownerTaxPct=pos(mode==='agent'?v.agentTaxTurnover:v.taxTurnover);
  const effectiveRevenuePerDeal=ownerGross/deals;
  const forecast=deals/months;
  const customerSales=pos(period.grossRevenue);
  const v1CashExpenses=ownerCampaign*months+ownerOperating+capex+contracted+
      (mode==='agent'?ownerGross*ownerTaxPct/100:customerSales*(pos(v.acq)+ownerTaxPct)/100);
  if(!(effectiveRevenuePerDeal>0&&forecast>0))throw Error('Нет корректной цены и спроса.');
  return {
   id:String(id),name:String(name||modeLabel[mode]),source:'online-service',
   onlineRole:mode,onlineProvenance:{
     periodMonths:months,dealsInPeriod:deals,
     partnerGrossRevenue:mode==='agent'?customerSales:null,
     ownerRevenueInPeriod:ownerGross,contractorPaymentsInPeriod:contracted,
     originalCashExpenses:v1CashExpenses,originalPayers:{...payers},
     originalTaxPct:ownerTaxPct
   },
   unitCost:contracted/deals,
   forecastUnitsPerMonth:forecast,
   adBudget:ownerAd,baseCac:ownerAd/forecast,
   // Online V1 offers already have agreed client/commission rates. V2 cannot
   // invent an editable list-price corridor absent from V1.
   priceMin:effectiveRevenuePerDeal,priceMax:effectiveRevenuePerDeal,
   fixedPriceFromV1:true,maxDiscountPct:0,minimumMarginPct:0,
   targetMarginPct:0,salesFixedMonthly:(ownerOperating+amortPeriod)/months,
   adManagement:0,variableSalesPct:mode==='agent'?0:pos(v.acq),
   creditServiceMonthly:0,vatPct:0,
   ownerTax:{type:'turnover',pct:ownerTaxPct,entity:mode==='agent'?'agent':'business'},
   // Cash payment of capex is real but is not an EBITDA expense.
   onlineCapex:capex,inventoryQty:0,reserveAmount:0,
   serviceCapacity:0,materialsBatchTotal:0,productionTotal:0
  };
 }
 return Object.freeze({build});
});
