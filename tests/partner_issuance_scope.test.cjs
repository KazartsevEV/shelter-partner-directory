'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),{execFileSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base='d7df6102f8961e83e5eea78c91ae4d9fd0d55bae';
test('issuance never edits published runtime, finance, consent form or delivery packer',()=>{
 const files=execFileSync('git',['ls-tree','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/\.(?:js|css|html|HTML)$/.test(f));
 for(const file of files){const expected=execFileSync('git',['show',base+':'+file],{cwd:root,maxBuffer:20*1024*1024});A.deepEqual(require('node:fs').readFileSync(path.join(root,file)),expected,file+' changed');}
 for(const file of ['scripts/partners/build.cjs','scripts/partners/config.cjs'])A.deepEqual(require('node:fs').readFileSync(path.join(root,file)),execFileSync('git',['show',base+':'+file],{cwd:root,maxBuffer:1024*1024}));
});
