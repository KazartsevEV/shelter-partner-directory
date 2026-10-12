const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.join(__dirname,'..'),art=path.join(root,'artifacts','converter');fs.mkdirSync(art,{recursive:true});
const protocol=[],url=pathToFileURL(path.join(root,'Marketing_calc.HTML')).href;
const financial=x=>JSON.parse(JSON.stringify(x,(k,v)=>['payments','businessCurrency'].includes(k)?undefined:v));
const model=source=>({version:2,currency:'USD',marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,periodMonths:2,cacReservePct:100},skus:[{id:'a',name:'Тауар / FX product',source,unitCost:20,marginPct:25,mixPct:100,batchUnits:source==='dropship'?0:100,initialCashOut:source==='own'?1000:source==='dropship'?0:2000,fulfillmentPerOrder:3,storagePerUnitDay:0,acquiringPct:0}],resources:[],funding:{kind:'cash',reservePct:10},tax:{type:'turnover',pct:6,vatPct:0}});
const pending=page=>page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()).paymentPending===true);
async function geometry(page){
 const issues=await page.evaluate(()=>{
  const bad=[];if(document.documentElement.scrollWidth>innerWidth+1)bad.push('page overflow');
  for(const el of document.querySelectorAll('[data-fx] input,[data-fx] button,[data-fx] summary')){
   if(!el.getClientRects().length||el.closest('[hidden],.hidden')||!el.closest('details').open)continue;
   const r=el.getBoundingClientRect();if(r.x<0||r.right>innerWidth+1||r.height<44)bad.push(el.outerHTML);
  }return bad;
 });A.deepEqual(issues,[]);
}
async function panel(page,pathKey,currency){
 const wrap=page.locator('[data-payment-path="'+pathKey+'"]');await wrap.locator('[data-payment-currency]').selectOption(currency);await wrap.locator('[data-fx]').evaluate(el=>el.open=true);return wrap.locator('[data-fx]');
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,360,390,430,768,1280])for(const lang of ['ru','en','kk']){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[],requests=[];let availability='ok';page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:\/\//,route=>{
   const u=route.request().url();if(u.startsWith('https://api.frankfurter.dev/')){
    requests.push(u);if(availability==='offline')return route.abort();const pair=u.split('/').slice(-2).map(x=>x.toUpperCase());
    return route.fulfill({contentType:'application/json',body:JSON.stringify({base:pair[0],quote:pair[1],rate:pair[0]==='CNY'?2:3,date:'2026-01-02'})});
   }return route.abort();
  });
  const goto=async(suffix='')=>{await page.goto(url+suffix,{waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(root,'artifacts','converter-utilities.css')});await page.waitForFunction(()=>window.Nomad360PaymentUI&&window.Nomad360UI?.getLanguage());await page.locator('#nomad360-lang-select').selectOption(lang);};
  const apply=async fx=>{await fx.locator('[data-fx-fetch]').click();await page.waitForFunction(el=>el.querySelector('[data-fx-rate]').value!=='',await fx.elementHandle());A.equal(await fx.locator('[data-fx-apply]').isEnabled(),true);await fx.locator('[data-fx-apply]').click();};
  for(const source of ['own','resale','dropship']){
   await goto();const m=model(source);await page.evaluate(m=>{localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(m));openPortfolioV2(true);},m);
   await page.locator('[data-p2-sku] details.nd-v2-info-panel').evaluate(el=>el.open=true);
   const key=source==='own'?'initialCashOut':'unitCost',pathKey='skus.0.'+key,raw=m.skus[0][key];
   const fx=await panel(page,pathKey,'CNY');A.equal(await pending(page),true);
   await fx.locator('[data-fx-fetch]').click();await page.waitForFunction(el=>el.querySelector('[data-fx-rate]').value==='2',await fx.elementHandle());
   A.equal(await pending(page),true);A.equal(await page.locator('[data-p2-path="'+pathKey+'"]').inputValue(),String(raw));
   await fx.locator('[data-fx-apply]').click();
   const expected=JSON.parse(JSON.stringify(m));expected.skus[0][key]=raw*2;
   if(source==='dropship'){
    const delivery=await panel(page,'skus.0.fulfillmentPerOrder','EUR');A.equal(await pending(page),true);await apply(delivery);expected.skus[0].fulfillmentPerOrder=9;
   }
   const result=await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()));
   A.equal(result.ready,true);A.deepEqual(financial(result),financial(await page.evaluate(m=>PortfolioV2Engine.build(m),expected)));
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('marketingCalcPortfolioV2')));
   A.equal(saved.skus[0][key],raw);A.equal(saved.skus[0].payments[key].convertedAmount,raw*2);
   A.equal(saved.skus[0].payments[key].conversion.date,'2026-01-02');
   const count=requests.length;for(const next of ['ru','en','kk']){await page.locator('#nomad360-lang-select').selectOption(next);A.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('marketingCalcPortfolioV2'))),saved);A.deepEqual(financial(await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()))),financial(result));}
   await goto();await page.evaluate(()=>openPortfolioV2(true));A.equal(requests.length,count);
   A.deepEqual(await page.evaluate(()=>PortfolioV2UI.getState()),saved);A.deepEqual(financial(await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()))),financial(result));
   await page.locator('[data-p2-sku] details.nd-v2-info-panel').evaluate(el=>el.open=true);await fx.evaluate(el=>el.open=true);
   await geometry(page);await fx.screenshot({path:path.join(art,`${width}-${lang}-v2-${source}.png`)});
   const amount=page.locator('[data-p2-path="'+pathKey+'"]'),edited=source==='own'?1035:35;
   await amount.fill(String(edited));const invalidated=await page.evaluate(key=>JSON.parse(localStorage.getItem('marketingCalcPortfolioV2')).skus[0].payments[key],key);
   A.equal(invalidated.paymentAmount,edited);A.equal(invalidated.convertedAmount,null);A.equal(invalidated.conversion,undefined);A.equal(await pending(page),true);
   await apply(fx);await fx.locator('[data-fx-apply]').click();
   const twice=await page.evaluate(key=>JSON.parse(localStorage.getItem('marketingCalcPortfolioV2')).skus[0].payments[key],key);A.equal(twice.convertedAmount,edited*2);
   expected.skus[0][key]=edited*2;A.deepEqual(financial(await page.evaluate(()=>Nomad360PaymentUI.buildPortfolio(PortfolioV2UI.getState()))),financial(await page.evaluate(m=>PortfolioV2Engine.build(m),expected)));
   await page.locator('[data-payment-path="'+pathKey+'"] [data-payment-currency]').selectOption('KZT');A.equal(await pending(page),true);
   protocol.push({width,lang,route:'v2-'+source,saved:saved.skus[0].payments,invalidated,twice,normalizedFinance:financial(result),nativeFinance:financial(await page.evaluate(m=>PortfolioV2Engine.build(m),{...expected,skus:expected.skus.map(s=>({...s,[key]:raw*2}))})),noResumeRequests:true});
  }
  for(const source of ['own','resale','dropship','materials']){
   await goto();await page.locator('#business-currency').selectOption('USD');await page.locator('#start-own-product').click();await page.locator('#product-name-input').fill('Валютный товар / FX тауар');await page.locator('#product-intro-submit-label').click();await page.evaluate(source=>selectProductSource(source==='materials'?'own':source),source);
   let wrap,field;if(source==='materials'){
    await page.locator('[data-material-cost-mode="calculate"]').click();field=page.locator('.material-cost-price').first();wrap=page.locator('#own-material-rows [data-payment-field]').first();
   }else if(source==='own'){
    await page.locator('[data-material-cost-mode="known"]').click();field=page.locator('#own-materials-cost');wrap=page.locator('[data-payment-field="own-materials-cost"]');
   }else{field=page.locator('#resale-buy-total');wrap=page.locator('[data-payment-field="resale-buy-total"]');await page.locator('#resale-buy-qty').fill('10');}
   await field.fill('1000');await wrap.locator('[data-payment-currency]').selectOption('CNY');const fx=wrap.locator('[data-fx]');await fx.evaluate(el=>el.open=true);await apply(fx);
   const normalized=await page.evaluate(id=>Nomad360PaymentUI.readNumber(document.getElementById(id)||document.querySelector('.material-cost-price')),source==='own'?'own-materials-cost':source==='materials'?'': 'resale-buy-total');A.equal(normalized,2000);A.equal(await field.inputValue(),'1000');
   if(source!=='dropship'){
    await page.locator('[data-yn-group="inboundIncluded"][data-yn-value="no"]').click();await page.locator('#own-inbound-delivery-cost').fill('150');const delivery=page.locator('[data-payment-field="own-inbound-delivery-cost"]');await delivery.locator('[data-payment-currency]').selectOption('EUR');await delivery.locator('[data-fx]').evaluate(el=>el.open=true);await apply(delivery.locator('[data-fx]'));
    A.equal(await page.evaluate(()=>productNumber('own-inbound-delivery-cost')),450);
   }
   if(source==='materials'){
    await page.locator('button[onclick="addMaterialRow()"]') .click();const second=page.locator('.material-cost-price').nth(1);await second.fill('3');const secondWrap=page.locator('#own-material-rows [data-payment-field]').nth(1);await secondWrap.locator('[data-payment-currency]').selectOption('EUR');await secondWrap.locator('[data-fx]').evaluate(el=>el.open=true);await apply(secondWrap.locator('[data-fx]'));
    A.equal(await page.evaluate(()=>Number(document.getElementById('own-materials-cost').value)),2009);
   }
   await page.evaluate(()=>saveProductCalculationToBrowser());const saved=await page.evaluate(()=>readSavedProductCalculation()),payment=Object.values(saved.productPortfolio[0].payments).find(p=>p.paymentCurrency==='CNY'&&p.active);
   A.equal(payment.convertedAmount,2000);A.equal(payment.conversion.rate,2);A.equal(payment.status,'normalized');
   const amountBefore=await page.evaluate(()=>latestMaterialsLandedUnitCost),count=requests.length;
   A.equal(amountBefore,source==='dropship'?200:source==='resale'?650:source==='materials'?2459:2450);
   await geometry(page);await fx.screenshot({path:path.join(art,`${width}-${lang}-v1-${source}.png`)});
   await goto('?resume=1');A.equal(requests.length,count);A.equal(await field.inputValue(),'1000');A.equal(await page.evaluate(()=>latestMaterialsLandedUnitCost),amountBefore);
   const restored=await page.evaluate(()=>readSavedProductCalculation());A.deepEqual(restored.productPortfolio[0].payments,saved.productPortfolio[0].payments);
   const after=await page.evaluate(()=>Nomad360PaymentUI.captureV1(nomadPaymentContext()));A.deepEqual(after,saved.productPortfolio[0].payments);
   for(const next of ['en','kk','ru']){await page.locator('#nomad360-lang-select').selectOption(next);A.equal(await page.evaluate(()=>latestMaterialsLandedUnitCost),amountBefore);A.deepEqual(await page.evaluate(()=>readSavedProductCalculation()),restored);}
   protocol.push({width,lang,route:'v1-'+source,payments:saved.productPortfolio[0].payments,landedUnitCost:amountBefore,noResumeRequests:true});
  }
  availability='offline';await goto();await page.evaluate(m=>{localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(m));openPortfolioV2(true);},model('resale'));
  const offline=await panel(page,'skus.0.unitCost','CNY');await offline.locator('[data-fx-fetch]').click();await page.waitForFunction(el=>el.ndMessage==='error',await offline.elementHandle());
  A.match(await offline.locator('[data-fx-message]').textContent(),lang==='en'?/manual/:lang==='ru'?/ручной/:/қолмен/);
  A.equal(await pending(page),true);await offline.locator('[data-fx-rate]').fill('2');await offline.locator('[data-fx-date]').fill('2026-01-02');await offline.locator('[data-fx-source]').fill('Bank invoice');await offline.locator('[data-fx-apply]').click();
  A.equal(await page.evaluate(()=>PortfolioV2UI.getState().skus[0].payments.unitCost.convertedAmount),40);await geometry(page);await offline.screenshot({path:path.join(art,`${width}-${lang}-manual-fallback.png`)});
  protocol.push({width,lang,route:'api-manual',offlineMessageLocalized:true,convertedAmount:40,manualSource:'Bank invoice'});
  A.deepEqual(errors,[]);await page.close();
 }
 // Failure, malformed pair, a delayed response and a newer proposal cannot alter an applied rate.
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let mode='offline',release,start;const delayedStarted=new Promise(resolve=>start=resolve);
 await page.route(/^https?:\/\//,route=>{
  if(!route.request().url().startsWith('https://api.frankfurter.dev/'))return route.abort();
  if(mode==='offline')return route.abort();
  if(mode==='delayed')return new Promise(resolve=>{release=()=>route.fulfill({contentType:'application/json',body:JSON.stringify({base:'CNY',quote:'USD',date:'2026-01-02',rate:2})}).then(resolve);start();});
  return route.fulfill({contentType:'application/json',body:JSON.stringify({base:mode==='wrong'?'USD':'CNY',quote:mode==='wrong'?'CNY':'USD',date:'2026-01-02',rate:3})});
 });
 await page.goto(url);await page.locator('#nomad360-lang-select').selectOption('ru');await page.evaluate(m=>{localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(m));openPortfolioV2(true);},model('resale'));
 const fx=await panel(page,'skus.0.unitCost','CNY');await fx.locator('[data-fx-fetch]').click();await page.waitForFunction(el=>el.querySelector('[data-fx-message]').textContent.includes('недоступен'),await fx.elementHandle());A.equal(await pending(page),true);
 await fx.locator('[data-fx-rate]').fill('2');await fx.locator('[data-fx-date]').fill('2026-01-02');await fx.locator('[data-fx-source]').fill('Bank invoice');await fx.locator('[data-fx-apply]').click();
 const saved=await page.evaluate(()=>PortfolioV2UI.getState());A.equal(saved.skus[0].payments.unitCost.conversion.source,'manual');
 mode='newer';await fx.locator('[data-fx-fetch]').click();await page.waitForFunction(el=>el.querySelector('[data-fx-rate]').value==='3',await fx.elementHandle());A.deepEqual(await page.evaluate(()=>PortfolioV2UI.getState()),saved);
 await fx.locator('[data-fx-apply]').click();A.equal(await page.evaluate(()=>PortfolioV2UI.getState().skus[0].payments.unitCost.convertedAmount),60);
 mode='wrong';await fx.locator('[data-fx-fetch]').click();await page.waitForFunction(el=>el.querySelector('[data-fx-message]').textContent.includes('недоступен'),await fx.elementHandle());A.equal(await page.evaluate(()=>PortfolioV2UI.getState().skus[0].payments.unitCost.convertedAmount),60);
 mode='delayed';await fx.locator('[data-fx-fetch]').click();await delayedStarted;await page.locator('[data-p2-path="skus.0.unitCost"]').fill('35');await release();await page.waitForTimeout(100);A.equal(await pending(page),true);A.equal(await fx.locator('[data-fx-rate]').inputValue(),'');
 A.deepEqual(errors,[]);await page.close();
 // Live public API calls from Chromium: no stub, no model/user payload, no application.
 const live=await browser.newPage();await live.goto(url);const liveRates=await live.evaluate(async()=>{
  const rows=[];for(const [iso] of Nomad360Currency.currencies){if(iso==='USD')continue;try{rows.push({iso,ok:true,quote:await Nomad360FX.quote(iso,'USD')});}catch(e){rows.push({iso,ok:false,error:e.message});}}return rows;
 });
 fs.writeFileSync(path.join(art,'live-provider.json'),JSON.stringify(liveRates,null,2));A.ok(liveRates.some(r=>r.iso==='CNY'&&r.ok),'Live CNY/USD browser CORS must succeed');A.ok(liveRates.some(r=>r.iso==='KZT'&&r.ok),'Live KZT/USD browser CORS must succeed');await live.close();
 fs.writeFileSync(path.join(art,'protocol.json'),JSON.stringify({cases:protocol.length,protocol,failureAndManualFallback:true,staleResponseIgnored:true,newerRateRequiresApply:true},null,2));
 console.log('CONVERTER_BROWSER_GREEN',JSON.stringify({cases:protocol.length,languages:3,widths:6,livePairs:liveRates.filter(r=>r.ok).length}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
