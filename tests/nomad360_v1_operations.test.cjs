'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process'),acorn=require('../scripts/localization/node_modules/acorn');
const Ops=require('../nomad360_v1_operations.js'),Engine=require('../nomad360_v1_engine.js');
const {restore,digest,manifest}=require('./helpers/v1-operations-scope.cjs');
const root=path.resolve(__dirname,'..');
const accepted=execFileSync('git',['show',manifest.base+':Marketing_calc.HTML'],{cwd:root,encoding:'utf8',maxBuffer:2e6});
const script=[...accepted.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].find(m=>m[1].includes('function calculateProductPortfolio()'))[1];
const functions=Object.fromEntries(acorn.parse(script,{ecmaVersion:'latest'}).body.filter(n=>n.type==='FunctionDeclaration').map(n=>[n.id.name,script.slice(n.start,n.end)]));
const plain=value=>JSON.parse(JSON.stringify(value));
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}return value;}
function oldLanded(input){
 const ids={'own-materials-batch-qty':input.batchQty,'own-materials-cost':input.materialsBase,
  'own-inbound-delivery-cost':input.inboundDelivery,'own-broker-cost':input.broker,
  'own-cargo-insurance-cost':input.insurancePct,'own-duties-cost':input.duties,'own-certification-cost':input.certification};
 const ctx=vm.createContext({document:{getElementById:id=>({value:ids[id]})},productNumber:id=>ids[id],
  materialsCostWithVat:()=>input.materialsWithVat,productOwnChoices:input.choices,productImportPayers:input.importPayers});
 // Execute the accepted arithmetic unchanged; stop before its DOM renderer.
 const body=functions.recalculateMaterialsLandedCost.split('            latestMaterialsLandedUnitCost = unitCost;')[0];
 return plain(vm.runInContext('('+body+'return {materialsBase,vatAdded,inboundDelivery,brokerPerUnit,insurancePerUnit,dutiesPerUnit,certificationPerUnit,unitCost};})()',ctx));
}
test('both entrypoints change only eight receipted hunks; globals, engines and renderers remain exact',()=>{
 A.equal(manifest.base,'9851eff63a2c50d074ea7e1420f8ecc48812d0fc');
 A.equal(digest(fs.readFileSync(path.join(root,'nomad360_v1_operations.js'))),manifest.moduleSha256);
 for(const [file,entry] of Object.entries(manifest.files)){
  const now=require('./helpers/v1-state-scope.cjs').restore(file,fs.readFileSync(path.join(root,file),'utf8'));
  const old=execFileSync('git',['show',manifest.base+':'+file],{cwd:root,encoding:'utf8',maxBuffer:2e6});
  A.equal(entry.replacements.length,8);A.equal(digest(now),entry.after);A.equal(restore(file,now),old);
  A.throws(()=>restore(file,now.replace('const v = currentValues;','const v = {};')),/Unreviewed V1 operations edit/);
  for(const name of ['nomad360_v1_engine.js','nomad360_payments.js','nomad360_sales_tax_v1.js','nomad360_sales_tax_service_v1.js','nomad360_sales_tax_v2.js'])
   A.deepEqual(fs.readFileSync(path.join(root,name)),execFileSync('git',['show',manifest.base+':'+name],{cwd:root}),name);
 }
});
test('operations have no DOM, storage, network, formatting or mutable global dependencies',()=>{
 const src=fs.readFileSync(path.join(root,'nomad360_v1_operations.js'),'utf8');
 const forbidden=new Set(['document','window','localStorage','sessionStorage','fetch','navigator','XMLHttpRequest','Intl','setTimeout']);
 function walk(node){if(!node||typeof node!=='object')return;if(node.type==='Identifier')A.equal(forbidden.has(node.name),false,node.name);for(const v of Object.values(node))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}
 walk(acorn.parse(src,{ecmaVersion:'latest'}));A.equal(Object.isFrozen(Ops),true);
});
test('historical package projection accepts only the exact new module and handler hunks',()=>{
 const scope=require('./helpers/v1-operations-scope.cjs'),entry=manifest.files['Marketing_calc.HTML'];
 const loader='    <script src="./nomad360_v1_operations.js"></script>\n';
 const code=fs.readFileSync(path.join(root,'nomad360_v1_operations.js'),'utf8');
 const bundled=require('./helpers/v1-state-scope.cjs').restore('Marketing_calc.HTML',fs.readFileSync(path.join(root,'Marketing_calc.HTML'),'utf8')).replace(loader,'    <script data-nomad-bundled="./nomad360_v1_operations.js">'+code+'</script>\n');
 A.equal(scope.restoreStandalone(bundled),accepted);
 A.throws(()=>scope.restoreStandalone(bundled.replace('let total = 0;','let total = 1;')),/Exact single/);
 A.notEqual(scope.restoreStandalone(bundled+'other'),accepted);
 const rows=[{path:'Marketing_calc.HTML',sha256:entry.after,bytes:entry.afterBytes},{path:'nomad360_v1_operations.js',sha256:manifest.moduleSha256,bytes:Buffer.byteLength(code)}];
 const pack={html:bundled,manifest:{resources:rows}},projected=scope.packageProjection(pack);
 A.equal(projected.html,accepted);A.equal(projected.manifest.resources.length,1);
 A.deepEqual(projected.manifest.resources[0],{path:'Marketing_calc.HTML',sha256:entry.before,bytes:entry.beforeBytes});
 A.equal(scope.recordProjection({htmlBytes:Buffer.byteLength(bundled),resources:rows}).htmlBytes,Buffer.byteLength(accepted));
 A.throws(()=>scope.packageProjection({...pack,manifest:{resources:[...rows,rows[1]]}}));
 A.throws(()=>scope.packageProjection({...pack,manifest:{resources:[rows[0],{...rows[1],sha256:'wrong'}]}}));
 for(const [file,bridge]of Object.entries(manifest.bridges)){
  A.equal(scope.restore(file,bridge.after),bridge.before);
  A.throws(()=>scope.restore(file,bridge.after+' '),/exact approved/);
 }
});
test('landed costs match accepted arithmetic across every import/payer branch, batches and pending FX',()=>{
 let cases=0;
 for(const batchQty of ['',0,-2,1,3.7,106])for(const materialsBase of [0,12.345,NaN])
 for(const inboundIncluded of ['yes','no',null])for(const materialsImported of ['yes','no',null])
 for(let mask=0;mask<16;mask++){
  const input=freeze({batchQty,materialsBase,materialsWithVat:materialsBase*1.12,
   inboundDelivery:3.25,broker:121,insurancePct:2.5,duties:4.2,certification:299,
   choices:{inboundIncluded,materialsImported},importPayers:Object.fromEntries(['broker','cargoInsurance','duties','certification'].map((k,i)=>[k,mask&(1<<i)?'me':'supplier']))});
  A.deepEqual(plain(Ops.materialsLandedCost(input)),oldLanded(input));cases++;
 }
 A.equal(cases,2592);
 const input={batchQty:10,materialsBase:20,materialsWithVat:20,inboundDelivery:NaN,broker:NaN,insurancePct:NaN,duties:NaN,certification:NaN,choices:{inboundIncluded:'yes',materialsImported:'no'},importPayers:{}};
 A.equal(Ops.materialsLandedCost(input).unitCost,20,'inactive foreign quotes cannot poison local cost');
 input.choices.inboundIncluded='no';A.ok(Number.isNaN(Ops.materialsLandedCost(input).unitCost),'active pending FX must propagate, never become zero');
});
test('VAT and material rows preserve exact sums, pending values and empty/overflow states',()=>{
 for(const materials of [0,0.1,17.35,NaN,Infinity])for(const vatIncluded of ['yes','no',null])for(const vatRate of [-10,0,12,20]){
  const ctx=vm.createContext({productNumber:()=>materials,productOwnChoices:{vatIncluded},document:{getElementById:()=>({value:vatRate})}});
  const expected=vm.runInContext('('+functions.materialsCostWithVat+')()',ctx);
  A.equal(Ops.materialsCostWithVat(freeze({materials,vatIncluded,vatRate})),expected);
 }
 for(const values of [[],[[0,0]],[[0.1,3],[2.35,0.0123],[13,2]],[[NaN,1],[20,1]],[[1e308,10]]]){
  const rows=values.map(([price,qty])=>({price,qty}));
  const output={};const elements=Object.fromEntries(['own-materials-calculated-total','own-materials-cost'].map(k=>[k,{}]));
  const ctx=vm.createContext({window:{},materialCostMode:'calculate',productOwnInboundDeliveryManual:true,
   document:{getElementById:id=>elements[id],querySelectorAll:()=>rows.map((v,i)=>({querySelector:sel=>sel==='.material-cost-price'?{value:v.price}:sel==='.material-cost-qty'?{value:v.qty}:output[i]={}}))},
   moneyInputValue:x=>x,updateInboundDeliveryDefault(){},recalculateMaterialsLandedCost(){}});
  vm.runInContext('('+functions.updateCalculatedMaterialsCost+')()',ctx);
  // Accepted productNumber fallback clamps missing/invalid raw fields to zero;
  // payment-normalized NaN is checked separately below.
  const normalized=rows.map(({price,qty})=>({price:Math.max(0,Number(price)||0),qty:Math.max(0,Number(qty)||0)}));
  const result=Ops.materialCosts(freeze(normalized));
  A.equal(Number.isFinite(result.total)?result.total:'—',elements['own-materials-calculated-total'].textContent);
  result.lineTotals.forEach((n,i)=>A.equal(Number.isFinite(n)?n:'—',output[i].textContent));
 }
 A.ok(Number.isNaN(Ops.materialCosts([{price:NaN,qty:2}]).total));
});
test('funnel outputs and rounding match accepted renderer for zero, fractional and pending inputs',()=>{
 for(const budget of [0,123.45,NaN])for(const cpc of [0,0.37,5])for(const ctrPct of [0,2.35])for(const clickLeadPct of [0,12.7])for(const leadSalePct of [0,31.3]){
  const input=freeze({budget,cpc,ctrPct,clickLeadPct,leadSalePct,management:17.25}),actual={};
  const keys={'own-product-ad-budget':'budget','own-product-ad-cpc':'cpc','own-product-ad-ctr':'ctrPct','own-product-ad-click-lead':'clickLeadPct','own-product-ad-lead-sale':'leadSalePct','own-product-ad-management':'management'};
  const ctx=vm.createContext({productNumber:id=>input[keys[id]],setProductReadonlyNumber:(id,value)=>actual[id]=value,productSource:'own',document:{getElementById:()=>null},syncVisibleAggregateFromCurrentProduct(){}});
  vm.runInContext('('+functions.recalculateProductAdFunnel+')()',ctx);
  const result=Ops.productAdFunnel(input);
  for(const [id,k] of Object.entries({'impressions':'impressions','clicks':'clicks','leads':'leads','orders':'orders','units':'units','media-unit':'mediaPerUnit','management-unit':'managementPerUnit','full-unit':'fullPerUnit','cac-unit':'baseCac'}))
   A.equal(actual['own-product-ad-'+id],id==='impressions'?Math.round(result[k]):result[k]);
 }
});
test('simple service preflight preserves invalid/pending/ready cases and never mutates inputs',()=>{
 const cases=require('./fixtures/v1-engine/accepted-main.json').simpleCases;
 for(const {input:base} of cases)for(const changed of [{},{values:{...base.values,cpc:0}},{values:{...base.values,months:-1}},{payers:{}}]){
  const input=freeze({...base,...changed}),before=JSON.stringify(input),r=Ops.prepareSimpleService(input);
  A.deepEqual(r.issues,Engine.validateSimpleService(input.values));
  const missing=r.issues.length||input.mode!=='agent'?[]:Engine.unassignedSimpleAgentExpenses(input.values,input.mode,input.payers);
  A.deepEqual(r.unassignedPayers,missing);A.equal(r.status,r.issues.length?'invalid':missing.length?'pending':'ready');A.equal(JSON.stringify(input),before);
 }
});
