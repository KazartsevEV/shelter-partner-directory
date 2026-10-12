/* Payment metadata only. No exchange rates or financial formulas live here. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.Nomad360Payments=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function validDate(date){
  return typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&
   Number.isFinite(Date.parse(date+'T00:00:00Z'))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date&&date<=new Date().toISOString().slice(0,10);
 }
 function validConversion(c,amount,base,quote){
  return c&&c.base===base&&c.quote===quote&&c.appliedAmount===amount&&
   Number.isFinite(c.rate)&&c.rate>0&&Number.isFinite(amount*c.rate)&&validDate(c.date)&&
   ['manual','frankfurter'].includes(c.source)&&typeof c.sourceLabel==='string'&&c.sourceLabel.trim().length>0&&c.sourceLabel.length<=200;
 }
 function record(amount,paymentCurrency,businessCurrency,valid,previous){
  const empty=amount===''||amount===null||amount===undefined;
  const value=empty?null:Number(amount);
  const numeric=value!==null&&Number.isFinite(value)&&value>=0;
  const currencyValid=valid(paymentCurrency)&&valid(businessCurrency);
  // Zero has the same value in every currency; no rate is inferred.
  const normalized=numeric&&currencyValid&&(paymentCurrency===businessCurrency||value===0);
  const conversion=previous?.conversion;
  if(numeric&&currencyValid&&!normalized&&validConversion(conversion,value,paymentCurrency,businessCurrency))
   return {businessCurrency,paymentCurrency,paymentAmount:value,convertedAmount:value*conversion.rate,status:'normalized',conversion:{...conversion}};
  return {businessCurrency,paymentCurrency,paymentAmount:numeric?value:null,
   convertedAmount:normalized?value:null,
   status:!currencyValid||(!empty&&!numeric)?'invalid':empty?'empty':normalized?'normalized':'conversion-required'};
 }
 function apply(amount,paymentCurrency,businessCurrency,valid,quote){
  if((quote.base!==undefined&&quote.base!==paymentCurrency)||(quote.quote!==undefined&&quote.quote!==businessCurrency))throw Error('Currency pair mismatch');
  const conversion={base:paymentCurrency,quote:businessCurrency,appliedAmount:Number(amount),
   rate:Number(quote.rate),date:quote.date,source:quote.source,sourceLabel:String(quote.sourceLabel||'').trim()};
  const p=record(amount,paymentCurrency,businessCurrency,valid,{conversion});
  if(p.status!=='normalized'||!p.conversion)throw Error('Invalid conversion');
  return p;
 }
 function pending(payments){
  return Object.values(payments||{}).some(p=>p.active!==false&&(p.status==='invalid'||p.status==='conversion-required'));
 }
 function fields(sku){
  // Own-production unitCost is an aggregate, not a supplier's invoice.
  return sku.source==='dropship'?['unitCost','fulfillmentPerOrder']:
   sku.source==='resale'?['unitCost','initialCashOut']:sku.source==='own'?['initialCashOut']:[];
 }
 function normalizePortfolio(model,valid){
  const copy=JSON.parse(JSON.stringify(model)),business=model.currency||'USD';
  let blocked=false;
  copy.skus.forEach((sku,index)=>{
   const original=model.skus[index];
   fields(sku).forEach(key=>{
    const code=original.payments?.[key]?.paymentCurrency??business;
    const p=record(original[key],code,business,valid,original.payments?.[key]);
    if(pending({p}))blocked=true;
    else if(p.convertedAmount!==null)sku[key]=p.convertedAmount;
   });
  });
  // A pending payment never enters the engine as 1:1 or as a zero expense.
  return {model:blocked?null:copy,pending:blocked};
 }
 return Object.freeze({record,apply,validDate,pending,fields,normalizePortfolio});
});
