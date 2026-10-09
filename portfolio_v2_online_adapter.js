/* V1 online services -> V2: an immutable, explicitly first-30-days financial contract.
   No partner gross sales are recorded as agent revenue. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.LinkedPortfolioV2OnlineAdapter=api;root.LinkedPortfolioOnlineAdapter=api;}
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const n=v=>Number(v);
 const nonneg=(v,label)=>{const x=n(v);if(!Number.isFinite(x)||x<0)throw Error('Некорректное значение V1: '+label);return x;};
 const pct=(v,label)=>{const x=nonneg(v,label);if(x>100)throw Error('Процент V1 выше 100: '+label);return x/100;};
 const key=(mode,name)=>'online-'+mode+'-'+Array.from(String(name)).reduce(
   (h,c)=>Math.imul(31,h)+c.charCodeAt(0)|0,7).toString(36);
 function fromOnlineV1(input){
  const mode=input?.mode,values=input?.values||{},payers=input?.payers||{};
  if(!['self','hired','agent'].includes(mode))throw Error('Неизвестная онлайн-ветка V1.');
  const name=String(input.name||'').trim();
  if(!name)throw Error('Назовите услугу перед передачей в V2.');
  const pctVal=k=>pct(values[k],k),money=k=>nonneg(values[k],k);
  const spend=money('monthlyBudget'),cpc=money('cpc'),ctr=pctVal('ctr'),
    lead=pctVal('cvrLead'),sale=pctVal('cvrDeal');
  const attach=pctVal('ltv'),acq=pctVal('acq'),customerTax=pctVal('taxTurnover');
  const consulting=money('costConsult'),pack=money('costPack'),mgr=money('mgmt'),
    hosting=money('hosting'),domain=money('dom'),site=money('site'),magnet=money('magnet');
  if(!(spend>0&&cpc>0&&ctr>0&&lead>0&&sale>0))
    throw Error('Нужна рассчитанная рекламная воронка с положительным бюджетом, CPC и конверсиями.');
  const months=nonneg(values.months,'months');
  if(!Number.isInteger(months)||months<1||months>120)throw Error('Некорректный период V1.');
  if(mode==='agent'){
    for(const [k,value] of Object.entries({monthlyBudget:spend,mgmt:mgr,site,hosting,dom:domain,magnet}))
      if(value>0&&!['me','partner'].includes(payers[k]))
        throw Error('Для '+k+' укажите, кто платит: я или партнёр.');
  }
  const employer=k=>mode==='agent'?payers[k]==='me':true;
  const partner=k=>mode==='agent'?payers[k]==='partner':false;
  const firstMonthDeals=spend/cpc*lead*sale*.5;
  // V1 1st-month model: deals *.5; consultations *.5, package purchases *.5 twice.
  const partnerGrossPerDeal=.5*consulting+.25*attach*pack;
  const firstMonthGross=partnerGrossPerDeal*firstMonthDeals;
  if(!(firstMonthGross>0&&firstMonthDeals>0))
    throw Error('V1 не подтверждает положительный чек онлайн-услуги.');
  const commissionRate=mode==='agent'?pctVal('agentPct'):0;
  if(mode==='agent'&&!(commissionRate>0))
    throw Error('В агентской ветке нужен положительный процент вознаграждения.');
  const incomePerDeal=mode==='agent'?partnerGrossPerDeal*commissionRate:partnerGrossPerDeal;
  const markup=mode==='hired'?nonneg(values.markup,'markup'):0;
  const unitContractCost=mode==='hired'?partnerGrossPerDeal/(1+markup/100):0;
  const onlineCapex=(employer('site')?site:0)+(employer('magnet')?magnet:0);
  const paidAdvertising=employer('monthlyBudget')?spend:0;
  const externalAdvertising=partner('monthlyBudget')?spend:0;
  const ownMgr=employer('mgmt')?mgr:0;
  const fixed=(employer('hosting')?hosting:0)+(employer('dom')?domain:0);
  const taxPct=mode==='agent'?pctVal('agentTaxTurnover')*100:customerTax*100;
  const counterpart=mode==='agent'?{
    customerGrossPerDeal:partnerGrossPerDeal,
    agentCommissionPerDeal:incomePerDeal,
    acquiringPct:acq*100,taxTurnoverPct:customerTax*100,
    adBudget:externalAdvertising,
    management:partner('mgmt')?mgr:0,
    hosting:partner('hosting')?hosting:0,
    domain:partner('dom')?domain:0,
    capex:(partner('site')?site:0)+(partner('magnet')?magnet:0)
  }:null;
  return {
    id:key(mode,name),name,source:'online-'+mode,onlineMode:mode,
    onlineContract:true,onlineCapacity:0,onlineGrossPerDeal:partnerGrossPerDeal,
    onlinePartner:counterpart,onlineTaxPct:taxPct,onlineCapex,
    onlineAmortMonthly:onlineCapex/12,
    onlineDemandBudget:spend,onlineExternalAdBudget:externalAdvertising,
    unitCost:unitContractCost,forecastUnitsPerMonth:firstMonthDeals,
    adBudget:paidAdvertising,baseCac:spend/firstMonthDeals,
    priceMin:incomePerDeal,priceMax:incomePerDeal,maxDiscountPct:0,
    minimumMarginPct:0,targetMarginPct:0,salesFixedMonthly:fixed,
    adManagement:ownMgr,
    variableSalesPct:mode==='agent'?0:acq*100,
    creditServiceMonthly:0,vatPct:0,inventoryQty:0,
    reserveAmount:0,
    sourcePeriodMonths:months,
    onlineFirstMonthRevenue:firstMonthGross,
    // Exact V1 source provenance allows later comparison. Data is read-only in V2.
    onlineSource:{mode,payers:mode==='agent'?{...payers}:null,
      revenueOwner:mode==='agent'?'agent_commission':'service_seller',
      forecastWindow:'first-30-days',firstMonthDeals,firstMonthGross}
  };
 }

 // Period-ledger adapter: unlike fromOnlineV1's first-month template, this
 // contract uses the actual results of the configured V1 period and preserves
 // every payer boundary. Agent revenue is commission, not partner turnover.
 function build(input){
  const {mode,values:v,payers={},period={},name,id}=input||{};
  if(!['self','hired','agent'].includes(mode))throw Error('Неизвестный онлайн-сценарий.');
  const months=Number(v?.months),deals=Number(period.deals);
  if(!Number.isInteger(months)||months<1||months>120)throw Error('Недопустимый период.');
  if(!Number.isFinite(deals)||deals<=0)throw Error('Воронка не содержит подтверждённого прогноза сделок.');
  const value=k=>{const x=Number(v[k]);if(!Number.isFinite(x)||x<0)throw Error('Некорректное поле V1: '+k);return x;};
  const keys=['monthlyBudget','mgmt','site','hosting','dom','magnet'];
  const own=key=>mode!=='agent'||payers[key]==='me';
  if(mode==='agent'&&keys.some(k=>value(k)>0&&!['me','partner'].includes(payers[k])))
   throw Error('Не распределены расходы агента и партнёра.');
  const ownerGross=Number(mode==='agent'?period.agentIncome:period.grossRevenue);
  if(!Number.isFinite(ownerGross)||ownerGross<=0)throw Error('Не рассчитан доход владельца.');
  const ownerAd=own('monthlyBudget')?value('monthlyBudget'):0;
  const operations=['mgmt','hosting','dom'].reduce((s,k)=>s+(own(k)?value(k):0),0);
  const capex=['site','magnet'].reduce((s,k)=>s+(own(k)?value(k):0),0);
  const amortPeriod=capex*Math.min(months,12)/12;
  const contractor=mode==='hired'?Number(period.executorCost):0;
  if(!Number.isFinite(contractor)||contractor<0)throw Error('Не рассчитана оплата исполнителю.');
  const taxPct=value(mode==='agent'?'agentTaxTurnover':'taxTurnover');
  if(taxPct>100||value('acq')>100)throw Error('Налог или эквайринг превышает 100%.');
  const perDeal=ownerGross/deals,forecast=deals/months;
  if(!(perDeal>0&&forecast>0))throw Error('Неверная цена или количество продаж.');
  return {
    id:String(id),name:String(name||'Онлайн-услуга'),source:'online-service',onlineRole:mode,
    onlineProvenance:{periodMonths:months,dealsInPeriod:deals,
      partnerGrossRevenue:mode==='agent'?Number(period.grossRevenue):null,
      ownerRevenueInPeriod:ownerGross,contractorPaymentsInPeriod:contractor,
      originalPayers:{...payers},originalTaxPct:taxPct},
    unitCost:contractor/deals,forecastUnitsPerMonth:forecast,
    adBudget:ownerAd,baseCac:ownerAd/forecast,
    priceMin:perDeal,priceMax:perDeal,fixedPriceFromV1:true,
    maxDiscountPct:0,minimumMarginPct:0,targetMarginPct:0,
    salesFixedMonthly:(operations+amortPeriod)/months,
    adManagement:0,variableSalesPct:mode==='agent'?0:value('acq'),
    creditServiceMonthly:0,vatPct:0,
    ownerTax:{type:'turnover',pct:taxPct,entity:mode==='agent'?'agent':'business'},
    onlineCapex:capex,onlineAmortMonthly:amortPeriod/months,
    inventoryQty:0,reserveAmount:0,serviceCapacity:0,
    materialsBatchTotal:0,productionTotal:0
  };
 }
 return Object.freeze({fromOnlineV1,build});
});
