/* Local actual-payment currencies. Conversion is a separate accepted task. */
(function(root){
 'use strict';
 const P=root.Nomad360Payments,C=root.Nomad360Currency;
 const words={
  en:{label:'Payment currency',note:'Enter the cost in the currency you will use to pay for the goods or delivery.',pending:'Conversion required before calculation. This currency selection does not apply an exchange rate.',invalid:'Check the payment amount and currency.',business:'Amount in the business currency',empty:'Enter the payment amount.'},
  ru:{label:'Валюта платежа',note:'Укажите стоимость в валюте, в которой будете оплачивать товар или доставку.',pending:'Для расчёта требуется конвертация. Выбор валюты не применяет обменный курс.',invalid:'Проверьте сумму и валюту платежа.',business:'Сумма в валюте бизнеса',empty:'Укажите сумму платежа.'},
  kk:{label:'Төлем валютасы',note:'Тауар немесе жеткізу ақысын төлейтін валютада құнын көрсетіңіз.',pending:'Есептеу үшін конвертация қажет. Валютаны таңдау айырбастау бағамын қолданбайды.',invalid:'Төлем сомасы мен валютасын тексеріңіз.',business:'Бизнес валютасындағы сома',empty:'Төлем сомасын көрсетіңіз.'}
 };
 const text=()=>words[root.Nomad360UI?.getLanguage?.()||'ru'];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fixed=['resale-buy-total','own-materials-cost','own-inbound-delivery-cost','own-broker-cost','own-duties-cost','own-certification-cost'];
 let sequence=0;
 function control(code,business){
  const t=text();
  const options=C.options(code)+(C.valid(code)?'':'<option selected value="'+esc(code)+'">'+esc(code)+'</option>');
  return '<label class="nd-payment-label"><span data-payment-label>'+t.label+'</span><select class="input-field nd-payment-select" data-payment-currency aria-label="'+t.label+'">'+options+'</select></label>'+
   '<span class="nd-payment-note" data-payment-note>'+t.note+'</span><span class="nd-payment-status" data-payment-status role="status"></span>';
 }
 function paint(wrapper,p){
  const t=text(),sel=wrapper.querySelector('[data-payment-currency]');
  wrapper.querySelector('[data-payment-label]').textContent=t.label;
  wrapper.querySelector('[data-payment-note]').textContent=t.note;
  sel.setAttribute('aria-label',t.label);sel.value=p.paymentCurrency;
  const out=wrapper.querySelector('[data-payment-status]');
  out.textContent=p.status==='conversion-required'?t.pending:p.status==='invalid'?t.invalid:
   p.status==='empty'?t.empty:t.business+': '+new Intl.NumberFormat(root.Nomad360UI?.getLanguage?.()==='kk'?'kk-KZ':root.Nomad360UI?.getLanguage?.()==='en'?'en-US':'ru-RU',{maximumFractionDigits:2}).format(p.convertedAmount)+' '+p.businessCurrency;
  wrapper.dataset.paymentStatus=p.status;
 }
 function v1Fields(){
  const fields=fixed.map(id=>document.getElementById(id)).filter(Boolean);
  for(const field of document.querySelectorAll('#own-material-rows .material-cost-price')){
   const row=field.closest('.material-cost-row');
   if(row.dataset.paymentKey)sequence=Math.max(sequence,Number(row.dataset.paymentKey.replace(/^material-/,''))||0);
   if(!row.dataset.paymentKey)row.dataset.paymentKey='material-'+(++sequence);
   fields.push(field);
  }
  return fields;
 }
 const key=field=>field.id||field.closest('.material-cost-row').dataset.paymentKey;
 function attachV1(){
  for(const field of v1Fields()){
   const paymentKey=key(field);
   let wrap=field.parentElement;
   if(!wrap.matches('[data-payment-field]')){
    wrap=document.createElement('div');wrap.className='nd-payment-field';wrap.dataset.paymentField=paymentKey;
    field.before(wrap);wrap.append(field);
    const controls=document.createElement('div');controls.className='nd-payment-controls';controls.dataset.nomadNoTranslate='';
    controls.innerHTML=control(C.get(),C.get());wrap.append(controls);
    // A dynamic material row restores its select alongside the original fields.
   }
   const select=wrap.querySelector('[data-payment-currency]');
   const label=field.id?document.querySelector('label[for="'+field.id+'"]')||wrap.previousElementSibling:wrap.previousElementSibling;
   if(label?.tagName==='LABEL'){
    label.dataset.paymentAmountCurrency=select.value;
    if(field.classList.contains('material-cost-price'))label.dataset.paymentAmountSource='Цена 1 ед. материала, у.е.*';
   }
   paint(wrap,P.record(field.value,select.value,C.get(),C.valid));
  }
 }
 function readNumber(field){
  if(!field)return 0;
  if(root.nomadPaymentContext&&!activeV1(field,root.nomadPaymentContext()))return Math.max(0,Number(field.value)||0);
  const select=field.parentElement.querySelector(':scope > .nd-payment-controls [data-payment-currency]');
  if(!select)return Math.max(0,Number(field.value)||0);
  const p=P.record(field.value,select.value,C.get(),C.valid);
  // Pending values propagate as NaN to intermediate previews, never as 1:1.
  return P.pending({p})?NaN:p.convertedAmount??0;
 }
 function activeV1(field,context){
  const id=field.id,source=context.source;
  if(id==='resale-buy-total')return ['resale','dropship'].includes(source);
  if(id==='own-materials-cost')return !['resale','dropship'].includes(source)&&context.materialCostMode==='known';
  if(!id)return !['resale','dropship'].includes(source)&&context.materialCostMode==='calculate';
  if(id==='own-inbound-delivery-cost')return source!=='dropship'&&context.choices?.inboundIncluded==='no';
  const payer={'own-broker-cost':'broker','own-duties-cost':'duties','own-certification-cost':'certification'}[id];
  return context.choices?.materialsImported==='yes'&&context.importPayers?.[payer]==='me';
 }
 function captureV1(context){
  attachV1();
  return Object.fromEntries(v1Fields().map(f=>[key(f),{...P.record(f.value,f.parentElement.querySelector('[data-payment-currency]').value,C.get(),C.valid),active:activeV1(f,context)}]));
 }
 function restoreV1(payments){
  attachV1();
  for(const f of v1Fields()){
   const sel=f.parentElement.querySelector('[data-payment-currency]'),p=payments?.[key(f)];
   // Legacy static/dynamic drafts keep their amounts and inherit business currency.
   const code=p?.paymentCurrency??C.get();
   if(!C.valid(code)){const option=document.createElement('option');option.value=code;option.textContent=code;sel.append(option);}
   sel.value=code;
  }
  attachV1();
 }
 function resetV1(){for(const f of v1Fields())f.parentElement.querySelector('[data-payment-currency]').value=C.get();}
 function paymentField(path,value,model){
  const parts=path.split('.');
  if(parts[0]!=='skus'||!P.fields(model.skus[Number(parts[1])]).includes(parts[2]))return '';
  const sku=model.skus[Number(parts[1])],business=model.currency||'USD',code=sku.payments?.[parts[2]]?.paymentCurrency??business;
  return '<div class="nd-payment-controls" data-nomad-no-translate data-payment-path="'+esc(path)+'">'+control(code,business)+'</div>';
 }
 function paintPortfolio(model){
  for(const wrap of document.querySelectorAll('[data-payment-path]')){
   const [,i,k]=wrap.dataset.paymentPath.split('.'),sku=model.skus[Number(i)];
   const code=sku.payments?.[k]?.paymentCurrency??model.currency??'USD';
   const label=wrap.parentElement.querySelector(':scope > label');
   if(label)label.dataset.paymentAmountCurrency=code;
   paint(wrap,P.record(sku[k],code,model.currency||'USD',C.valid));
  }
 }
 function updatePortfolio(model,path,code){
  const [,i,k]=path.split('.'),sku=model.skus[Number(i)];
  sku.payments=sku.payments||{};
  sku.payments[k]=P.record(sku[k],code,model.currency||'USD',C.valid);
 }
 function syncPortfolio(model){
  for(const sku of model.skus)for(const k of P.fields(sku)){
   sku.payments=sku.payments||{};
   sku.payments[k]=P.record(sku[k],sku.payments[k]?.paymentCurrency??model.currency??'USD',model.currency||'USD',C.valid);
  }
 }
 function buildPortfolio(model){
  const normalized=P.normalizePortfolio(model,C.valid);
  return normalized.pending?{ready:false,items:[],errors:[text().pending],fieldErrors:[],paymentPending:true}:
   root.PortfolioV2Engine.build(normalized.model);
 }
 function refresh(){
  attachV1();
  const model=root.PortfolioV2UI?.getState?.();if(model)paintPortfolio(model);
  const summary=document.querySelector('#product-portfolio-business-summary.nd-payment-pending');
  if(summary)summary.textContent=text().pending;
  const breakdown=document.querySelector('#own-materials-landed-breakdown[data-nomad-no-translate]');
  if(breakdown)breakdown.textContent=text().pending;
  const importError=document.getElementById('linked-v2-entry-error');
  if(importError&&Object.values(words).some(t=>t.pending===importError.textContent))importError.textContent=text().pending;
  if(model)root.PortfolioV2UI?.refreshPayments?.();
 }
 function boot(){
  attachV1();
  // The language shell initializes later in DOMContentLoaded. Paint its saved
  // language after all boot listeners, including automatic draft restoration.
  setTimeout(refresh,0);
  document.addEventListener('nomad360:languagechange',refresh);
  document.addEventListener('nomad360:currencychange',()=>{resetV1();refresh();});
  document.addEventListener('input',event=>{
   if(event.target.closest('[data-payment-field]'))attachV1();
  });
  document.addEventListener('change',event=>{
   if(!event.target.matches('[data-payment-currency]')||event.target.closest('[data-payment-path]'))return;
   const field=event.target.closest('[data-payment-field]')?.querySelector('input');if(!field)return;
   if(field.classList.contains('material-cost-price'))root.updateCalculatedMaterialsCost?.(true);
   else if(field.id==='resale-buy-total')root.updateResalePurchase?.();
   root.recalculateMaterialsLandedCost?.();
   root.syncVisibleAggregateFromCurrentProduct?.();
   root.refreshAllAggregatePricing?.();refresh();root.Nomad360LocaleCore?.localizeAll?.();
  });
 }
 root.Nomad360PaymentUI=Object.freeze({attachV1,readNumber,captureV1,restoreV1,resetV1,paymentField,paintPortfolio,updatePortfolio,syncPortfolio,buildPortfolio,pendingMessage:()=>text().pending});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
