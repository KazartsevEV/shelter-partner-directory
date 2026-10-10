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
  ru:{head:'Полная денежная модель услуги',price:'Цена с НДС',vat:'НДС, %',tax:'Налог',turnover:'С оборота',profit:'С прибыли',horizon:'Горизонт, месяцев',funding:'Финансирование',own:'Свои деньги',credit:'Кредит',reserve:'Резерв',capital:'Стартовый капитал',peak:'Пик дефицита',first:'Первый положительный CF',payback:'Окупаемость',noPayback:'Не окупится за выбранный горизонт',net:'Чистая прибыль',taxes:'Налоги',cash:'Деньги на руках',free:'Свободный остаток',debt:'Непогашенный кредит',rate:'Кредит, % годовых',term:'Срок кредита, мес.',month:'Месяц',revenue:'Выручка без НДС',cost:'Расходы',interest:'Проценты',taxCol:'Налог',profitCol:'Прибыль',flow:'Операционный CF',capex:'Оборудование',fundingIn:'Вложено / кредит',principal:'Тело кредита',netFlow:'Денежный поток',balance:'Остаток денег',save:'Сохранить расчёт',report:'Сохранить расчёт в PDF',back:'← К услуге',error:'Для расчёта завершите заполнение V1-услуги.'},
  en:{head:'Full service cash flow',price:'VAT-inclusive price',vat:'VAT, %',tax:'Business tax',turnover:'Turnover',profit:'Profit',horizon:'Horizon (months)',funding:'Funding',own:'Own funds',credit:'Credit',reserve:'Reserve',capital:'Startup capital',peak:'Peak deficit',first:'First positive CF',payback:'Payback',noPayback:'No payback within horizon',net:'Net profit',taxes:'Taxes',cash:'Cash on hand',free:'Available cash',debt:'Outstanding debt',rate:'Annual loan rate, %',term:'Loan term (months)',month:'Month',revenue:'Net-of-VAT revenue',cost:'Expenses',interest:'Interest',taxCol:'Tax',profitCol:'Profit',flow:'Operating CF',capex:'Equipment',fundingIn:'Owner / loan funding',principal:'Loan principal',netFlow:'Net cash flow',balance:'Cash balance',save:'Save calculation',report:'Save PDF',back:'← Service',error:'Complete V1 service inputs first.'},
  kk:{head:'Қызметтің толық ақша ағыны',price:'ҚҚС-пен баға',vat:'ҚҚС, %',tax:'Салық',turnover:'Айналымнан',profit:'Пайдадан',horizon:'Кезең, ай',funding:'Қаржыландыру',own:'Өз қаражаты',credit:'Несие',reserve:'Резерв',capital:'Бастапқы капитал',peak:'Ең үлкен тапшылық',first:'Алғашқы оң CF',payback:'Өтелу мерзімі',noPayback:'Кезең ішінде өтелмейді',net:'Таза пайда',taxes:'Салықтар',cash:'Қолдағы ақша',free:'Бос қаражат',debt:'Несие қалдығы',rate:'Жылдық несие мөлшерлемесі, %',term:'Несие мерзімі, ай',month:'Ай',revenue:'ҚҚС-сыз кіріс',cost:'Шығындар',interest:'Пайыздар',taxCol:'Салық',profitCol:'Пайда',flow:'Операциялық CF',capex:'Жабдық',fundingIn:'Қаржыландыру',principal:'Несие сомасы',netFlow:'Ақша ағыны',balance:'Ақша қалдығы',save:'Есепті сақтау',report:'PDF сақтау',back:'← Қызмет',error:'Алдымен V1 деректерін толтырыңыз.'}
 };
 function lang(){return root.Nomad360UI?.getLanguage?.()||'ru';}
 function labels(){return title[lang()]||title.ru;}
 function field(label,id,value,type='number',other=''){
  return '<label class="nd-full-service-label">'+escaped(label)+
   '<input id="'+id+'" type="'+type+'" value="'+escaped(value)+'" '+other+'></label>';
 }
 function choice(label,id,selected,opts){
  return '<label class="nd-full-service-label">'+escaped(label)+'<select id="'+id+'">'+
   opts.map(([k,v])=>'<option value="'+escaped(k)+'"'+(selected===k?' selected':'')+'>'+escaped(v)+'</option>').join('')+'</select></label>';
 }
 function mount(){const node=el('full-service-screen');if(!node||!input)return;const t=labels();
  node.innerHTML='<div class="nd-full-service-shell">'+
   '<button type="button" id="full-service-back" class="nd-full-service-secondary">'+t.back+'</button>'+
   '<div class="nd-full-service-header"><p>V2 · '+escaped(source?.name||'')+'</p><h1>'+t.head+'</h1>'+
   '<p class="nd-full-service-v1-info">'+escaped(t.price)+': <b>'+money(Number(input.priceGross))+'</b> · '+
   escaped(lang()==='ru'?'Прогноз / месяц':lang()==='en'?'Forecast / month':'Болжам / ай')+': '+
   escaped(String(input.monthlyForecast))+'</p></div>'+
   '<div class="nd-full-service-inputs">'+
   field(t.vat,'full-service-vat',input.vatPct??0,'number','min="0" max="1000" step="0.01"')+
   choice(t.tax,'full-service-tax',input.taxType||'turnover',[['turnover',t.turnover],['profit',t.profit]])+
   field(t.horizon,'full-service-horizon',input.months||1,'number','min="1" max="120" step="1"')+
   choice(t.funding,'full-service-funding',input.funding||'own',[['own',t.own],['credit',t.credit]])+
   field(t.rate,'full-service-rate',input.annualRatePct??0,'number','min="0" step="0.01"')+
   field(t.term,'full-service-term',input.creditMonths||1,'number','min="1" step="1"')+
   '</div><div id="full-service-message" role="alert" aria-live="polite"></div>'+
   '<div id="full-service-report" aria-live="polite"></div>'+
   '<div class="nd-full-service-actions"><button type="button" id="full-service-save" class="nd-full-service-secondary">'+t.save+'</button>'+
   '<button type="button" id="full-service-pdf" class="nd-cta-primary">'+t.report+'</button></div></div>';
  ['vat','tax','horizon','funding','rate','term'].forEach(k=>{
   const field=el('full-service-'+k);
   field.addEventListener('input',calculate);
   field.addEventListener('change',calculate);
  });
  el('full-service-back').addEventListener('click',()=>root.showOnly(source?.kind==='online'?'calculator-screen':'product-screen'));
  el('full-service-save').addEventListener('click',()=>{
    if(!result)return;
    localStorage.setItem('nomad360-full-service-v2',JSON.stringify({input,result,source:{name:source.name,kind:source.kind},savedAt:new Date().toISOString()}));
    el('full-service-message').textContent='✓';
  });
  el('full-service-pdf').addEventListener('click',print);
  calculate();
 }
 function calculate(){
  if(!input)return;
  const t=labels();
  const next={...input,vatPct:el('full-service-vat').value,
   taxType:el('full-service-tax').value,months:Number(el('full-service-horizon').value),
   funding:el('full-service-funding').value,
   annualRatePct:el('full-service-rate').value,creditMonths:Number(el('full-service-term').value)};
  const msg=el('full-service-message'),target=el('full-service-report');
  input=next;msg.textContent='';target.replaceChildren();
  try{result=Engine.build(next);}
  catch(err){result=null;msg.textContent=err.message;el('full-service-pdf').disabled=true;return;}
  el('full-service-pdf').disabled=false;
  const data=result;
  const metrics=[[t.capital,data.capital],[t.reserve,data.reserve],[t.peak,
    money(data.peakDeficit)+' · '+data.peakMonth],[t.first,
    data.firstPositiveMonth??'—'],[t.payback,data.paybackMonth??t.noPayback],
    [t.net,data.profit],[t.taxes,data.tax],[t.cash,data.cashOnHand],
    [t.free,data.freeCash],[t.debt,data.outstandingPrincipal]];
  const node=document.createElement('div');
  node.className='nd-full-service-metrics';
  node.innerHTML=metrics.map(([name,value])=>'<div><span>'+escaped(name)+'</span>'+
    '<strong>'+ (typeof value==='number'?money(value):escaped(value))+'</strong></div>').join('');
  target.append(node);
  const wrap=document.createElement('div');wrap.className='nd-full-service-table';
  const cols=[t.month,t.revenue,t.cost,t.interest,t.taxCol,t.profitCol,t.flow,t.capex,t.fundingIn,t.principal,t.netFlow,t.balance];
  wrap.innerHTML='<table><thead><tr>'+cols.map(c=>'<th>'+escaped(c)+'</th>').join('')+'</tr></thead><tbody>'+
   data.months.map(m=>'<tr>'+[m.month,m.revenue,m.variable+m.fixed,
     m.interest,m.tax,m.profit,m.operatingCash,m.assetCash,m.financeIn,m.principalDue,m.netCashFlow,m.cashOnHand].map((v,i)=>
     '<td>'+(i===0?v:money(v))+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  target.append(wrap);
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
   [t.month,t.revenue,t.cost,t.interest,t.taxCol,t.profitCol,t.flow,t.capex,t.fundingIn,t.principal,t.netFlow,t.balance].map(x=>'<th>'+escaped(x)+'</th>').join('')+
   '</tr></thead><tbody>'+result.months.map(m=>'<tr>'+
    [m.month,m.revenue,m.variable+m.fixed,m.interest,m.tax,m.profit,m.operatingCash,m.assetCash,m.financeIn,m.principalDue,m.netCashFlow,m.cashOnHand]
     .map((v,i)=>'<td>'+(i===0?v:money(v))+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  root.print();
 }
 function open(data,metadata){
  input={...data};source=metadata||{kind:'offline',name:'Услуга'};
  root.showOnly('full-service-screen');
  mount();return true;
 }
 document.addEventListener('nomad360:languagechange',()=>{if(input&&el('full-service-screen')&&!el('full-service-screen').hidden)mount();});
 root.Nomad360FullServiceUI=Object.freeze({open,getResult:()=>result,getInput:()=>input});
})(window);
