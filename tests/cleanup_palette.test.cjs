'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),postcss=require('../scripts/palette/node_modules/postcss');
const s=require('./helpers/cleanup-palette-scope.cjs'),{deduplicate}=require('../scripts/palette/deduplicate.cjs'),root=path.resolve(__dirname,'..');
test('C4 independently matches seven frozen early deletions, keeps layer order, wrappers and declaration bytes',()=>{
 const result=deduplicate(s.original);A.equal(result.css,s.candidate);A.equal(result.removed.length,7);A.equal(s.original.length-s.candidate.length,904);A.equal(require('./helpers/paint-scope.cjs').restore(s.file,fs.readFileSync(s.file,'utf8')),s.candidate);
 const wrappers=css=>{const a=[];postcss.parse(css).walkAtRules(n=>a.push([n.name,n.params]));return a;};A.deepEqual(wrappers(s.original),wrappers(s.candidate));A.equal(deduplicate(s.candidate).css,s.candidate);
 A.equal(require('./helpers/paint-scope.cjs').restore(s.generator,fs.readFileSync(s.generator,'utf8')),s.generatorAfter);
});
test('deduper preserves latest restoration, separate layer/media contexts, important and declaration order',()=>{
 const layer=x=>'@layer nomad360-palette{'+x+'}';
 A.equal(deduplicate(layer('.x{color:white}.x{color:blue}.x{color:white}')).css,layer('.x{color:blue}.x{color:white}'));
 for(const css of [layer('.x{color:white}.x{color:white!important}'),layer('.x{color:white;background:blue}.x{background:blue;color:white}'),layer('@media(max-width:700px){.x{color:white}}@media(max-width:700px){.x{color:white}}'),'@layer a,b;@layer a{.x{color:white}}@layer b{.x{color:white}}','.x{color:white}.x{color:white}'])A.equal(deduplicate(css).css,css);
 A.equal(deduplicate(layer('@media print{.x{color:white}.x{color:white}}')).css,layer('@media print{.x{color:white}}'));
});
test('exact C4 guards reject colours, fonts, latest-copy removal, reordered layers and wrong package hashes',()=>{
 A.equal(s.restore(s.file,s.candidate),s.original);A.equal(s.restore(s.generator,s.generatorAfter),s.generatorBefore);
 for(const css of [s.candidate+'\n',s.candidate.replace('#173B58','#173B59'),s.candidate.replace('Inter','Arial'),s.candidate.replace('@layer nomad360-palette-important,nomad360-palette;','@layer nomad360-palette,nomad360-palette-important;')])A.throws(()=>s.restore(s.file,css),/C4 permits only/);
 const [first,last,length]=s.pairs[0];const late=s.original.slice(0,last)+s.original.slice(last+length);A.throws(()=>s.restore(s.file,late),/C4 permits only/);A.ok(first<last);
 const crypto=require('crypto'),record=text=>({path:s.file,bytes:Buffer.byteLength(text),sha256:crypto.createHash('sha256').update(text).digest('hex')});
 A.deepEqual(s.normalizePackageResource(record(s.candidate)),record(s.original));A.throws(()=>s.normalizePackageResource({...record(s.candidate),bytes:1}),/Only exact C4/);A.throws(()=>s.normalizePackageResource(record(s.candidate+' ')),/Only exact C4/);
});
test('all other runtime, artwork, fixtures, existing workflows and older cleanup tools stay exact except the inherited C3 package bridge',()=>{
 const files=execFileSync('git',['ls-tree','-r','--name-only',s.base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/^(nomad360_|portfolio_v2_).*\.(js|css)$/.test(f)||['Marketing_calc.HTML','US_Retail_Demo.HTML',s.generator].includes(f)||/^(assets\/|vendor\/|tests\/fixtures\/|\.github\/workflows\/|scripts\/cleanup\/|scripts\/cleanup-logo-mask\/|scripts\/cleanup-about\/)/.test(f));
 for(const file of files){let before=execFileSync('git',['show',s.base+':'+file],{cwd:root,maxBuffer:24e6});
  if(file==='scripts/cleanup-about/compare.cjs')before=Buffer.from(before.toString().replace('filter(r=>r.path!==scope.file).sort',"filter(r=>r.path!==scope.file).map(require('../../tests/helpers/cleanup-palette-scope.cjs').normalizePackageResource).sort").replace('),deletedBytes);',"),deletedBytes+require('../../tests/helpers/cleanup-palette-scope.cjs').packageDelta(packages.before,packages.after));"));
  A.deepEqual(s.restore(file,fs.readFileSync(path.join(root,file))),before,file);
 }
});
