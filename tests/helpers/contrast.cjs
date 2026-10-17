'use strict';
// WCAG relative luminance; composite sRGB layers before linearizing channels.
(function(root){
 function rgba(value){
  if(value==='transparent')return [0,0,0,0];
  const parts=value.match(/^rgba?\(([^)]+)\)$/)?.[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  if(!parts||parts.length<3||parts.some(v=>!Number.isFinite(v)))throw Error('Unsupported color: '+value);
  return [...parts.slice(0,3),parts[3]??1];
 }
 function over(front,back){
  const alpha=front[3]+back[3]*(1-front[3]);
  return [...front.slice(0,3).map((v,i)=>alpha?(v*front[3]+back[i]*back[3]*(1-front[3]))/alpha:0),alpha];
 }
 function luminance(color){
  return color.slice(0,3).map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4)
   .reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
 }
 function ratio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
 function painted(element,color){
  let foreground=rgba(color||getComputedStyle(element).color),background=[0,0,0,0];
  // Child layers go in front of each ancestor. Group opacity applies to both
  // pixels at its level, including the background behind its descendants.
  for(let node=element;node;node=node.parentElement){
   const style=getComputedStyle(node);
   if(style.backgroundImage!=='none')throw Error('Contrast requires image-background review: '+node.tagName);
   const layer=rgba(style.backgroundColor);
   foreground=over(foreground,layer);background=over(background,layer);
   foreground[3]*=Number(style.opacity);background[3]*=Number(style.opacity);
  }
  const canvas=[255,255,255,1];
  foreground=over(foreground,canvas);background=over(background,canvas);
  return {foreground,background,ratio:ratio(foreground,background)};
 }
 function audit(scope){
  const samples=[],walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
  const visible=element=>!element.closest('[hidden],.hidden,[disabled],[aria-disabled="true"]')&&
   !['hidden','collapse'].includes(getComputedStyle(element).visibility);
  function record(element,text,color){
   const resource=element.closest('[data-p2-resource],[data-linked-resource]');
   samples.push({text:text.trim().slice(0,160),tag:element.tagName,classes:element.className,
    resource:resource?.getAttribute('data-p2-resource')??resource?.getAttribute('data-linked-resource')??null,
    ...painted(element,color)});
  }
  while(walker.nextNode()){
   const node=walker.currentNode,element=node.parentElement;
   if(!node.textContent.trim()||!element||!visible(element)||element.closest('script,style,option'))continue;
   const range=document.createRange();range.selectNodeContents(node);
   if([...range.getClientRects()].some(r=>r.width>0&&r.height>0))record(element,node.textContent);
  }
  for(const element of scope.querySelectorAll('input,select,textarea')){
   if(!visible(element)||!element.getClientRects().length||['checkbox','radio','file','hidden'].includes(element.type))continue;
   const text=element.tagName==='SELECT'?element.selectedOptions[0]?.textContent:element.value;
   if(text)record(element,text);
   else if(element.placeholder){
    const style=getComputedStyle(element,'::placeholder'),color=rgba(style.color);
    color[3]*=Number(style.opacity);record(element,element.placeholder,'rgba('+color.join(',')+')');
   }
  }
  return {count:samples.length,minimum:Math.min(...samples.map(v=>v.ratio)),
   failures:samples.filter(v=>v.ratio<4.5),samples};
 }
 const api={rgba,over,luminance,ratio,painted,audit};
 if(typeof module==='object')module.exports=api;else root.NomadContrast=api;
})(globalThis);
