'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const Excel=require('../vendor/exceljs-4.4.0.min.js'),{fixture}=require('./portfolio_v2_f3_fixture.cjs');
const root=path.join(__dirname,'..'),art=path.join(root,'artifacts','excel');fs.mkdirSync(art,{recursive:true});
const entry=process.env.NOMAD360_TEST_URL||pathToFileURL(path.join(root,'Marketing_calc.HTML')).href;
const standalone=()=>({version:2,currency:'USD',marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,periodMonths:2,cacReservePct:100},skus:['=1+1','+SUM(1)','-1+2','@SUM(1)'].map((name,i)=>({id:i?'sku-'+i:'0007',name:name+' · Қазақша русский English',source:['own','resale','dropship','own'][i],unitCost:20,marginPct:25,mixPct:25,batchUnits:i===2?0:20,initialCashOut:i===2?0:400,fulfillmentPerOrder:3,storagePerUnitDay:0,acquiringPct:0})),resources:[],funding:{kind:'cash',reservePct:10},tax:{type:'turnover',pct:6,vatPct:12}});
async function rendered(page){return page.evaluate(()=>{
 const bad=[];if(document.documentElement.scrollWidth>innerWidth+1)bad.push('page overflow');
 for(const b of document.querySelectorAll('#nomad360-portfolio-tools button')){
  if(!b.getClientRects().length)continue;const r=b.getBoundingClientRect();if(r.x<0||r.right>innerWidth+1||r.height<44||b.scrollWidth>b.clientWidth+1)bad.push(b.textContent);
 }return bad;
});}
async function expected(page,kind){return page.evaluate(kind=>{
 const state=kind==='linked'?LinkedPortfolioV2UI.getState():PortfolioV2UI.getState(),out=kind==='linked'?LinkedPortfolioV2Engine.build(state):Nomad360PaymentUI.buildPortfolio(state);
 return {state,out,kind};
},kind);}
async function checkDownload(page,kind,stem,requests){
 // Export readiness is asserted from the calculator state and the enabled control.\n // Waiting for global networkidle is nondeterministic with unrelated background requests.\n await page.locator('[data-nomad-excel]').last().scrollIntoViewIfNeeded();\n A.equal(await page.locator('[data-nomad-excel]').last().isEnabled(),true);
 const c=await expected(page,kind),state=JSON.stringify(c.state),requestCount=requests.length;
 const lang=await page.evaluate(()=>Nomad360UI.getLanguage());const event=page.waitForEvent('download');await page.locator('[data-nomad-excel]').last().click();const dl=await event;
 A.equal(dl.suggestedFilename(),'nomad360-price-'+c.state.currency+'.xlsx');const target=path.join(art,stem+'.xlsx');await dl.saveAs(target);
 const w=new Excel.Workbook();await w.xlsx.load(fs.readFileSync(target));A.equal(w.worksheets.length,2);A.equal(w.worksheets[0].rowCount,c.out.items.length+1);
 const s=w.worksheets[0],visible=await page.locator('#nomad360-price-preview tbody tr').all();
 A.equal(visible.length,c.out.items.length);
 for(let i=0;i<c.out.items.length;i++){
  const item=c.out.items[i],r=s.getRow(i+2),base=kind==='linked'?item.priceList:item.price,buyer=kind==='linked'?item.priceGross:item.priceWithVat;
  A.equal(r.getCell(1).value,item.id);A.equal(r.getCell(2).value,item.name);A.ok(r.getCell(3).value);A.equal(r.getCell(4).value,c.state.currency);A.equal(r.getCell(5).value,base);A.equal(r.getCell(7).value,buyer);A.equal(r.getCell(6).value,kind==='linked'?item.discountSelected:null);
  if(kind==='linked'){
   const nums=[item.priceMin,item.priceMax,item.targetMarginPct,item.actualAfterTaxMargin];
   for(let j=0;j<4;j++){
    const v=Number.isFinite(nums[j])?nums[j]:null;
    A.equal(r.getCell(9+j).value,v,'V1→V2 field '+(9+j)+' must be real engine output');
    A.equal(r.getCell(9+j).numFmt,'0.00');
   }
   A.equal(s.columnCount,12);
  }else A.equal(s.columnCount,8,'standalone V2 has no V1 price bounds');
  A.equal(r.getCell(2).type,Excel.ValueType.String);for(const cell of r._cells)A.equal(cell.formula,undefined);
  const formatted=await page.evaluate(({lang,base,buyer})=>{const f=new Intl.NumberFormat(lang==='ru'?'ru-RU':lang==='kk'?'kk-KZ':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2});return [f.format(base),f.format(buyer)];},{lang,base,buyer});
  A.equal((await visible[i].locator('td').nth(2).textContent()).trim(),formatted[0]);A.equal((await visible[i].locator('td').nth(4).textContent()).trim(),formatted[1]);
 }
 A.equal(JSON.stringify((await expected(page,kind)).state),state);A.deepEqual((await expected(page,kind)).out,c.out);A.deepEqual(requests.slice(requestCount),[],'Export must make zero network requests');
 return {file:stem+'.xlsx',kind,lang,currency:c.state.currency,items:c.out.items.map(x=>({id:x.id,name:x.name,base:kind==='linked'?x.priceList:x.price,discount:kind==='linked'?x.discountSelected:null,customer:kind==='linked'?x.priceGross:x.priceWithVat,
  ...(kind==='linked'?{min:Number.isFinite(x.priceMin)?x.priceMin:null,max:Number.isFinite(x.priceMax)?x.priceMax:null,target:Number.isFinite(x.targetMarginPct)?x.targetMarginPct:null,margin:Number.isFinite(x.actualAfterTaxMargin)?x.actualAfterTaxMargin:null}:{})})),sheetNames:w.worksheets.map(s=>s.name),noExportRequests:true};
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.NOMAD360_CHROMIUM_PATH||undefined,args:['--no-sandbox']}),cases=[];
 try{
 for(const width of [320,360,390,430,768,1280])for(const lang of ['ru','en','kk'])for(const kind of ['linked','standalone']){
  const page=await browser.newPage({viewport:{width,height:900},acceptDownloads:true}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{
   // The existing donation iframe loads independently of local XLSX export.
   // Ignore only its known embed navigation; all other HTTP requests remain failures.
   const url=r.url();
   if(/^https?:/.test(url)&&!url.startsWith('https://nowpayments.io/embeds/donation-widget?'))requests.push(url);
  });
  await page.route(/^https?:\/\//,r=>entry.startsWith('http')&&r.request().url().startsWith(new URL('./',entry).href)?r.continue():r.abort());await page.goto(entry,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(root,'artifacts','excel-utilities.css')});
  await page.waitForFunction(()=>window.Nomad360PriceExport&&window.ExcelJS&&window.Nomad360UI);await page.locator('#nomad360-lang-select').selectOption(lang);
  if(kind==='linked'){
   await page.locator('#business-currency').selectOption('KZT');const p=fixture();p.skus[0].name='=HYPERLINK("https://invalid.example","x") · Қазақша';p.skus[1].name='+SUM(1) русский English';
   await page.evaluate(p=>{LinkedPortfolioV2UI.importFromV1({currency:'KZT',skus:p.skus.filter(s=>s.source!=='online-service'),tax:p.tax});LinkedPortfolioV2UI.appendOnline(p.skus.find(s=>s.source==='online-service'));const s=LinkedPortfolioV2UI.getState();s.resources=p.resources;s.offers=p.offers;s.forecastMonths=p.forecastMonths;s.recurringDemandApproved=true;s.skus[0].discountSelected=5;localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify(s));LinkedPortfolioV2UI.resume();},p);
  }else await page.evaluate(s=>{
   s.skus[1].unitCost=10;s.skus[1].payments={unitCost:Nomad360Payments.apply(10,'CNY','USD',Nomad360Currency.valid,{rate:2,date:'2026-01-02',source:'manual',sourceLabel:'XLSX fixture'})};
   localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(s));openPortfolioV2(true);
  },standalone());
  A.equal((await expected(page,kind)).out.ready,true,JSON.stringify((await expected(page,kind)).out.errors));
  A.equal((await expected(page,kind)).state.currency,kind==='linked'?'KZT':'USD');
  if(kind==='standalone'){
   const c=await expected(page,kind);A.equal(c.state.skus[1].unitCost,10);A.equal(c.state.skus[1].payments.unitCost.paymentCurrency,'CNY');A.equal(c.state.skus[1].payments.unitCost.conversion.rate,2);A.equal(c.out.items[1].unitCost,20);
  }
  await page.locator('[data-nomad-price-toggle]').click();const stem=width+'-'+lang+'-'+kind;cases.push({width,...await checkDownload(page,kind,stem,requests)});
  A.deepEqual(await rendered(page),[]);await page.locator('#nomad360-portfolio-tools').screenshot({path:path.join(art,stem+'.png')});
  const before=await expected(page,kind);for(const next of ['en','kk','ru']){await page.locator('#nomad360-lang-select').selectOption(next);A.deepEqual(await expected(page,kind),before);}
  await page.locator('#nomad360-lang-select').selectOption(lang);await page.reload({waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(root,'artifacts','excel-utilities.css')});
  await page.evaluate(kind=>kind==='linked'?LinkedPortfolioV2UI.resume():openPortfolioV2(true),kind);A.deepEqual(await expected(page,kind),before);
  await page.locator('[data-nomad-price-toggle]').click();const restored=await checkDownload(page,kind,stem+'-restored',requests);A.deepEqual(restored.items,cases.at(-1).items);
  await page.evaluate(()=>{window.__pricePrint=0;window.print=()=>window.__pricePrint++});await page.locator('[data-nomad-export="price"]').click();A.equal(await page.evaluate(()=>window.__pricePrint),1);A.equal(await page.locator('#nomad360-print-sheet tbody tr').count(),before.out.items.length);
  if(width===320&&lang==='ru'){
   await page.evaluate(()=>window.__lastExcel=ExcelJS);await page.evaluate(()=>{window.ExcelJS=null});A.equal(await page.evaluate(()=>Nomad360UI.saveExcel()),false);A.ok(await page.locator('#nomad360-export-feedback').textContent());await page.evaluate(()=>{window.ExcelJS=window.__lastExcel});
   let downloads=0;page.on('download',()=>downloads++);
   await page.evaluate(()=>{
    const original=Nomad360PriceExport;window.__originalPriceExport=original;
    window.Nomad360PriceExport={...original,write:async(doc,x)=>{const b=await original.write(doc,x);await new Promise(resolve=>window.__releaseExcel=resolve);return b;}};
    window.__pendingExcel=Nomad360UI.saveExcel();
   });
   await page.waitForFunction(()=>typeof window.__releaseExcel==='function');
   if(kind==='linked')await page.locator('[data-linked-path="skus.0.discountSelected"]').fill('7');else await page.locator('[data-p2-path="marketing.cpc"]').fill('6');
   await page.evaluate(()=>window.__releaseExcel());A.equal(await page.evaluate(()=>window.__pendingExcel),false);A.equal(downloads,0,'An edited model must revoke the in-flight export');
   A.match(await page.locator('#nomad360-export-feedback').textContent(),/изменился/);await page.evaluate(()=>window.Nomad360PriceExport=window.__originalPriceExport);
   await page.evaluate(kind=>{const key=kind==='linked'?'marketingCalcLinkedPortfolioV2':'marketingCalcPortfolioV2';const s=JSON.parse(localStorage.getItem(key));s.skus=[];localStorage.setItem(key,JSON.stringify(s));if(kind==='linked')LinkedPortfolioV2UI.resume();else PortfolioV2UI.refreshPayments();},kind);
   // Linked restoration invalidates its engine output; standalone invalidation
   // is exercised via a real editable field, not by mutating a detached draft.
   if(kind==='standalone')await page.locator('[data-p2-path="marketing.cpc"]').fill('0');
   A.equal(await page.locator('[data-nomad-excel]').first().isDisabled(),true);A.equal(await page.evaluate(()=>Nomad360UI.saveExcel()),false);
  }
  A.deepEqual(errors,[]);await page.close();
 }
 fs.writeFileSync(path.join(art,'protocol.json'),JSON.stringify({caseCount:cases.length,downloads:cases.length*2,cases},null,2));console.log('EXCEL_BROWSER_GREEN',JSON.stringify({cases:cases.length,downloads:cases.length*2,languages:3,widths:6}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
