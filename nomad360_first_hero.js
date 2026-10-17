/* UNIFIED-HERO-02: ONLY first banner; preserve SEO locale nodes and all calculator state. */
(function(root){
'use strict';
const byId=id=>document.getElementById(id);
const icons=[
 '<path d="M5 16h30v8H5zM8 24v18h24V24M20 16v26"/><path class="nomad-first-benefit-accent" d="M20 16c-14 0-13-15-5-10 4 3 5 10 5 10Zm0 0C34 16 33 1 25 6c-4 3-5 10-5 10Z"/>',
 '<path d="M3 10h34M3 24h34M3 38h34"/><path class="nomad-first-benefit-accent" d="M15 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM28 19a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 33a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"/>',
 '<rect x="7" y="20" width="26" height="23" rx="3"/><path d="M12 20v-9a8 8 0 0 1 16 0v9"/><path class="nomad-first-benefit-accent" d="M20 28v8"/>'
];
function decorate(){
 const home=byId('home-screen'),hero=byId('nomad360-hero'),seo=byId('nomad360-seo-banner'),intro=byId('nomad360-intro');
 if(!home||!hero||!seo||!intro||!hero.querySelector('h2'))return;
 let banner=byId('nomad360-commercial-banner');
 if(!banner){
  banner=document.createElement('section');
  banner.id='nomad360-commercial-banner';banner.className='nomad-first-banner';
  hero.before(banner);
 }
 for(const node of [hero,seo])if(node.parentElement!==banner)banner.append(node);
 if(intro.parentElement!==seo)seo.prepend(intro);
 // The original business.ideaSeoTitle and business.ideaSeoCopy remain
 // visible, translated, indexed and unchanged, below the marketing claims.
 const copy=seo.querySelector('.nomad-seo-copy');
 if(copy&&seo.lastElementChild!==copy)seo.append(copy);
 const brand=seo.querySelector('.nomad-seo-brand');
 if(brand&&brand.previousElementSibling!==intro)intro.after(brand);
 const content=hero.querySelector('.nomad-hero'),heading=content?.querySelector('h2'),narrative=content?.querySelector('h3');
 if(content&&heading&&narrative){
  let art=content.querySelector('.nomad-first-hero-art');
  if(!art){art=document.createElement('div');art.className='nomad-first-hero-art';art.setAttribute('aria-hidden','true');}
  heading.after(art);
  const original=heading.textContent||'';
  const match=original.match(/мне выгодно|most profitable|тиімді/i);
  if(match&&!heading.querySelector('.nomad-first-title-accent')){
   const span=document.createElement('span');span.className='nomad-first-title-accent';span.textContent=match[0];
   heading.replaceChildren(document.createTextNode(original.slice(0,match.index)),span,document.createTextNode(original.slice(match.index+match[0].length)));
  }
 }
 const lead=intro.querySelector('.nomad-intro-lead');
 if(lead&&!lead.querySelector('strong')&&(lead.textContent||'').startsWith('Nomad360 lite')){
  const text=lead.textContent,tag=document.createElement('strong');tag.textContent='Nomad360 lite';
  lead.replaceChildren(tag,document.createTextNode(text.slice('Nomad360 lite'.length)));
 }
 intro.querySelectorAll('li').forEach((item,index)=>{
  if(item.querySelector('.nomad-first-benefit-icon'))return;
  const message=item.textContent||'',breakAt=message.indexOf(':'),copy=document.createElement('span');
  copy.className='nomad-first-benefit-copy';
  if(breakAt>=0){const title=document.createElement('strong');title.textContent=message.slice(0,breakAt+1);copy.append(title,document.createTextNode(message.slice(breakAt+1)));}
  else copy.textContent=message;
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
  icon.classList.add('nomad-first-benefit-icon');icon.setAttribute('viewBox','0 0 40 48');
  icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');
  icon.innerHTML=icons[index]||icons[0];item.replaceChildren(icon,copy);
 });
 // On a full language rerender the shell recreates intro and hero but not SEO.
 // Keep one brand and one SEO copy without altering their content or locale keys.
}
function boot(){
 decorate();
 document.addEventListener('nomad360:languagechange',decorate);
}
root.Nomad360FirstHero=Object.freeze({refresh:decorate});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
