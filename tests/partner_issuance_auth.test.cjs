'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const {createTokenProvider,createServiceAccountTokenProvider}=require('../scripts/partners/issuance/google-auth.cjs');
const credentials={type:'authorized_user',client_id:'example.apps.googleusercontent.com',client_secret:'fixture-client-secret',refresh_token:'fixture-refresh-token'};
test('OAuth refresh is cached, renewed before expiry and shared by concurrent callers',async()=>{
 let time=0,calls=0;const seen=[];
 const provider=createTokenProvider({credentials,now:()=>time,fetch:async(url,options)=>{
  calls++;seen.push({url,options});await new Promise(resolve=>setTimeout(resolve,10));
  return {ok:true,json:async()=>({access_token:'access-'+calls,token_type:'Bearer',expires_in:3600})};
 }});
 A.deepEqual(await Promise.all([provider(),provider(),provider()]),['access-1','access-1','access-1']);A.equal(calls,1);
 time=3539000;A.equal(await provider(),'access-1');time=3540000;A.equal(await provider(),'access-2');A.equal(calls,2);
 A.equal(seen[0].url,'https://oauth2.googleapis.com/token');A.equal(seen[0].options.redirect,'error');A.equal(seen[0].options.credentials,'omit');
 const body=new URLSearchParams(seen[0].options.body);A.equal(body.get('grant_type'),'refresh_token');A.equal(body.get('refresh_token'),credentials.refresh_token);
});
test('revoked or malformed Google authorization never falls back to an expired token or leaks provider text',async()=>{
 let time=0,calls=0;const provider=createTokenProvider({credentials,now:()=>time,fetch:async()=>++calls===1?{ok:true,json:async()=>({access_token:'expired-access',token_type:'Bearer',expires_in:120})}:{ok:false,json:async()=>({error:'fixture-sensitive-provider-content'})}});
 A.equal(await provider(),'expired-access');time=120000;
 await A.rejects(provider(),e=>e.definitelyNotAccepted===true&&!e.message.includes('fixture-sensitive'));
 const invalid=createTokenProvider({credentials,fetch:async()=>({ok:true,json:async()=>({access_token:'token',token_type:'Bearer',expires_in:0})})});await A.rejects(invalid(),/could not be refreshed/);
});
test('Google token endpoint and credentials cannot redirect private refresh data to another host',()=>{
 A.throws(()=>createTokenProvider({credentials:{...credentials,token_uri:'https://evil.example/token'}}),/credentials/);
 A.throws(()=>createTokenProvider({credentials:{...credentials,refresh_token:'token\r\ninjection'}}),/credentials/);
 A.throws(()=>createTokenProvider({credentials:{...credentials,type:'service_account'}}),/credentials/);
});
test('existing service-account credentials are selected through the Google SDK with Sheets-only scopes',async()=>{
 let selected,clients=0;const provider=createServiceAccountTokenProvider({keyFilename:'/private/existing-google.json',authFactory:options=>{
  selected=options;return {getClient:async()=>{clients++;return {getAccessToken:async()=>({token:'service-access'})};}};
 }});
 A.equal(await provider(),'service-access');A.equal(await provider(),'service-access');A.equal(clients,1);
 A.equal(selected.keyFilename,'/private/existing-google.json');A.deepEqual(selected.scopes,['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/drive.metadata.readonly']);
});
