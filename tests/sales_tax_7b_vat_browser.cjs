'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),A=require('node:assert/strict'),zlib=require('node:zlib'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=path.resolve(process.env.SALES_TAX_BASELINE_ROOT||root),capture=process.argv.includes('--capture'),expected='12c1ad7d8490c08f0f11b2899b6df4e801d024a5',dir=path.join(root,capture?'docs/reviews/sales-tax-7b/baseline/browser':'artifacts/sales-tax-7b/vat-after'),fixtures=require('./fixtures/sales-tax-7b/vat-inputs.json'),Excel=require('../vendor/exceljs-4.4.0.min.js');
fs.mkdirSync(dir,{recursive:true});if(capture){A.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),expected);A.equal(execFileSync('git',['diff','--name-only','HEAD'],{cwd:source,encoding:'utf8'}).trim(),'');}
// Only accepted visible column names may differ from frozen VAT print
// snapshots. Numeric output, customer prices, VAT, owner and text remain
// byte-identical. Replacements are explicit RU/EN/KK approved label pairs.
const approvedPrintLabels=[
 ['Цена продажи за ед. без НДС','Цена V2 без НДС'],
 ['Цена по прайсу V2 за ед. с НДС','Прайс V2'],
 ['Unit selling price excl. VAT','V2 price excluding VAT'],
 ['V2 list price per unit incl. VAT','V2 list price'],
 ['ҚҚС-сыз бірлік сату бағасы','ҚҚС-сыз V2 бағасы'],
 ['ҚҚС-пен бірлікке V2 прайс бағасы','V2 прайс']
];
function normalizePricePrintLabel(actual,expected){
 if(actual===expected)return actual;
 let value=actual;
 for(const [nextLabel,legacyLabel] of approvedPrintLabels)
  if(expected.includes(legacyLabel)&&value.includes(nextLabel))value=value.replace(nextLabel,legacyLabel);
 return value;
}
function subset(a,b,key){
 // Keep the historical VAT model, loan and cash-flow receipts byte-exact.
 // Only presentation-only pricing column labels, note text and new worksheets
 // are validated by the separate 7B5 and V2 price-export acceptance suites.
 if(key.endsWith('.print'))return A.deepEqual(normalizePricePrintLabel(b,a),a,key);
 if(key.endsWith('.excel')){
  A.ok(Array.isArray(a)&&Array.isArray(b)&&a.length>0&&b.length>=a.length,key);
  const legacy=a[0],sheet=b.find(w=>w.name===legacy.name);
  A.ok(sheet,key+' original pricing sheet must remain');
  A.ok(sheet.rows.length>=legacy.rows.length,key+' original pricing rows remain');
  for(let i=0;i<legacy.rows.length;i++){
   const oldRow=legacy.rows[i];if(!oldRow)continue;
   for(let j=0;j<oldRow.length;j++){
    if(i===1)continue; // intended localized column-headings change
    const historical=oldRow[j],now=sheet.rows[i]?.[j],cell=key+'.rows.'+i+'.'+j;
    if(historical===undefined||historical===null)A.ok(now===undefined||now===null,cell);
    else A.deepEqual(now,historical,cell);
   }
  }
  return;
 }
 if(a===null||typeof a!=='object')return A.deepEqual(b,a,key);
 if(Array.isArray(a)){A.ok(Array.isArray(b),key);A.equal(b.length,a.length,key);}
 for(const k of Object.keys(a))subset(a[k],b?.[k],key+'.'+k);
}
const snap=()=>{
 const model=calculateProductPortfolio();return {products:productPortfolio,choices:productOwnChoices,taxType:productBusinessTaxType,model,cash:calculateProductCashFlow(model),plans:productPortfolio.map(aggregatePlanMetrics),credit:productPortfolio.map(calculateAggregateCredit),priceLists:productPortfolio.map(calculatePriceListRange)};
};
async function setup(page,route,base){
 await page.goto(base+'Marketing_calc.HTML'+(route.startsWith('own-')?'?demo=shopper&finance='+route.slice(4):''),{waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(root,'artifacts/sales-tax-7b/utilities.css')});
 if(route==='standalone'||route==='linked'){
  const f=fixtures.cases.find(c=>c.kind===route&&c.id.endsWith('profit-vat12-credit-3'));await page.evaluate(({kind,input})=>{localStorage.setItem(kind==='linked'?'marketingCalcLinkedPortfolioV2':'marketingCalcPortfolioV2',JSON.stringify(input));if(kind==='linked')LinkedPortfolioV2UI.resume();else PortfolioV2UI.open({resume:true});},{kind:route,input:f.input});return;
 }
 if(route.startsWith('own-')){await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');return;}
 if(route.startsWith('simple-')){
  await page.locator('#start-service').click();await page.locator('#service-work-online').click();const role=route.slice(7);if(role==='agent'){await page.locator('#service-screen button[onclick="showAgentChooser()"]').click();await page.locator('#agent-screen button[onclick="selectServiceMode(\'agent\')"]').click();}else await page.locator('#service-screen button[onclick="selectServiceMode(\''+role+'\')"]').click();
  for(const [key,value] of Object.entries({months:3,monthlyBudget:400,cpc:4,ctr:2,cvrLead:20,cvrDeal:50,costConsult:100,costPack:200,ltv:30,mgmt:0,site:0,hosting:0,dom:0,magnet:0,acq:10,taxTurnover:5,...(role==='hired'?{markup:25}:{}),...(role==='agent'?{agentPct:20,agentTaxTurnover:10}:{})}))await page.locator('#in-'+key).fill(String(value));
  if(role==='agent')for(const key of ['monthlyBudget','mgmt','site','hosting','dom','magnet'])await page.locator('input[name="payer-'+key+'"][value="'+(key==='monthlyBudget'?'me':'partner')+'"]').check();return;
 }
 if(route.startsWith('full-')||route==='offline'){
  await page.locator('#start-service').click();await page.locator('#service-mode-full').click();await page.locator('#service-work-'+(route==='offline'?'offline':'online')).click();
  if(route==='offline')await page.locator("#service-screen button[onclick=\"selectServiceMode('self')\"]").click();
  if(route!=='offline'){const role=route.slice(5);if(role==='agent'){await page.locator('#service-screen button[onclick="showAgentChooser()"]').click();await page.locator('#agent-screen button[onclick="selectServiceMode(\'agent\')"]').click();}else await page.locator('#service-screen button[onclick="selectServiceMode(\''+role+'\')"]').click();}
 }else await page.locator('#start-own-product').click();
 await page.locator('#product-name-input').fill('Baseline '+route);await page.locator('#product-intro-submit-label').click();
 if(['resale','dropship'].includes(route)){await page.locator('[data-product-source="'+route+'"]').click();await page.locator('#resale-buy-qty').fill(route==='dropship'?'1':'60');await page.locator('#resale-buy-total').fill(route==='dropship'?'20':'1200');if(route==='dropship')await page.locator('#dropship-delivery-days').fill('15');}
 else{await page.locator('[data-material-cost-mode="known"]').click();await page.locator('#own-materials-cost').fill('8');}
 for(const [id,value] of Object.entries({'own-product-ad-budget':900,'own-product-ad-cpc':4.5,'own-product-ad-ctr':2,'own-product-ad-click-lead':20,'own-product-ad-lead-sale':50}))await page.locator('#'+id).fill(String(value));
 if(route==='offline')await page.locator('#offline-service-monthly-capacity').fill('30');
 if(route==='full-hired'){await page.locator('#own-production-workers-count').fill('1');await page.locator('#own-production-worker-gross').fill('100');}
 if(route==='full-agent'){await page.locator('#service-agent-partner-price').fill('100');await page.locator('#service-agent-fee-pct').fill('20');await page.locator('#service-agent-partner-vat').fill('10');await page.locator('#service-agent-partner-tax-pct').fill('5');for(const select of await page.locator('#service-agent-line-payers select').all())await select.selectOption(await select.getAttribute('data-agent-line-key')==='advertising'?'partner':'agent');}
 await page.evaluate(()=>{selectProductYesNo('salesVat','yes');document.getElementById('own-sales-vat-pct').value='12';setProductBusinessTaxType('turnover');document.getElementById('own-business-tax-pct').value='6';saveCurrentProductToPortfolio();for(const p of productPortfolio)Object.assign(p.planning,{fundingMode:'cash',targetMarginPct:30,reservePct:10,maxDiscountPct:0,minimumMarginPct:10});renderProductBusinessSummary();refreshAllAggregatePricing();});
}
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(source,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(source+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/',browser=await chromium.launch({headless:true,args:['--no-sandbox']}),receipts=[];
 try{for(const route of ['own-cash','own-credit','resale','dropship','offline','full-self','full-hired','full-agent','simple-self','simple-hired','simple-agent','standalone','linked'])for(const lang of ['ru','en','kk'])for(const width of [320,1280]){
  const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);await context.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await page.addInitScript(()=>{const RealDate=Date;window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:['2026-10-15T12:00:00.000Z']));}static now(){return new RealDate('2026-10-15T12:00:00.000Z').getTime();}};});
  await setup(page,route,base);await page.locator('#nomad360-lang-select').selectOption(lang);await page.evaluate(()=>document.fonts.ready);
  const isPortfolio=['standalone','linked'].includes(route),simple=route.startsWith('simple-'),key=route+'-'+lang+'-'+width;
  const data=isPortfolio?await page.evaluate(kind=>{const state=(kind==='linked'?LinkedPortfolioV2UI:PortfolioV2UI).getState();return {state,result:kind==='linked'?LinkedPortfolioV2Engine.build(state):Nomad360PaymentUI.buildPortfolio(state)};},route):simple?await page.evaluate(()=>({values:currentValues,snapshot:onlineV1PortfolioSnapshot})):await page.evaluate(snap);
  if(isPortfolio)A.equal(data.result.ready,true,key);else if(!simple)A.equal(data.model.pricingReady,true,key+JSON.stringify(data.model));else A.ok(data.snapshot,key+' simple snapshot');
  const controls=await page.evaluate(()=>[...document.querySelectorAll('input[id],select[id],textarea[id]')].filter(e=>e.getClientRects().length&&e.id!=='nomad360-lang-select').map(e=>({id:e.id,value:e.value,checked:e.checked,disabled:e.disabled}))),stages=await page.evaluate(()=>[...document.querySelectorAll('#product-screen .card[id],#service-screen > [id],#portfolio-v2-screen section[id],#portfolio-v2-linked-screen section[id]')].filter(e=>e.getClientRects().length).map(e=>e.id));
  const receipt={key,data,controls,stages};
  if(isPortfolio){const before=JSON.parse(JSON.stringify(data));await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(kind=>kind==='linked'?LinkedPortfolioV2UI.resume():PortfolioV2UI.open({resume:true}),route);const after=await page.evaluate(kind=>{const state=(kind==='linked'?LinkedPortfolioV2UI:PortfolioV2UI).getState();return {state,result:kind==='linked'?LinkedPortfolioV2Engine.build(state):Nomad360PaymentUI.buildPortfolio(state)};},route);subset(before,JSON.parse(JSON.stringify(after)),key+' restore');receipt.restore=true;await page.locator('#nomad360-lang-select').selectOption(lang);await page.addStyleTag({path:path.join(root,'artifacts/sales-tax-7b/utilities.css')});
   if(width===1280){await page.locator('[data-nomad-price-toggle]').click();const wait=page.waitForEvent('download');await page.locator('[data-nomad-excel]').last().click();const download=await wait,w=new Excel.Workbook();await w.xlsx.load(fs.readFileSync(await download.path()));receipt.excel=w.worksheets.map(s=>({name:s.name,rows:s.getSheetValues()}));await page.evaluate(()=>{window.print=()=>{};Nomad360UI.savePrint('price');});receipt.print=await page.locator('#nomad360-print-sheet').innerText();await page.pdf({path:path.join(dir,key+'.pdf'),printBackground:true});}
  }else if(!simple){await page.evaluate(()=>{history.replaceState({},'',location.pathname);saveProductCalculationToBrowser();});const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('marketingCalcProductResultV1')));A.ok(saved,key+' saved');receipt.saved=saved;await page.goto(base+'Marketing_calc.HTML?resume=1&lang='+lang,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(root,'artifacts/sales-tax-7b/utilities.css')});const restored=await page.evaluate(snap);receipt.restored=restored;for(const part of ['model','cash','plans','credit','priceLists']){const finance=v=>JSON.parse(JSON.stringify(v,(key,value)=>key==='uiState'?undefined:value));subset(finance(data[part]),finance(restored[part]),key+' restore '+part);}receipt.restore=true;}
  A.deepEqual(errors,[],key);await page.screenshot({path:path.join(dir,key+'.png')});
  if(!isPortfolio){if(simple)await page.locator('#online-v2-name').fill('Baseline '+route);receipt.bridge=await page.evaluate(simple=>{const accepted=simple?openLinkedPortfolioFromOnline():openLinkedPortfolioFromProducts();const state=LinkedPortfolioV2UI.getState();return {accepted,state,result:state?LinkedPortfolioV2Engine.build(state):null};},simple);}
  receipts.push(JSON.parse(JSON.stringify(receipt)));fs.writeFileSync(path.join(dir,key+'.json.gz'),zlib.gzipSync(JSON.stringify(receipt)));console.log('VAT_BROWSER_CASE '+key);await context.close();
 }
 const file=path.join(root,'docs/reviews/sales-tax-7b/baseline/browser-results.json.gz');if(capture)fs.writeFileSync(file,zlib.gzipSync(JSON.stringify(receipts)));else{const old=JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));A.equal(receipts.length,old.length);for(let i=0;i<old.length;i++){receipts[i].controls=receipts[i].controls.filter(c=>old[i].controls.some(x=>x.id===c.id));subset(old[i],receipts[i],old[i].key);}}
 fs.writeFileSync(path.join(dir,'protocol.json'),JSON.stringify({source:expected,capture,cases:receipts.map(({key,restore,excel})=>({key,restore,excel:!!excel}))},null,2)+'\n');console.log('SALES_TAX_7B_VAT_BROWSER_GREEN '+JSON.stringify({capture,cases:receipts.length}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
