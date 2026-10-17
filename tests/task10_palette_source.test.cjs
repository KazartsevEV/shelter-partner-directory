'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process'),postcss=require('postcss');
const root=path.resolve(__dirname,'..'),base=require('./fixtures/task10-palette/base.json');
const calculatorLink='    <link rel="stylesheet" href="./nomad360_palette.css">\n';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
test('Task10: every established JS/engine, original CSS, logo and calculator byte is unchanged except the single passive stylesheet loader',()=>{
 for(const [file,hash] of Object.entries(base.hashes)){let b=fs.readFileSync(path.join(root,file));if(file==='Marketing_calc.HTML'){const s=b.toString();A.equal(s.split(calculatorLink).length,2);A.ok(s.includes(calculatorLink+'</head>'));b=Buffer.from(require('./helpers/seo-html-contract.cjs').stripLiveStudy(s.replace(calculatorLink,'')));}A.equal(digest(b),hash,file);}
});
test('Task10: static-page text, links, SEO metadata, locale and legal content remain byte-exact',()=>{
 for(const dir of ['en','license']){const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name==='index.html'?[path.join(d,e.name)]:[]);for(const f of walk(path.join(root,dir))){const file=path.relative(root,f),now=fs.readFileSync(f,'utf8'),font=now.split('\n').find(l=>l.includes('rel="stylesheet"')&&l.includes('nomad360_static_fonts.css')),line=now.split('\n').find(l=>l.includes('rel="stylesheet"')&&l.includes('nomad360_palette.css'));A.ok(line,file);A.equal(now.split(line+'\n').length,2,file);const comparison=file.startsWith('license/')?execFileSync('git',['show','cd80f877f20dde9d276683c83b99c6a9455dea5d:'+file],{cwd:root,encoding:'utf8'}):execFileSync('git',['show',base.source+':'+file],{cwd:root,encoding:'utf8'});A.equal(file.startsWith('license/')?now:now.replace(line+'\n','').replace(font+'\n',''),comparison,file);}}
});
test('Task10: generated stylesheet contains exactly the four approved paints, no transparent painted tints or invented font',()=>{
 const css=fs.readFileSync(path.join(root,'nomad360_palette.css'),'utf8'),approved=new Set(['#173b58','#ffffff','#ff913f','#38678b']);
 const colors=new Set();postcss.parse(css).walkDecls(d=>{for(const c of d.value.match(/#[\da-f]{3,8}\b/gi)||[]){A.ok(approved.has(c.toLowerCase()),d.toString());colors.add(c.toLowerCase());}A.doesNotMatch(d.value,/rgba?\(|hsla?\(|color-mix\(|linear-gradient\(/,d.toString());if(d.prop==='font-family')A.match(d.value,/^'?Inter/);});A.deepEqual(colors,approved);
});
module.exports={calculatorLink};
