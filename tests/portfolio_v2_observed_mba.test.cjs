const {test}=require('node:test');
const A=require('node:assert/strict');
const E=require('../portfolio_v2_observed_mba.js');
const sample=()=>{
 const baskets={1:['a','b'],2:['a','b','c'],3:['a','b','c'],
  4:['a','b'],5:['a'],6:['a'],7:['b'],8:['b'],9:['c'],10:['c']};
 let lines=['order_id,sku_id,quantity,date,status,channel'];
 for(const [id,skus]of Object.entries(baskets))for(const sku of skus)
  lines.push(id+','+sku+',1,2026-10-01,paid,web');
 lines.push('11,a,1,2026-10-01,refunded,web');
 lines.push('12,b,1,2026-10-01,cancelled,web');
 return lines.join('\n');
};
const close=(a,b)=>A.ok(Math.abs(a-b)<1e-10,a+' ≠ '+b);
test('observed MBA: count unique paid baskets, directional support/confidence/lift, never line count',()=>{
 const report=E.analyze(sample(),['a','b','c'],{minCount:2});
 A.equal(report.transactions,10);A.equal(report.excludedLines,2);
 A.equal(report.singles.a,6);A.equal(report.singles.b,6);A.equal(report.singles.c,4);
 const ab=report.pairs.find(x=>x.anchorSkuId==='a'&&x.items[0].skuId==='b');
 A.equal(ab.cooccurrence,4);A.equal(ab.baseCount,6);
 close(ab.support,.4);close(ab.confidence,4/6);close(ab.lift,(4/6)/.6);
 const tuple=report.tuples.find(x=>x.anchorSkuId==='a'&&x.items.some(y=>y.skuId==='b'));
 A.equal(tuple.cooccurrence,2);close(tuple.confidence,2/6);
 close(tuple.support,.2);close(tuple.lift,(2/6)/.2);
 A.equal(report.dateFrom,'2026-10-01');A.deepEqual(report.channels,['web']);
});
test('duplicate order lines do not manufacture new baskets or increase co-occurrence',()=>{
 const a=E.analyze(sample(),['a','b','c'],{minCount:2});
 const b=E.analyze(sample()+'\n1,a,9,2026-10-01,paid,web', ['a','b','c'],{minCount:2});
 A.deepEqual(b.singles,a.singles);
 A.deepEqual(b.pairs,a.pairs);
});
test('properly parse semicolon/quoted CSV, BOM, returned and cancelled lines',()=>{
 const data='\uFEFForder_id;sku_id;quantity;date;status;channel\n'+
  '1;"item; A";2;2026-10-01;paid;shop\n'+
  '1;B;1;2026-10-01;paid;shop\n'+
  '2;B;1;2026-10-02;completed;shop\n'+
  '2;"item; A";1;2026-10-02;completed;shop\n'+
  '3;B;1;2026-10-03;returned;shop';
 const o=E.analyze(data,['item; A','B'],{minCount:2});
 A.equal(o.transactions,2);A.equal(o.excludedLines,1);
 A.equal(o.pairs.length,2);close(o.pairs[0].support,1);
});
test('unmapped product ids, missing records, mixed channels/dates fail closed',()=>{
 A.throws(()=>E.analyze(sample(),['a','b']),/SKU отсутствуют/);
 A.throws(()=>E.analyze('order_id,sku_id\n1,a',['a']),/колонка/);
 A.throws(()=>E.analyze('order_id,sku_id,quantity,date,status\n1,a,1,2026-10-01,paid\n1,b,1,2026-10-02,paid',['a','b']),/разные даты/);
});
test('privacy and empirical context: returns aggregated rules but no customer/order ids',()=>{
 const x=E.analyze(sample(),['a','b','c'],{minCount:2});
 A.equal(JSON.stringify(x).includes('order_id'),false);
 A.equal(JSON.stringify(x).includes('2026-10-01,paid'),false);
 A.equal(x.warning.includes('причинного'),false); // Small sample receives separate sample warning
});
test('no meaningful MBA when transaction history is all refunds or impossible quantities',()=>{
 const csv='order_id,sku_id,quantity,date,status\n1,a,1,2026-10-01,refunded\n2,b,1,2026-10-02,cancelled';
 A.throws(()=>E.analyze(csv,['a','b']),/хотя бы два/);
 const invalid='order_id,sku_id,quantity,date,status\n1,a,-1,2026-10-01,paid\n2,b,1,2026-10-02,paid';
 A.throws(()=>E.analyze(invalid,['a','b']),/положительным/);
});
