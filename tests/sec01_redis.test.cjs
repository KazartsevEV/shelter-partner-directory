'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const {createRedisStore,RATE_LUA,RESERVE_LUA}=require('../scripts/security/redis-store.cjs');
const {createAdmission}=require('../scripts/security/admission.cjs');
const edgeSecret='e'.repeat(40),hashSecret='h'.repeat(40);
test('Redis atomic adapter never sends personal identifiers, secrets or browser data to Redis keys',async()=>{
 const calls=[],client={async eval(lua,arg){
  calls.push({lua,arg});return lua===RATE_LUA?[1,0]:[1,0,0];
 }};
 const db=createRedisStore({client});
 A.deepEqual(await db.consume({key:'sec01:actor:register:89abcdef',limit:6,windowMs:600000,nowMs:100}),{allowed:true,retryAfterMs:0});
 A.deepEqual(await db.reserve({key:'sec01:budget:register',limit:150,windowMs:86400000,nowMs:100,
  idempotencyKey:'a'.repeat(64)}),{allowed:true,duplicate:false,retryAfterMs:0});
 A.equal(calls.length,2);A.equal(calls[0].arg.keys.length,1);
 A.equal(calls[1].arg.keys.length,2);
 A.match(calls[1].arg.keys[0],/^sec01:\{[a-f0-9]{64}\}:counter$/);
 A.match(calls[1].arg.keys[1],/^sec01:\{[a-f0-9]{64}\}:id:[a-f0-9]{64}$/);
 A.equal(calls[1].arg.keys[0].split('}')[0],calls[1].arg.keys[1].split('}')[0]);
 A.equal(calls[1].arg.arguments[2],String(30*86400000));
 A.ok(!JSON.stringify(calls).includes('89abcdef'));
});
test('Redis reserve response accurately handles duplicate and quota exhaustion',async()=>{
 const client={async eval(lua){return lua===RATE_LUA?[0,60000]:[0,1,0];}};
 const db=createRedisStore({client});
 A.deepEqual(await db.consume({key:'sec01:global:register',limit:3,windowMs:60000}),{allowed:false,retryAfterMs:60000});
 A.deepEqual(await db.reserve({key:'sec01:budget:register',limit:2,windowMs:60000,
  idempotencyKey:'a'.repeat(64)}),{allowed:false,duplicate:true,retryAfterMs:0});
});
test('malformed Redis results, settings, missing client and forbidden non-opaque IDs fail closed',async()=>{
 A.throws(()=>createRedisStore({client:{}}));
 A.throws(()=>createRedisStore({client:{eval:async()=>[1,0]},dedupMs:100}));
 const db=createRedisStore({client:{eval:async()=>[]}});
 await A.rejects(()=>db.consume({key:'sec01:global:register',limit:1,windowMs:60000}));
 await A.rejects(()=>db.reserve({key:'sec01:budget:register',limit:1,windowMs:60000,idempotencyKey:'user@example.com'}));
 await A.rejects(()=>db.consume({key:'clientIp:rawvalue',limit:1,windowMs:60000}));
});
test('admission fails closed on shared Redis outage or non-atomic implementation response',async()=>{
 const fake={eval:async()=>{throw Error('Redis unavailable')}};
 const db=createRedisStore({client:fake});
 const gate=createAdmission({edgeSecret,hashSecret,publicOrigin:'https://app.nomad.example',
  turnstile:async()=>true,store:db,enabled:true,now:()=>123456});
 const result=await gate.admit({operation:'register',
  request:{method:'POST',bodyBytes:300,edgeProof:edgeSecret,origin:'https://app.nomad.example',turnstileToken:'t'},
  context:{trustedClientIp:'192.0.2.8',operationId:'partner:uuid-2026-123456'}});
 A.equal(result.status,503);A.equal(result.code,'security_dependency_unavailable');
});
test('Lua atomic contract uses Redis primary for counter, unique reservation and TTL',()=>{
 A.match(RATE_LUA,/redis\.call\('GET'/);A.match(RATE_LUA,/redis\.call\('INCR'/);
 A.match(RATE_LUA,/redis\.call\('SET'.*'PX'/);
 A.match(RESERVE_LUA,/redis\.call\('EXISTS',KEYS\[2\]\)/);
 A.match(RESERVE_LUA,/redis\.call\('SET',KEYS\[2\],'1','PX',dedup\)/);
});
