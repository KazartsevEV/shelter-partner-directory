'use strict';
const crypto=require('node:crypto');
const {ZipWriter,Uint8ArrayWriter,Uint8ArrayReader}=require('@zip.js/zip.js');
const {normalize,sha256}=require('../config.cjs');

async function encryptBundle(bundle,input,password){
 const config=normalize(input),manifest=bundle?.manifest;
 if(typeof password!=='string'||!/^[A-Za-z0-9_-]{32,128}$/.test(password))throw Error('A generated high-entropy archive password is required');
 const filename=config.packageId+'.html',bytes=Buffer.from(bundle?.html||'','utf8');
 if(bundle?.filename!==filename||manifest?.schemaVersion!==1||
    !/^[a-f0-9]{40}$/.test(manifest?.sourceRevision||'')||
    manifest.packageId!==config.packageId||manifest.packageVersion!==config.packageVersion||
    JSON.stringify(manifest.config)!==JSON.stringify(config)||
    manifest.configSha256!==sha256(JSON.stringify(config))||
    manifest.files?.length!==1||manifest.files[0].path!==filename||
    manifest.files[0].bytes!==bytes.length||manifest.files[0].sha256!==sha256(bytes))throw Error('Package provenance mismatch');
 const names=['nomad360_v1_engine.js','portfolio_v2_engine.js'];
 if(!Array.isArray(manifest.resources)||names.some(name=>!manifest.resources.some(r=>r.path===name&&Number.isSafeInteger(r.bytes)&&r.bytes>0&&/^[a-f0-9]{64}$/.test(r.sha256))))throw Error('Missing engine provenance');
 const output=new Uint8ArrayWriter(),writer=new ZipWriter(output,{useWebWorkers:false,password,encryptionStrength:3,zipCrypto:false});
 try{
  await writer.add(filename,new Uint8ArrayReader(bytes));
  await writer.add(config.packageId+'.manifest.json',new Uint8ArrayReader(Buffer.from(JSON.stringify(manifest,null,2)+'\n')));
  const zip=Buffer.from(await writer.close());
  return {bytes:zip,filename:config.packageId+'-'+config.packageVersion+'.zip',sha256:sha256(zip),encryption:'WinZip AES-256',sourceRevision:manifest.sourceRevision,configSha256:manifest.configSha256};
 }catch(_){throw Error('Encrypted package assembly failed');}
}
const password=()=>crypto.randomBytes(24).toString('base64url');
module.exports={encryptBundle,password};
