/* Compact, explicit FX proposals. A lookup never applies a rate. */
(function(root){
 'use strict';
 const words={
 en:{title:'Currency converter',rate:'Exchange rate',date:'Rate date',source:'Rate source',example:'Bank quote or rate reference',fetch:'Get reference rate',apply:'Apply to calculation',preview:'Converted amount',applied:'Applied to calculation',daily:'Daily reference rates from Frankfurter. Your bank rate may differ. No fees or spread are added.',error:'The reference rate is unavailable. Enter a manual rate, date and source.',invalid:'Enter a positive rate, a valid date and its source.',loading:'Retrieving rate…',manual:'Manual rate',pending:'Apply a rate to use this payment in the calculation.'},
 ru:{title:'Конвертер валют',rate:'Обменный курс',date:'Дата курса',source:'Источник курса',example:'Курс банка или источник котировки',fetch:'Получить справочный курс',apply:'Применить к расчёту',preview:'Результат конвертации',applied:'Применено к расчёту',daily:'Ежедневные справочные курсы Frankfurter. Курс вашего банка может отличаться. Комиссии и спред не добавляются.',error:'Справочный курс недоступен. Укажите ручной курс, дату и источник.',invalid:'Укажите положительный курс, корректную дату и его источник.',loading:'Получение курса…',manual:'Ручной курс',pending:'Примените курс, чтобы учесть этот платёж в расчёте.'},
 kk:{title:'Валюта конвертері',rate:'Айырбастау бағамы',date:'Бағам күні',source:'Бағам дереккөзі',example:'Банк бағамы немесе котировка дереккөзі',fetch:'Анықтамалық бағамды алу',apply:'Есептеуге қолдану',preview:'Конвертация нәтижесі',applied:'Есептеуге қолданылды',daily:'Frankfurter күнделікті анықтамалық бағамдары. Банкіңіздің бағамы өзгеше болуы мүмкін. Комиссиялар мен спред қосылмайды.',error:'Анықтамалық бағам қолжетімсіз. Бағамды, күнін және дереккөзін қолмен енгізіңіз.',invalid:'Оң бағамды, дұрыс күнді және дереккөзін көрсетіңіз.',loading:'Бағам алынуда…',manual:'Қолмен енгізілген бағам',pending:'Бұл төлемді есепке алу үшін бағамды қолданыңыз.'}
 };
 const t=()=>words[root.Nomad360UI?.getLanguage?.()||'ru'];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>new Intl.NumberFormat(root.Nomad360UI?.getLanguage?.()==='en'?'en-US':root.Nomad360UI?.getLanguage?.()==='kk'?'kk-KZ':'ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
 function proposal(host){return {base:host.ndPayment.paymentCurrency,quote:host.ndPayment.businessCurrency,rate:Number(host.querySelector('[data-fx-rate]').value),date:host.querySelector('[data-fx-date]').value,source:host.ndQuote?.source||'manual',sourceLabel:host.querySelector('[data-fx-source]').value.trim()};}
 function preview(host){
  const p=host.ndPayment,q=proposal(host),out=host.querySelector('[data-fx-preview]');
  let amount=null;try{amount=root.Nomad360Payments.apply(p.paymentAmount,p.paymentCurrency,p.businessCurrency,root.Nomad360Currency.valid,q).convertedAmount;}catch(_){}
  out.textContent=t().preview+': '+(amount===null?'—':money(amount)+' '+p.businessCurrency);
  host.querySelector('[data-fx-apply]').disabled=amount===null;
 }
 function paint(wrapper,p){
  const controls=wrapper.matches('.nd-payment-controls')?wrapper:wrapper.querySelector('.nd-payment-controls');
  let host=controls.querySelector('[data-fx]');
  if(!host){host=document.createElement('details');host.className='nd-fx';host.dataset.fx='';controls.append(host);}
  host.hidden=p.paymentCurrency===p.businessCurrency;host.ndPayment=p;
  const signature=JSON.stringify([p.paymentAmount,p.paymentCurrency,p.businessCurrency]);
  if(host.ndSignature!==signature||!host.firstElementChild){
   host.ndSignature=signature;host.ndSeq=(host.ndSeq||0)+1;host.ndQuote=null;host.ndApplied=null;host.ndMessage=null;
   host.innerHTML='<summary data-fx-text="title"></summary><div class="nd-fx-body"><p class="nd-fx-pair" data-fx-pair></p>'+
    '<label><span data-fx-text="rate"></span><span class="nd-fx-equation">1 '+esc(p.paymentCurrency)+' =</span><input type="number" step="any" min="0" inputmode="decimal" data-fx-rate><span>'+esc(p.businessCurrency)+'</span></label>'+
    '<label><span data-fx-text="date"></span><input type="date" data-fx-date max="'+new Date().toISOString().slice(0,10)+'"></label>'+
    '<label><span data-fx-text="source"></span><input type="text" maxlength="200" data-fx-source></label>'+
    '<p data-fx-preview aria-live="polite"></p><button type="button" class="nd-fx-secondary" data-fx-fetch data-fx-text="fetch"></button>'+
    '<button type="button" class="nd-fx-primary" data-fx-apply data-fx-text="apply"></button><p data-fx-text="daily"></p><p data-fx-applied></p><p data-fx-message role="status"></p></div>';
  }
  for(const el of host.querySelectorAll('[data-fx-text]'))el.textContent=t()[el.dataset.fxText];
  host.querySelector('[data-fx-source]').placeholder=t().example;
  host.querySelector('[data-fx-pair]').textContent=(p.paymentAmount===null?'—':money(p.paymentAmount))+' '+p.paymentCurrency+' → '+p.businessCurrency;
  if(p.conversion&&host.ndApplied!==JSON.stringify(p.conversion)){
   const c=p.conversion;host.ndApplied=JSON.stringify(c);host.ndQuote={...c};
   host.querySelector('[data-fx-rate]').value=c.rate;host.querySelector('[data-fx-date]').value=c.date;host.querySelector('[data-fx-source]').value=c.sourceLabel;
  }
  host.querySelector('[data-fx-applied]').textContent=p.conversion?t().applied+': '+money(p.convertedAmount)+' '+p.businessCurrency+' · 1 '+p.paymentCurrency+' = '+p.conversion.rate+' '+p.businessCurrency+' · '+p.conversion.date+' · '+p.conversion.sourceLabel:t().pending;
  if(host.ndMessage)host.querySelector('[data-fx-message]').textContent=t()[host.ndMessage];
  preview(host);
 }
 document.addEventListener('input',event=>{
  const host=event.target.closest('[data-fx]');if(!host)return;
  if(!event.target.matches('[data-fx-rate],[data-fx-date],[data-fx-source]'))return;
  host.ndSeq++;host.querySelector('[data-fx-fetch]').disabled=false;
  if(host.ndQuote?.source==='frankfurter'&&!event.target.matches('[data-fx-source]'))host.querySelector('[data-fx-source]').value=t().manual;
  host.ndQuote=null;host.ndMessage=null;host.querySelector('[data-fx-message]').textContent='';preview(host);
 });
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-fx-fetch],[data-fx-apply]');if(!button)return;
  const host=button.closest('[data-fx]'),controls=host.closest('.nd-payment-controls');
  if(button.matches('[data-fx-apply]')){
   try{root.Nomad360PaymentUI.applyConversion(controls,proposal(host));host.ndMessage=null;host.querySelector('[data-fx-message]').textContent='';}catch(_){host.ndMessage='invalid';host.querySelector('[data-fx-message]').textContent=t().invalid;}
   return;
  }
  const signature=host.ndSignature,seq=++host.ndSeq;
  button.disabled=true;host.ndMessage='loading';host.querySelector('[data-fx-message]').textContent=t().loading;
  try{
   const p=host.ndPayment,q=await root.Nomad360FX.quote(p.paymentCurrency,p.businessCurrency);
   if(!host.isConnected||seq!==host.ndSeq||signature!==host.ndSignature)return;
   host.ndQuote=q;host.querySelector('[data-fx-rate]').value=q.rate;host.querySelector('[data-fx-date]').value=q.date;host.querySelector('[data-fx-source]').value=q.sourceLabel;
   host.ndMessage=null;host.querySelector('[data-fx-message]').textContent='';preview(host);
  }catch(_){if(host.isConnected&&seq===host.ndSeq){host.ndMessage='error';host.querySelector('[data-fx-message]').textContent=t().error;}}
  finally{if(host.isConnected&&seq===host.ndSeq)button.disabled=false;}
 });
 root.Nomad360FXUI=Object.freeze({paint});
})(window);
