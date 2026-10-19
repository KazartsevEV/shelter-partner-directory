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
 const text=heading.textContent||'',lang=root.Nomad360UI?.getLanguage()||document.documentElement.lang;
 // Keep the original localized sentence and desktop wrapping unchanged.
 // On phones, reserve the complete final phrase for line three in EN and KK.
 const ending=lang==='en'?'for me?':lang==='kk'?'айналысқан тиімді?':'';
 const endAt=ending?text.lastIndexOf(ending):-1;
 function appendAccent(parent,part){
  const match=part.match(/мне выгодно|most profitable|тиімді/i);
  if(!match){parent.append(document.createTextNode(part));return;}
  const span=document.createElement('span');
  span.className='nomad-hero-title-accent';span.textContent=match[0];
  parent.append(document.createTextNode(part.slice(0,match.index)),span,
   document.createTextNode(part.slice(match.index+match[0].length)));
 }
 const fragment=document.createDocumentFragment();
 if(endAt>=0){
  appendAccent(fragment,text.slice(0,endAt));
  const last=document.createElement('span');
  last.className='nomad-hero-title-mobile-final';
  appendAccent(last,text.slice(endAt));
  fragment.append(last);
 }else appendAccent(fragment,text);
 heading.replaceChildren(fragment);
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
/* All content comes from the existing translated lead. Spans and responsive
   breaks are presentation-only; textContent is unchanged for SEO/assistive tech. */
function formatLead(intro){
 const lead=intro.querySelector('.nomad-intro-lead');if(!lead)return;
 const full=lead.textContent||'',lang=root.Nomad360UI?.getLanguage()||document.documentElement.lang;
 const positions=[];
 if(lang==='ru')for(const [word,mode] of [
  ['дружелюбный','mobile'],['инструмент','desktop'],
  ['проверки','mobile'],['ценности','mobile']
 ]){
  const index=full.indexOf(word);
  if(index>=0)positions.push({at:index+word.length,mode});
 }
 positions.sort((a,b)=>a.at-b.at);
 const fragment=document.createDocumentFragment();
 function appendFormatted(value){
  const tokens=/(Nomad360 lite|коммерческой ценности|commercial validation|коммерциялық құндылығын)/gi;
  let last=0;
  for(const match of value.matchAll(tokens)){
   if(match.index>last)fragment.append(document.createTextNode(value.slice(last,match.index)));
   const el=document.createElement(match[0].toLowerCase()==='nomad360 lite'?'strong':'span');
   if(el.tagName==='SPAN')el.className='nomad-intro-accent';
   el.textContent=match[0];fragment.append(el);last=match.index+match[0].length;
  }
  if(last<value.length)fragment.append(document.createTextNode(value.slice(last)));
 }
 let start=0;
 for(const marker of positions){
  appendFormatted(full.slice(start,marker.at));
  const br=document.createElement('br');br.className='hero-break-'+marker.mode;
  fragment.append(br);start=marker.at;
 }
 appendFormatted(full.slice(start));
 lead.replaceChildren(fragment);
}
/* Only the CTA moves visually. Equalize the space from the translated
   narrative's bottom to the benefit section's top at every desktop width.
   Since this is a transform it never moves the approved imagery, text, benefit
   panel or sizing; recompute when viewport, fonts or locale change. */
let ctaAlignmentQueued=false;
function alignHeroCta(){
 if(ctaAlignmentQueued)return;
 ctaAlignmentQueued=true;
 root.requestAnimationFrame(()=>{
  ctaAlignmentQueued=false;
  const cta=id('nomad360-hero')?.querySelector('.nomad-intro-cta');
  const narrative=id('nomad360-hero')?.querySelector('h3');
  const below=id('nomad360-hero-summary');
  if(!cta||!narrative||!below)return;
  if(root.innerWidth<=1020){
   cta.style.removeProperty('--nomad-hero-cta-offset');
   return;
  }
  const current=parseFloat(cta.style.getPropertyValue('--nomad-hero-cta-offset'))||0;
  const upper=narrative.getBoundingClientRect().bottom;
  const lower=below.getBoundingClientRect().top;
  const rectangle=cta.getBoundingClientRect();
  const nativeTop=rectangle.top-current;
  const centeredTop=(upper+lower-rectangle.height)/2;
  const offset=Math.max(0,Math.min(220,centeredTop-nativeTop));
  const value=offset.toFixed(1)+'px';
  if(cta.style.getPropertyValue('--nomad-hero-cta-offset')!==value)
   cta.style.setProperty('--nomad-hero-cta-offset',value);
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
 emphasizeTitle(hero);decorateBenefits(intro);formatLead(intro);
 alignHeroCta();
 // SEO-07's former second headline/copy are intentionally NOT reproduced:
 // the approved first hero and its benefits are the only visible sales offer.
 // Existing page metadata and all existing translated hero/benefits survive.
}
function boot(){
 decorate();
 document.addEventListener('nomad360:languagechange',decorate);
 // Dynamic currency refreshes must not duplicate sections or logos.
 document.addEventListener('nomad360:currencychange',decorate);
 root.addEventListener('resize',alignHeroCta);
 if(typeof root.ResizeObserver==='function'){
  const observer=new root.ResizeObserver(alignHeroCta);
  const hero=id('nomad360-hero'),summary=id('nomad360-hero-summary');
  if(hero)observer.observe(hero);
  if(summary)observer.observe(summary);
 }
 if(document.fonts?.ready)document.fonts.ready.then(alignHeroCta);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
