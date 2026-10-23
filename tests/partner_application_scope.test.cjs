'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {manifest,restore}=require('./helpers/partner-application-scope.cjs');
test('only exact paired asset loaders change in the two entrypoints',()=>{
 for(const file of Object.keys(manifest.files)){
  const current=fs.readFileSync(file);A.deepEqual(restore(file,current),execFileSync('git',['show',manifest.base+':'+file],{maxBuffer:2*1024*1024}));
  A.throws(()=>restore(file,Buffer.concat([current,Buffer.from('\n// unreviewed')])),/Unreviewed partner application HTML/);
 }
 for(const file of ['nomad360_header.js','nomad360_bug_report.js','nomad360_bug_report.css','nomad360_v1_engine.js','portfolio_v2_engine.js','portfolio_v2_linked_engine.js','nomad360_fx.js','nomad360_payments.js','nomad360_draft_store.js','nomad360_delivery.js'])
  A.deepEqual(fs.readFileSync(file),execFileSync('git',['show',manifest.base+':'+file],{maxBuffer:2*1024*1024}),file);
});
test('application modules never inspect calculator state, saved drafts, cookies or page URL',()=>{
 for(const file of ['nomad360_partner_application.js','nomad360_partner_application_model.js','nomad360_partner_transport.js']){
  const source=fs.readFileSync(file,'utf8');A.doesNotMatch(source,/\b(?:localStorage|sessionStorage|productPortfolio|currentValues|calculateProductPortfolio)\b|document\.cookie|location\.(?:href|search)/,file);
 }
 const css=fs.readFileSync('nomad360_partner_application.css','utf8');
 for(const paint of css.match(/#[0-9a-f]{3,8}\b/gi)||[])A.ok(['#173b58','#ffffff','#ff913f','#38678b'].includes(paint.toLowerCase()),paint);
 A.match(css,/@layer nomad360-partner-important,nomad360-palette-important/);
});
