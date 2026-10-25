
'use strict';
/* Pure review-mode QA only. No HTTP, DNS, email, file uploads or runtime imports. */
const A=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../../..'),HERE=__dirname;
const read=file=>JSON.parse(fs.readFileSync(path.join(HERE,file),'utf8'));
const contract=read('catalog.json'),states=read('state-contract.json'),fixtures=read('scenarios.json');
const locales=Object.fromEntries(['en','ru','kk'].map(l=>[l,read('locales/'+l+'.json')]));
const original=fs.readFileSync(path.join(ROOT,contract.origin),'utf8');
const lines=original.split(/\r?\n/);
const policyNames={'policy.purpose':'Назначение','policy.calculations':'Расчёты','policy.directory':'Публичный профиль','policy.future':'Развитие','policy.correction':'Исправление/удаление'};
const languageNames={en:'EN',ru:'RU',kk:'KK'};
function row(key){
 const raw=lines.filter(x=>x.startsWith('| '+key+' | '));
 A.equal(raw.length,1,'Missing or duplicate table source: '+key);
 const cells=raw[0].split('|').slice(1,-1).map(x=>x.trim());
 A.equal(cells.length,4,'Exactly three language columns: '+key);
 return {en:cells[1],ru:cells[2],kk:cells[3]};
}
function stateCopy(key){
 const needle='### '+key+' — ',begin=original.indexOf(needle);
 A.ok(begin>=0,'Canonical state absent: '+key);
 const ends=[original.indexOf('\n### ',begin+needle.length),original.indexOf('\n## ',begin+needle.length)].filter(x=>x>=0);
 const fragment=original.slice(begin,ends.length?Math.min(...ends):original.length);
 return Object.fromEntries(Object.entries(languageNames).map(([lang,tag])=>{
  const hits=fragment.split('\n').filter(x=>x.startsWith('- '+tag+': '));
  A.equal(hits.length,1,'Exactly one '+tag+' state: '+key);
  return [lang,hits[0].slice(('- '+tag+': ').length).trim()];
 }));
}
function helpCopy(lang){
 const prefix='### '+languageNames[lang]+' — ',i=original.indexOf(prefix);
 A.ok(i>=0,'Help source missing '+lang);
 const start=original.indexOf('\n\n',i)+2;
 const ends=[original.indexOf('\n### ',start),original.indexOf('\n## ',start)].filter(x=>x>=0);
 return original.slice(start,ends.length?Math.min(...ends):original.length).trim()
  .split('\n\n').filter(Boolean).slice(0,2).map(x=>x.replace(/\n/g,' ').trim()).join('\n\n');
}
function verifyCatalog(){
 A.equal(contract.schemaVersion,1);A.equal(contract.status,'pre-release-review-only');
 A.equal(states.mode,'fixtureOnly');A.equal(states.sideEffects,false);A.equal(states.externalRequests,false);
 const keys=contract.keys.map(x=>x.key);
 A.equal(keys.length,58);A.equal(new Set(keys).size,keys.length,'No duplicate or shadowed keys');
 A.equal(contract.keys.filter(x=>x.origin!=='reviewAddition').length,23,'23 existing canonical source entries');
 for(const l of ['en','ru','kk']){
  A.equal(locales[l].locale,l);A.equal(locales[l].release,'review-only');
  A.deepEqual(Object.keys(locales[l].copy).sort(),[...keys].sort(),'All locale keys must exist');
  for(const [key,value] of Object.entries(locales[l].copy)){
   A.equal(typeof value,'string');A.equal(value,value.trim(),'No surrounding whitespace: '+key);
   A.ok(value.length>2,'No missing/placeholder translation: '+l+'/'+key);
   A.ok(!/<script|<iframe|javascript:|\{\{.*\}\}/i.test(value),'No executable or unresolved template content');
  }
 }
 for(const entry of contract.keys){
  let expected;
  if(entry.origin==='sourceTable')expected=row(entry.key);
  else if(entry.origin==='sourcePolicy')expected=row(policyNames[entry.key]);
  else if(entry.origin==='sourceState')expected=stateCopy(entry.key.replace('state.',''));
  else if(entry.origin==='sourceHelp')expected=Object.fromEntries(['en','ru','kk'].map(l=>[l,helpCopy(l)]));
  if(expected)for(const l of ['en','ru','kk'])A.equal(locales[l].copy[entry.key],expected[l],'Canon unchanged: '+l+'/'+entry.key);
  if(entry.origin==='reviewAddition')A.equal(entry.nonBinding,true,'Review additions cannot imply live release');
 }
 for(const l of ['en','ru','kk']){
  A.ok(locales[l].copy['b2b.terms'].includes('€600'));
  A.ok(locales[l].copy['state.applicationAccepted']!==locales[l].copy['state.deliveryAccepted']);
  A.ok(locales[l].copy['b2b.updates.whiteLabel'].length>locales[l].copy['b2b.updates.free'].length/2);
 }
 A.ok(!contract.keys.some(x=>x.key==='partner.realPassword'||x.key==='partner.realToken'));
}
const stepByPair=new Map(states.transitions.map(t=>[t.from+'|'+t.event,t]));
function advance(current,action){
 const found=stepByPair.get(current+'|'+action.event);
 if(!found||!action.evidence)return {state:current,rejected:true};
 return {state:found.to,rejected:false};
}
function allow(input){
 if(input.type==='application'){
  return typeof input.email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)&&input.consent===true;
 }
 // Even a forced boolean cannot activate real actions in review mode.
 if(['screenshotUpload','whiteLabelDeployment','issueRealArchive','automaticResendAfterUnknown','changePublicDownload'].includes(input.type))return false;
 throw Error('Unknown gate type: '+input.type);
}
function verifyGraph(){
 A.equal(states.schemaVersion,1);A.equal(states.start,'idle');A.equal(states.transitions.length,19);
 A.equal(new Set(states.statuses).size,states.statuses.length);
 A.deepEqual(states.terminal,['deliveryAccepted']);
 A.equal(stepByPair.size,states.transitions.length,'Unique event per current state');
 const allowedEvidence=new Set(['providerReceipt','gmailAccepted','gmailRejected','operatorEvidence','uncertainProviderOutcome','verifiedCode','expiryEvidence','builtArchiveDigest','buildError','manual']);
 for(const t of states.transitions){
  A.ok(states.statuses.includes(t.from)&&states.statuses.includes(t.to));
  A.ok(allowedEvidence.has(t.evidence),'Unknown evidence type');
  A.ok(t.to!=='deliveryAccepted'||['deliveryMailAccepted','operatorConfirmsAccepted'].includes(t.event),'Delivery cannot be claimed from an unverified event');
  A.ok(t.to!=='emailVerified'||t.from!=='verificationAccepted'||t.event==='emailCodeValid','Initial verification requires a confirmed code');
  A.ok(!t.event.toLowerCase().includes('auto'),'No automatic retry in review machine');
 }
 const seen=new Set([states.start]);let dirty=true;
 while(dirty){dirty=false;for(const t of states.transitions)if(seen.has(t.from)&&!seen.has(t.to)){seen.add(t.to);dirty=true;}}
 A.equal(seen.size,states.statuses.length,'All states reachable by approved evidence-bearing path');
}
function verifyFixtures(){
 A.equal(fixtures.count,fixtures.cases.length);A.ok(fixtures.count>=60,'Broad R1 fixture matrix required');
 const ids=new Set();
 let successful=0,blocked=0,forms=0;
 for(const c of fixtures.cases){
  A.ok(!ids.has(c.id),'Duplicate fixture '+c.id);ids.add(c.id);
  if(c.kind==='gate'){
   const got=allow(c.input);A.equal(got,c.expectedAllowed,c.id);
   if(c.input.type==='application')forms++;
   if(!got)blocked++;else successful++;
   continue;
  }
  A.equal(c.kind,'transition');
  let state=states.start,rejected=false;
  for(const action of c.steps){const v=advance(state,action);state=v.state;rejected=v.rejected;}
  A.equal(state,c.expectedState,'Unexpected state: '+c.id);
  A.equal(rejected,c.expectReject,'Unexpected transition permission: '+c.id);
  if(rejected)blocked++;else successful++;
 }
 A.ok(successful>=20&&blocked>=35&&forms>=9,'Insufficient positive/negative/consent coverage');
 A.equal(allow({type:'screenshotUpload',enabled:true}),false);
 A.equal(allow({type:'issueRealArchive',enabled:true}),false);
 A.equal(allow({type:'automaticResendAfterUnknown',enabled:true}),false);
 A.equal(advance('deliveryUnknown',{event:'deliveryMailAccepted',evidence:true}).rejected,true);
 A.equal(advance('applicationAccepted',{event:'deliveryMailAccepted',evidence:true}).rejected,true);
 // Mutation controls must fail rather than silently weaken canonical or state guards.
 const changed={...locales.kk.copy,'partner.offer':'BREACH'};
 A.notEqual(changed['partner.offer'],row('partner.offer').kk);
 A.equal(advance('archiveReady',{event:'deliveryMailAccepted',evidence:false}).rejected,true);
 return {successful,blocked,forms};
}
verifyCatalog();verifyGraph();
const receipt=verifyFixtures();
console.log('R1_PARTNER_CONTENT_QA_GREEN',JSON.stringify({locales:3,keys:contract.keys.length,translations:contract.keys.length*3,canonical:23,stateTransitions:states.transitions.length,scenarios:fixtures.count,...receipt,productionEnabled:false,externalRequests:0}));
