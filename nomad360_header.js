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
    "partnerUse": "Предложите посетителю рассчитать финансовый сценарий перед консультацией.",
    "partnerDetails": "Кому и для чего подходит",
    "offerDetails": "Состав и условия",
    "shortAgreement": "Цена ориентировочная. Требуется отдельное письменное соглашение.",
    "websiteLink": "Для вашего сайта",
    "partnerContext": "Дайте посетителям самостоятельно оценить финансовый сценарий и используйте его для разговора с клиентом. Инструмент может пригодиться и консультантам по регистрации компаний и релокации предпринимателей. Он не проверяет налоговое или миграционное соответствие и не гарантирует трафик или заявки.",
    "freeTitle": "Free Embed",
    "freeBenefit": "Разместите на сайте инструмент для расчёта финансовых сценариев ваших посетителей.",
    "freeCopy": "Разместите полный калькулятор Nomad360 lite на своём сайте бесплатно.",
    "freeTerms": "Полная неизменённая версия сохраняет бренд, авторство, сведения о продуктах, ссылки, контакты, поддержку разработчика и лицензию v2.3. Разрешено размещение на коммерческих сайтах. Индивидуальное SEO, доработки, автоматические обновления и обязательная поддержка не включены.",
    "paidTitle": "Версия под вашим брендом (White Label)",
    "paidPrice": "От €600",
    "paidBenefit": "Разместите финансовый калькулятор под брендом вашей компании.",
    "paidScope": "Ориентир разового пакета для одного согласованного проекта: ваше название и логотип, цвета, согласованные контакты, право удалить фирменные блоки и донаты Nomad360, подготовленная к размещению версия.",
    "paidAgreement": "Объём, число итераций, права, ограничения использования, сроки, цена, гарантии и приёмка определяются отдельным письменным соглашением. Указанная цена сама по себе не предоставляет лицензию.",
    "paidExtras": "По отдельной смете: поисковые тексты и SEO, новые языки, CRM, формы заявок и их серверный обработчик, интеграции, изменения финансовой модели, хостинг, обновления и сопровождение.",
    "mailHint": "Откроется черновик письма. Отправьте его из своей почты.",
    "mailSubject": "Запрос версии Nomad360 White Label",
    "mailBody": "Здравствуйте! Хочу обсудить версию Nomad360 под своим брендом.\nПроект / сайт:\nЖелаемые изменения:\nУдобный способ связи:\nПрошу согласовать объём, права, сроки и цену письменно.",
    "licensor": "Лицензиар: Евгений Казарцев · Юридические и лицензионные обращения:",
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
    "aboutLead": "Nomad360 разрабатывает программы для аналитики, автоматизации процессов и самостоятельного принятия решений.",
    "missionLabel": "Цель проекта",
    "mission": "Освобождать время от рутинных задач, чтобы вы могли сосредоточиться на главном.",
    "valueLabel": "Ценности",
    "value": "Время. Ясность. Самостоятельность.",
    "goalsLabel": "Цели",
    "goals": [
      "Сократить время на повторяющиеся операции.",
      "Дать инструменты для анализа и управленческих решений.",
      "Помогать принимать самостоятельные решения на основе понятных данных."
    ],
    "servicesLabel": "Продукты",
    "services": [
      [
        "Nomad360 lite",
        "Бесплатно · Работает"
      ],
      [
        "AI Marketer",
        "В разработке"
      ],
      [
        "Content Factory",
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
        "title": "AI Marketer",
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
        "title": "Content Factory",
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
    "dataCopy": "Основные финансовые расчёты выполняются в браузере. Черновики остаются в хранилище браузера; для их удаления очистите данные сайта. PDF, Excel и полный HTML для встраивания формируются локально. Tailwind CDN может получать технические данные запроса (IP-адрес и сведения о браузере); шрифты Inter включены в приложение. NOWPayments получает данные соединения и обрабатывает сведения о пожертвовании в своей форме. При запросе рыночного курса Frankfurter получает только выбранную валютную пару, без сумм и финансовой модели. С сайта может загружаться публичный снимок посещений GitHub-репозитория; он не измеряет использование калькулятора. Почтовые ссылки открывают вашу почтовую программу и ничего не отправляют автоматически. Новая маркетинговая аналитика и сбор заявок не подключены. У сторонних сервисов действуют собственные правила конфиденциальности.",
    "licenseTitle": "Лицензия и использование",
    "licenseCopy": "Nomad360 lite можно бесплатно использовать и встраивать в полном неизменённом виде, в том числе на коммерческих сайтах. Бренд Nomad360, атрибуция, сведения о продуктах, ссылки и возможности поддержки разработчика должны сохраняться. Для изменений и размещения под другим брендом требуется отдельное письменное разрешение. Предоставляется «как есть». Полные условия — по ссылке.",
    "licenseLink": "Полная лицензия v2.3",
    "embedTitle": "Ваши консультационные услуги. Наши технологии финансового моделирования.",
    "embedB2BTitle": "Для бизнес-консультантов, бухгалтеров и финансовых советников.",
    "trafficTitle": "Посетители GitHub-репозитория за последние 14 дней (не использование калькулятора):",
    "embedButton": "Встроить Nomad360 бесплатно",
    "embedHint": "Подсказка: опубликуйте код в редакторе сайта как кастомный блок. Автоматическое обновление не поддерживается. Требуется поддержка JavaScript.",
    "customButton": "Получить версию под свой бренд",
    "embedWorking": "Подготавливаем HTML…",
    "embedReady": "HTML готов к скачиванию",
    "embedRetryLead": "Если загрузка не началась,",
    "embedRetryAction": "нажмите здесь",
    "embedError": "Не удалось собрать HTML. Проверьте подключение и попробуйте ещё раз.",
    "officialTitle": "Официальный контакт",
    "officialCopy": "Почта проекта для вопросов, сотрудничества и обращений по лицензии.",
    "unitNote": "* у.е. — деньги в вашей валюте.",
    "rights": "© 2026 Евгений Казарцев (Evgenii Kazartsev) · Nomad360"
  },
  "en": {
    "partnerUse": "Let visitors calculate a financial scenario before their consultation.",
    "partnerDetails": "Where you can use it",
    "offerDetails": "What is included and terms",
    "shortAgreement": "Indicative price. Separate written agreement required.",
    "websiteLink": "For Your Website",
    "partnerContext": "Let visitors explore a financial scenario and use it as a starting point for a consultation. Company formation and entrepreneur relocation advisors may also find it useful. This does not verify tax or immigration compliance or guarantee traffic or leads.",
    "freeTitle": "Free Embed",
    "freeBenefit": "Give your visitors a practical financial calculator on your website.",
    "freeCopy": "Add the complete Nomad360 lite calculator to your website for free.",
    "freeTerms": "The complete, unmodified edition retains branding, attribution, product information, links, contacts, developer support options and licence v2.3. Commercial websites are welcome. No custom SEO, changes, automatic updates or support obligation are included.",
    "paidTitle": "Your-brand edition (White Label)",
    "paidPrice": "From €600",
    "paidBenefit": "Offer financial scenario planning under your own brand.",
    "paidScope": "Indicative one-time package for one agreed project: your name and logo, colours, agreed contacts, permission to remove Nomad360 brand blocks and donations, and a version prepared for hosting.",
    "paidAgreement": "Scope, iteration count, rights, usage limits, timeline, price, warranties and acceptance require a separate written agreement. The advertised price does not grant a licence.",
    "paidExtras": "Quoted separately: search copy and SEO, new languages, CRM, lead forms and their server handler, integrations, financial-model changes, hosting, updates and maintenance.",
    "mailHint": "Opens an email draft. Send it from your email app.",
    "mailSubject": "Nomad360 White Label enquiry",
    "mailBody": "Hello! I would like to discuss a Nomad360 edition for my brand.\nProject / website:\nRequested changes:\nPreferred contact:\nPlease confirm scope, rights, timeline and price in a written agreement.",
    "licensor": "Licensor: Evgenii Kazartsev · Legal and licensing notices:",
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
    "aboutLead": "Nomad360 develops software for analytics, process automation and independent decision-making.",
    "missionLabel": "Project Goal",
    "mission": "Free up time spent on routine tasks so you can focus on what matters.",
    "valueLabel": "What We Value",
    "value": "Time. Clarity. Independence.",
    "goalsLabel": "Goals",
    "goals": [
      "Cut the time spent on repetitive operations.",
      "Provide tools for analysis and management decisions.",
      "Support independent decisions using clear data."
    ],
    "servicesLabel": "Our Products",
    "services": [
      [
        "Nomad360 lite",
        "Free · Available now"
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
    "contact": "Contact",
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
    "dataCopy": "Core financial calculations run in your browser. Drafts stay in browser storage; clear site data to delete them. PDF, Excel and the complete embed HTML are generated locally. Tailwind CDN may receive technical request data (IP address and browser details); Inter fonts are bundled. NOWPayments receives browser connection data and processes donation details in its own form. Frankfurter receives only the selected currency pair when you request a market rate, not amounts or the financial model. A public GitHub repository traffic snapshot may load from this site; it does not measure calculator use. Email links open your email app and send nothing automatically. No new marketing analytics or lead collection is connected. These third-party services follow their own privacy policies.",
    "licenseTitle": "License and usage",
    "licenseCopy": "Nomad360 lite is free to use and embed in its complete, unmodified form, including on commercial websites. Nomad360 branding, attribution, product information, links and developer support options must remain visible and functional. Modifications, rebranding and removal of these elements require separate written permission. Provided “as is”; see the full licence.",
    "licenseLink": "Full licence v2.3",
    "embedTitle": "Your consulting expertise. Our financial modelling technology.",
    "embedB2BTitle": "For business consultants, accountants and advisors.",
    "trafficTitle": "GitHub repository visitors over the last 14 days (not calculator usage):",
    "embedButton": "Embed Nomad360 for Free",
    "embedHint": "Add the code as a custom HTML block in your website editor with JavaScript enabled. Automatic updates are not supported.",
    "customButton": "Get Nomad360 for Your Brand",
    "embedWorking": "Preparing HTML…",
    "embedReady": "HTML download ready",
    "embedRetryLead": "If the download did not start,",
    "embedRetryAction": "click here",
    "embedError": "Could not prepare HTML. Check your connection and try again.",
    "officialTitle": "Official contact",
    "officialCopy": "Project email for questions, cooperation and licence enquiries.",
    "unitNote": "* currency units — amounts are shown in your chosen currency.",
    "rights": "© 2026 Evgenii Kazartsev · Nomad360"
  },
  "kk": {
    "partnerUse": "Келушіге кеңес алмас бұрын қаржылық сценарийді есептеуді ұсыныңыз.",
    "partnerDetails": "Кімге және не үшін арналған",
    "offerDetails": "Құрамы мен шарттары",
    "shortAgreement": "Баға бағдар ретінде берілген. Бөлек жазбаша келісім қажет.",
    "websiteLink": "Сайтыңызға арналған",
    "partnerContext": "Келушілерге қаржылық сценарийді өз бетінше бағалауға мүмкіндік беріп, оны клиентпен кеңесуге негіз етіңіз. Құрал компания тіркеу және кәсіпкерлердің қоныс аударуы жөніндегі кеңесшілерге де пайдалы болуы мүмкін. Ол салық не көші-қон талаптарына сәйкестікті тексермейді және трафикке не өтінімдерге кепілдік бермейді.",
    "freeTitle": "Free Embed",
    "freeBenefit": "Сайтыңызға келушілердің қаржылық сценарийлерін есептеуге арналған құрал орналастырыңыз.",
    "freeCopy": "Толық Nomad360 lite калькуляторын сайтыңызға тегін орналастырыңыз.",
    "freeTerms": "Толық әрі өзгертілмеген нұсқада бренд, авторлық мәлімет, өнімдер туралы ақпарат, сілтемелер, байланыс, әзірлеушіні қолдау мүмкіндіктері және v2.3 лицензиясы сақталады. Коммерциялық сайттарға орналастыруға болады. Жеке SEO, өзгерістер, автоматты жаңарту және міндетті қолдау кірмейді.",
    "paidTitle": "Өз брендіңіздегі нұсқа (White Label)",
    "paidPrice": "€600 бастап",
    "paidBenefit": "Қаржылық калькуляторды компанияңыздың брендімен орналастырыңыз.",
    "paidScope": "Бір келісілген жобаға арналған біржолғы пакеттің бағдары: сіздің атауыңыз бен логотипіңіз, түстер, келісілген байланыс деректері, Nomad360 бренд блоктары мен қолдау мүмкіндіктерін алып тастауға рұқсат және орналастыруға дайын нұсқа.",
    "paidAgreement": "Көлемі, түзету саны, құқықтар, пайдалану шектеулері, мерзім, баға, кепілдіктер және қабылдау бөлек жазбаша келісіммен анықталады. Көрсетілген баға өздігінен лицензия бермейді.",
    "paidExtras": "Бөлек смета бойынша: іздеу мәтіндері мен SEO, жаңа тілдер, CRM, өтінім нысандары және олардың серверлік өңдеуі, интеграциялар, қаржылық модель өзгерістері, хостинг, жаңарту және сүйемелдеу.",
    "mailHint": "Хат нобайы ашылады. Оны пошта бағдарламаңыздан өзіңіз жіберіңіз.",
    "mailSubject": "Nomad360 White Label нұсқасы туралы сұрау",
    "mailBody": "Сәлеметсіз бе! Өз брендімдегі Nomad360 нұсқасын талқылағым келеді.\nЖоба / сайт:\nҚажетті өзгерістер:\nЫңғайлы байланыс тәсілі:\nКөлемді, құқықтарды, мерзімді және бағаны жазбаша келісуді сұраймын.",
    "licensor": "Лицензиар: Evgenii Kazartsev · Құқықтық және лицензиялық өтініштер:",
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
    "about": "Nomad360 туралы",
    "aboutLead": "Nomad360 аналитикаға, процестерді автоматтандыруға және өз бетінше шешім қабылдауға арналған бағдарламалар әзірлейді.",
    "missionLabel": "Жобаның мақсаты",
    "mission": "Маңызды істерге көңіл бөлу үшін күнделікті қайталанатын жұмыстан уақыт босату.",
    "valueLabel": "Құндылықтар",
    "value": "Уақыт. Айқындық. Дербестік.",
    "goalsLabel": "Мақсаттар",
    "goals": [
      "Қайталанатын операцияларға кететін уақытты қысқарту.",
      "Талдау мен басқарушылық шешімдерге арналған құралдар беру.",
      "Түсінікті деректерге сүйеніп, өз бетінше шешім қабылдауға көмектесу."
    ],
    "servicesLabel": "Өнімдер",
    "services": [
      [
        "Nomad360 lite",
        "Тегін · Қолжетімді"
      ],
      [
        "AI Marketer",
        "Әзірленуде"
      ],
      [
        "Content Factory",
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
        "title": "AI Marketer",
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
        "title": "Content Factory",
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
    "dataCopy": "Негізгі қаржылық есептеулер браузерде орындалады. Нобайлар браузер жадында қалады; оларды жою үшін сайт деректерін тазалаңыз. PDF, Excel және енгізуге арналған толық HTML жергілікті жасалады. Tailwind CDN сұраудың техникалық деректерін (IP-мекенжай, браузер мәліметі) алуы мүмкін; Inter қаріптері қолданбаға енгізілген. NOWPayments қосылым деректерін алып, қайырымдылық мәліметтерін өз нысанында өңдейді. Нарықтық бағамды сұрағанда Frankfurter тек таңдалған валюта жұбын алады, сомалар мен қаржылық модель берілмейді. Сайттан GitHub репозиторийі келушілерінің ашық деректері жүктелуі мүмкін; бұл калькуляторды пайдалануды өлшемейді. Пошта сілтемелері пошта бағдарламаңызды ашады және ештеңені автоматты түрде жібермейді. Жаңа маркетинг аналитикасы мен өтінім жинау қосылмаған. Үшінші тарап қызметтерінің өз құпиялылық ережелері қолданылады.",
    "licenseTitle": "Лицензия және пайдалану",
    "licenseCopy": "Nomad360 lite калькуляторын толық әрі өзгертілмеген күйінде, соның ішінде коммерциялық сайттарға да тегін енгізуге болады. Nomad360 бренді, атрибуция, өнімдер туралы мәлімет, сілтемелер және әзірлеушіні қолдау мүмкіндіктері сақталуға тиіс. Өзгерту және басқа брендпен тарату үшін бөлек жазбаша рұқсат қажет. «Сол күйінде» ұсынылады. Толық шарттар сілтемеде.",
    "licenseLink": "Толық v2.3 лицензиясы",
    "embedTitle": "Сіздің кеңес беру қызметіңіз. Біздің қаржылық модельдеу технологиямыз.",
    "embedB2BTitle": "Бизнес-консультанттарға, бухгалтерлерге және қаржылық кеңесшілерге арналған.",
    "trafficTitle": "Соңғы 14 күндегі GitHub репозиторийінің келушілері (калькуляторды пайдалану емес):",
    "embedButton": "Nomad360 калькуляторын тегін енгізу",
    "embedHint": "Кодты сайт редакторында JavaScript қолдайтын арнайы HTML-блок ретінде жариялаңыз. Автоматты жаңарту қолдау көрсетілмейді.",
    "customButton": "Өз брендіңізге арналған Nomad360 нұсқасын алу",
    "embedWorking": "HTML дайындалуда…",
    "embedReady": "HTML жүктеуге дайын",
    "embedRetryLead": "Егер жүктеу басталмаса,",
    "embedRetryAction": "осы жерді басыңыз",
    "embedError": "HTML жасау мүмкін болмады. Интернетті тексеріп, қайта көріңіз.",
    "officialTitle": "Ресми байланыс",
    "officialCopy": "Сұрақтар, ынтымақтастық және лицензия бойынша өтініштерге арналған жоба поштасы.",
    "unitNote": "* ш.б. — сіздің валютаңыздағы ақша.",
    "rights": "© 2026 Evgenii Kazartsev · Nomad360"
  }
});
  const TARGETS = ['home-screen','nomad360-ai','nomad360-factory','nomad360-about','nomad360-contacts','nomad360-for-website'];
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
      '<div class="nomad-support-grid">'+payHostedCrypto(t)+'<div class="nomad-support-methods">'+payFiat(t)+payRussian(t)+'</div></div></section>'+
      '<section class="nomad-footer-products"><h3>'+esc(t.fundsTitle)+'</h3><div class="nomad-products-grid">'+
      t.products.map(p=>productMarkup(t,p)).join('')+'</div></section>'+
      '<section id="nomad360-for-website" class="nomad-partners" tabindex="-1" aria-labelledby="nomad360-partner-title">'+
      '<h2 id="nomad360-partner-title">'+esc(t.embedTitle)+'</h2>'+
      '<p class="nomad-partner-audience">'+esc(t.embedB2BTitle)+'</p><p>'+esc(t.partnerUse)+'</p>'+
      '<div class="nomad-partner-cards">'+
      '<article class="nomad-partner-card nomad-free-edition"><h3>'+esc(t.freeTitle)+'</h3><p class="nomad-edition-price">€0</p>'+
      '<p>'+esc(t.freeBenefit)+'</p><details class="nomad-offer-details"><summary>'+esc(t.offerDetails)+'</summary><p>'+esc(t.freeCopy)+'</p><p>'+esc(t.freeTerms)+'</p></details>'+
      '<div class="nomad-embed-actions"><button type="button" class="nomad-embed-download" data-nomad-download-html>'+esc(t.embedButton)+'</button>'+
      '<span class="nomad-embed-status" data-nomad-embed-status role="status" aria-live="polite"></span>'+
      '<div class="nomad-embed-retry" data-nomad-embed-retry hidden>'+esc(t.embedRetryLead)+' '+
      '<a class="nomad-embed-retry-link" data-nomad-retry-download download="'+embedFilename+'" href="#">'+esc(t.embedRetryAction)+'</a></div>'+
      '<p class="nomad-embed-hint">'+esc(t.embedHint)+'</p></div></article>'+
      '<article class="nomad-partner-card nomad-paid-edition"><h3>'+esc(t.paidTitle)+'</h3><p class="nomad-edition-price">'+esc(t.paidPrice)+'</p>'+
      '<p>'+esc(t.paidBenefit)+'</p><p>'+esc(t.shortAgreement)+'</p><details class="nomad-offer-details"><summary>'+esc(t.offerDetails)+'</summary><p>'+esc(t.paidScope)+'</p><p>'+esc(t.paidAgreement)+'</p><p>'+esc(t.paidExtras)+'</p></details>'+
      '<a class="nomad-embed-contact" href="mailto:'+PAY.email+'?subject='+encodeURIComponent(t.mailSubject)+'&amp;body='+encodeURIComponent(t.mailBody)+'">'+esc(t.customButton)+'</a>'+
      '<p class="nomad-embed-hint">'+esc(t.mailHint)+'</p></article></div>'+
      '<details class="nomad-offer-details nomad-partner-conditions"><summary>'+esc(t.partnerDetails)+'</summary><p>'+esc(t.partnerContext)+'</p></details></section>'+
      '<div class="nomad-footer-meta">'+
      '<section id="nomad360-license" class="nomad-meta-block" tabindex="-1">'+
      '<div class="nomad-license-terms"><h3>'+esc(t.licenseTitle)+'</h3><p>'+esc(t.licenseCopy)+'</p>'+
      '<p>'+esc(t.licensor)+' <a href="mailto:'+PAY.email+'">'+PAY.email+'</a></p>'+
      '<p><a href="https://github.com/KazartsevEV/shelter-partner-directory/blob/main/CALCULATOR_LICENSE.md" target="_blank" rel="noopener noreferrer">'+esc(t.licenseLink)+' ↗</a></p></div></section>'+
      '<section id="nomad360-data" class="nomad-meta-block" tabindex="-1"><h3>'+esc(t.dataTitle)+'</h3><p>'+esc(t.dataCopy)+'</p></section>'+
      '<section id="nomad360-official" class="nomad-meta-block"><h3>'+esc(t.officialTitle)+'</h3><p>'+esc(t.officialCopy)+'</p>'+
      '<p><a class="nomad-official-mail" href="mailto:'+PAY.email+'">'+PAY.email+'</a></p>'+
      '<div class="nomad-traffic-stats" data-nomad-traffic-stats aria-live="polite"><p class="nomad-traffic-counter"><span class="nomad-traffic-title">'+esc(t.trafficTitle)+'</span> '+
      '<strong class="nomad-traffic-value" data-nomad-traffic-value>—</strong></p></div></section></div>'+
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
     dependencies. Tailwind CDN stays external; Inter fonts are bundled in the CSS.
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
      t.nav.concat(t.websiteLink).map((label,i)=>'<a href="#'+TARGETS[i]+'" data-nomad-go="'+TARGETS[i]+'"'+(i===0?' aria-current="page"':'')+'>'+esc(label)+'</a>').join('')+
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
      event.preventDefault();
      const targetId=a.getAttribute('data-nomad-go');
      if(targetId==='home-screen'&&typeof root.showHome==='function')root.showHome();
      closeMenu(false);
      // Keep the navigation interaction functional for every calculator branch.
      root.requestAnimationFrame(()=>{
        const target=document.getElementById(targetId);
        if(target){
          if(targetId==='nomad360-for-website')target.focus({preventScroll:true});
          target.scrollIntoView({block:'start',behavior:root.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
        }
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
    document.addEventListener('nomad360:currencychange',renderFooter);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})(window);

