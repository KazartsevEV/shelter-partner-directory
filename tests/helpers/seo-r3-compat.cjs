'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),before='5ede24e538b044f320ff5f211bb397e8f86de46c';
const topics=new Set(['index.html','business-idea/index.html','pricing/index.html','cash-flow/index.html','for-consultants/index.html']);
const isR3Page=name=>['en','ru','kk'].some(l=>name.startsWith(l+'/')&&topics.has(name.slice(l.length+1)));
const isNewPage=name=>isR3Page(name)&&!name.startsWith('en/');
let generated;
function outputs(){return generated||(generated=require('../../scripts/seo/build_pages.cjs').generate().outputs);}
function verify(name,content){A.ok(isR3Page(name),'Only 15 approved SEO paths eligible');const expected=outputs()[name];A.ok(expected,'Expected generated page '+name);A.equal(content.toString(),expected,'SEO R3 must match shared renderer: '+name);A.equal((expected.match(/rel="canonical"/g)||[]).length,1);A.equal((expected.match(/hreflang="/g)||[]).length,3);return true;}
function restore(name,content){
 if(isR3Page(name)){verify(name,content);if(isNewPage(name))return content;const old=execFileSync('git',['show',before+':'+name],{cwd:root,maxBuffer:24*1024*1024});return Buffer.isBuffer(content)?old:old.toString();}
 if(name==='scripts/seo/build.py'){A.match(content.toString(),/build_pages\.cjs/);A.ok(fs.readFileSync(path.join(root,'scripts/seo/build_pages.cjs'),'utf8').includes('function generate()'));const old=execFileSync('git',['show',before+':'+name],{cwd:root});return Buffer.isBuffer(content)?old:old.toString();}
 return content;
}
module.exports={isR3Page,isNewPage,verify,restore};
