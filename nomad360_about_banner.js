/* ABOUT-01: approved visual arrangement of EXISTING translated header data.
 * Source art stays byte-for-byte in docs/approved-design/unified-banners/.
 * No invented copy, independent locale dictionary, copied contact values,
 * payment changes, or modification to existing calculator interactions. */
(function(root){
'use strict';
const destinations=['nomad360-selling-choice','nomad360-ai','nomad360-factory'];
const logos=[
 '<path d="M4 12l17-8-5 17-4.8-6-3.5 3-.3-5 9.6-7-11.8 6z" stroke-linejoin="round"/>',
 '<path d="M12 3a9 9 0 0 0-8 13l-1 5 5-2a9 9 0 1 0 4-16z"/><path d="M9 8c-2 2 4 8 7 7l1.5-2-3-2-1.5 2c-1.5-.5-2.5-1.5-3-3l1.5-1.5-2.5-2z"/>',
 '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M4 8l8 6 8-6"/>',
 '<circle cx="12" cy="12" r="9"/><path d="M16 9c-1-2-5-3-7-.5-2 3-.7 7 2.5 8 4 1 6.5-5 2-7-3.2-1.2-5 3-1.7 3.8 1.9.5 3-.3 3-2"/>'
];
function icon(i){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.classList.add('nomad-about-contact-icon');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');
 svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');
 svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
 svg.setAttribute('aria-hidden','true');svg.innerHTML=logos[i]||logos[2];
 return svg;
}
function decorate(){
 const about=document.getElementById('nomad360-about');
 const contacts=document.getElementById('nomad360-contacts');
 if(!about||!contacts)return;
 const flow=about.querySelector('.nomad-about-flow'),
  caption=about.querySelector('.nomad-about-caption'),
  motto=about.querySelector('.nomad-about-motto');
 if(!flow||!caption||!motto)return;
 // Keep the real translated heading and introductory copy together inside
 // the scenic area. On phones this reserves the artwork height, so the
 // orange-rule caption can follow BELOW the photograph on solid navy.
 const heading=about.querySelector(':scope > h2');
 const opening=about.querySelector(':scope > .nomad-about-opening');
 // Present the EXISTING Russian sentence as three deliberate rows on phones.
 // Do not edit the localization source or its characters; the rows join back
 // to the same original string, and remain inline on tablet/desktop.
 const brand=opening?.querySelector('.nomad-about-brand');
 const ruRows=['Nomad 360 - зонтичный бренд',
  'интеллектуальных сервисов','для предпринимателей.'];
 if(document.documentElement.lang==='ru'&&brand
    &&!opening.querySelector('.nomad-about-brand-ru-mobile')
    &&brand.textContent===ruRows.join(' ')){
  // The original paragraph remains byte-for-byte and visually unchanged on
  // desktop. This alternative is display:none except for RU phones.
  const mobile=document.createElement('p');
  mobile.className='nomad-about-brand-ru-mobile';
  for(const line of ruRows){
   const row=document.createElement('span');
   row.className='nomad-about-brand-row';
   row.textContent=line;
   mobile.append(row);
  }
  brand.after(mobile);
 }
 let scenic=about.querySelector(':scope > .nomad-about-scene-copy');
 if(heading&&opening&&!scenic){
  scenic=document.createElement('div');
  scenic.className='nomad-about-scene-copy';
  heading.before(scenic);
  scenic.append(heading,opening);
 }
 // Reuse the ORIGINAL localized paragraph, but place it strictly between
 // the service cards and contacts. The separate band gives it equal space
 // above and below, with no reserved caption slot in the photo on phones.
 let captionBand=about.querySelector(':scope > .nomad-about-caption-band');
 if(!captionBand){
  captionBand=document.createElement('div');
  captionBand.className='nomad-about-caption-band';
 }
 flow.after(captionBand);
 captionBand.append(caption);
 const mottos=Array.from(motto.querySelectorAll('span')).map(el=>el.textContent);
 const order=[2,0,1];
 Array.from(flow.children).forEach((li,i)=>{
  let anchor=li.querySelector('.nomad-about-card');
  if(!anchor){
   anchor=document.createElement('a');
   anchor.className='nomad-about-card';
   anchor.href='#'+destinations[i];
   anchor.setAttribute('data-nomad-about-target',destinations[i]);
   while(li.firstChild)anchor.append(li.firstChild);
   li.append(anchor);
  }
  let label=anchor.querySelector('.nomad-about-card-motto');
  if(!label){label=document.createElement('em');label.className='nomad-about-card-motto';anchor.prepend(label);}
  label.textContent=mottos[order[i]]||'';
 });
 contacts.querySelectorAll('.nomad-links a').forEach((a,i)=>{
  if(!a.querySelector('.nomad-about-contact-icon'))a.prepend(icon(i));
 });
}
/* Mirror documentElement.clientWidth, not 100vw: classic scrollbars
 * otherwise overrun the viewport by their gutter on desktop. */
function syncAboutViewport(){
 const width=document.documentElement.clientWidth;
 if(width>0)document.documentElement.style.setProperty('--nomad-about-viewport-width',width+'px');
}
function boot(){
 syncAboutViewport();
 root.addEventListener('resize',syncAboutViewport);
 if(typeof ResizeObserver==='function'){
  new ResizeObserver(syncAboutViewport).observe(document.documentElement);
 }
 decorate();
 // Header module recreates its entire localized About DOM before our handler.
 document.addEventListener('nomad360:languagechange',decorate);
 document.addEventListener('click',event=>{
  const link=event.target.closest('[data-nomad-about-target]');
  if(!link)return;
  const target=document.getElementById(link.dataset.nomadAboutTarget);
  if(!target)return; // Default hash navigation remains available.
  for(let n=target;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})(window);
