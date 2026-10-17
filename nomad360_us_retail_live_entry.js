/* US-RETAIL-LIVE-ENTRY: localized link to isolated real V2 study. No financial or draft writes. */
(function(root){
'use strict';
const labels={
 ru:'Пример V2: магазин в США · 12 месяцев',
 en:'V2 example: US retail store · 12 months',
 kk:'V2 мысалы: АҚШ дүкені · 12 ай'
};
function sync(){
 const link=document.getElementById('us-retail-v2-live-link');
 if(!link)return;
 const lang=root.Nomad360UI?.getLanguage?.()||document.documentElement.lang||'ru';
 const active=Object.prototype.hasOwnProperty.call(labels,lang)?lang:'ru';
 link.textContent=labels[active];
 // An exported single-file embed has no neighbouring demo HTML.
 const target=document.documentElement.hasAttribute('data-nomad-embedded')
   ?'https://kazartsevev.github.io/shelter-partner-directory/US_Retail_Demo.HTML'
   :'./US_Retail_Demo.HTML';
 link.setAttribute('href',target+'?demo=us-retail-12m&lang='+encodeURIComponent(active));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);
else sync();
document.addEventListener('nomad360:languagechange',sync);
})(window);
