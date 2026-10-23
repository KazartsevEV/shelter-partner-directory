'use strict';
// Server/operator-only Google API boundary. The browser and repository never own OAuth tokens.
const crypto=require('node:crypto');
const OWNER='nomad260393@gmail.com';
function mime(message){
 if(message.to!==message.to?.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.to)||/[\r\n]/.test(message.to)||typeof message.subject!=='string'||/[\r\n]/.test(message.subject)||typeof message.text!=='string'||typeof message.operationId!=='string'||!message.operationId)throw Error('Invalid private mail envelope');
 const encode=bytes=>Buffer.from(bytes).toString('base64').match(/.{1,76}/g)?.join('\r\n')||'';
 const operation=crypto.createHash('sha256').update(message.operationId).digest('hex'),boundary='nomad-'+crypto.randomBytes(18).toString('hex');
 const lines=['From: '+OWNER,'To: '+message.to,'Subject: =?UTF-8?B?'+Buffer.from(message.subject).toString('base64')+'?=',
  'Message-ID: <'+operation+'@nomad360.invalid>','MIME-Version: 1.0','Content-Type: multipart/mixed; boundary="'+boundary+'"','',
  '--'+boundary,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',encode(message.text)];
 for(const attachment of message.attachments||[]){
  if(!/^[a-z0-9][a-z0-9.-]{0,180}\.zip$/.test(attachment.filename)||attachment.contentType!=='application/zip'||!Buffer.isBuffer(attachment.bytes)||attachment.bytes.length>15*1024*1024)throw Error('Invalid ZIP mail attachment');
  lines.push('--'+boundary,'Content-Type: application/zip','Content-Disposition: attachment; filename="'+attachment.filename+'"','Content-Transfer-Encoding: base64','',encode(attachment.bytes));
 }
 lines.push('--'+boundary+'--','');return {raw:Buffer.from(lines.join('\r\n')).toString('base64url')};
}
function createGoogleWorkspace({accessToken,fetch:request=globalThis.fetch}){
 if(typeof accessToken!=='string'||!accessToken||/[\r\n]/.test(accessToken)||typeof request!=='function')throw Error('An external Google OAuth token is required');
 let identity;
 async function api(url,{method='GET',body,contentType='application/json'}={}){
  if(!['gmail.googleapis.com','sheets.googleapis.com','www.googleapis.com'].includes(new URL(url).hostname))throw Error('Unsupported Google API');
  const response=await request(url,{method,redirect:'error',credentials:'omit',signal:AbortSignal.timeout(30000),headers:{Authorization:'Bearer '+accessToken,...(body!==undefined?{'Content-Type':contentType}:{})},...(body!==undefined?{body:typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body)}:{})});
  if(!response.ok){const error=Error('Google operation was not accepted');error.definitelyNotAccepted=[400,401,403,404,413,422,429].includes(response.status);throw error;}
  return response.json();
 }
 async function verifyOwner(){
  if(!identity)identity=(async()=>{
   const gmail=await api('https://gmail.googleapis.com/gmail/v1/users/me/profile');
   const drive=await api('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)');
   if(gmail.emailAddress!==OWNER||drive.user?.emailAddress!==OWNER)throw Error('The configured Google identity is not the approved owner');
   return true;
  })();
  return identity;
 }
 async function send(message){
  const body=mime(message);await verifyOwner();
  // No automatic HTTP retry: Gmail send is not an idempotent endpoint. Reconcile
  // a timeout using the stable Message-ID before explicitly allowing another send.
  const receipt=await api('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',body});
  if(typeof receipt.id!=='string'||!receipt.id)throw Error('Gmail acknowledgement missing');
  return {accepted:true,id:receipt.id};
 }
 async function privateFolder(folderId){
  if(!/^[A-Za-z0-9_-]+$/.test(folderId||''))throw Error('Invalid private Drive folder');
  await verifyOwner();const folder=await api('https://www.googleapis.com/drive/v3/files/'+folderId+'?fields=id,mimeType,permissions(type,role,emailAddress),shared');
  if(folder.mimeType!=='application/vnd.google-apps.folder'||!Array.isArray(folder.permissions)||folder.permissions.length!==1||folder.permissions[0].type!=='user'||folder.permissions[0].role!=='owner'||folder.permissions[0].emailAddress!==OWNER)throw Error('Archive folder must be restricted to the approved owner');
 }
 async function uploadArchive(folderId,{filename,bytes}){
  if(!/^[a-z0-9][a-z0-9.-]{0,180}\.zip$/.test(filename)||!Buffer.isBuffer(bytes))throw Error('Invalid archive');
  await privateFolder(folderId);const boundary='nomad-'+crypto.randomBytes(18).toString('hex');
  const data=Buffer.concat([Buffer.from('--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify({name:filename,parents:[folderId],mimeType:'application/zip'})+'\r\n--'+boundary+'\r\nContent-Type: application/zip\r\n\r\n'),bytes,Buffer.from('\r\n--'+boundary+'--\r\n')]);
  const result=await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',{method:'POST',body:data,contentType:'multipart/related; boundary='+boundary});
  if(typeof result.id!=='string'||!result.id)throw Error('Drive acknowledgement missing');return {id:result.id,url:result.webViewLink||null};
 }
 async function sheetBatch(spreadsheetId,requests){
  if(!/^[A-Za-z0-9_-]+$/.test(spreadsheetId||'')||!Array.isArray(requests)||!requests.length)throw Error('Invalid private registry request');
  await verifyOwner();return api('https://sheets.googleapis.com/v4/spreadsheets/'+spreadsheetId+':batchUpdate',{method:'POST',body:{requests}});
 }
 async function registryMetadata(spreadsheetId){
  if(!/^[A-Za-z0-9_-]+$/.test(spreadsheetId||''))throw Error('Invalid private registry');await verifyOwner();
  return api('https://sheets.googleapis.com/v4/spreadsheets/'+spreadsheetId+'?fields=sheets(properties,tables)');
 }
 async function registryValues(spreadsheetId,title,columns){
  if(!/^[A-Za-z0-9_-]+$/.test(spreadsheetId||'')||!['Заявки','Выдачи','Журнал'].includes(title)||!['X','P','G'].includes(columns))throw Error('Invalid registry range');await verifyOwner();
  return api('https://sheets.googleapis.com/v4/spreadsheets/'+spreadsheetId+'/values/'+encodeURIComponent("'"+title+"'!A1:"+columns+'1000')+'?valueRenderOption=UNFORMATTED_VALUE');
 }
 async function findSent(operationId){
  await verifyOwner();const id=crypto.createHash('sha256').update(operationId).digest('hex')+'@nomad360.invalid';
  return api('https://gmail.googleapis.com/gmail/v1/users/me/messages?q='+encodeURIComponent('in:sent rfc822msgid:'+id)+'&maxResults=2');
 }
 return Object.freeze({verifyOwner,send,uploadArchive,sheetBatch,registryMetadata,registryValues,findSent});
}
module.exports={OWNER,mime,createGoogleWorkspace};
