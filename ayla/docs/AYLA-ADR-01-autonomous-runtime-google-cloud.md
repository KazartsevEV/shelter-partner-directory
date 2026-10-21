# AYLA-ADR-01 — Автономное исполнение R01: Google Cloud Compute Engine, не ngrok

> **Статус:** предложенное архитектурное решение к R01.1; 21.10.2026. **Не означает созданную Google Cloud VM или подключённые аккаунты.**
> **Продукт:** Ayla — самостоятельный компонент внутри Nomad360 Business Solutions, в корне \`ayla/\` рядом с Calculator.
> **Scope:** Threads-only R01; без видео, остальных соцсетей и интеграции с финансовым движком калькулятора.
> **Depends on:** [AYLA-R01](AYLA-R01-threads-first-release.md), [AYLA-R01 infrastructure audit & contract DoD](AYLA-R01-infrastructure-reuse-and-final-contract-dod.md), [CORE-01](../../docs/ayla/AYLA-CORE-01-persona-life-engine.md), [JOB-02](../../docs/ayla/AYLA-JOB-02-functional-specification.md), [JOB-03](../../docs/ayla/AYLA-JOB-03-content-production-feedback-loop.md).
> **Decision:** **предпочтительная production-архитектура — одна постоянно работающая Compute Engine VM + Docker Compose: web/API + автономный worker + общее постоянное хранилище.** Ngrok — только для локального тестирования входящих HTTP-событий и OAuth. Внешняя модель LLM вызывается по API как инструмент worker, а не является хостингом/планировщиком.

## 1. Почему выбор не является «ngrok ИЛИ Google Cloud» в симметричном смысле

- **ngrok**: защищённый туннель для уже работающего локального HTTP-сервиса, а не самостоятельный compute, job scheduler, LLM или гарантированно живой worker. При выключении компьютера/сервиса Ayla перестаёт работать.
- **Google Cloud Compute Engine**: виртуальная машина с продолжающими работать процессами, когда компьютер владельца и ChatGPT выключены. Она не сочиняет контент без отдельно настроенного model inference provider.
- **Cloud Run** может исполнять фоновые задачи/worker pools, если спроектировать внешнюю устойчивую очередь и БД. **Не первый выбор R01**, потому что донор уже использует long-lived worker, SQLite WAL и persistent worker leases. Перенос на serverless потребует другой архитектуры и принятия эксплуатационных затрат.
- **ChatGPT Custom GPT/Gateway** может быть удобным интерфейсом для управляющих команд, но **не служит** постоянной операционной памятью, worker или гарантированным background LLM executor.
- **Google Cloud ≠ Google Gemini**: сервер может использовать Gemini, OpenAI или OpenRouter — это отдельная модельная политика.

Источники: https://ngrok.com/docs/universal-gateway/agent-endpoints/ ; https://docs.cloud.google.com/run/docs/configuring/billing-settings ; https://docs.cloud.google.com/compute/docs/general-purpose-machines .

## 2. Топология одного узла (R01)

    [Owner dashboard / future ChatGPT Actions]
                       |
                  HTTPS + auth
                       |
                  [web/API] -------------------------.
                     |                               |
        canonical command/approved job              |
                     v                               |
         [shared SQLite WAL + Asset Store] <---------'
                     |
                  [worker]  (single active lease owner)
              /       |            \         \
             /        |             \         \
        LLM API    Threads API       GCS      Secret Manager
      (brain)    (external reads/     |             |
                  approved writes)    v             v
                                   media refs    OAuth/app keys
                     |
        [metrics → comment analysis → next Brief]
                     |
             stored as new jobs/versions

Deployment:
- **One Compute Engine VM** in a region chosen after checking billing/latency; initial cost benchmark in eligible US free-tier regions (us-west1, us-central1, us-east1).
- Docker Compose with web and worker, non-root containers, healthchecks, restart policy, graceful shutdown.
- Persistent block disk holds the **Ayla-only** canonical SQLite, encrypted Threads credential store and working assets. Not mixed with Calculator persistence.
- Small, selected generated media may be cached locally; production image publication requires durable HTTPS-accessible files with content hash and expiry-aware signed/public delivery through GCS or another approved provider.
- GCS off-VM backup of SQLite snapshots and immutable originals; verify restoration from **off-VM** backup on a new instance.
- Minimal HTTPS ingress restricted to OAuth callback, opt-in webhook receiver and owner-authenticated control; background worker has **no public inbound listener**. Polling for own comments/insights works via outbound HTTPS without a public endpoint.
- One canonical scheduler/worker queue implementation **reused from the donor**, not a new cron + custom queue in parallel.

**Do not provision production credentials or a VM using undocumented assumptions.** Cloud project ID, billing owner, budget, account/API permissions, provider choice and external write policy require explicit inputs.

## 3. Autonomy is a capability ladder, not one boolean

| Tier | Behaviour | Required capability | R01 policy |
|---|---|---|---|
| A0 | Read facts, analyze, draft, show owner | Worker + model + scoped READ | First live internal mode |
| A1 | Automatically run research and create content briefs/drafts at scheduled times | Persistent scheduler, durable LLM calls, versioned LifeState and evidence | Allowed after QA; no external write |
| A2 | Publish **specifically approved** text/image/carousel at approved times | OAuth, exact-version permit, remote-ID reconcile, budget/quotas | Goal R01 |
| A3 | Automatically answer specified *low-risk own comments* after **one saved random 60–3600s delay** | Classified intent, reply QA, consent, rate limit, execution-time verification | Disabled by default; separate owner permission |
| A4 | Contribute to **third-party Threads conversations** within narrowly approved topic/accounts/limits | Separate ExternalReplyPolicy, discovery, no-sales QA, confirmed remote IDs | Initially per-reply approval, bounded policy optional only after live pilot |
| A5 | Self-update strategies and propose more content from metrics | Observations, comment clustering, LearningDecision, next ContentBrief | Allowed only within approved value/canon/budget policies |
| A6 | Change own canon/visual identity, account scopes, budgets or credentials | Owner decision | **Never autonomous** |

Autonomy is stored as a set of permission scopes by action and account. There is no single «полный доступ»: reading, creating drafts, publishing, own replies, external replies and escalation have independent policies. Revoked token or kill-switch blocks further outgoing actions instantly.

## 4. Job state and schedule

One worker executes a **durable series of independent transactions**; each job has event_id, source_evidence, idempotency_key, policy_scope, due_at UTC, lease owner, retry policy, outcome and cost ledger.

R01 job types:
1. \`research.collect\`: gather permitted published content/threads with cursors, provenance, provider quotas and stale-source validation.
2. \`creator_patterns.extract\`: extract abstract Social/Place/Emotion patterns; raw third-party posts not copied into Ayla publications.
3. \`life.episode_propose\`: consult PersonaCanon, LifeState/Calendar, Relationships, Pattern Library; propose new LifeEvent without violating chronology.
4. \`content.brief_and_copy\`: create/edit short Threads ContentBrief and exact approved copy; call LLM **inside worker**.
5. \`media.reference_portrait\`: load verified canonical JPEG and pass actual bytes to approved reference-conditioned image provider; no fallback to prompt-only Ayla face.
6. \`publication.submit\`: read exact approved package/hash, re-authorize external write, send to Threads, reconcile remote ID.
7. \`discussion.own_comments_ingest\`: read accessible own post replies, maintain cursor/coverage, capture edits/deletes.
8. \`discussion.reply_propose\` and \`discussion.reply_execute\`: LLM proposals, classification QA, policy, quotas, single persisted 1–60-minute delay.
9. \`discussion.external_opportunities\`: find public relevant threads, propose a genuinely useful non-promotional response; separate permit.
10. \`metrics.collect\`: post windows 1h/24h/7d where official metrics available, account-level measurements separate.
11. \`learning.evaluate\`: correlate observable results and conversation topics (without fabricated attribution), create a new versioned learning proposal and next briefs.
12. \`operational.health_backup\`: health snapshot, daily backup, alerts for blocked tokens/model/quotas, owner summary.

**Initial scheduling is policy-based, not constant polling of every source every minute.**
- Daily research and creative planning at configurable quiet-hours-aware windows.
- Target eventually 10–12 original Threads posts/day **after pilot**, not a load-test mandate on first launch.
- Comment monitoring uses allowed webhook if available; otherwise bounded scheduled polling. Avoid unlimited account/keyword polling.
- Own replies after required durable random 1–60 min if/when autonomy approved.
- Provider availability and budgets may delay or stop creation jobs. No fake completion or silently changing models.

### Sample single-day event trace (illustration, not an approved posting schedule)

    research.collect -> evidence #201
    creator_patterns.extract -> pattern #24
    life.episode_propose -> proposed LifeEvent #7
    content.brief_and_copy -> Brief v1 -> copy v1
    [owner exact-version approval]
    publication.submit -> actual Threads remote_post_id
    discussion.own_comments_ingest -> CommentAnalysis
    discussion.reply_propose -> permitted low-risk ReplyJob due_at
    metrics.collect -> real snapshot / unknown fields
    learning.evaluate -> LearningDecision
    content.brief_and_copy -> next Brief v1

## 5. Model inference: brain and budget

- The **server** runs orchestration and persistence. The **brain** is a separate LLM adapter (Gemini/OpenAI/OpenRouter). Reuse provider-neutral contracts from \`lazysellerV2/ai-content-marketer\`.
- Cost-effective pilot may start with provider/key already available to the owner; \`openrouter/free\` is a working **LOCAL_FREE donor option**, not a production availability guarantee, and it does not remove Threads/GCP media costs.
- **Do not commit a paid inference provider** until owner approves price/budget. All generation calls record model ID, token/request count where available, request cost, failures, retry count.
- Suggested separation: cheaper text model for radar/triage, stronger model only for high-value creative/ambiguity if approved; image provider is separately configured and requires actual JPEG reference-image input.
- Timeouts, rate-limits and model outages do not erase research, break approved schedules or turn uncertain responses into facts. A2 may continue sending **already approved** jobs if all permits remain valid; A1/A3/A5 generation without a model is blocked.

## 6. Storage, secrets, security, backup and release operation

- **DB:** SQLite WAL, one canonical broker, separate Ayla namespace and schemas for Canon, LifeState, Creators, Evidence, Brief, Asset, Publication, Comment, Learning, Permit, Costs.
- **Snapshots:** transactionally consistent SQLite backups (donor has online backup/quick_check/restore) uploaded off VM to GCS with retention. A backup is not accepted until restored and health-checked at least once in a test instance.
- **Secrets:** Google Cloud Secret Manager for LLM API keys, Threads app secret, encrypted credentials master key; least-privilege VM service account; never embed keys in Docker image/Git or log.
- **Web/API:** HTTPS OAuth callback on a stable domain; owner dashboard behind authentication, optionally with allowlist/VPN. Threads webhook signatures verified where used. Rate-limit inbound endpoints.
- **Monitoring:** container health, worker heartbeat/lease age, jobs overdue, failed auth, API quotas, last successful ingest/metric snapshot and backup freshness. Define recovery alerts instead of silent stoppage.
- **Rollouts:** staged, manual external writes until policy approved; blue/green is not required for R01. Avoid running two independent write workers against one SQLite without coordinated leases and idempotency.
- **Kill switch:** explicit global freeze, persists through restart and blocks publication/replies, while read-only monitoring/recovery may continue under separate read policy.

## 7. Expected cost boundaries; no invented flat monthly bill

**GCP Free Tier** currently supports one eligible \`e2-micro\` instance-hour equivalent per month in selected US regions, 30 GB-month standard persistent disk and a small outbound data quota. It is **not** a guarantee that a Python web + worker + monitoring deployment fits in 1 GB RAM; run measurements and be prepared to move to a paid \`e2-small/e2-medium\` class or other suitable shape.

- **Compute:** VM and disk/storage/network billed according to region, size and use; set Google Cloud billing budget alerts; budget alerts alone are **not** hard shutoff. Separate hard caps in Ayla jobs for inference/provider media costs.
- **LLM:** API requests (OpenAI/Gemini/OpenRouter) may be charged per call/model/token. No production quota or pricing inferred from a free key.
- **Media:** reference-conditioned image provider may be paid; required public/signed image URLs and GCS stored/transferred bytes may incur charges.
- **Threads API:** platform access/scopes/restrictions still need real-account qualification; success may fail even when host server is running.

Reference:
- https://docs.cloud.google.com/free/docs/free-cloud-features
- https://cloud.google.com/secret-manager/pricing

## 8. A/B acceptance comparison of architecture choices

| Test | ngrok + local PC | Google Cloud VM |
|---|---|---|
| Close ChatGPT, wait for due job | Pass if local computer/worker alive | Pass if VM/worker alive |
| Power off owner laptop | **FAIL** | **PASS** |
| Crash worker process | Requires local supervisor | Docker restart/health checks |
| VM host restart | N/A | Persist queue/canon, restart containers, continue |
| Network outage / token expired | Cannot control local physical uptime | Error logged; retries/re-auth appropriately |
| OAuth callback ingress | Tunnel URL / service dependent | Stable managed HTTPS route/domain |
| Recovery after storage corruption | Manual local backup | Off-VM backed-up restore test |
| New LLM task while user is offline | Only if locally running background inference | Worker invokes external model API automatically |

## 9. Specific R01.1 DoD enhancement

R01.1 is **not DONE** until all the following have real evidence:

1. Cloud project and billing authorized by owner; cloud VM instance ID, region, size, service account, network policy, persistent disk, backup bucket and approved monthly budget recorded.
2. Docker web and worker are deployed as independent processes, sharing an Ayla-only WAL database and durable assets/credentials; no calculator dependencies.
3. Actual production model provider and API key configured after cost approval. With ChatGPT closed, scheduled research/content jobs invoke it and persist **new** evidence and/or text drafts.
4. OAuth callback works over HTTPS on a stable host, securely binds the intended Ayla Threads account; revoked permissions fail closed.
5. Worker and VM restart scenarios prove durable job retention, idempotency and continued schedule; no double publish/reply.
6. External write actions disabled by default until exact approval and account policy permit; expired/over-budget jobs fail closed.
7. Backup is uploaded off VM; **restore tested** from off-VM snapshot; secrets remain outside source control.
8. Frozen face master reloaded by SHA verification, while actual image provider binding remains separate R01.3 acceptance.
9. Admin can see liveness, jobs and last model invocation; alerts issued for overdue queues, expired token, failed backups, budget/quotas.
10. Negative evidence: disconnected owner PC, no open ChatGPT session, model unavailable, revocation, operator kill-switch.

**R01.1 remains \`CI_PROVEN / CLOUD_E2E_UNPROVEN\` until a real deployed VM and all above are demonstrated.** Pure documentation or a passing local CI run cannot be marked as autonomous production.

## 10. Rollout plan

1. Accept this ADR and **select the Google Cloud project + billing budget** with the owner; no production resources before that decision.
2. Port donor Docker/worker/queue and database contracts into independent \`ayla/\` with Local/Cloud runtime profiles, pinned versions and private config. No changes to donor or calculator.
3. Local unit/integration + simulated scheduled model job; deterministic restart and idempotency tests.
4. Provision minimal GCE VM, durable disk and server identity; deploy private dashboard and worker, restrict web ingress; restore/backup test.
5. Configure actual model provider under budget, then run a closed-ChatGPT/owner-PC-off autonomous research and draft test.
6. Add Threads OAuth, permissions and publication capability proof **with external writes still OFF** until R01.2 exact approval. Record evidence into separate stage PR.

### Final outcome

An always-running VM is the **hands and memory**; approved LLM APIs are the **inference engine**; the durable scheduler is the **clock**; scoped policy controls are the **brakes**. Ngrok is a useful temporary tunnel for development but does not solve background autonomy.

**Not done yet:** VM provision, credential binding, model paid/free choice, actual background model execution, Threads account authorization and external publishing. They require technical rollout and explicit owner permissions.
