'use strict';
const A=require('node:assert/strict'),path=require('node:path'),{execFileSync}=require('node:child_process');
const base='6ce82985d46f9d29c4f7312753d1a0b62714a19a',file='nomad360_calculator_ui.css';
const removed='.nomad-seo-logo-mask{width:64px;height:64px}';
const original=execFileSync('git',['show',base+':'+file],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'});
A.equal(original.split(removed).length,3,'two exact declarations before C2');
const candidate=original.replace(removed,'');
function restore(name,source){
 if(name!==file)return source;
 const text=source.toString();A.ok(text===original||text===candidate,'C2 permits only the exact early logo-mask duplicate deletion');
 return Buffer.isBuffer(source)?Buffer.from(original):original;
}
module.exports={base,file,removed,original,candidate,restore};
