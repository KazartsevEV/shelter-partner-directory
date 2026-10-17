'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'artifacts/pinned-controls');
fs.mkdirSync(dir,{recursive:true});
const mime={'.HTML':'text/html','.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml'};
const srv=http.createServer((req,res)=>{
 const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');
 fs.createReadStream(f).pipe(res);
});
async function drag(page,locator,delta){
 const b=await locator.boundingBox();A.ok(b,'swipe target present');
 const x=b.x+b.width/2,y=b.y+b.height/2;
 await page.mouse.move(x,y);await page.mouse.down();
 await page.mouse.move(x+delta,y,{steps:7});await page.mouse.up();
}
// Real touch delivery in mobile emulation; mouse dragging alone cannot validate swipes.
async function swipe(page,locator,delta,mobile){
 if(!mobile){await drag(page,locator,delta);return}
 const b=await locator.boundingBox();A.ok(b,'touch target present');
 const x=b.x+b.width/2,y=b.y+b.height/2;
 const cdp=await page.context().newCDPSession(page);
 try{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  for(let i=1;i<=8;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+delta*i/8,y,id:1}]});
   await page.waitForTimeout(12);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }finally{await cdp.detach()}
}
(async()=>{
 await new Promise(done=>srv.listen(0,'127.0.0.1',done));
 const base='http://127.0.0.1:'+srv.address().port+'/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let checks=0;
 try{
 for(const lang of ['ru','en','kk'])for(const width of [320,390,768,1280]){
  const mobile=width<=430;
  const ctx=await browser.newContext({viewport:{width,height:850},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),jsErrors=[];
  page.on('pageerror',e=>jsErrors.push(e.message));
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await page.goto(base+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
  await page.locator('#nomad360-lang-select').selectOption(lang);
  const header=page.locator('#nomad360-header'),burger=header.locator('.nomad-burger');
  const dock=page.locator('#nomad360-bug-dock'),launcher=page.locator('#nomad360-bug-launcher');
  await header.waitFor();await launcher.waitFor();
  // Make enough room to scroll without touching calculator values.
  await page.evaluate(()=>{document.body.style.minHeight='3800px';window.scrollTo({top:730,behavior:'instant'})});
  await page.waitForTimeout(100);
  A.ok(await page.evaluate(()=>scrollY)>200,'scrolled enough to check fixed controls');
  if(width>=1200){
   A.equal(await header.evaluate(e=>getComputedStyle(e).position),'sticky','desktop full header sticky');
   const rect=await header.boundingBox();
   A.ok(rect.y>=-2&&rect.y<4,'desktop header stays at viewport top');
  }else{
   const inlineBoxes=await header.evaluate(el=>['.nomad-brand','.nomad-lang','.nomad-burger']
     .map(q=>el.querySelector(q).getBoundingClientRect()).map(b=>({left:b.left,right:b.right})));
   A.ok(inlineBoxes.every((b,i)=>!i||b.left>=inlineBoxes[i-1].right-1),
     'brand, language and fixed burger never overlap at '+width+': '+JSON.stringify(inlineBoxes));
   A.equal(await burger.evaluate(e=>getComputedStyle(e).position),'fixed','burger independently fixed');
   const rect=await burger.boundingBox();
   A.ok(rect.y>=0&&rect.y<90,'burger stays in viewport after scroll');
   await burger.click();A.equal(await burger.getAttribute('aria-expanded'),'true');
   const panel=page.locator('#nomad360-header-panel'),panelBox=await panel.boundingBox();
   A.ok(panelBox&&panelBox.x>=0&&panelBox.x+panelBox.width<=width+1,'menu panel fits screen');
   A.equal(await panel.evaluate(e=>getComputedStyle(e).position),'fixed');
   await page.keyboard.press('Escape');
   A.equal(await burger.getAttribute('aria-expanded'),'false','Escape closes menu');
  }
  // No data access: dock gestures control presentation only, not the calculator.
  const compact=await dock.evaluate(e=>e.classList.contains('is-collapsed'));
  A.equal(compact,width<=600,'mobile begins as tiny megaphone');
  if(compact){
   await swipe(page,launcher,-64,mobile);
   A.equal(await dock.evaluate(e=>e.classList.contains('is-collapsed')),false,'left swipe expands');
  }
  await swipe(page,launcher,65,mobile);
  A.equal(await dock.evaluate(e=>e.classList.contains('is-collapsed')),true,'right swipe collapses');
  A.equal(await page.locator('#nomad360-bug-dialog').evaluate(e=>e.open),false,'swipe never opens form');
  await swipe(page,launcher,-65,mobile);
  A.equal(await dock.evaluate(e=>e.classList.contains('is-collapsed')),false,'left swipe re-expands');
  await page.screenshot({path:path.join(dir,'pinned-'+lang+'-'+width+'-expanded.png')});
  const toggleBox=await page.locator('.nomad-bug-dock-toggle').boundingBox();
  const expandedBox=await launcher.boundingBox();
  A.ok(toggleBox&&expandedBox&&Math.abs(toggleBox.x+toggleBox.width-expandedBox.x)<2,
    'chevron is visually joined to the LEFT edge, not a separate right arrow');
  await page.locator('.nomad-bug-dock-toggle').click();
  A.equal(await dock.evaluate(e=>e.classList.contains('is-collapsed')),true,'explicit collapse toggle');
  await launcher.focus();await page.keyboard.press('ArrowLeft');
  A.equal(await dock.evaluate(e=>e.classList.contains('is-collapsed')),false,'keyboard expand');
  await page.keyboard.press('ArrowRight');
  A.equal(await dock.evaluate(e=>e.classList.contains('is-collapsed')),true,'keyboard collapse');
  const bb=await launcher.boundingBox();
  A.ok(bb&&bb.width>=44&&bb.x>=0&&bb.x+bb.width<=width+1,'compact report icon tappable');
  const compactCss=await launcher.evaluate(e=>({radius:getComputedStyle(e).borderRadius,
    border:getComputedStyle(e).borderWidth,icon:getComputedStyle(e.querySelector('svg')).width}));
  A.ok(bb.width<=44.5,'compact tab stays 44px or smaller visually');
  A.equal(compactCss.border,'0px','no decorative orange ring');
  A.ok(parseFloat(compactCss.icon)<=18,'megaphone glyph reduced to 17px');
  await launcher.click();
  A.equal(await page.locator('#nomad360-bug-dialog').evaluate(e=>e.open),true,'icon opens report');
  await page.keyboard.press('Escape');
  A.equal(await page.locator('#nomad360-bug-dialog').evaluate(e=>e.open),false,'Escape closes report');
  A.equal(await dock.evaluate(e=>e.classList.contains('is-collapsed')),true,'modal does not expand dock');
  A.deepEqual(jsErrors,[],'no page errors');
  await page.screenshot({path:path.join(dir,'pinned-'+lang+'-'+width+'.png')});
  checks++;await ctx.close();
 }
 console.log('PINNED_CONTROLS_GREEN '+JSON.stringify({checks,locales:3,widths:[320,390,768,1280]}));
 }finally{await browser.close();await new Promise(done=>srv.close(done))}
})().catch(e=>{console.error('PINNED_CONTROLS_RED',e.stack||e);process.exitCode=1});
