/* HERO-03 — first approved Codex banner only, no changes to calculator models. */
(function(root){
'use strict';
const id=name=>document.getElementById(name);
const benefitIcons=[
 '<path d="M5 16h30v8H5zM8 24v18h24V24M20 16v26"/><path class="hero-benefit-accent" d="M20 16c-14 0-13-15-5-10 4 3 5 10 5 10Zm0 0C34 16 33 1 25 6c-4 3-5 10-5 10Z"/>',
 '<path d="M3 10h34M3 24h34M3 38h34"/><path class="hero-benefit-accent" d="M15 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM28 19a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 33a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"/>',
 '<rect x="7" y="20" width="26" height="23" rx="3"/><path d="M12 20v-9a8 8 0 0 1 16 0v9"/><path class="hero-benefit-accent" d="M20 28v8"/>'
];
function emphasizeTitle(node){
 const heading=node.querySelector('h2');
 if(!heading)return;
 const text=heading.textContent||'',match=text.match(/мне выгодно|most profitable|тиімді/i);
 if(!match)return;
 const span=document.createElement('span');span.className='nomad-hero-title-accent';span.textContent=match[0];
 heading.replaceChildren(document.createTextNode(text.slice(0,match.index)),span,document.createTextNode(text.slice(match.index+match[0].length)));
}
function decorateBenefits(intro){
 const lead=intro.querySelector('.nomad-intro-lead');
 if(lead&&!lead.querySelector('strong')&&lead.textContent.startsWith('Nomad360 lite')){
  const full=lead.textContent,strong=document.createElement('strong');strong.textContent='Nomad360 lite';
  lead.replaceChildren(strong,document.createTextNode(full.slice('Nomad360 lite'.length)));
 }
 intro.querySelectorAll('li').forEach((li,i)=>{
  if(li.querySelector('.nomad-benefit-icon'))return;
  const full=li.textContent||'',split=full.indexOf(':'),copy=document.createElement('span');
  copy.className='nomad-benefit-copy';
  if(split>=0){
   const strong=document.createElement('strong');strong.textContent=full.slice(0,split+1);
   copy.append(strong,document.createTextNode(full.slice(split+1)));
  }else copy.textContent=full;
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
  icon.setAttribute('viewBox','0 0 40 48');icon.setAttribute('aria-hidden','true');icon.classList.add('nomad-benefit-icon');
  icon.innerHTML=benefitIcons[i]||'';
  li.replaceChildren(icon,copy);
 });
}
function decorate(){
 const home=id('home-screen'),hero=id('nomad360-hero'),intro=id('nomad360-intro'),seo=id('nomad360-seo-banner');
 if(!home||!hero||!intro||!seo)return;
 let banner=id('nomad360-commercial-banner');
 if(!banner){
  banner=document.createElement('section');banner.id='nomad360-commercial-banner';
  banner.className='nomad-marketing nomad-hero-banner';
  hero.before(banner);
 }
 let summary=id('nomad360-hero-summary');
 if(!summary){
  summary=document.createElement('div');summary.id='nomad360-hero-summary';summary.className='nomad-hero-summary';
 }
 banner.append(hero,summary);
 summary.append(intro,seo);
 emphasizeTitle(hero);decorateBenefits(intro);
 // SEO-07's former second headline/copy are intentionally NOT reproduced:
 // the approved first hero and its benefits are the only visible sales offer.
 // Existing page metadata and all existing translated hero/benefits survive.
}
function boot(){
 decorate();
 document.addEventListener('nomad360:languagechange',decorate);
 // Dynamic currency refreshes must not duplicate sections or logos.
 document.addEventListener('nomad360:currencychange',decorate);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
