'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const fixture=require('./fixtures/v1-engine/accepted-main.json');
const root=path.resolve(__dirname,'..'),base=process.env.V1_ENGINE_BASELINE_ROOT||'/tmp/v1-engine-base';
const artifact=path.join(root,'artifacts/v1-engine');fs.mkdirSync(artifact,{recursive:true});
const widths=(process.env.V1_ENGINE_WIDTHS||'320,360,390,430,768,1280').split(',').map(Number);
const languages=(process.env.V1_ENGINE_LANGUAGES||'ru,en,kk').split(',');
const css=path.join(artifact,'utilities.css');
const clean=v=>JSON.parse(JSON.stringify(v)),hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
async function settle(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
(async()=>{
 A.ok(fs.existsSync(path.join(base,'Marketing_calc.HTML')));A.ok(fs.existsSync(css));
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),before=url.pathname.startsWith('/before/'),dir=before?base:root;
  const file=path.resolve(dir,decodeURIComponent(before?url.pathname.slice(8):url.pathname.slice(1)));
  if(!file.startsWith(dir+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':({'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),protocol=[];
 try{
  for(const width of widths)for(const language of languages){
   let accepted;
   for(const variant of ['before','after']){
    const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route(/^https?:\/\//,r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
    const entry=origin+(variant==='before'?'/before/':'/')+'Marketing_calc.HTML?lang='+language;
    await page.goto(entry,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});
    await page.waitForFunction(()=>window.Nomad360UI&&typeof calculateProductPortfolio==='function');
    await page.locator('#nomad360-lang-select').selectOption(language);await settle(page);
    const goods=await page.evaluate(scenarios=>scenarios.map(({name,input})=>{
     productPortfolio.splice(0,productPortfolio.length,...JSON.parse(JSON.stringify(input.portfolio)));productBusinessTaxType=input.businessTaxType;
     productOwnChoices.salesVat=input.salesVatChoice;
     document.getElementById('own-business-tax-pct').value=input.businessTaxPct;
     document.getElementById('own-sales-vat-pct').value=input.salesVatPct;
     const portfolio=calculateProductPortfolio();
     return {name,portfolio,cash:calculateProductCashFlow(portfolio),
      plans:productPortfolio.map(aggregatePlanMetrics),credit:productPortfolio.map(calculateAggregateCredit),
      pricing:productPortfolio.map(calculatePriceListRange),vat:productPortfolio.map(aggregatePricingMetrics),
      quantity:productPortfolio.map(aggregateQuantityDetails)};
    }),fixture.scenarios);
    const simple=[];
    for(const scenario of fixture.simpleCases){
     const snapshot=await page.evaluate(({input})=>{
      selectServiceMode(input.mode);currentValues={...input.values};agentPayers={...input.payers};calculate();
      return {snapshot:onlineV1PortfolioSnapshot,
       summary:[...document.querySelectorAll('#summary-table [data-nomad-display-number]')].map(e=>e.dataset.nomadDisplayNumber),
       monthly:[...document.querySelectorAll('#monthly-table [data-nomad-display-number]')].map(e=>e.dataset.nomadDisplayNumber),
       result:['res-profit','res-romi','res-cpa','res-cac','service-simple-free-cash-value'].map(id=>({id,value:document.getElementById(id).dataset.nomadDisplayNumber}))};
     },scenario);simple.push({name:scenario.name,...snapshot});
    }
    const demos=[];
    for(const funding of ['cash','credit']){
     await page.goto(entry+'&demo=shopper&finance='+funding,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});
     await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');await settle(page);
     const data=await page.evaluate(()=>{
      const portfolio=calculateProductPortfolio();return {portfolio,cash:calculateProductCashFlow(portfolio),
       prices:productPortfolio.map(calculatePriceListRange),draft:readSavedProductCalculation(),
       overflow:document.documentElement.scrollWidth>innerWidth+1};
     });A.equal(data.overflow,false,variant+' '+width+' '+language+' shopper overflow');
     demos.push({funding,...data});
     if(funding==='cash')await page.locator('#product-portfolio-business-summary').screenshot({path:path.join(artifact,language+'-'+width+'-'+variant+'.png')});
    }
    A.deepEqual(errors,[],variant+' browser errors');
    const actual=clean({goods,simple,demos});
    if(variant==='before')accepted=actual;
    else{A.deepEqual(actual,accepted,width+'/'+language+' changed V1 financial or rendered results');
     protocol.push({width,language,goods:goods.length,simple:simple.length,demos:demos.length,baselineSha:fixture.base,
      exactParity:true,resultSha256:hash(actual),browserErrors:0,overflow:false});}
    await context.close();
   }
   console.log('V1_ENGINE_BROWSER_CASE_GREEN',width,language);
  }
  const summary={matrix:protocol.length,scenarios:protocol.reduce((n,p)=>n+p.goods+p.simple+p.demos,0),
   languages:languages.length,widths:widths.length,numericChanges:0,baselineSha:fixture.base,protocol};
  fs.writeFileSync(path.join(artifact,'protocol.json'),JSON.stringify(summary,null,2)+'\n');
  console.log('V1_ENGINE_BROWSER_GREEN',JSON.stringify({...summary,protocol:undefined}));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
