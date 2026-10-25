'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const policy=require('../scripts/partners/release-policy.cjs'),model=require('../scripts/partners/release-preview/model.js');
const {startPreview}=require('../scripts/partners/release-preview/server.cjs'),copy=require('../scripts/partners/release-preview/copy.json');
const preview={schemaVersion:1,mode:'preview',issuanceEnabled:false};
test('default and explicit legacy leave issuance off; malformed or live config fails closed',()=>{
 A.deepEqual(policy.normalize(),policy.legacy);
 A.deepEqual(policy.normalize({...policy.legacy}),policy.legacy);
 A.deepEqual(policy.normalize(preview),preview);
 for(const value of [null,[],{},true,{...preview,mode:'production'},{...preview,mode:'PREVIEW'},{...preview,issuanceEnabled:true},{...preview,schemaVersion:2},{...preview,endpoint:'https://example.org'},{...preview,mode:undefined}])A.throws(()=>policy.normalize(value));
 A.equal(Object.isFrozen(policy.normalize(preview)),true);
});
test('registration without company or website remains separate from mail and archive stages',()=>{
 let state=model.initial();const initial=state;
 A.throws(()=>model.advance(state,{type:'deliveryAccepted',accepted:true}));
 A.throws(()=>model.advance(state,{type:'applicationAccepted',accepted:false}));
 state=model.advance(state,{type:'applicationAccepted',accepted:true,hasWebsite:false,email:'DO-NOT-RETAIN',password:'DO-NOT-RETAIN'});
 A.deepEqual(state,{phase:'applicationAccepted',hasWebsite:false,emailVerified:false});
 A.equal(initial.phase,'idle');A.equal(Object.isFrozen(state),true);
 for(const type of ['verificationAccepted','emailVerified','preparing','archiveReady'])state=model.advance(state,{type,accepted:true});
 A.equal(state.emailVerified,true);A.equal(state.hasWebsite,false);
 A.throws(()=>model.advance(state,{type:'deliveryAccepted'}));
 state=model.advance(state,{type:'deliveryUnknown'});
 A.throws(()=>model.advance(state,{type:'preparing'}),'Unknown delivery must not trigger an automatic rebuild/send');
 state=model.advance(state,{type:'deliveryAccepted',accepted:true});
 A.equal(state.phase,'deliveryAccepted');A.throws(()=>model.advance(state,{type:'deliveryAccepted',accepted:true}));
 A.deepEqual(Object.keys(state).sort(),['emailVerified','hasWebsite','phase']);
});
test('expired confirmation requires explicit new confirmation and cannot verify directly',()=>{
 let state=model.initial();
 for(const type of ['applicationAccepted','verificationAccepted','expiredConfirmation'])state=model.advance(state,{type,accepted:true});
 A.equal(state.emailVerified,false);A.throws(()=>model.advance(state,{type:'emailVerified'}));
 state=model.advance(state,{type:'verificationAccepted',accepted:true});
 state=model.advance(state,{type:'emailVerified'});A.equal(state.emailVerified,true);
});
test('EN RU KK have the same nonempty state/copy matrix and tested site scenario',()=>{
 A.deepEqual(Object.keys(copy),['en','ru','kk']);
 for(const value of Object.values(copy)){
  A.deepEqual(Object.keys(value).sort(),Object.keys(copy.en).sort());
  for(const phase of model.phases)A.equal(typeof value[phase],'string');
  for(const text of Object.values(value))A.ok(typeof text==='string'?text.trim().length>0:Array.isArray(text)&&text.length===3&&text.every(x=>typeof x==='string'&&x.trim()));
 }
 const css=fs.readFileSync('scripts/partners/release-preview/style.css','utf8');
 for(const color of css.match(/#[\da-f]{3,8}\b/gi)||[])A.ok(['#173b58','#ffffff','#ff913f','#38678b'].includes(color.toLowerCase()),color);
});
test('CLI legacy starts no preview; invalid configuration diagnostics never echo file content',()=>{
 const os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nomad-release-policy-')),file=path.join(dir,'config.json');
 try{
  fs.writeFileSync(file,JSON.stringify(policy.legacy));
  const legacy=spawnSync(process.execPath,['scripts/partners/release-preview/server.cjs','--config',file],{encoding:'utf8',timeout:5000});
  A.equal(legacy.status,0);A.match(legacy.stdout,/RELEASE_LEGACY/);A.doesNotMatch(legacy.stdout,/http:/);
  fs.writeFileSync(file,'DO-NOT-ECHO-PRIVATE-CONTENT');
  const invalid=spawnSync(process.execPath,['scripts/partners/release-preview/server.cjs','--config',file],{encoding:'utf8',timeout:5000});
  A.equal(invalid.status,1);A.match(invalid.stderr,/RELEASE_PREVIEW_FAILED/);A.doesNotMatch(invalid.stdout+invalid.stderr,/DO-NOT-ECHO/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('preview server requires explicit config, allows only local preview assets and never accepts POST',async()=>{
 await A.rejects(startPreview(),/Explicit preview/);
 const {server,url}=await startPreview(preview),base=new URL(url).origin;
 try{
  const response=await fetch(url);A.equal(response.status,200);
  A.match(response.headers.get('content-security-policy'),/connect-src 'none'; form-action 'none'/);
  A.match(response.headers.get('x-robots-tag'),/noindex/);A.equal(response.headers.get('cache-control'),'no-store');
  const html=await response.text();A.match(html,/data-nomad-release-preview/);A.doesNotMatch(html,/nomad360_partner_transport\.js/);
  for(const pathname of ['/scripts/partners/issuance/operator.cjs','/scripts/partners/config.cjs','/.git/config','/Marketing_calc.HTML','/preview/fr/','/package.json'])A.equal((await fetch(base+pathname)).status,404,pathname);
  A.equal((await fetch(url,{method:'POST',body:'do not send'})).status,405);
  const wrongHost=await new Promise((resolve,reject)=>require('node:http').get(url,{headers:{Host:'untrusted.example'}},response=>{response.resume();response.on('end',()=>resolve(response.statusCode));}).on('error',reject));
  A.equal(wrongHost,403);
  A.equal((await fetch(base+'/preview/ru/?issuanceEnabled=true')).status,200); // Query cannot select live mode.
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('public runtime, licence, Help, financial modules and real form remain identical to accepted base',()=>{
 const base='6e3810befffb4f50767d879fd3715cecce2096a7';
 const files=execFileSync('git',['ls-tree','-r','--name-only',base],{encoding:'utf8'}).split('\n').filter(name=>name&&!name.includes('/')&&/\.(?:js|css|html)$/i.test(name)||/^(?:en|ru|kk|license)\//.test(name));
 A.ok(files.includes('nomad360_v1_state.js')&&files.includes('nomad360_v1_operations.js'),'Accepted C6 financial modules remain in frozen public scope');
 for(const name of files)A.deepEqual(fs.readFileSync(name),execFileSync('git',['show',base+':'+name],{maxBuffer:20*1024*1024}),name);
 for(const name of ['scripts/partners/release-preview/model.js','scripts/partners/release-preview/app.js']){
  const source=fs.readFileSync(name,'utf8');A.doesNotMatch(source,/\b(?:localStorage|sessionStorage|XMLHttpRequest|sendBeacon)\b|\bfetch\s*\(|document\.cookie/,name);
 }
});
