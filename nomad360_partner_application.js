/* Isolated partner application UI. Reads only its own fields and consent choices. */
(function(root){
'use strict';
if(!root.document||document.documentElement.hasAttribute('data-nomad-embedded'))return;
const MODEL=root.Nomad360PartnerApplicationModel,TRANSPORT=root.Nomad360PartnerTransport;
// A distinct, owner-supplied public routing ID is required. Never use the bug form.
const APPROVED_ENDPOINT='https://formspree.io/f/xqppzrbp';
const COPY={
 en:{trigger:'Become a Nomad360 Business Solutions partner',title:'Partner application',intro:'Tell us about your business and how you would like to use our calculator. Fields marked * are required.',close:'Close',business:'Your business',contact:'Contact details',company:'Company name (optional)',activity:'What does your business do? *',intendedUse:'How would you use our product? *',employees:'Number of employees *',clientSegment:'Main client segment *',fullName:'Full name *',role:'Role (optional)',email:'Email *',phoneMessenger:'Phone or messenger (optional)',website:'Company website (optional)',choose:'Select a segment',segments:['Self-employed / micro businesses','Small businesses','Medium-sized businesses','Large businesses','Mixed business sizes','Individuals'],consentProcessing:'I consent to Nomad360 processing these details to review my application and contact me.',consentPublicProfile:'After review, Nomad360 may publish my company name, website and business activity in its partner directory. My personal contact details will stay private.',privacy:'Your application and consent choices will be sent to Nomad360 through Formspree. The provider may receive your IP address and site origin. Calculator inputs and saved drafts are not sent. To correct or delete your application, email',send:'Send application',sending:'Sending…',success:'Thank you! Your application has been received. We will contact you at the email you provided.',failure:'The application could not be sent. Your entries are still here. Please try again.',tooMany:'Too many requests. Please try again later.',rejected:'The form service rejected the application. Check your entries and try again.',unavailable:'Applications are not connected yet. You can review the form; sending is unavailable.',required:'Please complete this field.',invalid:'Please enter a valid value.',consentRequired:'Consent to processing is required to send the application.'},
 ru:{trigger:'Стать партнёром Nomad360 Business Solutions',title:'Заявка на партнёрство',intro:'Расскажите о своём бизнесе и о том, как хотите использовать калькулятор. Поля со знаком * обязательны.',close:'Закрыть',business:'О вашем бизнесе',contact:'Контактные данные',company:'Название компании (необязательно)',activity:'Чем занимается ваш бизнес? *',intendedUse:'Как хотите использовать наш продукт? *',employees:'Количество сотрудников *',clientSegment:'Основной сегмент клиентов *',fullName:'ФИО *',role:'Должность (необязательно)',email:'Почта *',phoneMessenger:'Телефон или мессенджер (необязательно)',website:'Сайт компании (необязательно)',choose:'Выберите сегмент',segments:['Самозанятые / микробизнес','Малый бизнес','Средний бизнес','Крупный бизнес','Бизнесы разного размера','Частные лица'],consentProcessing:'Согласен на обработку этих сведений Nomad360 для рассмотрения заявки и связи со мной.',consentPublicProfile:'После проверки Nomad360 может разместить название моей компании, сайт и сферу деятельности в каталоге партнёров. Мои личные контактные данные останутся закрытыми.',privacy:'Заявка и выбранные согласия поступят в Nomad360 через Formspree. Провайдер может получать IP-адрес и домен сайта. Данные калькулятора и сохранённые расчёты не передаются. Для исправления или удаления заявки напишите на',send:'Отправить заявку',sending:'Отправляем…',success:'Спасибо! Заявка получена. Мы свяжемся с вами по указанной почте.',failure:'Не удалось отправить заявку. Введённые данные сохранены в форме. Попробуйте ещё раз.',tooMany:'Слишком много запросов. Повторите позже.',rejected:'Сервис отклонил заявку. Проверьте поля и повторите отправку.',unavailable:'Приём заявок пока не подключён. Форму можно посмотреть, отправка недоступна.',required:'Заполните это поле.',invalid:'Укажите корректное значение.',consentRequired:'Для отправки необходимо согласие на обработку данных.'},
 kk:{trigger:'Nomad360 Business Solutions серіктесі болу',title:'Серіктестікке өтінім',intro:'Бизнесіңіз және калькуляторды қалай пайдаланғыңыз келетіні туралы айтыңыз. * белгісі бар өрістер міндетті.',close:'Жабу',business:'Бизнесіңіз туралы',contact:'Байланыс деректері',company:'Компания атауы (міндетті емес)',activity:'Бизнесіңіз немен айналысады? *',intendedUse:'Өнімімізді қалай пайдаланғыңыз келеді? *',employees:'Қызметкерлер саны *',clientSegment:'Клиенттердің негізгі сегменті *',fullName:'Аты-жөніңіз *',role:'Лауазымыңыз (міндетті емес)',email:'Email *',phoneMessenger:'Телефон немесе мессенджер (міндетті емес)',website:'Компания сайты (міндетті емес)',choose:'Сегментті таңдаңыз',segments:['Өзін-өзі жұмыспен қамтығандар / микробизнес','Шағын бизнес','Орта бизнес','Ірі бизнес','Көлемі әртүрлі бизнестер','Жеке тұлғалар'],consentProcessing:'Өтінімді қарау және менімен байланысу үшін осы деректерді Nomad360 өңдеуіне келісемін.',consentPublicProfile:'Тексеруден кейін Nomad360 компаниямның атауын, сайтын және қызмет саласын серіктестер каталогында жариялай алады. Жеке байланыс деректерім құпия қалады.',privacy:'Өтінім мен таңдалған келісімдер Nomad360 қызметіне Formspree арқылы жіберіледі. Провайдер IP-мекенжай мен сайт доменін алуы мүмкін. Калькулятор деректері мен сақталған есептер жіберілмейді. Өтінімді түзету немесе жою үшін мына email мекенжайына жазыңыз:',send:'Өтінімді жіберу',sending:'Жіберілуде…',success:'Рақмет! Өтініміңіз қабылданды. Көрсетілген email арқылы хабарласамыз.',failure:'Өтінім жіберілмеді. Енгізілген деректер нысанда сақталды. Қайталап көріңіз.',tooMany:'Сұрау тым көп. Кейінірек қайталаңыз.',rejected:'Қызмет өтінімді қабылдамады. Өрістерді тексеріп, қайта жіберіңіз.',unavailable:'Өтінім қабылдау әлі қосылмаған. Нысанды көруге болады, жіберу қолжетімсіз.',required:'Бұл өрісті толтырыңыз.',invalid:'Дұрыс мәнді енгізіңіз.',consentRequired:'Жіберу үшін деректерді өңдеуге келісім қажет.'}
};
const language=()=>{const value=root.Nomad360UI?.getLanguage?.()||document.documentElement.lang;return COPY[value]?value:'en';};
const destination=()=>{const value=document.documentElement.getAttribute('data-nomad-partner-endpoint')||APPROVED_ENDPOINT;return TRANSPORT.supportedEndpoint(value)?value:null;};
function boot(){
 if(document.getElementById('nomad360-partner-dialog'))return;
 const dialog=document.createElement('dialog');dialog.id='nomad360-partner-dialog';dialog.className='nomad-partner-dialog';dialog.setAttribute('data-nomad-no-translate','');dialog.setAttribute('aria-labelledby','nomad360-partner-title');dialog.setAttribute('aria-describedby','nomad360-partner-intro');
 dialog.innerHTML='<div class="nomad-partner-heading"><h2 id="nomad360-partner-title" data-partner-copy="title"></h2><button type="button" class="nomad-partner-close" data-partner-close>×</button></div><p id="nomad360-partner-intro" data-partner-copy="intro"></p>';
 const form=document.createElement('form');form.id='nomad360-partner-form';form.noValidate=true;
 for(const [group,keys] of [['business',['company','activity','intendedUse','employees','clientSegment','website']],['contact',['fullName','role','email','phoneMessenger']]]){
  const fieldset=document.createElement('fieldset'),legend=document.createElement('legend');legend.dataset.partnerCopy=group;fieldset.append(legend);
  for(const key of keys){
   const box=document.createElement('div');box.className='nomad-partner-field';
   const label=document.createElement('label');label.htmlFor='partner-'+key;label.dataset.partnerCopy=key;
   const field=document.createElement(key==='clientSegment'?'select':['activity','intendedUse'].includes(key)?'textarea':'input');field.id='partner-'+key;field.name=key;field.required=!!MODEL.fields[key].required;field.setAttribute('aria-describedby',field.id+'-error');
   if(field.tagName==='INPUT'){field.type=({employees:'number',email:'email',website:'url'})[key]||'text';field.maxLength=MODEL.fields[key].max;if(key==='employees'){field.min='0';field.max='1000000';field.step='1';field.inputMode='numeric';}field.autocomplete=({fullName:'name',role:'organization-title',company:'organization',email:'email',website:'url',phoneMessenger:'off'})[key]||'off';}
   if(key==='website')field.placeholder='https://example.com';
   if(field.tagName==='TEXTAREA'){field.rows=3;field.maxLength=MODEL.fields[key].max;}
   if(field.tagName==='SELECT'){for(const value of ['',...MODEL.segments]){const option=document.createElement('option');option.value=value;field.append(option);}}
   const error=document.createElement('p');error.id=field.id+'-error';error.className='nomad-partner-error';error.hidden=true;
   box.append(label,field,error);fieldset.append(box);
  }form.append(fieldset);
 }
 const privacy=document.createElement('p');privacy.id='nomad360-partner-privacy';privacy.className='nomad-partner-privacy';
 const privacyText=document.createElement('span');privacyText.dataset.partnerCopy='privacy';const mail=document.createElement('a');mail.href='mailto:nomad260393@gmail.com';mail.textContent='nomad260393@gmail.com';privacy.append(privacyText,' ',mail);form.append(privacy);
 for(const key of ['consentProcessing','consentPublicProfile']){
  const label=document.createElement('label');label.className='nomad-partner-check';
  const check=document.createElement('input');check.type='checkbox';check.id='partner-'+key;check.name=key;check.required=key==='consentProcessing';
  const text=document.createElement('span');text.dataset.partnerCopy=key;label.append(check,text);form.append(label);
 }
 const consentError=document.createElement('p');consentError.id='partner-consentProcessing-error';consentError.className='nomad-partner-error';consentError.hidden=true;form.elements.consentProcessing.setAttribute('aria-describedby',consentError.id);form.append(consentError);
 const submit=document.createElement('button');submit.type='submit';submit.id='nomad360-partner-submit';submit.dataset.partnerCopy='send';
 const status=document.createElement('p');status.id='nomad360-partner-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');form.append(submit,status);dialog.append(form);document.body.append(dialog);
 let sending=false,completed=false,statusKey=null,applicationId=null,consentedAt=null,errors={};
 const close=dialog.querySelector('[data-partner-close]');
 function mount(){
  const download=document.querySelector('#nomad360-embed [data-nomad-download-html]');if(!download)return;
  let button=document.getElementById('nomad360-partner-trigger');if(!button){button=document.createElement('button');button.id='nomad360-partner-trigger';button.type='button';button.className='nomad-embed-download nomad-partner-trigger';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',dialog.id);button.setAttribute('data-nomad-no-translate','');const group=document.createElement('div');group.className='nomad-partner-actions';download.before(group);group.append(download,button);}
  button.textContent=COPY[language()].trigger;
 }
 function localize(){
  const t=COPY[language()];mount();for(const node of dialog.querySelectorAll('[data-partner-copy]'))node.textContent=t[node.dataset.partnerCopy];close.setAttribute('aria-label',t.close);
  const options=form.elements.clientSegment.options;options[0].textContent=t.choose;MODEL.segments.forEach((_,i)=>options[i+1].textContent=t.segments[i]);
  for(const key of [...Object.keys(MODEL.fields),'consentProcessing']){
   const error=document.getElementById('partner-'+key+'-error');if(!error)continue;error.hidden=!errors[key];error.textContent=errors[key]?key==='consentProcessing'?t.consentRequired:t[errors[key]]:'';form.elements[key].setAttribute('aria-invalid',errors[key]?'true':'false');
  }
  submit.textContent=sending?t.sending:t.send;submit.disabled=sending||completed||!destination();status.textContent=t[statusKey]||(!destination()?t.unavailable:'');
 }
 function values(){const data={};for(const key of Object.keys(MODEL.fields))data[key]=form.elements[key].value;for(const key of ['consentProcessing','consentPublicProfile'])data[key]=form.elements[key].checked;return data;}
 function open(){if(!dialog.open){dialog.showModal();dialog.querySelector('input').focus();}localize();}
 document.addEventListener('click',event=>{if(event.target.closest('#nomad360-partner-trigger'))open();});
 close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>document.getElementById('nomad360-partner-trigger')?.focus({preventScroll:true}));
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 for(const event of ['nomad360:languagechange','nomad360:currencychange'])document.addEventListener(event,localize);
 form.addEventListener('input',event=>{if(errors[event.target.name]){delete errors[event.target.name];localize();}});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(sending||completed)return;
  const endpoint=destination();if(!endpoint){statusKey='unavailable';localize();return;}
  const input=values(),validation=MODEL.validate(input);errors=validation.errors;localize();if(!validation.valid){form.elements[Object.keys(errors)[0]].focus();return;}
  applicationId=applicationId||root.crypto.randomUUID();consentedAt=consentedAt||new Date().toISOString();
  const payload=MODEL.payload(input,{applicationId,language:language(),consentedAt});
  sending=true;statusKey=null;for(const fieldset of form.querySelectorAll('fieldset'))fieldset.disabled=true;form.elements.consentProcessing.disabled=true;form.elements.consentPublicProfile.disabled=true;submit.setAttribute('aria-busy','true');localize();
  const controller=new AbortController(),timer=root.setTimeout(()=>controller.abort(),15000);
  try{const result=await TRANSPORT.send(endpoint,payload,{fetch:root.fetch.bind(root),signal:controller.signal});statusKey=result.ok?'success':result.error;if(result.ok){completed=true;form.reset();errors={};}}
  finally{root.clearTimeout(timer);sending=false;for(const fieldset of form.querySelectorAll('fieldset'))fieldset.disabled=completed;form.elements.consentProcessing.disabled=completed;form.elements.consentPublicProfile.disabled=completed;submit.removeAttribute('aria-busy');localize();}
 });
 localize();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
