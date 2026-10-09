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
  const cashBuckets=new Set(['materials','production','fulfillment']);
  const allowedKinds=new Set(['premises','workers','warehouse','equipment','certification','salesStaff','marketingManager','campaign','website','hosting','domain','content','other']);
  const sourceId=s=>String(s.id);
  function fromV1(payload){
    if(!payload||!Array.isArray(payload.skus)||!payload.skus.length)throw Error('Нет подтверждённых позиций V1 (товаров или услуг).');
    const skus=payload.skus.map(v=>({
      ...JSON.parse(JSON.stringify(v)),
      id:sourceId(v),priceSelected:pos(v.priceMax),discountSelected:0
    }));
    return {version:3,source:'v1-calculated',importedAt:new Date().toISOString(),
      sourceSignature:JSON.stringify(payload),
      skus,resources:[],offers:[],tax:{...payload.tax},currency:'у.е.*',
      forecastMonths:1,recurringDemandApproved:false};
  }
  function shares(resource,skus){
    const beneficiaries=resource.skuIds||[];
    const values=beneficiaries.map(id=>{
      const sku=skus.find(s=>s.id===id);
      if(!sku)return 0;
      if(resource.allocation==='usage')return resource.usageMode==='per-unit'?
         pos(resource.loadPerUnit?.[id])*pos(sku._projectedOrders??sku.forecastUnitsPerMonth):
         pos(resource.usage?.[id]);
      return pos(sku.priceSelected)*(1-pos(sku.discountSelected)/100)*
        pos(sku._projectedOrders??sku.forecastUnitsPerMonth)/(1+pos(sku.vatPct)/100);
    });
    const denominator=sum(values);
    return Object.fromEntries(beneficiaries.map((id,i)=>[id,denominator?values[i]/denominator:0]));
  }

  // Market-basket forecast: independently acquired V1 demand is never recursively
  // fed into new offers. This prevents cross-sell cycles and double attribution.
  function projectOffers(offers,baseOrders,knownIds){
    const errors=[],fieldErrors=[],events=[],usedIds=new Set();
    const report=(path,message)=>{errors.push(message);fieldErrors.push({path,message})};
    const rows=Array.isArray(offers)?offers:[];
    const allowed=new Set(['cross_sell','upsell','bundle']);
    const exclusive={},overlaps={},discountedUnits={};
    const orders={...baseOrders};
    rows.forEach((r,i)=>{
      const key='offers.'+i,identifier=String(r?.id||'');
      if(!identifier||usedIds.has(identifier))report(key+'.id','У связи должен быть уникальный ID.');
      usedIds.add(identifier);
      if(!allowed.has(r?.mode))report(key+'.mode','Выберите cross-sell, upsell или набор.');
      const anchor=String(r?.anchorSkuId||'');
      if(!knownIds.has(anchor))report(key+'.anchorSkuId','Базовый товар или услуга отсутствует в портфеле.');
      const rawPct=Number(r?.attachPct);
      if(r?.attachPct===''||!Number.isFinite(rawPct)||rawPct<=0||rawPct>100)
        report(key+'.attachPct','Доля покупателей должна быть больше 0% и не выше 100%.');
      const overlapPct=Number(r?.overlapPct??0);
      const promo=Number(r?.bundleDiscountPct??0);
      if(!Number.isFinite(promo)||promo<0||promo>=100)
        report(key+'.bundleDiscountPct','Скидка комплекта должна быть от 0% до менее 100%.');
      if(r?.mode!=='bundle'&&promo>0)
        report(key+'.bundleDiscountPct','Скидка набора применима только к комбо.');
      if(!Number.isFinite(overlapPct)||overlapPct<0||overlapPct>100)
        report(key+'.overlapPct','Пересечение с самостоятельными продажами — от 0 до 100%.');
      const parts=Array.isArray(r?.items)?r.items:[];
      if(!parts.length)report(key+'.items','Добавьте хотя бы одну позицию к предложению.');
      const local=new Set(),components=[];
      parts.forEach((p,j)=>{
        const target=String(p?.skuId||''),quantity=Number(p?.qty);
        if(!knownIds.has(target)||target===anchor||local.has(target))
          report(key+'.items.'+j+'.skuId','Позиция должна существовать, отличаться от основной и не повторяться в наборе.');
        local.add(target);
        if(!Number.isInteger(quantity)||quantity<1||quantity>100)
          report(key+'.items.'+j+'.qty','Количество в связке должно быть целым числом от 1 до 100.');
        components.push({skuId:target,qty:quantity});
      });
      if(!allowed.has(r?.mode)||!knownIds.has(anchor)||!(rawPct>0&&rawPct<=100)||
         !(overlapPct>=0&&overlapPct<=100)||!(promo>=0&&promo<100)||!parts.length||
         components.some(p=>!knownIds.has(p.skuId)||p.skuId===anchor||
           !Number.isInteger(p.qty)||p.qty<1||p.qty>100)||local.size!==parts.length)return;
      const attach=pos(baseOrders[anchor])*rawPct/100;
      if(r.mode==='bundle'){
        discountedUnits[anchor]=(discountedUnits[anchor]||0)+attach*promo/100;
      }
      if(r.mode==='upsell'||r.mode==='bundle')exclusive[anchor]=(exclusive[anchor]||0)+rawPct;
      if(r.mode==='upsell')orders[anchor]-=attach;
      const detail=components.map(p=>{
        const gross=attach*p.qty;
        const overlap=gross*overlapPct/100;
        overlaps[p.skuId]=(overlaps[p.skuId]||0)+overlap;
        orders[p.skuId]+=gross-overlap;
        if(r.mode==='bundle')
          discountedUnits[p.skuId]=(discountedUnits[p.skuId]||0)+gross*promo/100;
        return {...p,grossUnits:gross,overlapUnits:overlap,netAddedUnits:gross-overlap};
      });
      events.push({id:identifier,mode:r.mode,anchorSkuId:anchor,
        attachPct:rawPct,overlapPct,bundleDiscountPct:promo,transactions:attach,items:detail});
    });
    for(const [sku,pct] of Object.entries(exclusive))
      if(pct>100+1e-8)report('offers','Наборы и upsell для «'+sku+'» суммарно охватывают больше 100% самостоятельных покупателей.');
    for(const [sku,qty] of Object.entries(overlaps))
      if(qty>pos(baseOrders[sku])+1e-8)report('offers',
        'Пересечение продаж «'+sku+'» превышает его независимый спрос из V1.');
    for(const [sku,qty] of Object.entries(orders))
      if(qty<-1e-7)report('offers','Отрицательный прогноз для «'+sku+'».');
    for(const [sku,qty] of Object.entries(discountedUnits))
      if(qty>pos(orders[sku])+1e-7)report('offers',
        'Несколько наборов используют больше единиц «'+sku+'», чем продано в портфеле.');
    const adjustments=Object.fromEntries(Array.from(knownIds,id=>[
      id,pos(orders[id])-pos(baseOrders[id])]));
    return {orders,baseOrders,adjustments,events,discountedUnits,errors,fieldErrors,
      totalBaseUnits:sum(Object.values(baseOrders)),totalUnits:sum(Object.values(orders)),
      attributedTransactions:sum(events.map(e=>e.transactions))};
  }
  // Monthly resources follow the union of their beneficiaries' actual selling
  // intervals. Cost is incurred once per active day; attribution recalculates
  // when a SKU is sold out, preserving the full resource cost.
  function lifecycleResources(resources,skus,prices){
    const bySku=Object.fromEntries(skus.map(s=>[s.id,0]));
    const events=[];
    let total=0;
    for(const r of resources){
      if(r.cadence!=='monthly'||r.kind==='campaign')continue;
      const recipients=(r.skuIds||[]).map(id=>skus.find(s=>s.id===id)).filter(Boolean)
        .map(s=>{
          const rate=pos(s.forecastUnitsPerMonth)/30;
          const weight=r.allocation==='usage'?
            (r.usageMode==='per-unit'?pos(r.loadPerUnit?.[s.id])*rate:pos(r.usage?.[s.id])):
            pos(prices[s.id])*(1-pos(s.discountSelected)/100)*
              rate/(1+pos(s.vatPct)/100);
          const start=pos(s.supplyDays)+pos(s.productionDays);
          return {id:s.id,weight,start,end:start+pos(s.inventoryQty)/Math.max(EPS,rate)};
        }).filter(x=>x.weight>EPS&&x.end>x.start);
      const ticks=Array.from(new Set(recipients.flatMap(x=>[x.start,x.end]))).sort((a,b)=>a-b);
      for(let i=0;i<ticks.length-1;i++){
        const start=ticks[i],end=ticks[i+1],mid=(start+end)/2;
        const active=recipients.filter(x=>x.start<=mid&&x.end>=mid);
        if(!active.length)continue;
        const weight=sum(active.map(x=>x.weight));
        const cost=pos(r.amount)*(end-start)/30;
        total+=cost;
        for(const x of active)bySku[x.id]+=cost*x.weight/weight;
        events.push({id:r.id,start,end,dailyAmount:pos(r.amount)/30});
      }
    }
    return {bySku,total,events};
  }
  function build(state){
    const errors=[],fieldErrors=[];
    const report=(path,message)=>{errors.push(message);fieldErrors.push({path,message})};
    if(state?.version!==3||state.source!=='v1-calculated')
      return {ready:false,errors:['V2 ожидает рассчитанные товары и услуги V1.'],fieldErrors:[]};
    const raw=Array.isArray(state.skus)?state.skus:[];
    if(!raw.length)report('skus','Не импортировано ни одной позиции.');
    const ids=new Set(),rows=[];
    for(let i=0;i<raw.length;i++){
      const s=raw[i],id=sourceId(s),key='skus.'+i;
      if(ids.has(id))report(key,'Повторяющийся ID товара.');ids.add(id);
      if(!s.name||!['own','resale','dropship','offline-service','online-service'].includes(s.source))report(key,'Товар не имеет корректного происхождения.');
      for(const field of ['unitCost','forecastUnitsPerMonth','adBudget','priceMin','priceMax','baseCac']){
        if(!Number.isFinite(Number(s[field]))||!(Number(s[field])>=0))
          report(key+'.'+field,'Некорректное рассчитанное значение V1: '+field);
      }
      const min=finite(s.priceMin),max=finite(s.priceMax);
      if(!(min>0&&max>=min))report(key,'Для товара отсутствует подтверждённый диапазон цен V1.');
      if(!s.fixedPriceFromV1&&!(pos(s.targetMarginPct)>0&&pos(s.minimumMarginPct)>0&&pos(s.targetMarginPct)>=pos(s.minimumMarginPct)))
        report(key,'Не готовы минимальная и целевая маржинальность V1.');
      const disc=finite(s.discountSelected),limit=pos(s.maxDiscountPct);
      if(disc<0||disc>limit+EPS||limit>=100)
        report(key+'.discountSelected','Рабочая скидка превышает максимальную скидку из V1.');
      if(!(pos(s.forecastUnitsPerMonth)>0)||(!s.fixedPriceFromV1&&!(pos(s.baseCac)>0)))
        report(key,'Отсутствует рассчитанный прогноз продаж и CAC.');
      if(pos(s.variableSalesPct)>=100)report(key,'Сумма переменных комиссий превышает 100%.');
      rows.push({...s,id,priceSelected:max,discountSelected:disc});
    }
    const resources=Array.isArray(state.resources)?state.resources:[];
    const usedResourceIds=new Set(),caps=Object.fromEntries(rows.map(s=>[s.id,{
      none:Infinity,unitCost:pos(s.unitCost)*pos(s.forecastUnitsPerMonth),
      salesFixed:pos(s.salesFixedMonthly),marketingManagement:pos(s.adManagement),
      adBudget:pos(s.adBudget)
    }]));
    const offsets=Object.fromEntries(rows.map(s=>[s.id,{unitCost:0,salesFixed:0,marketingManagement:0,adBudget:0}]));
    const cashOffsets=Object.fromEntries(rows.map(s=>[s.id,{materials:0,production:0,fulfillment:0}]));
    const ledger=[];
    for(let i=0;i<resources.length;i++){
      const r=resources[i],key='resources.'+i,beneficiaries=r.skuIds||[],pool=r.pool||'none';
      if(usedResourceIds.has(String(r.id)))report(key,'Повторяющийся ID ресурса.');
      usedResourceIds.add(String(r.id));
      if(!allowedKinds.has(r.kind))report(key+'.kind','Неизвестный тип общего ресурса.');
      if(r.kind==='warehouse'&&beneficiaries.some(id=>['offline-service','online-service'].includes(rows.find(s=>s.id===id)?.source)))
        report(key+'.skuIds','Складской ресурс нельзя распределять на офлайн-услугу: услуга не хранится на складе.');
      if(!allowedPools.has(pool))report(key+'.pool','Неизвестный исходный блок расхода.');
      if(r.kind==='campaign'&&pool!=='adBudget'&&pool!=='none')
        report(key+'.pool','Общую кампанию можно заменить только из рекламного бюджета.');
      if(r.kind!=='campaign'&&pool==='adBudget')
        report(key+'.pool','Рекламный бюджет можно объединять только рекламной кампанией.');
      if(r.cadence!=='monthly'&&r.cadence!=='once')report(key+'.cadence','Укажите периодичность ресурса.');
      if(pool==='unitCost'&&!cashBuckets.has(r.cashOrigin)&&sum(Object.values(r.includedBySku||{}).map(pos))>EPS)
        report(key+'.cashOrigin','Выберите исходный денежный платёж V1: закупка, производство или исполнение заказа.');
      if(r.cadence==='once'&&pool!=='none')report(key+'.cadence','Нельзя перенести ежемесячный расход в разовый без графика амортизации.');
      const real=Number(r.amount);
      if(!Number.isFinite(real)||real<0)report(key+'.amount','Стоимость общего ресурса должна быть неотрицательной.');
      if(!beneficiaries.length||beneficiaries.some(id=>!ids.has(id))||new Set(beneficiaries).size!==beneficiaries.length)
        report(key+'.skuIds','Выберите уникальных получателей ресурса из импортированных товаров.');
      if(r.allocation!=='revenue'&&r.allocation!=='usage')report(key+'.allocation','Способ распределения неизвестен.');
      if(r.usageMode!==undefined&&!['fixed','per-unit'].includes(r.usageMode))
        report(key+'.usageMode','Неизвестный тип учёта загрузки.');
      const perUnit=r.usageMode==='per-unit';
      if(perUnit&&r.allocation!=='usage')
        report(key+'.usageMode','Помесячную загрузку по единице можно выбрать только при распределении по использованию.');
      if(perUnit&&!['workers','premises','equipment','salesStaff'].includes(r.kind))
        report(key+'.kind','Загрузка на единицу применяется к сотрудникам, помещению и оборудованию.');
      if(perUnit){
        for(const id of beneficiaries){
          const rate=Number(r.loadPerUnit?.[id]??0);
          if(!Number.isFinite(rate)||rate<0)
            report(key+'.loadPerUnit.'+id,'Норма ресурса на единицу должна быть неотрицательной.');
        }
        if(sum(beneficiaries.map(id=>pos(r.loadPerUnit?.[id])))<=0)
          report(key+'.loadPerUnit','Укажите расход времени/мощности на единицу хотя бы для одной позиции.');
      }else if(r.allocation==='usage'&&sum(beneficiaries.map(id=>pos(r.usage?.[id])))<=0)
        report(key+'.allocation','Укажите положительную загрузку товарами.');
      if(r.capacity!==''&&r.capacity!==null&&r.capacity!==undefined&&Number(r.capacity)>0&&
         r.usageMode!=='per-unit'&&sum(beneficiaries.map(id=>pos(r.usage?.[id])))>Number(r.capacity)+EPS)
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
        if(pool==='unitCost'&&cashOffsets[id]&&cashBuckets.has(r.cashOrigin)){
          const sku=rows.find(x=>x.id===id);
          const multiplier=['dropship','offline-service','online-service'].includes(sku?.source)?1:pos(sku?.inventoryQty)/Math.max(pos(sku?.forecastUnitsPerMonth),EPS);
          cashOffsets[id][r.cashOrigin]+=pos(value)*multiplier;
        }
        if(pool==='none'&&pos(value)>EPS)report(key+'.pool','Для списания старой суммы укажите исходный блок.');
      }
      ledger.push({...r,skuIds:beneficiaries,amount:pos(r.amount),pool});
    }
    for(const s of rows){
      for(const pool of ['unitCost','salesFixed','marketingManagement','adBudget']){
        if(offsets[s.id][pool]>caps[s.id][pool]+EPS)
          report('skus.'+rows.indexOf(s),'Из V1 списывается больше расходов, чем было учтено: '+pool+' для «'+s.name+'».');
      }
      const o=cashOffsets[s.id];
      if(['dropship','online-service'].includes(s.source)&&(o.materials>EPS||o.production>EPS))
        report('skus.'+rows.indexOf(s),'Дропшиппинг оплачивается по заказу: используйте «Исполнение заказа».');
      const qty=pos(s.inventoryQty),raw=pos(s.materialsBatchTotal),prod=pos(s.productionTotal),inbound=pos(s.warehouseInboundUnitCost)*qty;
      const residual=Math.max(0,(pos(s.unitCost)-(raw+prod+inbound)/Math.max(qty,EPS))*qty);
      if(s.source==='offline-service'){
        const forecast=pos(s.forecastUnitsPerMonth);
        if(o.materials>pos(s.serviceMaterialsUnit)*forecast+EPS||
           o.production>pos(s.serviceFixedMonthly)+EPS||
           o.fulfillment>pos(s.serviceElectricityUnit)*forecast+EPS)
          report('skus.'+rows.indexOf(s),'Общий расход превышает первоначальную сумму соответствующей статьи офлайн-услуги V1.');
      }
      if(!['dropship','offline-service','online-service'].includes(s.source)&&(o.materials>raw+EPS||o.production>prod+EPS||o.fulfillment>residual+EPS))
        report('skus.'+rows.indexOf(s),'Перенос общего расхода превышает сумму выбранного денежного блока V1 для «'+s.name+'».');
    }
    if(errors.length)return {ready:false,errors,fieldErrors};

    for(const v of rows.filter(s=>s.source==='online-service')){
      if(!v.fixedPriceFromV1||!v.onlineProvenance||!v.ownerTax||
         v.ownerTax.type!=='turnover'||v.discountSelected>EPS)
        report('skus.'+rows.indexOf(v),'Онлайн-услуга должна сохранять исходные условия, налог и подтверждённую цену V1.');
    }
    if(errors.length)return {ready:false,errors,fieldErrors};
    const marginRate=(s,m)=>Math.max(0,Math.min(.999,pos(m)/100));
    const taxRate=pos(state.tax?.pct)/100,taxType=state.tax?.type==='profit'?'profit':'turnover';
    // Required customer-facing LIST price. The selected discount is applied at checkout;
    // VAT is pass-through, and the target is after the turnover/profit tax.
    function requiredListPrice(s,unitLoad,marginPct){
      const variable=pos(s.variableSalesPct)/100,goal=marginRate(s,marginPct);
      const localTax=pos(s.ownerTax?.pct??state.tax?.pct)/100;
      const localType=s.ownerTax?.type||taxType;
      const realizedFraction=1-pos(s._bundleDiscountFraction);
      const retained=realizedFraction*(1-variable-(localType==='turnover'?localTax:0)-
        goal/(localType==='profit'?1-localTax:1));
      if(retained<=0||s.discountSelected>=100)return Infinity;
      return unitLoad/retained*(1+pos(s.vatPct)/100)/(1-s.discountSelected/100);
    }
    // Full-stock calendars support physical SKU portfolios and shared
    // non-campaign resources. Basket/online/offline and pooled campaigns remain
    // on their explicit 30-day model until their recurring demand is defined.
    const fullStockCycle=rows.length>0&&
      rows.every(s=>['own','resale'].includes(s.source))&&
      resources.every(r=>r.kind!=='campaign')&&
      !(Array.isArray(state.offers)&&state.offers.length);
    const initialPrices=Object.fromEntries(rows.map(s=>[s.id,pos(s.priceMax)]));
    const calculateScenario=(prices,projectedOrders)=>{
      const draftRows=rows.map(s=>({...s,priceSelected:prices[s.id],_projectedOrders:projectedOrders[s.id]}));
      const allocation=ledger.map(r=>{
        const weights=shares(r,draftRows),bySku=Object.fromEntries(r.skuIds.map(id=>[id,r.amount*(weights[id]||0)]));
        return {...r,bySku,weights,previousTotal:sum(Object.values(r.includedBySku||{}).map(pos))};
      });
      const mediaBySku=Object.fromEntries(rows.map(s=>[s.id,pos(s.adBudget)-offsets[s.id].adBudget]));
      for(const r of allocation)if(r.kind==='campaign'&&r.cadence==='monthly')
        for(const [id,amount]of Object.entries(r.bySku))mediaBySku[id]+=amount;
      const baselineOrders=Object.fromEntries(rows.map(s=>[s.id,
        s.source==='online-service'&&pos(s.adBudget)<=EPS?pos(s.forecastUnitsPerMonth):
         pos(s.forecastUnitsPerMonth)*mediaBySku[s.id]/Math.max(EPS,pos(s.adBudget))]));
      const basket=projectOffers(state.offers,baselineOrders,ids);
      const lifecycle=fullStockCycle?lifecycleResources(allocation,rows,prices):null;
      const projections=rows.map(s=>{
        const media=mediaBySku[s.id],orders=pos(basket.orders[s.id]);
        const monthlyResources=allocation.filter(r=>r.kind!=='campaign'&&r.cadence==='monthly')
          .reduce((v,r)=>v+pos(r.bySku[s.id]),0);
        const monthlyManager=pos(s.adManagement)-offsets[s.id].marketingManagement;
        const monthlySelling=pos(s.salesFixedMonthly)-offsets[s.id].salesFixed;
        // A V1 SKU's embedded cost is removed once, then charged through one
        // common resource, without multiplying the shared payment by SKU count.
        const baselineOrders=Math.max(EPS,pos(s.forecastUnitsPerMonth));
        const embeddedUnit=offsets[s.id].unitCost/baselineOrders;
        const netUnitCost=s.source==='offline-service'?
          Math.max(0,pos(s.serviceMaterialsUnit)-(cashOffsets[s.id].materials/baselineOrders))+
          Math.max(0,pos(s.serviceElectricityUnit)-(cashOffsets[s.id].fulfillment/baselineOrders))+
          Math.max(0,pos(s.serviceFixedMonthly)-cashOffsets[s.id].production)/Math.max(EPS,orders):
          pos(s.unitCost)-embeddedUnit;
        const bundleExposure=orders>0?pos(basket.discountedUnits[s.id])/orders:0;
        const priced={...s,_bundleDiscountFraction:bundleExposure};
        // V1 prices the entire contractual interest and liquidity reserve over
        // sellable units, not only the first monthly installment.
        const financedUnits=['own','resale'].includes(s.source)?
          pos(s.inventoryQty):orders;
        const loanMonths=Math.max(1,Math.ceil(pos(s.creditMonths)||1));
        const financeLoad=fullStockCycle?
          (pos(s.creditServiceMonthly)*loanMonths+pos(s.reserveAmount))/
            Math.max(EPS,financedUnits):
          pos(s.creditServiceMonthly)/Math.max(EPS,orders);
        const resourceUnitLoad=fullStockCycle?
          pos(lifecycle.bySku[s.id])/Math.max(EPS,financedUnits):
          monthlyResources/Math.max(EPS,orders);
        const unitLoad=orders>0?netUnitCost+
          (media+monthlyManager+monthlySelling)/orders+
          resourceUnitLoad+financeLoad:Infinity;
        return {s,media,orders,monthlyResources,monthlyManager,monthlySelling,bundleExposure,
          netUnitCost,unitLoad,priceTarget:requiredListPrice(priced,unitLoad,s.targetMarginPct),
          priceFloor:requiredListPrice(priced,unitLoad,s.minimumMarginPct)};
      });
      return {allocation,mediaBySku,projections,basket};
    };
    // Revenue-weighted attribution and SKU prices are mutually dependent.
    // Solve them as a damped fixed point, never silently substituting max price.
    let prices={...initialPrices},scenario=null,converged=false;
    let projectedOrders=Object.fromEntries(rows.map(s=>[s.id,pos(s.forecastUnitsPerMonth)]));
    for(let iteration=0;iteration<300;iteration++){
      scenario=calculateScenario(prices,projectedOrders);
      let maximumMove=0;const next={},nextOrders={};
      for(const p of scenario.projections){
        const min=pos(p.s.priceMin),max=pos(p.s.priceMax);
        const target=Number.isFinite(p.priceTarget)?p.priceTarget:max;
        const chosen=Math.min(max,Math.max(min,Math.ceil(target*100-1e-8)/100));
        next[p.s.id]=prices[p.s.id]*.55+chosen*.45;
        nextOrders[p.s.id]=projectedOrders[p.s.id]*.55+p.orders*.45;
        maximumMove=Math.max(maximumMove,Math.abs(next[p.s.id]-prices[p.s.id]),
          Math.abs(nextOrders[p.s.id]-projectedOrders[p.s.id]));
      }
      prices=next;projectedOrders=nextOrders;
      if(maximumMove<1e-7){converged=true;break}
    }
    if(!converged)report('resources','Распределение рекламного бюджета и цен не сошлось; зафиксируйте загрузку кампаний по товарам.');
    scenario=calculateScenario(prices,projectedOrders);
    for(const e of scenario.basket.fieldErrors)report(e.path,e.message);
    if(rows.some(s=>s.fixedPriceFromV1&&pos(scenario.basket.discountedUnits[s.id])>EPS))
      report('offers','Фиксированное онлайн-вознаграждение нельзя снижать скидкой без указания плательщика.');
    const items=scenario.projections.map(p=>{
      const {s,media,orders,monthlyResources,monthlyManager,monthlySelling,netUnitCost,unitLoad,bundleExposure}=p;
      const priceList=Math.max(pos(s.priceMin),Math.min(pos(s.priceMax),
        Math.ceil((Number.isFinite(p.priceTarget)?p.priceTarget:pos(s.priceMax))*100-1e-8)/100));
      const grossPrice=priceList*(1-s.discountSelected/100);
      const standaloneNet=grossPrice/(1+pos(s.vatPct)/100);
      const priceNet=standaloneNet*(1-bundleExposure);
      const revenue=priceNet*orders,commission=revenue*pos(s.variableSalesPct)/100;
      const cogs=netUnitCost*orders,creditMonthly=pos(s.creditServiceMonthly);
      const ebitda=revenue-cogs-commission-media-monthlyManager-monthlySelling-monthlyResources;
      const actualAfterTaxMargin=revenue>0?
        (ebitda-creditMonthly-((s.ownerTax?.type||taxType)==='turnover'?revenue*(pos(s.ownerTax?.pct??state.tax?.pct)/100):
           Math.max(0,ebitda-creditMonthly)*(pos(s.ownerTax?.pct??state.tax?.pct)/100)))/revenue*100:0;
      const minOk=s.fixedPriceFromV1||(Number.isFinite(p.priceFloor)&&p.priceFloor<=pos(s.priceMax)+.005&&
        actualAfterTaxMargin+.00001>=pos(s.minimumMarginPct));
      const targetOk=Number.isFinite(p.priceTarget)&&p.priceTarget<=pos(s.priceMax)+.005&&
        actualAfterTaxMargin+.00001>=pos(s.targetMarginPct);
      return {...s,priceSelected:priceList,priceList,priceGross:grossPrice,priceNet,standaloneNet,bundleExposure,
        requiredTargetPrice:p.priceTarget,requiredFloorPrice:p.priceFloor,
        forecastOrders:orders,adBudgetEffective:media,revenue,cogs,commission,
        manager:monthlyManager,selling:monthlySelling,resourceShares:monthlyResources,
        ebitda,creditMonthly,preTaxProfit:ebitda-creditMonthly,
        unitCostEffective:netUnitCost,unitLoad,revenueWeight:0,cashOffsets:cashOffsets[s.id],
        actualAfterTaxMargin,minimumMarginFeasible:minOk,targetMarginMet:targetOk,
        status:s.fixedPriceFromV1?(actualAfterTaxMargin<0?'LOSS':'FIXED_V1'):(!minOk?'INFEASIBLE':targetOk?'TARGET_MET':'MINIMUM_ONLY')};
    });
    const totalRevenue=sum(items.map(s=>s.revenue));
    items.forEach(item=>item.revenueWeight=totalRevenue>0?item.revenue/totalRevenue:0);
    const fullMedia=sum(items.map(s=>s.adBudgetEffective));
    const monthlyCosts=sum(scenario.allocation.filter(r=>r.cadence==='monthly'&&r.kind!=='campaign').map(r=>r.amount));
    const onceCosts=sum(scenario.allocation.filter(r=>r.cadence==='once').map(r=>r.amount));
    const totalEbitda=sum(items.map(s=>s.ebitda));
    const interest=sum(items.map(s=>s.creditMonthly));
    const regular=items.filter(item=>item.source!=='online-service');
    const online=items.filter(item=>item.source==='online-service');
    const regularRevenue=sum(regular.map(item=>item.revenue));
    const regularProfit=sum(regular.map(item=>item.preTaxProfit));
    const regularTax=taxType==='turnover'?regularRevenue*taxRate:Math.max(0,regularProfit)*taxRate;
    const onlineTax=sum(online.map(item=>item.revenue*pos(item.ownerTax?.pct)/100));
    const tax=regularTax+onlineTax;
    const netProfit=totalEbitda-interest-tax;
    const originalMedia=sum(rows.map(s=>pos(s.adBudget)));
    const addedMedia=sum(scenario.allocation.filter(r=>r.kind==='campaign'&&r.cadence==='monthly').map(r=>r.amount));
    const replacedMedia=sum(rows.map(s=>offsets[s.id].adBudget));
    const invariantMedia=Math.abs(fullMedia-(originalMedia-replacedMedia+addedMedia))<EPS;
    const allocated=sum(scenario.allocation.map(r=>sum(Object.values(r.bySku))));
    const resourcesTotal=sum(scenario.allocation.map(r=>r.amount));
    for(const item of items){
      if(!['dropship','offline-service','online-service'].includes(item.source)&&pos(item.inventoryQty)+EPS<item.forecastOrders){
        report('skus.'+rows.findIndex(s=>s.id===item.id),
          'Прогноз по «'+item.name+'» ('+item.forecastOrders.toFixed(2)+
          ' шт.) превышает запас V1 ('+pos(item.inventoryQty)+' шт.). Увеличьте складскую партию в V1 или скорректируйте распределение рекламы.');
      }
      if(item.source==='offline-service'&&(!(pos(item.serviceCapacity)>0)||item.forecastOrders>pos(item.serviceCapacity)+EPS)){
        report('skus.'+rows.findIndex(s=>s.id===item.id),
          'Прогноз клиентов для «'+item.name+'» ('+item.forecastOrders.toFixed(2)+
          ') больше доступных '+pos(item.serviceCapacity)+' посещений в месяц.');
      }
    }
    for(let i=0;i<scenario.allocation.length;i++){
      const resource=scenario.allocation[i];
      if(resource.usageMode!=='per-unit')continue;
      const load=sum(resource.skuIds.map(id=>
        pos(resource.loadPerUnit?.[id])*pos(items.find(s=>s.id===id)?.forecastOrders)));
      resource.projectedLoad=load;
      resource.remainingCapacity=pos(resource.capacity)>0?pos(resource.capacity)-load:null;
      if(pos(resource.capacity)>0&&load>pos(resource.capacity)+EPS)
        report('resources.'+i+'.capacity',
          'Связанные покупки требуют '+load.toFixed(2)+' единиц ресурса «'+resource.label+
          '», доступно '+pos(resource.capacity)+'. Уменьшите наборы или увеличьте мощность.');
    }
    const infeasible=items.filter(item=>!item.fixedPriceFromV1&&!item.minimumMarginFeasible);
    if(infeasible.length)for(const item of infeasible)
      report('skus.'+rows.findIndex(s=>s.id===item.id)+'.priceMax',
        'Для «'+item.name+'» минимум рентабельности требует цены '+
        (Number.isFinite(item.requiredFloorPrice)?item.requiredFloorPrice.toFixed(2):'выше расчётного предела')+
        ', а предел V1 — '+item.priceMax+'.');
    if(!invariantMedia||Math.abs(allocated-resourcesTotal)>=EPS)
      report('resources','Не удалось распределить все расходы без потерь или повторного учёта.');
    const basket={...scenario.basket,transactions:scenario.basket.events.map(event=>{
      const anchor=items.find(s=>s.id===event.anchorSkuId);
      const ordinaryGross=(event.mode==='upsell'?0:pos(anchor?.priceGross))+
        sum(event.items.map(p=>pos(items.find(s=>s.id===p.skuId)?.priceGross)*p.qty));
      return {...event,anchorName:anchor?.name||event.anchorSkuId,
        buyerPriceBefore:ordinaryGross,
        buyerPriceAfter:ordinaryGross*(1-(event.mode==='bundle'?event.bundleDiscountPct:0)/100),
        items:event.items.map(p=>({...p,name:items.find(s=>s.id===p.skuId)?.name||p.skuId}))};
    })};
    // Lift is measured at the same calculated portfolio prices, not against
    // a separately repriced standalone scenario (which would mix two effects).
    basket.revenueLift=sum(items.map(s=>s.revenue-
      pos(basket.baseOrders[s.id])*s.standaloneNet));
    basket.bundleSavingsGross=sum(basket.events.filter(e=>e.mode==='bundle').map(e=>{
      const before=items.find(s=>s.id===e.anchorSkuId).priceGross+
        sum(e.items.map(p=>items.find(s=>s.id===p.skuId).priceGross*p.qty));
      return before*e.transactions*e.bundleDiscountPct/100;
    }));
    basket.bundleSavingsNet=sum(items.map(s=>
      s.standaloneNet*pos(basket.discountedUnits[s.id])));
    basket.variableContributionLift=sum(items.map(s=>{
      const unitVariable=s.source==='offline-service'?
        pos(s.serviceMaterialsUnit)+pos(s.serviceElectricityUnit):pos(s.unitCostEffective);
      const revDelta=s.revenue-pos(basket.baseOrders[s.id])*s.standaloneNet;
      return revDelta*(1-pos(s.variableSalesPct)/100)-
        (basket.adjustments[s.id]||0)*unitVariable;
    }));
    const base={ready:!errors.length,errors,fieldErrors,items,basket,
      resources:scenario.allocation,offsets,cashOffsets,
      totals:{revenue:totalRevenue,media:fullMedia,cogs:sum(items.map(s=>s.cogs)),
        forecast:sum(items.map(s=>s.forecastOrders)),monthlyResources:monthlyCosts,
        onceResources:onceCosts,ebitda:totalEbitda,interest,tax,netProfit,
        targetMet:items.every(s=>s.targetMarginMet),minimumMet:items.every(s=>s.minimumMarginFeasible)},
      invariants:{mediaConserved:invariantMedia,resourcesConserved:Math.abs(allocated-resourcesTotal)<EPS,
        fixedPointConverged:converged}};
    // Do not claim that an impossible portfolio works: show the max feasible
    // retail price, its shortfall and a non-ready status instead.
    if(base.ready&&Number(state.forecastMonths??1)>1){
      const planner=typeof globalThis==='object'&&globalThis.LinkedPortfolioTemporal?
        globalThis.LinkedPortfolioTemporal:
        (typeof require==='function'?require('./portfolio_v2_temporal.js'):null);
      if(!planner?.plan){
        base.ready=false;base.errors.push('Не загружен многомесячный расчёт спроса.');
      }else{
        base.temporal=planner.plan(state,scenario.basket.baseOrders,projectOffers,base.items);
        if(!base.temporal.ready){
          base.ready=false;
          base.errors.push(...base.temporal.errors);
          base.fieldErrors.push(...base.temporal.fieldErrors);
        }
      }
    }
    if(!base.ready)return base;
    if(base.temporal?.ready){
      const finance=typeof globalThis==='object'&&globalThis.LinkedPortfolioTemporalCash?
        globalThis.LinkedPortfolioTemporalCash:
        (typeof require==='function'?require('./portfolio_v2_temporal_cash.js'):null);
      if(!finance?.calculate){
        base.ready=false;
        base.errors.push('Нет финансового движка для многомесячного сценария.');
        return base;
      }
      base.cashflow=finance.calculate(state,base);
    }else base.cashflow=cashFlow(state,base);
    base.totals.startupCapital=base.cashflow.startupCapital;
    base.totals.reserve=base.cashflow.reserve;
    base.totals.finalCash=base.cashflow.finalCash;
    base.totals.freeCash=base.cashflow.freeCash;
    return base;
  }

  function cashFlow(state,portfolio){
    // Unshared physical-goods SKUs each sell their full batch at V1 monthly
    // rate, preserving independent end dates and monthly cost schedules.
    // Linked baskets and shared resources continue as first-30-day scenarios
    // until their cross-SKU monthly continuation contract is reconciled.
    // Launch capital = maximum daily deficit plus V1 liquidity reserve.
    const items=portfolio.items,resources=portfolio.resources;
    const fullStockCycle=items.length>0&&
      items.every(s=>['own','resale'].includes(s.source))&&
      resources.every(r=>r.kind!=='campaign')&&
      !(Array.isArray(state.offers)&&state.offers.length);
    const plan=items.map(s=>{
      const isStock=['own','resale'].includes(s.source);
      const saleStart=isStock?pos(s.supplyDays)+pos(s.productionDays):0;
      const rate=pos(s.forecastOrders)/30;
      const saleDays=isStock&&fullStockCycle?
        pos(s.inventoryQty)/Math.max(EPS,rate):30;
      return {s,isStock,saleStart,saleDays,rate,
        receiptDelay:s.source==='dropship'&&s.dropshipPayoutMode!=='before'?
          pos(s.dropshipDeliveryDays)+pos(s.dropshipPayoutLagDays):0};
    });
    const horizon=Math.max(30,...plan.map(x=>x.saleStart+x.saleDays+x.receiptDelay),
      ...items.map(s=>pos(s.creditMonths)*30));
    if(horizon>3650)throw Error('Горизонт cash flow превышает 120 месяцев.');
    const dayCount=Math.ceil(horizon/30)*30;
    const daily=Array.from({length:dayCount},()=>({
      receipt:0,ordersRevenue:0,cogsAccrual:0,onlineReceipt:0,onlineProfit:0,onlineTax:0,amortAccrual:0,stockPurchase:0,operating:0,
      ad:0,shared:0,commission:0,commissionAccrual:0,loanDraw:0,interest:0,principal:0,tax:0
    }));
    function post(day,key,amount){
      if(!(amount>0))return;
      daily[Math.min(dayCount-1,Math.max(0,Math.floor(day)))][key]+=amount;
    }
    const totalOnce=sum(resources.filter(r=>r.cadence==='once').map(r=>pos(r.amount)));
    post(0,'shared',totalOnce);
    if(fullStockCycle){
      const byId=Object.fromEntries(items.map(s=>[s.id,s.priceList]));
      const cycle=lifecycleResources(resources,items,byId);
      for(const event of cycle.events){
        for(let day=Math.floor(event.start);day<Math.ceil(event.end);day++){
          const portion=Math.max(0,Math.min(day+1,event.end)-Math.max(day,event.start));
          post(day,'shared',event.dailyAmount*portion);
        }
      }
    }
    for(const {s,isStock,saleStart,saleDays,rate,receiptDelay} of plan){
      const stock=pos(s.inventoryQty),orders=pos(s.forecastOrders);
      let residualPerUnit=pos(s.unitCostEffective);
      if(s.source==='online-service'){
        post(0,'stockPurchase',pos(s.onlineCapex));
      }else if(s.source==='offline-service'){
        // Rent and master payroll are paid at the start of the month, not
        // lazily divided among daily customer receipts in the cash ledger.
        const fixed=Math.max(0,pos(s.serviceFixedMonthly)-pos(s.cashOffsets?.production));
        post(0,'stockPurchase',fixed);
        residualPerUnit=Math.max(0,residualPerUnit-fixed/Math.max(EPS,orders));
      }else if(isStock&&!fullStockCycle){
        const input=Math.max(0,pos(s.materialsBatchTotal)-pos(s.cashOffsets?.materials));
        const production=Math.max(0,pos(s.productionTotal)-pos(s.cashOffsets?.production));
        const inbound=pos(s.warehouseInboundUnitCost)*stock;
        post(0,'stockPurchase',input);
        post(saleStart,'stockPurchase',production+inbound);
        residualPerUnit=Math.max(0,residualPerUnit-
          (input+production+inbound)/Math.max(stock,EPS));
      }else if(isStock){
        const input=Math.max(0,pos(s.materialsBatchTotal)-pos(s.cashOffsets?.materials));
        const production=Math.max(0,pos(s.productionTotal)-pos(s.cashOffsets?.production));
        const inbound=pos(s.warehouseInboundUnitCost)*stock;
        const supply=pos(s.supplyDays);
        const advancePct=Math.min(100,pos(s.advancePct));
        const advance=input*advancePct/100;
        if(advance>EPS)post(Math.max(0,supply-pos(s.advanceLeadDays)),'stockPurchase',advance);
        post(supply,'stockPurchase',input-advance);
        const productionDays=pos(s.productionDays);
        if(productionDays>EPS){
          for(let day=0;day<Math.ceil(productionDays);day++){
            const portion=Math.min(1,productionDays-day);
            post(supply+day,'stockPurchase',production*portion/productionDays);
          }
        }else post(supply,'stockPurchase',production);
        post(saleStart,'stockPurchase',inbound);
        // The V1 accrued unit cost includes projected whole-cycle storage.
        // Pay that storage by the actual inventory integral, not again per sale.
        const projectedStorageUnit=pos(s.warehouseDayCost)*saleDays/2;
        residualPerUnit=Math.max(0,residualPerUnit-
          (input+production+inbound)/Math.max(stock,EPS)-projectedStorageUnit);
      }
      const resourceDaily=fullStockCycle?0:
        sum(resources.filter(r=>r.kind!=='campaign'&&r.cadence==='monthly')
          .map(r=>pos(r.bySku[s.id])))/30;
      const dailyAd=pos(s.adBudgetEffective)/30;
      const dailyFixed=(pos(s.manager)+pos(s.selling)-pos(s.onlineAmortMonthly))/30;
      let sold=0;
      for(let day=0;day<Math.ceil(saleDays);day++){
        const portion=Math.min(1,saleDays-day);
        const qty=isStock?Math.min(Math.max(0,stock-sold),rate*portion):
          orders/30;
        const at=saleStart+day,netRevenue=qty*pos(s.priceNet);
        if(fullStockCycle&&isStock&&pos(s.warehouseDayCost)>0){
          const inventoryIntegral=(stock-sold)*portion-
            rate*portion*portion/2;
          post(at,'operating',pos(s.warehouseDayCost)*Math.max(0,inventoryIntegral));
        }
        sold+=qty;
        // Time-based campaigns and fixed costs run throughout the sell-through.
        post(at,'ad',dailyAd*portion);
        post(at,'shared',(dailyFixed+resourceDaily)*portion);
        post(at,'ordersRevenue',netRevenue);
        if(s.source==='online-service'){
          const onlineProfit=netRevenue-qty*pos(s.unitCostEffective)-
            netRevenue*pos(s.variableSalesPct)/100-
            (dailyAd+dailyFixed+resourceDaily)*portion-
            pos(s.onlineAmortMonthly)/30;
          daily[Math.min(dayCount-1,Math.max(0,Math.floor(at)))].onlineProfit+=onlineProfit;
          post(at,'amortAccrual',pos(s.onlineAmortMonthly)/30);
        }
        post(at,'cogsAccrual',qty*pos(s.unitCostEffective));
        post(at,'commissionAccrual',netRevenue*pos(s.variableSalesPct)/100);
        // Supplier/fulfillment is funded on the order date.
        post(at,'operating',qty*residualPerUnit);
        post(at+receiptDelay,'receipt',netRevenue);
        if(s.source==='online-service'){
          post(at+receiptDelay,'onlineReceipt',netRevenue);
          post(at+receiptDelay,'onlineTax',netRevenue*pos(s.ownerTax?.pct)/100);
        }
        post(at+receiptDelay,'commission',netRevenue*pos(s.variableSalesPct)/100);
      }
      if(pos(s.creditPrincipal)>0){
        post(0,'loanDraw',pos(s.creditPrincipal));
        const months=Math.max(1,Math.ceil(pos(s.creditMonths)||1));
        for(let i=1;i<=months;i++)post(i*30-1,'interest',pos(s.creditServiceMonthly));
        post(months*30-1,'principal',pos(s.creditPrincipal));
      }
    }
    const monthCount=Math.max(1,Math.ceil(dayCount/30));
    const months=Array.from({length:monthCount},(_,index)=>({
      month:index+1,receipt:0,operatingOutflow:0,tax:0,interest:0,
      principalRepaid:0,loanDraw:0,ownerCapital:0,cashFlow:0,cumulative:0,
      freeCumulative:0,stockPurchase:0,ad:0,shared:0,taxableProfit:0
    }));
    const rate=pos(state.tax?.pct)/100;
    for(let i=0;i<monthCount;i++){
      const days=daily.slice(i*30,(i+1)*30);
      const total=key=>sum(days.map(d=>d[key]));
      const receipt=total('receipt');
      const accrualProfit=total('ordersRevenue')-total('cogsAccrual')-
        total('commissionAccrual')-total('ad')-total('interest')-
        (total('shared')-(i===0?totalOnce:0));
      const onlineReceipt=total('onlineReceipt');
      const regularAccrual=accrualProfit-total('onlineProfit')-total('amortAccrual');
      const tax=(state.tax?.type==='profit'?Math.max(0,regularAccrual)*rate:
        Math.max(0,receipt-onlineReceipt)*rate)+total('onlineTax');
      // The tax settlement is at month's end, after daily trading movements.
      post(Math.min(dayCount-1,(i+1)*30-1),'tax',tax);
    }
    for(let day=0;day<dayCount;day++){
      const d=daily[day],m=months[Math.floor(day/30)];
      m.receipt+=d.receipt;
      m.stockPurchase+=d.stockPurchase;
      m.ad+=d.ad;
      m.shared+=d.shared;
      m.tax+=d.tax;
      m.interest+=d.interest;
      m.principalRepaid+=d.principal;
      m.loanDraw+=d.loanDraw;
      m.operatingOutflow+=d.operating+d.commission+d.stockPurchase+d.ad+d.shared;
      m.taxableProfit+=d.ordersRevenue-d.cogsAccrual-d.commissionAccrual-d.ad-d.shared-d.amortAccrual-d.interest;
    }
    let running=0,minimum=0;
    for(const d of daily){
      const change=d.receipt+d.loanDraw-
        d.operating-d.commission-d.stockPurchase-d.ad-d.shared-d.tax-d.interest-d.principal;
      running+=change;minimum=Math.min(minimum,running);
    }
    const reserve=sum(items.map(s=>pos(s.reserveAmount)));
    const ownerCapital=Math.max(0,-minimum)+reserve;
    months[0].ownerCapital=ownerCapital;
    running=0;
    for(const month of months){
      month.cashFlow=month.receipt+month.loanDraw-month.operatingOutflow-month.tax-
        month.interest-month.principalRepaid;
      running+=month.cashFlow+month.ownerCapital;
      month.cumulative=running;
      month.freeCumulative=running-reserve;
    }
    const borrowedCapital=sum(items.map(s=>pos(s.creditPrincipal)));
    return {months,reserve,ownerCapital,borrowedCapital,
      startupCapital:ownerCapital+borrowedCapital,
      finalCash:running,freeCash:running-reserve,peakOperatingDeficit:-minimum};
  }
  return Object.freeze({fromV1,build,projectOffers});
});
