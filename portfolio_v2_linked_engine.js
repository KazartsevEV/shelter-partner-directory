/* Linked Portfolio V2. V1 is the immutable source of unit costs, funnel
   forecasts and approved customer-facing price bounds. Pure scenario engine. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.LinkedPortfolioV2Engine=api;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const EPS=1e-7;
  const n=v=>v===''||v===null||v===undefined?0:Number(v);
  const finite=v=>Number.isFinite(n(v))?n(v):0;
  const pos=v=>Math.max(0,finite(v));
  const sum=a=>a.reduce((v,x)=>v+x,0);
  const allowedPools=new Set(['none','unitCost','salesFixed','marketingManagement','adBudget']);
  const allowedKinds=new Set(['premises','workers','warehouse','equipment','certification','salesStaff','marketingManager','campaign','website','hosting','domain','content','other']);
  const sourceId=s=>String(s.id);
  function fromV1(payload){
    if(!payload||!Array.isArray(payload.skus)||!payload.skus.length)throw Error('Нет подтверждённых товаров V1.');
    const skus=payload.skus.map(v=>({
      ...JSON.parse(JSON.stringify(v)),
      id:sourceId(v),priceSelected:pos(v.priceMax),discountSelected:0
    }));
    return {version:3,source:'v1-calculated',importedAt:new Date().toISOString(),
      sourceSignature:JSON.stringify(payload),
      skus,resources:[],tax:{...payload.tax},currency:'у.е.*'};
  }
  function shares(resource,skus){
    const beneficiaries=resource.skuIds||[];
    const values=beneficiaries.map(id=>{
      const sku=skus.find(s=>s.id===id);
      if(!sku)return 0;
      if(resource.allocation==='usage')return pos(resource.usage?.[id]);
      return pos(sku.priceSelected)*(1-pos(sku.discountSelected)/100)*
        pos(sku.forecastUnitsPerMonth)/(1+pos(sku.vatPct)/100);
    });
    const denominator=sum(values);
    return Object.fromEntries(beneficiaries.map((id,i)=>[id,denominator?values[i]/denominator:0]));
  }
  function build(state){
    const errors=[],fieldErrors=[];
    const report=(path,message)=>{errors.push(message);fieldErrors.push({path,message})};
    if(state?.version!==3||state.source!=='v1-calculated')
      return {ready:false,errors:['V2 ожидает рассчитанные товары V1.'],fieldErrors:[]};
    const raw=Array.isArray(state.skus)?state.skus:[];
    if(!raw.length)report('skus','Не импортирован ни один товар.');
    const ids=new Set(),rows=[];
    for(let i=0;i<raw.length;i++){
      const s=raw[i],id=sourceId(s),key='skus.'+i;
      if(ids.has(id))report(key,'Повторяющийся ID товара.');ids.add(id);
      if(!s.name||!['own','resale','dropship'].includes(s.source))report(key,'Товар не имеет корректного происхождения.');
      for(const field of ['unitCost','forecastUnitsPerMonth','adBudget','priceMin','priceMax','baseCac']){
        if(!Number.isFinite(Number(s[field]))||!(Number(s[field])>=0))
          report(key+'.'+field,'Некорректное рассчитанное значение V1: '+field);
      }
      const p=finite(s.priceSelected),min=finite(s.priceMin),max=finite(s.priceMax);
      if(!(min>0&&max>=min))report(key,'Для товара отсутствует подтверждённый диапазон цен V1.');
      if(p+EPS<min||p-EPS>max)
        report(key+'.priceSelected','Цена должна находиться внутри диапазона V1: '+min+' – '+max+'.');
      const disc=finite(s.discountSelected),limit=pos(s.maxDiscountPct);
      if(disc<0||disc>limit+EPS||limit>=100)
        report(key+'.discountSelected','Рабочая скидка превышает максимальную скидку из V1.');
      if(!(pos(s.forecastUnitsPerMonth)>0)||!(pos(s.baseCac)>0))
        report(key,'Отсутствует рассчитанный прогноз продаж и CAC.');
      if(pos(s.variableSalesPct)>=100)report(key,'Сумма переменных комиссий превышает 100%.');
      rows.push({...s,id,priceSelected:p,discountSelected:disc});
    }
    const resources=Array.isArray(state.resources)?state.resources:[];
    const usedResourceIds=new Set(),caps=Object.fromEntries(rows.map(s=>[s.id,{
      none:Infinity,unitCost:pos(s.unitCost)*pos(s.forecastUnitsPerMonth),
      salesFixed:pos(s.salesFixedMonthly),marketingManagement:pos(s.adManagement),
      adBudget:pos(s.adBudget)
    }]));
    const offsets=Object.fromEntries(rows.map(s=>[s.id,{unitCost:0,salesFixed:0,marketingManagement:0,adBudget:0}]));
    const ledger=[];
    for(let i=0;i<resources.length;i++){
      const r=resources[i],key='resources.'+i,beneficiaries=r.skuIds||[],pool=r.pool||'none';
      if(usedResourceIds.has(String(r.id)))report(key,'Повторяющийся ID ресурса.');
      usedResourceIds.add(String(r.id));
      if(!allowedKinds.has(r.kind))report(key+'.kind','Неизвестный тип общего ресурса.');
      if(!allowedPools.has(pool))report(key+'.pool','Неизвестный исходный блок расхода.');
      if(r.kind==='campaign'&&pool!=='adBudget'&&pool!=='none')
        report(key+'.pool','Общую кампанию можно заменить только из рекламного бюджета.');
      if(r.kind!=='campaign'&&pool==='adBudget')
        report(key+'.pool','Рекламный бюджет можно объединять только рекламной кампанией.');
      if(r.cadence!=='monthly'&&r.cadence!=='once')report(key+'.cadence','Укажите периодичность ресурса.');
      if(r.cadence==='once'&&pool!=='none')report(key+'.cadence','Нельзя перенести ежемесячный расход в разовый без графика амортизации.');
      const real=Number(r.amount);
      if(!Number.isFinite(real)||real<0)report(key+'.amount','Стоимость общего ресурса должна быть неотрицательной.');
      if(!beneficiaries.length||beneficiaries.some(id=>!ids.has(id))||new Set(beneficiaries).size!==beneficiaries.length)
        report(key+'.skuIds','Выберите уникальных получателей ресурса из импортированных товаров.');
      if(r.allocation!=='revenue'&&r.allocation!=='usage')report(key+'.allocation','Способ распределения неизвестен.');
      if(r.allocation==='usage'&&sum(beneficiaries.map(id=>pos(r.usage?.[id])))<=0)
        report(key+'.allocation','Укажите положительную загрузку товарами.');
      if(r.capacity!==''&&r.capacity!==null&&r.capacity!==undefined&&Number(r.capacity)>0&&
         sum(beneficiaries.map(id=>pos(r.usage?.[id])))>Number(r.capacity)+EPS)
        report(key+'.capacity','Загрузка общего ресурса превышает мощность.');
      if(r.kind==='certification'&&beneficiaries.length>1&&
        (!r.confirmedCoverage||!String(r.validFor||'').trim()||!r.validUntil))
        report(key+'.confirmedCoverage','Подтвердите покрытие, страну и срок действия общего сертификата.');
      if(r.kind==='certification'&&r.validUntil&&Date.parse(r.validUntil)<Date.parse(state.importedAt||'2000-01-01'))
        report(key+'.validUntil','Истёк срок действия сертификата.');
      for(const [id,value] of Object.entries(r.includedBySku||{})){
        if(!ids.has(id)||!beneficiaries.includes(id))report(key+'.skuIds','Списание уже учтённого расхода допускается только для получателя.');
        if(!Number.isFinite(Number(value))||Number(value)<0)
          report(key+'.includedBySku','Учтённая сумма должна быть неотрицательной.');
        if(pool!=='none'&&offsets[id])offsets[id][pool]+=pos(value);
        if(pool==='none'&&pos(value)>EPS)report(key+'.pool','Для списания старой суммы укажите исходный блок.');
      }
      ledger.push({...r,skuIds:beneficiaries,amount:pos(r.amount),pool});
    }
    for(const s of rows){
      for(const pool of ['unitCost','salesFixed','marketingManagement','adBudget']){
        if(offsets[s.id][pool]>caps[s.id][pool]+EPS)
          report('skus.'+rows.indexOf(s),'Из V1 списывается больше расходов, чем было учтено: '+pool+' для «'+s.name+'».');
      }
    }
    if(errors.length)return {ready:false,errors,fieldErrors};
    const allocation=ledger.map(r=>{
      const weights=shares(r,rows),bySku=Object.fromEntries(r.skuIds.map(id=>[id,r.amount*(weights[id]||0)]));
      return {...r,bySku,weights,previousTotal:sum(Object.values(r.includedBySku||{}).map(pos))};
    });
    const mediaBySku=Object.fromEntries(rows.map(s=>[s.id,pos(s.adBudget)-offsets[s.id].adBudget]));
    for(const r of allocation)if(r.kind==='campaign'&&r.cadence==='monthly')
      for(const [id,amount] of Object.entries(r.bySku))mediaBySku[id]+=amount;
    const items=rows.map(s=>{
      const media=mediaBySku[s.id],orders=pos(s.forecastUnitsPerMonth)*media/pos(s.adBudget);
      const vat=pos(s.vatPct)/100,priceGross=s.priceSelected*(1-s.discountSelected/100);
      const priceNet=priceGross/(1+vat),revenue=priceNet*orders;
      const embeddedUnitReduction=offsets[s.id].unitCost/pos(s.forecastUnitsPerMonth);
      const costPerUnit=pos(s.unitCost)-embeddedUnitReduction;
      const cogs=costPerUnit*orders;
      const commission=revenue*pos(s.variableSalesPct)/100;
      const manager=pos(s.adManagement)-offsets[s.id].marketingManagement;
      const selling=pos(s.salesFixedMonthly)-offsets[s.id].salesFixed;
      const ebitdaBeforeShared=revenue-cogs-commission-media-manager-selling;
      const creditMonthly=pos(s.creditServiceMonthly);
      const resourceShares=allocation.filter(r=>r.kind!=='campaign'&&r.cadence==='monthly')
        .reduce((v,r)=>v+pos(r.bySku[s.id]),0);
      const ebitda=ebitdaBeforeShared-resourceShares;
      return {...s,adBudgetEffective:media,forecastOrders:orders,priceGross,priceNet,
        revenue,cogs,commission,manager,selling,ebitdaBeforeShared,resourceShares,
        ebitda,creditMonthly,preTaxProfit:ebitda-creditMonthly,
        revenueWeight:0,marginPct:revenue>0?ebitda/revenue*100:0};
    });
    const totalRevenue=sum(items.map(s=>s.revenue));
    for(const item of items)item.revenueWeight=totalRevenue>0?item.revenue/totalRevenue:0;
    const fullMedia=sum(items.map(s=>s.adBudgetEffective));
    const monthlyCosts=sum(allocation.filter(r=>r.cadence==='monthly'&&r.kind!=='campaign').map(r=>r.amount));
    const oneOff=sum(allocation.filter(r=>r.cadence==='once').map(r=>r.amount));
    const totalEbitda=sum(items.map(s=>s.ebitda));
    const interest=sum(items.map(s=>s.creditMonthly));
    const type=state.tax?.type==='profit'?'profit':'turnover',rate=pos(state.tax?.pct)/100;
    const tax=type==='turnover'?totalRevenue*rate:Math.max(0,totalEbitda-interest)*rate;
    const netProfit=totalEbitda-interest-tax;
    const originalMedia=sum(rows.map(s=>pos(s.adBudget)));
    const addedMedia=sum(allocation.filter(r=>r.kind==='campaign').map(r=>r.amount));
    const replacedMedia=sum(rows.map(s=>offsets[s.id].adBudget));
    const invariantMedia=Math.abs(fullMedia-(originalMedia-replacedMedia+addedMedia))<EPS;
    const allocated=sum(allocation.map(r=>sum(Object.values(r.bySku))));
    const resourcesTotal=sum(allocation.map(r=>r.amount));
    return {ready:invariantMedia&&Math.abs(allocated-resourcesTotal)<EPS,
      errors:[],fieldErrors:[],items,resources:allocation,offsets,
      totals:{revenue:totalRevenue,media:fullMedia,cogs:sum(items.map(s=>s.cogs)),
        forecast:sum(items.map(s=>s.forecastOrders)),monthlyResources:monthlyCosts,
        onceResources:oneOff,ebitda:totalEbitda,interest,tax,netProfit,
        originalRevenue:sum(rows.map(s=>pos(s.forecastUnitsPerMonth)*s.priceMax/(1+pos(s.vatPct)/100)) )},
      invariants:{mediaConserved:invariantMedia,resourcesConserved:Math.abs(allocated-resourcesTotal)<EPS}};
  }
  return Object.freeze({fromV1,build});
});
