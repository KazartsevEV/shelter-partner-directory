/* Public GitHub repository traffic — static, read-only, no browser token,
   visitor tracking or client-side IP collection. GitHub provides 14 days. */
(function(root){
  'use strict';
  const dataUrl='https://kazartsevev.github.io/shelter-partner-directory/nomad360_repo_traffic.json';
  const repositoryUrl='https://github.com/KazartsevEV/shelter-partner-directory';
  const words={
    ru:{labels:['Просмотры · 14 дней','Посетители · 14 дней','Просмотры · 7 дней'],source:'Источник: GitHub · посещения репозитория'},
    en:{labels:['Views · 14 days','Visitors · 14 days','Views · 7 days'],source:'Source: GitHub · repository traffic'},
    kk:{labels:['Қаралым · 14 күн','Келушілер · 14 күн','Қаралым · 7 күн'],source:'Дереккөз: GitHub · репозиторий трафигі'}
  };
  let snapshot=null,loading=false;
  function isValid(data){
    const time=Date.parse(data?.updatedAt||'');
    // GitHub traffic is a moving 14-day window. Do not show stale totals.
    if(data?.status!=='ok'||data?.source!=='github-repository-traffic'||
       data?.repository!=='KazartsevEV/shelter-partner-directory'||
       !Number.isFinite(time)||time>Date.now()+3600000||Date.now()-time>72*3600000)return false;
    return ['views14','visitors14','views7'].every(key=>
      Number.isSafeInteger(data[key])&&data[key]>=0);
  }
  function render(footer,language){
    const grid=footer?.querySelector('[data-nomad-traffic-grid]');
    const status=footer?.querySelector('[data-nomad-traffic-status]');
    if(!grid||!status)return;
    if(snapshot){
      const t=words[language]||words.ru;
      const doc=grid.ownerDocument;
      grid.replaceChildren();
      const values=[snapshot.views14,snapshot.visitors14,snapshot.views7];
      for(let index=0;index<3;index++){
        const card=doc.createElement('div');
        card.className='nomad-traffic-period';
        const amount=doc.createElement('strong');
        amount.className='nomad-traffic-amount';
        amount.textContent=values[index].toLocaleString(language==='en'?'en-US':language==='kk'?'kk-KZ':'ru-RU');
        const label=doc.createElement('span');
        label.textContent=t.labels[index];
        card.append(amount,label);
        grid.append(card);
      }
      const source=doc.createElement('a');
      source.className='nomad-traffic-source';
      source.href=repositoryUrl;
      source.target='_blank';source.rel='noopener noreferrer';
      source.textContent=t.source+' ↗';
      grid.append(source);
      grid.hidden=false;status.hidden=true;
    }else{
      grid.replaceChildren();grid.hidden=true;status.hidden=false;
    }
    if(loading)return;
    loading=true;
    root.fetch(dataUrl,{cache:'no-store',credentials:'omit'})
      .then(response=>{if(!response.ok)throw Error('traffic snapshot unavailable');return response.json();})
      .then(data=>{
        if(!isValid(data))return;
        snapshot=data;
        render(root.document.getElementById('nomad360-footer'),
          root.Nomad360UI?.getLanguage?.()||'ru');
      }).catch(()=>{});
  }
  root.Nomad360Traffic={render};
})(typeof window!=='undefined'?window:this);
