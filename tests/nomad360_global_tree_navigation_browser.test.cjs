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
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
 const errs=[];page.on('pageerror',err=>errs.push(err.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 const nav=page.locator('#nomad360-tree-nav');
 const back=page.locator('#nomad360-tree-back');
 const keys=()=>page.evaluate(()=>Nomad360TreeNav.getTrail().map(x=>x.key));
 const within=()=>page.evaluate(()=>{
  const n=document.getElementById('nomad360-tree-nav');
  return n.getBoundingClientRect().right<=innerWidth+1&&
    n.getBoundingClientRect().left>=-1&&n.scrollWidth<=n.clientWidth+1;
 });
 const clickCrumb=async(label)=>{
  const item=nav.locator('button.nd-tree-link',{hasText:label}).last();
  A.equal(await item.count(),1,'clickable ancestor '+label);
  await item.click();
 };
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  A.equal(await nav.isVisible(),false,'no back arrow on the tree root');
  await page.locator('#start-own-product').click();
  A.equal(await nav.isVisible(),true,'goods V1 has global navigation');
  A.match(await back.innerText(),/Главная/);
  A.deepEqual(await keys(),['home-screen','product-screen:name']);
  await page.locator('#product-name-input').fill('Тест навигации');
  await page.locator('#product-intro-submit-label').click();
  A.deepEqual(await keys(),['home-screen','product-screen:name','product-screen:source']);
  await page.locator('[data-product-source="own"]').click();
  A.deepEqual(await keys(),['home-screen','product-screen:name','product-screen:source','product-screen:expenses']);
  A.match(await back.innerText(),/Источник товара/);
  await clickCrumb('Источник товара');
  A.equal(await page.locator('#product-source-block').isVisible(),true);
  A.equal(await page.locator('#product-own-form').isVisible(),false);
  A.equal(await page.locator('#product-name-input').inputValue(),'Тест навигации');
  await clickCrumb('Главная');
  A.equal(await page.locator('#home-screen').isVisible(),true);
  A.equal(await nav.isVisible(),false);
  // Simplified services: mode -> channel -> provider -> agent -> editable V1.
  await page.locator('#start-service').click();
  A.match(await back.innerText(),/Главная/);
  await page.locator('#service-work-online').click();
  A.match(await back.innerText(),/Услуга/);
  await page.locator('#service-screen button[onclick="showAgentChooser()"]').click();
  A.match(await back.innerText(),/Кто исполнитель/);
  await page.locator('#agent-screen button.nd-agent-percentage-cta').click();
  A.equal(await page.locator('#calculator-screen').isVisible(),true);
  A.match(await back.innerText(),/агент/i);
  await page.locator('#in-agentTaxTurnover').fill('7');
  await back.click();
  A.equal(await page.locator('#agent-screen').isVisible(),true);
  A.deepEqual((await keys()).slice(-2),['service-screen','agent-screen']);
  // Return to previous form without reconstructing inputs or recalculating.
  await page.evaluate(()=>showOnly('calculator-screen'));
  A.equal(await page.locator('#in-agentTaxTurnover').inputValue(),'7');
  await clickCrumb('Услуга');
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
  await clickCrumb('Услуга');
  // Full offline agent: path must include service channel, executor and agent.
  await page.locator('#service-mode-full').click();
  await page.locator('#service-work-offline').click();
  await page.locator('#service-screen button[onclick="showAgentChooser()"]').click();
  await page.locator('#agent-screen button.nd-agent-percentage-cta').click();
  A.equal(await page.locator('#product-screen').isVisible(),true);
  A.match(await back.innerText(),/агент/i);
  A.match((await nav.innerText()),/Название услуги/);
  await back.click();
  A.equal(await page.locator('#agent-screen').isVisible(),true);
  await clickCrumb('Главная');
  // Direct standalone V2 opens from home and must return without clearing draft.
  await page.locator('#start-multi-portfolio').click();
  A.equal(await page.locator('#portfolio-v2-screen').isVisible(),true);
  A.match(await back.innerText(),/Главная/);
  await back.click();
  A.equal(await page.locator('#home-screen').isVisible(),true);
  // V2 entered from V1 has an actual V1 parent, not an invented home destination.
  await page.evaluate(()=>showOnly('calculator-screen'));
  await page.evaluate(()=>showOnly('portfolio-v2-screen'));
  A.match(await back.innerText(),/Упрощённый расчёт/);
  await back.click();
  A.equal(await page.locator('#calculator-screen').isVisible(),true);
  // Full-calculation subview also resolves to its own originating V1 screen.
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
  await back.click();
  A.equal(await page.locator('#calculator-screen').isVisible(),true);
  // Mobile sizes and dynamic (non-duplicated) ancestry.
  for(const width of [320,390,768]){
   await page.setViewportSize({width,height:844});
   A.ok(await within(),'navigation must remain inside viewport at '+width);
   A.equal(await nav.locator('[aria-current="step"]').count(),1);
  }
  A.deepEqual(errs,[],'no browser runtime errors');
  console.log('NOMAD360_GLOBAL_TREE_NAV_GREEN');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
