'use strict';
// C3 is exactly two early duplicate rules, not a redesign or CSS reordering.
const A=require('node:assert/strict'),path=require('node:path'),{execFileSync}=require('node:child_process');
const base='c45187fa5190ee6ce4bc88a6266337439867a8f6',file='nomad360_about_banner.css';
const original=execFileSync('git',['show',base+':'+file],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'});
const mobile=' #nomad360-information #nomad360-about{padding:37px 22px 0}\n';
const desktop=' #nomad360-information.nomad-information::before{\n  /* Native-height render at ALL desktop widths; 3200×768 source covers 2560px.\n     The approved 1536×768 center remains intact at 1280px and 1440px. */\n  background-size:auto 640.6px;background-position:center top;background-repeat:no-repeat;\n }\n';
A.equal(original.split(mobile).length,3,'Exactly two mobile padding copies');
A.equal(original.split(desktop).length,2,'Exactly one early commented desktop copy');
const candidate=original.replace(mobile,'').replace(desktop,'');
const hash=value=>require('node:crypto').createHash('sha256').update(value).digest('hex');
function normalizePackageResource(record){
 record=require('./cleanup-palette-scope.cjs').normalizePackageResource(record);
 if(record.path!==file)return record;
 const allowed=[original,candidate].some(text=>record.sha256===hash(text)&&record.bytes===Buffer.byteLength(text));
 A.ok(allowed,'Only exact C3 About resource bytes may bridge the older package comparison');
 return {...record,bytes:Buffer.byteLength(original),sha256:hash(original)};
}
function packageDelta(before,after){
 const rows=[before,after].map(p=>p.manifest.resources.find(r=>r.path===file));
 rows.forEach(r=>{A.ok(r,'About resource required');normalizePackageResource(r);});
 const inherited=require('./cleanup-palette-scope.cjs');
 const hasPalette=[before,after].some(p=>p.manifest.resources.some(r=>r.path===inherited.file));
 return rows[0].bytes-rows[1].bytes+(hasPalette?inherited.packageDelta(before,after):0)+require('./cleanup-scene-scope.cjs').extraInlineDelta(before,after);
}
function restore(name,source){
 source=require('./cleanup-palette-scope.cjs').restore(name,source);
 if(name!==file)return source;
 A.ok([original,candidate].includes(source.toString()),'C3 permits only the exact two early About duplicate deletions');
 return Buffer.isBuffer(source)?Buffer.from(original):original;
}
module.exports={base,file,mobile,desktop,original,candidate,restore,normalizePackageResource,packageDelta};
