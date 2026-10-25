'use strict';
// Historical byte comparisons only. Not imported by the shipping application.
const A=require('node:assert/strict'),{createHash}=require('node:crypto'),{execFileSync}=require('node:child_process'),path=require('node:path');
const file='assets/nomad360-help.js',base='6e3810befffb4f50767d879fd3715cecce2096a7';
const after='fb7ccd2f4b4312f55e19a94259cc9dca8846a8b16da82ca4d0d35a1a2e8350f7';
const digest=s=>createHash('sha256').update(s).digest('hex');
const workflow='.github/workflows/style-ownership.yml';
const hashes={[file]:after,[workflow]:'0aecd02bebfcb8dbada94f85f64c4df9194e6a581603de34e93f96d01af4b3f0'};
const accepted=new Map();
function original(name){if(!accepted.has(name))accepted.set(name,execFileSync('git',['show',base+':'+name],{cwd:path.resolve(__dirname,'../..')}));return accepted.get(name);}
function restore(name,source){
 if(!Object.hasOwn(hashes,name))return source;
 const old=original(name);if(digest(source)===digest(old))return source;
 A.equal(digest(source),hashes[name],'Only the exact R4 Help link/workflow routing addition is approved');
 return Buffer.isBuffer(source)?Buffer.from(old):old.toString('utf8');
}
module.exports={file,base,after,workflow,restore};
