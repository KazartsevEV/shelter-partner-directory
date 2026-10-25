'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),{execFileSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base='6e3810befffb4f50767d879fd3715cecce2096a7';
test('issuance never edits published runtime, finance, consent form or delivery packer',()=>{
 const files=execFileSync('git',['ls-tree','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/\.(?:js|css|html|HTML)$/.test(f));
 A.ok(files.includes('nomad360_v1_state.js')&&files.includes('nomad360_v1_operations.js'),'Accepted C6 modules remain covered by the frozen baseline');
 for(const file of files){const expected=execFileSync('git',['show',base+':'+file],{cwd:root,maxBuffer:20*1024*1024});A.deepEqual(require('node:fs').readFileSync(path.join(root,file)),expected,file+' changed');}
 for(const file of ['scripts/partners/build.cjs','scripts/partners/config.cjs'])A.deepEqual(require('node:fs').readFileSync(path.join(root,file)),execFileSync('git',['show',base+':'+file],{cwd:root,maxBuffer:1024*1024}));
});
