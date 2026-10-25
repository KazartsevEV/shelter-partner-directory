# SEC-01 — DDoS, bot abuse and expensive-operation protection

**Status 2026-10-25: prepared in private Draft [lazysellerV2 #492](https://github.com/KazartsevEV/lazysellerV2/pull/492), NOT deployed.** Applies to future Nomad360 production R4/R5/R6; excludes the current GitHub Pages project path and unrelated SHELTER site. No DNS, Cloudflare zone, paid resources, live credentials or public download changes are authorized. A green CI is **not** evidence of online DDoS protection.

## Threat model and trust boundaries

| Threat | Control | Deployment/acceptance gate |
| --- | --- | --- |
| Volumetric L3/L4/L7 flood of public website | Proxied CDN with provider-operated DDoS service; WAF; caching for truly static versioned files | **R4**; configured custom domain and actual traffic passing through edge |
| Bypass edge via public worker/origin address | Restrict inbound origin (Tunnel, cloud ingress ACL or authenticated origin pulls/mTLS); strip untrusted edge-proof header and inject fresh private proof | **R4**; verified blocked direct connection |
| Automated forms and verification-code brute force | Edge path rules and origin-local server-side Turnstile Siteverify; exact hostname and action binding; atomic per-actor/global counters | **R5**; real HTTP tests and challenge token negative cases |
| Gmail/Drive/Sheets expenditure, ZIP CPU/memory exhaustion | Atomic cross-worker admission and persistent operation budget; operator authentication; concurrency cap/queue, timeout, ZIP/message size quotas | **R5**; worker/queue and limits must be operationally verified |
| Duplicate email, retries after timeout | Server-side idempotent request reservation plus existing operator state machine; `send_unknown` requires provider reconciliation | **R5**; never retry an uncertain Gmail send automatically |
| Log/data leakage | HMAC visitor identifiers, no raw tokens/email/consent/ZIP passwords or financial drafts in logs; access-controlled retention | **R5**; audit logs and retention policy |
| Flood of former `github.io` URL | GitHub's own infrastructure; app-level Cloudflare WAF cannot filter traffic to that original host | **R4/R6** migration plan; do not promise origin-independent protection |

## Prepared source code (NOT website runtime)

- `nomad360/security/edge-proof.cjs`: SHA-256 timing-safe comparison of high-entropy edge proof, HMAC of trusted client IP. **A shared secret is not a substitute for origin ACL, Tunnel or mTLS.**
- `nomad360/security/turnstile.cjs`: actual Siteverify POST, HTTPS fixed endpoint, `redirect:'error'`, timeout, JSON size bound; verifies `success===true`, hostname and action. No success on network exception or absent secret. Challenge tokens are 5-minute single use. Must be bound to each genuine public submission.
- `nomad360/security/policy.cjs`: initial conservative limits for `register`, `confirm_email`, `resend_code`, `prepare_zip`, `deliver_zip`. These are **provisional** values, not live quotas or measured capacity.
- `nomad360/security/admission.cjs`: explicit operation admission (never derive operation from user JSON), POST + payload-size + edge + strict origin, private operator flag, shared global/IP counter and durable budgets. Fails closed on bad storage/clock; returns no-store, 429/Retry-After, 409 duplicate or 503 when backend unavailable. **Does not start an HTTP server or call Google.**
- `nomad360/security/redis-store.cjs`: optional Redis EVAL atomic counters and opaque 30-day idempotency keys on the same Redis hash slot. No redis server, connection URL, account or credentials installed; caller injects compatible `client.eval`.

### Routing and dependencies

Designated future public routes (paths are **not currently registered**, must be locked to the real R5 router): `POST /api/partners/register`, `/confirm-email`, `/resend-code`. Preparation/delivery routes are **PRIVATE worker commands, never website endpoints**.

All public paths: Cloudflare protected HTTPS request → WAF/rate control → trusted HTTPS/mTLS/Tunnel origin → context from **trusted** socket/edge metadata (not arbitrary `CF-Connecting-IP` or `X-Forwarded-For`) → body size check → SEC-01 admission → validated payload, consent and binding to real application identity → durable registration transaction.

Do not expose `operatorAuthenticated`, `trustedClientIp`, `operationId` or `edgeProof` as fields users can choose; those are trusted-adapter arguments. Strip all user-supplied edge-proof headers at the edge. Never use HTTP `Origin` alone as authentication: it is only a supplementary browser-origin check.

Internal `prepare_zip` / `deliver_zip` only after authenticated operator/service authorization, persistent scoped quota and issuance state-machine checks. Admission alone does not authorize business operations. The HTTP router must cap body bytes **before** buffering; a `Content-Length` claim alone is insufficient.

### Shared atomic adapter contract

The admission gate demands:
- `store.consume({key,limit,windowMs,nowMs}) → {allowed:boolean,retryAfterMs?:number}`
- `store.reserve({key,limit,windowMs,nowMs,idempotencyKey}) → {allowed:boolean,duplicate?:boolean,retryAfterMs?:number}`

Both methods must be atomic **across all instances**. Use Redis EVAL on a single primary (persistent AOF/RDB policy, appropriate ACL, TLS, `noeviction`, resource monitoring, backups/failover). `redis-store.cjs` provides scripts, not a provisioned Redis deployment; its counters are rolling-expiry windows. Dedup keys survive worker crashes for 30 days by default; reconciliation in the issuance state machine remains authoritative after expiry. No process-local `Map` limiter in production. On Redis unavailable, user-visible requests fail closed (503), not silently unrestricted.

The worker queue also needs a separate **global concurrency semaphore**, max runtime and memory, bounded number of retries, and actual Google/Gmail quota reconciliation before R5 acceptance. This is intentionally **not** claimed implemented by the Redis counters alone.

### Provisional budget policy

| Action | Per trusted actor | Global ingress | Daily expensive-operation reserve |
| --- | --- | --- | --- |
| Register | 6/10 min | 300/min | 150/day |
| Confirm email | 15/10 min | 500/min | n/a |
| Resend code | 3/hour | 100/min | 50/day |
| ZIP prepare (private only) | 2/hour | 30/min | 25/day |
| ZIP delivery (private only) | 2/hour | 30/min | 25/day |

Limits are subject to shared-NAT accessibility testing, legitimate partner load and Gmail/hosting quotas; defaults can make a real service unavailable if not tuned. Do not promise high-volume robustness based solely on these values.

## R4 — edge configuration checklist (manual activation, no change now)

1. Choose actual domain, CDN/hosting and confirm plan features and account ownership. Keep the existing SHELTER GitHub Pages domain and unrelated repositories unchanged.
2. Proxy the **actual** production hostname; confirm DNS proxy is active and request path passes through it. Staging should have independent keys and be access-controlled, not merely marked `noindex`.
3. Configure provider-managed DDoS mitigation and available WAF rules. Suggested route-scoped expression: `http.request.method eq "POST" and starts_with(http.request.uri.path, "/api/partners/")`; include hostname check and normalized paths. Use provider dashboard to verify permitted rules on the actual plan.
4. Set separate rate controls on registration, confirmation and resend (preview in log mode, then enforce only after legitimate-client tests). Cloudflare plan limits vary: **do not promise specific Free-tier rule capacity**.
5. Cache immutable fingerprinted CSS, JS, fonts and images; **never cache** registration, identity confirmation, downloads with credentials, API responses or per-user HTML. Preserve RU/EN/KK, PWA and URL migration.
6. Block direct origin access (network ACL/Tunnel/mTLS). Positive test through Cloudflare, negative test direct to origin, no exposed origin port. For shared proxies the trusted IP source must be specifically configured and tested.
7. Alert on traffic surges, mitigation rate, 403/429/5xx, Redis health, queue depth, Gmail/Drive quotas and spend. Set budget alerts; make an incident response/rollback plan.
8. Preserve legacy `github.io` URLs or document their honest limitation; no claim that Cloudflare on a new domain protects `github.io`.

## R5 — API/worker acceptance

- Wire exact public routes to SEC-01 in the private production runtime, with actual Turnstile secret/sitekey per staging/prod hostname and server-side Siteverify. No client-only CAPTCHA or secret in JS.
- Provision shared Redis and bounded private worker queue. Authenticate privileged calls independently of any request body; verify email proof from state machine, safe consent and immutable request binding before invoking operator.
- Run controlled tests on **owned staging only**: valid flow; spoofed proxy headers; bypass hostname; absent/expired/reused/mismatched Turnstile token; known body-size boundary; shared-IP concurrency, repeated IDs, quotas; Redis outage/fail-closed; worker crash/send_unknown/provider reconciliation; parallel ZIP requests; legitimate RU/EN/KK clients.
- Test CDN/WAF telemetry against known staging traffic without uncontrolled stress testing. Do not target GitHub Pages, Formspree or provider networks for simulated DDoS.
- Preserve financial V1/V2, saved drafts, PDF/Excel and standalone HTML numerical contracts. No user calculations through backend.
- Confirm exact provider quota/cost budgets and adjust conservative defaults; retention/deletion for telemetry and pseudonymous IDs.

## R6 — mandatory release gate

Production activation **blocked** until R4 and R5 have evidence of edge enforcement, no direct origin bypass, real challenge validation, shared quotas, capacity and incident-response coverage. Require operational smoke testing and explicit user approval. A green test CI only certifies the prepared source, not Cloudflare/WAF/Redis deployment.

### Official references (review at setup)

- [Cloudflare proxy status](https://developers.cloudflare.com/dns/proxy-status/)
- [Cloudflare WAF overview](https://developers.cloudflare.com/waf/)
- [Cloudflare rate-limit rules](https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/)
- [Cloudflare Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Authenticated Origin Pulls](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/)

**Notes:** source is currently in a Draft branch of the existing public repo and contains no secrets. In R3 place private-worker sources in the approved private `lazysellerV2` path; do not include server-only modules in the future site artifact.
