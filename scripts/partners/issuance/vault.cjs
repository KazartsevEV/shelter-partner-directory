'use strict';
const crypto=require('node:crypto');
function createVault(key){
 if(!Buffer.isBuffer(key)||key.length!==32)throw Error('Issuance vault requires a private 32-byte key');
 const master=Buffer.from(key);
 return Object.freeze({
  seal(value,binding){
   const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',master,iv);
   cipher.setAAD(Buffer.from(binding));
   const bytes=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
   return {v:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:bytes.toString('base64')};
  },
  open(record,binding){
   try{
    if(record?.v!==1)throw Error();
    const cipher=crypto.createDecipheriv('aes-256-gcm',master,Buffer.from(record.iv,'base64'));
    cipher.setAAD(Buffer.from(binding));cipher.setAuthTag(Buffer.from(record.tag,'base64'));
    return Buffer.concat([cipher.update(Buffer.from(record.data,'base64')),cipher.final()]).toString('utf8');
   }catch(_){throw Error('Issuance secret cannot be opened');}
  }
 });
}
module.exports={createVault};
