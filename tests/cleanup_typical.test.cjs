'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const m=require('../scripts/cleanup-typical/model.cjs'),s=require('./helpers/typical-scope.cjs');
test('133 dead layout declarations are removed; every final selector/context/priority winner is preserved',()=>{
 let declarations=0,bytes=0;
 for(const [file,r]of Object.entries(s.receipt.files)){
  const {before,after}=s.sources[file];A.deepEqual(m.analyze(before),{edits:r.edits,proof:r.proof});A.equal(m.apply(before,r.edits),after);A.equal(fs.readFileSync(file,'utf8'),after);A.deepEqual(m.winners(before),m.winners(after));
  A.equal(m.hash(before),r.beforeSha);A.equal(m.hash(after),r.afterSha);declarations+=r.proof.length;bytes+=r.savedBytes;
  for(const p of r.proof){A.ok(p.winners.every(w=>w.line>p.line));}
 }
 A.equal(declarations,133);A.equal(bytes,3589);
});
test('different conditions, partial selector lists, important and browser fallback pairs stay intact',()=>{
 for(const css of ['.a,.b{width:2px}.a{width:3px}', '.a{width:2px}@media(max-width:700px){.a{width:3px}}','.a{width:2px!important}.a{width:3px}', '.a{display:-webkit-box;display:flex}.a{display:grid}', '.a{width:2px}.a{width:3px;width:var(--width)}'])A.equal(m.analyze(css).edits.length,0,css);
 const css='.a,.b{width:2px}.a{width:3px}.b{width:4px}',r=m.analyze(css);A.equal(r.proof.length,1);A.deepEqual(m.winners(css),m.winners(m.apply(css,r.edits)));
 A.notDeepEqual(m.winners(css),m.winners(css.replace('.b{width:4px}','')),'Deleting the winner is detected');
});
test('unknown CSS, fonts, paint, ranges and resource fingerprints fail closed',()=>{
 for(const [file,{before,after}]of Object.entries(s.sources)){
  A.equal(s.restore(file,after),before);for(const bad of [after+'x',after.replace('font-family','font-family-wrong'),after.replace('#173B58','#173B59')])if(bad!==after)A.throws(()=>s.restore(file,bad),/exact approved/);
  A.throws(()=>s.normalizeResource({path:file,sha256:'wrong',bytes:after.length}),/fingerprint/);
  const edits=s.receipt.files[file].edits.map(x=>({...x}));edits[0].sha256='wrong';A.throws(()=>m.apply(before,edits),/Unrecognized/);
 }
 A.throws(()=>s.restoreStandalone('<html data-nomad-package="x"></html>'),/packaged stylesheet/);
});
test('runtime, pages, assets, oracles, packer and old workflows stay exact; only explicit historical bridges are accepted',()=>{
 const bridge=JSON.parse(fs.readFileSync('tests/fixtures/cleanup-typical/bridges.json'));
 const names=execFileSync('git',['ls-tree','-r','--name-only',m.base],{encoding:'utf8'}).trim().split('\n').filter(f=>/^(nomad360_|portfolio_v2_).*\.(js|css)$/.test(f)||['Marketing_calc.HTML','US_Retail_Demo.HTML'].includes(f)||/^(assets\/|vendor\/|tests\/fixtures\/|\.github\/workflows\/|scripts\/partners\/|scripts\/palette\/|scripts\/cleanup|scripts\/style-ownership\/)/.test(f));
 for(const file of names){const actual=fs.readFileSync(file),expected=execFileSync('git',['show',m.base+':'+file],{maxBuffer:24e6});A.deepEqual(s.restore(file,actual),expected,file);}
 for(const [file,r]of Object.entries(bridge)){A.equal(fs.readFileSync(file,'utf8'),r.after,file);A.equal(execFileSync('git',['show',m.base+':'+file],{encoding:'utf8',maxBuffer:24e6}),r.before);}
});
