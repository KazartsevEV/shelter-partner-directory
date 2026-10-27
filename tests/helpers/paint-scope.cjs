'use strict';
// Exact C5-8 projection for historical contracts; never used by the runtime or packer.
const fs=require('node:fs'),path=require('node:path'),A=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),receipt=require('../fixtures/cleanup-paint/removals.json'),base=receipt.base;
const known=require('../fixtures/cleanup-paint/historical.json'),hash=s=>crypto.createHash('sha256').update(s).digest('hex'),sources={};
for(const [file,row]of Object.entries(receipt.files)){
 const before=execFileSync('git',['show',base+':'+file],{cwd:root,encoding:'utf8',maxBuffer:24e6});A.equal(hash(before),row.beforeSha);
 let after=before;for(const e of [...row.edits].reverse()){A.equal(hash(after.slice(e.start,e.end)),e.sha256);after=after.slice(0,e.start)+(e.replacement??'')+after.slice(e.end);}A.equal(hash(after),row.afterSha);sources[file]={before,after};
}
let bridgeCache;function bridges(){return bridgeCache||(bridgeCache=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/cleanup-paint/bridges.json'),'utf8')));}
function acceptedWorkflow(file,source){
 if(file!=='.github/workflows/style-ownership.yml')return source;
 const old=execFileSync('git',['show',require('./draft-transfer-scope.cjs').base+':'+file],{cwd:root});
 if(hash(source)!==hash(old))return source;
 const legacy=execFileSync('git',['show',base+':'+file],{cwd:root});
 return Buffer.isBuffer(source)?legacy:legacy.toString();
}
function restore(file,source){source=require('./v1-operations-scope.cjs').restore(file,source);source=acceptedWorkflow(file,source);const entry=sources[file];if(entry){const text=source.toString();if(text===entry.after)return Buffer.isBuffer(source)?Buffer.from(entry.before):entry.before;A.ok(known[file].some(([h,b])=>hash(source)===h&&Buffer.byteLength(source)===b),'Only exact approved C5-8 or historical bytes: '+file);return source;}const bridge=bridges()[file];if(!bridge)return source;A.ok([bridge.before,bridge.after].includes(source.toString()),'Only exact approved C5-8 bridge: '+file);return Buffer.isBuffer(source)?Buffer.from(bridge.before):bridge.before;}
function normalizeResource(row){row=require('./pricing-decision-type-scope.cjs').normalizeResource(row);const entry=sources[row.path];if(!entry)return row;if(hash(entry.after)===row.sha256&&Buffer.byteLength(entry.after)===row.bytes)return {...row,sha256:hash(entry.before),bytes:Buffer.byteLength(entry.before)};A.ok(known[row.path].some(([h,b])=>h===row.sha256&&b===row.bytes),'Unknown C5-8 resource fingerprint: '+row.path);return row;}
function normalizePackage(p){return {...p,manifest:{...p.manifest,resources:p.manifest.resources.map(normalizeResource)}};}
function packageDelta(before,after){const total=p=>Object.keys(sources).reduce((n,file)=>{const row=p.manifest.resources.find(x=>x.path===file);if(!row){A.ok(!p.html,'Required C5-8 resource: '+file);return n;}return n+normalizeResource(row).bytes-row.bytes;},0);return total(after)-total(before);}
function bundled(source){for(const m of [...source.matchAll(/url\(\s*(['"]?)(\.\/[^'"\)]+)\1\s*\)/g)]){const file=m[2],relative=decodeURIComponent(new URL(file,'https://local/').pathname.slice(1)),type={'.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(relative)]||'application/octet-stream';source=source.replaceAll(file,'data:'+type+';base64,'+fs.readFileSync(path.join(root,relative)).toString('base64'));}return source.replace(/<\/style/gi,'<\\/style');}
const bundledHistory={};
function legacyBundles(file){if(!bundledHistory[file]){const refs=require('../fixtures/cleanup-paint/history-refs.json');bundledHistory[file]=new Set(refs.map(rev=>execFileSync('git',['show',rev+':'+file],{cwd:root,encoding:'utf8',maxBuffer:24e6})).filter(text=>known[file].some(([h,b])=>h===hash(text)&&b===Buffer.byteLength(text))).map(bundled));}return bundledHistory[file];}
function restoreStandalone(html){html=require('./pricing-decision-type-scope.cjs').restoreStandalone(html);for(const [file,entry]of Object.entries(sources)){const pattern=new RegExp('(<style\\b[^>]*data-nomad-bundled="\\./'+file.replaceAll('.','\\.')+'"[^>]*>)([\\s\\S]*?)(</style>)','g');let count=0;html=html.replace(pattern,(_,open,content,close)=>{count++;const options=[entry.before,entry.after].map(bundled);if(options.includes(content))return open+options[0]+close;const legacy=legacyBundles(file).has(content);A.ok(legacy,'Unknown C5-8 packaged stylesheet: '+file);return open+content+close;});if(html.includes('data-nomad-package='))A.equal(count,1,'Single explicit packaged stylesheet: '+file);else A.ok(count<=1,'No duplicated packaged stylesheet');}return html;}
function project(file,source){source=require('./v1-operations-scope.cjs').restore(file,source);source=acceptedWorkflow(file,source);const e=sources[file]||bridges()[file];return e&&source.toString()===e.after?restore(file,source):source;}
function projectResource(row){row=require('./pricing-decision-type-scope.cjs').normalizeResource(row);const e=sources[row.path];return e&&row.sha256===hash(e.after)&&row.bytes===Buffer.byteLength(e.after)?normalizeResource(row):row;}
module.exports={project,projectResource,root,base,receipt,sources,hash,restore,normalizeResource,normalizePackage,packageDelta,bundled,restoreStandalone};
