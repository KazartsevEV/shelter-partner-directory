'use strict';
(function(root){
 function audit(scope){
  // Select existing numeric value elements rather than depending on repair
  // classes, so the same audit also detects the rejected presentation.
  const values=[...scope.querySelectorAll('div.font-black,b[data-nomad-display-number],.grid > div > b')]
   .filter(el=>!el.closest('table')&&el.getClientRects().length&&
    /^[+\-−]?\d[\d\s\u00a0\u202f.,]*(?:[%×]|[A-Z]{3})?$/.test(el.textContent.trim()));
  const samples=values.map(el=>{
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),rects=[];
   while(walker.nextNode()){
    if(!walker.currentNode.textContent.trim())continue;
    const range=document.createRange();range.selectNodeContents(walker.currentNode);
    rects.push(...[...range.getClientRects()].filter(r=>r.width>0&&r.height>0));
   }
   const lines=[];
   for(const r of rects){const center=(r.top+r.bottom)/2;if(!lines.some(y=>Math.abs(y-center)<2))lines.push(center);}
   const card=el.parentElement,c=card.getBoundingClientRect(),style=getComputedStyle(card),box=el.getBoundingClientRect();
   const left=c.left+parseFloat(style.paddingLeft),right=c.right-parseFloat(style.paddingRight);
   return {text:el.textContent.trim(),lineCount:lines.length,fontSize:getComputedStyle(el).fontSize,
    fits:rects.every(r=>r.left>=left-1&&r.right<=right+1&&r.left>=box.left-1&&r.right<=box.right+1),
    rects:rects.map(r=>({x:r.x,y:r.y,width:r.width,height:r.height})),cell:{left,right,width:c.width}};
  });
  return {count:samples.length,samples,failures:samples.filter(s=>s.lineCount!==1||!s.fits)};
 }
 if(typeof module==='object')module.exports={audit};else root.NomadMoneyLines={audit};
})(globalThis);
