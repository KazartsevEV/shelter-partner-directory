/* Read-only public snapshot of 14-day unique GitHub repository visitors.
   Never send the browser a GitHub token or count visits locally. */
(function(root){
  'use strict';
  const dataUrl='./nomad360_repo_traffic.json';
  let snapshot=null,loading=false;
  function valid(data){
    const updatedAt=Date.parse(data?.updatedAt||'');
    return data?.status==='ok'&&
      data?.source==='github-repository-traffic'&&
      data?.repository==='KazartsevEV/shelter-partner-directory'&&
      Number.isSafeInteger(data.visitors14)&&data.visitors14>=0&&
      Number.isFinite(updatedAt)&&
      updatedAt<=Date.now()+3600000&&Date.now()-updatedAt<=72*3600000;
  }
  function render(footer,language){
    const value=footer?.querySelector('[data-nomad-traffic-value]');
    if(!value)return;
    if(snapshot){
      value.textContent=snapshot.visitors14.toLocaleString(
        language==='en'?'en-US':language==='kk'?'kk-KZ':'ru-RU');
    }
    if(loading)return;
    loading=true;
    root.fetch(dataUrl,{cache:'no-store',credentials:'omit'})
      .then(response=>{
        if(!response.ok)throw Error('Traffic data unavailable');
        return response.json();
      }).then(data=>{
        if(!valid(data))return;
        snapshot=data;
        render(root.document.getElementById('nomad360-footer'),
          root.Nomad360UI?.getLanguage?.()||'ru');
      }).catch(()=>{});
  }
  root.Nomad360Traffic={render};
})(typeof window!=='undefined'?window:this);
