/* Original Codex UNIFIED-BANNERS-01 revision-2 first-banner composition only.
   Other Codex banners, application calculations, locales and logo are untouched. */
(function(root){
'use strict';
if(root.Nomad360FirstCodexHero)return;
const byId=id=>document.getElementById(id);
const icons=[
 '<path d="M5 16h30v8H5zM8 24v18h24V24M20 16v26"/><path class="nomad-benefit-accent" d="M20 16c-14 0-13-15-5-10 4 3 5 10 5 10Zm0 0C34 16 33 1 25 6c-4 3-5 10-5 10Z"/>',
 '<path d="M3 10h34M3 24h34M3 38h34"/><path class="nomad-benefit-accent" d="M15 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM28 19a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 33a5 5 0 1 0 0 10 5 5 0 0 10 5 0Z"/>',
 '<rect x="7" y="20" width="26" height="23" rx="3"/><path d="M12 20v-9a8 8 0 0 1 16 0v9"/><path class="nomad-benefit-accent" d="M20 28v8"/>'
];
const captions={ru:'Рассчитать',en:'Calculate',kk:'Есептеу'};
function decorateBenefits(intro){
 const lead=intro.querySelector('.nomad-intro-lead');
 if(lead&&!lead.querySelector('strong')&&lead.textContent.startsWith('Nomad360 lite')){
   const text=lead.textContent,strong=document.createElement('strong');
   strong.textContent='Nomad360 lite';
   lead.replaceChildren(strong,document.createTextNode(text.slice('Nomad360 lite'.length)));
 }
 intro.querySelectorAll('li').forEach((item,index)=>{
  if(item.querySelector('.nomad-benefit-icon'))return;
  const text=item.textContent,split=text.indexOf(':'),copy=document.createElement('span');
  copy.className='nomad-benefit-copy';
  if(split>=0){
    const strong=document.createElement('strong');strong.textContent=text.slice(0,split+1);
    copy.append(strong,document.createTextNode(text.slice(split+1)));
  }else copy.textContent=text;
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
  icon.setAttribute('viewBox','0 0 40 48');
  icon.setAttribute('aria-hidden','true');
  icon.setAttribute('focusable','false');
  icon.classList.add('nomad-benefit-icon');
  icon.innerHTML=icons[index]||icons[0];
  item.replaceChildren(icon,copy);
 });
}
function decorate(){
 const hero=byId('nomad360-hero'),seo=byId('nomad360-seo-banner'),intro=byId('nomad360-intro');
 if(!hero||!seo||!intro)return;
 let wrapper=byId('nomad360-commercial-banner');
 if(!wrapper){
   wrapper=document.createElement('div');
   wrapper.id='nomad360-commercial-banner';
   wrapper.className='nomad-banner nomad-banner-hero';
   hero.before(wrapper);
 }
 if(hero.parentElement!==wrapper)wrapper.append(hero);
 if(seo.parentElement!==wrapper)wrapper.append(seo);
 if(intro.parentElement!==seo)seo.prepend(intro);
 // The Codex composition uses the already accepted intro instead of duplicating
 // the old visual SEO banner. Keep the indexed text in its source HTML unchanged.
 const original=seo.querySelector('.nomad-seo-copy');
 if(original)original.remove();
 decorateBenefits(intro);
 const brand=seo.querySelector('.nomad-seo-brand');
 if(brand)seo.append(brand);
 const cta=hero.querySelector('.nomad-intro-cta');
 if(cta){
    const lang=root.Nomad360UI?.getLanguage?.()||document.documentElement.lang||'ru';
    const arrow=cta.textContent.match(/[↓↘→]/)?.[0]||'↓';
    cta.textContent=arrow+' '+(captions[lang]||captions.ru);
 }
}
function init(){
 decorate();
 document.addEventListener('nomad360:languagechange',decorate);
 document.addEventListener('nomad360:currencychange',decorate);
}
root.Nomad360FirstCodexHero=Object.freeze({refresh:decorate});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
