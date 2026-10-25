'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),S=require('../scripts/style-ownership/ci_scope.cjs');
test('historical comparisons remain required for every existing stylesheet, deletions and cleanup/generator changes',()=>{
 const styles=['nomad360_palette.css','nomad360_design_system.css','assets/nomad360-help.css'];
 for(const name of [...styles,'scripts/palette/build.cjs','scripts/style-ownership/model.cjs','scripts/cleanup-palette/compare.cjs'])A.equal(S.needsHistory([name],styles),true,name);
 A.equal(S.needsHistory(['assets/nomad360-drafts.css',styles[0]],styles),true,'A new component never masks an existing style change');
});
test('new independent component uses contemporary browser checks without claiming historical equivalence',()=>{
 A.equal(S.needsHistory(['assets/nomad360-drafts.css','nomad360_draft_transfer.js','assets/nomad360-help.js','drafts/index.html','scripts/style-ownership/ci_scope.cjs'],['assets/nomad360-help.css']),false);
 const calls=[],git=(...args)=>{calls.push(args);if(args[0]==='rev-list')return 'merge base head';if(args[0]==='diff')return 'assets/nomad360-drafts.css\n';return 'assets/nomad360-help.css\n'};
 A.deepEqual(S.inspect('pull_request',git),{historical:false,reason:'existing-styles-unchanged',changed:1});A.equal(calls[1].includes('--no-renames'),true);
});
test('unknown/manual context retains historical checks, malformed PR context fails rather than disabling checks',()=>{
 A.equal(S.inspect('workflow_dispatch',()=>{throw Error('not called')}).historical,true);
 A.throws(()=>S.inspect('pull_request',()=> 'one-parent two'),/test-merge/);
});

test('owned styles match original palette generator inputs and page-family ownership; new component CSS stays with its owner',()=>{
 const fs=require('node:fs');
 const extract=(name,label)=>{const text=fs.readFileSync(name,'utf8'),value=text.match(new RegExp(label+"=\\[([^\\]]+)\\]"));A.ok(value);return [...value[1].matchAll(/'([^']+)'/g)].map(x=>x[1])};
 const expected=[...new Set([...extract('scripts/palette/build.cjs','sources'),...extract('scripts/style-ownership/model.cjs','raw'),'nomad360_palette.css'])].sort();
 A.deepEqual([...S.ownedStyles].sort(),expected);
 A.equal(S.needsHistory(['assets/nomad360-drafts.css']),false);
});
