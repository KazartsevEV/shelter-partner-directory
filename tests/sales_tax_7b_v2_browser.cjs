'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const F=require('./portfolio_v2_f3_fixture.cjs').fixture;
const root=path.resolve(__dirname,'..'),near=(a,b)=>Math.abs(a-b)<.011;
function server(){
 return http.createServer((req,res)=>{
  const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.HTML':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(p)]||'application/octet-stream');
  fs.createReadStream(p).pipe(res);
 });
}
async function pageFor(browser,base,width=390){
 const ctx=await browser.newContext({viewport:{width,height:900}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',err=>errors.push(err.message));
 await p.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
 await p.goto(base+'Marketing_calc.HTML?sales_tax_preview=1',{waitUntil:'domcontentloaded'});
 A.equal(typeof await p.evaluate(()=>window.Nomad360SalesTaxV2?.project),'function');
 return {p,ctx,errors};
}
(async()=>{
 const serverInstance=server();await new Promise(ok=>serverInstance.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+serverInstance.address().port+'/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const proofs=[];
 try{
  // Standalone V2: actual saved UI controls and complete financing schedule.
  {
   const {p,ctx,errors}=await pageFor(browser,base,390);
   const report=await p.evaluate(()=>{
    PortfolioV2UI.open();
    const s=PortfolioV2UI.getState();
    s.marketing={budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,
      periodMonths:2,cacReservePct:100};
    s.skus=[
      {id:'sku-1',name:'Case A',source:'own',unitCost:20,marginPct:25,mixPct:50,
       acquiringPct:0,initialCashOut:0,batchUnits:0,storagePerUnitDay:0},
      {id:'sku-2',name:'Case B',source:'resale',unitCost:60,marginPct:30,mixPct:50,
       acquiringPct:0,initialCashOut:0,batchUnits:0,storagePerUnitDay:0}
    ];
    s.funding={kind:'credit',annualRatePct:12,months:3,reservePct:10};
    s.tax={type:'turnover',pct:6,vatPct:12,taxRegime:'sales_tax',salesTaxPct:'8'};
    localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(s));
    PortfolioV2UI.open({resume:true});
    const prepared=Nomad360SalesTaxV2.prepareStandalone(s,{mode:'sales_tax',ratePct:'8'});
    const raw=PortfolioV2Engine.build(prepared);
    const after=Nomad360SalesTaxV2.project(raw,{mode:'sales_tax',ratePct:'8'});
    return {taxPanel:document.querySelector('[data-p2-sales-tax-summary]')?.textContent,
     stored:PortfolioV2UI.getState(),raw,after,shown:document.querySelector('#p2-results')?.textContent};
   });
   A.equal(report.raw.ready,true,JSON.stringify(report.raw.errors));
   A.equal(report.stored.tax.vatPct,12,'original VAT field survives Sales Tax mode');
   A.ok(report.taxPanel?.includes('Sales Tax'),'buyer total is rendered');
   A.ok(near(report.after.salesTaxSummary.salesTax,report.raw.totalRevenue*.08));
   A.equal(report.after.freeCash,report.raw.freeCash);
   A.equal(report.after.tax,report.raw.tax);
   A.ok(report.raw.months.some(x=>x.principalRepayment>0),'credit is repaid');
   A.deepEqual(errors,[],'standalone runtime errors');
   proofs.push({route:'standalone',tax:report.after.salesTaxSummary.salesTax,
      buyer:report.after.salesTaxSummary.customerTotal,freeCash:report.after.freeCash});
   await ctx.close();
  }
  // V1 -> linked V2, no duplicate 8% on bounds, then MBA offer scenarios.
  {
   const {p,ctx,errors}=await pageFor(browser,base,1280);
   await p.locator('#start-own-product').click();
   await p.locator('#product-name-input').fill('Sales tax V1 bridge');
   await p.locator('#product-intro-submit-label').click();
   await p.locator('[data-product-source="own"]').click();
   await p.locator('[data-material-cost-mode="known"]').click();
   await p.locator('#own-materials-cost').fill('8');
   for(const [id,value] of Object.entries({
     'own-product-ad-budget':900,'own-product-ad-cpc':4.5,'own-product-ad-ctr':2,
     'own-product-ad-click-lead':20,'own-product-ad-lead-sale':50
   }))await p.locator('#'+id).fill(String(value));
   const entered=await p.evaluate(()=>{
     for(const id of ['own-materials-batch-qty','own-production-monthly-qty','own-logistics-qty','own-sales-monthly-qty'])
      document.getElementById(id).value='60';
     selectProductYesNo('salesVat','yes');
     document.getElementById('own-sales-vat-pct').value='12';
     setProductBusinessTaxType('turnover');
     document.getElementById('own-business-tax-pct').value='6';
     saveCurrentProductToPortfolio();
     for(const item of productPortfolio)Object.assign(item.planning,{
      fundingMode:'cash',targetMarginPct:30,reservePct:10,maxDiscountPct:10,minimumMarginPct:10});
     Nomad360SalesTaxV1.select('sales_tax');Nomad360SalesTaxV1.setRate('8');
     const inclusive=calculatePriceListRange(productPortfolio[0]);
     const moved=openLinkedPortfolioFromProducts();
     const state=LinkedPortfolioV2UI.getState();
     return {moved,inclusive,state,visible:document.querySelector('[data-linked-sales-tax-summary]')?.textContent};
   });
   A.equal(entered.moved,true,'genuine V1→V2 function');
   A.equal(entered.state.tax.taxRegime,'sales_tax');
   A.equal(Number(entered.state.tax.salesTaxPct),8);
   A.ok(entered.state.skus[0].priceMax<entered.inclusive.maxPrice,'V1 tax-inclusive bound is unwound');
   A.ok(near(entered.state.skus[0].priceMax*1.08,entered.inclusive.maxPrice));
   A.ok(entered.visible?.includes('Sales Tax'));
   A.deepEqual(errors,[],'V1 transfer browser exceptions');
   proofs.push({route:'V1->V2 goods',netLimit:entered.state.skus[0].priceMax,
      customerLimit:entered.inclusive.maxPrice});
   await ctx.close();
  }
  for(const mode of ['cross_sell','upsell','bundle']){
   const {p,ctx,errors}=await pageFor(browser,base,390),source=F();
   const candidates=source.skus.filter(x=>x.id!=='agent');
   // These are already-approved V1 financial inputs, not generated V2 results.
   const got=await p.evaluate(({source,candidates,mode})=>{
    LinkedPortfolioV2UI.importFromV1({skus:candidates,tax:{type:'turnover',pct:5},currency:'USD'});
    const st=LinkedPortfolioV2UI.getState();
    st.tax.taxRegime='sales_tax';st.tax.salesTaxPct='8';
    st.resources=source.resources;
    st.forecastMonths=3;st.recurringDemandApproved=true;
    st.skus.find(x=>x.id==='own').discountSelected=10;
    st.offers=source.offers.filter(o=>o.mode===mode);
    localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify(st));
    LinkedPortfolioV2UI.resume();
    const prepared=Nomad360SalesTaxV2.prepareLinked(st,{mode:'sales_tax',ratePct:'8'});
    const raw=LinkedPortfolioV2Engine.build(prepared);
    const projected=raw.ready?Nomad360SalesTaxV2.project(raw,{mode:'sales_tax',ratePct:'8'}):null;
    return {ready:raw.ready,errors:raw.errors,basket:raw.basket,
     rawProfit:raw.totals?.netProfit,rawCash:raw.cashflow?.freeCash,
     projectedTax:projected?.salesTaxSummary?.salesTax,
     projectedGross:projected?.salesTaxSummary?.customerTotal,
     projectedNet:projected?.salesTaxSummary?.net,
     projectCash:projected?.cashflow?.freeCash,
     periodNet:raw.cashflow?.periodPnl?.revenue,
     periodGross:projected?.salesTaxSummary?.byMonth?.reduce((a,m)=>a+m.customerTotal,0),
     visible:document.querySelector('[data-linked-sales-tax-summary]')?.textContent,
     state:LinkedPortfolioV2UI.getState()};
   },{source,candidates,mode});
   A.equal(got.ready,true,mode+' '+JSON.stringify(got.errors));
   A.ok(got.visible?.includes('Sales Tax'),mode+' rendered V2 tax');
   A.ok(near(got.projectedTax,got.projectedNet*.08),mode+' no double discount');
   A.ok(near(got.projectedGross,got.projectedNet*1.08),mode+' customer total');
   A.ok(near(got.rawCash,got.projectCash),mode+' cash unaffected');
   A.ok(got.basket.events.some(e=>e.mode===mode),mode+' calculated offer');
   A.equal(got.state.tax.taxRegime,'sales_tax');
   A.deepEqual(errors,[],mode+' browser runtime errors');
   proofs.push({route:'linked '+mode,net:got.projectedNet,tax:got.projectedTax,
     buyer:got.projectedGross,freeCash:got.rawCash});
   await ctx.close();
  }
  console.log('SALES_TAX_7B4_BROWSER_GREEN '+JSON.stringify(proofs));
 }finally{await browser.close();await new Promise(ok=>serverInstance.close(ok));}
})().catch(err=>{console.error('SALES_TAX_7B4_BROWSER_RED',err.stack||err);process.exitCode=1});
