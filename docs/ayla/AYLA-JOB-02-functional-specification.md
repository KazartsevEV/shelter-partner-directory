# AYLA-JOB-02 — Her Job: формальная функциональная спецификация v0.1

> **Статус:** проект на техническое согласование, НЕ реализация и НЕ акт приёмки.  
> **Дата:** 21.10.2026.  
> **Проект:** Nomad360 Business Solutions / AI Marketer — Ayla.  
> **Область:** только работа Ayla по продвижению действующего Calculator V1/V2 Nomad360 и росту её аудитории как части Nomad360.  
> **Нормативные зависимости:** [AYLA-CORE-01](AYLA-CORE-01-persona-life-engine.md) — **утверждённый** контракт личности; [AYLA-JOB-01](AYLA-JOB-01-marketing-operations.md) — функциональные требования верхнего уровня, ещё на согласовании.  
> **Назначение:** исполнимая спецификация для инженера: состояния, DTO, входы/выходы, коннекторы, ошибки, правила принятия решений, показатели, тесты. Наличие строки здесь НЕ означает существование рабочей интеграции в коде.

**Специализация производственного цикла:** [AYLA-JOB-03 — Content Operations: производство, публикация, комментарии и обратная связь](AYLA-JOB-03-content-production-feedback-loop.md). JOB-03 конкретизирует создание аналитического ContentBrief, ProductionSheet, форматное производство, comment intelligence и feedback-to-brief без изменения персоны Ayla.

## 0. Условные обозначения и инварианты

- **MUST / SHALL (обязательно):** отсутствие — дефект приёмки.
- **SHOULD:** рекомендуемое поведение; исключение документируется.
- **MAY:** опциональное поведение, не объявлять реализованным без теста.
- **IN / OUT:** нормализованный тип входа и результата операции.
- **PL:** публичная платформа; **AI:** модельный вывод; **RT:** детерминированный серверный runtime; **OWN:** владелец проекта.
- **Provider capability:** подтверждение того, что функция предусмотрена официальным API. **Connection readiness:** права на конкретном аккаунте. **E2E proof:** фактическое успешное действие с реальным аккаунтом. Это три разные проверки.

Неприкосновенные инварианты:
- JOB-INV-01: один ProjectID = Nomad360 Business Solutions; субъект публичных сообщений — Ayla или официальная страница Nomad360 по правилам площадки.
- JOB-INV-02: контент, диалоги и решения Ayla сохраняют PersonaVersion и не изменяют утверждённый канон без отдельной операции владельца.
- JOB-INV-03: жизнь Ayla не является рекламным сценарием по умолчанию. Сюжет может не упоминать калькулятор.
- JOB-INV-04: текущие продажи только калькулятора и будущих индивидуальных внедрений; Ayla сама пока не продаётся.
- JOB-INV-05: любой внешний write имеет проверяемое разрешение, provenance и audit; без актуального разрешения — отказ.
- JOB-INV-06: null/unknown/unavailable ≠ числовой ноль; отсутствие API-метрики не превращается в измеренное значение.
- JOB-INV-07: личные сообщения доступны только владельцу; не публикуются и не импортируются в общедоступный сюжет Ayla.
- JOB-INV-08: код AI Content Marketer-донора и калькулятора не изменяется этим документом.
- JOB-INV-09: реальные события Nomad360 и художественные события Ayla имеют разные источники и типы достоверности.
- JOB-INV-10: запрет продаж, рекламных ссылок и просьб подписаться в чужих публичных дискуссиях.

## 1. Архитектурные границы и последовательность обработки

Компоненты:
1. Persona & Life Engine (из AYLA-CORE-01): CharacterState, CanonVersion, LifeEvent, Voice/Visual identity.
2. Her Job Marketing Intelligence: research, segments, competitors, opportunities, experiments, decision proposals.
3. Creative Studio: script, image/video generation, editing, asset provenance, platform package, QA.
4. Platform Gateway: normalized connector interfaces и per-account permission/capability.
5. Durable Operations: scheduler, workers, webhook inbox, idempotency, quotas, permits, cancel/pause.
6. Growth Ledger: raw platform measurements, mappings, aggregated metrics, learnings, reports.
7. Owner Control: approvals, audit, private Telegram notifications, emergency kill switch.

Поток:
- Исследование и публичная жизнь → гипотеза/сюжет → версия артефакта → QA → разрешение → отложенная запись → внешний ACK → измерение → learning → следующий план.
- Публичный комментарий → ingest → classification → policy → draft/QA → при необходимости approval → delay 1–60 мин → повторный контекстный check → внешний reply ID → metrics.
- Чужая ветка → discovery → quality/relevance → предложение добавочной мысли → разрешение для конкретной capability → публикация в чужой ветке → оценка реакции.
- DM → разрешённый webhook/poll → дедупликация → приватный анализ *только доступного профиля* → Telegram alert владельцу → ACK; не добавлять исходный текст в общую память.

**Разделение AI/RT:** семантический анализ, новые креативные решения и профильные сводки требуют реально доступной модели. RT может самостоятельно исполнять ранее подготовленные разрешённые задания и собирать события; закрытая сессия Custom GPT НЕ даёт гарантии автономного model inference. Никакой новый платный LLM API не подключается без решения OWN.

## 2. Канонические типы и поля

Все IDs — строковые opaque IDs (не генерировать из display name). Все timestamps — RFC3339 с offset/UTC; у операции есть created_at, updated_at и version. Строка с платформенным ID не должна считаться уникальной без account_id и platform.

### 2.1. Базовый EventEnvelope

~~~json
{
  "schema_version": 1,
  "event_id": "opaque",
  "event_type": "comment.received",
  "project_id": "nomad360",
  "platform": "threads",
  "account_id": "opaque",
  "remote_id": "opaque-or-null",
  "occurred_at": "2026-10-21T12:00:00Z",
  "observed_at": "2026-10-21T12:00:05Z",
  "source": {"kind": "api_webhook", "provider_event_id": "opaque"},
  "payload_ref": "private-or-public-storage-ref",
  "visibility": "public",
  "dedup_key": "platform:account:remote:event-type",
  "confidence": null
}
~~~

**EV-01:** event_id immutable; original event stored append-only.  
**EV-02:** webhook raw payload хранится отдельно и в соответствии с privacy class; публикационный контент не содержит private payload_ref.  
**EV-03:** обработчик подтверждает receipt быстро, семантический анализ выполняется асинхронно.  
**EV-04:** два одинаковых provider_event_id + event_type + account_id дают один логический EventEnvelope.  
**EV-05:** если provider_event_id отсутствует, dedup строится по разрешённому remote_id/version/timestamp/hash, с учётом edits.

### 2.2. PlatformAccount

~~~json
{
  "account_id": "opaque",
  "platform": "instagram",
  "account_kind": "professional_business",
  "public_identity": "Ayla at Nomad360",
  "remote_account_id": "opaque",
  "owner_project_id": "nomad360",
  "credential_ref": "secret-store-ref",
  "connection_status": "connected",
  "capabilities": [],
  "last_probe_at": "2026-10-21T12:00:00Z"
}
~~~

account_kind: threads_profile | instagram_business | instagram_creator | facebook_page | telegram_channel | telegram_bot | telegram_group | linkedin_organization | other_verified. Сохранять remote_account_id и поля ролей/разрешений; credential_ref не выводить в GPT/лог/контент.

### 2.3. CapabilityRecord

~~~json
{
  "account_id": "opaque",
  "platform": "threads",
  "action": "public.search",
  "provider_api": "official",
  "provider_support": "documented",
  "permission_state": "granted",
  "e2e_state": "unproven",
  "operational_state": "manual_only",
  "scope_names": ["threads_keyword_search"],
  "required_account_kind": "threads_profile",
  "verified_at": null,
  "evidence_ref": null,
  "reason": "Real-account acceptance not recorded"
}
~~~

Enums:
- provider_support: documented | uncertain | unsupported.
- permission_state: granted | missing | expired | pending_review | unknown.
- e2e_state: proven | unproven | failed.
- operational_state: enabled | read_only | manual_only | disabled.
- action: profile.read, public.search, competitors.read, posts.publish, stories.publish, reels.publish, carousel.publish, posts.insights, account.insights, comments.read, comments.reply_own, comments.reply_external, inbox.read, telegram.send, telegram.poll, telegram.invite_link, audience.read.

**CAP-01:** enabled write требует documented+granted+proven+owner permission, без исключений.  
**CAP-02:** read_only не разрешает write.  
**CAP-03:** отказ permission/API переводит capability в нужный unavailable state, а не в simulated success.  
**CAP-04:** еже-действийный preflight перед внешним write, а не только в момент подключения.  
**CAP-05:** feature-level матрица: общий статус «Instagram подключён» не разрешает Stories/DM автоматически.

## 3. Коннекторы: обязательный контракт интерфейса

Нормализованный интерфейс (не требует одинаковых REST endpoints у платформ):

~~~text
probe(account_id) -> CapabilityRecord[]
read_profile(account_id) -> PublicProfile | Unavailable
search_public(account_id, query, cursor, limit) -> PublicPostPage | Unavailable
read_public_thread(account_id, thread_remote_id, cursor) -> ThreadSnapshot | Unavailable
read_own_comments(account_id, post_remote_id, cursor) -> CommentPage | Unavailable
read_insights(account_id, object_ref, window) -> MetricSnapshot | Unavailable
publish(account_id, publication_package, idempotency_key) -> RemotePublication
reply_own(account_id, parent_remote_id, exact_text, idempotency_key) -> RemoteReply
reply_external(account_id, parent_remote_id, exact_text, idempotency_key) -> RemoteReply
read_inbox(account_id, cursor) -> PrivateMessagePage | Unavailable
~~~

Операция обязана возвращать source provider, raw observation ref, provider timestamps, remote IDs и нормализованную ошибку. Отсутствующая функция НЕ реализуется автоматическим HTML-scraping закрытого аккаунта.

### 3.1. Capability matrix — целевая, не список готовых интеграций

| Платформа | Публикации | Собственные комментарии | Чужие дискуссии | Insights | Личные сообщения |
|---|---|---|---|---|---|
| Threads | Текст/медиа (подтвердить scopes и live) | Read/reply (подтвердить) | Keyword search и permitted reply — отдельно probe/write acceptance | Post views, likes, replies, reposts, quotes, shares; другие сигналы отдельно | **Unverified** |
| Instagram | Business/Creator: feed/Reels/carousels; Stories только при поддерживаемом типе аккаунта/permissions | Подтверждать comments scopes | Не обещать массовое чтение/ответы в любых сторонних постах | Account/media insights per permission | Professional Messaging при approved scopes |
| Facebook | Page text/media/video, Reel — отдельная проверка | Page comments при scopes | Только если API/группа/страница явно разрешают | Page/post insights | Page Messenger при permissions/Advanced Access |
| Telegram | Bot как администратор канала, sendMessage/sendPhoto/sendVideo/sendPoll | Discussion group, если бот имеет права | Доступные боту чаты; не глобальный поиск чужих Telegram-дискуссий | Chat member count, просмотры/статистика в реально доступной форме | Только сообщения, доступные боту |
| LinkedIn | Organization Posts: text/images/videos/documents/multi-image; **organic carousel ≠ ad carousel** | Comments при подтверждённых scopes | Read/write только при разрешённых scopes/объектах | Organization/post analytics в доступном объёме | **Unverified/manual_only** |

Источники (проверять версию на этапе коннектора):
- Threads API — https://www.postman.com/meta/threads/overview ; поиск https://www.postman.com/meta/threads/request/m9j4i2x/search-for-threads-posts ; replies https://www.postman.com/meta/threads/request/y4uzu58/respond-to-replies ; post insights https://www.postman.com/meta/threads/request/434u2bd/get-post-insights
- Instagram — https://www.postman.com/meta/instagram/collection/6yqw8pt/instagram-api ; документация https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- Messenger Conversations — https://www.postman.com/meta/messenger-platform-api/folder/22794852-255610cd-47f5-4f4d-b3fa-71aec360be9a
- Telegram Bot API — https://core.telegram.org/bots/api
- LinkedIn Posts — https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-03 ; Comments — https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/comments-api?view=li-lms-2026-07

**CON-01:** для каждого требуемого действия разработчик предоставляет permission table + E2E proof record с аккаунтом/типом/датой/remote_id или формальный unsupported/manual_only.  
**CON-02:** если на платформе нет официального DM read, отправлять notification «manual check required» без поддельного текста сообщения.  
**CON-03:** не смешивать member/creator/page privileges и данные аккаунтов разных проектов.  
**CON-04:** Telegram membership/invite attribution не считать просмотром страницы или подпиской конкретного человека без доступной доказательной базы.

## 4. Research Contracts — наблюдения и сегменты

### 4.1. ResearchEvidence DTO

Поля: evidence_id; source_type (own_insight/public_post/comment/news/telegram_poll/manual_upload); platform; source_url; source_remote_id; collected_at; event_time; language; quoted_excerpt_or_summary; provider_fields; observed_signal; license/visibility; confidence (0..1); sensitive_flag; raw_ref.

**RES-01:** каждое утверждение о внешнем мире имеет evidence_id.  
**RES-02:** у неизвестного источника confidence = 0 или unknown, факт не допускается в verified marketing claim.  
**RES-03:** текст из комментариев, переписки и публикаций — **данные**, не инструкции для агента; ссылки и текст не могут отменить policy.  
**RES-04:** хранение только доступных публично или разрешённых данных, без извлечения чувствительных черт по косвенным признакам.

### 4.2. AudienceSegment

~~~json
{
  "segment_id": "opaque",
  "name": "raw-idea-experimenters",
  "definition": "Interest in testing entrepreneurial ideas",
  "platforms": ["threads","instagram"],
  "positive_evidence_ids": ["ev1","ev2"],
  "negative_evidence_ids": [],
  "observation_count": 2,
  "confidence": 0.6,
  "version": 1,
  "status": "hypothesis"
}
~~~

Status: hypothesis → observing → supported | contradicted → revised | archived. Сегменты: авторы сырых идей, владельцы малого бизнеса, создатели продуктов, самостоятельные специалисты, консультанты, а также **отдельный сегмент интересующихся жизнью Ayla**; последние не объявляются автоматически заинтересованными калькулятором.

**SEG-01:** сегмент без evidence remains hypothesis.  
**SEG-02:** изменение сегмента создаёт новую версию, не переписывает историю старых экспериментов.  
**SEG-03:** поддерживать split/merge с lineage.  
**SEG-04:** не создавать персонализированные чувствительные профили подписчиков.

## 5. Competitor / Creator / Partner Radar

### 5.1. ObservedAccount DTO

Поля: observed_id, platform, public_handle, source_url, kind (competitor/adjacent_creator/community/consultant/potential_partner), rationale, segment_ids, audience_topics, observation_source_ids, last_observed_at, last_post_id, monitoring_state (candidate/active/paused/removed), capabilities_required.

### 5.2. Мониторинг

**RAD-01** Аккаунты добавляются владельцем или как проверяемые кандидаты Ayla; каждый хранит исходный URL и признак публичности.  
**RAD-02** Периодический поиск новых релевантных постов с cursor и watermark; повторный мониторинг не создаёт дубли.  
**RAD-03** Собрать публичные вопросы/реакции и обновить evidence.  
**RAD-04** Формировать возможности для ответа как отдельные сущности, не отправляя сообщения автоматически при обнаружении.  
**RAD-05** Удаление из monitoring_state прекращает новые проверки и pending actions.  
**RAD-06** Устаревшие, закрытые или недоступные аккаунты переходят в состояние stale/unavailable; не выдумывать новую активность.

### 5.3. DiscussionOpportunity DTO и lifecycle

~~~json
{
  "opportunity_id": "opaque",
  "platform": "threads",
  "account_id": "ayla-owned-account",
  "source_post_id": "remote-public-post",
  "source_url": "https://example.org/public-post",
  "observed_account_id": "opaque",
  "source_evidence_ids": ["ev1"],
  "audience_segment_ids": ["raw-idea-experimenters"],
  "freshness_seconds": 7200,
  "relevance_score": 0.84,
  "original_contribution_score": 0.91,
  "risk_level": "low",
  "available_action": "proposal_only",
  "expires_at": "2026-10-22T00:00:00Z",
  "state": "proposed"
}
~~~

Lifecycle: discovered → evaluated → proposed → approved → queued → published | expired | rejected | unsupported | failed.

**OPP-01:** источники и исходный контекст обязательны, включая parent/replies где разрешено.  
**OPP-02:** score делится на topic fit, novelty, discussion relevance, freshness, risk; **не** равен числу подписчиков. Веса — конфигурация владельца, не скрытая генерация модели.  
**OPP-03:** один и тот же source_post_id и account_id не должен создавать несколько одновременных автоматических ответов.  
**OPP-04:** если срок актуальности истёк, не отправлять отложенный ответ.  
**OPP-05:** если обсуждение недоступно или read-only, сформировать ссылку/черновик для OWN, не обходить блокировку.

## 6. External Discussion Reply — обязательное разделение с owned replies

### 6.1. Правила текста

- Ответ должен точно отвечать на обсуждаемую тему и добавлять мысль, пример, остроумный поворот или уточняющий вопрос.
- **Нельзя** включать рекламу, коммерческое предложение, URL Nomad360, приглашение на страницу или «follow me» в чужую дискуссию.
- Нельзя массово повторять текст между чужими ветками, копировать собеседников, искусственно провоцировать конфликт, выдавать Ayla за независимого реального клиента.
- Соблюдать принципы персонажа AYLA-CORE-01 и честно отвечать, если собеседник спрашивает о её AI-природе.

### 6.2. ExternalReplyPolicy

Поля: owner_approved; platform; account_id; allowlisted_topics; allowed_targets (specific accounts или approved discovery); max_per_day; max_per_target_per_day; cooldown_minutes; maximum_risk = low; require_originality = true; expires_at; kill_switch.

Это **отдельная политика** от ответов на свои комментарии.

**EXT-01:** default = proposal_only, write отключен.  
**EXT-02:** сам факт конкурента/потенциального партнёра не разрешает писать в его ветки.  
**EXT-03:** до публикации — отдельный QA против продаж, ссылок, шаблонов, несущественности и контекстного несоответствия.  
**EXT-04:** bounded_autonomy действует только на allowlisted capabilities, с quota reservation.  
**EXT-05:** ответ может быть отправлен только при provider_support=documented, permission=granted, e2e_state=proven, operating_state=enabled.  
**EXT-06:** результат хранит remote_reply_id, время, raw API receipt; статистика follower-attribution остаётся unknown без доказательств.  
**EXT-07:** при отказе или истечении permit никаких повторов с другой учётной записи и скрытых обходов.

## 7. Creative Studio — типизированный процесс выпуска

### 7.1. CreativeBrief DTO

Поля: brief_id, mode (life_narrative/audience_conversation/product_fact/build_in_public), platform, format (text/image/reel/story/carousel/video), audience_segment_ids, hypothesis_id, hook_type, plot/life_event_id (nullable), PersonaVersion, product_facts_version, language, requested_outputs, render_budget, approval_policy, source_evidence_ids.

Life narrative не обязан иметь product CTA. Product facts требует проверяемый фактический источник.

### 7.2. MediaArtifact DTO

Поля: asset_id, asset_type, mime_type, dimensions, duration_ms (для видео), language, shot_list_ref, text_layer_manifest, audio_ref, caption_ref, cover_ref, source_refs, rights_status, persona_similarity_status, visual_qa_status, factual_qa_status, platform_qa_status, render_manifest_ref, sha256, storage_ref, cost_breakdown, version, status.

**MEDIA-01:** Story — финальное медиа или серия, плюс спецификация недоступных через API stickers; не выдавать placeholder за готовое.  
**MEDIA-02:** Reel — готовый видеофайл с правильной вертикальной геометрией, обложкой и проверенным звуком/субтитрами по заданию.  
**MEDIA-03:** Carousel — упорядоченные финальные изображения с читабельной типографикой.  
**MEDIA-04:** Generated face/body/voice соответствует PersonaVersion и истории; несовпадение блокирует publish.  
**MEDIA-05:** Сохранять исходники, права и SHA256; повторный рендер с иными параметрами создаёт новую версию.  
**MEDIA-06:** Нельзя присваивать состояние ready, пока нет финального файла; бриф/сценарий = промежуточные artifacts.  
**MEDIA-07:** Не использовать вымышленные сюжетные события как доказательство реального релиза, подписчика или клиентского кейса.
**MEDIA-08:** Не подключать платных внешних AI-провайдеров без owner approval и бюджета.

### 7.3. Состояния и ошибки

Creative lifecycle: brief → concept → scripted → assets_ready → rendered → qa_passed → approved → packaged; в каждом допустим rejected/blocked/failed, а переход в approved требует QA. Постфактум не изменять asset версии, уже привязанной к публикации.

QA categories: face/identity, chronology, layout/safe-area, format, sound, text, subtitles, copyright, factual claims, repetition, brand, disclosure. QA output: pass/fail + defects[] + evidence[] + revision guidance. Модель не может проставить сама себе deterministic pass для отсутствующего файла.

## 8. Publication Package и scheduler

### 8.1. PublicationPackage DTO

~~~json
{
  "publication_id": "opaque",
  "project_id": "nomad360",
  "platform": "threads",
  "account_id": "opaque",
  "creative_artifact_ids": ["asset1"],
  "content_text": "Original approved copy",
  "format": "text",
  "persona_version": 1,
  "life_event_id": null,
  "hypothesis_id": "hyp1",
  "approval_id": "appr1",
  "qa_evidence_ids": ["qa1"],
  "scheduled_at": "2026-10-21T16:00:00Z",
  "expires_at": null,
  "idempotency_key": "nomad360:threads:opaque:publication1:v1",
  "status": "approved"
}
~~~

### 8.2. Состояния публикации

draft → qa_pending → qa_passed → awaiting_approval → approved → scheduled → leased → submitting → published (remote_id required).

Альтернативы: rejected, cancelled, blocked_permission, blocked_capability, blocked_quota, expired, retry_wait, unknown_remote_result, failed, quarantined.

**PUB-01:** переход в submitting только из действительного permit, действующих scopes, QA exact-version и при отсутствии global/platform kill switch.  
**PUB-02:** ошибка timeout после отправки = unknown_remote_result; прежде чем повторить, выполнить reconciliation по возможному remote ID/контенту, иначе риск дубликата.  
**PUB-03:** published требует actual remote post ID и provider timestamp/receipt; отсутствие ID запрещает состояние published.  
**PUB-04:** идемпотентный ключ уникален для platform+account+exact artifact version+job; рестарт не отправляет дважды.  
**PUB-05:** изменение контента/медиа после approval сбрасывает QA/approval и создаёт новую версию.  
**PUB-06:** публикация в ином аккаунте после отказа первого не запускается автоматически.  
**PUB-07:** scheduling timezone-aware с UTC в БД, local audience timezone только для планирования.  
**PUB-08:** надёжное исполнение background jobs не означает фоновую творческую генерацию модели.

### 8.3. Threads cadence

Planner должен поддерживать исходную цель **10–12 самостоятельных оригинальных веток в сутки** на Threads. Счётчик standalone_posts исключает own_reply и external_reply. Неисполненные ветки показываются как missed/blocked, а не «опубликованные».

Проверять платформенные квоты до планирования; недопустимо достигать cadence повторами или ухудшением содержания. Временные слоты конфигурируются после исследования аудитории; не задавать произвольные часы как утверждённый оптимум.

### 8.4. Metrics collection windows

После published ставить подтверждаемые сборы +1h, +24h, +7d (поддерживается концепцией существующего донора). Не копировать raw snapshot в более раннее окно; сохранять collected_at, window_start/end, provider timestamp и record completeness.

## 9. Owned Comments: ingest, classification, answer

### 9.1. Comment DTO

Поля: comment_id (local), platform, account_id, remote_comment_id, root_post_id, parent_comment_id, author_public_ref, text, language, created_at, edited_at, visibility, source_event_id, thread_context_ref, source_snapshot_version, status (new/processed/deleted/hidden).

### 9.2. Классификация

Intent = question | praise | debate | objection | bug_report | feature_request | support | partnership | complaint | spam_abuse | other.  
Risk = low | medium | high.  
Classification DTO: intent, risk, confidence (0..1), reasons[], source_snapshot_id, source_comment_id, classification_version, requires_owner_review.

**COM-01:** ingest сохраняет исходный текст и всю доступную цепочку, не только последнюю реплику.  
**COM-02:** fallback на ошибку модели → risk=medium/high, confidence=0, no automatic reply.  
**COM-03:** замечания об ошибке/предложении функции → FeedbackRegistry, дубликаты не терять.  
**COM-04:** коммерческие обращения/сотрудничество → owner alert, не придумывать условия сделки.  
**COM-05:** на spam_abuse не отвечать автоматически.  
**COM-06:** решение «не отвечать» также логируется с reason.

### 9.3. AutoReplyPolicy

Default: disabled. В доноре CommentAutoReplyRules.enabled=false, allowed_intents=(praise), per_post_burst_max=3 / 5min; CommentClassification.auto_reply_eligible требует risk=low, confidence >= 0.85 и intent question/praise. Для Ayla дополнительно формализуется:

- enabled_by_owner; allowed_intents; minimum_confidence >= 0.85; platform/account allowlist;
- per_account_daily_cap; per_post_burst policy; cooldown; audit;
- exact source comment ID + classification snapshot + exact draft artifact version + QA;
- excludes private messages, medium/high risk, spam, bug/feature commitments, financial/contract claims without approval.

Нельзя предположить, что автоматические вопросы «уже работают», лишь потому что классификатор имеет соответствующий enum: правила по умолчанию разрешают только praise и отключены.

### 9.4. Случайная задержка

**COM-07:** при переходе разрешённого автоответа в queued **один раз** выбирается D = random integer in [60, 3600] seconds, равномерно или согласно явно утверждённому распределению; выбор выполняется криптографически/системно безопасным генератором; не создавать «человекоподобное» уклонение от детекции.  
**COM-08:** due_at = queued_at + D, хранится durably; restart/lease renewal не пересэмплирует D.  
**COM-09:** до отправки повторно читать релевантный контекст и права; при изменении контекста — cancel/re-review, не отправлять устаревший текст.  
**COM-10:** provider rate limit/quotas имеют приоритет над due_at; при невозможности отправить в окно ответ откладывается с причиной или отменяется.  
**COM-11:** private owner alert никакому random delay не подчиняется.  
**COM-12:** повторный delivery/event/job не дублирует reply_remote_id.

Reply states: candidate → classified → drafted → qa_passed → (awaiting_approval | authorized) → queued → due → submitting → sent | suppressed | cancelled | expired | failed | unknown_remote_result.

### 9.5. ReplyJob DTO

~~~json
{
  "reply_job_id": "opaque",
  "source_comment_id": "opaque",
  "source_snapshot_version": 3,
  "classification_id": "opaque",
  "draft_version": 2,
  "exact_text_sha256": "hex",
  "policy_id": "auto-reply-v1",
  "approval_id": null,
  "risk": "low",
  "confidence": 0.92,
  "queued_at": "2026-10-21T12:00:00Z",
  "delay_seconds": 1920,
  "due_at": "2026-10-21T12:32:00Z",
  "status": "queued",
  "provider_reply_id": null
}
~~~

При execution-time изменении exact_text_sha256 / risk / classification / approval_id → block, новый QA+approval обязателен.

## 10. Direct Message notification: приватный Telegram владельцу

### 10.1. PrivateMessageEvent

Поля: event_id, platform, account_id, conversation_remote_id, message_remote_id, sender_public_ref, received_at, text_ref_encrypted, attachment_metadata, webhook_verified, sender_public_profile_evidence_refs, processing_status, privacy_class=private.

**DM-01:** все поступающие разрешённые сообщения обрабатываются не через публичную очередь контента, а через отдельный private pipeline.  
**DM-02:** идентичные webhook events не создают повторных оповещений.  
**DM-03:** исходный текст передаётся неизменённым, если provider и владелец разрешают; длинные тексты могут отправляться несколькими приватными сообщениями либо безопасным вложением.  
**DM-04:** анализ профиля — строго из разрешённых публичных полей. Отдельно указываются факты, вероятные интерпретации, confidence, неизвестные поля.  
**DM-05:** не придумывать работу, доход, географию, намерение, релевантность или знакомство с отправителем.  
**DM-06:** не отправлять ответ пользователю автоматически; создаётся только уведомление и, по просьбе владельца, draft reply.  
**DM-07:** доступность IG/Facebook DM зависит от соответствующих permissions/Advanced Access; Threads/LinkedIn DM — manual_only, пока E2E proof не получен.

### 10.2. OwnerAlert DTO

~~~json
{
  "alert_id": "opaque",
  "owner_chat_id_ref": "secret-config",
  "kind": "direct_message",
  "platform": "instagram",
  "sender": {"public_name": "example", "profile_url": null},
  "original_text_private_ref": "encrypted-ref",
  "profile_digest": {
    "public_description": "Profile describes itself as a business blogger",
    "topics": ["small business"],
    "possible_reason": "question",
    "confidence": 0.51,
    "unknowns": ["employment", "identity"]
  },
  "conversation_deeplink": null,
  "status": "queued",
  "dedup_key": "instagram:account:message_id",
  "created_at": "2026-10-21T12:00:00Z"
}
~~~

**DM-08:** owner_chat_id конфигурируется через подтверждённую привязку и проверку только личного диалога; channel_id и group_id не могут быть подставлены в owner alert.  
**DM-09:** Telegram sendMessage/другой подходящий безопасный метод возвращает message_id; статус delivered только после Telegram ACK; ошибки retry с backoff и dedup.  
**DM-10:** target processing SLA (проектное, не гарантированное): первый alert в пределах 2 минут p95 после получения webhook при доступном provider и Telegram. Поступление исходного события от площадки само по себе может задерживаться.  
**DM-11:** если AI для экспресс-анализа недоступен, отправить исходный текст без задержки, digest пометить pending/unavailable; последующее уточнение отдельно.  
**DM-12:** личные тексты никогда не попадут в Analytics/Event-public reports/Persona Life Narrative. Retention политики хранилища определить до production, включая право удаления.

## 11. Telegram Community: co-creation workflows

### 11.1. Права и контуры

- Channel: публичные анонсы, новости, опросы, просьбы протестировать.
- DiscussionGroup: только если привязана и бот наделён правами; вопросы и ответы.
- OwnerPrivateBot: совершенно отдельно, только владелец; DM/bug alerts.
- Все три объекта имеют разные ID, permissions, назначения и privacy class.

### 11.2. CommunityProposal DTO

Поля: proposal_id, source_message_id/url, author_ref_minimized, received_at, category (feature/bug/idea/test_feedback), original_summary, duplicates[], votes_or_poll_ref, status, owner_decision, related_release_ref, public_followup_id.

Lifecycle: received → triaged → grouped → awaiting_owner → accepted | declined | deferred → in_progress → released → community_notified.

**TG-01:** Ayla может создавать опросы с вопросами и вариантами; сохранять bot message_id и poll_id, когда API их возвращает.  
**TG-02:** owner decision обязателен перед обещанием реализации.  
**TG-03:** подтверждённый релиз → разрешено сообщать «реализовали по вашей обратной связи», с issue/release evidence; без факта релиза нельзя.  
**TG-04:** новости должны иметь источник, дату, distinction факт/прогноз.  
**TG-05:** разные invite links для добровольной кампании можно создавать при административных правах, использовать для **агрегированного** source attribution, не выдавать за точную личную причинность.  
**TG-06:** не извлекать приватные результаты голосований/переписок сверх реально предоставленного ботом.

## 12. LinkedIn professional story и B2B lead handoff

**LI-01:** публиковать только достоверную историю Nomad360: функции Calculator, документированные релизы/ошибки/эксперименты, развитие Ayla и Content Factory лишь по мере реальной реализации.  
**LI-02:** поддерживать publication on official Nomad360 organization/page с подтверждёнными разрешениями. Не создавать неподтверждённый фиктивный личный аккаунт в обход правил.  
**LI-03:** при профессиональном обращении за индивидуальной адаптацией передавать собственнику платформу/публичный профиль/исходное сообщение в приватный процесс, а не вести переговоры от имени компании.  
**LI-04:** не считать рекламные carousel capabilities органическими: использовать permitted media/document/multi-image.  
**LI-05:** профиль потенциального B2B-партнёра в research radar ≠ разрешение cold DM/outreach.  
**LI-06:** вне функции Her Job: CRM, прайсы, предложения, счета, договоры, продажи.

## 13. A/B Experiment Contract

### 13.1. Experiment DTO

~~~json
{
  "experiment_id": "opaque",
  "hypothesis_id": "hyp1",
  "platform": "instagram",
  "segment_id": "seg1",
  "factor": "opening_hook",
  "control_version": "A-v1",
  "treatment_version": "B-v1",
  "primary_metric": "share_rate",
  "secondary_metrics": ["save_rate"],
  "assignment_method": "observational_matched",
  "design_limitations": ["unequal audience exposure"],
  "window_start": "2026-10-21T00:00:00Z",
  "window_end": "2026-10-28T00:00:00Z",
  "minimum_exposure_rule": "to-be-owner-approved",
  "decision_rule": "to-be-owner-approved",
  "status": "draft"
}
~~~

**EXP-01:** до старта определить основную метрику, изменяемый фактор, окно, правило вывода и целевой сегмент.  
**EXP-02:** если платформа не позволяет случайно разделить сравнимую аудиторию, метод observational/quasi, НЕ randomized A/B.  
**EXP-03:** не считать единственный пост с большим охватом статистически доказанным победителем.  
**EXP-04:** сохранять raw measurements, denominators, недоступные поля, confidence и внешние события, которые могли сместить выборку.  
**EXP-05:** запрещены массовые повторы практически идентичного текста ради теста.  
**EXP-06:** close эксперимент только после data completeness проверки или явной метки inconclusive, с версионированным learning decision.

## 14. Metric Ledger, измерения и определения

### 14.1. MetricObservation DTO

~~~json
{
  "observation_id": "opaque",
  "platform": "threads",
  "account_id": "opaque",
  "scope": "post",
  "object_remote_id": "opaque",
  "metric_name": "shares",
  "raw_value": 12,
  "unit": "count",
  "window_start": "2026-10-21T00:00:00Z",
  "window_end": "2026-10-22T00:00:00Z",
  "collected_at": "2026-10-22T00:15:00Z",
  "source_provider": "official_api",
  "source_raw_ref": "raw1",
  "data_quality": "observed",
  "confidence": 1,
  "missing_reason": null
}
~~~

quality = observed | provider_derived | model_estimate | manual_verified | unavailable. Для unavailable raw_value=null и missing_reason обязателен. Не записывать synthetic model estimate как observed.

### 14.2. Производные метрики и делители

В расчётах сохранять numerator, denominator, окно и availability, а не только готовый процент.

- NetFollowerGrowth(t0,t1) = followers_end − followers_start, **account-level**; un/follows отдельно, если доступны. Иначе только net, не «новые подписчики от конкретного поста».
- FollowGrowthRate = (followers_end − followers_start) / followers_start × 100%, если followers_start > 0; иначе undefined.
- EngagementByReach = (eligible_interactions / reach) × 100%, только если reach действительно доступен и eligible_interactions оговорены. Если provider показывает impressions, не подменять ими reach.
- ShareRate = shares / eligible_reach × 100%, SaveRate аналогично; при отсутствии reach можно показывать raw counts или явно named альтернативный denominator.
- VideoRetention = provider-specific complete_watch/started_watch или retention_metric, только при документированной семантике. AvgWatchTimeSeconds — отдельная величина, не проценты.
- MeaningfulReplyCount = число комментариев с человеческой или одобренной алгоритмом содержательной классификацией; сохранять classifier version/confidence.
- CommunityParticipation = уникальные разрешённо наблюдаемые участники с осмысленным действием за окно, если уникальность доступна; иначе число событий, без ложного unique.
- WebsiteVisitsBySource = агрегированные visit sessions из размеченных ссылок/согласованной analytics. Не утверждать, что переход завершился использованием калькулятора, если этого не измеряли.
- NewQualifiedFollows = валидированная platform-specific метрика, если источник позволяет определить релевантность. Иначе unknown, не выводить из лайков или охвата.

**MET-01:** window/scope/account принадлежность обязательны.  
**MET-02:** post insights ≠ account insights и не создают причинность post→follower.  
**MET-03:** технически пустое значение и измеренный 0 различать.  
**MET-04:** время и тип аналитики для разных платформ нормализуются на уровне семантики, а не насильственно суммируются.

### 14.3. QualifiedGrowthPolicy — контракт донора

Переиспользовать **без изменения формулы** действующий QUALIFIED_GROWTH из AI Content Marketer (planner.py):

| Сигнал | Исходный вес |
|---|---:|
| relevant_follows | 0.30 |
| repeat_viewers | 0.15 |
| opt_ins | 0.15 |
| profile_visits | 0.10 |
| saves | 0.10 |
| shares | 0.10 |
| retention_rate | 0.10 |

Существующий planner работает по candidate signals и confidence. При отсутствии надёжных данных используется равный cold_start_score, **не прогноз из views/likes**. Mapping provider→signal реализуется отдельно с версией mapping, confidence и evidence; не суммировать разные по смыслу сигналы только из-за одинакового имени поля.

**MET-05:** до первого реального сбора baseline оставлять metrics unknown; целевые проценты на 28/90 дней устанавливаются после baseline владельцем.  
**MET-06:** рост подписчиков самой Ayla учитывается как актив Nomad360, но не равен регистрациям/покупкам или использованию калькулятора.  
**MET-07:** по каждой площадке отдельно показать qualified growth, разговоры, brand discovery, а Telegram — co-creation, LinkedIn — professional interest. Не смешивать всё в один произвольный сводный KPI.
**MET-08:** данные после редакции/удаления публикации сохраняют корректную lineage и новый revision.

## 15. Learning and reporting

**LERN-01:** каждое решение сохраняет source experiment/hypothesis/evidence IDs, previous policy, new policy, rationale, reviewer, version.  
**LERN-02:** день — operational digest (новые темы, доступность, ошибки, comments, DM alerts); неделя — сегменты, гипотезы, креативы, платформы, внешние обсуждения; после эксперимента — formal decision.  
**LERN-03:** показывать владельцу разделённые **измерения / интерпретации / рекомендации**.  
**LERN-04:** не считать spike без контроля неопределённости доказательством эффективности.  
**LERN-05:** learning может предложить новое распределение типов контента, но не меняет consent scopes, Persona canon, лимиты/оплаты без OWN approval.

## 16. Actions / серверный API — логический контракт v1

API методы ниже — **проектный внутренний интерфейс**, не обещание существующих REST endpoints донора и не окончательная OpenAPI schema. Во всех вызовах обязательна серверная проверка project/account/actor и schema_version. Каждый action возвращает: request_id, status, data|error, observed_at, evidence_ids[], next_allowed_actions[].

| Action ID | Auth | IN | OUT | Ошибки |
|---|---|---|---|---|
| A-01 project.get | owner/read | project_id | BrandFacts+PersonaVersion+product facts version | NOT_FOUND |
| A-02 platforms.probe | owner/admin | account_id | CapabilityRecord[] | TOKEN_EXPIRED, PERMISSION_DENIED |
| A-03 research.collect | owner/read | topics[], sources[], window | evidence_ids[], notes | CAPABILITY_UNAVAILABLE |
| A-04 audience.segments | owner/read | filters/version | AudienceSegment[] | NOT_FOUND |
| A-05 radar.sync | owner/operator | observed_ids[], watermark | changes[], opportunities[] | RATE_LIMITED |
| A-06 discussions.list | owner/read | platform, segment, min_quality | Opportunity[] | SOURCE_STALE |
| A-07 discussions.propose_reply | owner/operator | opportunity_id, exact source_version | draft_artifact_id + QA | EXPIRED, CONTEXT_CHANGED |
| A-08 discussions.submit | owner/permit | exact draft_version, approval_id | reply job / remote ID | WRITE_NOT_ALLOWED |
| A-09 creative.plan | owner/operator | brief DTO | versioned CreativeBrief | CANON_MISMATCH |
| A-10 creative.render | owner/permit | brief_id, source_refs, budget | MediaArtifact/QA | PROVIDER_UNAVAILABLE, QA_FAILED |
| A-11 publications.schedule | owner/permit | package, schedule, approval | job_id + due_at | BLOCKED_POLICY |
| A-12 publications.cancel | owner/operator | job_id | terminal status | ALREADY_SENT |
| A-13 comments.ingest | runtime | account, post_id, cursor | CommentPage+events | CAPABILITY_UNAVAILABLE |
| A-14 comments.classify | owner/AI | comment/version/context | classification artifact | LOW_CONFIDENCE |
| A-15 comments.reply_schedule | owner/permit | exact draft, policy, approval | ReplyJob due_at | QA_FAILED, QUOTA |
| A-16 inbox.event_receive | verified webhook | signed payload | Event ACK + alert job | INVALID_SIGNATURE |
| A-17 inbox.notify_owner | runtime-private | message_ref | Telegram alert/ack | OWNER_UNBOUND |
| A-18 telegram.poll_create | owner/permit | poll question/options/target | poll_id + message_id | NO_ADMIN_PERMISSION |
| A-19 feedback.record | owner/runtime | proposal source, category | proposal_id/status | DUPLICATE_LINKED |
| A-20 metrics.collect | runtime | account/scope/window | observations[] | DATA_UNAVAILABLE |
| A-21 experiments.create/close | owner/AI | designs/evidence | versioned result | INSUFFICIENT_DATA |
| A-22 learning.next_plan | owner/AI | evidence window | proposal, no autonomous consent changes | UNVERIFIED_INPUT |
| A-23 operations.pause/resume | owner/admin | scope/platform/all | new policy state | NOT_AUTHORIZED |
| A-24 operations.audit | owner/read | event filters | immutable operation events | NOT_FOUND |

### 16.1. Common error envelope

~~~json
{
  "status": "error",
  "request_id": "opaque",
  "error": {
    "code": "CAPABILITY_UNAVAILABLE",
    "retryable": false,
    "provider": "linkedin",
    "account_id": "opaque",
    "detail": "Organic third-party discussion access unverified",
    "retry_after_seconds": null,
    "manual_fallback": "Prepare draft and direct link for owner"
  }
}
~~~

**API-01:** открытые публичные webhooks и приватные owner actions разделять по auth.  
**API-02:** отсутствие capability возвращает typed error, а не фиктивный список или fake ID.  
**API-03:** destructive/write actions доступны только с verified owner permissions и exact approvals.  
**API-04:** методы не передают токены, приватные DM или личные данные в public creative context.  
**API-05:** все внешние write перехватываются global и platform-level kill switches.  
**API-06:** определить OpenAPI JSON Schemas и versioning перед кодом; структурные поля этих DTO — минимальная нормативная основа.

## 17. Расписание, политики, наблюдаемость

Настройки, которые пока **не утверждены численно**, должны быть конфигурируемыми и не маскироваться под согласованные пользовательские лимиты: frequency radar, daily external comments cap, owned replies cap, SLA reports, alert delivery targets, media budget, segment thresholds.

**OPS-01:** owner dashboard показывает по платформе: connected, scopes, permissions, e2e proof, last probe, rate/quota, currently blocked actions, pending approvals, scheduled posts, errors.  
**OPS-02:** global pause действует на все внешние write; private DM alert может оставаться включённым по отдельному owner setting.  
**OPS-03:** все задания имеют state timestamps, actor, idempotency_key, trace_id, remote receipt (если есть).  
**OPS-04:** worker restart сохраняет due_at, locks/leases, pending actions; quarantine для неоднозначных provider outcomes.  
**OPS-05:** webhook signature validation и replay protection до сохранения private events.  
**OPS-06:** audit хранит who/when/what approval/permit/content hash/remote result; возможности export/delete через owner-only interface с privacy retention policy.
**OPS-07:** не объявлять готовым ни один коннектор без real-account smoke acceptance.  
**OPS-08:** нельзя самовольно включать сторонний платный LLM/API для фоновой автономии или перехватывать исходный AI Content Marketer.

## 18. Приёмка — трассируемые тесты

| Test | Требование | Процедура | Ожидаемый результат |
|---|---|---|---|
| AT-01 | CAP-01/04 | Попытка publish при отсутствии scopes | Typed PERMISSION_DENIED; нет внешнего поста |
| AT-02 | CAP-05 | Instagram feed granted, stories unverified | Feed остаётся доступным, Stories manual_only |
| AT-03 | RES-01/SEG-01 | Исследование двух сегментов | Evidence/версии сохранены, unknown не объявлен фактом |
| AT-04 | RAD-02 | Повторить sync по одному watermark | Нет повторных Opportunity |
| AT-05 | OPP-04 | Попытка reply после expires_at | Состояние expired, внешний write не выполнен |
| AT-06 | EXT-03 | Сгенерировать reply с рекламной ссылкой | QA FAIL, публикация запрещена |
| AT-07 | EXT-04/05 | Ответ в чужой ветке без отдельного owner permit | Proposal_only; удалённого ответа нет |
| AT-08 | MEDIA-02/04/06 | Выпустить Reel с Ayla | Существует финальный видеофайл, manifest, персонаж QA и render hash |
| AT-09 | MEDIA-03 | Создать карусель | Все слайды финальные, мобильный QA пройден |
| AT-10 | PUB-03 | API create container без post ID | Не published, ожидание remote ACK/reconcile |
| AT-11 | PUB-04 | Restart/retry в момент отправки | Не более одного удалённого поста, соответствующий локальный статус |
| AT-12 | Threads cadence | Считать 12 posts + 15 replies | Standalone_posts=12, replies=15 отдельно |
| AT-13 | COM-02/05 | Неопределённый/spam comment | Автоответ не отправляется, классификация сохранена |
| AT-14 | COM-07/08 | Зафиксировать задержку, restart | due_at остаётся тем же, в диапазоне 60..3600 с |
| AT-15 | COM-09/12 | Комментарий удалён после постановки reply в очередь | Отмена, remote reply не создаётся |
| AT-16 | DM-02/08 | Два одинаковых webhook + публичный Telegram ID | Одно событие; блокировка не-owner chat; никаких публикаций |
| AT-17 | DM-03/04 | Новое разрешённое DM с доступным публичным профилем | Личный бот владельца получает исходный текст и краткий факт-ориентированный анализ |
| AT-18 | DM-11 | Модель профиля недоступна | Немедленный приватный alert с исходным текстом, digest unavailable |
| AT-19 | TG-02/03 | Предложение набрало голосов, релиза нет | Не обещает реализацию, статус awaiting_owner |
| AT-20 | LI-06 | Профессиональный вопрос о White Label | Владелец уведомлён, автоматического оффера/цены нет |
| AT-21 | EXP-02/04 | Разные естественные показы вариантов | Experiment помечен quasi, результаты с ограничениями |
| AT-22 | MET-02/03 | Post views есть, relevant follows нет | Views diagnostic; relevant_follows=unknown, не 0 и не inferred |
| AT-23 | LERN-05 | Модель предлагает сменить persona/permissions | Только предложение, никаких автоматических изменений |
| AT-24 | OPS-02 | Global kill switch перед execution | Все внешние write заблокированы |
| AT-25 | OPS-07 | Интеграция проходит unit CI, не реальный API | Не production-ready, E2E state unproven |
| AT-26 | JOB-INV-01/08 | Проверить пакет изменений | Ни один файл калькулятора или исходного донора не изменён |

### 18.1. Статусы готовности

- **Specified:** контракт определён; код не обязан существовать.
- **Implemented-local:** код есть, unit tests есть, но провайдер не принят.
- **Provider-permission-verified:** scope и account type подтверждены.
- **E2E-proven:** конкретное внешнее действие доказано remote ID/receipt.
- **Production-ready:** E2E + monitoring + failure/recovery + security/privacy + owner acceptance.

Только **Production-ready** может именоваться «функция Ayla работает в production». Полный выпуск зависит от пофункциональной, а не общей приёмки.

---

## 19. План работ Codex — после отдельного утверждения

1. **Phase A — Contracts:** DTO/OpenAPI, scopes, owner control, immutable state, Persona linkage, fake/real separation; fixtures and contract tests.
2. **Phase B — Intelligence:** research evidence, segmentation, competitors/partners radar, opportunity queue, explainable scoring.
3. **Phase C — Threads Operations:** preflight, standalone 10–12 queue, real publish+insights, own comments, delayed reply 1–60 мин.
4. **Phase D — External discussion:** keyword discovery, public context, non-sales QA, exact consent, quotas, permitted submit, measurement.
5. **Phase E — Creative Studio:** images, media persona continuity, Reels, Stories, carousel, render provenance, per-platform QA.
6. **Phase F — Meta Connectors:** Instagram Business/Creator capability matrix, Facebook Pages, comments, insights, permitted inbox.
7. **Phase G — Telegram:** channel, polls, feedback registry, private owner DM alerts, privacy controls.
8. **Phase H — LinkedIn:** official organization publishing, professional story and inbound handoff.
9. **Phase I — Learning and production qualification:** metrics mapping, experiments, full CI + live E2E traces, failover, owner acceptance.

Каждая фаза — отдельные PR с реальными доказательствами нужных функций; этот документ лишь задаёт спецификацию. **Текущий статус: не утверждено, разработку не начинать.**

## 20. Definition of Done

Her Job закончен в пределах согласованного первого выпуска, если Ayla, оставаясь единой реалистичной личностью AYLA-CORE-01, способна **только для Nomad360** собирать проверяемые рыночные сигналы, находить возможности разговоров, выпускать конечные медиа, публиковать по разрешениям, поддерживать ответные диалоги с durable 1–60 minute delay, уведомлять владельца о DM в личном Telegram, организовывать Telegram-сообщество и обоснованно менять следующие гипотезы по реальным измерениям.

**Отдельно проверяются:** устойчивость персонажа, защита приватности, границы кроссплатформенных API, отсечение продаж в чужих ветках, отсутствие выдуманных метрик и отсутствие модификаций калькулятора/донора.
