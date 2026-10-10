const {test}=require('node:test');
const A=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
async function load(){
 const code=fs.readFileSync(path.join(__dirname,'../analytics/worker.js'),'utf8');
 return (await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default;
}
function database(){
 const visitors=new Map(),hits=[];
 return {visitors,hits,prepare(query){
   return {bind(...values){
     return {
       async run(){
         if(query.startsWith('INSERT OR IGNORE')){
           if(!visitors.has(values[0]))visitors.set(values[0],values[1]);
         } else if(query.startsWith('INSERT INTO traffic_hits')){
           hits.push({ts:values[0],ip:values[1],session:values[2]});
         }
         return {};
       },
       async first(){
         const [start]=values;
         const rows=hits.filter(h=>h.ts>=start);
         const ips=new Set(rows.map(h=>h.ip));
         const newIps=new Set(rows.filter(h=>visitors.get(h.ip)>=start).map(h=>h.ip));
         const sessions=new Set(rows.map(h=>h.session));
         return {ips:ips.size,newIps:newIps.size,sessions:sessions.size};
       }
     };
   }};
 }};
}
test('edge counter: unique vs new IP, sessions, no raw IP storage',async()=>{
 const worker=await load(),DB=database(),env={
   DB,IP_HASH_SECRET:'test-secret-that-is-not-for-production',
   ALLOWED_ORIGIN:'https://kazartsevev.github.io'
 };
 const post=async(ip,id,origin=env.ALLOWED_ORIGIN)=>{
   const req=new Request('https://stats.example/visit',{
      method:'POST',headers:{Origin:origin,'CF-Connecting-IP':ip,'Content-Type':'application/json'},
      body:JSON.stringify({sessionId:id})
   });
   return worker.fetch(req,env);
 };
 const a='11111111-1111-4111-8111-111111111111',
   b='22222222-2222-4222-8222-222222222222',
   c='33333333-3333-4333-8333-333333333333';
 let first=await post('203.0.113.1',a);
 A.equal(first.status,200);
 A.equal((await first.json()).windows.last24h.ips,1);
 await post('203.0.113.1',b);
 let response=await post('203.0.113.2',c);
 const windows=(await response.json()).windows;
 for(const range of ['today','last24h','last7d'])
   A.deepEqual(windows[range],{ips:2,newIps:2,sessions:3});
 A.equal(DB.visitors.size,2);
 A.equal(DB.hits.length,3);
 A.ok([...DB.visitors.keys()].every(s=>!s.includes('203.0.113')));
 A.ok(DB.hits.every(h=>!h.session.includes('11111111')));
 A.equal((await post('198.51.100.8',a,'https://evil.example')).status,403);
 A.equal(DB.hits.length,3);
});
