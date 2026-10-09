const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,r=>r.abort());
 const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
 const sku=(id,source,qty)=>({id,name:id,source,unitCost:20,forecastUnitsPerMonth:qty,
  adBudget:qty*10,baseCac:10,priceMin:80,priceMax:200,
  maxDiscountPct:20,minimumMarginPct:10,targetMarginPct:25,
  salesFixedMonthly:0,adManagement:0,variableSalesPct:0,creditServiceMonthly:0,
  vatPct:0,inventoryQty:source==='dropship'?0:100,
  materialsBatchTotal:source==='dropship'?0:1000,productionTotal:0,reserveAmount:0});
 const csv=['order_id,sku_id,quantity,date,status,channel',
  '1,a,1,2026-10-01,paid,web','1,b,1,2026-10-01,paid,web',
  '2,a,1,2026-10-01,paid,web','2,b,1,2026-10-01,paid,web',
  '3,a,1,2026-10-01,paid,web','3,b,1,2026-10-01,paid,web',
  '4,a,1,2026-10-01,paid,web','4,b,1,2026-10-01,paid,web',
  '5,a,1,2026-10-01,paid,web','6,a,1,2026-10-01,paid,web',
  '7,b,1,2026-10-01,paid,web','8,b,1,2026-10-01,paid,web',
  '9,a,1,2026-10-01,refunded,web','10,b,1,2026-10-01,paid,web'
 ].join('\n');
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.evaluate(payload=>LinkedPortfolioV2UI.importFromV1(payload),
   {tax:{type:'turnover',pct:3},skus:[sku('a','own',25),sku('b','dropship',20)]});
  A.equal(await page.locator('#linked-mba-history').count(),1);
  await page.locator('[data-mba-csv]').fill(csv);
  await page.locator('[data-mba-run]').click();
  A.match(await page.locator('#linked-mba-history').textContent(),/Оплаченных заказов: 9/);
  A.match(await page.locator('#linked-mba-history').textContent(),/Support/);
  const first=page.locator('[data-mba-apply]').first();
  await first.click();
  A.equal((await page.evaluate(()=>LinkedPortfolioV2UI.getState())).offers.length,0,
   'Do not silently assume overlap 0%');
  const firstKey=await first.getAttribute('data-mba-apply');
  await page.locator('[data-mba-overlap="'+firstKey+'"]').fill('40');
  await first.click();
  let state=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  A.equal(state.offers.length,1);
  A.equal(state.offers[0].overlapPct,40);
  A.equal(state.offers[0].evidence.source,'observed-orders');
  A.equal(state.offers[0].evidence.transactions,9);
  const storage=await page.evaluate(()=>localStorage.getItem('marketingCalcLinkedPortfolioV2'));
  A.equal(storage.includes('order_id'),false,'Raw customer transactions must never persist');
  A.equal(storage.includes('2026-10-01,paid'),false);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  state=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  A.equal(state.offers.length,1,'Confirmed scenario survives reload');
  A.deepEqual(errors,[]);
  console.log('EMPIRICAL_MBA_BROWSER_GREEN',{transactions:9,offers:state.offers.length});
 }finally{await browser.close()}
})().catch(e=>{console.error('EMPIRICAL_MBA_BROWSER_RED',e.stack||e);process.exitCode=1});
