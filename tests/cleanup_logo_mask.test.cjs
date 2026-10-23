'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const s=require('./helpers/cleanup-logo-mask-scope.cjs'),root=path.resolve(__dirname,'..'),postcss=require('../scripts/palette/node_modules/postcss');
test('C2 retains the later 600px rule, the frozen logo tail, and every other CSS byte',()=>{
 A.equal(fs.readFileSync(s.file,'utf8'),s.candidate);A.equal(s.original.length-s.candidate.length,s.removed.length);
 const rules=text=>{const a=[];postcss.parse(text).walkRules(r=>{if(r.selector==='.nomad-seo-logo-mask'&&r.parent.name==='media'&&r.parent.params==='(max-width:600px)')a.push(r);});return a;};
 const before=rules(s.original),after=rules(s.candidate);A.equal(before.length,2);A.equal(after.length,1);
 const declarations=r=>r.nodes.map(d=>[d.prop,d.value,d.important]);A.deepEqual(declarations(before[0]),declarations(before[1]));A.deepEqual(declarations(after[0]),declarations(before[1]));
 const marker='/* TASK-10 LOGO-01:';A.equal(s.original.slice(s.original.indexOf(marker)),s.candidate.slice(s.candidate.indexOf(marker)));
});
test('C2 restores exactly for historical guards and rejects unrelated paint, size, crop and appended changes',()=>{
 A.equal(s.restore(s.file,s.candidate),s.original);A.deepEqual(s.restore(s.file,Buffer.from(s.candidate)),Buffer.from(s.original));
 for(const text of [s.candidate+'\n',s.candidate.replace('scale(1.38)','scale(1.4)'),s.candidate.replace('#173B58','#173B59'),s.candidate.replace(s.removed,'')])A.throws(()=>s.restore(s.file,text),/C2 permits only/);
 A.equal(require('./helpers/partner-application-scope.cjs').restore(s.file,s.candidate),s.original);
 A.equal(s.restore('unrelated.css','same'),'same');
});
test('all other app sources, artwork, palette, numerical fixtures and previous cleanup tools stay exact',()=>{
 const names=execFileSync('git',['ls-tree','-r','--name-only',s.base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/^(?:nomad360_|portfolio_v2_).*\.(?:js|css)$/.test(f)||['Marketing_calc.HTML','US_Retail_Demo.HTML'].includes(f)||f.startsWith('assets/')||f.startsWith('vendor/')||f.startsWith('tests/fixtures/')||f.startsWith('scripts/cleanup/')||f==='scripts/palette/build.cjs');
 for(const file of names){const old=execFileSync('git',['show',s.base+':'+file],{cwd:root,maxBuffer:24*1024*1024}),now=fs.readFileSync(path.join(root,file));A.deepEqual(s.restore(file,now),old,file);}
});
