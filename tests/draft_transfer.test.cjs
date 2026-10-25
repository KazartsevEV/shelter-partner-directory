'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const T=require('../nomad360_draft_transfer.js');
const v1='marketingCalcProductResultV1',v2='marketingCalcPortfolioV2',linked='marketingCalcLinkedPortfolioV2';
const payload={currency:'KZT',productPortfolio:[{id:1,name:'Shopper Қап',source:'own',inputs:{cost:'20.000'},payments:{unitCost:{paymentCurrency:'CNY',paymentAmount:20,convertedAmount:14.5,rate:0.725}}}]};
const memory=(initial={})=>{const data=new Map(Object.entries(initial));return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),data}};
const file=(rows=[[v1,JSON.stringify(payload)]])=>JSON.stringify({format:'nomad360-drafts',version:1,createdAt:'2026-10-25T00:00:00Z',records:rows.map(([key,value])=>({key,value}))});
const fails=(fn,code)=>A.throws(fn,e=>e.code===code);
test('exact raw bytes and FX source/applied values round trip; unrelated keys never exported or changed',()=>{
 const raw=' {"currency":"KZT","productPortfolio":'+JSON.stringify(payload.productPortfolio)+'}\n';
 const old=memory({[v1]:raw,nomad360PreferredLanguage:'kk',partnerEmail:'private@example.invalid',token:'not a draft'});
 const text=T.exportFile(old),fresh=memory({nomad360PreferredLanguage:'en'}),plan=T.preview(fresh,text);
 A.deepEqual(T.apply(fresh,plan),{imported:1,unchanged:0});A.equal(fresh.getItem(v1),raw);
 A.equal(fresh.getItem('nomad360PreferredLanguage'),'en');A.doesNotMatch(text,/partnerEmail|private@example|token|PreferredLanguage/);
 A.deepEqual(T.apply(fresh,T.preview(fresh,text)),{imported:0,unchanged:1});
});
test('all seven supported records retain versions, currencies and US reset isolation',()=>{
 const source=memory({[v1]:JSON.stringify(payload),[v2]:JSON.stringify({version:2,currency:'USD',skus:[{id:'sku-1'}],resources:[]}),
 [linked]:JSON.stringify({version:3,source:'v1-calculated',skus:[{id:'v1-online-1'}]}),
 nomad360SalesTaxSimpleV1:JSON.stringify({mode:'sales_tax',rate:'8.2500'}),
 'nomad360-full-service-v2':JSON.stringify({schema:2,currency:'EUR',input:{months:6},source:{kind:'online'}}),
 marketingCalcPortfolioV2USRetailDemo:JSON.stringify({version:2,currency:'USD',skus:[{id:'sku-1'}],resources:[]}),marketingCalcPortfolioV2USRetailReset:'1'});
 const dest=memory(),text=T.exportFile(source);A.equal(T.apply(dest,T.preview(dest,text)).imported,7);A.deepEqual(dest.data,source.data);
});
test('no overwrite without explicit permission; partial file never removes missing records',()=>{
 const old=JSON.stringify({...payload,currency:'USD'}),dest=memory({[v1]:old,nomad360SalesTaxSimpleV1:'{"mode":"none","rate":""}'}),plan=T.preview(dest,file());
 A.deepEqual(plan.conflicts,[v1]);fails(()=>T.apply(dest,plan),'conflict');A.equal(dest.getItem(v1),old);
 A.equal(T.apply(dest,plan,{replace:true}).imported,1);A.equal(dest.getItem('nomad360SalesTaxSimpleV1'),'{"mode":"none","rate":""}');
});
test('untrusted, oversize, ambiguous and future formats fail before writes',()=>{
 for(const text of ['{','null',JSON.stringify({format:'nomad360-drafts',version:2,createdAt:'2026-10-25',records:[]}),file([[v1,JSON.stringify(payload)],[v1,JSON.stringify(payload)]]),file([['nomad360PreferredLanguage','"kk"']]),file([[v1,'{']])])fails(()=>T.parse(text),'invalid');
 fails(()=>T.parse(' '.repeat(T.limit+1)),'size');fails(()=>T.exportFile(memory()),'empty');
 const malicious=JSON.stringify(payload).replace('"cost":"20.000"','"__proto__":{"polluted":true}');fails(()=>T.parse(file([[v1,malicious]])),'unsafe');A.equal({}.polluted,undefined);
 const nested=JSON.parse(JSON.stringify(payload));nested.productPortfolio[0].extra={};let node=nested.productPortfolio[0].extra;for(let i=0;i<45;i++)node=node.x={};fails(()=>T.parse(file([[v1,JSON.stringify(nested)]])),'size');
});
test('markup is rejected outside the exact dynamic V1 paths; dynamic validation is mandatory',()=>{
 const evil=structuredClone(payload);evil.productPortfolio[0].name='<img src=x onerror=alert(1)>';fails(()=>T.parse(file([[v1,JSON.stringify(evil)]])),'unsafe');
 const dynamic=structuredClone(payload);dynamic.productPortfolio[0].uiState={dynamic:{materials:{html:'<div></div>',fields:[]}}};
 const text=file([[v1,JSON.stringify(dynamic)]]);fails(()=>T.parse(text),'unsafe');fails(()=>T.parse(text,()=>false),'unsafe');A.equal(T.parse(text,h=>h==='<div></div>').records.length,1);
 fails(()=>T.parse(file([[v2,JSON.stringify({version:2,skus:[{id:"sku-1');alert(1)//"}],resources:[]})]])),'invalid');
});
test('quota failure before journal leaves storage exactly unchanged',()=>{
 const dest=memory({[v1]:JSON.stringify({...payload,currency:'USD'})}),before=new Map(dest.data),plan=T.preview(dest,file());
 dest.setItem=()=>{throw Error('quota')};fails(()=>T.apply(dest,plan,{replace:true}),'storage');A.deepEqual(dest.data,before);
});
test('failure on a later write rolls back every earlier write byte-for-byte',()=>{
 const dest=memory({[v1]:JSON.stringify({...payload,currency:'USD'})}),before=new Map(dest.data),set=dest.setItem;
 const text=file([[v1,JSON.stringify(payload)],['nomad360SalesTaxSimpleV1','{"mode":"none","rate":""}']]);
 dest.setItem=(k,v)=>{if(k==='nomad360SalesTaxSimpleV1')throw Error('quota');set(k,v)};
 fails(()=>T.apply(dest,T.preview(dest,text),{replace:true}),'storage');A.deepEqual(dest.data,before);
});
test('interrupted write journal recovers on next open; concurrent unrelated edit is preserved',()=>{
 const raw=JSON.stringify(payload),before=JSON.stringify({...payload,currency:'USD'}),dest=memory({[v1]:raw});
 const rows=[{key:v1,before,after:raw}];dest.setItem(T.journalKey,JSON.stringify(rows));A.equal(T.recover(dest),true);A.equal(dest.getItem(v1),before);A.equal(T.recover(dest),false);
 dest.setItem(T.journalKey,JSON.stringify(rows));dest.setItem(v1,'new edit');fails(()=>T.recover(dest),'concurrent');A.equal(dest.getItem(v1),'new edit');A.notEqual(dest.getItem(T.journalKey),null);
});
test('changed previews and tampered plans cannot silently overwrite storage',()=>{
 const dest=memory(),plan=T.preview(dest,file());dest.setItem(v1,JSON.stringify({...payload,currency:'EUR'}));fails(()=>T.apply(dest,plan,{replace:true}),'concurrent');
 const fresh=memory(),bad=T.preview(fresh,file());bad.file.records[0].key='token';fails(()=>T.apply(fresh,bad),'invalid');A.equal(fresh.data.size,0);
});
test('blocked storage and unreadable recovery are explicit failures',()=>{
 const denied={getItem(){throw Error('denied')}};fails(()=>T.exportFile(denied),'storage');fails(()=>T.recover(denied),'storage');
 const dest=memory({[T.journalKey]:'{'});fails(()=>T.recover(dest),'recovery');
});

test('duplicate resource or SKU identities and malformed resource collections are rejected',()=>{
 for(const model of [{version:2,skus:[{id:'sku-1'},{id:'sku-1'}],resources:[]},{version:2,skus:[{id:'sku-1'}],resources:[{id:'r1'},{id:'r1'}]},{version:2,skus:[{id:'sku-1'}],resources:{}}])fails(()=>T.parse(file([[v2,JSON.stringify(model)]])),'invalid');
});

test('pre-product V1 tax preferences survive without inventing a resumable portfolio',()=>{
 const raw=' {"taxRegime":"sales_tax","salesTaxPct":"8.2500","legacy":{"arbitrary":true}} ';
 const source=memory({[v1]:raw}),dest=memory(),text=T.exportFile(source);
 A.equal(T.apply(dest,T.preview(dest,text)).imported,1);A.equal(dest.getItem(v1),raw);
 const store=require('../nomad360_draft_store.js').create(dest);A.equal(store.readV1(),null);A.deepEqual(store.readV1Raw(),JSON.parse(raw));
});

test('active or local link schemes, including entity and control obfuscation, cannot enter draft fields',()=>{
 for(const url of ['javascript:alert(1)',' JaVa\nScRiPt:alert(1)','java&#x73;cript&colon;alert(1)','java&Tab;script:alert(1)','vbscript:msgbox(1)','data:text/html,script','file:///local/file','blob:https://example.invalid/123']){
  const bad=structuredClone(payload);bad.productPortfolio[0].inputs['resale-buy-link']=url;
  const text=file([[v1,JSON.stringify(bad)]]);fails(()=>T.parse(text),'unsafe');
 }
 for(const url of ['https://supplier.example/item?name=bag','http://supplier.example/a','Text with javascript: in a sentence'])A.equal(T.unsafeText(url),false);
});
