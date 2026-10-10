/* Optional Nomad360 visitor counter. Works only with the published server-side
   endpoint; GitHub Pages alone cannot read visitor IPs or count unique sessions.
   No financial inputs, form values, page query, or client IP are transmitted. */
(function(root){
 'use strict';
 const endpoint=typeof root.NOMAD360_TRAFFIC_ENDPOINT==='string'
   ?root.NOMAD360_TRAFFIC_ENDPOINT.trim():'';
 const copy={
   ru:{labels:{today:'Сегодня',last24h:'24 часа',last7d:'7 дней'},ips:'IP всего',newIps:'Новых IP',sessions:'Сессий'},
   en:{labels:{today:'Today',last24h:'24 hours',last7d:'7 days'},ips:'Unique IPs',newIps:'New IPs',sessions:'Sessions'},
   kk:{labels:{today:'Бүгін',last24h:'24 сағат',last7d:'7 күн'},ips:'Барлық IP',newIps:'Жаңа IP',sessions:'Сессиялар'}
 };
 let stats=null,requestStarted=false;
 function sessionToken(){
   try{
     const key='nomad360-traffic-session-v1';
     const now=Date.now();
     const saved=JSON.parse(root.sessionStorage.getItem(key)||'null');
     if(saved&&typeof saved.id==='string'&&/^[0-9a-f-]{36}$/.test(saved.id)
       &&now-saved.last<30*60*1000){
       root.sessionStorage.setItem(key,JSON.stringify({id:saved.id,last:now}));
       return saved.id;
     }
     const id=root.crypto.randomUUID();
     root.sessionStorage.setItem(key,JSON.stringify({id,last:now}));
     return id;
   }catch(_){return root.crypto?.randomUUID?.()||null;}
 }
 function render(footer,language){
   const box=footer?.querySelector('[data-nomad-traffic-grid]');
   const status=footer?.querySelector('[data-nomad-traffic-status]');
   if(!box||!status)return;
   if(stats?.windows){
     const t=copy[language]||copy.ru;
     box.replaceChildren();
     for(const key of ['today','last24h','last7d']){
       const data=stats.windows[key];
       if(!data)continue;
       const article=footer.ownerDocument.createElement('div');
       article.className='nomad-traffic-period';
       const title=footer.ownerDocument.createElement('strong');
       title.textContent=t.labels[key];article.append(title);
       for(const field of ['ips','newIps','sessions']){
         const line=footer.ownerDocument.createElement('div');
         line.className='nomad-traffic-line';
         const label=footer.ownerDocument.createElement('span');
         label.textContent=t[field];
         const value=footer.ownerDocument.createElement('b');
         value.textContent=Number.isSafeInteger(data[field])&&data[field]>=0
           ?data[field].toLocaleString(language==='en'?'en-US':language==='kk'?'kk-KZ':'ru-RU'):'—';
         line.append(label,value);article.append(line);
       }
       box.append(article);
     }
     status.hidden=true;
     box.hidden=false;
   }else{
     box.hidden=true;
     status.hidden=false;
   }
   if(endpoint&&!requestStarted){
     // Counting original GitHub Pages visitors, not copies of the exported calculator.
     // An embedded copy on an unrelated origin does not transmit traffic.
     if(root.location.hostname!=='kazartsevev.github.io')return;
     requestStarted=true;
     const id=sessionToken();
     if(!id)return;
     root.fetch(endpoint.replace(/\/$/,'')+'/visit',{
       method:'POST',mode:'cors',credentials:'omit',cache:'no-store',
       headers:{'Content-Type':'application/json'},
       body:JSON.stringify({sessionId:id})
     }).then(r=>{if(!r.ok)throw Error('Traffic API unavailable');return r.json();})
       .then(data=>{
         if(!data||!data.windows)return;
         stats=data;
         render(root.document.getElementById('nomad360-footer'),root.Nomad360UI?.getLanguage?.()||'ru');
       }).catch(()=>{});
   }
 }
 root.Nomad360Traffic={render};
})(typeof window!=='undefined'?window:this);
