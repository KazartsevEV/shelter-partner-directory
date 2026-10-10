// Real mobile browser acceptance for first-visit, own data entry, draft and resume.
// Run: node tests/marketing_calc_first_user_journey.test.cjs
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const pageUrl=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({locale:'ru-RU',viewport:{width:390,height:844}});
 const errors=[];
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,r=>r.abort());
 try{
   await page.goto(pageUrl,{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#home-screen').isVisible(),true);
   assert.equal(await page.locator('#saved-product-entry').isVisible(),false);
   assert.equal(await page.locator('#product-demo-banner').isVisible(),false);
   assert.equal(await page.evaluate(()=>productPortfolio.length),0);
   assert.equal(await page.locator('#product-own-form').isVisible(),false);
   assert.equal(await page.locator('#nomad360-calculation-list ul').isVisible(),true,'Outcome list is already visible');
   assert.match(await page.locator('#home-screen').textContent(),/живые деньги|денежный поток/i);
   // Detailed production and resale both use the primary, legible calculator.
   await page.locator('#start-own-product').click();
   assert.equal(await page.locator('#product-screen').isVisible(),true);
   assert.equal(await page.locator('#product-name-input').inputValue(),'');
   assert.equal(await page.locator('#product-source-block').isVisible(),false);
   await page.locator('#product-name-input').fill('Моя первая футболка');
   await page.getByRole('button',{name:'Рассчитать мой товар'}).click();
   assert.equal(await page.locator('#product-source-block').isVisible(),true);

   // Wholesale purchase uses finished goods, not a manufactured-material BOM.
   await page.locator('#product-source-block [data-product-source="resale"]').click();
   assert.equal(await page.locator('#product-source-unavailable').isVisible(),false);
   assert.equal(await page.locator('#product-own-form').isVisible(),true);
   assert.equal(await page.locator('#resale-buy-panel').isVisible(),true);
   assert.equal(await page.locator('#product-production-block').isVisible(),false);
   assert.equal(await page.locator('#production-unit-result').isVisible(),false);
   await page.locator('#resale-buy-qty').fill('15');
   await page.locator('#resale-buy-total').fill('450');
   const purchase=await page.evaluate(()=>currentProductPortfolioSnapshot());
   assert.equal(purchase.source,'resale');
   assert.equal(purchase.materialsBatchQty,15);
   assert.equal(purchase.productionUnitCost,0);
   assert.equal(purchase.productionTotal,0);
   // Default inbound delivery remains the old 10% of unit purchase cost.
   assert.equal(purchase.materialsUnitCost,33);
   assert.equal(purchase.logisticsQty,15);
   assert.equal(await page.locator('#resale-buy-unit').textContent(),'30,00 у.е.*');

   // Dropshipping now has direct supplier and delivery fields, no production.
   await page.locator('#product-source-block [data-product-source="dropship"]').click();
   assert.equal(await page.locator('#product-source-unavailable').isVisible(),false);
   assert.equal(await page.locator('#product-own-form').isVisible(),true);
   assert.equal(await page.locator('#dropship-delivery-terms').isVisible(),true);
   assert.equal(await page.locator('#production-unit-result').isVisible(),false);
   assert.equal(await page.locator('#warehouse-storage-panel').isVisible(),false);
   await page.locator('#product-source-block [data-product-source="own"]').click();
   assert.equal(await page.locator('#product-production-block').isVisible(),true);
   assert.equal(await page.locator('#production-unit-result').isVisible(),true);
   assert.equal(await page.locator('#product-own-form').isVisible(),true);
   assert.equal(await page.locator('#product-draft-toolbar').isVisible(),true);
   assert.equal(await page.locator('#product-source-unavailable').isVisible(),false);
   for(const id of [
       'own-product-ad-budget','own-product-ad-cpc','own-product-ad-ctr',
       'own-product-ad-click-lead','own-product-ad-lead-sale'
   ]) assert.equal(await page.locator('#'+id).inputValue(),'','User did not supply '+id);

   await page.locator('[data-material-cost-mode="known"]').click();
   await page.locator('#own-materials-cost').fill('235');
   await page.locator('#own-materials-batch-qty').fill('50');
   await page.locator('[data-yn-group="productionPremises"][data-yn-value="yes"]').click();
   await page.locator('#own-production-premises-monthly').fill('750');
   await page.locator('#own-production-defect-pct').fill('3');
   await page.locator('#own-product-ad-budget').fill('1800');
   await page.locator('#own-product-ad-cpc').fill('6');
   await page.locator('#product-draft-toolbar button').click();
   assert.match(await page.locator('#product-draft-save-status').textContent(),/Сохранено/);
   let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('marketingCalcProductResultV1')));
   assert.equal(stored.productPortfolio.length,1);
   assert.equal(stored.productPortfolio[0].name,'Моя первая футболка');
   assert.equal(stored.productPortfolio[0].inputs['own-materials-cost'],'235');
   assert.equal(stored.productPortfolio[0].inputs['own-product-ad-budget'],'1800');
   assert.equal(stored.productPortfolio[0].inputs['own-product-ad-cpc'],'6');

   // Reload standard URL (without demo) and explicitly resume in-place.
   await page.goto(pageUrl,{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#home-screen').isVisible(),true);
   assert.equal(await page.locator('#saved-product-entry').isVisible(),true);
   assert.equal(await page.evaluate(()=>productPortfolio.length),0,'Saved file does not prepopulate a new calculation');
   await page.locator('#resume-own-product').click();
   assert.equal(await page.locator('#product-screen').isVisible(),true);
   assert.equal(await page.locator('#product-name-input').inputValue(),'Моя первая футболка');
   assert.equal(await page.locator('#own-materials-cost').inputValue(),'235');
   assert.equal(await page.locator('#own-product-ad-budget').inputValue(),'1800');
   assert.equal(await page.locator('#own-product-ad-cpc').inputValue(),'6');
   assert.equal(await page.locator('#product-portfolio-list [data-portfolio-product-id="1"]').count(),1);
   await page.locator('#own-materials-cost').fill('245');
   await page.locator('#product-draft-toolbar button').click();
   assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('marketingCalcProductResultV1')))).productPortfolio[0].inputs['own-materials-cost'],'245');

   // A second item must not overwrite the first after reopening the saved item.
   const addition=await page.evaluate(()=>addAnotherProduct());
   assert.equal(addition,true);
   assert.equal(await page.evaluate(()=>currentProductSequence),2);
   await page.locator('#product-source-block [data-product-source="own"]').click();
   await page.locator('#additional-product-name-input').fill('Моя вторая майка');
   await page.locator('[data-material-cost-mode="known"]').click();
   await page.locator('#own-materials-cost').fill('135');
   await page.locator('#product-draft-toolbar button').click();
   stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('marketingCalcProductResultV1')));
   assert.equal(stored.productPortfolio.length,2);
   assert.equal(stored.productPortfolio[0].name,'Моя первая футболка');
   assert.equal(stored.productPortfolio[0].inputs['own-materials-cost'],'245');
   assert.equal(stored.productPortfolio[1].name,'Моя вторая майка');
   assert.equal(stored.productPortfolio[1].inputs['own-materials-cost'],'135');
   assert.deepEqual(stored.productPortfolio.map(x=>x.id),[1,2]);

   await page.goto(pageUrl+'?resume=1',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#product-screen').isVisible(),true);
   assert.equal(await page.locator('#own-materials-cost').inputValue(),'135');
   assert.equal(await page.locator('#product-portfolio-list [data-portfolio-product-id]').count(),2);
   await page.locator('#product-portfolio-list [data-portfolio-product-id="1"] button:not([data-delete-v1-sku])').click();
   assert.equal(await page.locator('#own-materials-cost').inputValue(),'245');
   assert.equal(await page.locator('#product-portfolio-list [data-portfolio-product-id]').count(),2);

   // A clean direct start from a saved browser starts blank, without erasing save.
   await page.goto(pageUrl+'?start=product',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#product-name-input').inputValue(),'');
   assert.equal(await page.evaluate(()=>productPortfolio.length),0);
   assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('marketingCalcProductResultV1')))).productPortfolio.length,2);
   // Real deletion must update both the visible portfolio and the persisted
   // draft, including when a different SKU is being edited.
   await page.goto(pageUrl+'?resume=1',{waitUntil:'domcontentloaded'});
   page.on('dialog',dialog=>dialog.accept());
   assert.equal(await page.locator('[data-delete-v1-sku]').count(),2);
   await page.locator('[data-delete-v1-sku="1"]').click();
   let afterDelete=await page.evaluate(()=>({
     ids:productPortfolio.map(x=>x.id),
     saved:JSON.parse(localStorage.getItem('marketingCalcProductResultV1')),
     current:currentProductSequence
   }));
   assert.deepEqual(afterDelete.ids,[2]);
   assert.deepEqual(afterDelete.saved.productPortfolio.map(x=>x.id),[2],
     'Deleting another SKU must never resurrect it on reload');
   assert.equal(await page.locator('[data-portfolio-product-id]').count(),1);
   assert.equal(await page.locator('[data-business-product-id="1"]').count(),0);
   await page.goto(pageUrl+'?resume=1',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#product-name-input').inputValue(),'Моя вторая майка');
   await page.locator('[data-delete-v1-sku="2"]').click();
   afterDelete=await page.evaluate(()=>({
     ids:productPortfolio.map(x=>x.id),
     saved:localStorage.getItem('marketingCalcProductResultV1')
   }));
   assert.deepEqual(afterDelete.ids,[]);
   assert.equal(afterDelete.saved,null,'Deleting the last V1 item clears its saved draft');
   assert.equal(await page.locator('#product-portfolio-list [data-portfolio-product-id]').count(),0);
   assert.equal(await page.locator('#product-name-input').inputValue(),'',
     'Removing active last SKU clears its form; user can start anew');
   await page.evaluate(()=>showHome());
   assert.equal(await page.locator('#saved-product-entry').isVisible(),false);

   assert.deepEqual(errors,[]);
   console.log('CLEAN_USER_JOURNEY_GREEN',JSON.stringify({firstVisit:'blank',ownName:'Моя первая футболка',resume:'PASS',draftSaved:true,twoSkuSaved:true,originalRestored:true,dropship:'explained',resale:'tested'}));
 }finally{await browser.close();}
})().catch(e=>{console.error('CLEAN_USER_JOURNEY_RED',e.stack||e);process.exitCode=1});
