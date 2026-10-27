'use strict';
const A=require('node:assert/strict'),{createHash}=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const manifest=require('../fixtures/v1-operations/extraction.json');
const digest=value=>createHash('sha256').update(value).digest('hex');
function restore(file,source){
 const seo=require('./seo-r3-compat.cjs');if(seo.isR3Page(file)||['en/help/index.html','ru/help/index.html','kk/help/index.html'].includes(file))source=seo.restore(file,source);
 source=require('./pricing-decision-type-scope.cjs').restore(file,source);
 source=require('./tax-notice-copy-scope.cjs').restore(file,source);
 source=require('./v1-state-scope.cjs').restore(file,source);
 const bridge=(manifest.bridges||{})[file];
 if(bridge){
  source=require('./tax-notice-copy-scope.cjs').historicalBridge(file,source,bridge.after);
  if(source.toString()===bridge.before)return source;
  A.equal(source.toString(),bridge.after,'Only exact approved C6 historical bridge: '+file);
  return Buffer.isBuffer(source)?Buffer.from(bridge.before):bridge.before;
 }
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
const modulePath='nomad360_v1_operations.js';
function moduleSource(){const source=fs.readFileSync(path.resolve(__dirname,'../..',modulePath),'utf8');A.equal(digest(source),manifest.moduleSha256,'Exact C6 module');return source;}
function restoreStandalone(html){
 html=require('./pricing-decision-type-scope.cjs').restoreStandalone(html);
 html=require('./tax-notice-copy-scope.cjs').restoreStandalone(html);
 html=require('./v1-state-scope.cjs').restoreStandalone(html);
 const open='    <script data-nomad-bundled="./'+modulePath+'">';
 if(!html.includes(open))return html;
 const bundled=open+moduleSource().replace(/<\/script/gi,'<\\/script')+'</script>\n';
 A.equal(html.split(bundled).length,2,'Exact single C6 bundled module');
 html=html.replace(bundled,'');
 for(const [before,after]of [...manifest.files['Marketing_calc.HTML'].replacements].slice(1).reverse()){
  A.equal(html.split(after).length,2,'Exact C6 packaged handler');html=html.replace(after,before);
 }
 return html;
}
function projectResources(resources){
 resources=resources.map(require('./pricing-decision-type-scope.cjs').normalizeResource);
 resources=resources.map(require('./tax-notice-copy-scope.cjs').normalizeResource);
 resources=require('./v1-state-scope.cjs').projectResources(resources);
 const own=resources.filter(r=>r.path===modulePath);if(!own.length)return resources;
 A.equal(own.length,1);A.equal(own[0].sha256,manifest.moduleSha256);A.equal(own[0].bytes,Buffer.byteLength(moduleSource()));
 const entry=manifest.files['Marketing_calc.HTML'];let count=0;
 const rows=resources.filter(r=>r.path!==modulePath).map(r=>{
  if(r.path!=='Marketing_calc.HTML')return r;
  count++;A.equal(r.sha256,entry.after,'Exact C6 packaged HTML resource');A.equal(r.bytes,entry.afterBytes);
  return {...r,bytes:entry.beforeBytes,sha256:entry.before};
 });A.equal(count,1);return rows;
}
function packageProjection(p){return {...p,html:restoreStandalone(p.html),manifest:{...p.manifest,resources:projectResources(p.manifest.resources)}};}
function standaloneDelta(){
 const module='    <script data-nomad-bundled="./'+modulePath+'">'+moduleSource().replace(/<\/script/gi,'<\\/script')+'</script>\n';
 return Buffer.byteLength(module)+manifest.files['Marketing_calc.HTML'].replacements.slice(1).reduce((n,[a,b])=>n+Buffer.byteLength(b)-Buffer.byteLength(a),0);
}
function recordProjection(p){
 p=require('./v1-state-scope.cjs').recordProjection(p);
 const resources=projectResources(p.resources);if(resources===p.resources)return p;
 const key='htmlBytes'in p?'htmlBytes':'bytes';return {...p,[key]:p[key]-standaloneDelta(),resources};
}
module.exports={restore,digest,manifest,restoreStandalone,packageProjection,recordProjection};
