'use strict';
(function(root){
 function audit(scope){
  const visible=el=>el.getClientRects().length&&!el.closest('[hidden],.hidden');
  const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const intersects=(a,b)=>Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1;
  const failures=[],controls=[...scope.querySelectorAll('input,select,textarea')].filter(visible);
  const positions=controls.map(rect),byControl=new Map(controls.map((el,i)=>[el,positions[i]]));
  const describe=el=>el.getAttribute('data-p2-path')||el.getAttribute('data-linked-path')||el.getAttribute('data-basket-field')||el.getAttribute('data-mba-filter')||el.outerHTML.slice(0,130);
  if(document.documentElement.scrollWidth>innerWidth+1)failures.push({kind:'document-overflow',width:innerWidth,scroll:document.documentElement.scrollWidth});
  for(let i=0;i<controls.length;i++){
   const el=controls[i],r=positions[i],card=el.closest('article,.nd-v2-info-panel,.nd-v2-section,.nd-v2-result-frame')||scope,c=rect(card);
   if(r.x<c.x-1||r.right>c.right+1)failures.push({kind:'control-outside-card',field:describe(el),rect:r,card:c});
   const check=el.type==='checkbox';
   if(check?(r.width<18||r.height<18):r.height<43.9)failures.push({kind:'control-touch-size',field:describe(el),rect:r});
   for(let j=i+1;j<controls.length;j++)if(intersects(r,positions[j]))failures.push({kind:'control-overlap',a:describe(el),b:describe(controls[j])});
   if(el.tagName==='SELECT'){
    const value=el.selectedOptions[0]?.textContent.trim()||'',s=getComputedStyle(el);
    const probe=document.createElement('span');probe.textContent=value;
    probe.setAttribute('data-nomad-no-translate','');
    probe.style.cssText='position:absolute;white-space:pre;visibility:hidden;pointer-events:none';
    probe.style.font=s.font;probe.style.letterSpacing=s.letterSpacing;document.body.append(probe);
    const needed=probe.getBoundingClientRect().width;probe.remove();
    const available=el.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)-20;
    const note=el.nextElementSibling?.matches('.nd-v2-selected-value')?el.nextElementSibling:null;
    if(needed>available+1&&(!note||!visible(note)||note.textContent!==value))failures.push({kind:'selected-value-clipped',field:describe(el),value,needed,available});
    if(note&&note.getAttribute('aria-hidden')!=='true')failures.push({kind:'selected-note-duplicates-accessibility',field:describe(el)});
   }
  }
  for(const group of scope.querySelectorAll('.nd-v2-form-grid,.nd-v2-filter-grid,.nd-v2-basket-item-grid')){
   if(!visible(group))continue;
   if(innerWidth<640&&getComputedStyle(group).gridTemplateColumns.trim().split(/\s+/).length!==1)
    failures.push({kind:'mobile-form-columns',classes:group.className,columns:getComputedStyle(group).gridTemplateColumns});
  }
  for(const heading of scope.querySelectorAll('.nd-v2-card-heading')){
   const title=heading.querySelector('.nd-v2-card-title'),button=heading.querySelector('.nd-v2-card-remove');
   if(title&&button&&intersects(rect(title),rect(button)))failures.push({kind:'title-delete-overlap',title:title.textContent});
  }
  const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const node=walker.currentNode,el=node.parentElement;
   if(!node.textContent.trim()||!el||!visible(el)||el.closest('option,script,style,table'))continue;
   const holder=el.closest('label,.nd-v2-stat-cell,.nd-v2-card-title,.nd-v2-selected-value');
   if(!holder)continue;
   const bounds=rect(holder),range=document.createRange();range.selectNodeContents(node);
   for(const r of range.getClientRects()){
    if(!r.width||!r.height)continue;
    if(r.x<bounds.x-1||r.right>bounds.right+1)failures.push({kind:'text-outside-component',text:node.textContent.slice(0,100),rect:{x:r.x,right:r.right},bounds});
    for(let i=0;i<controls.length;i++)if(intersects(r,positions[i]))failures.push({kind:'text-control-overlap',text:node.textContent.slice(0,100),field:describe(controls[i])});
    const own=el.closest('label')?.querySelector('input:not([type="checkbox"]),select,textarea');
    if(own&&byControl.has(own)&&(node.compareDocumentPosition(own)&Node.DOCUMENT_POSITION_FOLLOWING)&&r.bottom>byControl.get(own).y+1)
     failures.push({kind:'label-not-above-field',text:node.textContent.slice(0,100),field:describe(own)});
   }
  }
  return {controlCount:controls.length,formGroups:scope.querySelectorAll('.nd-v2-form-grid,.nd-v2-filter-grid,.nd-v2-basket-item-grid').length,failures};
 }
 if(typeof module==='object')module.exports={audit};else root.NomadLayout={audit};
})(globalThis);
