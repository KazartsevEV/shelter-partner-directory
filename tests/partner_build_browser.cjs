'use strict';
const A=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {buildPackage}=require('../scripts/partners/build.cjs'),{normalize,sha256}=require('../scripts/partners/config.cjs');
const {chromium}=require('playwright'),fixture=require('./fixtures/v1-engine/accepted-main.json');
const config=require('./fixtures/partner-build/example.json'),root=path.resolve(__dirname,'..');
const artifact=path.join(root,'artifacts/partner-build'),css=path.join(artifact,'utilities.css');
const widths=(process.env.PARTNER_WIDTHS||'320,360,390,430,768,1280').split(',').map(Number),langs=(process.env.PARTNER_LANGUAGES||'ru,en,kk').split(',');
const clean=x=>JSON.parse(JSON.stringify(x));
(async()=>{
 await fs.mkdir(artifact,{recursive:true});
 const first=await buildPackage(config),second=await buildPackage(config);
 A.equal(first.html,second.html,'Repeated build changes package bytes');A.deepEqual(first.manifest,second.manifest);
 A.equal(sha256(first.html),first.manifest.files[0].sha256);A.equal(Buffer.byteLength(first.html),first.manifest.files[0].bytes);
 A.equal(first.manifest.configSha256,sha256(JSON.stringify(normalize(config))));
 A.ok(first.manifest.resources.length>30);A.equal(new Set(first.manifest.resources.map(x=>x.path)).size,first.manifest.resources.length);
 for(const record of first.manifest.resources){const bytes=await fs.readFile(path.join(root,record.path));A.equal(record.sha256,sha256(bytes),record.path);A.equal(record.bytes,bytes.length);}
 await fs.writeFile(path.join(artifact,first.filename),first.html);await fs.writeFile(path.join(artifact,'manifest.json'),JSON.stringify(first.manifest,null,2)+'\n');
 const malicious=clean(config);malicious.partner.displayName='</script><script>window.__partnerInjection=1</script>';
 const hostile=await buildPackage(malicious);A.ok(hostile.html.includes('\\u003c/script\\u003e'));
 const mime={'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/package.html'||url.pathname==='/hostile.html'){res.setHeader('Content-Type','text/html');return res.end(url.pathname==='/package.html'?first.html:hostile.html);}
   const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep))throw Error('path');
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
  }catch(_){res.writeHead(404);res.end();}
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),protocol=[];
 try{
  const attack=await browser.newPage();await attack.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await attack.goto(base+'/hostile.html',{waitUntil:'domcontentloaded'});
  const payload=await attack.evaluate(()=>({injection:window.__partnerInjection===1,data:JSON.parse(document.getElementById('nomad360-package-config').textContent)}));
  A.equal(payload.injection,false);A.deepEqual(payload.data,normalize(malicious));await attack.close();
  for(const width of widths)for(const language of langs){
   let expected;
   for(const variant of ['source','package']){
    const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route(/^https?:\/\//,r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
    const url=base+(variant==='source'?'/Marketing_calc.HTML':'/package.html')+'?lang='+language;
    await page.goto(url,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});
    await page.waitForFunction(()=>window.Nomad360V1Engine&&window.Nomad360UI);await page.locator('#nomad360-lang-select').selectOption(language);
    const results=await page.evaluate(f=>{
     const e=Nomad360V1Engine;
     return {goods:f.scenarios.map(({input})=>{
      const engine=e.create(input),portfolio=engine.calculateProductPortfolio();return {portfolio,cash:engine.calculateProductCashFlow(portfolio),
       plans:input.portfolio.map(engine.aggregatePlanMetrics),credit:input.portfolio.map(engine.calculateAggregateCredit),
       pricing:input.portfolio.map(engine.calculatePriceListRange),vat:input.portfolio.map(engine.aggregatePricingMetrics),quantity:input.portfolio.map(engine.aggregateQuantityDetails)};
     }),simple:f.simpleCases.map(({input})=>{const {ready,...numbers}=e.calculateSimpleService(input);if(!ready)throw Error('not ready');return numbers;})};
    },fixture);
    A.deepEqual(clean(results.goods),fixture.scenarios.map(x=>x.expected));A.deepEqual(clean(results.simple),fixture.simpleCases.map(x=>x.expected));
    const demos=[];
    for(const funding of ['cash','credit']){
     await page.goto(url+'&demo=shopper&finance='+funding,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});
     await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');
     const demo=await page.evaluate(()=>{const model=calculateProductPortfolio();return {model,cash:calculateProductCashFlow(model),prices:productPortfolio.map(calculatePriceListRange),draft:readSavedProductCalculation(),overflow:document.documentElement.scrollWidth>innerWidth+1};});
     A.equal(demo.overflow,false,variant+'/'+width+'/'+language);demos.push(demo);
     if(funding==='cash')await page.locator('#product-portfolio-business-summary').screenshot({path:path.join(artifact,language+'-'+width+'-'+variant+'.png')});
    }
    A.deepEqual(errors,[],variant+' errors');
    const actual=clean({results,demos});if(variant==='source')expected=actual;else{
     A.deepEqual(actual,expected);protocol.push({width,language,scenarios:fixture.scenarios.length+fixture.simpleCases.length+2,numericChanges:0,overflow:false,browserErrors:0});
    }
    await context.close();
   }
   console.log('PARTNER_BROWSER_CASE_GREEN',width,language);
  }
  const summary={sourceRevision:first.manifest.sourceRevision,matrix:protocol.length,scenarios:protocol.reduce((n,x)=>n+x.scenarios,0),resources:first.manifest.resources.length,
   reproducible:true,injectionBlocked:true,numericChanges:0,protocol};
  await fs.writeFile(path.join(artifact,'protocol.json'),JSON.stringify(summary,null,2)+'\n');console.log('PARTNER_BROWSER_GREEN',JSON.stringify({...summary,protocol:undefined}));
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
