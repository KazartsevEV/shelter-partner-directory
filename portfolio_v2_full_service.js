/* ТЗ-02. V2 full-service daily money model. Pure business engine.
   This is an opt-in route: V1 simplified service engine is not modified.
   Common tax, VAT and credit conventions match V2 linked portfolio:
   receipts are VAT-exclusive; input VAT is already included in cash costs;
   bullet credit: monthly interest and principal at maturity. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.Nomad360FullServiceV2=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const EPS=1e-7;
 const numeric=(x,key,minimum=0)=>{const v=Number(x);if(!Number.isFinite(v)||v<minimum)throw Error('Некорректное значение: '+key);return v};
 function build(input){
   const data=input||{};
   const months=numeric(data.months,'Горизонт',1);
   if(!Number.isInteger(months)||months>120)throw Error('Горизонт должен быть от 1 до 120 месяцев.');
   const forecast=data.monthlyForecast;
   const counts=Array.isArray(forecast)?
     Array.from({length:months},(_,m)=>forecast[m]??forecast[forecast.length-1]):
     Array.from({length:months},()=>forecast);
   if(Array.isArray(forecast)&&!forecast.length)
     throw Error('Нужен хотя бы один рассчитанный месяц спроса V1.');
   const capacity=numeric(data.capacity,'Мощность',1);
   const quantity=counts.slice(0,months).map((q,i)=>{
     const value=numeric(q,'Прогноз месяца '+(i+1));
     if(value>capacity+EPS)throw Error('Прогноз месяца '+(i+1)+' превышает мощность '+capacity+' услуг.');
     return value;
   });
   const priceGross=numeric(data.priceGross,'Цена с НДС');
   const vatPct=numeric(data.vatPct??0,'Ставка НДС');
   const discountPct=numeric(data.discountPct??0,'Скидка');
   if(vatPct>1000||discountPct>=100)throw Error('Недопустимый НДС или скидка.');
   const taxType=data.taxType;
   if(!['turnover','profit'].includes(taxType))throw Error('Выберите налог с оборота или прибыли.');
   const taxPct=numeric(data.taxPct??0,'Ставка налога');
   if(taxPct>100)throw Error('Ставка налога должна быть не больше 100%.');
   const unitCashCost=numeric(data.unitCashCost??0,'Расходники и исполнение');
   const commissionPct=numeric(data.commissionPct??0,'Комиссии');
   if(commissionPct>100)throw Error('Комиссия не может быть больше 100%.');
   const fixedCashMonthly=numeric(data.fixedCashMonthly??0,'Ежемесячные расходы');
   const capex=numeric(data.equipmentPurchase??0,'Покупка оборудования');
   const amort=numeric(data.equipmentAmortMonthly??0,'Амортизация');
   const reservePct=numeric(data.reservePct??0,'Резерв');
   const funding=data.funding||'own';
   if(!['own','credit'].includes(funding))throw Error('Выберите свои деньги или кредит.');
   const annualRatePct=funding==='credit'?numeric(data.annualRatePct,'Годовая ставка кредита'):0;
   const creditMonths=funding==='credit'?numeric(data.creditMonths,'Срок кредита',1):0;
   if(funding==='credit'&&(!Number.isInteger(creditMonths)||creditMonths>1200))
     throw Error('Срок кредита должен задаваться целым числом месяцев.');
   const netPrice=priceGross/(1+vatPct/100),netUnitReceipt=netPrice*(1-discountPct/100);
   const commissionRate=commissionPct/100,taxRate=taxPct/100;
   // Liquidity reserve includes commissions as part of first-month variable costs.
   const firstMonthRevenue=quantity[0]*netUnitReceipt;
   const firstMonthVariable=quantity[0]*unitCashCost+firstMonthRevenue*commissionRate;
   const reserve=(firstMonthVariable+fixedCashMonthly)*reservePct/100;
   // First pass excludes interest and taxes, but includes all real day-zero cash payments.
   const calc=(loanPrincipal=0,withCharges=false)=>{
     const monthsOut=[],daily=[];
     let rolling=0,min=0,peakDay=0;
     const monthlyInterest=funding==='credit'&&withCharges?
       loanPrincipal*(annualRatePct/100)/12:0;
     for(let m=0;m<months;m++){
       const qty=quantity[m],revenue=qty*netUnitReceipt;
       const direct=qty*unitCashCost,commission=revenue*commissionRate;
       const variable=direct+commission;
       const interest=withCharges&&funding==='credit'&&m<creditMonths?monthlyInterest:0;
       const earningsBeforeTax=revenue-variable-fixedCashMonthly-amort-interest;
       const tax=withCharges?(taxType==='turnover'?revenue*taxRate:
         Math.max(0,earningsBeforeTax)*taxRate):0;
       const operatingCash=revenue-variable-fixedCashMonthly-interest-tax;
       const assetCash=m===0?capex:0;
       const principalDue=withCharges&&funding==='credit'&&m+1===creditMonths?loanPrincipal:0;
       monthsOut.push({month:m+1,quantity:qty,grossUnitPrice:priceGross,netUnitPrice:netPrice,
         revenue,variable,consumables:direct,commission,fixed:fixedCashMonthly,
         depreciation:amort,interest,ebt:earningsBeforeTax,tax,
         operatingCash,assetCash,principalDue,
         profit:earningsBeforeTax-tax,
         outstandingPrincipal:funding==='credit'&&withCharges&&m+1<creditMonths?loanPrincipal:0});
       // Same-day order: first pay fixed expenses and first-month CAPEX, then serve clients.
       const first=fixedCashMonthly+assetCash;
       rolling-=first;
       if(rolling<min){min=rolling;peakDay=m*30;}
       const dayRevenue=revenue/30,dayVariable=variable/30;
       for(let d=0;d<30;d++){
         const flow=dayRevenue-dayVariable-
           (d===29?tax+interest:0);
         rolling+=flow;
         const day=m*30+d;
         if(rolling<min){min=rolling;peakDay=day;}
         daily.push({day,month:m+1,revenue:dayRevenue,variable:dayVariable,
           fixed:d===0?fixedCashMonthly:0,asset:d===0?assetCash:0,
           interest:d===29?interest:0,tax:d===29?tax:0,
           // Financing entries excluded from operational peak and profitability.
           operatingCumulative:rolling});
       }
     }
     return {months:monthsOut,daily,peakDeficit:-min,peakDay};
   };
   const pre=calc();
   let principal=pre.peakDeficit+reserve;
   let iteration=0,period=null;
   // Solve liquidity + interest/tax dependency; principal repayment is an
   // independent financing liability, not recursive operational funding.
   for(;iteration<10;iteration++){
     period=calc(principal,true);
     const needed=Math.max(pre.peakDeficit,period.peakDeficit)+reserve;
     if(needed<=principal+EPS)break;
     principal=needed;
   }
   if(iteration===10)throw Error('Не удалось согласовать капитал и проценты кредита за 10 проходов.');
   period=calc(principal,true);
   let cash=principal,operatingCum=0,firstPositive=null,payback=null;
   for(const m of period.months){
     operatingCum+=m.operatingCash;
     m.operatingCumulative=operatingCum;
     // Starting funding is a positive day-zero transfer, not income.
     m.financeIn=m.month===1?principal:0;
     m.financeOut=m.principalDue;
     m.netCashFlow=m.operatingCash-m.assetCash-m.principalDue+m.financeIn;
     cash+=m.operatingCash-m.assetCash-m.principalDue;
     m.cashOnHand=cash;m.freeCash=cash-reserve;
     if(firstPositive===null&&m.operatingCash>0)firstPositive=m.month;
     if(payback===null&&operatingCum>=principal-EPS)payback=m.month;
   }
   // Reconcile a real daily cash ledger with monthly funding, debt maturity and
   // working liquidity. The operational peak is intentionally separate from
   // owner/loan funding, but the customer's daily balances must include both.
   let dailyCash=0;
   for(const day of period.daily){
     const financingIn=day.day===0?principal:0;
     const principalDue=funding==='credit'&&day.day===creditMonths*30-1?principal:0;
     const netCashFlow=financingIn+day.revenue-day.variable-day.fixed-
       day.asset-day.interest-day.tax-principalDue;
     dailyCash+=netCashFlow;
     day.financingIn=financingIn;
     day.principalDue=principalDue;
     day.netCashFlow=netCashFlow;
     day.cashOnHand=dailyCash;
     day.freeCash=dailyCash-reserve;
   }
   const total=key=>period.months.reduce((n,m)=>n+m[key],0);
   return {ready:true,kind:'full-service-v2',months:period.months,
     horizonMonths:months,netUnitPrice:netPrice,priceGross,vatPct,taxType,
     capital:principal,preTaxPeakDeficit:pre.peakDeficit,
     peakDeficit:period.peakDeficit,peakDay:period.peakDay,
     peakMonth:Math.floor(period.peakDay/30)+1,financing:funding,
     reserve,firstPositiveMonth:firstPositive,paybackMonth:payback,
     profit:total('profit'),tax:total('tax'),revenue:total('revenue'),
     totalInterest:total('interest'),totalDepreciation:total('depreciation'),
     creditRepaid:total('principalDue'),
     outstandingPrincipal:funding==='credit'&&creditMonths>months?principal:0,
     cashOnHand:cash,freeCash:cash-reserve,
     // Internal daily ledger for invariant testing and calendar interoperability.
     daily:period.daily,iterations:iteration+1};
 }
 return Object.freeze({build});
});
