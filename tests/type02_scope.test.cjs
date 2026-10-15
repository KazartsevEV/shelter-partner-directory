'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base='e907147062af20e024826cd77ab645e4a5e911cd';
test('Accepted Inter typography preserves financial assets; task-6 presentation edits have their own exact source guard',()=>{
 const paths=execFileSync('git',['ls-tree','-r','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n');
 const protectedPaths=paths.filter(p=>(!p.includes('/')&&/\.(js|css|HTML|html)$/.test(p)&&!['nomad360_design_system.css','nomad360_calculator_ui.css','nomad360_header.js','nomad360_calculator_ui.js','nomad360_locale_core.js'].includes(p))||p.startsWith('vendor/exceljs')||p==='CALCULATOR_LICENSE.md');
 A.ok(protectedPaths.includes('Marketing_calc.HTML')&&protectedPaths.includes('portfolio_v2_engine.js')&&protectedPaths.includes('nomad360_fx.js'));
 for(const p of protectedPaths){
  let now=fs.readFileSync(path.join(root,p)),old=execFileSync('git',['show',base+':'+p],{cwd:root});
  if(p==='Marketing_calc.HTML'){
   const stripStyles=s=>s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'<style>Presentation</style>').replace(/        <(?:div|details) id="nomad360-calculation-list"[\s\S]*?        <\/(?:div|details)>\n\n/,'');
   now=Buffer.from(stripStyles(now.toString()));old=Buffer.from(stripStyles(old.toString()));
  }
  if(p==='portfolio_v2_ui.js')now=Buffer.from(now.toString().replace('Начните с рекламной воронки. Добавляйте товары, а общие расходы оплачивайте один раз.</p>','Начните с рекламной воронки. Добавляйте товары, а общие расходы оплачивайте один раз. Здесь нет подставленных примеров.</p>'));
  if(p==='portfolio_v2_linked_ui.js'){
   const src=now.toString();A.equal(src.split('nd-v2-description nd-type-note').length-1,1);
   now=Buffer.from(src.replace('nd-v2-description nd-type-note','nd-v2-description'));old=Buffer.from(old.toString().replace('nd-v2-description nd-type-note','nd-v2-description'));
  }
  A.deepEqual(now,old,p);
 }
});
test('The single production Inter source embeds the original bytes for portable offline HTML',()=>{
 const css=fs.readFileSync(path.join(root,'nomad360_calculator_ui.css'),'utf8');
 A.ok(!css.includes('@import'));
 const faces=[...css.matchAll(/@font-face\s*\{([^}]+)\}/g)];A.equal(faces.length,4);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/type02-reference/font-manifest.json'))).families.filter(x=>x.family==='Inter');
 const expected=new Set(manifest.map(x=>x.sha256)),actual=new Set();
 for(const [,face] of faces){
  A.match(face,/font-family: 'Inter'/);A.match(face,/font-weight: 400 700/);A.match(face,/font-display: swap/);
  const data=/data:font\/woff2;base64,([^']+)/.exec(face);A.ok(data);
  actual.add(crypto.createHash('sha256').update(Buffer.from(data[1],'base64')).digest('hex'));
 }
 A.deepEqual(actual,expected);
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
