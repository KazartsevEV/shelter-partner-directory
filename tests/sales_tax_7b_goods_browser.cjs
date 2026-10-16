'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const A=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),goods=['own','resale','dropship'];
const mime={'.HTML':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.json':'application/json'};
async function fill(page,id,value){await page.locator('#'+id).fill(String(value));}
function comparable(m,f){return JSON.stringify({model:m,cash:f});}
(async()=>{
 const server=http.createServer((req,res)=>{
  const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);return res.end();}
  res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});
  fs.createReadStream(target).pipe(res);
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let cases=0;
 try{
  for(const source of goods)for(const width of [390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:900}}),page=await ctx.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
   await page.goto(base+'Marketing_calc.HTML?sales_tax_preview=1',{waitUntil:'domcontentloaded'});
   await page.locator('#start-own-product').click();
   await fill(page,'product-name-input','Test V1 '+source);
   await page.locator('#product-intro-submit-label').click();
   if(source==='resale'||source==='dropship'){
     await page.locator('[data-product-source="'+source+'"]').click();
     await fill(page,'resale-buy-qty',source==='dropship'?1:60);
     await fill(page,'resale-buy-total',source==='dropship'?20:1200);
     if(source==='dropship')await fill(page,'dropship-delivery-days',15);
   }else{
     await page.locator('[data-product-source="own"]').click();
     await page.locator('[data-material-cost-mode="known"]').click();
     await fill(page,'own-materials-cost',8);
   }
   for(const [id,value] of Object.entries({
     'own-product-ad-budget':900,'own-product-ad-cpc':4.5,'own-product-ad-ctr':2,
     'own-product-ad-click-lead':20,'own-product-ad-lead-sale':50
   }))await fill(page,id,value);
   await page.evaluate(()=>{
     selectProductYesNo('salesVat','yes');
     document.getElementById('own-sales-vat-pct').value='12';
     setProductBusinessTaxType('turnover');
     document.getElementById('own-business-tax-pct').value='6';
     saveCurrentProductToPortfolio();
     for(const p of productPortfolio)Object.assign(p.planning,{
       fundingMode:'cash',targetMarginPct:30,reservePct:10,
       maxDiscountPct:10,minimumMarginPct:10
     });
     renderProductBusinessSummary();refreshAllAggregatePricing();
   });
   const before=await page.evaluate(()=>({
     model:calculateProductPortfolio(),cash:calculateProductCashFlow(calculateProductPortfolio()),
     state:Nomad360SalesTaxV1.getState().mode,
     rate:document.getElementById('own-sales-vat-pct').value
   }));
   A.equal(before.state,null);A.equal(before.rate,'12');
   A.equal(before.model.pricingReady,true);
   // Some minimally entered V1 goods lack a completed financing/supply schedule.
   // Preserve the ENTIRE cash-flow result exactly before vs after the new tax;
   // the frozen VAT browser suite separately verifies fully ready cycles.
   A.ok(before.cash&&typeof before.cash.ready==='boolean');
   A.equal(await page.evaluate(()=>Nomad360SalesTaxV1.select('sales_tax')),true);
   await page.evaluate(()=>Nomad360SalesTaxV1.setRate('8'));
   const after=await page.evaluate(()=>{
    const model=calculateProductPortfolio(),cash=calculateProductCashFlow(model);
    const row=model.items[0],p=aggregatePricingMetrics(productPortfolio[0]);
    const range=calculatePriceListRange(productPortfolio[0]);
    return {model,cash,p,range,mode:Nomad360SalesTaxV1.getState().mode,
      rate:Nomad360SalesTaxV1.getState().rate,legacyChoice:productOwnChoices.salesVat,
      quote:Nomad360SalesTaxV1.quote(100,10),errors:Nomad360SalesTaxV1.getState().error};
   });
   A.equal(after.mode,'sales_tax');A.equal(after.rate,'8');
   A.equal(after.legacyChoice,'no','VAT is not reused for Sales Tax');
   A.equal(after.errors,'');A.deepEqual(after.model,before.model);
   A.deepEqual(after.cash,before.cash);
   A.ok(after.p.priceBeforeTax>0);
   A.ok(Math.abs(after.p.priceBeforeTaxWithVat-after.p.priceBeforeTax*1.08)<1e-8);
   A.ok(Math.abs(after.p.salesTaxAmount-after.p.taxAdjustedPrice*.08)<1e-8);
   A.equal(after.quote.net,90);
   A.ok(Math.abs(after.quote.tax-7.2)<1e-9);
   A.ok(Math.abs(after.quote.customerTotal-97.2)<1e-9);
   if(after.range.ready){
     A.ok(after.range.minPrice>0&&after.range.maxPrice>=after.range.minPrice);
   }
   const rateZero=await page.evaluate(()=>{
     Nomad360SalesTaxV1.setRate('0');const p=aggregatePricingMetrics(productPortfolio[0]);
     return {net:p.taxAdjustedPrice,buyer:p.taxAdjustedPriceWithVat};
   });
   A.equal(rateZero.buyer,rateZero.net);
   await page.evaluate(()=>Nomad360SalesTaxV1.setRate(''));
   const bad=await page.evaluate(()=>({
     message:Nomad360SalesTaxV1.getState().error,buyer:aggregatePricingMetrics(productPortfolio[0]).taxAdjustedPriceWithVat,
     range:calculatePriceListRange(productPortfolio[0]),saved:saveProductCalculationToBrowser()
   }));
   A.ok(bad.message.includes('ставку Sales Tax'));
   A.equal(bad.buyer,null);A.equal(bad.range.ready,false);A.equal(bad.saved,false);
   await page.evaluate(()=>Nomad360SalesTaxV1.setRate('8'));
   const saved=await page.evaluate(()=>({
     ok:saveProductCalculationToBrowser(),
     draft:JSON.parse(localStorage.getItem('marketingCalcProductResultV1'))
   }));
   A.equal(saved.ok,true);
   A.equal(saved.draft.taxRegime,'sales_tax');
   A.equal(saved.draft.salesTaxPct,'8');
   A.equal(saved.draft.productPortfolio[0].taxRegime,'sales_tax');
   await page.goto(base+'Marketing_calc.HTML?resume=1&sales_tax_preview=1',{waitUntil:'domcontentloaded'});
   const restored=await page.evaluate(()=>({
     mode:Nomad360SalesTaxV1.getState().mode,rate:Nomad360SalesTaxV1.getState().rate,
     quote:Nomad360SalesTaxV1.quote(100),p:aggregatePricingMetrics(productPortfolio[0])
   }));
   A.equal(restored.mode,'sales_tax');A.equal(restored.rate,'8');
   A.equal(restored.quote.customerTotal,108);
   A.ok(restored.p.taxAdjustedPriceWithVat>restored.p.taxAdjustedPrice);
   A.equal(errors.length,0,JSON.stringify(errors));
   cases++;
   await ctx.close();
  }
  console.log('SALES_TAX_7B_V1_GOODS_GREEN '+JSON.stringify({cases,sources:goods,widths:[390,1280]}));
 }finally{await browser.close();await new Promise(done=>server.close(done));}
})().catch(err=>{console.error('SALES_TAX_7B_V1_GOODS_RED',err);process.exitCode=1;});
