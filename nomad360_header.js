/* Nomad360 header & information navigation. Presentation only.
   No financial-engine access or persistence changes. */
(function (root) {
  'use strict';
  const COPY = {
    ru: {
      nav: ['Калькулятор','AI-маркетолог','Контент-фабрика','О проекте','Контакты'],
      support:'Поддержать',license:'Лицензия',data:'Данные',menu:'Открыть меню',close:'Закрыть меню',
      brand:'Nomad360',goal:'Цель проекта',about:'О проекте',
      mission:'Освобождение личного времени от рутины путём автоматизации процессов — для того, что действительно важно.',
      project:'Nomad360 — амбициозный проект по развитию сервисов для предпринимателей и бизнеса. Цель — дать ясную картину инвестиционного ландшафта и бизнес-климата здесь и сейчас для принятия управленческих решений.',
      calculator:'Калькулятор — гибкая бизнес-модель. За 20 минут при наличии исходных данных помогает разобраться, из чего состоит бизнес и чем и как выгодно заниматься. Для ведения бизнеса рекомендуем достроить модель под себя.',
      ai:'Анализ рынка и аудитории, планирование маркетинга, подготовка материалов и оценка результатов.',
      factory:'Производство цифрового контента, обработка, оформление, контроль качества и подготовка к публикации.',
      development:'В разработке',contact:'Контакты разработчика',dataTitle:'Данные и конфиденциальность',
      dataCopy:'Расчёты выполняются в браузере. Черновики сохраняются на этом устройстве. PDF формируется средствами браузера.',
      licenseTitle:'Условия использования',licenseCopy:'Копирование, изменение и встраивание калькулятора регулируются лицензией. Атрибуция автора и ссылка на оригинал обязательны.',licenseLink:'Читать лицензию'
    },
    en: {
      nav:['Calculator','AI Marketer','Content Factory','About','Contacts'],
      support:'Support',license:'License',data:'Data',menu:'Open menu',close:'Close menu',
      brand:'Nomad360',goal:'Project objective',about:'About Nomad360',
      mission:'Free up personal time through workflow automation — for what matters most.',
      project:'Nomad360 is an ambitious project developing services for entrepreneurs and businesses. Its goal is to provide a clear, up-to-date picture of the investment landscape and business climate for management decisions.',
      calculator:'The calculator is a flexible business model. With source data ready, an initial 20-minute calculation shows how a business works and which activities can be profitable. Adapt the model to your own business operations.',
      ai:'Market and audience research, marketing planning, campaign materials and performance analysis.',
      factory:'Digital content production, processing, formatting, quality control and publication preparation.',
      development:'In development',contact:'Developer contacts',dataTitle:'Data and privacy',
      dataCopy:'Calculations run in your browser. Drafts remain on this device. Your browser creates the PDF.',
      licenseTitle:'Terms of use',licenseCopy:'The calculator license governs reuse, modification and embedding. Author attribution and the original source link are required.',licenseLink:'Read license'
    },
    kk: {
      nav:['Калькулятор','AI-маркетолог','Контент фабрикасы','Жоба туралы','Байланыс'],
      support:'Қолдау',license:'Лицензия',data:'Деректер',menu:'Мәзірді ашу',close:'Мәзірді жабу',
      brand:'Nomad360',goal:'Жобаның мақсаты',about:'Nomad360 жобасы туралы',
      mission:'Күнделікті үдерістерді автоматтандыру арқылы адамның уақытын маңызды істерге босату.',
      project:'Nomad360 — кәсіпкерлер мен бизнеске арналған сервистерді дамытуға бағытталған ауқымды жоба. Мақсат — басқарушылық шешімдер үшін инвестициялық ахуал мен бизнес ортаның қазіргі жағдайын айқын көрсету.',
      calculator:'Калькулятор — икемді бизнес-модель. Бастапқы деректер дайын болса, 20 минут ішінде бизнестің құрылымын және қай бағыттың тиімді болуы мүмкін екенін бағалауға көмектеседі. Модельді өз бизнесіңіздің ерекшеліктеріне бейімдеңіз.',
      ai:'Нарық пен аудиторияны зерттеу, маркетингті жоспарлау, материалдар дайындау және нәтижені талдау.',
      factory:'Цифрлық контент өндіру, өңдеу, рәсімдеу, сапасын тексеру және жариялауға дайындау.',
      development:'Әзірленуде',contact:'Әзірлеушімен байланыс',dataTitle:'Деректер және құпиялық',
      dataCopy:'Есептеулер браузеріңізде орындалады. Сақталған нобайлар осы құрылғыда қалады. PDF браузер арқылы жасалады.',
      licenseTitle:'Пайдалану шарттары',licenseCopy:'Калькуляторды көшіру, өзгерту және ендіру лицензиямен реттеледі. Авторды көрсету және түпнұсқаға сілтеме беру міндетті.',licenseLink:'Лицензияны оқу'
    }
  };
  const TARGETS = ['home-screen','nomad360-ai','nomad360-factory','nomad360-about','nomad360-contacts'];
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function language() {
    const lang=root.Nomad360UI && root.Nomad360UI.getLanguage && root.Nomad360UI.getLanguage();
    return COPY[lang] ? lang : 'ru';
  }
  function infoMarkup(t) {
    return '<section id="nomad360-about" class="nomad-info-block" tabindex="-1">'+
      '<h2>'+esc(t.about)+'</h2><h3>'+esc(t.goal)+'</h3><p>'+esc(t.mission)+'</p><p>'+esc(t.project)+'</p>'+
      '<p>'+esc(t.calculator)+'</p></section>'+
      '<section id="nomad360-ai" class="nomad-info-block" tabindex="-1">'+
      '<h2>'+esc(t.nav[1])+'</h2><span class="nomad-status">'+esc(t.development)+'</span><p>'+esc(t.ai)+'</p></section>'+
      '<section id="nomad360-factory" class="nomad-info-block" tabindex="-1">'+
      '<h2>'+esc(t.nav[2])+'</h2><span class="nomad-status">'+esc(t.development)+'</span><p>'+esc(t.factory)+'</p></section>'+
      '<section id="nomad360-contacts" class="nomad-info-block" tabindex="-1">'+
      '<h2>'+esc(t.contact)+'</h2><div class="nomad-links">'+
      '<a href="https://t.me/Kazartsev_EV" target="_blank" rel="noopener noreferrer">Telegram · @Kazartsev_EV</a>'+
      '<a href="https://wa.me/77771295693" target="_blank" rel="noopener noreferrer">WhatsApp</a>'+
      '<a href="mailto:nomad260393@gmail.com">nomad260393@gmail.com</a>'+
      '<a href="https://www.threads.com/@nomad260393" target="_blank" rel="noopener noreferrer">Threads · @nomad260393</a>'+
      '</div></section>'+
      '<section id="nomad360-data" class="nomad-info-block" tabindex="-1">'+
      '<h2>'+esc(t.dataTitle)+'</h2><p>'+esc(t.dataCopy)+'</p></section>'+
      '<section id="nomad360-license" class="nomad-info-block" tabindex="-1">'+
      '<h2>'+esc(t.licenseTitle)+'</h2><p>'+esc(t.licenseCopy)+'</p>'+
      '<a href="https://github.com/KazartsevEV/shelter-partner-directory/blob/main/CALCULATOR_LICENSE.md" target="_blank" rel="noopener noreferrer">'+esc(t.licenseLink)+' ↗</a></section>';
  }
  function renderInformation() {
    let sections=document.getElementById('nomad360-information');
    if(!sections){
      sections=document.createElement('div');
      sections.id='nomad360-information';
      sections.className='nomad-information';
      const footer=document.getElementById('nomad360-footer');
      if(footer) footer.before(sections); else document.body.append(sections);
    }
    sections.innerHTML=infoMarkup(COPY[language()]);
    const support=document.querySelector('#nomad360-footer .nomad-support');
    if(support) support.id='nomad360-support';
  }
  function renderHeader() {
    const t=COPY[language()];
    let header=document.getElementById('nomad360-header');
    if(!header){
      header=document.createElement('header'); header.id='nomad360-header';header.className='nomad-header';
      document.body.prepend(header);
    }
    const isOpen=header.classList.contains('is-open');
    // Keep the live language select attached while rebuilding the header.
    // Nomad360UI owns this control; re-creating it here would lose locale wiring.
    const chooser=document.getElementById('nomad360-language-chooser');
    header.innerHTML='<div class="nomad-bar">'+
      '<a class="nomad-brand" href="#home-screen" data-nomad-go="home-screen" aria-label="Nomad360">'+
      '<img class="nomad-logo" src="./nomad360_wolf_open_circle.png" alt="" width="44" height="44">'+
      '<span class="nomad-wordmark">Nomad<span>360</span></span></a>'+
      '<div class="nomad-lang" id="nomad360-header-lang"></div>'+
      '<button type="button" class="nomad-burger" aria-label="'+esc(isOpen?t.close:t.menu)+'" aria-controls="nomad360-header-panel" aria-expanded="'+isOpen+'">'+
      '<svg class="i-open" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>'+
      '<svg class="i-close" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>'+
      '</button>'+
      '<div class="nomad-panel" id="nomad360-header-panel">'+
      '<nav class="nomad-nav" aria-label="Nomad360">'+
      t.nav.map((label,i)=>'<a href="#'+TARGETS[i]+'" data-nomad-go="'+TARGETS[i]+'"'+(i===0?' aria-current="page"':'')+'>'+esc(label)+'</a>').join('')+
      '</nav>'+
      '<a class="nomad-cta" href="#nomad360-support" data-nomad-go="nomad360-support">'+esc(t.support)+'</a>'+
      '<div class="nomad-sec"><a href="#nomad360-license" data-nomad-go="nomad360-license">'+esc(t.license)+'</a>'+
      '<a href="#nomad360-data" data-nomad-go="nomad360-data">'+esc(t.data)+'</a></div>'+
      '</div></div>';
    if(chooser) header.querySelector('#nomad360-header-lang').append(chooser);
    header.classList.toggle('is-open',isOpen);
  }
  function closeMenu(refocus) {
    const header=document.getElementById('nomad360-header');
    if(!header)return;
    const wasOpen=header.classList.contains('is-open');
    header.classList.remove('is-open');
    const button=header.querySelector('.nomad-burger');
    if(button){
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-label',COPY[language()].menu);
      if(refocus&&wasOpen)button.focus();
    }
  }
  function boot() {
    renderInformation();renderHeader();
    const header=document.getElementById('nomad360-header');
    header.addEventListener('click',event=>{
      const button=event.target.closest('.nomad-burger');
      if(button){
        const open=!header.classList.contains('is-open');
        header.classList.toggle('is-open',open);
        button.setAttribute('aria-expanded',String(open));
        button.setAttribute('aria-label',COPY[language()][open?'close':'menu']);
        return;
      }
      const a=event.target.closest('[data-nomad-go]');
      if(!a)return;
      const targetId=a.getAttribute('data-nomad-go');
      if(targetId==='home-screen'&&typeof root.showHome==='function')root.showHome();
      closeMenu(false);
      // Keep the navigation interaction functional for every calculator branch.
      root.requestAnimationFrame(()=>{
        const target=document.getElementById(targetId);
        if(target)target.scrollIntoView({block:'start',behavior:'smooth'});
      });
    });
    document.addEventListener('click',event=>{
      if(!header.contains(event.target))closeMenu(false);
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape')closeMenu(true);
    });
    document.addEventListener('nomad360:languagechange',()=>{
      // Nomad360UI rebuilds its select before dispatching languagechange.
      renderInformation();renderHeader();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})(window);
