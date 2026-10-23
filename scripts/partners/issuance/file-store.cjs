'use strict';
// Single-host operator adapter. Provider-backed production storage is a separate port.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'../../..');
function id(value){if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(value))throw Error('Invalid issuance ID');return value;}
async function createFileStore(directory){
 const resolved=path.resolve(directory);
 await fs.mkdir(resolved,{recursive:true,mode:0o700});
 const root=await fs.realpath(resolved);
 if(root===repo||root.startsWith(repo+path.sep))throw Error('Private issuance storage must be outside the source checkout');
 const stat=await fs.stat(root);if((stat.mode&0o077)!==0)throw Error('Private issuance directory must have mode 0700');
 async function read(name){id(name);try{return JSON.parse(await fs.readFile(path.join(root,name+'.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw Error('Private issuance record cannot be read');}}
 async function transaction(name,update){
  id(name);const lock=path.join(root,name+'.lock');let handle;
  try{handle=await fs.open(lock,'wx',0o600);}catch(e){if(e.code==='EEXIST')throw Error('Issuance record is busy');throw e;}
  let temp;
  try{
   const previous=await read(name),next=await update(previous);
   if(next===undefined)return previous;
   temp=path.join(root,'.'+name+'.'+crypto.randomUUID()+'.tmp');
   const output=await fs.open(temp,'wx',0o600);
   try{await output.writeFile(JSON.stringify(next)+'\n');await output.sync();}finally{await output.close();}
   await fs.rename(temp,path.join(root,name+'.json'));temp=null;
   const dir=await fs.open(root,'r');try{await dir.sync();}finally{await dir.close();}
   return next;
  }finally{if(temp)await fs.unlink(temp).catch(()=>{});await handle.close();await fs.unlink(lock);}
 }
 async function putArchive(name,bytes){
  const filename=id(name)+'.zip',target=path.join(root,filename),temp=path.join(root,'.'+name+'.'+crypto.randomUUID()+'.zip.tmp');
  const file=await fs.open(temp,'wx',0o600);
  try{
   await file.writeFile(bytes);await file.sync();await file.close();
   await fs.link(temp,target); // Exclusive publication of a complete archive.
   const dir=await fs.open(root,'r');try{await dir.sync();}finally{await dir.close();}
   return filename;
  }finally{await file.close().catch(()=>{});await fs.unlink(temp).catch(()=>{});}
 }
 async function getArchive(name){if(typeof name!=='string'||!name.endsWith('.zip'))throw Error('Invalid archive key');id(name.slice(0,-4));return fs.readFile(path.join(root,name));}
 return Object.freeze({read,transaction,putArchive,getArchive});
}
module.exports={createFileStore};
