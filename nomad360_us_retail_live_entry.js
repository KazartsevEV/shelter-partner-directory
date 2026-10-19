/* HOME-WORKSPACE-01: visual-only presentation of real saved V1/V2 entries
   and two existing independent demo links. No writes, loads or calculations. */
(function(root){
'use strict';
const labels={
 ru:'Пример V2: магазин в США · 12 месяцев',
 en:'V2 example: US retail store · 12 months',
 kk:'V2 мысалы: АҚШ дүкені · 12 ай'
};
const translations={
 ru:{heading:'Продолжить расчёт',saved:'Мои расчёты',demos:'Примеры расчётов',
  v1:'Мой расчёт V1',v2:'Портфель V2',draft:'Черновик V2',
  linked:'Связан с карточками V1',aggregate:'Отдельная агрегированная модель',
  tote:'Хлопковый шоппер V1',toteNote:'Учебный пример · не заменяет ваши данные',
  store:'Магазин США V2 · 12 месяцев',storeNote:'Учебный пример портфеля V2',
  resume:'Продолжить',open:'Открыть'},
 en:{heading:'Continue your calculation',saved:'My calculations',demos:'Sample calculations',
  v1:'My V1 calculation',v2:'V2 portfolio',draft:'V2 draft',
  linked:'Linked to V1 cards',aggregate:'Separate aggregated model',
  tote:'Cotton tote bag V1',toteNote:'Sample · does not replace your data',
  store:'US retail store V2 · 12 months',storeNote:'Sample V2 portfolio',
  resume:'Continue',open:'Open'},
 kk:{heading:'Есептеуді жалғастыру',saved:'Менің есептеулерім',demos:'Есептеу мысалдары',
  v1:'Менің V1 есебім',v2:'V2 портфелі',draft:'V2 нобайы',
  linked:'V1 карточкаларымен байланысқан',aggregate:'Бөлек біріктірілген модель',
  tote:'Мақта шоппері V1',toteNote:'Оқу үлгісі · деректеріңізді алмастырмайды',
  store:'АҚШ дүкені V2 · 12 ай',storeNote:'V2 портфелінің оқу үлгісі',
  resume:'Жалғастыру',open:'Ашу'}
};
const icons={
 v1:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/>',
 v2:'<path d="m3 10 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 19l9 4 9-4"/>',
 draft:'<path d="M13 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m11 13 8-8 2 2-8 8-4 1 1-4Z"/>',
 tote:'<path d="M4 9h16l-1 12H5L4 9Z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
 store:'<path d="M4 10h16v11H4V10ZM2 9l2-6h16l2 6-2 2-4-2-4 2-4-2-4 2-2-2Z"/><path d="M9 21v-7h6v7"/>'
};
function element(tag,name,text){
 const node=document.createElement(tag);
 if(name)node.className=name;
 if(text!==undefined)node.textContent=text;
 return node;
}
function icon(name){
 const cell=element('span','nomad-workspace-icon');
 cell.setAttribute('aria-hidden','true');
 cell.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[name]+'</svg>';
 return cell;
}
function savedRow(id,name,subtitle){
 const row=document.getElementById(id);
 if(!row)return;
 row.classList.add('nomad-workspace-entry');
 row.prepend(icon(name));
 const body=row.querySelector('.nomad-recovery-body');
 if(body){
  body.prepend(element('span','nomad-workspace-title'));
  if(subtitle)body.append(element('span','nomad-workspace-subtitle'));
 }
 const button=row.querySelector('.nomad-recovery-action');
 if(button)button.classList.add('nomad-workspace-action');
 return row;
}
function demoRow(anchor,name){
 const row=element('div','nomad-workspace-demo-item');
 row.append(icon(name));
 const info=element('div','nomad-workspace-info');
 info.append(element('span','nomad-workspace-title'),element('span','nomad-workspace-subtitle'));
 row.append(info,anchor);
 return row;
}
function construct(){
 const home=document.getElementById('home-screen');
 const workspace=document.getElementById('nomad360-home-secondary');
 const currency=document.getElementById('business-currency-settings');
 const examples=workspace?.querySelector('.nomad-example-row');
 if(!home||!workspace||!currency||!examples)return;
 if(!workspace.classList.contains('nomad-workspace')){
  // The existing elements and IDs retain their real saved-state controllers.
  // Moving nodes never duplicates stored work or runs a resume handler.
  home.insertBefore(workspace,currency);
  workspace.classList.add('nomad-workspace');
  workspace.setAttribute('aria-labelledby','nomad-workspace-heading');
  const heading=element('h2','nomad-workspace-heading');
  heading.id='nomad-workspace-heading';
  workspace.prepend(heading);
  const saved=element('div','nomad-workspace-saved');
  saved.append(element('h3','nomad-workspace-group-label'));
  for(const tuple of [
   ['saved-product-entry','v1',false],
   ['portfolio-v2-linked-resume-home','v2',true],
   ['portfolio-v2-resume-home','draft',true]
  ]){
   const node=savedRow(...tuple);
   if(node)saved.append(node);
  }
  workspace.insertBefore(saved,examples);
  const demos=element('div','nomad-workspace-demos');
  demos.append(element('h3','nomad-workspace-group-label'));
  examples.before(demos);
  demos.append(examples);
  const tote=examples.querySelector('a[href*="demo=shopper"]');
  const store=document.getElementById('us-retail-v2-live-link');
  if(tote)examples.append(demoRow(tote,'tote'));
  if(store)examples.append(demoRow(store,'store'));
 }
 ensureLayout();
}
function ensureLayout(){
 if(document.getElementById('nomad360-workspace-layout'))return;
 const style=document.createElement('style');
 style.id='nomad360-workspace-layout';
 style.textContent="\n/* HOME-WORKSPACE-01: Owner-approved compact rows. Scoped to home only;\n   layered important selectors defeat TASK-10's older white recovery cards.\n   No hidden-state rules or price/calculation selectors are changed. */\n@layer nomad360-palette-important {\n body:has(#home-screen) #home-screen #nomad360-home-secondary.nomad-workspace {\n  display:block!important; margin:14px 0 0!important;padding:clamp(14px,3.4vw,22px)!important;\n  background-color:#173B58!important;border:1px solid #38678B!important;border-radius:14px!important;\n  box-shadow:none!important; color:#FFFFFF!important;min-width:0!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-heading{\n  color:#FFFFFF!important;font:700 clamp(22px,5vw,28px)/1.2 var(--nd-font,Inter,sans-serif)!important;\n  margin:0 0 14px!important;letter-spacing:-.025em!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-group-label{\n  color:#FFFFFF!important;font:600 16px/1.35 var(--nd-font,Inter,sans-serif)!important;\n  margin:12px 0 2px!important;padding:0!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-saved:not(:has(>.nomad-recovery-card:not([hidden]):not(.hidden))){\n  display:none!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-recovery-card:not([hidden]):not(.hidden),\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-demo-item{\n  display:grid!important;grid-template-columns:42px minmax(0,1fr) auto!important;\n  gap:10px!important;align-items:center!important;min-width:0!important;\n  padding:15px 0!important;margin:0!important;border:0!important;\n  border-radius:0!important;background-color:transparent!important;box-shadow:none!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-recovery-card[hidden],\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-recovery-card.hidden{\n  display:none!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-recovery-card:not(:first-of-type),\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-demo-item + .nomad-workspace-demo-item{\n  border-top:1px solid #38678B!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-saved .nomad-recovery-card:first-of-type{\n  border-top:0!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-icon {\n  display:flex!important;align-items:center!important;justify-content:center!important;\n  width:42px!important;height:42px!important;border-radius:10px!important;\n  background-color:#38678B!important;color:#FFFFFF!important;flex-shrink:0!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-icon svg{\n  display:block!important;width:23px!important;height:23px!important;\n  fill:none!important;stroke:#FFFFFF!important;stroke-width:1.8!important;\n  stroke-linecap:round!important;stroke-linejoin:round!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-recovery-body,\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-info{\n  min-width:0!important;padding:0!important;margin:0!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-title{\n  display:block!important;color:#FFFFFF!important;font:700 clamp(15px,3.7vw,18px)/1.28 var(--nd-font,Inter,sans-serif)!important;\n  margin:0!important;overflow-wrap:break-word!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-recovery-title,\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-recovery-note,\n body:has(#home-screen) #home-screen #nomad360-home-secondary #portfolio-v2-linked-resume-home .nomad-recovery-detail,\n body:has(#home-screen) #home-screen #nomad360-home-secondary #portfolio-v2-resume-home .nomad-recovery-detail{\n  display:none!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-recovery-detail,\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-subtitle{\n  display:block!important;color:#FFFFFF!important;\n  font:400 clamp(12px,3vw,14px)/1.4 var(--nd-font,Inter,sans-serif)!important;\n  margin:4px 0 0!important;overflow-wrap:anywhere!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-recovery-action,\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-example-link{\n  display:inline-flex!important;justify-content:flex-end!important;align-items:center!important;\n  min-height:44px!important;min-width:76px!important;width:auto!important;max-width:110px!important;\n  flex-shrink:0!important;padding:6px 1px!important;margin:0!important;border:0!important;\n  border-radius:0!important;background-color:transparent!important;box-shadow:none!important;\n  text-decoration:none!important;font-size:0!important;color:#FF913F!important;\n  cursor:pointer!important;white-space:nowrap!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-recovery-action::before,\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-example-link::before{\n  content:attr(data-workspace-action)!important;color:#FF913F!important;\n  font:600 clamp(12px,3.4vw,15px)/1.25 var(--nd-font,Inter,sans-serif)!important;\n  white-space:nowrap!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-recovery-action::after,\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-example-link::after{\n  content:\"›\"!important;color:#FF913F!important;font:400 27px/1 sans-serif!important;\n  margin-left:5px!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary :is(.nomad-recovery-action,.nomad-example-link):focus-visible{\n  outline:2px solid #FF913F!important;outline-offset:2px!important;border-radius:4px!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-example-row{\n  display:block!important;padding:0!important;margin:0!important;\n  border:0!important;background-color:transparent!important;min-width:0!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-demos{\n  margin-top:12px!important;border-top:1px solid #38678B!important;padding-top:10px!important;\n }\n body:has(#home-screen) #home-screen #nomad360-selling-choice .nomad-choice-grid{\n  display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;\n  grid-auto-rows:1fr!important;\n }\n body:has(#home-screen) #home-screen #nomad360-selling-choice .nomad-choice-button{\n  background-color:#FF913F!important;color:#173B58!important;border:1px solid #FF913F!important;\n  min-height:58px!important;min-width:0!important;padding:9px 6px!important;\n  display:flex!important;justify-content:center!important;align-items:center!important;\n  font:700 clamp(13px,3vw,18px)/1.2 var(--nd-font,Inter,sans-serif)!important;\n  text-align:center!important;overflow-wrap:break-word!important;\n }\n body:has(#home-screen) #home-screen #nomad360-selling-choice .nomad-choice-button:hover:not(:disabled){\n  background-color:#FF913F!important;color:#173B58!important;\n }\n body:has(#home-screen) #home-screen #business-currency-settings{\n  margin-top:14px!important;background-color:#173B58!important;color:#FFFFFF!important;\n  border:1px solid #38678B!important;border-radius:14px!important;\n }\n body:has(#home-screen) #home-screen #business-currency-settings #business-currency-question{\n  color:#FFFFFF!important;font:700 clamp(17px,4vw,22px)/1.25 var(--nd-font,Inter,sans-serif)!important;\n }\n body:has(#home-screen) #home-screen #business-currency-settings #business-currency-help{\n  font-size:13px!important;line-height:1.4!important;color:#FFFFFF!important;\n }\n}\n@media(max-width:390px){\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-recovery-card:not([hidden]):not(.hidden),\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-demo-item{\n  grid-template-columns:36px minmax(0,1fr) auto!important;gap:8px!important;\n }\n body:has(#home-screen) #home-screen #nomad360-home-secondary .nomad-workspace-icon{\n  width:36px!important;height:36px!important;\n }\n}\n\n@layer nomad360-palette-important {\n body:has(#home-screen) #home-screen #nomad360-selling-choice .nomad-choice-button {font-size:0!important;}\n body:has(#home-screen) #home-screen #nomad360-selling-choice .nomad-choice-button::after {\n  content:attr(data-workspace-short)!important;display:block!important;\n  font:700 clamp(13px,3vw,18px)/1.2 var(--nd-font,Inter,sans-serif)!important;\n  color:#173B58!important;white-space:normal!important;text-align:center!important;\n }\n}\n";
 document.head.append(style);
}
function sync(){
 construct();
 const lang=root.Nomad360UI?.getLanguage?.()||document.documentElement.lang||'ru';
 const active=Object.prototype.hasOwnProperty.call(translations,lang)?lang:'ru';
 const t=translations[active];
 // Compact display labels preserve the full original accessible button text.
 const compact=active==='ru'?['Товар','Услугу','Разное']:
  active==='en'?['Product','Service','Mixed']:['Тауар','Қызмет','Әртүрлі'];
 ['start-own-product','start-service','start-multi-portfolio'].forEach((id,i)=>{
  document.getElementById(id)?.setAttribute('data-workspace-short',compact[i]);
 });
 const heading=document.getElementById('nomad-workspace-heading');
 if(heading)heading.textContent=t.heading;
 const saved=document.querySelector('.nomad-workspace-saved>.nomad-workspace-group-label');
 const demos=document.querySelector('.nomad-workspace-demos>.nomad-workspace-group-label');
 if(saved)saved.textContent=t.saved;
 if(demos)demos.textContent=t.demos;
 for(const [id,key,note] of [
  ['saved-product-entry','v1',null],
  ['portfolio-v2-linked-resume-home','v2','linked'],
  ['portfolio-v2-resume-home','draft','aggregate']
 ]){
  const node=document.getElementById(id);if(!node)continue;
  const title=node.querySelector('.nomad-workspace-title');
  const subtitle=node.querySelector('.nomad-workspace-subtitle');
  const action=node.querySelector('.nomad-recovery-action');
  if(title)title.textContent=t[key];
  if(subtitle&&note)subtitle.textContent=t[note];
  if(action)action.setAttribute('data-workspace-action',key==='v1'?t.resume:t.open);
 }
 for(const [name,title,note] of [
  ['tote','tote','toteNote'],['store','store','storeNote']
 ]){
  // Identify demo from its preserved real href/ID, not its localized copy.
  const link=name==='tote'?
   document.querySelector('.nomad-example-row a[href*="demo=shopper"]'):
   document.getElementById('us-retail-v2-live-link');
  const row=link?.closest('.nomad-workspace-demo-item');
  if(!row)continue;
  row.querySelector('.nomad-workspace-title').textContent=t[title];
  row.querySelector('.nomad-workspace-subtitle').textContent=t[note];
  link.setAttribute('data-workspace-action',t.open);
 }
 const link=document.getElementById('us-retail-v2-live-link');
 if(link){
  link.textContent=labels[active];
  // Offline/portable embed cannot link to a neighbouring standalone demo.
  const target=document.documentElement.hasAttribute('data-nomad-embedded')
   ?'https://kazartsevev.github.io/shelter-partner-directory/US_Retail_Demo.HTML'
   :'./US_Retail_Demo.HTML';
  link.setAttribute('href',target+'?demo=us-retail-12m&lang='+encodeURIComponent(active));
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);
else sync();
document.addEventListener('nomad360:languagechange',sync);
})(window);
