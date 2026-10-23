/* Explicit partner form transport. Separate from the bug reporting endpoint. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Nomad360PartnerTransport=Object.freeze(api);})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const bugEndpoint='https://formspree.io/f/mwlvadod';
function supportedEndpoint(value){return typeof value==='string'&&/^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(value)&&value!==bugEndpoint;}
async function send(endpoint,payload,{fetch:fetcher,signal}){
 if(!supportedEndpoint(endpoint))return {ok:false,error:'unavailable'};
 try{
  const response=await fetcher(endpoint,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'omit',referrerPolicy:'strict-origin-when-cross-origin',signal});
  let receipt=null;try{receipt=await response.json();}catch(_){}
  if(response.ok&&receipt?.ok===true)return {ok:true};
  return {ok:false,error:response.status===429?'tooMany':response.status===422?'rejected':'failure'};
 }catch(_){return {ok:false,error:'failure'};}
}
return {supportedEndpoint,send};
});
