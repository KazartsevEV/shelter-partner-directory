'use strict';
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {encryptBundle,password}=require('../../scripts/partners/issuance/archive.cjs');
async function roundtrip(bundle,config){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'nomad-encrypted-'));await fs.chmod(dir,0o700);
 try{
  const code=password(),archive=await encryptBundle(bundle,config,code),zip=path.join(dir,'delivery.zip'),expected=path.join(dir,'expected.html'),output=path.join(dir,'extracted.html');
  await fs.writeFile(zip,archive.bytes,{mode:0o600});await fs.writeFile(expected,bundle.html,{mode:0o600});
  const result=JSON.parse(execFileSync(process.env.PARTNER_PYTHON||'python3',[path.join(__dirname,'partner_archive_verify.py'),zip,expected,output,bundle.filename],{input:code,encoding:'utf8',maxBuffer:10000}));
  const html=await fs.readFile(output,'utf8');if(html!==bundle.html)throw Error('Decrypted calculator bytes changed');
  return {html,proof:{...result,zipSha256:archive.sha256,encryption:archive.encryption}};
 }finally{await fs.rm(dir,{recursive:true,force:true});}
}
module.exports={roundtrip};
