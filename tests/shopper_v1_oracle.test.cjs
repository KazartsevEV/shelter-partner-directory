'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),{inputs:x,oracle,close}=require('./shopper_v1_oracle.cjs');
test('dated KZ batch budget and gross-payment fee independently reconcile',()=>{
 const o=oracle();A.equal(x.currency,'KZT');A.equal(Math.ceil(500/.97),516);
 close(o.materials,285141.6,'Materials and inbound');close(o.payroll,270250,'Planning payroll');close(o.production,405412.3711340206,'Production');close(o.unitCost,1426.1079422680414,'Allocated unit COGS');close(o.capital,2104359.368247423,'Capital including reserve');
 A.equal(o.forecast,150);A.equal(o.saleStart,37);A.equal(o.saleEnd,137);
 close(o.priceGross*.0095,o.priceExVat*.01102,'Same processing fee, two bases',1e-9);
 close(o.priceGross-o.priceExVat,o.priceExVat*.16,'VAT is passed through',1e-9);
});
test('daily stock schedule has 0 / 265 / 500 sales at months 1 / 3 / 12',()=>{
 const o=oracle();A.deepEqual(o.months.map(m=>m.sold),[0,115,150,150,85]);A.equal(o.months[0].remainingStock,500);A.equal(o.months[2].remainingStock,235);A.equal(o.months.at(-1).remainingStock,0);
 close(o.months.reduce((s,m)=>s+m.inflow-m.financedInflow,0),500*o.priceExVat,'Trading receipts exclude original owner funds');
 close(o.cumulativeEnd-o.capital,235125.1888776494,'Owner-funding excluded return');
 close(o.freeCumulativeEnd-o.capital,43819.79176424956,'Cash above original funding after protected reserve');
});
test('loan terms 1 / 3 / 6 / 12 change financing, not planned sales or inventory',()=>{
 for(const term of [1,3,6,12]){
  const o=oracle('credit',term);A.equal(o.months.reduce((n,m)=>n+m.sold,0),500);A.equal(o.months.filter(m=>m.principalRepaid>0).length,1);A.equal(o.months[term-1].principalRepaid,o.capital);
  close(o.months.reduce((n,m)=>n+m.interestPaid,0),o.capital*.2/12*term,'Interest count');
  A.equal(o.months.slice(5).every(m=>m.sold===0&&m.inflow===0),true);
  if(term===1)A.ok(o.months[0].freeCumulative<0,'Premature bullet loan requires extra funding');
 }
});
