/* Nomad360 header, information blocks and footer. Presentation only.
   No financial-engine access or persistence changes. */
(function (root) {
  'use strict';
  const PAY = {
    kaspi: '+7 777 129 56 93', kaspiTel: 'tel:+77771295693',
    ozon: '+7 977 986 74 41', ozonTel: 'tel:+79779867441',
    donationWidget: 'https://nowpayments.io/embeds/donation-widget?api_key=47aebf88-76b9-4871-9217-d3f5b46de839',
    bankName: 'Kazartsev Evgenii', bank: 'АО Kaspi Bank',
    swift: 'CASPKZKA', iban: 'KZ53722C000089313796',
    whatsapp: '+7 777 129 56 93', whatsappUrl: 'https://wa.me/77771295693',
    email: 'nomad260393@gmail.com'
  };
  const COPY = {
    ru: {
      nav: ['Калькулятор','AI-маркетолог','Контент-фабрика','О проекте','Контакты'],
      support:'Поддержать',license:'Лицензия',data:'Данные',menu:'Открыть меню',close:'Закрыть меню',
      about:'О проекте',
      aboutLead:'Nomad360 — амбициозный проект по развитию сервисов для предпринимателей и бизнеса.',
      missionLabel:'Миссия',
      mission:'Nomad360 освобождает личное время пользователя от рутины с помощью автоматизации процессов, чтобы это время работало на главное.',
      valueLabel:'Ценность',
      value:'Время, ясная картина экономики своего дела, инструменты для собственных решений.',
      goalsLabel:'Цели',
      goals:['Сократить время на повторяющиеся операции.','Дать инструменты для анализа и управленческих решений.','Повысить самостоятельность предпринимателя в работе с бизнес-данными.'],
      servicesLabel:'Сервисы',
      services:[['Бизнес-калькулятор','Работает'],['AI-маркетолог','В разработке'],['Контент-фабрика','В разработке']],
      development:'В разработке',contact:'Контакты',
      contactTopics:'Вопросы по калькулятору, доработка моделей, сотрудничество, предложения.',
      supportTitle:'Поддержать проект',
      supportLead:'Калькулятор бесплатный. Поддержка добровольная и идёт на развитие калькулятора, AI-маркетолога и контент-фабрики.',
      kaspi:'Kaspi · Казахстан',ozon:'Ozon · Россия',
      cryptoDonate:'Поддержать Nomad360 криптовалютой',
      cryptoDonateHint:'Выберите криптовалюту и сумму.',
      kaspiPhoneHint:'Перевод по номеру телефона для владельцев казахстанских карт',
      bankTransfer:'Реквизиты для международного банковского перевода',
      bankRecipient:'Получатель',bankName:'Банк',
      ozonTransfer:'Поддержать с российской карты',ozonBank:'Озон Банк',

      copy:'Копировать',copied:'Скопировано',qrFor:'QR-код адреса',
      fundsTitle:'На что идёт поддержка',
      products:[
        {id:'nomad360-ai',title:'AI-маркетолог',
         lead:'Интеллектуальная система управления маркетингом. Сокращает расходы бизнеса на рекламу и работу маркетолога.',
         items:[['Исследует','рынок и аудиторию'],['Планирует','гипотезы и кампании'],['Создаёт','рекламные материалы'],['Анализирует','результаты кампаний'],
           ['Считает','бюджеты и эффективность расходов под цель: рост продаж, узнаваемость бренда или разовая кампания'],
           ['Автоматизирует','рутину: кампании готовятся быстрее, управление маркетингом становится прозрачным и измеримым']],
         goal:'Цель: сократить затраты и время на управление маркетингом. Контроль над каждым решением и рекламным бюджетом остаётся у вас.',
         slogan:'Платите за то, что покупаете.'},
        {id:'nomad360-factory',title:'Контент-фабрика',
         lead:'Автоматизированная система производства цифровых товаров для маркетплейсов.',
         items:[['Исследует','Краулер собирает данные об ассортименте, спросе и конкуренции'],
           ['Выбирает','Аналитика находит перспективные ниши и определяет, какие товары выпускать'],
           ['Производит','Фабрика создаёт цифровые товары, оформляет карточки и обложки, проверяет качество'],
           ['Публикует','Товары проходят модерацию и выходят на маркетплейс'],
           ['Отслеживает','просмотры, скачивания и продажи'],
           ['Корректирует','По рыночным сигналам меняет ассортимент, производственный план и стратегию развития']],
         goal:'',slogan:'Покупайте то, что продается.'}
      ],
      dataTitle:'Данные и конфиденциальность',
      dataCopy:'Расчёты выполняются в браузере. Финансовые данные остаются на вашем устройстве, черновики сохраняются в хранилище браузера, PDF формируется средствами браузера. Для удаления сохранённых данных очистите данные сайта. При загрузке используются Tailwind CDN и Google Fonts: они получают технические данные запроса, включая IP-адрес и сведения о браузере. Финансовые данные расчётов им не передаются. При отображении формы пожертвования NOWPayments получает технические данные браузера; введённые в форму платёжные сведения обрабатывает NOWPayments.',
      licenseTitle:'Лицензия и использование',
      licenseCopy:'Использование, копирование, изменение и встраивание калькулятора разрешены при сохранении названия калькулятора и ссылки на оригинал согласно действующей лицензии.',
      licenseLink:'Читать лицензию',
      embedTitle:'Калькулятор для вашего сайта',
      embedB2BTitle:'Работаете в B2B? Привлеките полезный трафик бесплатно.',
      trafficTitle:'За последние 14 дней уникальных посетителей:',
      embedButton:'Встроить калькулятор на мой сайт',
      embedHint:'Подсказка: опубликуйте код в редакторе сайта как кастомный блок. Автоматическое обновление не поддерживается. Требуется поддержка JavaScript.',
      customButton:'Заказать кастомную разработку',
      embedWorking:'Подготавливаем HTML…',embedReady:'HTML готов к скачиванию',
      embedRetryLead:'Если загрузка не началась,',embedRetryAction:'нажмите здесь',
      embedError:'Не удалось собрать HTML. Проверьте подключение и попробуйте ещё раз.',
      officialTitle:'Официальный контакт',officialCopy:'Почта проекта для вопросов, сотрудничества и обращений по лицензии.',
      unitNote:'* у.е. — деньги в вашей валюте.',rights:'© 2026 Nomad360'
    },
    en: {
      nav:['Calculator','AI Marketer','Content Factory','About','Contacts'],
      support:'Support',license:'License',data:'Data',menu:'Open menu',close:'Close menu',
      about:'About Nomad360',
      aboutLead:'Nomad360 is an ambitious project developing services for entrepreneurs and businesses.',
      missionLabel:'Mission',
      mission:'Nomad360 frees the user’s personal time from routine by automating processes, so that time works for what matters.',
      valueLabel:'Value',
      value:'Time, a clear picture of your business economics, and tools for your own decisions.',
      goalsLabel:'Goals',
      goals:['Cut the time spent on repetitive operations.','Provide tools for analysis and management decisions.','Increase entrepreneurs’ independence in working with business data.'],
      servicesLabel:'Services',
      services:[['Business calculator','Available'],['AI Marketer','In development'],['Content Factory','In development']],
      development:'In development',contact:'Contacts',
      contactTopics:'Calculator questions, model customisation, cooperation, suggestions.',
      supportTitle:'Support the project',
      supportLead:'The calculator is free. Support is voluntary and funds the calculator, the AI Marketer and the Content Factory.',
      kaspi:'Kaspi · Kazakhstan',ozon:'Ozon · Russia',
      cryptoDonate:'Support Nomad360 with cryptocurrency',
      cryptoDonateHint:'Choose a cryptocurrency and an amount.',
      kaspiPhoneHint:'Transfer by phone number for holders of Kazakhstan-issued bank cards',
      bankTransfer:'International bank transfer details',
      bankRecipient:'Recipient',bankName:'Bank',
      ozonTransfer:'Support with a Russian bank card',ozonBank:'Ozon Bank',

      copy:'Copy',copied:'Copied',qrFor:'QR code for the address',
      fundsTitle:'What your support funds',
      products:[
        {id:'nomad360-ai',title:'AI Marketer',
         lead:'An intelligent marketing management system. It cuts business spending on advertising and on marketing staff.',
         items:[['Researches','the market and the audience'],['Plans','hypotheses and campaigns'],['Creates','ad materials'],['Analyzes','campaign results'],
           ['Calculates','budgets and spend efficiency for a goal: sales growth, brand awareness or a one-off campaign'],
           ['Automates','routine work: campaigns are prepared faster and marketing management becomes transparent and measurable']],
         goal:'Goal: reduce the cost and time of marketing management. You keep control of every decision and of the ad budget.',
         slogan:'Pay for what you buy.'},
        {id:'nomad360-factory',title:'Content Factory',
         lead:'An automated system for producing digital goods for marketplaces.',
         items:[['Researches','A crawler collects data on assortment, demand and competition'],
           ['Selects','Analytics finds promising niches and decides which goods to produce'],
           ['Produces','The factory creates digital goods, designs listings and covers, and checks quality'],
           ['Publishes','Goods pass moderation and go live on the marketplace'],
           ['Tracks','views, downloads and sales'],
           ['Adjusts','Market signals change the assortment, the production plan and the development strategy']],
         goal:'',slogan:'Buy what sells.'}
      ],
      dataTitle:'Data and privacy',
      dataCopy:'Calculations run in your browser. Financial data stays on your device; drafts are saved in browser storage and PDFs are created by the browser. Clear site data to remove saved calculations. The page loads Tailwind CDN and Google Fonts, which receive technical request data including IP address and browser information. Your financial calculations are not sent to these providers. The embedded NOWPayments donation form receives browser connection data and processes any payment details entered in the form.',
      licenseTitle:'License and usage',
      licenseCopy:'You may use, copy, modify and embed the calculator while preserving its name and a link to the original under the current license.',
      licenseLink:'Read license',
      embedTitle:'Calculator for your website',
      embedB2BTitle:'Work in B2B? Attract relevant traffic for free.',
      trafficTitle:'Unique visitors in the last 14 days:',
      embedButton:'Embed the calculator on my website',
      embedHint:'Add the code as a custom HTML block in your website editor with JavaScript enabled. Automatic updates are not supported.',
      customButton:'Request custom development',
      embedWorking:'Preparing HTML…',embedReady:'HTML download ready',
      embedRetryLead:'If the download did not start,',embedRetryAction:'click here',
      embedError:'Could not prepare HTML. Check your connection and try again.',
      officialTitle:'Official contact',officialCopy:'Project email for questions, cooperation and licence enquiries.',
      unitNote:'* currency units — amounts are shown in your chosen currency.',rights:'© 2026 Nomad360'
    },
    kk: {
      nav:['Калькулятор','AI-маркетолог','Контент фабрикасы','Жоба туралы','Байланыс'],
      support:'Қолдау',license:'Лицензия',data:'Деректер',menu:'Мәзірді ашу',close:'Мәзірді жабу',
      about:'Nomad360 жобасы туралы',
      aboutLead:'Nomad360 — кәсіпкерлер мен бизнеске арналған сервистерді дамытуға бағытталған өршіл жоба.',
      missionLabel:'Миссия',
      mission:'Nomad360 процестерді автоматтандыру арқылы пайдаланушының жеке уақытын күнделікті жұмыстан босатады, сонда бұл уақыт маңызды іске жұмыс істейді.',
      valueLabel:'Құндылық',
      value:'Уақыт, өз ісіңіздің экономикасының айқын көрінісі және өз шешімдеріңізге арналған құралдар.',
      goalsLabel:'Мақсаттар',
      goals:['Қайталанатын операцияларға кететін уақытты қысқарту.','Талдау мен басқарушылық шешімдерге арналған құралдар беру.','Кәсіпкердің бизнес-деректермен жұмыстағы дербестігін арттыру.'],
      servicesLabel:'Сервистер',
      services:[['Бизнес-калькулятор','Жұмыс істейді'],['AI-маркетолог','Әзірленуде'],['Контент фабрикасы','Әзірленуде']],
      development:'Әзірленуде',contact:'Байланыс',
      contactTopics:'Калькулятор бойынша сұрақтар, модельдерді жетілдіру, ынтымақтастық, ұсыныстар.',
      supportTitle:'Жобаны қолдау',
      supportLead:'Калькулятор тегін. Қолдау ерікті және калькуляторды, AI-маркетологты және контент фабрикасын дамытуға жұмсалады.',
      kaspi:'Kaspi · Қазақстан',ozon:'Ozon · Ресей',
      cryptoDonate:'Nomad360 жобасын криптовалютамен қолдау',
      cryptoDonateHint:'Криптовалюта мен соманы таңдаңыз.',
      kaspiPhoneHint:'Қазақстан банктерінің карталары үшін телефон нөмірі арқылы аударым',
      bankTransfer:'Халықаралық банк аударымына арналған деректемелер',
      bankRecipient:'Алушы',bankName:'Банк',
      ozonTransfer:'Ресейлік банк картасымен қолдау',ozonBank:'Озон Банк',

      copy:'Көшіру',copied:'Көшірілді',qrFor:'Мекенжайдың QR-коды',
      fundsTitle:'Қолдау неге жұмсалады',
      products:[
        {id:'nomad360-ai',title:'AI-маркетолог',
         lead:'Маркетингті басқарудың интеллектуалды жүйесі. Бизнестің жарнамаға және маркетологқа жұмсайтын шығынын азайтады.',
         items:[['Зерттейді','нарық пен аудиторияны'],['Жоспарлайды','болжамдар мен науқандарды'],['Жасайды','жарнамалық материалдарды'],['Талдайды','науқан нәтижелерін'],
           ['Есептейді','мақсатқа сай бюджет пен шығын тиімділігін: сатылым өсімі, бренд танымалдығы немесе бір реттік науқан'],
           ['Автоматтандырады','күнделікті жұмысты: науқандар тезірек дайындалады, маркетингті басқару ашық әрі өлшенетін болады']],
         goal:'Мақсат: маркетингті басқарудың шығыны мен уақытын қысқарту. Әр шешім мен жарнама бюджеті сіздің бақылауыңызда қалады.',
         slogan:'Сатып алғаныңызға ғана төлеңіз.'},
        {id:'nomad360-factory',title:'Контент фабрикасы',
         lead:'Маркетплейстерге арналған цифрлық тауарларды өндірудің автоматтандырылған жүйесі.',
         items:[['Зерттейді','Краулер ассортимент, сұраныс және бәсеке туралы деректерді жинайды'],
           ['Таңдайды','Талдау перспективалы тауашаларды тауып, қандай тауар шығаруды анықтайды'],
           ['Өндіреді','Фабрика цифрлық тауарларды жасайды, карточкалар мен мұқабаларды рәсімдейді, сапаны тексереді'],
           ['Жариялайды','Тауарлар модерациядан өтіп, маркетплейсте жарияланады'],
           ['Бақылайды','қаралымдар, жүктеулер және сатылымдар'],
           ['Түзетеді','Нарық сигналдары бойынша ассортиментті, өндіріс жоспарын және даму стратегиясын өзгертеді']],
         goal:'',slogan:'Өтімді тауарды сатып алыңыз.'}
      ],
      dataTitle:'Деректер және құпиялық',
      dataCopy:'Есептеулер браузеріңізде орындалады. Қаржылық деректер құрылғыңызда қалады, нобайлар браузерде сақталады, PDF браузер арқылы жасалады. Сақталған есептерді жою үшін сайт деректерін тазалаңыз. Бетті жүктегенде Tailwind CDN және Google Fonts техникалық сұрау деректерін, соның ішінде IP мекенжайы мен браузер мәліметтерін алады. Қаржылық есеп деректері оларға берілмейді. NOWPayments қайырымдылық нысаны браузердің техникалық деректерін алады және нысанға енгізілген төлем мәліметтерін өңдейді.',
      licenseTitle:'Лицензия және пайдалану',
      licenseCopy:'Қолданыстағы лицензия бойынша калькуляторды пайдалану, көшіру, өзгерту және енгізу кезінде оның атауын және түпнұсқаға сілтемені сақтау қажет.',
      licenseLink:'Лицензияны оқу',
      embedTitle:'Сайтыңызға арналған калькулятор',
      embedB2BTitle:'B2B саласында жұмыс істейсіз бе? Пайдалы трафикті тегін тартыңыз.',
      trafficTitle:'Соңғы 14 күндегі бірегей келушілер:',
      embedButton:'Калькуляторды өз сайтыма енгізу',
      embedHint:'Кодты сайт редакторында JavaScript қолдайтын арнайы HTML-блок ретінде жариялаңыз. Автоматты жаңарту қолдау көрсетілмейді.',
      customButton:'Жеке әзірлеуге тапсырыс беру',
      embedWorking:'HTML дайындалуда…',embedReady:'HTML жүктеуге дайын',
      embedRetryLead:'Егер жүктеу басталмаса,',embedRetryAction:'осы жерді басыңыз',
      embedError:'HTML жасау мүмкін болмады. Интернетті тексеріп, қайта көріңіз.',
      officialTitle:'Ресми байланыс',officialCopy:'Сұрақтар, ынтымақтастық және лицензия бойынша өтініштерге арналған жоба поштасы.',
      unitNote:'* ш.б. — сіздің валютаңыздағы ақша.',rights:'© 2026 Nomad360'
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
  function copyButton(t, value, label) {
    return '<button type="button" class="nomad-copy" data-nomad-copy="'+esc(value)+'" data-label="'+esc(t.copy)+'" data-done="'+esc(t.copied)+'" aria-label="'+esc(t.copy+': '+label)+'">'+esc(t.copy)+'</button>';
  }
  function infoMarkup(t) {
    const goals=t.goals.map(g=>'<li>'+esc(g)+'</li>').join('');
    const services=t.services.map(s=>'<li>'+esc(s[0])+' — '+esc(s[1].toLowerCase())+'</li>').join('');
    return '<section id="nomad360-about" class="nomad-info-block" tabindex="-1">'+
      '<h2>'+esc(t.about)+'</h2><p><strong>'+esc(t.aboutLead)+'</strong></p>'+
      '<h3>'+esc(t.missionLabel)+'</h3><p>'+esc(t.mission)+'</p>'+
      '<h3>'+esc(t.valueLabel)+'</h3><p>'+esc(t.value)+'</p>'+
      '<h3>'+esc(t.goalsLabel)+'</h3><ul class="nomad-list">'+goals+'</ul>'+
      '<h3>'+esc(t.servicesLabel)+'</h3><ul class="nomad-list">'+services+'</ul></section>'+
      '<section id="nomad360-contacts" class="nomad-info-block" tabindex="-1">'+
      '<h2>'+esc(t.contact)+'</h2><div class="nomad-links">'+
      '<a href="https://t.me/Kazartsev_EV" target="_blank" rel="noopener noreferrer">Telegram · @Kazartsev_EV</a>'+
      '<a href="'+PAY.whatsappUrl+'" target="_blank" rel="noopener noreferrer">WhatsApp · '+esc(PAY.whatsapp)+'</a>'+
      '<a href="mailto:'+PAY.email+'">'+PAY.email+'</a>'+
      '<a href="https://www.threads.com/@nomad260393" target="_blank" rel="noopener noreferrer">Threads · @nomad260393</a>'+
      '</div><p class="nomad-topics">'+esc(t.contactTopics)+'</p></section>';
  }
  // Official NOWPayments donation form, embedded directly in the footer.
  // The hosted iframe owns transaction processing and donor inputs. This
  // static site never reads or handles wallet credentials or card details.
  function payHostedCrypto(t) {
    return '<section class="nomad-crypto-panel" aria-labelledby="nomad-crypto-title">'+
      '<div class="nomad-crypto-heading">'+
      '<span class="nomad-crypto-kicker"><span aria-hidden="true">🌐</span> NOWPayments</span>'+
      '<h3 id="nomad-crypto-title">'+esc(t.cryptoDonate)+'</h3>'+
      '<p>'+esc(t.cryptoDonateHint)+'</p></div>'+
      '<div class="nomad-crypto-embed"><div class="nomad-crypto-viewport">'+
      '<iframe class="nomad-crypto-frame" title="'+esc(t.cryptoDonate)+'" '+
      'src="'+PAY.donationWidget+'" width="346" height="623" loading="lazy" '+
      'frameborder="0" scrolling="no" referrerpolicy="strict-origin-when-cross-origin">'+
      '</iframe></div></div></section>';
  }
  function payFiat(t) {
    const bankLine=(label,value)=>
      '<div class="nomad-bank-row"><span class="nomad-bank-key">'+esc(label)+'</span>'+
      '<span class="nomad-bank-value">'+esc(value)+'</span>'+copyButton(t,value,label)+'</div>';
    return '<div class="nomad-pay-fiat">'+
      '<article class="nomad-pay nomad-pay-kaspi">'+
      '<span class="nomad-pay-label"><span class="nomad-kz-flag" aria-hidden="true">🇰🇿</span> '+esc(t.kaspi)+'</span>'+
      '<p class="nomad-pay-hint">'+esc(t.kaspiPhoneHint)+'</p>'+
      '<a class="nomad-pay-value" href="'+PAY.kaspiTel+'">'+esc(PAY.kaspi)+'</a>'+
      copyButton(t,PAY.kaspi,t.kaspi)+'</article>'+
      '<details class="nomad-pay nomad-pay-bank">'+
      '<summary class="nomad-fold-toggle"><span class="nomad-donate-globe" aria-hidden="true">🌐</span><span>'+esc(t.bankTransfer)+'</span><span class="nomad-fold-arrow" aria-hidden="true">⌄</span></summary>'+
      '<div class="nomad-bank-details">'+
      bankLine(t.bankRecipient,PAY.bankName)+bankLine(t.bankName,PAY.bank)+
      bankLine('SWIFT/BIC',PAY.swift)+bankLine('IBAN',PAY.iban)+
      '</div></details></div>';
  }
  function payRussian(t) {
    return '<details class="nomad-russian-transfer">'+
      '<summary>'+esc(t.ozonTransfer)+' <span aria-hidden="true">⌄</span></summary>'+
      '<div class="nomad-russian-details"><strong>'+esc(t.ozonBank)+'</strong>'+
      '<a href="'+PAY.ozonTel+'">'+esc(PAY.ozon)+'</a>'+
      copyButton(t,PAY.ozon,t.ozon)+'</div></details>';
  }
  function productMarkup(t, p) {
    const items=p.items.map(i=>'<li><b>'+esc(i[0])+'.</b> '+esc(i[1])+'</li>').join('');
    return '<article id="'+p.id+'" class="nomad-product" tabindex="-1">'+
      '<span class="nomad-status">'+esc(t.development)+'</span><h4>'+esc(p.title)+'</h4>'+
      '<p>'+esc(p.lead)+'</p><ul>'+items+'</ul>'+ (p.goal?'<p class="nomad-product-goal">'+esc(p.goal)+'</p>':'')+
      (p.slogan?'<p class="nomad-slogan">'+esc(p.slogan)+'</p>':'')+'</article>';
  }
  let embedDownloadUrl=null;
  const embedFilename='Nomad360-calculator-embed.html';
  function restoreEmbedDownloadLink() {
    const retry=document.querySelector('[data-nomad-embed-retry]');
    const link=document.querySelector('[data-nomad-retry-download]');
    if(!retry||!link||!embedDownloadUrl)return;
    link.href=embedDownloadUrl;
    retry.hidden=false;
  }
  root.addEventListener('pagehide',()=>{
    if(embedDownloadUrl)root.URL.revokeObjectURL(embedDownloadUrl);
    embedDownloadUrl=null;
  });
  function footerMarkup(t) {
    return '<div class="nomad-footer-inner">'+
      '<section id="nomad360-support" class="nomad-donate" tabindex="-1">'+
      '<h2>'+esc(t.supportTitle)+'</h2><p class="nomad-donate-lead">'+esc(t.supportLead)+'</p>'+
      payHostedCrypto(t)+payFiat(t)+payRussian(t)+'</section>'+
      '<section class="nomad-footer-products"><h3>'+esc(t.fundsTitle)+'</h3><div class="nomad-products-grid">'+
      t.products.map(p=>productMarkup(t,p)).join('')+'</div></section>'+
      '<div class="nomad-footer-meta">'+
      '<section id="nomad360-license" class="nomad-meta-block" tabindex="-1">'+
      '<div class="nomad-embed-actions"><p class="nomad-embed-title">'+esc(t.embedTitle)+'</p>'+ 
      '<h4 class="nomad-embed-b2b-title">'+esc(t.embedB2BTitle)+'</h4>'+
      '<button type="button" class="nomad-embed-download" data-nomad-download-html>'+esc(t.embedButton)+'</button>'+
      '<div class="nomad-traffic-stats" data-nomad-traffic-stats aria-live="polite">'+
      '<p class="nomad-traffic-counter"><span class="nomad-traffic-title">'+esc(t.trafficTitle)+'</span> '+
      '<strong class="nomad-traffic-value" data-nomad-traffic-value>—</strong></p></div>'+
      '<span class="nomad-embed-status" data-nomad-embed-status role="status" aria-live="polite"></span>'+
      '<div class="nomad-embed-retry" data-nomad-embed-retry hidden>'+esc(t.embedRetryLead)+' '+
      '<a class="nomad-embed-retry-link" data-nomad-retry-download download="'+embedFilename+'" href="#">'+esc(t.embedRetryAction)+'</a></div>'+
      '<p class="nomad-embed-hint">'+esc(t.embedHint)+'</p>'+
      '<a class="nomad-embed-contact" href="mailto:'+PAY.email+'?subject='+encodeURIComponent('Nomad360 — '+t.customButton)+'">'+esc(t.customButton)+'</a>'+
      '</div>'+
      '<div class="nomad-license-terms"><h3>'+esc(t.licenseTitle)+'</h3><p>'+esc(t.licenseCopy)+'</p>'+
      '<p><a href="https://github.com/KazartsevEV/shelter-partner-directory/blob/main/CALCULATOR_LICENSE.md" target="_blank" rel="noopener noreferrer">'+esc(t.licenseLink)+' ↗</a></p></div></section>'+
      '<section id="nomad360-data" class="nomad-meta-block" tabindex="-1"><h3>'+esc(t.dataTitle)+'</h3><p>'+esc(t.dataCopy)+'</p></section>'+
      '<section id="nomad360-official" class="nomad-meta-block"><h3>'+esc(t.officialTitle)+'</h3><p>'+esc(t.officialCopy)+'</p>'+
      '<p><a class="nomad-official-mail" href="mailto:'+PAY.email+'">'+PAY.email+'</a></p></section></div>'+
      '<div class="nomad-footer-bottom"><p class="nomad-unit-note">'+esc(t.unitNote)+'</p><span>'+esc(t.rights)+'</span></div>'+
      '<div class="nomad-sr" id="nomad360-copy-status" role="status" aria-live="polite"></div></div>';
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
  }
  function renderFooter() {
    let footer=document.getElementById('nomad360-footer');
    if(!footer){
      footer=document.createElement('footer');
      footer.id='nomad360-footer';
      footer.className='nomad-marketing nomad-footer';
      footer.setAttribute('aria-label','Nomad360');
      document.body.append(footer);
    }
    footer.setAttribute('data-nomad-no-translate','');
    footer.innerHTML=footerMarkup(COPY[language()]);
    root.Nomad360Traffic?.render?.(footer,language());
    restoreEmbedDownloadLink();
    if(embedDownloadUrl){
      const status=footer.querySelector('[data-nomad-embed-status]');
      if(status)status.textContent=COPY[language()].embedReady;
    }
  }
  /* Export the currently deployed HTML, not a live iframe. Inline every
     local script and stylesheet so that moving the HTML does not break relative
     dependencies. Tailwind CDN / Google Fonts stay external network assets.
     Local calculations and storage remain on the visitor's own origin. */
  async function downloadEmbedHtml(button) {
    if(button.disabled)return;
    const t=COPY[language()];
    const status=document.querySelector('[data-nomad-embed-status]');
    const message=value=>{if(status)status.textContent=value;};
    button.disabled=true;
    button.setAttribute('aria-busy','true');
    message(t.embedWorking);
    try {
      const base=new URL('./',root.location.href);
      const get=async path=>{
        const response=await root.fetch(new URL(path,base),{cache:'no-store'});
        if(!response.ok)throw new Error('Unable to fetch '+path+': '+response.status);
        return response;
      };
      const html=await (await get('Marketing_calc.HTML')).text();
      const doc=new root.DOMParser().parseFromString(html,'text/html');
      if(!doc.querySelector('#home-screen')||!doc.querySelector('#portfolio-v2-screen'))
        throw new Error('Calculator HTML is incomplete');
      const binary=await (await get('nomad360_wolf_open_circle.png')).blob();
      const logo=await new Promise((resolve,reject)=>{
        const reader=new root.FileReader();
        reader.onload=()=>resolve(reader.result);
        reader.onerror=()=>reject(reader.error);
        reader.readAsDataURL(binary);
      });
      for(const link of Array.from(doc.querySelectorAll('link[rel="stylesheet"][href^="./"]'))){
        const filename=link.getAttribute('href');
        const css=await (await get(filename)).text();
        const inline=doc.createElement('style');
        inline.setAttribute('data-nomad-bundled',filename);
        inline.textContent=css.replace(/<\/style/gi,'<\\/style');
        link.replaceWith(inline);
      }
      for(const old of Array.from(doc.querySelectorAll('script[src^="./"]'))){
        const filename=old.getAttribute('src');
        let code=await (await get(filename)).text();
        if(filename==='./nomad360_header.js')
          code=code.replaceAll('./nomad360_wolf_open_circle.png',logo);
        const inline=doc.createElement('script');
        inline.setAttribute('data-nomad-bundled',filename);
        inline.textContent=code.replace(/<\/script/gi,'<\\/script');
        old.replaceWith(inline);
      }
      // A downloadable HTML snapshot freezes this edition of the calculator.
      // The embedded version has no auto-sync and may depend on public CDN
      // resources allowed by the host page's Content Security Policy.
      const blob=new Blob(['<!DOCTYPE html>\n'+doc.documentElement.outerHTML],{type:'text/html;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      const oldUrl=embedDownloadUrl;
      embedDownloadUrl=url;
      restoreEmbedDownloadLink();
      if(oldUrl)URL.revokeObjectURL(oldUrl);
      a.href=url;a.download=embedFilename;
      document.body.append(a);a.click();a.remove();
      
      message(t.embedReady);
    }catch(error){
      root.console?.error?.('Nomad360: HTML embed export failed',error);
      message(t.embedError);
    }finally{
      button.disabled=false;
      button.removeAttribute('aria-busy');
    }
  }
  function copyText(value) {
    if(root.navigator.clipboard&&root.isSecureContext)return root.navigator.clipboard.writeText(value);
    return new Promise((resolve,reject)=>{
      const area=document.createElement('textarea');
      area.value=value;area.setAttribute('readonly','');
      area.style.cssText='position:fixed;top:0;left:0;opacity:0';
      document.body.append(area);area.select();
      try{document.execCommand('copy')?resolve():reject(new Error('copy'))}catch(e){reject(e)}
      area.remove();
    });
  }
  function onCopy(button) {
    copyText(button.getAttribute('data-nomad-copy')).then(()=>{
      button.textContent=button.getAttribute('data-done');
      button.classList.add('is-done');
      const status=document.getElementById('nomad360-copy-status');
      if(status)status.textContent=button.getAttribute('data-done');
      root.setTimeout(()=>{
        if(!button.isConnected)return;
        button.textContent=button.getAttribute('data-label');
        button.classList.remove('is-done');
      },1800);
    }).catch(()=>{});
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
      '<a class="nomad-brand" href="#home-screen" data-nomad-go="home-screen" aria-label="Nomad360 lite">'+
      '<img class="nomad-logo" src="./nomad360_wolf_open_circle.png" alt="" width="58" height="58">'+
      '<span class="nomad-wordmark">Nomad<span>360</span><small class="nomad-lite"> lite</small></span></a>'+
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
    renderInformation();renderFooter();renderHeader();
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
      const download=event.target.closest('[data-nomad-download-html]');
      if(download){downloadEmbedHtml(download);return;}
      const copy=event.target.closest('[data-nomad-copy]');
      if(copy){onCopy(copy);return;}
      if(!header.contains(event.target))closeMenu(false);
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape')closeMenu(true);
    });
    document.addEventListener('nomad360:languagechange',()=>{
      // Nomad360UI rebuilds its select before dispatching languagechange.
      renderInformation();renderFooter();renderHeader();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})(window);
