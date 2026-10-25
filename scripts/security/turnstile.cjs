'use strict';
// SEC-01: private runtime helper. Never bundle this module or its secret with browser assets.
// A Turnstile widget without this server-side Siteverify step is not a security gate.
const SITEVERIFY='https://challenges.cloudflare.com/turnstile/v0/siteverify';
function createTurnstileVerifier({secret,hostname,fetcher=globalThis.fetch,timeoutMs=3500}={}){
 if(typeof secret!=='string'||secret.length<10||typeof hostname!=='string'||!hostname||
    !/^[a-z0-9.-]+$/i.test(hostname)||typeof fetcher!=='function'||
    !Number.isInteger(timeoutMs)||timeoutMs<500||timeoutMs>10000)
  throw new Error('SEC-01 requires a private Siteverify secret, expected hostname and bounded fetch');
 return async function verify({token,action,remoteIp}={}){
  if(typeof token!=='string'||token.length<1||token.length>2048||
     typeof action!=='string'||!/^[a-z0-9_-]{1,32}$/.test(action)||
     (remoteIp!==undefined&&(typeof remoteIp!=='string'||remoteIp.length>45)))return false;
  const fields=new URLSearchParams({secret,response:token});
  if(remoteIp)fields.set('remoteip',remoteIp);
  try{
   const response=await fetcher(SITEVERIFY,{
    method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','accept':'application/json'},
    body:fields.toString(),redirect:'error',signal:AbortSignal.timeout(timeoutMs)
   });
   if(response.status!==200)return false;
   const length=Number(response.headers?.get?.('content-length'));
   if(Number.isFinite(length)&&length>4096)return false;
   const raw=await response.text();
   if(raw.length>4096)return false;
   const result=JSON.parse(raw);
   return result?.success===true&&result.hostname===hostname&&result.action===action;
  }catch(_){return false;} // No soft-fail, no token/secret/response logging.
 };
}
module.exports={SITEVERIFY,createTurnstileVerifier};
