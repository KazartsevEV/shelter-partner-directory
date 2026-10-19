/* Nomad360 Help: on-page search + language links that keep the #anchor. Enhancement only. */
(function(){
  'use strict';
  var box=document.querySelector('[data-help-search]');
  var toc=document.querySelector('.help-toc');
  var langLinks=document.querySelectorAll('.help-lang a');
  function syncLang(){
    for(var i=0;i<langLinks.length;i++){
      var base=langLinks[i].getAttribute('data-base')||langLinks[i].getAttribute('href').split('#')[0];
      langLinks[i].setAttribute('data-base',base);
      langLinks[i].setAttribute('href',base+(location.hash||''));
    }
  }
  syncLang();window.addEventListener('hashchange',syncLang);
  if(!box||!toc)return;
  var input=box.querySelector('input');
  var status=box.querySelector('.help-search-status');
  var items=[].slice.call(toc.querySelectorAll('li')).map(function(li){
    var a=li.querySelector('a');var id=a.getAttribute('href').slice(1);
    var sec=document.getElementById(id);sec=sec&&(sec.closest('section')||sec);
    return {li:li,text:((a.textContent||'')+' '+((sec&&sec.textContent)||'')).toLowerCase(),title:(a.textContent||'').toLowerCase()};
  });
  var fmt={found:box.getAttribute('data-found')||'Found: ',none:box.getAttribute('data-none')||'Nothing found'};
  box.hidden=false;
  function run(){
    var q=input.value.toLowerCase().replace(/\s+/g,' ').trim();
    var words=q?q.split(' '):[];var n=0;
    items.forEach(function(it){
      var ok=words.every(function(w){return it.text.indexOf(w)>-1;});
      it.li.hidden=!ok;if(ok)n++;
    });
    status.textContent=q?(n?fmt.found+n:fmt.none):'';
  }
  input.addEventListener('input',run);
  input.addEventListener('keydown',function(e){
    if(e.key==='Enter'){
      e.preventDefault();
      var first=items.filter(function(it){return !it.li.hidden;})[0];
      if(first){location.hash=first.li.querySelector('a').getAttribute('href');}
    }
  });
})();
