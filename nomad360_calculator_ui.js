/* Nomad360 customer-facing UI ONLY. Never modifies V1/V2 inputs or finance. */
(function(root){
'use strict';
const L={
 ru:{
  brand:'NOMAD360',eyebrow:'БИЗНЕС-КАЛЬКУЛЯТОР',
  headline:'Бизнес-калькулятор',
  sub:'Каким бизнесом мне выгодно заниматься?',
  narrative:'Рассчитайте идею или существующий бизнес за 20 минут и узнайте, что принесет живые деньги.',
  mba:'Оценка перспектив бизнес-идеи и возможностей повысить эффективность действующего бизнеса.',
  privacy:'',
  print:'Сохранить расчёт в PDF',listTitle:'Сформировать прайс-лист?',listDesc:'Все товары и услуги портфеля с рассчитанными ценами V2 — в одном документе.',
  listAction:'Сформировать прайс-лист',listPrint:'Сохранить прайс-лист в PDF',listClose:'Скрыть прайс-лист',
  onlyReady:'Прайс-лист можно сформировать после подтверждения расчёта V2.',
  provisional:'Предварительная цена: порядок амортизации разовых затрат не подтверждён.',
  pdfHint:'Откроется стандартная печать браузера: выберите «Сохранить как PDF». Данные никуда не отправляются.',
  price:'Цена, у. е.',type:'Тип',item:'Товар / услуга',discount:'Индивидуальная скидка',customer:'Цена для покупателя',base:'Прайс V2',
  offer:'Скидки комплектов и связанные продажи применяются отдельно по условиям портфеля; этот прайс показывает цену каждой отдельной позиции.',
  report:'Расчёт экономики портфеля V2',horizon:'Горизонт',months:'мес.',summary:'Финансовый итог',revenue:'Выручка без НДС',
  profit:'Чистая прибыль',margin:'Маржа',cash:'Cash Flow',stock:'Продажи и остатки',resources:'Общие ресурсы',
  noTax:'НДС: Cash Flow показан без транзитного НДС, не как банковская выписка.',
  source:'Источник: локальный расчёт Nomad360. Цены и суммы ориентировочные, зависят от введённых данных и допущений.', 
  support:'Поддержать проект',supportSub:'Доступ к калькулятору бесплатный. Добровольная поддержка идёт на развитие калькулятора, AI-маркетолога и контент-фабрики.',
  email:'Связаться с разработчиком',feedback:'Заметили ошибку или есть предложение?',ctaTitle:'Следующий поход — AI-маркетолог и фабрика креативов.',
  ctaSub:'Готовим инструменты, которые помогают брендам находить клиентов и превращать идеи в контент без конвейера ручной рутины.',
  ctaMail:'Обсудить AI-маркетолога',threads:'Наш Threads',well:'Жолыңыз ашық, ісіңіз берекелі болсын!',
  rub:'Покупаю у других',own:'Делаю сам',drop:'Дропшиппинг',offline:'Офлайн-услуга',online:'Онлайн-услуга',
  required:'Расчёт не подтверждён. Исправьте указанные ошибки, прежде чем выгружать документ.',
  printInfo:'Подготовлено к печати. В диалоге выберите «Сохранить как PDF».',
  warning:'Внимание: в расчёте есть предварительные оценки, не подтверждённая бухгалтерская маржа.',
  month:'Месяц',paid:'Поступления',expense:'Расходы',tax:'Налог',interest:'Проценты',principal:'Тело кредита',balance:'Остаток',
  reportName:'Бизнес-калькулятор Nomad360',language:'Язык',cadenceMonthly:'Ежемесячно',cadenceOnce:'Разово'
 },
 en:{
  brand:'NOMAD360',eyebrow:'BUSINESS CALCULATOR',
  headline:'Business calculator',
  sub:'Which business would be most profitable for me?',
  narrative:'Calculate your business idea or existing business in 20 minutes and see what will generate actual cash.',
  mba:'Assess the financial outlook of a business idea or identify ways to improve an existing business.',
  privacy:'',
  print:'Save calculation as PDF',listTitle:'Create a price list?',listDesc:'All products and services with calculated V2 prices, together.',
  listAction:'Create price list',listPrint:'Save price list as PDF',listClose:'Hide price list',
  onlyReady:'Complete a valid V2 calculation before creating a price list.',
  provisional:'Provisional prices: one-off asset amortization is unconfirmed.',
  pdfHint:'Your browser print dialog will open. Choose “Save as PDF”. No data is uploaded.',
  price:'Price, units',type:'Type',item:'Product / service',discount:'Individual discount',customer:'Customer price',base:'V2 list price',
  offer:'Bundle discounts and linked offers apply separately; the list shows standalone prices.',
  report:'V2 portfolio financial calculation',horizon:'Forecast horizon',months:'months',summary:'Financial summary',revenue:'Revenue excluding VAT',
  profit:'Net profit',margin:'Margin',cash:'Cash flow',stock:'Sales and stock',resources:'Shared resources',
  noTax:'VAT: cash flow is presented excluding pass-through VAT; it is not a VAT-inclusive bank statement.',
  source:'Source: your local Nomad360 calculation. Figures depend on your inputs and scenario assumptions.',
  support:'Support this project',supportSub:'The calculator is free. Voluntary support funds development of the calculator, AI marketer and content factory.',
  email:'Contact the developer',feedback:'Found a bug or have an idea?',ctaTitle:'Next on the horizon: AI marketer & creative factory.',
  ctaSub:'We are building tools to help brands find customers and turn ideas into content without manual busywork.',
  ctaMail:'Ask about AI marketing',threads:'Our Threads',well:'Жолыңыз ашық, ісіңіз берекелі болсын!',
  rub:'Resale',own:'Own production',drop:'Dropshipping',offline:'Offline service',online:'Online service',
  required:'Calculation is not validated. Fix the errors before exporting.',
  printInfo:'Ready for printing. Choose “Save as PDF” in the print dialog.',
  warning:'Note: some estimated costs remain provisional; full accounting margin is unverified.',
  month:'Month',paid:'Receipts',expense:'Expenses',tax:'Tax',interest:'Interest',principal:'Loan principal',balance:'Balance',
  reportName:'Nomad360 Business Calculator',language:'Language',cadenceMonthly:'Monthly',cadenceOnce:'One-time'
 },
 kk:{
  brand:'NOMAD360',eyebrow:'БИЗНЕС-КАЛЬКУЛЯТОР',
  headline:'Бизнес-калькулятор',
  sub:'Маған қандай бизнеспен айналысқан тиімді?',
  narrative:'Бизнес-идеяңызды немесе жұмыс істеп тұрған бизнесіңізді 20 минутта есептеп, нақты ақшаны қай бағыт әкелетінін анықтаңыз.',
  mba:'Бизнес-идеяның қаржылық келешегін бағалау және қолданыстағы бизнестің тиімділігін арттыру жолдарын анықтау.',
  privacy:'',
  print:'Есепті PDF ретінде сақтау',listTitle:'Прайс-парақ жасаймыз ба?',listDesc:'Портфельдегі барлық тауар мен қызметтің есептелген V2 бағасы бір құжатта.',
  listAction:'Прайс-парақ жасау',listPrint:'Прайс-парақты PDF-ке сақтау',listClose:'Прайс-парақты жасыру',
  onlyReady:'Алдымен V2 есебін растаңыз.',provisional:'Алдын ала баға: біржолғы шығындардың амортизациясы расталмаған.',
  pdfHint:'Браузердің басып шығару терезесінен «PDF ретінде сақтау» тармағын таңдаңыз. Деректер жіберілмейді.',
  price:'Баға, ш.б.',type:'Түрі',item:'Тауар / қызмет',discount:'Жеке жеңілдік',customer:'Сатып алушы бағасы',base:'V2 баға тізімі',
  offer:'Жинақ жеңілдіктері мен байланысты сатылымдар бөлек есептеледі; бұл тізімде жеке позиция бағасы көрсетіледі.',
  report:'V2 портфелінің қаржылық есебі',horizon:'Есептеу мерзімі',months:'ай',summary:'Қаржылық қорытынды',
  revenue:'ҚҚС-сыз түсім',profit:'Таза пайда',margin:'Маржа',cash:'Ақша ағыны',stock:'Сатылым және қалдық',
  resources:'Ортақ ресурстар',noTax:'ҚҚС: ақша ағыны транзиттік ҚҚС-сыз көрсетілген, бұл банк көшірмесі емес.',
  source:'Дереккөз: браузеріңіздегі Nomad360 есебі. Нәтиже енгізілген мәліметтер мен болжамдарға байланысты.',
  support:'Жобаны қолдау',supportSub:'Калькулятор тегін. Ерікті қолдау калькуляторды, AI-маркетологты және контент фабрикасын дамытуға жұмсалады.',
  email:'Әзірлеушімен байланысу',feedback:'Қате таптыңыз ба, әлде ұсынысыңыз бар ма?',
  ctaTitle:'Келесі бағыт — AI-маркетолог пен креатив фабрикасы.',
  ctaSub:'Брендтерге клиент табуға және идеяларды артық қол еңбегінсіз контентке айналдыруға көмектесетін құралдар әзірлеп жатырмыз.',
  ctaMail:'AI-маркетолог туралы сұрау',threads:'Threads парақшамыз',well:'Жолыңыз ашық, ісіңіз берекелі болсын!',
  rub:'Қайта сату',own:'Өзім өндіремін',drop:'Дропшиппинг',offline:'Офлайн қызмет',online:'Онлайн қызмет',
  required:'Есеп расталмаған. Құжатты жасамас бұрын қателерді түзетіңіз.',
  printInfo:'Басып шығаруға дайын. «PDF ретінде сақтау» тармағын таңдаңыз.',
  warning:'Назар аударыңыз: есепте расталмаған шығындар бар, толық бухгалтерлік маржа нақтыланбаған.',
  month:'Ай',paid:'Түсім',expense:'Шығыс',tax:'Салық',interest:'Пайыз',principal:'Несие қарызы',balance:'Қалдық',
  reportName:'Nomad360 бизнес-калькуляторы',language:'Тіл',cadenceMonthly:'Ай сайын',cadenceOnce:'Бір рет'
 }
};
let lang='ru';
const localeKey='nomad360PreferredLanguage'; // UI preference only: never included in financial saved state
function userLocale(){try{const v=localStorage.getItem(localeKey);return L[v]?v:null}catch(_){return null}}
function preferred(){
 const candidates=Array.isArray(navigator.languages)&&navigator.languages.length?navigator.languages:[navigator.language||'ru'];
 for(const loc of candidates){const key=String(loc||'').split('-')[0].toLowerCase();if(L[key])return key}
 return 'en';
}
const tr=k=>(L[lang]||L.ru)[k]||L.ru[k]||k;
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const fmt=v=>new Intl.NumberFormat(lang==='kk'?'kk-KZ':lang==='en'?'en-US':'ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0);
const sourceType={own:'own',resale:'rub',dropship:'drop','offline-service':'offline','online-service':'online'};
const contact='mailto:nomad260393@gmail.com';
function hero(){
 return '<div class="nomad-marketing nomad-hero">'+
 '<h1>'+tr('headline')+'</h1>'+
 '<h2>'+tr('sub')+'</h2>'+
 '<h3>'+tr('narrative')+'</h3></div>';
}
// Footer content (support, products, license, data, official contact) is rendered by nomad360_header.js.
function footer(){
 return '<footer id="nomad360-footer" class="nomad-marketing nomad-footer" aria-label="Nomad360" data-nomad-no-translate></footer>';
}
function buildShell(){
 const home=document.getElementById('home-screen');
 if(home){const node=document.getElementById('nomad360-hero')||document.createElement('div');
  node.id='nomad360-hero';node.innerHTML=hero();if(!node.isConnected)home.prepend(node);}
 const foot=document.getElementById('nomad360-footer');
 if(foot){foot.outerHTML=footer()}else{document.body.insertAdjacentHTML('beforeend',footer())}
 let chooser=document.getElementById('nomad360-language-chooser');
 if(!chooser){chooser=document.createElement('div');chooser.id='nomad360-language-chooser';
 chooser.className='nomad-language';document.body.prepend(chooser);}
 chooser.innerHTML='<label for="nomad360-lang-select">'+tr('language')+'</label>'+
 '<select id="nomad360-lang-select" aria-label="'+tr('language')+'">'+
 [['ru','Русский'],['kk','Қазақша'],['en','English']].map(([key,label])=>
 '<option value="'+key+'"'+(key===lang?' selected':'')+'>'+label+'</option>').join('')+'</select>';
 document.documentElement.lang=lang;
}
function readyOutput(){
 const state=root.LinkedPortfolioV2UI?.getState?.();
 if(!state)return null;
 const out=root.LinkedPortfolioV2Engine?.build(state);
 return out?.ready&&Array.isArray(out.items)&&out.items.length?{state,out}:null;
}
function status(item,out){
 if(out.cashflow?.periodPnl?.accountingCompleteness==='PROVISIONAL'||item.status==='PROVISIONAL')return tr('provisional');
 if(item.status==='INFEASIBLE')return tr('required');
 return '';
}
function table(items,out){
 return '<table class="nomad-export-table"><thead><tr>'+
 [tr('item'),tr('type'),tr('base'),tr('discount'),tr('customer')].map(s=>'<th>'+esc(s)+'</th>').join('')+
 '</tr></thead><tbody>'+items.map(item=>
 '<tr><td>'+esc(item.name)+'</td><td>'+esc(tr(sourceType[item.source]||'item'))+'</td>'+
 '<td class="n">'+fmt(item.priceList)+'</td><td class="n">'+fmt(item.discountSelected)+'%</td>'+
 '<td class="n"><strong>'+fmt(item.priceGross)+'</strong></td></tr>').join('')+
 '</tbody></table>'+
 (out.cashflow?.periodPnl?.accountingCompleteness==='PROVISIONAL'?'<p class="nomad-alert">'+tr('warning')+'</p>':'')+
 '<p class="nomad-footnote">'+tr('offer')+'</p>';
}
function printable(mode,context){
 const {state,out}=context,p=out.cashflow?.periodPnl,cf=out.cashflow;
 const title=mode==='price'?tr('listAction'):tr('report');
 let html='<header class="nomad-print-head"><div>NOMAD360</div><h1>'+esc(title)+'</h1>'+
 '<p>'+tr('horizon')+': '+esc(state.forecastMonths||1)+' '+tr('months')+'</p></header>'+
 table(out.items,out);
 if(mode==='report'){
 const reportValues=[
  [tr('revenue'),p?.revenue??out.totals.revenue],
  [tr('profit'),p?.netProfit??out.totals.netProfit],
  [tr('margin'),p?.netMargin??null]
 ];
 html+='<h2>'+tr('summary')+'</h2><table class="nomad-export-table"><tbody>'+
 reportValues.map(([label,value],i)=>'<tr><td>'+esc(label)+'</td><td class="n">'+
 (value===null?'—':fmt(value)+(i===2?'%':''))+'</td></tr>').join('')+
 '</tbody></table>';
 if(p?.months?.length)html+='<h2>'+tr('summary')+' · '+tr('months')+'</h2><table class="nomad-export-table"><thead><tr>'+
 [tr('month'),tr('revenue'),tr('expense'),tr('profit'),tr('tax')].map(x=>'<th>'+esc(x)+'</th>').join('')+
 '</tr></thead><tbody>'+p.months.map(m=>'<tr><td>'+m.month+'</td>'+
 '<td class="n">'+fmt(m.revenue)+'</td><td class="n">'+fmt(m.revenue-m.preTaxProfit)+'</td>'+
 '<td class="n">'+fmt(m.netProfit)+'</td><td class="n">'+fmt(m.taxAccrued)+'</td></tr>').join('')+'</tbody></table>';
 if(cf?.months?.length)html+='<h2>'+tr('cash')+'</h2><table class="nomad-export-table"><thead><tr>'+
 [tr('month'),tr('paid'),tr('expense'),tr('tax'),tr('interest'),tr('principal'),tr('balance')].map(x=>'<th>'+esc(x)+'</th>').join('')+
 '</tr></thead><tbody>'+cf.months.map(m=>'<tr>'+
 [m.month,m.receipt,m.operatingOutflow,m.tax,m.interest,m.principalRepaid,m.cumulative].map((x,i)=>
 '<td'+(i?' class="n"':'')+'>'+(i?fmt(x):x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 if(out.resources?.length)html+='<h2>'+tr('resources')+'</h2><table class="nomad-export-table"><tbody>'+
 out.resources.map(x=>'<tr><td>'+esc(x.label)+'</td><td class="n">'+fmt(x.amount)+'</td>'+
 '<td>'+esc(tr(x.cadence==='once'?'cadenceOnce':'cadenceMonthly'))+'</td></tr>').join('')+'</tbody></table>';
 html+='<p class="nomad-footnote">'+tr('noTax')+'</p>';
 }
 html+='<footer class="nomad-print-end">'+tr('source')+' · NOMAD360</footer>';
 return html;
}
function showPreview(){
 const context=readyOutput();if(!context)return false;
 const host=document.getElementById('nomad360-price-preview');
 if(!host)return false;
 const hidden=host.hidden;
 host.hidden=!hidden;
 if(hidden){host.innerHTML='<h3>'+tr('listAction')+'</h3>'+table(context.out.items,context.out)+
 '<div class="nomad-export-row"><button type="button" data-nomad-export="price">'+tr('listPrint')+'</button>'+
 '<button type="button" data-nomad-hide-price>'+tr('listClose')+'</button></div>';
 }
 return hidden;
}
function savePrint(mode){
 const context=readyOutput();
 if(!context){
  document.getElementById('nomad360-print-sheet')?.remove();
  const label=document.getElementById('nomad360-export-feedback');
  if(label)label.textContent=tr('required');
  return false;
 }
 let sheet=document.getElementById('nomad360-print-sheet');
 if(!sheet){sheet=document.createElement('section');sheet.id='nomad360-print-sheet';document.body.append(sheet)}
 sheet.innerHTML=printable(mode,context);
 sheet.dataset.mode=mode;
 const label=document.getElementById('nomad360-export-feedback');if(label)label.textContent=tr('printInfo');
 root.print();
 return true;
}
function syncPortfolioActions(out){
 const host=document.getElementById('portfolio-v2-root');if(!host)return;
 const existingPreview=host.querySelector('#nomad360-price-preview');
 const keepPreview=existingPreview&&!existingPreview.hidden;
 let section=host.querySelector('#nomad360-portfolio-tools');
 if(!section){section=document.createElement('section');section.id='nomad360-portfolio-tools';
 host.append(section)}
 const can=!!out?.ready&&Array.isArray(out?.items)&&out.items.length>0;
 section.innerHTML='<div class="nomad-export-callout">'+
 '<div class="nomad-export-title">'+tr('listTitle')+'</div><p>'+tr('listDesc')+'</p>'+
 '<div class="nomad-export-row">'+
 '<button type="button" data-nomad-price-toggle'+(can?'':' disabled')+'>'+tr('listAction')+'</button>'+
 '<button type="button" data-nomad-export="report"'+(can?'':' disabled')+'>'+tr('print')+'</button></div>'+
 '<p class="nomad-footnote" id="nomad360-export-feedback">'+(can?tr('pdfHint'):tr('onlyReady'))+'</p>'+
 '<div id="nomad360-price-preview" hidden></div></div>';
 if(!can)section.dataset.ready='false';else section.dataset.ready='true';
 // Revoke invalid old print output and synchronize valid existing documents.
 const sheet=document.getElementById('nomad360-print-sheet');
 if(sheet){
  if(!can)sheet.remove();
  else if(['price','report'].includes(sheet.dataset.mode)){
   const currentState=root.LinkedPortfolioV2UI?.getState?.();
   if(currentState)sheet.innerHTML=printable(sheet.dataset.mode,{state:currentState,out});
  }
 }
 if(can&&keepPreview){
  const preview=section.querySelector('#nomad360-price-preview');
  preview.hidden=false;
  preview.innerHTML='<h3>'+tr('listAction')+'</h3>'+table(out.items,out)+
   '<div class="nomad-export-row"><button type="button" data-nomad-export="price">'+tr('listPrint')+'</button>'+
   '<button type="button" data-nomad-hide-price>'+tr('listClose')+'</button></div>';
 }
}
function handleClick(event){
 if(event.target.closest('[data-nomad-price-toggle]'))showPreview();
 const print=event.target.closest('[data-nomad-export]');
 if(print)savePrint(print.dataset.nomadExport);
 if(event.target.closest('[data-nomad-hide-price]')){
  const node=document.getElementById('nomad360-price-preview');if(node)node.hidden=true;
 }
}
function setLanguage(next){
 if(!L[next])return;
 lang=next;
 try{localStorage.setItem(localeKey,next)}catch(_){}
 buildShell();
 const payload=readyOutput();
 // The finance engine is never translated or re-run with altered inputs.
 if(document.getElementById('nomad360-portfolio-tools'))syncPortfolioActions(payload?.out||null);
 // Refresh an already-prepared print document in the newly selected UI locale,
 // without opening a print dialog or writing any financial input.
 const sheet=document.getElementById('nomad360-print-sheet');
 if(sheet&&payload&&['price','report'].includes(sheet.dataset.mode))
  sheet.innerHTML=printable(sheet.dataset.mode,payload);
 document.dispatchEvent(new CustomEvent('nomad360:languagechange',{detail:{lang}}));
}
function boot(){
 lang=userLocale()||preferred();buildShell();
 document.addEventListener('click',handleClick);
 document.addEventListener('change',event=>{
  if(event.target?.id==='nomad360-lang-select')setLanguage(event.target.value);
 });
}
root.Nomad360UI=Object.freeze({syncPortfolioActions,showPreview,savePrint,setLanguage,getLanguage:()=>lang,preferred});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
