'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),near=(a,b)=>Math.abs(a-b)<.011;
function server(){return http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
  res.writeHead(404);return res.end();
 }
 res.setHeader('Content-Type',({'.HTML':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
 fs.createReadStream(file).pipe(res);
});}
(async()=>{
 const s=server();await new Promise(ok=>s.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+s.address().port+'/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const runs=[];
 try{
  for(const language of ['ru','en','kk'])for(const width of [390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:900}}),p=await ctx.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
   // Stage 7B-5 uses the public calculator without any preview flag.
   await p.goto(base+'Marketing_calc.HTML?demo=shopper&finance=cash',{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');
   await p.locator('#nomad360-lang-select').selectOption(language);
   const check=await p.evaluate(()=>{
    const old=calculateProductPortfolio(),cf=calculateProductCashFlow(old);
    const before=JSON.stringify({old,cf});
    if(!old.pricingReady||!cf.ready)throw Error('Shopper demo not ready for V1 PDF');
    if(!Nomad360SalesTaxV1.select('sales_tax'))throw Error('V1 Sales Tax selector unavailable');
    Nomad360SalesTaxV1.setRate('8');
    window.print=()=>{window.__printCalls=(window.__printCalls||0)+1;};
    const valid=exportProductCalculationPdf();
    const sheet=document.getElementById('nomad360-print-sheet');
    const text=sheet?.textContent||'';
    const money=cf.months.reduce((n,m)=>n+m.inflow-m.financedInflow,0);
    const savedResult={mode:Nomad360SalesTaxV1.getState(),tax:Nomad360SalesTax.quote({
      mode:'sales_tax',ratePct:8,enteredPrice:money
    }),valid,text,prints:window.__printCalls||0,
    unchanged:before===JSON.stringify({old:calculateProductPortfolio(),cf:calculateProductCashFlow(calculateProductPortfolio())})};
    return savedResult;
   });
   A.equal(check.valid,true,language+'/'+width+' V1 PDF');
   A.equal(check.prints,1);
   A.ok(check.text.includes('Sales Tax'),language+'/'+width+' explicit Sales Tax on printed document');
   A.ok(check.text.includes('NOMAD360'));
   A.ok(check.unchanged,'projection did not alter existing VAT-era finance');
   A.ok(near(check.tax.salesTax,check.tax.net*.08));
   const none=await p.evaluate(()=>{
    Nomad360SalesTaxV1.select('none');
    const output=saveProductCalculationToBrowser();
    const data=JSON.parse(localStorage.getItem('marketingCalcProductResultV1')||'null');
    return {output,mode:Nomad360SalesTaxV1.getState(),draft:data,vatRate:document.getElementById('own-sales-vat-pct')?.value};
   });
   A.equal(none.output,true);
   A.equal(none.mode.mode,'none');A.equal(none.draft.taxRegime,'none');
   A.equal(none.draft.productPortfolio[0].taxRegime,'none');
   await p.goto(base+'Marketing_calc.HTML?resume=1',{waitUntil:'domcontentloaded'});
   A.equal(await p.evaluate(()=>Nomad360SalesTaxV1.getState().mode),'none','none survives reload');
   A.deepEqual(errors,[],language+'/'+width+' runtime errors');
   runs.push({language,width,tax:check.tax.salesTax,buyer:check.tax.customerTotal,noneRestored:true});
   await ctx.close();
  }
  console.log('7B5_V1_PDF_AND_NONE_GREEN '+JSON.stringify(runs));
 }finally{await browser.close();await new Promise(done=>s.close(done));}
})().catch(e=>{console.error('7B5_V1_PDF_AND_NONE_RED',e.stack);process.exitCode=1;});
