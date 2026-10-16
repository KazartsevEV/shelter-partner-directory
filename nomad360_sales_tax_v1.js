/* SALES-TAX-07B stage 2: optional, preview-only V1 goods adapter.
 * The original VAT, profit, turnover, purchase and cash-flow functions are
 * NOT edited. This module is inert without an explicit preview or saved mode.
 */
(function(root){
'use strict';
const params=new URLSearchParams(root.location.search);
let persisted=null;
try{persisted=JSON.parse(root.localStorage.getItem('marketingCalcProductResultV1')||'null');}catch(_){}
if(params.get('sales_tax_preview')!=='1' && persisted?.taxRegime!=='sales_tax')return;

const GOODS=new Set(['own','resale','dropship']);
const copy={
 ru:{heading:'Режим налога с продаж',modes:['НДС (VAT / IVA)','Sales Tax','Без налога с продаж'],rate:'Ставка Sales Tax, %',hint:'Sales Tax начисляется после скидки. Он не является выручкой и не вычитается из прибыли дважды. Индивидуальные вычеты и льготы не учитываются — обратитесь к бухгалтеру.',need:'Введите корректную ставку Sales Tax, %. Пустое значение недопустимо.',unsupported:'Для смешанных портфелей и услуг Sales Tax появится на следующем этапе.',buyer:'Итоговая цена для покупателя',tax:'Sales Tax',noV2:'Перенос Sales Tax в V2 появится на этапе 7Б-4. Не изменяем вашу модель молча.',noPDF:'Экспорт Sales Tax будет подключён на этапе 7Б-5. Продолжайте работу в V1.'},
 en:{heading:'Sales tax regime',modes:['VAT / IVA','Sales Tax','No sales tax'],rate:'Sales Tax rate, %',hint:'Sales Tax is added after discounts. It is not business revenue and is not deducted twice. Individual deductions and reliefs are not included; consult an accountant.',need:'Enter a valid Sales Tax rate. Empty rates are not accepted.',unsupported:'Sales Tax for services and mixed portfolios will follow in a later stage.',buyer:'Final customer price',tax:'Sales Tax',noV2:'Sales Tax V2 transfer is coming in stage 7B-4. Your scenario will not be silently changed.',noPDF:'Sales Tax PDF export follows in stage 7B-5. Continue in V1.'},
 kk:{heading:'Сатудан алынатын салық режимі',modes:['ҚҚС (VAT / IVA)','Sales Tax','Сатудан алынатын салық жоқ'],rate:'Sales Tax мөлшерлемесі, %',hint:'Sales Tax жеңілдіктен кейін қосылады, кәсіпорынның табысы емес. Жеке шегерімдер мен жеңілдіктер ескерілмейді. Бухгалтермен кеңесіңіз.',need:'Sales Tax мөлшерлемесін дұрыс енгізіңіз. Бос мән жарамайды.',unsupported:'Қызметтер мен аралас портфельдер үшін Sales Tax келесі кезеңде енгізіледі.',buyer:'Сатып алушының соңғы бағасы',tax:'Sales Tax',noV2:'V2-ге Sales Tax көшіру 7Б-4 кезеңінде енгізіледі.',noPDF:'Sales Tax PDF экспорты 7Б-5 кезеңінде енгізіледі.'}
};
let mode=null,rawRate='',internal=false,widget=null,legacyCard=null;
const language=()=>copy[root.Nomad360UI?.getLanguage?.()]||copy.ru;
const hasService=()=>productSource==='offline-service'||productPortfolio.some(x=>!GOODS.has(x.source));
const active=()=>mode==='sales_tax';
function error(){
 if(!active())return '';
 if(hasService())return language().unsupported;
 try{root.Nomad360SalesTax.quote({mode:'sales_tax',enteredPrice:100,ratePct:rawRate});return '';}
 catch(_){return language().need;}
}
function quote(value,discount=0){
 if(!active()||error()||value===null||value===undefined||!Number.isFinite(Number(value)))return null;
 try{return root.Nomad360SalesTax.quote({mode:'sales_tax',enteredPrice:Number(value),ratePct:rawRate,discountPct:discount});}
 catch(_){return null;}
}
function render(){
 if(!widget)return;
 const t=language();
 widget.querySelector('[data-st-title]').textContent=t.heading;
 const select=widget.querySelector('[data-st-mode]');
 [...select.options].forEach((o,i)=>o.textContent=t.modes[i]);
 select.value=mode||((productOwnChoices.salesVat==='no')?'none':'vat');
 widget.querySelector('[data-st-rate-title]').textContent=t.rate;
 widget.querySelector('[data-st-hint]').textContent=t.hint;
 const rate=widget.querySelector('[data-st-rate]');
 if(rate.value!==rawRate)rate.value=rawRate;
 widget.querySelector('[data-st-rate-wrap]').hidden=!active();
 const err=widget.querySelector('[data-st-error]');
 err.textContent=error();err.hidden=!err.textContent;
 widget.hidden=hasService();
 if(legacyCard)legacyCard.hidden=active()||mode==='none';
}
function original(name){const f=root[name];if(typeof f!=='function')throw Error('Missing legacy V1 function: '+name);return f;}
const legacy={
 select:original('selectProductYesNo'),
 pricing:original('aggregatePricingMetrics'),
 range:original('calculatePriceListRange'),
 update:original('updateAggregatePricing'),
 render:original('renderProductBusinessSummary'),
 saveSku:original('saveCurrentProductToPortfolio'),
 save:original('saveProductCalculationToBrowser'),
 resume:original('resumeSavedProductCalculation'),
 fresh:original('startFreshProductCalculation'),
 edit:original('editSavedProduct'),
 append:original('addAnotherProduct'),
 delete:original('deleteCalculatedProduct'),
 assortment:original('setProductAssortmentChoice'),
 pdf:original('exportProductCalculationPdf'),
 v2:original('openLinkedPortfolioFromProducts')
};
// The legacy "no VAT" handler resets the VAT input. Sales Tax and "none"
 // must not destroy the user's independent VAT rate, including after resume.
function selectLegacyVat(choice){
 const field=document.getElementById('own-sales-vat-pct');
 const oldRate=field?.value;
 internal=true;
 try{legacy.select('salesVat',choice);}
 finally{
  if(field&&oldRate!==undefined)field.value=oldRate;
  internal=false;
 }
}
function choose(next){
 if(!['vat','sales_tax','none'].includes(next))return false;
 if(next==='sales_tax'&&hasService())return false;
 mode=next;
 selectLegacyVat(next==='vat'?'yes':'no');
 render();
 legacy.render();
 refreshAllAggregatePricing();
 return true;
}
function rate(value){
 rawRate=String(value);
 render();
 legacy.render();
 refreshAllAggregatePricing();
}
root.selectProductYesNo=function(group,value){
 const v=legacy.select.apply(this,arguments);
 if(group==='salesVat'&&!internal){mode=null;render();}
 return v;
};
root.aggregatePricingMetrics=function(item){
 const x=legacy.pricing.apply(this,arguments);
 if(!active()||!GOODS.has(item?.source))return x;
 const first=quote(x.priceBeforeTax),last=quote(x.taxAdjustedPrice);
 return {...x,priceBeforeTaxWithVat:first?.customerTotal??null,
  taxAdjustedPriceWithVat:last?.customerTotal??null,
  vatReady:!!first,salesTaxAmount:last?.tax??null,salesTaxRatePct:first?.ratePct??null};
};
root.calculatePriceListRange=function(item){
 if(!active()||!GOODS.has(item?.source))return legacy.range.apply(this,arguments);
 if(error())return {ready:false,error:error(),minPrice:null,maxPrice:null};
 const result=legacy.range.apply(this,arguments);
 if(!result.ready)return result;
 const factor=1+Number(rawRate)/100;
 return {...result,minPrice:Math.ceil(result.minPrice*factor*100)/100,
   maxPrice:Math.ceil(result.maxPrice*factor*100)/100};
};
root.updateAggregatePricing=function(item){
 const result=legacy.update.apply(this,arguments);
 if(active()&&GOODS.has(item?.source)){
  const section=document.querySelector('[data-business-product-id="'+item.id+'"]');
  const p=root.aggregatePricingMetrics(item);
  const label=section?.querySelector('[data-vat-price-label]'),
        field=section?.querySelector('[data-vat-price-value]');
  if(label)label.textContent=language().tax;
  if(field)field.textContent=p.taxAdjustedPriceWithVat===null?'—':
    p.taxAdjustedPriceWithVat.toLocaleString(root.Nomad360UI?.getLanguage?.()||'ru',{maximumFractionDigits:2});
 }
 return result;
};
function decorate(){
 if(!active())return;
 document.querySelectorAll('[data-tax-price-product-id]').forEach(el=>{
  const id=el.getAttribute('data-tax-price-product-id');
  const item=productPortfolio.find(x=>String(x.id)===id);
  if(!item||!GOODS.has(item.source))return;
  const p=root.aggregatePricingMetrics(item);
  const cells=[...el.querySelectorAll('.aggregate-muted')];
  for(const cell of cells){
    if(cell.textContent.trim()==='НДС'){
      cell.textContent=language().tax;
      if(cell.nextElementSibling)cell.nextElementSibling.textContent=p.salesTaxAmount===null?'—':
        Number(rawRate).toLocaleString(undefined,{maximumFractionDigits:2})+
        '% = '+p.salesTaxAmount.toLocaleString(undefined,{maximumFractionDigits:2});
    }
    if(cell.textContent.trim()==='Итоговая цена продажи')cell.textContent=language().buyer;
  }
  const buyer=el.querySelector('.final-buyer-price');
  if(buyer)buyer.textContent=p.taxAdjustedPriceWithVat===null?'—':
    p.taxAdjustedPriceWithVat.toLocaleString(undefined,{maximumFractionDigits:2});
 });
}
root.renderProductBusinessSummary=function(){
 const v=legacy.render.apply(this,arguments);decorate();return v;
};
root.saveCurrentProductToPortfolio=function(){
 const result=legacy.saveSku.apply(this,arguments);
 if(active()&&GOODS.has(productSource)){
  const item=productPortfolio.find(x=>Number(x.id)===Number(currentProductSequence));
  if(item){item.taxRegime='sales_tax';item.salesTaxPct=rawRate;}
 }
 return result;
};
root.saveProductCalculationToBrowser=function(){
 if(active()&&error()){
   for(const id of ['product-browser-save-status','product-draft-save-status']){
     const el=document.getElementById(id);if(el)el.textContent=error();
   }
   return false;
 }
 const saved=legacy.save.apply(this,arguments);
 if(!saved||!active())return saved;
 try{
  const key='marketingCalcProductResultV1';
  const payload=JSON.parse(localStorage.getItem(key));
  payload.taxRegime='sales_tax';payload.salesTaxPct=rawRate;
  for(const x of payload.productPortfolio)if(GOODS.has(x.source)){
    x.taxRegime='sales_tax';x.salesTaxPct=rawRate;
  }
  localStorage.setItem(key,JSON.stringify(payload));
 }catch(e){console.error('Could not persist Sales Tax regime',e);return false;}
 return saved;
};
function restoreFrom(saved){
 if(saved?.taxRegime==='sales_tax'){
   mode='sales_tax';rawRate=String(saved.salesTaxPct??'');
   selectLegacyVat('no');
 }else{mode=null;rawRate='';}
 render();
}
root.resumeSavedProductCalculation=function(){
 let saved=null;
 try{saved=JSON.parse(localStorage.getItem('marketingCalcProductResultV1'));}catch(_){}
 const result=legacy.resume.apply(this,arguments);if(result)restoreFrom(saved);return result;
};
root.startFreshProductCalculation=function(){
 const prev=mode,prevRate=rawRate;
 const result=legacy.fresh.apply(this,arguments);
 // Saved append flows retain their original shared Sales Tax settings.
 if(productPortfolio.length&&prev==='sales_tax'){
   mode=prev;rawRate=prevRate;
   selectLegacyVat('no');
 }else{mode=null;rawRate='';}
 render();return result;
};
root.editSavedProduct=function(id){
 const saved=productPortfolio.find(x=>Number(x.id)===Number(id));
 const result=legacy.edit.apply(this,arguments);
 if(saved?.taxRegime==='sales_tax')restoreFrom(saved);
 else if(!productPortfolio.some(x=>x.taxRegime==='sales_tax')){mode=null;rawRate='';render();}
 return result;
};
root.addAnotherProduct=function(){
 const beforeMode=mode,beforeRate=rawRate;
 const result=legacy.append.apply(this,arguments);
 if(result&&beforeMode==='sales_tax'){
   mode=beforeMode;rawRate=beforeRate;
   selectLegacyVat('no');
   render();
 }
 return result;
};
root.deleteCalculatedProduct=function(){
 const wasMode=mode,wasRate=rawRate;
 const result=legacy.delete.apply(this,arguments);
 if(result&&wasMode==='sales_tax'&&productPortfolio.length){
   mode=wasMode;rawRate=wasRate;
   selectLegacyVat('no');
   render();
 }
 return result;
};
root.setProductAssortmentChoice=function(){
 const result=legacy.assortment.apply(this,arguments);render();return result;
};
root.exportProductCalculationPdf=function(){
 if(active()){
   const el=document.getElementById('product-browser-save-status');
   if(el)el.textContent=language().noPDF;
   return false;
 }
 return legacy.pdf.apply(this,arguments);
};
root.openLinkedPortfolioFromProducts=function(){
 if(active()){
   const el=document.getElementById('linked-v2-entry-error');
   if(el){el.textContent=language().noV2;el.hidden=false;el.classList.remove('hidden');}
   return false;
 }
 return legacy.v2.apply(this,arguments);
};
function boot(){
 const taxBlock=document.getElementById('product-tax-block');
 if(!taxBlock)return;
 legacyCard=taxBlock.firstElementChild;
 widget=document.createElement('div');
 widget.setAttribute('data-sales-tax-v1-widget','');
 widget.setAttribute('data-nomad-no-translate','');
 widget.style.cssText='margin-bottom:16px;padding:14px;border:1px solid #94a3b8;border-radius:10px;background:#f8fafc;color:#16375a';
 widget.innerHTML='<label data-st-title style="display:block;font-weight:700;margin-bottom:8px"></label>'+
  '<select data-st-mode aria-label="Sales tax regime" style="width:100%;padding:10px;border:1px solid #94a3b8;border-radius:6px">'+
  '<option value="vat"></option><option value="sales_tax"></option><option value="none"></option></select>'+
  '<div data-st-rate-wrap hidden style="margin-top:12px"><label data-st-rate-title style="display:block;font-weight:700"></label>'+
  '<input data-st-rate type="number" min="0" step="0.01" inputmode="decimal" style="width:100%;padding:10px;border:1px solid #94a3b8;border-radius:6px"></div>'+
  '<p data-st-error hidden role="alert" style="color:#b91c1c;font-weight:700;margin-top:8px"></p>'+
  '<p data-st-hint style="margin:12px 0 0"></p>';
 taxBlock.insertBefore(widget,legacyCard);
 widget.querySelector('[data-st-mode]').addEventListener('change',e=>choose(e.target.value));
 widget.querySelector('[data-st-rate]').addEventListener('input',e=>rate(e.target.value));
 document.addEventListener('nomad360:languagechange',()=>{render();decorate();});
 render();
}
root.Nomad360SalesTaxV1=Object.freeze({
  select:choose,setRate:rate,getState:()=>({mode,rate:rawRate,error:error()}),
  quote,active
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})(window);
