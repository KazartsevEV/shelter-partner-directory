/* Real Chromium online V1 -> V2 E2E: no testing the adapter in isolation. */
const A=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,r=>r.abort());
 const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
 const near=(actual,expected,name)=>A.ok(Math.abs(actual-expected)<.001,
   name+': got '+actual+' expected '+expected);
 async function open(mode,name,payer='me'){
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#start-service').click();
  await page.locator('#service-work-online').click();
  if(mode==='agent'){
   await page.getByRole('button',{name:'Я агент'}).click();
   await page.getByRole('button',{name:'Мне платят % с объёма продаж'}).click();
  }else await page.getByRole('button',{name:mode==='hired'?'Нанимаю другого':'Я сам'}).click();
  const inputs={months:3,monthlyBudget:400,cpc:4,ctr:2,cvrLead:20,cvrDeal:50,
    costConsult:100,costPack:200,ltv:30,mgmt:0,site:0,hosting:0,
    dom:0,magnet:0,acq:10,taxTurnover:5};
  if(mode==='hired')inputs.markup=25;
  if(mode==='agent'){inputs.agentPct=20;inputs.agentTaxTurnover=10;}
  for(const [id,v] of Object.entries(inputs))await page.locator('#in-'+id).fill(String(v));
  if(mode==='agent')
   await page.locator('input[name="payer-monthlyBudget"][value="'+payer+'"]').check();
  await page.locator('#online-service-portfolio-name').fill(name);
  A.equal(await page.evaluate(()=>openOnlineServicePortfolio()),true,
    await page.locator('#online-service-v2-error').textContent());
  A.equal(await page.locator('#portfolio-v2-screen').isVisible(),true);
  const state=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  const result=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(result.ready,true,JSON.stringify(result.errors));
  return {state,result};
 }
 try{
  let x=await open('self','Мой онлайн-консалтинг');
  near(x.result.totals.revenue,325,'self monthly revenue');
  near(x.result.totals.netProfit,-123.75,'self net');
  await page.locator('[data-linked-path="skus.0.onlineCapacity"]').fill('4');
  const full=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(full.ready,false);
  A.ok(full.errors.some(m=>m.includes('Прогноз сделок')));
  await page.locator('[data-linked-path="skus.0.onlineCapacity"]').fill('5');
  const corrected=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(corrected.ready,true,JSON.stringify(corrected.errors));
  await page.locator('[data-linked-back]').click();
  A.equal(await page.locator('#calculator-screen').isVisible(),true);
  A.equal(await page.locator('#in-monthlyBudget').inputValue(),'400');
  A.equal(await page.locator('#online-service-portfolio-name').inputValue(),'Мой онлайн-консалтинг');
  x=await open('hired','Онлайн с исполнителем');
  A.equal(x.state.skus.length,2,'first online SKU not lost');
  near(x.result.items.find(s=>s.source==='online-hired').cogs,260,'contractor compensation');
  x=await open('agent','Агентская онлайн-услуга','partner');
  A.equal(x.state.skus.length,3);
  near(x.result.items.find(s=>s.source==='online-agent').revenue,65,'agent own commission');
  near(x.result.counterpart[0].gross,325,'partner GMV not my revenue');
  A.match(await page.locator('#linked-results').textContent(),/Оборот партнёра/);
  A.match(await page.locator('#linked-results').textContent(),/Моя реклама/);
  await page.locator('[data-basket-action="add"]').click();
  A.equal(await page.locator('[data-basket-offer]').count(),1);
  await page.locator('[data-linked-save]').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  A.equal(await page.locator('[data-linked-sku]').count(),3);
  A.equal(await page.locator('[data-basket-offer]').count(),1);
  await page.locator('[data-linked-back]').click();
  A.equal(await page.locator('#calculator-screen').isVisible(),true);
  A.equal(await page.locator('#in-agentPct').inputValue(),'20');
  A.equal(await page.locator('input[name="payer-monthlyBudget"][value="partner"]').isChecked(),true);
  // A goods V1 import must retain all existing online service drafts/relationships.
  await page.goto(url+'?demo=shopper&finance=cash',{waitUntil:'domcontentloaded'});
  await page.locator('#product-demo-banner').waitFor({state:'visible'});
  A.equal(await page.evaluate(()=>openLinkedPortfolioFromProducts()),true);
  const mixed=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  A.equal(mixed.skus.filter(s=>s.onlineContract).length,3);
  A.equal(mixed.skus.filter(s=>s.source==='own').length,1);
  A.equal(mixed.offers.length,1);
  const calc=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(calc.ready,true,JSON.stringify(calc.errors));
  A.deepEqual(errors,[]);
  console.log('ONLINE_IMPORT_BROWSER_GREEN',JSON.stringify({modes:3,skus:mixed.skus.length,
    offers:mixed.offers.length,agentRevenue:65,partnerGross:325}));
 }finally{await browser.close();}
})().catch(e=>{console.error('ONLINE_IMPORT_BROWSER_RED',e.stack||e);process.exitCode=1});
