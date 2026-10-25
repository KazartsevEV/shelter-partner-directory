'use strict';
// Build-time policy only. Production issuance is intentionally unsupported in v1.
const legacy=Object.freeze({schemaVersion:1,mode:'legacy',issuanceEnabled:false});
function normalize(input=legacy){
 if(!input||Object.getPrototypeOf(input)!==Object.prototype||
  Object.keys(input).some(key=>!['schemaVersion','mode','issuanceEnabled'].includes(key)))throw Error('Invalid release configuration');
 if(input.schemaVersion!==1||!['legacy','preview'].includes(input.mode)||input.issuanceEnabled!==false)
  throw Error('Release v1 supports legacy or preview only; live issuance must remain disabled');
 return Object.freeze({schemaVersion:1,mode:input.mode,issuanceEnabled:false});
}
module.exports={normalize,legacy};
