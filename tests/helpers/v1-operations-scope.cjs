'use strict';
const A=require('node:assert/strict'),{createHash}=require('node:crypto');
const manifest=require('../fixtures/v1-operations/extraction.json');
const digest=value=>createHash('sha256').update(value).digest('hex');
function restore(file,source){
 const entry=manifest.files[file];
 if(!entry||!source.includes('    <script src="./nomad360_v1_operations.js"></script>'))return source;
 A.equal(digest(source),entry.after,'Unreviewed V1 operations edit: '+file);
 let text=source.toString();
 for(const [before,after] of [...entry.replacements].reverse()){
  A.equal(text.split(after).length,2,'Non-unique V1 operations boundary: '+file);
  text=text.replace(after,before);
 }
 A.equal(digest(text),entry.before,'Changed outside V1 operations boundary: '+file);
 return Buffer.isBuffer(source)?Buffer.from(text):text;
}
module.exports={restore,digest,manifest};
