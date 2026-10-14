'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const {verify,oracle,close}=require('./shopper_v1_oracle.cjs');
const Excel=require('../vendor/exceljs-4.4.0.min.js');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/shopper-v1');fs.mkdirSync(out,{recursive:true});
const entry=process.env.NOMAD360_TEST_URL||pathToFileURL(path.join(root,'Marketing_calc.HTML')).href;
const cases=[],termCases=[],downloads=[],widths=[320,360,390,430,768,1280],langs=['ru','en','kk'];
const snap=()=>({currency:Nomad360Currency.get(),product:productPortfolio[0],model:calculateProductPortfolio(),cash:calculateProductCashFlow(calculateProductPortfolio()),cycle:aggregatePlanMetrics(productPortfolio[0]),credit:calculateAggregateCredit(productPortfolio[0]),priceList:calculatePriceListRange(productPortfolio[0])});
async function load(page,finance){await page.goto(entry+'?demo=shopper&finance='+finance,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true'&&productPortfolio.length===1&&productBusinessTaxType==='profit'&&calculateProductCashFlow(calculateProductPortfolio()).ready);await page.addStyleTag({path:path.join(root,'artifacts/l0-utilities.css')});}
async function geometry(page){return page.evaluate(()=>{
 const root=document.getElementById('product-screen');
 const offenders=[...root.querySelectorAll('*')].filter(e=>e.getClientRects().length&&!e.closest('.overflow-x-auto')&&e.getBoundingClientRect().right>innerWidth+2).slice(0,12).map(e=>({id:e.id,class:e.className,right:e.getBoundingClientRect().right}));
 const invalid=[...root.querySelectorAll('input')].filter(e=>e.getClientRects().length&&!e.disabled&&e.value!==''&&!e.checkValidity()).map(e=>({id:e.id,class:e.className,value:e.value,step:e.step}));
 const gaps=Nomad360LocaleCore.auditVisibleGaps();
 const markers=root.textContent.match(/⟦[^⟧]*⟧/g)||[];
 const brokenNumbers=[...root.querySelectorAll('[data-nomad-display-money]')].filter(e=>e.getClientRects().length).flatMap(e=>{
  const text=e.firstChild;if(!text||text.nodeType!==Node.TEXT_NODE)return [];
  const number=text.nodeValue.replace(/\s*KZT\s*$/,'');const range=document.createRange();range.setStart(text,0);range.setEnd(text,number.length);
  const lines=new Set([...range.getClientRects()].map(r=>Math.round(r.top))).size;
  return lines>1?[{text:number,lines}]:[];
 });
 return {pageOverflow:document.documentElement.scrollWidth>innerWidth+1,offenders,invalid,gaps,markers,brokenNumbers};
});}
async function capture(page,stem){
 const sections=[['materials','#product-materials-block'],['production','#product-production-block'],['logistics','#product-logistics-block'],['sales','#product-sales-block'],['funnel','#product-ad-block'],['planning','#product-tax-block'],['prices','#product-tax-price-list'],['cash-flow','#product-portfolio-business-summary'],['assumptions','#product-demo-banner']];
 const shots=[];
 for(const [name,selector] of sections){const el=page.locator(selector+', [data-frozen-original-id="'+selector.slice(1)+'"]').filter({visible:true}).first();A.equal(await el.isVisible(),true,'Demo stage must be visible: '+name);await el.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));const filename=stem+'-'+name+'.png';await el.screenshot({path:path.join(out,filename)});shots.push(filename);
  if(name==='cash-flow'){
   const ledger=el.locator('.overflow-x-auto').first();A.equal(await ledger.isVisible(),true);
   await ledger.evaluate(e=>e.scrollLeft=e.scrollWidth-e.clientWidth);
   const last=stem+'-cash-flow-last-month.png';await ledger.screenshot({path:path.join(out,last)});shots.push(last);
   await ledger.evaluate(e=>e.scrollLeft=0);
  }
 }
 return shots;
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.NOMAD360_CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
 for(const width of widths)for(const finance of ['cash','credit']){
  const context=await browser.newContext({locale:'ru-RU',viewport:{width,height:900},acceptDownloads:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:\/\//,r=>entry.startsWith('http')&&r.request().url().startsWith(new URL('./',entry).href)?r.continue():r.abort());
  // Visiting a demonstration must not overwrite an existing personal calculation.
  await load(page,finance);
  await page.evaluate(()=>{history.replaceState(null,'',location.pathname);productName='Personal saved calculation';productPortfolio[0].name=productName;document.getElementById('product-name-input').value=productName;saveProductCalculationToBrowser();});
  const localBefore=await page.evaluate(()=>localStorage.getItem('marketingCalcProductResultV1'));
  A.ok(JSON.parse(localBefore).productPortfolio.length===1);
  await load(page,finance);
  A.equal(await page.evaluate(()=>saveProductCalculationToBrowser()),false);
  A.equal(await page.evaluate(()=>localStorage.getItem('marketingCalcProductResultV1')),localBefore);
  const baseline=await page.evaluate(snap);verify(baseline,finance);
  A.equal(await page.locator('#own-sales-vat-pct').inputValue(),'16');A.equal(await page.locator('#own-business-tax-pct').inputValue(),'20');
  A.equal(await page.locator('[data-tax-price-product-id="1"] [data-discount-input-wrap]').isVisible(),true);
  A.equal(await page.locator('#own-production-workers-country').inputValue(),'KZ');A.equal(await page.locator('#own-material-rows .material-cost-row').count(),4);A.equal(await page.locator('.equipment-rental-row').count(),1);
  for(const lang of langs){
   const beforeLanguage=await page.evaluate(snap);
   await page.locator('#nomad360-lang-select').selectOption(lang);await page.waitForTimeout(100);
   verify(await page.evaluate(snap),finance);
   A.deepEqual(await page.evaluate(snap),beforeLanguage,'Language must not change inputs or finance');
   const g=await geometry(page);if(g.pageOverflow||g.invalid.length||g.gaps.length||g.markers.length)console.log('SHOPPER_GEOMETRY',JSON.stringify({width,finance,lang,...g}));
   A.equal(g.pageOverflow,false);A.deepEqual(g.invalid,[]);A.deepEqual(g.gaps,[]);A.deepEqual(g.markers,[]);A.deepEqual(g.brokenNumbers,[],'Numeric amounts must stay on one line');
   const screenshots=[320,390,1280].includes(width)?await capture(page,`${finance}-${lang}-${width}`):[];
   const pdf=await page.evaluate(()=>{window.print=()=>{};const ok=exportProductCalculationPdf();return {ok,text:document.getElementById('nomad360-print-sheet').textContent,cells:document.querySelectorAll('#nomad360-print-sheet td').length};});
   A.equal(pdf.ok,true);A.match(pdf.text,/KZT/);A.ok(pdf.cells>40);A.ok(!pdf.text.includes('⟦'));
   // Numeric rows on screen must exactly use the ledger's source values.
   const rows=await page.evaluate(()=>[...document.querySelectorAll('#product-portfolio-business-summary table tbody tr')].map(r=>[...r.querySelectorAll('[data-nomad-display-money]')].map(e=>Number(e.dataset.nomadDisplayNumber))));
   for(const [i,key] of ['inflow','outflow','taxPaid','interestPaid','principalRepaid','cashFlow','cumulative','freeCumulative'].entries())A.deepEqual(rows[i],baseline.cash.months.map(m=>m[key]));
   cases.push({width,finance,language:lang,...g,screenshots,horizon:baseline.cash.horizonDays,months:baseline.cash.months.length,capital:baseline.cycle.requiredCapital,finalFreeCash:baseline.cash.freeCumulativeEnd,pdf:true});
  }
  if(width===390){
   // A deliberately saved COPY exercises the normal public serializer and
   // restoration; the demo URL itself remains nonpersistent, as before.
   await page.evaluate(()=>history.replaceState(null,'',location.pathname));
   A.equal(await page.evaluate(()=>saveProductCalculationToBrowser()),true);
   const copy=await page.evaluate(snap);await page.goto(entry+'?resume=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>productPortfolio.length===1);await page.addStyleTag({path:path.join(root,'artifacts/l0-utilities.css')});
   verify(await page.evaluate(snap),finance);A.deepEqual(await page.evaluate(snap),copy,'Stored V1 copy must restore exact inputs, dynamic rows and results');
   A.equal(await page.locator('#own-material-rows .material-cost-row').count(),4);A.equal(await page.locator('.material-cost-price').first().inputValue(),'1000');
   await load(page,finance);
   verify(await page.evaluate(snap),finance);
   if(finance==='credit')for(const term of [1,3,12]){
    await page.locator('[data-business-product-id="1"] [data-credit-term-input]').fill(String(term));
    const data=await page.evaluate(snap),o=verify(data,'credit',term);
    A.equal(o.months.reduce((n,m)=>n+m.sold,0),500,'Loan duration must not create extra sales');
    A.equal(o.months[term-1].principalRepaid,o.capital);
    if(term===1)A.ok(data.cash.months[0].cumulative<0,'Early repayment exposes funding gap');
    if(term===12)for(const m of data.cash.months.slice(5))A.equal(m.inflow,0,'No stock → no invented revenue');
    const screenshot='credit-term-'+term+'-cash-flow.png';await page.locator('#product-portfolio-business-summary').screenshot({path:path.join(out,screenshot)});
    termCases.push({term,horizon:o.horizon,monthly:o.months,source:data,screenshot});
   }
   await load(page,finance);
   // Both original URLs deterministically reproduce the full filled interface.
   verify(await page.evaluate(snap),finance);
   for(const lang of langs){
    await page.locator('#nomad360-lang-select').selectOption(lang);
    A.equal(await page.evaluate(()=>openLinkedPortfolioFromProducts()),true);
    const linked=await page.evaluate(()=>({state:LinkedPortfolioV2UI.getState(),model:LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState())}));
    A.equal(linked.state.currency,'KZT');A.equal(linked.state.tax.type,'profit');A.equal(linked.state.tax.pct,20);A.equal(linked.model.ready,true,JSON.stringify(linked.model.errors));A.equal(linked.model.items.length,1);
    const expected=oracle(finance),sku=linked.state.skus[0];
    for(const [key,value] of Object.entries({unitCost:expected.unitCost,forecastUnitsPerMonth:150,adBudget:250000,baseCac:expected.cac,vatPct:16,maxDiscountPct:10,priceMin:expected.listMin,priceMax:expected.listMax,creditServiceMonthly:expected.interest,inventoryQty:500,materialsBatchTotal:expected.materials,productionTotal:expected.production,reserveAmount:expected.reserve}))close(sku[key],value,'V1→V2 '+key);
    const dlEvent=page.waitForEvent('download');await page.locator('[data-nomad-excel]').last().click();const dl=await dlEvent,filename=`${finance}-${lang}.xlsx`;await dl.saveAs(path.join(out,filename));
    const book=new Excel.Workbook();await book.xlsx.load(fs.readFileSync(path.join(out,filename)));const r=book.worksheets[0].getRow(2),item=linked.model.items[0];
    A.equal(book.worksheets.length,2);A.equal(r.getCell(4).value,'KZT');A.equal(r.getCell(5).value,item.priceList);A.equal(r.getCell(7).value,item.priceGross);A.equal(r.getCell(2).value,item.name);
    downloads.push({finance,lang,file:filename,priceList:item.priceList,priceCustomer:item.priceGross,exactWorkbookMatch:true});
    await page.locator('[data-linked-back]').click();
   }
   if(finance==='cash'){
    // Downloaded full calculator must include this case and semantic strings.
    const event=page.waitForEvent('download');await page.locator('[data-nomad-download-html]').click();const dl=await event;const file=path.join(out,'nomad360-embedded.html');await dl.saveAs(file);const html=fs.readFileSync(file,'utf8');A.ok(html.includes('populateRealisticShopperDemonstration'));A.ok(html.includes('demo.shopper.title'));A.ok(!/<script[^>]+src="\.\//.test(html));
    // Serve the actual downloaded edition under an isolated origin path.
    await page.route('**/shopper-embedded.HTML*',r=>r.fulfill({status:200,contentType:'text/html',body:html}));
    const embedded=new URL(entry);embedded.pathname=embedded.pathname.replace(/[^/]+$/,'shopper-embedded.HTML');embedded.search='?demo=shopper&finance=cash';
    await page.goto(embedded.href);await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true'&&productPortfolio.length===1);verify(await page.evaluate(snap),'cash');
    await page.locator('#own-product-ad-cpc').fill('0');
    const invalid=await page.evaluate(()=>({model:calculateProductPortfolio(),cash:calculateProductCashFlow(calculateProductPortfolio())}));
    A.equal(invalid.model.pricingReady,false);A.equal(invalid.cash.ready,false);
    await page.goto(entry,{waitUntil:'domcontentloaded'});A.equal(await page.evaluate(()=>productPortfolio.length),0);A.equal(await page.locator('#product-demo-banner').isVisible(),false);
    const legacy=require('./fixtures/shopper-v1-legacy.json').cases[0];
    await page.evaluate(item=>localStorage.setItem('marketingCalcProductResultV1',JSON.stringify({productPortfolio:[item],activeProductId:1,taxType:'turnover',businessTaxPct:6,salesVat:'yes',salesVatPct:12})),legacy.product);
    await page.goto(entry+'?resume=1');await page.waitForFunction(()=>productPortfolio.length===1);
    const restored=await page.evaluate(snap);A.equal(restored.currency,'USD','Old saves without currency retain USD');
    for(const key of ['unitCost','forecastSales','price'])close(restored.model.items[0][key],legacy.model.items[0][key],'Legacy '+key);
    for(let i=0;i<legacy.cash.months.length;i++)for(const key of ['inflow','outflow','taxPaid','cashFlow','cumulative','freeCumulative'])close(restored.cash.months[i][key],legacy.cash.months[i][key],'Legacy month '+(i+1)+' '+key);
   }
  }
  A.deepEqual(errors,[]);await context.close();console.log('SHOPPER_WIDTH_GREEN',JSON.stringify({width,finance}));
 }
 const summary={cases:cases.length,widths,languages:langs,financing:['cash','credit'],independentDailyLedger:true,financialValuesSingleLine:true,loanTerms:[1,3,12],exports:downloads.length,screenshots:cases.reduce((n,c)=>n+c.screenshots.length,0)+termCases.length,stageScreenshots:cases.reduce((n,c)=>n+c.screenshots.length,0),loanTermScreenshots:termCases.length,pageOverflow:0,visibleTranslationGaps:0,draftPreserved:true,savedCopyRestored:true,embeddedDemoReproduced:true,legacyDraftWithoutCurrencyRestored:true,zeroDemandBlocksFinance:true,ordinaryUrlEmpty:true};
 fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({summary,cases,termCases,downloads,cash:oracle('cash'),credit:oracle('credit')},null,2)+'\n');console.log('SHOPPER_V1_ACCEPTANCE_GREEN',JSON.stringify(summary));
 }finally{await browser.close()}
})().catch(e=>{console.error('SHOPPER_V1_ACCEPTANCE_RED',e.stack||e);process.exitCode=1});
