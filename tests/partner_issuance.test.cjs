'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {ZipReader,Uint8ArrayReader,Uint8ArrayWriter}=require('../scripts/partners/issuance/node_modules/@zip.js/zip.js');
const {normalize,sha256}=require('../scripts/partners/config.cjs'),{encryptBundle,password}=require('../scripts/partners/issuance/archive.cjs');
const {createVault}=require('../scripts/partners/issuance/vault.cjs'),{createFileStore}=require('../scripts/partners/issuance/file-store.cjs'),{createService}=require('../scripts/partners/issuance/service.cjs');
const model=require('../nomad360_partner_application_model.js'),config=require('./fixtures/partner-build/example.json');
const applicationId='12345678-1234-1234-1234-123456789012';
function application(language='en'){
 return model.payload({company:'Example',activity:'Consulting',intendedUse:'Embed calculator',employees:'2',clientSegment:'small',fullName:'Test Partner',role:'Owner',email:'partner@example.org',website:'https://advisory.example',phoneMessenger:'',consentProcessing:true,consentPublicProfile:false},{applicationId,language,consentedAt:'2026-10-23T10:00:00.000Z'});
}
function bundle(){
 const c=normalize(config),html='<!doctype html><title>Тест Қазақ English</title>',filename=c.packageId+'.html';
 return {filename,html,manifest:{schemaVersion:1,packageId:c.packageId,packageVersion:c.packageVersion,sourceRevision:'a'.repeat(40),config:c,configSha256:sha256(JSON.stringify(c)),files:[{path:filename,bytes:Buffer.byteLength(html),sha256:sha256(html)}],resources:['nomad360_v1_engine.js','portfolio_v2_engine.js'].map(name=>({path:name,bytes:100,sha256:'b'.repeat(64)}))}};
}
async function setup(t,{fail=false,language='en'}={}){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'nomad-issuance-'));await fs.chmod(dir,0o700);t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const store=await createFileStore(dir),vault=createVault(crypto.randomBytes(32)),sent=[];let time=new Date('2026-10-23T10:00:00.000Z');
 const mailer={async send(message){sent.push(message);if(fail)throw Error('Provider result unknown');return {accepted:true,id:'message-'+sent.length};}};
 const service=createService({store,vault,mailer,build:async()=>bundle(),now:()=>time});await service.register(application(language),config);
 return {service,store,sent,dir,vault,setTime:value=>{time=new Date(value);}};
}
async function verified(s){await s.service.sendVerification(applicationId);const token=s.sent[0].text.split('\n\n')[1];await s.service.verifyEmail(applicationId,token);return token;}

test('encrypted ZIP protects both entries; invalid password and changed provenance fail',async()=>{
 const input=bundle(),code=password(),archive=await encryptBundle(input,config,code),reader=new ZipReader(new Uint8ArrayReader(archive.bytes),{useWebWorkers:false});
 try{
  const entries=await reader.getEntries();A.equal(entries.length,2);A.ok(entries.every(e=>e.encrypted));
  await A.rejects(entries[0].getData(new Uint8ArrayWriter(),{password:'wrong-password',useWebWorkers:false}));
  const bytes=await entries[0].getData(new Uint8ArrayWriter(),{password:code,useWebWorkers:false});A.equal(Buffer.from(bytes).toString(),input.html);
  A.equal(sha256(archive.bytes),archive.sha256);A.equal(archive.encryption,'WinZip AES-256');
 }finally{await reader.close();}
 await A.rejects(encryptBundle({...input,html:input.html+'x'},config,code),/provenance/);
 await A.rejects(encryptBundle(input,config,'123'),/entropy/);
 const mutated=structuredClone(input);mutated.manifest.config.deployment.origin='https://other.example';await A.rejects(encryptBundle(mutated,config,code),/provenance/);
});
test('vault authenticates issuance/secret binding and never returns ciphertext as plaintext',()=>{
 const vault=createVault(crypto.randomBytes(32)),sealed=vault.seal('private-code','record:archive');
 A.equal(vault.open(sealed,'record:archive'),'private-code');A.ok(!JSON.stringify(sealed).includes('private-code'));
 A.throws(()=>vault.open(sealed,'different-record:archive'),/cannot be opened/);
 A.throws(()=>createVault(Buffer.alloc(3)),/32-byte/);
});
test('private store enforces exclusive transactions, safe paths and private permissions',async t=>{
 const s=await setup(t);A.equal((await fs.stat(s.dir)).mode&0o777,0o700);A.equal((await fs.stat(path.join(s.dir,applicationId+'.json'))).mode&0o777,0o600);
 await A.rejects(s.store.read('../outside'),/Invalid/);
 let release,entered;const started=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
 const first=s.store.transaction(applicationId,async r=>{entered();await gate;return r;});await started;
 await A.rejects(s.store.transaction(applicationId,r=>r),/busy/);release();await first;
 A.equal((await fs.readdir(s.dir)).some(x=>x.endsWith('.lock')),false);
});
test('one-time email confirmation, expiry, attempts and replay are enforced',async t=>{
 const s=await setup(t);await A.rejects(s.service.prepare(applicationId),/transition/);await s.service.sendVerification(applicationId);
 const token=s.sent[0].text.split('\n\n')[1];A.equal(token.length,43);
 await A.rejects(s.service.verifyEmail(applicationId,'bad'),/Invalid/);await s.service.verifyEmail(applicationId,token);
 await A.rejects(s.service.verifyEmail(applicationId,token),/not available/);
 A.equal((await s.store.read(applicationId)).verification.secret,undefined);
});
test('expired and blocked confirmations never unlock a package',async t=>{
 const s=await setup(t);await s.service.sendVerification(applicationId);s.setTime('2026-10-24T10:00:00.000Z');
 await A.rejects(s.service.verifyEmail(applicationId,s.sent[0].text.split('\n\n')[1]),/expired/);A.equal((await s.store.read(applicationId)).status,'verification_expired');
 const blocked=await setup(t);await blocked.service.sendVerification(applicationId);for(let i=0;i<5;i++)await A.rejects(blocked.service.verifyEmail(applicationId,'bad'));
 A.equal((await blocked.store.read(applicationId)).status,'verification_blocked');
});
test('verified email plus exact domain review unlock one unchanged package and one archive mail',async t=>{
 for(const language of ['en','ru','kk']){
  const s=await setup(t,{language});await verified(s);
  await A.rejects(s.service.approve(applicationId,{origin:'https://other.example',reviewReference:'review-1'}),/origin/);
  await s.service.approve(applicationId,{origin:config.deployment.origin,reviewReference:'operator-reviewed-1'});
  await s.service.prepare(applicationId);const ready=await s.store.read(applicationId);A.equal(ready.status,'prepared');
  A.equal(ready.publicProfileConsent,false);A.equal(ready.archive.sourceRevision,'a'.repeat(40));A.equal(ready.archive.encryption,'WinZip AES-256');
  await s.service.sendArchive(applicationId);A.equal(s.sent.length,2);A.equal((await s.store.read(applicationId)).status,'delivery_accepted');
  await A.rejects(s.service.sendArchive(applicationId),/transition/);A.equal(s.sent.length,2);
  A.equal(s.sent[1].attachments[0].bytes.length,ready.archive.bytes);
  const persisted=await fs.readFile(path.join(s.dir,applicationId+'.json'),'utf8');A.ok(!persisted.includes(s.vault.open(ready.archiveSecret,applicationId+':archive')));
 }
});
test('ambiguous provider result cannot be resent or called delivered without reconciliation',async t=>{
 const s=await setup(t,{fail:true});await A.rejects(s.service.sendVerification(applicationId),/not confirmed/);A.equal((await s.store.read(applicationId)).status,'send_unknown');
 await A.rejects(s.service.sendVerification(applicationId),/transition/);A.equal(s.sent.length,1);
 await A.rejects(s.service.reconcile(applicationId,{operationId:applicationId+':archive:v1',messageId:'evidence',outcome:'accepted'}),/mismatch/);
 await s.service.reconcile(applicationId,{operationId:applicationId+':verification:v1',messageId:'actual-provider-id',outcome:'accepted'});
 A.equal((await s.store.read(applicationId)).status,'awaiting_email');
});
test('application ID is immutable and malformed consent cannot enter the issuance registry',async t=>{
 const s=await setup(t);await s.service.register(application(),config);
 await A.rejects(s.service.register({...application(),email:'another@example.org'},config),/conflict/);
 await A.rejects(s.service.register({...application(),consent_processing:false},config),/Invalid/);
 await A.rejects(s.service.register({...application(),consent_version:'unknown'},config),/Invalid/);
});
test('changed encrypted archive is never mailed and cannot silently be rebuilt',async t=>{
 const s=await setup(t);await verified(s);await s.service.approve(applicationId,{origin:config.deployment.origin,reviewReference:'operator-reviewed'});await s.service.prepare(applicationId);
 const ready=await s.store.read(applicationId),file=path.join(s.dir,ready.archive.key),bytes=await fs.readFile(file);bytes[10]^=1;await fs.writeFile(file,bytes);
 await A.rejects(s.service.sendArchive(applicationId),/not confirmed/);A.equal(s.sent.length,1);
 await A.rejects(s.service.prepare(applicationId),/transition/);
});
