/* Nomad360 bug reporting: isolated, opt-in text only.
 * No access to calculator inputs, localStorage, user documents or finance engines.
 * Public Formspree endpoint approved by the owner; no form-provider secrets are used.
 */
(function(root){
'use strict';
if(!root.document || document.documentElement.hasAttribute('data-nomad-embedded'))return;
const COPY={
 ru:{
  trigger:'Сообщить об ошибке',title:'Сообщить об ошибке',close:'Закрыть',collapse:'Свернуть вправо',
  description:'Опишите проблему с калькулятором. Аккаунт и имя не нужны.',
  message:'Что не работает?',messageHint:'Опишите ошибку',steps:'Как повторить проблему? (необязательно)',
  stepsHint:'Что вы сделали перед появлением ошибки?',email:'Email для ответа (необязательно)',
  emailHint:'name@example.com',privacy:'Будут переданы только описание ошибки, шаги, email (если указан), язык интерфейса и ширина экрана. Расчёты, сохранения, товары и документы не передаются. Обработчик может видеть IP-адрес и домен сайта.',
  send:'Отправить',sending:'Отправляем…',success:'Спасибо! Сообщение отправлено.',
  failure:'Не удалось отправить сообщение. Попробуйте ещё раз.',tooMany:'Слишком много запросов. Повторите позже.',
  unavailable:'Отправка пока не подключена. Форма доступна для ознакомления.',required:'Опишите ошибку перед отправкой.'
 },
 en:{
  trigger:'Report a bug',title:'Report a bug',close:'Close',collapse:'Collapse to the right',
  description:'Describe a problem with the calculator. No account or name is needed.',
  message:'What went wrong?',messageHint:'Describe the bug',steps:'Steps to reproduce (optional)',
  stepsHint:'What did you do before the problem appeared?',email:'Reply email (optional)',
  emailHint:'name@example.com',privacy:'Only your description, steps, email (if provided), interface language and screen width are sent. Calculations, saved drafts, products and documents are never sent. The provider may see your IP address and the site domain.',
  send:'Send report',sending:'Sending…',success:'Thank you! Your report has been sent.',
  failure:'The report could not be sent. Please try again.',tooMany:'Too many requests. Please try again later.',
  unavailable:'Sending is not configured yet. You can preview the form.',required:'Please describe the problem before sending.'
 },
 kk:{
  trigger:'Қате туралы хабарлау',title:'Қате туралы хабарлау',close:'Жабу',collapse:'Оңға жинау',
  description:'Калькулятордағы мәселені сипаттаңыз. Аккаунт пен аты-жөніңіз қажет емес.',
  message:'Қандай қате болды?',messageHint:'Қатені сипаттаңыз',steps:'Қатені қайталау қадамдары (міндетті емес)',
  stepsHint:'Қате шыққанға дейін не істедіңіз?',email:'Жауапқа арналған email (міндетті емес)',
  emailHint:'name@example.com',privacy:'Тек қате сипаттамасы, қадамдар, email (көрсетілсе), интерфейс тілі және экран ені жіберіледі. Есептеулер, сақталған деректер, тауарлар және құжаттар жіберілмейді. Қызмет көрсетуші IP-мекенжайыңызды және сайт доменін көруі мүмкін.',
  send:'Жіберу',sending:'Жіберілуде…',success:'Рақмет! Хабарламаңыз жіберілді.',
  failure:'Хабарлама жіберілмеді. Қайталап көріңіз.',tooMany:'Сұрау тым көп. Кейінірек қайталаңыз.',
  unavailable:'Жіберу қызметі әлі қосылмаған. Форманы қарап шығуға болады.',required:'Жіберер алдында қатені сипаттаңыз.'
 }
};
function language(){
 const code=root.Nomad360UI?.getLanguage?.()||root.Nomad360LocaleCore?.locale?.()||document.documentElement.lang;
 return code==='en'||code==='kk'?code:'ru';
}
const APPROVED_FORM_ID='mwlvadod';
function endpoint(){
 // Owner-approved public routing ID: no modification of the protected calculator HTML.
 // Explicit attribute overrides exist for isolated browser transport tests.
 const value=document.documentElement.getAttribute('data-nomad-bug-endpoint')||
  ('https://formspree.io/f/'+APPROVED_FORM_ID);
 return /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(value)?value:null;
}
function boot(){
 if(document.getElementById('nomad360-bug-launcher')||document.documentElement.hasAttribute('data-nomad-embedded'))return;
 const launcher=document.createElement('button');
 launcher.id='nomad360-bug-launcher';
 launcher.className='nomad-bug-launcher';
 launcher.type='button';
 launcher.setAttribute('aria-haspopup','dialog');
 launcher.setAttribute('aria-controls','nomad360-bug-dialog');
 launcher.setAttribute('data-nomad-no-translate','');
 launcher.innerHTML='<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M3 10v4a2 2 0 0 0 2 2h2l2 4h3l-2-5 9-4V5L7 9H5a2 2 0 0 0-2 1Z"/><path d="M20 9a3 3 0 0 1 0 6"/></svg><span data-bug-copy="trigger"></span>';

 const dock=document.createElement('div');
 dock.id='nomad360-bug-dock';
 dock.className='nomad-bug-dock';
 dock.setAttribute('data-nomad-no-translate','');
 const minimize=document.createElement('button');
 minimize.type='button';
 minimize.className='nomad-bug-dock-toggle';
 minimize.setAttribute('aria-controls','nomad360-bug-launcher');
 minimize.innerHTML='<span aria-hidden="true">›</span>';
 dock.append(launcher,minimize);
 let dockCollapsed=!!root.matchMedia?.('(max-width:600px)').matches;
 function setCollapsed(next){
  dockCollapsed=!!next;
  dock.classList.toggle('is-collapsed',dockCollapsed);
  minimize.hidden=dockCollapsed;
  launcher.dataset.dockState=dockCollapsed?'collapsed':'expanded';
 }
 setCollapsed(dockCollapsed);
 const dialog=document.createElement('dialog');
 dialog.id='nomad360-bug-dialog';
 dialog.className='nomad-bug-dialog';
 dialog.setAttribute('aria-labelledby','nomad360-bug-heading');
 dialog.setAttribute('aria-describedby','nomad360-bug-intro');
 dialog.setAttribute('data-nomad-no-translate','');
 dialog.innerHTML='<div class="nomad-bug-heading"><h2 id="nomad360-bug-heading" data-bug-copy="title"></h2>'+
  '<button type="button" class="nomad-bug-close" data-bug-close aria-label=""><span aria-hidden="true">×</span></button></div>'+
  '<p id="nomad360-bug-intro" data-bug-copy="description"></p>'+
  '<form id="nomad360-bug-form" novalidate>'+
  '<label for="nomad360-bug-message" data-bug-copy="message"></label>'+
  '<textarea id="nomad360-bug-message" name="message" maxlength="4000" rows="4" required></textarea>'+
  '<label for="nomad360-bug-steps" data-bug-copy="steps"></label>'+
  '<textarea id="nomad360-bug-steps" name="steps" maxlength="3000" rows="3"></textarea>'+
  '<label for="nomad360-bug-email" data-bug-copy="email"></label>'+
  '<input type="email" id="nomad360-bug-email" name="email" maxlength="254" autocomplete="email" inputmode="email"/>'+
  '<p class="nomad-bug-privacy" id="nomad360-bug-privacy" data-bug-copy="privacy"></p>'+
  '<div class="nomad-bug-actions"><button id="nomad360-bug-submit" type="submit" data-bug-copy="send"></button></div>'+
  '<p id="nomad360-bug-status" role="status" aria-live="polite" aria-atomic="true"></p>'+
  '</form>';
 document.body.append(dock,dialog);
 const form=dialog.querySelector('form'),submit=dialog.querySelector('#nomad360-bug-submit');
 const status=dialog.querySelector('#nomad360-bug-status');
 const message=dialog.querySelector('#nomad360-bug-message');
 const steps=dialog.querySelector('#nomad360-bug-steps');
 const email=dialog.querySelector('#nomad360-bug-email');
 const close=dialog.querySelector('[data-bug-close]');
 let sending=false,completed=false;
 function localize(){
  const t=COPY[language()];
  for(const element of [launcher,...dialog.querySelectorAll('[data-bug-copy]')]){
   const key=element.getAttribute('data-bug-copy');
   if(key&&t[key])element.textContent=t[key];
  }
  // Trigger text is a sibling of the icon. Do not replace the whole button.
  launcher.querySelector('[data-bug-copy="trigger"]').textContent=t.trigger;
  launcher.setAttribute('aria-label',t.trigger);
  launcher.title=t.trigger;
  minimize.setAttribute('aria-label',t.collapse);
  minimize.title=t.collapse;
  close.setAttribute('aria-label',t.close);
  message.placeholder=t.messageHint;steps.placeholder=t.stepsHint;email.placeholder=t.emailHint;
  if(sending)submit.textContent=t.sending;
  else if(!completed)submit.textContent=t.send;
  const outcome=status.getAttribute('data-result');
  status.textContent=outcome==='success'?t.success:outcome==='error'?t.failure:
    outcome==='tooMany'?t.tooMany:outcome==='unavailable'?t.unavailable:
    outcome==='required'?t.required:'';
 }
 function setStatus(name){
  if(name)status.setAttribute('data-result',name);
  else status.removeAttribute('data-result');
  localize();
 }
 function start(){
  if(!dialog.open){
   completed=false;
   submit.disabled=!endpoint();
   setStatus(endpoint()?null:'unavailable');
   dialog.showModal();
   message.focus();
  }
 }
 function syncKeyboard(){
  const view=root.visualViewport;
  dock.classList.toggle('is-keyboard',!!view && view.height<root.innerHeight-160);
 }
 root.visualViewport?.addEventListener('resize',syncKeyboard);
 root.visualViewport?.addEventListener('scroll',syncKeyboard);
 syncKeyboard();

 // Horizontal gesture only, leaving vertical page scrolling to the browser.
 // A collapsed megaphone remains a normal button that opens the report.
 let gesture=null,suppressClick=false;
 dock.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0)return;
  gesture={id:event.pointerId,x:event.clientX,y:event.clientY};
  try{dock.setPointerCapture(event.pointerId)}catch(_){}
 });
 dock.addEventListener('pointerup',event=>{
  if(!gesture||gesture.id!==event.pointerId)return;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  gesture=null;
  if(Math.abs(dx)<44||Math.abs(dx)<Math.abs(dy)*1.3)return;
  suppressClick=true;
  setCollapsed(dx>0);
  root.setTimeout(()=>{suppressClick=false},400);
 });
 dock.addEventListener('pointercancel',()=>{gesture=null});
 dock.addEventListener('click',event=>{
  if(!suppressClick)return;
  event.preventDefault();event.stopPropagation();suppressClick=false;
 },true);
 minimize.addEventListener('click',()=>setCollapsed(true));
 launcher.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
   event.preventDefault();
   setCollapsed(event.key==='ArrowRight');
  }
 });
 launcher.addEventListener('click',start);
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{if(!sending)launcher.focus();});
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog||sending)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
 });
 document.addEventListener('nomad360:languagechange',localize);
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(sending||completed)return;
  const destination=endpoint();
  if(!destination){submit.disabled=true;setStatus('unavailable');return;}
  if(!message.value.trim()){setStatus('required');message.focus();return;}
  if(!email.checkValidity()){email.reportValidity();email.focus();return;}
  sending=true;submit.disabled=true;submit.setAttribute('aria-busy','true');setStatus(null);
  const t=COPY[language()];submit.textContent=t.sending;
  // Explicit allowlist: no serialization of form, URL, query string,
  // cookies, localStorage, file attachments, calculator or portfolio data.
  const payload=new FormData();
  payload.append('message',message.value.trim());
  if(steps.value.trim())payload.append('steps',steps.value.trim());
  if(email.value.trim())payload.append('email',email.value.trim());
  payload.append('interface_language',language());
  payload.append('viewport_width',String(Math.round(root.innerWidth)));
  payload.append('_subject','Nomad360 lite bug report');
  const controller=new AbortController();
  const timer=root.setTimeout(()=>controller.abort(),15000);
  try{
   const response=await root.fetch(destination,{
    method:'POST',body:payload,headers:{Accept:'application/json'},
    credentials:'omit',referrerPolicy:'strict-origin-when-cross-origin',signal:controller.signal
   });
   // A 2xx HTTP response alone is insufficient: confirm the handler result.
   let receipt=null;
   try{receipt=await response.json();}catch(_){}
   if(!response.ok||receipt?.ok!==true){
    setStatus(response.status===429?'tooMany':'error');return;
   }
   completed=true;form.reset();setStatus('success');
  }catch(_){setStatus('error');}
  finally{
   root.clearTimeout(timer);sending=false;submit.removeAttribute('aria-busy');
   submit.disabled=completed||!endpoint();
   submit.textContent=COPY[language()].send;
  }
 });
 localize();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})(window);
