/* Nomad360 analytics Cloudflare Worker + D1.
 * Do not persist raw IP, user-agent, or financial data.
 * An HMAC of the edge IP lets us count new vs returning unique IPs.
 */
const defaultOrigin='https://kazartsevev.github.io';
const asJSON=(data,status=200,origin=defaultOrigin)=>new Response(JSON.stringify(data),{
 status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
 'Access-Control-Allow-Origin':origin,'Vary':'Origin','X-Content-Type-Options':'nosniff'}
});
const hash=async (secret,value)=>{
 const encoder=new TextEncoder();
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signed=await crypto.subtle.sign('HMAC',key,encoder.encode(value));
 return Array.from(new Uint8Array(signed),x=>x.toString(16).padStart(2,'0')).join('');
};
const table=(db,windowStart)=>db.prepare(
 'SELECT COUNT(DISTINCT h.ip_hash) AS ips,'+
 ' COUNT(DISTINCT CASE WHEN v.first_seen_ts >= ? THEN h.ip_hash END) AS newIps,'+
 ' COUNT(DISTINCT h.session_hash) AS sessions'+
 ' FROM traffic_hits h JOIN traffic_visitors v ON v.ip_hash=h.ip_hash WHERE h.ts >= ?'
).bind(windowStart,windowStart).first();
async function rollup(db,now){
 const today=Math.floor((now+4*3600)/86400)*86400-4*3600;
 const [todayData,last24h,last7d]=await Promise.all([
   table(db,today),table(db,now-86400),table(db,now-7*86400)
 ]);
 const clean=row=>({
   ips:Number(row?.ips)||0,newIps:Number(row?.newIps)||0,sessions:Number(row?.sessions)||0
 });
 return {timeZone:'Asia/Tbilisi',windows:{
   today:clean(todayData),last24h:clean(last24h),last7d:clean(last7d)
 }};
}
export default {
 async fetch(request,env){
   const allowed=env.ALLOWED_ORIGIN||defaultOrigin;
   const origin=request.headers.get('Origin');
   const url=new URL(request.url);
   if(request.method==='OPTIONS'&&origin===allowed){
     return new Response(null,{status:204,headers:{
       'Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Methods':'POST, GET, OPTIONS',
       'Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400','Vary':'Origin'
     }});
   }
   if(origin&&origin!==allowed)return asJSON({error:'origin'},403,allowed);
   if(!env.DB||!env.IP_HASH_SECRET)return asJSON({error:'not_configured'},503,allowed);
   const now=Math.floor(Date.now()/1000);
   if(request.method==='GET'&&url.pathname==='/stats')
     return asJSON(await rollup(env.DB,now),200,allowed);
   if(request.method!=='POST'||url.pathname!=='/visit')
     return asJSON({error:'not_found'},404,allowed);
   if(origin!==allowed)return asJSON({error:'origin_required'},403,allowed);
   if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))
     return asJSON({error:'content_type'},415,allowed);
   const ip=request.headers.get('CF-Connecting-IP');
   if(!ip)return asJSON({error:'edge_ip_unavailable'},503,allowed);
   const data=await request.json().catch(()=>null);
   const sessionId=data?.sessionId;
   if(typeof sessionId!=='string'||!/^[0-9a-f-]{36}$/i.test(sessionId))
     return asJSON({error:'invalid_session'},400,allowed);
   const ipHash=await hash(env.IP_HASH_SECRET,'ip:v1:'+ip);
   const sessionHash=await hash(env.IP_HASH_SECRET,'session:v1:'+sessionId);
   await env.DB.prepare('INSERT OR IGNORE INTO traffic_visitors(ip_hash,first_seen_ts) VALUES (?,?)')
     .bind(ipHash,now).run();
   await env.DB.prepare('INSERT INTO traffic_hits(ts,ip_hash,session_hash) VALUES (?,?,?)')
     .bind(now,ipHash,sessionHash).run();
   return asJSON(await rollup(env.DB,now),200,allowed);
 },
 async scheduled(event,env){
   if(!env.DB)return;
   await env.DB.prepare('DELETE FROM traffic_hits WHERE ts < ?')
     .bind(Math.floor(Date.now()/1000)-90*86400).run();
   // First-seen HMACs remain for accurate all-time 'new visitor' classification.
 }
};
