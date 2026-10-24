'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),postcss=require('../scripts/palette/node_modules/postcss'),crypto=require('node:crypto'),oracle=require('./helpers/about-copy-cascade.cjs');
const s=require('./helpers/cleanup-about-copy-scope.cjs'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
test('C5-4 freezes the copy-only removal ranges and retains every unrelated rule and decoration byte',()=>{
 A.equal(fs.readFileSync(s.file,'utf8'),s.candidate);A.equal(s.cssDelta,1346);A.equal(s.receipt.length,21);
 const inventory=text=>{const other=[],owned=[];postcss.parse(text).walkRules(rule=>{const context=[];for(let p=rule.parent;p&&p.type!=='root';p=p.parent)context.unshift('@'+p.name+' '+p.params);(rule.selectors.every(oracle.owned)?owned:other).push({context,text:rule.toString()});});return {other,owned};};const a=inventory(s.original),b=inventory(s.candidate);A.deepEqual(a.other,b.other);A.equal(a.owned.length,27);A.equal(b.owned.length,18);
});
test('independent specificity/media/margin oracle retains all locales, absent/unknown lang, wrapper fallbacks and fractional intervals',()=>{
 const before=oracle.compile(s.original),after=oracle.compile(s.candidate);let count=0;
 for(const width of [320,700,700.5,701,768,1000,1000.5,1001,1280,2560])for(const language of [undefined,'','ru','en','kk','xx'])for(const variant of [{target:'opening'},{target:'opening',pseudo:true},{target:'scene-copy'},{target:'opening',about:false},{target:'opening',scenic:false}]){const config={width,language,...variant};A.deepEqual(oracle.evaluate(before,config),oracle.evaluate(after,config),JSON.stringify(config));count++;}A.equal(count,300);
});
test('negative oracle controls detect lost locale priority, wrong phone offset and altered interval boundaries',()=>{
 const config={width:320,language:'ru'},before=oracle.evaluate(oracle.compile(s.original),config);
 for(const text of [s.candidate.replace('50vw - 75px','50vw - 74px'),s.candidate.replace('html[lang="ru"] #nomad360-information #nomad360-about .nomad-about-scene-copy .nomad-about-opening','html[lang="ru"] .nomad-about-opening')])A.notDeepEqual(oracle.evaluate(oracle.compile(text),config),before);
 const gap={width:1000.5,language:'en'};A.notDeepEqual(oracle.evaluate(oracle.compile(s.candidate.replaceAll('max-width:1000px','max-width:1001px')),gap),oracle.evaluate(oracle.compile(s.original),gap));
});
test('strict source and package fingerprints reject unknown paint, font, source, rhythm and extra bytes',()=>{
 A.equal(s.restore(s.file,s.candidate),s.original);for(const t of [s.candidate+'\n',s.candidate.replace('#173B58','#173B59'),s.candidate.replace('Inter','Arial'),s.candidate.replace('44vw - 72px','44vw - 71px'),s.candidate.replace('640.6px','640.7px'),s.candidate.replace('3200x768.svg','other.svg')])A.throws(()=>s.restore(s.file,t),/C5-4 permits only/);
 const r={path:s.file,bytes:Buffer.byteLength(s.candidate),sha256:hash(s.candidate)};A.throws(()=>s.normalizePackageResource({...r,bytes:r.bytes+1}),/resource SHA/);A.throws(()=>s.normalizePackageResource({...r,sha256:'bad'}),/resource SHA/);
});
test('own bytes are added exactly once through the earlier package contracts',()=>{
 const pack=text=>({manifest:{resources:[{path:s.file,bytes:Buffer.byteLength(text),sha256:hash(text)}]}});A.equal(s.packageDelta(pack(s.original),pack(s.candidate)),1346);A.equal(s.packageDelta(pack(s.candidate),pack(s.candidate)),0);
 A.equal(require('./helpers/cleanup-scene-layout-scope.cjs').packageDelta(pack(s.legacy[3]),pack(s.candidate)),3168+1346);
 A.equal(require('./helpers/cleanup-scene-scope.cjs').packageDelta(pack(s.legacy[2]),pack(s.candidate)),249116+3168+1346);
 A.equal(require('./helpers/cleanup-canvas-scope.cjs').packageDelta(pack(s.legacy[1]),pack(s.candidate)),483+249116+3168+1346);
});
test('all other runtime, assets, fonts, fixtures, existing workflows and earlier tools remain exact',()=>{
 const names=execFileSync('git',['ls-tree','-r','--name-only',s.base],{cwd:s.root,encoding:'utf8'}).trim().split('\n').filter(f=>/^(nomad360_|portfolio_v2_).*\.(js|css)$/.test(f)||['Marketing_calc.HTML','US_Retail_Demo.HTML'].includes(f)||/^(assets\/|vendor\/|tests\/fixtures\/|\.github\/workflows\/|scripts\/palette\/|scripts\/cleanup\/|scripts\/cleanup-logo-mask\/|scripts\/cleanup-about\/|scripts\/cleanup-palette\/|scripts\/cleanup-canvas\/|scripts\/cleanup-scene\/|scripts\/cleanup-scene-layout\/)/.test(f));for(const name of names){const before=execFileSync('git',['show',s.base+':'+name],{cwd:s.root,maxBuffer:24e6});A.deepEqual(s.restore(name,fs.readFileSync(path.join(s.root,name))),before,name);}
});
