/* Payment metadata only. No exchange rates or financial formulas live here. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.Nomad360Payments=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function record(amount,paymentCurrency,businessCurrency,valid){
  const empty=amount===''||amount===null||amount===undefined;
  const value=empty?null:Number(amount);
  const numeric=value!==null&&Number.isFinite(value)&&value>=0;
  const currencyValid=valid(paymentCurrency)&&valid(businessCurrency);
  // Zero has the same value in every currency; no rate is inferred.
  const normalized=numeric&&currencyValid&&(paymentCurrency===businessCurrency||value===0);
  return {businessCurrency,paymentCurrency,paymentAmount:numeric?value:null,
   convertedAmount:normalized?value:null,
   status:!currencyValid||(!empty&&!numeric)?'invalid':empty?'empty':normalized?'normalized':'conversion-required'};
 }
 function pending(payments){
  return Object.values(payments||{}).some(p=>p.status==='invalid'||p.status==='conversion-required');
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
    const p=record(original[key],code,business,valid);
    if(pending({p}))blocked=true;
    else if(p.convertedAmount!==null)sku[key]=p.convertedAmount;
   });
  });
  // A pending payment never enters the engine as 1:1 or as a zero expense.
  return {model:blocked?null:copy,pending:blocked};
 }
 return Object.freeze({record,pending,fields,normalizePortfolio});
});
