'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{startPreview}=require('../scripts/partners/release-preview/server.cjs');
const copy=require('../scripts/partners/release-preview/copy.json');
const output=path.resolve(process.env.PARTNER_PREVIEW_ARTIFACTS||'artifacts/partner-release-preview');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const {server,url}=await startPreview({schemaVersion:1,mode:'preview',issuanceEnabled:false}),base=new URL(url).origin;
 let browser;const matrix=[],screens=[];
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const width of [320,360,390,430,768,1280])for(const language of ['en','ru','kk']){
   const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage(),errors=[],external=[],posts=[];
   page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(!request.url().startsWith(base+'/'))external.push(request.url());if(request.method()!=='GET')posts.push(request.method());});
   await page.goto(base+'/preview/'+language+'/',{waitUntil:'networkidle'});
   const state=page.locator('#preview-status');
   const expectState=async phase=>{await A.equal(await state.getAttribute('data-phase'),phase);A.equal(await state.textContent(),copy[language][phase]);};
   const advance=async phase=>{await page.locator('[data-preview-event="'+phase+'"]').click();await expectState(phase);};
   const screenshot=async suffix=>{const file=language+'-'+width+'-'+suffix+'.png';await page.screenshot({path:path.join(output,file),fullPage:true});screens.push(file);};
   const geometry=async()=>A.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Horizontal overflow '+language+'/'+width);
   await expectState('idle');await geometry();
   await page.locator('#nomad360-partner-trigger').click();await page.locator('#nomad360-partner-submit').click();
   A.equal(await page.locator('#partner-activity').getAttribute('aria-invalid'),'true');await expectState('idle');
   const values={activity:'Fictional consulting',intendedUse:'Test calculator installation',employees:'2',clientSegment:'small',fullName:'Fixture Person',email:'fixture@example.invalid'};
   for(const [key,value] of Object.entries(values)){const field=page.locator('#partner-'+key);if(key==='clientSegment')await field.selectOption(value);else await field.fill(value);}
   await page.locator('#partner-consentProcessing').check();
   for(const mode of ['rate','rejected','failure']){
    // Programmatic selection of the fixture control is necessary while the
    // native form dialog is modal. It does not submit any network request.
    await page.locator('#preview-response').evaluate((select,value)=>{select.value=value;select.dispatchEvent(new Event('change'));},mode);
    await page.locator('#nomad360-partner-submit').click();
    await page.waitForFunction(()=>!document.getElementById('nomad360-partner-submit').disabled);
    await expectState('idle');A.ok((await page.locator('#nomad360-partner-status').textContent()).length>0);
    A.equal(await page.locator('#partner-email').inputValue(),values.email);
   }
   // Change the language inside the modal: fields and lifecycle must survive.
   const other=language==='en'?'ru':'en';
   await page.locator('#preview-language').evaluate((select,value)=>{select.value=value;select.dispatchEvent(new Event('change'));},other);
   A.equal(await page.locator('#partner-email').inputValue(),values.email);
   await page.locator('#preview-language').evaluate((select,value)=>{select.value=value;select.dispatchEvent(new Event('change'));},language);
   await page.locator('#preview-response').evaluate(select=>{select.value='accepted';select.dispatchEvent(new Event('change'));});
   await page.locator('#nomad360-partner-submit').click();
   await page.waitForFunction(()=>document.getElementById('preview-status').dataset.phase==='applicationAccepted');
   await expectState('applicationAccepted');
   A.equal(await page.locator('#nomad360-partner-status').textContent(),copy[language].applicationAccepted);
   A.equal(await page.locator('#partner-company').inputValue(),'');A.equal(await page.locator('#partner-website').inputValue(),'');
   A.equal(await page.locator('#preview-site').textContent(),copy[language].withoutSite);
   A.equal(await page.locator('#partner-consentPublicProfile').isChecked(),false);
   await page.keyboard.press('Escape');A.equal(await page.evaluate(()=>document.activeElement.id),'nomad360-partner-trigger');
   await geometry();await screenshot('application-no-site');
   await advance('verificationAccepted');await advance('expiredConfirmation');
   A.equal(await page.locator('[data-preview-event="emailVerified"]').count(),0);
   await advance('verificationAccepted');await advance('emailVerified');await advance('preparing');await advance('archiveReady');
   await advance('deliveryUnknown');A.equal(await page.locator('[data-preview-event="preparing"]').count(),0);
   await geometry();await screenshot('delivery-unknown');
   await advance('deliveryAccepted');A.equal(await page.locator('[data-preview-event]').count(),0);await screenshot('delivery-accepted');
   // Switching language never resets a verified state or fabricates a request.
   await page.locator('#preview-language').selectOption(other);A.equal(await state.getAttribute('data-phase'),'deliveryAccepted');
   await page.locator('#preview-language').selectOption(language);await expectState('deliveryAccepted');
   A.deepEqual(posts,[]);A.deepEqual(external,[]);A.deepEqual(errors,[]);
   matrix.push({width,language,withoutCompanyAndWebsite:true,requiredConsent:true,optionalPublicProfile:true,errorsAndRetry:3,expiredConfirmation:true,unknownDeliveryNoAutomaticRetry:true,noNetworkPosts:true,noExternalRequests:true,noPageErrors:true});
   await context.close();console.log('PARTNER_RELEASE_PREVIEW_CASE_GREEN',width,language);
  }
  // Positive website scenario, using the same real form and a fictional URL.
  const page=await browser.newPage();await page.goto(url);await page.locator('#nomad360-partner-trigger').click();
  for(const [key,value] of Object.entries({activity:'Test',intendedUse:'Test',employees:'0',fullName:'Fixture',email:'fixture@example.invalid',website:'https://example.invalid'}))await page.locator('#partner-'+key).fill(value);
  await page.locator('#partner-clientSegment').selectOption('micro');await page.locator('#partner-consentProcessing').check();await page.locator('#nomad360-partner-submit').click();
  await page.waitForFunction(()=>document.getElementById('preview-status').dataset.phase==='applicationAccepted');
  A.equal(await page.locator('#preview-site').textContent(),copy.en.withSite);await page.close();
  const sourceFiles=['scripts/partners/release-policy.cjs','scripts/partners/release-preview/server.cjs','scripts/partners/release-preview/model.js','scripts/partners/release-preview/app.js','scripts/partners/release-preview/copy.json','scripts/partners/release-preview/style.css','nomad360_partner_application.js','nomad360_partner_application_model.js','nomad360_partner_application.css','tests/partner_release_preview_browser.cjs'];
  const sourceHashes=Object.fromEntries(sourceFiles.map(file=>[file,require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
  const protocol={previewOnly:true,liveIssuanceEnabled:false,nodeVersion:process.version,playwrightVersion:require('playwright/package.json').version,sourceHashes,matrix,withWebsiteCase:true,screenshots:screens.length,actualMailSent:false,actualArchiveBuilt:false};
  fs.writeFileSync(path.join(output,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');console.log('PARTNER_RELEASE_PREVIEW_GREEN',JSON.stringify({matrix:matrix.length,screenshots:screens.length,liveIssuanceEnabled:false}));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
