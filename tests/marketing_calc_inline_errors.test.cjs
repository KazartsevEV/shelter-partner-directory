// Real mobile Chromium acceptance: violations appear by the input, not 3 screens away.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const url = pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,r=>r.abort());
 try{
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('#start-multi-portfolio').click();
   const fld=key=>page.locator('[data-p2-path="'+key+'"]');
   const inline=key=>fld(key).locator('xpath=ancestor::label[1]').locator('[data-p2-inline-error]');
   assert.equal(await inline('marketing.budget').count(),1,'Budget error anchored directly to the input');
   assert.match(await inline('marketing.budget').textContent(),/рекламный бюджет/);
   assert.equal(await fld('marketing.budget').getAttribute('aria-invalid'),'true');
   assert.equal(await page.locator('#p2-results').getByText('Укажите общий месячный рекламный бюджет.').count(),0,'No distant duplicated validation list');
   for(const [key,v] of [['marketing.budget',1000],['marketing.cpc',5],['marketing.ctrPct',2],
     ['marketing.clickLeadPct',20],['marketing.leadOrderPct',25],
     ['skus.0.name','Первый товар'],['skus.0.unitCost',20]])await fld(key).fill(String(v));
   assert.equal(await inline('marketing.budget').count(),0,'Resolved input clears its message');
   assert.equal(await fld('marketing.budget').getAttribute('aria-invalid'),null);
   await fld('skus.0.mixPct').fill('80');
   assert.equal(await inline('skus.0.mixPct').count(),1);
   assert.match(await inline('skus.0.mixPct').textContent(),/ровно 100%/);
   assert.match(await page.locator('#p2-mix-sum').textContent(),/ровно 100%/);
   await fld('skus.0.mixPct').fill('100');
   assert.equal(await inline('skus.0.mixPct').count(),0,'Repaired mix removes inline warning');
   await page.locator('#p2-stage-production [data-p2-add-resource]').click();
   await page.locator('[data-p2-path="resources.0.amount"]').fill('1000');
   await page.locator('[data-p2-path="resources.0.allocation"]').selectOption('usage');
   await fld('resources.0.usage.sku-1').fill('20');
   await fld('resources.0.capacity').fill('10');
   assert.match(await inline('resources.0.capacity').textContent(),/превышает доступную мощность/);
   await fld('resources.0.capacity').fill('30');
   assert.equal(await inline('resources.0.capacity').count(),0);
   await page.locator('#p2-stage-purchase [data-p2-add-resource]').click();
   await page.locator('[data-p2-resource-member="1"][value="sku-1"]').uncheck();
   const resourceCheck=await page.evaluate(()=>({
      resources:PortfolioV2UI.getState().resources.map(r=>({id:r.id,members:r.skuIds})),
      issues:PortfolioV2Engine.build(PortfolioV2UI.getState()).fieldErrors,
      rendered:Array.from(document.querySelectorAll('[data-p2-resource]')).map(el=>({id:el.dataset.p2Resource,notes:Array.from(el.querySelectorAll('[data-p2-inline-error]')).map(n=>n.textContent)}))
   }));
   console.log('RESOURCE_INLINE_DIAGNOSTIC',JSON.stringify(resourceCheck));
   assert.match(await page.locator('[data-p2-resource]').nth(1).locator('[data-p2-inline-error]').textContent(),/не выбран ни один товар/);
   // Common invalid errors must not change the financial results after repair.
   await page.locator('[data-p2-resource-member="1"][value="sku-1"]').check();
   assert.equal(await page.locator('#p2-results').getByText('Исправьте поля, выделенные красным').count(),0);

   await page.goto(url+'?demo=shopper&finance=cash',{waitUntil:'domcontentloaded'});
   await page.locator('#product-demo-banner').waitFor({state:'visible'});
   const sku=page.locator('[data-business-product-id="1"]');
   const legacy=kind=>sku.locator('[data-aggregate-qty-kind="'+kind+'"]');
   const legacyNote=kind=>sku.locator('[data-aggregate-qty-error="'+kind+'"]');
   assert.equal(await sku.locator('[data-quantity-warning]').count(),0,'Old distant warning removed');
   await legacy('sales').fill('110');
   assert.equal(await legacyNote('sales').isVisible(),true);
   assert.match(await legacyNote('sales').textContent(),/превышает складские остатки/);
   assert.equal(await legacy('sales').getAttribute('aria-invalid'),'true');
   await legacy('sales').fill('100');
   assert.equal(await legacyNote('sales').isVisible(),false);
   assert.equal(await legacy('sales').getAttribute('aria-invalid'),'false');
   await legacy('materials').fill('105');
   assert.equal(await legacyNote('materials').isVisible(),true);
   assert.match(await legacyNote('materials').textContent(),/не менее 106/);
   await legacy('materials').fill('106');
   assert.equal(await legacyNote('materials').isVisible(),false);
   await legacy('logistics').fill('101');
   assert.equal(await legacyNote('logistics').isVisible(),true);
   assert.match(await legacyNote('logistics').textContent(),/при выпуске 100/);
   await legacy('logistics').fill('100');
   assert.equal(await legacyNote('logistics').isVisible(),false);
   assert.deepEqual(errors,[]);
   console.log('INLINE_VALIDATION_GREEN',JSON.stringify({portfolioFields:['marketing.budget','skus.0.mixPct','resources.0.capacity','resources.1.skuIds'],legacyQuantityFields:['sales','materials','logistics'],removalOnCorrection:true}));
 } finally {await browser.close();}
})().catch(e=>{console.error('INLINE_VALIDATION_RED',e.stack||e);process.exitCode=1});
