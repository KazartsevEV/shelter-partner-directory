'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('../palette/node_modules/playwright');
const root=path.resolve(process.argv[2]||'artifacts/public-site'),out=path.resolve(process.argv[3]||'artifacts/site-verification');fs.mkdirSync(out,{recursive:true});
const mirrored=new Set();
const manifest=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'))),allowed=new Set(manifest.files.map(x=>x.path)),prefix=manifest.basePath;
const {pathToFileURL}=require('node:url');
const serviceCases=require('../../tests/fixtures/v1-engine/accepted-main.json'),vat=require('../../tests/fixtures/sales-tax-7b/vat-inputs.json');
const mime={'.html':'text/html','.HTML':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.webmanifest':'application/manifest+json','.ico':'image/x-icon','.txt':'text/plain'};
(async()=>{
 const server=http.createServer((req,res)=>{try{
  const u=new URL(req.url,'http://local');if(!u.pathname.startsWith(prefix))throw Error();let rel=decodeURIComponent(u.pathname.slice(prefix.length));if(!rel||rel.endsWith('/'))rel+='index.html';
  if(!allowed.has(rel)&&rel!=='release-manifest.json')throw Error();const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 }catch(_){res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port,base=origin+prefix,browser=await chromium.launch({headless:true,args:['--no-sandbox']}),cases=[],missing=[],external=new Set(),seen=new Set();
 try{
  for(const width of [320,360,390,430,768,1280])for(const lang of ['ru','en','kk']){
   const ctx=await browser.newContext({viewport:{width,height:950},locale:lang==='ru'?'ru-RU':lang==='kk'?'kk-KZ':'en-US'}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)missing.push(r.url());if(r.url().startsWith(base))seen.add(new URL(r.url()).pathname.slice(prefix.length));});
   await page.route('**/*',r=>{if(r.request().url().startsWith(origin))return r.continue();external.add(new URL(r.request().url()).hostname);return r.abort();});
   await page.goto(base+'?demo=shopper&finance=cash&lang='+lang,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(out,'utilities.css')});await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');
   const model=await page.evaluate(()=>{const p=calculateProductPortfolio();return {portfolio:p,cash:calculateProductCashFlow(p)};});A.equal(model.cash.ready,true);
   const rows=[];
   for(const mode of ['self','hired','agent']){
    const input=serviceCases.simpleCases.find(x=>x.input.mode===mode).input;
    const r=await page.evaluate(x=>{selectServiceMode(x.mode);currentValues={...x.values};agentPayers={...x.payers};initInputs();calculate();return onlineV1PortfolioSnapshot;},input);A.ok(r);rows.push(mode);
   }
   for(const mode of ['standalone','linked']){
    const input=vat.cases.find(x=>x.kind===mode&&x.id.endsWith('profit-vat12-credit-3')).input;
    const ready=await page.evaluate(({mode,input})=>{
     localStorage.setItem(mode==='standalone'?'marketingCalcPortfolioV2':'marketingCalcLinkedPortfolioV2',JSON.stringify(input));
     if(mode==='standalone'){PortfolioV2UI.open({resume:true});return Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()).ready;}
     LinkedPortfolioV2UI.resume();return LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()).ready;
    },{mode,input});A.equal(ready,true);rows.push(mode);
   }
   const fullReady=await page.evaluate(()=>{Nomad360FullServiceUI.open({months:2,monthlyForecast:[10,8],capacity:20,priceGross:112,vatPct:12,discountPct:0,taxType:'profit',taxPct:15,unitCashCost:20,commissionPct:3,fixedCashMonthly:50,equipmentPurchase:500,equipmentAmortMonthly:10,reservePct:10,funding:'credit',annualRatePct:12,creditMonths:3},{kind:'offline',name:'Artifact fixture'});return Nomad360FullServiceUI.getResult().ready;});A.equal(fullReady,true);rows.push('full-service');
   await page.evaluate(()=>showHome());await page.evaluate(()=>document.fonts.ready);A.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   if([320,1280].includes(width))await page.locator('#nomad360-commercial-banner').screenshot({path:path.join(out,lang+'-'+width+'.png')});
   A.deepEqual(errors,[]);cases.push({width,lang,routes:rows,shopperReady:true});await ctx.close();console.log('SITE_BROWSER_CASE_GREEN',width,lang);
  }
  // Read every published HTML and load static locales/Help/license and real filled files.
  const html=manifest.files.filter(x=>/\.html$/i.test(x.path)&&x.path!=='index.html');
  for(const entry of html){
   const page=await browser.newPage({viewport:{width:390,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>{
    const url=r.request().url();if(url.startsWith(origin))return r.continue();
    if(url.startsWith('https://kazartsevev.github.io'+prefix)&&r.request().resourceType()!=='document'){
     const rel=decodeURIComponent(new URL(url).pathname.slice(prefix.length));if(!allowed.has(rel)){missing.push(url);return r.abort();}
     mirrored.add(rel);return r.fulfill({status:200,headers:{'content-type':mime[path.extname(rel)]||'application/octet-stream','access-control-allow-origin':'*'},body:fs.readFileSync(path.join(root,rel))});
    }return r.abort();
   });page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)missing.push(r.url());});
   await page.goto(base+entry.path,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);A.ok(await page.evaluate(()=>[...document.fonts].some(f=>f.family.replaceAll('\"','').replaceAll("'",'')==='Inter'&&f.status==='loaded')),entry.path+' Inter must load from artifact');A.deepEqual(errors,[],entry.path);await page.close();
  }
  const page=await browser.newPage();await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());await page.goto(base+'Marketing_calc.HTML');
  const marker='DO_NOT_SHIP_FINANCIAL_STATE_R3_TEST';await page.evaluate(marker=>{localStorage.setItem('marketingCalcProductResultV1',JSON.stringify({privateNote:marker}));document.body.append(document.createTextNode(marker));},marker);
  const portable=await page.evaluate(base=>Nomad360Delivery.buildStandalone(base),base);A.ok(portable.includes('data-nomad-bundled="./nomad360_v1_state.js"'));A.equal(portable.includes(marker),false,'User draft/DOM data must not enter the download');fs.writeFileSync(path.join(out,'standalone.html'),portable);await page.close();
  const offline=await browser.newPage();await offline.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());await offline.goto(pathToFileURL(path.join(out,'standalone.html')).href+'?demo=shopper&finance=cash',{waitUntil:'domcontentloaded'});await offline.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');A.equal(await offline.evaluate(()=>calculateProductCashFlow(calculateProductPortfolio()).ready),true);await offline.close();
  A.deepEqual(missing,[],'Artifact has missing dynamic resources');
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({sourceRevision:manifest.sourceRevision,artifactSha256:manifest.artifactSha256,browser:browser.version(),cases,offlineFinancialSmoke:true,draftExcluded:true,htmlChecked:html.length,seen:[...seen].sort(),absoluteFirstPartyResourcesMirrored:[...mirrored].sort(),externalHostsBlocked:[...external].sort(),missing,limits:['External provider calls are blocked; pinned local Tailwind is test instrumentation. Existing runtime CDN is not replaced by this packaging slice.','Staging origin, live TLS/redirects, private CI and provider credentials remain later steps.']},null,2)+'\n');console.log('SITE_ARTIFACT_BROWSER_GREEN',JSON.stringify({cases:cases.length,html:html.length,missing:0}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
