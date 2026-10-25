'use strict';
const crypto=require('node:crypto');
// Node-redis-compatible adapter. The supplied Redis client MUST use a durable,
// non-evicting shared deployment; this file creates no connections or credentials.
// Lua executes atomically on the Redis primary, using Redis PX TTLs, not process RAM.
const RATE_LUA=`
local n = tonumber(redis.call('GET',KEYS[1]) or '0')
local lim = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
if n >= lim then
 local remaining = redis.call('PTTL',KEYS[1])
 return {0,math.max(1,remaining)}
end
if n == 0 then redis.call('SET',KEYS[1],'1','PX',ttl)
else redis.call('INCR',KEYS[1]) end
return {1,0}
`;
const RESERVE_LUA=`
if redis.call('EXISTS',KEYS[2]) == 1 then return {0,1,0} end
local n = tonumber(redis.call('GET',KEYS[1]) or '0')
local lim = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local dedup = tonumber(ARGV[3])
if n >= lim then
 local remaining = redis.call('PTTL',KEYS[1])
 return {0,0,math.max(1,remaining)}
end
if n == 0 then redis.call('SET',KEYS[1],'1','PX',ttl)
else redis.call('INCR',KEYS[1]) end
redis.call('SET',KEYS[2],'1','PX',dedup)
return {1,0,0}
`;
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
function createRedisStore({client,dedupMs=30*86400000}={}){
 if(typeof client?.eval!=='function'||!Number.isSafeInteger(dedupMs)||dedupMs<86400000||
    dedupMs>365*86400000)throw Error('SEC-01 requires a shared Redis eval client and durable dedup period');
 function args(key,limit,windowMs){
  if(typeof key!=='string'||!/^sec01:[a-z0-9:_-]{1,150}$/i.test(key)||
     !Number.isSafeInteger(limit)||limit<1||limit>100000||
     !Number.isSafeInteger(windowMs)||windowMs<1000||windowMs>365*86400000)
   throw Error('Invalid security counter settings');
  const tag=digest(key);return {key:'sec01:{'+tag+'}:counter',limit,windowMs,tag};
 }
 async function consume({key,limit,windowMs}){
  const a=args(key,limit,windowMs);
  const result=await client.eval(RATE_LUA,{keys:[a.key],arguments:[String(limit),String(windowMs)]});
  if(!Array.isArray(result)||result.length!==2||![0,1].includes(Number(result[0])))
   throw Error('SEC-01 Redis limiter response invalid');
  return {allowed:Number(result[0])===1,retryAfterMs:Number(result[1])||0};
 }
 async function reserve({key,limit,windowMs,idempotencyKey}){
  const a=args(key,limit,windowMs);
  if(typeof idempotencyKey!=='string'||!/^[a-f0-9]{64}$/.test(idempotencyKey))throw Error('Invalid opaque reservation key');
  const result=await client.eval(RESERVE_LUA,{
   keys:[a.key,'sec01:{'+a.tag+'}:id:'+idempotencyKey],
   arguments:[String(limit),String(windowMs),String(Math.max(dedupMs,windowMs))]
  });
  if(!Array.isArray(result)||result.length!==3||![0,1].includes(Number(result[0]))||
     ![0,1].includes(Number(result[1])))throw Error('SEC-01 Redis reservation response invalid');
  return {allowed:Number(result[0])===1,duplicate:Number(result[1])===1,retryAfterMs:Number(result[2])||0};
 }
 return Object.freeze({consume,reserve});
}
module.exports={createRedisStore,RATE_LUA,RESERVE_LUA};
