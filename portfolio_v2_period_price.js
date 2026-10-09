/* F2B period price solver. Never changes V1, customer price ceilings, tax
   contracts, source provenances or actual inventory quantities.
   Reprices by executing the full month-scoped demand + expense + tax engine,
   rather than approximating whole-period EBITDA with month-one projections. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.LinkedPortfolioPeriodPrice=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const EPS=1e-6,num=v=>Number.isFinite(Number(v))?Number(v):0;
 const pos=v=>Math.max(0,num(v));
 const centUp=x=>Math.ceil(x*100-1e-7)/100;
 function optimize(state,calculate){
   const skus=state.skus||[],prices=Object.fromEntries(skus.map(s=>[
     s.id,centUp(s.fixedPriceFromV1?pos(s.priceMin):pos(s.priceMin))]));
   const floor=Object.fromEntries(skus.map(s=>[s.id,pos(s.priceMin)]));
   const ceiling=Object.fromEntries(skus.map(s=>[s.id,pos(s.priceMax)]));
   const errors=[];
   const snapshot=()=>{
     const r=calculate({...prices});
     if(!r.ready||!r.cashflow?.periodPnl?.ready||
        !r.cashflow.periodPnl.bySku){
       errors.push(...(r.errors||['Нет сверенной периодной ведомости SKU.']));
       return null;
     }
     return r;
   };
   let current=snapshot(),iterations=0,converged=false;
   if(!current)return {ready:false,errors:[...new Set(errors)],result:null};
   for(let iteration=0;iteration<45;iteration++){
     iterations=iteration+1;
     let moved=false;
     for(const s of skus.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)))){
       if(s.fixedPriceFromV1)continue;
       const p=current.cashflow.periodPnl.bySku[s.id];
       const target=pos(s.targetMarginPct)/100;
       const margin=p.revenue>EPS?(p.netProfit-pos(p.futureInterest))/p.revenue*100:null;
       if(margin!==null&&margin+0.000001>=target*100)continue;
       if(prices[s.id]>=ceiling[s.id]-EPS)continue;
       const discountedQty=current.temporal.months.reduce((acc,m)=>
         acc+pos(m.orders[s.id])-pos(m.discountedUnits[s.id]),0);
       const slope=discountedQty*(1-pos(s.discountSelected)/100)/
         (1+pos(s.vatPct)/100);
       if(slope<=EPS){prices[s.id]=ceiling[s.id];moved=true;continue;}
       const variable=pos(s.variableSalesPct)/100;
       const taxType=s.ownerTax?.type||state.tax?.type||'turnover';
       const tax=pos(s.ownerTax?.pct??state.tax?.pct)/100;
       const retained=taxType==='profit'?(1-variable)*(1-tax):
         1-variable-tax;
       const denominator=slope*(retained-target);
       const shortfall=target*p.revenue-(p.netProfit-pos(p.futureInterest));
       if(!(denominator>EPS)){
         prices[s.id]=ceiling[s.id];moved=true;continue;
       }
       const delta=Math.max(.01,shortfall/denominator);
       const next=Math.min(ceiling[s.id],
         Math.max(floor[s.id],centUp(prices[s.id]+delta)));
       if(next>prices[s.id]+EPS){prices[s.id]=next;moved=true;}
     }
     if(!moved){converged=true;break}
     current=snapshot();if(!current)return {ready:false,errors:[...new Set(errors)],result:null};
   }
   if(!converged){
     errors.push('Периодный подбор цены не сошёлся за 45 итераций.');
     return {ready:false,errors,result:current};
   }
   const H=current.cashflow.periodPnl;
   const provisional=H.accountingCompleteness==='PROVISIONAL';
   let actualInfeasible=false;
   const diagnostics=[];
   for(const s of skus){
     const item=current.items.find(x=>x.id===s.id),p=H.bySku[s.id];
     const margin=p.netMargin,pricingMargin=p.revenue>EPS?
       (p.netProfit-pos(p.futureInterest))/p.revenue*100:null;
     const minimum=pos(s.minimumMarginPct),target=pos(s.targetMarginPct);
     const targetOk=pricingMargin!==null&&pricingMargin+0.000001>=target;
     const minOk=pricingMargin!==null&&pricingMargin+0.000001>=minimum;
     const selected=prices[s.id],pct=pos(s.discountSelected)/100,
       vat=1+pos(s.vatPct)/100;
     const discountedQty=current.temporal.months.reduce((v,m)=>
       v+pos(m.orders[s.id])-pos(m.discountedUnits[s.id]),0);
     const slope=discountedQty*(1-pct)/vat;
     const varPct=pos(s.variableSalesPct)/100;
     const taxType=s.ownerTax?.type||state.tax?.type||'turnover';
     const tax=pos(s.ownerTax?.pct??state.tax?.pct)/100;
     function required(goalPct){
       const goal=goalPct/100;
       if(!(slope>EPS))return Infinity;
       const retain=taxType==='profit'?(1-varPct)*(1-tax):1-varPct-tax;
       const denominator=slope*(retain-goal);
       if(denominator<=EPS)return Infinity;
       return centUp(Math.max(floor[s.id],selected+
         Math.max(0,goal*p.revenue-(p.netProfit-pos(p.futureInterest)))/denominator));
     }
     const requiredTarget=targetOk?selected:required(target),
       requiredFloor=minOk?selected:required(minimum);
     const status=provisional?'PROVISIONAL':
       s.fixedPriceFromV1?(margin===null||p.netProfit<0?'LOSS':'FIXED_V1'):
       !minOk?'INFEASIBLE':targetOk?'TARGET_MET':'MINIMUM_ONLY';
     const diagnostic={id:s.id,status,price:selected,margin,pricingMargin,
       accountingCompleteness:H.accountingCompleteness,
       futureInterest:pos(p.futureInterest),minimumMet:minOk,targetMet:targetOk,
       priceMin:floor[s.id],priceMax:ceiling[s.id],
       requiredTargetPrice:requiredTarget,requiredFloorPrice:requiredFloor,
       revenue:p.revenue,netProfit:p.netProfit};
     diagnostics.push(diagnostic);
     item.requiredTargetPrice=requiredTarget;
     item.requiredFloorPrice=requiredFloor;
     item.minimumMarginFeasible=minOk;
     item.targetMarginMet=targetOk&&!provisional;
     item.actualAfterTaxMargin=margin;
     item.status=status;
     item.periodMargin=margin;
     item.periodPricingMargin=pricingMargin;
     if(!minOk&&!s.fixedPriceFromV1){
       actualInfeasible=true;
       errors.push('За '+H.horizonMonths+' мес. «'+s.name+
         '»: минимальная маржа '+minimum+'% недостижима в диапазоне V1 '+
         floor[s.id]+'–'+ceiling[s.id]+'. При цене '+selected+
         ' маржа с учётом оставшихся процентов '+(pricingMargin===null?'не определена':pricingMargin.toFixed(2)+'%')+
         '; расчётная необходимая цена '+
         (Number.isFinite(requiredFloor)?requiredFloor:'выше достижимого предела')+'.');
     }
   }
   current.totals.targetMet=!provisional&&diagnostics.every(d=>d.targetMet);
   current.totals.minimumMet=!provisional&&diagnostics.every(d=>d.minimumMet);
   current.cashflow.periodPnl.pricePolicy='full-period-actual-sku-margin-pricing';
   current.cashflow.periodPnl.priceIncludesFinancingTail=true;
   current.cashflow.periodPnl.priceIterations=iterations;
   current.cashflow.periodPnl.priceDiagnostics=diagnostics;
   current.cashflow.periodPnl.targetMet=!provisional&&diagnostics.every(d=>d.targetMet);
   current.cashflow.periodPnl.minimumMet=!provisional&&diagnostics.every(d=>d.minimumMet);
   if(provisional)current.warnings=[
     ...(current.warnings||[]),
     'Есть разовые расходы или активы без подтверждённого срока списания. Прибыль и цена ориентировочные; достижение целевой маржи не подтверждено.'];
   current.invariants.periodSkuProfitConserved=
     Math.abs(diagnostics.reduce((v,d)=>v+d.netProfit,0)-H.netProfit)<.00001;
   if(!current.invariants.periodSkuProfitConserved)errors.push('Не сошлась чистая прибыль SKU с портфелем.');
   current.ready=current.ready&&!actualInfeasible&&
     current.invariants.periodSkuProfitConserved;
   if(errors.length){
     current.errors.push(...errors);
     for(const e of errors)current.fieldErrors.push({path:'skus',message:e});
   }
   return {ready:current.ready,errors,result:current};
 }
 return Object.freeze({optimize});
});
