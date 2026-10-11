'use strict';
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(15000);
  page.on('pageerror',e=>console.log('PAGE_ERROR',e.message));
  await page.goto('about:blank');
  const src='https://nowpayments.io/embeds/donation-widget?api_key=47aebf88-76b9-4871-9217-d3f5b46de839';
  await page.setContent('<iframe id="donation" src="'+src+'" width="346" height="623" style="border:0" loading="eager"></iframe>');
  const iframe=page.locator('#donation');
  const frame=await iframe.elementHandle().then(h=>h.contentFrame());
  await frame.waitForLoadState('domcontentloaded',{timeout:30000}).catch(e=>console.log('FRAME_LOAD',e.message));
  await frame.waitForTimeout(5000);
  for(const height of [623,550,500,460,430,400]){
   await iframe.evaluate((el,h)=>el.style.height=h+'px',height);
   await page.waitForTimeout(1100);
   const geom=await frame.evaluate(()=>{
    const nodes=[...document.querySelectorAll('button, input, a, h1, h2, p, div, span')];
    const pick=(pattern)=>nodes.filter(n=>n.children.length===0&&pattern.test(n.textContent||'')).slice(0,12).map(n=>({
     tag:n.tagName,text:n.textContent?.trim().slice(0,65),
     y:Math.round(n.getBoundingClientRect().top),bottom:Math.round(n.getBoundingClientRect().bottom),
     visibility:getComputedStyle(n).visibility,display:getComputedStyle(n).display
    }));
    return {
     url:location.href,innerHeight,bodyScroll:document.body.scrollHeight,
     docScroll:document.documentElement.scrollHeight,
     continue:pick(/Continue|Продолжить/i),
     minimum:pick(/Minimum/i),
     amountInputs:[...document.querySelectorAll('input')].slice(0,8).map(n=>({
      placeholder:n.placeholder,y:Math.round(n.getBoundingClientRect().top),bottom:Math.round(n.getBoundingClientRect().bottom)}))
    };
   }).catch(e=>({error:String(e)}));
   console.log('NOWPAY_FIT',JSON.stringify({height,geom}));
  }
 }finally{await browser.close();}
})().catch(e=>{console.error('NOWPAY_PROBE_ERR',e.stack);process.exitCode=1});
