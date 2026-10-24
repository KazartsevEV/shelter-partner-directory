'use strict';
const A=require('node:assert/strict'),path=require('node:path'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const base='27e38c752d89938fdfd1d1da4579164a8b43963c',file='nomad360_palette.css',generator='scripts/palette/build.cjs';
const read=name=>execFileSync('git',['show',base+':'+name],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8',maxBuffer:8e6});
const original=read(file),generatorBefore=read(generator);
// Frozen independent receipt of the seven pairs. Not computed by the new deduper.
const pairs=[[27394,31768,87],[37896,46367,206],[47863,58242,76],[48374,52538,84],[51299,56285,99],[73136,76438,98],[74145,79015,254]];
for(const [first,last,length] of pairs)A.equal(original.slice(first,first+length),original.slice(last,last+length));
let candidate=original;for(const [first,,length] of [...pairs].reverse())candidate=candidate.slice(0,first)+candidate.slice(first+length);
const generatorAfter=generatorBefore.replace('const css=`','const rawCss=`').replace('const outputs=',"const css=require('./deduplicate.cjs').deduplicate(rawCss).css;\nconst outputs=");
A.notEqual(generatorAfter,generatorBefore);A.ok(generatorAfter.includes('deduplicate(rawCss)'));
function restore(name,source){
 source=require('./cleanup-canvas-scope.cjs').restore(name,source);
 const expected=name===file?[original,candidate]:name===generator?[generatorBefore,generatorAfter]:null;
 if(!expected)return source;
 A.ok(expected.includes(source.toString()),'C4 permits only seven exact early palette-rule deletions and the exact generator hook: '+name);
 return Buffer.isBuffer(source)?Buffer.from(expected[0]):expected[0];
}
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
function normalizePackageResource(record){
 record=require('./cleanup-canvas-scope.cjs').normalizePackageResource(record);
 if(record.path!==file)return record;
 A.ok([original,candidate].some(s=>record.sha256===hash(s)&&record.bytes===Buffer.byteLength(s)),'Only exact C4 palette SHA and size may bridge old package guards');
 return {...record,sha256:hash(original),bytes:Buffer.byteLength(original)};
}
function packageDelta(before,after){before=require('./paint-scope.cjs').normalizePackage(before);after=require('./paint-scope.cjs').normalizePackage(after);const rows=[before,after].map(p=>p.manifest.resources.find(r=>r.path===file));rows.forEach(r=>{A.ok(r,'Palette resource required');normalizePackageResource(r);});return rows[0].bytes-rows[1].bytes;}
module.exports={base,file,generator,original,candidate,pairs,generatorBefore,generatorAfter,restore,normalizePackageResource,packageDelta};
