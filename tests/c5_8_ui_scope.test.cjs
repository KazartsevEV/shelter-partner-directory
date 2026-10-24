'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {winners}=require('../scripts/cleanup-typical/model.cjs');
const base='050bce789259867096d2d312e5b0dbea51454d5d',file='nomad360_calculator_ui.css';
const before=execFileSync('git',['show',base+':'+file],{encoding:'utf8',maxBuffer:24e6});
const after=fs.readFileSync(file,'utf8');
const edits=[
 ['.nomad-embed-b2b-logo-mask img{display:block;width:100%;height:100%;object-fit:contain}','.nomad-embed-b2b-logo-mask img{display:block;width:100%;height:100%}'],
 ['grid-template-columns:minmax(0,1fr) 64px;gap:16px;padding:22px','gap:16px;padding:22px']
];
test('C5-8 only two approved declarations are removed from the accepted baseline',()=>{
 let result=before;
 for(const [old,next] of edits){A.equal(result.split(old).length,2,'exact single source');result=result.replace(old,next);}
 A.equal(after,result,'no other source change');
 A.equal(Buffer.byteLength(before)-Buffer.byteLength(after),60);
});
test('C5-8 original CSS winners remain unchanged for every selector/context/property/priority',()=>{
 A.deepEqual(winners(before),winners(after));
 const keys=['.nomad-embed-b2b-logo-mask','.nomad-embed-b2b-logo-mask img','.nomad-seo-logo-mask','.nomad-seo-tagline span+span'];
 for(const sel of keys)A.ok(Object.keys(winners(after)).some(k=>k.includes(sel)),'winner '+sel);
});
