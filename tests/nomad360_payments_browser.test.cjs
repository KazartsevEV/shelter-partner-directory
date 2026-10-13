const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
const root=path.join(__dirname,'..'),art=path.join(root,'artifacts','payments');
fs.mkdirSync(art,{recursive:true});
const url=pathToFileURL(path.join(root,'Marketing_calc.HTML')).href;
const protocol=[],editOnly=process.argv.includes('--edit-only');
// The engine retains original SKU objects in some reports. Payment metadata is
// expected to appear there; compare every existing numeric/behavioral field.
const financial=out=>JSON.parse(JSON.stringify(out,(k,v)=>k==='payments'||k==='businessCurrency'?undefined:v));
const labels={ru:'Валюта платежа',en:'Payment currency',kk:'Төлем валютасы'};
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
   if(r.right>parent.right+1)bad.push('control overflow '+JSON.stringify({field:el.closest('[data-payment-field]')?.dataset.paymentField,path:el.closest('[data-payment-path]')?.dataset.paymentPath,selector:[r.x,r.width],controls:[parent.x,parent.width]}));
  }
  return bad;
 });
 if(issues.length){
  const debug=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.getClientRects().length&&!el.closest('[hidden],.hidden')&&el.getBoundingClientRect().right>innerWidth+1).slice(-35).map(el=>({tag:el.tagName,id:el.id,class:el.className,text:el.textContent?.slice(0,65),x:el.getBoundingClientRect().x,width:el.getBoundingClientRect().width,display:getComputedStyle(el).display,whiteSpace:getComputedStyle(el).whiteSpace})));
  const textOverflow=await page.evaluate(()=>{
   const result=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
   while((node=walker.nextNode())){
    const el=node.parentElement;if(!node.textContent.trim()||el.closest('script,style,[hidden],.hidden')||!el.getClientRects().length)continue;
    const range=document.createRange();range.selectNodeContents(node);
    if([...range.getClientRects()].some(r=>r.right>innerWidth+1))result.push({text:node.textContent.slice(0,130),tag:el.tagName,id:el.id,class:el.className,parent:el.parentElement.id||el.parentElement.className,font:getComputedStyle(el).font,wrap:getComputedStyle(el).overflowWrap});
   }return result;
  });
  console.error('PAYMENT_GEOMETRY',JSON.stringify(debug));
  console.error('PAYMENT_TEXT_OVERFLOW',JSON.stringify(textOverflow));
  fs.writeFileSync(path.join(art,'geometry-failure.json'),JSON.stringify({issues,debug,textOverflow},null,2));
  await page.screenshot({path:path.join(art,'geometry-failure.png'),fullPage:true});
 }
 A.deepEqual(issues,[]);
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
   await page.waitForFunction(labels=>document.querySelector('[data-payment-currency]')?.getAttribute('aria-label')===labels[Nomad360UI.getLanguage()],labels);
   await page.locator('#nomad360-lang-select').selectOption(lang);
  };
  const fill=async(id,value)=>page.locator('#'+id).fill(String(value));
  const choice=async(group,value)=>page.locator('[data-yn-group="'+group+'"][data-yn-value="'+value+'"]').click();
  const select=id=>page.locator('[data-payment-field="'+id+'"] [data-payment-currency]');
  if(!editOnly){
  for(const source of ['own','resale','dropship','materials']){
   console.log('PAYMENT_CASE',width,lang,source);
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
   if(source!=='dropship'){await choice('inboundIncluded','no');await fill('own-inbound-delivery-cost',150);}
   A.equal(await selector.getAttribute('aria-label'),labels[lang]);
   A.equal(await selector.inputValue(),'KZT');
   await selector.selectOption('CNY');A.equal(await amount.inputValue(),'1000');
   if(source==='materials')await page.waitForFunction(()=>document.querySelector('.material-cost-price').parentElement.previousElementSibling.textContent.includes('CNY'));
   if(source!=='dropship')A.equal(await page.locator('#own-inbound-delivery-cost').inputValue(),'150');
   A.match(await selector.locator('option[value="CNY"]').textContent(),/🇨🇳 CNY/);
   A.equal(await page.evaluate(()=>saveProductCalculationToBrowser()),true);
   let saved=await page.evaluate(()=>readSavedProductCalculation());
   if(source!=='dropship')A.equal(saved.productPortfolio[0].inputs['own-inbound-delivery-cost'],'150');
   const payments=saved.productPortfolio[0].payments;
   A.equal(payments[actual].businessCurrency,'KZT');A.equal(payments[actual].paymentCurrency,'CNY');
   A.equal(payments[actual].paymentAmount,1000);A.equal(payments[actual].convertedAmount,null);
   A.equal(await page.evaluate(()=>calculateProductPortfolio().pricingReady),false);
   A.equal(await page.evaluate(()=>calculateProductPortfolio().paymentPending),true);
   A.equal(await page.evaluate(()=>aggregatePlanMetrics(productPortfolio[0]).requiredCapital),null);
   A.equal(await page.evaluate(()=>calculateAggregateCredit(productPortfolio[0]).principal),null);
   A.equal(await page.evaluate(()=>openLinkedPortfolioFromProducts()),false);
   await geometry(page);await screenshot(page,'#product-materials-block',`${width}-${lang}-v1-${source}`);
   const rawBefore=JSON.stringify(saved);
   for(const next of ['en','kk','ru']){
    await page.locator('#nomad360-lang-select').selectOption(next);
    A.equal(await selector.getAttribute('aria-label'),labels[next]);
    A.equal(await page.locator('#linked-v2-entry-error').textContent(),await page.evaluate(()=>Nomad360PaymentUI.pendingMessage()));
    A.equal(await amount.inputValue(),'1000');A.equal(await selector.inputValue(),'CNY');
    A.equal(await page.evaluate(()=>JSON.stringify(readSavedProductCalculation())),rawBefore);
   }
   await goto('?resume=1');
   const recovered=source==='materials'?page.locator('#own-material-rows [data-payment-currency]').first():select(actual);
   A.equal(await recovered.inputValue(),'CNY');A.equal(await amount.inputValue(),'1000');
   if(source!=='dropship')console.log('PAYMENT_DELIVERY_RESTORED',source,await page.evaluate(()=>({input:document.getElementById('own-inbound-delivery-cost').value,manual:productOwnInboundDeliveryManual,saved:readSavedProductCalculation().productPortfolio[0].inputs['own-inbound-delivery-cost']})));
   // Choosing the model's currency makes the same original amount normalizable.
   await recovered.selectOption('KZT');await page.evaluate(()=>saveProductCalculationToBrowser());
   if(source==='materials')await page.waitForFunction(()=>document.querySelector('.material-cost-price').parentElement.previousElementSibling.textContent.includes('KZT'));
   if(source!=='dropship')A.equal(await page.locator('#own-inbound-delivery-cost').inputValue(),'150');
   A.equal(await page.evaluate(key=>readSavedProductCalculation().productPortfolio[0].payments[key].convertedAmount,actual),1000);
   if(source==='materials'){
    await page.evaluate(()=>addMaterialRow());
    const keys=await page.locator('#own-material-rows .material-cost-row').evaluateAll(rows=>rows.map(r=>r.dataset.paymentKey));
    A.equal(new Set(keys).size,2);
    await page.evaluate(()=>{
     const select=document.querySelector('[data-payment-field="own-materials-cost"] [data-payment-currency]');
     select.value='CNY';select.dispatchEvent(new Event('change',{bubbles:true}));saveProductCalculationToBrowser();
    });
    A.equal(await page.evaluate(()=>readSavedProductCalculation().productPortfolio[0].payments['own-materials-cost'].active),false);
    A.equal(await page.evaluate(()=>calculateProductPortfolio().paymentPending||false),false);
    await goto('?resume=1');
    A.equal(await select('own-materials-cost').inputValue(),'CNY');
    A.equal(await page.evaluate(()=>calculateProductPortfolio().paymentPending||false),false);
   }
   // Legacy UI HTML/positional fields remain readable; payment metadata is optional.
   await page.evaluate(()=>{
    const old=readSavedProductCalculation();delete old.productPortfolio[0].payments;
    delete old.productPortfolio[0].businessCurrency;
    const material=old.productPortfolio[0].uiState?.dynamic?.materials;
    if(material){
     const host=document.createElement('div');host.innerHTML=material.html;
     [...host.querySelectorAll('input,select,textarea')].forEach((f,i)=>{if(material.fields[i]){f.value=material.fields[i].value;f.checked=material.fields[i].checked;}});
     for(const wrap of host.querySelectorAll('[data-payment-field]'))wrap.replaceWith(wrap.querySelector('input'));
     for(const row of host.querySelectorAll('.material-cost-row'))delete row.dataset.paymentKey;
     for(const label of host.querySelectorAll('[data-payment-amount-currency]'))delete label.dataset.paymentAmountCurrency;
     material.html=host.innerHTML;
     material.fields=[...host.querySelectorAll('input,select,textarea')].map(f=>({value:f.value,checked:!!f.checked,selectedIndex:f.tagName==='SELECT'?f.selectedIndex:null}));
    }
    localStorage.setItem(savedProductStorageKey,JSON.stringify(old));
   });await goto('?resume=1');
   A.equal(await recovered.inputValue(),'KZT');A.equal(await amount.inputValue(),'1000');
   if(source==='materials')await page.waitForFunction(()=>document.querySelector('.material-cost-price').parentElement.previousElementSibling.textContent.includes('KZT'));
   // International amounts only: percentage insurance and domestic payroll lack selectors.
   A.equal(await page.locator('#own-cargo-insurance-cost').locator('..').locator('[data-payment-currency]').count(),0);
   A.equal(await page.locator('#own-production-worker-gross').locator('..').locator('[data-payment-currency]').count(),0);
   protocol.push({width,lang,route:'v1-'+source,original:1000,currency:'CNY',normalized:null,restored:true,legacy:true,overflow:false,paymentsBeforeResume:payments});
  }
  // Independent delivery and import payments use their own currencies.
  await choice('inboundIncluded','no');await fill('own-inbound-delivery-cost',200);
  await select('own-inbound-delivery-cost').selectOption('EUR');
  await choice('materialsImported','yes');
  await page.locator('[data-import-payer-key="broker"][data-import-payer-value="me"]').click();
  await fill('own-broker-cost',50);await select('own-broker-cost').selectOption('USD');
  for(const [payer,id,amount,currency] of [['duties','own-duties-cost',10,'USD'],['certification','own-certification-cost',25,'EUR']]){
   await page.locator('[data-import-payer-key="'+payer+'"][data-import-payer-value="me"]').click();
   await fill(id,amount);await select(id).selectOption(currency);
  }
  await page.evaluate(()=>saveProductCalculationToBrowser());
  const importSaved=await page.evaluate(()=>readSavedProductCalculation().productPortfolio[0].payments);
  A.equal(importSaved['own-inbound-delivery-cost'].paymentCurrency,'EUR');
  A.equal(importSaved['own-broker-cost'].paymentCurrency,'USD');
  A.equal(importSaved['own-duties-cost'].paymentAmount,10);A.equal(importSaved['own-duties-cost'].paymentCurrency,'USD');
  A.equal(importSaved['own-certification-cost'].paymentAmount,25);A.equal(importSaved['own-certification-cost'].paymentCurrency,'EUR');
  await goto('?resume=1');A.equal(await select('own-inbound-delivery-cost').inputValue(),'EUR');
  A.equal(await select('own-broker-cost').inputValue(),'USD');await geometry(page);
  A.equal(await select('own-duties-cost').inputValue(),'USD');A.equal(await select('own-certification-cost').inputValue(),'EUR');
  await screenshot(page,'#product-materials-block',`${width}-${lang}-v1-import`);
  protocol.push({width,lang,route:'v1-import',restored:true,overflow:false});
  }else await goto();
  for(const source of editOnly?['resale','own','dropship']:['own','resale','dropship']){
   const m=model(source);
   await page.evaluate(m=>{localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(m));openPortfolioV2(true);},m);
   const baseline=await page.evaluate(()=>PortfolioV2Engine.build(PortfolioV2UI.getState()));
   A.equal(baseline.ready,true);
   A.deepEqual(financial(await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()))),financial(baseline));
   const pathKey='skus.0.'+(source==='own'?'initialCashOut':'unitCost');
   const selector=page.locator('[data-payment-path="'+pathKey+'"] [data-payment-currency]');
   if(source==='own')await page.locator('[data-p2-sku] details.nd-v2-info-panel').evaluate(el=>el.open=true);
   const amount=page.locator('[data-p2-path="'+pathKey+'"]'),original=await amount.inputValue();
   A.equal(await selector.inputValue(),'KZT');await selector.selectOption('CNY');
   A.equal(await amount.inputValue(),original);
   A.equal(await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()).paymentPending),true);
   A.equal(await page.locator('[data-nomad-price-toggle]').isDisabled(),true);
   await geometry(page);await screenshot(page,'[data-p2-sku]',`${width}-${lang}-v2-${source}`);
   // Regression for PR #132: currency first, numeric edit second. Inspect
   // the raw auto-saved draft before any reload or explicit save can repair it.
   const editedPayments=[];
   const fields=source==='own'?['initialCashOut']:source==='resale'?['unitCost','initialCashOut']:['unitCost','fulfillmentPerOrder'];
   await selector.selectOption('KZT');
   for(const key of fields){
    const editPath='skus.0.'+key;
    const editAmount=page.locator('[data-p2-path="'+editPath+'"]');
    const editCurrency=page.locator('[data-payment-path="'+editPath+'"] [data-payment-currency]');
    await page.locator('[data-p2-sku] details.nd-v2-info-panel').evaluate(el=>el.open=true);
    const before=await editAmount.inputValue(),edited=key==='unitCost'?35:Number(before)+35;
    await editCurrency.selectOption('CNY');
    const checkDraft=async(value,convertedAmount,status)=>{
     const drafts=await page.evaluate(()=>({live:PortfolioV2UI.getState(),saved:JSON.parse(localStorage.getItem('marketingCalcPortfolioV2'))}));
     for(const [where,draft] of Object.entries(drafts)){
      A.equal(draft.skus[0][key],value,`V2_EDIT_AUTOSAVE ${source}/${key} ${where} raw input`);
      A.deepEqual(draft.skus[0].payments[key],{businessCurrency:'KZT',paymentCurrency:'CNY',paymentAmount:value===''||Number(value)<0?null:Number(value),convertedAmount,status},`V2_EDIT_AUTOSAVE ${source}/${key} ${where} metadata`);
     }
     return drafts.saved.skus[0].payments[key];
    };
    await editAmount.fill(String(edited));
    const saved=await checkDraft(String(edited),null,'conversion-required');
    A.equal(await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()).paymentPending),true);
    A.equal(await page.locator('[data-nomad-price-toggle]').isDisabled(),true);
    await goto();await page.evaluate(()=>openPortfolioV2(true));
    await page.locator('[data-p2-sku] details.nd-v2-info-panel').evaluate(el=>el.open=true);
    A.equal(await editCurrency.inputValue(),'CNY');A.equal(await editAmount.inputValue(),String(edited));
    const restoredPayment=await checkDraft(String(edited),null,'conversion-required');
    A.equal(await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()).paymentPending),true);
    A.equal(await page.locator('[data-nomad-price-toggle]').isDisabled(),true);
    await editAmount.fill('0');await checkDraft('0',0,'normalized');
    await editAmount.fill('');await checkDraft('',null,'empty');
    await editAmount.fill('-1');await checkDraft('-1',null,'invalid');
    A.equal(await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()).paymentPending),true);
    await editAmount.fill(String(edited));await checkDraft(String(edited),null,'conversion-required');
    await editCurrency.selectOption('KZT');
    const sameCurrency=await page.evaluate(key=>JSON.parse(localStorage.getItem('marketingCalcPortfolioV2')).skus[0].payments[key],key);
    A.deepEqual(sameCurrency,{businessCurrency:'KZT',paymentCurrency:'KZT',paymentAmount:edited,convertedAmount:edited,status:'normalized'});
    await editAmount.fill(before);
    const reset=await page.evaluate(key=>JSON.parse(localStorage.getItem('marketingCalcPortfolioV2')).skus[0].payments[key],key);
    A.equal(reset.paymentAmount,Number(before));A.equal(reset.convertedAmount,Number(before));
    editedPayments.push({key,before:Number(before),edited,saved,restoredPayment,sameCurrency,zero:true,empty:true,invalid:true});
   }
   // Keep the original foreign-payment round trip and financial baseline check.
   await selector.selectOption('CNY');
   const state=await page.evaluate(()=>PortfolioV2UI.getState());
   await page.locator('#nomad360-lang-select').selectOption(lang==='en'?'kk':'en');
   A.deepEqual(await page.evaluate(()=>PortfolioV2UI.getState()),state);
   await goto();await page.evaluate(()=>openPortfolioV2(true));
   A.equal(await selector.inputValue(),'CNY');A.equal(await amount.inputValue(),original);
   if(source==='own')await page.locator('[data-p2-sku] details.nd-v2-info-panel').evaluate(el=>el.open=true);
   await selector.selectOption('KZT');
   const restored=await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()));
   A.deepEqual(financial(restored),financial(baseline));
   // Initial payment is an advance, not an additional cost. No double counting.
   const old=await page.evaluate(()=>PortfolioV2UI.getState());delete old.skus[0].payments;delete old.businessCurrency;
   await page.evaluate(old=>{localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(old));openPortfolioV2(true);},old);
   A.deepEqual(financial(await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()))),financial(baseline));
   protocol.push({width,lang,route:'v2-'+source,editedPayments,normalizedParity:true,restored:true,legacy:true,overflow:false,baseline:financial(baseline),after:financial(restored)});
  }
  if(!editOnly){
  const f=fixture();await page.evaluate(m=>{localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify({...m,version:3,source:'v1-calculated',currency:'KZT'}));LinkedPortfolioV2UI.resume();},f);
  const linked=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(linked.ready,true);
  await page.locator('#nomad360-lang-select').selectOption(lang==='kk'?'en':'kk');
  A.deepEqual(await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState())),linked);
  protocol.push({width,lang,route:'linked',normalizedParity:true});
  }
  A.deepEqual(errors,[]);await page.close();
 }
 fs.writeFileSync(path.join(art,editOnly?'edit-protocol.json':'protocol.json'),JSON.stringify({cases:protocol.length,protocol},null,2));
 console.log(editOnly?'PAYMENT_EDIT_BROWSER_GREEN':'PAYMENT_BROWSER_GREEN',JSON.stringify({cases:protocol.length,editedPayments:protocol.reduce((n,p)=>n+(p.editedPayments?.length||0),0),languages:3,widths:6}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
