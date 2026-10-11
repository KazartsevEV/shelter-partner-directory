/* Nomad360 shared decision-tree navigation.
 * UI-only. Never invokes start/reset/calculation methods when going back.
 * Live screen/step transitions are observed across V1, V2 and full service.
 */
(function(root){
 'use strict';
 const ids=['home-screen','service-work-screen','service-screen','agent-screen',
   'agent-complex-screen','product-screen','calculator-screen','full-service-screen',
   'portfolio-v2-screen'];
 const nav=document.getElementById('nomad360-tree-nav');
 const breadcrumbs=document.getElementById('nomad360-tree-crumbs');
 const back=document.getElementById('nomad360-tree-back');
 if(!nav||!breadcrumbs||!back)return;
 const dictionaries={
  ru:{home:'Главная',service:'Услуга',mode:'Режим расчёта',
    channel:'Онлайн / офлайн',online:'Онлайн',offline:'Офлайн',who:'Кто исполнитель',
    agent:'Я агент',commission:'Процент с продаж',complex:'Сложная мотивация',
    self:'Сам',hired:'Нанимаю',simple:'Упрощённый расчёт',full:'Полный расчёт',
    goods:'Товар',nameGood:'Название товара',nameService:'Название услуги',
    source:'Источник товара',expensesGood:'Расходы товара',
    expensesService:'Расходы услуги',summary:'Итоги бизнеса',portfolio:'Портфель V2',
    back:'Назад к'},
  en:{home:'Home',service:'Service',mode:'Calculation mode',
    channel:'Online / offline',online:'Online',offline:'Offline',who:'Service provider',
    agent:'I am an agent',commission:'Sales commission',complex:'Custom motivation',
    self:'Self',hired:'Hiring',simple:'Simple calculation',full:'Full calculation',
    goods:'Product',nameGood:'Product name',nameService:'Service name',
    source:'Product sourcing',expensesGood:'Product expenses',
    expensesService:'Service expenses',summary:'Business results',portfolio:'Portfolio V2',
    back:'Back to'},
  kk:{home:'Басты бет',service:'Қызмет',mode:'Есептеу режимі',
    channel:'Онлайн / офлайн',online:'Онлайн',offline:'Офлайн',who:'Орындаушы',
    agent:'Мен агентпін',commission:'Сатылым пайызы',complex:'Күрделі ынталандыру',
    self:'Өзім',hired:'Жалдаймын',simple:'Қарапайым есеп',full:'Толық есеп',
    goods:'Тауар',nameGood:'Тауар атауы',nameService:'Қызмет атауы',
    source:'Тауар көзі',expensesGood:'Тауар шығындары',
    expensesService:'Қызмет шығындары',summary:'Бизнес қорытындысы',
    portfolio:'V2 портфелі',back:'Қайту:'}
 };
 let trail=[],restoring=false,queued=false;
 const byId=id=>document.getElementById(id);
 const visible=el=>Boolean(el&&!el.hidden&&!el.classList.contains('hidden'));
 const locale=()=>String(root.Nomad360LocaleCore?.locale?.()||
    root.Nomad360UI?.getLanguage?.()||document.documentElement.lang||'ru').slice(0,2);
 const dict=()=>dictionaries[locale()]||dictionaries.ru;
 const mode=()=>typeof serviceFinancialMode==='string'?serviceFinancialMode:'simple';
 const channel=()=>typeof serviceChannel==='string'?serviceChannel:'online';
 const role=()=>typeof selectedServiceRole==='string'?selectedServiceRole:'self';
 const source=()=>typeof productSource==='string'?productSource:null;
 const onlineRole=()=>typeof serviceMode==='string'?serviceMode:'self';
 function active(){
  return ids.find(id=>visible(byId(id)))||null;
 }
 function productStage(){
  if(visible(byId('product-own-form')))return 'expenses';
  if(visible(byId('product-source-block')))return 'source';
  if(visible(byId('product-tax-block')))return 'summary';
  return 'name';
 }
 function label(screen,stage,d){
  const roleLabel=d[screen==='calculator-screen'?onlineRole():role()]||d.self;
  if(screen==='home-screen')return d.home;
  if(screen==='service-work-screen')return d.service+' · '+d.mode;
  if(screen==='service-screen')return d[channel()]+' · '+d.who;
  if(screen==='agent-screen')return d.agent+' · '+d.commission;
  if(screen==='agent-complex-screen')return d.complex;
  if(screen==='calculator-screen')return d.simple+' · '+roleLabel;
  if(screen==='full-service-screen')return d.full+' · '+d.service;
  if(screen==='portfolio-v2-screen')return d.portfolio;
  if(screen==='product-screen'){
   const service=source()==='offline-service';
   if(stage==='name')return service?d.nameService:d.nameGood;
   if(stage==='source')return d.source;
   if(stage==='summary')return d.summary;
   return service?d.expensesService:d.expensesGood;
  }
  return screen;
 }
 function capture(){
  const screen=active();
  if(!screen)return null;
  const stage=screen==='product-screen'?productStage():null;
  return {screen,stage,key:screen+(stage?':'+stage:''),label:label(screen,stage,dict())};
 }
 function render(){
  const d=dict();
  const entries=trail.filter(Boolean);
  nav.hidden=entries.length<2;
  if(nav.hidden)return;
  const parent=entries[entries.length-2];
  back.textContent='← '+d.back+' '+parent.label;
  back.setAttribute('aria-label',back.textContent);
  breadcrumbs.replaceChildren();
  entries.forEach((entry,i)=>{
   if(i){
    const separator=document.createElement('span');
    separator.className='nd-tree-separator';separator.textContent='›';
    separator.setAttribute('aria-hidden','true');breadcrumbs.appendChild(separator);
   }
   if(i===entries.length-1){
    const current=document.createElement('span');
    current.className='nd-tree-current';current.textContent=entry.label;
    current.setAttribute('aria-current','step');breadcrumbs.appendChild(current);
   }else{
    const link=document.createElement('button');
    link.type='button';link.dataset.journeyIndex=String(i);
    link.className='nd-tree-link';link.textContent=entry.label;
    link.setAttribute('aria-label',entry.label);
    breadcrumbs.appendChild(link);
   }
  });
 }
 function update(){
  if(restoring)return;
  const next=capture();if(!next)return;
  const last=trail[trail.length-1];
  if(last?.key===next.key){
   last.label=next.label;
  }else{
   const past=trail.findLastIndex(item=>item.key===next.key);
   if(past>=0){trail.length=past+1;trail[past]=next;}
   else trail.push(next);
  }
  render();
 }
 function schedule(){
  if(restoring||queued)return;
  queued=true;
  queueMicrotask(()=>{queued=false;update()});
 }
 function setVisible(el,yes){
  if(!el)return;
  el.hidden=!yes;el.classList.toggle('hidden',!yes);
 }
 function restoreProductStage(stage){
  const intro=byId('product-name-input')?.closest('.card');
  const sourceBlock=byId('product-source-block');
  const costs=byId('product-own-form');
  const tax=byId('product-tax-block');
  const isService=source()==='offline-service';
  if(stage==='name'){
   if(intro)intro.classList.remove('hidden');
   setVisible(sourceBlock,false);setVisible(costs,false);setVisible(tax,false);
  }else if(stage==='source'){
   if(intro)intro.classList.remove('hidden');
   setVisible(sourceBlock,true);setVisible(costs,false);setVisible(tax,false);
  }else if(stage==='expenses'){
   if(intro)intro.classList.remove('hidden');
   setVisible(sourceBlock,!isService);
   setVisible(costs,true);
  }else if(stage==='summary'){
   setVisible(sourceBlock,false);setVisible(costs,false);setVisible(tax,true);
  }
 }
 function goTo(index){
  if(!Number.isInteger(index)||index<0||index>=trail.length-1)return false;
  const target=trail[index];
  restoring=true;
  trail=trail.slice(0,index+1);
  if(target.screen==='product-screen')restoreProductStage(target.stage);
  // Native showOnly changes the visible screen but does NOT recalculate or reset.
  if(typeof root.showOnly==='function')root.showOnly(target.screen);
  else ids.forEach(id=>setVisible(byId(id),id===target.screen));
  render();
  queueMicrotask(()=>{restoring=false;update()});
  return true;
 }
 back.addEventListener('click',()=>goTo(trail.length-2));
 breadcrumbs.addEventListener('click',event=>{
  const button=event.target.closest('button[data-journey-index]');
  if(button)goTo(Number(button.dataset.journeyIndex));
 });
 document.addEventListener('nomad360:languagechange',()=>{
  trail=trail.map(entry=>({...entry,label:label(entry.screen,entry.stage,dict())}));
  render();
 });
 function boot(){
  const observer=new MutationObserver(schedule);
  for(const id of ids){
   const el=byId(id);
   if(el)observer.observe(el,{attributes:true,attributeFilter:['hidden','class']});
  }
  for(const id of ['product-source-block','product-own-form','product-tax-block']){
   const el=byId(id);
   if(el)observer.observe(el,{attributes:true,attributeFilter:['hidden','class']});
  }
  const intro=byId('product-name-input')?.closest('.card');
  if(intro)observer.observe(intro,{attributes:true,attributeFilter:['hidden','class']});
  trail=[{screen:'home-screen',stage:null,key:'home-screen',label:dict().home}];
  update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
 else boot();
 root.Nomad360TreeNav=Object.freeze({back:()=>goTo(trail.length-2),
  goTo,getTrail:()=>trail.map(({key,label})=>({key,label}))});
})(window);
