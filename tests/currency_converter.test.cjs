const {test}=require('node:test'),A=require('node:assert/strict');
const P=require('../nomad360_payments.js'),FX=require('../nomad360_fx.js'),Engine=require('../portfolio_v2_engine.js');
const valid=c=>['USD','CNY','EUR','KZT'].includes(c);
const quote={rate:2,date:'2026-01-02',source:'manual',sourceLabel:'Bank invoice'};
const model=()=>({version:2,currency:'USD',marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,periodMonths:2,cacReservePct:100},skus:[{id:'a',name:'Product',source:'dropship',unitCost:20,marginPct:25,mixPct:100,fulfillmentPerOrder:3,acquiringPct:0}],resources:[],funding:{kind:'cash',reservePct:10},tax:{type:'turnover',pct:6,vatPct:0}});
test('explicit application preserves the raw quote and stores a reproducible directed rate',()=>{
 const p=P.apply('20','CNY','USD',valid,quote);
 A.equal(p.paymentAmount,20);A.equal(p.paymentCurrency,'CNY');A.equal(p.convertedAmount,40);A.equal(p.status,'normalized');
 A.deepEqual(p.conversion,{...quote,base:'CNY',quote:'USD',appliedAmount:20});
 A.deepEqual(P.record('20','CNY','USD',valid,JSON.parse(JSON.stringify(p))),p);
 A.ok(Math.abs(P.apply(20,'CNY','USD',valid,{...quote,rate:1/3}).convertedAmount-20/3)<1e-12);
});
test('editing amount, currency or business currency requires a fresh explicit application',()=>{
 const p=P.apply(20,'CNY','USD',valid,quote);
 for(const [amount,base,business,status] of [[35,'CNY','USD','conversion-required'],[20,'EUR','USD','conversion-required'],[20,'CNY','KZT','conversion-required'],[-1,'CNY','USD','invalid'],['','CNY','USD','empty'],[0,'CNY','USD','normalized']]){
  const next=P.record(amount,base,business,valid,p);A.equal(next.status,status);A.equal(next.conversion,undefined);
  A.equal(next.convertedAmount,amount===0?0:null);
 }
 A.equal(P.record(20,'USD','USD',valid,p).convertedAmount,20);
});
test('unconfirmed, malformed and overflowing rates cannot unblock the financial model',()=>{
 for(const change of [{base:'USD',quote:'CNY'},{quote:'KZT'},{rate:0},{rate:-1},{rate:NaN},{rate:Infinity},{rate:1e308},{date:''},{date:'2026-02-30'},{date:'2999-01-01'},{source:'google'},{sourceLabel:''}])A.throws(()=>P.apply(20,'CNY','USD',valid,{...quote,...change}));
 const p=P.apply(20,'CNY','USD',valid,quote);p.convertedAmount=999;
 A.equal(P.record(20,'CNY','USD',valid,p).convertedAmount,40);
 p.conversion.quote='EUR';A.equal(P.record(20,'CNY','USD',valid,p).status,'conversion-required');
});
test('V2 uses two converted costs once; repeat calculations and saved drafts retain all financial numbers',()=>{
 const m=model(),sku=m.skus[0];sku.payments={unitCost:P.apply(20,'CNY','USD',valid,quote),fulfillmentPerOrder:P.apply(3,'EUR','USD',valid,{...quote,rate:3})};
 const normalized=P.normalizePortfolio(m,valid);A.equal(normalized.pending,false);A.equal(normalized.model.skus[0].unitCost,40);A.equal(normalized.model.skus[0].fulfillmentPerOrder,9);
 const expected=model();expected.skus[0].unitCost=40;expected.skus[0].fulfillmentPerOrder=9;
 const financial=x=>JSON.parse(JSON.stringify(x,(k,v)=>['payments','businessCurrency'].includes(k)?undefined:v));
 const before=JSON.stringify(m);A.deepEqual(financial(Engine.build(normalized.model)),financial(Engine.build(expected)));
 A.deepEqual(P.normalizePortfolio(JSON.parse(before),valid),normalized);A.equal(JSON.stringify(m),before);
 sku.unitCost=35;A.equal(P.normalizePortfolio(m,valid).pending,true);
});
test('provider requests only the directed ISO pair and validates its rate/date/identity',async()=>{
 const row={base:'CNY',quote:'USD',rate:.14,date:'2026-01-02'};
 const q=await FX.quote('CNY','USD',async(url,options)=>{A.equal(url,'https://api.frankfurter.dev/v2/rate/cny/usd');A.equal(options.credentials,'omit');A.equal(options.referrerPolicy,'no-referrer');return{ok:true,json:async()=>row};});
 A.equal(q.rate,.14);A.equal(q.source,'frankfurter');
 for(const data of [{...row,base:'USD',quote:'CNY'},{...row,rate:'0.14'},{...row,rate:0},{...row,date:'2026-02-30'},{...row,date:'2999-01-01'}])await A.rejects(FX.quote('CNY','USD',async()=>({ok:true,json:async()=>data})));
 await A.rejects(FX.quote('CNY','USD',async()=>({ok:false})));await A.rejects(FX.quote('CNY','USD',async()=>{throw Error('offline')}));
});
