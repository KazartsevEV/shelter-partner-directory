/* Nomad360 simple online services: optional examples and real blank reset.
 * Presentation/fixtures only: no changes to financial formulas or tax model.
 */
(function(root){
'use strict';
if(root.Nomad360SimpleExamples)return;
const sampleValues={
  self:[
    {monthlyBudget:350,cpc:0.65,ctr:1.8,cvrLead:8,cvrDeal:18,costConsult:55,costPack:240,ltv:20,months:3,mgmt:0,site:120,hosting:15,dom:2,magnet:20,acq:2.5,taxTurnover:6},
    {monthlyBudget:450,cpc:1.1,ctr:2.2,cvrLead:9,cvrDeal:20,costConsult:80,costPack:300,ltv:15,months:4,mgmt:0,site:180,hosting:19,dom:2,magnet:25,acq:2.8,taxTurnover:6}
  ],
  hired:[
    {monthlyBudget:120,cpc:0.5,ctr:2,cvrLead:12,cvrDeal:25,costConsult:120,costPack:440,ltv:35,months:3,mgmt:80,site:200,hosting:18,dom:2,magnet:25,acq:2.7,taxTurnover:6,markup:65},
    {monthlyBudget:240,cpc:0.85,ctr:2.1,cvrLead:10,cvrDeal:20,costConsult:160,costPack:650,ltv:25,months:4,mgmt:80,site:250,hosting:22,dom:2,magnet:30,acq:2.7,taxTurnover:6,markup:80}
  ],
  agent:[
    {monthlyBudget:480,cpc:0.8,ctr:1.9,cvrLead:10,cvrDeal:20,costConsult:140,costPack:720,ltv:25,months:3,mgmt:100,site:100,hosting:12,dom:2,magnet:30,acq:2.5,taxTurnover:6,agentPct:24,agentTaxTurnover:6},
    {monthlyBudget:800,cpc:1.1,ctr:2.4,cvrLead:12,cvrDeal:20,costConsult:75,costPack:380,ltv:30,months:4,mgmt:160,site:180,hosting:18,dom:2,magnet:35,acq:2.5,taxTurnover:6,agentPct:17,agentTaxTurnover:6}
  ]
};
const payers=[
  {monthlyBudget:'partner',mgmt:'partner',site:'me',hosting:'me',dom:'me',magnet:'partner'},
  {monthlyBudget:'partner',mgmt:'partner',site:'me',hosting:'me',dom:'me',magnet:'partner'}
];
const copy={
  ru:{
    title:'Примеры упрощённого расчёта',
    warning:'Сейчас в калькуляторе могут быть учебные цифры. Перед расчётом своего бизнеса нажмите «Сбросить значения»: поля очистятся.',
    changed:'Вы изменили учебные цифры. Для собственного расчёта сначала нажмите «Сбросить значения».',
    cleared:'Поля очищены. Укажите собственные значения: нули означают отсутствие соответствующих расходов; период — 1 месяц.',
    loaded:'Загружен учебный пример, не прогноз доходности вашего бизнеса. Для своего расчёта сначала сбросьте значения.',
    names:{
      self:['Частные онлайн-консультации','Онлайн-уроки языка'],
      hired:['Дизайн-проекты с подрядчиком','Консультации с наёмным специалистом'],
      agent:['Агент по привлечению клиентов','Агент по продажам онлайн-курсов']
    }
  },
  en:{
    title:'Examples for the simple calculation',
    warning:'The calculator may currently contain sample figures. Before calculating your own business, choose “Reset values” to clear the fields.',
    changed:'You have edited sample figures. Choose “Reset values” before entering your own business data.',
    cleared:'The fields are cleared. Enter your own data; zeros mean no such cost and the period is one month.',
    loaded:'A learning example is loaded, not a forecast of your business results. Reset the values before entering your data.',
    names:{
      self:['Independent online consulting','Private online language lessons'],
      hired:['Design projects with a contractor','Consulting with a hired specialist'],
      agent:['Customer acquisition agent','Online course sales agent']
    }
  },
  kk:{
    title:'Жеңілдетілген есеп мысалдары',
    warning:'Калькуляторда қазір үлгі сандар болуы мүмкін. Өз бизнесіңізді есептемес бұрын «Мәндерді бастапқы күйге келтіру» батырмасын басып, өрістерді тазалаңыз.',
    changed:'Сіз үлгі сандарды өзгерттіңіз. Өз деректеріңізді енгізер алдында өрістерді тазалаңыз.',
    cleared:'Өрістер тазаланды. Өз мәліметтеріңізді енгізіңіз: нөл — тиісті шығын жоқ, кезең — бір ай.',
    loaded:'Оқу мысалы жүктелді, бұл сіздің бизнесіңіздің табыс болжамы емес. Өз есептеуіңізден бұрын мәндерді тазалаңыз.',
    names:{
      self:['Жеке онлайн кеңестер','Тілден жеке онлайн сабақтар'],
      hired:['Мердігермен дизайн жобалары','Жалдамалы маманмен кеңестер'],
      agent:['Клиент тарту агенті','Онлайн курс сату агенті']
    }
  }
};
let currentNotice='warning',currentExample=-1,shownRole='self';
const lang=()=>{const x=root.Nomad360UI?.getLanguage?.()||document.documentElement.lang||'ru';return copy[x]||copy[String(x).slice(0,2)]?String(x).slice(0,2):'ru';};
const t=()=>copy[lang()]||copy.ru;
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mode(){return typeof serviceMode==='string'&&sampleValues[serviceMode]?serviceMode:'self';}
function resetToBlank(){
  // 'months' must be >=1 by the current V1 validation; all business amounts = 0.
  currentValues=Object.fromEntries(Object.keys(defaults).map(key=>[key,key==='months'?1:0]));
  agentPayers={...defaultAgentPayers};
  currentNotice='cleared';currentExample=-1;
  initInputs();calculate();render();
}
function applyExample(index){
  const role=mode(),example=sampleValues[role]?.[index];
  if(!example||serviceFinancialMode!=='simple')return;
  // The fixtures fill existing input keys only; the original calculator owns all math.
  currentValues={...Object.fromEntries(Object.keys(defaults).map(key=>[key,key==='months'?1:0])),...example};
  agentPayers={...defaultAgentPayers,...(role==='agent'?payers[index]:{})};
  currentNotice='loaded';currentExample=index;
  initInputs();calculate();render();
}
function render(){
  const panel=document.getElementById('nomad-simple-service-examples');
  if(!panel)return;
  const isSimple=serviceFinancialMode==='simple';
  panel.hidden=!isSimple;
  if(!isSimple)return;
  const role=mode(),locale=t();shownRole=role;
  panel.innerHTML='<h3 class="nomad-simple-demo-title">'+escapeHtml(locale.title)+'</h3>'+
    '<div class="nomad-simple-demo-buttons">'+locale.names[role].map((name,index)=>
      '<button type="button" class="nomad-simple-demo-button" data-simple-demo="'+index+'" aria-pressed="'+(currentExample===index?'true':'false')+'">'+
      escapeHtml(name)+'</button>').join('')+'</div>'+
    '<p class="nomad-simple-demo-note" role="note">'+escapeHtml(locale[currentNotice])+'</p>';
}
function boot(){
  const container=document.getElementById('service-inputs-column');
  if(!container||document.getElementById('nomad-simple-service-examples'))return;
  const panel=document.createElement('section');panel.id='nomad-simple-service-examples';
  panel.className='nomad-simple-demo-block';panel.setAttribute('data-nomad-no-translate','');
  container.prepend(panel);
  const oldSelect=root.selectServiceMode;
  if(typeof oldSelect==='function')root.selectServiceMode=function(role){
    const value=oldSelect.call(this,role);
    if(serviceFinancialMode==='simple'){currentExample=-1;currentNotice='warning';}
    render();return value;
  };
  // Override only the broken button's reset action; do not modify product/V2 resets.
  root.resetDefaults=resetToBlank;
  panel.addEventListener('click',event=>{
    const button=event.target.closest('[data-simple-demo]');
    if(button)applyExample(Number(button.getAttribute('data-simple-demo')));
  });
  container.addEventListener('input',event=>{
    if(event.target.closest('#inputs-container')&&currentNotice!=='cleared'){
      currentNotice='changed';currentExample=-1;
      const note=panel.querySelector('.nomad-simple-demo-note');if(note)note.textContent=t().changed;
      panel.querySelectorAll('[data-simple-demo]').forEach(button=>button.setAttribute('aria-pressed','false'));
    }
  });
  document.addEventListener('nomad360:languagechange',render);
  render();
}
root.Nomad360SimpleExamples=Object.freeze({resetToBlank,applyExample});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
