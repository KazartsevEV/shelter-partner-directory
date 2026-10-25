// Mobile browser: opt-in repeated demand, physical availability and offer stock block.
const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const sku=(id,stock,source='resale')=>({
 id,name:id,source,unitCost:20,forecastUnitsPerMonth:20,adBudget:100,
 baseCac:5,priceMin:20,priceMax:150,maxDiscountPct:0,minimumMarginPct:10,
 targetMarginPct:25,salesFixedMonthly:0,adManagement:0,variableSalesPct:0,
 creditServiceMonthly:0,vatPct:0,inventoryQty:stock,materialsBatchTotal:stock*20,
 productionTotal:0,reserveAmount:0
});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
 // Preserve explicit RU-copy test intent under first-visit English default.
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,route=>route.abort());
 try{
  await page.goto(pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href,{waitUntil:'domcontentloaded'});
  const payload={tax:{type:'turnover',pct:5},skus:[sku('a',60),sku('b',100)]};
  await page.evaluate(p=>LinkedPortfolioV2UI.importFromV1(p),payload);
  A.equal(await page.locator('[data-temporal-controls]').isVisible(),true);
  const inherited=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  A.equal(inherited.forecastMonths,5,'V1 goods stock and forecast auto-derive five months');
  A.equal(inherited.v1HorizonInherited,true);
  A.equal(inherited.recurringDemandApproved,true);
  A.equal(await page.locator('[data-linked-path="forecastMonths"]').count(),0);
  A.equal(await page.locator('[data-linked-path="recurringDemandApproved"]').count(),0);
  let result=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(result.ready,true,JSON.stringify(result.errors));
  A.equal(result.temporal.months.length,5);
  A.deepEqual(result.temporal.months.map(m=>m.orders.a),[20,20,20,0,0]);
  A.equal(result.cashflow.temporal,true);
  const cashNote=await page.locator('[data-linked-cashflow-note]').innerText();
  A.match(cashNote,/План продаж из V1:\s*5\s*мес/);
  A.match(cashNote,/новых заказов он не создаёт/);
  A.match(cashNote,/Месяцев в денежном календаре:\s*5/);
  A.doesNotMatch(cashNote,/первые 30 дней|первых 30 дней/);
  // V2 cards show one-month scenario rates, never 30-day or whole-horizon totals.
  const resultPanel=page.locator('#linked-results');
  A.match(await resultPanel.textContent(),/Карточки: месячные показатели модели V2/);
  A.equal(await resultPanel.getByText('План продаж / месяц',{exact:true}).count(),1);
  A.equal(await resultPanel.getByText('Выручка без НДС / месяц',{exact:true}).count(),1);
  A.ok((await resultPanel.getByText('Маржа за период',{exact:true}).count())>=1,'period margin column exists');
  A.doesNotMatch(await resultPanel.textContent(),/первые 30 дней|Продано позиций за 30 дней|Выручка без НДС \/ 30 дней/);
  const baselineNumbers=JSON.stringify(result.cashflow);
  for(const [locale,expectedLabel] of [['en','Sales plan / month'],['kk','Сату жоспары / ай'],['ru','План продаж / месяц']]){
    await page.locator('#nomad360-lang-select').selectOption(locale);
    await resultPanel.getByText(expectedLabel,{exact:true}).waitFor({state:'visible'});
    A.equal(JSON.stringify((await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()))).cashflow),
      baselineNumbers,'locale '+locale+' must preserve financial math');
  }
  const v1HorizonPayload=stock=>({tax:{type:'turnover',pct:5},skus:[sku('a',stock),sku('b',stock)]});
  for(const [stock,months] of [[20,1],[60,3],[240,12],[100,5]]){
    await page.evaluate(p=>LinkedPortfolioV2UI.importFromV1(p),v1HorizonPayload(stock));
    const scenario=await page.evaluate(()=>({state:LinkedPortfolioV2UI.getState(),
      result:LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState())}));
    A.equal(scenario.result.ready,true,'V1 '+months+' months: '+JSON.stringify(scenario.result.errors));
    A.equal(scenario.state.forecastMonths,months,'V1 horizon '+months);
    if(scenario.result.temporal){
      A.equal(scenario.result.temporal.months.length,months,'temporal monthly demand '+months);
    }else{
      A.equal(months,1,'single-month V1 uses the legacy one-month finance path');
    }
    A.equal(scenario.result.cashflow.months.length,months,'cash calendar '+months);
    const note=await page.locator('[data-linked-cashflow-note]').innerText();
    if(scenario.result.temporal)
      A.match(note,new RegExp('План продаж из V1:\\s*'+months+'\\s*мес'));
    else
      A.match(note,/Cash Flow показывает продажи закупленных партий|Расчёт основан на месячном прогнозе продаж V1/);
    A.match(note,new RegExp('Месяцев в денежном календаре:\\s*'+months));
    A.doesNotMatch(note,/первые 30 дней|первых 30 дней/);
  }

  A.equal(result.cashflow.months.length,5);
  const expectedPrice=result.items[0].standaloneNet;
  result.cashflow.months.forEach((m,i)=>{
    const expectedSales=i<3?40:20;
    A.ok(Math.abs(m.receipt-expectedPrice*expectedSales)<.012,
      'Month '+(i+1)+' receipts must use only available goods');
    A.ok(Math.abs(m.ad-(i<3?200:100))<.012);
  });
  A.match(await page.locator('#linked-results').textContent(),/План продаж из V1:\s*5\s*мес/);
  A.match(await page.locator('#linked-temporal-result').textContent(),/Остатки и мощности проверены/);
  await page.locator('[data-linked-save]').click();
  await page.locator('[data-linked-back]').click();await page.evaluate(()=>showHome());
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  const restored=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  A.equal(restored.forecastMonths,5,'Resume preserves V1-derived period');
  A.equal(restored.v1HorizonInherited,true);
  A.equal(await page.locator('[data-linked-path="forecastMonths"]').count(),0);
  // Child stock 45 funds month one (30), but not month two (another 30).
  await page.evaluate(p=>LinkedPortfolioV2UI.importFromV1(p),
    {tax:{type:'turnover',pct:5},skus:[sku('a',60),sku('b',45)]});
  const reduced=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  A.equal(reduced.forecastMonths,3,'New V1 goods quantities recalculate the sell-out period');
  A.equal(await page.locator('[data-linked-path="forecastMonths"]').count(),0);
  await page.locator('[data-basket-action="add"]').click();
  await page.locator('[data-basket-field="mode"]').selectOption('bundle');
  await page.locator('[data-basket-field="attachPct"]').fill('50');
  const blocked=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(blocked.ready,false);
  A.match(blocked.errors.join(' '),/Месяц 2.*превышает оставшийся запас/);
  A.equal(blocked.cashflow,undefined,'no misleading cashflow for impossible bundle');
  A.deepEqual(errors,[]);
  console.log('TEMPORAL_31E_BROWSER_GREEN',JSON.stringify({checked:5,blocked:true}));
 }finally{await browser.close()}
})().catch(e=>{console.error('TEMPORAL_31E_BROWSER_RED',e.stack||e);process.exitCode=1});
