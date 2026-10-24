'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const owner=require('../docs/reviews/c5-ui-hero-05-12/ledger.json'),raw=require('../docs/reviews/cleanup-typical-05-7/ownership.json');
const key=g=>JSON.stringify([g.selector,g.context,g.property,g.important]);
const excluded=g=>(g.selector==='.nomad-embed-b2b-logo-mask img'&&g.property==='object-fit')||(g.selector==='body #nomad360-seo-banner.nomad-seo-banner'&&g.property==='grid-template-columns');
test('exact remaining 6 UI and 5 Hero owner groups are indexed once',()=>{
 const old=raw.remaining.filter(g=>g.status==='Unreviewed C5'&&(
  g.occurrences.some(o=>o.file==='nomad360_hero_banner.css')||(g.occurrences.some(o=>o.file==='nomad360_calculator_ui.css')&&!excluded(g))));
 A.equal(old.length,11);A.equal(owner.entries.length,11);
 const byKey=new Map(old.map(g=>[key(g),g])),seen=new Set();
 for(const g of owner.entries){const k=key(g),prev=byKey.get(k);A.ok(prev,k);A.ok(!seen.has(k));seen.add(k);
  A.deepEqual(g.occurrences,prev.occurrences);A.ok(g.reason.length>95);A.notEqual(g.status,'REMOVED');
 }
 A.deepEqual(owner.counts,{ui:6,hero:5});
});
test('inventory-only changes cannot touch approved runtime CSS or source assets',()=>{
 for(const file of ['nomad360_hero_banner.css','nomad360_calculator_ui.css','nomad360_palette.css']){
  A.deepEqual(fs.readFileSync(file),execFileSync('git',['show',owner.baseline+':'+file],{maxBuffer:24e6}),file);
 }
});
