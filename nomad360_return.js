/* RET-07A: browser-only return shortcuts. No financial state, telemetry or SW. */
(function(root){
'use strict';
if(root.Nomad360Return||document.documentElement.hasAttribute('data-nomad-embedded'))return;
const address='https://kazartsevev.github.io/shelter-partner-directory/Marketing_calc.HTML';
const assetBase='https://kazartsevev.github.io/shelter-partner-directory/';
let deferredPrompt=null,installed=false,helpPlatform=null,help=null,statusKey=null;
const lang=()=>root.Nomad360UI?.getLanguage()||document.documentElement.lang||'ru';
const t=key=>root.Nomad360LocaleCore.t('return.'+key,lang());
const esc=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const calculatorUrl=()=>address+'?lang='+(['ru','en','kk'].includes(lang())?lang():'ru');
function metadata(){
 for(const [rel,href] of [['manifest','nomad360.webmanifest'],['apple-touch-icon','nomad360_wolf_open_circle.png']]){
  if(document.querySelector('link[rel="'+rel+'"]'))continue;
  const link=document.createElement('link');link.rel=rel;link.href=assetBase+href;link.setAttribute('data-nomad-return-metadata','');document.head.append(link);
 }
}
function render(){
 const support=document.getElementById('nomad360-support');if(!support)return;
 const node=document.getElementById('nomad360-return')||document.createElement('section');
 node.id='nomad360-return';node.className='nomad-return';node.setAttribute('data-nomad-no-translate','');node.setAttribute('aria-labelledby','nomad360-return-title');
 node.innerHTML='<h2 id="nomad360-return-title">'+esc(t('title'))+'</h2><div class="nomad-return-actions">'+
  ['windows','ios','android'].map(platform=>'<button type="button" class="nomad-return-button" data-return-platform="'+platform+'">'+esc(t(platform))+'</button>').join('')+'</div>'+
  '<p class="nomad-return-note">'+esc(t('noApp'))+'</p><p class="nomad-return-note">'+esc(t('support'))+'</p>'+
  '<p class="nomad-return-status" role="status" aria-live="polite">'+(statusKey?esc(t(statusKey)):'')+'</p>'+
  '<button type="button" class="nomad-return-help" data-return-help'+(statusKey?'':' hidden')+'>'+esc(t('instructions'))+'</button>';
 support.before(node);
 if(help?.open)renderHelp();
}
function setStatus(key){
 statusKey=key;const node=document.querySelector('#nomad360-return .nomad-return-status');if(node)node.textContent=t(key);
 const button=document.querySelector('[data-return-help]');if(button)button.hidden=false;
}
function renderHelp(){
 const focus=help.contains(document.activeElement)?document.activeElement.getAttribute('data-help-control'):null,scroll=help.scrollTop;
 const extra=helpPlatform==='ios'?'<p>'+esc(t('iosWebview'))+'</p>':'';
 help.innerHTML='<div class="nomad-return-dialog-head"><h2 id="nomad360-return-help-title">'+esc(t('helpTitle'))+' · '+({windows:'Windows',ios:'iOS',android:'Android'}[helpPlatform])+'</h2>'+
  '<button type="button" data-return-close data-help-control="close">'+esc(t('close'))+'</button></div><p>'+esc(t(helpPlatform+'Intro'))+'</p><ol>'+
  [1,2,3].map(n=>'<li>'+esc(t(helpPlatform+'Step'+n))+'</li>').join('')+'</ol>'+
  '<section class="nomad-return-usage" aria-labelledby="nomad360-return-usage-title"><h3 id="nomad360-return-usage-title">'+esc(t('useTitle'))+'</h3><p>'+esc(t(helpPlatform+'Use'))+'</p></section>'+
  (helpPlatform==='windows'?'<h3>'+esc(t('windowsFallbackTitle'))+'</h3><p>'+esc(t('windowsFallback'))+'</p>':'')+extra+
  '<label for="nomad360-return-address">'+esc(t('address'))+'</label><input id="nomad360-return-address" readonly data-help-control="address" value="'+esc(calculatorUrl())+'">'+
  '<button type="button" data-return-copy data-help-control="copy">'+esc(t('copy'))+'</button><p class="nomad-return-copy-status" role="status" aria-live="polite"></p>';
 help.scrollTop=scroll;if(focus)help.querySelector('[data-help-control="'+focus+'"]')?.focus({preventScroll:true});
}
function openHelp(platform){
 if(!['windows','ios','android'].includes(platform))return;
 helpPlatform=platform;
 if(!help){
  help=document.createElement('dialog');help.id='nomad360-return-help';help.className='nomad-return-dialog';help.setAttribute('data-nomad-no-translate','');help.setAttribute('aria-labelledby','nomad360-return-help-title');help.setAttribute('aria-modal','true');document.body.append(help);
  help.addEventListener('close',()=>document.querySelector('[data-return-platform="'+helpPlatform+'"]')?.focus({preventScroll:true}));
  help.addEventListener('keydown',event=>{
   if(event.key!=='Tab')return;
   const controls=[...help.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')].filter(e=>e.getClientRects().length);
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  });
 }
 renderHelp();if(!help.open)help.showModal();help.querySelector('[data-return-close]').focus();
}
function windowsDownload(){
 // A plain Internet Shortcut contains only the known HTTPS URL and no commands.
 try{
  const blob=new Blob(['[InternetShortcut]\r\nURL='+calculatorUrl()+'\r\n'],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='Nomad360-lite.url';document.body.append(a);a.click();a.remove();root.setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch(error){root.console?.info?.('Nomad360: use the manual shortcut instructions.');}
 openHelp('windows');
}
async function androidInstall(){
 if(!/Android/i.test(root.navigator.userAgent)||!deferredPrompt||installed){openHelp('android');return;}
 const event=deferredPrompt;deferredPrompt=null;
 try{
  // prompt() runs directly from the user's click; a result is not an install event.
  await event.prompt();const choice=await event.userChoice;setStatus(installed?'installed':choice?.outcome==='accepted'?'accepted':'dismissed');
 }catch(error){openHelp('android');}
}
async function copyAddress(){
 try{await root.navigator.clipboard.writeText(calculatorUrl());help.querySelector('.nomad-return-copy-status').textContent=t('copied');}
 catch(error){const input=help.querySelector('#nomad360-return-address');input.focus();input.select();help.querySelector('.nomad-return-copy-status').textContent=t('copyFallback');}
}
function boot(){
 metadata();render();
 document.addEventListener('click',event=>{
  const action=event.target.closest('[data-return-platform]');if(action){const platform=action.getAttribute('data-return-platform');if(platform==='windows')windowsDownload();else if(platform==='ios')openHelp('ios');else if(platform==='android')androidInstall();return;}
  if(event.target.closest('[data-return-close]')){help?.close();return;}
  if(event.target.closest('[data-return-copy]')){copyAddress();return;}
  if(event.target.closest('[data-return-help]'))openHelp('android');
 });
 document.addEventListener('nomad360:languagechange',render);
 document.addEventListener('nomad360:currencychange',render);
}
root.addEventListener('beforeinstallprompt',event=>{if(typeof event.prompt==='function'){event.preventDefault();deferredPrompt=event;}});
root.addEventListener('appinstalled',()=>{installed=true;deferredPrompt=null;setStatus('installed');});
root.Nomad360Return=Object.freeze({openHelp});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
