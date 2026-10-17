/* Read-only public snapshot of 14-day unique GitHub repository visitors.
   Never send the browser a GitHub token or count visits locally. */
(function(root){
  'use strict';
  const dataUrl='./nomad360_repo_traffic.json';
  const retryDelays=[2000,5000,15000,30000,60000];
  let snapshot=null,loading=false,retryTimer=null,failures=0;
  function valid(data){
    const updatedAt=Date.parse(data?.updatedAt||'');
    return data?.status==='ok'&&
      data?.source==='github-repository-traffic'&&
      data?.repository==='KazartsevEV/shelter-partner-directory'&&
      Number.isSafeInteger(data.visitors14)&&data.visitors14>=0&&
      Number.isFinite(updatedAt)&&
      updatedAt<=Date.now()+3600000&&Date.now()-updatedAt<=72*3600000;
  }
  function paint(footer,language){
    const value=footer?.querySelector('[data-nomad-traffic-value]');
    if(!value)return false;
    value.textContent=snapshot&&valid(snapshot)
      ?snapshot.visitors14.toLocaleString(
        language==='en'?'en-US':language==='kk'?'kk-KZ':'ru-RU')
      :'—';
    return true;
  }
  function scheduleRetry(){
    if(retryTimer!==null||root.location?.protocol==='file:')return;
    const delay=retryDelays[Math.min(failures,retryDelays.length-1)];
    failures+=1;
    retryTimer=root.setTimeout(()=>{
      retryTimer=null;
      render(root.document.getElementById('nomad360-footer'),
        root.Nomad360UI?.getLanguage?.()||'ru');
    },delay);
  }
  function render(footer,language){
    if(!paint(footer,language))return;
    if(loading||retryTimer!==null||root.location?.protocol==='file:')return;
    loading=true;
    Promise.resolve().then(()=>root.fetch(dataUrl,{cache:'no-store',credentials:'omit'}))
      .then(response=>{
        if(!response.ok)throw Error('Traffic data unavailable');
        return response.json();
      }).then(data=>{
        if(!valid(data))throw Error('Invalid traffic snapshot');
        snapshot=data;
        failures=0;
        paint(root.document.getElementById('nomad360-footer'),
          root.Nomad360UI?.getLanguage?.()||'ru');
      }).catch(()=>scheduleRetry())
      .finally(()=>{loading=false;});
  }
  root.Nomad360Traffic={render};
})(typeof window!=='undefined'?window:this);
