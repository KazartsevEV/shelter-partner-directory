'use strict';
const A=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),m=require('../fixtures/v1-state/extraction.json');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function restore(file,source){source=require('./runner-image-scope.cjs').restore(file,source);source=require('./draft-transfer-scope.cjs').restore(file,source);const bridge=(m.bridges||{})[file];if(bridge){source=require('./tax-notice-copy-scope.cjs').historicalBridge(file,source,bridge.after);if(source.toString()===bridge.before)return source;A.equal(source.toString(),bridge.after,"Only exact approved V1 state bridge: "+file);return Buffer.isBuffer(source)?Buffer.from(bridge.before):bridge.before;}const e=m.files[file];if(!e||!source.includes('src="./nomad360_v1_state.js"'))return source;A.equal(hash(source),e.after,'Unreviewed V1 operations edit: state '+file);let text=source.toString();for(const [before,after]of [...e.replacements].reverse()){A.equal(text.split(after).length,2);text=text.replace(after,before);}A.equal(hash(text),e.before);return Buffer.isBuffer(source)?Buffer.from(text):text;}
const modulePath='nomad360_v1_state.js';
function moduleSource(){const source=fs.readFileSync(path.resolve(__dirname,'../..',modulePath),'utf8');A.equal(hash(source),m.moduleSha256,'Exact C6 module');return source;}
function restoreStandalone(html){
 const open='    <script data-nomad-bundled="./'+modulePath+'">';
 if(!html.includes(open))return html;
 const bundled=open+moduleSource().replace(/<\/script/gi,'<\\/script')+'</script>\n';
 A.equal(html.split(bundled).length,2,'Exact single C6 bundled module');
 html=html.replace(bundled,'');
 for(const [before,after]of [...m.files['Marketing_calc.HTML'].replacements].slice(1).reverse()){
  A.equal(html.split(after).length,2,'Exact C6 packaged handler');html=html.replace(after,before);
 }
 return html;
}
function projectResources(resources){
 const own=resources.filter(r=>r.path===modulePath);if(!own.length)return resources;
 A.equal(own.length,1);A.equal(own[0].sha256,m.moduleSha256);A.equal(own[0].bytes,Buffer.byteLength(moduleSource()));
 const entry=m.files['Marketing_calc.HTML'];let count=0;
 const rows=resources.filter(r=>r.path!==modulePath).map(r=>{
  if(r.path!=='Marketing_calc.HTML')return r;
  count++;A.equal(r.sha256,entry.after,'Exact C6 packaged HTML resource');A.equal(r.bytes,entry.afterBytes);
  return {...r,bytes:entry.beforeBytes,sha256:entry.before};
 });A.equal(count,1);return rows;
}
function packageProjection(p){return {...p,html:restoreStandalone(p.html),manifest:{...p.manifest,resources:projectResources(p.manifest.resources)}};}
function standaloneDelta(){
 const module='    <script data-nomad-bundled="./'+modulePath+'">'+moduleSource().replace(/<\/script/gi,'<\\/script')+'</script>\n';
 return Buffer.byteLength(module)+m.files['Marketing_calc.HTML'].replacements.slice(1).reduce((n,[a,b])=>n+Buffer.byteLength(b)-Buffer.byteLength(a),0);
}
function recordProjection(p){
 const resources=projectResources(p.resources);if(resources===p.resources)return p;
 const key='htmlBytes'in p?'htmlBytes':'bytes';return {...p,[key]:p[key]-standaloneDelta(),resources};
}
module.exports={restore,hash,manifest:m,restoreStandalone,packageProjection,recordProjection,projectResources};
