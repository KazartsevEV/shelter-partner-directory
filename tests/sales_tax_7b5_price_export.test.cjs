'use strict';
const test=require('node:test'),A=require('node:assert/strict');
const Export=require('../nomad360_price_export.js');
const Tax=require('../nomad360_sales_tax.js');
const near=(a,b)=>A.ok(Math.abs(a-b)<.00001,a+' != '+b);
function linked(mode='sales_tax',rate='8'){
 const state={currency:'USD',tax:{type:'turnover',pct:6,vatPct:12,
  ...(mode?{taxRegime:mode,salesTaxPct:rate}:{})}};
 const owner={id:'sku1',name:'SKU',source:'own',priceList:100,
   discountSelected:10,priceGross:90,status:'TARGET_MET'};
 const agent={id:'agency',name:'Agent fee',source:'online-service',
   onlineRole:'agent',priceList:20,discountSelected:0,priceGross:20,status:'FIXED_V1'};
 const out={ready:true,items:[owner,agent],
  cashflow:{periodPnl:{accountingCompleteness:'COMPLETE'}},
  salesTaxSummary:{mode,ratePct:Number(rate),lines:[
   {id:'sku1',base:'owner',net:900,salesTax:900*Number(rate)/100,customerTotal:900*(1+Number(rate)/100)},
   {id:'agency',base:'principal',net:1800,salesTax:1800*Number(rate)/100,customerTotal:1800*(1+Number(rate)/100)}
  ],net:2700,salesTax:2700*Number(rate)/100,customerTotal:2700*(1+Number(rate)/100)}};
 return {state,out,kind:'linked'};
}
test('No-mode historical VAT export identity and all three languages',()=>{
 const c=linked(null);delete c.out.salesTaxSummary;
 for(const lang of ['ru','en','kk']){
  const d=Export.document(c,lang);
  A.equal(d.taxMode,'vat');A.equal(d.rows[0][4],100);
  A.equal(d.rows[0][5],10);A.equal(d.rows[0][6],90);
  A.equal(d.rows[1][6],20);A.equal(d.notes.length,4);
 }
});
test('Linked Sales Tax uses net price after discount ONCE; never treats agent fee as principal price',()=>{
 const c=linked(),before=JSON.stringify(c);
 for(const lang of ['ru','en','kk']){
  const d=Export.document(c,lang);
  A.equal(d.taxMode,'sales_tax');near(d.rows[0][6],97.2);
  A.equal(d.rows[0][4],100);A.equal(d.rows[0][5],10);
  A.equal(d.rows[1][6],null,'principal customer unit price not provable from agent commission');
  A.equal(d.taxTable.rows.length,2);near(d.taxTable.rows[1][5],1944);
  A.equal(d.taxTable.rows[1][2],{ru:'Доход принципала',en:'Principal revenue',kk:'Принципал түсімі'}[lang]);
  A.equal(d.taxTable.rows[1][3],1800);
  near(d.taxTable.totals[4],216);near(d.taxTable.totals[5],2916);
  A.ok(!d.notes.some(n=>n.includes('1944')),'no dense raw monetary blob in Notes');
  A.ok(d.notes.some(n=>n.includes('Sales Tax')));
  A.ok(!d.notes.some(n=>/existing VAT-inclusive|с НДС\.|ҚҚС қосылған/.test(n)),'no false VAT claim');
 }
 A.equal(JSON.stringify(c),before,'export may not mutate user-owned inputs');
});
test('Standalone Sales Tax 8%, zero and none: correct buyer prices, zero stays numeric',()=>{
 for(const rate of ['8','0']){
  const r=Number(rate),c={kind:'standalone',state:{currency:'KZT',tax:{vatPct:12,taxRegime:'sales_tax',salesTaxPct:rate}},
   out:{ready:true,items:[{id:'x',source:'resale',name:'Item',price:100,priceWithVat:100}],
   salesTaxSummary:{mode:'sales_tax',ratePct:r,lines:[{id:'x',base:'owner',net:100,salesTax:r,customerTotal:100+r}],net:100,salesTax:r,customerTotal:100+r}}};
  const d=Export.document(c,'kk');A.equal(d.rows[0][4],100);near(d.rows[0][6],100+r);
  A.equal(d.rows[0][5],null);A.equal(d.taxTable.period,'Негізгі ай');
  A.deepEqual(d.taxTable.rows[0].slice(3),[100,r,100+r]);
 }
 const c=linked('none','invalid');
 c.out.salesTaxSummary.lines.forEach(line=>{line.salesTax=0;line.customerTotal=line.net});
 c.out.salesTaxSummary.ratePct=0;c.out.salesTaxSummary.salesTax=0;c.out.salesTaxSummary.customerTotal=2700;
 const d=Export.document(c,'en');A.equal(d.taxMode,'none');A.equal(d.rows[0][6],90);
 A.equal(d.rows[1][6],20);A.equal(d.taxTable,null);
});
test('Fail closed on missing or mismatched Sales Tax ledgers and rates',()=>{
 const c=linked();A.throws(()=>Export.document({...c,out:{ready:true,items:c.out.items}},'ru'),/Missing/);
 const rateMismatch=linked();rateMismatch.state.tax.salesTaxPct='5';
 A.throws(()=>Export.document(rateMismatch,'ru'),/stale/);
 const missingSku=linked();missingSku.out.salesTaxSummary.lines.shift();
 A.throws(()=>Export.document(missingSku,'en'),/SKU/);
 const invalid=linked();invalid.state.tax.salesTaxPct='';
 invalid.out.salesTaxSummary.ratePct=0;A.throws(()=>Export.document(invalid,'kk'));
});
test('Uses the same strict Sales Tax quote contract as 7B-1',()=>{
 const q=Tax.quote({mode:'sales_tax',enteredPrice:90,ratePct:8});
 near(q.customerTotal,97.2);near(q.tax,7.2);
});
