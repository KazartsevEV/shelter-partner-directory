'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const scope=require('./helpers/refactor-boundaries-scope.cjs');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file));

test('every changed application source has a reviewed fingerprint; numeric engines are byte-exact',()=>{
  for(const file of Object.keys(scope.hashes))scope.verify(file,read(file));
  for(const file of ['portfolio_v2_engine.js','portfolio_v2_linked_engine.js',
    'portfolio_v2_temporal_cash.js','nomad360_payments.js','nomad360_fx.js',
    'nomad360_sales_tax.js','nomad360_sales_tax_v1.js','nomad360_sales_tax_v2.js']){
    const old=execFileSync('git',['show',scope.base+':'+file],{cwd:root});
    A.deepEqual(read(file),old,file);
  }
  const altered=read('nomad360_header.js').toString().replace('buildStandalone','buildChanged');
  A.throws(()=>scope.restore('nomad360_header.js',altered),/Unreviewed module-boundary edit/);
});

test('storage and delivery load before their consumers; old draft keys remain stable',()=>{
  const html=read('Marketing_calc.HTML').toString();
  const once=token=>A.equal(html.split(token).length,2,token);
  once('<script src="./nomad360_draft_store.js"></script>');
  once('<script src="./nomad360_delivery.js"></script>');
  A.ok(html.indexOf('nomad360_draft_store.js')<html.indexOf('function readSavedProductCalculation()'));
  A.ok(html.indexOf('nomad360_delivery.js')<html.indexOf('nomad360_header.js'));
  const header=read('nomad360_header.js').toString();
  A.match(header,/Nomad360Delivery\.buildStandalone/);
  A.doesNotMatch(header,/function get=|new root\.FileReader|new root\.DOMParser/);
  A.doesNotMatch(header,/nomad-unit-note/);
  A.doesNotMatch(read('nomad360_irbis_banner.js').toString(),/nomad-unit-note/);
});
