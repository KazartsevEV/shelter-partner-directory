'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {base,file,original,candidate,restore}=require('./helpers/cleanup-service-grid-scope.cjs');
const root=path.resolve(__dirname,'..'),postcss=require('../scripts/palette/node_modules/postcss');
test('C1 removes only the early identical unlayered grid declaration; later mobile overrides remain exact',()=>{
 A.equal(fs.readFileSync(path.join(root,file),'utf8'),candidate);
 const selector='body #full-service-screen .nd-full-service-inputs';
 const rules=s=>{const rows=[];postcss.parse(s).walkRules(r=>{if(r.selector===selector)rows.push(r);});return rows;};
 const before=rules(original),after=rules(candidate);A.equal(before.length,2);A.equal(after.length,1);
 const declarations=r=>r.nodes.map(d=>[d.prop,d.value,!!d.important]);
 A.deepEqual(declarations(before[0]),declarations(before[1]));A.deepEqual(declarations(after[0]),declarations(before[1]));
 A.equal(before[0].parent.type,'root');A.equal(before[1].parent.type,'root');
 A.equal(restore(file,candidate),original);
});
test('historical guards retain every CSS byte outside this deletion and reject extra, missing or modified rules',()=>{
 for(const text of [candidate.replace('gap:16px','gap:17px'),candidate+'\n/* unreviewed */',candidate.replace('grid-template-columns:repeat(2,minmax(0,1fr));','')])A.throws(()=>restore(file,text),/C1 permits only/);
 A.deepEqual(restore(file,Buffer.from(candidate)),Buffer.from(original));
 A.equal(require('./helpers/refactor-boundaries-scope.cjs').restore(file,candidate),original);
 A.equal(restore('unrelated.css','kept'),'kept');
});
test('all audited application sources, generated palette, financial oracles and packer remain byte-identical',()=>{
 const names=execFileSync('git',['ls-tree','-r','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/^(?:nomad360_|portfolio_v2_).*\.(?:js|css)$/.test(f)||['Marketing_calc.HTML','US_Retail_Demo.HTML','scripts/palette/build.cjs','scripts/partners/build.cjs'].includes(f)||/^(?:en|ru|kk|license)\/.*\.html$/.test(f)||/^assets\/nomad360-[^/]+\.(?:js|css)$/.test(f)||f.startsWith('tests/fixtures/'));
 for(const name of names){const now=fs.readFileSync(path.join(root,name)),old=execFileSync('git',['show',base+':'+name],{cwd:root,maxBuffer:20*1024*1024});A.deepEqual(name===file?restore(name,now):now,old,name);}
});
