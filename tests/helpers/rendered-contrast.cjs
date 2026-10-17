'use strict';
// Samples the actual Chromium-painted backdrop. Unlike the flat-colour helper,
// this supports local photographs/gradients without pretending they are solid.
const zlib=require('node:zlib'),A=require('node:assert/strict'),Color=require('./contrast.cjs');
function bitmap(png){
 A.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=png.readUInt32BE(16),h=png.readUInt32BE(20),channels=png[25]===6?4:png[25]===2?3:0;A.equal(png[24],8);A.ok(channels);A.equal(png[28],0,'Non-interlaced Chromium PNG');
 const chunks=[];for(let i=8;i<png.length;){const n=png.readUInt32BE(i),kind=png.subarray(i+4,i+8).toString();if(kind==='IDAT')chunks.push(png.subarray(i+8,i+8+n));i+=n+12;}
 const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=w*channels,pixels=Buffer.alloc(w*h*channels);
 const paeth=(a,b,c)=>{const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;};
 for(let y=0;y<h;y++){const f=raw[y*(stride+1)];A.ok(f<=4);for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?pixels[i-channels]:0,b=y?pixels[i-stride]:0,c=y&&x>=channels?pixels[i-stride-channels]:0;pixels[i]=(raw[y*(stride+1)+x+1]+[0,a,b,(a+b)>>1,paeth(a,b,c)][f])&255;}}
 return {w,h,pixel(x,y){const i=(y*w+x)*channels;return [pixels[i],pixels[i+1],pixels[i+2],1];}};
}
async function auditRendered(page,selectors){
 const samples=await page.evaluate(selectors=>{
  const samples=[],seen=new Set();
  for(const selector of selectors){const scope=document.querySelector(selector);if(!scope)continue;
   const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){
    const node=walker.currentNode,e=node.parentElement;
    const first=node.textContent.match(/[\p{L}\p{N}]/u);if(seen.has(node)||!first||e.closest('script,style,option,[hidden],.hidden,[aria-hidden="true"],.nomad-sr,.sr-only')||!e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
    let folded=false;for(let parent=e;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS'&&!parent.open&&!parent.querySelector(':scope > summary')?.contains(e))folded=true;
    if(folded)continue;seen.add(node);
    // Leading arrows/colour emoji are decorative; measure the actual label.
    const range=document.createRange();range.selectNodeContents(node);range.setStart(node,first.index);const boxes=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>({x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height}));if(!boxes.length)continue;
    let opacity=1;for(let p=e;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);
    samples.push({text:node.textContent.trim().slice(0,140),selector,color:getComputedStyle(e).color,opacity,boxes});
   }
   scope.setAttribute('data-test-painted-contrast','');
  }
  return samples;
 },selectors);
 const style=await page.addStyleTag({content:'[data-test-painted-contrast],[data-test-painted-contrast] *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;-webkit-text-stroke-width:0!important}'});
 let png;try{png=await page.screenshot({fullPage:true,animations:'disabled',scale:'css'});}finally{await style.evaluate(e=>e.remove());await page.evaluate(()=>document.querySelectorAll('[data-test-painted-contrast]').forEach(e=>e.removeAttribute('data-test-painted-contrast')));}
 const im=bitmap(png),results=[];
 for(const s of samples){let minimum=Infinity;const fg=Color.rgba(s.color);fg[3]*=s.opacity;
  for(const b of s.boxes)for(let y=Math.max(0,Math.floor(b.y));y<Math.min(im.h,Math.ceil(b.y+b.h));y+=2)for(let x=Math.max(0,Math.floor(b.x));x<Math.min(im.w,Math.ceil(b.x+b.w));x+=2){const bg=im.pixel(x,y);minimum=Math.min(minimum,Color.ratio(Color.over(fg,bg),bg));}
  if(Number.isFinite(minimum))results.push({selector:s.selector,text:s.text,ratio:minimum});
 }
 return {method:'actual Chromium backdrop, text temporarily transparent; conservative entire DOM Range sampled at 2px',count:results.length,minimum:Math.min(...results.map(x=>x.ratio)),failures:results.filter(x=>x.ratio<4.5)};
}
module.exports={auditRendered};
