/* File-picker UI for local transport. No calculator globals or provider calls. */
(function(){
 'use strict';
 const T=window.Nomad360DraftTransfer;
 const lang=new URLSearchParams(location.search).get('lang');
 const language=['en','ru','kk'].includes(lang)?lang:'en';
 // EN is the wording canon; RU and KK share the same local-only contract.
 const copy={
 en:{title:'Transfer saved calculations',lead:'Save a local backup, then load it on the new website or in another browser.',scope:'Only saved drafts are included: V1, V2, linked V2, saved services and US Retail. Unsaved fields, PDF and Excel are not restorable drafts.',privacy:'The JSON file contains your financial data without encryption. Keep it private. Nothing is uploaded.',exportTitle:'1. Save on the old website',saveFirst:'Save your calculation in the calculator first. Close other calculator tabs before transferring.',export:'Save draft file',importTitle:'2. Load on the new website',fileButton:'Choose file',choose:'Choose your Nomad360 JSON file (up to 8 MB)',replace:'Replace the conflicting drafts after saving a backup of the current browser.',backupHint:'If drafts already exist here, save them with the button above before allowing replacement.',import:'Load drafts in this browser',nextTitle:'3. Continue your calculation',next:'After loading, open the calculator and choose its “Continue” action. Reload any calculator tab that was open. Loading does not change currencies or applied exchange rates. An identical draft is left unchanged.',calculator:'Open calculator',us:'Open US Retail',help:'Calculator help',exported:'The browser received the file for download. Check that it is saved before leaving this website.',loaded:'Drafts loaded. Open the calculator to continue.',unchanged:'These drafts are already present. Nothing was changed.',conflict:'An existing draft will be replaced only with your permission.',new:'New draft',same:'Already present',empty:'No saved drafts found. Save your calculation in the calculator first.',invalid:'Unsupported or damaged draft file. No import was completed.',unsafe:'This file contains unsupported markup or identifiers. No import was completed.',size:'The file exceeds supported size or nesting limits.',storage:'The browser could not save the drafts. The import was not completed.',concurrent:'Drafts changed in another tab. Close calculator tabs, reload this page and choose the file again.',recovery:'An interrupted import could not be restored. Keep your backup and contact support. No further import is allowed.',recovered:'An interrupted import was rolled back. Your previous drafts were restored.',backup:'Save a backup of the current browser before replacing drafts.'},
 ru:{title:'Перенести сохранённые расчёты',lead:'Сохраните локальную копию, затем загрузите её на новом сайте или в другом браузере.',scope:'Переносятся только сохранённые черновики: V1, V2, связанный V2, сохранённые услуги и US Retail. Несохранённые поля, PDF и Excel не заменяют восстанавливаемый черновик.',privacy:'JSON-файл содержит ваши финансовые данные без шифрования. Храните его в безопасном месте. Данные никуда не отправляются.',exportTitle:'1. Сохраните файл на старом сайте',saveFirst:'Сначала сохраните расчёт в калькуляторе. Перед переносом закройте другие вкладки калькулятора.',export:'Сохранить файл черновиков',importTitle:'2. Загрузите файл на новом сайте',fileButton:'Выбрать файл',choose:'Выберите JSON-файл Nomad360 (до 8 МБ)',replace:'Разрешаю заменить конфликтующие черновики после сохранения копии данных этого браузера.',backupHint:'Если в этом браузере уже есть черновики, сначала сохраните их кнопкой выше и только затем разрешите замену.',import:'Загрузить черновики в этот браузер',nextTitle:'3. Продолжите расчёт',next:'После загрузки откройте калькулятор и выберите действие «Продолжить». Обновите ранее открытые вкладки калькулятора. Загрузка не меняет валюты и применённые курсы. Одинаковый черновик остаётся без изменений.',calculator:'Открыть калькулятор',us:'Открыть US Retail',help:'Справка калькулятора',exported:'Файл передан браузеру для скачивания. Перед уходом с сайта убедитесь, что он сохранён.',loaded:'Черновики загружены. Откройте калькулятор, чтобы продолжить.',unchanged:'Эти черновики уже есть в браузере. Данные не изменились.',conflict:'Существующий черновик будет заменён только с вашего разрешения.',new:'Новый черновик',same:'Уже есть',empty:'Сохранённых черновиков нет. Сначала сохраните расчёт в калькуляторе.',invalid:'Файл не поддерживается или повреждён. Загрузка не завершена.',unsafe:'В файле есть неподдерживаемая разметка или идентификаторы. Загрузка не завершена.',size:'Превышен допустимый размер или глубина вложенности файла.',storage:'Браузер не смог сохранить черновики. Загрузка не завершена.',concurrent:'Черновики изменились в другой вкладке. Закройте вкладки калькулятора, обновите страницу и выберите файл заново.',recovery:'Не удалось восстановить данные после прерванной загрузки. Сохраните резервный файл и обратитесь в поддержку. Новая загрузка заблокирована.',recovered:'Прерванная загрузка отменена. Прежние черновики восстановлены.',backup:'Перед заменой сохраните копию черновиков этого браузера.'},
 kk:{title:'Сақталған есептерді тасымалдау',lead:'Жергілікті көшірмені сақтап, оны жаңа сайтта немесе басқа браузерде жүктеңіз.',scope:'Тек сақталған нобайлар тасымалданады: V1, V2, байланыстырылған V2, сақталған қызметтер және US Retail. Сақталмаған өрістер, PDF пен Excel қалпына келтірілетін нобайды алмастырмайды.',privacy:'JSON файлында қаржылық деректеріңіз шифрланбай сақталады. Оны қауіпсіз жерде сақтаңыз. Деректер ешқайда жіберілмейді.',exportTitle:'1. Ескі сайтта файлды сақтаңыз',saveFirst:'Алдымен есепті калькуляторда сақтаңыз. Тасымалдау алдында калькулятордың басқа қойындыларын жабыңыз.',export:'Нобайлар файлын сақтау',importTitle:'2. Жаңа сайтта файлды жүктеңіз',fileButton:'Файлды таңдау',choose:'Nomad360 JSON файлын таңдаңыз (8 МБ дейін)',replace:'Осы браузердегі деректердің көшірмесін сақтағаннан кейін қайшы нобайларды ауыстыруға рұқсат беремін.',backupHint:'Осы браузерде нобайлар болса, алдымен оларды жоғарыдағы түймемен сақтап, содан кейін ғана ауыстыруға рұқсат беріңіз.',import:'Нобайларды осы браузерге жүктеу',nextTitle:'3. Есепті жалғастырыңыз',next:'Жүктегеннен кейін калькуляторды ашып, «Жалғастыру» әрекетін таңдаңыз. Бұрын ашылған калькулятор қойындыларын жаңартыңыз. Жүктеу валюталар мен қолданылған бағамдарды өзгертпейді. Бірдей нобай өзгеріссіз қалады.',calculator:'Калькуляторды ашу',us:'US Retail ашу',help:'Калькулятор анықтамасы',exported:'Файл жүктеп алу үшін браузерге берілді. Сайттан шықпай тұрып, оның сақталғанын тексеріңіз.',loaded:'Нобайлар жүктелді. Жалғастыру үшін калькуляторды ашыңыз.',unchanged:'Бұл нобайлар браузерде бар. Деректер өзгерген жоқ.',conflict:'Сақталған нобай тек рұқсатыңызбен ауыстырылады.',new:'Жаңа нобай',same:'Бұрыннан бар',empty:'Сақталған нобайлар жоқ. Алдымен есепті калькуляторда сақтаңыз.',invalid:'Файлға қолдау көрсетілмейді немесе ол бүлінген. Жүктеу аяқталмады.',unsafe:'Файлда қолдау көрсетілмейтін белгілеу не идентификаторлар бар. Жүктеу аяқталмады.',size:'Файл көлемі немесе кірістірілу тереңдігі шектен асты.',storage:'Браузер нобайларды сақтай алмады. Жүктеу аяқталмады.',concurrent:'Нобайлар басқа қойындыда өзгерді. Калькулятор қойындыларын жауып, бетті жаңартып, файлды қайта таңдаңыз.',recovery:'Үзілген жүктеуден кейін деректер қалпына келмеді. Резервтік файлды сақтап, қолдау қызметіне хабарласыңыз. Жаңа жүктеу бұғатталған.',recovered:'Үзілген жүктеу тоқтатылды. Алдыңғы нобайлар қалпына келтірілді.',backup:'Ауыстыру алдында осы браузердегі нобайлардың көшірмесін сақтаңыз.'}
 }[language];
 document.documentElement.lang=language;document.title=copy.title+' | Nomad360';
 document.querySelectorAll('[data-copy]').forEach(el=>el.textContent=copy[el.dataset.copy]);
 document.querySelectorAll('nav [lang]').forEach(el=>{if(el.lang===language)el.setAttribute('aria-current','page')});
 const recordLabels=Object.fromEntries(Object.keys(T.keys).map((key,i)=>[key,({en:['V1','V2','Linked V2','Service tax','Legacy service','US Retail','US Retail reset'],ru:['V1','V2','Связанный V2','Налог услуги','Услуга прежнего формата','US Retail','Сброс US Retail'],kk:['V1','V2','Байланыстырылған V2','Қызмет салығы','Ескі форматтағы қызмет','US Retail','US Retail қалпына келтіру']})[language][i]]));
 const el=id=>document.getElementById(id),status=(id,key)=>{el(id).textContent=copy[key]||copy.invalid;el(id).dataset.state=key};
 el('draft-calculator').href='../Marketing_calc.HTML?lang='+language;
 el('draft-us').href='../US_Retail_Demo.HTML?lang='+language;
 el('draft-help').href='../'+language+'/help/';
 function safeMarkup(html){
  const template=document.createElement('template');template.innerHTML=html;
  const tags=new Set(['DIV','LABEL','SPAN','P','B','STRONG','SMALL','INPUT','SELECT','OPTION','BUTTON']);
  const attributes=new Set(['class','type','min','max','step','value','readonly','disabled','checked','selected','placeholder','tabindex','hidden','name','role','title','inputmode','autocomplete']);
  const handlers=/^(?:(?:updateCalculatedMaterialsCost|updateEquipmentRentalTotal|updateEquipmentDepreciationTotal)\(\)|removeMaterialRow\(this\)|removeEquipmentRow\(this, '(?:rental|purchase)'\))$/;
  const nodes=template.content.querySelectorAll('*');if(nodes.length>10000)return false;
  for(const node of nodes){
   if(node.namespaceURI!=='http://www.w3.org/1999/xhtml'||!tags.has(node.tagName))return false;
   for(const {name,value}of [...node.attributes]){
    if(name.startsWith('on')){if(!['onclick','oninput'].includes(name)||!handlers.test(value))return false;continue;}
    if(name==='style'){if(!/^(?:display:\s*(?:none|block);?\s*)?$/.test(value))return false;continue;}
    if(!attributes.has(name)&&!/^(?:data|aria)-[a-z0-9-]+$/.test(name))return false;
    if(/[<>]/.test(value)||T.unsafeText(value))return false;
    if(name==='type'&&!['button','text','number','url','checkbox','radio'].includes(value))return false;
   }
  }
  return true;
 }
 // Read-only validation is exposed for independent browser regression tests.
 window.Nomad360DraftMarkup=Object.freeze({validate:safeMarkup});
 let plan=null,backup=null,recoveryBlocked=false,reading=0;
 const signature=()=>JSON.stringify(T.snapshot(window.localStorage));
 function sync(){
  const conflicts=plan?.conflicts.length>0;
  el('draft-replace-label').hidden=!conflicts;
  el('draft-import').disabled=recoveryBlocked||!plan||(conflicts&&(!el('draft-replace').checked||backup!==JSON.stringify(plan.before)));
 }
 try{if(T.recover(window.localStorage))status('draft-import-status','recovered')}
 catch(error){recoveryBlocked=true;status('draft-import-status',error.code||'storage')}
 sync();
 el('draft-export').addEventListener('click',()=>{
  try{
   const text=T.exportFile(window.localStorage,safeMarkup),before=signature();
   const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');
   a.href=url;a.download='nomad360-drafts-'+new Date().toISOString().slice(0,10)+'.json';a.click();
   setTimeout(()=>URL.revokeObjectURL(url),30000);backup=before;
   status('draft-export-status','exported');sync();
  }catch(error){status('draft-export-status',error.code||'storage')}
 });
 el('draft-choose').addEventListener('click',()=>el('draft-file').click());
 el('draft-file').addEventListener('change',async event=>{
  const attempt=++reading;delete el('draft-import-status').dataset.state;plan=null;el('draft-replace').checked=false;el('draft-preview').replaceChildren();sync();
  const file=event.target.files?.[0];el('draft-filename').textContent=file?.name||'';if(!file)return;
  try{
   if(file.size>T.limit)throw {code:'size'};
   const text=await file.text();if(attempt!==reading)return;
   plan=T.preview(window.localStorage,text,safeMarkup);
   for(const row of plan.file.records){
    const li=document.createElement('li');
    li.textContent=recordLabels[row.key]+' — '+(plan.conflicts.includes(row.key)?copy.conflict:plan.before[row.key]===row.value?copy.same:copy.new);
    el('draft-preview').append(li);
   }
   el('draft-import-status').textContent=plan.conflicts.length?copy.backup:'';sync();
  }catch(error){plan=null;status('draft-import-status',error.code||'invalid');sync();}
 });
 el('draft-replace').addEventListener('change',sync);
 el('draft-import').addEventListener('click',async()=>{
  if(el('draft-import').disabled)return;
  el('draft-import').disabled=true;
  try{
   const commit=()=>T.apply(window.localStorage,plan,{replace:el('draft-replace').checked,htmlValidator:safeMarkup});
   const result=navigator.locks?await navigator.locks.request('nomad360-draft-transfer',commit):commit();
   plan=null;backup=null;status('draft-import-status',result.imported?'loaded':'unchanged');sync();
  }catch(error){plan=null;backup=null;try{recoveryBlocked=error.code==='recovery'||window.localStorage.getItem(T.journalKey)!==null}catch(_){recoveryBlocked=true}status('draft-import-status',error.code||'storage');sync();}
 });
 window.addEventListener('storage',event=>{
  if(event.key===null||Object.hasOwn(T.keys,event.key)||event.key===T.journalKey){
   ++reading;plan=null;backup=null;el('draft-replace').checked=false;el('draft-preview').replaceChildren();
   if(event.key===T.journalKey&&event.newValue!==null)recoveryBlocked=true;
   status('draft-import-status','concurrent');sync();
  }
 });
})();
