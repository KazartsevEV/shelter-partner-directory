'use strict';
// Historical byte comparisons only. Not imported by the shipping application.
const A=require('node:assert/strict'),{createHash}=require('node:crypto'),{execFileSync}=require('node:child_process'),path=require('node:path');
const file='assets/nomad360-help.js',base='6e3810befffb4f50767d879fd3715cecce2096a7';
const after='fb7ccd2f4b4312f55e19a94259cc9dca8846a8b16da82ca4d0d35a1a2e8350f7';
const digest=s=>createHash('sha256').update(s).digest('hex');
let accepted;
function original(){return accepted||(accepted=execFileSync('git',['show',base+':'+file],{cwd:path.resolve(__dirname,'../..')}));}
function restore(name,source){
 if(name!==file)return source;
 const old=original();if(digest(source)===digest(old))return source;
 A.equal(digest(source),after,'Only the exact R4 Help link addition is approved');
 return Buffer.isBuffer(source)?Buffer.from(old):old.toString('utf8');
}
module.exports={file,base,after,restore};
