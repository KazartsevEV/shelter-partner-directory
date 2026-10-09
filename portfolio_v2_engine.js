/* Portfolio v2 — pure accounting engine. No DOM, storage or service-mode dependencies.
   Mathematical contract: spending is conserved; SKU prices are based on average CAC,
   actual weighted CAC is allocated by forecast net-of-VAT revenue, not unit mix.
   Money is held at full precision and rounded only for display. */
(function (root, factory) {
  const engine = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
  if (root) root.PortfolioV2Engine = engine;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const EPS = 1e-8;
  const finite = (v, fallback=0) => v === '' || v === null || v === undefined ? fallback :
    Number.isFinite(Number(v)) ? Number(v) : fallback;
  const positive = v => Math.max(0, finite(v));
  const sum = arr => arr.reduce((a,b)=>a+b,0);
  const round = (n,d=2)=>Math.round((n+Number.EPSILON)*10**d)/10**d;
  const id = v=>String(v??'');
  const validKind=new Set(['own','resale','dropship']);
  const facilityKinds=new Set(['premises','workers','warehouse','salesStaff','marketingManager','website','hosting','domain','content','other','equipment','certification','campaign']);
  const scope = (r,ids)=> r.skuIds?.length ? r.skuIds.map(id).filter(s=>ids.includes(s)) : ids.slice();
  function marketingFunnel(marketing) {
    const budget=positive(marketing?.budget);
    const cpc=positive(marketing?.cpc);
    const ctr=positive(marketing?.ctrPct)/100;
    const cl=positive(marketing?.clickLeadPct)/100;
    const lo=positive(marketing?.leadOrderPct)/100;
    const errors=[],fieldErrors=[];
    const report=(path,message)=>{errors.push(message);fieldErrors.push({path,message})};
    if(!(budget>0))report('marketing.budget','Укажите общий месячный рекламный бюджет.');
    if(!(cpc>0))report('marketing.cpc','CPC должен быть больше нуля.');
    if(ctr>1)report('marketing.ctrPct','CTR не может превышать 100%.');
    if(cl>1)report('marketing.clickLeadPct','Конверсия клик → лид не может превышать 100%.');
    if(lo>1)report('marketing.leadOrderPct','Конверсия лид → заказ не может превышать 100%.');
    if(!(ctr>0))report('marketing.ctrPct','Укажите CTR, чтобы рассчитать число показов.');
    if(!(cl>0))report('marketing.clickLeadPct','Укажите конверсию клик → лид.');
    if(!(lo>0))report('marketing.leadOrderPct','Укажите конверсию лид → заказ.');
    const clicks=cpc>0 ? budget/cpc : 0;
    const leads=clicks*cl;
    const orders=leads*lo;
    if(budget>0&&!(orders>0)&&cl>0&&lo>0&&cpc>0)
      report('marketing.budget','Воронка не прогнозирует заказов: проверьте бюджет и конверсии.');
    const views=ctr>0?clicks/ctr:null;
    const baseCAC=orders>0?budget/orders:0;
    const coefficient=positive(marketing?.cacReservePct??100);
    if(!(coefficient>0&&coefficient<=100))
      report('marketing.cacReservePct','Коэффициент запаса CAC должен быть от 0 до 100%.');
    return {budget,clicks,leads,orders,impressions:views,baseCAC,
      guardedCAC:coefficient>0?baseCAC/(coefficient/100):null,errors,fieldErrors};
  }
  function resolveSourcing(sku,errors,fieldErrors,path) {
    const report=(field,message)=>{errors.push(message);fieldErrors.push({path:path+'.'+field,message})};
    const kind=sku.source;
    if(!validKind.has(kind)) report('source','У '+sku.name+' не выбран способ поставки.');
    const unitCost=positive(sku.unitCost);
    const batchUnits=positive(sku.batchUnits);
    const advance=positive(sku.initialCashOut);
    if(!(unitCost>0))report('unitCost','У '+sku.name+' должна быть указана себестоимость одной единицы.');
    if(kind==='dropship'&&advance>EPS)report('source','Для дропшиппинга невозможна стартовая закупка — переключите способ поставки или очистите аванс.');
    if(kind==='dropship'&&batchUnits>EPS)report('source','Дропшиппинг не формирует собственный складской запас.');
    if(kind!=='dropship'&&positive(sku.storagePerUnitDay)>0&&!(batchUnits>0))
      report('batchUnits','Для расчёта хранения '+sku.name+' укажите размер складской партии.');
    if(kind!=='dropship'&&advance>EPS&&!(batchUnits>0))report('batchUnits','Для стартовой закупки укажите размер партии.');
    if(batchUnits>EPS&&advance-unitCost*batchUnits>EPS)report('initialCashOut','Предоплата '+sku.name+' превышает стоимость партии.');
    const handling=positive(sku.fulfillmentPerOrder);
    const storagePerUnitDay=kind==='dropship'?0:positive(sku.storagePerUnitDay);
    const prepurchase=kind==='dropship'?0:advance;
    return {unitCost,batchUnits,initialCashOut:prepurchase,fulfillmentPerOrder:handling,storagePerUnitDay,
      // Prepaid raw material/inventory is recognized in COGS only on sale.
      settlementPerOrder:Math.max(0,unitCost-(batchUnits>0?prepurchase/batchUnits:0)),
      source:kind};
  }
  function normalize(state) {
    const errors=[],fieldErrors=[];
    const report=(path,message)=>{errors.push(message);if(path)fieldErrors.push({path,message})};
    let marketing;
    const raw=Array.isArray(state?.skus)?state.skus:[];
    if(!raw.length)report('skus','Добавьте хотя бы один товар.');
    const ids=[];
    const skus=raw.map((v,i)=>{
      const name=String(v.name||'').trim(),skuId=id(v.id||'sku-'+i);
      if(!name)report('skus.'+i+'.name','У товара '+(i+1)+' нет названия.');
      if(ids.includes(skuId))report('skus.'+i+'.name','Повторяющийся ID товара.');
      ids.push(skuId);
      const q=positive(v.mixPct);
      if(!(q>0))report('skus.'+i+'.mixPct','Доля товара '+name+' должна быть больше нуля.');
      const margin=finite(v.marginPct);
      if(margin<0||margin>=100)report('skus.'+i+'.marginPct','Маржинальность '+name+' должна быть от 0 до 99,99%.');
      const payment=positive(v.acquiringPct);
      if(payment>=100)report('skus.'+i+'.acquiringPct','Эквайринг '+name+' не может достигать 100%.');
      return {id:skuId,name,kind:v.source,mixPct:q,marginPct:margin,
        acquiringPct:payment, sourcing:resolveSourcing(v,errors,fieldErrors,'skus.'+i),raw:v};
    });
    const qsum=sum(skus.map(s=>s.mixPct));
    if(skus.length&&Math.abs(qsum-100)>1e-6) {
      const message='Сумма долей продаж должна составлять ровно 100%, сейчас '+round(qsum,4)+'%.';
      report('mix',message);
      skus.forEach((s,i)=>fieldErrors.push({path:'skus.'+i+'.mixPct',message}));
    }
    const resources=(Array.isArray(state?.resources)?state.resources:[]).map((v,i)=>{
      const skuIds=scope(v,ids);
      const label=String(v.label||v.kind||'ресурс').trim();
      const kind=String(v.kind||'other');
      const amount=positive(v.amount);
      const cadence=v.cadence==='once'?'once':'monthly';
      // Media never uses arbitrary unit/usage weights: the governing contract
      // is forecast monetary revenue share among the campaign beneficiaries.
      const basis=kind==='campaign'?'revenue':v.allocation==='usage'?'usage':'revenue';
      const r={id:id(v.id||'r-'+i),kind,label,amount,cadence,skuIds,basis,
        usage:(v.usage&&typeof v.usage==='object')?v.usage:{},
        capacity:positive(v.capacity),totalUsage:0,validFor:v.validFor||'',
        validUntil:v.validUntil||''};
      if(!facilityKinds.has(kind))report('resources.'+i+'.kind','Неизвестный ресурс '+label+'.');
      if(!skuIds.length)report('resources.'+i+'.skuIds','Для ресурса '+label+' не выбран ни один товар.');
      if(skuIds.length!==new Set(skuIds).size)report('resources.'+i+'.skuIds','Ресурс '+label+' повторяет товар.');
      if(kind==='certification'&&skuIds.length>1&&
        (!v.confirmedCoverage||!String(v.validFor||'').trim()||!v.validUntil))
        report('resources.'+i+'.confirmedCoverage','Подтвердите область действия, страну и срок сертификата «'+label+'» для всех товаров.');
      if(kind==='campaign'&&cadence!=='monthly')report('resources.'+i+'.cadence','Бюджет рекламной кампании задаётся за месяц, не разовой суммой.');
      if(basis==='usage') {
        r.totalUsage=sum(skuIds.map(s=>positive(r.usage[s])));
        if(r.totalUsage<=0)report('resources.'+i+'.allocation','Укажите загрузку ресурсов '+label+' по товарам.');
        if(r.capacity>0&&r.totalUsage-r.capacity>EPS)
          report('resources.'+i+'.capacity','Нагрузка на «'+label+'» превышает доступную мощность.');
      }
      if(kind==='certification'&&v.validUntil&&Date.parse(v.validUntil)<Date.parse(state.asOf||new Date().toISOString().slice(0,10)))
        report('resources.'+i+'.validUntil','Срок сертификата '+label+' истёк.');
      return r;
    });
    // Separate media pools are additional, explicitly named campaigns.
    // The top-level budget is the default shared campaign. Nothing is copied.
    const extraMedia=sum(resources.filter(r=>r.kind==='campaign').map(r=>r.amount));
    marketing=marketingFunnel({...state?.marketing,budget:positive(state?.marketing?.budget)+extraMedia});
    errors.push(...marketing.errors);
    fieldErrors.push(...marketing.fieldErrors);
    const resourceIds=resources.map(r=>r.id);
    if(new Set(resourceIds).size!==resourceIds.length)report('resources','ID общего ресурса должен быть уникальным.');
    const fund=state?.funding||{};
    const funding={kind:fund.kind==='credit'?'credit':'cash',annualRatePct:positive(fund.annualRatePct),
      months:Math.max(1,Math.ceil(positive(fund.months)||1)),
      reservePct:positive(fund.reservePct)};
    if(funding.reservePct>1000)report('funding.reservePct','Резерв не может превышать 1000%.');
    const taxes={type:state?.tax?.type==='profit'?'profit':'turnover',
      pct:positive(state?.tax?.pct),vatPct:positive(state?.tax?.vatPct)};
    if(taxes.pct>=100)report('tax.pct','Ставка налога не может достигать 100%.');
    if(taxes.vatPct>=100)report('tax.vatPct','Ставка НДС не может достигать 100%.');
    const periodMonths=Math.max(1,Math.ceil(positive(state?.marketing?.periodMonths)||1));
    if(periodMonths>120)report('marketing.periodMonths','Максимальный прогноз — 120 месяцев.');
    return {errors,fieldErrors,marketing,skus,resources,taxes,funding,periodMonths,ids};
  }
  function resourceShares(resource,prices,quantities) {
    const covered=resource.skuIds;
    const usage=resource.basis==='usage' ?
      covered.map(k=>positive(resource.usage[k])) :
      covered.map(k=>positive(prices[k])*positive(quantities[k]));
    const total=sum(usage);
    const weights={};
    covered.forEach((key,i)=>{weights[key]=total>0?usage[i]/total:1/covered.length;});
    return weights;
  }
  function allocateResources(resources,prices,orders) {
    const line={};
    const annual=Object.fromEntries(Object.keys(prices).map(k=>[k,0]));
    const unique={};
    const ledger=resources.map(r=>{
      const shares=resourceShares(r,prices,orders);
      const bySku=Object.fromEntries(r.skuIds.map(k=>[k,r.amount*(shares[k]||0)]));
      for(const [k,amount] of Object.entries(bySku))annual[k]+=amount;
      unique[r.id]={type:r.kind,amount:r.amount,cadence:r.cadence,bySku};
      return {id:r.id,label:r.label,kind:r.kind,cadence:r.cadence,amount:r.amount,bySku,
        beneficiaries:r.skuIds.slice()};
    });
    return {ledger,attributed:annual,monthlyTotal:sum(ledger.filter(r=>r.cadence==='monthly').map(r=>r.amount)),
      onceTotal:sum(ledger.filter(r=>r.cadence==='once').map(r=>r.amount))};
  }
  function build(state) {
    const x=normalize(state);
    if(x.errors.length)return {ready:false,errors:x.errors,fieldErrors:x.fieldErrors,marketing:x.marketing};
    const {marketing,skus,resources,taxes,funding,periodMonths}=x;
    const orders={};const basePrices={},mix={};
    skus.forEach(s=>{
      const q=s.mixPct/100;
      mix[s.id]=q;
      orders[s.id]=marketing.orders*q;
      basePrices[s.id]=(s.sourcing.unitCost+marketing.guardedCAC)/(1-s.marginPct/100);
    });
    const revenueBasis=Object.fromEntries(skus.map(s=>[s.id,basePrices[s.id]*orders[s.id]]));
    const totalBasis=sum(Object.values(revenueBasis));
    const weights=Object.fromEntries(skus.map(s=>[s.id,totalBasis>0?revenueBasis[s.id]/totalBasis:mix[s.id]]));
    const baseSharedBudget=positive(state?.marketing?.budget);
    const adAllocation=Object.fromEntries(skus.map(s=>[s.id,baseSharedBudget*weights[s.id]]));
    const campaignLedger=resources.filter(r=>r.kind==='campaign').map(r=>{
      const bySku=Object.fromEntries(r.skuIds.map(k=>[k,0]));
      const shares=resourceShares(r,basePrices,orders);
      for(const skuId of r.skuIds) {
        bySku[skuId]=r.amount*(shares[skuId]||0);
        adAllocation[skuId]+=bySku[skuId];
      }
      return {id:r.id,label:r.label,amount:r.amount,bySku,beneficiaries:r.skuIds.slice()};
    });
    const baseCAC=marketing.baseCAC;
    const items=skus.map(s=>{
      const q=mix[s.id],order=orders[s.id],price=basePrices[s.id],cost=s.sourcing.unitCost;
      const ad=adAllocation[s.id],weightedCAC=order>0?ad/order:0;
      const revenue=price*order,cogs=cost*order;
      const acquiring=revenue*s.acquiringPct/100;
      const fulfillment=s.sourcing.fulfillmentPerOrder*order;
      const ebitda=revenue-cogs-ad-acquiring-fulfillment;
      const realizedMargin=revenue>0?(revenue-cogs-ad-acquiring-fulfillment)/revenue*100:0;
      return {...s,unitCost:cost,price,priceWithVat:price*(1+taxes.vatPct/100),
        forecastOrders:order,mix:q,revenueWeight:weights[s.id],weightedCAC,
        adBudget:ad,revenue,cogs,acquiring,fulfillment,ebitda,roas:ad>0?revenue/ad:null,
        realizedMarginPct:realizedMargin};
    });
    const prices=Object.fromEntries(items.map(s=>[s.id,s.price]));
    const resourceAllocation=allocateResources(resources.filter(r=>r.kind!=='campaign'),prices,orders);
    const totalRevenue=sum(items.map(s=>s.revenue));
    const costOfGoods=sum(items.map(s=>s.cogs));
    const totalAcquiring=sum(items.map(s=>s.acquiring));
    const fulfillmentTotal=sum(items.map(s=>s.fulfillment));
    const skuEbitda=sum(items.map(s=>s.ebitda));
    const overallEBITDA=skuEbitda-resourceAllocation.monthlyTotal-resourceAllocation.onceTotal;
    const tax=taxes.type==='turnover'?totalRevenue*taxes.pct/100 :
      Math.max(0,overallEBITDA)*taxes.pct/100;
    const net=overallEBITDA-tax;
    const weightedGrossMargin=totalRevenue>0 ?
      sum(items.map(s=>s.revenue*s.realizedMarginPct))/totalRevenue:0;
    const demand=Object.fromEntries(items.map(s=>[s.id,s.forecastOrders]));
    // Monthly sales stop when inventory is exhausted; dropship is made/paid on demand.
    const maxSellMonths=Math.max(periodMonths,...items.map(s=>s.sourcing.batchUnits>0?
      Math.ceil(s.sourcing.batchUnits/Math.max(EPS,s.forecastOrders)):periodMonths));
    if(maxSellMonths>120)return {ready:false,errors:['Срок распродажи превышает 120 месяцев.'],fieldErrors:[{path:'marketing.periodMonths',message:'Срок распродажи превышает 120 месяцев.'}],marketing};
    const salesHorizon=maxSellMonths;
    const flowEnd=Math.max(salesHorizon,funding.kind==='credit'?funding.months:1);
    if(flowEnd>120)return {ready:false,errors:['Горизонт кредита превышает 120 месяцев.'],fieldErrors:[{path:'funding.months',message:'Горизонт кредита превышает 120 месяцев.'}],marketing};

    function operatingPlan() {
      const remaining=Object.fromEntries(items.map(s=>[s.id,s.sourcing.batchUnits>0?s.sourcing.batchUnits:Infinity]));
      const monthRows=[];let totalCash=0;
      for(let mi=0;mi<flowEnd;mi++){
        const active=mi<salesHorizon;
        const shipped={};
        items.forEach(s=> {
          const qty=active?Math.min(remaining[s.id],s.forecastOrders):0;
          shipped[s.id]=qty;
          if(Number.isFinite(remaining[s.id]))remaining[s.id]=Math.max(0,remaining[s.id]-qty);
        });
        const totals={month:mi+1,sold:shipped,receipt:0,cogs:0,acquiring:0,
          fulfillment:0,ad:0,storage:0,shared:0,oneOff:0,initialPurchase:0,
          supplierSettlement:0,tax:0,ebitda:0,preFinancing:0,interest:0,
          loanDraw:0,ownerDraw:0,principalRepayment:0,inflow:0,outflow:0,
          cashFlow:0,cumulative:0,freeCumulative:0};
        const activeOrders=sum(Object.values(shipped));
        for(const s of items){
          const sold=shipped[s.id],src=s.sourcing;
          const revenue=s.price*sold;
          const acquiring=revenue*s.acquiringPct/100;
          const fulfillment=src.fulfillmentPerOrder*sold;
          const cogs=src.unitCost*sold;
          const paid=src.settlementPerOrder*sold;
          // Batch-prepayment is paid ONCE, never again on a sale.
          if(mi===0)totals.initialPurchase+=src.initialCashOut;
          totals.receipt+=revenue;
          totals.cogs+=cogs;
          totals.acquiring+=acquiring;
          totals.fulfillment+=fulfillment;
          totals.supplierSettlement+=paid;
          // Real holding cost: inventory for this SKU, not extra warehouse rent.
          if(src.batchUnits>0){
            const before=src.batchUnits>0?Math.max(0,src.batchUnits-sum(monthRows.map(m=>m.sold[s.id]||0))):0;
            const after=remaining[s.id];
            totals.storage+=src.storagePerUnitDay*30*(before+after)/2;
          }
        }
        // Charges follow their actual beneficiary resource group. A warehouse
        // or team attached only to SKU B does not keep billing merely because
        // SKU A is still selling after B has sold out.
        if(activeOrders>EPS)totals.ad=positive(state?.marketing?.budget);
        for(const campaign of campaignLedger) {
          if(campaign.beneficiaries.some(k=>(shipped[k]||0)>EPS))totals.ad+=campaign.amount;
        }
        for(const resource of resourceAllocation.ledger) {
          if(resource.cadence==='once'&&mi===0)totals.oneOff+=resource.amount;
          if(resource.cadence==='monthly'&&resource.beneficiaries.some(k=>(shipped[k]||0)>EPS))
            totals.shared+=resource.amount;
        }
        const cost=totals.cogs+totals.acquiring+totals.fulfillment+totals.ad+
          totals.storage+totals.shared+totals.oneOff;
        totals.ebitda=totals.receipt-cost;
        totals.tax=taxes.type==='turnover'?totals.receipt*taxes.pct/100:
          Math.max(0,totals.ebitda)*taxes.pct/100;
        totals.preFinancing=totals.receipt-totals.supplierSettlement-
          totals.initialPurchase-totals.acquiring-totals.fulfillment-totals.ad-
          totals.storage-totals.shared-totals.oneOff-totals.tax;
        totals.cashFlow=totals.preFinancing;
        totalCash+=totals.cashFlow;
        totals.cumulative=totalCash;
        monthRows.push(totals);
      }
      return monthRows;
    }
    const baseMonths=operatingPlan();
    // Required capital = maximum forecast cumulative liquidity deficit,
    // not sum of all expenses twice. Add reserve to initial funding only.
    // Month-end cash flow must never conceal an upfront funding need:
    // the first materials advance, campaign prepayment and one-off purchases
    // fall due before the first customer's money reaches the business.
    const upfront=baseMonths[0].initialPurchase+baseMonths[0].oneOff+
      baseMonths[0].ad+baseMonths[0].shared;
    const deficit=Math.max(upfront,0,...baseMonths.map(m=>-m.cumulative));
    const reserve=deficit*funding.reservePct/100;
    const principal=deficit+reserve;
    const interestPerMonth=funding.kind==='credit'?principal*funding.annualRatePct/1200:0;
    let cumulative=0;
    const months=baseMonths.map((m,i)=>{
      const loanDraw=i===0&&funding.kind==='credit'?principal:0;
      const ownerDraw=i===0&&funding.kind==='cash'?principal:0;
      const interest=funding.kind==='credit'&&i<funding.months?interestPerMonth:0;
      const repay=funding.kind==='credit'&&i===funding.months-1?principal:0;
      const inflow=m.receipt+loanDraw+ownerDraw;
      const outflow=m.receipt-m.preFinancing+interest+repay; // tax already in preFinancing
      const change=inflow-outflow;
      cumulative+=change;
      return {...m,loanDraw,ownerDraw,interest,principalRepayment:repay,inflow,outflow,
        cashFlow:change,cumulative,freeCumulative:cumulative-reserve};
    });
    const projectedNet=sum(months.map(m=>m.ebitda-m.tax-m.interest));
    return {ready:true,errors:[],fieldErrors:[],marketing,items,resources:resourceAllocation.ledger,campaigns:campaignLedger,
      marketingBudget:marketing.budget,skuEbitda,resourceMonthly:resourceAllocation.monthlyTotal,
      resourceOnce:resourceAllocation.onceTotal,totalRevenue,costOfGoods,
      acquiring:totalAcquiring,fulfillment:fulfillmentTotal,
      businessEBITDA:overallEBITDA,tax,netProfit:net,
      weightedMarginPct:weightedGrossMargin,totalROAS:marketing.budget>0?totalRevenue/marketing.budget:null,
      salesHorizon,months,financing:{...funding,principal,deficit,reserve,interestPerMonth,
      totalInterest:interestPerMonth*funding.months},
      projectedCycleNet:projectedNet,finalCash:months.at(-1).cumulative,
      freeCash:months.at(-1).freeCumulative,
      invariants:{
        mixSum:sum(items.map(s=>s.mix)),weightSum:sum(items.map(s=>s.revenueWeight)),
        adAllocated:sum(items.map(s=>s.adBudget)),
        adDiff:sum(items.map(s=>s.adBudget))-marketing.budget,
        revenueAllocated:sum(items.map(s=>s.revenue))-totalRevenue,
        resourceAllocated:resourceAllocation.ledger.every(r=>Math.abs(sum(Object.values(r.bySku))-r.amount)<1e-6)
      }
    };
  }
  return Object.freeze({marketingFunnel,normalize,build,round});
});
