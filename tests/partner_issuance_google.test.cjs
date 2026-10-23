'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {OWNER,mime,createGoogleWorkspace}=require('../scripts/partners/issuance/google-workspace.cjs'),registry=require('../scripts/partners/issuance/registry.cjs');
const {run}=require('../scripts/partners/issuance/operator.cjs');
test('Gmail MIME keeps UTF-8, stable reconciliation ID and exact ZIP bytes without header injection',()=>{
 const message={to:'partner@example.org',subject:'Сәлем Қазақ',text:'Код: private-code',operationId:'application:archive:v1',attachments:[{filename:'example-1.0.0.zip',bytes:Buffer.from('ZIP-BYTES'),contentType:'application/zip'}]};
 const first=Buffer.from(mime(message).raw,'base64url').toString(),second=Buffer.from(mime(message).raw,'base64url').toString();
 A.match(first,/From: nomad260393@gmail.com/);A.match(first,/Content-Disposition: attachment; filename="example-1.0.0.zip"/);
 A.ok(first.includes(Buffer.from('ZIP-BYTES').toString('base64')));A.ok(first.includes(Buffer.from(message.subject).toString('base64')));
 A.equal(first.match(/Message-ID: (.+)/)[1],second.match(/Message-ID: (.+)/)[1]);
 for(const changed of [{to:'a@example.org\r\nBcc:evil@example.org'},{subject:'Title\r\nBcc:evil@example.org'},{attachments:[{filename:'../x.zip',bytes:Buffer.alloc(1),contentType:'application/zip'}]}])A.throws(()=>mime({...message,...changed}));
});
function mockGoogle({email=OWNER,permissions=[{type:'user',role:'owner',emailAddress:OWNER}],sendStatus=200}={}){
 const calls=[];return {calls,fetch:async(url,options)=>{
  calls.push({url,options});let body;
  if(url.endsWith('/profile'))body={emailAddress:email};
  else if(url.includes('/about?'))body={user:{emailAddress:email}};
  else if(url.includes('/drive/v3/files/folder?'))body={mimeType:'application/vnd.google-apps.folder',permissions};
  else if(url.includes('/messages/send'))return {ok:sendStatus===200,status:sendStatus,json:async()=>({id:'provider-message'})};
  else body={id:'drive-zip'};
  return {ok:true,status:200,json:async()=>body};
 }};
}
test('only the selected Gmail/Drive owner may send, and Google errors never trigger automatic retries',async()=>{
 const wrong=mockGoogle({email:'other@example.org'}),bad=createGoogleWorkspace({accessToken:'private-token',fetch:wrong.fetch});
 await A.rejects(bad.send({to:'partner@example.org',subject:'test',text:'test',operationId:'id'}),/approved owner/);A.equal(wrong.calls.filter(c=>c.options.method==='POST').length,0);
 const mock=mockGoogle({sendStatus:429}),google=createGoogleWorkspace({accessToken:'private-token',fetch:mock.fetch});
 await A.rejects(google.send({to:'partner@example.org',subject:'test',text:'test',operationId:'id'}),e=>e.definitelyNotAccepted===true);
 A.equal(mock.calls.filter(c=>c.url.includes('/messages/send')).length,1);A.ok(mock.calls.every(c=>c.options.redirect==='error'&&c.options.credentials==='omit'));
});
test('Drive rejects shared archive folders; registry projects literal cells without secrets or formulas',async()=>{
 const mock=mockGoogle({permissions:[{type:'anyone',role:'reader'}]}),google=createGoogleWorkspace({accessToken:'token',fetch:mock.fetch});
 await A.rejects(google.uploadArchive('folder',{filename:'example-1.0.0.zip',bytes:Buffer.from('zip')}),/restricted/);
 A.equal(mock.calls.filter(c=>c.url.includes('/upload/')).length,0);
 const request=registry.updateRow(1,1,['=IMPORTXML("https://evil.example")',true,2]);
 A.equal(request.updateCells.rows[0].values[0].userEnteredValue.stringValue,'=IMPORTXML("https://evil.example")');A.equal(JSON.stringify(request).includes('formulaValue'),false);
 A.throws(()=>registry.updateRow(1,0,['overwrite-header']));A.throws(()=>registry.updateRow(1,1,[{}]));
});
test('private operator records the actual application in Google Sheets before sending confirmation',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'nomad-google-operator-'));await fs.chmod(dir,0o700);t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const keyFile=path.join(dir,'vault.secret');await fs.writeFile(keyFile,crypto.randomBytes(32),{mode:0o600});
 const stateDirectory=path.join(dir,'state'),rows={applications:[registry.headers.applications],issuances:[registry.headers.issuances],events:[registry.headers.events]},calls=[];
 const titles={applications:'Заявки',issuances:'Выдачи',events:'Журнал'},ids={applications:1,issuances:2,events:3};
 const workspace={
  registryMetadata:async()=>({sheets:Object.entries(titles).map(([k,title])=>({properties:{sheetId:ids[k],title},tables:[{tableId:'table-'+k,range:{sheetId:ids[k],endRowIndex:2,endColumnIndex:registry.headers[k].length}}]}))}),
  registryValues:async(_,title)=>({values:rows[Object.keys(titles).find(k=>titles[k]===title)]}),
  sheetBatch:async(_,requests)=>{for(const r of requests){if(!r.updateCells)continue;const key=Object.keys(ids).find(k=>ids[k]===r.updateCells.start.sheetId),index=r.updateCells.start.rowIndex,column=r.updateCells.start.columnIndex;
   if(key==='applications'&&column===17)rows[key][index][2]='Manually updated company';
   rows[key][index]=rows[key][index]||[];r.updateCells.rows[0].values.forEach((v,i)=>{rows[key][index][column+i]=Object.values(v.userEnteredValue)[0];});}},
  send:async message=>{calls.push(message);return {id:'gmail-accepted-'+calls.length,accepted:true};},
  uploadArchive:async(folder,archive)=>{A.equal(folder,'private-folder');A.ok(archive.bytes.length>100);return {id:'private-drive-zip'};}
 };
 const model=require('../nomad360_partner_application_model.js'),application=model.payload({company:'=formula',activity:'Consulting',intendedUse:'Embedding',employees:'1',clientSegment:'small',fullName:'Technical Owner',role:'',email:'partner@example.org',phoneMessenger:'',website:'',consentProcessing:true,consentPublicProfile:false},{applicationId:'12345678-1234-1234-1234-123456789012',language:'ru',consentedAt:'2026-10-23T10:00:00Z'}),settings={stateDirectory,vaultKeyFile:keyFile,spreadsheetId:'private-spreadsheet',archiveFolderId:'private-folder'};
 const checks=[];workspace.verifyOwner=async()=>checks.push('owner');workspace.verifyArchiveFolder=async()=>checks.push('folder');
 A.equal((await run('check-setup',{},settings,{workspace})).status,'setup_verified');A.deepEqual(checks,['owner','folder']);A.equal(calls.length,0);A.equal(rows.applications.length,1);
 await run('register',{application,config:require('./fixtures/partner-build/example.json')},settings,{workspace});A.equal(rows.applications[1][2],'=formula');
 const result=await run('send-verification',{applicationId:application.application_id},settings,{workspace});A.equal(result.status,'awaiting_email');A.equal(calls.length,1);A.equal(rows.applications[1][17],'email_sent');
 A.ok(!JSON.stringify(rows).includes(calls[0].text.split('\n\n')[1]));
 await A.rejects(run('send-verification',{applicationId:application.application_id},settings,{workspace}),/transition/);A.equal(calls.length,1);
 const input={applicationId:application.application_id},code=calls[0].text.split('\n\n')[1];
 await run('confirm-email',{...input,code},settings,{workspace});
 await run('approve-domain',{...input,review:{origin:'https://advisory.example',reviewReference:'technical-domain-review'}},settings,{workspace});
 const build=async config=>{
  const {normalize,sha256}=require('../scripts/partners/config.cjs'),normalized=normalize(config),html='<title>Calculator fixture</title>',filename=config.packageId+'.html';
  return {filename,html,manifest:{schemaVersion:1,packageId:config.packageId,packageVersion:config.packageVersion,config:normalized,configSha256:sha256(JSON.stringify(normalized)),sourceRevision:'a'.repeat(40),files:[{path:filename,bytes:Buffer.byteLength(html),sha256:sha256(html)}],resources:['nomad360_v1_engine.js','portfolio_v2_engine.js'].map(name=>({path:name,bytes:100,sha256:'b'.repeat(64)}))}};
 };
 await run('prepare',input,settings,{workspace,build});A.equal(rows.issuances[1][7],'private-drive-zip');
 await run('send-archive',input,settings,{workspace});A.equal(calls.length,2);A.equal(rows.issuances[1][10],'accepted');A.equal(rows.issuances[1][11],'gmail-accepted-2');
 await A.rejects(run('send-archive',input,settings,{workspace}),/transition/);A.equal(calls.length,2);
 A.ok(!JSON.stringify(rows).includes(code));
 A.equal(rows.applications[1][2],'Manually updated company','Lifecycle writes must not overwrite concurrent contact/company edits');
 // Two distinct applications must not both claim the same first blank Sheet row.
 const partial=Array(24).fill('');partial[2]='Manual draft without ID';rows.applications.push(partial);
 const firstId=crypto.randomUUID(),secondId=crypto.randomUUID(),originalMetadata=workspace.registryMetadata;
 let release,entered,hold=true;const started=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
 workspace.registryMetadata=async(...args)=>{if(hold){hold=false;entered();await gate;}return originalMetadata(...args);};
 const first=run('register',{application:{...application,application_id:firstId},config:require('./fixtures/partner-build/example.json')},settings,{workspace});await started;
 await A.rejects(run('register',{application:{...application,application_id:secondId},config:require('./fixtures/partner-build/example.json')},settings,{workspace}),/busy/);
 release();await first;
 await run('register',{application:{...application,application_id:secondId},config:require('./fixtures/partner-build/example.json')},settings,{workspace});
 A.ok(rows.applications.some(row=>row[0]===firstId));A.ok(rows.applications.some(row=>row[0]===secondId));
 A.equal(new Set(rows.applications.slice(1).map(row=>row[0])).size,rows.applications.length-1);A.equal(calls.length,2);
 A.ok(rows.applications.some(row=>row[2]==='Manual draft without ID'));
});
test('the existing service identity is used only for Sheets; Gmail keeps the owner OAuth identity',async()=>{
 const calls=[],service='existing@project-example.iam.gserviceaccount.com';
 const google=createGoogleWorkspace({getAccessToken:async()=>'owner-token',getSheetsAccessToken:async()=>'sheets-token',sheetsIdentityEmail:service,fetch:async(url,options)=>{
  calls.push({url,token:options.headers.Authorization});
  const data=url.includes('/about?')?{user:{emailAddress:options.headers.Authorization==='Bearer sheets-token'?service:OWNER}}:url.endsWith('/profile')?{emailAddress:OWNER}:url.includes('/messages/send')?{id:'owner-message'}:{sheets:[]};
  return {ok:true,json:async()=>data};
 }});
 await google.registryMetadata('private-sheet');await google.send({to:'partner@example.org',subject:'test',text:'test',operationId:'verification'});
 A.ok(calls.filter(c=>c.url.includes('sheets.googleapis.com')).every(c=>c.token==='Bearer sheets-token'));
 A.ok(calls.filter(c=>c.url.includes('gmail.googleapis.com')).every(c=>c.token==='Bearer owner-token'));
 A.ok(calls.some(c=>c.url.includes('/about?')&&c.token==='Bearer sheets-token'));
});
