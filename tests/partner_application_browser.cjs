'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),artifact=path.join(root,'artifacts/partner-application');fs.mkdirSync(artifact,{recursive:true});
const css=path.join(artifact,'utilities.css'),widths=(process.env.PARTNER_FORM_WIDTHS||'320,360,390,430,768,1280').split(',').map(Number),langs=(process.env.PARTNER_FORM_LANGUAGES||'ru,en,kk').split(',');
const endpoint='https://formspree.io/f/partnerFixture';
const input={company:'Тест Ә Company',activity:'Consulting <script>not code</script>',intendedUse:'Calculator on our website',employees:'3',clientSegment:'small',fullName:'Test Ә Person',role:'Owner',email:'partner@example.org',phoneMessenger:'@example',website:'https://example.org'};
async function financial(page){return page.evaluate(()=>{const model=calculateProductPortfolio();return JSON.stringify({portfolio:productPortfolio,model,cash:calculateProductCashFlow(model),draft:readSavedProductCalculation()});});}
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.HTML':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),protocol=[];
 try{
  for(const width of widths)for(const language of langs)for(const entry of ['Marketing_calc.HTML','US_Retail_Demo.HTML']){
   const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage(),errors=[],requests=[];let responseMode='failure';
   page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,async r=>{
    if(r.request().url()===endpoint){requests.push(JSON.parse(r.request().postData()));await new Promise(ok=>setTimeout(ok,100));if(responseMode==='offline')return r.abort();const status=responseMode==='rate'?429:responseMode==='rejected'?422:200;return r.fulfill({status,contentType:'application/json',body:JSON.stringify(responseMode==='success'?{ok:true}:{})});}
    return r.request().url().startsWith(base+'/')?r.continue():r.abort();
   });
   await page.goto(base+'/'+entry+'?demo=shopper&finance=cash&lang='+language,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});
   await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');await page.locator('#nomad360-lang-select').selectOption(language);
   await page.evaluate(endpoint=>{document.documentElement.setAttribute('data-nomad-partner-endpoint',endpoint);localStorage.setItem('partner-application-private-sentinel','PRIVATE-DRAFT-DO-NOT-SEND');},endpoint);
   const before=await financial(page);
   await page.locator('[data-nomad-embed-toggle]').click();
   const trigger=page.locator('#nomad360-partner-trigger');await trigger.scrollIntoViewIfNeeded();
   const geometry=await page.evaluate(()=>{
    const a=document.querySelector('[data-nomad-download-html]').getBoundingClientRect(),b=document.getElementById('nomad360-partner-trigger').getBoundingClientRect(),style=getComputedStyle(document.getElementById('nomad360-partner-trigger'));
    return {width:a.width-b.width,height:a.height-b.height,background:style.backgroundColor,color:style.color};
   });A.ok(Math.abs(geometry.width)<1&&Math.abs(geometry.height)<1,JSON.stringify(geometry));A.equal(geometry.background,'rgb(255, 255, 255)');A.equal(geometry.color,'rgb(23, 59, 88)');
   await trigger.click();await page.waitForFunction(()=>document.getElementById('nomad360-partner-dialog').open);
   const fieldStyle=await page.locator('#partner-activity').evaluate(e=>({border:getComputedStyle(e).borderTopWidth,padding:getComputedStyle(e).paddingLeft}));A.equal(fieldStyle.border,'1px');A.equal(fieldStyle.padding,'12px');
   A.equal(await page.locator('#partner-consentProcessing').isChecked(),false);A.equal(await page.locator('#partner-consentPublicProfile').isChecked(),false);
   // Publish empty-state UI only. No entered contact/application values in screenshots.
   A.equal(await page.evaluate(keys=>keys.every(key=>document.getElementById('partner-'+key).value===''),Object.keys(input)),true);
   await page.locator('#nomad360-partner-dialog').evaluate(e=>e.scrollTop=0);
   await page.screenshot({path:path.join(artifact,entry.replace('.HTML','')+'-'+language+'-'+width+'-top.png')});
   await page.locator('#nomad360-partner-dialog').evaluate(e=>e.scrollTop=e.scrollHeight);
   await page.screenshot({path:path.join(artifact,entry.replace('.HTML','')+'-'+language+'-'+width+'-bottom.png')});
   await page.locator('[data-partner-close]').focus();await page.keyboard.press('Shift+Tab');A.equal(await page.evaluate(()=>!!document.activeElement.closest('#nomad360-partner-dialog')),true);
   await page.keyboard.press('Tab');A.equal(await page.evaluate(()=>!!document.activeElement.closest('#nomad360-partner-dialog')),true);
   const submit=page.locator('#nomad360-partner-submit');await submit.click();A.equal(requests.length,0);A.equal(await page.locator('#partner-activity').getAttribute('aria-invalid'),'true');
   for(const [key,value] of Object.entries(input)){const field=page.locator('#partner-'+key);if(key==='clientSegment')await field.selectOption(value);else await field.fill(value);}
   await submit.click();A.equal(requests.length,0);A.equal(await page.locator('#partner-consentProcessing').getAttribute('aria-invalid'),'true');
   await page.locator('#partner-consentProcessing').check();
   const publish=(widths.indexOf(width)+langs.indexOf(language))%2===1;if(publish)await page.locator('#partner-consentPublicProfile').check();
   // Preserve inputs/consents across real language rerenders and footer reconstruction.
   const other=language==='en'?'kk':'en';
   await page.evaluate(other=>Nomad360UI.setLanguage(other),other);
   A.equal(await page.locator('#partner-fullName').inputValue(),input.fullName);A.equal(await page.locator('#partner-consentPublicProfile').isChecked(),publish);
   await page.evaluate(language=>Nomad360UI.setLanguage(language),language);
   await page.evaluate(()=>document.dispatchEvent(new CustomEvent('nomad360:currencychange')));
   A.equal(await page.locator('#nomad360-partner-trigger').count(),1);
   await submit.click();await page.waitForFunction(()=>!document.getElementById('nomad360-partner-submit').disabled);A.equal(requests.length,1);A.equal(await page.locator('#partner-email').inputValue(),input.email);
   for(const mode of ['rate','rejected','offline']){responseMode=mode;await submit.click();await page.waitForFunction(()=>!document.getElementById('nomad360-partner-submit').disabled);}
   A.equal(requests.length,4);
   responseMode='success';await submit.click();await page.evaluate(()=>document.getElementById('nomad360-partner-form').requestSubmit());
   await page.waitForFunction(()=>document.getElementById('nomad360-partner-status').textContent&&!document.getElementById('nomad360-partner-submit').hasAttribute('aria-busy'));
   A.equal(requests.length,5);A.equal(await submit.isDisabled(),true);A.equal(await page.locator('#partner-email').inputValue(),'');
   A.equal(new Set(requests.map(x=>x.application_id)).size,1,'Retry changed application ID');
   for(const payload of requests){A.equal(payload.consent_processing,true);A.equal(payload.consent_public_profile,publish);A.equal(payload.consent_version,'2026-10-23-v1');A.equal(payload.email,input.email);A.equal(payload.interface_language,language);A.equal(JSON.stringify(payload).includes('PRIVATE-DRAFT-DO-NOT-SEND'),false);A.deepEqual(Object.keys(payload).sort(),[...Object.keys(input),'consent_processing','consent_public_profile','consent_version','consented_at','application_id','interface_language','_subject'].sort());}
   await page.keyboard.press('Escape');A.equal(await page.locator('#nomad360-partner-dialog').evaluate(e=>e.open),false);A.equal(await page.evaluate(()=>document.activeElement.id),'nomad360-partner-trigger');
   A.equal(await financial(page),before,'Partner form changed calculator/draft');A.deepEqual(errors,[]);
   A.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   protocol.push({entry,width,language,requests:requests.length,consentPublicProfile:publish,equalButtons:true,financialUnchanged:true,pageErrors:0,overflow:false});
   await context.close();console.log('PARTNER_FORM_CASE_GREEN',entry,width,language);
  }
  const summary={matrix:protocol.length,requests:protocol.reduce((n,x)=>n+x.requests,0),mockedTransport:true,financialChanges:0,protocol};fs.writeFileSync(path.join(artifact,'protocol.json'),JSON.stringify(summary,null,2)+'\n');console.log('PARTNER_FORM_BROWSER_GREEN',JSON.stringify({...summary,protocol:undefined}));
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
