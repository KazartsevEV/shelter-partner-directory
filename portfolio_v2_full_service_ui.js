/* ТЗ-02 UI: full service, powered by Nomad360FullServiceV2.
   Existing V1 form is the source of forecasts and costs; this screen adds
   only output VAT and owner's tax choice. Funding/horizon reuse shared V2 concepts. */
(function(root){
 'use strict';
 const Engine=root.Nomad360FullServiceV2;
 let input=null,source=null,result=null;
 const el=id=>document.getElementById(id);
 const escaped=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
 const money=x=>Number.isFinite(x)?x.toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
 const title={
  ru:{head:'Полная денежная модель услуги',price:'Цена с НДС',vat:'НДС, %',tax:'Налог',turnover:'С оборота',profit:'С прибыли',horizon:'Горизонт, месяцев',funding:'Финансирование',own:'Свои деньги',credit:'Кредит',reserve:'Резерв',capital:'Стартовый капитал',peak:'Пик дефицита',first:'Первый положительный CF',payback:'Окупаемость',noPayback:'Не окупится за выбранный горизонт',net:'Чистая прибыль',taxes:'Налоги',cash:'Деньги на руках',free:'Свободный остаток',debt:'Непогашенный кредит',rate:'Кредит, % годовых',term:'Срок кредита, мес.',month:'Месяц',revenue:'Выручка без НДС',cost:'Расходы',interest:'Проценты',taxCol:'Налог',amortCol:'Амортизация',profitCol:'Прибыль',flow:'Операционный CF',capex:'Оборудование',fundingIn:'Вложено / кредит',principal:'Тело кредита',netFlow:'Денежный поток',balance:'Остаток денег',save:'Сохранить расчёт',report:'Сохранить расчёт в PDF',back:'← К услуге',error:'Для расчёта завершите заполнение V1-услуги.',resume:'Продолжить сохранённый расчёт',saved:'Расчёт сохранён',portfolio:'Добавить в портфель V2'},
  en:{head:'Full service cash flow',price:'VAT-inclusive price',vat:'VAT, %',tax:'Business tax',turnover:'Turnover',profit:'Profit',horizon:'Horizon (months)',funding:'Funding',own:'Own funds',credit:'Credit',reserve:'Reserve',capital:'Startup capital',peak:'Peak deficit',first:'First positive CF',payback:'Payback',noPayback:'No payback within horizon',net:'Net profit',taxes:'Taxes',cash:'Cash on hand',free:'Available cash',debt:'Outstanding debt',rate:'Annual loan rate, %',term:'Loan term (months)',month:'Month',revenue:'Net-of-VAT revenue',cost:'Expenses',interest:'Interest',taxCol:'Tax',amortCol:'Depreciation',profitCol:'Profit',flow:'Operating CF',capex:'Equipment',fundingIn:'Owner / loan funding',principal:'Loan principal',netFlow:'Net cash flow',balance:'Cash balance',save:'Save calculation',report:'Save PDF',back:'← Service',error:'Complete V1 service inputs first.',resume:'Continue saved calculation',saved:'Calculation saved',portfolio:'Add to V2 portfolio'},
  kk:{head:'Қызметтің толық ақша ағыны',price:'ҚҚС-пен баға',vat:'ҚҚС, %',tax:'Салық',turnover:'Айналымнан',profit:'Пайдадан',horizon:'Кезең, ай',funding:'Қаржыландыру',own:'Өз қаражаты',credit:'Несие',reserve:'Резерв',capital:'Бастапқы капитал',peak:'Ең үлкен тапшылық',first:'Алғашқы оң CF',payback:'Өтелу мерзімі',noPayback:'Кезең ішінде өтелмейді',net:'Таза пайда',taxes:'Салықтар',cash:'Қолдағы ақша',free:'Бос қаражат',debt:'Несие қалдығы',rate:'Жылдық несие мөлшерлемесі, %',term:'Несие мерзімі, ай',month:'Ай',revenue:'ҚҚС-сыз кіріс',cost:'Шығындар',interest:'Пайыздар',taxCol:'Салық',amortCol:'Амортизация',profitCol:'Пайда',flow:'Операциялық CF',capex:'Жабдық',fundingIn:'Қаржыландыру',principal:'Несие сомасы',netFlow:'Ақша ағыны',balance:'Ақша қалдығы',save:'Есепті сақтау',report:'PDF сақтау',back:'← Қызмет',error:'Алдымен V1 деректерін толтырыңыз.',resume:'Сақталған есепті жалғастыру',saved:'Есеп сақталды',portfolio:'V2 портфеліне қосу'}
 };
 function lang(){return root.Nomad360UI?.getLanguage?.()||'ru';}
 function labels(){return title[lang()]||title.ru;}
 const STORAGE_KEY='nomad360-full-service-v2';

 const guide={
  ru:{step:'Условия расчёта',stepHint:'Проверьте налог, период и источник денег. Итог обновляется сразу после изменения поля.',
    summary:'Итог за выбранный период',summaryHint:'Все суммы указаны в денежных единицах расчёта. Прогноз может содержать дробные значения: это ожидаемое число клиентов.',
    months:'Деньги по месяцам',monthsHint:'Таблицу можно прокручивать горизонтально. Выручка указана без НДС, денежный поток — после расходов и налогов.',
    details:'Показать остальные показатели',priceOne:'Цена одной услуги с НДС',forecast:'Прогноз клиентов',foreFirst:'в первый месяц',foreMax:'максимум в месяц',foreEach:'в месяц',
    taxRate:'Ставка налога, %',creditOnly:'Параметры кредита',creditHint:'Появляются только при выборе финансирования «Кредит».',
    capitalNote:'Сколько денег потребуется для старта, включая резерв',profitNote:'Прибыль за весь выбранный период после налогов',freeNote:'Деньги к концу периода за вычетом резерва',
    peakNote:'Максимальная потребность в деньгах',firstNote:'Первый месяц с положительным операционным потоком',paybackNote:'Когда накопленные поступления возместят затраты',
    monthsUnit:'мес.',monthShort:'мес.',noPositive:'Нет за выбранный период',ownFunding:'Свои вложения',portfolioHelp:'Есть несколько товаров или услуг? Соберите общий портфель V2 с общими расходами.',
    ledgerIn:'Выручка без НДС',ledgerOut:'Платежи месяца',ledgerDelta:'Разница поступлений и платежей',ledgerBalance:'Осталось на конец месяца',ledgerOwn:'Вложено своих денег',ledgerLoan:'Получен кредит',ledgerHintOwn:'Стартовые собственные средства входят в остаток отдельно. Платежи включают расходы, налоги и покупку оборудования.',ledgerHintLoan:'Кредит входит в остаток отдельно. Проценты и погашение долга входят в платежи соответствующих месяцев.',technical:'Показать полную таблицу расходов, налогов и денежных потоков',
     actions:'Сохранение и следующий шаг',firstPrefix:'Первый месяц',forecastCaveat:'Дробное число означает ожидаемое количество клиентов, а не часть человека.'},
  en:{step:'Calculation settings',stepHint:'Review taxes, time horizon and funding. Results update whenever you change an input.',
    summary:'Results for the selected period',summaryHint:'Amounts are in the calculation currency. Fractional clients reflect expected demand.',
    months:'Monthly cash flow',monthsHint:'Scroll the table horizontally. Revenue excludes VAT; cash flow includes expenses and taxes.',
    details:'Show additional indicators',priceOne:'Price per service incl. VAT',forecast:'Expected customers',foreFirst:'first month',foreMax:'highest month',foreEach:'per month',
    taxRate:'Tax rate, %',creditOnly:'Loan details',creditHint:'These fields appear only when you select loan funding.',
    capitalNote:'Money needed to start, including the reserve',profitNote:'Net profit for the whole selected period',freeNote:'End-of-period money after the reserve',
    peakNote:'Largest temporary funding need',firstNote:'First month with positive operating cash flow',paybackNote:'When cumulative inflows cover investment',
    monthsUnit:'months',monthShort:'month',noPositive:'None in the selected period',ownFunding:'Owner funding',portfolioHelp:'Several goods or services? Build a V2 portfolio to share business costs.',
    ledgerIn:'Revenue excl. VAT',ledgerOut:'Payments this month',ledgerDelta:'Receipts minus payments',ledgerBalance:'End-of-month cash',ledgerOwn:'Own funds invested',ledgerLoan:'Loan received',ledgerHintOwn:'Initial owner funds are included in the closing balance separately. Payments include costs, taxes and equipment purchases.',ledgerHintLoan:'Loan funding is included in the closing balance separately. Interest and principal repayments appear in the corresponding months.',technical:'Show full expense, tax and cash-flow table',
     actions:'Save and continue',firstPrefix:'First month',forecastCaveat:'Fractional customers represent expected demand, not part of a person.'},
  kk:{step:'Есептеу шарттары',stepHint:'Салықты, кезеңді және қаржыландыруды тексеріңіз. Өрістер өзгерсе, нәтиже дереу жаңарады.',
    summary:'Таңдалған кезеңнің нәтижесі',summaryHint:'Барлық сома есептеу валютасымен берілген. Бөлшек клиент саны — күтілетін сұраныс.',
    months:'Айлық ақша ағыны',monthsHint:'Кестені көлденең айналдырыңыз. Кіріс ҚҚС-сыз, ақша ағыны шығындар мен салықтарды ескереді.',
    details:'Қосымша көрсеткіштерді көрсету',priceOne:'ҚҚС-пен бір қызметтің бағасы',forecast:'Клиенттер болжамы',foreFirst:'бірінші айда',foreMax:'айлық ең көбі',foreEach:'айына',
    taxRate:'Салық мөлшерлемесі, %',creditOnly:'Несие шарттары',creditHint:'Тек «Несие» таңдалғанда көрсетіледі.',
    capitalNote:'Резервпен бірге іске қосуға қажет ақша',profitNote:'Таңдалған кезеңдегі салықтан кейінгі пайда',freeNote:'Кезең соңындағы резервтен тыс ақша',
    peakNote:'Ең жоғары ақша қажеттілігі',firstNote:'Операциялық ақша ағыны оң болған алғашқы ай',paybackNote:'Жинақталған түсімдер шығындарды жапқан кезең',
    monthsUnit:'ай',monthShort:'ай',noPositive:'Таңдалған кезеңде жоқ',ownFunding:'Өз қаражаты',portfolioHelp:'Бірнеше тауар немесе қызмет бар ма? Ортақ шығындар үшін V2 портфелін жинаңыз.',
    ledgerIn:'ҚҚС-сыз кіріс',ledgerOut:'Айдағы төлемдер',ledgerDelta:'Кірістер мен төлемдер айырмасы',ledgerBalance:'Ай соңындағы ақша',ledgerOwn:'Өз қаражаты салынды',ledgerLoan:'Несие алынды',ledgerHintOwn:'Бастапқы өз қаражаты соңғы қалдыққа бөлек қосылады. Төлемдерге шығындар, салықтар мен жабдық кіреді.',ledgerHintLoan:'Несие соңғы қалдыққа бөлек қосылады. Пайыздар мен қарызды өтеу тиісті айларда көрсетіледі.',technical:'Шығындар, салықтар және ақша ағынының толық кестесін көрсету',
     actions:'Сақтау және жалғастыру',firstPrefix:'Бірінші ай',forecastCaveat:'Бөлшек клиент саны — нақты адамның бөлігі емес, орташа болжам.'}
 };
 function help(){return guide[lang()]||guide.ru;}
 const amount=x=>Number.isFinite(Number(x))?Number(x).toLocaleString(lang()==='en'?'en-US':lang()==='kk'?'kk-KZ':'ru-RU',{maximumFractionDigits:2,minimumFractionDigits:0}):'—';
 function forecastText(value){
  const t=help();
  const list=(Array.isArray(value)?value:[value]).map(Number).filter(Number.isFinite);
  if(!list.length)return '—';
  const first=list[0],max=Math.max(...list),min=Math.min(...list);
  if(Math.abs(max-min)<0.005)return amount(first)+' '+t.foreEach;
  return amount(first)+' '+t.foreFirst+' · '+t.foreMax+' '+amount(max);
 }
 function monthValue(n){
  if(n===null||n===undefined)return help().noPositive;
  return amount(n)+' '+help().monthShort;
 }
 function trimLoanColumns(table){
  if(!table)return;
  Array.from(table.rows).forEach(row=>{
    row.children[10]?.remove();
    row.children[3]?.remove();
  });
  const own=table.tHead?.rows[0]?.children[8];
  if(own)own.textContent=help().ownFunding;
 }
 function renderFunding(){
  const block=el('full-service-credit-fields');
  if(!block)return;
  const active=el('full-service-funding')?.value==='credit';
  block.hidden=!active;
  block.classList.toggle('hidden',!active);
  if(active){
    const term=el('full-service-term');
    if(term && (!Number.isInteger(Number(term.value))||Number(term.value)<1))
      term.value='1';
  }
 }

 function savedDraft(){
  try{
   const data=JSON.parse(root.localStorage.getItem(STORAGE_KEY)||'null');
   return data&&data.input&&typeof data.input==='object'&&
     data.source&&typeof data.source==='object'?data:null;
  }catch(_){return null;}
 }
 function updateResume(){
  const btn=el('service-full-saved-entry');if(!btn)return;
  const has=!!savedDraft();
  btn.hidden=!has;btn.classList.toggle('hidden',!has);
  btn.textContent=labels().resume;
 }
 function field(label,id,value,type='number',other=''){
  return '<label class="nd-full-service-label">'+escaped(label)+
   '<input id="'+id+'" type="'+type+'" value="'+escaped(value)+'" '+other+'></label>';
 }
 function choice(label,id,selected,opts){
  return '<label class="nd-full-service-label">'+escaped(label)+'<select id="'+id+'">'+
   opts.map(([k,v])=>'<option value="'+escaped(k)+'"'+(selected===k?' selected':'')+'>'+escaped(v)+'</option>').join('')+'</select></label>';
 }

 function mount(){
  const node=el('full-service-screen');if(!node||!input)return;
  const t=labels(),h=help();
  const price=money(Number(input.priceGross)),forecast=forecastText(input.monthlyForecast);
  node.innerHTML='<div class="nd-full-service-shell">'+
   '<button type="button" id="full-service-back" class="nd-full-service-secondary">'+t.back+'</button>'+
   '<header class="nd-full-service-header">'+
    '<p class="nd-full-service-eyebrow">V1 · '+escaped(source?.name||'')+'</p>'+
    '<h1>'+escaped(t.head)+'</h1>'+
    '<div class="nd-full-service-overview">'+
     '<div><span>'+escaped(h.priceOne)+'</span><strong>'+price+'</strong></div>'+
     '<div><span>'+escaped(h.forecast)+'</span><strong>'+escaped(forecast)+'</strong></div>'+
    '</div><p class="nd-full-service-forecast-note">'+escaped(h.forecastCaveat)+'</p>'+
   '</header>'+
   '<section class="nd-full-service-settings" aria-labelledby="full-service-settings-title">'+
    '<h2 id="full-service-settings-title">1. '+escaped(h.step)+'</h2>'+
    '<p class="nd-full-service-intro">'+escaped(h.stepHint)+'</p>'+
    '<div class="nd-full-service-inputs">'+
     field(t.vat,'full-service-vat',input.vatPct??0,'number','min="0" max="1000" step="0.01"')+
     choice(t.tax,'full-service-tax',input.taxType||'turnover',[['turnover',t.turnover],['profit',t.profit]])+
     field(h.taxRate,'full-service-tax-pct',input.taxPct??0,'number','min="0" max="100" step="0.01"')+
     field(t.horizon,'full-service-horizon',input.months||1,'number','min="1" max="120" step="1"')+
     choice(t.funding,'full-service-funding',input.funding||'own',[['own',t.own],['credit',t.credit]])+
    '</div>'+
    '<div id="full-service-credit-fields" class="nd-full-service-credit hidden" hidden>'+
     '<h3>'+escaped(h.creditOnly)+'</h3><p>'+escaped(h.creditHint)+'</p>'+
     '<div class="nd-full-service-inputs">'+
       field(t.rate,'full-service-rate',input.annualRatePct??0,'number','min="0" step="0.01"')+
       field(t.term,'full-service-term',Number(input.creditMonths)>0?input.creditMonths:1,'number','min="1" step="1"')+
     '</div>'+
    '</div>'+
   '</section>'+
   '<div id="full-service-message" role="alert" aria-live="polite"></div>'+
   '<div id="full-service-report" aria-live="polite"></div>'+
   '<section class="nd-full-service-action-section">'+
    '<h2>'+escaped(h.actions)+'</h2>'+
    '<div class="nd-full-service-actions">'+
     '<button type="button" id="full-service-save" class="nd-full-service-secondary">'+t.save+'</button>'+
     '<button type="button" id="full-service-pdf" class="nd-cta-primary">'+t.report+'</button>'+
    '</div>'+
    '<p class="nd-full-service-portfolio-help">'+escaped(h.portfolioHelp)+'</p>'+
    '<button type="button" id="full-service-add-portfolio" class="nd-full-service-secondary">'+t.portfolio+'</button>'+
   '</section></div>';
  ['vat','tax','tax-pct','horizon','funding','rate','term'].forEach(k=>{
   const field=el('full-service-'+k);
   field.addEventListener('input',calculate);
   field.addEventListener('change',calculate);
  });
  renderFunding();
  el('full-service-back').addEventListener('click',()=>root.showOnly(source?.fromSaved?'service-work-screen':source?.kind==='online'?'calculator-screen':'product-screen'));
  el('full-service-save').addEventListener('click',()=>{
    if(!result)return;
    try{
      root.localStorage.setItem(STORAGE_KEY,JSON.stringify({
        schema:2,input,source:{name:source.name,kind:source.kind,id:source.id,role:source.role},
        savedAt:new Date().toISOString()
      }));
      el('full-service-message').textContent=labels().saved;
      updateResume();
    }catch(err){el('full-service-message').textContent=err.message;}
  });
  el('full-service-add-portfolio').addEventListener('click',()=>{
    if(!result)return;
    try{
      const id=String(source?.id||('full-'+source.kind+'-'+source.name));
      const sku=Engine.toPortfolioSku(input,{...source,id});
      const ui=root.LinkedPortfolioV2UI;
      if(!ui?.appendFullService)throw Error('Портфель V2 ещё не загружен.');
      ui.appendFullService(sku);
    }catch(err){el('full-service-message').textContent=err.message;}
  });
  el('full-service-pdf').addEventListener('click',print);
  calculate();
 }
 function calculate(){
  if(!input)return;
  const t=labels(),h=help();
  renderFunding();
  const next={...input,vatPct:el('full-service-vat').value,
   taxType:el('full-service-tax').value,taxPct:Number(el('full-service-tax-pct').value),
   months:Number(el('full-service-horizon').value),
   funding:el('full-service-funding').value,
   annualRatePct:el('full-service-rate').value,
   creditMonths:Number(el('full-service-term').value)};
  const msg=el('full-service-message'),target=el('full-service-report');
  input=next;msg.textContent='';target.replaceChildren();
  try{result=Engine.build(next);}
  catch(err){result=null;msg.textContent=err.message;el('full-service-pdf').disabled=true;el('full-service-save').disabled=true;el('full-service-add-portfolio').disabled=true;return;}
  el('full-service-pdf').disabled=false;el('full-service-save').disabled=false;
  el('full-service-add-portfolio').disabled=false;
  const data=result;
  const card=(name,value,description,featured=false,loss=false)=>
    '<div class="nd-full-service-metric'+(featured?' nd-full-service-metric-featured':'')+(loss?' nd-full-service-metric-loss':'')+'">'+
    '<span>'+escaped(name)+'</span><strong>'+escaped(value)+'</strong>'+
    '<small>'+escaped(description)+'</small></div>';
  const cashMetrics=[
    [t.capital,money(data.capital),h.capitalNote],
    [t.net,money(data.profit),h.profitNote],
    [t.free,money(data.freeCash),h.freeNote]
  ];
  const additional=[
    [t.reserve,money(data.reserve),''],
    [t.peak,money(data.peakDeficit)+' · '+h.monthShort+' '+amount(data.peakMonth),h.peakNote],
    [t.first,monthValue(data.firstPositiveMonth),h.firstNote],
    [t.payback,data.paybackMonth===null?t.noPayback:monthValue(data.paybackMonth),h.paybackNote],
    [t.taxes,money(data.tax),''],
    [t.cash,money(data.cashOnHand),'']
  ];
  if(next.funding==='credit')
   additional.push([t.debt,money(data.outstandingPrincipal),'']);
  const node=document.createElement('section');
  node.className='nd-full-service-results';
  node.innerHTML='<h2>2. '+escaped(h.summary)+'</h2>'+
   '<p class="nd-full-service-intro">'+escaped(h.summaryHint)+'</p>'+
   '<div class="nd-full-service-metrics">'+cashMetrics.map((x,i)=>card(...x,true,i===1&&data.profit<0)).join('')+'</div>'+
   '<details class="nd-full-service-details"><summary>'+escaped(h.details)+'</summary>'+
   '<div class="nd-full-service-details-grid">'+additional.map(x=>card(...x)).join('')+'</div></details>';
  target.append(node);
  const wrap=document.createElement('section');
  wrap.className='nd-full-service-months';
  // Show an accessible cash reconciliation before the technical ledger.
  // This is presentation-only: the underlying monthly values are unchanged.
  const ledgerRows=m=>{
    const paid=m.variable+m.fixed+m.tax+m.interest+m.assetCash+m.principalDue;
    const fundingName=next.funding==='credit'?h.ledgerLoan:h.ledgerOwn;
    return [[h.ledgerIn,m.revenue],[h.ledgerOut,paid],
      ...(m.financeIn>0?[[fundingName,m.financeIn]]:[]),
      [h.ledgerDelta,m.revenue-paid],[h.ledgerBalance,m.cashOnHand]];
  };
  const readableRow=([label,value])=>
    '<div class="nd-full-service-ledger-row"><span>'+escaped(label)+'</span>'+
    '<strong>'+escaped(money(value))+'</strong></div>';
  wrap.innerHTML='<h2>3. '+escaped(h.months)+'</h2>'+
    '<p class="nd-full-service-intro">'+escaped(next.funding==='credit'?h.ledgerHintLoan:h.ledgerHintOwn)+'</p>'+
    '<div class="nd-full-service-ledger">'+data.months.map(m=>
      '<article class="nd-full-service-month-card" aria-label="'+escaped(t.month+' '+m.month)+'">'+
      '<h3>'+escaped(t.month+' '+m.month)+'</h3>'+
      ledgerRows(m).map(readableRow).join('')+'</article>').join('')+'</div>'+
    '<details class="nd-full-service-technical"><summary>'+escaped(h.technical)+'</summary>'+
    '<p class="nd-full-service-intro">'+escaped(h.monthsHint)+'</p>'+
    '<div class="nd-full-service-table"></div></details>';
  const cols=[t.month,t.revenue,t.cost,t.interest,t.taxCol,t.amortCol,t.profitCol,t.flow,t.capex,t.fundingIn,t.principal,t.netFlow,t.balance];
  const table=wrap.querySelector('.nd-full-service-table');
  table.innerHTML='<table><thead><tr>'+cols.map(c=>'<th>'+escaped(c)+'</th>').join('')+'</tr></thead><tbody>'+
   data.months.map(m=>'<tr>'+[m.month,m.revenue,m.variable+m.fixed,
     m.interest,m.tax,m.depreciation,m.profit,m.operatingCash,m.assetCash,m.financeIn,m.principalDue,m.netCashFlow,m.cashOnHand].map((v,i)=>
     '<td>'+(i===0?v:money(v))+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  target.append(wrap);
  if(next.funding==='own') trimLoanColumns(wrap.querySelector('table'));
 }
 function print(){
  if(!result)return;
  let node=el('nomad360-print-sheet');if(!node){node=document.createElement('section');node.id='nomad360-print-sheet';document.body.append(node);}
  node.dataset.mode='full-service';
  const t=labels();
  node.innerHTML='<header class="nomad-print-head"><div>NOMAD360</div><h1>'+escaped(t.head)+'</h1>'+
   '<p>'+escaped(source?.name)+' · '+result.horizonMonths+'</p></header>'+
   '<table class="nomad-export-table"><tbody>'+
   [[t.capital,result.capital],[t.reserve,result.reserve],[t.net,result.profit],
    [t.taxes,result.tax],[t.cash,result.cashOnHand],[t.free,result.freeCash],
    [t.debt,result.outstandingPrincipal]].map(([k,v])=>
    '<tr><td>'+escaped(k)+'</td><td>'+money(v)+'</td></tr>').join('')+
   '</tbody></table><table class="nomad-export-table"><thead><tr>'+
   [t.month,t.revenue,t.cost,t.interest,t.taxCol,t.amortCol,t.profitCol,t.flow,t.capex,t.fundingIn,t.principal,t.netFlow,t.balance].map(x=>'<th>'+escaped(x)+'</th>').join('')+
   '</tr></thead><tbody>'+result.months.map(m=>'<tr>'+
    [m.month,m.revenue,m.variable+m.fixed,m.interest,m.tax,m.depreciation,m.profit,m.operatingCash,m.assetCash,m.financeIn,m.principalDue,m.netCashFlow,m.cashOnHand]
     .map((v,i)=>'<td>'+(i===0?v:money(v))+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  if(input.funding==='own'){
    const tables=node.querySelectorAll('.nomad-export-table');
    trimLoanColumns(tables[1]);
    tables[0]?.querySelector('tbody tr:last-child')?.remove();
  }
  root.print();
 }
 function open(data,metadata){
  input={...data};source=metadata||{kind:'offline',name:'Услуга'};
  root.showOnly('full-service-screen');
  mount();updateResume();return true;
 }
 function openSaved(){
  const draft=savedDraft();
  if(!draft)return false;
  return open(draft.input,{...draft.source,fromSaved:true});
 }
 document.addEventListener('DOMContentLoaded',updateResume);
 document.addEventListener('nomad360:languagechange',()=>{
  updateResume();
  if(input&&el('full-service-screen')&&!el('full-service-screen').hidden)mount();
 });
 root.Nomad360FullServiceUI=Object.freeze({open,openSaved,hasSaved:()=>!!savedDraft(),
  updateResume,getResult:()=>result,getInput:()=>input});
})(window);
