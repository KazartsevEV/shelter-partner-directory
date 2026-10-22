'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const manifest=require('../fixtures/v1-engine/extraction.json');
const root=path.resolve(__dirname,'../..');
const digest=value=>createHash('sha256').update(value).digest('hex');
function restore(file,source){
 const expected=manifest.html[file];if(!expected)return source;
 if(digest(source)===expected.before)return source;
 A.equal(digest(source),expected.after,'Unreviewed V1 extraction HTML: '+file);
 A.equal(digest(fs.readFileSync(path.join(root,'nomad360_v1_engine.js'))),manifest.moduleSha256,
  'Unreviewed canonical V1 engine edit');
 const old=execFileSync('git',['show',manifest.base+':'+file],{cwd:root,maxBuffer:2*1024*1024});
 return Buffer.isBuffer(source)?old:old.toString();
}
module.exports={restore,digest,manifest};
