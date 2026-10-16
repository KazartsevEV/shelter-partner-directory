'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const http=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const out=path.join(ROOT,'artifacts/bug-report');
fs.mkdirSync(out,{recursive:true});
const mime={'.HTML':'text/html','.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const filename=path.resolve(ROOT,'.'+new URL(req.url,'http://local').pathname);
 if(!filename.startsWith(ROOT+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){
  res.writeHead(404);res.end();return;
 }
 res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
 fs.createReadStream(filename).pipe(res);
});
const labels={ru:'Сообщить об ошибке',en:'Report a bug',kk:'Қате туралы хабарлау'};
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let matrix=0,posted=0;
 try{
  for(const language of ['ru','en','kk'])for(const width of [320,360,390,430,768,1280]){
   const context=await browser.newContext({viewport:{width,height:850},acceptDownloads:true,
    isMobile:width<=430,hasTouch:width<=430});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await page.goto(base+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
   await page.locator('#nomad360-lang-select').selectOption(language);
   const launcher=page.locator('#nomad360-bug-launcher');
   await launcher.waitFor({state:'visible'});
   A.equal(await launcher.getAttribute('aria-label'),labels[language]);
   const trigger=await launcher.boundingBox();
   A.ok(trigger.x>=0&&trigger.x+trigger.width<=width+1,language+' '+width+' widget in viewport');
   A.ok(trigger.y>=0&&trigger.height>=44,language+' '+width+' widget tappable');
   if(width<=430)await launcher.tap();
   else await launcher.click();
   const dialog=page.locator('#nomad360-bug-dialog');
   A.equal(await dialog.evaluate(x=>x.open),true);
   A.equal(await dialog.getAttribute('aria-labelledby'),'nomad360-bug-heading');
   A.equal(await page.locator('#nomad360-bug-submit').isDisabled(),true,
    'Do not send before owner chooses and configures provider');
   A.ok(await page.locator('#nomad360-bug-privacy').innerText());
   A.ok((await page.locator('#nomad360-bug-status').innerText()).length>10);
   const bounds=await dialog.boundingBox();
   A.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1,'dialog horizontal fit');
   A.ok(bounds.y>=0&&bounds.y+bounds.height<=851,'dialog vertical fit');
   const horizontal=await page.evaluate(()=>{
    const current=document.documentElement.scrollWidth;
    const elements=[document.getElementById('nomad360-bug-launcher'),document.getElementById('nomad360-bug-dialog')];
    const previous=elements.map(el=>el.style.display);
    elements.forEach(el=>el.style.display='none');
    const baseline=document.documentElement.scrollWidth;
    elements.forEach((el,i)=>el.style.display=previous[i]);
    return {current,baseline};
   });
   A.ok(horizontal.current<=Math.max(width,horizontal.baseline)+1,
    'Widget must not introduce horizontal overflow beyond the existing calculator');
   const input=page.locator('#nomad360-bug-message');
   await input.fill('Unsent report stays in the form');
   if(language==='ru'&&width===390){
    await page.evaluate(()=>{
     const select=document.getElementById('nomad360-lang-select');
     select.value='en';select.dispatchEvent(new Event('change',{bubbles:true}));
    });
    A.equal(await input.inputValue(),'Unsent report stays in the form','language must not wipe user text');
    A.equal(await page.locator('#nomad360-bug-heading').innerText(),'Report a bug');
    A.equal(await page.locator('#nomad360-bug-submit').isDisabled(),true);
   }
   await page.screenshot({path:path.join(out,'bug-'+language+'-'+width+'.png')});
   await page.keyboard.press('Escape');
   A.equal(await dialog.evaluate(x=>x.open),false,'ESC closes modal');
   A.equal(await page.evaluate(()=>document.activeElement?.id),'nomad360-bug-launcher','return focus');
   A.deepEqual(errors,[],'no JS errors');
   await context.close();matrix++;
  }
  const context=await browser.newContext({viewport:{width:390,height:850}});
  const page=await context.newPage();
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await page.goto(base+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
  // Only allow an explicitly approved, correctly shaped handler.
  await page.evaluate(()=>{
   document.documentElement.setAttribute('data-nomad-bug-endpoint','https://example.com/steal');
   localStorage.setItem('privateFinanceDraft','SUPER_SECRET_FINANCE_NEVER_SEND');
   localStorage.setItem('skuName','PRIVATE_SKU_NAME_NEVER_SEND');
  });
  await page.locator('#nomad360-bug-launcher').click();
  A.equal(await page.locator('#nomad360-bug-submit').isDisabled(),true,'reject arbitrary endpoint');
  await page.locator('[data-bug-close]').click();
  await page.evaluate(()=>document.documentElement.setAttribute('data-nomad-bug-endpoint','https://formspree.io/f/testid'));
  const responses=[{status:500,body:{ok:false}},{status:200,body:{ok:false}},
    {status:429,body:{ok:false}},{status:200,body:{ok:true}}];
  await page.route('https://formspree.io/f/testid',async route=>{
   const next=responses.shift();A.ok(next,'unexpected duplicate submission');
   const request=route.request();
   A.equal(request.method(),'POST');
   A.equal(request.headers().accept,'application/json');
   const bytes=request.postData()||'';
   for(const secret of ['SUPER_SECRET_FINANCE_NEVER_SEND','PRIVATE_SKU_NAME_NEVER_SEND',
    'localStorage','cookie','password','taxRegime','portfolio','referrer']){
    A.equal(bytes.includes(secret),false,'no private data: '+secret);
   }
   for(const key of ['message','interface_language','viewport_width','_subject'])
    A.ok(bytes.includes('name="'+key+'"'),'required field '+key);
   A.ok(bytes.includes('The widget did not open'),'user report is present');
   A.equal(bytes.includes('name="email"'),false,'anonymous form needs no email');
   A.equal(bytes.includes('name="steps"'),false,'steps optional');
   posted++;
   await route.fulfill({status:next.status,contentType:'application/json',body:JSON.stringify(next.body),
    headers:{'access-control-allow-origin':'*'}});
  });
  await page.locator('#nomad360-bug-launcher').click();
  A.equal(await page.locator('#nomad360-bug-submit').isDisabled(),false);
  await page.locator('#nomad360-bug-submit').click();
  A.equal(await page.locator('#nomad360-bug-status').getAttribute('data-result'),'required',
   'empty message must be rejected before transport');
  A.ok((await page.locator('#nomad360-bug-status').innerText()).trim().length>10,
   'localized validation must be announced');
  await page.locator('#nomad360-bug-message').fill('The widget did not open');
  for(let i=0;i<4;i++){
   await page.locator('#nomad360-bug-submit').click();
   await page.waitForFunction((expected)=>{
    const s=document.querySelector('#nomad360-bug-status')?.getAttribute('data-result');
    return s===expected;
   },i===2?'tooMany':i===3?'success':'error');
   A.equal(await page.locator('#nomad360-bug-submit').isDisabled(),i===3,
    'disable only after confirmed successful submission');
  }
  A.equal(posted,4,'all attempts went to mocked endpoint, not the network');
  A.equal(await page.locator('#nomad360-bug-message').inputValue(),'','reset after confirmed receipt');
  await context.close();
  console.log('BUG_REPORT_WIDGET_GREEN '+JSON.stringify({matrix,posted,locales:3,widths:[320,360,390,430,768,1280],
   accidentalTransmit:0,verifiedErrors:3,confirmedReceipts:1}));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error('BUG_REPORT_WIDGET_RED',e.stack||e);process.exitCode=1;});
