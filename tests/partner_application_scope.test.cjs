'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {manifest,restore}=require('./helpers/partner-application-scope.cjs');
test('only exact paired asset loaders change in the two entrypoints',()=>{
 for(const file of Object.keys(manifest.files)){
  const current=fs.readFileSync(file);A.deepEqual(restore(file,current),execFileSync('git',['show',manifest.base+':'+file],{maxBuffer:2*1024*1024}));
  A.throws(()=>restore(file,Buffer.concat([current,Buffer.from('\n// unreviewed')])),/Unreviewed (?:partner application HTML|V1 operations edit)/);
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

test('live acceptance remains applicable to the unchanged model, transport and submission handler',()=>{
 const {createHash}=require('node:crypto');
 const hash=source=>createHash('sha256').update(source).digest('hex');
 const receipt=require('../docs/reviews/partner-application-01/live-acceptance.json');
 const integrity=require('../docs/reviews/partner-application-01/submission-integrity.json');
 A.equal(receipt.applicationFieldsIncluded,false);A.equal(receipt.status,200);A.equal(receipt.receipt.ok,true);
 for(const file of ['nomad360_partner_application_model.js','nomad360_partner_transport.js'])A.equal(hash(fs.readFileSync(file)),receipt.implementationSha256[file]);
 const current=fs.readFileSync('nomad360_partner_application.js','utf8'),old=execFileSync('git',['show',receipt.sourceRevision+':nomad360_partner_application.js'],{encoding:'utf8'});
 const start=" form.addEventListener('submit',async event=>{",end='\n localize();\n}';
 const handler=source=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
 A.equal(handler(current),handler(old));A.equal(hash(handler(current)),integrity.submitHandlerSha256);
});
