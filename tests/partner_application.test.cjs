'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const M=require('../nomad360_partner_application_model.js'),T=require('../nomad360_partner_transport.js');
const good={company:'Example',activity:'Consulting',intendedUse:'Embed a calculator',employees:'2',clientSegment:'small',fullName:'Test Partner',role:'Owner',email:'partner@example.org',phoneMessenger:'@example',website:'https://example.org',consentProcessing:true,consentPublicProfile:false};
test('application payload is an explicit allowlist, separate consents and versioned receipt metadata',()=>{
 const input={...good,portfolio:{private:true},password:'private'},before=JSON.stringify(input);
 const p=M.payload(input,{applicationId:'12345678-1234-1234-1234-123456789012',language:'en',consentedAt:'2026-10-23T10:00:00.000Z'});
 A.equal(JSON.stringify(input),before);A.equal(p.consent_processing,true);A.equal(p.consent_public_profile,false);A.equal(p.consent_version,M.consentVersion);
 A.equal('portfolio' in p,false);A.equal('password' in p,false);A.equal(p._subject,'Nomad360 partnership application');
 A.equal(M.validate({...good,consentPublicProfile:true}).consentPublicProfile,true);
});
test('required fields, employee count, segments, URL, lengths and consent cannot be bypassed',()=>{
 for(const key of ['activity','intendedUse','employees','clientSegment','fullName','email'])A.equal(M.validate({...good,[key]:''}).errors[key],'required',key);
 for(const value of ['-1','1.5','1e2','1000001','01'])A.equal(M.validate({...good,employees:value}).errors.employees,'invalid');
 for(const value of ['javascript:alert(1)','https://user:pass@example.org'])A.equal(M.validate({...good,website:value}).errors.website,'invalid');
 A.equal(M.validate({...good,consentProcessing:false}).errors.consentProcessing,'required');
 A.equal(M.validate({...good,activity:'x'.repeat(1501)}).errors.activity,'invalid');A.equal(M.validate({...good,clientSegment:'unknown'}).errors.clientSegment,'invalid');
 A.equal(M.validate({...good,company:'',website:'',role:'',phoneMessenger:''}).valid,true);
});
test('partner endpoint cannot be the bug handler or arbitrary URL; no request on invalid config',async()=>{
 let called=false;
 for(const url of ['https://formspree.io/f/mwlvadod','https://evil.example','http://formspree.io/f/test','https://formspree.io/f/test?email=x']){
  A.equal(T.supportedEndpoint(url),false);A.deepEqual(await T.send(url,{}, {fetch(){called=true;}}),{ok:false,error:'unavailable'});
 }A.equal(called,false);
});
test('only explicit backend acceptance is success; rejected/rate-limit/offline outcomes preserve errors',async()=>{
 for(const [status,body,expected] of [[200,{ok:true},{ok:true}],[200,{},{ok:false,error:'failure'}],[202,{ok:false},{ok:false,error:'failure'}],[429,{},{ok:false,error:'tooMany'}],[422,{},{ok:false,error:'rejected'}]]){
  let sent;const result=await T.send('https://formspree.io/f/partnerTest',{application_id:'id'}, {fetch:async(url,options)=>{sent=options;return {ok:status>=200&&status<300,status,json:async()=>body};}});
  A.deepEqual(result,expected);A.equal(sent.credentials,'omit');A.equal(sent.referrerPolicy,'strict-origin-when-cross-origin');A.deepEqual(JSON.parse(sent.body),{application_id:'id'});
 }
 A.deepEqual(await T.send('https://formspree.io/f/partnerTest',{}, {fetch:async()=>{throw Error('offline')}}),{ok:false,error:'failure'});
});
