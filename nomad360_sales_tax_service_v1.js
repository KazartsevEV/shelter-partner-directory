/* SALES-TAX-07B stage 3: V1 services only. Preview gated until stages 4-6.
 * Tax on the customer's sale is transit, NOT the agent's commission or income.
 * Existing VAT, payer splits, operating cash and financing remain untouched.
 */
(function(root){
'use strict';
const key='marketingCalcProductResultV1',simpleKey='nomad360SalesTaxSimpleV1';
const params=new URLSearchParams(root.location.search);
let saved=null,simpleSaved=null;
try{saved=JSON.parse(localStorage.getItem(key)||'null');}catch(_){}
try{simpleSaved=JSON.parse(localStorage.getItem(simpleKey)||'null');}catch(_){}
if(params.get('sales_tax_preview')!=='1'&&
   !(saved?.taxRegime==='sales_tax'&&saved.productPortfolio?.some(x=>x.source==='offline-service'))&&
   simpleSaved?.mode!=='sales_tax')return;
const messages=[
 {title:'Налог с продаж для услуг V1',modes:['НДС (VAT / IVA)','Sales Tax','Без налога с продаж'],rate:'Ставка Sales Tax, %',hint:'Налог добавляется к цене покупателя после скидки. Выручка, прибыль и Cash Flow остаются без транзитного налога. Вычеты и льготы не учтены — проконсультируйтесь с бухгалтером.',agent:'Sales Tax начисляется на продажу принципала покупателю, не на ваше агентское вознаграждение.',need:'Введите корректную ставку Sales Tax, %.',sale:'Стоимость услуги без Sales Tax',tax:'Sales Tax',buyer:'Платёж покупателя',income:'Вознаграждение агента без Sales Tax',v2:'Перенос Sales Tax в V2 — этап 7Б-4.',pdf:'Экспорт Sales Tax — этап 7Б-5.',blocked:'Сначала завершите расчёт услуги. Не смешивайте товары и услуги при Sales Tax.',vatSimple:'Для НДС используйте полный расчёт услуг V1.'},
 {title:'V1 service sales tax',modes:['VAT / IVA','Sales Tax','No sales tax'],rate:'Sales Tax rate, %',hint:'Tax is added to the buyer price after discounts. Transit tax is excluded from revenue, profit and cash flow. Individual reliefs are excluded; consult an accountant.',agent:'Sales Tax applies to the principal’s customer sale, not to your agency commission.',need:'Enter a valid Sales Tax rate, %.',sale:'Service sale before Sales Tax',tax:'Sales Tax',buyer:'Customer payment',income:'Agent fee before Sales Tax',v2:'V2 transfer follows in stage 7B-4.',pdf:'Sales Tax export follows in stage 7B-5.',blocked:'Complete the service calculation first. Mixed goods and services are not supported.',vatSimple:'For VAT use the full V1 service calculation.'},
 {title:'V1 қызметтеріне арналған Sales Tax',modes:['ҚҚС (VAT / IVA)','Sales Tax','Сатудан алынатын салық жоқ'],rate:'Sales Tax мөлшерлемесі, %',hint:'Салық жеңілдіктен кейін сатып алушы төлейтін бағаға қосылады. Транзиттік салық табысқа, пайдаға және ақша ағынына кірмейді. Жеке жеңілдіктер есептелмейді; бухгалтермен кеңесіңіз.',agent:'Sales Tax агент комиссиясына емес, принципалдың сатып алушыға сатуына есептеледі.',need:'Sales Tax мөлшерлемесін дұрыс енгізіңіз.',sale:'Sales Tax-ке дейінгі қызмет бағасы',tax:'Sales Tax',buyer:'Сатып алушының төлемі',income:'Sales Tax-ке дейінгі агент сыйақысы',v2:'V2-ге көшу 7Б-4 кезеңінде.',pdf:'Sales Tax экспорты 7Б-5 кезеңінде.',blocked:'Алдымен қызмет есебін аяқтаңыз. Аралас портфельге қолдау жоқ.',vatSimple:'ҚҚС үшін толық V1 қызмет есебін пайдаланыңыз.'}
];
const lang=()=>messages[['ru','en','kk'].indexOf(root.Nomad360UI?.getLanguage?.())]||messages[0];
let mode=null,rate='',simpleMode=simpleSaved?.mode==='sales_tax'?'sales_tax':'none',
 simpleRate=String(simpleSaved?.rate??''),fullWidget=null,simpleWidget=null,oldVatRate='';
const fullActive=()=>mode==='sales_tax'&&fullService();
const simpleActive=()=>simpleMode==='sales_tax';
const fullService=()=>productSource==='offline-service';
const mixed=()=>productPortfolio.some(x=>x.source!=='offline-service');
const valid=(val,kind)=>{try{return root.Nomad360SalesTax.quote({mode:kind,enteredPrice:0,ratePct:val});}catch(_){return null;}};
const quote=(price,kind,ratePct,discount)=>{try{return root.Nomad360SalesTax.quote({
 mode:kind,enteredPrice:price,ratePct,discountPct:discount||0
});}catch(_){return null;}};
const number=v=>Number.isFinite(v)?v.toLocaleString(root.Nomad360UI?.getLanguage?.()||'ru',{maximumFractionDigits:2}):'—';
const money=v=>number(v)+' '+(root.Nomad360Currency?.get?.()||'USD');
function setText(node,value){if(node)node.textContent=value;}
function section(t){
 const n=document.createElement(t);
 return n;
}
function buildWidget(target,id){
 const host=document.getElementById(target);if(!host)return null;
 const box=section('div');box.dataset.salesTaxService=id;box.setAttribute('data-nomad-no-translate','');
 box.style.cssText='margin:0 0 16px;padding:14px;border:1px solid #94a3b8;border-radius:10px;background:#f8fafc;color:#16375a';
 const label=section('label');label.dataset.stTitle='';label.style.cssText='display:block;font-weight:700;margin-bottom:8px';
 const select=section('select');select.dataset.stMode='';select.setAttribute('aria-label','Sales tax regime');
 select.style.cssText='display:block;width:100%;padding:9px;border:1px solid #94a3b8;border-radius:6px';
 for(const m of ['vat','sales_tax','none']){const option=section('option');option.value=m;select.append(option);}
 const row=section('div');row.dataset.stRateWrap='';row.style.marginTop='12px';
 const rateLabel=section('label');rateLabel.dataset.stRateTitle='';rateLabel.style.cssText='display:block;font-weight:700';
 const input=section('input');input.dataset.stRate='';input.type='number';input.min='0';input.step='0.01';input.inputMode='decimal';
 input.style.cssText='width:100%;padding:9px;border:1px solid #94a3b8;border-radius:6px';
 row.append(rateLabel,input);
 const error=section('p');error.dataset.stError='';error.setAttribute('role','alert');error.style.cssText='color:#b91c1c;font-weight:700;margin-top:8px';
 const details=section('p');details.dataset.stDetails='';details.style.cssText='margin-top:10px;white-space:pre-line';
 const hint=section('p');hint.dataset.stHint='';hint.style.cssText='margin-top:12px;font-size:13px';
 box.append(label,select,row,error,details,hint);
 if(id==='full')host.insertBefore(box,host.firstChild);else host.insertBefore(box,host.firstChild);
 select.addEventListener('change',e=>id==='full'?selectFull(e.target.value):selectSimple(e.target.value));
 input.addEventListener('input',e=>id==='full'?setFullRate(e.target.value):setSimpleRate(e.target.value));
 return box;
}
function updateWidget(box,kind,val,active,detail,errorText,hint){
 if(!box)return;
 const t=lang();setText(box.querySelector('[data-st-title]'),t.title);
 [...box.querySelector('[data-st-mode]').options].forEach((opt,i)=>opt.textContent=t.modes[i]);
 box.querySelector('[data-st-mode]').value=kind;
 setText(box.querySelector('[data-st-rate-title]'),t.rate);
 const input=box.querySelector('[data-st-rate]');if(input.value!==val)input.value=val;
 box.querySelector('[data-st-rate-wrap]').hidden=!active;
 setText(box.querySelector('[data-st-error]'),errorText);
 box.querySelector('[data-st-error]').hidden=!errorText;
 setText(box.querySelector('[data-st-details]'),detail);
 setText(box.querySelector('[data-st-hint]'),hint||t.hint);
}
function fullError(){
 if(!fullActive())return '';
 if(mixed())return lang().blocked;
 if(!valid(rate,'sales_tax'))return lang().need;
 return '';
}
function withLegacyVat(choice){
 const field=document.getElementById('own-sales-vat-pct');
 const previous=field?.value;
 root.selectProductYesNo('salesVat',choice);
 if(field&&previous!==undefined)field.value=previous;
}
// V1 agency has two older VAT surfaces: the agent fee and the
// principal's settlement. Neither is a Sales Tax deduction. Preserve both
// historic inputs for a reversible VAT -> Sales Tax -> VAT switch.
let transientVat=null;
function replaceItemVat(item,enabled){
 if(!item||item.source!=='offline-service')return;
 if(!enabled){
  if(!item.salesTaxVatBackup)item.salesTaxVatBackup={
    choice:item.uiState?.choices?.salesVat||'no',
    partnerRate:item.serviceAgency?.partnerVatPct??0,
    partnerInput:item.inputs?.['service-agent-partner-vat']??'0'
  };
  if(item.uiState?.choices)item.uiState.choices.salesVat='no';
  if(item.serviceAgency)item.serviceAgency.partnerVatPct=0;
  if(item.inputs)item.inputs['service-agent-partner-vat']='0';
 }else if(item.salesTaxVatBackup){
  if(item.uiState?.choices)item.uiState.choices.salesVat=item.salesTaxVatBackup.choice;
  if(item.serviceAgency)item.serviceAgency.partnerVatPct=item.salesTaxVatBackup.partnerRate;
  if(item.inputs)item.inputs['service-agent-partner-vat']=item.salesTaxVatBackup.partnerInput;
  delete item.salesTaxVatBackup;
 }
}
function swapAgencyVat(next){
 const field=document.getElementById('service-agent-partner-vat');
 if(next!=='vat'){
  if(!transientVat)transientVat={rate:field?.value??'0',choice:productOwnChoices.salesVat};
  if(field)field.value='0';
  for(const item of productPortfolio)replaceItemVat(item,false);
 }else{
  if(field&&transientVat)field.value=transientVat.rate;
  for(const item of productPortfolio)replaceItemVat(item,true);
  transientVat=null;
 }
}
function selectFull(next){
 if(!['vat','sales_tax','none'].includes(next)||next==='sales_tax'&&mixed())return false;
 swapAgencyVat(next);
 mode=next;
 withLegacyVat(next==='vat'?'yes':'no');
 drawFull();root.renderProductBusinessSummary();root.refreshAllAggregatePricing();
 return true;
}
function setFullRate(next){rate=String(next);drawFull();root.renderProductBusinessSummary();root.refreshAllAggregatePricing();}
function renderFull(){
 if(!fullWidget)return;
 const on=fullService();fullWidget.hidden=!on;
 if(!on)return;
 const t=lang(),err=fullError(),active=fullActive();
 let details='';
 if(active&&!err&&productPortfolio.length===1){
   const item=productPortfolio[0],model=root.calculateProductPortfolio();
   const row=model.items.find(x=>x.id===item.id);
   const isAgent=item.serviceRole==='agent';
   // Agent's row.price is the AGENT FEE; grossPrice belongs to PRINCIPAL.
   const base=isAgent?Number(item.serviceAgency?.grossPrice):Number(row?.price)*Number(model.taxPriceMultiplier);
   const q=Number.isFinite(base)&&base>=0?quote(base,'sales_tax',rate):null;
   if(q&&model.pricingReady){
    details=t.sale+': '+money(q.net)+'\n'+t.tax+': '+money(q.tax)+
      '\n'+t.buyer+': '+money(q.customerTotal);
    if(isAgent)details+='\n'+t.income+': '+money(Number(row?.price));
   }else details=t.blocked;
 }
 updateWidget(fullWidget,mode||((productOwnChoices.salesVat==='no')?'none':'vat'),rate,active,details,err,
   t.hint+(selectedServiceRole==='agent'?' '+t.agent:''));
 const legacy=document.getElementById('product-tax-block')?.querySelector(':scope > .rounded-xl');
 if(legacy)legacy.hidden=active||mode==='none';
}
function drawFull(){renderFull();}
function decorateFull(item){
 if(!fullActive()||!fullService()||!item||item.source!=='offline-service')return;
 const row=document.querySelector('[data-business-product-id="'+item.id+'"]');
 if(!row)return;
 const p=root.aggregatePricingMetrics(item);
 const label=row.querySelector('[data-vat-price-label]'),value=row.querySelector('[data-vat-price-value]');
 if(label)setText(label,item.serviceRole==='agent'?lang().income:lang().buyer);
 if(value)setText(value,item.serviceRole==='agent'?number(p.priceBeforeTax):number(p.priceBeforeTaxWithVat));
}
const original={
 pricing:root.aggregatePricingMetrics,range:root.calculatePriceListRange,update:root.updateAggregatePricing,
 summary:root.renderProductBusinessSummary,saveSku:root.saveCurrentProductToPortfolio,
 save:root.saveProductCalculationToBrowser,resume:root.resumeSavedProductCalculation,
 fresh:root.startFreshProductCalculation,edit:root.editSavedProduct,append:root.addAnotherProduct,
 pdf:root.exportProductCalculationPdf,v2:root.openLinkedPortfolioFromProducts,
 calculate:root.calculate,onlineV2:root.openLinkedPortfolioFromOnline
};
root.aggregatePricingMetrics=function(item){
 const p=original.pricing.apply(this,arguments);
 if(!fullActive()||fullError()||item?.source!=='offline-service'||item?.serviceRole==='agent')return p;
 const first=quote(p.priceBeforeTax,'sales_tax',rate),last=quote(p.taxAdjustedPrice,'sales_tax',rate);
 return {...p,priceBeforeTaxWithVat:first?.customerTotal??null,
   taxAdjustedPriceWithVat:last?.customerTotal??null,vatReady:!!first,
   salesTaxRatePct:Number(rate),salesTaxAmount:last?.tax??null};
};
root.calculatePriceListRange=function(item){
 if(!fullActive()||item?.source!=='offline-service')return original.range.apply(this,arguments);
 if(fullError())return {ready:false,error:fullError(),minPrice:null,maxPrice:null};
 const result=original.range.apply(this,arguments);
 if(!result.ready||item.serviceRole==='agent')return result;
 const factor=1+Number(rate)/100;
 return {...result,minPrice:Math.ceil(result.minPrice*factor*100)/100,
  maxPrice:Math.ceil(result.maxPrice*factor*100)/100};
};
root.updateAggregatePricing=function(item){
 const value=original.update.apply(this,arguments);decorateFull(item);renderFull();return value;
};
root.renderProductBusinessSummary=function(){
 const value=original.summary.apply(this,arguments);
 for(const x of productPortfolio)decorateFull(x);
 renderFull();return value;
};
root.saveCurrentProductToPortfolio=function(){
 const previous=productPortfolio.find(x=>Number(x.id)===Number(currentProductSequence));
 const legacyBackup=previous?.salesTaxVatBackup;
 const value=original.saveSku.apply(this,arguments);
 if(fullActive()&&fullService()&&!mixed()){
  const sku=productPortfolio.find(x=>Number(x.id)===Number(currentProductSequence));
  if(sku){
   if(legacyBackup)sku.salesTaxVatBackup=legacyBackup;
   else if(!sku.salesTaxVatBackup)sku.salesTaxVatBackup={
    choice:transientVat?.choice||'no',partnerRate:Number(transientVat?.rate)||0,
    partnerInput:transientVat?.rate||'0'
   };
   replaceItemVat(sku,false);
   sku.taxRegime='sales_tax';sku.salesTaxPct=rate;
  }
 }
 return value;
};
root.saveProductCalculationToBrowser=function(){
 if(fullActive()&&fullError()){
  for(const id of ['product-browser-save-status','product-draft-save-status'])setText(document.getElementById(id),fullError());
  return false;
 }
 const value=original.save.apply(this,arguments);
 if(!value||!fullActive())return value;
 try{
  const p=JSON.parse(localStorage.getItem(key));
  if(!p||p.productPortfolio?.some(x=>x.source!=='offline-service'))return false;
  p.taxRegime='sales_tax';p.salesTaxPct=rate;
  p.productPortfolio.forEach(x=>{x.taxRegime='sales_tax';x.salesTaxPct=rate;});
  localStorage.setItem(key,JSON.stringify(p));
 }catch(_){return false;}
 return value;
};
function restoreFull(payload){
 if(payload?.taxRegime==='sales_tax'&&payload.productPortfolio?.every(x=>x.source==='offline-service')){
  mode='sales_tax';rate=String(payload.salesTaxPct??'');
  const backup=payload.productPortfolio[0]?.salesTaxVatBackup;
  transientVat={rate:String(backup?.partnerInput??'0'),choice:backup?.choice||'no'};
  const field=document.getElementById('service-agent-partner-vat');
  if(field)field.value='0';
  for(const item of productPortfolio)replaceItemVat(item,false);
  withLegacyVat('no');
 }else{mode=null;rate='';transientVat=null;}
 renderFull();
}
root.resumeSavedProductCalculation=function(){
 let payload=null;try{payload=JSON.parse(localStorage.getItem(key)||'null');}catch(_){}
 const value=original.resume.apply(this,arguments);
 if(value)restoreFull(payload);return value;
};
root.startFreshProductCalculation=function(){
 const prior=mode,priorRate=rate;
 const value=original.fresh.apply(this,arguments);
 if(productPortfolio.length&&prior==='sales_tax'){
  mode=prior;rate=priorRate;swapAgencyVat('sales_tax');withLegacyVat('no');
 }else{mode=null;rate='';transientVat=null;}
 renderFull();return value;
};
root.editSavedProduct=function(id){
 const item=productPortfolio.find(x=>Number(x.id)===Number(id));
 const value=original.edit.apply(this,arguments);
 if(item?.source==='offline-service'&&item?.taxRegime==='sales_tax')
  restoreFull({taxRegime:'sales_tax',salesTaxPct:item.salesTaxPct,productPortfolio:[item]});
 else if(!productPortfolio.some(x=>x.taxRegime==='sales_tax')){mode=null;rate='';transientVat=null;renderFull();}
 return value;
};
root.addAnotherProduct=function(){
 const prev=mode,r=rate,value=original.append.apply(this,arguments);
 if(value&&prev==='sales_tax'){mode=prev;rate=r;swapAgencyVat('sales_tax');withLegacyVat('no');}
 renderFull();return value;
};
root.exportProductCalculationPdf=function(){
 if(fullActive()&&fullService()){setText(document.getElementById('product-browser-save-status'),lang().pdf);return false;}
 return original.pdf.apply(this,arguments);
};
root.openLinkedPortfolioFromProducts=function(){
 if(fullActive()&&fullService()){
  const e=document.getElementById('linked-v2-entry-error');if(e){setText(e,lang().v2);e.hidden=false;e.classList.remove('hidden');}
  return false;
 }
 return original.v2.apply(this,arguments);
};
function persistSimple(){
 try{localStorage.setItem(simpleKey,JSON.stringify({mode:simpleMode,rate:simpleRate}));}catch(_){}
}
function selectSimple(next){
 if(!['vat','sales_tax','none'].includes(next))return false;
 // Old simplified services have no VAT accounting. Do not emulate it.
 if(next==='vat'){setText(simpleWidget?.querySelector('[data-st-error]'),lang().vatSimple);return false;}
 simpleMode=next;persistSimple();renderSimple();return true;
}
function setSimpleRate(value){simpleRate=String(value);persistSimple();renderSimple();}
function renderSimple(){
 if(!simpleWidget)return;
 const visible=serviceFinancialMode==='simple'&&serviceChannel==='online';
 simpleWidget.hidden=!visible;
 if(!visible)return;
 const t=lang(),on=simpleActive(),err=on&&!valid(simpleRate,'sales_tax')?t.need:'';
 let info='';
 if(on&&!err&&onlineV1PortfolioSnapshot){
  const period=onlineV1PortfolioSnapshot.period;
  const q=quote(Number(period.grossRevenue),'sales_tax',simpleRate);
  if(q){
   info=t.sale+': '+money(q.net)+'\n'+t.tax+': '+money(q.tax)+'\n'+t.buyer+': '+money(q.customerTotal);
   if(serviceMode==='agent')info+='\n'+t.income+': '+money(Number(period.agentIncome));
  }
 }
 updateWidget(simpleWidget,simpleMode,simpleRate,on,info,err,t.hint+(serviceMode==='agent'?' '+t.agent:''));
}
root.calculate=function(){
 const x=original.calculate.apply(this,arguments);renderSimple();return x;
};
root.openLinkedPortfolioFromOnline=function(){
 if(simpleActive()&&serviceFinancialMode==='simple'){
  const e=document.getElementById('online-v2-error');if(e){setText(e,lang().v2);e.hidden=false;e.classList.remove('hidden');}
  return false;
 }
 return original.onlineV2.apply(this,arguments);
};
function boot(){
 fullWidget=buildWidget('product-tax-block','full');
 simpleWidget=buildWidget('calculator-screen','simple');
 if(fullWidget){fullWidget.hidden=true;fullWidget.querySelector('[data-st-mode] option[value="vat"]').disabled=false;}
 if(simpleWidget)simpleWidget.querySelector('[data-st-mode] option[value="vat"]').disabled=true;
 document.addEventListener('nomad360:languagechange',()=>{renderFull();renderSimple();});
 document.addEventListener('click',()=>{renderFull();renderSimple();});
 if(saved?.taxRegime==='sales_tax'&&saved.productPortfolio?.some(x=>x.source==='offline-service'))restoreFull(saved);
 else renderFull();
 renderSimple();
}
root.Nomad360SalesTaxServiceV1=Object.freeze({
 selectFull,setFullRate,selectSimple,setSimpleRate,
 getFull:()=>({mode,rate,error:fullError()}),
 getSimple:()=>({mode:simpleMode,rate:simpleRate}),
 quote
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
