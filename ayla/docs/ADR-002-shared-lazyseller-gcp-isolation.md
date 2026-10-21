# ADR-002 — Ayla в существующем Google Cloud контуре lazysellerV2 (shared project / isolated workload)

> **Статус:** решение об использовании **существующего облачного проекта и инфраструктурных механизмов** принято владельцем 21.10.2026. Точная идентичность GCP project, service account, текущих ресурсов, IAM и доступность VM **не были считаны из живого GCP API**. Развёртывание и IAM-модификации не санкционированы этим документом.
>
> **Исходная инфраструктура:** [KazartsevEV/lazysellerV2](https://github.com/KazartsevEV/lazysellerV2), Infourok / Product Factory / AI Content Marketer.
>
> **Код Ayla:** самостоятельная \`ayla/\` рядом с Calculator в \`KazartsevEV/shelter-partner-directory\`; **не переносить туда Product Factory** и не внедрять Ayla в Calculator.
>
> **Связь:** [ADR-001 — standalone worker / Google Cloud](ADR-001-autonomous-runtime-cloud.md), [R01 DoD](AYLA-R01-infrastructure-reuse-and-final-contract-dod.md).

## 0. Что именно обнаружено в lazysellerV2

| Факт / ссылка в main lazysellerV2 | Что доказано | Что **не** доказано |
|---|---|---|
| [.github/workflows/ai-content-marketer-r12-gcs-acceptance.yml](https://github.com/KazartsevEV/lazysellerV2/blob/main/.github/workflows/ai-content-marketer-r12-gcs-acceptance.yml) | GitHub OIDC \`google-github-actions/auth@v2\`, \`AI_MARKETER_GCP_WORKLOAD_IDENTITY_PROVIDER\`, \`AI_MARKETER_GCP_SERVICE_ACCOUNT\`, \`AI_MARKETER_GCS_BUCKET\`; source→GCS→signed HTTPS acceptance script | Что секреты сейчас заполнены; какие их значения, реальные IAM-роли, текущее состояние GCS и успешный live run |
| [.github/workflows/ai-content-marketer-r13-vm-recovery-acceptance.yml](https://github.com/KazartsevEV/lazysellerV2/blob/main/.github/workflows/ai-content-marketer-r13-vm-recovery-acceptance.yml) | GCP OAuth via existing WIF/SA; user supplies **existing** VM name and zone; workflow \`gcloud compute ssh/scp\`, reset VM, GCS backup, restore | Название/тип/загрузка **реальной** VM; не доказано что R13 был вызван и прошёл реальный gate |
| [ai-content-marketer/deploy/compose.yaml](https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/deploy/compose.yaml), [deploy/README.md](https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/deploy/README.md) | Уже предусмотрены отдельные web и worker, один durable SQLite volume, encrypted OAuth store, backups, health checks | Что сервисы уже запущены в GCP, что можно перенести live DB без миграций |
| [product_factory_hardening/docs/evidence/UMF_009_DURABLE_AGENT_GATEWAY_20260830.md](https://github.com/KazartsevEV/lazysellerV2/blob/main/product_factory_hardening/docs/evidence/UMF_009_DURABLE_AGENT_GATEWAY_20260830.md) | Существующий Product Factory Agent Gateway: authenticated, idempotent jobs, canonical UMF/PF state, отдельные leases, loopback-only, проверенный Windows CI | Gateway не является общедоменным API для публикаций Ayla; его нельзя менять ради маркетолога |
| [product_factory_hardening/docs/evidence/UMF_010_AUTHENTICATED_NGROK_INGRESS_20260830.md](https://github.com/KazartsevEV/lazysellerV2/blob/main/product_factory_hardening/docs/evidence/UMF_010_AUTHENTICATED_NGROK_INGRESS_20260830.md) | Optional ngrok exposing **only accepted UMF Gateway**; verified authenticated public transient test, preserved UMF leases/DB, no live Recovery cutover | Это не доказательство постоянного ngrok endpoint, GCP availability или универсального внешнего proxy |
| [infourok-agent-platform/docs/INTEGRATIONS_BACKGROUND_RUNTIME.md](https://github.com/KazartsevEV/lazysellerV2/blob/main/infourok-agent-platform/docs/INTEGRATIONS_BACKGROUND_RUNTIME.md) | Услуги service account и user OAuth разграничены; Google Drive доступ у SA только к явно выданным ресурсам | Не утверждать, что SA имеет все права к проекту/личному Drive |
| [ai-content-marketer/docs/PRODUCT_STATE_GOAL_ROADMAP.md](https://github.com/KazartsevEV/lazysellerV2/blob/main/ai-content-marketer/docs/PRODUCT_STATE_GOAL_ROADMAP.md) | R12/R13/R15 labelled **acceptance-ready**, code + tests exist | \`acceptance-ready\` не равно \`real cloud E2E passed\` |

**На текущем уровне доступа нельзя читать значения GitHub Actions secrets, живой список Compute Engine instances, IAM policy, service account email, Cloud Billing или GCS bucket metadata.** Эти сведения вводить из read-only GCP API/санитизированного исполнения, а не предполагать. Утверждение владельца об уже существующем проекте/SA принимается как входное условие, не как самостоятельное подтверждение прав.

## 1. Архитектурное решение: reuse shared GCP project / strictly isolated Ayla workload

**Не создавать новый Google Cloud проект**, пока не выявлено формальное препятствие (квоты, billing, политика безопасности, орг-ограничение). Пользоваться общим существующим GCP project владельца для Infourok/Product Factory/AI Content Marketer.

**Не присоединять Ayla к UMF Agent Gateway и не изменять UMF/PF canonical database, lease IDs, worker lifecycle, ngrok transport.** Для Ayla строить собственный Web/API + Worker, переиспользуя кодовые библиотеки из AI Content Marketer/shared Agent Platform, а не shared mutable runtime data. GCP project — общий административный контейнер, **не общая БД, токены и процессы**.

### 1.1. Топология — inventory-first, без лишних VM

1. Сначала выполнить **read-only preflight GCP**: GCP project ID, billing state, доступные instance name/zone, status, machine type, persistent disks, capacity, network, service account identities/roles, WIF audience and GitHub repository claim restrictions, GCS buckets/retention/usage/permissions, quotas.
2. Если **уже работающая Linux VM** разрешает отдельные Docker containers и имеет доказанный spare RAM/CPU/disk, то **Ayla как отдельный Docker Compose project** (\`ayla-web\`/\`ayla-worker\` + собственные volumes, image names, ports, secrets, health probes). Ни stop, ни reboot, ни изменение existing compose services других проектов. Это **предпочтительнее** создания второй VM, только если обеспечена изоляция.
3. Если доступная VM относится к Windows Product Factory render runtime, имеет ограниченный ресурс, incompatible OS, owner не разрешил соседство или отсутствует вообще — отдельная **Ayla VM в том же GCP project** и независимые persistent disk/backups. Нельзя ради Ayla переносить/выключать Windows PF.
4. Первый Threads OAuth callback/webhook обслуживает отдельный host/path/auth context Ayla. Не расширять UMF Agent Gateway шестью существующими маршрутами и не пересоздавать ngrok.
5. Выбор LLM (Gemini/OpenAI/OpenRouter) не связан с project ID; Google service account не является автоматическим Gemini Developer API key. LLM подключается через уже проверяемые BYOK/provider контракты.

### 1.2. Service account — «reuse without escalating»

**Существующий WIF provider / SA** — найденная в CI интеграционная точка. Требуется проверить:
- repo/ref/branch/environment claim restrictions для GitHub OIDC: сейчас рабочие секреты относятся к **lazysellerV2**. **Нельзя автоматически использовать этот WIF из shelter-partner-directory** без проверки федеративных условий. Нельзя расширять доверие на \`repo:*\` или давать новые избыточные роли «для удобства».
- role bindings и bucket permissions существующего SA. Если текущих прав хватает на строго изолированные ресурсы и security review разрешает совместное использование — можно пользоваться, **не меняя роли**.
- При требовании дополнительных прав, доступов к отдельным buckets/VM или иной IAM boundary **создать отдельный Ayla runtime SA** в **том же** GCP-проекте, с узкими ролями и только после owner approval. Не расширять права исторического Infourok/PF SA и не копировать его JSON ключи.
- Отдельно различать CI deploy identity через WIF и instance-attached runtime SA/ADC; это не обязательно один и тот же субъект.

**Security invariant:** отдельная Ayla identity не может read/write чужие PF/Infourok базы, GCS prefixes, credentials, backups, published outputs. «Один облачный проект» не означает «один ключ ко всему».

### 1.3. Storage/secret isolation

| Объект | Ayla | Existing Infourok / PF / Marketer |
|---|---|---|
| Canonical DB | \`/var/lib/ayla/ayla.sqlite3\` + отдельные WAL/leases | Существующие DB и UMF/PF authority untouched |
| Docker state | named volumes \`ayla-*\`, isolated Compose project | Existing container/volume names unchanged |
| Thread tokens | Новый encrypted store + самостоятельные key rotation/expiry | Нельзя брать токены чужих профилей |
| Media | immutable Ayla master + \`gs://<existing-or-new-bucket>/ayla/... \` по отдельному разрешённому prefix/bucket | Existing marketer media paths and PF artifacts untouched |
| Backup | \`ayla/backups/... \` в самостоятельном storage policy | Existing retention, off-VM backups unchanged |
| Owner API | собственный HTTPS namespace / access policy, no PF gateway changes | Existing UMF Gateway + ngrok unchanged |
| LLM cost | отдельные Ayla job tags / budget ledger / caps | Existing project-wide budget tracking continues |
| CI | independent \`ayla\` acceptance workflow | Existing R12/R13/R15 actions untouched |

**Предпочтение:** отдельный bucket для Ayla в том же GCP project, когда нужна настоящая IAM-изоляция. **Один prefix сам по себе не гарантирует IAM-изоляции** в bucket: требуется проверить и явно сконфигурировать применимые IAM conditions или поддерживаемый механизм доступа. Простое соглашение «пишем в папку ayla» не является достаточной защитой.

## 2. Что можно переиспользовать без риска

- **Код:** \`infourok-agent-platform\` broker/scheduler/leases/authorization; \`ai-content-marketer\` Threads OAuth, connector, publication/insights, provider routing, health/backup; изолированная адаптация под Ayla.
- **GCP project:** billing/account/quota container, сервисы Compute Engine/GCS (проверить включение API без изменения чужих сервисов).
- **Federated GitHub identity:** существующая настройка \`google-github-actions/auth@v2\` — **pattern**, фактическое доверие и разрешения verified-first.
- **VM (условно):** использовать уже существующий Linux host только если read-only inventory + capacity/owner-approved cohosting подтверждают безопасность.
- **UMF Gateway/ngrok:** повторно использовать **дизайн fail-closed authenticated gateway**, **НЕ текущий running endpoint/шесть маршрутов**.
- **Windows Product Factory:** не затрагивать; его PowerPoint/PPTX/raster процессы не зависят от запуска Ayla.

## 3. Read-only preflight (не запускать mutations)

Перед первой установкой R01.1 получить **санитизированные результаты**, не токены, не полную IAM dump в публичный PR:
- \`gcloud config get-value project\` / active project id (если использует personal gcloud, дополнительно проверить remote project по явному \`--project\`).
- \`gcloud projects describe PROJECT_ID --format="value(projectId,lifecycleState)"\`.
- \`gcloud compute instances list --project=PROJECT_ID --format="table(name,zone,status,machineType,serviceAccounts.email)"\` (при разрешениях).
- \`gcloud iam service-accounts list --project=PROJECT_ID --format="table(email,disabled)"\` (при разрешениях).
- \`gcloud storage buckets list --project=PROJECT_ID\` (при разрешениях).
- Проверка ролей/политик **только read-only** для конкретной SA, GCS и WIF; секреты и private keys не распечатывать.
- Current billing enabled/state проверить через соответствующий разрешённый API, без включения биллинга или создания счёта.
- GitHub Actions existing secrets **названия** известны, значения redacted; WIF binding для обоих репозиториев — проверить в GCP policy.

При \`PERMISSION_DENIED\` результаты считать unknown, не «ресурса нет». Не запускать \`gcloud compute instances reset\`: donor R13 acceptance workflow **сбрасывает VM** и не должен применяться к общей production VM Product Factory.

**Preflight output contract:** \`AYLA-CLOUD-READONLY-INVENTORY.json\` (sanitized): verified_project_id, verified_principal, WIF binding eligibility for code repo, instances(name,zone,status,capacity observation), bucket refs (без секретов), IAM permission gap, running services evidence, proposed tenancy (cohost or separate VM), owner approval required, verification timestamp, evidence refs and unknown fields.

## 4. DoD обязательный для R01.1 без вреда другим проектам

| ID | Критерий | Gate |
|---|---|---|
| CLOUD-SHARE-01 | Название **реального** проекта и principal подтверждено read-only GCP API или exact signed evidence, не только README | REQUIRED |
| CLOUD-SHARE-02 | Существующие service account, WIF condition и права задокументированы в redacted inventory, значения ключей не извлечены | REQUIRED |
| CLOUD-SHARE-03 | Проверена применимость действующего WIF для repo Ayla или согласован отдельный narrow binding/CI deploy path | REQUIRED |
| CLOUD-SHARE-04 | VM cohosting разрешён только по capacity/isolation proof; иначе отдельная Ayla VM **в том же проекте** | REQUIRED |
| CLOUD-SHARE-05 | Ни один запуск/стоп/restart/migration Ayla не меняет процессы, DB и порты Infourok/PF | REQUIRED |
| CLOUD-SHARE-06 | Threads credentials, Persona DB, backups, media и LLM ledger в отдельных namespaced resources | REQUIRED |
| CLOUD-SHARE-07 | IAM по умолчанию без расширений существующих SA, без shared JSON keys; новые роли только отдельным owner-approved change | REQUIRED |
| CLOUD-SHARE-08 | После тестового рестарта **только Ayla** прежние PF/Infourok службы работают без изменения health/lease/recovery state | REQUIRED |
| CLOUD-SHARE-09 | Ayla pause/killswitch не останавливает UMF/PF, а PF freeze не изменяет Ayla; global emergency control семантика чётко scoped | REQUIRED |
| CLOUD-SHARE-10 | GCS-prefix separation подкреплена поддерживаемой IAM policy либо выделен отдельный bucket | REQUIRED |
| CLOUD-SHARE-11 | Existing R12/R13/R15 CI, Windows runner и UMF-009/010 gate остаются без изменения; никаких разрушительных live VM тестов общих сервисов | REQUIRED |
| CLOUD-SHARE-12 | Owner-reviewed resource/cost isolation, no unauthorized billing/mutations; audited production-like E2E | REQUIRED |

**DONE:** только после всех REQUIRED, owner acceptance, потом имеет смысл начинать реальные R01.2 Threads операции. **STATUS сейчас: проектные правила зафиксированы; live cloud inventory UNVERIFIED.**

## 5. Изменение ADR-001

ADR-001 сохраняет рекомендацию **persisted always-on worker + independent BYOK LLM** и критерии автономности; его предположение о выделенной новой VM теперь **условное**. Этот ADR-002 является уточнением tenancy:

- Первый выбор — **существующий GCP project**, не новый.
- Первый шаг — **read-only inventory**, не команда «создать VM».
- Cohost existing safe Linux VM только после capacity/isolation proof; иначе своя Ayla VM в существующем GCP project.
- Не расширять доступы старой Service Account ради нового проекта.
- Не подвергать Windows Product Factory reset/stop ради acceptance Ayla.
- Не брать для Ayla текущий UMF Agent Gateway и его ngrok endpoint: архитектурные идеи можно переиспользовать, публичные маршруты и state нельзя.

**Окончательное развёртывание:** только по owner-approved inventory, ресурсам, бюджетам, IAM и permissions.
