'use strict';
const A=require('node:assert/strict'),{createHash}=require('node:crypto');
const manifest=require('../fixtures/tax-draft-storage/extraction.json');
const digest=value=>createHash('sha256').update(value).digest('hex');
function restore(file,source){
 source=require('./tax-notice-copy-scope.cjs').restore(file,source);
 source=require('./partner-application-scope.cjs').restore(file,source);
 const entry=manifest.files[file];if(!entry)return source;
 if(digest(source)===entry.before)return source;
 A.equal(digest(source),entry.after,'Unreviewed tax/draft storage edit: '+file);
 let text=source.toString();
 for(const {before,after} of [...entry.replacements].reverse()){
  A.equal(text.split(after).length,2,'Non-unique storage boundary: '+file);
  text=text.replace(after,before);
 }
 A.equal(digest(text),entry.before,'Changed outside tax/draft storage: '+file);
 return Buffer.isBuffer(source)?Buffer.from(text):text;
}
module.exports={manifest,digest,restore};
