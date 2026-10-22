/* Browser draft persistence. This module owns keys and JSON transport only;
   the saved payloads and their financial meaning remain unchanged. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.Nomad360DraftStore=Object.freeze(api.create());
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const keys=Object.freeze({
    v1:'marketingCalcProductResultV1',
    portfolio:'marketingCalcPortfolioV2',
    linked:'marketingCalcLinkedPortfolioV2',
    simpleSalesTax:'nomad360SalesTaxSimpleV1'
  });
  function validV1(value){
    if(!Array.isArray(value?.productPortfolio)||!value.productPortfolio.length||
       value.productPortfolio.length>100)return false;
    const seen=new Set();
    for(const item of value.productPortfolio){
      if(!item||!['own','resale','dropship','offline-service'].includes(item.source)||
         !Number.isSafeInteger(Number(item.id))||Number(item.id)<=0||
         seen.has(Number(item.id))||typeof item.name!=='string'||!item.name.trim()||
         !item.inputs||typeof item.inputs!=='object')return false;
      seen.add(Number(item.id));
    }
    return true;
  }
  const validPortfolio=value=>value?.version===2&&Array.isArray(value.skus)&&value.skus.length>0;
  const validLinked=value=>value?.version===3&&value.source==='v1-calculated'&&Array.isArray(value.skus);
  function create(storage){
    const backing=()=>storage===undefined?root.localStorage:storage;
    function read(key,valid){
      try{
        const value=JSON.parse(backing().getItem(key));
        return valid(value)?value:null;
      }catch(_){return null;}
    }
    function write(key,value){
      try{backing().setItem(key,JSON.stringify(value));return true;}
      catch(_){return false;}
    }
    function remove(key){
      try{backing().removeItem(key);return true;}
      catch(_){return false;}
    }
    return Object.freeze({keys,read,write,remove,
      readV1:()=>read(keys.v1,validV1),
      // Tax adapters historically read raw JSON before the UI validates a
      // portfolio. Preserve that distinction, including older partial records.
      readV1Raw:()=>read(keys.v1,()=>true),
      readSimpleSalesTax:()=>read(keys.simpleSalesTax,()=>true),
      writeSimpleSalesTax:value=>write(keys.simpleSalesTax,value),
      writeV1:value=>write(keys.v1,value),
      removeV1:()=>remove(keys.v1),
      readPortfolio:()=>read(keys.portfolio,validPortfolio),
      writePortfolio:value=>write(keys.portfolio,value),
      readLinked:()=>read(keys.linked,validLinked),
      writeLinked:value=>write(keys.linked,value)
    });
  }
  return {keys,validV1,validPortfolio,validLinked,create};
});
