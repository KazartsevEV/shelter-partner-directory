const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
const root=path.join(__dirname,'..'),art=path.join(root,'artifacts','payments');
fs.mkdirSync(art,{recursive:true});
const url=pathToFileURL(path.join(root,'Marketing_calc.HTML')).href;
const protocol=[];
const model=source=>({version:2,currency:'KZT',marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,periodMonths:2,cacReservePct:100},
 skus:[{id:'a',name:'Тауар / Product',source,unitCost:20,marginPct:25,mixPct:100,batchUnits:source==='dropship'?0:100,initialCashOut:source==='dropship'?0:2000,fulfillmentPerOrder:2,storagePerUnitDay:0,acquiringPct:0}],
 resources:[],funding:{kind:'cash',reservePct:10},tax:{type:'turnover',pct:6,vatPct:0}});
async function geometry(page){
 const issues=await page.evaluate(()=>{
  const bad=[];
  if(document.documentElement.scrollWidth>innerWidth+1)bad.push('page overflow '+document.documentElement.scrollWidth);
  for(const el of document.querySelectorAll('[data-payment-currency]')){
   if(!el.getClientRects().length||el.closest('[hidden],.hidden'))continue;
   const r=el.getBoundingClientRect();
   if(r.x<0||r.right>innerWidth+1||r.height<44)bad.push('selector geometry '+JSON.stringify([r.x,r.width,r.height]));
   const controls=el.closest('.nd-payment-controls'),parent=controls.getBoundingClientRect();
   if(r.right>parent.right+1)bad.push('control overflow');
  }
  return bad;
 });A.deepEqual(issues,[]);
}
async function screenshot(page,selector,name){await page.locator(selector).screenshot({path:path.join(art,name+'.png')});}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,360,390,430,768,1280])for(const lang of ['ru','en','kk']){
  const page=await browser.newPage({locale:'ru-RU',viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:\/\//,r=>r.abort());
  const goto=async(suffix='')=>{
   await page.goto(url+suffix,{waitUntil:'domcontentloaded'});
   const css=path.join(root,'artifacts','payment-utilities.css');
   if(fs.existsSync(css))await page.addStyleTag({path:css});
   await page.locator('#nomad360-lang-select').selectOption(lang);
  };
  const fill=async(id,value)=>page.locator('#'+id).fill(String(value));
  const choice=async(group,value)=>page.locator('[data-yn-group="'+group+'"][data-yn-value="'+value+'"]').click();
  const select=id=>page.locator('[data-payment-field="'+id+'"] [data-payment-currency]');
  for(const source of ['own','resale','dropship','materials']){
   await goto();await page.locator('#business-currency').selectOption('KZT');
   await page.locator('#start-own-product').click();
   await fill('product-name-input','Валютный товар / Тауар');await page.locator('#product-intro-submit-label').click();
   await page.evaluate(source=>selectProductSource(source==='materials'?'own':source),source);
   const actual=source==='materials'?'material-1':source==='own'?'own-materials-cost':'resale-buy-total';
   let amount;
   if(source==='materials'){
    await page.locator('[data-material-cost-mode="calculate"]').click();
    amount=page.locator('.material-cost-price').first();await amount.fill('1000');
   }else if(source==='own'){
    await page.locator('[data-material-cost-mode="known"]').click();
    amount=page.locator('#own-materials-cost');await amount.fill('1000');
   }else{amount=page.locator('#resale-buy-total');await amount.fill('1000');}
   const selector=source==='materials'?page.locator('#own-material-rows [data-payment-currency]').first():select(actual);
   A.equal(await selector.inputValue(),'KZT');
   await selector.selectOption('CNY');A.equal(await amount.inputValue(),'1000');
   A.match(await selector.locator('option[value="CNY"]').textContent(),/🇨🇳 CNY/);
   A.equal(await page.evaluate(()=>saveProductCalculationToBrowser()),true);
   let saved=await page.evaluate(()=>readSavedProductCalculation());
   const payments=saved.productPortfolio[0].payments;
   A.equal(payments[actual].businessCurrency,'KZT');A.equal(payments[actual].paymentCurrency,'CNY');
   A.equal(payments[actual].paymentAmount,1000);A.equal(payments[actual].convertedAmount,null);
   A.equal(await page.evaluate(()=>calculateProductPortfolio().pricingReady),false);
   A.equal(await page.evaluate(()=>calculateProductPortfolio().paymentPending),true);
   A.equal(await page.evaluate(()=>openLinkedPortfolioFromProducts()),false);
   await geometry(page);await screenshot(page,'#product-materials-block',`${width}-${lang}-v1-${source}`);
   const rawBefore=JSON.stringify(saved);
   for(const next of ['en','kk','ru']){
    await page.locator('#nomad360-lang-select').selectOption(next);
    A.equal(await amount.inputValue(),'1000');A.equal(await selector.inputValue(),'CNY');
    A.equal(await page.evaluate(()=>JSON.stringify(readSavedProductCalculation())),rawBefore);
   }
   await goto('?resume=1');
   const recovered=source==='materials'?page.locator('#own-material-rows [data-payment-currency]').first():select(actual);
   A.equal(await recovered.inputValue(),'CNY');A.equal(await amount.inputValue(),'1000');
   // Choosing the model's currency makes the same original amount normalizable.
   await recovered.selectOption('KZT');await page.evaluate(()=>saveProductCalculationToBrowser());
   A.equal(await page.evaluate(()=>readSavedProductCalculation().productPortfolio[0].payments[Object.keys(readSavedProductCalculation().productPortfolio[0].payments)[0]].convertedAmount),1000);
   if(source==='materials'){
    await page.evaluate(()=>addMaterialRow());
    const keys=await page.locator('#own-material-rows .material-cost-row').evaluateAll(rows=>rows.map(r=>r.dataset.paymentKey));
    A.equal(new Set(keys).size,2);
   }
   // Legacy UI HTML/positional fields remain readable; payment metadata is optional.
   await page.evaluate(()=>{
    const old=readSavedProductCalculation();delete old.productPortfolio[0].payments;
    localStorage.setItem(savedProductStorageKey,JSON.stringify(old));
   });await goto('?resume=1');
   A.equal(await recovered.inputValue(),'KZT');A.equal(await amount.inputValue(),'1000');
   // International amounts only: percentage insurance and domestic payroll lack selectors.
   A.equal(await page.locator('#own-cargo-insurance-cost').locator('..').locator('[data-payment-currency]').count(),0);
   A.equal(await page.locator('#own-production-worker-gross').locator('..').locator('[data-payment-currency]').count(),0);
   protocol.push({width,lang,route:'v1-'+source,original:1000,currency:'CNY',normalized:null,restored:true,legacy:true,overflow:false});
  }
  // Independent delivery and import payments use their own currencies.
  await choice('inboundIncluded','no');await fill('own-inbound-delivery-cost',200);
  await select('own-inbound-delivery-cost').selectOption('EUR');
  await choice('materialsImported','yes');
  await page.locator('[data-import-payer-key="broker"][data-import-payer-value="me"]').click();
  await fill('own-broker-cost',50);await select('own-broker-cost').selectOption('USD');
  await page.evaluate(()=>saveProductCalculationToBrowser());
  const importSaved=await page.evaluate(()=>readSavedProductCalculation().productPortfolio[0].payments);
  A.equal(importSaved['own-inbound-delivery-cost'].paymentCurrency,'EUR');
  A.equal(importSaved['own-broker-cost'].paymentCurrency,'USD');
  await goto('?resume=1');A.equal(await select('own-inbound-delivery-cost').inputValue(),'EUR');
  A.equal(await select('own-broker-cost').inputValue(),'USD');await geometry(page);
  await screenshot(page,'#product-materials-block',`${width}-${lang}-v1-import`);
  protocol.push({width,lang,route:'v1-import',restored:true,overflow:false});
  for(const source of ['own','resale','dropship']){
   const m=model(source);
   await page.evaluate(m=>{localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(m));openPortfolioV2(true);},m);
   const baseline=await page.evaluate(()=>PortfolioV2Engine.build(PortfolioV2UI.getState()));
   A.equal(baseline.ready,true);
   A.deepEqual(await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState())),baseline);
   const pathKey='skus.0.'+(source==='own'?'initialCashOut':'unitCost');
   const selector=page.locator('[data-payment-path="'+pathKey+'"] [data-payment-currency]');
   if(source==='own')await page.locator('[data-p2-sku] details').evaluate(el=>el.open=true);
   const amount=page.locator('[data-p2-path="'+pathKey+'"]'),original=await amount.inputValue();
   A.equal(await selector.inputValue(),'KZT');await selector.selectOption('CNY');
   A.equal(await amount.inputValue(),original);
   A.equal(await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()).paymentPending),true);
   A.equal(await page.locator('[data-nomad-price-toggle]').isDisabled(),true);
   await geometry(page);await screenshot(page,'[data-p2-sku]',`${width}-${lang}-v2-${source}`);
   const state=await page.evaluate(()=>PortfolioV2UI.getState());
   await page.locator('#nomad360-lang-select').selectOption(lang==='en'?'kk':'en');
   A.deepEqual(await page.evaluate(()=>PortfolioV2UI.getState()),state);
   await goto();await page.evaluate(()=>openPortfolioV2(true));
   A.equal(await selector.inputValue(),'CNY');A.equal(await amount.inputValue(),original);
   if(source==='own')await page.locator('[data-p2-sku] details').evaluate(el=>el.open=true);
   await selector.selectOption('KZT');
   const restored=await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()));
   A.deepEqual(restored,baseline);
   // Initial payment is an advance, not an additional cost. No double counting.
   const old=await page.evaluate(()=>PortfolioV2UI.getState());delete old.skus[0].payments;
   await page.evaluate(old=>{localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(old));openPortfolioV2(true);},old);
   A.deepEqual(await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState())),baseline);
   protocol.push({width,lang,route:'v2-'+source,normalizedParity:true,restored:true,legacy:true,overflow:false});
  }
  const f=fixture();await page.evaluate(m=>{localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify({...m,version:3,source:'v1-calculated',currency:'KZT'}));LinkedPortfolioV2UI.resume();},f);
  const linked=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(linked.ready,true);
  await page.locator('#nomad360-lang-select').selectOption(lang==='kk'?'en':'kk');
  A.deepEqual(await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState())),linked);
  protocol.push({width,lang,route:'linked',normalizedParity:true});
  A.deepEqual(errors,[]);await page.close();
 }
 fs.writeFileSync(path.join(art,'protocol.json'),JSON.stringify({cases:protocol.length,protocol},null,2));
 console.log('PAYMENT_BROWSER_GREEN',JSON.stringify({cases:protocol.length,languages:3,widths:6}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
