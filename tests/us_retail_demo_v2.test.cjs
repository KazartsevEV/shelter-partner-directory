const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const state=JSON.parse(fs.readFileSync(path.join(root,'docs/demos/us-main-street-12m/model.json'),'utf8'));
const engine=require('../portfolio_v2_engine.js');
const salesTax=require('../nomad360_sales_tax_v2.js');
const events=[];
const browser={Nomad360UI:{getLanguage:()=> 'en'}};
vm.runInNewContext(fs.readFileSync(path.join(root,'nomad360_us_retail_demo.js'),'utf8'),
 {window:browser,document:{readyState:'loading',addEventListener:(key)=>events.push(key)},URLSearchParams});
assert.deepEqual(JSON.parse(JSON.stringify(browser.Nomad360USRetailDemo.getState())),state,'JavaScript study data must match canonical JSON exactly');
const output=engine.build(state);
assert.equal(output.ready,true,JSON.stringify(output.errors));
assert.equal(state.skus.length,10);
assert.deepEqual(state.skus.reduce((acc,s)=>(acc[s.source]=(acc[s.source]||0)+1,acc),{}),{own:2,resale:6,dropship:2});
assert.equal(state.resources.length,14);
assert.equal(output.months.length,12);
assert.equal(output.salesHorizon,12);
assert.equal(output.marketing.orders,150);
assert.equal(output.months.reduce((x,m)=>x+Object.values(m.sold).reduce((a,b)=>a+b,0),0),1800);
assert.equal(output.months.at(-1).principalRepayment,output.financing.principal);
assert.ok(output.financing.principal>0);
assert.ok(output.months.slice(0,-1).every(m=>m.principalRepayment===0));
assert.ok(output.months.every(m=>m.interest>0));
assert.ok(output.months.every(m=>Object.values(m.sold).reduce((a,b)=>a+b,0)===150));
const projection=salesTax.project(output,{mode:'sales_tax',ratePct:state.tax.salesTaxPct});
assert.equal(projection.salesTaxSummary.mode,'sales_tax');
assert.equal(projection.salesTaxSummary.lines.length,10);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,JSON.stringify({a,b}));
close(projection.salesTaxSummary.salesTax,output.totalRevenue*0.0625);
close(projection.salesTaxSummary.customerTotal,output.totalRevenue*1.0625);
const sumMonthly=output.months.reduce((n,m)=>n+m.receipt,0);
close(sumMonthly,output.totalRevenue*12);
const oneOff=state.resources.filter(r=>r.cadence==='once').reduce((n,r)=>n+r.amount,0);
const recurring=state.resources.filter(r=>r.cadence==='monthly'&&r.kind!=='campaign').reduce((n,r)=>n+r.amount,0);
assert.equal(output.resourceOnce,oneOff);
assert.equal(output.resourceMonthly,recurring);
assert.equal(state.resources.filter(r=>r.kind==='campaign').length,1);
assert.equal(state.marketing.budget,1800);
assert.equal(projection.salesTaxSummary.byMonth.length,0,'Standalone mode must not fake month-specific Sales Tax invoices');
assert.equal(output.months.at(-1).freeCumulative,output.finalCash-output.financing.reserve);
assert.ok(events.includes('DOMContentLoaded'));
const v2src=fs.readFileSync(path.join(root,'portfolio_v2_us_demo_ui.js'),'utf8');
assert.match(v2src,/marketingCalcPortfolioV2USRetailDemo/);
assert.match(v2src,/activeStorageKey=usDemoStorageKey/);
assert.match(v2src,/function open\(options=\{\}\)\{\s*activeStorageKey=storageKey/);
assert.match(v2src,/localStorage\.setItem\(activeStorageKey,JSON\.stringify\(model\)\)/);
assert.match(v2src,/openDemo,localizeStudyNames,load/);
console.log('US_RETAIL_DEMO_ENGINE_GREEN',JSON.stringify({
 skus:state.skus.length,resources:state.resources.length,months:output.months.length,
 yearlyUnits:1800,netRevenue:sumMonthly,salesTax:projection.salesTaxSummary.salesTax,
 buyerTotal:projection.salesTaxSummary.customerTotal,
 credit:output.financing.principal,reserve:output.financing.reserve,
 bulletMonth:12,finalCash:output.finalCash,recurring,oneOff}));
