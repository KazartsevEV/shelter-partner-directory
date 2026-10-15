'use strict';
// Audit published bytes through urllib's verified TLS/proxy transport. This is
// not a direct Chrome TLS connection and must not be reported as a CWV sample.
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFile}=require('node:child_process'),{promisify}=require('node:util');
const {chromium}=require('playwright');
const {verify}=require('../../tests/shopper_v1_oracle.cjs');
const run=promisify(execFile),root=path.resolve(__dirname,'../..');
const out=path.join(root,'docs/seo/evidence');
const base='https://kazartsevev.github.io/shelter-partner-directory/';
const cache=new Map(),network=[];
const py=`import urllib.request,urllib.error,sys,json,base64
try:r=urllib.request.urlopen(sys.argv[1],timeout=40)
except urllib.error.HTTPError as e:r=e
with r:
 print(json.dumps({'status':r.status,'contentType':r.headers.get('Content-Type','application/octet-stream'),'body':base64.b64encode(r.read()).decode()}))`;
async function fetchBytes(url){
 if(!cache.has(url))cache.set(url,run('python',['-c',py,url],{maxBuffer:15*1024*1024}).then(r=>JSON.parse(r.stdout)));
 return cache.get(url);
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true}),cases=[],demoCases=[];
 try{
 for(const lang of ['en','ru','kk']){
  const ctx=await browser.newContext({locale:'en-US',viewport:{width:390,height:900},reducedMotion:'reduce'});
  await ctx.addInitScript(l=>{if(location.origin==='https://kazartsevev.github.io')localStorage.setItem('nomad360PreferredLanguage',l);},lang);
  await ctx.route(/^https?:\/\//,async route=>{
   const url=route.request().url();
   if(!url.startsWith(base)&&!url.startsWith('https://cdn.tailwindcss.com/')){const u=new URL(url);network.push({url:u.origin+u.pathname,outcome:'blocked-external-in-audit'});return route.abort();}
   try{const r=await fetchBytes(url),body=Buffer.from(r.body,'base64'),file=path.resolve(root,new URL(url).pathname.replace('/shelter-partner-directory/',''));
    const sameOrigin=url.startsWith(base),localMatch=sameOrigin&&file.startsWith(root+path.sep)&&fs.existsSync(file)&&fs.statSync(file).isFile()?body.equals(fs.readFileSync(file)):null;
    network.push({url,outcome:r.status,sha256:crypto.createHash('sha256').update(body).digest('hex'),localMatch});
    if(sameOrigin)A.equal(localMatch,true,'Published asset must match the accepted main baseline');
    await route.fulfill({status:r.status,contentType:r.contentType,body});}
   catch(e){network.push({url,outcome:'transport-error',error:e.message});await route.abort();}
  });
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'Marketing_calc.HTML?lang='+(lang==='ru'?'en':'ru'),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.Nomad360UI);await page.evaluate(()=>document.fonts.ready);
  const initial=await page.evaluate(()=>({language:Nomad360UI.getLanguage(),htmlLang:document.documentElement.lang,h1:[...document.querySelectorAll('h1')].filter(e=>e.getClientRects().length).map(e=>e.textContent.trim()),title:document.title,overflow:document.documentElement.scrollWidth>innerWidth+1}));
  A.equal(initial.language,lang,'Baseline query parameter must not override existing stored language');
  await page.screenshot({path:path.join(out,`live-${lang}-390-home.png`)});
  await page.locator('.nomad-intro-cta').click();
  A.equal(await page.locator('#nomad360-selling-choice').isVisible(),true);
  await page.locator('#start-service').click();
  const service=await page.evaluate(()=>[...document.querySelectorAll('section[id]')].filter(e=>e.getClientRects().length&&!e.closest('[hidden],.hidden')).map(e=>e.id));
  await page.evaluate(()=>showHome());await page.locator('#start-multi-portfolio').click();
  A.equal(await page.locator('#portfolio-v2-screen').isVisible(),true);
  await page.evaluate(()=>showHome());await page.locator('[data-nomad-embed-toggle]').click();
  A.equal(await page.locator('#nomad360-embed-comparison').isVisible(),true);
  const counter=await page.locator('[data-nomad-traffic-stats]').textContent();A.match(counter,/GitHub/);
  A.deepEqual(errors,[]);
  cases.push({storedLanguage:lang,queryLanguage:lang==='ru'?'en':'ru',initial,serviceVisibleSections:service,v2Opened:true,b2bOpened:true,counter,errors});
  if(lang==='en')for(const finance of ['cash','credit']){
   await page.goto(base+'Marketing_calc.HTML?demo=shopper&finance='+finance,{waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true'&&productPortfolio.length===1&&calculateProductCashFlow(calculateProductPortfolio()).ready);
   const snap=()=>({currency:Nomad360Currency.get(),product:productPortfolio[0],model:calculateProductPortfolio(),cash:calculateProductCashFlow(calculateProductPortfolio()),cycle:aggregatePlanMetrics(productPortfolio[0]),credit:calculateAggregateCredit(productPortfolio[0]),priceList:calculatePriceListRange(productPortfolio[0])});
   const data=await page.evaluate(snap),o=verify(data,finance);
   await page.evaluate(()=>Nomad360UI.setLanguage('ru'));
   A.deepEqual(await page.evaluate(snap),data,'Manual language change must preserve the demo model');
   await page.locator('#product-demo-banner').screenshot({path:path.join(out,`live-demo-${finance}-390.png`)});
   demoCases.push({finance,independentOraclePassed:true,languageChangePreservesNumbers:true,currency:data.currency,priceGross:o.priceGross,capital:o.capital});
  }
  await ctx.close();
 }
 A.ok(network.filter(r=>r.url.startsWith(base)).every(r=>r.outcome===200&&r.localMatch===true));
 fs.writeFileSync(path.join(out,'live-browser.json'),JSON.stringify({checkedAt:new Date().toISOString(),transport:'Published HTTPS bytes fetched using urllib with inherited proxy and verified CA; fulfilled unchanged in Chromium. Tailwind CDN responded 403; no substitute CSS injected. Third-party donation widget blocked, no payment or mail sent. Not field/lab performance measurements.',cases,demoCases,network},null,2)+'\n');
 console.log('SEO_PHASE_A_LIVE_BROWSER',JSON.stringify({cases:cases.length,demoCases:demoCases.length,resources:cache.size,errors:cases.flatMap(c=>c.errors)}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
