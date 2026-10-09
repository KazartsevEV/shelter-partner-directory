// Real mobile browser acceptance for first-visit, own data entry, draft and resume.
// Run: node tests/marketing_calc_first_user_journey.test.cjs
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const pageUrl=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
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
   await page.locator('summary').filter({hasText:'Посмотреть, что будет рассчитываться'}).click();
   assert.match(await page.locator('#home-screen').textContent(),/ЖИВЫЕ ДЕНЬГИ|денежный поток/);
   await page.locator('#start-own-product').click();
   assert.equal(await page.locator('#product-screen').isVisible(),true);
   assert.equal(await page.locator('#product-name-input').inputValue(),'');
   assert.equal(await page.locator('#product-source-block').isVisible(),false);
   await page.locator('#product-name-input').fill('Моя первая футболка');
   await page.getByRole('button',{name:'Рассчитать мой товар'}).click();
   assert.equal(await page.locator('#product-source-block').isVisible(),true);

   // Missing models are honestly named: no fake resale/dropship forecast.
   for(const model of ['resale','dropship']){
      await page.locator('#product-source-block [data-product-source="'+model+'"]').click();
      assert.equal(await page.locator('#product-source-unavailable').isVisible(),true);
      assert.equal(await page.locator('#product-own-form').isVisible(),false);
   }
   await page.locator('#product-source-block [data-product-source="own"]').click();
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
   await page.locator('#product-portfolio-list [data-portfolio-product-id="1"] button').click();
   assert.equal(await page.locator('#own-materials-cost').inputValue(),'245');
   assert.equal(await page.locator('#product-portfolio-list [data-portfolio-product-id]').count(),2);

   // A clean direct start from a saved browser starts blank, without erasing save.
   await page.goto(pageUrl+'?start=product',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#product-name-input').inputValue(),'');
   assert.equal(await page.evaluate(()=>productPortfolio.length),0);
   assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('marketingCalcProductResultV1')))).productPortfolio.length,2);
   assert.deepEqual(errors,[]);
   console.log('CLEAN_USER_JOURNEY_GREEN',JSON.stringify({firstVisit:'blank',ownName:'Моя первая футболка',resume:'PASS',draftSaved:true,twoSkuSaved:true,originalRestored:true,disabledModes:'explained'}));
 }finally{await browser.close();}
})().catch(e=>{console.error('CLEAN_USER_JOURNEY_RED',e.stack||e);process.exitCode=1});
