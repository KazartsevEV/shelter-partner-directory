'use strict';
const postcss=require('postcss');
// Keep the last identical rule within its actual parent. Never merge selectors,
// declarations, layers or separate media/supports blocks. Keep all wrappers.
function deduplicate(css){
 const tree=postcss.parse(css),removed=[];
 function visit(parent,inPalette){
  const seen=new Map();
  for(const node of parent.nodes||[]){
   if(node.type==='atrule'){
    const palette=inPalette||node.name==='layer'&&['nomad360-palette','nomad360-palette-important'].includes(node.params);
    if(node.nodes)visit(node,palette);
   }else if(inPalette&&node.type==='rule'&&node.nodes.length&&node.nodes.every(d=>d.type==='decl')){
    const key=JSON.stringify([node.selector,node.nodes.map(d=>[d.prop,d.value,!!d.important])]);
    if(seen.has(key)){const earlier=seen.get(key);removed.push({start:earlier.source.start.offset,end:earlier.source.end.offset,selector:earlier.selector});}
    seen.set(key,node);
   }
  }
 }
 visit(tree,false);
 let output=css;
 for(const r of [...removed].sort((a,b)=>b.start-a.start))output=output.slice(0,r.start)+output.slice(r.end);
 return {css:output,removed};
}
module.exports={deduplicate};
