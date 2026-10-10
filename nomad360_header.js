/* Nomad360 header & information navigation. Presentation only.
   No financial-engine access or persistence changes. */
(function (root) {
  'use strict';
  const COPY = {
    ru: {
      nav: ['Калькулятор','AI-маркетолог','Контент-фабрика','О проекте','Контакты'],
      support:'Поддержать',license:'Лицензия',data:'Данные',menu:'Открыть меню',close:'Закрыть меню',
      about:'О проекте',goal:'Цель проекта',
      mission:'Освободить личное время от рутины с помощью автоматизации процессов, чтобы это время работало на главное.',
      project:'Nomad360 — проект по развитию сервисов для предпринимателей и бизнеса. Инструменты для принятия управленческих решений на основе ясной картины инвестиционного ландшафта и бизнес-климата здесь и сейчас. Сегодня работает бизнес-калькулятор.',
      ai:'Исследует рынок и целевую аудиторию, формирует и проверяет маркетинговые гипотезы, готовит рекламные материалы, планирует кампании и анализирует результаты.',
      factory:'Автоматизирует производство цифрового контента: обработку и оформление материалов, контроль качества, подготовку публикаций и учёт себестоимости.',
      development:'В разработке',contact:'Контакты',
      dataTitle:'Данные и конфиденциальность',
      dataCopy:'Расчёты выполняются в браузере. Финансовые данные остаются на вашем устройстве, черновики сохраняются в хранилище браузера, PDF формируется средствами браузера. Для удаления сохранённых данных очистите данные сайта. При загрузке используются Tailwind CDN и Google Fonts: они получают технические данные запроса, включая IP-адрес и сведения о браузере. Финансовые данные расчётов им не передаются.',
      licenseTitle:'Лицензия и использование',
      licenseCopy:'Использование, копирование, изменение и встраивание калькулятора разрешены при сохранении названия калькулятора и ссылки на оригинал согласно действующей лицензии.',
      licenseLink:'Читать лицензию'
    },
    en: {
      nav:['Calculator','AI Marketer','Content Factory','About','Contacts'],
      support:'Support',license:'License',data:'Data',menu:'Open menu',close:'Close menu',
      about:'About Nomad360',goal:'Project objective',
      mission:'Free up personal time for what matters by automating routine processes.',
      project:'Nomad360 develops services for entrepreneurs and businesses. Tools for management decisions based on a clear view of the investment landscape and business climate here and now. The business calculator is available today.',
      ai:'Researches markets and target audiences, develops and tests marketing hypotheses, prepares campaign materials, plans campaigns and evaluates results.',
      factory:'Automates digital content production, editing and formatting, quality control, publication preparation and cost tracking.',
      development:'In development',contact:'Contacts',
      dataTitle:'Data and privacy',
      dataCopy:'Calculations run in your browser. Financial data stays on your device; drafts are saved in browser storage and PDFs are created by the browser. Clear site data to remove saved calculations. The page loads Tailwind CDN and Google Fonts, which receive technical request data including IP address and browser information. Your financial calculations are not sent to these providers.',
      licenseTitle:'License and usage',
      licenseCopy:'You may use, copy, modify and embed the calculator while preserving its name and a link to the original under the current license.',
      licenseLink:'Read license'
    },
    kk: {
      nav:['Калькулятор','AI-маркетолог','Контент фабрикасы','Жоба туралы','Байланыс'],
      support:'Қолдау',license:'Лицензия',data:'Деректер',menu:'Мәзірді ашу',close:'Мәзірді жабу',
      about:'Nomad360 жобасы туралы',goal:'Жобаның мақсаты',
      mission:'Күнделікті үдерістерді автоматтандыру арқылы жеке уақытты маңызды істерге босату.',
      project:'Nomad360 кәсіпкерлер мен бизнеске арналған сервистерді дамытады. Мақсат — инвестициялық ахуал мен бизнес ортаның қазіргі жағдайын айқын көрсетіп, басқарушылық шешімдер қабылдауға көмектесу. Қазір бизнес-калькулятор жұмыс істейді.',
      ai:'Нарық пен мақсатты аудиторияны зерттейді, маркетингтік болжамдарды әзірлеп тексереді, жарнама материалдарын дайындайды, науқандарды жоспарлап, нәтижелерін талдайды.',
      factory:'Цифрлық контент өндіруді, өңдеуді, рәсімдеуді, сапаны тексеруді, жариялауға дайындауды және өзіндік құнын есептеуді автоматтандырады.',
      development:'Әзірленуде',contact:'Байланыс',
      dataTitle:'Деректер және құпиялық',
      dataCopy:'Есептеулер браузеріңізде орындалады. Қаржылық деректер құрылғыңызда қалады, нобайлар браузерде сақталады, PDF браузер арқылы жасалады. Сақталған есептерді жою үшін сайт деректерін тазалаңыз. Бетті жүктегенде Tailwind CDN және Google Fonts техникалық сұрау деректерін, соның ішінде IP мекенжайы мен браузер мәліметтерін алады. Қаржылық есеп деректері оларға берілмейді.',
      licenseTitle:'Лицензия және пайдалану',
      licenseCopy:'Қолданыстағы лицензия бойынша калькуляторды пайдалану, көшіру, өзгерту және енгізу кезінде оның атауын және түпнұсқаға сілтемені сақтау қажет.',
      licenseLink:'Лицензияны оқу'
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
      '</section>'+
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
      // Own RU/EN/KK dictionary renders this block; core locale observer skips it.
      sections.setAttribute('data-nomad-no-translate','');
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
      header.setAttribute('data-nomad-no-translate','');
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
