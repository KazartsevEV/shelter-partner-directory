'use strict';
// Real before/after form events, using the accepted main as the numeric/UI oracle.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),A=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {chromium}=require('../palette/node_modules/playwright');
const {manifest}=require('../../tests/helpers/v1-operations-scope.cjs');
const root=path.resolve(__dirname,'../..'),base=process.env.C6_BASELINE_ROOT;
const out=path.resolve(process.argv[2]||'artifacts/v1-operations');
const widths=(process.env.C6_WIDTHS||'320,360,390,430,768,1280').split(',').map(Number);
const languages=(process.env.C6_LANGUAGES||'ru,en,kk').split(',');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const inputs=require('../../tests/fixtures/v1-engine/accepted-main.json');
async function settle(page){await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function snapshot(page){
 await require('../../tests/helpers/approved-ui-comparison.cjs').align(page);
 await settle(page);
 return page.evaluate(()=>{
  // Form helpers scroll to the next section. Compare identical document
  // coordinates, not different in-flight smooth-scroll viewport offsets.
  scrollTo({top:0,left:0,behavior:'instant'});
  const ids=['own-materials-calculated-total','own-materials-landed-unit-cost','own-materials-landed-breakdown','own-product-ad-impressions','own-product-ad-clicks','own-product-ad-leads','own-product-ad-orders','own-product-ad-units','own-product-ad-media-unit','own-product-ad-management-unit','own-product-ad-full-unit','own-product-ad-cac-unit','own-product-ad-note','summary-table','monthly-table','service-simple-free-cash-value','res-profit','res-romi','res-cpa','res-cac'];
  const visible=[...document.querySelectorAll('#product-screen *,#calculator-screen *')].filter(e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}));
  return {text:ids.map(id=>({id,text:document.getElementById(id)?.textContent,number:document.getElementById(id)?.dataset.nomadDisplayNumber})),
   fields:[...document.querySelectorAll('#product-own-form input,#product-own-form select')].map(e=>[e.id,e.className,e.value]),
   portfolio:productPortfolio,snapshot:onlineV1PortfolioSnapshot,landed:Number.isFinite(latestMaterialsLandedUnitCost)?latestMaterialsLandedUnitCost:'nonfinite',
   model:calculateProductPortfolio(),cash:calculateProductCashFlow(calculateProductPortfolio()),calls:window.c6Calls,
   // Exclude inert script nodes; one new module is deliberately loaded in head.
   bodyText:document.body.innerText,visible:visible.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return [e.tagName,e.id,r.x,r.y,r.width,r.height,s.color,s.backgroundColor,s.fontFamily,s.fontSize,s.lineHeight];}),
   overflow:document.documentElement.scrollWidth>innerWidth+1};
 });
}
async function exercise(page){
 const rows=[];
 async function take(name){const value=await snapshot(page);A.equal(value.overflow,false,name);rows.push({name,hash:hash(JSON.stringify(value)),value});}
 await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');
 await page.evaluate(()=>{
  window.c6Calls=[];
  for(const name of ['updateInboundDeliveryDefault','recalculateLogisticsUnitCost','syncOfflineServiceForecast','syncVisibleAggregateFromCurrentProduct']){
   const original=window[name];window[name]=function(...args){c6Calls.push(name);return original.apply(this,args);};
  }
 });
 await take('accepted-shopper');
 await page.evaluate(()=>{setMaterialCostMode('calculate');addMaterialRow();});
 const prices=page.locator('.material-cost-price'),qty=page.locator('.material-cost-qty');
 await prices.last().fill('12.345');await qty.last().fill('0.037');await take('fractional-material');
 // Foreign payment stays pending and must not silently become a 1:1 expense.
 const currency=prices.last().locator('..').locator('[data-payment-currency]');
 const business=await page.evaluate(()=>Nomad360Currency.get());
 await currency.selectOption('CNY');await take('pending-material-fx');
 A.equal(await page.locator('#own-materials-landed-unit-cost').textContent(),'—');
 await currency.selectOption(business);await take('material-currency-restored');
 await page.evaluate(()=>{productOwnChoices.inboundIncluded='no';productOwnChoices.materialsImported='yes';productOwnChoices.vatIncluded='no';
  Object.assign(productImportPayers,{broker:'me',cargoInsurance:'me',duties:'me',certification:'me'});
  for(const [id,value] of Object.entries({'own-materials-batch-qty':17,'own-vat-rate':12,'own-inbound-delivery-cost':3.25,'own-broker-cost':121,'own-cargo-insurance-cost':2.5,'own-duties-cost':4.2,'own-certification-cost':299}))document.getElementById(id).value=value;
  recalculateMaterialsLandedCost();});
 await take('all-import-payments');
 await page.evaluate(()=>{productOwnChoices.materialsImported='no';recalculateMaterialsLandedCost();});await take('domestic-no-import-fees');
 await page.locator('#own-product-ad-cpc').fill('0');await take('zero-cpc');
 await page.locator('#own-product-ad-cpc').fill('0.37');await page.locator('#own-product-ad-click-lead').fill('12.7');await page.locator('#own-product-ad-lead-sale').fill('31.3');await take('fractional-funnel');
 await page.evaluate(()=>{productSource='offline-service';recalculateProductAdFunnel();});await take('service-forecast-sync');
 await page.evaluate(()=>{productSource='own';});
 for(const source of ['resale','dropship']){await page.evaluate(source=>{selectProductSource(source);recalculateMaterialsLandedCost();recalculateProductAdFunnel();},source);await take(source);}
 for(const mode of ['self','hired','agent']){
  const input=inputs.simpleCases.find(x=>x.input.mode===mode).input;
  await page.evaluate(input=>{selectServiceMode(input.mode);currentValues={...input.values};agentPayers={...input.payers};initInputs();calculate();},input);await take('simple-'+mode);
  if(mode==='agent'){
   await page.evaluate(()=>{agentPayers={};calculate();});await take('agent-payers-pending');
   A.equal(await page.locator('#res-profit').textContent(),'—');
  }
  await page.evaluate(()=>{currentValues.cpc=-1;calculate();});await take('invalid-'+mode);
  A.equal(await page.locator('#res-profit').textContent(),'—');
 }
 return rows;
}
async function main(){
 A.ok(base,'Set C6_BASELINE_ROOT to an accepted, detached worktree');fs.mkdirSync(out,{recursive:true});
 A.equal(require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:base,encoding:'utf8'}).trim(),manifest.base);
 A.ok(fs.existsSync(path.join(out,'utilities.css')),'Compile pinned Tailwind once for both variants');
 const packages={};
 const server=http.createServer((req,res)=>{try{
  const u=new URL(req.url,'http://local'),m=u.pathname.match(/^\/(before|after)\/(.+)$/);if(!m||req.method!=='GET')throw Error('path');
  const [,variant,rel]=m;if(rel==='standalone.html'){res.setHeader('Content-Type','text/html');return res.end(packages[variant]);}
  const dir=variant==='before'?base:root,file=path.resolve(dir,decodeURIComponent(rel));
  if(!file.startsWith(dir+path.sep)||!fs.statSync(file).isFile())throw Error('path');
  res.setHeader('Content-Type',({'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 }catch(_){res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,args:['--no-sandbox']}),cases=[],timings=[];
 async function open(entry,width,language,variant){
  const ctx=await browser.newContext({viewport:{width,height:950},locale:language==='ru'?'ru-RU':language==='kk'?'kk-KZ':'en-US',reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  const start=performance.now();await page.goto(origin+'/'+variant+'/'+entry+'?demo=shopper&finance=cash&lang='+language,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(out,'utilities.css')});
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'});
  await page.waitForFunction(()=>window.Nomad360UI&&document.getElementById('product-demo-banner')?.dataset.demoReady==='true');
  await page.locator('#nomad360-lang-select').selectOption(language);await settle(page);
  return {ctx,page,errors,readyMs:performance.now()-start};
 }
 try{
  // Build the real downloadable artifact with the production delivery module.
  // Unlike a decorated demo, this must embed and execute the new module offline.
  for(const variant of ['before','after']){
   const {ctx,page}=await open('Marketing_calc.HTML',390,'ru',variant);
   packages[variant]=await page.evaluate(base=>Nomad360Delivery.buildStandalone(base),origin+'/'+variant+'/');
   A.equal(packages[variant].includes('data-nomad-bundled="./nomad360_v1_operations.js"'),variant==='after');await ctx.close();
  }
  for(const entry of ['Marketing_calc.HTML','US_Retail_Demo.HTML','standalone.html'])for(const width of widths)for(const language of languages){
   const pair={};
   for(const variant of ['before','after']){
    const {ctx,page,errors}=await open(entry,width,language,variant);
    pair[variant]=await exercise(page);
    if(entry==='Marketing_calc.HTML'&&[320,1280].includes(width)){
     await page.evaluate(()=>showHome());await settle(page);
     const png=await page.locator('#nomad360-commercial-banner').screenshot({path:path.join(out,language+'-'+width+'-'+variant+'.png'),animations:'disabled'});
     pair[variant].push({name:'hero-pixels',hash:hash(png)});
    }
    A.deepEqual(errors,[],variant+'/'+entry+'/'+width+'/'+language);await ctx.close();
   }
   fs.writeFileSync(path.join(out,'latest-pair.json'),JSON.stringify(pair));
   A.ok(require('node:util').isDeepStrictEqual(pair.after,pair.before),entry+'/'+width+'/'+language+': full snapshots differ; inspect latest-pair.json');
   fs.unlinkSync(path.join(out,'latest-pair.json'));
   cases.push({entry,width,language,scenarios:pair.after.map(({name,hash})=>({name,hash}))});console.log('C6_CASE_GREEN',entry,width,language);
  }
  // Three paired repetitions per language and width, same rendered route.
  for(const width of [390,1280])for(const language of languages)for(let repeat=0;repeat<3;repeat++){
   const row={width,language,repeat};
   for(const variant of repeat%2?['after','before']:['before','after']){
    const {ctx,page,errors,readyMs}=await open('Marketing_calc.HTML',width,language,variant),cdp=await ctx.newCDPSession(page);
    await cdp.send('Performance.enable');const samples=[];
    for(let n=0;n<5;n++){
     await page.evaluate(()=>{showHome();showProductBranch();recalculateProductAdFunnel();});await settle(page);
     await cdp.send('HeapProfiler.collectGarbage');const values=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
     samples.push({listeners:values.JSEventListeners,dom:await page.locator('body *').count()});
    }
    row[variant]={readyMs,samples};A.deepEqual(errors,[]);await ctx.close();
   }
   A.deepEqual(row.after.samples,row.before.samples,'listener/DOM regression');timings.push(row);
   console.log('C6_TIMING_PAIR_GREEN',width,language,repeat);
  }
  const resources={};for(const variant of ['before','after']){
   const dir=variant==='before'?base:root,html=fs.readFileSync(path.join(dir,'Marketing_calc.HTML'),'utf8');
   const files=['Marketing_calc.HTML','nomad360_v1_engine.js',...(html.includes('nomad360_v1_operations.js')?['nomad360_v1_operations.js']:[])];
   resources[variant]=files.map(file=>{const bytes=fs.readFileSync(path.join(dir,file));return {file,bytes:bytes.length,gzip:zlib.gzipSync(bytes).length,brotli:zlib.brotliCompressSync(bytes).length,sha256:hash(bytes)};});
  }
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({base:manifest.base,browser:browser.version(),cases,timings,resources,standalone:Object.fromEntries(Object.entries(packages).map(([k,v])=>[k,{bytes:Buffer.byteLength(v),sha256:hash(v)}]))},null,2)+'\n');
  console.log('C6_BROWSER_GREEN',JSON.stringify({pairs:cases.length,scenarios:cases.reduce((s,x)=>s+x.scenarios.length,0),timingPairs:timings.length}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
