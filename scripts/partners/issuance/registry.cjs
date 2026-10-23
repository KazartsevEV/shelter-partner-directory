'use strict';
const model=require('../../../nomad360_partner_application_model.js');
const headers=Object.freeze({
 applications:['ID заявки','Получена (UTC)','Компания','Сфера деятельности','Использование продукта','Сотрудники','Сегмент клиентов','Сайт','ФИО','Должность','Email','Телефон / мессенджер','Согласие на обработку','Публичный профиль разрешён','Версия согласия','Согласие дано (UTC)','Язык','Статус email','Email подтверждён (UTC)','Рассмотрение','Домен размещения','Проверка домена','Комментарий','ID записи Formspree'],
 issuances:['ID выдачи','ID заявки','ID пакета','Версия пакета','Домен','Git revision','SHA-256 HTML','Drive ID ZIP','SHA-256 ZIP','Шифрование','Статус выдачи','Gmail message ID','Почта принята Gmail (UTC)','Подтверждение доставки','Обновлено (UTC)','Примечание'],
 events:['ID события','Время (UTC)','ID заявки','ID выдачи','Операция','Результат','ID провайдера']
});
function applicationRow(application,{receivedAt,formspreeId='',record}={}){
 const checked=model.validate({...application,consentProcessing:application?.consent_processing,consentPublicProfile:application?.consent_public_profile});
 if(!checked.valid||typeof application.application_id!=='string'||!Number.isFinite(Date.parse(receivedAt)))throw Error('Invalid application projection');
 const v=checked.values;
 return [application.application_id,receivedAt,v.company,v.activity,v.intendedUse,v.employees,v.clientSegment,v.website,v.fullName,v.role,v.email,v.phoneMessenger,true,checked.consentPublicProfile,application.consent_version,application.consented_at,application.interface_language,record?.emailVerifiedAt?'email_verified':record?.verificationAcceptedAt?'email_sent':'new',record?.emailVerifiedAt||'','pending',record?.config.deployment.origin||'',record?.domainReview?'reviewed':'pending','',formspreeId];
}
function issuanceRow(record,{issuanceId,driveId='',note=''}={}){
 if(!record?.archive||!issuanceId)throw Error('Prepared issuance required for projection');
 const status={prepared:'prepared',archive_sending:'sending',delivery_accepted:'accepted',send_unknown:'unknown',send_failed:'failed'}[record.status];
 if(!status)throw Error('Unsupported issuance status');
 return [issuanceId,record.id,record.config.packageId,record.config.packageVersion,record.config.deployment.origin,record.archive.sourceRevision,record.archive.htmlSha256,driveId,record.archive.sha256,record.archive.encryption,status,record.archiveMessageId||'',record.archiveAcceptedAt||'','',record.updatedAt,note];
}
function eventRow({id,at,applicationId='',issuanceId='',operation,result,providerId=''}){
 if(!id||!operation||!['pending','success','failed','unknown'].includes(result)||!Number.isFinite(Date.parse(at)))throw Error('Invalid journal event');
 return [id,at,applicationId,issuanceId,operation,result,providerId];
}
function updateRow(sheetId,rowIndex,values){
 if(!Number.isSafeInteger(sheetId)||sheetId<0||!Number.isSafeInteger(rowIndex)||rowIndex<1||!Array.isArray(values)||values.some(v=>!['string','number','boolean'].includes(typeof v)||typeof v==='number'&&!Number.isFinite(v)))throw Error('Invalid registry row');
 return {updateCells:{start:{sheetId,rowIndex,columnIndex:0},rows:[{values:values.map(v=>({userEnteredValue:typeof v==='boolean'?{boolValue:v}:typeof v==='number'?{numberValue:v}:{stringValue:v}}))}],fields:'userEnteredValue'}};
}
module.exports={headers,applicationRow,issuanceRow,eventRow,updateRow};
