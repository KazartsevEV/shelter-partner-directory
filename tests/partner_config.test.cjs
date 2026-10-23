'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const {normalize,canonical,sha256}=require('../scripts/partners/config.cjs');
const sample=require('./fixtures/partner-build/example.json');
const copy=()=>JSON.parse(JSON.stringify(sample));
test('versioned config has stable bytes, immutable brand/contact/profile and no input mutation',()=>{
 const input=copy(),before=JSON.stringify(input),config=normalize(input);
 A.equal(JSON.stringify(input),before);A.equal(config.brand.name,'Nomad360 lite');
 A.equal(config.contacts.email,'nomad260393@gmail.com');A.deepEqual(config.capabilities,{v1:true,v2:true,excel:true,pdf:true});
 A.ok(Object.isFrozen(config.partner));A.ok(Object.isFrozen(config.capabilities));
 A.equal(canonical(input),canonical(Object.fromEntries(Object.entries(input).reverse())));
 A.equal(sha256(canonical(input)),sha256(canonical(copy())));
});
test('unsupported schemas, formulas, private fields, arbitrary options and branding are rejected',()=>{
 for(const key of ['formulas','taxRate','password','emailToken','brand','features','contacts','capabilities']){
  const input=copy();input[key]='override';A.throws(()=>normalize(input),/unsupported key/);
 }
 for(const version of [0,2,'1',null]){const input=copy();input.schemaVersion=version;A.throws(()=>normalize(input),/schemaVersion/);}
 for(const profile of ['white-label','partial',null]){const input=copy();input.profile=profile;A.throws(()=>normalize(input),/profile/);}
 const input=copy();input.partner.phone='private application data';A.throws(()=>normalize(input),/unsupported key/);
 A.throws(()=>normalize(JSON.parse('{"__proto__":{}}')),/unsupported key/);
});
test('paths, invalid versions, script URLs, credentialed origins and unsafe contact input are rejected',()=>{
 const bad=[['packageId','../private'],['packageId','a/b'],['packageVersion','01.2.3'],['packageVersion','1.0'],['packageVersion','latest']];
 for(const [key,value] of bad){const input=copy();input[key]=value;A.throws(()=>normalize(input));}
 for(const origin of ['http://advisory.example','https://u:p@advisory.example','https://advisory.example/path','https://advisory.example/','https://advisory.example?q=1','javascript:alert(1)']){
  const input=copy();input.deployment.origin=origin;A.throws(()=>normalize(input));
 }
 const input=copy();input.partner.contactEmail='a@example.org\nBcc: x@evil.example';A.throws(()=>normalize(input));
 input.partner.contactEmail='partners@advisory.example';input.partner.displayName='<script>not executable</script>';
 A.equal(normalize(input).partner.displayName,input.partner.displayName); // Text, escaped by the package serializer.
});
