'use strict';
// Read-only checks of the exact accepted R1 checker. No source writes or network.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{createRequire}=require('node:module');
if (!process.argv[2]) throw Error('Pass the accepted #278 checkout path');
const root=path.resolve(process.argv[2]);
const file=path.join(root,'scripts/partners/r1-content/verify.cjs');
const source=fs.readFileSync(file,'utf8');
vm.runInNewContext(source+`
const probes={};
probes.wrongEvidence=advance('archiveReady',{event:'deliveryMailAccepted',evidence:'gmailRejected'});
probes.emptyEvidence=advance('archiveReady',{event:'deliveryMailAccepted',evidence:{}});
probes.stringFalse=advance('archiveReady',{event:'deliveryMailAccepted',evidence:'false'});
const entry=contract.keys.find(x=>x.key==='partner.offer');
entry.origin='misspelledSourceTable';
locales.ru.copy['partner.offer']='UNAPPROVED CANONICAL COPY';
verifyCatalog();
probes.invalidOriginAndChangedCanonicalPassed=true;
const scenario=fixtures.cases.find(c=>c.kind==='transition'&&c.steps.length>1&&!c.expectReject);
scenario.steps.unshift({event:'NOT_PERMITTED',evidence:true});
probes.rejectedStepThenAllowedStillGreen={id:scenario.id,...verifyFixtures()};
console.log('INDEPENDENT_R1_PROBES',JSON.stringify(probes,null,2));
`,{require:createRequire(file),__dirname:path.dirname(file),console},{filename:file});
