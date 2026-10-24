'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),postcss=require('../scripts/palette/node_modules/postcss');
const s=require('./helpers/cleanup-canvas-scope.cjs'),root=path.resolve(__dirname,'..'),selector='#nomad360-information.nomad-information';
test('C5-1 has one canonical width/overflow owner and one mobile top margin, preserving all paint and artwork',()=>{
 A.equal(require('./helpers/cleanup-scene-scope.cjs').restore(s.file,fs.readFileSync(s.file,'utf8')),s.candidate);A.equal(Buffer.byteLength(s.original)-Buffer.byteLength(s.candidate),483);
 const rules=text=>{const rows=[];postcss.parse(text).walkRules(r=>{if(r.selector===selector)rows.push(r);});return rows;};
 const after=rules(s.candidate);A.equal(after.length,3,'semantic root, canonical geometry, mobile top margin');
 const sizeRules=after.filter(r=>r.nodes.some(d=>d.prop==='width'));A.equal(sizeRules.length,1);A.equal(sizeRules[0].parent.type,'root');
 const width=sizeRules[0].nodes.find(d=>d.prop==='width');A.equal(width.value,'var(--nomad-about-viewport-width,100vw)');
 const mobile=after.find(r=>r.parent.params==='(max-width:700px)');A.deepEqual(mobile.nodes.map(d=>[d.prop,d.value]),[['margin-top','28px']]);
 const unchanged=text=>{const tree=postcss.parse(text);tree.walkRules(r=>{if(r.selector===selector){for(const d of [...r.nodes])if(['overflow','box-sizing','min-width','max-width','width','margin','margin-top','margin-left'].includes(d.prop))d.remove();if(!r.nodes.length)r.remove();}});return tree.toString().replace(/\s+/g,'');};
 A.equal(unchanged(s.original),unchanged(s.candidate),'All other component rules, colours, pseudo scenery and fonts remain exact');
 const wrappers=t=>{const a=[];postcss.parse(t).walkAtRules(n=>a.push([n.name,n.params]));return a;};A.deepEqual(wrappers(s.original),wrappers(s.candidate));
});
test('C5-1 exact scope rejects unknown width, breakpoint, margin, font, colour and source changes',()=>{
 A.equal(s.restore(s.file,s.candidate),s.original);A.deepEqual(s.restore(s.file,Buffer.from(s.candidate)),Buffer.from(s.original));
 for(const source of [s.candidate+'\n',s.candidate.replace('margin-top:28px','margin-top:29px'),s.candidate.replace('max-width:700px','max-width:701px'),s.candidate.replace('max-width:none','max-width:440px'),s.candidate.replace('#173B58','#173B59'),s.candidate.replace('Inter','Arial'),s.candidate.replace('about-moonlight-horizontal-only-3200x768.svg','other.svg')])A.throws(()=>s.restore(s.file,source),/C5-1 permits only/);
 A.equal(s.restore('other.js','unchanged'),'unchanged');A.equal(s.restore(s.file,s.legacy),s.legacy,'Historical C3 source remains exact, not rewritten');
});
test('package bridges count only inherited C5 bytes, not the older C3 delta',()=>{
 const hash=x=>require('crypto').createHash('sha256').update(x).digest('hex'),record=t=>({path:s.file,bytes:Buffer.byteLength(t),sha256:hash(t)}),pack=t=>({manifest:{resources:[record(t)]}});
 A.equal(s.packageDelta(pack(s.original),pack(s.candidate)),483);A.equal(s.packageDelta(pack(s.legacy),pack(s.candidate)),483);A.equal(s.packageDelta(pack(s.candidate),pack(s.candidate)),0);
 A.deepEqual(s.normalizePackageResource(record(s.candidate)),record(s.original));A.deepEqual(s.normalizePackageResource(record(s.legacy)),record(s.legacy));
 A.throws(()=>s.normalizePackageResource({...record(s.candidate),bytes:1}),/resource SHA/);A.throws(()=>s.normalizePackageResource(record(s.candidate+' ')),/resource SHA/);A.throws(()=>s.packageDelta({manifest:{resources:[]}},pack(s.candidate)),/About resource required/);
 A.equal(require('./helpers/cleanup-about-scope.cjs').packageDelta(pack(s.legacy),pack(s.candidate)),843,'C3 actual About delta includes 360+483 once');
});
test('all other runtime, assets, fixtures, generator and existing workflows stay exact; inherited tools have only exact bridges',()=>{
 const names=execFileSync('git',['ls-tree','-r','--name-only',s.base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/^(nomad360_|portfolio_v2_).*\.(js|css)$/.test(f)||['Marketing_calc.HTML','US_Retail_Demo.HTML'].includes(f)||/^(assets\/|vendor\/|tests\/fixtures\/|\.github\/workflows\/|scripts\/palette\/|scripts\/cleanup\/|scripts\/cleanup-logo-mask\/|scripts\/cleanup-about\/|scripts\/cleanup-palette\/)/.test(f));
 for(const file of names){const before=execFileSync('git',['show',s.base+':'+file],{cwd:root,maxBuffer:24e6});A.deepEqual(s.restore(file,fs.readFileSync(path.join(root,file))),before,file);}
});
