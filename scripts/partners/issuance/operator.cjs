'use strict';
// Explicit private operator entrypoint, not a public HTTP endpoint or browser script.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {createFileStore}=require('./file-store.cjs'),{createVault}=require('./vault.cjs'),{createService}=require('./service.cjs');
const {createGoogleWorkspace}=require('./google-workspace.cjs'),registry=require('./registry.cjs'),{buildPackage}=require('../build.cjs');
const root=path.resolve(__dirname,'../../..');
async function privateFile(file){
 const real=await fs.realpath(file);if(real===root||real.startsWith(root+path.sep))throw Error('Private settings/input must be outside the source checkout');
 const stat=await fs.stat(real);if(!stat.isFile()||(stat.mode&0o077)!==0)throw Error('Private settings/input files require mode 0600');return fs.readFile(real);
}
async function run(command,input,settings,{workspace,build=buildPackage}={}){
 const store=await createFileStore(settings.stateDirectory),key=await privateFile(settings.vaultKeyFile);
 const vault=createVault(key),google=workspace||createGoogleWorkspace({accessToken:(await privateFile(settings.googleAccessTokenFile)).toString().trim()});
 const service=createService({store,vault,mailer:google,build});
 const id=input.applicationId||input.application?.application_id;
 async function upsert(kind,row){
  const title={applications:'Заявки',issuances:'Выдачи',events:'Журнал'}[kind],columns={applications:'X',issuances:'P',events:'G'}[kind];
  const metadata=await google.registryMetadata(settings.spreadsheetId),sheet=metadata.sheets?.find(s=>s.properties.title===title);
  if(!sheet)throw Error('Registry tab missing');const {values=[]}=await google.registryValues(settings.spreadsheetId,title,columns);
  if(JSON.stringify(values[0])!==JSON.stringify(registry.headers[kind]))throw Error('Registry header/schema mismatch');
  let index=values.findIndex((r,i)=>i>0&&r[0]===row[0]);if(index<0){index=1;while(values[index]?.[0])index++;}
  if(index>=1000)throw Error('Registry capacity must be extended explicitly');
  const requests=[registry.updateRow(sheet.properties.sheetId,index,row)],table=sheet.tables?.find(t=>t.range.startRowIndex===0&&t.range.startColumnIndex===0&&t.range.endColumnIndex===row.length);
  if(!table)throw Error('Registry native table missing');
  if(table.range.endRowIndex<=index)requests.push({updateTable:{table:{tableId:table.tableId,range:{...table.range,endRowIndex:index+1}},fields:'range'}});
  await google.sheetBatch(settings.spreadsheetId,requests);
 }
 async function project(){
  const r=await store.read(id);
  if(r.archive&&['prepared','archive_sending','delivery_accepted','send_unknown','send_failed'].includes(r.status))await upsert('issuances',registry.issuanceRow(r,{issuanceId:id+'-v1',driveId:r.archiveDriveId||''}));
  // Preserve all existing application text; update only lifecycle columns.
  const metadata=await google.registryMetadata(settings.spreadsheetId),sheet=metadata.sheets?.find(s=>s.properties.title==='Заявки');
  const {values=[]}=await google.registryValues(settings.spreadsheetId,'Заявки','X');
  if(!sheet||JSON.stringify(values[0])!==JSON.stringify(registry.headers.applications))throw Error('Registry schema mismatch');
  const index=values.findIndex((row,i)=>i>0&&row[0]===id);if(index<1)throw Error('Registered application missing from Google Sheet');
  const row=Array.from({length:24},(_,i)=>values[index][i]??'');
  row[17]=r.emailVerifiedAt?'email_verified':r.verificationAcceptedAt?'email_sent':r.status==='send_unknown'?'unknown':'new';row[18]=r.emailVerifiedAt||'';
  row[19]=r.domainReview?'approved':'pending';row[20]=r.config.deployment.origin;row[21]=r.domainReview?'reviewed':'pending';
  await google.sheetBatch(settings.spreadsheetId,[registry.updateRow(sheet.properties.sheetId,index,row)]);
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
 const [command,inputFile,...extra]=process.argv.slice(2),commands=['register','send-verification','renew-verification','confirm-email','approve-domain','prepare','send-archive','reconcile-mail','status'];
 if(!commands.includes(command)||!inputFile||extra.length||!process.env.NOMAD_PARTNER_SETTINGS)throw Error('Usage: NOMAD_PARTNER_SETTINGS=/private/settings.json node scripts/partners/issuance/operator.cjs <command> /private/input.json');
 const settings=JSON.parse(await privateFile(process.env.NOMAD_PARTNER_SETTINGS)),input=JSON.parse(await privateFile(inputFile));
 console.log('PARTNER_OPERATOR_RESULT',JSON.stringify(await run(command,input,settings)));
}
if(require.main===module)main().catch(()=>{console.error('PARTNER_OPERATOR_FAILED: inspect private state and provider evidence; secrets are not logged');process.exitCode=1;});
module.exports={privateFile,run};
