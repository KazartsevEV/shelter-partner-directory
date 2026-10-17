'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),near=(a,b)=>Math.abs(a-b)<1e-7;
const roles=['self','hired','agent'],channels=['online','offline'];
function server(){
 return http.createServer((req,res)=>{
  const f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.HTML':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(f)]||'application/octet-stream');
  fs.createReadStream(f).pipe(res);
 });
}
async function enter(page,channel,role,depth){
 await page.locator('#start-service').click();
 if(depth==='full')await page.locator('#service-mode-full').click();
 await page.locator('#service-work-'+channel).click();
 if(role==='agent'){await page.locator('#service-screen button[onclick="showAgentChooser()"]').click();await page.locator('#agent-screen button[onclick="selectServiceMode(\'agent\')"]').click();}
 else await page.locator('#service-screen button[onclick="selectServiceMode(\''+role+'\')"]').click();
}
async function full(page,channel,role){
 await enter(page,channel,role,'full');
 await page.locator('#product-name-input').fill('7Б-3 '+channel+' '+role);
 await page.locator('#product-intro-submit-label').click();
 if(role==='agent'){
  await page.locator('#service-agent-partner-price').fill('100');
  await page.locator('#service-agent-fee-pct').fill('20');
  await page.locator('#service-agent-partner-vat').fill('10');
  await page.locator('#service-agent-partner-tax-pct').fill('5');
  await page.locator('[data-material-cost-mode="known"]').click();
  await page.locator('#own-materials-cost').fill('8');

 }else{
  await page.locator('[data-material-cost-mode="known"]').click();
  await page.locator('#own-materials-cost').fill('8');
  if(role==='hired'){
   await page.locator('#own-production-workers-count').fill('1');
   await page.locator('#own-production-worker-gross').fill('100');
  }
 }
 for(const [id,v] of Object.entries({'own-product-ad-budget':900,'own-product-ad-cpc':4.5,
  'own-product-ad-ctr':2,'own-product-ad-click-lead':20,'own-product-ad-lead-sale':50}))
  await page.locator('#'+id).fill(String(v));
 if(role==='agent'){
  await page.locator('#service-agent-line-payers select[data-agent-line-key="advertising"]').selectOption('partner');
  await page.locator('#service-agent-line-payers select[data-agent-line-key="material.known"]').selectOption('agent');
 }
 if(channel==='offline')await page.locator('#offline-service-monthly-capacity').fill('40');
 return page.evaluate(()=>{
  selectProductYesNo('salesVat','yes');document.getElementById('own-sales-vat-pct').value='12';
  setProductBusinessTaxType('turnover');document.getElementById('own-business-tax-pct').value='6';
  saveCurrentProductToPortfolio();for(const p of productPortfolio)
   Object.assign(p.planning,{fundingMode:'cash',targetMarginPct:30,reservePct:10,maxDiscountPct:0,minimumMarginPct:10});
  const model=calculateProductPortfolio(),cash=calculateProductCashFlow(model);
  renderProductBusinessSummary();refreshAllAggregatePricing();
  return {model,cash,sku:productPortfolio[0]};
 });
}
async function simple(page,role){
 await enter(page,'online',role,'simple');
 return page.evaluate(role=>{
  currentValues={...currentValues,months:3,monthlyBudget:400,cpc:4,ctr:2,cvrLead:20,cvrDeal:50,
   costConsult:100,costPack:200,ltv:30,mgmt:0,site:0,hosting:0,dom:0,magnet:0,
   acq:10,taxTurnover:5,markup:25,agentPct:20,agentTaxTurnover:10};
  if(role==='agent')for(const key of Object.keys(agentPayers))agentPayers[key]='partner';
  calculate();return {snapshot:onlineV1PortfolioSnapshot,
   cash:document.getElementById('service-simple-free-cash-value').textContent};
 },role);
}
(async()=>{
 const s=server();await new Promise(ok=>s.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+s.address().port+'/',browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let complete=0;const audit=[];
 try{
  for(const channel of channels)for(const role of roles){
   const ctx=await browser.newContext({viewport:{width:channel==='online'?390:1280,height:900}}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
   await page.goto(base+'Marketing_calc.HTML?sales_tax_preview=1',{waitUntil:'domcontentloaded'});
   const before=await full(page,channel,role);
   A.equal(before.model.pricingReady,true,channel+'/'+role+' '+JSON.stringify(before.model.items));
   A.equal(await page.evaluate(()=>Nomad360SalesTaxServiceV1.selectFull('sales_tax')),true);
   await page.evaluate(()=>Nomad360SalesTaxServiceV1.setFullRate('8'));
   const after=await page.evaluate(()=>{
    const model=calculateProductPortfolio(),cash=calculateProductCashFlow(model),item=productPortfolio[0],p=aggregatePricingMetrics(item);
    return {model,cash,p,agency:item.serviceAgency,mode:Nomad360SalesTaxServiceV1.getFull(),vat:document.getElementById('own-sales-vat-pct').value,
     visible:document.querySelector('[data-sales-tax-service="full"] [data-st-details]').textContent,
     quote:Nomad360SalesTaxServiceV1.quote(100,'sales_tax','8',10)};
   });
   if(role==='agent'){
    // Correct exception to baseline parity: in VAT mode principal gross 100
    // contains VAT 10%, and agent fee 20 contains VAT 12%.
    // In Sales Tax mode both old VAT deductions disappear; Sales Tax is transit.
    A.ok(near(after.model.items[0].price,20),'agent fee must exclude no VAT under Sales Tax');
    A.ok(near(after.cash.months[0].partnerRevenue,2000),'principal gross 100 x 20, no legacy 10% VAT');
    A.ok(near(after.agency.partnerVatPct,0));
   }else{
    A.deepEqual(after.model,before.model,channel+'/'+role+' unchanged non-agent model');
    A.deepEqual(after.cash,before.cash,channel+'/'+role+' unchanged non-agent cash');
   }
   A.equal(after.vat,'12');
   A.equal(after.mode.error,'');
   A.ok(near(after.quote.customerTotal,97.2));
   A.ok(after.visible.includes('Sales Tax'));
   if(role==='agent'){
    A.ok(after.visible.includes('108'),'principal buyer pays 100 + 8');
    A.ok(near(after.p.priceBeforeTax,20),'agent commission is 20 net under Sales Tax, not 20/1.12 VAT');
    A.ok(near(Number(after.agency.grossPrice),100));
   }else{
    A.ok(near(after.p.priceBeforeTaxWithVat,after.p.priceBeforeTax*1.08));
    A.ok(near(after.p.salesTaxAmount,after.p.taxAdjustedPrice*.08));
   }
   
   // Three-month credit: a transit tax must leave loan schedule and net cash unchanged.
   const credit=await page.evaluate(()=>{
    const item=productPortfolio[0],old={...item.planning};
    Object.assign(item.planning,{fundingMode:'credit',creditRatePct:12,creditTermMonths:3});
    const m8=calculateProductPortfolio(),c8=calculateProductCashFlow(m8);
    Nomad360SalesTaxServiceV1.setFullRate('0');
    const m0=calculateProductPortfolio(),c0=calculateProductCashFlow(m0);
    Nomad360SalesTaxServiceV1.setFullRate('8');
    item.planning=old;renderProductBusinessSummary();refreshAllAggregatePricing();
    return {m8,c8,m0,c0};
   });
   A.equal(credit.m8.pricingReady,true,channel+'/'+role+' credit pricing');
   A.equal(credit.c8.ready,true,channel+'/'+role+' credit cash');
   A.deepEqual(credit.m8,credit.m0,channel+'/'+role+' financing/P&L rate neutrality');
   A.deepEqual(credit.c8,credit.c0,channel+'/'+role+' financing/Cash Flow rate neutrality');
   if(role!=='agent'){
    A.ok(credit.c8.months.some(m=>m.interestPaid>0),channel+'/'+role+' interest');
    A.ok(credit.c8.months.some(m=>m.principalRepaid>0),channel+'/'+role+' principal');
   }
   let payers=null;
   if(role==='agent'){
    // Two independent payers with nonzero advertising and materials.
    payers=await page.evaluate(()=>{
     const keys=['advertising','material.known'];
     const controls=keys.map(k=>document.querySelector('#service-agent-line-payers select[data-agent-line-key="'+k+'"]'));
     if(controls.some(x=>!x))throw Error('Missing payer controls');
     const snap=()=>{
      const sku=productPortfolio[0],model=calculateProductPortfolio();
      const m=calculateProductCashFlow(model).months[0];
      return {choices:sku.serviceAgency.lineItems.filter(x=>keys.includes(x.key)).map(x=>[x.key,x.payer]),
       partnerRevenue:m.partnerRevenue,partnerCosts:m.partnerCosts,outflow:m.outflow,taxPaid:m.taxPaid,price:model.items[0].price};
     };
     const original=snap();
     for(const x of controls){x.value=x.value==='agent'?'partner':'agent';x.dispatchEvent(new Event('change',{bubbles:true}));}
     saveCurrentProductToPortfolio();const switched=snap();
     for(const x of controls){x.value=x.value==='agent'?'partner':'agent';x.dispatchEvent(new Event('change',{bubbles:true}));}
     saveCurrentProductToPortfolio();return {original,switched,restored:snap()};
    });
    A.equal(payers.original.choices.find(x=>x[0]==='advertising')?.[1],'partner');
    A.equal(payers.original.choices.find(x=>x[0]==='material.known')?.[1],'agent');
    A.ok(payers.switched.partnerCosts<payers.original.partnerCosts,channel+'/agent principal costs');
    A.ok(payers.switched.outflow>payers.original.outflow,channel+'/agent cash outflow');
    A.ok(near(payers.switched.partnerRevenue,payers.original.partnerRevenue));
    A.ok(near(payers.switched.taxPaid,payers.original.taxPaid),'agent turnover tax uses fee only');
    A.deepEqual(payers.restored,payers.original,channel+'/agent payer restoration');
   }
   const sale=role==='agent'?100:after.p.taxAdjustedPrice;
   audit.push({route:channel+'/'+role,mode:'full',net:sale,tax:sale*0.08,buyer:sale*1.08,
    agentFee:role==='agent'?after.model.items[0].price:null,
    creditInterest:credit.c8.months.reduce((a,m)=>a+(m.interestPaid||0),0),
    creditRepayment:credit.c8.months.reduce((a,m)=>a+(m.principalRepaid||0),0),
    creditFreeCash:credit.c8.freeCumulativeEnd,
    agentPayers:payers?.original.choices||null});
   const zero=await page.evaluate(()=>{Nomad360SalesTaxServiceV1.setFullRate('0');return Nomad360SalesTaxServiceV1.getFull().error;});
   A.equal(zero,'');
   await page.evaluate(()=>Nomad360SalesTaxServiceV1.setFullRate(''));
   const bad=await page.evaluate(()=>({state:Nomad360SalesTaxServiceV1.getFull(),saved:saveProductCalculationToBrowser()}));
   A.ok(bad.state.error.includes('Sales Tax'));A.equal(bad.saved,false);
   await page.evaluate(()=>Nomad360SalesTaxServiceV1.setFullRate('8'));
   const saved=await page.evaluate(()=>({ok:saveProductCalculationToBrowser(),draft:JSON.parse(localStorage.getItem('marketingCalcProductResultV1'))}));
   A.equal(saved.ok,true);
   A.equal(saved.draft.taxRegime,'sales_tax');A.equal(saved.draft.salesTaxPct,'8');
   A.equal(saved.draft.productPortfolio[0].taxRegime,'sales_tax');
   A.equal(saved.draft.salesVatPct,12,'preserve previous VAT input');
   if(role==='agent')A.deepEqual(saved.draft.productPortfolio[0].serviceAgency.lineItems
    .filter(x=>['advertising','material.known'].includes(x.key)).map(x=>[x.key,x.payer]),
    payers.original.choices,'saved agency payers');
   await page.goto(base+'Marketing_calc.HTML?resume=1',{waitUntil:'domcontentloaded'});
   const resumed=await page.evaluate(()=>{
    const item=productPortfolio[0],m=calculateProductPortfolio();
    return {state:Nomad360SalesTaxServiceV1.getFull(),price:aggregatePricingMetrics(item),
      model:m,cash:calculateProductCashFlow(m)};
   });
   A.equal(resumed.state.mode,'sales_tax');A.equal(resumed.state.rate,'8');
   A.deepEqual(resumed.model,after.model);A.deepEqual(resumed.cash,after.cash);
   if(role==='agent')A.deepEqual((await page.evaluate(()=>productPortfolio[0].serviceAgency.lineItems))
    .filter(x=>['advertising','material.known'].includes(x.key)).map(x=>[x.key,x.payer]),
    payers.original.choices,'restored agency payers');
   const vat=await page.evaluate(()=>{Nomad360SalesTaxServiceV1.selectFull('vat');return {
    rate:document.getElementById('own-sales-vat-pct').value,
    choice:productOwnChoices.salesVat
   }});
   A.equal(vat.rate,'12');A.equal(vat.choice,'yes');
   if(role==='agent'){
    A.equal(await page.locator('#service-agent-partner-vat').inputValue(),'10');
    const fee=await page.evaluate(()=>calculateProductPortfolio().items[0]?.price);
    A.ok(near(fee,20/1.12),'VAT restores original agent commission basis');
   }
   // Stage 7Б-4: from the finished full V1 service, transfer the exact
   // selected Sales Tax and verify the linked SKU/agency provenance.
   const linked=await page.evaluate(()=>{
     Nomad360SalesTaxServiceV1.selectFull('sales_tax');
     const moved=openLinkedPortfolioFromProducts();
     const state=LinkedPortfolioV2UI.getState();
     return {moved,tax:state?.tax,sku:state?.skus?.[0],
       visible:document.querySelector('#portfolio-v2-screen')?.classList.contains('hidden')===false};
   });
   A.equal(linked.moved,true,channel+'/'+role+' full-service transfer');
   A.equal(linked.tax?.taxRegime,'sales_tax');
   A.equal(Number(linked.tax?.salesTaxPct),8);
   A.equal(linked.sku?.fullServiceRole,role);
   A.equal(linked.visible,true,channel+'/'+role+' linked screen opened');
   A.deepEqual(errors,[],channel+'/'+role+' browser errors');
   await ctx.close();complete++;
  }
  for(const role of roles){
   const ctx=await browser.newContext({viewport:{width:390,height:844}}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
   await page.goto(base+'Marketing_calc.HTML?sales_tax_preview=1',{waitUntil:'domcontentloaded'});
   const original=await simple(page,role);
   A.ok(original.snapshot&&original.snapshot.period.grossRevenue>0,'valid simple V1 '+role);
   A.equal(await page.evaluate(()=>Nomad360SalesTaxServiceV1.selectSimple('sales_tax')),true);
   await page.evaluate(()=>Nomad360SalesTaxServiceV1.setSimpleRate('8'));
   const state=await page.evaluate(()=>({
    snapshot:onlineV1PortfolioSnapshot,
    cash:document.getElementById('service-simple-free-cash-value').textContent,
    detail:document.querySelector('[data-sales-tax-service="simple"] [data-st-details]').textContent,
    mode:Nomad360SalesTaxServiceV1.getSimple(),v2:openLinkedPortfolioFromOnline(),
    v2Tax:LinkedPortfolioV2UI.getState()?.tax
   }));
   A.deepEqual(state.snapshot,original.snapshot);
   const net=original.snapshot.period.grossRevenue;
   audit.push({route:'online/'+role,mode:'simple',net,tax:net*.08,buyer:net*1.08,
    freeCash:state.cash});
   A.equal(state.cash,original.cash);A.equal(state.mode.rate,'8');
   A.ok(state.detail.includes('Sales Tax'));
   A.equal(state.v2,true,'7Б-4 explicitly transfers confirmed Sales Tax into V2');
   A.equal(state.v2Tax.taxRegime,'sales_tax');
   A.equal(Number(state.v2Tax.salesTaxPct),8);
   if(role==='agent')A.ok(state.detail.includes('Agent')||state.detail.includes('агента'));
   await page.evaluate(()=>Nomad360SalesTaxServiceV1.setSimpleRate(''));
   A.ok((await page.locator('[data-sales-tax-service="simple"] [data-st-error]').textContent()).includes('Sales Tax'));
   await page.evaluate(()=>Nomad360SalesTaxServiceV1.setSimpleRate('8'));
   await page.reload({waitUntil:'domcontentloaded'});
   A.deepEqual(await page.evaluate(()=>Nomad360SalesTaxServiceV1.getSimple()),{mode:'sales_tax',rate:'8'});
   A.deepEqual(errors,[],role+' browser errors');
   await ctx.close();complete++;
  }
  console.log('SALES_TAX_7B3_NUMERIC '+JSON.stringify(audit));
  console.log('SALES_TAX_7B3_SERVICES_GREEN '+JSON.stringify({complete,full:6,simple:3,credit:6,agencyPayerCases:2}));
 }finally{await browser.close();await new Promise(ok=>s.close(ok));}
})().catch(e=>{console.error('SALES_TAX_7B3_SERVICES_RED',e.stack);process.exitCode=1;});
