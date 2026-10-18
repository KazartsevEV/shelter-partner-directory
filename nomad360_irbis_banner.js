/* IRBIS-07 — approved snow-leopard return/support composition.
 * Presentation only: existing localized buttons, payment iframe and handlers remain live. */
(function(root){
'use strict';
if(root.Nomad360IrbisBanner||document.documentElement.hasAttribute('data-nomad-embedded'))return;
const ID='nomad360-irbis-banner',saved=new Map();
const paths={
 windows:'<path d="M2 7 22 4v20H2Zm23-4L47 0v24H25ZM2 27h20v20L2 44Zm23 0h22v23l-22-3Z"/>',
 ios:'<path d="M29 9c3-3 3-7 3-8-4 0-8 3-10 6-2 3-2 6-2 7 3 0 7-2 9-5ZM40 38c-2 4-3 5-5 8-2 2-4 4-7 4s-4-2-8-2-6 2-9 2-5-3-7-6c-10-14-5-28 4-32 4-2 8-2 12 0 3 1 5 1 8 0 4-2 9-2 13 0-9 6-8 18 0 23Z" transform="translate(5 0) scale(.9)"/>',
 android:'<path d="m15 4 4 6M34 4l-4 6" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/><path d="M12 13a12 12 0 0 1 24 0v3H12Zm-3 6h30v18H9ZM3 21a3 3 0 0 1 6 0v12a3 3 0 0 1-6 0Zm36 0a3 3 0 0 1 6 0v12a3 3 0 0 1-6 0ZM15 37h6v8a3 3 0 0 1-6 0Zm12 0h6v8a3 3 0 0 1-6 0Z"/><circle cx="18" cy="12" r="1.2" fill="#173B58"/><circle cx="30" cy="12" r="1.2" fill="#173B58"/>'
};
function remember(){
 const scene=document.getElementById(ID);if(!scene)return;
 scene.querySelectorAll('details[id]').forEach(el=>saved.set(el.id,el.open));
}
function shortcutArt(returnSection){
 returnSection.querySelectorAll('[data-return-platform]').forEach(button=>{
  if(button.querySelector('.nomad-irbis-platform-icon'))return;
  const key=button.dataset.returnPlatform;if(!paths[key])return;
  const label=document.createElement('span');label.className='nomad-irbis-button-label';label.textContent=button.textContent;
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
  icon.classList.add('nomad-irbis-platform-icon');icon.setAttribute('viewBox','0 0 48 50');
  icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');icon.innerHTML=paths[key];
  const arrow=document.createElement('span');arrow.className='nomad-irbis-arrow';
  arrow.setAttribute('aria-hidden','true');arrow.textContent='›';
  button.replaceChildren(icon,label,arrow);
 });
}
function fold(node,id,label){
 if(!node)return;
 const details=document.createElement('details');details.id=id;
 const summary=document.createElement('summary');summary.textContent=label;
 node.before(details);details.append(summary,node);
 if(saved.has(id))details.open=saved.get(id);
}
function methods(contents){
 const fiat=contents.querySelector('.nomad-pay-fiat');
 if(!fiat)return;
 fiat.classList.add('nomad-irbis-methods');
 const crypto=contents.querySelector('.nomad-crypto-panel');
 if(crypto){
  fiat.prepend(crypto);
  const heading=crypto.querySelector('.nomad-crypto-heading h3')?.textContent?.trim()||'';
  fold(crypto,'nomad360-irbis-crypto','NOWPayments · '+heading);
 }
 for(const name of ['kaspi','ozon']){
  const node=fiat.querySelector('.nomad-pay-'+name);
  if(node)fold(node,'nomad360-irbis-'+name,node.querySelector('.nomad-pay-label')?.textContent?.trim()||'');
 }
 const bank=fiat.querySelector('.nomad-pay-bank');
 if(bank){bank.id='nomad360-irbis-bank';if(saved.has(bank.id))bank.open=saved.get(bank.id);}
}
function decorate(){
 const footer=document.getElementById('nomad360-footer');
 const origin=document.getElementById('nomad360-return');
 const support=document.getElementById('nomad360-support');
 const products=document.getElementById('nomad360-product-details');
 if(!footer?.querySelector('.nomad-footer-inner')||!origin||!support||!products||document.getElementById(ID))return;
 const scene=document.createElement('section');scene.id=ID;scene.className='nomad-irbis-banner';
 scene.setAttribute('aria-label','Nomad360');
 origin.before(scene);scene.append(origin,support,products);
 const brand=document.createElement('span');brand.className='nomad-irbis-brand';
 brand.append(document.createTextNode('Nomad360 '));
 const lite=document.createElement('em');lite.textContent='lite';brand.append(lite);
 const dash=document.createElement('span');dash.className='nomad-irbis-dash';dash.setAttribute('aria-hidden','true');
 origin.prepend(brand,dash);shortcutArt(origin);
 const image=document.createElement('div');image.className='nomad-irbis-mobile-art';
 image.setAttribute('aria-hidden','true');origin.append(image);
 const title=support.querySelector(':scope > h2');
 if(title){
  title.id='nomad360-irbis-support-title';
  const contents=document.createElement('div');contents.className='nomad-irbis-contents';
  [...support.childNodes].filter(n=>n!==title).forEach(n=>contents.append(n));
  title.remove();
  const details=document.createElement('details');details.id='nomad360-irbis-support-disclosure';
  const summary=document.createElement('summary');summary.append(title);
  details.append(summary,contents);support.append(details);
  methods(contents);
  if(saved.has(details.id))details.open=saved.get(details.id);
 }
 if(saved.has(products.id))products.open=saved.get(products.id);
}
function boot(){
 decorate();
 for(const type of ['nomad360:languagechange','nomad360:currencychange']){
  document.addEventListener(type,remember,true);
  document.addEventListener(type,decorate);
 }
}
root.Nomad360IrbisBanner=Object.freeze({refresh:decorate});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
