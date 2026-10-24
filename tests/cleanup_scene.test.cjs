'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),postcss=require('../scripts/palette/node_modules/postcss');
const s=require('./helpers/cleanup-scene-scope.cjs'),root=path.resolve(__dirname,'..'),selector='#nomad360-information.nomad-information::before';
test('C5-2 removes exactly two obsolete image declarations and keeps the canonical source, geometry, masks and assets',()=>{
 A.equal(require('./helpers/cleanup-scene-layout-scope.cjs').restore(s.file,fs.readFileSync(s.file,'utf8')),s.candidate);A.equal(s.cssDelta,170);
 const images=text=>{const rows=[];postcss.parse(text).walkDecls('background-image',d=>{if(d.parent.selector===selector)rows.push(d.value);});return rows;};
 A.equal(images(s.original).length,3);A.deepEqual(images(s.candidate),['url("./assets/nomad360-banners/about-moonlight-horizontal-only-3200x768.svg")']);
 const strip=text=>{const t=postcss.parse(text);t.walkDecls('background-image',d=>{if(d.parent.selector===selector)d.remove();});return t.toString();};A.equal(strip(s.original),strip(s.candidate));
 for(const [name,asset] of s.assets){const b=fs.readFileSync(name);A.equal(b.length,asset.bytes);A.equal(require('crypto').createHash('sha256').update(b).digest('hex'),asset.sha256);}
});
test('C5-2 rejects unrelated widths, masks, image replacement, extra bytes and unconfirmed historical assets',()=>{
 A.equal(s.restore(s.file,s.candidate),s.original);A.deepEqual(s.restore(s.file,Buffer.from(s.candidate)),Buffer.from(s.original));
 for(const x of [s.candidate+'\n',s.candidate.replace('#173B58','#173B59'),s.candidate.replace('Inter','Arial'),s.candidate.replace('margin-top:28px','margin-top:29px'),s.candidate.replace('3200x768.svg','wrong.svg')])A.throws(()=>s.restore(s.file,x),/C5-2 permits only/);
 for(const a of s.assets.values()){A.equal(s.keepResource(a),false);A.throws(()=>s.keepResource({...a,bytes:a.bytes+1}),/Historical image size/);A.throws(()=>s.keepResource({...a,sha256:'bad'}),/Historical image SHA/);}
 A.equal(s.keepResource({path:'other.js',bytes:1}),true);
});
test('raw and expanded HTML deltas are independently bound to the original image bytes and legacy baselines',()=>{
 const hash=b=>require('crypto').createHash('sha256').update(b).digest('hex'),record=t=>({path:s.file,bytes:Buffer.byteLength(t),sha256:hash(t)}),pack=t=>({manifest:{resources:[record(t)]}});
 A.equal(s.htmlDelta,249116);A.equal(s.extraInline,s.htmlDelta-s.cssDelta);A.equal(s.packageDelta(pack(s.original),pack(s.candidate)),s.htmlDelta);A.equal(s.packageDelta(pack(s.legacy[0]),pack(s.candidate)),s.htmlDelta);A.equal(s.packageDelta(pack(s.candidate),pack(s.candidate)),0);
 A.deepEqual(s.normalizePackageResource(record(s.candidate)),record(s.original));A.throws(()=>s.normalizePackageResource({...record(s.candidate),bytes:1}),/Only exact C3/);
 A.equal(require('./helpers/cleanup-canvas-scope.cjs').packageDelta(pack(s.legacy[1]),pack(s.candidate)),483+s.htmlDelta,'Earlier canvas delta plus expanded scene delta once');
 A.equal(require('./helpers/cleanup-about-scope.cjs').packageDelta(pack(s.legacy[0]),pack(s.candidate)),360+483+s.htmlDelta,'Earlier C3/canvas/scene deltas once');
});
test('all other runtime, source images, fonts, fixtures and existing workflows stay exact; old comparators have only exact bridges',()=>{
 const names=execFileSync('git',['ls-tree','-r','--name-only',s.base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/^(nomad360_|portfolio_v2_).*\.(js|css)$/.test(f)||['Marketing_calc.HTML','US_Retail_Demo.HTML'].includes(f)||/^(assets\/|vendor\/|tests\/fixtures\/|\.github\/workflows\/|scripts\/palette\/|scripts\/cleanup\/|scripts\/cleanup-logo-mask\/|scripts\/cleanup-about\/|scripts\/cleanup-palette\/|scripts\/cleanup-canvas\/)/.test(f));
 for(const name of names){const before=execFileSync('git',['show',s.base+':'+name],{cwd:root,maxBuffer:24e6});A.deepEqual(s.restore(name,fs.readFileSync(path.join(root,name))),before,name);}
});
