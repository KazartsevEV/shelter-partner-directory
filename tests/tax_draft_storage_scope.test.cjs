'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const scope=require('./helpers/tax-draft-storage-scope.cjs');
test('storage-only replacements reverse exactly to accepted main; engines are unchanged',()=>{
 for(const file of Object.keys(scope.manifest.files)){
  const current=fs.readFileSync(file),old=execFileSync('git',['show',scope.manifest.base+':'+file]);
  A.deepEqual(scope.restore(file,current),old,file);
  A.throws(()=>scope.restore(file,Buffer.concat([current,Buffer.from('\n// changed')])),/Unreviewed (?:tax\/draft storage|partner application HTML|V1 operations edit)/);
 }
 for(const file of ['nomad360_v1_engine.js','nomad360_sales_tax.js','nomad360_sales_tax_v2.js',
  'portfolio_v2_engine.js','portfolio_v2_linked_engine.js','nomad360_payments.js','nomad360_fx.js','Marketing_calc.HTML'])
  A.deepEqual(require('./helpers/partner-application-scope.cjs').restore(file,fs.readFileSync(file)),execFileSync('git',['show',scope.manifest.base+':'+file],{maxBuffer:2*1024*1024}),file);
});
test('V1 entrypoints and tax adapters delegate persistence without changing load order',()=>{
 for(const file of ['US_Retail_Demo.HTML','Marketing_calc.HTML','nomad360_sales_tax_v1.js','nomad360_sales_tax_service_v1.js']){
  const source=fs.readFileSync(file,'utf8');A.doesNotMatch(source,/\b(?:localStorage|sessionStorage)\b/,file);
  if(file.endsWith('.HTML')){
   A.equal(source.split('<script src="./nomad360_draft_store.js"></script>').length,2);
   A.ok(source.indexOf('nomad360_draft_store.js')<source.indexOf('nomad360_sales_tax_v1.js'));
  }
 }
});
