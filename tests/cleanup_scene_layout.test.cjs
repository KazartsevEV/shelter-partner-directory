'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),postcss=require('../scripts/palette/node_modules/postcss'),crypto=require('node:crypto');
const s=require('./helpers/cleanup-scene-layout-scope.cjs'),targets=new Set(['#nomad360-information.nomad-information::before','#nomad360-information.nomad-information::after']),owned=n=>n.selectors.every(x=>targets.has(x)),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
test('C5-3 frozen decoration consolidation preserves every other selector/declaration/context and the single source URL',()=>{
 A.equal(fs.readFileSync(s.file,'utf8'),s.candidate);A.equal(s.cssDelta,3168);A.equal(s.receipt.length,17);
 const inventory=text=>{const root=postcss.parse(text),other=[],scene=[];root.walkRules(n=>{const context=[];for(let p=n.parent;p&&p.type!=='root';p=p.parent)context.unshift('@'+p.name+' '+p.params);(owned(n)?scene:other).push({context,text:n.toString()});});return {other,scene};};
 const a=inventory(s.original),b=inventory(s.candidate);A.deepEqual(a.other,b.other);A.equal(a.scene.length,19);A.equal(b.scene.length,10);
 A.equal((s.candidate.match(/about-moonlight-horizontal-only-3200x768.svg/g)||[]).length,1);
 A.deepEqual([...new Set(b.scene.flatMap(x=>x.context))].sort(),['@media (max-width:700px)','@media (min-width:701px)','@media (min-width:1001px)','@media (min-width:701px) and (max-width:1000px)'].sort());
});
test('exact scope rejects changed masking, responsive geometry, colours, fonts, source, extra bytes and unknown package fingerprints',()=>{
 A.equal(s.restore(s.file,s.candidate),s.original);A.deepEqual(s.restore(s.file,Buffer.from(s.candidate)),Buffer.from(s.original));
 for(const candidate of [s.candidate+'\n',s.candidate.replace('#173B58','#173B59'),s.candidate.replace('Inter','Arial'),s.candidate.replace('--about-scene-h:50vw','--about-scene-h:51vw'),s.candidate.replace('width:100%','width:99%'),s.candidate.replace('#000 75%','#000 74%'),s.candidate.replace('640.6px','640.7px'),s.candidate.replace('3200x768.svg','wrong.svg')])A.throws(()=>s.restore(s.file,candidate),/C5-3 permits only/);
 const row={path:s.file,sha256:hash(s.candidate),bytes:Buffer.byteLength(s.candidate)};A.throws(()=>s.normalizePackageResource({...row,sha256:'bad'}),/resource SHA/);A.throws(()=>s.normalizePackageResource({...row,bytes:row.bytes+1}),/resource SHA/);
});
test('raw decoration bytes are counted once through scene, canvas and older About package contracts',()=>{
 const pack=text=>({manifest:{resources:[{path:s.file,bytes:Buffer.byteLength(text),sha256:hash(text)}]}});
 A.equal(s.packageDelta(pack(s.original),pack(s.candidate)),3168);A.equal(s.packageDelta(pack(s.legacy[0]),pack(s.candidate)),3168);A.equal(s.packageDelta(pack(s.candidate),pack(s.candidate)),0);
 A.equal(require('./helpers/cleanup-scene-scope.cjs').packageDelta(pack(s.legacy[2]),pack(s.candidate)),249116+3168);
 A.equal(require('./helpers/cleanup-canvas-scope.cjs').packageDelta(pack(s.legacy[1]),pack(s.candidate)),483+249116+3168);
 A.equal(require('./helpers/cleanup-about-scope.cjs').packageDelta(pack(s.legacy[0]),pack(s.candidate)),360+483+249116+3168);
 A.throws(()=>s.packageDelta({manifest:{resources:[]}},pack(s.candidate)),/About resource required/);
});
test('all other runtime, original artwork, fonts, numerical oracles, workflows and older tools stay exact',()=>{
 const names=execFileSync('git',['ls-tree','-r','--name-only',s.base],{cwd:s.root,encoding:'utf8'}).trim().split('\n').filter(f=>/^(nomad360_|portfolio_v2_).*\.(js|css)$/.test(f)||['Marketing_calc.HTML','US_Retail_Demo.HTML'].includes(f)||/^(assets\/|vendor\/|tests\/fixtures\/|\.github\/workflows\/|scripts\/palette\/|scripts\/cleanup\/|scripts\/cleanup-logo-mask\/|scripts\/cleanup-about\/|scripts\/cleanup-palette\/|scripts\/cleanup-canvas\/|scripts\/cleanup-scene\/)/.test(f));
 for(const name of names){const before=execFileSync('git',['show',s.base+':'+name],{cwd:s.root,maxBuffer:24e6});A.deepEqual(s.restore(name,fs.readFileSync(path.join(s.root,name))),before,name);}
});
