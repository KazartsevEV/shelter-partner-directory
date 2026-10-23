/* Partner application data contract. No calculator, storage, DOM or network access. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Nomad360PartnerApplicationModel=Object.freeze(api);})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const consentVersion='2026-10-23-v1';
const fields=Object.freeze({company:{max:200},activity:{required:true,max:1500},intendedUse:{required:true,max:1500},employees:{required:true,max:7},clientSegment:{required:true,max:30},fullName:{required:true,max:200},role:{max:160},email:{required:true,max:254},phoneMessenger:{max:160},website:{max:500}});
const segments=Object.freeze(['micro','small','medium','large','mixed','individuals']);
function validate(input){
 const values={},errors={};
 for(const [key,rule] of Object.entries(fields)){
  const raw=input[key];const value=typeof raw==='string'?raw.trim():'';values[key]=value;
  if(rule.required&&!value)errors[key]='required';
  else if(value.length>rule.max||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value))errors[key]='invalid';
 }
 if(values.employees&&!/^(0|[1-9]\d{0,5}|1000000)$/.test(values.employees))errors.employees='invalid';
 if(values.clientSegment&&!segments.includes(values.clientSegment))errors.clientSegment='invalid';
 if(values.email&&!/^[^\s@]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(values.email))errors.email='invalid';
 if(values.website){try{const u=new URL(values.website);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)errors.website='invalid';}catch(_){errors.website='invalid';}}
 if(input.consentProcessing!==true)errors.consentProcessing='required';
 return {valid:Object.keys(errors).length===0,values,errors,consentProcessing:input.consentProcessing===true,consentPublicProfile:input.consentPublicProfile===true};
}
function payload(input,{applicationId,language,consentedAt}){
 const result=validate(input);if(!result.valid)throw Error('Invalid partner application');
 if(!/^[a-f0-9-]{36}$/i.test(applicationId)||!['en','ru','kk'].includes(language)||!Number.isFinite(Date.parse(consentedAt)))throw Error('Invalid application metadata');
 return {...result.values,consent_processing:true,consent_public_profile:result.consentPublicProfile,consent_version:consentVersion,
  consented_at:consentedAt,application_id:applicationId,interface_language:language,_subject:'Nomad360 partnership application'};
}
return {fields,segments,consentVersion,validate,payload};
});
