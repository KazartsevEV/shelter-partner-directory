'use strict';
// Run this new test driver against an explicitly selected, unchanged source tree.
const fs=require('node:fs'),path=require('node:path'),A=require('node:assert/strict'),zlib=require('node:zlib'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'docs/reviews/sales-tax-7b/baseline'),source=path.resolve(process.env.SALES_TAX_BASELINE_ROOT||root),capture=process.argv.includes('--capture');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),expected='12c1ad7d8490c08f0f11b2899b6df4e801d024a5';
if(capture){A.equal(sha,expected);A.equal(execFileSync('git',['diff','--name-only','HEAD'],{cwd:source,encoding:'utf8'}).trim(),'','Capture only from an unchanged checkout');}
const Standalone=require(path.join(source,'portfolio_v2_engine.js')),Linked=require(path.join(source,'portfolio_v2_linked_engine.js')),Full=require(path.join(source,'portfolio_v2_full_service.js'));
const inputFile=path.join(root,'tests/fixtures/sales-tax-7b/vat-inputs.json');
if(capture&&!fs.existsSync(inputFile)){
 const {fixture}=require(path.join(source,'tests/portfolio_v2_f3_fixture.cjs')),cases=[];
 for(const type of ['turnover','profit'])for(const vatPct of [0,12])for(const funding of ['cash','credit'])for(const months of [1,3]){
  const id=[type,'vat'+vatPct,funding,months].join('-');
  cases.push({id:'standalone-'+id,kind:'standalone',input:{version:2,currency:'KZT',businessCurrency:'KZT',asOf:'2026-10-15',marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:50,periodMonths:months,cacReservePct:100},skus:[{id:'own',name:'Cotton tote',source:'own',unitCost:20,marginPct:25,mixPct:60,acquiringPct:1,batchUnits:60,initialCashOut:1200,fulfillmentPerOrder:2,storagePerUnitDay:.1},{id:'resale',name:'Cotton pouch',source:'resale',unitCost:12,marginPct:25,mixPct:40,acquiringPct:1,batchUnits:40,initialCashOut:480,fulfillmentPerOrder:1,storagePerUnitDay:.1}],resources:[{id:'rent',kind:'premises',label:'Shared rent',amount:180,cadence:'monthly',skuIds:['own','resale'],allocation:'revenue'}],funding:{kind:funding,annualRatePct:20,months:3,reservePct:10},tax:{type,pct:5,vatPct}}});
  const f=fixture(type);f.forecastMonths=months;f.skus.forEach(s=>{s.vatPct=vatPct;if(funding==='cash'){s.creditPrincipal=0;s.creditMonths=0;s.creditServiceMonthly=0;}s.discountSelected=Math.min(5,Number(s.maxDiscountPct)||0);});const state={...Linked.fromV1({...f,currency:'KZT'}),importedAt:'2026-10-15T12:00:00.000Z',resources:f.resources,offers:f.offers,forecastMonths:months,recurringDemandApproved:true};state.skus.forEach(s=>s.discountSelected=Math.min(5,Number(s.maxDiscountPct)||0));cases.push({id:'linked-'+id,kind:'linked',input:state});
  cases.push({id:'full-'+id,kind:'full',input:{months,monthlyForecast:20,capacity:30,priceGross:100,vatPct,discountPct:10,unitCashCost:8,commissionPct:2,fixedCashMonthly:600,equipmentPurchase:300,equipmentAmortMonthly:25,taxType:type,taxPct:5,reservePct:10,funding:funding==='cash'?'own':'credit',annualRatePct:20,creditMonths:3}});
 }
 fs.writeFileSync(inputFile,JSON.stringify({source:expected,cases},null,2)+'\n');
}
const fixtures=JSON.parse(fs.readFileSync(inputFile));A.equal(fixtures.source,expected);const rows=fixtures.cases.map(c=>{const result=(c.kind==='standalone'?Standalone:c.kind==='linked'?Linked:Full).build(c.input);A.equal(result.ready,true,c.id+': '+JSON.stringify(result.errors));return {id:c.id,kind:c.kind,result};});
function compare(previous,current,at){
 if(previous===null||typeof previous!=='object')return A.equal(current,previous,at);
 if(Array.isArray(previous)){A.ok(Array.isArray(current),at);A.equal(current.length,previous.length,at);}
 // Newly added explicit tax metadata is allowed, every established result is exact.
 for(const key of Object.keys(previous))compare(previous[key],current?.[key],at+'.'+key);
}
if(capture){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'engine-results.json.gz'),zlib.gzipSync(JSON.stringify(rows)));fs.writeFileSync(path.join(dir,'engine-summary.json'),JSON.stringify({source:sha,cases:rows.map(r=>({id:r.id,kind:r.kind,ready:r.result.ready,revenue:r.result.revenue??r.result.totals?.revenue,profit:r.result.profit??r.result.totals?.profit,capital:r.result.capital??r.result.funding?.capital,cashOnHand:r.result.cashOnHand??r.result.cashflow?.cashOnHand}))},null,2)+'\n');}
else{const old=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,'engine-results.json.gz'))));compare(old,JSON.parse(JSON.stringify(rows)),'VAT');}
console.log('SALES_TAX_7B_VAT_'+(capture?'BASELINE':'PARITY')+'_GREEN '+JSON.stringify({source:sha,cases:rows.length,exactNumbers:true}));
