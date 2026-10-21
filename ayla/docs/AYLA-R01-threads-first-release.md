# AYLA-R01 — Первый релиз: Ayla for Threads

> **Статус:** проект этапного плана на согласование (21.10.2026), не разрешение запускать разработку.
> **Место:** самостоятельная подсистема [ayla/](../README.md), **рядом с калькулятором**, не внутри него.
> **Зависимости:** утверждённый [AYLA-CORE-01](../../docs/ayla/AYLA-CORE-01-persona-life-engine.md), проекты [AYLA-LIFE-03](AYLA-LIFE-03-human-creator-triangulation.md), [AYLA-JOB-02](../../docs/ayla/AYLA-JOB-02-functional-specification.md), [AYLA-JOB-03](../../docs/ayla/AYLA-JOB-03-content-production-feedback-loop.md).

## 1. Цель и границы

**R01 = работающий маркетолог Ayla только для Threads.** Исследует доступную нишу, живых авторов и комментарии, формирует оригинальные короткие публикации, фотографии, фото-карусели, мини-истории, участвует в содержательных диалогах (своих и чужих), собирает реальную статистику и использует её для следующего контента.

Persona, память, образ, жизненная хронология и социальный мир Ayla существуют независимо от калькулятора. Her Job может использовать проверенные публичные факты Nomad360, но жизнь Ayla **не обязана рекламировать** Calculator.

**Входит:** один Threads-аккаунт, research и human creator radar, short ContentBrief, тексты и microstories, одиночные фото и фото-карусели, публикация, own/external replies, очередь с разрешениями и лимитами, метрики, обучающий цикл.

**Не входит:** Instagram, Facebook, LinkedIn, Telegram, кроссплатформенная CRM, длинные статьи, видео с монтажом и анализом, Reels, talking-avatar, озвучка, lip-sync, инфлюенсерские рекламные сделки, B2B-торговый агент, продакшн отдельной Content Factory.

**«Короткие сторис» в R01:** небольшие сюжеты жизни Ayla в нативных форматах Threads — текст, фото, фото-карусель или короткая связанная цепочка постов. Не выдавать их за Instagram Stories. Функция Threads 24h disappearing/ghost posts существует отдельно, но её ответы поступают в inbox; **не включать в обязательный R01, пока inbox/permissions/E2E не подтверждены**.

**Ритм:** сохраняем ранее обсуждавшуюся ориентировочную цель 10–12 самостоятельных оригинальных постов в день **после пилота**, при качестве, возможностях и правилах платформы. Ответы отдельно, шаблонный спам ради квоты запрещён. Суточные часы, квоты ответов и лимиты расходов устанавливает владелец после baseline.

**Проверенный донор и DoD этапов по конечной спецификации:** [AYLA-R01-AUDIT & DoD](AYLA-R01-infrastructure-reuse-and-final-contract-dod.md). Критерии R01.1–R01.6 этого документа обязательны дополнительно к верхнеуровневой декомпозиции ниже. Отдельные интеграции других соцсетей не создаются в R01.

## 2. Полный цикл R01

Human creator / threads research / Persona LifeEvent / комментарии → Evidence → CandidateTopic → **короткий ContentBrief** → оригинальный text / image / carousel / microstory → Persona/Factual/Originality QA → owner permission → Threads publication remote ID → own & external conversations → post/account insights и анализ комментариев → новый ContentBrief с обоснованием.

У всех сущностей ID, timestamp, source/evidence, версия, state и trace. Вымышленный LifeEvent и реальные бизнес-факты разделены. Не объявлять постом созданный container без внешнего подтверждения.

## 3. Обязательные функции R01

| ID | Функция | Вход → выход и проверка |
|---|---|---|
| **TH-01** Account | OAuth/owner account → доступные scopes и per-action capability (documented/granted/E2E proven); server-side token, kill switch |
| **TH-02** Human creator radar | Разрешённые публичные авторы Threads, близкая ниша и география → evidence, темы, роли/паттерны; никаких текстовых копий чужих постов |
| **TH-03** Social synthesis | Триангуляция social/place/emotion от трёх разных живых авторов либо продолжение LifeArc → оригинальный непротиворечивый эпизод Ayla |
| **TH-04** Planning | Signal / LifeEvent / product evidence → короткий ContentBrief: segment, value, hook, intent, format, primary metric, source, PersonaVersion |
| **TH-05** Copy | ContentBrief → короткий American English текст, вопрос, шутка, заметка, microstory; без длинных статей, без навязанных рекламных CTA |
| **TH-06** Photo | Approved reference image + LifeEvent → один готовый фотореалистичный asset + face QA + provenance/hash |
| **TH-07** Carousel | Brief / 2+ images → отдельные финальные кадры, alt-text, order/manifest; реализация официального IMAGE children → CAROUSEL → publish |
| **TH-08** Publish | TEXT/IMAGE/CAROUSEL, exact-version permit, schedule/queue → real remote post ID, retries/dedup/reconciliation |
| **TH-09** Own comments | Собственные посты → read replies с parent/root, intent/risk, ответ или no_reply, сохранённый remote reply ID |
| **TH-10** External discussion | Keyword search / observed accounts → opportunity, полный контекст, оригинальный ответ **без продаж/ссылок/просьб подписаться**, approval и реальный reply ID |
| **TH-11** Metrics | Post insight + account insight + own/external comment events → raw evidence, metric windows, coverage, unknown vs measured 0 |
| **TH-12** Feedback | Повторные темы, вопросы, интерес к жизни и оригинальным идеям → следующий ContentBrief и версия learning decision |

### 3.1. Комментарии и автономия

- **Собственные:** принимать и классифицировать доступные ответы/комментарии: question, praise, conversation, personal-life, bug, feature, collaboration, spam, risk.
- **Автоответы по умолчанию OFF.** Разрешать только определённые владельцем low-risk intents при достаточной confidence, QA и quota. Для разрешённых автоответов назначить один раз **случайную сохраняемую задержку 1–60 минут** и проверять контекст заново перед отправкой.
- **Чужие ветки:** отдельная политика external replies. По умолчанию proposal_only → затем approval per reply; bounded autonomy возможна лишь после отдельного согласования прав, target topics, лимитов, cooldown, expiry и E2E.
- Запрет массовых однотипных комплиментов, рекламы/ссылок на Nomad360 в чужих ветках, личных рассылок и подмены активности собеседников.
- При удалении/изменении комментария и API timeout: отмена или reconciliation, не слепые дубли.

### 3.2. Ограничения медиа

- **Видео и сложный анализ видео исключены**, даже если Threads API технически может их публиковать.
- Для фото с лицом Ayla требуется **точный выбранный владельцем портрет**; бинарный оригинал теперь загружен в [ayla/assets/](../assets/ayla-face-canon-v1.jpg) и привязан к [манифесту](../assets/face-canon-v1.json). Однако сам генератор пока принимает только prompt: до реализации реального reference-image conditioning и проверки сходства нельзя считать генерацию лица Ayla завершённой; текст и research работают независимо.
- Официальный Threads API поддерживает карусели, однако текущий донор ai-content-marketer в CAROUSEL ветке содержит NotImplementedError. TH-07 — **новая разработка**, не «уже готово».
- Формат mini-story — **содержательный**, не отдельный несуществующий endpoint.
- Для временных ghost posts не обещать автоматический сбор ответов, пока их inbox-flow не квалифицирован отдельно.

### 3.3. Что измерять

**Post-level**: views, likes, replies, reposts, quotes, shares при доступности в разрешённых insights.

**Account-level**: followers_count и разрешённые агрегаты. Нельзя приписывать новые подписки конкретной публикации без доказанной атрибуции.

**Conversation quality**: количество содержательных ответов, продолжения разговоров, новые уникальные темы, повторяющиеся вопросы, реакция на романтические/бытовые LifeArc, сигналы недоверия к визуальному постоянству, осмысленные обсуждения калькулятора.

**Activity accounting**: собственные standalone posts, own replies, external replies — раздельные счётчики.

**Time windows**: +1h/+24h/+7d по возможности провайдера. Сохранять знаменатель, полноту комментариев, provider snapshot, query limits, measured 0 и unknown отдельно. Реализованную в доноре qualified_growth формулу не переписывать; недоступные сигналы остаются unknown, baseline/target growth устанавливаются по фактическим данным.

## 4. Реализация R01 — шесть последовательно принимаемых PR

Это **внутренние части одного релиза Threads**. Пройти только одну часть недостаточно, чтобы назвать Ayla маркетологом.

| PR этап | Deliverable | Gate |
|---|---|---|
| **R01.1 — Foundation** | Собственная Ayla runtime/DB/queue, Persona links, Threads OAuth, capabilities, tokens, owner controls | Реальная авторизация аккаунта, scopes проверены, Calculator изолирован |
| **R01.2 — Research & Text** | HumanCreator Registry, keyword discovery, ContentBrief, short text/microstory, TEXT publisher | Есть проверяемые источники и real Threads text post с remote ID |
| **R01.3 — Photos & Carousels** | Approved face master, photo QA, image assets, typed carousel manifest + Threads publish | Real photo и real carousel опубликованы, сохранены remote IDs, face QA |
| **R01.4 — Own Discussions** | Read own replies, intent/risk, original replies, exact permit, durable random delay 1–60m | Живой диалог; restart/dedup/edited-or-deleted source cases пройдены |
| **R01.5 — External Discussions** | Search, relevance scoring, full context, no-sales QA, approvals/quotas, official replies | Найдена релевантная чужая ветка, получен реальный reply ID без рекламы |
| **R01.6 — Metrics & Pilot** | Post/account insights, comment sampling quality, topic clustering, feedback→brief, reports | E2E source→brief→post→reply→metrics→next brief подтверждён; приёмка владельца |

**Расширение на другую соцсеть запрещено до приёмки R01**. Далее выбор следующей площадки и её срок — отдельное решение.

## 5. Сквозная приёмка R01

1. Утверждённый собственный Threads-профиль Ayla и официальные API rights; public AI disclosure корректен.
2. Найдены и сохранены публичные источники от реальных людей; оригинальность жизненного сюжета подтверждена.
3. Созданы **короткий текст, одна мини-история, одно фото и одна фото-карусель** без длинных постов/видео.
4. Публикации подтверждены настоящими remote IDs; restart/retry не дублирует.
5. Получены собственные реальные комментарии, выполнена контекстная классификация; low-risk reply при разрешении сохраняет delay 60..3600 сек и правильно реагирует на изменения.
6. Найдена внешняя релевантная дискуссия, подготовлен полезный нерекламный ответ и при разрешении отправлен с подтверждением.
7. Получены разрешённые реальные post/account insights, comments coverage и отдельные счётчики standalone/own/external replies.
8. Анализ содержания и числовых реакций подготовил **следующее короткое ContentBrief** с доказательствами, а не произвольной идеей.
9. При недоступном API, отзыве прав, неработающей модели, отсутствующем face master или неясном результате публикации система возвращает BLOCKED/UNAVAILABLE, не «готово».
10. Все кодовые изменения ограничены самостоятельной директорией ayla/, не затрагивают V1/V2, лицензии, пользовательские финансы и код донора.

## 6. Автономное исполнение

**Первое архитектурное решение:** [AYLA-ADR-01](AYLA-ADR-01-autonomous-runtime-google-cloud.md) — Cloud Compute Engine VM с постоянно работающим worker + web/API, один durable SQLite/очередь, model inference через внешний разрешённый API, медиа и backup вне VM. Ngrok не решает постоянную работу, он только проксирует локальный сервис. До предоставления Cloud-проекта и бюджето-разрешения это проект, **не созданный prod runtime**.


Обычный Custom GPT не генерирует новые ответы и публикации самостоятельно в закрытом чате. Нужен **реальный и отдельно согласованный model-inference runtime** для непрерывного агента; серверная очередь без модели способна только опубликовать уже одобренное и собирать данные. Провайдер, бюджет и полномочия не назначаются этим ТЗ и не включаются скрытно.

**Уровень готовности:** Specified → Code/Unit-CI → Provider Permission Verified → Live E2E Proven → Owner Accepted. Только последний означает «хороший Threads-маркетолог готов».

## 7. Следующие релизы — без преждевременного проектирования

После R01 отдельно решить: расширять ли визуальную/видео-персону, добавлять Instagram/Facebook/Telegram/LinkedIn, частный Inbox→Telegram и B2B модули. **R01 не содержит инфраструктуру других платформ ради гипотетического будущего.**

**Итог:** сначала готовим **реально действующего Threads-маркетолога с собственной личностью, контентом, диалогами и обучением**. Всё остальное — позже, отдельными решениями.
