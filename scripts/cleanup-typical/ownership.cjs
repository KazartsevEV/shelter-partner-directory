'use strict';
const fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path'),A=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {analyze}=require('../audit/runtime-inventory.cjs'),s=require('../../tests/helpers/typical-scope.cjs'),M=require('../style-ownership/model.cjs');
const inventory=JSON.parse(zlib.gunzipSync(fs.readFileSync('docs/reviews/runtime-audit-01/runtime-inventory.json.gz'))),names=inventory.files.map(x=>x.file);
const before=analyze(names.map(name=>({name,text:execFileSync('git',['show',s.base+':'+name],{encoding:'utf8',maxBuffer:24e6})}))),after=analyze(names.map(name=>({name,text:fs.readFileSync(name,'utf8')})));
const key=g=>JSON.stringify([g.selector,g.context,g.property,g.important]),retained=new Set(M.groups().map(key)),old=new Set(before.cascadeOverrides.map(key)),present=new Set(after.cascadeOverrides.map(key));
A.equal(before.cascadeOverrides.length,183);A.equal(after.cascadeOverrides.filter(g=>retained.has(key(g))).length,19);for(const k of present)A.ok(old.has(k),'No new conflicting group');
const result={base:s.base,rawBefore:183,rawAfter:after.cascadeOverrides.length,retired:old.size-present.size,retainedReviewed:19,unreviewed:after.cascadeOverrides.length-19,files:Object.fromEntries(Object.entries(s.receipt.files).map(([f,r])=>[f,{declarations:r.proof.length,savedBytes:r.savedBytes}])),remaining:after.cascadeOverrides.map(g=>({...g,status:retained.has(key(g))?'Retained page ownership':'Unreviewed C5'}))};
const out=process.argv[2]||'artifacts/typical/ownership.json';fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log('C57_OWNERSHIP_GREEN',JSON.stringify({...result,remaining:undefined}));
