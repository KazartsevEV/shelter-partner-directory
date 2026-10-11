/* Global decision-tree navigation E2E (all top-level branches + product steps).
 * Return clicks never call V1/V2 reset or alter financial inputs.
 */
'use strict';
const A=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
(async()=>{
 let phase='chromium.launch';
 const mark=next=>{phase=next;console.log('NAV_PHASE',next)};
 const watchdog=setTimeout(()=>{console.error('NAVIGATION_WATCHDOG_PHASE',phase);process.exit(125)},90000);
 watchdog.unref();
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
 const errs=[];page.on('pageerror',err=>errs.push(err.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 const nav=page.locator('#nomad360-tree-nav');
 const back=page.locator('.nd-tree-active-back:visible, #nomad360-tree-back:visible').first();
 const arrows=page.locator('.nd-tree-active-back:visible, #nomad360-tree-back:visible');
 const keys=()=>page.evaluate(()=>Nomad360TreeNav.getTrail().map(x=>x.key));
 const within=()=>page.evaluate(()=>{
  const el=document.querySelector('.nd-tree-active-back:not([hidden])')||
    document.querySelector('#nomad360-tree-back');
  if(!el)return false;
  const r=el.getBoundingClientRect();
  return r.left>=-1&&r.right<=innerWidth+1&&r.width<=innerWidth+1;
 });
 const returnTo=async(key)=>{
  for(let i=0;i<12;i++){
   if((await keys()).at(-1)===key)return;
   A.equal(await arrows.count(),1,'only one arrow while returning to '+key);
   await back.click();
  }
  A.fail('Could not return to '+key+'; trail='+JSON.stringify(await keys()));
 };
 const oneArrow=async()=>{
  A.equal(await arrows.count(),1,'exactly one visible back arrow');
  A.equal(await nav.isVisible(),false,'no duplicate white navigation card');
  A.equal(await page.locator('#nomad360-tree-crumbs').count(),0,'breadcrumb chain removed');
  A.equal(await back.evaluate(el=>getComputedStyle(el).textDecorationLine.includes('underline')),
   true,'native arrow follows compact underlined design');
 };
 try{
  mark('page.goto');
  await page.goto(url,{waitUntil:'domcontentloaded'});
  mark('domcontentloaded');
  A.equal(await arrows.count(),0,'no back arrow on the tree root');
  mark('start-own-product');
  await page.locator('#start-own-product').click();
  await oneArrow();
  A.match(await back.innerText(),/Главная/);
  A.deepEqual(await keys(),['home-screen','product-screen:name']);
  await page.locator('#product-name-input').fill('Тест навигации');
  mark('submit-product-name');
  await page.locator('#product-intro-submit-label').click();
  A.deepEqual(await keys(),['home-screen','product-screen:name','product-screen:source']);
  mark('product-source-own');
  await page.locator('[data-product-source="own"]').click();
  A.deepEqual(await keys(),['home-screen','product-screen:name','product-screen:source','product-screen:expenses']);
  A.match(await back.innerText(),/Источник товара/);
  // Product business edit uses its own existing 'back to results' control;
  // it must replace, not duplicate, the ordinary product arrow.
  mark('product-business-return-show');
  await page.evaluate(()=>document.getElementById('product-business-back-button').classList.remove('hidden'));
  mark('business-return-now-visible');
  await oneArrow();
  mark('business-return-one-arrow-asserted');
  A.equal(await page.locator('#product-main-back').isVisible(),false,
   'product edit return suppresses ordinary back arrow');
  A.match(await back.innerText(),/Итоги бизнеса/);
  // Regression: saved offline-service editor leaves the business button
  // enabled inside a hidden source panel. It must not shadow the main arrow.
  mark('hide-source-parent');
  await page.evaluate(()=>{
   const src=document.getElementById('product-source-block');
   src.hidden=true;src.classList.add('hidden');
  });
  mark('await-native-main-back');
  await page.waitForFunction(()=>document.getElementById('product-main-back').classList.contains('nd-tree-active-back'),null,{timeout:5000});
  mark('native-main-back-restored');
  await oneArrow();
  A.equal(await back.getAttribute('id'),'product-main-back',
   'ignore business return nested inside a hidden parent');
  await page.evaluate(()=>{
   const src=document.getElementById('product-source-block');
   src.hidden=false;src.classList.remove('hidden');
   document.getElementById('product-business-back-button').classList.add('hidden');
  });
  mark('await-business-return-clear');
  await page.waitForFunction(()=>!document.body.classList.contains('nd-tree-business-return'),null,{timeout:5000});
  mark('business-return-cleared');
  A.match(await back.innerText(),/Источник товара/);
  mark('back-to-product-source');
  await back.click();
  A.equal(await page.locator('#product-source-block').isVisible(),true);
  A.equal(await page.locator('#product-own-form').isVisible(),false);
  A.equal(await page.locator('#product-name-input').inputValue(),'Тест навигации');
  await returnTo('home-screen');
  A.equal(await page.locator('#home-screen').isVisible(),true);
  A.equal(await arrows.count(),0);
  // Simplified services: mode -> channel -> provider -> agent -> editable V1.
  mark('service-start');
  await page.locator('#start-service').click();
  A.match(await back.innerText(),/Главная/);
  mark('service-online');
  await page.locator('#service-work-online').click();
  A.match(await back.innerText(),/Услуга/);
  mark('service-agent-chooser');
  await page.locator('#service-screen button[onclick="showAgentChooser()"]').click();
  A.match(await back.innerText(),/Кто исполнитель/);
  mark('agent-percent');
  await page.locator('#agent-screen button.nd-agent-percentage-cta').click();
  A.equal(await page.locator('#calculator-screen').isVisible(),true);
  A.match(await back.innerText(),/агент/i);
  await page.locator('#in-agentTaxTurnover').fill('7');
  await back.click();
  A.equal(await page.locator('#agent-screen').isVisible(),true);
  A.deepEqual((await keys()).slice(-2),['service-screen','agent-screen']);
  await oneArrow();
  A.equal(await back.evaluate(el=>getComputedStyle(el).color),'rgb(22, 55, 90)',
    'agent native arrow is readable navy on the actual light page canvas');
  // Return to previous form without reconstructing inputs or recalculating.
  await page.evaluate(()=>showOnly('calculator-screen'));
  A.equal(await page.locator('#in-agentTaxTurnover').inputValue(),'7');
  await returnTo('service-work-screen');
  A.equal(await page.locator('#service-work-screen').isVisible(),true);
  // Three separate execution roles; each has an accurately labelled parent.
  await page.locator('#service-work-online').click();
  for(const role of ['self','hired']){
   await page.locator('#service-screen button[onclick="selectServiceMode(\''+role+'\')"]').click();
   A.equal(await page.locator('#calculator-screen').isVisible(),true);
   A.match(await back.innerText(),/Кто исполнитель/);
   await back.click();
   A.equal(await page.locator('#service-screen').isVisible(),true);
  }
  await returnTo('service-work-screen');
  // Full offline agent: path must include service channel, executor and agent.
  await page.locator('#service-mode-full').click();
  await page.locator('#service-work-offline').click();
  await page.locator('#service-screen button[onclick="showAgentChooser()"]').click();
  await page.locator('#agent-screen button.nd-agent-percentage-cta').click();
  A.equal(await page.locator('#product-screen').isVisible(),true);
  A.match(await back.innerText(),/агент/i);
  A.match((await page.evaluate(()=>Nomad360TreeNav.getTrail().map(x=>x.label).join(' › '))),/Название услуги/);
  await back.click();
  A.equal(await page.locator('#agent-screen').isVisible(),true);
  await returnTo('home-screen');
  // Direct standalone V2 opens from home and must return without clearing draft.
  mark('standalone-v2');
  await page.locator('#start-multi-portfolio').click();
  A.equal(await page.locator('#portfolio-v2-screen').isVisible(),true);
  A.match(await back.innerText(),/Главная/);
  console.log('V2_NAV_DIAG',JSON.stringify(await back.evaluate(el=>({
    outerHTML:el.outerHTML.slice(0,500),
    color:getComputedStyle(el).color,
    background:getComputedStyle(el).backgroundColor,
    parent:el.parentElement?.outerHTML.slice(0,250),
    withinV2:!!el.closest('#portfolio-v2-screen'),
    insideBody:document.body.contains(el),
    styleSheets:[...document.styleSheets].map(x=>({href:x.href,rules:(()=>{try{return x.cssRules?.length}catch(e){return String(e)}})()})),
    matchedTreeRules:[...document.styleSheets].flatMap(x=>{try{
      return [...x.cssRules].filter(r=>r.selectorText?.includes('nd-tree-active-back'))
       .map(r=>({selector:r.selectorText,matches:el.matches(r.selectorText)}))
    }catch(e){return []}})
  }))));
  A.equal(await back.evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)',
   'standalone V2 return has white text over the dark header');
  await back.click();
  A.equal(await page.locator('#home-screen').isVisible(),true);
  // V2 entered from V1 has an actual V1 parent, not an invented home destination.
  await page.evaluate(()=>showOnly('calculator-screen'));
  await page.evaluate(()=>showOnly('portfolio-v2-screen'));
  A.match(await back.innerText(),/Упрощённый расчёт/);
  await back.click();
  A.equal(await page.locator('#calculator-screen').isVisible(),true);
  // Full-calculation subview also resolves to its own originating V1 screen.
  mark('full-service-open');
  await page.evaluate(()=>{
   window.Nomad360FullServiceUI.open({
    priceGross:150,monthlyForecast:10,vatPct:0,taxType:'turnover',taxPct:6,
    months:3,funding:'own',annualRatePct:0,creditMonths:1,unitCashCost:20,
    fixedCashMonthly:10,adBudget:0,adManagement:0,
    salesFixedMonthly:10,equipmentPurchase:0,equipmentAmortMonthly:0,
    commissionPct:0,reservePct:0
   },{kind:'online',name:'Проверка маршрута',role:'self'});
  });
  A.equal(await page.locator('#full-service-screen').isVisible(),true);
  A.match(await back.innerText(),/Упрощённый расчёт/);
  A.equal(await back.evaluate(el=>getComputedStyle(el).color),'rgb(22, 55, 90)',
   'full service return has navy text over the light shell');
  await back.click();
  A.equal(await page.locator('#calculator-screen').isVisible(),true);
  // Mobile sizes and dynamic (non-duplicated) ancestry.
  for(const width of [320,390,768]){
   await page.setViewportSize({width,height:844});
   A.ok(await within(),'navigation must remain inside viewport at '+width);
   await oneArrow();
  }
  mark('final-assertions');
  A.deepEqual(errs,[],'no browser runtime errors');
  clearTimeout(watchdog);
  console.log('NOMAD360_GLOBAL_TREE_NAV_GREEN');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
