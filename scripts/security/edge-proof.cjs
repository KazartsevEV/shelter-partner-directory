'use strict';
const crypto=require('node:crypto');
// Defense-in-depth secret injected by a trusted edge or mTLS reverse proxy.
// Strip any inbound client-supplied proof header at the edge. This does NOT
// substitute for mTLS/Tunnel/IP ACL or upstream DDoS filtering.
function verifyEdgeProof(presented,secret){
 if(typeof secret!=='string'||Buffer.byteLength(secret,'utf8')<32)
  throw new Error('SEC-01 edge secret must have at least 32 random bytes');
 if(typeof presented!=='string'||presented.length>512)return false;
 const actual=crypto.createHash('sha256').update(presented).digest();
 const expected=crypto.createHash('sha256').update(secret).digest();
 return crypto.timingSafeEqual(actual,expected);
}
function pseudonymousKey(secret,operation,value){
 if(typeof secret!=='string'||Buffer.byteLength(secret,'utf8')<32||
   typeof operation!=='string'||typeof value!=='string')
  throw new Error('SEC-01 pseudonymization config invalid');
 return crypto.createHmac('sha256',secret).update(operation+'\0'+value).digest('hex');
}
module.exports={verifyEdgeProof,pseudonymousKey};
