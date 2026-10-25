/* Local preview adapter only. Never loaded by the public calculator. */
(function(root){
'use strict';
if(!document.documentElement.hasAttribute('data-nomad-release-preview'))throw Error('Preview document required');
const MODEL=root.Nomad360PartnerPreviewModel,COPY=root.Nomad360PartnerPreviewCopy;
let state=MODEL.initial(),mode='accepted',sending=false;
const language=()=>document.documentElement.lang;
function advance(event){state=MODEL.advance(state,event);render();}
// The existing form uses this fixture instead of its real Formspree transport.
// CSP also denies network connections and form navigation. No payload is retained.
root.Nomad360PartnerTransport=Object.freeze({
 supportedEndpoint:value=>typeof value==='string'&&/^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(value),
 async send(_endpoint,payload){
  if(sending||state.phase!=='idle')return {ok:false,error:'failure'};
  sending=true;
  try{
   await new Promise(resolve=>root.setTimeout(resolve,80));
   if(mode!=='accepted')return {ok:false,error:({rate:'tooMany',rejected:'rejected',failure:'failure'})[mode]||'failure'};
   advance({type:'applicationAccepted',accepted:true,hasWebsite:!!payload.website});
   return {ok:true};
  }finally{sending=false;}
 }
});
function render(){
 const t=COPY[language()];
 document.title=t.title;
 for(const node of document.querySelectorAll('[data-preview-copy]'))node.textContent=t[node.dataset.previewCopy];
 const status=document.getElementById('preview-status');status.textContent=t[state.phase];status.dataset.phase=state.phase;
 const site=document.getElementById('preview-site');site.hidden=state.phase==='idle';site.textContent=t[state.hasWebsite?'withSite':'withoutSite'];
 const actions=document.getElementById('preview-actions');actions.replaceChildren();
 for(const type of Object.keys(MODEL.transitions[state.phase]||{})){
  const button=document.createElement('button');button.type='button';button.dataset.previewEvent=type;button.textContent=t[type];
  button.addEventListener('click',()=>advance({type,accepted:true}));actions.append(button);
 }
 const list=document.getElementById('preview-help');list.replaceChildren();
 for(const text of t.help){const item=document.createElement('li');item.textContent=text;list.append(item);}
}
function boot(){
 const select=document.getElementById('preview-language');select.value=language();select.addEventListener('change',()=>{
  document.documentElement.lang=select.value;render();document.dispatchEvent(new Event('nomad360:languagechange'));
 });
 document.getElementById('preview-response').addEventListener('change',event=>{mode=event.target.value;});
 document.getElementById('preview-reset').addEventListener('click',()=>root.location.reload());
 // Show the target success text only in the isolated preview, after actual
 // fixture acceptance. The public form's copy and submit handler stay intact.
 const status=new MutationObserver(()=>{
  const node=document.getElementById('nomad360-partner-status');
  if(node&&state.phase==='applicationAccepted'&&node.textContent!==COPY[language()].applicationAccepted)
   node.textContent=COPY[language()].applicationAccepted;
 });
 status.observe(document.body,{subtree:true,childList:true,characterData:true});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
