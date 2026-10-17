const {test}=require('node:test');
const A=require('node:assert/strict');
const {normalizeTraffic}=require('../scripts/update_github_repo_traffic.cjs');
test('GitHub Insights: publish only one unique visitor metric, no extra metrics',()=>{
 const fixed=new Date('2026-10-10T15:00:00.000Z');
 const output=normalizeTraffic({count:417,uniques:63,views:[{timestamp:'2026-10-10T00:00:00Z',count:4,uniques:2}]},fixed);
 A.deepEqual(output,{
   status:'ok',source:'github-repository-traffic',
   repository:'KazartsevEV/shelter-partner-directory',
   updatedAt:'2026-10-10T15:00:00.000Z',visitors14:63
 });
 A.equal(Object.hasOwn(output,'views14'),false);
 A.equal(Object.hasOwn(output,'views7'),false);
 A.equal(Object.hasOwn(output,'sessions'),false);
 A.throws(()=>normalizeTraffic({count:5}),/valid unique visitor count/);
 A.throws(()=>normalizeTraffic({uniques:-1}),/valid unique visitor count/);
});

const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const handler=fs.readFileSync(path.join(__dirname,'../nomad360_traffic.js'),'utf8');

function visitorSnapshot(visitors14,updatedAt=new Date().toISOString()){
 return {status:'ok',source:'github-repository-traffic',
  repository:'KazartsevEV/shelter-partner-directory',updatedAt,visitors14};
}
function trafficHarness(outcomes,protocol='https:'){
 const timers=[],requests=[];
 let language='ru';
 const makeFooter=()=>{
  const value={textContent:'—'};
  return {value,querySelector:selector=>selector==='[data-nomad-traffic-value]'?value:null};
 };
 let footer=makeFooter();
 const root={
  location:{protocol},
  document:{getElementById:id=>id==='nomad360-footer'?footer:null},
  Nomad360UI:{getLanguage:()=>language},
  setTimeout:(fn,delay)=>{timers.push({fn,delay});return timers.length;},
  fetch:(url,options)=>{
   requests.push({url,options});
   const result=outcomes.shift();
   if(result instanceof Error)return Promise.reject(result);
   if(result&&typeof result.then==='function')return result;
   return Promise.resolve({ok:result?.httpStatus!==500,json:()=>result});
  }
 };
 vm.runInNewContext(handler,{window:root});
 return {
  root,timers,requests,
  render:()=>root.Nomad360Traffic.render(footer,language),
  current:()=>footer,
  replaceFooter:()=>{footer=makeFooter();return footer;},
  setLanguage:l=>{language=l},
  fireRetry:()=>{const timer=timers.shift();A.ok(timer,'Expected retry timer');timer.fn();return timer.delay;}
 };
}
async function flushTrafficPromises(){
 for(let i=0;i<16;i++)await Promise.resolve();
}

test('visitor display recovers after one failed request without a page reload',async()=>{
 const h=trafficHarness([new Error('network lost'),visitorSnapshot(63)]);
 h.render();
 await flushTrafficPromises();
 A.equal(h.current().value.textContent,'—');
 A.equal(h.requests.length,1);
 A.equal(h.requests[0].url,'./nomad360_repo_traffic.json');
 A.equal(h.requests[0].options.cache,'no-store');
 A.equal(h.timers.length,1);
 A.equal(h.fireRetry(),2000);
 await flushTrafficPromises();
 A.equal(h.current().value.textContent,'63');
 A.equal(h.requests.length,2);
 A.equal(h.timers.length,0,'A successful response cancels further retries');
});

test('invalid or HTTP-failed visitor snapshots retry with bounded backoff',async()=>{
 const invalid=visitorSnapshot(22,new Date(Date.now()-73*3600000).toISOString());
 const h=trafficHarness([invalid,{httpStatus:500},visitorSnapshot(0)]);
 h.render();
 await flushTrafficPromises();
 A.equal(h.current().value.textContent,'—');
 A.equal(h.fireRetry(),2000);
 await flushTrafficPromises();
 A.equal(h.current().value.textContent,'—');
 A.equal(h.fireRetry(),5000);
 await flushTrafficPromises();
 A.equal(h.current().value.textContent,'0','Zero is a valid unique visitor count');
 A.equal(h.requests.length,3);
 A.equal(h.timers.length,0);
});

test('visitor snapshot paints the current footer after a rerender during loading',async()=>{
 let complete;
 const pending=new Promise(resolve=>{complete=resolve;});
 const h=trafficHarness([pending]);
 const old=h.current();
 h.render();
 await flushTrafficPromises();
 const replacement=h.replaceFooter();
 h.setLanguage('en');
 h.render();
 complete({ok:true,json:()=>visitorSnapshot(4)});
 await flushTrafficPromises();
 A.equal(old.value.textContent,'—');
 A.equal(replacement.value.textContent,'4');
 A.equal(h.requests.length,1,'Concurrent footer renders share the same request');
});

test('local downloaded HTML does not attempt a relative visitor fetch',async()=>{
 const h=trafficHarness([visitorSnapshot(16)],'file:');
 h.render();
 await flushTrafficPromises();
 A.equal(h.current().value.textContent,'—');
 A.equal(h.requests.length,0);
 A.equal(h.timers.length,0);
});
