'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const postcss=require('../palette/node_modules/postcss');
const base='6a0504139af2f28f5281d49a81559f90a968dd22';
const files=['nomad360_design_system.css','nomad360_hero_banner.css'];
const layout=/^(?:display|position|(?:min-|max-)?(?:width|height)|(?:margin|padding)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?|(?:top|right|bottom|left|inset)|box-sizing|border-radius|align-items|justify-content|flex-direction|flex-wrap|grid-template-columns|grid-template-rows|gap|row-gap|column-gap|font-size|font-weight|line-height|letter-spacing|text-align|text-transform|text-wrap|white-space|overflow(?:-x|-y|-wrap)?|word-break|z-index|transform)$/;
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function context(node){const out=[];for(let p=node.parent;p&&p.type!=='root';p=p.parent){if(p.type==='atrule')out.unshift('@'+p.name+' '+p.params);else return null;}return out;}
function analyze(text){
 const root=postcss.parse(text),rows=[],last=new Map();
 root.walkDecls(d=>{
  const rule=d.parent,ctx=rule.type==='rule'&&context(rule);
  if(!ctx||ctx.some(c=>!/^@(media|supports|layer)\s+\S/.test(c)))return;
  const selectors=rule.selectors,keys=selectors.map(s=>JSON.stringify([ctx,s,d.prop,!!d.important]));
  const row={d,rule,ctx,selectors,keys,index:rows.length};rows.push(row);for(const k of keys)last.set(k,row);
 });
 const removable=rows.filter(r=>!r.rule.nodes.some(n=>n.type==='decl'&&n!==r.d&&n.prop===r.d.prop)&&layout.test(r.d.prop)&&!/-webkit-|-moz-|\brevert(?:-layer)?\b/.test(r.d.value)&&r.keys.every(k=>{
  const winner=last.get(k);
  return winner.index>r.index&&winner.rule!==r.rule&&!/-webkit-|-moz-|\brevert(?:-layer)?\b/.test(winner.d.value)&&
   !winner.rule.nodes.some(n=>n.type==='decl'&&n!==winner.d&&n.prop===winner.d.prop);
 }));
 const removed=new Set(removable.map(r=>r.d)),empty=new Set();
 for(const r of removable)if(r.rule.nodes.every(n=>n.type==='decl'&&removed.has(n)))empty.add(r.rule);
 let changed=true;while(changed){changed=false;root.walkAtRules(n=>{if(n.nodes?.length&&!empty.has(n)&&n.nodes.every(child=>empty.has(child))){empty.add(n);changed=true;}});}
 const edits=[],seen=new Set();
 for(const r of removable){let node=empty.has(r.rule)?r.rule:r.d;while(empty.has(node.parent))node=node.parent;if(seen.has(node))continue;seen.add(node);
  edits.push({start:node.source.start.offset,end:node.source.end.offset,kind:node.type,sha256:hash(text.slice(node.source.start.offset,node.source.end.offset))});}
 edits.sort((a,b)=>a.start-b.start);
 for(let i=1;i<edits.length;i++)if(edits[i-1].end>edits[i].start)throw Error('Overlapping removal proof');
 const proof=removable.map(r=>({selector:r.rule.selector,context:r.ctx,property:r.d.prop,important:!!r.d.important,value:r.d.value,line:r.d.source.start.line,
   winners:r.keys.map(k=>{const w=last.get(k);return {selector:w.rule.selector,value:w.d.value,line:w.d.source.start.line};})}));
 return {edits,proof};
}
function apply(text,edits){for(const e of [...edits].reverse()){if(hash(text.slice(e.start,e.end))!==e.sha256)throw Error('Unrecognized CSS range');text=text.slice(0,e.start)+text.slice(e.end);}return text;}
function winners(text){const out={};postcss.parse(text).walkRules(r=>{const ctx=context(r);if(ctx===null)return;for(const selector of r.selectors)for(const d of r.nodes){if(d.type==='decl')out[JSON.stringify([ctx,selector,d.prop,!!d.important])]=d.value;}});return out;}
module.exports={base,files,hash,analyze,apply,winners};
if(require.main===module){
 const A=require('node:assert/strict'),{execFileSync}=require('node:child_process'),report={base,files:{}};
 for(const file of files){const before=execFileSync('git',['show',base+':'+file],{encoding:'utf8'}),r=analyze(before),after=apply(before,r.edits);A.deepEqual(winners(before),winners(after));report.files[file]={beforeSha:hash(before),afterSha:hash(after),savedBytes:Buffer.byteLength(before)-Buffer.byteLength(after),...r};
  const actual=fs.readFileSync(file,'utf8');A.ok([before,after].includes(actual),'Refuse unknown source: '+file);
  if(process.argv.includes('--apply'))fs.writeFileSync(file,after);else if(process.argv.includes('--check'))A.equal(actual,after);
 }
 const receipt='tests/fixtures/cleanup-typical/removals.json';
 if(process.argv.includes('--write-receipt'))fs.writeFileSync(receipt,JSON.stringify(report,null,2)+'\n');else A.deepEqual(report,JSON.parse(fs.readFileSync(receipt)));
 console.log('C57_SOURCE_GREEN',JSON.stringify(Object.fromEntries(Object.entries(report.files).map(([f,r])=>[f,{declarations:r.proof.length,bytes:r.savedBytes}]))));
}
