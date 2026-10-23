'use strict';
// Manual, opt-in acceptance only: one labelled synthetic application to the owner-supplied handler.
// Never run from CI. The marker prevents accidental repeated live submissions.
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright'),{createHash}=require('node:crypto');
(async()=>{
 if(process.env.PARTNER_LIVE_SEND!=='1')throw Error('Set PARTNER_LIVE_SEND=1 for the single owner-authorized live acceptance');
 const root=path.resolve(__dirname,'..'),dir=path.join(root,'artifacts/partner-application');fs.mkdirSync(dir,{recursive:true});
 const marker=path.join(dir,'live-attempt.json');fs.writeFileSync(marker,JSON.stringify({startedAt:new Date().toISOString(),synthetic:true})+'\n',{flag:'wx'});
 const endpoint='https://formspree.io/f/xqppzrbp';
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.HTML':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const base='http://127.0.0.1:'+server.address().port;
 const proxy=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(proxy?{proxy:{server:proxy,bypass:'127.0.0.1,localhost'}}:{})}),page=await browser.newPage();
 try{
  await page.route(/^https?:\/\//,r=>r.request().url().startsWith(base+'/')||r.request().url()===endpoint?r.continue():r.abort());
  await page.goto(base+'/Marketing_calc.HTML?lang=en',{waitUntil:'domcontentloaded'});await page.locator('#nomad360-lang-select').selectOption('en');
  await page.locator('[data-nomad-embed-toggle]').click();await page.locator('#nomad360-partner-trigger').click();
  const input={company:'TEST — Nomad360 partner form acceptance',activity:'Automated technical test, not a real partnership application.',intendedUse:'Verify the owner-supplied partner endpoint. No calculator model or personal customer data is included.',employees:'0',fullName:'Nomad360 technical test',email:'nomad260393@gmail.com'};
  for(const [key,value] of Object.entries(input))await page.locator('#partner-'+key).fill(value);
  await page.locator('#partner-clientSegment').selectOption('micro');await page.locator('#partner-consentProcessing').check();
  let count=0;page.on('request',r=>{if(r.url()===endpoint&&r.method()==='POST')count++;});
  const wait=page.waitForResponse(r=>r.url()===endpoint&&r.request().method()==='POST',{timeout:20000});
  await page.locator('#nomad360-partner-submit').click();const response=await wait;let receipt=null;try{receipt=await response.json();}catch(_){}
  const result={testedAt:new Date().toISOString(),endpoint,origin:base,synthetic:true,sourceRevision:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),implementationSha256:Object.fromEntries(['nomad360_partner_application.js','nomad360_partner_application_model.js','nomad360_partner_transport.js','nomad360_partner_application.css'].map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])),status:response.status(),receipt,postCount:count,mailboxDeliveryVerified:false,archiveCodeDeliveryImplemented:false};
  fs.writeFileSync(path.join(dir,'live-protocol.json'),JSON.stringify(result,null,2)+'\n');
  A.equal(response.ok(),true);A.equal(receipt?.ok,true);A.equal(count,1);
  await page.waitForFunction(()=>document.getElementById('nomad360-partner-status').textContent.includes('Your application has been received'));
  A.equal(await page.locator('#nomad360-partner-submit').isDisabled(),true);
  console.log('PARTNER_FORM_LIVE_ACCEPTED',JSON.stringify(result));
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
