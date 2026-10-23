'use strict';
// Bridge only owner-accepted #248 CSS for guards predating the banner fixes.
// Actual runtime assets are separately pinned to accepted main by the C2 gate.
const A=require('node:assert/strict'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),accepted='6ce82985d46f9d29c4f7312753d1a0b62714a19a',legacy='9c59e920be7dccd698403d2821a71ac4a56c8a5b';
const files=new Set(['nomad360_about_banner.css','nomad360_consulting_banner.css']);
const read=(revision,file)=>execFileSync('git',['show',revision+':'+file],{cwd:root});
const snapshots=new Map([...files].map(file=>[file,{before:read(legacy,file),after:read(accepted,file)}]));
function restore(file,source){
 const entry=snapshots.get(file);if(!entry)return source;
 const bytes=Buffer.isBuffer(source)?source:Buffer.from(source);
 A.ok(bytes.equals(entry.before)||bytes.equals(entry.after),'Only exact owner-accepted #248 banner CSS may bridge historical guards: '+file);
 return Buffer.isBuffer(source)?Buffer.from(entry.before):entry.before.toString();
}
module.exports={restore,accepted,legacy,files};
