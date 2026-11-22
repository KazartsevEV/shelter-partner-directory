'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),before='5ede24e538b044f320ff5f211bb397e8f86de46c';
const topics=new Set(['index.html','business-idea/index.html','pricing/index.html','cash-flow/index.html','for-consultants/index.html']);
const isR3Page=name=>['en','ru','kk'].some(l=>name.startsWith(l+'/')&&topics.has(name.slice(l.length+1)));
const isNewPage=name=>isR3Page(name)&&!name.startsWith('en/');
let generated;
function outputs(){return generated||(generated=require('../../scripts/seo/build_pages.cjs').generate().outputs);}
function verify(name,content){A.ok(isR3Page(name),'Only 15 approved SEO paths eligible');const expected=outputs()[name];A.ok(expected,'Expected generated page '+name);A.equal(content.toString(),expected,'SEO R3 must match shared renderer: '+name);A.equal((expected.match(/rel="canonical"/g)||[]).length,1);A.equal((expected.match(/hreflang="/g)||[]).length,3);return true;}
const helpIndexBase='7dfc0d6b5552feca059bebcbf2c9c5ace59c044a';
function restoreAcceptedHelp(name,content){
 const locale=name.split('/')[0],current=content.toString('utf8');
 const old=execFileSync('git',['show',helpIndexBase+':'+name],{cwd:root,maxBuffer:24*1024*1024}).toString('utf8');
 if(current===old)return Buffer.isBuffer(content)?Buffer.from(old):old;
 const comments=old.split('\n').filter(line=>line.startsWith('<!-- DRAFT: '));
 A.equal(comments.length,1,'Exactly one historical HELP-08 draft comment in '+name);
 A.equal(old.split('<meta name="robots" content="noindex,follow">').length,2,'Historical help noindex baseline');
 const newComment='<!-- HELP-SEO-01: owner approved search indexing for the published '+locale.toUpperCase()+' help page, 2026-10-25. -->';
 const approved=old.replace(comments[0],newComment).replace('<meta name="robots" content="noindex,follow">','<meta name="robots" content="index,follow">');
 A.equal(current,approved,'HELP-SEO-01 permits exactly two owner-approved metadata lines: '+name);
 // Normalization applies only to historical byte-exact CSS/partner guards,
 // never to shipping pages or to independent indexability/sitemap checks.
 return Buffer.isBuffer(content)?Buffer.from(old):old;
}
function restore(name,content){
 if(['en/help/index.html','ru/help/index.html','kk/help/index.html'].includes(name))return restoreAcceptedHelp(name,content);
 if(isR3Page(name)){if(isNewPage(name)){verify(name,content);return content;}const old=execFileSync('git',['show',before+':'+name],{cwd:root,maxBuffer:24*1024*1024});if(content.toString()!==old.toString())verify(name,content);return Buffer.isBuffer(content)?old:old.toString();}
 if(name==='scripts/seo/build.py'){A.match(content.toString(),/build_pages\.cjs/);A.ok(fs.readFileSync(path.join(root,'scripts/seo/build_pages.cjs'),'utf8').includes('function generate()'));const old=execFileSync('git',['show',before+':'+name],{cwd:root});return Buffer.isBuffer(content)?old:old.toString();}
 return content;
}
module.exports={isR3Page,isNewPage,verify,restore};
