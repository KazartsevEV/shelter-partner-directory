'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const ledger=require('../docs/reviews/c5-design-system-05-11/ledger.json'),raw=require('../docs/reviews/cleanup-typical-05-7/ownership.json');
const key=x=>JSON.stringify([x.selector,x.context,x.property,x.important]);
test('every design-system override is classified without declaring unsupported deletion',()=>{
 const expected=raw.remaining.filter(g=>g.status==='Unreviewed C5'&&g.occurrences.some(o=>o.file==='nomad360_design_system.css'));
 A.equal(ledger.examined,35);A.equal(expected.length,35);A.equal(ledger.groups.length,35);
 const byKey=new Map(expected.map(g=>[key(g),g]));
 for(const g of ledger.groups){
  const e=byKey.get(key(g));A.ok(e);A.deepEqual(e.occurrences,g.occurrences);
  A.ok(g.reason.length>100);
  const type=g.property==='font'?'safe-removal-candidate':g.property==='margin'?'shared-rule-fragment':'palette-visual-dependency';
  A.equal(g.classification,type);
 }
 A.deepEqual(ledger.classifications,{'palette-visual-dependency':29,'safe-removal-candidate':2,'shared-rule-fragment':4});
});
test('audit cannot silently modify the accepted visual layer or generated palette',()=>{
 for(const name of ['nomad360_design_system.css','nomad360_palette.css','scripts/palette/build.cjs']){
  A.deepEqual(fs.readFileSync(name),execFileSync('git',['show',ledger.base+':'+name],{maxBuffer:24e6}),name);
 }
});
