'use strict';
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  page.setDefaultTimeout(15000);
  await page.goto('about:blank');
  const src='https://nowpayments.io/embeds/donation-widget?api_key=47aebf88-76b9-4871-9217-d3f5b46de839';
  await page.setContent('<div style="width:348px;height:308px;overflow:hidden"><iframe id="donation" src="'+src+'" width="346" height="395" scrolling="auto" style="border:0;transform:scale(.78);transform-origin:top left" loading="eager"></iframe></div>');
  const frame=await (await page.locator('#donation').elementHandle()).contentFrame();
  await frame.waitForLoadState('domcontentloaded',{timeout:30000}).catch(e=>console.log('FRAME_LOAD',e.message));
  await frame.waitForTimeout(2000);
  const get=async()=>frame.evaluate(()=>{
    const possible=[...document.querySelectorAll('button, span, div, a')].filter(n=>n.children.length===0 && /Continue/.test(n.textContent||''));
    const el=possible[0];
    const r=el?.getBoundingClientRect();
    return {
      scrollY:window.scrollY,
      bodyScroll:document.body.scrollHeight,bodyClient:document.body.clientHeight,
      docScroll:document.documentElement.scrollHeight,docClient:document.documentElement.clientHeight,
      continueY:Math.round(r?.top||-1),
      continueBottom:Math.round(r?.bottom||-1),
      element:el?.outerHTML.slice(0,240)
    }
  });
  console.log('INITIAL',JSON.stringify(await get()));
  const rect=await page.locator('#donation').boundingBox();console.log('FRAME_RECT',JSON.stringify(rect));
  await page.mouse.move(rect.x+rect.width*.5,rect.y+130);
  await page.mouse.wheel(0,360);
  await page.waitForTimeout(1200);
  console.log('AFTER_WHEEL',JSON.stringify(await get()));
  // Reset and try native Android-like touchscreen swiping.
  await frame.evaluate(()=>window.scrollTo(0,0));
  const client=await page.context().newCDPSession(page);
  const x=Math.round(rect.x+rect.width*.5),y=Math.round(rect.y+180);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=8;i++){
   await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*17}]});
   await page.waitForTimeout(25);
  }
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(1100);
  console.log('AFTER_TOUCH',JSON.stringify(await get()));
 }finally{await browser.close();}
})().catch(e=>{console.error('PROBE_ERR',e.stack);process.exitCode=1});
