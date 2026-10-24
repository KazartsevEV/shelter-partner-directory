'use strict';
// Exact approved C5-7 delta, shared by frozen historical checks. No runtime imports.
const fs=require('node:fs'),path=require('node:path'),A=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),base='6a0504139af2f28f5281d49a81559f90a968dd22';
const receipt=require('../fixtures/cleanup-typical/removals.json'),hash=s=>crypto.createHash('sha256').update(s).digest('hex'),sources={};
for(const [file,row]of Object.entries(receipt.files)){
 const before=execFileSync('git',['show',base+':'+file],{cwd:root,encoding:'utf8',maxBuffer:24e6});A.equal(hash(before),row.beforeSha);
 let after=before;for(const e of [...row.edits].reverse()){A.equal(hash(after.slice(e.start,e.end)),e.sha256);after=after.slice(0,e.start)+after.slice(e.end);}A.equal(hash(after),row.afterSha);sources[file]={before,after};
}
let bridgeCache;
function bridges(){return bridgeCache||(bridgeCache=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/cleanup-typical/bridges.json'),'utf8')));}
const historicalDesign=execFileSync('git',['show','c4536e9edd60003efb0a9087ec60915d4c070bdd:nomad360_design_system.css'],{cwd:root,encoding:'utf8'});
function restore(file,source){if(file==='nomad360_design_system.css'&&source.toString()===historicalDesign)return source;const entry=sources[file]||bridges()[file];if(!entry)return source;A.ok([entry.before,entry.after].includes(source.toString()),'Only exact approved C5-7 bytes: '+file);return Buffer.isBuffer(source)?Buffer.from(entry.before):entry.before;}
function normalizeResource(row){const entry=sources[row.path];if(!entry)return row;A.ok([entry.before,entry.after].some(s=>hash(s)===row.sha256&&Buffer.byteLength(s)===row.bytes),'Unknown C5-7 resource fingerprint: '+row.path);return {...row,sha256:hash(entry.before),bytes:Buffer.byteLength(entry.before)};}
function packageDelta(before,after){const total=p=>Object.keys(sources).reduce((n,file)=>{const row=p.manifest.resources.find(x=>x.path===file);if(!row){A.ok(!p.html,'Required C5-7 resource');return n;}return n+normalizeResource(row).bytes-row.bytes;},0);return total(after)-total(before);}
function bundled(source){for(const m of [...source.matchAll(/url\(\s*(['"]?)(\.\/[^'"\)]+)\1\s*\)/g)]){const file=m[2],type={'.webp':'image/webp'}[path.extname(file)];A.ok(type,'Explicit bundle MIME required');source=source.replaceAll(file,'data:'+type+';base64,'+fs.readFileSync(path.join(root,file)).toString('base64'));}return source.replace(/<\/style/gi,'<\\/style');}
function restoreStandalone(html){for(const [file,entry]of Object.entries(sources)){const pattern=new RegExp('(<style\\b[^>]*data-nomad-bundled="\\./'+file.replaceAll('.','\\.')+'"[^>]*>)([\\s\\S]*?)(</style>)','g');let count=0;html=html.replace(pattern,(_,open,content,close)=>{count++;const before=bundled(entry.before),after=bundled(entry.after);A.ok([before,after].includes(content),'Unknown C5-7 packaged stylesheet: '+file);return open+before+close;});if(html.includes('data-nomad-package='))A.equal(count,1,'Single explicit packaged stylesheet: '+file);else A.ok(count<=1,'No duplicated packaged stylesheet');}return html;}
module.exports={root,base,sources,receipt,hash,restore,normalizeResource,packageDelta,restoreStandalone};
