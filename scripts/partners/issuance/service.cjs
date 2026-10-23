'use strict';
const crypto=require('node:crypto');
const {normalize,sha256}=require('../config.cjs'),{encryptBundle,password}=require('./archive.cjs'),messages=require('./messages.cjs');
const applicationModel=require('../../../nomad360_partner_application_model.js');
const cleanConfig=c=>({schemaVersion:c.schemaVersion,packageId:c.packageId,packageVersion:c.packageVersion,partner:c.partner,deployment:c.deployment,profile:c.profile});
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
function createService({store,vault,mailer,build,now=()=>new Date()}){
 if(!store||!vault||typeof mailer?.send!=='function'||typeof build!=='function')throw Error('Explicit private storage, vault, mail and build ports are required');
 const stamp=()=>now().toISOString();
 async function claim(id,statuses,status,change={}){
  return store.transaction(id,r=>{if(!r||!statuses.includes(r.status))throw Error('Issuance transition is not allowed');return {...r,...change,status,updatedAt:stamp()};});
 }
 async function register(application,configInput){
  const checked=applicationModel.validate({...application,consentProcessing:application?.consent_processing,consentPublicProfile:application?.consent_public_profile}),config=normalize(configInput),id=application?.application_id;
  if(!checked.valid||application?.consent_version!==applicationModel.consentVersion||!Number.isFinite(Date.parse(application?.consented_at))||typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id)||!['en','ru','kk'].includes(application.interface_language))throw Error('Invalid reviewed partner application');
  const address=application.email.trim(),at=address.lastIndexOf('@'),canonicalEmail=address.slice(0,at)+'@'+address.slice(at+1).toLowerCase();
  const applicationSha256=digest(JSON.stringify({...checked.values,consentProcessing:true,consentPublicProfile:checked.consentPublicProfile,consentVersion:application.consent_version,consentedAt:application.consented_at,language:application.interface_language}));
  return store.transaction(id,previous=>{
   if(previous){if(previous.email!==canonicalEmail||previous.applicationSha256!==applicationSha256||JSON.stringify(previous.config)!==JSON.stringify(config))throw Error('Application identity/configuration conflict');return undefined;}
   const token=crypto.randomBytes(32).toString('base64url'),created=stamp();
   return {schemaVersion:1,id,email:canonicalEmail,language:application.interface_language,config,applicationSha256,
    processingConsent:true,publicProfileConsent:application.consent_public_profile===true,consentVersion:application.consent_version,consentedAt:application.consented_at,
    createdAt:created,updatedAt:created,status:'registered',verification:{generation:1,hash:digest(token),
     secret:vault.seal(token,id+':verification'),expiresAt:new Date(now().getTime()+86400000).toISOString(),attempts:0}};
  });
 }
 async function failure(id,error){
  await store.transaction(id,r=>({...r,status:error?.definitelyNotAccepted===true?'send_failed':'send_unknown',updatedAt:stamp()}));
 }
 async function sendVerification(id){
  const current=await store.read(id),operationId=id+':verification:v'+(current?.verification?.generation||1);
  const r=await claim(id,['registered'],'verification_sending',{lastOperation:operationId});
  try{
   const message=messages.verification(r,vault.open(r.verification.secret,id+':verification'));
   const ack=await mailer.send({...message,operationId});
   if(!ack?.accepted||typeof ack.id!=='string'||!ack.id)throw Error('Mail acknowledgement missing');
   await claim(id,['verification_sending'],'awaiting_email',{verificationMessageId:ack.id,verificationAcceptedAt:stamp()});
   return {status:'awaiting_email',messageId:ack.id};
  }catch(error){await failure(id,error);throw Error('Verification mail not confirmed; inspect private delivery state before retrying');}
 }
 async function renewVerification(id){
  return store.transaction(id,r=>{
   if(!r||!['verification_expired','verification_blocked'].includes(r.status))throw Error('Confirmation renewal is not allowed');
   const token=crypto.randomBytes(32).toString('base64url');
   return {...r,status:'registered',verificationMessageId:null,verificationAcceptedAt:null,updatedAt:stamp(),
    verification:{generation:(r.verification.generation||1)+1,hash:digest(token),secret:vault.seal(token,id+':verification'),expiresAt:new Date(now().getTime()+86400000).toISOString(),attempts:0}};
  });
 }
 async function verifyEmail(id,token){
  let valid=false;
  await store.transaction(id,r=>{
   if(r?.status!=='awaiting_email')throw Error('Email confirmation is not available');
   if(now().getTime()>=Date.parse(r.verification.expiresAt))return {...r,status:'verification_expired',updatedAt:stamp()};
   const candidate=digest(typeof token==='string'?token:''),matches=crypto.timingSafeEqual(Buffer.from(candidate,'hex'),Buffer.from(r.verification.hash,'hex'));
   if(!matches){const attempts=r.verification.attempts+1;return {...r,status:attempts>=5?'verification_blocked':r.status,verification:{...r.verification,attempts},updatedAt:stamp()};}
   valid=true;return {...r,status:'email_verified',emailVerifiedAt:stamp(),verification:{consumedAt:stamp()},updatedAt:stamp()};
  });
  if(!valid)throw Error('Invalid, expired or blocked confirmation code');
  return {status:'email_verified'};
 }
 async function approve(id,{origin,reviewReference}){
  if(typeof reviewReference!=='string'||!reviewReference.trim()||reviewReference.length>500)throw Error('A private operator review reference is required');
  const r=await store.read(id);if(origin!==r?.config.deployment.origin)throw Error('Reviewed deployment origin mismatch');
  await claim(id,['email_verified'],'approved',{domainReview:{origin,reference:reviewReference,reviewedAt:stamp()}});
  return {status:'approved'};
 }
 async function prepare(id){
  const r=await store.read(id);if(!r)throw Error('Unknown application');
  const secret=vault.seal(password(),id+':archive');
  const claimed=await claim(id,['approved'],'building',{archiveSecret:secret});
  try{
   const config=cleanConfig(claimed.config),bundle=await build(config);
   const archive=await encryptBundle(bundle,config,vault.open(secret,id+':archive'));
   const key=await store.putArchive(archive.sha256,archive.bytes);
   const metadata={key,filename:archive.filename,sha256:archive.sha256,bytes:archive.bytes.length,encryption:archive.encryption,sourceRevision:archive.sourceRevision,configSha256:archive.configSha256,htmlSha256:bundle.manifest.files[0].sha256};
   await claim(id,['building'],'prepared',{archive:metadata});return {status:'prepared',archive:metadata};
  }catch(_){await claim(id,['building'],'preparation_failed');throw Error('Package preparation failed; no delivery was attempted');}
 }
 async function sendArchive(id){
  const r=await claim(id,['prepared'],'archive_sending',{lastOperation:id+':archive:v1'});
  try{
   const bytes=await store.getArchive(r.archive.key);
   if(bytes.length!==r.archive.bytes||sha256(bytes)!==r.archive.sha256)throw Error('Archive changed before delivery');
   const message=messages.delivery(r,vault.open(r.archiveSecret,id+':archive'),bytes);
   const ack=await mailer.send({...message,operationId:id+':archive:v1'});
   if(!ack?.accepted||typeof ack.id!=='string'||!ack.id)throw Error('Mail acknowledgement missing');
   await claim(id,['archive_sending'],'delivery_accepted',{archiveMessageId:ack.id,archiveAcceptedAt:stamp()});
   return {status:'delivery_accepted',messageId:ack.id};
  }catch(error){await failure(id,error);throw Error('Archive mail not confirmed; inspect private delivery state before retrying');}
 }
 // Operator/provider reconciliation only. Never expose this as an unauthenticated website action.
 async function reconcile(id,{operationId,messageId,outcome}){
  if(!['accepted','not_accepted'].includes(outcome)||typeof messageId!=='string'||!messageId)throw Error('Provider evidence is required');
  const verification=typeof operationId==='string'&&operationId.startsWith(id+':verification:v')&&/^[1-9]\d*$/.test(operationId.slice((id+':verification:v').length)),archive=operationId===id+':archive:v1';
  if(!verification&&!archive)throw Error('Unknown mail operation');
  await store.transaction(id,r=>{
   if(!r||!['send_unknown','send_failed',verification?'verification_sending':'archive_sending'].includes(r.status))throw Error('No uncertain delivery to reconcile');
   if(r.lastOperation!==operationId)throw Error('Operation evidence mismatch');
   return {...r,status:outcome==='not_accepted'?(verification?'registered':'prepared'):(verification?'awaiting_email':'delivery_accepted'),
    ...(outcome==='accepted'?verification?{verificationMessageId:messageId,verificationAcceptedAt:stamp()}:{archiveMessageId:messageId,archiveAcceptedAt:stamp()}:{}),updatedAt:stamp()};
  });
 }
 return Object.freeze({register,sendVerification,renewVerification,verifyEmail,approve,prepare,sendArchive,reconcile});
}
module.exports={createService};
