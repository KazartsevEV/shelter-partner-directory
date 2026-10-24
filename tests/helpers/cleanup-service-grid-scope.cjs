'use strict';
const A=require('node:assert/strict'),{execFileSync}=require('node:child_process'),path=require('node:path');
const base='c4536e9edd60003efb0a9087ec60915d4c070bdd',file='nomad360_design_system.css';
const removed='body #full-service-screen .nd-full-service-inputs{\n  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px\n}\n';
const original=execFileSync('git',['show',base+':'+file],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'});
A.equal(original.split(removed).length,2);
const candidate=original.replace(removed,'');
function restore(name,source){
 if(name!==file)return source;
 if(source.toString()!==original&&source.toString()!==candidate){try{source=require('./typical-scope.cjs').restore(name,source);}catch(error){A.fail('C1 permits only its frozen source plus exact approved C5-7 layout removal: '+error.message);}}
 const text=source.toString();
 A.ok(text===original||text===candidate,'C1 permits only deletion of the exact early duplicate; all other CSS bytes are protected');
 return Buffer.isBuffer(source)?Buffer.from(original):original;
}
module.exports={base,file,removed,original,candidate,restore};
