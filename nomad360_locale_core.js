/* #47 — Browser-only application-string localization foundation.
 * Display DOM only. Never rewrite inputs, data field names, V1/V2 models,
 * saved calculation payloads, numeric text, source identities or URLs.
 * Russian source strings are the stable canonical keys.
 */
(function(root){
'use strict';
const rows=[
 ['Юнит-экономика','Unit economics','Бірлік экономикасы'],
 ['Калькулятор моего бизнеса','My business calculator','Менің бизнес-калькуляторым'],
 ['Заполните свои цифры с нуля. Калькулятор рассчитает расходы, цену товара, налоги и денежный поток по месяцам. Ни одного тестового товара в вашем расчёте.','Enter your own numbers. Calculate costs, prices, taxes and monthly cash flow. No demo products will be added to your calculation.','Өз мәліметтеріңізді енгізіңіз. Шығындарды, бағаларды, салықтарды және айлық ақша ағынын есептеңіз. Есепке үлгі тауарлар қосылмайды.'],
 ['+ Рассчитать СВОИ товары','+ Calculate MY products','+ ӨЗ тауарларымды есептеу'],
 ['Ваш расчёт сохранён в этом браузере','Your calculation is saved in this browser','Есебіңіз осы браузерде сақталған'],
 ['Продолжить и редактировать мои товары','Continue editing my products','Тауарларымды өңдеуді жалғастыру'],
 ['Доступно в этом браузере и на этом устройстве. Другой телефон по этой ссылке не увидит ваш сохранённый расчёт.','Stored only in this browser on this device. The link cannot restore this calculation on another phone.','Тек осы құрылғыдағы браузерде сақталады. Басқа телефон бұл сілтеме арқылы сақталған есепті көрмейді.'],
 ['Посмотреть, что будет рассчитываться','See what the calculator covers','Ненің есептелетінін көру'],
 ['Название товара и подробная калькуляция собственного производства.','Product names and detailed own-production costs.','Тауар атауы және өз өндірісінің толық өзіндік құны.'],
 ['Материалы или закупка, производство, работники, оборудование, документы.','Materials or purchases, production, staff, equipment and documents.','Материалдар немесе сатып алу, өндіріс, қызметкерлер, жабдықтар және құжаттар.'],
 ['Логистика и хранение до продажи последнего товара.','Logistics and storage until the final item is sold.','Соңғы тауар сатылғанға дейінгі логистика мен сақтау.'],
 ['Продажи, комиссии, рекламная воронка и цена привлечения покупателя.','Sales, commissions, marketing funnel and customer acquisition cost.','Сатылымдар, комиссиялар, жарнама воронкасы және клиент тарту құны.'],
 ['Налоги, резерв денег, кредит и цена с желаемой маржинальностью.','Taxes, cash reserves, financing and a price targeting your margin.','Салықтар, ақша резерві, несие және мақсатты маржаға сай баға.'],
 ['Рентабельность бизнеса, cash flow по месяцам и свободный денежный остаток.','Business profitability, monthly cash flow and available cash.','Бизнес табыстылығы, айлық ақша ағыны және қолжетімді ақша қалдығы.'],
 ['Основная форма последовательно рассчитывает себестоимость материалов и производства, логистику, рекламную воронку, необходимый капитал, кредит, цену товара и денежный поток.','The main form calculates material and production costs, logistics, acquisition funnel, required capital, credit, price and cash flow in sequence.','Негізгі форма материалдар мен өндіріс құнын, логистиканы, тарту воронкасын, қажетті капиталды, несиені, бағаны және ақша ағынын кезекпен есептейді.'],
 ['Сохранённый портфель V2 из моих товаров','My saved V2 product portfolio','Сақталған V2 тауарлар портфелім'],
 ['Связанный портфель использует значения и диапазоны цен из завершённых карточек V1.','The linked portfolio reuses values and price bounds from completed V1 cards.','Байланысқан портфель аяқталған V1 карточкаларындағы мәндер мен баға шектерін пайдаланады.'],
 ['Продолжить мой портфель V2','Resume my V2 portfolio','V2 портфелімді жалғастыру'],
 ['Экспериментальная портфельная модель v2 (отдельный режим)','Experimental portfolio model V2 (separate mode)','Эксперименттік V2 портфель моделі (бөлек режим)'],
 ['Основная пошаговая форма находится выше. Экспериментальную модель можно открыть отдельно; её сохранения не заменяют расчёты основной формы.','The main step-by-step calculator is above. The experimental model opens separately and never overwrites the main calculation.','Негізгі қадамдық калькулятор жоғарыда. Эксперименттік модель бөлек ашылады және негізгі есепті алмастырмайды.'],
 ['Открыть экспериментальную модель v2 →','Open experimental model V2 →','Эксперименттік V2 моделін ашу →'],
 ['Сохранённый черновик экспериментальной модели v2','Saved experimental V2 draft','Сақталған эксперименттік V2 нобайы'],
 ['Отдельная экспериментальная форма. Она не заменяет основной пошаговый расчёт.','Separate experimental form; the main calculation is not replaced.','Бөлек эксперименттік форма; негізгі есеп алмастырылмайды.'],
 ['Продолжить черновик v2','Resume V2 draft','V2 нобайын жалғастыру'],
 ['Или посмотреть заполненный учебный пример','Or explore a filled-in example','Немесе толтырылған мысалды қарау'],
 ['Пример открывается отдельно и не заменяет ваш товар.','The example opens separately without replacing your product.','Мысал бөлек ашылады және тауарларыңызды алмастырмайды.'],
 ['Посмотреть пример шоппера →','View tote bag example →','Шоппер үлгісін қарау →'],
 ['У меня услуга, не товар →','I sell a service, not a product →','Мен тауар емес, қызмет сатамын →'],
 ['← Главная','← Home','← Басты бет'],
 ['Товар / услуга → Услуга','Product / service → Service','Тауар / қызмет → Қызмет'],
 ['Я работаю:','I work:','Мен жұмыс істеймін:'],
 ['Онлайн','Online','Онлайн'],
 ['Офлайн','Offline','Офлайн'],
 ['Я сам · Нанимаю другого · Я агент. Существующий калькулятор без изменений.','I do it · I hire someone · I am an agent. The existing calculator remains unchanged.','Өзім істеймін · Орындаушы жалдаймын · Агентпін. Қолданыстағы калькулятор өзгермейді.'],
 ['Например, ногтевой сервис: расходники, аренда, мастера, оборудование и реклама. Нет производства, склада и доставки.','For example, a nail salon: consumables, rent, staff, equipment and marketing. No production, inventory or delivery.','Мысалы, маникюр салоны: шығыс материалдары, жалдау, шеберлер, жабдық және жарнама. Өндіріс, қойма және жеткізу жоқ.'],
 ['← Онлайн / офлайн','← Online / offline','← Онлайн / офлайн'],
 ['Услуга · Онлайн','Service · Online','Қызмет · Онлайн'],
 ['Кто исполнитель услуги?','Who delivers the service?','Қызметті кім орындайды?'],
 ['Выберите, как устроены деньги между клиентом, вами и исполнителем.','Choose how money flows between the client, you and the service provider.','Клиент, сіз және орындаушы арасындағы төлем тәртібін таңдаңыз.'],
 ['Я сам','I do it myself','Өзім жасаймын'],
 ['Старый калькулятор без изменений бизнес-логики.','The existing calculator retains its business logic.','Бұрынғы калькулятордың бизнес-логикасы өзгермейді.'],
 ['Нанимаю другого','I hire someone else','Басқа орындаушыны жалдаймын'],
 ['Добавляем оплату исполнителю как расход.','Service provider payments count as expenses.','Орындаушыға төлем шығыс ретінде есептеледі.'],
 ['Я агент','I am an agent','Мен агентпін'],
 ['Привлекаю клиентов другим и получаю вознаграждение.','I bring customers to others and receive a commission.','Басқаларға клиент тартып, сыйақы аламын.'],
 ['← К выбору исполнителя','← Back to provider choice','← Орындаушыны таңдауға қайту'],
 ['Агентская модель','Agency model','Агенттік модель'],
 ['Как мне платят?','How am I paid?','Маған қалай төлейді?'],
 ['В расчёте по каждому прямому расходу можно выбрать плательщика:','Choose who pays each direct expense:','Әрбір тікелей шығынды кім төлейтінін таңдаңыз:'],
 ['Партнёр','Partner','Серіктес'],
 ['Мне платят % с объёма продаж','I get a percentage of sales','Сатылым көлемінен пайыз аламын'],
 ['Калькулятор вычислит ваш доход из общего объёма продаж.','The calculator derives your commission from total sales.','Калькулятор жалпы сатылымнан комиссияңызды есептейді.'],
 ['У меня сложная система мотивации','I have a complex incentive scheme','Менің сыйақы жүйем күрделі'],
 ['Обсудить отдельную модель расчёта.','Discuss a custom calculation model.','Жеке есептеу моделін талқылау.'],
 ['← Назад','← Back','← Артқа'],
 ['Кастомная модель','Custom model','Жеке модель'],
 ['Сложная система мотивации','Complex incentive scheme','Күрделі сыйақы жүйесі'],
 ['Связаться с разработчиком','Contact the developer','Әзірлеушімен байланысу'],
 ['ДЕМО: калькулятор заполнен реальными тестовыми числами','DEMO: prefilled with sample figures','ДЕМО: үлгі деректермен толтырылған'],
 ['↑ Все заполненные поля','↑ All filled fields','↑ Барлық толтырылған өрістер'],
 ['↓ Cash flow по месяцам','↓ Monthly cash flow','↓ Айлық ақша ағыны'],
 ['✎ Редактировать товар 1','✎ Edit product 1','✎ 1-тауарды өңдеу'],
 ['Без кредита · 5 мес.','No loan · 5 months','Несие жоқ · 5 ай'],
 ['В кредит · 6 мес.','With loan · 6 months','Несиемен · 6 ай'],
 ['+ Рассчитать СВОЙ товар с нуля','+ Calculate MY product from scratch','+ Өз тауарымды басынан есептеу'],
 ['Товар','Product','Тауар'],
 ['Что продаёте?','What are you selling?','Не сатасыз?'],
 ['Наименование товара','Product name','Тауар атауы'],
 ['Введите наименование товара.','Enter the product name.','Тауар атауын енгізіңіз.'],
 ['Введите название своего товара. Сведения из учебных примеров сюда не переносятся.','Enter your product name. No sample data is copied here.','Тауар атауын енгізіңіз. Үлгі деректері мұнда көшірілмейді.'],
 ['Рассчитать мой товар','Calculate my product','Тауарымды есептеу'],
 ['* у.е. — деньги в вашей валюте.','* Currency units are amounts in your own currency.','* Шартты бірлік — өз валютаңыздағы ақша.'],
 ['← Назад к итогам бизнеса','← Back to business results','← Бизнес нәтижелеріне қайту'],
 ['Откуда берёте','Where do you source it?','Қайдан аласыз?'],
 ['Делаю сам','I make it','Өзім өндіремін'],
 ['Покупаю у других','I buy it from others','Басқалардан сатып аламын'],
 ['Закупка готового товара без производства','Buy finished goods without manufacturing','Дайын тауарды өндіріссіз сатып алу'],
 ['Дропшиппинг','Dropshipping','Дропшиппинг'],
 ['Покупаю под заказ, поставщик доставляет покупателю','Supplier fulfills and delivers orders directly to customers','Жеткізуші тапсырысты тікелей сатып алушыға жеткізеді'],
 ['Офлайн-услуга','Offline service','Офлайн қызмет'],
 ['Маникюр, парикмахерская, массаж: аренда, расходники и мастера','Nails, haircuts, massage: rent, consumables and specialists','Маникюр, шаштараз, массаж: жалдау, материалдар және шеберлер'],
 ['Для дропшиппинга выберите поставщика, стоимость исполнения заказа и срок доставки.','For dropshipping, enter supplier, order fulfillment cost and delivery time.','Дропшиппинг үшін жеткізушіні, тапсырысты орындау құнын және жеткізу мерзімін енгізіңіз.'],
 ['Ваш товар — сохраните черновик в любой момент','Your product — save a draft anytime','Тауарыңыз — нобайды кез келген уақытта сақтаңыз'],
 ['Черновик производства, закупки или дропшиппинга можно сохранить и продолжить позже.','Save your production, resale or dropshipping draft and return later.','Өндіріс, сатып алу немесе дропшиппинг нобайын сақтап, кейін жалғастырыңыз.'],
 ['Сохранить мой товар и продолжить позже','Save my product for later','Тауарымды сақтап, кейін жалғастыру'],
 ['Новый товар','New product','Жаңа тауар'],
 ['Как называется этот товар?','What is this product called?','Бұл тауар қалай аталады?'],
 ['Введите название товара.','Enter a product name.','Тауар атауын енгізіңіз.'],
 ['Себестоимость','Cost','Өзіндік құн'],
 ['Из чего состоит себестоимость','What makes up the cost?','Өзіндік құн неден тұрады?'],
 ['Себестоимость минимальной партии готового товара','Cost of minimum finished-goods batch','Дайын тауардың ең аз партиясының өзіндік құны'],
 ['Количество готовых единиц в минимальной партии','Finished units in minimum batch','Ең аз партиядағы дайын дана саны'],
 ['Себестоимость минимальной партии, у.е.*','Minimum batch cost, currency units*','Ең аз партия құны, ш.б.*'],
 ['Поставщик (необязательно)','Supplier (optional)','Жеткізуші (міндетті емес)'],
 ['Ссылка на товар (необязательно)','Product link (optional)','Тауар сілтемесі (міндетті емес)'],
 ['Закупочная цена 1 ед.','Purchase cost per unit','Бір дананың сатып алу құны'],
 ['Состав моего заказа по отдельным товарам','Order contents by product','Тапсырысымдағы жеке тауарлар'],
 ['+ Добавить ещё один товар в заказ','+ Add another product to the order','+ Тапсырысқа тағы бір тауар қосу'],
 ['Как задаём себестоимость материалов?','How are material costs entered?','Материалдардың өзіндік құнын қалай енгіземіз?'],
 ['Точно знаю, почём купить','I know the price','Сатып алу бағасын білемін'],
 ['Надо считать','Calculate it','Есептеу керек'],
 ['Себестоимость материалов на единицу, у.е.*','Material cost per unit, currency units*','Бір данаға материал құны, ш.б.*'],
 ['Добавьте все материалы для 1 единицы','List all materials for one unit','Бір данаға қажетті барлық материалды қосыңыз'],
 ['+ Добавить материал','+ Add material','+ Материал қосу'],
 ['Материалы на 1 единицу, у.е.*','Materials per unit, currency units*','Бір данаға материал, ш.б.*'],
 ['НДС уже включён в себестоимость материалов?','Is VAT already included in material cost?','ҚҚС материал құнына енгізілген бе?'],
 ['Да','Yes','Иә'],['Нет','No','Жоқ'],
 ['Ставка НДС на материалы, %','Material VAT rate, %','Материалдарға ҚҚС мөлшерлемесі, %'],
 ['Если НДС не применяется — оставьте 0.','If VAT does not apply, enter 0.','ҚҚС қолданылмаса, 0 қалдырыңыз.'],
 ['Доставка материалов до меня уже включена в себестоимость?','Is inbound delivery included in material cost?','Материалдарды жеткізу құны өзіндік құнға кіре ме?'],
 ['Стоимость доставки материалов до меня, у.е.*','Inbound material delivery, currency units*','Материалдарды маған жеткізу құны, ш.б.*'],
 ['Материалы везут ко мне из-за границы?','Are materials imported from abroad?','Материалдар шетелден келе ме?'],
 ['Кто платит за импорт, таможню и разрешительные документы?','Who pays for import, customs and permits?','Импорт, кеден және рұқсат құжаттарын кім төлейді?'],
 ['Услуги брокера','Brokerage services','Брокер қызметтері'],
 ['Продавец','Seller','Сатушы'],
 ['Страхование груза','Cargo insurance','Жүк сақтандыруы'],
 ['Пошлины и сборы','Duties and fees','Баждар мен алымдар'],
 ['Сертификация и разрешительная документация','Certification and permits','Сертификаттау және рұқсат құжаттары'],
 ['Итог блока 1','Section 1 total','1-бөлім қорытындысы'],
 ['Количество','Quantity','Саны'],
 ['в партии','in the batch','партияда'],
 ['Измените количество','Change quantity','Санды өзгерту'],
 ['Пересчитать','Recalculate','Қайта есептеу'],
 ['Производство','Production','Өндіріс'],
 ['Расходы на производство 1 единицы','Cost to produce one unit','Бір дананы өндіру шығыны'],
 ['Аренда помещения + коммунальные платежи?','Rent and utilities?','Жалдау мен коммуналдық төлемдер?'],
 ['Расход / месяц, у.е.*','Expense per month, currency units*','Айлық шығын, ш.б.*'],
 ['Аренда оборудования?','Equipment rental?','Жабдықты жалдау?'],
 ['+ Добавить оборудование','+ Add equipment','+ Жабдық қосу'],
 ['Закупка оборудования?','Buying equipment?','Жабдық сатып алу?'],
 ['Кто выполняет производство?','Who does the production?','Өндірісті кім орындайды?'],
 ['Всё делаю сам','I do everything myself','Барлығын өзім істеймін'],
 ['Плачу рабочим','I pay workers','Жұмысшыларға төлеймін'],
 ['Страна расчёта зарплаты и обязательных начислений','Country for payroll taxes and contributions','Жалақы салығы мен аударымдары есептелетін ел'],
 ['Количество рабочих','Number of workers','Жұмысшылар саны'],
 ['Доля брака производства, % от общего объёма','Defect rate, % of output','Өндірістік ақау үлесі, %'],
 ['Расходы на газ?','Gas costs?','Газ шығыны?'],
 ['Расходы на электричество?','Electricity costs?','Электр шығыны?'],
 ['Есть прочие накладные, организационные и регулярные представительские расходы?','Other overhead, administrative or recurring business expenses?','Қосымша үстеме, әкімшілік немесе тұрақты өкілдік шығындар бар ма?'],
 ['Сколько клиентов реально можете обслужить?','How many clients can you actually serve?','Шын мәнінде қанша клиентке қызмет көрсете аласыз?'],
 ['Максимум услуг / месяц','Maximum services per month','Айына ең көп қызмет саны'],
 ['Итог блока 2','Section 2 total','2-бөлім қорытындысы'],
 ['Склад','Warehouse','Қойма'],['Логистика','Logistics','Логистика'],
 ['Реклама','Advertising','Жарнама'],['Налоги','Taxes','Салықтар'],
 ['Кредит','Loan','Несие'],['Кредит и резерв','Loan and reserve','Несие мен резерв'],
 ['Цена','Price','Баға'],['Расходы','Expenses','Шығындар'],
 ['Прибыль','Profit','Пайда'],['Чистая прибыль','Net profit','Таза пайда'],
 ['Маржа','Margin','Маржа'],['Выручка','Revenue','Түсім'],
 ['Продажи','Sales','Сатылымдар'],['НДС','VAT','ҚҚС'],
 ['Стоимость','Cost','Құны'],['Период','Period','Мерзім'],
 ['Месяц','Month','Ай'],['Месяцы','Months','Айлар'],
 ['Ввод','Inputs','Енгізу'],['Результат','Result','Нәтиже'],
 ['Сохранить','Save','Сақтау'],['Удалить','Delete','Жою'],
 ['Продолжить','Continue','Жалғастыру'],['Назад','Back','Артқа'],
 ['Добавить','Add','Қосу'],['Редактировать','Edit','Өңдеу'],
 ['Выберите','Choose','Таңдаңыз'],['По умолчанию','Default','Әдепкі'],
 ['Прайс и экономика портфеля','Portfolio prices and economics','Портфель бағалары мен экономикасы'],
 ['Портфель товаров и услуг','Product and service portfolio','Тауарлар мен қызметтер портфелі'],
 ['Общие ресурсы','Shared resources','Ортақ ресурстар'],
 ['Связанные продажи','Linked sales','Байланысты сатылымдар'],
 ['Цена для целевой маржи','Price for target margin','Мақсатты маржа бағасы'],
 ['Автоматическая цена прайса V2','Calculated V2 list price','Есептелген V2 прайс бағасы'],
 ['Покупатель платит за отдельную позицию (без скидки комбо)','Standalone customer price (excluding bundle discount)','Бөлек сатып алу бағасы (жинақ жеңілдігінсіз)'],
 ['3. Связанные продажи · Market Basket Analysis','3. Linked sales · Market Basket Analysis','3. Байланысты сатылымдар · Себет талдауы'],
 ['История покупок · наблюдаемая MBA','Purchase history · observed basket analysis','Сатып алу тарихы · байқалған себет талдауы'],
 ['Файл чеков (локально, без отправки на сервер)','Receipt file (local; never uploaded)','Чектер файлы (жергілікті, серверге жіберілмейді)'],
 ['Канал','Channel','Арна'],['С даты','From date','Басталу күні'],
 ['По дату','To date','Аяқталу күні'],['Утвердить сценарий','Approve scenario','Сценарийді бекіту'],
 ['Основная позиция','Primary item','Негізгі позиция'],
 ['Товар или услуга','Product or service','Тауар немесе қызмет'],
 ['Тип связи','Offer type','Байланыс түрі'],
 ['Прогноз привязанных покупок','Forecast of linked purchases','Байланысты сатып алулар болжамы'],
 ['Скидки по комплектам за месяц:','Monthly bundle discounts:','Айлық жинақ жеңілдіктері:'],
 ['Весь портфель ещё не подтверждён: проверьте лимиты запасов, загрузку и маржу.','Portfolio not validated: check stock, capacity and margin.','Портфель расталмаған: қорды, қуатты және маржаны тексеріңіз.'],
 ['Сохранить портфель','Save portfolio','Портфельді сақтау'],
 ['← К расчёту V1','← Back to V1 calculation','← V1 есебіне қайту'],
 ['Черновик хранится в этом браузере','Draft is stored in this browser','Нобай осы браузерде сақталады'],
 ['Помесячный прогноз · остатки и мощности','Monthly forecast · stock and capacity','Айлық болжам · қор және қуат'],
 ['Горизонт, месяцев (1–120)','Forecast horizon, months (1–120)','Болжам мерзімі, ай (1–120)'],
 ['+ Добавить общий ресурс','+ Add shared resource','+ Ортақ ресурс қосу'],
 ['Помещение / аренда','Premises / rent','Ғимарат / жалдау'],
 ['Работники / производство','Workers / production','Жұмысшылар / өндіріс'],
 ['Общий склад','Shared warehouse','Ортақ қойма'],
 ['Оборудование','Equipment','Жабдық'],
 ['Сертификат','Certificate','Сертификат'],
 ['Команда продаж','Sales team','Сату командасы'],
 ['Ведение рекламы','Advertising management','Жарнаманы басқару'],
 ['Общий рекламный бюджет','Shared advertising budget','Ортақ жарнама бюджеті'],
 ['Сайт / платформа','Website / platform','Сайт / платформа'],
 ['Хостинг','Hosting','Хостинг'],['Домен','Domain','Домен'],['Контент','Content','Контент'],
 ['Другие расходы','Other expenses','Басқа шығындар'],
 ['Новый расход (не учитывался в V1)','New expense (not in V1)','Жаңа шығын (V1-де есептелмеген)'],
 ['Уже в себестоимости SKU','Already in SKU cost','SKU өзіндік құнына кірген'],
 ['Уже в расходах на продажи SKU','Already in SKU sales costs','SKU сату шығындарына кірген'],
 ['Уже в гонораре маркетолога SKU','Already in SKU marketing fee','SKU маркетолог ақысында есептелген'],
 ['Уже в рекламном бюджете SKU','Already in SKU advertising budget','SKU жарнама бюджетінде есептелген'],
 ['Ежемесячно','Monthly','Ай сайын'],['Разово','One time','Бір рет'],
 ['Один реальный платёж, у.е.','One actual payment, units','Бір нақты төлем, ш.б.'],
 ['Название','Name','Атауы'],['Тип ресурса','Resource type','Ресурс түрі'],
 ['Периодичность','Frequency','Мерзімділігі'],
 ['Что заменить в старых расчётах?','Which old expense does it replace?','Бұрынғы есептегі қай шығынды алмастырады?'],
 ['Из какого платежа V1 вычесть старый расход?','Which V1 payment should be reduced?','Бұрынғы шығын V1-дегі қай төлемнен алынады?'],
 ['Распределять по','Allocate by','Бөлуді негіздеу'],
 ['Прогнозной выручке V1','Projected V1 revenue','V1 болжамды түсімі'],
 ['Реальной загрузке','Actual utilization','Нақты жүктеме'],
 ['Как считать загрузку','How to count utilization','Жүктемені қалай есептеу'],
 ['Вручную (старые черновики)','Manually (legacy drafts)','Қолмен (ескі нобайлар)'],
 ['На единицу продажи / посещения','Per sale / visit','Бір сату / келу бойынша'],
 ['Максимальная месячная мощность (0 — не ограничена)','Monthly capacity (0 = unlimited)','Айлық қуат (0 = шектеусіз)'],
 ['Страна, товарные группы, назначение','Country, product groups, use','Ел, тауар санаттары, мақсаты'],
 ['Действителен до','Valid until','Жарамдылық мерзімі'],
 ['Проверил покрытие всех товаров','Confirmed coverage of all products','Барлық тауардың қамтылуын тексердім'],
 ['Себестоимость V1 / шт.','V1 cost / unit','V1 өзіндік құны / дана'],
 ['Прогноз V1 / мес.','V1 forecast / month','V1 болжамы / ай'],
 ['Реклама V1 / мес.','V1 advertising / month','V1 жарнама / ай'],
 ['CAC V1','V1 CAC','V1 CAC'],
 ['Цена от','Price from','Баға бастап'],
 ['Цена до','Price to','Баға дейін'],
 ['Дельта цены','Price spread','Баға аралығы'],
 ['Прогноз, ед.','Forecast units','Болжам, дана'],
 ['Денежный вес','Revenue share','Түсім үлесі'],
 ['Маржа за период','Period margin','Кезең маржасы'],
 ['Маржа / 30 дней','Margin / 30 days','Маржа / 30 күн'],
 ['Прайс V2','V2 price list','V2 прайс'],
 ['Скидка','Discount','Жеңілдік'],
 ['Цена вне набора','Standalone price','Жинақтан тыс баға'],
 ['Товар / услуга','Product / service','Тауар / қызмет'],
 ['Вопросы и предложения','Questions and suggestions','Сұрақтар мен ұсыныстар'],
 ['Покупатель','Buyer','Сатып алушы']
];
rows.push(
 ['или','or','немесе'],
 ['Если вознаграждение зависит от нескольких ставок, порогов, категорий товара или других условий, лучше сначала формализовать схему, а потом встраивать её в калькулятор.','If compensation depends on several rates, thresholds, product classes or other conditions, define the model before calculating it.','Сыйақы бірнеше мөлшерлемеге, шекке, тауар тобына немесе өзге шарттарға тәуелді болса, алдымен ережені анықтап, содан кейін есепке енгізіңіз.'],
 ['Шоппер: 106 ед. материалов → 100 готовых штук → 24 продажи в месяц. Казахстан, 2 рабочих. Это демонстрация, не ваши сохранённые данные.','Example: materials for 106 tote bags → 100 finished items → 24 monthly sales. Kazakhstan, two workers. This is demo data, not your saved calculation.','Мысал: 106 дана материал → 100 дайын шоппер → айына 24 сатылым. Қазақстан, екі жұмысшы. Бұл сақталған деректеріңіз емес, мысал.'],
 ['Шаг 2','Step 2','2-қадам'],
 ['Для «Делаю сам» считаем материалы и связанные с ними расходы. Неиспользуемые статьи по умолчанию равны 0 и скрыты.','For own production, calculate materials and related expenses. Unused lines default to zero and remain hidden.','Өз өндірісіңіз үшін материалдар мен байланысты шығындар есептеледі. Қолданылмайтын баптар әдепкіде нөлге тең және жасырылған.'],
 ['Каждый разный товар в заказе — самостоятельная позиция со своей себестоимостью, количеством, последующей логистикой и ценой продажи. Отдельные товары не усредняются.','Each product in an order is a separate SKU with its own cost, quantity, logistics and selling price. Costs are never averaged across different products.','Тапсырыстағы әр тауардың өзіндік құны, саны, логистикасы және сату бағасы бөлек есептеледі. Әртүрлі тауарлардың бағасы орташаланбайды.'],
 ['Укажите положительную стоимость минимальной партии.','Enter a minimum-batch cost greater than zero.','Ең аз партияның нөлден жоғары құнын енгізіңіз.'],
 ['. Для каждого материала можно указать своего поставщика и отдельный источник цены.','. You can specify a supplier and price source for each material.','. Әр материал үшін жеке жеткізуші мен баға дереккөзін көрсете аласыз.'],
 ['По умолчанию — 10% от себестоимости материалов с НДС. Значение можно заменить вручную.','Default: 10% of material cost including VAT. You can overwrite it.','Әдепкіде ҚҚС-пен бірге материал құнының 10%-ы. Мәнді өзгертуге болады.'],
 ['Если статья не применяется — оставьте сумму 0.','If this expense does not apply, leave it at 0.','Бұл шығын қолданылмаса, 0 қалдырыңыз.'],
 ['Стоимость услуг брокера за партию, у.е.*','Broker fee per batch, currency units*','Партияға брокер ақысы, ш.б.*'],
 ['Страхование, % от стоимости материалов с НДС','Insurance, % of materials incl. VAT','Сақтандыру, ҚҚС-пен материал құнының %'],
 ['Пошлины и сборы на 1 единицу, у.е.*','Duties and fees per unit, currency units*','Бір данаға баждар мен алымдар, ш.б.*'],
 ['Сертификация и документы за партию, у.е.*','Certification and documents per batch, units*','Партияға сертификаттау және құжаттар, ш.б.*'],
 ['Для того, чтобы купить и привезти материалы для 1 ед.','To purchase and deliver materials for one unit','Бір данаға материал сатып алып, жеткізу үшін'],
 [', нужно потратить',', you need to spend',', жұмсалады'],
 ['у.е.*.','currency units*.','ш.б.*.'],
 ['— фиксированные расходы на брокера и разрешительные документы распределятся по партии, и стоимость 1 единицы изменится.','— the fixed brokerage and permit fees will be allocated across the batch and change unit cost.','— брокер мен рұқсат құжаттарының тұрақты шығындары партияға бөлініп, бір дана құны өзгереді.'],
 ['Итого аренда оборудования / месяц, у.е.*:','Total equipment rent / month, units*:','Жабдықты жалдаудың айлық сомасы, ш.б.*:'],
 ['Линейная амортизация в месяц = стоимость оборудования ÷ срок службы в месяцах.','Monthly straight-line depreciation = equipment cost ÷ useful life in months.','Айлық біркелкі амортизация = жабдық құны ÷ пайдалану мерзімі (ай).'],
 ['Итого амортизация купленного оборудования / месяц, у.е.*:','Depreciation of purchased equipment / month, units*:','Сатып алынған жабдықтың айлық амортизациясы, ш.б.*:'],
 ['Gross 1 рабочего / месяц, у.е.*','Gross wage of one worker / month, units*','Бір жұмысшының айлық брутто жалақысы, ш.б.*'],
 ['Gross зарплата всех рабочих / месяц, у.е.*','Gross wages of all workers / month, units*','Барлық жұмысшының айлық брутто жалақысы, ш.б.*'],
 ['Налоги и взносы работодателя / месяц, у.е.*','Employer taxes and contributions / month, units*','Жұмыс берушінің айлық салықтары мен аударымдары, ш.б.*'],
 ['Полная стоимость рабочих / месяц, у.е.*','Total employment cost / month, units*','Жұмысшылардың толық айлық құны, ш.б.*'],
 ['Тариф за 1 м³ газа, у.е.*','Gas tariff per m³, units*','1 м³ газ тарифі, ш.б.*'],
 ['Расход газа, м³ / месяц','Gas consumption, m³ / month','Газ шығыны, м³ / ай'],
 ['Газ / месяц (тариф × м³), у.е.*:','Gas / month (tariff × m³), units*:','Газ / ай (тариф × м³), ш.б.*:'],
 ['Тариф за 1 кВт·ч, у.е.*','Electricity tariff per kWh, units*','1 кВт·сағ электр тарифі, ш.б.*'],
 ['Расход электричества, кВт·ч на 1 произведённую единицу','Electricity use, kWh per unit produced','Бір өндірілген данаға электр шығыны, кВт·сағ'],
 ['Электричество на 1 ед. (тариф × кВт·ч), у.е.*:','Electricity per unit (tariff × kWh), units*:','Бір данаға электр (тариф × кВт·сағ), ш.б.*:'],
 ['Накладные организационные расходы / месяц, у.е.*','Administrative overhead / month, units*','Айлық әкімшілік үстеме шығындар, ш.б.*'],
 ['Эта сумма относится ко всему месяцу и распределяется на количество произведённых единиц. Включая проверки, аккредитации и аналогичные организационные расходы.','This is a monthly total allocated among all produced units, including inspections, accreditation and similar overhead.','Бұл айлық жалпы шығын өндірілген даналарға бөлінеді, оған тексерулер, аккредиттеу және ұқсас шығындар кіреді.'],
 ['Места и рабочие часы мастеров определяют физический максимум услуг за месяц. Сопоставляем его с прогнозом из рекламы.','Available stations and specialist hours cap monthly service capacity; compare this cap with ad-driven demand.','Қызмет көрсету орны мен мамандардың жұмыс сағаты айлық қуатты шектейді. Оны жарнама болжамымен салыстырыңыз.'],
 ['Стоимость производства 1 ед.','Production cost per unit','Бір дананың өндіріс құны'],
 ['составляет','is','құрайды'],
 ['Сколько единиц','How many units','Қанша дана'],
 ['производите в месяц?','do you make per month?','айына өндіресіз?'],
 ['Логистика и склад','Logistics and warehouse','Логистика және қойма'],
 ['Кто платит за доставку','Who pays for delivery','Жеткізуді кім төлейді'],
 ['до склада?','to the warehouse?','қоймаға дейін?'],
 ['Другой контрагент','Another counterparty','Басқа контрагент'],
 ['Стоимость доставки 1 ед. до склада, у.е.*','Inbound delivery per unit, units*','Бір дананы қоймаға жеткізу құны, ш.б.*'],
 ['Кто платит за хранение','Who pays for storage','Сақтау ақысын кім төлейді'],
 ['на складе?','at the warehouse?','қоймада?'],
 ['Сколько стоит 1 день хранения, у.е.*?','Storage cost per day, units*?','Бір күн сақтау құны, ш.б.*?'],
 ['Сколько дней сейчас 1','How many days does one','Бір дана қазір қанша күн'],
 ['в среднем лежит на складе?','item spend in storage on average?','қоймада жатады?'],
 ['Если затрудняетесь — оставьте поле пустым. Оно будет рассчитано на следующих этапах.','If unsure, leave this blank; later stages will calculate it.','Сенімді болмасаңыз, бос қалдырыңыз; кейінгі кезеңде есептеледі.'],
 ['Срок доставки до покупателя','Delivery time to customer','Сатып алушыға жеткізу мерзімі'],
 ['От заказа до получения покупателем. Учитывается при расчёте потребности в оборотных деньгах.','From order to customer receipt, affecting working-capital needs.','Тапсырыстан сатып алушы алғанға дейінгі мерзім айналым капиталына әсер етеді.'],
 ['Срок доставки, дней','Delivery time, days','Жеткізу мерзімі, күн'],
 ['Когда деньги покупателя доступны для оплаты поставщику?','When are customer funds available to pay the supplier?','Клиенттің ақшасы жеткізушіге төлеуге қашан қолжетімді?'],
 ['После доставки покупателю','After customer delivery','Сатып алушыға жеткізгеннен кейін'],
 ['До оплаты поставщику','Before paying the supplier','Жеткізушіге төлеуге дейін'],
 ['Дополнительная задержка выплаты после доставки, дней','Extra payout delay after delivery, days','Жеткізуден кейінгі қосымша төлем кідірісі, күн'],
 ['Поставщику платим при оформлении заказа; складских запасов нет. Если деньги покупателя ещё недоступны, расходы временно финансирует бизнес.','The supplier is paid when placing the order; there is no inventory. If customer money is not available yet, the business finances the gap.','Жеткізушіге тапсырыс кезінде төленеді; қойма қоры жоқ. Клиент ақшасы кешіксе, айырманы бизнес қаржыландырады.'],
 ['до покупателя?','to the customer?','сатып алушыға дейін?'],
 ['Сколько, % от стоимости товара','How much, % of product price','Қанша, тауар бағасының %'],
 ['Если не знаете — оставьте 10% по умолчанию.','If unknown, keep the default 10%.','Білмесеңіз, әдепкі 10%-ды қалдырыңыз.'],
 ['Процент возвратов товара','Product return rate','Тауар қайтарымы, %'],
 ['Возвраты умножаются на стоимость доставки и увеличивают логистические расходы.','Returns multiply delivery expenses and increase logistics cost.','Қайтарымдар жеткізу шығынын көбейтіп, логистика құнын арттырады.'],
 ['Итог блока 3','Section 3 total','3-бөлім қорытындысы'],
 ['Минимальная стоимость хранения и доставки до покупателя 1 ед.','Minimum storage and delivery cost per unit','Бір дананы сақтау мен жеткізудің ең аз құны'],
 ['для расчёта','for the calculation','есеп үшін'],
 ['Стоимость 1 ед. не меняется от количества; ниже дополнительно считается общая логистика для выбранного количества.','Unit cost does not depend on quantity; total logistics for the selected quantity is calculated separately below.','Бір дана құны санға тәуелді емес; таңдалған саны үшін жалпы логистика төменде бөлек есептеледі.'],
 ['Логистика для выбранного количества, у.е.*','Logistics for selected quantity, units*','Таңдалған санға логистика, ш.б.*'],
 ['Расходы на продажу','Sales expenses','Сату шығындары'],
 ['Расходы при продаже','Selling costs','Сату кезіндегі шығындар'],
 ['Платите ли комиссию агрегатору / маркетплейсу / дилеру / продавцу с продажи 1 ед.','Do you pay an aggregator, marketplace, dealer or salesperson commission on each unit sold?','Бір дана сатылғанда агрегаторға, маркетплейске, дилерге не сатушыға комиссия төлейсіз бе?'],
 ['Комиссия, % от оборота','Commission, % of revenue','Комиссия, түсімнен %'],
 ['Процент применяется к цене продажи каждой 1 ед. товара через соответствующий канал.','This percentage applies to the sale price of each unit sold through that channel.','Бұл пайыз тиісті арнадағы әр дананың сату бағасына қолданылады.'],
 ['Платите ли продавцам / менеджерам зарплату или иные гонорары?','Do salespeople or managers receive salaries or fees?','Сатушыларға не менеджерлерге жалақы немесе гонорар төлейсіз бе?'],
 ['Регулярные расходы на ЗП и иные вознаграждения за месяц, у.е.*','Monthly salaries and other regular compensation, units*','Айлық жалақы және басқа тұрақты сыйақылар, ш.б.*'],
 ['Рассчитываете ли получать штрафы и удержания со стороны площадки / агрегатора?','Do you expect marketplace or aggregator penalties and deductions?','Платформа немесе агрегатор айыппұлдар мен ұсталымдар қолдана ма?'],
 ['Средний процент штрафов и удержаний от оборота','Average penalties and deductions, % of revenue','Айыппұлдар мен ұсталымдардың орташа үлесі, түсімнен %'],
 ['Платите обязательные взносы за сотрудников?','Do you pay mandatory contributions for employees?','Қызметкерлер үшін міндетті аударымдар төлейсіз бе?'],
 ['Страна расчёта зарплаты, взносов и налогов','Payroll, contribution and tax country','Жалақы, аударым және салық есептелетін ел'],
 ['По умолчанию — 🇰🇿 Казахстан.','Default: 🇰🇿 Kazakhstan.','Әдепкі ел — 🇰🇿 Қазақстан.'],
 ['Справочник по выбранной стране','Selected-country payroll reference','Таңдалған елдің анықтамалығы'],
 ['Взносы работодателя:','Employer contributions:','Жұмыс беруші аударымдары:'],
 ['Взносы / соцстрах сотрудника:','Employee contributions / social insurance:','Қызметкер аударымдары / әлеуметтік сақтандыру:'],
 ['Верхняя справочная ставка подоходного налога:','Upper indicative income-tax rate:','Табыс салығының ең жоғары анықтамалық мөлшерлемесі:'],
 ['Отдельный налог работодателя на ФОТ:','Separate employer payroll tax:','Жұмыс берушінің еңбекақы қорына жеке салығы:'],
 ['Источник:','Source:','Дереккөз:'],
 ['взносы работодателя','employer contributions','жұмыс беруші аударымдары'],
 ['взносы сотрудника','employee contributions','қызметкер аударымдары'],
 ['подоходный налог','income tax','табыс салығы'],
 ['Количество сотрудников, за которых вы платите зарплату, взносы и налоги','Number of employees for whom you pay wages, contributions and taxes','Жалақысы, аударымдары және салығы төленетін қызметкерлер саны'],
 ['Самозанятых не включайте. ИП включайте, если по вашему режиму вы платите за него обязательные платежи.','Exclude contractors taxed as self-employed. Include sole proprietors only when you pay their mandatory charges under your regime.','Өзін-өзі жұмыспен қамтығандарды қоспаңыз. ЖК үшін міндетті төлемдерді өзіңіз төлесеңіз ғана қосыңыз.'],
 ['Средняя начисленная зарплата одного сотрудника за месяц, у.е.*','Average monthly gross salary per employee, units*','Бір қызметкердің орташа айлық есептелген жалақысы, ш.б.*']
);

const direct=new Map(rows.map(([ru,en,kk])=>[ru,{en,kk}]));
const weak=new WeakMap(), attrOriginal=new WeakMap();
let pending=new Set(),scheduled=false,observer;
function locale(){
 const code=root.Nomad360UI?.getLanguage?.()||'ru';
 return code==='en'||code==='kk'?code:'ru';
}
function valid(node){
 let parent=node.nodeType===3?node.parentElement:node;
 return parent && !parent.closest('script,style,template,noscript,pre,code,textarea,[contenteditable="true"],#nomad360-hero,#nomad360-footer,#nomad360-portfolio-tools,#nomad360-print-sheet,#nomad360-language-chooser');
}
function lookup(raw,language){
 if(language==='ru')return raw;
 const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
 if(!m)return raw;
 const translated=(direct.get(m[2])||direct.get(m[2].replace(/\s+/g,' ').trim()))?.[language];
 return translated?m[1]+translated+m[3]:raw;
}
function translateNode(node,language){
 if(!valid(node))return;
 if(node.nodeType===3){
  const value=node.nodeValue||'';
  const prior=weak.get(node);
  const canonical=prior&&value===prior.applied?prior.original:value;
  const output=lookup(canonical,language);
  weak.set(node,{original:canonical,applied:output});
  if(output!==value)node.nodeValue=output;
  return;
 }
 if(node.nodeType!==1)return;
 for(const attr of ['placeholder','title','aria-label']){
  if(!node.hasAttribute(attr))continue;
  const oldValue=node.getAttribute(attr),history=attrOriginal.get(node)||{};
  const baseline=history[attr]&&oldValue===history[attr].applied?history[attr].original:oldValue;
  const output=lookup(baseline,language);
  history[attr]={original:baseline,applied:output};attrOriginal.set(node,history);
  if(output!==oldValue)node.setAttribute(attr,output);
 }
 const walk=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
 let current;
 while((current=walk.nextNode()))translateNode(current,language);
}
function flush(){
 scheduled=false;
 const roots=[...pending];pending=new Set();
 const language=locale();
 roots.forEach(node=>translateNode(node,language));
}
function schedule(node){
 pending.add(node);
 if(!scheduled){scheduled=true;Promise.resolve().then(flush)}
}
function localizeAll(){schedule(document.body)}
function boot(){
 if(observer)return;
 observer=new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='characterData')schedule(record.target);
   else for(const node of record.addedNodes)if(node.nodeType===1||node.nodeType===3)schedule(node);
  }
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true});
 document.addEventListener('nomad360:languagechange',localizeAll);
 localizeAll();
}
root.Nomad360LocaleCore=Object.freeze({
 locale,localizeAll,translationCount:rows.length,hasTranslation:key=>direct.has(key),
 translate:(source,language)=>lookup(source,language)
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})(window);
