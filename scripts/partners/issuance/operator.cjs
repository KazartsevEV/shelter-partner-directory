'use strict';
// Explicit private operator entrypoint, not a public HTTP endpoint or browser script.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {createFileStore}=require('./file-store.cjs'),{createVault}=require('./vault.cjs'),{createService}=require('./service.cjs');
const {createGoogleWorkspace}=require('./google-workspace.cjs'),registry=require('./registry.cjs'),{buildPackage}=require('../build.cjs');
const {createTokenProvider,createServiceAccountTokenProvider}=require('./google-auth.cjs');
const root=path.resolve(__dirname,'../../..');
async function privatePath(file){
 const real=await fs.realpath(file);if(real===root||real.startsWith(root+path.sep))throw Error('Private settings/input must be outside the source checkout');
 const stat=await fs.stat(real);if(!stat.isFile()||(stat.mode&0o077)!==0)throw Error('Private settings/input files require mode 0600');return real;
}
async function privateFile(file){return fs.readFile(await privatePath(file));}
async function run(command,input,settings,{workspace,build=buildPackage}={}){
 const store=await createFileStore(settings.stateDirectory),key=await privateFile(settings.vaultKeyFile);
 const sheetsCredentials=settings.googleSheetsCredentialsFile||process.env.GOOGLE_APPLICATION_CREDENTIALS;
 if(!workspace&&(settings.googleOAuthCredentialsFile&&settings.googleAccessTokenFile||!settings.googleOAuthCredentialsFile&&!settings.googleAccessTokenFile&&!sheetsCredentials))throw Error('Configure one owner authorization source and/or an existing Sheets identity');
 const auth=workspace?null:settings.googleOAuthCredentialsFile?{getAccessToken:createTokenProvider({credentials:JSON.parse(await privateFile(settings.googleOAuthCredentialsFile))})}:settings.googleAccessTokenFile?{accessToken:(await privateFile(settings.googleAccessTokenFile)).toString().trim()}:{};
 if(!workspace&&sheetsCredentials){
  if(!settings.googleSheetsServiceAccountEmail)throw Error('Select the expected existing Sheets service account');
  auth.getSheetsAccessToken=createServiceAccountTokenProvider({keyFilename:await privatePath(sheetsCredentials)});auth.sheetsIdentityEmail=settings.googleSheetsServiceAccountEmail;
 }
 const vault=createVault(key),google=workspace||createGoogleWorkspace(auth);
 if(command==='check-setup'){
  await google.verifyOwner();await google.verifyArchiveFolder(settings.archiveFolderId);
  const metadata=await google.registryMetadata(settings.spreadsheetId);
  for(const [kind,title,columns] of [['applications','Заявки','X'],['issuances','Выдачи','P'],['events','Журнал','G']]){
   const sheet=metadata.sheets?.find(s=>s.properties.title===title),{values=[]}=await google.registryValues(settings.spreadsheetId,title,columns,{headersOnly:true});
   if(!sheet||!sheet.tables?.some(t=>(t.range.startRowIndex??0)===0&&(t.range.startColumnIndex??0)===0&&t.range.endColumnIndex===registry.headers[kind].length)||JSON.stringify(values[0])!==JSON.stringify(registry.headers[kind]))throw Error('Registry setup/schema mismatch');
  }
  return {status:'setup_verified',gmailOwnerVerified:true,registryVerified:true,archiveFolderOwnerOnly:true};
 }
 const service=createService({store,vault,mailer:google,build});
 const id=input.applicationId||input.application?.application_id;
 // Different applications share one Sheets grid. Per-application state locks
 // alone cannot protect the first-empty-row lookup from a concurrent command.
 const registryLock=action=>store.transaction('registry-projection',async()=>{await action();return undefined;});
 async function upsert(kind,row){
  return registryLock(async()=>{
  const title={applications:'Заявки',issuances:'Выдачи',events:'Журнал'}[kind],columns={applications:'X',issuances:'P',events:'G'}[kind];
  const metadata=await google.registryMetadata(settings.spreadsheetId),sheet=metadata.sheets?.find(s=>s.properties.title===title);
  if(!sheet)throw Error('Registry tab missing');const {values=[]}=await google.registryValues(settings.spreadsheetId,title,columns);
  if(JSON.stringify(values[0])!==JSON.stringify(registry.headers[kind]))throw Error('Registry header/schema mismatch');
  const matches=values.flatMap((r,i)=>i>0&&r[0]===row[0]?[i]:[]);if(matches.length>1)throw Error('Duplicate registry identity requires review');
  let index=matches[0]??-1;if(index<0){index=1;while(values[index]?.some(v=>v!==''&&v!==null&&v!==undefined))index++;}
  if(index>=1000)throw Error('Registry capacity must be extended explicitly');
  const requests=[registry.updateRow(sheet.properties.sheetId,index,row)],table=sheet.tables?.find(t=>(t.range.startRowIndex??0)===0&&(t.range.startColumnIndex??0)===0&&t.range.endColumnIndex===row.length);
  if(!table)throw Error('Registry native table missing');
  if(table.range.endRowIndex<=index)requests.push({updateTable:{table:{tableId:table.tableId,range:{...table.range,endRowIndex:index+1}},fields:'range'}});
  await google.sheetBatch(settings.spreadsheetId,requests);
  });
 }
 async function project(){
  const r=await store.read(id);
  if(r.archive&&['prepared','archive_sending','delivery_accepted','send_unknown','send_failed'].includes(r.status))await upsert('issuances',registry.issuanceRow(r,{issuanceId:id+'-v1',driveId:r.archiveDriveId||''}));
  // Preserve all existing application text; update only lifecycle columns.
  await registryLock(async()=>{
  const metadata=await google.registryMetadata(settings.spreadsheetId),sheet=metadata.sheets?.find(s=>s.properties.title==='Заявки');
  const {values=[]}=await google.registryValues(settings.spreadsheetId,'Заявки','X');
  if(!sheet||JSON.stringify(values[0])!==JSON.stringify(registry.headers.applications))throw Error('Registry schema mismatch');
  const matches=values.flatMap((row,i)=>i>0&&row[0]===id?[i]:[]);
  if(matches.length!==1)throw Error('Registered application missing or duplicated in Google Sheet');const index=matches[0];
  const lifecycle=[r.emailVerifiedAt?'email_verified':r.verificationAcceptedAt?'email_sent':r.status==='send_unknown'?'unknown':'new',r.emailVerifiedAt||'',r.domainReview?'approved':'pending',r.config.deployment.origin,r.domainReview?'reviewed':'pending'];
  await google.sheetBatch(settings.spreadsheetId,[registry.updateRow(sheet.properties.sheetId,index,lifecycle,17)]);
  });
 }
 async function event(result){await upsert('events',registry.eventRow({id:crypto.randomUUID(),at:new Date().toISOString(),applicationId:id,issuanceId:id+'-v1',operation:command,result}));}
 if(command==='register'){
  const r=await service.register(input.application,input.config);
  await upsert('applications',registry.applicationRow(input.application,{receivedAt:r.createdAt,formspreeId:input.formspreeId||'',record:r}));
  await store.transaction(id,r=>({...r,registrySaved:true}));
 }else{
  const r=await store.read(id);if(!r?.registrySaved)throw Error('Persist the application in Google Sheets before proceeding');
  if(command==='send-verification')await service.sendVerification(id);
  else if(command==='renew-verification')await service.renewVerification(id);
  else if(command==='confirm-email')await service.verifyEmail(id,input.code);
  else if(command==='approve-domain')await service.approve(id,input.review);
  else if(command==='prepare'){
   await service.prepare(id);const prepared=await store.read(id);
   await store.transaction(id,r=>({...r,status:'drive_uploading'}));
   try{
    const bytes=await store.getArchive(prepared.archive.key),uploaded=await google.uploadArchive(settings.archiveFolderId,{filename:prepared.archive.filename,bytes});
    await store.transaction(id,r=>({...r,status:'prepared',archiveDriveId:uploaded.id}));
   }catch(_){await store.transaction(id,r=>({...r,status:'drive_upload_unknown'}));throw Error('Drive upload not confirmed; reconcile before continuing');}
  }else if(command==='send-archive'){
   if(!r.archiveDriveId)throw Error('Persist the encrypted archive on private Google Drive before mailing');
   await service.sendArchive(id);
  }else if(command==='reconcile-mail')await service.reconcile(id,input.evidence);
  else if(command!=='status')throw Error('Unknown operator command');
  await project();
 }
 if(command!=='status')await event('success');
 const r=await store.read(id);return {applicationId:id,status:r.status,sourceRevision:r.archive?.sourceRevision||null};
}
async function main(){
 const [command,inputFile,...extra]=process.argv.slice(2),commands=['check-setup','register','send-verification','renew-verification','confirm-email','approve-domain','prepare','send-archive','reconcile-mail','status'];
 if(!commands.includes(command)||!inputFile||extra.length||!process.env.NOMAD_PARTNER_SETTINGS)throw Error('Usage: NOMAD_PARTNER_SETTINGS=/private/settings.json node scripts/partners/issuance/operator.cjs <command> /private/input.json');
 const settings=JSON.parse(await privateFile(process.env.NOMAD_PARTNER_SETTINGS)),input=JSON.parse(await privateFile(inputFile));
 console.log('PARTNER_OPERATOR_RESULT',JSON.stringify(await run(command,input,settings)));
}
if(require.main===module)main().catch(()=>{console.error('PARTNER_OPERATOR_FAILED: inspect private state and provider evidence; secrets are not logged');process.exitCode=1;});
module.exports={privateFile,privatePath,run};
