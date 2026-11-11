# AYLA-R01-AUDIT & DoD — повторное использование инфраструктуры и этапная приёмка по конечному контракту

> **Дата:** 21.10.2026  
> **Статус:** технический аудит проверенных исходников + проект критериев приёмки **на согласование**.  
> **Владелец:** Nomad360 Business Solutions.  
> **Объект:** самостоятельная подсистема **ayla/** рядом с калькулятором.  
> **Первый релиз:** [AYLA-R01 — Threads only](AYLA-R01-threads-first-release.md).
> **Целевой функциональный контракт:** [AYLA-CORE-01](../../docs/ayla/AYLA-CORE-01-persona-life-engine.md) (утверждён), [AYLA-VISUAL-01](../../docs/ayla/AYLA-VISUAL-01-approved-reference.md) (изображение утверждено), [AYLA-PERSONA-02](../../docs/ayla/AYLA-PERSONA-02-audience-aspirational-life.md), [AYLA-LIFE-03](AYLA-LIFE-03-human-creator-triangulation.md), [AYLA-JOB-01](../../docs/ayla/AYLA-JOB-01-marketing-operations.md), [AYLA-JOB-02](../../docs/ayla/AYLA-JOB-02-functional-specification.md), [AYLA-JOB-03](../../docs/ayla/AYLA-JOB-03-content-production-feedback-loop.md) (остальные проекты на согласование).

**Ключевой принцип:** DoD не равен «работает Threads-функция». Каждый этап обязан закладывать **семантически правильную и расширяемую часть конечной Ayla**: один персонаж, собственная память, источник фактов, доказательная аналитика, коннекторный boundary, независимая от калькулятора архитектура. Реализацию иных платформ, сложного видео или их UI **не включать** в R01.

## 0. Проверено в репозиториях

**Репозиторий готового калькулятора:** KazartsevEV/shelter-partner-directory. На main — статический HTML/JS Calculator V1/V2, локализации, экспорт, тесты. Собственного запущенного Python-agent backend Ayla на main нет. В текущем PR #229 создаётся отдельная ayla/ рядом с калькулятором; это **не означает готовность runtime**.

**Основной донор:** KazartsevEV/lazysellerV2/ai-content-marketer в main; изучены исходники, deployment docs, current PRODUCT_STATE_GOAL_ROADMAP и тестовый инвентарь.

**Заявленные донором уровни:** PROVEN-CI, IMPLEMENTED/E2E UNPROVEN, PARTIAL, TODO. Некоторые большие внешние траектории описаны как **acceptance-ready**: это означает подготовленную процедуру реальной приёмки, не факт успешного реального аккаунтного испытания. **Не переносить CI-статус донора автоматически на Ayla.**

### 0.1. Матрица повторного использования

| Возможность | Подтверждённый исходник донора | Состояние / решение R01 | Что остаётся |
|---|---|---|---|
| Раздельный Python product package и UI | ai-content-marketer/pyproject.toml, README, deploy/ | **Переиспользовать архитектуру** отдельного пакета и конфигурационные профили | Сборка отдельного ayla/, собственные версии/хранилище и smoke запуска |
| Сервер web + worker, SQLite WAL, background jobs | deploy/README.md, deploy/compose.yaml, shared infourok-agent-platform | **Перенести компоновку и operational contracts**, не поднимать второй scheduler внутри калькулятора | Повторная qualification в Ayla, backup/restore, worker restart и secrets |
| Threads OAuth, encrypted tokens, историческая привязка | threads_accounts.py, connected_threads.py | **Адаптировать почти напрямую**, исходные ключи не переносить | Своя учётная запись Ayla, scopes, живой OAuth и token expiry |
| Threads publish TEXT/IMAGE, read replies, reply | publishers/threads.py | **Переиспользовать core adapter/контракты** | Реальная публикация из Ayla с exact permit и remote ID |
| Threads photo carousel | publishers/threads.py, ContentFormat.CAROUSEL → NotImplementedError | **НЕТ**, реализовать typed children/carousel + E2E | Поддержка вложений, readiness, порядок слайдов, failed/partial cases |
| Threads keyword search + обнаружение чужих веток | research/search_discovery.py — DuckDuckGo/Bing general search; connected_threads.py не содержит keyword search | **Частично**; общий research donor есть, нативный Threads keyword search адаптер надо построить | Официальные права, cursor, публичный контекст, условия доступа и live tests |
| Исследование реальных блогеров и триангуляция | только general research; AYLA-LIFE-03 — новый контракт | **Новое** поверх evidence/research infrastructure | HumanCreatorRegistry, Social/Place/Emotion patterns, originality/canon checks |
| Content planning, strategies, original text | planner.py, Google/OpenRouter providers, assistant/orchestrator | **Переиспользовать** структуры, QA, versioned generation | Переключить цель с чисто коммерческой на relevant audience growth; persona-grounded short copy |
| LLM background inference | локальный OpenRouter free-only и BYOK; deploy web/worker существует | **Частичная основа**; нельзя выводить факт круглосуточной интеллектуальной автономии из существования queue | Согласовать доступность модели, cost caps, не молча подключать платные API; production smoke |
| Approved master face JPEG | новая ayla/assets/ayla-face-canon-v1.jpg + face-canon-v1.json | **СОХРАНЕНО И ПРОВЕРЕНО**: byte-for-byte Git blob SHA-1 и исходный SHA-256 | Разработать reference-conditioned image provider и likeness QA |
| Image generation | providers/google_media.py (GoogleImageGenerator) | **Есть prompt-only генератор**, но НЕ умеет принудительно передать утверждённое лицо | Новый/расширенный provider image-reference adapter; prompt-only путь для лица запретить |
| Voice/video/FFmpeg editing | media/, GoogleVideoGenerator, QA и provenance | **НЕ ТРОГАТЬ в R01** | Будущие релизы, не условие первого маркетолога Threads |
| Комментарии: ingest/classify/draft/permit | comments_runtime.py, comment_automation_runtime.py, comment_auto_reply.py, reply QA/policy | **Частично готово в доноре**, собственные комментарии на Threads | Адаптация под Persona, многометочные темы, 1–60 минут durable delay, real-account replies |
| Узкий автоответ | CommentAutoReplyRules.enabled = false, allowed_intents = praise | **Правильно OFF по умолчанию** | Явное разрешение владельца на low-risk intents и случайная задержка, квоты, recheck |
| Ответы в чужих ветках | publisher.reply(), общий permit pipeline | **Примитив отправки возможен**, но нет полноценного external conversation marketing loop | Separate ExternalReplyPolicy, discovery, relevance, no-sales QA, live external reply |
| Publication QA, permit, revision, scheduled writes | publication_schedule.py, artifact review, external write permit & policy | **Большую часть повторить**, сохранить строгое execution-time разрешение | Изоляция проекта/аккаунта, idempotency, логика exact content hash |
| Post/account insights | publishers/threads.py, connected_threads.py, metrics.py | **Есть adapters и CI**, live real-account E2E не доказан | Проверить scopes, поля, окна 1h/24h/7d, account vs post attribution |
| Growth planning | planner.py QUALIFIED_GROWTH, learning | **Повторить формулу без самовольной замены весов** | Маппинг реально доступных Threads сигналов, cold-start и unknown semantics |
| Semantic comments → topic → next brief | частичные classifier/research/learning contracts | **Существенно новое для Ayla** | Содержательные темы, sample coverage, clusters, LifeArc feedback и обоснованный новый Brief |
| Private DM → Telegram, Instagram/Facebook/LinkedIn | глобальная целевая JOB-спецификация | **ИСКЛЮЧЕНО из R01** | Будущие отдельные этапы; не строить про запас |

### 0.2. Источники, проверенные непосредственно

Код:
- https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/src/ai_content_marketer/publishers/threads.py
- https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/src/ai_content_marketer/threads_accounts.py
- https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/src/ai_content_marketer/connected_threads.py
- https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/src/ai_content_marketer/comment_auto_reply.py
- https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/src/ai_content_marketer/comment_automation_runtime.py
- https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/src/ai_content_marketer/publication_schedule.py
- https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/src/ai_content_marketer/metrics.py
- https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/src/ai_content_marketer/providers/google_media.py
- https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/src/ai_content_marketer/research/search_discovery.py

Состояние/развёртывание:
- https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/docs/PRODUCT_STATE_GOAL_ROADMAP.md
- https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/docs/RUNTIME_PROFILES.md
- https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/deploy/README.md

**Важно:** SELF-описания донора — evidence его структуры и тестовых статусов. Реальная работа Ayla доказывается *заново* её собственными тестами и удалёнными API receipts. Исторический psycho_agent в Drive упоминается в SOURCE_MAP, но его исходные файлы в этой проверке не читались; статус «пригоден к прямому переносу» ему НЕ присваивается.

## 1. Общий инвариант DoD для каждого R01.x

**Статус DONE запрещён**, если не выполнены одновременно:

**A. Domain integrity**
- Все новые сущности принадлежат Ayla, не calculator UI, не V1/V2 JS.
- Ссылка на глобальные контракты Persona/Her Job сохранена (immutable canon version, источники LifeEvent/Marketing Evidence).
- Доменная модель не ссылается жёстко на тип конкретной соцсети; Threads — adapter, остальные площадки не реализуются.
- В фактах существуют provenance, version и proof class: verified, model_inference, fictional_life, unavailable.

**B. Technical integrity**
- Типизированные DTO/schema migration, явные состояния, устойчивые ID, API error contracts, idempotency/retry, quota/rights/privacy по смыслу этапа.
- Нет фиктивных метрик/публикаций, нет prompt-only обхода эталона Ayla, нет принудительной рекламы сюжетов.
- Тесты: unit + integration fake provider + негативные permission/timeout/restart cases + live E2E **когда этап пишет/читает Threads**.
- Секреты только серверные, доступы scoped, исходный ai-content-marketer и калькулятор не меняются.

**C. Evidence integrity**
- У каждого этапа есть отдельный PR от актуальной ветки, diff, CI, тестовые artifacts, screenshots при UI, exact commit SHA, перечень подтверждённых API scopes, видимые remote IDs/receipts (для внешних действий), список открытых ограничений.
- DoD checklist с пунктами «готово/провалено/непроверено»; unproven нельзя переименовать в DONE.
- Owner acceptance принимает не текстовое заявление исполнителя, а реальные артефакты из проекта Ayla.

**D. Future-contract integrity**
- Модуль сохраняет возможность достроить полный AYLA-JOB/CORE/Persona/Life контракт без полной замены хранилища или переписывания семантики событий.
- Нельзя требовать готовых Instagram/Telegram/LinkedIn API в R01. Требуется только **задокументированный, протестированный интерфейс адаптера** (на одном mocked future adapter), а не другие платформы как продукт.
- Доработки живого донорского проекта и Calculator запрещены, если не оформлены отдельным согласованием.

Статусы каждого пункта: NOT_STARTED / IMPLEMENTED_LOCAL / CI_PROVEN / PROVIDER_PERMISSION_VERIFIED / REAL_E2E_PROVEN / OWNER_ACCEPTED. Последний соответствует DONE только при выполнении конкретных gate ниже.

**Автономность и размещение:** дополнительно обязателен [ADR-001 — автономный GCE worker и BYOK inference](ADR-001-autonomous-runtime-cloud.md), особенно ADR-AT-01…ADR-AT-12. Наличие работающей VM/очереди **без фоновых модельных решений** не удовлетворяет определению автономного AI-маркетолога. Этот ADR — предлагаемая архитектура до подтверждения владельцем сервера/бюджета/провайдера.

**Обязательная привязка к существующим ресурсам lazysellerV2:** [ADR-002 — shared existing GCP project, verified WIF/SA, resource isolation, CLOUD-SHARE-01…12](ADR-002-shared-lazyseller-gcp-isolation.md). Нельзя закрывать R01.1 через создание нового облачного проекта, изменение SA IAM, reset общей VM или запуск внутри Product Factory. Existing live identity нужно подтвердить read-only до deployment; status пока UNVERIFIED.

## 2. DoD R01.1 — независимый фундамент, identity и policy

**Трассировка конечного ТЗ:** CORE-01 §§2,3,4,7,11; VISUAL-01; JOB-02 §§0–3,15–17; LIFE-03 §1; JOB-03 §§0,8,17–18.

**Что создаём:** изолированный Python Ayla runtime/DB/queue и API, config/dev/test; одно доменное ядро для будущих платформ, Threads OAuth connector, approval/permit system, frozen Persona/Visual master registry. **Архитектурное решение:** [AYLA-ADR-01 — автономная Google Cloud VM](AYLA-ADR-01-autonomous-runtime-google-cloud.md). Ngrok — только временный локальный туннель.

**DONE только если:**
1. Команда запуска из каталога ayla/, отдельные persistence namespace, project/account bindings, storage migrations; отсутствие каких-либо импортов calc JS, работы с saved portfolios или изменения калькуляторной страницы.
2. CanonRecord и LifeState поддерживают статусы/версии/ссылки на FriendGraph, LifeEvents и одобренный age/face master, даже если отдельные поля ещё не заполнены; никакого автоматического создания биографии.
3. Реальный JPEG доступен локально через Git checkout; verification SHA-256 = **3e866ee23d366f1736a60ac04c5d3e002e34d1eb1653b0ceb4080baf15c4f298**; изменение 1 байта блокирует использование.
4. Threads OAuth grant на владельческий аккаунт (для live gate), scopes/capabilities хранятся раздельно; отключение/revocation блокирует external writes.
5. DB-backed jobs переживают worker restart; lease/idempotency и retry semantics проверены; глобальный kill switch блокирует запись.
6. Run-mode явно различает interactive-only model vs autonomous-background inference; нельзя утверждать непрерывную интеллектуальную работу без настоящей модели, заранее согласованных credentials/cost limits.
7. Никакого переключения на другой аккаунт в обход отзыва разрешений; отдельный owner-only audit.
8. Контракт адаптера принимает platform/account/capability, может работать с mocked non-Threads adapter без реального подключения новой соцсети.
9. Реальная Compute Engine VM с отдельными web+worker, постоянной SQLite/WAL БД и off-VM backup/restore: подтверждены VM restart, Docker restart, worker heartbeat и сохранность due jobs; идентификаторы ресурсов и секреты зарегистрированы в закрытом owner ledger.
10. **Закрыть ChatGPT и выключить компьютер владельца:** после этого worker должен самостоятельно по расписанию вызвать LLM API, сформировать новое draft/evidence, сохранить результат и журнал затрат. Фоновый queue без реального LLM inference НЕ удовлетворяет этому условию.
11. Режимы owner approvals, отключённые external writes по умолчанию, лимиты LLM/медиа, расхождения учётной записи и пробуждения после сбоя проверяются на действительном runtime.

**Tests/Gate:** DB backup/restore and restart; token expiry/denial; double-run no duplicate; adversarial external-write attempts; cross-project leak; face hash corruption; mocked adapter compile; реальные account binding/scope evidence. Если аккаунт ещё не подключён, локальный компонент может быть CI_PROVEN, но R01.1 **не OWNER_ACCEPTED** по live gate.

**Не включаем:** создание контента, другие социальные коннекторы.

## 3. DoD R01.2 — исследовательский интеллект, жизненный сценарист и короткие тексты

**Трассировка:** CORE-01 §§1,4–7,9,12; PERSONA-02 §§2–5,9,12; LIFE-03 §§2–8,10–11; JOB-02 §§4–6,13,16,18; JOB-03 §§1–5,14.

**Что создаём:** доступный Threads/public research, HumanCreatorRegistry, evidence, абстрактный Social/Place/Emotion PatternLibrary, LifeEpisode proposal, ContentBrief с hypothesis и original short text.

**DONE только если:**
1. Найдены и с provenance сохранены **различимые реальные публичные авторы** той же выбранной или допустимой provisional географии/лайфстайл-ниши; human_likely ≠ доказанный паспортный статус, неизвестные источники не изображаются verified.
2. Есть воспроизводимый TRIANGULATE_3: три разных creator_id → social/place/emotion → оригинальный LifeEpisode. Применяются continuity, originality, geographical checks. Есть альтернативный CONTINUE_ARC без трёх новых источников.
3. Созданы исследования по интересам аудитории и тема с Evidence IDs; сегменты и соответствие человеческим ценностям не вычисляются из непроверенной демографии.
4. ContentBrief содержит value/segment/hook/source_or_LifeEvent/format/PersonaVersion/factual class/primary metric и explicit constraint short Threads.
5. Текст соответствует характеру Ayla, лаконичен, авторский, American English; не обязан продавать калькулятор. Реальные бизнес-факты только из проверяемого read-only ProductFacts snapshot; доступ к частным расчётам отсутствует.
6. Есть versioned corrections и оригинальность без копирования чужих текстов; меняется brief → устаревает approved exact output.
7. Через approved account опубликован реальный оригинальный TEXT post; сохранены remote ID, snapshot, original source, brief, version; failures unknown/pending, не success.

**Tests/Gate:** 3-source independence + no-copy negatives, LifeState collision, outdated data, privacy, false product claims, provider unavailable, queue re-delivery, real Threads original post ACK. **Future invariant:** те же Evidence/Brief/LifeEvent используются позже для любого канала, без переноса бизнес-логики в Threads publisher.

## 4. DoD R01.3 — неизменяемая внешность, изображения и карусели

**Трассировка:** CORE-01 §§3,4,7–8,12; VISUAL-01; PERSONA-02 §§5,8; JOB-02 §§7–8,18; JOB-03 §§6–9,19.

**Что создаём:** реальное image-reference conditioning, контролируемая генерация лица Ayla и фотографий её жизни, photo/carousel production, Threads publisher.

**DONE только если:**
1. У каждой генерации, изображающей лицо Ayla, генерируется versioned generation request с asset_id **ayla.face.master.v1**, file path и точным SHA256; генератор **обязан получить сам JPEG как image input**, не только текстовый prompt или ссылку на файл в описании.
2. Проектный reference resolver валидирует JPEG/байты до API вызова. Provider без image-to-image/reference-image способности → **unsupported/blocked**, а не fallback на text-to-image.
3. Original master immutable, его нельзя ни переписать output-изображением, ни обновить без решения OWNER. Все производные изображения имеют иные пути/hashes/lineage; сохраняются provider/model/settings/identity refs.
4. На визуальной приёмке есть как минимум три разных сцены Ayla с одним узнаваемым лицом: разные ракурсы, свет, окружение (конкретные контрольные сцены согласует владелец); лицо, возраст, скулы и мягкий объём щёк сравниваются именно с master. Порог автоматической метрики не выдумывать; допускается ручной visual pass.
5. Выпущены **готовый одиночный фотопост и готовая карусель из 2+ отдельных файлов** с композиционным QA, подписями, alt-text, sequence manifest.
6. Не допускать ситуации «карусель готова» при NotImplementedError: официальный Threads typed carousel publish действительно возвращает remote ID; вложенные изображения имеют согласованные child IDs и порядок.
7. Product/Persona QA, license/rights, hash, preview mobile и exact-version approval before write.
8. Таймаут/частичная загрузка/carousel children failure/дубликат/restart смоделированы и обработаны.
9. Финальный output и VisualIdentityManifest остаются **независимыми от Threads**: форматный адаптер берёт готовый asset, но не владеет образом Ayla.

**Tests/Gate:** corrupted master → blocked; provider prompt-only → blocked; source injection proof; 3 scene visual review; carousel 2+ asset manifest; real single-image + carousel remote IDs; no repeat after retry. **Это блокер R01 DONE.**

**Не включаем:** видео, Veo, voice, lip-sync, Instagram Stories.

## 5. DoD R01.4 — собственные комментарии как диалог и источник знания

**Трассировка:** CORE-01 §§2,5,7,9; JOB-01 §8; JOB-02 §§9,14–16,18; JOB-03 §§10–14.

**DONE только если:**
1. Получен **реальный comment/reply** под опубликованным постом; сохранены platform/account/post/parent/root IDs, context snapshot, cursor, edits/deletes, coverage.
2. Комментарии классифицируются **многометочно**: intent, topics, sentiment/stance, risk, meaningfulness, confidence, product-feedback и next-content-signal. Реакция на жизненную историю != коммерческий лид.
3. Реальный reply Ayla контекстный и по канону, с exact approved text; допустимо decision=no_reply.
4. Auto-reply mode OFF до permit; для разрешённых low-risk replies delay выбирается **один раз** в [60,3600] seconds, persisted due_at переживает restart; перед отправкой повторный permission/context/QA check.
5. Quota, deny spam/abuse, human escalation, dedup, invalid/edited/deleted parent, remote timeout/reconciliation доказаны тестами.
6. Отвечать/не отвечать и анализировать — **разные независимые результаты**. Каждый исходный комментарий может породить ContentFeedbackSignal с обоснованием, но не прямую публикацию.
7. Собственные replies Ayla не считаются исходными органическими комментариями аудитории; replies count и continuation анализируются отдельно.

**Tests/Gate:** real incoming reply, one valid reply remote ID after delay and recheck, restart/rate-limit/duplicate/delete, no_reply, high-risk escalation, feedback storage with evidence/coverage. **Future invariant:** CommentEvent/CommentAnalysis не привязаны к внутренней форме Threads response, а к нормализованной conversation модели.

## 6. DoD R01.5 — участие в чужих разговорах без продаж

**Трассировка:** CORE-01 §§2,5,7,9; PERSONA-02 §§2–4; LIFE-03 §§2–4,7; JOB-01 §§4–6; JOB-02 §§5–6,16,18; JOB-03 §§10–13.

**DONE только если:**
1. Реально обнаружены открытые релевантные обсуждения по нише, географии и ценностям аудитории через разрешённую Threads capability; хранить ссылки и разрешённый контекст, временные ограничения и причины отбора.
2. Opportunity scoring отделяет оригинальность вклада, topic fit, freshness, quality, risk и доступность write; нельзя просто брать аккаунты с большой аудиторией.
3. Reply Ayla даёт оригинальную мысль/иронию/вопрос по контексту, **без продаж Nomad360, URL, просьб подписаться и массовых комплиментов**.
4. Отдельные ExternalReplyPolicy, permissions, expiry, allowlist/topics, per-target and daily quotas, dedup и audit; own-comments permit не даёт автоматически external-write.
5. До real external post reply пользователь явно разрешил операцию либо действует специально утверждённая ограниченная политика; success подтверждён remote reply ID. При запрете/недоступном API — manual draft, а не обход.
6. Реакции на чужие replies сохраняются как отдельная observed conversation trajectory; **не** приписывать new follows конкретному ответу без измеряемой атрибуции.
7. Тексты подчиняются PersonaCanon и могут содержать **обычное живое общение**, не только маркетинговые аргументы.

**Tests/Gate:** live official discovery + full thread context, real external approved reply remote ID, no-sales QA adversarial tests, expired permit, blocked credentials, duplicate suppression. **Future invariant:** доменная модель Opportunity / Conversation независима от Threads discovery API, никаких других адаптеров R01 не требуется.

## 7. DoD R01.6 — метрики, обучение, живой пилот и выпуск

**Трассировка:** CORE-01 §§4,7,8,12; PERSONA-02 §12; LIFE-03 §§7–9,11; JOB-01 §§12–15; JOB-02 §§13–18; JOB-03 §§10–19.

**DONE только если:**
1. Реальные post-level и account-level insights собраны под подтверждёнными OAuth scopes; окна +1h/+24h/+7d имеют timestamp, provider raw refs, data-quality state, missing reason, coverage.
2. Отличать observed 0 от unknown; views/likes не становятся релевантными подписками, missing fields не дополняются нулём без явной provider semantics. Для несовместимых каналов future schema остаётся versioned.
3. QualifiedGrowthPolicy переиспользуется **по реальным доступным сигналам**; алгоритм не переписывать. Отдельно показывать audience attachment/life story following, conversations, product discovery и metric confidence.
4. Аналитика комментариев ведёт semantic clusters: вопросы, несогласие, полезные повторения, интерес к конкретным сюжетным аркам, визитам/местам, критику естественности, предложения калькулятору; sampling coverage, denominator и uncertainty.
5. Замкнута цепочка **Evidence → Topic → Brief → Script/ApprovedAsset → Published remote ID → Comments/Insights → LearningDecision → next Brief** с сохранёнными версиями и объяснением «почему так».
6. Есть минимум один отдельный LifeEpisode с продолжением и связью с реальным фидбеком, сохраняющий память, лицо и социальный граф Ayla.
7. Реализованы audit/export, daily report и weekly report, owner review интерфейс, контроль бюджета/лимитов, global pause, restart/backup restore, переход на новый цикл после сбоя.
8. Выполнен пилот на реальном аккаунте в разрешённом диапазоне частот; цель 10–12 самостоятельных постов/сутки проверяется только после первой измеренной базы и если не страдает качество.
9. Показана **демонстрация полного цикла**, а не набор unit mocks; реальные публикации и комментарии подтверждены remote IDs. Недоступные дополнительные возможности остаются в backlog с status unsupported/blocked.
10. Зафиксировано owner acceptance по каждому ранее принятому PR и общий release version/tag; никаких изменений калькулятора/донора.

**Tests/Gate:** Full official API E2E на своём Threads аккаунте; один успешный carousel, один photo post, short text and microstory; own reply and external reply; analytics and next-brief with evidence; restart/revocation/timeout; owner confirms persona consistency and relevance.

## 8. Итоговая матрица трассируемости

| Контракт конечной Ayla | R01.1 | R01.2 | R01.3 | R01.4 | R01.5 | R01.6 | Будущие релизы |
|---|---|---|---|---|---|---|---|
| CORE: Character, LifeState, immutable canon | Registry | LifeArc/original plots | face/scene QA | persona responses | conversational voice | life continuity proof | video/voice/live presenter |
| PERSONA: shared values / attainable aspiration | Data fields | audience fit + scripts | visual/lifestyle scenes | identification insights | right communities | validated hypotheses | new channels/audiences |
| LIFE: human creators & triangulation | Storage/roles | patterns & episode synthesis | visual episode scenes | discussion memory | creator radar | scenario improvement | richer geographic modalities |
| JOB: Research/Planner | Contract | Threads evidence & brief | content variants | reactions | opportunity scoring | closed learning | cross-platform orchestration |
| JOB: Content Factory-like output | Asset policy | exact short text | final image/carousel | reply asset/QA | external reply QA | output quality proof | full video/content studio |
| JOB: Publishing/permissions | policy/runtime | live TEXT | real IMAGE/CAROUSEL | live own reply | live external reply | integrated E2E | additional official adapters |
| JOB: Comments/metrology | Event schema | sources | publication lineage | multi-label analysis | external trajectories | qualified learning | cross-platform metrics/DM/Telegram |
| Brand scope: Calculator work, but not coupling | read-only facts interface | factual posts as optional | no forced CTA | product feedback | no external selling | voluntary interest separately | future commercial product Ayla |

**Запрещённый компромисс:** «Threads работает, но потом переделаем память, аккаунты, Persona, Evidence, ContentBrief или метрики под другие соцсети». Архитектура таких сущностей — часть R01 DoD сейчас.  
**Допустимый отложенный функционал:** конкретные Instagram/Facebook/LinkedIn/Telegram adapters, API scopes, reels/voice/lip-sync, B2B CRM, future Content Factory features — в R01 не писать.

## 9. Deliverable каждого PR / artefact ledger

В каждом PR обязателен каталог evidence (можно только sanitized redacted refs на private logs, без токенов):

- **R01.1:** architecture decision, dependency map, schema and migration, real OAuth scope receipt, persistent queue recovery, frozen image hash.
- **R01.2:** creator/evidence sample (без частных данных), два ContentBrief, TRIANGULATE_3 trace, короткие тексты, real TEXT post id.
- **R01.3:** face ref injection request proof, SHA-256, QA reference/derived comparison, photo/carousel manifests, real remote IDs.
- **R01.4:** comment context, classification snapshot, due_at unchanged across restart, remote own reply, manual escalation trace.
- **R01.5:** external post URL/context, opportunity decision, permit, non-sales QA, remote reply/denial evidence.
- **R01.6:** interval snapshots, raw provider metrics vs normalized values, comment coverage, thematic clusters, next ContentBrief, pilot report, owner acceptance.

Технически успешный тест в CI **не заменяет** факт успешного API действия или approval владельца. При отсутствии credentials выполнение отмечается CI_PROVEN / E2E_UNPROVEN, и этап не считается закрытым.

---

**Решение о реализации:** этот документ — детальный DoD на согласование. Полезный донор есть, но целый Ayla/Threads-продукт до live E2E ещё не существует; перенести код и прогнать старые тесты недостаточно. **Граница первой версии — полный агент для Threads с reusable persona/data contracts, не «первый кусок будущего мультиплатформенного монолита».**
