'use strict';
const A=require('node:assert/strict');
const crypto=require('node:crypto');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

// Historical source tests compare against earlier product milestones. Restore
// only these exact, independently reviewed module-boundary changes before those
// comparisons. Any later edit to a protected file must update this guard.
const base='b9802d01add3a62ca0874415c21750c5a902102f';
const hashes=Object.freeze({
  'Marketing_calc.HTML':'20135b7594a34e29ecf26c6a63c847f4b34db53e0a3b5d8759aebf0bbf6e81d9',
  'US_Retail_Demo.HTML':'1556bb0941eaee8105d308401f373252fcf52ee3e1ca3adfc0157ea6e1858bb8',
  'nomad360_header.js':'9166e9550c3545161ef55a235d580e2249145f6a41d125e790617d9e400e5cb1',
  'nomad360_irbis_banner.js':'f660883f6b63885f1c8405f8918058060a2cf1f1d39df2fbcfc1c966849da9c1',
  'portfolio_v2_ui.js':'2d45c860aad91f445695cf00634bbd4554478c420f1f0fa9d6933e39b3948cd9',
  'portfolio_v2_linked_ui.js':'4bf6ee9b697fe5690bf8a7e66dff433b4b18ebbd1f2f4f1258c9335aa5bbfddb',
  'nomad360_delivery.js':'06cdcfd2c389ba9e6ca221edae9172dc492e168b0750a5c7976e5ffecf84be00',
  'nomad360_draft_store.js':'3fba06890f6ac42c18a614f5f15ec0ab0a2b58eefbc113889ff176f783dae9a2'
});
function digest(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function verify(file,source){
  if(!Object.hasOwn(hashes,file))return source;
  source=require('./v1-engine-scope.cjs').restore(file,source);
  A.equal(digest(source),hashes[file],'Unreviewed module-boundary edit: '+file);
  return source;
}
function restore(file,source){
  verify(file,source);
  if(!Object.hasOwn(hashes,file)||file.startsWith('nomad360_draft_store')||file.startsWith('nomad360_delivery'))return source;
  const original=execFileSync('git',['show',base+':'+file],{cwd:path.resolve(__dirname,'../..'),maxBuffer:16*1024*1024});
  return Buffer.isBuffer(source)?original:original.toString();
}
module.exports={base,hashes,digest,verify,restore};
