'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),A=require('node:assert/strict'),pc=require('../palette/node_modules/postcss');
const {analyze}=require('../audit/runtime-inventory.cjs');
const base='050bce789259867096d2d312e5b0dbea51454d5d';
const key=g=>JSON.stringify([g.selector,g.context,g.property,g.important]);
function context(rule){const out=[];for(let p=rule.parent;p&&p.type!=='root';p=p.parent)out.unshift('@'+p.name+' '+p.params);return out;}
function classify(group,root,old){
 if(old.has(key(group)))return {reason:'accepted-page-ownership',evidence:'C5-5/C5-7 page-family load topology'};
 const files=[...new Set(group.occurrences.map(o=>o.file))];
 if(files.length>1){A.equal(group.selector,'body');A.ok(['color','background'].includes(group.property));return {reason:'independent-page-and-fallback-resources',files,evidence:'HTML inline fallback, calculator design system and independent legal family must retain their own body defaults'};}
 const file=files[0],rows=[],last=new Map();
 pc.parse(fs.readFileSync(path.join(root,file),'utf8')).walkDecls(d=>{if(d.parent.type!=='rule')return;const rule=d.parent,ctx=context(rule),keys=rule.selectors.map(selector=>JSON.stringify([selector,ctx,d.prop,!!d.important]));const row={d,rule,keys,index:rows.length};rows.push(row);for(const k of keys)last.set(k,row);});
 const matches=rows.filter(r=>r.keys.includes(key(group)));A.ok(matches.length>1,'Every retained group must have its actual declarations');
 if(matches.every(r=>r.rule===matches[0].rule)){
  A.equal(file,'nomad360_consulting_banner.css');A.equal(group.property,'width');A.deepEqual(matches.map(r=>r.d.value),['100vw','100cqw']);return {reason:'inline-feature-fallback',evidence:'Viewport width remains the fallback when container query units are unavailable'};
 }
 const witnesses=[];
 for(const r of matches)for(const selector of r.rule.selectors){const k=JSON.stringify([selector,group.context,group.property,group.important]);if(selector!==group.selector&&last.get(k)?.index===r.index)witnesses.push({selector,line:r.d.source.start.line,value:r.d.value});}
 A.ok(witnesses.length,'Unexplained group: '+group.selector+' / '+group.property);
 return {reason:'shared-default-with-scoped-override',witnesses,evidence:'The shared declaration remains the last matching owner for these sibling selectors; removing it would lose their default'};
}
function capture(root=path.resolve(__dirname,'../..')){
 const inventory=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'docs/reviews/runtime-audit-01/runtime-inventory.json.gz'))));
 const data=analyze(inventory.files.map(({file:name})=>({name,text:fs.readFileSync(path.join(root,name),'utf8')})));
 const oldReport=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/cleanup-typical-05-7/ownership.json'))),old=new Set(oldReport.remaining.filter(g=>g.status==='Retained page ownership').map(key));
 A.equal(data.cascadeOverrides.length,31);const retained=data.cascadeOverrides.map(g=>({...g,decision:classify(g,root,old)}));
 A.equal(retained.filter(g=>g.decision.reason==='accepted-page-ownership').length,19);
 return {base,rawBefore:100,rawAfter:31,retired:69,retainedReviewed:31,unreviewed:0,retained};
}
module.exports={capture,classify,key,context};
if(require.main===module){const result=capture(),out=process.argv[2]||'artifacts/paint/ownership.json';fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log('C58_OWNERSHIP_GREEN',JSON.stringify({...result,retained:undefined}));}
