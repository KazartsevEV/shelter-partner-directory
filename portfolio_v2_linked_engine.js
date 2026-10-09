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
        pos(sku._projectedOrders??sku.forecastUnitsPerMonth)/(1+pos(sku.vatPct)/100);
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
      const min=finite(s.priceMin),max=finite(s.priceMax);
      if(!(min>0&&max>=min))report(key,'Для товара отсутствует подтверждённый диапазон цен V1.');
      if(!(pos(s.targetMarginPct)>0&&pos(s.minimumMarginPct)>0&&pos(s.targetMarginPct)>=pos(s.minimumMarginPct)))
        report(key,'Не готовы минимальная и целевая маржинальность V1.');
      const disc=finite(s.discountSelected),limit=pos(s.maxDiscountPct);
      if(disc<0||disc>limit+EPS||limit>=100)
        report(key+'.discountSelected','Рабочая скидка превышает максимальную скидку из V1.');
      if(!(pos(s.forecastUnitsPerMonth)>0)||!(pos(s.baseCac)>0))
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

    const marginRate=(s,m)=>Math.max(0,Math.min(.999,pos(m)/100));
    const taxRate=pos(state.tax?.pct)/100,taxType=state.tax?.type==='profit'?'profit':'turnover';
    // Required customer-facing LIST price. The selected discount is applied at checkout;
    // VAT is pass-through, and the target is after the turnover/profit tax.
    function requiredListPrice(s,unitLoad,marginPct){
      const variable=pos(s.variableSalesPct)/100,goal=marginRate(s,marginPct);
      const retained=1-variable-(taxType==='turnover'?taxRate:0)-
        goal/(taxType==='profit'?1-taxRate:1);
      if(retained<=0||s.discountSelected>=100)return Infinity;
      return unitLoad/retained*(1+pos(s.vatPct)/100)/(1-s.discountSelected/100);
    }
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
      const projections=rows.map(s=>{
        const media=mediaBySku[s.id],orders=pos(s.forecastUnitsPerMonth)*media/pos(s.adBudget);
        const monthlyResources=allocation.filter(r=>r.kind!=='campaign'&&r.cadence==='monthly')
          .reduce((v,r)=>v+pos(r.bySku[s.id]),0);
        const monthlyManager=pos(s.adManagement)-offsets[s.id].marketingManagement;
        const monthlySelling=pos(s.salesFixedMonthly)-offsets[s.id].salesFixed;
        // A V1 SKU's embedded cost is removed once, then charged through one
        // common resource, without multiplying the shared payment by SKU count.
        const embeddedUnit=pos(s.forecastUnitsPerMonth)>0?offsets[s.id].unitCost/pos(s.forecastUnitsPerMonth):0;
        const netUnitCost=pos(s.unitCost)-embeddedUnit;
        const unitLoad=orders>0?netUnitCost+(media+monthlyManager+monthlySelling+
          monthlyResources+pos(s.creditServiceMonthly))/orders:Infinity;
        return {s,media,orders,monthlyResources,monthlyManager,monthlySelling,
          netUnitCost,unitLoad,priceTarget:requiredListPrice(s,unitLoad,s.targetMarginPct),
          priceFloor:requiredListPrice(s,unitLoad,s.minimumMarginPct)};
      });
      return {allocation,mediaBySku,projections};
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
    const items=scenario.projections.map(p=>{
      const {s,media,orders,monthlyResources,monthlyManager,monthlySelling,netUnitCost,unitLoad}=p;
      const priceList=Math.max(pos(s.priceMin),Math.min(pos(s.priceMax),
        Math.ceil(prices[s.id]*100-1e-8)/100));
      const grossPrice=priceList*(1-s.discountSelected/100);
      const priceNet=grossPrice/(1+pos(s.vatPct)/100);
      const revenue=priceNet*orders,commission=revenue*pos(s.variableSalesPct)/100;
      const cogs=netUnitCost*orders,creditMonthly=pos(s.creditServiceMonthly);
      const ebitda=revenue-cogs-commission-media-monthlyManager-monthlySelling-monthlyResources;
      const actualAfterTaxMargin=revenue>0?
        (ebitda-creditMonthly-(taxType==='turnover'?revenue*taxRate:Math.max(0,ebitda-creditMonthly)*taxRate))/revenue*100:0;
      const minOk=Number.isFinite(p.priceFloor)&&p.priceFloor<=pos(s.priceMax)+.005&&
        actualAfterTaxMargin+.00001>=pos(s.minimumMarginPct);
      const targetOk=Number.isFinite(p.priceTarget)&&p.priceTarget<=pos(s.priceMax)+.005&&
        actualAfterTaxMargin+.00001>=pos(s.targetMarginPct);
      return {...s,priceSelected:priceList,priceList,priceGross:grossPrice,priceNet,
        requiredTargetPrice:p.priceTarget,requiredFloorPrice:p.priceFloor,
        forecastOrders:orders,adBudgetEffective:media,revenue,cogs,commission,
        manager:monthlyManager,selling:monthlySelling,resourceShares:monthlyResources,
        ebitda,creditMonthly,preTaxProfit:ebitda-creditMonthly,
        unitCostEffective:netUnitCost,unitLoad,revenueWeight:0,
        actualAfterTaxMargin,minimumMarginFeasible:minOk,targetMarginMet:targetOk,
        status:!minOk?'INFEASIBLE':targetOk?'TARGET_MET':'MINIMUM_ONLY'};
    });
    const totalRevenue=sum(items.map(s=>s.revenue));
    items.forEach(item=>item.revenueWeight=totalRevenue>0?item.revenue/totalRevenue:0);
    const fullMedia=sum(items.map(s=>s.adBudgetEffective));
    const monthlyCosts=sum(scenario.allocation.filter(r=>r.cadence==='monthly'&&r.kind!=='campaign').map(r=>r.amount));
    const onceCosts=sum(scenario.allocation.filter(r=>r.cadence==='once').map(r=>r.amount));
    const totalEbitda=sum(items.map(s=>s.ebitda));
    const interest=sum(items.map(s=>s.creditMonthly));
    const tax=taxType==='turnover'?totalRevenue*taxRate:Math.max(0,totalEbitda-interest)*taxRate;
    const netProfit=totalEbitda-interest-tax;
    const originalMedia=sum(rows.map(s=>pos(s.adBudget)));
    const addedMedia=sum(scenario.allocation.filter(r=>r.kind==='campaign').map(r=>r.amount));
    const replacedMedia=sum(rows.map(s=>offsets[s.id].adBudget));
    const invariantMedia=Math.abs(fullMedia-(originalMedia-replacedMedia+addedMedia))<EPS;
    const allocated=sum(scenario.allocation.map(r=>sum(Object.values(r.bySku))));
    const resourcesTotal=sum(scenario.allocation.map(r=>r.amount));
    for(const item of items){
      if(item.source!=='dropship'&&pos(item.inventoryQty)+EPS<item.forecastOrders){
        report('skus.'+rows.findIndex(s=>s.id===item.id),
          'Прогноз по «'+item.name+'» ('+item.forecastOrders.toFixed(2)+
          ' шт.) превышает запас V1 ('+pos(item.inventoryQty)+' шт.). Увеличьте складскую партию в V1 или скорректируйте распределение рекламы.');
      }
    }
    const infeasible=items.filter(item=>!item.minimumMarginFeasible);
    if(infeasible.length)for(const item of infeasible)
      report('skus.'+rows.findIndex(s=>s.id===item.id)+'.priceMax',
        'Для «'+item.name+'» минимум рентабельности требует цены '+
        (Number.isFinite(item.requiredFloorPrice)?item.requiredFloorPrice.toFixed(2):'выше расчётного предела')+
        ', а предел V1 — '+item.priceMax+'.');
    if(!invariantMedia||Math.abs(allocated-resourcesTotal)>=EPS)
      report('resources','Не удалось распределить все расходы без потерь или повторного учёта.');
    const base={ready:!errors.length,errors,fieldErrors,items,resources:scenario.allocation,offsets,
      totals:{revenue:totalRevenue,media:fullMedia,cogs:sum(items.map(s=>s.cogs)),
        forecast:sum(items.map(s=>s.forecastOrders)),monthlyResources:monthlyCosts,
        onceResources:onceCosts,ebitda:totalEbitda,interest,tax,netProfit,
        targetMet:items.every(s=>s.targetMarginMet),minimumMet:items.every(s=>s.minimumMarginFeasible)},
      invariants:{mediaConserved:invariantMedia,resourcesConserved:Math.abs(allocated-resourcesTotal)<EPS,
        fixedPointConverged:converged}};
    // Do not claim that an impossible portfolio works: show the max feasible
    // retail price, its shortfall and a non-ready status instead.
    if(!base.ready)return base;
    base.cashflow=cashFlow(state,base);
    base.totals.startupCapital=base.cashflow.startupCapital;
    base.totals.reserve=base.cashflow.reserve;
    base.totals.finalCash=base.cashflow.finalCash;
    base.totals.freeCash=base.cashflow.freeCash;
    return base;
  }

  function cashFlow(state,portfolio){
    // A single 30-day campaign per SKU with its own supply lead and payout delay.
    // Outlays and receipts are calculated daily: launch capital = worst daily deficit
    // plus the V1 locked liquidity reserve (less available V1 loan draws).
    const items=portfolio.items,resources=portfolio.resources;
    const plan=items.map(s=>({
      s,saleStart:s.source==='dropship'?0:pos(s.supplyDays)+pos(s.productionDays),
      receiptDelay:s.source==='dropship'&&s.dropshipPayoutMode!=='before'?
        pos(s.dropshipDeliveryDays)+pos(s.dropshipPayoutLagDays):0
    }));
    const horizon=Math.max(30,...plan.map(x=>x.saleStart+30+x.receiptDelay),
      ...items.map(s=>pos(s.creditMonths)*30));
    if(horizon>3650)throw Error('Горизонт cash flow превышает 120 месяцев.');
    const dayCount=Math.ceil(horizon/30)*30;
    const daily=Array.from({length:dayCount},()=>({
      receipt:0,ordersRevenue:0,cogsAccrual:0,stockPurchase:0,operating:0,
      ad:0,shared:0,commission:0,commissionAccrual:0,loanDraw:0,interest:0,principal:0,tax:0
    }));
    function post(day,key,amount){
      if(!(amount>0))return;
      daily[Math.min(dayCount-1,Math.max(0,Math.floor(day)))][key]+=amount;
    }
    const totalOnce=sum(resources.filter(r=>r.cadence==='once').map(r=>pos(r.amount)));
    post(0,'shared',totalOnce);
    for(const {s,saleStart,receiptDelay} of plan){
      const stock=pos(s.inventoryQty),orders=pos(s.forecastOrders);
      let residualPerUnit=pos(s.unitCostEffective);
      if(s.source!=='dropship'){
        const input=pos(s.materialsBatchTotal),production=pos(s.productionTotal),
          inbound=pos(s.warehouseInboundUnitCost)*stock;
        post(0,'stockPurchase',input);
        post(saleStart,'stockPurchase',production+inbound);
        residualPerUnit=Math.max(0,residualPerUnit-
          (input+production+inbound)/Math.max(stock,EPS));
      }
      const resourceDaily=sum(resources.filter(r=>r.kind!=='campaign'&&r.cadence==='monthly')
        .map(r=>pos(r.bySku[s.id])))/30;
      const dailyAd=pos(s.adBudgetEffective)/30;
      const dailyFixed=(pos(s.manager)+pos(s.selling))/30;
      for(let day=0;day<30;day++){
        const qty=orders/30,at=saleStart+day,netRevenue=qty*pos(s.priceNet);
        // Expense ad/media, management and common assets once per beneficiary.
        post(at,'ad',dailyAd);post(at,'shared',dailyFixed+resourceDaily);
        post(at,'ordersRevenue',netRevenue);
        post(at,'cogsAccrual',qty*pos(s.unitCostEffective));
        post(at,'commissionAccrual',netRevenue*pos(s.variableSalesPct)/100);
        // Supplier/fulfillment is funded on the order date.
        post(at,'operating',qty*residualPerUnit);
        post(at+receiptDelay,'receipt',netRevenue);
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
      const tax=state.tax?.type==='profit'?Math.max(0,accrualProfit)*rate:receipt*rate;
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
      m.taxableProfit+=d.ordersRevenue-d.cogsAccrual-d.commissionAccrual-d.ad-d.shared-d.interest;
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
  return Object.freeze({fromV1,build});
});
