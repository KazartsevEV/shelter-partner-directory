'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const {base:baselineSha}=require('./fixtures/tax-draft-storage/extraction.json');
const fixtures=require('./fixtures/v1-engine/accepted-main.json');
const root=path.resolve(__dirname,'..'),baseline=process.env.TAX_DRAFT_BASELINE_ROOT||'/tmp/tax-draft-base';
const artifact=path.join(root,'artifacts/tax-draft-storage');fs.mkdirSync(artifact,{recursive:true});
const css=path.join(artifact,'utilities.css'),widths=(process.env.TAX_DRAFT_WIDTHS||'320,360,390,430,768,1280').split(',').map(Number);
const langs=(process.env.TAX_DRAFT_LANGUAGES||'ru,en,kk').split(',');
const selected=['own','resale','dropship','service-simple','service-full','service-agent','service-online']
 .map(prefix=>fixtures.scenarios.find(x=>x.name===prefix+'-turnover-credit'));
function clean(value){return JSON.parse(JSON.stringify(value,(k,v)=>k==='savedAt'?undefined:v));}
(async()=>{
 A.ok(fs.existsSync(css));A.ok(fs.existsSync(path.join(baseline,'US_Retail_Demo.HTML')));
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://local'),before=url.pathname.startsWith('/before/'),dir=before?baseline:root;
  const file=path.resolve(dir,decodeURIComponent(url.pathname.slice(before?8:1)));
  if(!file.startsWith(dir+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),protocol=[];
 try{
  for(const width of widths)for(const language of langs)for(const entry of ['Marketing_calc.HTML','US_Retail_Demo.HTML']){
   let expected;
   for(const variant of ['before','after']){
    const ctx=await browser.newContext({viewport:{width,height:950}}),page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
    await page.route(/^https?:\/\//,r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
    const url=origin+(variant==='before'?'/before/':'/')+entry+'?lang='+language;
    async function load(){await page.goto(url,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:css});await page.waitForFunction(()=>window.Nomad360SalesTaxServiceV1&&window.Nomad360SalesTaxV1);await page.locator('#nomad360-lang-select').selectOption(language);}
    await load();const cases=[];
    for(const [index,fixture] of selected.entries()){
     const mode=['vat','sales_tax','none'][(widths.indexOf(width)+langs.indexOf(language)+index)%3];
     const result=await page.evaluate(({fixture,mode})=>{
      const key='marketingCalcProductResultV1',simpleKey='nomad360SalesTaxSimpleV1';
      const input=fixture.input,items=JSON.parse(JSON.stringify(input.portfolio));
      const first=items[0];first.id=1;const second=JSON.parse(JSON.stringify(first));second.id=2;second.name+=' 2';
      const payload={savedAt:'2026-10-22T00:00:00Z',currency:'USD',activeProductId:1,
       productPortfolio:[first,second],taxType:input.businessTaxType,businessTaxPct:input.businessTaxPct,
       salesVat:input.salesVatChoice,salesVatPct:input.salesVatPct};
      localStorage.clear();localStorage.setItem(key,JSON.stringify(payload));
      localStorage.setItem(simpleKey,JSON.stringify({mode:'sales_tax',rate:'8.2500'}));
      if(!resumeSavedProductCalculation())throw Error('resume failed '+fixture.name);
      const tax=first.source==='offline-service'?Nomad360SalesTaxServiceV1:Nomad360SalesTaxV1;
      if(first.source==='offline-service'){tax.selectFull(mode);if(mode==='sales_tax')tax.setFullRate('8.25');}
      else{tax.select(mode);if(mode==='sales_tax')tax.setRate('8.25');}
      const saved=saveProductCalculationToBrowser();if(!saved)throw Error('save failed '+fixture.name+'/'+mode);
      let record=JSON.parse(localStorage.getItem(key));
      if(record.taxRegime!==mode)throw Error('tax regime not persisted');
      if(mode==='sales_tax'&&record.salesTaxPct!=='8.25')throw Error('tax rate not persisted');
      document.getElementById('product-name-input').value='Edited '+fixture.name;
      document.getElementById('product-name-input').dispatchEvent(new Event('input',{bubbles:true}));
      const edited=saveProductCalculationToBrowser();if(!edited)throw Error('edit save failed');
      record=JSON.parse(localStorage.getItem(key));
      const financial=calculateProductPortfolio(),cash=calculateProductCashFlow(financial);
      const fresh=startFreshProductCalculation();
      if(localStorage.getItem(key)!==JSON.stringify(record))throw Error('fresh destroyed stored draft');
      if(!resumeSavedProductCalculation())throw Error('resume after fresh failed');
      if(!deleteCalculatedProduct(2))throw Error('delete second failed');
      const remaining=JSON.parse(localStorage.getItem(key));
      if(remaining.productPortfolio.length!==1||remaining.productPortfolio[0].id!==1)throw Error('stale deleted SKU');
      if(!deleteCalculatedProduct(1))throw Error('delete final failed');
      if(localStorage.getItem(key)!==null)throw Error('final deletion retained draft');
      if(localStorage.getItem(simpleKey)!==JSON.stringify({mode:'sales_tax',rate:'8.2500'}))throw Error('delete reset simple tax');
      return {name:fixture.name,mode,saved,edited,record,financial,cash,remaining,fresh,deleted:true};
     },{fixture,mode});cases.push(result);
    }
    // A persisted tax choice must survive a real document reload.
    await page.evaluate(record=>{localStorage.setItem('marketingCalcProductResultV1',JSON.stringify(record));Nomad360SalesTaxServiceV1.selectSimple('sales_tax');Nomad360SalesTaxServiceV1.setSimpleRate('8.2500');},cases[cases.length-1].record);
    await load();const restored=await page.evaluate(()=>Nomad360SalesTaxServiceV1.getSimple());
    A.deepEqual(restored,{mode:'sales_tax',rate:'8.2500'});
    const reloaded=await page.evaluate(()=>{if(!resumeSavedProductCalculation())throw Error('reload resume failed');const financial=calculateProductPortfolio();return {record:readSavedProductCalculation(),financial,cash:calculateProductCashFlow(financial),tax:Nomad360SalesTaxServiceV1.getFull()};});
    const malformed=await page.evaluate(()=>{
     const key='marketingCalcProductResultV1';localStorage.setItem(key,'{');
     return {read:readSavedProductCalculation(),resume:resumeSavedProductCalculation(),raw:localStorage.getItem(key)};
    });A.deepEqual(malformed,{read:null,resume:false,raw:'{'});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);A.equal(overflow,false);
    await page.screenshot({path:path.join(artifact,entry.replace('.HTML','')+'-'+language+'-'+width+'-'+variant+'.png')});
    // Storage getter itself can be forbidden (private/embedded browsing).
    await ctx.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}}));
    await load();const denied=await page.evaluate(()=>{
     Nomad360SalesTaxServiceV1.selectSimple('sales_tax');Nomad360SalesTaxServiceV1.setSimpleRate('8');
     const read=readSavedProductCalculation(),resume=resumeSavedProductCalculation();
     productName='Denied storage';productSource='own';productPortfolio.push({id:1,name:productName,source:'own',inputs:{}});
     return {read,resume,saved:saveProductCalculationToBrowser(),simple:Nomad360SalesTaxServiceV1.getSimple()};
    });A.equal(denied.read,null);A.equal(denied.resume,false);A.equal(denied.saved,false);A.deepEqual(errors,[],variant+'/'+entry+' errors');
    const actual=clean({cases,restored,reloaded,malformed,denied});
    if(variant==='before')expected=actual;else{
     A.deepEqual(actual,expected,entry+'/'+language+'/'+width+' storage or numeric regression');
     protocol.push({entry,language,width,scenarios:cases.length+4,exactParity:true,browserErrors:0,overflow:false,
      resultSha256:crypto.createHash('sha256').update(JSON.stringify(actual)).digest('hex')});
    }
    await ctx.close();
   }
   console.log('TAX_DRAFT_CASE_GREEN',entry,language,width);
  }
  const summary={baselineSha,matrix:protocol.length,scenarios:protocol.reduce((n,x)=>n+x.scenarios,0),numericChanges:0,protocol};
  fs.writeFileSync(path.join(artifact,'protocol.json'),JSON.stringify(summary,null,2)+'\n');
  console.log('TAX_DRAFT_BROWSER_GREEN',JSON.stringify({...summary,protocol:undefined}));
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
