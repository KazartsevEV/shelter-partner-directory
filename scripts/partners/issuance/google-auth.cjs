'use strict';
// Private server credentials only. Does not start login or access chat connector tokens.
function createTokenProvider({credentials,fetch:request=globalThis.fetch,now=Date.now}){
 if(!credentials||credentials.type!=='authorized_user'||
    !['client_id','client_secret','refresh_token'].every(k=>typeof credentials[k]==='string'&&credentials[k]&&credentials[k]===credentials[k].trim()&&!/[\r\n]/.test(credentials[k]))||
    credentials.token_uri!==undefined&&credentials.token_uri!=='https://oauth2.googleapis.com/token')throw Error('External Google authorized-user credentials are required');
 const {client_id,client_secret,refresh_token}=credentials;
 let cached=null,refreshAfter=0,inFlight=null;
 async function refresh(){
  try{
   const response=await request('https://oauth2.googleapis.com/token',{method:'POST',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',client_id,client_secret,refresh_token}).toString()});
   if(!response.ok)throw Error();const result=await response.json();
   if(typeof result.access_token!=='string'||!result.access_token||/[\r\n]/.test(result.access_token)||result.token_type?.toLowerCase()!=='bearer'||!Number.isSafeInteger(result.expires_in)||result.expires_in<=0||result.expires_in>86400)throw Error();
   const lifetime=result.expires_in*1000;refreshAfter=now()+lifetime-Math.min(60000,lifetime/4);cached=result.access_token;return cached;
  }catch(_){const error=Error('Google authorization could not be refreshed');error.definitelyNotAccepted=true;throw error;}
 }
 return async function getAccessToken(){
  if(cached&&now()<refreshAfter)return cached;
  if(!inFlight)inFlight=refresh().finally(()=>{inFlight=null;});
  return inFlight;
 };
}
function createServiceAccountTokenProvider({keyFilename,authFactory}){
 if(typeof keyFilename!=='string'||!keyFilename)throw Error('Select an existing private Google credential file');
 const auth=authFactory?authFactory({keyFilename,scopes:['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/drive.metadata.readonly']}):new (require('google-auth-library').GoogleAuth)({keyFilename,scopes:['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/drive.metadata.readonly']});
 let client;
 return async()=>{
  try{
   client=client||await auth.getClient();const result=await client.getAccessToken();
   if(typeof result?.token!=='string'||!result.token||/[\r\n]/.test(result.token))throw Error();
   return result.token;
  }catch(_){const error=Error('Existing Google service identity is unavailable');error.definitelyNotAccepted=true;throw error;}
 };
}
module.exports={createTokenProvider,createServiceAccountTokenProvider};
