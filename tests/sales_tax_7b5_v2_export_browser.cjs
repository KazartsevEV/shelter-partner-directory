'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const Excel=require('../vendor/exceljs-4.4.0.min.js'),{fixture}=require('./portfolio_v2_f3_fixture.cjs');
const root=path.resolve(__dirname,'..'),near=(a,b)=>Math.abs(a-b)<.011;
function server(){return http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.HTML':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
 fs.createReadStream(file).pipe(res);
});}
function standalone(){return {version:2,currency:'USD',
 marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,periodMonths:2,cacReservePct:100},
 skus:[{id:'a',name:'Handmade items',source:'own',unitCost:20,marginPct:25,mixPct:50,batchUnits:20,initialCashOut:400,fulfillmentPerOrder:3,storagePerUnitDay:0,acquiringPct:0},
 {id:'b',name:'Retail goods',source:'resale',unitCost:30,marginPct:25,mixPct:50,batchUnits:20,initialCashOut:600,fulfillmentPerOrder:3,storagePerUnitDay:0,acquiringPct:0}],
 resources:[],funding:{kind:'cash',reservePct:10},tax:{type:'turnover',pct:6,vatPct:12,taxRegime:'sales_tax',salesTaxPct:'8'}};}
async function readState(p,kind){return p.evaluate(kind=>{
 const state=(kind==='linked'?LinkedPortfolioV2UI:PortfolioV2UI).getState();
 const calc=kind==='linked'?LinkedPortfolioV2Engine.build:Nomad360PaymentUI.buildPortfolio;
 const raw=calc(kind==='linked'?Nomad360SalesTaxV2.prepareLinked(state,{mode:state.tax?.taxRegime||'vat',ratePct:state.tax?.salesTaxPct}):Nomad360SalesTaxV2.prepareStandalone(state,{mode:state.tax?.taxRegime||'vat',ratePct:state.tax?.salesTaxPct}));
 const out=state.tax?.taxRegime==='sales_tax'?Nomad360SalesTaxV2.project(raw,{mode:'sales_tax',ratePct:state.tax.salesTaxPct}):raw;
 const doc=Nomad360PriceExport.document({state,out,kind},Nomad360UI.getLanguage());
 return {state,out,doc};
},kind);}
(async()=>{
 const s=server();await new Promise(ok=>s.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+s.address().port+'/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),receipts=[];
 try{for(const kind of ['standalone','linked'])for(const lang of ['ru','en','kk'])for(const width of [390,1280]){
  const ctx=await browser.newContext({viewport:{width,height:900},acceptDownloads:true}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await p.goto(base+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
  await p.locator('#nomad360-lang-select').selectOption(lang);
  if(kind==='standalone')await p.evaluate(state=>{localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(state));PortfolioV2UI.open({resume:true});},standalone());
  else{
   const f=fixture();
   await p.evaluate(f=>{
    const payload={currency:'KZT',skus:f.skus.filter(s=>s.source!=='online-service'),tax:{...f.tax,taxRegime:'sales_tax',salesTaxPct:'8'}};
    LinkedPortfolioV2UI.importFromV1(payload);
    // Preserve the real V1→V2 handoff contract instead of bypassing strict
    // single-regime/single-rate validation for an agent sourced from V1.
    Nomad360SalesTaxV2.withTransfer({mode:'sales_tax',ratePct:8},()=>
      LinkedPortfolioV2UI.appendOnline(f.skus.find(s=>s.source==='online-service')));
    const state=LinkedPortfolioV2UI.getState();state.tax={...state.tax,taxRegime:'sales_tax',salesTaxPct:'8'};
    state.resources=f.resources;state.offers=f.offers;state.forecastMonths=f.forecastMonths;state.recurringDemandApproved=true;
    localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify(state));LinkedPortfolioV2UI.resume();
   },f);
  }
  const before=await readState(p,kind);
  A.equal(before.out.ready,true,kind+'/'+lang);
  A.equal(before.doc.taxMode,'sales_tax');
  A.ok(near(before.out.salesTaxSummary.salesTax,before.out.salesTaxSummary.net*.08));
  A.ok(before.doc.notes.some(n=>n.includes('Sales Tax')));
  A.ok(before.doc.rows.some(r=>r[6]!==null&&r[6]>r[4]*(1-(Number(r[5])||0)/100)));
  A.equal(await p.evaluate(()=>{window.print=()=>{window.__prints=(window.__prints||0)+1;};return Nomad360UI.savePrint('price');}),true);
  A.equal(await p.evaluate(()=>window.__prints),1);
  const print=await p.locator('#nomad360-print-sheet').innerText();
  A.ok(print.includes('Sales Tax'),'print states actual tax');
  const printBuyerPrices=await p.locator('#nomad360-print-sheet [data-nomad-customer-price]').allTextContents();
  A.equal(printBuyerPrices.length,before.doc.rows.length,'every PDF item must match Excel rows');
  const parseBuyer=s=>{
   const v=s.replace(/[^0-9.,-]/g,'');
   if(!v)return null;
   const dec=Math.max(v.lastIndexOf('.'),v.lastIndexOf(','));
   return Number(dec<0?v:v.slice(0,dec).replace(/[.,]/g,'')+'.'+v.slice(dec+1).replace(/[.,]/g,''));
  };
  for(let i=0;i<before.doc.rows.length;i++){
   const expected=before.doc.rows[i][6],actual=parseBuyer(printBuyerPrices[i]);
   if(expected===null)A.equal(actual,null,'principal customer unit price cannot be inferred from an agent fee');
   else A.ok(near(actual,expected),'PDF/Excel buyer price mismatch for '+before.doc.rows[i][0]+': '+actual+' vs '+expected);
  }
  if(kind==='linked'){
   A.equal(await p.evaluate(()=>Nomad360UI.savePrint('report')),true);
   const report=await p.locator('#nomad360-print-sheet').innerText();
   const hasPrincipal=Object.values(before.out.cashflow?.periodPnl?.bySku||{}).some(x=>x?.partner?.months?.length);
   if(hasPrincipal){
    const principalTitle=await p.evaluate(language=>Nomad360LocaleCore.t('ui.principalEconomicsByMonth',language),lang);
    A.ok(report.includes(principalTitle),'principal report heading uses active locale');
    A.ok(!report.includes('Выручка принципала без НДС'),'Sales Tax must not be called VAT');
   }
  }
  const download=p.waitForEvent('download');
  A.equal(await p.evaluate(()=>Nomad360UI.saveExcel()),true);
  const d=await download,bytes=fs.readFileSync(await d.path()),workbook=new Excel.Workbook();await workbook.xlsx.load(bytes);
  A.equal(workbook.worksheets[0].rowCount,before.doc.rows.length+1);
  for(let i=0;i<before.doc.rows.length;i++)for(const cell of [5,6,7]){
    A.equal(workbook.worksheets[0].getRow(i+2).getCell(cell).value,before.doc.rows[i][cell-1]);
  }
  for(const l of ['en','kk','ru']){await p.locator('#nomad360-lang-select').selectOption(l);const switched=await readState(p,kind);A.deepEqual(switched.state,before.state);A.deepEqual(switched.out,before.out);}
  await p.reload({waitUntil:'domcontentloaded'});
  await p.evaluate(kind=>kind==='linked'?LinkedPortfolioV2UI.resume():PortfolioV2UI.open({resume:true}),kind);
  const restored=await readState(p,kind);A.deepEqual(restored.state,before.state);A.deepEqual(restored.out,before.out);
  A.deepEqual(errors,[]);
  if(kind==='linked'&&lang==='en'&&width===1280){
   const dir=path.join(root,'artifacts','sales-tax-7b5');fs.mkdirSync(dir,{recursive:true});
   await p.locator('[data-nomad-embed-toggle]').click();
   const event=p.waitForEvent('download');await p.locator('[data-nomad-download-html]').click();
   const portable=await event,file=path.join(dir,'sales-tax-portable.html');await portable.saveAs(file);
   const html=fs.readFileSync(file,'utf8');
   A.ok(html.length>100000,'actual self-contained HTML must be downloaded');
   A.ok(!html.includes('<script src="./nomad360_sales_tax_v2.js">'),'V2 tax module bundled inline');
   A.ok(!html.includes('<script src="./nomad360_price_export.js">'),'exporter bundled inline');
   const offline=await ctx.newPage(),offlineErrors=[];
   offline.on('pageerror',e=>offlineErrors.push(e.message));
   await offline.route(/^https?:\/\//,r=>r.abort());
   await offline.goto(require('node:url').pathToFileURL(file).href,{waitUntil:'domcontentloaded'});
   const loaded=await offline.evaluate(()=>({
    tax:typeof Nomad360SalesTax?.quote,projection:typeof Nomad360SalesTaxV2?.project,
    excel:typeof Nomad360PriceExport?.write,
    v1:typeof Nomad360SalesTaxV1?.select,
    services:typeof Nomad360SalesTaxServiceV1?.selectFull
   }));
   A.deepEqual(loaded,{tax:'function',projection:'function',excel:'function',v1:'function',services:'function'});
   const offlineQuote=await offline.evaluate(()=>Nomad360SalesTax.quote({mode:'sales_tax',ratePct:8,enteredPrice:90}));
   A.ok(near(offlineQuote.tax,7.2)&&near(offlineQuote.customerTotal,97.2),'autonomous HTML calculates Sales Tax offline');
   A.deepEqual(offlineErrors,[],'portable offline HTML JavaScript');
   await offline.close();
  }
  receipts.push({kind,lang,width,skus:before.doc.rows.length,tax:before.out.salesTaxSummary.salesTax,buyer:before.out.salesTaxSummary.customerTotal,excel:true,pdf:true,restore:true,languagePreserved:true});
  await ctx.close();
 }
 console.log('7B5_V2_EXPORT_BROWSER_GREEN '+JSON.stringify(receipts));
 }finally{await browser.close();await new Promise(ok=>s.close(ok));}
})().catch(e=>{console.error('7B5_V2_EXPORT_BROWSER_RED',e.stack);process.exitCode=1;});
