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
  const COPY = (root.Nomad360LocaleCore?.locales("interface.header") || {
  "ru": {
    "flow": [
      {
        "title": "Калькулятор",
        "question": "«Чем заниматься?»"
      },
      {
        "title": "AI Маркетолог",
        "question": "«Кто и зачем купит у меня мой продукт за эти деньги?»"
      },
      {
        "title": "Контент Фабрика",
        "question": "«Цифровая упаковка моего продукта по требованию маркетолога»"
      }
    ],
    "flowBefore": "Применяя автоматизацию с Nomad 360, вы можете достичь больших целей быстрее, освободив личное время на то, что ",
    "flowEmphasis": "действительно важно",
    "flowAfter": ".",
    "embedToggle": "Разместить калькулятор у себя на сайте",
    "comparison": {
      "caption": "Версии калькулятора",
      "feature": "Параметр",
      "free": "Этот калькулятор «как есть»",
      "own": "Собственный калькулятор",
      "cost": "Стоимость",
      "freePrice": "Бесплатно",
      "paidPrice": "От €600",
      "brand": "Оформление",
      "nomadBrand": "Бренд Nomad360",
      "customerBrand": "Ваш бренд",
      "seo": "SEO",
      "broadQueries": "Широкие информационные запросы",
      "customerQueries": "Адаптация под ваши ключевые запросы",
      "leads": "Страница для сбора лидов",
      "no": "Нет",
      "contacts": "Контакты и вопросы посетителя, формы обратной связи, опционально — интеграция с CRM",
      "action": "Действие"
    },
    "nav": [
      "Калькулятор",
      "AI-маркетолог",
      "Контент-фабрика",
      "О проекте",
      "Контакты"
    ],
    "support": "Поддержать",
    "license": "Лицензия",
    "data": "Данные",
    "menu": "Открыть меню",
    "close": "Закрыть меню",
    "about": "О проекте",
    "aboutBrand": "Nomad 360 - зонтичный бренд интеллектуальных сервисов для предпринимателей.",
    "aboutMotto": ["Устанавливаем связи.", "Строим структуру.", "Открываем горизонты."],
    "aboutLead": "Nomad360 — амбициозный проект по развитию сервисов для предпринимателей и бизнеса.",
    "missionLabel": "Миссия",
    "mission": "Nomad360 освобождает личное время пользователя от рутины с помощью автоматизации процессов, чтобы это время работало на главное.",
    "valueLabel": "Ценность",
    "value": "Время, ясная картина экономики своего дела, инструменты для собственных решений.",
    "goalsLabel": "Цели",
    "goals": [
      "Сократить время на повторяющиеся операции.",
      "Дать инструменты для анализа и управленческих решений.",
      "Повысить самостоятельность предпринимателя в работе с бизнес-данными."
    ],
    "servicesLabel": "Сервисы",
    "services": [
      [
        "Бизнес-калькулятор",
        "Работает"
      ],
      [
        "AI-маркетолог",
        "В разработке"
      ],
      [
        "Контент-фабрика",
        "В разработке"
      ]
    ],
    "development": "В разработке",
    "contact": "Контакты",
    "contactTopics": "Вопросы по калькулятору, доработка моделей, сотрудничество, предложения.",
    "supportTitle": "Поддержать проект",
    "supportLead": "Калькулятор бесплатный. Поддержка добровольная и идёт на развитие калькулятора, AI-маркетолога и контент-фабрики.",
    "kaspi": "Kaspi · Казахстан",
    "ozon": "Ozon · Россия",
    "cryptoDonate": "Поддержать Nomad360 криптовалютой",
    "cryptoDonateHint": "Выберите криптовалюту и сумму.",
    "kaspiPhoneHint": "Перевод по номеру телефона для владельцев казахстанских карт",
    "bankTransfer": "Реквизиты для международного банковского перевода",
    "bankRecipient": "Получатель",
    "bankName": "Банк",
    "ozonTransfer": "Поддержать с российской карты",
    "ozonBank": "Озон Банк",
    "copy": "Копировать",
    "copied": "Скопировано",
    "qrFor": "QR-код адреса",
    "fundsTitle": "На что идёт поддержка",
    "products": [
      {
        "id": "nomad360-ai",
        "title": "AI-маркетолог",
        "lead": "Интеллектуальная система управления маркетингом. Сокращает расходы бизнеса на рекламу и работу маркетолога.",
        "items": [
          [
            "Исследует",
            "рынок и аудиторию"
          ],
          [
            "Планирует",
            "гипотезы и кампании"
          ],
          [
            "Создаёт",
            "рекламные материалы"
          ],
          [
            "Анализирует",
            "результаты кампаний"
          ],
          [
            "Считает",
            "бюджеты и эффективность расходов под цель: рост продаж, узнаваемость бренда или разовая кампания"
          ],
          [
            "Автоматизирует",
            "рутину: кампании готовятся быстрее, управление маркетингом становится прозрачным и измеримым"
          ]
        ],
        "goal": "Цель: сократить затраты и время на управление маркетингом. Контроль над каждым решением и рекламным бюджетом остаётся у вас.",
        "slogan": "Платите за то, что покупаете."
      },
      {
        "id": "nomad360-factory",
        "title": "Контент-фабрика",
        "lead": "Автоматизированная система производства цифровых товаров для маркетплейсов.",
        "items": [
          [
            "Исследует",
            "Краулер собирает данные об ассортименте, спросе и конкуренции"
          ],
          [
            "Выбирает",
            "Аналитика находит перспективные ниши и определяет, какие товары выпускать"
          ],
          [
            "Производит",
            "Фабрика создаёт цифровые товары, оформляет карточки и обложки, проверяет качество"
          ],
          [
            "Публикует",
            "Товары проходят модерацию и выходят на маркетплейс"
          ],
          [
            "Отслеживает",
            "просмотры, скачивания и продажи"
          ],
          [
            "Корректирует",
            "По рыночным сигналам меняет ассортимент, производственный план и стратегию развития"
          ]
        ],
        "goal": "",
        "slogan": "Покупайте то, что продается."
      }
    ],
    "dataTitle": "Данные и конфиденциальность",
    "dataCopy": "Расчёты выполняются в браузере. Финансовые данные остаются на вашем устройстве, черновики сохраняются в хранилище браузера, PDF формируется средствами браузера. Для удаления сохранённых данных очистите данные сайта. При загрузке используются Tailwind CDN и Google Fonts: они получают технические данные запроса, включая IP-адрес и сведения о браузере. Финансовые данные расчётов им не передаются. При отображении формы пожертвования NOWPayments получает технические данные браузера; введённые в форму платёжные сведения обрабатывает NOWPayments.",
    "licenseTitle": "Лицензия и использование",
    "licenseCopy": "Nomad360 lite предоставляется бесплатно «как есть». Вы можете скачать и разместить полную неизменённую версию, в том числе на коммерческом сайте, сохранив бренд, авторство, ссылки, контакты и информацию о поддержке проекта. Изменения, ребрендинг и собственная версия возможны только по отдельному письменному соглашению. Гарантии не предоставляются.",
    "licenseLink": "Читать лицензию",
    "embedTitle": "Калькулятор для вашего сайта",
    "embedB2BTitle": "Занимаетесь консалтингом?",
    "embedB2BSlogan": "Nomad360 оптимизирует время для вас и ваших клиентов, чтобы обогнать конкурентов.",
    "embedB2BPoints": ["Разместите наш калькулятор на своем сайте и привлеките целевой трафик.","Собирайте лиды прямо с калькулятора через собственные формы или отвечайте на вопросы пользователей в онлайн-чате.","Квалифицируйте запросы клиентов до первого касания, чтобы обсуждать конкретные вопросы."],
    "embedB2BFocus": "конкретные вопросы",
    "trafficTitle": "Уникальные посетители GitHub-репозитория за последние 14 дней:",
    "embedButton": "Скачать бесплатную версию",
    "embedHint": "Подсказка: опубликуйте код в редакторе сайта как кастомный блок. Автоматическое обновление не поддерживается. Требуется поддержка JavaScript.",
    "customButton": "Заказать кастомное решение",
    "embedWorking": "Подготавливаем HTML…",
    "embedReady": "HTML готов к скачиванию",
    "embedRetryLead": "Если загрузка не началась,",
    "embedRetryAction": "нажмите здесь",
    "embedError": "Не удалось собрать HTML. Проверьте подключение и попробуйте ещё раз.",
    "officialTitle": "Официальный контакт",
    "officialCopy": "Почта проекта для вопросов, сотрудничества и обращений по лицензии.",
    "unitNote": "* у.е. — деньги в вашей валюте.",
    "rights": "© 2026 Nomad360"
  },
  "en": {
    "flow": [
      {
        "title": "Calculator",
        "question": "“What should I do?”"
      },
      {
        "title": "AI Marketer",
        "question": "“Who will buy my product at this price, and why?”"
      },
      {
        "title": "Content Factory",
        "question": "“Digital packaging for my product as requested by the marketer”"
      }
    ],
    "flowBefore": "With Nomad 360 automation, you can reach bigger goals faster and free up personal time for what ",
    "flowEmphasis": "really matters",
    "flowAfter": ".",
    "embedToggle": "Add the calculator to your website",
    "comparison": {
      "caption": "Calculator editions",
      "feature": "Feature",
      "free": "This calculator, as is",
      "own": "Your own calculator",
      "cost": "Price",
      "freePrice": "Free",
      "paidPrice": "From €600",
      "brand": "Branding",
      "nomadBrand": "Nomad360 brand",
      "customerBrand": "Your brand",
      "seo": "SEO",
      "broadQueries": "Broad informational queries",
      "customerQueries": "Adapted to your target search queries",
      "leads": "Lead collection page",
      "no": "No",
      "contacts": "Visitor contact details and questions, contact forms, optional CRM integration",
      "action": "Action"
    },
    "nav": [
      "Calculator",
      "AI Marketer",
      "Content Factory",
      "About",
      "Contacts"
    ],
    "support": "Support",
    "license": "License",
    "data": "Data",
    "menu": "Open menu",
    "close": "Close menu",
    "about": "About Nomad360",
    "aboutBrand": "Nomad 360 is an umbrella brand of intelligent services for entrepreneurs.",
    "aboutMotto": ["We build connections.", "We create structure.", "We open new horizons."],
    "aboutLead": "Nomad360 is an ambitious project developing services for entrepreneurs and businesses.",
    "missionLabel": "Mission",
    "mission": "Nomad360 frees the user’s personal time from routine by automating processes, so that time works for what matters.",
    "valueLabel": "Value",
    "value": "Time, a clear picture of your business economics, and tools for your own decisions.",
    "goalsLabel": "Goals",
    "goals": [
      "Cut the time spent on repetitive operations.",
      "Provide tools for analysis and management decisions.",
      "Increase entrepreneurs’ independence in working with business data."
    ],
    "servicesLabel": "Services",
    "services": [
      [
        "Business calculator",
        "Available"
      ],
      [
        "AI Marketer",
        "In development"
      ],
      [
        "Content Factory",
        "In development"
      ]
    ],
    "development": "In development",
    "contact": "Contacts",
    "contactTopics": "Calculator questions, model customisation, cooperation, suggestions.",
    "supportTitle": "Support the project",
    "supportLead": "The calculator is free. Support is voluntary and funds the calculator, the AI Marketer and the Content Factory.",
    "kaspi": "Kaspi · Kazakhstan",
    "ozon": "Ozon · Russia",
    "cryptoDonate": "Support Nomad360 with cryptocurrency",
    "cryptoDonateHint": "Choose a cryptocurrency and an amount.",
    "kaspiPhoneHint": "Transfer by phone number for holders of Kazakhstan-issued bank cards",
    "bankTransfer": "International bank transfer details",
    "bankRecipient": "Recipient",
    "bankName": "Bank",
    "ozonTransfer": "Support with a Russian bank card",
    "ozonBank": "Ozon Bank",
    "copy": "Copy",
    "copied": "Copied",
    "qrFor": "QR code for the address",
    "fundsTitle": "What your support funds",
    "products": [
      {
        "id": "nomad360-ai",
        "title": "AI Marketer",
        "lead": "An intelligent marketing management system. It cuts business spending on advertising and on marketing staff.",
        "items": [
          [
            "Researches",
            "the market and the audience"
          ],
          [
            "Plans",
            "hypotheses and campaigns"
          ],
          [
            "Creates",
            "ad materials"
          ],
          [
            "Analyzes",
            "campaign results"
          ],
          [
            "Calculates",
            "budgets and spend efficiency for a goal: sales growth, brand awareness or a one-off campaign"
          ],
          [
            "Automates",
            "routine work: campaigns are prepared faster and marketing management becomes transparent and measurable"
          ]
        ],
        "goal": "Goal: reduce the cost and time of marketing management. You keep control of every decision and of the ad budget.",
        "slogan": "Pay for what you buy."
      },
      {
        "id": "nomad360-factory",
        "title": "Content Factory",
        "lead": "An automated system for producing digital goods for marketplaces.",
        "items": [
          [
            "Researches",
            "A crawler collects data on assortment, demand and competition"
          ],
          [
            "Selects",
            "Analytics finds promising niches and decides which goods to produce"
          ],
          [
            "Produces",
            "The factory creates digital goods, designs listings and covers, and checks quality"
          ],
          [
            "Publishes",
            "Goods pass moderation and go live on the marketplace"
          ],
          [
            "Tracks",
            "views, downloads and sales"
          ],
          [
            "Adjusts",
            "Market signals change the assortment, the production plan and the development strategy"
          ]
        ],
        "goal": "",
        "slogan": "Buy what sells."
      }
    ],
    "dataTitle": "Data and privacy",
    "dataCopy": "Calculations run in your browser. Financial data stays on your device; drafts are saved in browser storage and PDFs are created by the browser. Clear site data to remove saved calculations. The page loads Tailwind CDN and Google Fonts, which receive technical request data including IP address and browser information. Your financial calculations are not sent to these providers. The embedded NOWPayments donation form receives browser connection data and processes any payment details entered in the form.",
    "licenseTitle": "License and usage",
    "licenseCopy": "Nomad360 lite is provided free of charge “as is”. You may download and embed the complete unmodified edition, including on a commercial website, while keeping its branding, attribution, links, contacts and developer-support information. Modifications, rebranding and custom editions require a separate written agreement. No warranties are provided.",
    "licenseLink": "Read license",
    "embedTitle": "Calculator for your website",
    "embedB2BTitle": "Do you work in consulting?",
    "embedB2BSlogan": "Nomad360 saves time for you and your clients, helping you stay ahead of competitors.",
    "embedB2BPoints": ["Add our calculator to your website and attract relevant traffic.","Collect leads directly through the calculator using your own forms, or answer users' questions in live chat.","Qualify client inquiries before the first contact so you can discuss specific questions."],
    "embedB2BFocus": "specific questions",
    "trafficTitle": "Unique GitHub repository visitors over the last 14 days:",
    "embedButton": "Download the free version",
    "embedHint": "Add the code as a custom HTML block in your website editor with JavaScript enabled. Automatic updates are not supported.",
    "customButton": "Order a custom solution",
    "embedWorking": "Preparing HTML…",
    "embedReady": "HTML download ready",
    "embedRetryLead": "If the download did not start,",
    "embedRetryAction": "click here",
    "embedError": "Could not prepare HTML. Check your connection and try again.",
    "officialTitle": "Official contact",
    "officialCopy": "Project email for questions, cooperation and licence enquiries.",
    "unitNote": "* currency units — amounts are shown in your chosen currency.",
    "rights": "© 2026 Nomad360"
  },
  "kk": {
    "flow": [
      {
        "title": "Калькулятор",
        "question": "«Немен айналысу керек?»"
      },
      {
        "title": "AI Marketer",
        "question": "«Менің өнімімді осы бағаға кім және не үшін сатып алады?»"
      },
      {
        "title": "Content Factory",
        "question": "«Маркетологтың талабы бойынша өнімімді цифрлық түрде ұсыну»"
      }
    ],
    "flowBefore": "Nomad 360 автоматтандыруын қолдана отырып, үлкен мақсаттарға тезірек жетіп, жеке уақытыңызды ",
    "flowEmphasis": "шын мәнінде маңызды",
    "flowAfter": " істерге арнай аласыз.",
    "embedToggle": "Калькуляторды өз сайтыңызға орналастыру",
    "comparison": {
      "caption": "Калькулятор нұсқалары",
      "feature": "Сипаттама",
      "free": "Бұл калькулятор «сол күйінде»",
      "own": "Өз калькуляторыңыз",
      "cost": "Құны",
      "freePrice": "Тегін",
      "paidPrice": "€600 бастап",
      "brand": "Безендіру",
      "nomadBrand": "Nomad360 бренді",
      "customerBrand": "Сіздің брендіңіз",
      "seo": "SEO",
      "broadQueries": "Жалпы ақпараттық іздеу сұраулары",
      "customerQueries": "Сіздің негізгі іздеу сұрауларыңызға бейімдеу",
      "leads": "Lead жинауға арналған бет",
      "no": "Жоқ",
      "contacts": "Келушінің байланыс деректері мен сұрақтары, кері байланыс нысандары, CRM жүйесімен қосымша интеграция",
      "action": "Әрекет"
    },
    "nav": [
      "Калькулятор",
      "AI-маркетолог",
      "Контент фабрикасы",
      "Жоба туралы",
      "Байланыс"
    ],
    "support": "Қолдау",
    "license": "Лицензия",
    "data": "Деректер",
    "menu": "Мәзірді ашу",
    "close": "Мәзірді жабу",
    "about": "Nomad360 жобасы туралы",
    "aboutBrand": "Nomad 360 — кәсіпкерлерге арналған зияткерлік сервистерді біріктіретін бренд.",
    "aboutMotto": ["Байланыстар орнатамыз.", "Құрылым құрамыз.", "Жаңа көкжиектер ашамыз."],
    "aboutLead": "Nomad360 — кәсіпкерлер мен бизнеске арналған сервистерді дамытуға бағытталған өршіл жоба.",
    "missionLabel": "Миссия",
    "mission": "Nomad360 процестерді автоматтандыру арқылы пайдаланушының жеке уақытын күнделікті жұмыстан босатады, сонда бұл уақыт маңызды іске жұмыс істейді.",
    "valueLabel": "Құндылық",
    "value": "Уақыт, өз ісіңіздің экономикасының айқын көрінісі және өз шешімдеріңізге арналған құралдар.",
    "goalsLabel": "Мақсаттар",
    "goals": [
      "Қайталанатын операцияларға кететін уақытты қысқарту.",
      "Талдау мен басқарушылық шешімдерге арналған құралдар беру.",
      "Кәсіпкердің бизнес-деректермен жұмыстағы дербестігін арттыру."
    ],
    "servicesLabel": "Сервистер",
    "services": [
      [
        "Бизнес-калькулятор",
        "Жұмыс істейді"
      ],
      [
        "AI-маркетолог",
        "Әзірленуде"
      ],
      [
        "Контент фабрикасы",
        "Әзірленуде"
      ]
    ],
    "development": "Әзірленуде",
    "contact": "Байланыс",
    "contactTopics": "Калькулятор бойынша сұрақтар, модельдерді жетілдіру, ынтымақтастық, ұсыныстар.",
    "supportTitle": "Жобаны қолдау",
    "supportLead": "Калькулятор тегін. Қолдау ерікті және калькуляторды, AI-маркетологты және контент фабрикасын дамытуға жұмсалады.",
    "kaspi": "Kaspi · Қазақстан",
    "ozon": "Ozon · Ресей",
    "cryptoDonate": "Nomad360 жобасын криптовалютамен қолдау",
    "cryptoDonateHint": "Криптовалюта мен соманы таңдаңыз.",
    "kaspiPhoneHint": "Қазақстан банктерінің карталары үшін телефон нөмірі арқылы аударым",
    "bankTransfer": "Халықаралық банк аударымына арналған деректемелер",
    "bankRecipient": "Алушы",
    "bankName": "Банк",
    "ozonTransfer": "Ресейлік банк картасымен қолдау",
    "ozonBank": "Озон Банк",
    "copy": "Көшіру",
    "copied": "Көшірілді",
    "qrFor": "Мекенжайдың QR-коды",
    "fundsTitle": "Қолдау неге жұмсалады",
    "products": [
      {
        "id": "nomad360-ai",
        "title": "AI-маркетолог",
        "lead": "Маркетингті басқарудың интеллектуалды жүйесі. Бизнестің жарнамаға және маркетологқа жұмсайтын шығынын азайтады.",
        "items": [
          [
            "Зерттейді",
            "нарық пен аудиторияны"
          ],
          [
            "Жоспарлайды",
            "болжамдар мен науқандарды"
          ],
          [
            "Жасайды",
            "жарнамалық материалдарды"
          ],
          [
            "Талдайды",
            "науқан нәтижелерін"
          ],
          [
            "Есептейді",
            "мақсатқа сай бюджет пен шығын тиімділігін: сатылым өсімі, бренд танымалдығы немесе бір реттік науқан"
          ],
          [
            "Автоматтандырады",
            "күнделікті жұмысты: науқандар тезірек дайындалады, маркетингті басқару ашық әрі өлшенетін болады"
          ]
        ],
        "goal": "Мақсат: маркетингті басқарудың шығыны мен уақытын қысқарту. Әр шешім мен жарнама бюджеті сіздің бақылауыңызда қалады.",
        "slogan": "Сатып алғаныңызға ғана төлеңіз."
      },
      {
        "id": "nomad360-factory",
        "title": "Контент фабрикасы",
        "lead": "Маркетплейстерге арналған цифрлық тауарларды өндірудің автоматтандырылған жүйесі.",
        "items": [
          [
            "Зерттейді",
            "Краулер ассортимент, сұраныс және бәсеке туралы деректерді жинайды"
          ],
          [
            "Таңдайды",
            "Талдау перспективалы тауашаларды тауып, қандай тауар шығаруды анықтайды"
          ],
          [
            "Өндіреді",
            "Фабрика цифрлық тауарларды жасайды, карточкалар мен мұқабаларды рәсімдейді, сапаны тексереді"
          ],
          [
            "Жариялайды",
            "Тауарлар модерациядан өтіп, маркетплейсте жарияланады"
          ],
          [
            "Бақылайды",
            "қаралымдар, жүктеулер және сатылымдар"
          ],
          [
            "Түзетеді",
            "Нарық сигналдары бойынша ассортиментті, өндіріс жоспарын және даму стратегиясын өзгертеді"
          ]
        ],
        "goal": "",
        "slogan": "Өтімді тауарды сатып алыңыз."
      }
    ],
    "dataTitle": "Деректер және құпиялық",
    "dataCopy": "Есептеулер браузеріңізде орындалады. Қаржылық деректер құрылғыңызда қалады, нобайлар браузерде сақталады, PDF браузер арқылы жасалады. Сақталған есептерді жою үшін сайт деректерін тазалаңыз. Бетті жүктегенде Tailwind CDN және Google Fonts техникалық сұрау деректерін, соның ішінде IP мекенжайы мен браузер мәліметтерін алады. Қаржылық есеп деректері оларға берілмейді. NOWPayments қайырымдылық нысаны браузердің техникалық деректерін алады және нысанға енгізілген төлем мәліметтерін өңдейді.",
    "licenseTitle": "Лицензия және пайдалану",
    "licenseCopy": "Nomad360 lite «сол күйінде» тегін ұсынылады. Толық өзгертілмеген нұсқаны коммерциялық сайтта да жүктеп алып, орналастыруға болады, бірақ бренд, авторлық атрибуция, сілтемелер, байланыс деректері және жобаға қолдау көрсету ақпараты сақталуы тиіс. Өзгерту, қайта брендтеу және жеке нұсқа жасау үшін бөлек жазбаша келісім қажет. Кепілдік берілмейді.",
    "licenseLink": "Лицензияны оқу",
    "embedTitle": "Сайтыңызға арналған калькулятор",
    "embedB2BTitle": "Консалтингпен айналысасыз ба?",
    "embedB2BSlogan": "Nomad360 сіз бен клиенттеріңіздің уақытын үнемдеп, бәсекелестерден озып шығуға көмектеседі.",
    "embedB2BPoints": ["Біздің калькуляторды сайтыңызға орналастырып, мақсатты трафик тартыңыз.","Калькулятор арқылы өз нысандарыңызбен лидтер жинаңыз немесе пайдаланушылардың сұрақтарына онлайн-чатта жауап беріңіз.","Клиенттердің сұрауларын алғашқы байланысқа дейін саралап, нақты сұрақтарды талқылаңыз."],
    "embedB2BFocus": "нақты сұрақтарды",
    "trafficTitle": "Соңғы 14 күндегі GitHub репозиторийінің бірегей келушілері:",
    "embedButton": "Тегін нұсқаны жүктеу",
    "embedHint": "Кодты сайт редакторында JavaScript қолдайтын арнайы HTML-блок ретінде жариялаңыз. Автоматты жаңарту қолдау көрсетілмейді.",
    "customButton": "Жеке шешімге тапсырыс беру",
    "embedWorking": "HTML дайындалуда…",
    "embedReady": "HTML жүктеуге дайын",
    "embedRetryLead": "Егер жүктеу басталмаса,",
    "embedRetryAction": "осы жерді басыңыз",
    "embedError": "HTML жасау мүмкін болмады. Интернетті тексеріп, қайта көріңіз.",
    "officialTitle": "Ресми байланыс",
    "officialCopy": "Сұрақтар, ынтымақтастық және лицензия бойынша өтініштерге арналған жоба поштасы.",
    "unitNote": "* ш.б. — сіздің валютаңыздағы ақша.",
    "rights": "© 2026 Nomad360"
  }
});
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
  // RET-07A about icons: decorative local vectors; existing copy stays text.
  function aboutIcon(index) {
    const person='<circle cx="24" cy="25" r="10"/><path d="M8 68v-9c0-12 7-19 16-19s16 7 16 19v9M18 48l6 9 6-9"/>';
    const tools=[
      '<rect x="49" y="24" width="29" height="46" rx="4"/><path d="M55 32h17v8H55zM55 48h4m9 0h4m-17 9h4m9 0h4m-17 8h4m9 0h4"/>',
      '<circle cx="63" cy="46" r="17"/><circle cx="63" cy="46" r="8"/><path d="M63 46l17-21m-1 1h-8m8 0v8M24 8V3m-7 19h2m10 0h2"/>',
      '<rect x="45" y="24" width="36" height="36" rx="4"/><path d="M52 33h13m-13 7h21m-21 7h9m2 13v9m-11 0h22"/><path d="M68 12v10m-5-5h10"/>'
    ];
    return '<svg class="nomad-about-icon" viewBox="0 0 88 88" width="88" height="88" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'+person+'<g class="nomad-about-icon-tool">'+tools[index]+'</g></svg>';
  }
  // RET-07A about icons end.
  function infoMarkup(t) {
    return '<section id="nomad360-about" class="nomad-info-block" tabindex="-1">'+
      '<h2>'+esc(t.about)+'</h2>'+
      '<div class="nomad-about-opening"><p class="nomad-about-brand">'+esc(t.aboutBrand)+'</p><p class="nomad-about-motto">'+t.aboutMotto.map(line=>'<span>'+esc(line)+'</span>').join('')+'</p></div>'+
      '<ol class="nomad-about-flow" role="list">'+t.flow.map((step,index)=>'<li>'+aboutIcon(index)+'<h3>'+esc(step.title)+'</h3><p>'+esc(step.question)+'</p></li>').join('')+'</ol>'+
      '<p class="nomad-about-caption">'+esc(t.flowBefore)+'<em>'+esc(t.flowEmphasis)+'</em>'+esc(t.flowAfter)+'</p></section>'+
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
      (language()==='ru'?
        '<article class="nomad-pay nomad-pay-ozon" data-nomad-russian-support>'+
        '<span class="nomad-pay-label"><span class="nomad-ru-flag" aria-hidden="true">🇷🇺</span> '+esc(t.ozonTransfer)+'</span>'+
        '<p class="nomad-pay-hint">'+esc(t.ozonBank)+'</p>'+
        '<a class="nomad-pay-value" href="'+PAY.ozonTel+'">'+esc(PAY.ozon)+'</a>'+
        copyButton(t,PAY.ozon,t.ozonTransfer)+'</article>':'')+
      '<details class="nomad-pay nomad-pay-bank">'+
      '<summary class="nomad-fold-toggle"><span class="nomad-donate-globe" aria-hidden="true">🌐</span><span>'+esc(t.bankTransfer)+'</span><span class="nomad-fold-arrow" aria-hidden="true">⌄</span></summary>'+
      '<div class="nomad-bank-details">'+
      bankLine(t.bankRecipient,PAY.bankName)+bankLine(t.bankName,PAY.bank)+
      bankLine('SWIFT/BIC',PAY.swift)+bankLine('IBAN',PAY.iban)+
      '</div></details></div>';
  }
  // Retained for parity with historic source. The RU-only payment option is
  // now rendered alongside Kaspi in payFiat; this legacy disclosure is unused.
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
    const row=(label,free,own)=>'<tr><th scope="row">'+esc(label)+'</th><td>'+esc(free)+'</td><td>'+esc(own)+'</td></tr>';
    const c=t.comparison;
    // Inline SVG icons are decoration: every sales message stays translatable HTML.
    const b2bIcons=[
      '<rect x="5" y="9" width="38" height="30" rx="4"/><path d="M5 18h38M11 14h2m5 0h2m-6 14h20m-8-6 8 6-8 6"/>',
      '<path d="M8 10h23a5 5 0 0 1 5 5v15a5 5 0 0 1-5 5H19l-9 7v-7H8a5 5 0 0 1-5-5V15a5 5 0 0 1 5-5Z"/><path d="M12 19h15M12 26h9"/><circle cx="38" cy="34" r="7"/>',
      '<rect x="9" y="5" width="30" height="38" rx="4"/><path d="M16 15h16M16 23l4 4 7-8M16 35h16"/>'
    ];
    const b2bBenefits=t.embedB2BPoints.map((line,i)=>{
      const focus=t.embedB2BFocus;
      const at=focus?line.indexOf(focus):-1;
      const copy=at<0?esc(line):esc(line.slice(0,at))+'<em>'+esc(focus)+'</em>'+esc(line.slice(at+focus.length));
      return '<li class="nomad-embed-b2b-card"><span class="nomad-embed-b2b-number" aria-hidden="true">'+(i+1)+'</span>'+
        '<span class="nomad-embed-b2b-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'+b2bIcons[i]+'</svg></span>'+
        '<span class="nomad-embed-b2b-copy">'+copy+'</span></li>';
    }).join('');
    return '<div class="nomad-footer-inner">'+
      '<section id="nomad360-support" class="nomad-donate" tabindex="-1"><h2>'+esc(t.supportTitle)+'</h2><p class="nomad-donate-lead">'+esc(t.supportLead)+'</p>'+
      payHostedCrypto(t)+payFiat(t)+'</section>'+
      '<details class="nomad-footer-products" id="nomad360-product-details"><summary>'+esc(t.fundsTitle)+'</summary><div class="nomad-products-grid">'+t.products.map(p=>productMarkup(t,p)).join('')+'</div></details>'+
      '<section id="nomad360-embed" class="nomad-embed-actions" tabindex="-1" aria-labelledby="nomad360-embed-heading">'+
      '<div class="nomad-embed-b2b-banner"><div class="nomad-embed-b2b-header"><div class="nomad-embed-b2b-headcopy">'+
      '<h2 id="nomad360-embed-heading" class="nomad-embed-b2b-title">'+esc(t.embedB2BTitle)+'</h2>'+
      '<p class="nomad-embed-b2b-slogan">'+esc(t.embedB2BSlogan)+'</p></div>'+
      '<div class="nomad-embed-b2b-brand" aria-hidden="true"><span class="nomad-embed-b2b-logo-mask"><img src="./nomad360_wolf_open_circle.png" width="108" height="108" alt="" loading="lazy"></span></div></div>'+
      '<ol class="nomad-embed-b2b-benefits">'+b2bBenefits+'</ol></div>'+
      '<button type="button" class="nomad-embed-download nomad-embed-toggle" data-nomad-embed-toggle aria-expanded="false" aria-controls="nomad360-embed-comparison">'+esc(t.embedToggle)+'</button>'+
      '<div id="nomad360-embed-comparison" hidden><table class="nomad-embed-table" role="table"><caption class="nomad-sr">'+esc(c.caption)+'</caption><thead><tr><th scope="col">'+esc(c.feature)+'</th><th scope="col">'+esc(c.free)+'</th><th scope="col">'+esc(c.own)+'</th></tr></thead><tbody>'+
      row(c.cost,c.freePrice,c.paidPrice)+row(c.brand,c.nomadBrand,c.customerBrand)+row(c.seo,c.broadQueries,c.customerQueries)+row(c.leads,c.no,c.contacts)+
      '<tr><th scope="row">'+esc(c.action)+'</th><td><button type="button" class="nomad-embed-download" data-nomad-download-html>'+esc(t.embedButton)+'</button>'+
      '<div class="nomad-traffic-stats" data-nomad-traffic-stats aria-live="polite"><p class="nomad-traffic-counter"><span class="nomad-traffic-title">'+esc(t.trafficTitle)+'</span> <strong class="nomad-traffic-value" data-nomad-traffic-value>—</strong></p></div>'+
      '<span class="nomad-embed-status" data-nomad-embed-status role="status" aria-live="polite"></span>'+
      '<div class="nomad-embed-retry" data-nomad-embed-retry hidden>'+esc(t.embedRetryLead)+' <a class="nomad-embed-retry-link" data-nomad-retry-download download="'+embedFilename+'" href="#">'+esc(t.embedRetryAction)+'</a></div></td>'+
      '<td><a class="nomad-embed-contact" href="mailto:'+PAY.email+'?subject='+encodeURIComponent('Nomad360 — '+t.customButton)+'">'+esc(t.customButton)+'</a></td></tr></tbody></table><p class="nomad-embed-hint">'+esc(t.embedHint)+'</p></div></section>'+
      '<div class="nomad-footer-meta">'+
      '<details id="nomad360-license" class="nomad-meta-block" tabindex="-1"><summary>'+esc(t.licenseTitle)+'</summary><div class="nomad-license-terms"><p>'+esc(t.licenseCopy)+'</p><p><a href="https://kazartsevev.github.io/shelter-partner-directory/license/'+(language()==='en'?'en/':language()==='kk'?'kk/':'')+'" target="_blank" rel="noopener noreferrer">'+esc(t.licenseLink)+' ↗</a></p></div></details>'+
      '<details id="nomad360-data" class="nomad-meta-block" tabindex="-1"><summary>'+esc(t.dataTitle)+'</summary><p>'+esc(t.dataCopy)+'</p></details>'+
      '<section id="nomad360-official" class="nomad-meta-block"><p><span>'+esc(t.officialTitle)+'</span> <a class="nomad-official-mail" href="mailto:'+PAY.email+'">'+PAY.email+'</a></p></section></div>'+
      '<div class="nomad-footer-bottom"><p class="nomad-unit-note">'+esc(root.Nomad360Currency?.caption()||'USD')+'</p><span>'+esc(t.rights)+'</span></div>'+
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
    const opened=[...footer.querySelectorAll('details[open]')].map(e=>e.id);
    const comparisonOpen=footer.querySelector('[data-nomad-embed-toggle]')?.getAttribute('aria-expanded')==='true';
    footer.innerHTML=footerMarkup(COPY[language()]);
    for(const id of opened){const details=document.getElementById(id);if(details)details.open=true;}
    if(comparisonOpen){footer.querySelector('#nomad360-embed-comparison').hidden=false;footer.querySelector('[data-nomad-embed-toggle]').setAttribute('aria-expanded','true');}
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
        let css=await (await get(filename)).text();
        // CONSULTING-02: CSS is inlined into a portable standalone HTML file.
        // Keep the approved scenic artwork in that same file; relative url(...)
        // would otherwise break when a consultant hosts the embed elsewhere.
        if(filename==='./nomad360_consulting_banner.css'){
          const scenicUrls=[...new Set([...css.matchAll(/url\\(["']?(\\.\\/assets\\/nomad360-banners\\/consulting-horizontal-(?:desktop-3200x941|mobile-1200x1671)\\.svg)["']?\\)/g)].map(m=>m[1]))];
          if(scenicUrls.length!==2)throw new Error('Consulting artwork URL contract changed');
          for(const path of scenicUrls){
            const svg=await (await get(path)).blob();
            const data=await new Promise((resolve,reject)=>{
              const reader=new root.FileReader();
              reader.onload=()=>resolve(reader.result);
              reader.onerror=()=>reject(reader.error);
              reader.readAsDataURL(svg);
            });
            css=css.replaceAll(path,data);
          }
        }
        const inline=doc.createElement('style');
        inline.setAttribute('data-nomad-bundled',filename);
        inline.textContent=css.replace(/<\/style/gi,'<\\/style');
        link.replaceWith(inline);
      }
      // RET-07A: independent embeds do not promote shortcuts to the original host.
      doc.documentElement.setAttribute('data-nomad-embedded','');
      doc.querySelector('script[src$="nomad360_return.js"]')?.remove();
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
    // TASK-10 LOGO-01: recolor the existing PNG pixels in the browser, never redraw the wolf.
    // The original on-disk PNG is retained unchanged.
    // Anti-aliased edge pixels blend to white; solid source colors land exactly on
    // #173B58 (wolf/orbit), #FF913F (sun), or #FFFFFF (negative space).
    let wolfPaletteDataUrl=null;
    let wolfPalettePending=false;
    const WOLF_LOGO_SELECTOR='.nomad-logo-mask .nomad-logo, .nomad-seo-logo-mask .nomad-seo-logo, .nomad-embed-b2b-logo-mask img';
    function recolorSiteWolfLogo(){
      const nodes=document.querySelectorAll(WOLF_LOGO_SELECTOR);
      if(!nodes.length)return;
      if(wolfPaletteDataUrl){
        nodes.forEach(img=>{if(img.src!==wolfPaletteDataUrl)img.src=wolfPaletteDataUrl;});
        return;
      }
      if(wolfPalettePending)return;
      wolfPalettePending=true;
      const source=nodes[0].getAttribute('src');
      const original=new root.Image();
      original.onload=()=>{
        try{
          const canvas=document.createElement('canvas');
          canvas.width=original.naturalWidth;
          canvas.height=original.naturalHeight;
          const ctx=canvas.getContext('2d',{willReadFrequently:true});
          if(!ctx)throw new Error('Canvas 2D unavailable');
          ctx.drawImage(original,0,0);
          const bitmap=ctx.getImageData(0,0,canvas.width,canvas.height);
          const pixels=bitmap.data;
          // Color dominance, not geometric edge detection: original details stay intact.
          // Relative blue/orange strength preserves antialiasing of the source silhouette.
          for(let i=0;i<pixels.length;i+=4){
            if(!pixels[i+3])continue;
            const r=pixels[i],b=pixels[i+2];
            const steel=Math.min(1,Math.max(0,(b-r)/62));
            const sun=Math.min(1,Math.max(0,(r-b)/126));
            const white=Math.max(0,1-steel-sun);
            pixels[i]=Math.round(23*steel+255*sun+255*white);
            pixels[i+1]=Math.round(59*steel+145*sun+255*white);
            pixels[i+2]=Math.round(88*steel+63*sun+255*white);
          }
          ctx.putImageData(bitmap,0,0);
          wolfPaletteDataUrl=canvas.toDataURL('image/png');
          document.querySelectorAll(WOLF_LOGO_SELECTOR).forEach(img=>{img.src=wolfPaletteDataUrl;});
        }catch(error){
          // Keep the unmodified original visible if pixel access is disallowed.
          root.console?.warn('Nomad360 wolf recolor unavailable',error);
        }finally{
          wolfPalettePending=false;
        }
      };
      original.onerror=()=>{wolfPalettePending=false;};
      original.src=source;
    }


    // TASK-10: add a wrapper in the DOM without modifying renderHeader's
    // previously protected HTML and navigation contract.
    function fitOriginalWolfInHeader(){
      const img=document.querySelector('#nomad360-header .nomad-logo');
      if(!img||img.parentElement?.classList.contains('nomad-logo-mask'))return;
      const mask=document.createElement('span');
      mask.className='nomad-logo-mask';
      img.replaceWith(mask);
      mask.append(img);
    }
    renderInformation();renderFooter();renderHeader();fitOriginalWolfInHeader();recolorSiteWolfLogo();
    // SEO-07: reuse the header asset; the existing HTML bundler inlines this URL.
    const seoBanner=document.getElementById('nomad360-seo-banner');
    if(seoBanner&&!seoBanner.querySelector('.nomad-seo-logo'))seoBanner.insertAdjacentHTML('beforeend','<div class="nomad-seo-brand"><div class="nomad-seo-logo-mask"><img class="nomad-seo-logo" src="./nomad360_wolf_open_circle.png" alt="" width="140" height="140" loading="lazy"></div><h3 class="nomad-seo-tagline" lang="en"><span>Sky allows,</span> <span>guys deliver</span></h3></div>');
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
        if(target){for(let node=target;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;target.scrollIntoView({block:'start',behavior:'smooth'});}
      });
    });
    document.addEventListener('click',event=>{
      const toggle=event.target.closest('[data-nomad-embed-toggle]');
      if(toggle){const panel=document.getElementById(toggle.getAttribute('aria-controls'));panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));return;}
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
      renderInformation();renderFooter();renderHeader();fitOriginalWolfInHeader();recolorSiteWolfLogo();
    });
    document.addEventListener('nomad360:currencychange',renderFooter);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})(window);

