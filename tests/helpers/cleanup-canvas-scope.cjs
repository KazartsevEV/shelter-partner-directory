'use strict';
const A=require('node:assert/strict'),path=require('node:path'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const base='fda74ea466f84048f647fe7341e4b65d2a46ef70',file='nomad360_about_banner.css';
const read=(revision,name)=>execFileSync('git',['show',revision+':'+name],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8',maxBuffer:8e6});
const original=read(base,file),legacy=read('c45187fa5190ee6ce4bc88a6266337439867a8f6',file);
const replacements=[
 [' display:block;position:relative;isolation:isolate;overflow:hidden;',' display:block;position:relative;isolation:isolate;'],
 [' box-sizing:border-box;max-width:1138px;width:min(1138px,calc(100vw - 32px));\n',''],
 [' margin:48px auto 0;border:0;border-radius:0;background:var(--about-navy);',' border:0;border-radius:0;background:var(--about-navy);'],
 [' #nomad360-information.nomad-information{\n  width:calc(100vw - 20px);max-width:440px;margin:28px auto 0;\n }\n',''],
 [' #nomad360-information.nomad-information{overflow:visible}\n',''],
 [' #nomad360-information.nomad-information{overflow:hidden}\n',''],
 [' #nomad360-information.nomad-information{\n  max-width:none;width:var(--nomad-about-viewport-width,100vw);min-width:0;\n  margin:28px 0 0;\n  margin-left:calc(50% - var(--nomad-about-viewport-width,100vw)/2);\n }',
  ' #nomad360-information.nomad-information{\n  margin-top:28px;\n }']
];
let candidate=original;for(const [before,after] of replacements){A.equal(candidate.split(before).length,2,'Unique canvas fragment');candidate=candidate.replace(before,after);}
const inheritedScripts={};
for(const name of ['scripts/cleanup-about/compare.cjs','scripts/cleanup-palette/compare.cjs']){
 const before=read(base,name);let after;
 if(name.includes('cleanup-about'))after=before.replace("deletedBytes+require('../../tests/helpers/cleanup-palette-scope.cjs').packageDelta(packages.before,packages.after));","deletedBytes+require('../../tests/helpers/cleanup-palette-scope.cjs').packageDelta(packages.before,packages.after)+require('../../tests/helpers/cleanup-canvas-scope.cjs').packageDelta(packages.before,packages.after));");
 else after=before.replace('resources.filter(r=>r.path!==scope.file);',"resources.filter(r=>r.path!==scope.file).map(require('../../tests/helpers/cleanup-canvas-scope.cjs').normalizePackageResource);").replace('packages.before.html.length-packages.after.html.length,904);',"packages.before.html.length-packages.after.html.length,904+require('../../tests/helpers/cleanup-canvas-scope.cjs').packageDelta(packages.before,packages.after));");
 A.notEqual(before,after);inheritedScripts[name]={before,after};
}
function restore(name,source){
 source=require('./cleanup-scene-scope.cjs').restore(name,source);
 if(name===file){const text=source.toString();A.ok([original,candidate,legacy].includes(text),'C3 permits only accepted About bytes; C5-1 permits only the exact scoped canvas consolidation');return text===legacy?source:Buffer.isBuffer(source)?Buffer.from(original):original;}
 const script=inheritedScripts[name];if(!script)return source;
 A.ok([script.before,script.after].includes(source.toString()),'Only the exact inherited C5 canvas package bridge: '+name);
 return Buffer.isBuffer(source)?Buffer.from(script.before):script.before;
}
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function normalizePackageResource(record){
 record=require('./cleanup-scene-scope.cjs').normalizePackageResource(record);
 if(record.path!==file)return record;
 if(record.sha256===hash(legacy)&&record.bytes===Buffer.byteLength(legacy))return record;
 A.ok([original,candidate].some(s=>record.sha256===hash(s)&&record.bytes===Buffer.byteLength(s)),'Only exact C3/C5 canvas resource SHA and size');
 return {...record,sha256:hash(original),bytes:Buffer.byteLength(original)};
}
function packageDelta(before,after){
 const rows=[before,after].map(p=>p.manifest.resources.find(r=>r.path===file));rows.forEach(r=>A.ok(r,'About resource required'));
 // Extra bytes relative to the pre-C5 canonical canvas, excluding earlier C3 work.
 const saved=rows.map(r=>normalizePackageResource(r).bytes-r.bytes);return saved[1]-saved[0]+require('./cleanup-scene-scope.cjs').extraInlineDelta(before,after);
}
module.exports={base,file,original,candidate,legacy,replacements,inheritedScripts,restore,normalizePackageResource,packageDelta};
