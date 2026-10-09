/* #31E2: opt-in chronological, net-of-VAT operating cash for approved
   repeated monthly demand. Uses the validated #31E1 physical demand plan.
   Does not mutate the legacy first-30-day P&L or V1 source contracts. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.LinkedPortfolioTemporalCash=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const EPS=1e-7;
 const number=x=>Number.isFinite(Number(x))?Number(x):0;
 const pos=x=>Math.max(0,number(x)),sum=a=>a.reduce((v,x)=>v+x,0);
 const stock=s=>['own','resale'].includes(s.source);
 function calculate(state,portfolio){
   const forecast=portfolio?.temporal;
   if(!forecast?.ready||!(forecast.forecastMonths>1))
     throw Error('Нужен утверждённый многомесячный план спроса.');
   const items=portfolio.items,resources=portfolio.resources||[],
     horizonMonths=forecast.forecastMonths;
   if(resources.some(r=>r.kind==='campaign')&&
      !forecast.months.every(m=>m.media?.source==='v1-paid-cac-daily'&&
        Math.abs(m.media.ownerPaid-m.media.allocated-m.media.unattributed)<.000001))
     throw Error('Не подтверждено сохранение общих рекламных платежей по каждому месяцу.');
   const byId=Object.fromEntries(items.map(s=>[s.id,s]));
   const skuLedger=Object.fromEntries(items.map(s=>[s.id,Array.from(
     {length:horizonMonths},(_,k)=>({month:k+1,revenue:0,cogs:0,
       variableCommission:0,marketing:0,operatingShared:0,
       serviceFixed:0,amort:0,interest:0,taxAccrued:0}))]));
   const accrue=(id,day,key,value)=>{
     const k=Math.floor(day/30);
     if(skuLedger[id]?.[k]&&value>EPS)skuLedger[id][k][key]+=value;
   };
   const supplyStart=s=>stock(s)?pos(s.supplyDays)+pos(s.productionDays):0;
   const horizon=Math.max(horizonMonths*30+
       Math.max(0,...items.filter(s=>s.source==='dropship'&&s.dropshipPayoutMode!=='before')
         .map(s=>pos(s.dropshipDeliveryDays)+pos(s.dropshipPayoutLagDays))),
     ...items.map(s=>pos(s.creditMonths)*30));
   if(horizon>3650)throw Error('Горизонт cash flow превышает 120 месяцев.');
   const dayCount=Math.ceil(horizon/30)*30;
   const daily=Array.from({length:dayCount},()=>({
     receipt:0,ordersRevenue:0,cogsAccrual:0,onlineReceipt:0,onlineTax:0,onlineProfit:0,
     stockPurchase:0,operating:0,ad:0,shared:0,commission:0,
     commissionAccrual:0,loanDraw:0,interest:0,principal:0,tax:0,
     fixedAccrual:0,amortAccrual:0
   }));
   const post=(day,key,value)=>{
     if(!(value>EPS))return;
     daily[Math.max(0,Math.min(dayCount-1,Math.floor(day)))][key]+=value;
   };
   // One-time resources and startup equipment never recur as monthly OPEX.
   const hasPooledMedia=forecast.months.some(m=>m.media?.source==='v1-paid-cac-daily');
   const totalOnce=sum(resources.filter(r=>r.cadence==='once'&&
     !(hasPooledMedia&&r.kind==='campaign')).map(r=>pos(r.amount)));
   if(hasPooledMedia)for(const period of forecast.months){
     for(let day=0;day<30;day++)
       post((period.month-1)*30+day,'ad',pos(period.media.dailyCashPaid[day]));
   }
   post(0,'shared',totalOnce);
   const timeline=Object.fromEntries(items.map(s=>[s.id,[]]));
   const baseline=forecast.months[0]?.baseOrders||{};
   for(const s of items){
     const id=s.id,firstOrders=Math.max(EPS,pos(s.forecastOrders));
     const baseDemand=Math.max(EPS,pos(s.forecastUnitsPerMonth));
     const isStock=stock(s);
     let remaining=pos(s.inventoryQty);
     let variableUnit=pos(s.unitCostEffective);
     let accrualUnit=variableUnit;
     if(isStock){
       const qty=pos(s.inventoryQty),input=Math.max(0,pos(s.materialsBatchTotal)-pos(s.cashOffsets?.materials));
       const prod=Math.max(0,pos(s.productionTotal)-pos(s.cashOffsets?.production));
       const inbound=pos(s.warehouseInboundUnitCost)*qty;
       const supply=pos(s.supplyDays),lead=pos(s.advanceLeadDays);
       const advance=input*Math.min(100,pos(s.advancePct))/100;
       post(Math.max(0,supply-lead),'stockPurchase',advance);
       post(supply,'stockPurchase',input-advance);
       const prodDays=pos(s.productionDays);
       if(prodDays>EPS){
         for(let d=0;d<Math.ceil(prodDays);d++)
           post(supply+d,'stockPurchase',prod*Math.min(1,prodDays-d)/prodDays);
       }else post(supply,'stockPurchase',prod);
       post(supplyStart(s),'stockPurchase',inbound);
       const predictedDays=qty/Math.max(EPS,pos(s.forecastUnitsPerMonth)/30);
       const embeddedStorage=pos(s.warehouseDayCost)*predictedDays/2;
       // Stock acquisition is an upfront CASH payment but its material and
       // production cost remains COGS only as units are SOLD. Storage cash and
       // accrual follow the actual declining inventory, not projected COGS.
       accrualUnit=Math.max(0,accrualUnit-embeddedStorage);
       variableUnit=Math.max(0,variableUnit-(input+prod+inbound)/Math.max(EPS,qty)-embeddedStorage);
     }else if(s.source==='online-service'){
       post(0,'stockPurchase',pos(s.onlineCapex));
     }else if(s.source==='offline-service'){
       const original=Math.max(EPS,pos(s.forecastUnitsPerMonth));
       variableUnit=Math.max(0,pos(s.serviceMaterialsUnit)-pos(s.cashOffsets?.materials)/original)+
         Math.max(0,pos(s.serviceElectricityUnit)-pos(s.cashOffsets?.fulfillment)/original);
       // V1 effective unit cost may include allocated monthly rent/staff.
       // Recognize per-visit inputs here; rent is separately accrued once per
       // actual service month through fixedAccrual. Never charge both.
       accrualUnit=variableUnit;
     }
     const receiptLag=s.source==='dropship'&&s.dropshipPayoutMode!=='before'?
       pos(s.dropshipDeliveryDays)+pos(s.dropshipPayoutLagDays):0;
     for(const month of forecast.months){
       const m=month.month-1,mStart=m*30,mEnd=mStart+30;
       const qty=pos(month.orders[id]);
       const rawBase=pos(month.baseOrders[id]);
       // Physical goods advertise only during their sale-active days.
       // Upsell substitution does not stop marketing the anchor prematurely.
       const fraction=isStock?Math.min(1,rawBase/baseDemand):1;
       const start=isStock?Math.max(mStart,supplyStart(s)):mStart;
       const end=isStock?Math.min(mEnd,start+30*fraction):mEnd;
       const days=Math.max(0,end-start);
       if(qty>EPS&&days<=EPS)
         throw Error('У «'+s.name+'» есть заказы в недоступном периоде '+month.month+'.');
       if(isStock&&qty>remaining+EPS)
         throw Error('Нехватка склада при распределении «'+s.name+'» в месяце '+month.month+'.');
       const exposure=pos(month.discountedUnits[id]),invoice=
         pos(s.standaloneNet)*(qty-exposure);
       if(exposure>qty+EPS||invoice<0)
         throw Error('Несогласованная скидка комплекта в месяце '+month.month+'.');
       const salesRate=days>EPS?qty/days:0;
       const revenueRate=days>EPS?invoice/days:0;
       timeline[id].push({month:month.month,start,end,orders:qty,netRevenue:invoice});
       if(s.source==='offline-service'){
         const rent=Math.max(0,pos(s.serviceFixedMonthly)-pos(s.cashOffsets?.production));
         post(mStart,'stockPurchase',rent);
         post(mStart,'fixedAccrual',rent);
         accrue(id,mStart,'serviceFixed',rent);
       }
       for(let day=Math.floor(start);day<Math.ceil(end);day++){
         const interval=Math.max(0,Math.min(day+1,end)-Math.max(day,start));
         if(!(interval>0))continue;
         const units=salesRate*interval,revenue=revenueRate*interval;
         const advertising=hasPooledMedia?0:pos(s.adBudgetEffective)/30*interval;
         const attributedAd=hasPooledMedia?
           pos(month.media?.dailyAllocated?.[id]?.[day-Math.floor(mStart)])/1:advertising;
         const overhead=(pos(s.manager)+pos(s.selling)-pos(s.onlineAmortMonthly))/30*interval;
         const commission=revenue*pos(s.variableSalesPct)/100;
         post(day,'ad',advertising);
         post(day,'shared',overhead);
         accrue(id,day,'operatingShared',overhead);
         post(day,'ordersRevenue',revenue);
         accrue(id,day,'revenue',revenue);
         post(day,'cogsAccrual',units*accrualUnit);
         accrue(id,day,'cogs',units*accrualUnit);
         post(day,'commissionAccrual',commission);
         accrue(id,day,'variableCommission',commission);
         if(!hasPooledMedia)accrue(id,day,'marketing',advertising);
         post(day,'operating',units*variableUnit);
         post(day+receiptLag,'receipt',revenue);
         post(day+receiptLag,'commission',commission);
         if(s.source==='online-service'){
           post(day+receiptLag,'onlineReceipt',revenue);
           post(day+receiptLag,'onlineTax',revenue*pos(s.ownerTax?.pct)/100);
           const amort=pos(s.onlineAmortMonthly)/30*interval;
           post(day,'amortAccrual',amort);
           accrue(id,day,'amort',amort);
           daily[day].onlineProfit+=revenue-units*variableUnit-
             commission-attributedAd-overhead-amort;
         }
       }
       if(isStock)remaining=Math.max(0,remaining-qty);
     }
     if(isStock&&pos(s.warehouseDayCost)>0){
       let stockLeft=pos(s.inventoryQty);
       for(let day=Math.floor(supplyStart(s));day<dayCount;day++){
         const used=sum(timeline[id].map(x=>{
           const overlap=Math.max(0,Math.min(x.end,day+1)-Math.max(x.start,day));
           return x.end>x.start?x.orders*overlap/(x.end-x.start):0;
         }));
         const hold=Math.max(0,stockLeft-used/2);
         const cost=pos(s.warehouseDayCost)*hold;
         post(day,'operating',cost);
         post(day,'cogsAccrual',cost);
         accrue(id,day,'cogs',cost);
         stockLeft=Math.max(0,stockLeft-used);
       }
     }
     if(pos(s.creditPrincipal)>0){
       post(0,'loanDraw',pos(s.creditPrincipal));
       const months=Math.max(1,Math.ceil(pos(s.creditMonths)||1));
       for(let month=1;month<=months;month++)
         {post(month*30-1,'interest',pos(s.creditServiceMonthly));
          accrue(id,month*30-1,'interest',pos(s.creditServiceMonthly));}
       post(months*30-1,'principal',pos(s.creditPrincipal));
     }
   }
   // A monthly shared resource is paid once whenever ANY beneficiary is
   // operating in a day. It cannot be multiplied by number of SKU users.
   for(const r of resources.filter(x=>x.kind!=='campaign'&&x.cadence==='monthly')){
     for(let day=0;day<horizonMonths*30;day++){
       const windows=[];
       for(const id of r.skuIds||[]){
         const s=byId[id];if(!s)continue;
         if(!stock(s)){windows.push([day,day+1]);continue;}
         for(const t of timeline[id]){
           const from=Math.max(day,t.start),to=Math.min(day+1,t.end);
           if(to>from)windows.push([from,to]);
         }
       }
       windows.sort((x,y)=>x[0]-y[0]);
       let covered=0,start=-1,end=-1;
       for(const [from,to] of windows){
         if(start<0){start=from;end=to;}
         else if(from>end){covered+=end-start;start=from;end=to;}
         else end=Math.max(end,to);
       }
       if(start>=0)covered+=end-start;
       const real=pos(r.amount)/30*covered;
       post(day,'shared',real);
       if(real>EPS){
         // Beneficiaries' direct occupied time determines allocation; revenue
         // weights can shift with actual H-period discounts and prices.
         const eligible=(r.skuIds||[]).filter(id=>byId[id]&&(
           !stock(byId[id])||timeline[id].some(t=>t.start<day+1&&t.end>day)));
         const weights=eligible.map(id=>{
           if(r.allocation==='usage')return r.usageMode==='per-unit'?
             pos(r.loadPerUnit?.[id])*sum(timeline[id].map(t=>
               t.end>t.start&&t.start<day+1&&t.end>day?
               t.orders*Math.max(0,Math.min(day+1,t.end)-Math.max(day,t.start))/(t.end-t.start):0)):
             pos(r.usage?.[id]);
           return sum(timeline[id].map(t=>t.end>t.start&&t.start<day+1&&t.end>day?
             t.netRevenue*Math.max(0,Math.min(day+1,t.end)-Math.max(day,t.start))/(t.end-t.start):0));
         });
         const total=sum(weights);
         const n=eligible.length;
         eligible.forEach((id,i)=>accrue(id,day,'operatingShared',
           real*(total>EPS?weights[i]/total:1/Math.max(1,n))));
       }
     }
   }
   const months=Array.from({length:dayCount/30},(_,i)=>({
     month:i+1,receipt:0,operatingOutflow:0,tax:0,interest:0,
     principalRepaid:0,loanDraw:0,ownerCapital:0,cashFlow:0,
     cumulative:0,freeCumulative:0,stockPurchase:0,ad:0,shared:0,
     taxableProfit:0
   }));
   const taxPct=pos(state.tax?.pct)/100;
   for(let m=0;m<months.length;m++){
     const days=daily.slice(m*30,(m+1)*30),total=key=>sum(days.map(d=>d[key]));
     const profit=total('ordersRevenue')-total('cogsAccrual')-
       total('commissionAccrual')-total('ad')-
       total('shared')+(m===0?totalOnce:0)-total('interest')-
       total('fixedAccrual')-total('amortAccrual');
     const receipt=total('receipt'),onlineReceipt=total('onlineReceipt');
     // Online turnover taxes are owner-specific; never tax partner GMV.
     const regularRevenue=receipt-onlineReceipt;
     const regularProfit=profit-total('onlineProfit');
     const tax=(state.tax?.type==='profit'?
       Math.max(0,regularProfit)*taxPct:Math.max(0,regularRevenue)*taxPct)+
       total('onlineTax');
     post(m*30+29,'tax',tax);
   }
   let running=0,peak=0;
   for(const d of daily){
     running+=d.receipt+d.loanDraw-d.operating-d.commission-
       d.stockPurchase-d.ad-d.shared-d.tax-d.interest-d.principal;
     peak=Math.min(peak,running);
   }
   const reserve=sum(items.map(s=>pos(s.reserveAmount)));
   const ownerCapital=Math.max(0,-peak)+reserve;
   let balance=0;
   for(let day=0;day<daily.length;day++){
     const d=daily[day],m=months[Math.floor(day/30)];
     m.receipt+=d.receipt;m.stockPurchase+=d.stockPurchase;
     m.ad+=d.ad;m.shared+=d.shared;m.tax+=d.tax;
     m.interest+=d.interest;m.principalRepaid+=d.principal;m.loanDraw+=d.loanDraw;
     m.operatingOutflow+=d.operating+d.commission+d.stockPurchase+d.ad+d.shared;
     m.taxableProfit+=d.ordersRevenue-d.cogsAccrual-d.commissionAccrual-
       d.ad-d.shared-d.fixedAccrual-d.amortAccrual-d.interest;
   }
   months[0].ownerCapital=ownerCapital;
   for(const m of months){
     m.cashFlow=m.receipt+m.loanDraw-m.operatingOutflow-m.tax-m.interest-m.principalRepaid;
     balance+=m.cashFlow+m.ownerCapital;
     m.cumulative=balance;m.freeCumulative=balance-reserve;
   }
   // F2A: accrual earnings are distinct from cash stock purchase, credit
   // principal and owner funding. Taxes paid on delayed receipts can settle in
   // a different month than taxes recognized on fulfilled VAT-net sales.
   const profitMonths=[];
   for(let k=0;k<horizonMonths;k++){
     const entries=daily.slice(k*30,(k+1)*30);
     const t=key=>sum(entries.map(day=>day[key]));
     const revenue=t('ordersRevenue'),cogs=t('cogsAccrual');
     const variableCommission=t('commissionAccrual'),marketing=t('ad');
     const operatingShared=t('shared')-(k===0?totalOnce:0);
     const serviceFixed=t('fixedAccrual');
     const ebitda=revenue-cogs-variableCommission-marketing-
       operatingShared-serviceFixed;
     const amort=t('amortAccrual'),interest=t('interest');
     const preTaxProfit=ebitda-amort-interest;
     const onlineRevenue=sum(items.filter(s=>s.source==='online-service')
       .map(s=>pos(timeline[s.id]?.[k]?.netRevenue)));
     const onlineTurnoverTax=sum(items.filter(s=>s.source==='online-service')
       .map(s=>pos(timeline[s.id]?.[k]?.netRevenue)*pos(s.ownerTax?.pct)/100));
     const regularProfit=preTaxProfit-t('onlineProfit');
     const taxAccrued=(state.tax?.type==='profit'?
       Math.max(0,regularProfit)*taxPct:
       Math.max(0,revenue-onlineRevenue)*taxPct)+onlineTurnoverTax;
     const netProfit=preTaxProfit-taxAccrued;
     profitMonths.push({month:k+1,revenue,cogs,variableCommission,
       marketing,operatingShared,serviceFixed,ebitda,amort,
       interest,preTaxProfit,taxAccrued,netProfit,
       netMargin:revenue>EPS?netProfit/revenue*100:null,
       taxCashPaid:months[k].tax,
       taxTimingDifference:taxAccrued-months[k].tax});
   }
   // Attribute actual owner-paid pooled advertising, including committed
   // payments after inventory is sold out. An idle campaign belongs to its
   // original named beneficiaries, not to phantom newly acquired customers.
   if(hasPooledMedia)for(const month of forecast.months){
     const k=month.month-1;
     for(const s of items)skuLedger[s.id][k].marketing+=
       pos(month.media.allocatedBySku[s.id])+
       pos(month.media.retainedBySku[s.id]);
     for(const r of resources.filter(r=>r.kind==='campaign')){
       const idle=pos(month.media.idleByCampaign?.[r.id]);
       if(idle<=EPS)continue;
       const members=(r.skuIds||[]).filter(id=>byId[id]);
       const weights=members.map(id=>
         r.allocation==='usage'?(
           r.usageMode==='per-unit'?
            pos(r.loadPerUnit?.[id])*pos(byId[id].forecastUnitsPerMonth):
            pos(r.usage?.[id])):
         pos(byId[id].forecastUnitsPerMonth)*pos(
           skuLedger[id][k].revenue||byId[id].priceMax));
       const total=sum(weights);
       members.forEach((id,i)=>skuLedger[id][k].marketing+=
         idle*(total>EPS?weights[i]/total:1/Math.max(1,members.length)));
     }
   }
   for(let k=0;k<horizonMonths;k++){
     const rows=items.map(s=>skuLedger[s.id][k]);
     // Tax follows the portfolio's authoritative regime; VAT pass-through
     // and agent partner GMV never become this owner's recognized income.
     const online=items.filter(s=>s.source==='online-service');
     const onlineTax=sum(online.map(s=>
       skuLedger[s.id][k].revenue*pos(s.ownerTax?.pct)/100));
     for(const s of online)skuLedger[s.id][k].taxAccrued+=
       skuLedger[s.id][k].revenue*pos(s.ownerTax?.pct)/100;
     const others=items.filter(s=>s.source!=='online-service');
     if(state.tax?.type!=='profit'){
       others.forEach(s=>skuLedger[s.id][k].taxAccrued+=
         skuLedger[s.id][k].revenue*taxPct);
     }else{
       // Profit tax on multiple regular activities is assessed at enterprise
       // level, then explained by positive pretax contribution. Negative
       // lines remain negative. This is an attribution, not double taxation.
       const due=profitMonths[k].taxAccrued-onlineTax;
       const positive=others.map(s=>{
         const v=skuLedger[s.id][k];
         return Math.max(0,v.revenue-v.cogs-v.variableCommission-
           v.marketing-v.operatingShared-v.serviceFixed-v.amort-v.interest);
       });
       const denominator=sum(positive);
       if(due>EPS&&!denominator)
         throw Error('Налог на прибыль нельзя распределить без положительной налоговой базы.');
       others.forEach((s,i)=>skuLedger[s.id][k].taxAccrued+=
         denominator?due*positive[i]/denominator:0);
     }
     for(const s of items){
       const v=skuLedger[s.id][k];
       v.ebitda=v.revenue-v.cogs-v.variableCommission-v.marketing-
         v.operatingShared-v.serviceFixed;
       v.pretax=v.ebitda-v.amort-v.interest;
       v.netProfit=v.pretax-v.taxAccrued;
       v.netMargin=v.revenue>EPS?v.netProfit/v.revenue*100:null;
     }
     for(const key of ['revenue','cogs','variableCommission','marketing',
       'operatingShared','serviceFixed','ebitda','amort','interest','taxAccrued','netProfit']){
       const difference=Math.abs(sum(rows.map(row=>row[key]))-
         (key==='ebitda'?profitMonths[k].ebitda:
          key==='netProfit'?profitMonths[k].netProfit:
          key==='taxAccrued'?profitMonths[k].taxAccrued:
          key==='revenue'?profitMonths[k].revenue:
          profitMonths[k][key]));
       if(difference>.00001)throw Error('Помесячная сверка SKU с портфелем не прошла: '+key+
         ', месяц '+(k+1)+', разница '+difference+'.');
     }
   }
   const ps=key=>sum(profitMonths.map(m=>m[key]));
   const periodRevenue=ps('revenue'),periodProfit=ps('netProfit');
   const invoices=sum(items.map(s=>sum(timeline[s.id].map(t=>t.netRevenue))));
   const revenueConserved=Math.abs(invoices-periodRevenue)<.000001;
   const marketingConserved=Math.abs(ps('marketing')-
     sum(months.slice(0,horizonMonths).map(m=>m.ad)))<.000001;
   if(!revenueConserved||!marketingConserved)
     throw Error('Нарушена сверка периодной прибыли с продажами или рекламными платежами.');
   const bySku=Object.fromEntries(items.map(s=>{
     const rows=skuLedger[s.id],tot=k=>sum(rows.map(m=>m[k]));
     const revenue=tot('revenue'),netProfit=tot('netProfit');
     const futureInterest=pos(s.creditPrincipal)>EPS?
       Math.max(0,Math.max(1,Math.ceil(pos(s.creditMonths)||1))-horizonMonths)*
         pos(s.creditServiceMonthly):0;
     return [s.id,{id:s.id,months:rows,revenue,netProfit,futureInterest,
       marketing:tot('marketing'),cogs:tot('cogs'),
       amort:tot('amort'),interest:tot('interest'),
       taxAccrued:tot('taxAccrued'),operatingShared:tot('operatingShared'),
       netMargin:revenue>EPS?netProfit/revenue*100:null}];
   }));
   const periodPnl={bySku,months:profitMonths,horizonMonths,
     revenue:periodRevenue,ebitda:ps('ebitda'),amort:ps('amort'),
     interest:ps('interest'),taxAccrued:ps('taxAccrued'),
     netProfit:periodProfit,
     netMargin:periodRevenue>EPS?periodProfit/periodRevenue*100:null,
     cashTaxPaid:sum(months.slice(0,horizonMonths).map(m=>m.tax)),
     taxTimingDifference:ps('taxAccrued')-
       sum(months.slice(0,horizonMonths).map(m=>m.tax)),
     postHorizonInterest:sum(months.slice(horizonMonths).map(m=>m.interest)),
     pricePolicy:'current-V2-monthly-price-not-reoptimized-for-H',
     onceAssetAmortizationUnverified:totalOnce>EPS,
     ready:true,
     invariants:{revenueConserved,marketingConserved,
       profitMonthsConserved:Math.abs(ps('netProfit')-periodProfit)<EPS}};
   const borrowedCapital=sum(items.map(s=>pos(s.creditPrincipal)));
   return {periodPnl,months,reserve,ownerCapital,borrowedCapital,
     startupCapital:ownerCapital+borrowedCapital,finalCash:balance,
     freeCash:balance-reserve,peakOperatingDeficit:-peak,
     scenarioHorizonMonths:horizonMonths,vatCashBasis:'net-of-vat-operating',
     temporal:true,timeline};
 }
 return Object.freeze({calculate});
});
