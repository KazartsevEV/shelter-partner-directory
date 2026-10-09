const {test}=require('node:test');
const A=require('node:assert/strict');
const M=require('../portfolio_v2_mba_observed.js');
const close=(x,y)=>A.ok(Math.abs(x-y)<1e-9,`${x} ≠ ${y}`);
const mk=(order_id,sku_id,date='2026-09-01',channel='web',more={})=>({
 order_id,sku_id,date,channel,quantity:1,unit_price:100,currency:'GEL',status:'completed',...more});
const rows=[
 mk('o1','a','2026-09-01','web',{buyer_id:'repeat'}),
 mk('o1','b'),
 mk('o2','a','2026-09-02','web',{buyer_id:'repeat'}),
 mk('o2','b','2026-09-02'),mk('o2','c','2026-09-02'),
 mk('o3','a','2026-09-03'),mk('o3','c','2026-09-03'),
 mk('o4','b','2026-09-04'),
 mk('o5','b','2026-09-05'),mk('o5','c','2026-09-05'),
 mk('o6','a','2026-09-06'),mk('o6','b','2026-09-06')];
const known=new Set(['a','b','c']);
test('empirical support, joint denominator, directed confidence and lift, no fabricated conversions',()=>{
 const dataset=M.read(JSON.stringify(rows));
 const result=M.analyze(dataset,known);
 A.equal(result.ready,true);A.equal(result.N,6);
 const r=result.rules.find(x=>x.antecedent.join('')==='a'&&x.consequent==='b');
 A.equal(r.antecedentCount,4);A.equal(r.consequentCount,5);A.equal(r.count,3);
 close(r.supportAntecedent,4/6);close(r.support,3/6);
 close(r.confidence,3/4);close(r.lift,(3/4)/(5/6));
 const inverse=result.rules.find(x=>x.antecedent.join('')==='b'&&x.consequent==='a');
 close(inverse.confidence,3/5);close(inverse.lift,(3/5)/(4/6));
 const tuple=result.rules.find(x=>x.antecedent.join(',')==='a,b'&&x.consequent==='c');
 A.equal(tuple.count,1);A.equal(tuple.antecedentCount,3);
 close(tuple.support,1/6);close(tuple.confidence,1/3);close(tuple.lift,2/3);
 A.deepEqual(result.period,{from:'2026-09-01',to:'2026-09-06'});
 A.deepEqual(result.channels,['web']);
});
test('CSV quoted separators and line_id duplicates, partial returns, canceled and refunds never create baskets',()=>{
 const csv=[
 'order_id,date,sku_id,quantity,unit_price,currency,channel,status,line_id,returned_quantity',
 'q1,2026-09-01,"A, blue",3,10,GEL,web,completed,L1,1',
 'q1,2026-09-01,"A, blue",3,10,GEL,web,completed,L1,1',
 'q1,2026-09-01,b,1,15,GEL,web,completed,L2,0',
 'q2,2026-09-02,b,1,15,GEL,web,canceled,L3,0',
 'q3,2026-09-02,b,1,15,GEL,web,returned,L4,0',
 'q4,2026-09-02,b,1,15,GEL,web,completed,L5,1'
 ].join('\r\n');
 const source=M.read(csv);
 A.equal(source.rawLines,6);A.equal(source.deduplicated,1);
 const blocked=M.analyze(source,new Set(['a','b']));
 A.equal(blocked.ready,false);A.deepEqual(blocked.unresolved,['A, blue']);
 const report=M.analyze(source,new Set(['a','b']),{'A, blue':'a'});
 A.equal(report.ready,true);A.equal(report.N,1);
 A.equal(report.baskets[0].items.a,2);
 A.equal(report.baskets[0].items.b,1);
 A.equal(report.rules.find(r=>r.antecedent[0]==='a'&&r.consequent==='b').count,1);
});
test('same buyer placing multiple paid orders adds multiple denominators, line repeats aggregate legitimate quantities',()=>{
 const list=[mk('one','a','2026-09-01','web',{buyer_id:'same'}),
  mk('two','a','2026-09-02','web',{buyer_id:'same'}),
  mk('two','a','2026-09-02','web',{buyer_id:'same'}),
  mk('two','b','2026-09-02')];
 const r=M.analyze(M.read(JSON.stringify(list)),new Set(['a','b']));
 A.equal(r.N,2);A.equal(r.baskets[1].items.a,2);
 A.equal(r.rules.find(x=>x.antecedent[0]==='a'&&x.consequent==='b').confidence,.5);
});
test('channel/date filtering gives one precise observational denominator per scope',()=>{
 const list=[...rows,mk('o7','a','2026-09-07','offline'),mk('o7','b','2026-09-07','offline')];
 const r=M.analyze(M.read(JSON.stringify(list)),known,{},{
 channel:'web',from:'2026-09-02',to:'2026-09-04'});
 A.equal(r.N,3);
 A.equal(r.rules.find(x=>x.antecedent.join('')==='a'&&x.consequent==='b').N,3);
 A.deepEqual(r.channels,['web']);
});
test('a missing file, corrupt dates, negative quantity, excessive returns, or contradictory line ID fail closed',()=>{
 A.throws(()=>M.read(''),/непустой/);
 const cases=[
 [mk('bad','a','2026-02-30')],
 [mk('bad','a','2026-09-01','web',{quantity:-1})],
 [mk('bad','a','2026-09-01','web',{returned_quantity:2})],
 [mk('bad','a','2026-09-01','web',{status:'unknown'})],
 [mk('one','a','2026-09-01','web',{line_id:'1'}),mk('two','a','2026-09-01','web',{line_id:'1'})]
 ];
 for(const lines of cases)A.throws(()=>M.read(JSON.stringify(lines)));
 A.throws(()=>M.read('order_id,date\nabc,2026-09-01'),/отсутствует столбец/);
});
test('no purchases and unmapped unknown IDs never produce invented rules',()=>{
 const empty=M.analyze(M.read('[]'),known);
 A.equal(empty.N,0);A.deepEqual(empty.rules,[]);
 const unresolved=M.analyze(M.read(JSON.stringify([mk('o','outside')])),known);
 A.equal(unresolved.ready,false);A.equal(unresolved.rules.length,0);
 A.deepEqual(unresolved.unresolved,['outside']);
});
test('conflicting currency/channel/date on one order fail rather than silently mix currencies',()=>{
 const bad=M.analyze(M.read(JSON.stringify([mk('o','a'),mk('o','b','2026-09-01','other')])),known);
 A.equal(bad.ready,false);A.ok(bad.errors.some(x=>x.includes('разные даты')));
});
