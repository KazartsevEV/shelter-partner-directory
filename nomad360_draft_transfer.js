/* Local draft transport only. No equations, providers, UI state or network. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.Nomad360DraftTransfer=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const limit=8*1024*1024,journalKey='nomad360DraftTransferPendingV1';
 const keys=Object.freeze({
  marketingCalcProductResultV1:'V1',marketingCalcPortfolioV2:'V2',
  marketingCalcLinkedPortfolioV2:'V2 linked',nomad360SalesTaxSimpleV1:'Service tax',
  'nomad360-full-service-v2':'Legacy service',
  marketingCalcPortfolioV2USRetailDemo:'US Retail',marketingCalcPortfolioV2USRetailReset:'US Retail reset'
 });
 const fail=code=>{const error=new Error(code);error.code=code;throw error;};
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const exact=(x,names)=>object(x)&&Object.keys(x).sort().join('|')===[...names].sort().join('|');
 const bytes=s=>new TextEncoder().encode(s).length;
 function inspect(value,htmlValidator){
  let nodes=0;
  function walk(v,path){
   if(++nodes>100000||path.length>40)fail('size');
   if(typeof v==='number'&&!Number.isFinite(v))fail('invalid');
   if(typeof v==='string'&&/[<>]/.test(v)){
    const dynamic=path.length===6&&path[0]==='productPortfolio'&&path[2]==='uiState'&&
      path[3]==='dynamic'&&['materials','equipmentRental','equipmentPurchase'].includes(path[4])&&path[5]==='html';
    if(!dynamic||!htmlValidator||htmlValidator(v)!==true)fail('unsafe');
   }
   if(v&&typeof v==='object')for(const [key,item]of Object.entries(v)){
    if(['__proto__','prototype','constructor'].includes(key))fail('unsafe');
    walk(item,[...path,key]);
   }
  }
  walk(value,[]);
 }
 function validate(key,raw,htmlValidator){
  if(!Object.hasOwn(keys,key)||typeof raw!=='string'||bytes(raw)>limit)fail('invalid');
  let v;try{v=JSON.parse(raw)}catch(_){fail('invalid')}
  inspect(v,htmlValidator);
  const skus=version=>object(v)&&v.version===version&&Array.isArray(v.skus)&&v.skus.length<=1000&&
   v.skus.every(s=>object(s)&&typeof s.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(s.id));
  let valid=false;
  if(key==='marketingCalcProductResultV1'){
   const items=v?.productPortfolio,ids=new Set();
   valid=object(v)&&Array.isArray(items)&&items.length>0&&items.length<=100&&items.every(s=>{
    if(!object(s)||!['own','resale','dropship','offline-service'].includes(s.source)||
     !Number.isSafeInteger(Number(s.id))||Number(s.id)<=0||ids.has(Number(s.id))||
     typeof s.name!=='string'||!s.name.trim()||!object(s.inputs))return false;
    ids.add(Number(s.id));return true;
   });
   // Tax adapters intentionally persist a partial V1 record before a product exists.
   if(object(v)&&!Object.hasOwn(v,'productPortfolio')&&['vat','sales_tax','none'].includes(v.taxRegime)&&
     (v.salesTaxPct===undefined||['string','number'].includes(typeof v.salesTaxPct)))valid=true;
  }else if(['marketingCalcPortfolioV2','marketingCalcPortfolioV2USRetailDemo'].includes(key))valid=skus(2)&&v.skus.length>0&&Array.isArray(v.resources);
  else if(key==='marketingCalcLinkedPortfolioV2')valid=skus(3)&&v.source==='v1-calculated';
  else if(key==='nomad360SalesTaxSimpleV1')valid=object(v)&&['sales_tax','none'].includes(v.mode)&&['string','number'].includes(typeof v.rate);
  else if(key==='nomad360-full-service-v2')valid=object(v)&&(!Object.hasOwn(v,'schema')||[1,2].includes(v.schema))&&object(v.input)&&object(v.source);
  else valid=v===1;
  if(!valid)fail('invalid');
  for(const collection of ['skus','resources'])if(v&&Object.hasOwn(v,collection)){
   if(!Array.isArray(v[collection]))fail('invalid');
   if(new Set(v[collection].map(row=>row?.id)).size!==v[collection].length)fail('invalid');
  }
  // Identifiers also occur in attribute/handler contexts in the existing UI.
  for(const row of [...(v?.skus||[]),...(v?.resources||[])]){
   if(!object(row)||typeof row.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(row.id))fail('unsafe');
  }
  return v;
 }
 function parse(text,htmlValidator){
  if(typeof text!=='string'||bytes(text)>limit)fail('size');
  let file;try{file=JSON.parse(text)}catch(_){fail('invalid')}
  if(!exact(file,['format','version','createdAt','records'])||file.format!=='nomad360-drafts'||
    file.version!==1||typeof file.createdAt!=='string'||!Number.isFinite(Date.parse(file.createdAt))||
    !Array.isArray(file.records)||!file.records.length||file.records.length>Object.keys(keys).length)fail('invalid');
  const seen=new Set();
  for(const row of file.records){
   if(!exact(row,['key','value'])||seen.has(row.key))fail('invalid');
   validate(row.key,row.value,htmlValidator);seen.add(row.key);
  }
  return file;
 }
 function snapshot(storage){
  try{return Object.fromEntries(Object.keys(keys).map(key=>[key,storage.getItem(key)]))}catch(_){fail('storage')}
 }
 function exportFile(storage,htmlValidator,now=new Date()){
  const records=Object.entries(snapshot(storage)).filter(([,value])=>value!==null).map(([key,value])=>({key,value}));
  if(!records.length)fail('empty');
  const text=JSON.stringify({format:'nomad360-drafts',version:1,createdAt:now.toISOString(),records},null,2);
  parse(text,htmlValidator);return text;
 }
 function preview(storage,text,htmlValidator){
  const file=parse(text,htmlValidator),before=snapshot(storage);
  return {file,before,conflicts:file.records.filter(r=>before[r.key]!==null&&before[r.key]!==r.value).map(r=>r.key)};
 }
 function recover(storage){
  let raw;try{raw=storage.getItem(journalKey)}catch(_){fail('storage')}
  if(raw===null)return false;
  let rows;try{rows=JSON.parse(raw)}catch(_){fail('recovery')}
  if(!Array.isArray(rows)||!rows.length||rows.length>Object.keys(keys).length)fail('recovery');
  const seen=new Set();
  for(const row of rows){
   if(!exact(row,['key','before','after'])||!Object.hasOwn(keys,row.key)||seen.has(row.key)||
     (row.before!==null&&typeof row.before!=='string')||typeof row.after!=='string'||
     (row.before!==null&&bytes(row.before)>limit)||bytes(row.after)>limit)fail('recovery');
   seen.add(row.key);
   const current=storage.getItem(row.key);
   if(current!==row.before&&current!==row.after)fail('concurrent');
  }
  // Restore only our writes; never overwrite a third-party concurrent edit.
  try{
   for(const row of rows){
    const current=storage.getItem(row.key);
    if(current!==row.before&&current!==row.after)fail('concurrent');
    if(row.before===null)storage.removeItem(row.key);else storage.setItem(row.key,row.before);
   }
   storage.removeItem(journalKey);
  }catch(error){if(error.code==='concurrent')throw error;fail('recovery')}
  return true;
 }
 function apply(storage,plan,{replace=false,htmlValidator}={}){
  // Revalidate the exact preview, not an independently mutable parsed object.
  const checked=preview(storage,JSON.stringify(plan.file),htmlValidator);
  if(Object.keys(keys).some(key=>checked.before[key]!==plan.before[key]))fail('concurrent');
  if(checked.conflicts.length&&!replace)fail('conflict');
  let pending;try{pending=storage.getItem(journalKey)}catch(_){fail('storage')}
  if(pending!==null)fail('recovery');
  const rows=checked.file.records.filter(r=>checked.before[r.key]!==r.value)
   .map(r=>({key:r.key,before:checked.before[r.key],after:r.value}));
  if(!rows.length)return {imported:0,unchanged:checked.file.records.length};
  try{storage.setItem(journalKey,JSON.stringify(rows))}catch(_){fail('storage')}
  try{
   for(const row of rows){
    if(storage.getItem(row.key)!==row.before)fail('concurrent');
    storage.setItem(row.key,row.after);
   }
   storage.removeItem(journalKey);
  }catch(error){
   try{recover(storage)}catch(recovery){throw recovery}
   if(error.code==='concurrent')throw error;fail('storage');
  }
  return {imported:rows.length,unchanged:checked.file.records.length-rows.length};
 }
 return {keys,limit,journalKey,validate,parse,snapshot,exportFile,preview,apply,recover};
});
