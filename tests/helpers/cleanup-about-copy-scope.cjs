'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),base='8c2f51dbfe3d497d5b6ad9dfdf5b787ea5813530',file='nomad360_about_banner.css',hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const read=(ref,name)=>execFileSync('git',['show',ref+':'+name],{cwd:root,encoding:'utf8',maxBuffer:24e6});
const original=read(base,file),legacy=['c45187fa5190ee6ce4bc88a6266337439867a8f6','fda74ea466f84048f647fe7341e4b65d2a46ef70','6b3bdbebea65ea8e26a8dfd983842d5eb96bb735','25572021ae685ed8fc85da689f528957b0c6986f'].map(ref=>read(ref,file));
const receipt=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/cleanup-about-copy/removals.json'))),canonical=fs.readFileSync(path.join(root,'tests/fixtures/cleanup-about-copy/canonical.css'),'utf8');
let candidate=original;for(const r of [...receipt].reverse()){A.equal(hash(original.slice(r.start,r.end)),r.sha256,'Frozen About copy range');candidate=candidate.slice(0,r.start)+candidate.slice(r.end);}candidate+='\n'+canonical;
const cssDelta=Buffer.byteLength(original)-Buffer.byteLength(candidate),scripts={};
for(const name of ['scripts/cleanup-scene-layout/compare.cjs','scripts/cleanup-scene-layout/ownership.cjs']){
 const before=read(base,name),after=name.endsWith('compare.cjs')?before.replace('const deletedBytes=scope.cssDelta;',"const deletedBytes=scope.cssDelta+require('../../tests/helpers/cleanup-about-copy-scope.cjs').packageDelta(packages.before,packages.after);"):before.replace("text:fs.readFileSync(path.join(root,name),'utf8')","text:require('../../tests/helpers/cleanup-about-copy-scope.cjs').restore(name,fs.readFileSync(path.join(root,name),'utf8'))").replace('const report={originalAudit:',"const report={sourceNormalization:'Historical C5-3 decoration contract: C5-4 copy consolidation restored before this older analysis',originalAudit:");
 A.notEqual(after,before);scripts[name]={before,after};
}
function restore(name,source){
 source=require('./payment-grid-scope.cjs').restore(name,source);
 if(name===file){const text=source.toString();A.ok([original,candidate,...legacy].includes(text),'C3 permits only accepted About bytes; C5-1 permits only accepted canvas; C5-2 permits only accepted scene; C5-3 permits only accepted decoration; C5-4 permits only exact introduction consolidation');return text===candidate?(Buffer.isBuffer(source)?Buffer.from(original):original):source;}
 const script=scripts[name];if(!script)return source;A.ok([script.before,script.after].includes(source.toString()),'Only exact inherited C5-4 introduction bridge: '+name);return Buffer.isBuffer(source)?Buffer.from(script.before):script.before;
}
function normalizePackageResource(record){record=require('./payment-grid-scope.cjs').normalizePackageResource(record);if(record.path!==file)return record;const text=[original,candidate,...legacy].find(s=>record.sha256===hash(s)&&record.bytes===Buffer.byteLength(s));A.ok(text,'Only exact C3/C5 decoration resource SHA and size');return text===candidate?{...record,sha256:hash(original),bytes:Buffer.byteLength(original)}:record;}
function packageDelta(before,after){const rows=[before,after].map(p=>p.manifest.resources.find(r=>r.path===file));rows.forEach(r=>A.ok(r,'About resource required'));const saved=rows.map(r=>normalizePackageResource(r).bytes-r.bytes);return saved[1]-saved[0];}
const paths=['docs/approved-design/unified-banners/about-moon-scenery.webp','assets/nomad360-banners/about-bozzhyra-approved.webp'];
module.exports={root,base,file,original,candidate,legacy,receipt,canonical,cssDelta,scripts,restore,normalizePackageResource,packageDelta,paths};
