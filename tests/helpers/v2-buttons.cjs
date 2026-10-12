'use strict';
(function(root){
 function role(el){
  if(el.matches('[data-p2-save],[data-linked-save],[data-mba-transfer],[data-nomad-price-toggle],[data-nomad-export="price"]'))return 'primary';
  if(el.matches('[data-p2-add-sku],[data-p2-add-resource],[data-linked-add],[data-basket-action="add"],[data-basket-action="add-item"],[data-nomad-export="report"]'))return 'secondary';
  if(el.matches('[data-p2-home],[data-p2-new],[data-p2-remove-sku],[data-p2-delete-resource],[data-linked-back],[data-linked-delete],[data-linked-delete-sku],[data-basket-action="remove"],[data-basket-action="remove-item"],[data-mba-clear],[data-mba-download],[data-nomad-hide-price]'))return 'outline';
  return null;
 }
 function audit(scope){
  const failures=[],samples=[];
  const actions=[...scope.querySelectorAll('button,a[data-mba-download]')].filter(el=>el.getClientRects().length);
  for(const el of actions){
   const kind=role(el),s=getComputedStyle(el),r=el.getBoundingClientRect();
   const label=el.textContent.trim()||el.getAttribute('aria-label')||el.outerHTML.slice(0,100);
   const sample={label,role:kind,disabled:el.disabled===true,background:s.backgroundColor,color:s.color,
    width:r.width,height:r.height,contrast:NomadContrast.painted(el).ratio};
   samples.push(sample);
   const fail=(reason)=>failures.push({...sample,reason});
   if(!kind){fail('unknown action');continue;}
   const expected=el.disabled?['rgb(219, 228, 238)','rgb(64, 84, 106)']:
    kind==='primary'?['rgb(237, 142, 99)','rgb(22, 55, 90)']:
    kind==='secondary'?['rgb(49, 87, 124)','rgb(255, 255, 255)']:null;
   if(expected&&(s.backgroundColor!==expected[0]||s.color!==expected[1]))fail('action palette');
   if(!el.disabled&&kind==='outline'&&(NomadContrast.rgba(s.backgroundColor)[3]!==0||
     !['rgb(22, 55, 90)','rgb(255, 255, 255)'].includes(s.color)))fail('outline palette');
   if(r.width<43.9||r.height<43.9)fail('touch area');
   if(sample.contrast<4.5)fail('text contrast');
   if(s.backgroundImage!=='none'||parseFloat(s.borderRadius)>4)fail('decorative surface');
   const card=el.closest('article,section,.nd-v2-hero')||scope,c=card.getBoundingClientRect();
   const pane=el.closest('table')?.closest('.overflow-x-auto');
   if(!pane&&(r.left<c.left-1||r.right>c.right+1))fail('outside card');
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){
    const node=walker.currentNode,parent=node.parentElement;
    if(!node.textContent.trim()||parent.closest('.sr-only,[hidden]')||getComputedStyle(parent).visibility==='hidden')continue;
    const range=document.createRange();range.selectNodeContents(node);
    for(const box of range.getClientRects())if(box.width>0&&box.height>0&&
     (box.left<r.left-1||box.right>r.right+1||box.top<r.top-1||box.bottom>r.bottom+1))fail('text outside action');
   }
   const siblings=[...el.parentElement.children].filter(other=>other!==el&&other.matches('button,a[data-mba-download]'));
   for(const other of siblings){const b=other.getBoundingClientRect();
    if(Math.min(r.right,b.right)-Math.max(r.left,b.left)>1&&Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top)>1)fail('action overlap');
   }
  }
  return {count:samples.length,minimum:Math.min(...samples.map(s=>s.contrast)),samples,failures};
 }
 const api={role,audit};
 if(typeof module==='object')module.exports=api;else root.NomadButtons=api;
})(globalThis);
