'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base='40c792ef06e754ea2ce44f64e68f717f27e8cdb7',read=f=>fs.readFileSync(path.join(root,f),'utf8'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
// Task 09 was merged after the banner baseline. Its approved support assets must survive;
// normalize only the two exact widget loader tags when comparing to the historical main.
const normalize=(name,source)=>{
 if(name==='nomad360_calculator_ui.css')return source.split('\n/* UNIFIED-BANNERS-01: scoped presentation;')[0];
 let value=require('./helpers/unified-banners-contract.cjs').stripBanners(name,source);
 if(name==='Marketing_calc.HTML')value=require('./helpers/task09-html-scope.cjs').stripTask09Html(value);
 return value;
};
test('every accepted production source stays byte-exact outside reviewed presentation hunks',()=>{
 const m=JSON.parse(read('docs/reviews/unified-banners-01/baseline/source-sha256.json'));A.equal(m.source,base);
 for(const [name,want] of Object.entries(m.files)){
  let current=read(name);
  current=normalize(name,current);
  A.equal(sha(current),want,name+' changed beyond presentation');
 }
});
test('reviewed presentation fixture reproduces exact main and does not normalize arbitrary edits',()=>{
 const edits=require('./fixtures/unified-banners/presentation-edits.json');
 for(const name of Object.keys(edits)){
  const old=execFileSync('git',['show',base+':'+name],{cwd:root,encoding:'utf8',maxBuffer:8e6});
  A.equal(normalize(name,read(name)),old);
  A.notEqual(normalize(name,read(name)+'/* unapproved */'),old);
 }
});
test('new banner module owns only DOM presentation and uses accepted translations',()=>{
 const s=read('nomad360_banners.js');
 A.doesNotMatch(s,/localStorage|sessionStorage|calculateProduct|PortfolioV2|fetch\(|XMLHttpRequest|\.value\s*=\s*[^c]/);
 A.match(s,/\['en','ru','kk'\]/);A.match(s,/select\.value=chosen/);
 A.match(s,/prefers-reduced-motion/);A.match(s,/nomad360-product-details/);
 for(const name of ['hero','about','support','consulting'])A.ok(fs.statSync(path.join(root,'assets/nomad360-banners/'+name+'.webp')).size>1000);
});

test('banner UI introduces no alternative blue palette',()=>{
 const css=read('nomad360_calculator_ui.css').split('/* UNIFIED-BANNERS-01: scoped presentation;')[1];
 const allowed=new Set(['#16375a','#ed8e63','#f29d76','#fff','#000']);
 for(const color of css.match(/#[0-9a-f]{3,8}\b/gi)||[])A.ok(allowed.has(color.toLowerCase()),'Unapproved UI color: '+color);
 A.match(css,/background:var\(--nb-blue\)/);A.match(css,/background:transparent;border:0;border-top/,'Hero copy has no opaque blue backing');
});

test('pre-change baseline evidence remains identical to its separate capture commit',()=>{
 const basePath='docs/reviews/unified-banners-01/baseline/';
 const files=execFileSync('git',['ls-tree','-r','546dc8b','--',basePath],{cwd:root,encoding:'utf8'}).trim().split('\n');
 A.ok(files.length>490);
 for(const line of files){const [,want,file]=line.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/),bytes=fs.readFileSync(path.join(root,file));
  const actual=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');A.equal(actual,want,file);
 }
});
