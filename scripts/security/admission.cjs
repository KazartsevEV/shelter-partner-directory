'use strict';
const {isIP}=require('node:net');
const {verifyEdgeProof,pseudonymousKey}=require('./edge-proof.cjs');
const {POLICY}=require('./policy.cjs');
// Pure admission boundary for a FUTURE trusted HTTP intake/worker adapter.
// store.consume and store.reserve MUST be atomic/shared/durable across all workers.
// No in-memory limiter may be used in production. This code opens no HTTP port,
// does not call the partner operator and never reads client-controlled IP headers.
function createAdmission({edgeSecret,hashSecret,publicOrigin,turnstile,store,now=Date.now,enabled=false}={}){
 if(typeof edgeSecret!=='string'||Buffer.byteLength(edgeSecret)<32||
    typeof hashSecret!=='string'||Buffer.byteLength(hashSecret)<32||
    typeof publicOrigin!=='string'||!/^https:\/\/[^/\s?#]+$/.test(publicOrigin)||
    typeof turnstile!=='function'||typeof store?.consume!=='function'||
    typeof store?.reserve!=='function'||typeof now!=='function')
   throw new Error('SEC-01 requires edge authentication, HTTPS origin, Siteverify and atomic persistent store');
 const deny=(status,code,retryAfterSeconds)=>Object.freeze({
  ok:false,status,code,headers:Object.freeze({'cache-control':'no-store',
   ...(retryAfterSeconds?{'retry-after':String(retryAfterSeconds)}:{})})
 });
 const badBudget=(result)=>!result||result.allowed!==true;
 const retry=result=>Number.isFinite(result?.retryAfterMs)?Math.max(1,Math.ceil(result.retryAfterMs/1000)):60;
 async function admit({operation,request,context}={}){
  if(!enabled)return deny(503,'unavailable');
  const policy=POLICY[operation];
  if(!policy)return deny(404,'unknown_operation');
  if(request?.method!=='POST')return deny(405,'method_not_allowed');
  if(!Number.isSafeInteger(request?.bodyBytes)||request.bodyBytes<0||request.bodyBytes>policy.maxBody)
   return deny(413,'payload_too_large');
  if(!verifyEdgeProof(request?.edgeProof,edgeSecret))return deny(403,'untrusted_edge');
  // Client IP is derived only by the trusted network adapter, never from the request.
  if(!context||isIP(context.trustedClientIp)!==4&&isIP(context.trustedClientIp)!==6)
   return deny(503,'client_identity_unavailable');
  if(policy.public&&request.origin!==publicOrigin)return deny(403,'origin_denied');
  if(!policy.public&&context.operatorAuthenticated!==true)return deny(403,'operator_required');
  const nowMs=now();
  if(!Number.isSafeInteger(nowMs)||nowMs<0)return deny(503,'clock_unavailable');
  const actor=pseudonymousKey(hashSecret,'ip',context.trustedClientIp);
  try{
   const globalResult=await store.consume({key:'sec01:global:'+operation,
    limit:policy.global,windowMs:policy.globalWindowMs,nowMs});
   if(badBudget(globalResult))return deny(globalResult?.allowed===false?429:503,
    globalResult?.allowed===false?'rate_limited':'quota_unavailable',retry(globalResult));
   const actorResult=await store.consume({key:'sec01:actor:'+operation+':'+actor,
    limit:policy.perActor,windowMs:policy.perActorWindowMs,nowMs});
   if(badBudget(actorResult))return deny(actorResult?.allowed===false?429:503,
    actorResult?.allowed===false?'rate_limited':'quota_unavailable',retry(actorResult));
   if(policy.public){
    // Turnstile checked server-side on every public sensitive operation.
    if(await turnstile({token:request.turnstileToken,action:policy.action,
      remoteIp:context.trustedClientIp})!==true)return deny(403,'challenge_failed');
   }
   if(policy.budget){
    // operationId is assigned by trusted intake after validating the application's
    // identity. Reservations MUST persist across crashes, with atomic uniqueness.
    if(typeof context.operationId!=='string'||!/^[a-zA-Z0-9:_-]{16,160}$/.test(context.operationId))
      return deny(503,'idempotency_unavailable');
    const budget=await store.reserve({key:'sec01:budget:'+operation,
      limit:policy.budget,windowMs:policy.budgetWindowMs,nowMs,
      idempotencyKey:pseudonymousKey(hashSecret,operation,context.operationId)});
    if(budget?.duplicate===true)return deny(409,'already_reserved');
    if(badBudget(budget))return deny(budget?.allowed===false?429:503,
      budget?.allowed===false?'budget_exhausted':'quota_unavailable',retry(budget));
   }
   return Object.freeze({ok:true,status:200,code:'admitted',headers:Object.freeze({'cache-control':'no-store'})});
  }catch(_){return deny(503,'security_dependency_unavailable');}
 }
 return Object.freeze({admit});
}
module.exports={createAdmission};
