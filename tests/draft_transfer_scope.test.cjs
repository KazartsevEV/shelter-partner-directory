'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base='6e3810befffb4f50767d879fd3715cecce2096a7';
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
test('transport does not alter calculators, existing storage formats, engines or delivery',()=>{
 for(const name of ['Marketing_calc.HTML','US_Retail_Demo.HTML','nomad360_draft_store.js','nomad360_v1_engine.js','nomad360_v1_state.js','nomad360_v1_operations.js','portfolio_v2_engine.js','portfolio_v2_linked_engine.js','portfolio_v2_full_service.js','nomad360_currency.js','nomad360_fx.js','nomad360_payment_ui.js','nomad360_delivery.js','nomad360_locale_core.js']){
  A.equal(read(name),execFileSync('git',['show',base+':'+name],{cwd:root,encoding:'utf8'}),name);
 }
});
test('only the explicit local page and transport resources are added to public release',()=>{
 const accepted=JSON.parse(execFileSync('git',['show',base+':scripts/site-release/public-files.json'],{cwd:root,encoding:'utf8'})),now=JSON.parse(read('scripts/site-release/public-files.json'));
 A.deepEqual(now.files.filter(f=>!accepted.files.includes(f)).sort(),['assets/nomad360-drafts.css','drafts/index.html','nomad360_draft_transfer.js','nomad360_draft_transfer_ui.js']);
 A.deepEqual(accepted.files.filter(f=>!now.files.includes(f)),[]);
 const html=read('drafts/index.html');A.match(html,/noindex,nofollow/);A.doesNotMatch(html,/https?:|<form|\son\w+=/);
});
test('transport has no network, financial engine, provider, broad storage-clear or credential binding',()=>{
 for(const name of ['nomad360_draft_transfer.js','nomad360_draft_transfer_ui.js']){
  A.doesNotMatch(read(name),/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(|(?:localStorage|storage)\.(?:clear|key)\s*\(|Nomad360V1Engine|PortfolioV2Engine|formspree\.io/);
 }
 const colors=[...read('assets/nomad360-drafts.css').matchAll(/#[\da-fA-F]{6}/g)].map(x=>x[0]);A.ok(colors.every(c=>['#173B58','#FFFFFF','#FF913F','#38678B'].includes(c)));
 const workflow=read('.github/workflows/draft-transfer.yml');A.doesNotMatch(workflow,/secrets\.|id-token|contents: write|continue-on-error/);
});

test('historical Help projection permits only the exact link addition, never search or unrelated edits',()=>{
 const bridge=require('./helpers/draft-transfer-scope.cjs'),old=execFileSync('git',['show',base+':'+bridge.file],{cwd:root,encoding:'utf8'}),current=read(bridge.file);
 A.equal(bridge.restore(bridge.file,current),old);A.equal(bridge.restore(bridge.file,old),old);
 for(const changed of [current.replace('Transfer saved calculations','Unexpected link'),current.replace("input.addEventListener('input',run)","input.addEventListener('change',run)"),current+'\n'])A.throws(()=>bridge.restore(bridge.file,changed),/exact R4/);
 A.equal(bridge.restore('another.js','unchanged'),'unchanged');
});
