'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'docs/reviews/sales-tax-7b');
const old='12c1ad7d8490c08f0f11b2899b6df4e801d024a5';
const Tax=require('../nomad360_sales_tax.js'),V2=require('../nomad360_sales_tax_v2.js');
const Standalone=require('../portfolio_v2_engine.js');
function near(a,b,n){A.ok(Number.isFinite(a)&&Math.abs(a-b)<=1e-9,n+': '+a+' != '+b);}
test('original 48 engines, 78 RU/EN/KK mobile/desktop routes, original PDF/XLSX',()=>{
 const inputs=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/sales-tax-7b/vat-inputs.json')));
 const summary=JSON.parse(fs.readFileSync(path.join(dir,'baseline/engine-summary.json')));
 const protocol=JSON.parse(fs.readFileSync(path.join(dir,'baseline/browser/protocol.json')));
 A.equal(inputs.source,old);A.equal(summary.source,old);A.equal(protocol.source,old);
 A.equal(inputs.cases.length,48);A.equal(summary.cases.length,48);
 A.deepEqual(inputs.cases.map(x=>x.id),summary.cases.map(x=>x.id));
 A.equal(new Set(inputs.cases.map(x=>x.id)).size,48);
 A.equal(protocol.cases.length,78);A.equal(new Set(protocol.cases.map(x=>x.key)).size,78);
 A.equal(protocol.cases.filter(x=>x.excel).length,6);
 A.equal(protocol.cases.filter(x=>x.restore).length,60);
 for(const lang of ['ru','en','kk']){
  A.equal(protocol.cases.filter(x=>x.key.includes('-'+lang+'-')).length,26);
  for(const kind of ['standalone','linked']){
   const key=kind+'-'+lang+'-1280';
   A.ok(protocol.cases.some(c=>c.key===key&&c.excel),key+' XLSX');
   A.ok(fs.existsSync(path.join(dir,'baseline/browser',key+'.pdf')),key+' PDF');
  }
 }
});
test('frozen historic VAT evidence has unchanged cryptographic digests',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'baseline-manifest.json')));
 A.equal(manifest.source,old);A.ok(Object.keys(manifest.files).length>=150);
 for(const [name,want] of Object.entries(manifest.files)){
  const file=path.join(dir,name);A.ok(fs.existsSync(file),'missing '+name);
  A.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),want,name);
 }
});
test('independent 384-execution Sales Tax, inclusive price, discount and no-tax matrix',()=>{
 const prices=[0,.01,1,20,90,100,108,1200.5],rates=[0,6.25,8,12],discounts=[0,10,25,100];
 let n=0;
 for(const p of prices)for(const r of rates)for(const d of discounts){
  const net=p*(1-d/100),tax=net*r/100;
  const ex=Tax.quote({mode:'sales_tax',enteredPrice:p,ratePct:r,discountPct:d});
  near(ex.net,net,'net');near(ex.tax,tax,'tax');near(ex.customerTotal,net+tax,'buyer');
  const inc=Tax.quote({mode:'sales_tax',enteredPrice:p*(1+r/100),ratePct:r,discountPct:d,priceBasis:'inclusive'});
  near(inc.net,net,'inclusive/net');near(inc.tax,tax,'inclusive/tax');
  near(inc.customerTotal,net+tax,'inclusive/buyer');
  const none=Tax.quote({mode:'none',enteredPrice:p,ratePct:'stale VAT field',discountPct:d});
  near(none.net,net,'none/net');A.equal(none.tax,0);near(none.customerTotal,net,'none/buyer');
  n++;
 }
 A.equal(n,128);
 console.log('7B6_INDEPENDENT_QUOTE_MATRIX_GREEN '+JSON.stringify({checks:n*3}));
});
test('legacy VAT dispatch is exact identity; Sales Tax never mutates cash or credit',()=>{
 const s={version:2,currency:'USD',
  marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,periodMonths:2,cacReservePct:100},
  skus:[{id:'a',name:'Own',source:'own',unitCost:20,marginPct:25,mixPct:50,batchUnits:0,initialCashOut:0,acquiringPct:0,storagePerUnitDay:0},
   {id:'b',name:'Resale',source:'resale',unitCost:60,marginPct:30,mixPct:50,batchUnits:0,initialCashOut:0,acquiringPct:0,storagePerUnitDay:0}],
  resources:[],funding:{kind:'credit',reservePct:10,months:3,annualRatePct:12},tax:{type:'turnover',pct:6,vatPct:12}};
 const saved=JSON.stringify(s),legacy=Standalone.build(s);
 A.equal(legacy.ready,true);
 A.strictEqual(V2.prepareStandalone(s,{mode:'vat'}),s);
 A.strictEqual(V2.project(legacy,{mode:'vat'}),legacy);
 const native=Standalone.build(V2.prepareStandalone(s,{mode:'sales_tax',ratePct:8}));
 A.equal(native.ready,true,JSON.stringify(native.errors));
 const projected=V2.project(native,{mode:'sales_tax',ratePct:8});
 near(projected.salesTaxSummary.salesTax,projected.salesTaxSummary.net*.08,'pass through');
 near(projected.salesTaxSummary.customerTotal,projected.salesTaxSummary.net*1.08,'buyer');
 A.strictEqual(projected.cashflow,native.cashflow);A.strictEqual(projected.financing,native.financing);
 A.equal(projected.netProfit,native.netProfit);A.equal(JSON.stringify(s),saved);
 A.equal(Tax.mode(null),'vat');A.equal(Tax.mode(undefined),'vat');
 A.throws(()=>Tax.quote({mode:'vat',enteredPrice:100,ratePct:12}),/existing V1\/V2/);
 const original=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,'baseline/engine-results.json.gz'))));
 A.equal(original.length,48);
});
