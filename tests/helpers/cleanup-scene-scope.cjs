'use strict';
const A=require('node:assert/strict'),path=require('node:path'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const base='6b3bdbebea65ea8e26a8dfd983842d5eb96bb735',file='nomad360_about_banner.css';
const read=(ref,name,encoding)=>execFileSync('git',['show',ref+':'+name],{cwd:path.resolve(__dirname,'../..'),encoding,maxBuffer:24e6}),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const original=read(base,file,'utf8'),legacy=['c45187fa5190ee6ce4bc88a6266337439867a8f6','fda74ea466f84048f647fe7341e4b65d2a46ef70'].map(ref=>read(ref,file,'utf8'));
const paths=['docs/approved-design/unified-banners/about-moon-scenery.webp','assets/nomad360-banners/about-bozzhyra-approved.webp'];
const removed=paths.map(p=>' background-image:url("./'+p+'");\n');let candidate=original;
for(const line of removed){A.equal(candidate.split(line).length,2);candidate=candidate.replace(line,'');}
const assets=new Map(paths.map(p=>{const bytes=read(base,p);return [p,{path:p,bytes:bytes.length,sha256:hash(bytes),dataUrl:'data:image/webp;base64,'+bytes.toString('base64')}];}));
const cssDelta=Buffer.byteLength(original)-Buffer.byteLength(candidate);
const htmlDelta=removed.reduce((sum,line,i)=>sum+Buffer.byteLength(line.replace('./'+paths[i],assets.get(paths[i]).dataUrl)),0),extraInline=htmlDelta-cssDelta;
const scripts={};
for(const name of ['scripts/cleanup-about/compare.cjs','scripts/cleanup-palette/compare.cjs','scripts/cleanup-canvas/compare.cjs','scripts/cleanup-canvas/ownership.cjs']){
 const before=read(base,name,'utf8');let after;
 if(name.endsWith('ownership.cjs'))after=before.replace("text:fs.readFileSync(path.join(root,name),'utf8')","text:require('../../tests/helpers/cleanup-scene-scope.cjs').restore(name,fs.readFileSync(path.join(root,name),'utf8'))").replace('const report={originalAudit:',"const report={sourceNormalization:'Historical C5-1 canvas contract: later scene URL cleanup restored before this older analysis',originalAudit:");
 else{
  after=before.replace('resources.filter(r=>r.path!==scope.file)',"resources.filter(r=>r.path!==scope.file).filter(require('../../tests/helpers/cleanup-scene-scope.cjs').keepResource)");
  if(name.includes('cleanup-canvas'))after=after.replace('),deletedBytes);',"),deletedBytes+require('../../tests/helpers/cleanup-scene-scope.cjs').packageDelta(packages.before,packages.after));");
 }
 A.notEqual(after,before);scripts[name]={before,after};
}
function restore(name,source){
 if(name===file){const text=source.toString();A.ok([original,candidate,...legacy].includes(text),'C3 permits only accepted About bytes; C5-1 permits only accepted canvas; C5-2 permits only the two exact obsolete image declarations');return text===candidate?(Buffer.isBuffer(source)?Buffer.from(original):original):source;}
 const script=scripts[name];if(!script)return source;A.ok([script.before,script.after].includes(source.toString()),'Only exact inherited scene-resource bridge: '+name);return Buffer.isBuffer(source)?Buffer.from(script.before):script.before;
}
function normalizePackageResource(record){
 if(record.path!==file)return record;
 const text=[original,candidate,...legacy].find(s=>record.sha256===hash(s)&&record.bytes===Buffer.byteLength(s));A.ok(text,'Only exact C3/C5 canvas resource SHA and size for scene cleanup');
 return text===candidate?{...record,sha256:hash(original),bytes:Buffer.byteLength(original)}:record;
}
function keepResource(record){const asset=assets.get(record.path);if(!asset)return true;A.equal(record.bytes,asset.bytes,'Historical image size');A.equal(record.sha256,asset.sha256,'Historical image SHA');return false;}
function rows(before,after){const r=[before,after].map(p=>p.manifest.resources.find(x=>x.path===file));r.forEach(x=>{A.ok(x,'About resource required');normalizePackageResource(x);});return r;}
function extraInlineDelta(before,after){const r=rows(before,after);return r.reduce((sum,x,i)=>sum+(i?1:-1)*(x.sha256===hash(candidate)?extraInline:0),0);}
function packageDelta(before,after){const r=rows(before,after),saved=r.map(x=>normalizePackageResource(x).bytes-x.bytes);return saved[1]-saved[0]+extraInlineDelta(before,after);}
module.exports={base,file,original,candidate,legacy,paths,removed,assets,cssDelta,htmlDelta,extraInline,scripts,restore,normalizePackageResource,keepResource,extraInlineDelta,packageDelta};
