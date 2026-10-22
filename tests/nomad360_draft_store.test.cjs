'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict');
const Drafts=require('../nomad360_draft_store.js');

function memory(){
  const values=new Map();
  return {values,getItem:key=>values.get(key)??null,
    setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
}

test('existing V1 payload survives the storage boundary byte-for-byte',()=>{
  const storage=memory(),drafts=Drafts.create(storage);
  const payload={savedAt:'2026-10-12T12:00:00.000Z',currency:'KZT',activeProductId:7,
    productPortfolio:[{id:7,name:'Шоппер',source:'own',inputs:{'own-materials-cost':'235'},
      payments:{unitCost:{paymentAmount:35,paymentCurrency:'CNY',convertedAmount:null}}}],
    taxType:'turnover',businessTaxPct:3,salesVat:'yes',salesVatPct:12};
  A.equal(drafts.writeV1(payload),true);
  A.equal(storage.values.get('marketingCalcProductResultV1'),JSON.stringify(payload));
  A.deepEqual(drafts.readV1(),payload);
  A.equal(drafts.removeV1(),true);
  A.equal(drafts.readV1(),null);
});

test('V1 rejects malformed historical drafts without deleting stored data',()=>{
  const storage=memory(),drafts=Drafts.create(storage);
  const bad={productPortfolio:[{id:1,name:'A',source:'own',inputs:{}},
    {id:1,name:'B',source:'own',inputs:{}}]};
  storage.setItem(Drafts.keys.v1,JSON.stringify(bad));
  A.equal(drafts.readV1(),null);
  A.equal(storage.getItem(Drafts.keys.v1),JSON.stringify(bad));
  storage.setItem(Drafts.keys.v1,'{');
  A.equal(drafts.readV1(),null);
});

test('standalone and linked V2 retain their original keys and versions',()=>{
  const storage=memory(),drafts=Drafts.create(storage);
  const standalone={version:2,currency:'USD',skus:[{id:'sku-1',unitCost:35}]};
  const linked={version:3,source:'v1-calculated',skus:[],resources:[]};
  A.equal(drafts.writePortfolio(standalone),true);
  A.equal(drafts.writeLinked(linked),true);
  A.deepEqual(drafts.readPortfolio(),standalone);
  A.deepEqual(drafts.readLinked(),linked);
  A.equal(drafts.readV1(),null);
});

test('unavailable browser storage fails closed and never invents a draft',()=>{
  const denied=Drafts.create({getItem(){throw Error('denied')},
    setItem(){throw Error('denied')},removeItem(){throw Error('denied')}});
  A.equal(denied.readV1(),null);
  A.equal(denied.readPortfolio(),null);
  A.equal(denied.writeV1({}),false);
  A.equal(denied.writePortfolio({}),false);
  A.equal(denied.removeV1(),false);
});

test('tax adapters retain raw partial records without weakening validated V1 resume',()=>{
 const storage=memory(),drafts=Drafts.create(storage);
 const partial={taxRegime:'sales_tax',salesTaxPct:'8.25',legacy:{arbitrary:true}};
 storage.setItem(Drafts.keys.v1,JSON.stringify(partial));
 A.deepEqual(drafts.readV1Raw(),partial);A.equal(drafts.readV1(),null);
 A.equal(storage.getItem(Drafts.keys.v1),JSON.stringify(partial));
 for(const raw of ['{','null']){storage.setItem(Drafts.keys.v1,raw);A.equal(drafts.readV1Raw(),null);A.equal(storage.getItem(Drafts.keys.v1),raw);}
});

test('simple service tax choice retains its existing independent key, strings and reset isolation',()=>{
 const storage=memory(),drafts=Drafts.create(storage),simple={mode:'sales_tax',rate:'8.2500'};
 drafts.writeSimpleSalesTax(simple);drafts.writeV1({taxRegime:'none'});
 A.equal(storage.getItem('nomad360SalesTaxSimpleV1'),JSON.stringify(simple));
 A.deepEqual(drafts.readSimpleSalesTax(),simple);drafts.removeV1();
 A.deepEqual(drafts.readSimpleSalesTax(),simple);
 storage.setItem(Drafts.keys.simpleSalesTax,'{');A.equal(drafts.readSimpleSalesTax(),null);
 A.equal(storage.getItem(Drafts.keys.simpleSalesTax),'{');
 const denied=Drafts.create({getItem(){throw Error('denied')},setItem(){throw Error('denied')}});
 A.equal(denied.readV1Raw(),null);A.equal(denied.readSimpleSalesTax(),null);
 A.equal(denied.writeSimpleSalesTax(simple),false);
});
