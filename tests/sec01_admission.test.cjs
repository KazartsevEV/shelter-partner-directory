'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createAdmission}=require('../scripts/security/admission.cjs');
const {createTurnstileVerifier,SITEVERIFY}=require('../scripts/security/turnstile.cjs');
const {verifyEdgeProof,pseudonymousKey}=require('../scripts/security/edge-proof.cjs');
const {POLICY}=require('../scripts/security/policy.cjs');
const edgeSecret='e'.repeat(40),hashSecret='h'.repeat(40),origin='https://app.nomad.example';
const baseReq={method:'POST',bodyBytes:200,edgeProof:edgeSecret,origin,turnstileToken:'client-token'};
const ctx={trustedClientIp:'203.0.113.9',operationId:'partner:sample:a123456789',operatorAuthenticated:false};
class AtomicFixture{
 constructor(){this.counts=new Map();this.reservations=new Set();this.calls=[];this.fail=false;}
 async consume({key,limit,windowMs,nowMs}){
  if(this.fail)throw Error('backend offline');
  this.calls.push({type:'consume',key});
  const bucket=key+'@'+Math.floor(nowMs/windowMs),next=(this.counts.get(bucket)||0)+1;
  if(next>limit)return {allowed:false,retryAfterMs:windowMs-(nowMs%windowMs)};
  this.counts.set(bucket,next);return {allowed:true};
 }
 async reserve({key,limit,windowMs,nowMs,idempotencyKey}){
  if(this.fail)throw Error('backend offline');
  this.calls.push({type:'reserve',key});
  const idem=key+'#'+idempotencyKey;if(this.reservations.has(idem))return {allowed:false,duplicate:true};
  const bucket=key+'@'+Math.floor(nowMs/windowMs),next=(this.counts.get(bucket)||0)+1;
  if(next>limit)return {allowed:false,retryAfterMs:windowMs-(nowMs%windowMs)};
  this.counts.set(bucket,next);this.reservations.add(idem);return {allowed:true};
 }
}
function setup({enabled=true,turnstile=async()=>true,store=new AtomicFixture(),now=()=>1000000000}={}){
 return {gate:createAdmission({edgeSecret,hashSecret,publicOrigin:origin,turnstile,store,now,enabled}),store};
}
const query=(gate,operation='register',req={},context={})=>gate.admit({
 operation,request:{...baseReq,...req},context:{...ctx,...context}});
test('SEC-01 refuses invalid security wiring and is disabled by default',async()=>{
 const state=new AtomicFixture();
 assert.throws(()=>createAdmission({edgeSecret:'short',hashSecret,publicOrigin:origin,turnstile:async()=>true,store:state}));
 const gate=createAdmission({edgeSecret,hashSecret,publicOrigin:origin,turnstile:async()=>true,store:state});
 assert.deepEqual((await query(gate)).status,503);assert.equal(state.calls.length,0);
});
test('trusted edge proof is constant time and pseudonymous keys exclude raw IP',()=>{
 assert.equal(verifyEdgeProof(edgeSecret,edgeSecret),true);
 assert.equal(verifyEdgeProof('x'.repeat(40),edgeSecret),false);
 assert.equal(verifyEdgeProof('',edgeSecret),false);
 const pseudonym=pseudonymousKey(hashSecret,'ip',ctx.trustedClientIp);
 assert.match(pseudonym,/^[a-f0-9]{64}$/);assert.ok(!pseudonym.includes(ctx.trustedClientIp));
 assert.notEqual(pseudonym,pseudonymousKey(hashSecret,'ip','198.51.100.7'));
});
test('rejects spoofed edge proof, user forwarded IP, method, payload and wrong origin before any limiter',async()=>{
 const {gate,store}=setup();
 for(const [req,context,status]of [
   [{edgeProof:'fake','cf-connecting-ip':'1.2.3.4'}, {},403],
   [{method:'GET'}, {},405],
   [{bodyBytes:20000}, {},413],
   [{origin:'https://evil.nomad.example'}, {},403],
   [{origin:undefined}, {},403],
   [{}, {trustedClientIp:'1.2.3.4, 8.8.8.8'},503]
 ]){assert.equal((await query(gate,'register',req,context)).status,status);}
 assert.equal(store.calls.length,0);
 // The client-supplied forwarded headers do not establish actor identity.
 assert.equal((await query(gate,'register',{'x-forwarded-for':'8.8.8.8',headers:{'cf-connecting-ip':'8.8.8.8'}})).ok,true);
 assert.equal(store.calls[1].key.includes('8.8.8.8'),false);
});
test('public route is gated by server side action-bound Turnstile and does not consume budget on failure',async()=>{
 let checks=[];
 const store=new AtomicFixture(),{gate}=setup({store,turnstile:async v=>(checks.push(v),false)});
 const reply=await query(gate);
 assert.equal(reply.ok,false);assert.equal(reply.status,403);assert.equal(reply.code,'challenge_failed');
 assert.deepEqual(checks,[{token:'client-token',action:'partner_register',remoteIp:'203.0.113.9'}]);
 assert.equal(store.calls.filter(x=>x.type==='reserve').length,0);
});
test('per-actor atomic limit rate-restricts the seventh registration and returns Retry-After',async()=>{
 const {gate}=setup();
 for(let i=0;i<POLICY.register.perActor;i++){
  const reply=await query(gate,'register',{}, {operationId:'partner:sample:unique'+i});
  assert.equal(reply.ok,true,'accepted '+i);
 }
 const denied=await query(gate,'register',{headers:{'x-forwarded-for':'192.0.2.8'}},{operationId:'partner:sample:extra999'});
 assert.equal(denied.status,429);assert.match(denied.headers['retry-after'],/^\d+$/);
});
test('duplicate expensive reservation rejected before invoking any operator work',async()=>{
 let checks=0;
 const {gate,store}=setup({turnstile:async()=>(checks++,true)});
 const first=await query(gate,'register');assert.equal(first.ok,true);
 const duplicate=await query(gate,'register');assert.equal(duplicate.status,409);
 assert.equal(store.calls.filter(x=>x.type==='reserve').length,2);assert.equal(checks,2);
});
test('private ZIP preparation and delivery require an independently authenticated operator',async()=>{
 let siteverifyCalls=0;
 const {gate}=setup({turnstile:async()=>{siteverifyCalls++;return true;}});
 const unauth=await query(gate,'prepare_zip');
 assert.equal(unauth.status,403);assert.equal(unauth.code,'operator_required');
 const ok=await query(gate,'prepare_zip', {origin:undefined}, {operatorAuthenticated:true});
 assert.equal(ok.ok,true);assert.equal(siteverifyCalls,0);
 const delivery=await query(gate,'deliver_zip',{origin:undefined},{operatorAuthenticated:true,operationId:'partner:sample:deliver1'});
 assert.equal(delivery.ok,true);
});
test('budget missing ID, origin unavailability, storage failure and malformed storage responses fail closed',async()=>{
 const {gate,store}=setup();store.fail=true;
 assert.equal((await query(gate)).status,503);
 store.fail=false;
 assert.equal((await query(gate,'register',{}, {operationId:'x'})).status,503);
 const maliciousStore={async consume(){return {allowed:'true'};},async reserve(){return {allowed:true};}};
 assert.equal((await query(setup({store:maliciousStore}).gate)).status,503);
 const noClock=setup({now:()=>NaN});
 assert.equal((await query(noClock.gate)).status,503);
});
test('Siteverify validates exact hostname/action and rejects malformed, reused, timed out and oversized replies',async()=>{
 const passed={success:true,hostname:'app.nomad.example',action:'partner_register'};
 let requests=[];
 let reply={status:200,headers:{get:()=>null},text:async()=>JSON.stringify(passed)};
 const verify=createTurnstileVerifier({secret:'private-secret-12345',hostname:'app.nomad.example',
   fetcher:async(url,options)=>(requests.push({url,options}),reply)});
 assert.equal(await verify({token:'token123',action:'partner_register',remoteIp:'203.0.113.9'}),true);
 assert.equal(requests[0].url,SITEVERIFY);
 assert.equal(requests[0].options.redirect,'error');
 assert.equal(new URLSearchParams(requests[0].options.body).get('secret'),'private-secret-12345');
 assert.equal(new URLSearchParams(requests[0].options.body).get('response'),'token123');
 assert.equal(await verify({token:'x'.repeat(2049),action:'partner_register'}),false);
 for(const response of [
  {...passed,success:false},{...passed,hostname:'attacker.test'},{...passed,action:'partner_resend'},
  {success:false,'error-codes':['timeout-or-duplicate']}
 ]){
  reply={status:200,headers:{get:()=>null},text:async()=>JSON.stringify(response)};
  assert.equal(await verify({token:'stale',action:'partner_register'}),false);
 }
 reply={status:500,headers:{get:()=>null},text:async()=>JSON.stringify(passed)};
 assert.equal(await verify({token:'x',action:'partner_register'}),false);
 reply={status:200,headers:{get:()=> '5000'},text:async()=>JSON.stringify(passed)};
 assert.equal(await verify({token:'x',action:'partner_register'}),false);
 reply={status:200,headers:{get:()=>null},text:async()=>'not JSON'};
 assert.equal(await verify({token:'x',action:'partner_register'}),false);
 const timeout=createTurnstileVerifier({secret:'private-secret-12345',hostname:'app.nomad.example',
   fetcher:async()=>{throw Error('network failed');}});
 assert.equal(await timeout({token:'x',action:'partner_register'}),false);
});
test('global budget caps distinct users and preserves no-retry semantics',async()=>{
 const store=new AtomicFixture();const {gate}=setup({store});
 for(let i=0;i<POLICY.register.budget;i++){
  const reply=await query(gate,'register',{},{
   trustedClientIp:'198.51.'+Math.floor(i/200)+'.'+(i%200+1),
   operationId:'partner:distinct:uuid'+String(i).padStart(6,'0')});
  assert.equal(reply.status,200,'budget position '+i);
 }
 const reply=await query(gate,'register',{},{
  trustedClientIp:'2001:db8::1',operationId:'partner:distinct:last99'});
 assert.equal(reply.status,429);assert.equal(reply.code,'budget_exhausted');
});
