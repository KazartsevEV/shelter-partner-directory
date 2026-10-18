'use strict';
// Excel result-presentation-only exception against the approved PR189 main.
// Nothing outside numeric tax worksheet/document projection/localized headings
// may drift. All tax/finance algorithms are separately frozen and tested.
const A=require('node:assert/strict'),cp=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),base='cfc7e3d4f429004def715a4acc586a3b3fb984d1';
function accepted(){return cp.execFileSync('git',['show',base+':nomad360_price_export.js'],{cwd:root,encoding:'utf8'});}
function mask(source,newFile){
 const extra=/^const salesTaxColumns=\{[\s\S]*?^\};\n/mg;
 A.equal([...source.matchAll(extra)].length,newFile?1:0,'Only one approved three-language XLSX header dictionary');
 let out=source.replace(extra,'');
 for(const [name,regex] of [
  ['document',/^function document\([^\n]*\)\{[\s\S]*?^\}\n/mg],
  ['write',/^async function write\([^\n]*\)\{[\s\S]*?^\}\n/mg]
 ]){
  A.equal([...out.matchAll(regex)].length,1,'Bounded spreadsheet '+name);
  out=out.replace(regex,'function <'+name+'>(){}\n');
 }
 return out;
}
function restore(source){
 const old=accepted();
 A.equal(mask(source,true),mask(old,false),'Excel changed outside the exact worksheet projection and writer');
 return old;
}
module.exports={restore};
