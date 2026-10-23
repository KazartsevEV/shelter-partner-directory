'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const base='9c59e920be7dccd698403d2821a71ac4a56c8a5b';
test('partner configuration stage preserves every existing runtime source, form, selector and filled demo',()=>{
 const files=execFileSync('git',['ls-tree','-r','--name-only',base],{encoding:'utf8'}).trim().split('\n')
  .filter(f=>/\.(js|css|HTML|html)$/.test(f)&&!f.startsWith('tests/')&&!f.startsWith('scripts/'));
 for(const file of files)A.deepEqual(require('./helpers/partner-application-scope.cjs').restore(file,require('./helpers/cleanup-service-grid-scope.cjs').restore(file,fs.readFileSync(file))),execFileSync('git',['show',base+':'+file],{maxBuffer:32*1024*1024}),file);
});
