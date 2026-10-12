/* Approved provider: Frankfurter v2. Requests contain ISO codes only. */
(function(root,factory){
 'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.Nomad360FX=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 async function quote(base,quote,fetcher=fetch){
  if(!/^[A-Z]{3}$/.test(base)||!/^[A-Z]{3}$/.test(quote)||base===quote)throw Error('Invalid currency pair');
  const response=await fetcher('https://api.frankfurter.dev/v2/rate/'+base.toLowerCase()+'/'+quote.toLowerCase(),{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Rate unavailable');
  const row=await response.json();
  if(row.base!==base||row.quote!==quote||typeof row.rate!=='number'||!Number.isFinite(row.rate)||row.rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||!Number.isFinite(Date.parse(row.date+'T00:00:00Z'))||new Date(row.date+'T00:00:00Z').toISOString().slice(0,10)!==row.date||row.date>new Date().toISOString().slice(0,10))throw Error('Unconfirmed rate');
  return {base,quote,rate:row.rate,date:row.date,source:'frankfurter',sourceLabel:'Frankfurter · official reference rates'};
 }
 return Object.freeze({quote});
});
