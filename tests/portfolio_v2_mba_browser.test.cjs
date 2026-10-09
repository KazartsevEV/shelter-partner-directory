const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
 const payload={tax:{type:'turnover',pct:3},skus:[
  {id:'a',name:'Bag',source:'own',unitCost:30,forecastUnitsPerMonth:10,
   adBudget:100,baseCac:10,priceMin:90,priceMax:250,maxDiscountPct:10,
   minimumMarginPct:10,targetMarginPct:20,salesFixedMonthly:0,adManagement:0,
   variableSalesPct:5,creditServiceMonthly:0,vatPct:20,inventoryQty:20,
   materialsBatchTotal:300,productionTotal:300,reserveAmount:0},
  {id:'b',name:'Nail service',source:'offline-service',unitCost:30,
   serviceMaterialsUnit:10,serviceElectricityUnit:0,serviceFixedMonthly:100,serviceCapacity:30,
   forecastUnitsPerMonth:10,adBudget:100,baseCac:10,priceMin:90,priceMax:240,maxDiscountPct:10,
   minimumMarginPct:10,targetMarginPct:20,salesFixedMonthly:0,adManagement:0,
   variableSalesPct:5,creditServiceMonthly:0,vatPct:0,inventoryQty:0,
   materialsBatchTotal:100,productionTotal:100,reserveAmount:0}]};
 const item=(order_id,sku_id,extras={})=>({order_id,sku_id,date:'2026-09-01',
  quantity:1,unit_price:100,currency:'GEL',channel:'web',status:'completed',...extras});
 const records=[item('o1','raw-bag'),item('o1','raw-nails'),item('o2','raw-bag'),
  item('o2','raw-nails'),item('o3','raw-bag'),item('o4','raw-nails'),
  item('cancel','raw-bag',{status:'canceled'})];
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(p=>LinkedPortfolioV2UI.importFromV1(p),payload),undefined);
  assert.equal(await page.locator('#linked-mba-panel').count(),1);
  await page.locator('[data-mba-file]').setInputFiles({name:'orders.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(records))});
  await page.locator('[data-mba-map="raw-bag"]').waitFor();
  assert.equal(await page.locator('[data-mba-transfer]').count(),0,'unmapped IDs cannot create rules');
  await page.locator('[data-mba-map="raw-bag"]').selectOption('a');
  await page.locator('[data-mba-map="raw-nails"]').selectOption('b');
  assert.equal(await page.locator('[data-mba-transfer]').count(),2,'both A→B and B→A measured');
  const observed=await page.evaluate(()=>LinkedPortfolioMBAObserved.analyze(
    LinkedPortfolioV2UI.getState().mbaHistory.source,new Set(['a','b']),
    LinkedPortfolioV2UI.getState().mbaHistory.mapping));
  assert.equal(observed.N,4);
  const one=observed.rules.find(r=>r.antecedent[0]==='a'&&r.consequent==='b');
  assert.equal(one.count,2);
  assert.ok(Math.abs(one.confidence-2/3)<1e-12);
  await page.locator('[data-mba-transfer]').first().click();
  assert.equal(await page.locator('[data-basket-offer]').count(),0,
    'no observation applied before user chooses overlap');
  await page.locator('[data-mba-overlap="0"]').fill('20');
  await page.locator('[data-mba-transfer]').first().click();
  assert.equal(await page.locator('[data-basket-offer]').count(),1);
  let state=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  assert.equal(state.offers[0].overlapPct,20,'user explicitly approved overlap');
  assert.ok(state.offers[0].observedSnapshot.N===4);
  let scenario=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  assert.equal(scenario.ready,true,JSON.stringify(scenario.errors));
  assert.ok(scenario.totals.revenue>0);
  assert.ok(Math.abs(scenario.cashflow.months.reduce((v,m)=>v+m.receipt,0)-scenario.totals.revenue)<.001);
  // Integrated, source-to-cash chain: observed association -> one discounted kit
  // -> shared worker load and a hard capacity error -> accurate tax/cash recovery.
  await page.locator('[data-basket-field="mode"]').selectOption('bundle');
  await page.locator('[data-basket-field="bundleDiscountPct"]').fill('10');
  await page.locator('[data-linked-add]').click();
  await page.locator('[data-linked-path="resources.0.kind"]').selectOption('workers');
  await page.locator('[data-linked-path="resources.0.allocation"]').selectOption('usage');
  await page.locator('[data-linked-path="resources.0.usageMode"]').selectOption('per-unit');
  await page.locator('[data-linked-path="resources.0.amount"]').fill('100');
  await page.locator('[data-linked-path="resources.0.capacity"]').fill('30');
  await page.locator('[data-linked-path="resources.0.loadPerUnit.a"]').fill('1');
  await page.locator('[data-linked-path="resources.0.loadPerUnit.b"]').fill('2');
  let overflow=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  assert.equal(overflow.ready,false);
  assert.match(overflow.errors.join(' '),/Связанные покупки требуют/);
  await page.locator('[data-linked-path="resources.0.capacity"]').fill('50');
  scenario=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  assert.equal(scenario.ready,true,JSON.stringify(scenario.errors));
  assert.ok(scenario.basket.bundleSavingsGross>0,'bundle discount recognized in gross checks');
  assert.ok(scenario.basket.bundleSavingsNet>0,'discount allocated to VAT-exclusive receipts');
  assert.ok(scenario.resources[0].projectedLoad>30&&scenario.resources[0].projectedLoad<=50);
  assert.ok(Math.abs(scenario.totals.monthlyResources-100)<.001,'one shared worker payment');
  assert.ok(Math.abs(scenario.cashflow.months.reduce((v,m)=>v+m.receipt,0)-scenario.totals.revenue)<.001,
    'discounted receipts match cashflow');
  assert.ok(Math.abs(scenario.totals.tax-scenario.totals.revenue*.03)<.001,
    'turnover tax recognized on discounted VAT-exclusive revenue');
  await page.locator('[data-linked-save]').click();
  await page.locator('[data-linked-back]').click();
  await page.evaluate(()=>window.showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  state=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  assert.equal(state.mbaHistory.source.rawLines,7,'historical rows persisted without loss');
  assert.equal(state.offers[0].overlapPct,20,'observed rule inputs persisted after resume');
  assert.equal(Number(state.offers[0].bundleDiscountPct),10,'kit discount survived navigation');
  assert.equal(state.resources[0].usageMode,'per-unit','worker workload survived navigation');
  assert.equal(await page.locator('[data-mba-transfer]').count(),2);
  await page.locator('[data-mba-clear]').click();
  assert.equal((await page.evaluate(()=>LinkedPortfolioV2UI.getState())).mbaHistory,null);
  assert.deepEqual(errors,[]);
  console.log('EMPIRICAL_MBA_BROWSER_GREEN',JSON.stringify({N:4,observedRules:2,
   confidence:one.confidence,profit:scenario.totals.netProfit}));
 }finally{await browser.close();}
})().catch(e=>{console.error('EMPIRICAL_MBA_BROWSER_RED',e.stack||e);process.exitCode=1});
