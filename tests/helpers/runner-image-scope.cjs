'use strict';
// Historical source comparisons only: supported OS pin, no test/tool changes.
const A=require('node:assert/strict'),{createHash}=require('node:crypto');
const changes=require('../fixtures/runner-image/changes.json');
const hash=v=>createHash('sha256').update(v).digest('hex');
function restore(file,source){
 const rule=changes[file];if(!rule||hash(source)!==rule.afterSha256)return source;
 if(rule.baseRevision){const old=require('node:child_process').execFileSync('git',['show',rule.baseRevision+':'+file],{cwd:require('node:path').resolve(__dirname,'../..'),maxBuffer:2e6});A.equal(hash(old),rule.beforeSha256);return Buffer.isBuffer(source)?old:old.toString();}
 const text=source.toString().replaceAll('runs-on: ubuntu-24.04','runs-on: ubuntu-latest');
 A.equal(hash(text),rule.beforeSha256,'Only exact supported Ubuntu image pin');
 return Buffer.isBuffer(source)?Buffer.from(text):text;
}
function verify(file,source){
 A.ok(file.startsWith('.github/workflows/')&&changes[file]&&!changes[file].baseRevision);
 A.ok([changes[file].beforeSha256,changes[file].afterSha256].includes(hash(source)),'Exact approved workflow bytes');
 A.equal(hash(restore(file,source)),changes[file].beforeSha256);
}
module.exports={restore,verify};
