/* #47AU V1 final list/gross price, VAT and discount-range presentation invariants.
 * Includes real 390px Chromium product demos, credit/noncredit, missing/invalid
 * discount controls and unchanged financial source on locale-only switches.
 */
'use strict';
const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
const tick=page=>page.waitForTimeout(65);

async function snapshot(page){
 return page.evaluate(()=>{
  const sku=productPortfolio[0];
  const pricing=aggregatePricingMetrics(sku);
  const range=calculatePriceListRange(sku);
  const card=document.querySelector('[data-tax-price-product-id="1"]');
  const section=document.querySelector('[data-business-product-id="1"]');
  if(!card||!section)throw Error('Missing V1 final SKU panels');
  const gross=card.querySelector('.final-buyer-price [data-nomad-display-money]');
  const rangeContainer=card.querySelector('[data-price-list-range]');
  const rangeNodes=[...rangeContainer.querySelectorAll('[data-nomad-display-number]')];
  const vatNodes=[...card.querySelectorAll('[data-nomad-display-suffix="%"]')];
  const model=calculateProductPortfolio();
  const inputs=[...document.querySelectorAll('#product-screen input')]
   .filter(e=>e.id).map(e=>[e.id,e.value]);
  return {
   source:JSON.stringify(productPortfolio),
   model:JSON.stringify(model),
   inputs,
   cardHtml:card.textContent,
   gross:gross?Number(gross.dataset.nomadDisplayNumber):null,
   expectedGross:pricing.salesVatChoice==='yes'&&pricing.taxAdjustedPriceWithVat!==null?
    pricing.taxAdjustedPriceWithVat:pricing.taxAdjustedPrice,
   vatPercent:vatNodes.length?Number(vatNodes[0].dataset.nomadDisplayNumber):null,
   expectedVat:pricing.salesVatChoice==='yes'?pricing.vatPct:null,
   rawRange:rangeNodes.map(n=>Number(n.dataset.nomadDisplayNumber)),
   expectedRange:range.ready?[range.minPrice,range.maxPrice]:[],
   rangeReady:range.ready,rangeError:range.error,
   localPrice:section.querySelector('[data-aggregate-price="priceBeforeTax"]')?.getAttribute('data-nomad-display-number'),
   expectedLocalPrice:pricing.priceBeforeTax,
   priceCardRef:card,
   lang:Nomad360LocaleCore.displayLocale()
  };
 });
}
async function assertPresentation(page,label){
 const state=await page.evaluate(()=>{
  const nodes=[
   ...document.querySelectorAll('#product-tax-price-list [data-nomad-display-number]'),
   ...document.querySelectorAll('#product-tax-block [data-aggregate-price][data-nomad-display-number]'),
   ...document.querySelectorAll('#product-tax-block [data-vat-price-value] [data-nomad-display-number]')
  ];
  const locale=Nomad360LocaleCore.displayLocale();
  const language=Nomad360LocaleCore.locale();
  const unit=language==='en'?'currency units*':language==='kk'?'ш.б.*':'у.е.*';
  const errors=[];
  for(const node of nodes){
   const raw=Number(node.dataset.nomadDisplayNumber);
   if(!Number.isFinite(raw)){errors.push('not finite');continue}
   const f=node.dataset.nomadDisplayFractions||'2';
   const min=f==='0'||f==='compact'?0:2,max=f==='0'?0:2;
   const suffix=node.dataset.nomadDisplaySuffix||'';
   const expected=raw.toLocaleString(locale,{minimumFractionDigits:min,maximumFractionDigits:max})+
    suffix+(node.hasAttribute('data-nomad-display-money')?' '+unit:'');
   if(node.textContent!==expected)errors.push({raw,expected,actual:node.textContent});
  }
  return {errors,numberCount:nodes.length,locale};
 });
 A.deepEqual(state.errors,[],'wrong numeric locale '+label);
 A.ok(state.numberCount>10,'no source-bound numeric price/percentage nodes '+label);
 return state;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const financing of ['cash','credit']){
   const ctx=await browser.newContext({locale:'ru-RU',viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,r=>r.abort());
   try{
    await page.goto(url+'?demo=shopper&finance='+financing,{waitUntil:'domcontentloaded'});
    await page.locator('#product-demo-banner').waitFor({state:'visible',timeout:10000});
    await page.waitForFunction(()=>!!window.Nomad360LocaleCore);
    await tick(page);
    const base=await snapshot(page);
    A.ok(base.rangeReady,'demo must produce valid discount price bounds');
    A.ok(base.expectedGross>0,'buyer price missing');
    A.ok(base.localPrice!==null,'dynamic SKU price has no source value');
    A.ok(Math.abs(Number(base.localPrice)-base.expectedLocalPrice)<1e-8);
    A.ok(Math.abs(base.gross-base.expectedGross)<1e-8);
    A.deepEqual(base.rawRange,base.expectedRange);
    A.equal(base.vatPercent,base.expectedVat);
    for(const language of ['en','kk','ru','en']){
     await page.locator('#nomad360-lang-select').selectOption(language);
     await page.waitForFunction(code=>document.documentElement.lang===code,language);
     await tick(page);
     await assertPresentation(page,financing+' '+language);
     const snap=await snapshot(page);
     A.equal(snap.source,base.source,'localized draft mutated');
     A.equal(snap.model,base.model,'localized model changed');
     A.deepEqual(snap.inputs,base.inputs,'editable numeric input changed');
     A.equal(snap.gross,base.gross);
     A.deepEqual(snap.rawRange,base.rawRange);
     A.equal(snap.vatPercent,base.vatPercent);
    }
    // Real hidden discount input: choosing no zeroes only its business
    // discount, hides the control and recomputes a valid range.
    await page.locator('[data-tax-price-product-id="1"] [data-discount-choice="no"]').click();
    await tick(page);
    A.equal(await page.locator('[data-tax-price-product-id="1"] [data-discount-input-wrap]').isHidden(),true);
    let discount=await snapshot(page);
    A.ok(discount.rangeReady,'no-discount price bounds should still be ready');
    A.deepEqual(discount.rawRange,discount.expectedRange);
    await page.locator('[data-tax-price-product-id="1"] [data-discount-choice="yes"]').click();
    await tick(page);
    discount=await snapshot(page);
    A.equal(discount.rangeReady,false,'blank restored max-discount must not reuse old range');
    A.deepEqual(discount.rawRange,[],'stale discount numbers remain after invalidation');
    // Invalid margin ceiling: explicit error and no stale prices after
    // choosing an impossible minimum greater than target.
    await page.evaluate(()=>{
     const sku=productPortfolio[0];
     updatePriceListField(sku.id,'maxDiscountPct',20);
     updatePriceListField(sku.id,'minimumMarginPct',90);
    });
    await tick(page);
    discount=await snapshot(page);
    A.equal(discount.rangeReady,false,'bad minimum margin must fail closed');
    A.deepEqual(discount.rawRange,[]);
    A.match(discount.rangeError,/Минимальная маржинальность/);
    const badSource=discount.source,badModel=discount.model,badInput=discount.inputs;
    for(const language of ['kk','en','ru']){
     await page.locator('#nomad360-lang-select').selectOption(language);
     await page.waitForFunction(code=>document.documentElement.lang===code,language);
     await tick(page);
     const now=await snapshot(page);
     A.equal(now.source,badSource,'locale switch changed invalid discount source');
     A.equal(now.model,badModel,'locale switch repaired invalid model without user action');
     A.deepEqual(now.inputs,badInput);
     A.deepEqual(now.rawRange,[],'locale switch revived stale range');
     await assertPresentation(page,'invalid margin '+language);
    }
    A.deepEqual(errors,[],'runtime errors '+financing);
    console.log('NOMAD360_L47_AU_GREEN',JSON.stringify({financing,gross:base.gross,
     vat:base.vatPercent,range:base.rawRange,invalidRangeBlocked:true}));
   }finally{await ctx.close()}
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('NOMAD360_L47_AU_RED',e.stack||e);process.exitCode=1});
