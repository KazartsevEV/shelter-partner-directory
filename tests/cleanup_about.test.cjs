'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const s=require('./helpers/cleanup-about-scope.cjs'),root=path.resolve(__dirname,'..'),postcss=require('../scripts/palette/node_modules/postcss');
const rules=(text,selector,media)=>{const rows=[];postcss.parse(text).walkRules(r=>{if(r.selector===selector&&r.parent.name==='media'&&r.parent.params===media)rows.push(r);});return rows;};
const decls=r=>r.nodes.filter(n=>n.type==='decl').map(d=>[d.prop,d.value,!!d.important]);
test('C3 removes the early copies while retaining later rules and all intervening cascade bytes',()=>{
 A.equal(require('./helpers/cleanup-canvas-scope.cjs').restore(s.file,fs.readFileSync(path.join(root,s.file),'utf8')),s.candidate);
 for(const [selector,media,values] of [
  ['#nomad360-information #nomad360-about','(max-width:700px)',[['padding','37px 22px 0',false]]],
  ['#nomad360-information.nomad-information::before','(min-width:1001px)',[['background-size','auto 640.6px',false],['background-position','center top',false],['background-repeat','no-repeat',false]]]
 ]){
  const before=rules(s.original,selector,media).filter(r=>JSON.stringify(decls(r))===JSON.stringify(values));
  const after=rules(s.candidate,selector,media).filter(r=>JSON.stringify(decls(r))===JSON.stringify(values));
  A.equal(before.length,2);A.equal(after.length,1);A.deepEqual(decls(before[0]),decls(before[1]));A.deepEqual(decls(after[0]),values);
 }
 A.equal(Buffer.byteLength(s.original)-Buffer.byteLength(s.candidate),Buffer.byteLength(s.mobile+s.desktop));
 A.equal(postcss.parse(s.original).nodes.filter(n=>n.type==='atrule').length,postcss.parse(s.candidate).nodes.filter(n=>n.type==='atrule').length,'Keep every media/layer wrapper');
});
test('C3 rejects changed colours, fonts, source image, geometry, later-copy deletion and extra bytes',()=>{
 A.equal(s.restore(s.file,s.candidate),s.original);A.deepEqual(s.restore(s.file,Buffer.from(s.candidate)),Buffer.from(s.original));
 for(const source of [s.candidate+'\n',s.candidate.replace('#173B58','#173B59'),s.candidate.replace('Inter','Arial'),s.candidate.replace('padding:37px 22px 0','padding:38px 22px 0'),s.candidate.replace(s.mobile,''),s.candidate.replace('about-moonlight-horizontal-only-3200x768.svg','other.svg')])A.throws(()=>s.restore(s.file,source),/C3 permits only/);
 const late=s.original.lastIndexOf(s.mobile);
 const wrongCopy=(s.original.slice(0,late)+s.original.slice(late+s.mobile.length)).replace(s.desktop,'');
 A.throws(()=>s.restore(s.file,wrongCopy),/C3 permits only/,'Deleting the later copy is not authorized');
 A.equal(s.restore('unrelated.js','untouched'),'untouched');
 const historic=require('./helpers/partner-application-scope.cjs');
 A.deepEqual(historic.restore(s.file,Buffer.from(s.candidate)),historic.restore(s.file,Buffer.from(s.original)));
});
test('the older C2 package guard recognizes only exact inherited C3 bytes and sizes',()=>{
 const hash=value=>require('node:crypto').createHash('sha256').update(value).digest('hex');
 const rows=[s.original,s.candidate].map(text=>({path:s.file,bytes:Buffer.byteLength(text),sha256:hash(text)}));
 A.deepEqual(s.normalizePackageResource(rows[1]),rows[0]);
 A.equal(s.packageDelta(...rows.map(r=>({manifest:{resources:[r]}}))),360);
 for(const row of [{...rows[1],bytes:rows[1].bytes+1},{...rows[1],sha256:hash(s.candidate+'\n')}])A.throws(()=>s.normalizePackageResource(row),/Only exact C3/);
 A.throws(()=>s.packageDelta({manifest:{resources:[]}},{manifest:{resources:[rows[1]]}}),/About resource required/);
 A.deepEqual(s.normalizePackageResource({path:'other.js',bytes:1}),{path:'other.js',bytes:1});
});
test('all other runtime, artwork, fixtures and workflows are exact; older C2 tooling has only the explicit inherited package bridge',()=>{
 const names=execFileSync('git',['ls-tree','-r','--name-only',s.base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/^(?:nomad360_|portfolio_v2_).*\.(?:js|css)$/.test(f)||['Marketing_calc.HTML','US_Retail_Demo.HTML','scripts/palette/build.cjs'].includes(f)||/^(assets\/|vendor\/|tests\/fixtures\/|scripts\/cleanup\/|scripts\/cleanup-logo-mask\/|\.github\/workflows\/)/.test(f));
 for(const file of names){
  let before=execFileSync('git',['show',s.base+':'+file],{cwd:root,maxBuffer:24*1024*1024});
  if(file==='scripts/cleanup-logo-mask/compare.cjs')before=Buffer.from(before.toString()
   .replace("const root=path.resolve(__dirname,'../..')","const inherited=require('../../tests/helpers/cleanup-about-scope.cjs');\nconst root=path.resolve(__dirname,'../..')")
   .replace('filter(r=>r.path!==scope.file).sort','filter(r=>r.path!==scope.file).map(inherited.normalizePackageResource).sort')
   .replace('Buffer.byteLength(scope.removed));','Buffer.byteLength(scope.removed)+inherited.packageDelta(before,after));'));
  A.deepEqual(s.restore(file,fs.readFileSync(path.join(root,file))),before,file);
 }
});
