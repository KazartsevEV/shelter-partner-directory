/* Nomad360 header, information blocks and footer. Presentation only.
   No financial-engine access or persistence changes. */
(function (root) {
  'use strict';
  const PAY = {
    kaspi: '+7 777 129 56 93', kaspiTel: 'tel:+77771295693',
    ozon: '+7 977 986 74 41', ozonTel: 'tel:+79779867441',
    card: '5367088103743267', cardView: '5367 0881 0374 3267',
    usdt: 'TGjukX3RWwu8hKB9oZQnXRanXqCPMM9TCA',
    btc: '1GZDvXFWAnxFBEa1PtatsDiYLzHWyCrd3M',
    whatsapp: '+7 777 129 56 93', whatsappUrl: 'https://wa.me/77771295693',
    email: 'nomad260393@gmail.com'
  };
  // Pre-rendered QR codes (error correction M). The address is the whole payload.
  const QR = {
    usdt: {n: 29, d: 'M0 0h7v1h-7zM8 0h1v1h-1zM15 0h2v1h-2zM18 0h3v1h-3zM22 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h3v1h-3zM14 1h2v1h-2zM17 1h1v1h-1zM20 1h1v1h-1zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM10 2h1v1h-1zM12 2h4v1h-4zM18 2h1v1h-1zM22 2h1v1h-1zM24 2h3v1h-3zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h2v1h-2zM12 3h1v1h-1zM17 3h1v1h-1zM20 3h1v1h-1zM22 3h1v1h-1zM24 3h3v1h-3zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM10 4h4v1h-4zM22 4h1v1h-1zM24 4h3v1h-3zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM10 5h1v1h-1zM12 5h1v1h-1zM14 5h1v1h-1zM16 5h4v1h-4zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h7v1h-7zM8 7h1v1h-1zM11 7h1v1h-1zM13 7h2v1h-2zM17 7h1v1h-1zM20 7h1v1h-1zM0 8h1v1h-1zM2 8h2v1h-2zM5 8h3v1h-3zM9 8h6v1h-6zM16 8h1v1h-1zM18 8h1v1h-1zM20 8h1v1h-1zM22 8h1v1h-1zM25 8h1v1h-1zM27 8h2v1h-2zM2 9h1v1h-1zM4 9h1v1h-1zM7 9h1v1h-1zM9 9h1v1h-1zM15 9h1v1h-1zM17 9h1v1h-1zM20 9h6v1h-6zM28 9h1v1h-1zM1 10h1v1h-1zM5 10h2v1h-2zM8 10h2v1h-2zM12 10h1v1h-1zM14 10h1v1h-1zM16 10h2v1h-2zM20 10h1v1h-1zM22 10h2v1h-2zM25 10h3v1h-3zM1 11h1v1h-1zM5 11h1v1h-1zM9 11h1v1h-1zM11 11h4v1h-4zM16 11h1v1h-1zM20 11h1v1h-1zM22 11h1v1h-1zM24 11h1v1h-1zM0 12h1v1h-1zM2 12h1v1h-1zM4 12h3v1h-3zM8 12h3v1h-3zM12 12h1v1h-1zM15 12h1v1h-1zM17 12h1v1h-1zM19 12h1v1h-1zM23 12h1v1h-1zM26 12h3v1h-3zM0 13h3v1h-3zM4 13h2v1h-2zM7 13h3v1h-3zM11 13h3v1h-3zM16 13h4v1h-4zM23 13h1v1h-1zM28 13h1v1h-1zM0 14h1v1h-1zM6 14h1v1h-1zM8 14h1v1h-1zM11 14h1v1h-1zM14 14h1v1h-1zM19 14h2v1h-2zM23 14h1v1h-1zM26 14h3v1h-3zM0 15h1v1h-1zM9 15h2v1h-2zM13 15h1v1h-1zM22 15h4v1h-4zM28 15h1v1h-1zM0 16h1v1h-1zM2 16h1v1h-1zM5 16h2v1h-2zM8 16h2v1h-2zM17 16h2v1h-2zM21 16h1v1h-1zM24 16h4v1h-4zM2 17h1v1h-1zM4 17h1v1h-1zM8 17h1v1h-1zM10 17h1v1h-1zM12 17h2v1h-2zM19 17h2v1h-2zM22 17h2v1h-2zM25 17h2v1h-2zM28 17h1v1h-1zM0 18h1v1h-1zM4 18h1v1h-1zM6 18h2v1h-2zM10 18h3v1h-3zM15 18h1v1h-1zM17 18h2v1h-2zM21 18h1v1h-1zM23 18h1v1h-1zM2 19h2v1h-2zM5 19h1v1h-1zM8 19h1v1h-1zM10 19h2v1h-2zM16 19h5v1h-5zM22 19h1v1h-1zM26 19h1v1h-1zM1 20h3v1h-3zM5 20h3v1h-3zM9 20h1v1h-1zM13 20h1v1h-1zM18 20h1v1h-1zM20 20h5v1h-5zM26 20h3v1h-3zM8 21h1v1h-1zM10 21h7v1h-7zM19 21h2v1h-2zM24 21h1v1h-1zM0 22h7v1h-7zM8 22h1v1h-1zM13 22h1v1h-1zM16 22h2v1h-2zM20 22h1v1h-1zM22 22h1v1h-1zM24 22h2v1h-2zM27 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h1v1h-1zM11 23h1v1h-1zM16 23h1v1h-1zM20 23h1v1h-1zM24 23h1v1h-1zM0 24h1v1h-1zM2 24h3v1h-3zM6 24h1v1h-1zM9 24h1v1h-1zM14 24h1v1h-1zM16 24h1v1h-1zM20 24h6v1h-6zM27 24h1v1h-1zM0 25h1v1h-1zM2 25h3v1h-3zM6 25h1v1h-1zM8 25h2v1h-2zM12 25h4v1h-4zM19 25h1v1h-1zM24 25h1v1h-1zM26 25h1v1h-1zM28 25h1v1h-1zM0 26h1v1h-1zM2 26h3v1h-3zM6 26h1v1h-1zM8 26h1v1h-1zM11 26h2v1h-2zM18 26h1v1h-1zM20 26h2v1h-2zM23 26h1v1h-1zM25 26h2v1h-2zM28 26h1v1h-1zM0 27h1v1h-1zM6 27h1v1h-1zM9 27h1v1h-1zM11 27h3v1h-3zM15 27h2v1h-2zM20 27h4v1h-4zM25 27h1v1h-1zM27 27h1v1h-1zM0 28h7v1h-7zM8 28h2v1h-2zM12 28h1v1h-1zM14 28h2v1h-2zM17 28h5v1h-5zM25 28h3v1h-3z'},
    btc: {n: 29, d: 'M0 0h7v1h-7zM10 0h1v1h-1zM12 0h4v1h-4zM18 0h1v1h-1zM22 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM15 1h1v1h-1zM18 1h1v1h-1zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h1v1h-1zM14 2h1v1h-1zM16 2h1v1h-1zM20 2h1v1h-1zM22 2h1v1h-1zM24 2h3v1h-3zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h2v1h-2zM14 3h3v1h-3zM20 3h1v1h-1zM22 3h1v1h-1zM24 3h3v1h-3zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM9 4h1v1h-1zM13 4h3v1h-3zM17 4h1v1h-1zM20 4h1v1h-1zM22 4h1v1h-1zM24 4h3v1h-3zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM11 5h1v1h-1zM13 5h2v1h-2zM18 5h1v1h-1zM20 5h1v1h-1zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h7v1h-7zM8 7h1v1h-1zM10 7h2v1h-2zM13 7h1v1h-1zM19 7h1v1h-1zM0 8h1v1h-1zM6 8h1v1h-1zM8 8h1v1h-1zM11 8h2v1h-2zM14 8h2v1h-2zM20 8h3v1h-3zM25 8h3v1h-3zM2 9h1v1h-1zM4 9h1v1h-1zM7 9h2v1h-2zM10 9h1v1h-1zM12 9h1v1h-1zM14 9h1v1h-1zM16 9h4v1h-4zM22 9h5v1h-5zM28 9h1v1h-1zM0 10h2v1h-2zM6 10h2v1h-2zM11 10h1v1h-1zM15 10h2v1h-2zM21 10h1v1h-1zM1 11h3v1h-3zM5 11h1v1h-1zM8 11h2v1h-2zM12 11h1v1h-1zM14 11h1v1h-1zM16 11h1v1h-1zM18 11h1v1h-1zM20 11h1v1h-1zM22 11h4v1h-4zM28 11h1v1h-1zM0 12h3v1h-3zM4 12h5v1h-5zM10 12h1v1h-1zM12 12h3v1h-3zM16 12h1v1h-1zM19 12h1v1h-1zM22 12h3v1h-3zM27 12h1v1h-1zM7 13h5v1h-5zM13 13h2v1h-2zM16 13h2v1h-2zM19 13h2v1h-2zM23 13h3v1h-3zM27 13h1v1h-1zM1 14h1v1h-1zM4 14h3v1h-3zM9 14h3v1h-3zM13 14h6v1h-6zM20 14h1v1h-1zM24 14h1v1h-1zM26 14h1v1h-1zM2 15h4v1h-4zM7 15h3v1h-3zM11 15h1v1h-1zM13 15h4v1h-4zM18 15h1v1h-1zM20 15h3v1h-3zM25 15h3v1h-3zM0 16h1v1h-1zM3 16h2v1h-2zM6 16h2v1h-2zM10 16h3v1h-3zM14 16h3v1h-3zM23 16h1v1h-1zM25 16h1v1h-1zM0 17h2v1h-2zM5 17h1v1h-1zM7 17h2v1h-2zM11 17h1v1h-1zM15 17h1v1h-1zM17 17h4v1h-4zM22 17h3v1h-3zM26 17h1v1h-1zM0 18h3v1h-3zM4 18h3v1h-3zM8 18h2v1h-2zM11 18h1v1h-1zM13 18h11v1h-11zM25 18h2v1h-2zM28 18h1v1h-1zM0 19h1v1h-1zM2 19h1v1h-1zM5 19h1v1h-1zM7 19h3v1h-3zM14 19h1v1h-1zM16 19h1v1h-1zM18 19h1v1h-1zM20 19h2v1h-2zM23 19h1v1h-1zM25 19h1v1h-1zM27 19h1v1h-1zM0 20h1v1h-1zM3 20h1v1h-1zM5 20h3v1h-3zM10 20h2v1h-2zM15 20h1v1h-1zM20 20h5v1h-5zM27 20h1v1h-1zM8 21h3v1h-3zM13 21h1v1h-1zM15 21h1v1h-1zM19 21h2v1h-2zM24 21h4v1h-4zM0 22h7v1h-7zM9 22h1v1h-1zM11 22h1v1h-1zM13 22h3v1h-3zM17 22h1v1h-1zM19 22h2v1h-2zM22 22h1v1h-1zM24 22h1v1h-1zM26 22h2v1h-2zM0 23h1v1h-1zM6 23h1v1h-1zM10 23h2v1h-2zM13 23h1v1h-1zM15 23h1v1h-1zM19 23h2v1h-2zM24 23h2v1h-2zM28 23h1v1h-1zM0 24h1v1h-1zM2 24h3v1h-3zM6 24h1v1h-1zM11 24h3v1h-3zM15 24h1v1h-1zM19 24h6v1h-6zM26 24h3v1h-3zM0 25h1v1h-1zM2 25h3v1h-3zM6 25h1v1h-1zM9 25h2v1h-2zM12 25h1v1h-1zM15 25h3v1h-3zM25 25h1v1h-1zM28 25h1v1h-1zM0 26h1v1h-1zM2 26h3v1h-3zM6 26h1v1h-1zM9 26h3v1h-3zM13 26h4v1h-4zM18 26h1v1h-1zM22 26h6v1h-6zM0 27h1v1h-1zM6 27h1v1h-1zM10 27h1v1h-1zM12 27h5v1h-5zM19 27h2v1h-2zM22 27h5v1h-5zM28 27h1v1h-1zM0 28h7v1h-7zM8 28h2v1h-2zM11 28h1v1h-1zM15 28h1v1h-1zM19 28h1v1h-1zM24 28h1v1h-1z'}
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
      kaspi:'Kaspi · Казахстан',ozon:'Ozon · Россия',card:'Карта Bybit',
      usdt:'USDT · сеть TRON (TRC20)',btc:'Bitcoin · сеть BTC',
      hintPhone:'Перевод по номеру телефона',hintCard:'Перевод на карту',hintCrypto:'Наведите камеру кошелька на QR или скопируйте адрес',
      copy:'Копировать',copied:'Скопировано',qrFor:'QR-код адреса',
      payNote:'Для USDT выберите сеть TRON (TRC20), для Bitcoin — сеть BTC. Сверяйте адрес перед отправкой.',
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
         goal:'Принцип: производство ориентируется на реальный спрос и фактические результаты продаж.',slogan:''}
      ],
      dataTitle:'Данные и конфиденциальность',
      dataCopy:'Расчёты выполняются в браузере. Финансовые данные остаются на вашем устройстве, черновики сохраняются в хранилище браузера, PDF формируется средствами браузера. Для удаления сохранённых данных очистите данные сайта. При загрузке используются Tailwind CDN и Google Fonts: они получают технические данные запроса, включая IP-адрес и сведения о браузере. Финансовые данные расчётов им не передаются.',
      licenseTitle:'Лицензия и использование',
      licenseCopy:'Использование, копирование, изменение и встраивание калькулятора разрешены при сохранении названия калькулятора и ссылки на оригинал согласно действующей лицензии.',
      licenseLink:'Читать лицензию',
      officialTitle:'Официальный контакт',officialCopy:'Почта проекта для вопросов, сотрудничества и обращений по лицензии.',
      rights:'© 2026 Nomad360'
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
      kaspi:'Kaspi · Kazakhstan',ozon:'Ozon · Russia',card:'Bybit card',
      usdt:'USDT · TRON network (TRC20)',btc:'Bitcoin · BTC network',
      hintPhone:'Transfer by phone number',hintCard:'Transfer to the card',hintCrypto:'Scan the QR with your wallet or copy the address',
      copy:'Copy',copied:'Copied',qrFor:'QR code for the address',
      payNote:'Choose the TRON (TRC20) network for USDT and the BTC network for Bitcoin. Check the address before sending.',
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
         goal:'Principle: production follows real demand and actual sales results.',slogan:''}
      ],
      dataTitle:'Data and privacy',
      dataCopy:'Calculations run in your browser. Financial data stays on your device; drafts are saved in browser storage and PDFs are created by the browser. Clear site data to remove saved calculations. The page loads Tailwind CDN and Google Fonts, which receive technical request data including IP address and browser information. Your financial calculations are not sent to these providers.',
      licenseTitle:'License and usage',
      licenseCopy:'You may use, copy, modify and embed the calculator while preserving its name and a link to the original under the current license.',
      licenseLink:'Read license',
      officialTitle:'Official contact',officialCopy:'Project email for questions, cooperation and licence enquiries.',
      rights:'© 2026 Nomad360'
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
      kaspi:'Kaspi · Қазақстан',ozon:'Ozon · Ресей',card:'Bybit картасы',
      usdt:'USDT · TRON желісі (TRC20)',btc:'Bitcoin · BTC желісі',
      hintPhone:'Телефон нөмірі бойынша аударым',hintCard:'Картаға аударым',hintCrypto:'Әмиян камерасын QR-ға бағыттаңыз немесе мекенжайды көшіріңіз',
      copy:'Көшіру',copied:'Көшірілді',qrFor:'Мекенжайдың QR-коды',
      payNote:'USDT үшін TRON (TRC20), Bitcoin үшін BTC желісін таңдаңыз. Жібермес бұрын мекенжайды тексеріңіз.',
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
         goal:'Қағида: өндіріс нақты сұраныс пен сатылым нәтижелеріне бағытталған.',slogan:''}
      ],
      dataTitle:'Деректер және құпиялық',
      dataCopy:'Есептеулер браузеріңізде орындалады. Қаржылық деректер құрылғыңызда қалады, нобайлар браузерде сақталады, PDF браузер арқылы жасалады. Сақталған есептерді жою үшін сайт деректерін тазалаңыз. Бетті жүктегенде Tailwind CDN және Google Fonts техникалық сұрау деректерін, соның ішінде IP мекенжайы мен браузер мәліметтерін алады. Қаржылық есеп деректері оларға берілмейді.',
      licenseTitle:'Лицензия және пайдалану',
      licenseCopy:'Қолданыстағы лицензия бойынша калькуляторды пайдалану, көшіру, өзгерту және енгізу кезінде оның атауын және түпнұсқаға сілтемені сақтау қажет.',
      licenseLink:'Лицензияны оқу',
      officialTitle:'Ресми байланыс',officialCopy:'Сұрақтар, ынтымақтастық және лицензия бойынша өтініштерге арналған жоба поштасы.',
      rights:'© 2026 Nomad360'
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
  function qrSvg(kind, label) {
    const q=QR[kind], pad=3, size=q.n+pad*2;
    return '<svg class="nomad-qr" viewBox="'+(-pad)+' '+(-pad)+' '+size+' '+size+'" role="img" aria-label="'+esc(label)+'" shape-rendering="crispEdges" focusable="false">'+
      '<rect x="'+(-pad)+'" y="'+(-pad)+'" width="'+size+'" height="'+size+'" fill="#fff"/><path d="'+q.d+'" fill="#000"/></svg>';
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
  function payFiat(t) {
    return '<div class="nomad-pay-fiat">'+
      '<article class="nomad-pay"><span class="nomad-pay-label">'+esc(t.kaspi)+'</span>'+
      '<a class="nomad-pay-value" href="'+PAY.kaspiTel+'">'+esc(PAY.kaspi)+'</a><span class="nomad-pay-hint">'+esc(t.hintPhone)+'</span>'+
      copyButton(t,PAY.kaspi,t.kaspi)+'</article>'+
      '<article class="nomad-pay"><span class="nomad-pay-label">'+esc(t.ozon)+'</span>'+
      '<a class="nomad-pay-value" href="'+PAY.ozonTel+'">'+esc(PAY.ozon)+'</a><span class="nomad-pay-hint">'+esc(t.hintPhone)+'</span>'+
      copyButton(t,PAY.ozon,t.ozon)+'</article>'+
      '<article class="nomad-pay"><span class="nomad-pay-label">'+esc(t.card)+'</span>'+
      '<span class="nomad-pay-value">'+esc(PAY.cardView)+'</span><span class="nomad-pay-hint">'+esc(t.hintCard)+'</span>'+
      copyButton(t,PAY.card,t.card)+'</article></div>';
  }
  function payCrypto(t) {
    return '<div class="nomad-pay-crypto">'+
      '<article class="nomad-pay">'+qrSvg('usdt',t.qrFor+' · USDT TRC20')+'<div class="nomad-pay-body">'+
      '<span class="nomad-pay-label">'+esc(t.usdt)+'</span>'+
      '<a class="nomad-pay-address" href="https://tronscan.org/#/address/'+PAY.usdt+'" target="_blank" rel="noopener noreferrer">'+PAY.usdt+'</a>'+
      '<span class="nomad-pay-hint">'+esc(t.hintCrypto)+'</span>'+copyButton(t,PAY.usdt,t.usdt)+'</div></article>'+
      '<article class="nomad-pay">'+qrSvg('btc',t.qrFor+' · Bitcoin')+'<div class="nomad-pay-body">'+
      '<span class="nomad-pay-label">'+esc(t.btc)+'</span>'+
      '<a class="nomad-pay-address" href="bitcoin:'+PAY.btc+'">'+PAY.btc+'</a>'+
      '<span class="nomad-pay-hint">'+esc(t.hintCrypto)+'</span>'+copyButton(t,PAY.btc,t.btc)+'</div></article></div>';
  }
  function productMarkup(t, p) {
    const items=p.items.map(i=>'<li><b>'+esc(i[0])+'.</b> '+esc(i[1])+'</li>').join('');
    return '<article id="'+p.id+'" class="nomad-product" tabindex="-1">'+
      '<span class="nomad-status">'+esc(t.development)+'</span><h4>'+esc(p.title)+'</h4>'+
      '<p>'+esc(p.lead)+'</p><ul>'+items+'</ul><p class="nomad-product-goal">'+esc(p.goal)+'</p>'+
      (p.slogan?'<p class="nomad-slogan">'+esc(p.slogan)+'</p>':'')+'</article>';
  }
  function footerMarkup(t) {
    return '<div class="nomad-footer-inner">'+
      '<section id="nomad360-support" class="nomad-donate" tabindex="-1">'+
      '<h2>'+esc(t.supportTitle)+'</h2><p class="nomad-donate-lead">'+esc(t.supportLead)+'</p>'+
      payFiat(t)+payCrypto(t)+'<p class="nomad-pay-note">'+esc(t.payNote)+'</p></section>'+
      '<section class="nomad-footer-products"><h3>'+esc(t.fundsTitle)+'</h3><div class="nomad-products-grid">'+
      t.products.map(p=>productMarkup(t,p)).join('')+'</div></section>'+
      '<div class="nomad-footer-meta">'+
      '<section id="nomad360-license" class="nomad-meta-block" tabindex="-1"><h3>'+esc(t.licenseTitle)+'</h3><p>'+esc(t.licenseCopy)+'</p>'+
      '<p><a href="https://github.com/KazartsevEV/shelter-partner-directory/blob/main/CALCULATOR_LICENSE.md" target="_blank" rel="noopener noreferrer">'+esc(t.licenseLink)+' ↗</a></p></section>'+
      '<section id="nomad360-data" class="nomad-meta-block" tabindex="-1"><h3>'+esc(t.dataTitle)+'</h3><p>'+esc(t.dataCopy)+'</p></section>'+
      '<section id="nomad360-official" class="nomad-meta-block"><h3>'+esc(t.officialTitle)+'</h3><p>'+esc(t.officialCopy)+'</p>'+
      '<p><a class="nomad-official-mail" href="mailto:'+PAY.email+'">'+PAY.email+'</a></p></section></div>'+
      '<div class="nomad-footer-bottom"><span>'+esc(t.rights)+'</span></div>'+
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
