# ADR-001 — Автономный runtime Ayla: Compute Engine VM, worker и независимый LLM-provider

> **Статус:** архитектурное решение **предложено к утверждению**, не означает созданную VM, оплаченный API, выданные права или развёрнутый production.
> **Дата:** 21.10.2026.
> **Текущий релиз:** [AYLA-R01, Threads-only](AYLA-R01-threads-first-release.md).
> **Ответственный модуль:** самостоятельная \`ayla/\` в общем репозитории Nomad360, рядом с Calculator.
> **Связанные документы:** [R01 Cross-Spec DoD](AYLA-R01-infrastructure-reuse-and-final-contract-dod.md), [AYLA-LIFE-03](AYLA-LIFE-03-human-creator-triangulation.md), [AYLA-JOB-02](../../docs/ayla/AYLA-JOB-02-functional-specification.md).
> **Исходные доказательства:** KazartsevEV/lazysellerV2/ai-content-marketer/deploy/compose.yaml, deploy/README.md, docs/RUNTIME_PROFILES.md, docs/PRODUCT_STATE_GOAL_ROADMAP.md.

**Уточнение среды (ADR-002):** владелец указал, что Google Cloud project и сервисный аккаунт уже созданы в инфраструктуре [lazysellerV2](https://github.com/KazartsevEV/lazysellerV2). [ADR-002](ADR-002-shared-lazyseller-gcp-isolation.md) заменяет предположение о необходимости нового проекта/VM: сначала read-only inventory; затем isolated co-hosting при доказанной ёмкости или отдельная Ayla VM в том же GCP project. Запрещено затрагивать Infourok/UMF/Product Factory runtime, existing SA IAM, DB, Gateway/ngrok или разрушительно тестировать общую VM.

## 0. Решение и причины

**Предлагаемая production-архитектура R01: один постоянно включённый Google Cloud Compute Engine VM + durable диск + два Docker-процесса (Ayla Web/API и Ayla Worker), использующие один канонический job broker/SQLite WAL, один encrypted credential store и один Persona/LifeState store.** Публичная точка входа защищена HTTPS reverse-proxy, Threads OAuth; model inference вызывается worker через сменный LLM-adapter.

Не делать отдельный scheduler, второй broker или отдельный «памятный» сервис, если можно использовать базовые механизмы донора. Сохранить один источник истины для разрешений на внешние записи, lease, audit и job statuses.

**ngrok + локальный Gateway** допускается для development/integration staging, но не production-зависимость: туннель не поддерживает работу при выключенном компьютере. Gateway — это API/политика, а не модель и не worker.

**Cloud Run** как альтернатива в R01 не выбрана, потому что текущая архитектура донора — long-lived scheduler/SQLite/worker. Cloud Run можно заставить исполнять background CPU с instance-based billing + min instances; однако scale/replacement и локальная файловая устойчивость потребовали бы изменять контракты. Это не «невозможно», а пока лишняя миграция архитектуры.

**Google Cloud ≠ Gemini.** Cloud — среда исполнения; Gemini, OpenAI, OpenRouter или иной одобренный LLM API — сменный вычислитель. **Claude** (Anthropic), если он имеется в виду, — тоже отдельный inference-провайдер, а не замена постоянно работающему хосту.

## 1. Что именно работает после закрытия ChatGPT

### 1.1. Состав компонентов

1. **Ayla Web/API (отдельный контейнер)**: owner control, approve/reject, capability/health/status, разрешённые Threads OAuth callbacks и webhooks; backend API для интерактивного ChatGPT Action/Gateway, если позднее подключён. Внешние Threads записи напрямую не выполняет.
2. **Ayla Worker (отдельный контейнер)**: persistent queue/leases/heartbeats, planner triggers, semantic model calls, scheduled publishing, own/external comment tasks, metrics collection, retry/reconciliation. **Единственный исполнитель реальных внешних write**, с permit на момент исполнения.
3. **Database (SQLite WAL на persistent VM disk)**: schema migrations, Owner/Account, PersonaCanon reference, LifeState, ResearchEvidence, ContentBrief, MediaAsset, PublicationJobs, Comments, ReplyJobs, MetricSnapshot, LearningDecision, Approval, Audit; encrypted Threads credential blobs.
4. **Asset storage**: проверенный эталон лица Ayla из Git; отдельные immutable derivative images и manifests. Для Threads media publishing требуется provider-доступный HTTPS URL; до R01.3 настроить приватное объектное хранение и строго ограниченную выдачу временных URL либо иной совместимый доказанный media transport.
5. **Secrets/identity**: OAuth app credentials, master encryption key, LLM API credentials, private HTTPS admin access; VM service account с минимальными необходимыми GCS permissions. Секреты не помещать в Git, prompt, job payload или общедоступные логи.
6. **LLM ProviderRouter**: существующие адаптеры Gemini/Google, OpenAI, OpenRouter из донора, без жёсткой зависимости доменной модели от платформы модели. Новые model/providers — только через отдельный provider contract и acceptance.
7. **Control plane**: ChatGPT/Custom GPT Actions или отдельная owner UI; не исполняет фоновые задачи сам по себе. Исчезновение чата не влияет на запланированное выполнение.
8. **HTTPS entry**: выделенный host/subdomain, TLS reverse proxy. Google VM может предоставлять этот gateway напрямую; ngrok там не требуется.

### 1.2. Ключевой execution flow

**A. Редакционный день**
1. Scheduler создаёт idempotent daily-research job.
2. Worker получает разрешённые публичные Threads sources и доступные comment/insight snapshots.
3. Worker вызывает **реальный LLM API** для извлечения тем и реальных паттернов жизни (Social/Place/Emotion, без копирования авторов).
4. Worker учитывает PersonaCanon/LifeState, формирует original ContentBrief и короткие text/media jobs.
5. После QA и утверждённой policy материалы становятся planned/approved. **Если разрешение на публикацию требует человека, агент готовит и ждёт**, а не отправляет.
6. Worker отправляет точно разрешённый пост через Threads API, сверяет external post ID, затем ставит задачи для insights и comments.

**B. Работа с комментариями**
1. Запланированное чтение собственных Threads replies и открытых сторонних дискуссий через permitted API, с cursor/dedup.
2. Worker классифицирует intent/topic/risk и предлагает содержательную реплику; external replies проходят отдельную no-sales policy.
3. Только если owner заранее выдал нужное capability permission и risk/QA позволили автоматизацию, worker сохраняет случайный \`due_at=queued_at+[60..3600] seconds\` для собственного публичного ответа.
4. В момент due_at worker заново проверяет source/context/authorization/quota/kill switch и подтверждает удалённую отправку или остановку.
5. Feedback signals → next brief/learning. Отсутствие LLM не превращает задачу в «придуманный результат».

**C. Работа в отсутствии модели**
- Read-only poll, scheduled already-approved sends, monitoring/health, backup могут выполняться.
- Новый сложный осмысленный ответ или креатив: \`waiting_inference\` / \`provider_unavailable\`, с backoff/alert.
- Запрещено тихо отправлять шаблон вместо модельного анализа и запрещено бесконтрольно переходить на платную модель.

### 1.3. Автономность — три независимо утверждаемых уровня

| Уровень | Что Ayla делает в фоне | Что требует Owner |
|---|---|---|
| L0 Observation | Источники, метрики, комментарии, сбор/хранение/очереди | Подключение аккаунтов, периодические права |
| L1 Creative autonomy | Семантический research, гипотезы, оригинальные ContentBrief, тексты и изображения по бюджетам | Канон, подключение модели, разрешения публикаций |
| L2 Governed communications | Публикация одобренных кампаний, низкорисковые own replies, участие в allowlisted external threads | Явные ограниченные permit/quotas/QA, возможность отмены; всё остальное — review |

R01.1 обеспечивает **инфраструктурную способность** всех трёх уровней, но до реальных внешних тестов/конкретных согласований включён только безопасный read/draft режим. Owner выбирает bounded autonomy позднее отдельным policy change; публикации и ответы не начинаются автоматически после развёртывания VM.

## 2. Почему можно переиспользовать донора

Проверено в \`KazartsevEV/lazysellerV2\` на main:
- \`ai-content-marketer/deploy/compose.yaml\` — \`ai-marketer-web\` + \`ai-marketer-worker\`, \`restart: unless-stopped\`, общий named volume, web port только localhost, отдельный container security_opt.
- \`ai-content-marketer/deploy/README.md\` — single canonical worker, shared Agent Platform SQLite broker, leased jobs, lease heartbeat, freeze/permit, encrypted OAuth store; online SQLite backup/restore commands; healthcheck read-only.
- \`ai-content-marketer/docs/RUNTIME_PROFILES.md\` — provider abstraction: \`openrouter\`, \`google\` (Gemini), \`openai\`; LOCAL_FREE OpenRouter free-only; BYOK; production profile; project-scoped assets; no paid features enabled by local_free.
- \`ai-content-marketer/docs/PRODUCT_STATE_GOAL_ROADMAP.md\` — live VM reset/recovery, GCS, Threads source→post→insights→learning gates описаны как **acceptance-ready, НЕ E2E proven**.

**Не нужно заново писать** собственный event loop, вторую БД, шифрование Threads токенов или новый планировщик. Нужна изолированная адаптация в \`ayla/\` с собственным namespace, секретами, Persona и тестами. Ни донор, ни калькулятор в рамках этого решения не изменяются.

## 3. Inference: как выбирать модель, которая действительно работает автономно

Модель **не является постоянным процессом на VM** при API-режиме. VM исполняет задания, а LLM-вызов — платный либо ограниченный запрос к внешнему API, не связанный с открытым ChatGPT-чатом.

Рекомендуемая политика на старте:

- **Development:** OpenRouter \`openrouter/free\` как существующий no-paid fallback и fixture/provider tests. Нет гарантии долгой доступности, лимитов, стабильности модели и надёжности R01.
- **Production pilot:** один **явно выбранный BYOK LLM** из уже реализованных Gemini/Google или OpenAI; Gemini Flash как **первый кандидат для теста стоимости/качества**, не утверждённый автоматически. Проверить реальное качество American English, многометочного анализа, original life microstories, удержание канона и JSON schema adherence.
- **Fallback:** только заранее одобренный route с лимитами; при отказе \`waiting_inference\`, а не бесшумная деградация и не незаметные расходы.
- **Claude (Anthropic), если выбирается:** требует подтверждения совместимого API-адаптера, лицензирования/доступа и тестов; не выдавать за встроенную функцию донора. Использование через OpenRouter — тоже отдельная проверка модели и платежей.
- **Image provider:** отдельный R01.3, **обязан** принимать реальные reference-image bytes frozen master. Существующий донорский \`GoogleImageGenerator\` содержит prompt-only вызов, этого недостаточно для устойчивого лица.

### 3.1. LLM Invocation DTO

\`\`\`json
{
  "inference_job_id": "opaque",
  "project_id": "nomad360",
  "persona_version": "approved-version",
  "purpose": "threads_comment_draft",
  "provider": "approved-provider",
  "model": "exact-pinned-provider-model-id",
  "prompt_template_version": "p1",
  "input_evidence_ids": ["ev-1"],
  "data_visibility": "public_derived",
  "max_input_tokens": 10000,
  "max_output_tokens": 700,
  "max_cost_usd": null,
  "deadline_at": null,
  "idempotency_key": "opaque",
  "status": "waiting_inference"
}
\`\`\`

Реальные поля max tokens/cost/timeout/allowed retry count согласовать с owner pilot budget. Передавать источники с provenance и защитой от prompt injection. Не отправлять приватные DM в content/story-model API без явной политики.

### 3.2. Предохранители расходов и качества

- Hard per-call token/output ceiling; per-day/month inference budgets в самой Ayla, проверяемые **до** вызова; отдельный лимит на платную image generation в R01.3.
- Отчёт actual consumed tokens/cost, storage/API/network cost по категории; alerts и policy hold до превышения лимита приложения.
- Provider rate limits/5xx → exponential backoff и финальный blocked status; никогда не loop \`retry forever\`.
- Model quality gates: factual/product provenance; persona continuity; external reply no-sale; source originality; schema validation; confidence/low-risk policy.
- Внешние GCP budget alerts сами по себе обычно не отключают VM. При необходимости отдельное средство остановки в приложении; для доступных сервисов специальные spend caps на Google Cloud имеют ограничения.
- Не запускать unmetered daily scanning всех профилей и бесконечные запросы к модели.

## 4. Эксплуатационная инфраструктура GCE

**Proposed minimal topology:**

\`\`\`text
Owner UI / ChatGPT Actions (optional)
        | authenticated HTTPS
        v
  DNS + TLS reverse proxy
        |
  Ayla Web/API container     <-- Threads OAuth callback / permitted webhooks
        |
        v
    Canonical SQLite WAL + encrypted credentials + assets
        ^
        |
  Ayla Worker (one scheduler, durable leases)
      ├─ read-only Threads research/metrics
      ├─ LLM ProviderRouter --> Gemini/OpenAI/OpenRouter API
      ├─ Content & Persona QA
      ├─ controlled external Threads publish/reply
      └─ backups/health/monitoring
        |
   Durable disk of Google Compute Engine VM
        |
   Separate off-VM backups (GCS) + image/media HTTPS URLs (R01.3)
\`\`\`

R01.1 допускает временную single-VM topology со **строго одним writer/worker**. SQLite WAL требует соответствующий файловый/locking режим; не размещать live SQLite на GCS; off-VM копия — через согласованный online backup, не \`cp\` активного файла.

Обязательные меры:
- HTTPS TLS, ограниченный admin access, OAuth redirect URI registered.
- Web/API и worker — разные процессы; worker не имеет открытого внешнего порта.
- Private SQLite + encrypted secrets с ограниченными POSIX/volume permissions; исключить ключи из логов.
- Docker restart policy, VM restart policy, healthcheck, graceful shutdown с возвратом незавершённых lease.
- Периодические consistency-checked off-VM backups и реальное восстановление на тестовом инстансе.
- Мониторинг запланированных заданий, возраст самой старой очереди, время последнего успешного read/publish, provider errors, budgets и owner notifications.
- Отдельные staging и production credentials/data, запрет тестовых публикаций в production по умолчанию.
- VM size выбрать после memory/CPU/probe тестов. \`e2-micro\` может попадать в free-tier в ограниченных регионах, но **не объявлять достаточным** для web + worker + БД без замеров. Начальный кандидат — малый VM класс с примерно 2–4 GiB RAM, затем подбирать по измерениям.
- Постоянный VM создаёт постоянные начисления вне free-tier; LLM API, хранение, домен и трафик оплачиваются отдельно.

### 4.1. Предварительная стоимость непрерывного VM (не утверждённый бюджет)

Официальный прайс Google Cloud для примера региона **Iowa, us-central1**: `e2-small` (2 GiB, shared-core) ~**$0.01675/час**, то есть ~**$12.06 за 720 часов**; `e2-medium` (4 GiB, shared-core) ~**$0.03351/час**, то есть ~**$24.12 за 720 часов**. Это только машинное время до возможных скидок/кредитов, **без** boot/persistent disk, отдельного off-VM backup, media egress, адреса/доменной инфраструктуры и внешнего LLM/image API. Цены зависят от региона и могут меняться; при выборе региона необходимо посчитать заново. Источник: https://cloud.google.com/products/compute/pricing/general-purpose

**Для первого unattended пилота стартовым кандидатом является e2-medium (4 GiB)** — более реалистичное пространство для одновременных Web/API, Worker и SQLite на малом сервере. `e2-small` применять только если нагрузочные тесты докажут достаточность 2 GiB и отсутствие OOM. `e2-micro` (1 GiB) не считать достаточным по умолчанию, хотя может входить в ограниченный региональный Always Free: https://cloud.google.com/products/compute и https://docs.cloud.google.com/compute/docs/general-purpose-machines.

Gemini/OpenAI/OpenRouter модельный API — отдельные начисления/квоты по фактическим вызовам. Для production использовать явный BYOK provider, лимиты RPM/TPM/RPD, стоимость на 1M токенов и output/QA pass rate. Gemini: https://ai.google.dev/gemini-api/docs/pricing и https://ai.google.dev/gemini-api/docs/rate-limits.

**Budget alerts не гарантируют прекращения начислений за VM.** Некоторые GCP сервисы поддерживают spend caps, но fixed recurring compute/storage продолжают начисляться. Требуется отдельный hard limit на inference/media в Ayla и owner approval для VM месячных начислений; остановка VM по политике владельца — отдельное действие. https://docs.cloud.google.com/billing/docs/how-to/budgets и https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps

## 5. Сравнение deployment вариантов для R01

| Требование | Локальный + ngrok + Gateway | Compute Engine VM **(рекомендуется)** | Cloud Run / Jobs (позже) |
|---|---|---|---|
| Закрыт ChatGPT, задания продолжаются | Да, если ПК и worker включены | Да | Да, при правильной архитектуре triggers/workers |
| ПК пользователя выключен | **Нет** | **Да** | **Да** |
| Существующий SQLite WAL + long-running worker донора | Легко | **Почти напрямую** | Нужна адаптация persistence/long-running semantics |
| Постоянный owner API/OAuth endpoint | ngrok tunnel пока онлайн | DNS/TLS VM | HTTPS managed |
| Риск смены архитектуры в R01 | Низкий, но нет автономности ПК | **Минимальный** | Выше |
| Стоимость и эксплуатация | ПК/интернет/туннель | VM/disk/API | Billing/worker redesign |
| Роль в R01 | Dev/E2E | **Production pilot** | Future reconsideration |

## 6. DoD / R01.1 добавления для реальной автономности

**ADR-AT-01** Внешний owner UI/ChatGPT отключен на 24 часа. Тестовый worker на реальном host продолжает выполнять *разрешённые* jobs и собирать real Threads insights/comments; сохраняет evidence.

**ADR-AT-02** Создать approved inference job и закрыть интерактивную сессию. Worker самостоятельно вызывает одобренную модель через BYOK, валидирует output schema и сохраняет оригинальный ContentBrief/ReplyDraft (без автоматического внешнего write без permit).

**ADR-AT-03** При отключении модели: worker остаётся live, пишет \`provider_unavailable\`, не публикует придуманные тексты и не переключается на платный альтернативный provider без разрешения.

**ADR-AT-04** Перезапуск контейнера/VM: committed jobs, due_at, queue leases, persona memory, credentials и exact content versions сохраняются; нет повторных постов/ответов.

**ADR-AT-05** Проверить реальный Threads OAuth authorization, callback, token storage, expiry/revocation и execution-time permission stop; закрыть недоступный admin API для посторонних.

**ADR-AT-06** Проследить стоимость 100/1000 тестовых inference jobs при фиксированных сценариях и оценить среднюю/верхнюю стоимость/day-month **по фактическим токенам**; установить owner-approved spend policy до unattended production.

**ADR-AT-07** Протестировать backup через настоящую off-VM копию, восстановление и независимый healthcheck, а не только локальное копирование БД.

**ADR-AT-08** Провал full-session ChatGPT connection никак не меняет scheduler/worker; optional Action работает только как удалённая owner-консоль.

**ADR-AT-09** Ayla остаётся отдельной подсистемой корня; никакой runtime зависимости от Calculator V1/V2 или пользовательских расчетов. Business/ProductFacts — только read-only версионированные публичные сведения.

**ADR-AT-10** Демонстрация L0 read-only, L1 creative drafting и disabled-by-default L2 writes с log evidence: очереди действительно исполняются, публичные действия без разрешений заблокированы.

**ADR-AT-11** Failover не дублирует модельный вывод/публикацию и не теряет переписку/жизненный канон; reties bounded, provider receipts audited.

**ADR-AT-12** Owner получает dashboard: last heartbeat, next scheduled action, model provider, pending approvals, last successful Threads read, queue depth, cost and blockers; synthetic statuses не выдаются за real E2E.

**R01.1 DONE** только после production-like unattended run, реальной проверенной model inference в фоне, scope+backup/restart и owner acceptance; старый donor CI считается базой, но не заменяет тест на инфраструктуре Ayla.

## 7. Инженерное решение / последовательность

1. **Prototype locally:** перенести worker/web/SQLite/permit/provider-router базовые модули из донора под \`ayla/\`, не менять донор; тесты и fake connector.
2. **Read-only inventory of existing lazyseller GCP:** выяснить project ID, WIF/SA role restrictions, current instances, GCS, capacity and billing. При безопасной доступной Linux VM — отдельный Ayla Compose project; иначе по согласованию отдельная Ayla VM в **том же** GCP project, не в новом. Без разрешения владельца ничего не создавать, не перезагружать и не оплачивать.
3. **LLM BYOK smoke:** проверить выбранную модель на коротких постах, распознавании комментариев, каноне и реальном background job, закрыв UI/ChatGPT.
4. **Persistence proof:** restart/recovery/off-VM backup, scopes/credentials and budget cap checks.
5. **Advance R01.2–R01.6:** расширить pipeline по утверждённому Threads release DoD, не включать других соцсетей или тяжёлые видео.

**ADR-result:** рекомендуется **GCE VM + existing durable worker + explicit BYOK-model**, \`ngrok\` только development. Решение пока требует утверждения хостинга, проекта/бюджета и конкретной модели; ни VM, ни платежи, ни социальные публикации этим документом не запущены.

## 8. Официальные технические источники

- Google Cloud, Compute Engine VM startup and persistent runtime: https://docs.cloud.google.com/compute/docs/instances/startup-scripts
- Google Cloud, Compute Engine pricing and free tier: https://cloud.google.com/products/compute
- Google Cloud, Cloud Run minimum instances: https://docs.cloud.google.com/run/docs/configuring/min-instances
- Google Cloud, Cloud Run billing: https://docs.cloud.google.com/run/docs/configuring/billing-settings
- Google Cloud, billing budgets and alerts: https://docs.cloud.google.com/billing/docs/how-to/budgets
- Google Cloud, service-specific spend caps: https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps
- Google Gemini Developer API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Donor: \`ai-content-marketer/deploy/compose.yaml\`, \`deploy/README.md\`, \`docs/RUNTIME_PROFILES.md\`.
