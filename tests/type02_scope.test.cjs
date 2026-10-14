'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base='b1cc9b50ae48c3c8f392e4342fb5243c7575bd8e';
test('Stage A preserves every application script, HTML and other styles at the accepted base',()=>{
 const paths=execFileSync('git',['ls-tree','-r','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n');
 const protectedPaths=paths.filter(p=>(!p.includes('/')&&/\.(js|css|HTML|html)$/.test(p)&&p!=='nomad360_design_system.css')||p.startsWith('vendor/exceljs'));
 A.ok(protectedPaths.includes('Marketing_calc.HTML')&&protectedPaths.includes('portfolio_v2_engine.js')&&protectedPaths.includes('nomad360_fx.js'));
 for(const p of protectedPaths)A.deepEqual(fs.readFileSync(path.join(root,p)),execFileSync('git',['show',base+':'+p],{cwd:root}),p);
});
test('Candidate font assets are original OFL files with verified Kazakh coverage and real 400–700 axes',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/type02-reference/font-manifest.json')));
 A.equal(manifest.families.length,8);
 for(const face of manifest.families){
  const bytes=fs.readFileSync(path.join(root,'vendor/fonts/type02',face.file));
  A.equal(crypto.createHash('sha256').update(bytes).digest('hex'),face.sha256,face.file);
  A.ok(face.axes.wght[0]<=400&&face.axes.wght[1]>=700);
 }
 for(const family of ['Inter','IBM Plex Sans']){
  const covered=new Set(manifest.families.filter(f=>f.family===family).map(f=>f.kazakhGlyphs).join(''));
  for(const c of 'ӘәҒғҚқҢңӨөҰұҮүҺһІі')A.ok(covered.has(c),family+': '+c);
 }
 for(const name of ['inter','ibmplexsans'])A.match(fs.readFileSync(path.join(root,'vendor/fonts/type02',name+'-OFL.txt'),'utf8'),/SIL OPEN FONT LICENSE/);
});
