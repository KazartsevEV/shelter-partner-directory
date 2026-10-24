'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const ledger=require('../docs/reviews/c5-palette-05-10/ledger.json'),source=require('../docs/reviews/cleanup-typical-05-7/ownership.json');
const key=g=>JSON.stringify([g.selector,g.context,g.property,g.important]);
test('C5-10 classifies exactly 26 generated palette overrides and the consulting fallback',()=>{
 A.equal(ledger.entries.length,27);
 const original=source.remaining.filter(g=>g.status==='Unreviewed C5');
 const byKey=new Map(original.map(g=>[key(g),g]));
 A.equal(byKey.size,original.length);
 const keys=new Set();
 for(const row of ledger.entries){
  const k=key(row),old=byKey.get(k);A.ok(old,'unknown group '+k);A.ok(!keys.has(k),'double counted '+k);keys.add(k);
  A.deepEqual(row.occurrences,old.occurrences);
  A.equal(row.decision,'RETAIN_REVIEWED');
  A.ok(row.reason.length>70,'owner rationale required');
  A.ok(old.occurrences.some(o=>o.file===(row.category==='generated-palette'?'nomad360_palette.css':'nomad360_consulting_banner.css')));
  if(row.category==='generated-palette')A.ok(row.context.some(c=>c.includes('nomad360-palette'))&&row.important);
  else{A.equal(row.selector,'body:has(#home-screen) #nomad360-footer #nomad360-embed');A.equal(row.property,'width');A.deepEqual(row.occurrences.map(o=>o.value),['100vw','100cqw']);}
 }
 A.equal(ledger.entries.filter(x=>x.category==='generated-palette').length,26);
 A.equal(ledger.entries.filter(x=>x.category==='consulting-fallback').length,1);
 A.equal(ledger.originalCensus.unreviewed-ledger.verifiedRetained,54);
});
test('no generated paint, consulting fallback, site JS or frozen math changed',()=>{
 for(const name of ['nomad360_palette.css','nomad360_consulting_banner.css','scripts/palette/build.cjs','Marketing_calc.HTML','nomad360_v1_engine.js']){
  const orig=execFileSync('git',['show',ledger.baseline+':'+name],{maxBuffer:24e6});
  A.deepEqual(fs.readFileSync(name),orig,name);
 }
});
