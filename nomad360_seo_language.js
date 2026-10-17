(function(root){
'use strict';
const supported=new Set(['en','ru','kk']);
function requested(){
 try{const value=new URL(root.location.href).searchParams.get('lang');return supported.has(value)?value:null;}catch(_){return null;}
}
function writePreference(){
 const language=root.Nomad360UI?.getLanguage?.();
 if(!supported.has(language))return;
 try{const url=new URL(root.location.href);url.searchParams.set('lang',language);root.history.replaceState(root.history.state,'',url.href);}catch(_){}
}
function applyRequested(){const value=requested();if(value&&root.Nomad360UI?.getLanguage?.()!==value)root.Nomad360UI?.setLanguage?.(value);}
function boot(){
 // This module loads after the existing UI module. Its DOMContentLoaded
 // listener runs after UI boot, even when storage is unavailable.
 applyRequested();
 document.addEventListener('nomad360:languagechange',writePreference);
 root.addEventListener('popstate',applyRequested);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
