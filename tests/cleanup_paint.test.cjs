'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process'),pc=require('../scripts/palette/node_modules/postcss');
const m=require('../scripts/cleanup-paint/model.cjs'),s=require('./helpers/paint-scope.cjs');
const read=(rev,f)=>execFileSync('git',['show',rev+':'+f],{encoding:'utf8',maxBuffer:24e6});
const rules=(css,predicate)=>{const out=[];pc.parse(css).walkRules(r=>{if(predicate(r))out.push(r.toString());});return out;};
const layers=css=>{const a=[];pc.parse(css).walkAtRules('layer',r=>a.push(r.params));return a;};
test('85 source declarations and deterministic generated palette preserve every final winner and every asset URL',()=>{
 let count=0,bytes=0;
 for(const [f,r]of Object.entries(s.sources)){
  A.equal(fs.readFileSync(f,'utf8'),r.after,'Actual candidate must match; no historical projection');A.deepEqual(m.winners(r.before),m.winners(r.after),f);A.deepEqual(layers(r.before),layers(r.after));
  A.deepEqual(r.before.match(/url\([^)]*\)/g),r.after.match(/url\([^)]*\)/g));
  if(f!=='nomad360_palette.css'){const result=m.prune(r.before);A.equal(result.css,r.after);A.deepEqual(result.proof,s.receipt.files[f].proof);count+=result.proof.length;}
  bytes+=Buffer.byteLength(r.before)-Buffer.byteLength(r.after);
 }
 A.equal(count,85);A.equal(bytes,6114);
});
test('shared defaults, browser fallback pairs, importance and conditions cannot be pruned by source mode',()=>{
 for(const css of ['.a,.b{color:red}.a{color:blue}','.a{width:100vw;width:100cqw}.a{width:100%}', '.a{color:red!important}.a{color:blue}', '.a{color:red}@media(min-width:700px){.a{color:blue}}','.a{background:url(./x.webp)}.a{background:none}', '.a{display:-webkit-box}.a{display:flex}', '.a{content:"a"}.a{content:"b"}'])A.equal(m.prune(css).css,css);
 const css='.a,.b{color:red}.a{color:blue}.b{color:white}';A.equal(m.prune(css).proof.length,1);A.deepEqual(m.winners(css),m.winners(m.prune(css).css));
 A.equal(m.prune('.a{color:red;color:blue}').proof.length,0);A.equal(m.prune('.a{color:red;color:blue}',{generated:true}).css,'.a{color:blue}');
});
test('empty first named layer retains creation order after its shadowed declaration is removed',()=>{
 const css='@layer a{.x{color:red}}@layer b{.x{color:white}}@layer a{.x{color:blue}}',after=m.prune(css).css;
 A.deepEqual(layers(css),layers(after));A.ok(after.startsWith('@layer a{}'));A.deepEqual(m.winners(css),m.winners(after));
});
test('375 historic inline-paint rules retain values and order; compatibility catalog remains build-only',()=>{
 const p=s.sources['nomad360_palette.css'];const inline=css=>rules(css,r=>r.selector.startsWith('[style'));
 A.equal(inline(p.before).length,375);A.deepEqual(inline(p.before),inline(p.after));
 const catalog=require('../scripts/palette/inline-paints.json');A.equal(catalog.length,210);A.equal(new Set(catalog).size,210);A.ok(catalog.every(x=>typeof x==='string'&&x.length<=80));
 A.ok(!fs.readFileSync('Marketing_calc.HTML','utf8').includes('inline-paints.json'));
});
test('unknown CSS, changed proof ranges, resource fingerprints and packaged styles fail closed',()=>{
 for(const [f,r]of Object.entries(s.sources)){
  A.equal(s.restore(f,r.after),r.before);A.throws(()=>s.restore(f,r.after+'x'),/exact approved/);A.throws(()=>s.normalizeResource({path:f,bytes:1,sha256:s.hash(r.after)}),/fingerprint/);
  if(f!=='nomad360_palette.css'){const edits=structuredClone(s.receipt.files[f].edits);edits[0].sha256='wrong';A.throws(()=>m.apply(r.before,edits),/Unrecognized/);}
 }
 A.throws(()=>s.restoreStandalone('<html data-nomad-package="x"></html>'),/packaged stylesheet/);
 A.throws(()=>s.restoreStandalone('<style data-nomad-bundled="./nomad360_irbis_banner.css">.bad{color:red}</style>'),/Unknown/);
});
test('raw current census has 31 explained retentions and zero unknown groups',()=>{
 const r=require('../scripts/cleanup-paint/ownership.cjs').capture();A.equal(r.rawBefore,100);A.equal(r.rawAfter,31);A.equal(r.retired,69);A.equal(r.unreviewed,0);A.equal(r.retainedReviewed,31);
 A.equal(r.retained.filter(x=>x.decision.reason==='accepted-page-ownership').length,19);
 for(const x of r.retained.filter(x=>x.decision.reason==='shared-default-with-scoped-override'))A.ok(x.decision.witnesses.length);
});
test('runtime JS, pages, financial oracles, artwork, fonts, packer and all old workflows remain byte-exact',()=>{
 const bridge=require('./fixtures/cleanup-paint/bridges.json');
 const files=execFileSync('git',['ls-tree','-r','--name-only',s.base],{encoding:'utf8'}).trim().split('\n').filter(f=>/^(nomad360_|portfolio_v2_).*\.(js|css)$/.test(f)||/\.html$/i.test(f)||/^(assets\/|vendor\/|tests\/fixtures\/|\.github\/workflows\/|scripts\/partners\/|scripts\/palette\/|scripts\/cleanup|scripts\/style-ownership\/)/.test(f));
 for(const f of files)A.deepEqual(s.restore(f,fs.readFileSync(f)),execFileSync('git',['show',s.base+':'+f],{maxBuffer:24e6}),f);
 for(const [f,r]of Object.entries(bridge)){A.equal(require('./helpers/v1-operations-scope.cjs').restore(f,fs.readFileSync(f,'utf8')),r.after,f);A.equal(read(s.base,f),r.before,f);A.throws(()=>s.restore(f,r.after+' '),/exact approved/);}
});
