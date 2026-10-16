/* UNIFIED-BANNERS-01: presentation only. Moves live DOM; never reads models/storage. */
(function(root){
'use strict';
if(root.Nomad360Banners)return;
const byId=id=>document.getElementById(id);
const remembered=new Map();
function group(id,nodes,className){
 const present=nodes.filter(Boolean);if(!present.length)return null;
 let box=byId(id);if(!box){box=document.createElement('div');box.id=id;box.className=className;present[0].before(box);}
 for(const node of present)if(node.parentElement!==box)box.append(node);
 return box;
}
function remember(){
 document.querySelectorAll('#nomad360-footer details[id]').forEach(e=>remembered.set(e.id,e.open));
}
function fold(node,id,label){
 if(!node||byId(id))return;
 const details=document.createElement('details'),summary=document.createElement('summary');details.id=id;details.className='nomad-banner-payment';
 summary.textContent=label;node.before(details);details.append(summary,node);
 if(remembered.has(id))details.open=remembered.get(id);
}
function decorate(){
 const hero=byId('nomad360-hero'),seo=byId('nomad360-seo-banner'),intro=byId('nomad360-intro');
 const main=group('nomad360-commercial-banner',[hero,seo,intro],'nomad-banner nomad-banner-hero');
 if(main&&intro&&seo){
  // Retain indexed source, IDs and original SEO copy, within the same composition.
  seo.querySelector('.nomad-seo-copy')?.remove();
  const lead=intro.querySelector('.nomad-intro-lead');if(lead&&lead.tagName!=='H2'){const heading=document.createElement('h2');heading.id='nomad360-seo-heading';heading.className=lead.className;heading.textContent=lead.textContent;lead.replaceWith(heading);}
  seo.prepend(intro);const brand=seo.querySelector('.nomad-seo-brand');if(brand)seo.append(brand);
 }
 const information=byId('nomad360-information'),about=byId('nomad360-about');
 if(information&&about){
  information.classList.add('nomad-banner','nomad-banner-about');
  about.querySelector('.nomad-about-motto')?.remove();
  const flow=about.querySelector('.nomad-about-flow'),caption=about.querySelector('.nomad-about-caption');if(flow&&caption)flow.before(caption);
  const lang=root.Nomad360UI?.getLanguage()||'en',copy=root.Nomad360LocaleCore?.section('interface.header',lang);
  const targets=['nomad360-selling-choice','nomad360-ai','nomad360-factory'];
  if(flow&&copy)for(const [index,item] of [...flow.children].entries()){
   if(item.querySelector('a'))continue;
   const link=document.createElement('a');link.href='#'+targets[index];link.className='nomad-about-card';link.dataset.nomadJump=targets[index];
   const motto=document.createElement('em');motto.className='nomad-about-card-motto';motto.textContent=copy.aboutMotto[[2,0,1][index]].replace(/\.$/,'');link.append(motto);
   while(item.firstChild)link.append(item.firstChild);item.append(link);
  }
 }
 const footer=byId('nomad360-footer'),support=byId('nomad360-support');
 if(footer&&support){
  const scene=group('nomad360-return-support',[byId('nomad360-return'),support,byId('nomad360-product-details')],'nomad-banner nomad-banner-support');
  fold(support.querySelector('.nomad-crypto-panel'),'nomad360-pay-crypto','NOWPayments · '+(support.querySelector('.nomad-crypto-heading h3')?.textContent||''));
  for(const kind of ['kaspi','ozon']){const node=support.querySelector('.nomad-pay-'+kind);fold(node,'nomad360-pay-'+kind,node?.querySelector('.nomad-pay-label')?.textContent||'');}
  const bank=support.querySelector('.nomad-pay-bank');if(bank)bank.id='nomad360-pay-bank';
  for(const details of footer.querySelectorAll('details[id]'))if(remembered.has(details.id))details.open=remembered.get(details.id);
  const legal=group('nomad360-legal-strip',[byId('nomad360-license'),byId('nomad360-data')],'nomad-banner-legal');
  const embed=byId('nomad360-embed');if(legal&&embed)embed.before(legal);
  if(scene)scene.dataset.bannerScene='irbis';
  if(embed){embed.classList.add('nomad-banner','nomad-banner-consulting');embed.querySelector('.nomad-embed-b2b-brand')?.remove();}
 }
 const select=byId('nomad360-lang-select');if(select){const chosen=select.value;for(const lang of ['en','ru','kk']){const option=select.querySelector('option[value="'+lang+'"]');if(option)select.append(option);}select.value=chosen;}
}
function jump(id){
 if(id==='nomad360-selling-choice'&&!byId('home-screen')?.getClientRects().length&&typeof root.showHome==='function')root.showHome();
 const target=byId(id);if(!target)return;
 for(let node=target;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;
 if(!target.hasAttribute('tabindex'))target.tabIndex=-1;
 target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:root.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function boot(){
 decorate();
 for(const event of ['nomad360:languagechange','nomad360:currencychange']){
  // Capture before existing renderers replace the footer; restore after all of them.
  document.addEventListener(event,remember,true);
  document.addEventListener(event,decorate);
 }
 document.addEventListener('click',event=>{
  const a=event.target.closest('a[href^="#"]');if(!a)return;
  const id=a.getAttribute('href').slice(1);
  if(['nomad360-ai','nomad360-factory','nomad360-license','nomad360-data','nomad360-selling-choice'].includes(id)&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.shiftKey){
   // One focus transition: native hash focus + a later RAF could steal focus
   // back after a fast keyboard user had already moved to the next card.
   event.preventDefault();if(root.location.hash!=='#'+id)root.history.pushState(root.history.state,'','#'+id);jump(id);
  }
 });
 root.addEventListener('hashchange',()=>jump(root.location.hash.slice(1)));
 if(root.location.hash)root.requestAnimationFrame(()=>jump(root.location.hash.slice(1)));
}
root.Nomad360Banners=Object.freeze({refresh:decorate});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
