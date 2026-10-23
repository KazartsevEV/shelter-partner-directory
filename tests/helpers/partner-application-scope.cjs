'use strict';
const A=require('node:assert/strict');
const {createHash}=require('node:crypto');
const manifest=require('../fixtures/partner-application/source.json');
const digest=value=>createHash('sha256').update(value).digest('hex');
function restore(file,source){
 const entry=manifest.files[file];if(!entry)return source;
 if(digest(source)===entry.before||entry.historical.includes(digest(source)))return source;
 A.equal(digest(source),entry.after,'Unreviewed partner application HTML: '+file);
 let text=source.toString();
 for(const [before,after] of entry.replacements){A.equal(text.split(after).length,2,'Partner asset pair must be unique');text=text.replace(after,before);}
 A.equal(digest(text),entry.before,'Changed outside partner asset loaders: '+file);
 return Buffer.isBuffer(source)?Buffer.from(text):text;
}
module.exports={restore,digest,manifest};
