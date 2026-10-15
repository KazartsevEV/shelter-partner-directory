'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict');
const Tax=require('../nomad360_sales_tax.js');
const eq=(x,y)=>A.ok(Math.abs(x-y)<=1e-9, x+' != '+y);

test('legacy saves default strictly to VAT and VAT still belongs to old engines',()=>{
  A.equal(Tax.mode(), 'vat'); A.equal(Tax.mode(null),'vat');
  A.equal(Tax.mode('vat'),'vat'); A.equal(Tax.mode('sales_tax'),'sales_tax');
  A.equal(Tax.mode('none'),'none');
  A.throws(()=>Tax.mode(''),/Invalid/);A.throws(()=>Tax.mode('VAT'),/Invalid/);
  A.throws(()=>Tax.quote({mode:'vat',enteredPrice:100,ratePct:12}),/existing V1\/V2/);
  A.ok(Object.isFrozen(Tax.MODES));
});

test('price before tax 100, 8% Sales Tax: revenue 100, customer 108',()=>{
  const x=Tax.quote({mode:'sales_tax',enteredPrice:100,ratePct:8});
  A.equal(x.net,100);A.equal(x.tax,8);A.equal(x.customerTotal,108);
  A.equal(x.netBeforeDiscount,100); A.equal(x.priceBasis,'exclusive');
});

test('discount comes before Sales Tax and yields 90 + 7.20 = 97.20',()=>{
  const x=Tax.quote({mode:'sales_tax',enteredPrice:100,ratePct:8,discountPct:10});
  A.equal(x.net,90);eq(x.tax,7.2);eq(x.customerTotal,97.2);
});

test('tax-inclusive 108 is decomposed without double subtraction',()=>{
  const x=Tax.quote({mode:'sales_tax',enteredPrice:108,ratePct:8,priceBasis:'inclusive'});
  A.equal(x.net,100);eq(x.tax,8);eq(x.customerTotal,108);
  A.equal(x.net+x.tax,x.customerTotal);
});

test('discount on tax-inclusive 108 is applied to its 100 net basis',()=>{
  const x=Tax.quote({mode:'sales_tax',enteredPrice:108,ratePct:8,priceBasis:'inclusive',discountPct:10});
  A.equal(x.net,90);eq(x.tax,7.2);eq(x.customerTotal,97.2);
});

test('two SKU tax amounts add to a single 16 pass-through, not a business expense',()=>{
  const one=Tax.quote({mode:'sales_tax',enteredPrice:100,ratePct:8});
  const other=Tax.quote({mode:'sales_tax',enteredPrice:100,ratePct:8});
  A.equal(one.net+other.net,200);A.equal(one.tax+other.tax,16);
  A.equal(one.customerTotal+other.customerTotal,216);
});

test('no tax ignores stale tax rate and still respects discounts',()=>{
  const x=Tax.quote({mode:'none',enteredPrice:100,ratePct:'corrupt old field',discountPct:10});
  A.equal(x.tax,0);A.equal(x.customerTotal,90);
  A.equal(x.net,90);A.equal(x.ratePct,0);
  A.equal(Tax.quote({mode:'none',enteredPrice:108,priceBasis:'inclusive'}).net,108);
});

test('zero Sales Tax is an explicit, non-VAT regime',()=>{
  const x=Tax.quote({mode:'sales_tax',enteredPrice:100,ratePct:0});
  A.equal(x.mode,'sales_tax');A.equal(x.tax,0);A.equal(x.customerTotal,100);
});

test('business turnover/profit tax and purchasing expenses are outside quote scope',()=>{
  const input={mode:'sales_tax',enteredPrice:100,ratePct:8,discountPct:0,
    unitCost:60,businessTaxPct:5};
  const copy=JSON.stringify(input);const output=Tax.quote(input);
  A.deepEqual(Object.keys(output),['mode','priceBasis','enteredPrice','discountPct','ratePct','netBeforeDiscount','net','tax','customerTotal']);
  A.equal(JSON.stringify(input),copy);A.ok(Object.isFrozen(output));
  A.equal(output.net-60,40);
});

test('invalid tax and price values fail rather than silently using a default',()=>{
  for(const bad of ['',null,undefined,-1,Infinity,-Infinity,NaN,'NaN','eight',{},[]]){
    A.throws(()=>Tax.quote({mode:'sales_tax',enteredPrice:100,ratePct:bad}),/Invalid/);
    A.throws(()=>Tax.quote({mode:'sales_tax',enteredPrice:bad,ratePct:8}),/Invalid/);
  }
  A.throws(()=>Tax.quote({mode:'sales_tax',enteredPrice:100}),/Invalid/);
  A.throws(()=>Tax.quote({mode:'sales_tax',enteredPrice:100,ratePct:8,discountPct:101}),/Discount/);
  A.throws(()=>Tax.quote({mode:'sales_tax',enteredPrice:100,ratePct:8,priceBasis:'implied'}),/priceBasis/);
  A.throws(()=>Tax.quote({mode:'sales_tax',enteredPrice:1e308,ratePct:1e308}),/Invalid ratePct|overflow/);
});

test('full discount yields exactly zero tax/customer price',()=>{
  const x=Tax.quote({mode:'sales_tax',enteredPrice:145,ratePct:9.5,discountPct:100});
  A.equal(x.net,0);A.equal(x.tax,0);A.equal(x.customerTotal,0);
});

test('helper does not import or mutate any V1/V2 engine',()=>{
  const engine=require('../portfolio_v2_engine.js');
  const before=engine.build;
  const q=Tax.quote({mode:'sales_tax',enteredPrice:100,ratePct:8});
  A.equal(q.net,100); A.equal(engine.build,before);
});
