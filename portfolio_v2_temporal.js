/* #31E: independent month-scoped demand feasibility, not an invented cash ledger.
   Source forecasts remain V1 first-month demand until the owner explicitly
   approves recurring demand over a chosen number of months. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.LinkedPortfolioTemporal=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const EPS=1e-7,n=v=>Number.isFinite(Number(v))?Number(v):0;
 const pos=v=>Math.max(0,n(v));
 const sum=a=>a.reduce((x,y)=>x+y,0);
 const stockSource=s=>['own','resale'].includes(s?.source);
 function plan(state,firstMonthBase,projectOffers){
   const monthsRequested=state?.forecastMonths===undefined?1:Number(state.forecastMonths);
   const errors=[],fieldErrors=[],report=(path,message)=>{
     errors.push(message);fieldErrors.push({path,message});
   };
   if(!Number.isInteger(monthsRequested)||monthsRequested<1||monthsRequested>120)
     report('forecastMonths','Горизонт должен составлять от 1 до 120 целых месяцев.');
   if(monthsRequested>1&&state?.recurringDemandApproved!==true)
     report('recurringDemandApproved','Подтвердите предположение о повторении прогноза V1 каждый месяц.');
   if(typeof projectOffers!=='function')
     report('temporal','Не загружен расчёт связей товаров.');
   if(monthsRequested>1&&(state.resources||[]).some(r=>r.kind==='campaign'))
     report('resources','Для многомесячного прогноза общего рекламного бюджета требуется подтверждённое помесячное перераспределение. Пока этот договор не определён, расчёт заблокирован.');
   if(monthsRequested>1&&state.tax?.type==='profit'&&
      (state.skus||[]).some(s=>s.source==='online-service')&&
      (state.resources||[]).some(r=>r.cadence==='monthly'))
     report('resources','Совместное распределение прибыли онлайн-услуг и общих месячных ресурсов не подтверждено для налога на прибыль. Расчёт заблокирован, пока не определено разграничение расходов.');
   const skus=Array.isArray(state?.skus)?state.skus:[];
   const byId=Object.fromEntries(skus.map(s=>[String(s.id),s]));
   const ids=new Set(Object.keys(byId));
   if(!skus.length)report('skus','Пустой портфель.');
   for(const s of skus){
     if(s.source==='online-service'){
       const months=Number(s.onlineProvenance?.periodMonths??s.sourcePeriodMonths);
       if(!Number.isInteger(months)||months<monthsRequested)
         report('skus.'+s.id,'У онлайн-услуги «'+s.name+'» период V1 не подтверждает '+monthsRequested+' месяцев. Нужен расчёт V1 на этот период.');
     }
   }
   if(errors.length)return {ready:false,errors,fieldErrors,months:[],forecastMonths:monthsRequested};
   const base=Object.fromEntries(skus.map(s=>[String(s.id),pos(firstMonthBase?.[s.id]??s.forecastUnitsPerMonth)]));
   const stock=Object.fromEntries(skus.filter(stockSource).map(s=>[String(s.id),pos(s.inventoryQty)]));
   const months=[];
   for(let month=0;month<monthsRequested;month++){
     const from=month*30,to=from+30,independent={},availability={};
     for(const s of skus){
       const id=String(s.id),start=stockSource(s)?pos(s.supplyDays)+pos(s.productionDays):0;
       const fraction=stockSource(s)?Math.max(0,Math.min(to,to-Math.max(from,start)))/30:1;
       availability[id]=fraction;
       independent[id]=stockSource(s)?Math.min(pos(stock[id]),base[id]*fraction):base[id];
     }
     const basket=projectOffers(state.offers||[],independent,ids);
     basket.fieldErrors.forEach(e=>report(e.path,'Месяц '+(month+1)+': '+e.message));
     const orders={...basket.orders};
     for(const s of skus){
       const id=String(s.id),quantity=pos(orders[id]);
       if(stockSource(s)){
         if(quantity>pos(stock[id])+EPS)
           report('skus.'+id,'Месяц '+(month+1)+': спрос на «'+s.name+
             '» ('+quantity.toFixed(2)+') превышает оставшийся запас ('+
             pos(stock[id]).toFixed(2)+'). Продажа связки не подтверждена.');
         stock[id]=Math.max(0,pos(stock[id])-quantity);
       }
       if(s.source==='offline-service'&&quantity>pos(s.serviceCapacity)+EPS)
         report('skus.'+id,'Месяц '+(month+1)+': услуги «'+s.name+
           '» требуют '+quantity.toFixed(2)+' посещений при мощности '+pos(s.serviceCapacity)+'.');
     }
     for(let j=0;j<(state.resources||[]).length;j++){
       const r=state.resources[j];
       if(r.usageMode!=='per-unit'||!(pos(r.capacity)>0))continue;
       const load=sum((r.skuIds||[]).map(id=>pos(r.loadPerUnit?.[id])*pos(orders[id])));
       if(load>pos(r.capacity)+EPS)
         report('resources.'+j+'.capacity','Месяц '+(month+1)+': ресурс «'+r.label+
           '» загружен на '+load.toFixed(2)+' при мощности '+pos(r.capacity)+'.');
     }
     months.push({month:month+1,baseOrders:independent,orders,
       remainingStock:{...stock},availability,discountedUnits:basket.discountedUnits,
       events:basket.events,units:sum(Object.values(orders))});
   }
   return {ready:errors.length===0,errors,fieldErrors,months,forecastMonths:monthsRequested,
     initialStock:Object.fromEntries(skus.filter(stockSource).map(s=>[s.id,pos(s.inventoryQty)])),
     finalStock:{...stock}};
 }
 return Object.freeze({plan});
});
