'use strict';
const fs=require('node:fs'),path=require('node:path'),A=require('node:assert/strict');
const source=fs.readFileSync(path.resolve(__dirname,'../../nomad360_v1_engine.js'),'utf8');
module.exports=function functionSource(name){
 A.match(name,/^[a-zA-Z]\w*$/);
 const start='// V1-FUNCTION-BEGIN:'+name+'\n',end='\n// V1-FUNCTION-END:'+name;
 const a=source.indexOf(start),b=source.indexOf(end,a);
 A.ok(a>=0&&b>a,'Missing canonical V1 function '+name);
 return source.slice(a+start.length,b);
};
