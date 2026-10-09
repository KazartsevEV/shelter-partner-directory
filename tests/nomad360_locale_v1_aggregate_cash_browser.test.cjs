/* #47AT: V1 product secondary aggregate money table and margin must refresh
 * from canonical source numbers, without recalculation or changing the SKU.
 */
'use strict';
const A=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
const cashFields=['inflow','outflow','taxPaid','interestPaid','principalRepaid',
 'cashFlow','cumulative','freeCumulative'];

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
    await page.waitForFunction(()=>!!window.Nomad360LocaleCore?.displayLocale);
    const baseline=await page.evaluate(fields=>{
     const model=calculateProductPortfolio(),cash=calculateProductCashFlow(model);
     if(!model.pricingReady||!cash.ready)throw Error('Demo is not financially complete');
     const box=document.querySelector('#product-portfolio-business-summary');
     if(!box)throw Error('V1 summary absent');
     window.__l47AggregateRef=box;
     const rows=[...box.querySelectorAll('table tbody tr')];
     if(rows.length!==fields.length)throw Error('Unexpected row count '+rows.length);
     const report=rows.map((row,i)=>({
      key:fields[i],actual:[...row.querySelectorAll('[data-nomad-display-money]')]
       .map(node=>Number(node.getAttribute('data-nomad-display-number'))),
      expected:cash.months.map(m=>Number(m[fields[i]]))
     }));
     const inputs=[...document.querySelectorAll('#product-screen input')]
      .filter(el=>el.id).map(el=>[el.id,el.value]);
     return {product:JSON.stringify(productPortfolio),inputs,
      model:JSON.stringify(model),cash:JSON.stringify(cash),
      prices:model.items.map(i=>i.price),moneyCells:box.querySelectorAll('[data-nomad-display-money]').length,
      monthCount:cash.months.length,report,
      margin:Number(box.querySelector('[data-nomad-display-suffix="%"]')?.dataset.nomadDisplayNumber),
      revenue:Number(model.adjustedRevenue??model.totalRevenue),
      profit:Number(model.adjustedNetProfit??model.netProfit)};
    },cashFields);
    A.ok(baseline.moneyCells>=baseline.monthCount*8+8,'V1 table plus summary money markers');
    A.equal(baseline.report.length,8);
    for(const row of baseline.report)
     A.deepEqual(row.actual,row.expected,'canonical per-month amounts '+row.key);
    if(baseline.revenue>0&&Number.isFinite(baseline.profit))
     A.ok(Math.abs(baseline.margin-baseline.profit/baseline.revenue*100)<1e-9);
    for(const language of ['en','kk','ru','en','kk']){
     await page.locator('#nomad360-lang-select').selectOption(language);
     await page.waitForFunction(code=>document.documentElement.lang===code,language);
     await page.waitForFunction(()=>{
      const el=document.querySelector('#product-portfolio-business-summary [data-nomad-display-money]');
      if(!el)return false;
      const locale=Nomad360LocaleCore.displayLocale();
      const raw=Number(el.dataset.nomadDisplayNumber);
      const unit=locale==='en-US'?'currency units*':locale==='kk-KZ'?'ш.б.*':'у.е.*';
      return el.textContent===raw.toLocaleString(locale,
        {minimumFractionDigits:2,maximumFractionDigits:2})+' '+unit;
     });
     const current=await page.evaluate(fields=>{
      const box=document.querySelector('#product-portfolio-business-summary');
      const locale=Nomad360LocaleCore.displayLocale();
      const suffix=locale==='en-US'?'currency units*':locale==='kk-KZ'?'ш.б.*':'у.е.*';
      const issues=[];
      const money=[...box.querySelectorAll('[data-nomad-display-money]')];
      for(const node of money){
       const raw=Number(node.getAttribute('data-nomad-display-number'));
       const text=raw.toLocaleString(locale,{minimumFractionDigits:2,maximumFractionDigits:2})+' '+suffix;
       if(node.textContent!==text)issues.push({raw,actual:node.textContent,expected:text});
      }
      const percent=box.querySelector('[data-nomad-display-suffix="%"]');
      if(!percent)issues.push('missing margin percentage');
      else {
       const raw=Number(percent.getAttribute('data-nomad-display-number'));
       const expected=raw.toLocaleString(locale,{maximumFractionDigits:2})+'%';
       if(percent.textContent!==expected)issues.push({percent:percent.textContent,expected});
      }
      const rows=[...box.querySelectorAll('table tbody tr')];
      const report=rows.map((row,i)=>({
       key:fields[i],
       actual:[...row.querySelectorAll('[data-nomad-display-money]')]
        .map(n=>Number(n.dataset.nomadDisplayNumber))
      }));
      return {issues,report,source:JSON.stringify(productPortfolio),
       model:JSON.stringify(calculateProductPortfolio()),
       cash:JSON.stringify(calculateProductCashFlow(calculateProductPortfolio())),
       inputs:[...document.querySelectorAll('#product-screen input')]
        .filter(el=>el.id).map(el=>[el.id,el.value]),
       preservedDOM:box===window.__l47AggregateRef,visibleMoney:money.length};
     },cashFields);
     A.deepEqual(current.issues,[],'secondary V1 formatting '+language);
     A.equal(current.visibleMoney,baseline.moneyCells);
     A.ok(current.preservedDOM,'language change must not rebuild the aggregate summary');
     A.equal(current.source,baseline.product,'SKU financial source mutated for '+language);
     A.equal(current.model,baseline.model,'model changed for '+language);
     A.equal(current.cash,baseline.cash,'monthly Cash Flow changed for '+language);
     A.deepEqual(current.inputs,baseline.inputs,'editable values changed for '+language);
     for(let i=0;i<8;i++)
      A.deepEqual(current.report[i].actual,baseline.report[i].actual,
       'cash row '+cashFields[i]+' source changed');
     console.log('NOMAD360_L47_AT',JSON.stringify({financing,language,
      months:baseline.monthCount,moneyCells:current.visibleMoney,margin:baseline.margin}));
    }
    A.deepEqual(errors,[],'page errors');
   }finally{await ctx.close()}
  }
 }finally{await browser.close()}
})().catch(err=>{console.error('NOMAD360_L47_AT_RED',err.stack||err);process.exitCode=1});
