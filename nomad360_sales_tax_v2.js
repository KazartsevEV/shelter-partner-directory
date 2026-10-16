/* SALES-TAX-07B stage 4 — first isolated V2 calculation seam.
 * No legacy VAT engine modifications. Pure JSON input preparation + read-only
 * V2 output projection. UI, storage, V1-to-V2 and reporting follow separately.
 */
(function(root,factory){
  const tax=typeof module!=='undefined'&&module.exports
    ?require('./nomad360_sales_tax.js'):root.Nomad360SalesTax;
  const api=factory(tax);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.Nomad360SalesTaxV2=api;
})(typeof globalThis==='object'?globalThis:this,function(tax){
  'use strict';
  if(!tax||typeof tax.quote!=='function')throw Error('7B-1 Sales Tax module is required');
  const copy=v=>JSON.parse(JSON.stringify(v));
  const nonNegative=(v,name)=>{
    if(typeof v!=='number'||!Number.isFinite(v)||v<0)
      throw new RangeError('Invalid '+name);
    return v;
  };
  function options(config){
    const mode=tax.mode(config?.mode);
    if(mode==='vat')return {mode,ratePct:null};
    // The common 7B-1 contract is the single strict validator.
    const quote=tax.quote({mode,enteredPrice:0,ratePct:config?.ratePct});
    return {mode,ratePct:quote.ratePct};
  }
  let transfer=null;
  function withTransfer(config,action){
    if(typeof action!=='function')throw new TypeError('Transfer action required');
    const previous=transfer;
    transfer=options(config);
    try{return action();}finally{transfer=previous;}
  }
  function transferred(){return transfer&&{...transfer};}
  function inherit(state,config=transfer){
    if(!config||config.mode==='vat')return state;
    const next=prepareLinked(state,config);
    if(next.tax?.taxRegime!==config.mode)throw Error('V2 transfer lost tax regime');
    return next;
  }
  function compatible(previous,next){
    const regime=x=>x?.tax?.taxRegime||'vat';
    if(previous&&regime(previous)!==regime(next))
      throw Error('Налог с продаж в портфеле различается. Создайте отдельный портфель.');
    if(previous&&regime(next)==='sales_tax'&&
       Number(previous.tax?.salesTaxPct)!==Number(next.tax?.salesTaxPct))
      throw Error('В портфеле должна использоваться одна ставка Sales Tax.');
  }
  function prepareStandalone(state,config){
    const o=options(config);
    if(o.mode==='vat')return state; // Existing VAT engine is source of truth.
    if(!state||typeof state!=='object')throw new TypeError('V2 state required');
    const draft=copy(state);
    draft.tax={...(draft.tax||{}),vatPct:0,taxRegime:o.mode,
      ...(o.mode==='sales_tax'?{salesTaxPct:o.ratePct}:{})};
    return draft;
  }
  function prepareLinked(state,config){
    const o=options(config);
    if(o.mode==='vat')return state;
    if(!state||!Array.isArray(state.skus))throw new TypeError('Linked V2 SKUs required');
    const draft=copy(state);
    draft.tax={...(draft.tax||{}),vatPct:0,taxRegime:o.mode,
      ...(o.mode==='sales_tax'?{salesTaxPct:o.ratePct}:{})};
    // Sales Tax is not recoverable input VAT and must never be divided out.
    draft.skus.forEach(s=>{s.vatPct=0;s.taxRegime=o.mode;
      if(o.mode==='sales_tax')s.salesTaxPct=o.ratePct;});
    return draft;
  }
  function project(result,config){
    const o=options(config);
    if(o.mode==='vat')return result;
    if(!result||result.ready!==true||!Array.isArray(result.items))
      throw new TypeError('Ready V2 result required');
    const period=result.cashflow?.periodPnl;
    const bySku=period?.bySku||{};
    const standalone=Array.isArray(result.months)&&!result.cashflow;
    const entirePeriod=period?.ready===true;
    const rows=result.items.map(item=>{
      const agency=item.fullServiceRole==='agent'||item.onlineRole==='agent';
      const counterpart=agency?bySku[item.id]?.partner:null;
      // The principal's GMV is not agent revenue. Without a proven partner
      // counter-ledger, do not invent buyer Sales Tax from commission.
      if(agency&&(!counterpart||!Number.isFinite(counterpart.revenue)))
        throw new RangeError('Principal customer sales ledger required for agent Sales Tax');
      const base=nonNegative(agency?counterpart.revenue:
        entirePeriod?bySku[item.id]?.revenue:item.revenue,'V2 revenue');
      const q=tax.quote({mode:o.mode,enteredPrice:base,ratePct:o.ratePct});
      return {id:item.id,base:agency?'principal':'owner',net:q.net,
        salesTax:q.tax,customerTotal:q.customerTotal};
    });
    const total=key=>rows.reduce((n,row)=>n+row[key],0);
    const items=result.items.map((item,i)=>({...item,customerTax:rows[i]}));
    const byMonth=[];
    if(standalone){
      const grossByMonth=result.months.map(m=>nonNegative(m.receipt,'V2 cash receipts'));
      // Standalone V2 receipts may be delayed and are NOT a tax invoice series.
      // Do not fabricate month-by-month tax merely from cash timing.
      void grossByMonth;
    }
    if(entirePeriod&&Array.isArray(period.months)){
      for(let k=0;k<period.months.length;k++){
        let base=0;
        for(const item of result.items){
          const agent=item.fullServiceRole==='agent'||item.onlineRole==='agent';
          const ledger=bySku[item.id]?.[agent?'partner':'months'];
          const month=agent?ledger?.months?.[k]:ledger?.[k];
          if(!month)throw new RangeError('Missing V2 month SKU tax basis');
          base+=nonNegative(month.revenue,'month revenue');
        }
        const q=tax.quote({mode:o.mode,enteredPrice:base,ratePct:o.ratePct});
        byMonth.push({month:k+1,net:q.net,salesTax:q.tax,customerTotal:q.customerTotal});
      }
    }
    // Intentionally DO NOT mutate result.totals, cashflow, period P&L, or
    // the price optimizer. These remain strictly net of transit Sales Tax.
    return {...result,items,salesTaxSummary:{mode:o.mode,ratePct:o.ratePct,
      lines:rows,net:total('net'),salesTax:total('salesTax'),
      customerTotal:total('customerTotal'),byMonth}};
  }
  return Object.freeze({options,prepareStandalone,prepareLinked,project,withTransfer,transferred,inherit,compatible});
});
