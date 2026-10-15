'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{stripReturn}=require('./helpers/return-contract.cjs');
const root=path.resolve(__dirname,'..'),base='5cd1e5e1bfb1b15087a29b1806424aa91dee2f12',before=f=>execFileSync('git',['show',base+':'+f],{cwd:root,maxBuffer:8*1024*1024,encoding:'utf8'});
test('All existing application files stay exact outside the five authorised presentation changes',()=>{
 const files=execFileSync('git',['ls-tree','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/\.(js|css|html)$/i.test(f)||f==='CALCULATOR_LICENSE.md');A.ok(files.includes('portfolio_v2_engine.js')&&files.includes('Marketing_calc.HTML')&&files.includes('nomad360_fx.js'));
 for(const file of files)A.equal(stripReturn(file,fs.readFileSync(path.join(root,file),'utf8')),before(file),file);
 const published=execFileSync('git',['ls-tree','-r','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/^(en\/|license\/|assets\/nomad360-seo\.css$|scripts\/seo\/(build\.py|pages\.json|hero_banner\.css)$)/.test(f));for(const file of published)A.deepEqual(fs.readFileSync(path.join(root,file)),execFileSync('git',['show',base+':'+file],{cwd:root}),file);
 A.deepEqual(fs.readFileSync(path.join(root,'nomad360_wolf_open_circle.png')),execFileSync('git',['show',base+':nomad360_wolf_open_circle.png'],{cwd:root,maxBuffer:4*1024*1024}));
});
test('Every established EN RU KK message retains its accepted meaning',()=>{
 const boot=code=>{const w={};new Function('window','document',code)(w,{readyState:'loading',addEventListener(){}});return w.Nomad360LocaleCore;};const old=boot(before('nomad360_locale_core.js')),now=boot(fs.readFileSync(path.join(root,'nomad360_locale_core.js'),'utf8'));
 for(const key of old.keys())for(const language of ['en','ru','kk'])A.equal(now.t(key,language),old.t(key,language),key+' '+language);
});
test('Manifest identifies the original calculator and uses the unchanged real icon with browser fallback',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'nomad360.webmanifest'),'utf8'));A.equal(manifest.name,'Nomad360 lite');A.equal(manifest.start_url,'/shelter-partner-directory/Marketing_calc.HTML');A.equal(manifest.id,manifest.start_url);A.equal(manifest.scope,'/shelter-partner-directory/');A.equal(manifest.display,'browser');
 const image=fs.readFileSync(path.join(root,'nomad360_wolf_open_circle.png'));A.equal(manifest.icons.length,1);A.equal(manifest.icons[0].sizes,image.readUInt32BE(16)+'x'+image.readUInt32BE(20));A.equal(manifest.icons[0].src,'/shelter-partner-directory/nomad360_wolf_open_circle.png');
});
