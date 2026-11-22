'use strict';
// Historical-only projection: exactly the approved shared button type rules.
const A=require('node:assert/strict'),{createHash}=require('node:crypto');
const changes=require('../fixtures/pricing-decision-type/changes.json');
const hash=s=>createHash('sha256').update(s).digest('hex');
function restore(file,source){
 const rule=changes.files?.[file]||(file===changes.file?{beforeSha256:changes.beforeSha256,afterSha256:changes.afterSha256}:null);
 if(!rule||hash(source)!==rule.afterSha256)return source;
 if(rule.baseRevision){const old=require('node:child_process').execFileSync('git',['show',rule.baseRevision+':'+file],{cwd:require('node:path').resolve(__dirname,'../..'),maxBuffer:24e6});A.equal(hash(old),rule.beforeSha256);return Buffer.isBuffer(source)?old:old.toString();}
 let text=source.toString();
 for(const {before,after}of rule.edits||changes.edits){A.equal(text.split(after).length,2,'Exact pricing button typography rule');text=text.replace(after,before);}
 A.equal(hash(text),rule.beforeSha256,'Only approved button typography bytes');
 return Buffer.isBuffer(source)?Buffer.from(text):text;
}
function normalizeResource(row){
 if(row.path!==changes.file||row.sha256!==changes.afterSha256||row.bytes!==changes.afterBytes)return row;
 return {...row,sha256:changes.beforeSha256,bytes:changes.beforeBytes};
}
function restoreStandalone(html){
 const pattern=/(<style\b[^>]*data-nomad-bundled="\.\/nomad360_design_system\.css"[^>]*>)([\s\S]*?)(<\/style>)/g;
 return html.replace(pattern,(_,open,css,close)=>open+restore(changes.file,css)+close);
}
function packageDelta(before,after){
 const delta=p=>p.manifest.resources.reduce((n,r)=>n+normalizeResource(r).bytes-r.bytes,0);
 return delta(after)-delta(before);
}
module.exports={restore,normalizeResource,restoreStandalone,packageDelta};
