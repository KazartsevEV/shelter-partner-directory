'use strict';
const crypto=require('node:crypto');
const postcss=require('postcss');

const eligibleProperty=/^(?!src$|content$).+/;
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function context(node){const out=[];for(let p=node.parent;p&&p.type!=='root';p=p.parent){if(p.type==='atrule')out.unshift('@'+p.name+' '+p.params);else return null;}return out;}
function analyze(text,{generated=false}={}){
 const root=postcss.parse(text),rows=[],last=new Map();
 root.walkDecls(d=>{
  const rule=d.parent,ctx=rule.type==='rule'&&context(rule);
  if(!ctx||ctx.some(c=>!/^@(media|supports|layer)\s+\S/.test(c)))return;
  const selectors=rule.selectors,keys=selectors.map(s=>JSON.stringify([ctx,s,d.prop,!!d.important]));
  const row={d,rule,ctx,selectors,keys,index:rows.length};rows.push(row);for(const k of keys)last.set(k,row);
 });
 const removable=rows.filter(r=>(generated||!r.rule.nodes.some(n=>n.type==='decl'&&n!==r.d&&n.prop===r.d.prop))&&eligibleProperty.test(r.d.prop)&&!/url\(/i.test(r.d.value)&&!/-webkit-|-moz-|\brevert(?:-layer)?\b/.test(r.d.value)&&r.keys.every(k=>{
  const winner=last.get(k);
  return winner.index>r.index&&(generated||winner.rule!==r.rule)&&!/-webkit-|-moz-|\brevert(?:-layer)?\b/.test(winner.d.value)&&
   (generated||!winner.rule.nodes.some(n=>n.type==='decl'&&n!==winner.d&&n.prop===winner.d.prop));
 }));
 const removed=new Set(removable.map(r=>r.d)),empty=new Set();
 for(const r of removable)if(r.rule.nodes.every(n=>n.type==='decl'&&removed.has(n)))empty.add(r.rule);
 let changed=true;while(changed){changed=false;root.walkAtRules(n=>{if(['media','supports'].includes(n.name)&&n.nodes?.length&&!empty.has(n)&&n.nodes.every(child=>empty.has(child))){empty.add(n);changed=true;}});}
 const edits=[],seen=new Set();
 for(const r of removable){let node=empty.has(r.rule)?r.rule:r.d;while(empty.has(node.parent))node=node.parent;if(seen.has(node))continue;seen.add(node);
  let start=node.source.start.offset,end=node.source.end.offset;const lineStart=text.lastIndexOf('\n',start-1)+1,lineEnd=text.indexOf('\n',end);if(/^[ \t]*$/.test(text.slice(lineStart,start))&&/^[ \t]*$/.test(text.slice(end,lineEnd<0?text.length:lineEnd))){start=lineStart;end=lineEnd<0?text.length:lineEnd;}
  edits.push({start,end,kind:node.type,sha256:hash(text.slice(start,end))});}
 edits.sort((a,b)=>a.start-b.start);
 for(let i=1;i<edits.length;i++)if(edits[i-1].end>edits[i].start)throw Error('Overlapping removal proof');
 const proof=removable.map(r=>({selector:r.rule.selector,context:r.ctx,property:r.d.prop,important:!!r.d.important,value:r.d.value,line:r.d.source.start.line,
   winners:r.keys.map(k=>{const w=last.get(k);return {selector:w.rule.selector,value:w.d.value,line:w.d.source.start.line};})}));
 return {edits,proof};
}
function apply(text,edits){for(const e of [...edits].reverse()){if(hash(text.slice(e.start,e.end))!==e.sha256)throw Error('Unrecognized CSS range');text=text.slice(0,e.start)+text.slice(e.end);}return text;}
function winners(text){const out={};postcss.parse(text).walkRules(r=>{const ctx=context(r);if(ctx===null)return;for(const selector of r.selectors)for(const d of r.nodes){if(d.type==='decl')out[JSON.stringify([ctx,selector,d.prop,!!d.important])]=d.value;}});return out;}
function prune(text,options){const report=analyze(text,options);return {css:apply(text,report.edits),...report};}
module.exports={hash,analyze,apply,winners,prune};
