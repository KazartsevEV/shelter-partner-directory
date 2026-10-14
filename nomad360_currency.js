/* Calculation currency is business data, independent of the UI language.
 * Selecting a code labels newly entered amounts; it never converts a draft. */
(function(root){
'use strict';
const currencies=Object.freeze([
 ['USD','🇺🇸'],['KZT','🇰🇿'],['EUR','🇪🇺'],['RUB','🇷🇺'],['CNY','🇨🇳'],
 ['GBP','🇬🇧'],['TRY','🇹🇷'],['AED','🇦🇪'],['GEL','🇬🇪'],['UZS','🇺🇿'],
 ['KGS','🇰🇬'],['CAD','🇨🇦'],['AUD','🇦🇺'],['JPY','🇯🇵'],['KRW','🇰🇷']
].map(pair=>Object.freeze(pair)));
const valid=code=>currencies.some(([iso])=>iso===code);
let current='USD',next='USD';
// Do not infer a business currency from locale, country or an unrelated draft.
const labels=(root.Nomad360LocaleCore?.locales("currency.business") || {
 ru:{question:'В какой валюте будем рассчитывать бизнес?',note:'Результаты и расходы без отдельного выбора валюты платежа считаются в валюте бизнеса. Сохранённый расчёт откроется в своей валюте.',amounts:'Валюта расчёта',mixed:'Нельзя объединить расчёты в разных валютах. Рассчитайте позиции в одной валюте.'},
 en:{question:'Which currency will we use to calculate the business?',note:'Business results and expenses without a separate payment currency use this currency. A saved calculation opens in its own currency.',amounts:'Calculation currency',mixed:'Calculations in different currencies cannot be combined. Calculate all items in the same currency.'},
 kk:{question:'Бизнесті қай валютамен есептейміз?',note:'Нәтижелер мен төлем валютасы бөлек таңдалмаған шығындар бизнес валютасында есептеледі. Сақталған есеп өз валютасымен ашылады.',amounts:'Есептеу валютасы',mixed:'Әртүрлі валютадағы есептерді біріктіру мүмкін емес. Барлық позицияны бір валютамен есептеңіз.'}
});
const lang=()=>root.Nomad360UI?.getLanguage?.()||'ru';
function get(){return current;}
function assertSame(code){if((valid(code)?code:'USD')!==current)throw Error((labels[lang()]||labels.ru).mixed);}
function caption(){return (labels[lang()]||labels.ru).amounts+': '+current;}
function options(selected=current){return currencies.map(([code,flag])=>'<option value="'+code+'"'+(code===selected?' selected':'')+'>'+flag+' '+code+'</option>').join('');}
function replaceUnits(text,code=current){
 const iso=valid(code)?code:'USD';
 // Quoted source names belong to the user, including names containing units.
 return String(text).split(/(«[^»]*»|“[^”]*”)/).map(part=>
  /^[«“]/.test(part)?part:part.replace(/(?:у\.\s?е\.|ш\.\s?б\.|currency units|monetary units|\bMU\b)\*?/gi,iso)).join('');
}
function render(){
 const t=labels[lang()]||labels.ru;
 const select=document.getElementById('business-currency');
 if(select){if(!select.options.length)select.innerHTML=options();select.value=next;}
 for(const [id,key] of [['business-currency-question','question'],['business-currency-help','note']]){
  const node=document.getElementById(id);if(node)node.textContent=t[key];
 }
 for(const node of document.querySelectorAll('[data-business-currency-note]'))node.textContent=t.amounts+': '+current;
 root.Nomad360LocaleCore?.localizeAll?.();
}
function adopt(code){
 // Legacy drafts without currency retain the explicit initial default USD.
 current=valid(code)?code:'USD';
 render();
 document.dispatchEvent(new CustomEvent('nomad360:currencychange',{detail:{currency:current}}));
 return current;
}
function beginNew(){return adopt(next);}
function boot(){
 document.getElementById('business-currency')?.addEventListener('change',event=>{
  next=valid(event.target.value)?event.target.value:'USD';render();
 });
 document.addEventListener('nomad360:languagechange',render);
 render();
}
root.Nomad360Currency=Object.freeze({get,adopt,beginNew,caption,valid,options,replaceUnits,currencies,assertSame});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
