'use strict';
// Build-time contract only. No runtime state, financial model or private data.
const crypto=require('node:crypto');
const PROFILE=Object.freeze({
 edition:'nomad360-partner',
 brand:Object.freeze({name:'Nomad360 lite',logo:'nomad360_wolf_open_circle.png'}),
 contacts:Object.freeze({email:'nomad260393@gmail.com',website:'https://kazartsevev.github.io/shelter-partner-directory/'}),
 capabilities:Object.freeze({v1:true,v2:true,excel:true,pdf:true})
});
function object(value,keys,label){
 if(!value||typeof value!=='object'||Array.isArray(value)||
  ![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw Error(label+': expected an object');
 for(const key of Object.keys(value))if(!keys.includes(key))throw Error(label+': unsupported key '+key);
}
function text(value,label,max=120){
 if(typeof value!=='string'||!value.trim()||value!==value.trim()||value.length>max||/[\x00-\x1f\x7f]/.test(value))throw Error(label+': invalid text');
 return value;
}
function identifier(value,label){text(value,label,80);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))throw Error(label+': use a lowercase slug');return value;}
function website(value,label,originOnly=false){
 text(value,label,500);let url;try{url=new URL(value);}catch(_){throw Error(label+': invalid URL');}
 if(url.protocol!=='https:'||url.username||url.password||url.hash||url.search||!url.hostname.includes('.')||url.hostname==='localhost')throw Error(label+': expected a public HTTPS URL');
 if(originOnly&&value!==url.origin)throw Error(label+': expected an HTTPS origin without a path');
 return value;
}
function normalize(input){
 object(input,['schemaVersion','packageId','packageVersion','partner','deployment','profile'],'config');
 if(input.schemaVersion!==1)throw Error('Unsupported config schemaVersion');
 const packageId=identifier(input.packageId,'packageId'),packageVersion=text(input.packageVersion,'packageVersion',40);
 if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(packageVersion))throw Error('packageVersion: expected a release version (x.y.z)');
 object(input.partner,['id','displayName','website','contactEmail'],'partner');
 const partner={id:identifier(input.partner.id,'partner.id'),displayName:text(input.partner.displayName,'partner.displayName'),website:website(input.partner.website,'partner.website')};
 if(input.partner.contactEmail!==undefined){
  const email=text(input.partner.contactEmail,'partner.contactEmail',254);
  if(!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(email))throw Error('partner.contactEmail: invalid email');
  partner.contactEmail=email;
 }
 object(input.deployment,['origin'],'deployment');
 if(input.profile!=='nomad360-complete')throw Error('Unsupported build profile; custom branding/features require a separately implemented profile');
 return Object.freeze({schemaVersion:1,packageId,packageVersion,
  partner:Object.freeze(partner),deployment:Object.freeze({origin:website(input.deployment.origin,'deployment.origin',true)}),
  profile:'nomad360-complete',edition:PROFILE.edition,brand:PROFILE.brand,contacts:PROFILE.contacts,capabilities:PROFILE.capabilities});
}
function canonical(input){return JSON.stringify(normalize(input));}
function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
module.exports={PROFILE,normalize,canonical,sha256};
