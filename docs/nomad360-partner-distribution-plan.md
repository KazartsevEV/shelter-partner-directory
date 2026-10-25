# Nomad360 partner distribution: remaining product stages

Status: 23 October 2026. This plan preserves the owner's partnership request and
follows the accepted architecture work #238–240. It complements the main task
map; it does not authorise automatic merge or skipping user acceptance.

**Owner-approved order, 23 October:** finish product preparation without live
credentials, prepare private builds and staging/hosting, then bind existing
Google credentials, prove real delivery and activate the release. The
[R1–R6 production-readiness plan](nomad360-production-readiness-plan.md) defines
the sequence and gates. P3 remains open for operational proof; that does not
block offline preparation. No DNS, repository-visibility or public-download
switch is authorised by this documentation change.

## P1 — Versioned build configuration (PR #241, merged)

One explicit profile, package/partner ID, release version, public metadata,
original brand/contacts and complete calculator capabilities. Build through the
accepted packer and retain source revision plus resource/output digests.
Configuration must not contain formulas, passwords, tokens, application forms or
user calculations. See [the build contract](architecture/partner-package-config.md).

Acceptance: real generated HTML and manifest, repeatable bytes, negative config
and injection tests, unchanged source runtime, numeric/browser parity RU/EN/KK.
This is infrastructure; the existing public download UI is not switched yet.

## P2 — Partner application and consent (PR #242, merged)

Add a secondary CTA, the same size as the download CTA, beneath the embedding
explanation: “Become a Nomad360 Business Solutions partner” (EN canonical, then
RU/KK). The free edition becomes free **for partners** when the actual issuance
flow is released. The form should use the site's established accessible dialog
behaviour and brand colours without sharing the bug form's unrelated payload.

Collect the requested fields:

- Company name, if applicable; business activity; intended use of our product.
- Number of employees; main client segment by business size; company website.
- Contact person's full name, role, email, phone or messenger.

Make required/optional fields explicit, validate actual values and provide
translated loading/error/success states. Do not collect calculator financial
models. Separate consent/visibility choices for registration contacts and public
partner profile fields; preserve the consent/review boundary already in Help.

Acceptance: keyboard/mobile/RU/EN/KK, validation and retry, no duplicate sends,
visible privacy notice and genuine backend acceptance. Submission success must
not claim that a code was delivered before the issuance/delivery service exists.

## P3 — Issuance, email and encrypted ZIP

Draft [#243](https://github.com/KazartsevEV/shelter-partner-directory/pull/243)
at `3314ec3` implements the private operator and Google adapters; all five CI
jobs pass. A connector-mediated owner-mailbox test is not a deployed-worker
test. Permanent credentials, trusted intake and end-to-end real delivery are
deferred to R5, not declared complete. Preparation R1–R4 can proceed without
putting secrets into either public or private Git.

Implement a supported issuance/storage/email channel before making delivery
promises. Keep private configuration and credentials outside the public browser
bundle/repository. The requested storage destinations are GitHub and Google;
confirm the actual configured services, retention and access before describing
them as operational. Browser-visible Formspree bug reporting alone is not an
archive/password issuance backend.

Build from the reviewed profile, package HTML in a genuine password-encrypted ZIP,
record its manifest/version and intended deployment domain, and deliver the
unarchive code to the partner's email. Use a reproducible link between application,
package and delivery status, idempotent retries, and error recovery. Verification
of the email/domain and permitted reuse must be part of this explicit process,
not an undocumented browser restriction. Do not put archive passwords in public
JavaScript, manifests, URLs or committed samples. State the encryption and
supported unzip tools accurately after testing them.

Only after confirmed delivery show the requested message, localised:
“Check your email: your calculator archive code is there. If you do not receive
it, check spam and email nomad260393@gmail.com.” A queued/failed request must show
its actual state. Explain in small print next to download that the calculator is
provided as a password-protected ZIP, alongside the existing JavaScript note.

Acceptance: real encrypted archive, wrong-password failure, correct extraction,
actual email receipt, no client-side secret, retry without duplicate issuance,
source/manifest/output parity, preservation of V1/V2/save/restore/Excel/PDF/HTML.
The current HTML download must not be replaced by an untested delivery promise.

## P4 — Public UI, Help and privacy release

Preparation is now separate from activation: R1 prepares the EN/RU/KK copy,
states and future policy/licence in preview; R6 publishes them only after R5.
The [editorial package](partners/partner-release-copy.md) is a draft, not current
terms or a statement that mail delivery is operational. Keep the live download
unchanged until the real release gate passes.

R1 preview slice: `scripts/partners/release-preview/` uses the unchanged real form
with a fixture transport, explicit loopback-only server and no outbound requests.
`scripts/partners/release-policy.cjs` rejects production/issuance-enabled configs.
See the [verification report](reviews/partner-release-preview-01/REVIEW.md).
This is not a public feature switch or an authenticated production status API.
Registration without a site, subsequent URL checks and complete future legal
terms still require implementation/acceptance; the preview does not bypass the
existing package builder's domain contract.

At activation of the working process, update the comparison table/CTAs and all
entrypoints to the new partnership offer. Review the already merged Help #200
and H12–H16 #235: instructions must match how a partner applies, receives the
archive/code, extracts the calculator and places it on the intended site.
Visitor calculations must remain local and separate from partner registration.

Update the personal-data policy for the actual configured GitHub/Google storage,
public partner directory and contact rights. Preserve the requested explanation:
Nomad360 is developing, values every contact and intends to offer partners early
access to new functionality. Do not turn an intention into a claim that a new
feature or early-access account already exists. Specify the public profile fields
and consent/review process rather than publishing private application contacts.

Acceptance: EN/RU/KK policy, form and Help agree; no stale claim of unrestricted
public download or already-sent password; accessible mobile flow; real delivery
proof and separate user acceptance before merge.

## Связанные изменения R1/R5 — дополняют партнёрский UI

**BUG-09-SCREENSHOT:** при совместной R1-доработке интерфейса партнёрской выдачи добавить запрос необязательного скриншота в независимый баг-репорт; не смешивать баги с партнёрской заявкой и её согласиями. Задача и [DoD](partners/bug-report-screenshot-scope.md): реальный MIME screenshot+message email только после R5 защищённого intake; текущий Formspree Free не позволяет обещать upload.

**WL-CICD-01:** расширить future B2B сравнение Free / White Label от €600 строкой про обновления от разработчиков, совместимое развитие и сохранение фирменных стилей через согласованный CI/CD. [Архитектура/коммерческие ограничения/DoD](partners/white-label-cicd-scope.md). В R1 утвердить локализованный текст, в R3–R5 построить и доказать профиль клиента, pipeline и rollback, в R6 включить оффер вместе с действующим соглашением. Free HTML auto-update **не поддерживает**; €600 не включает бессрочные или неограниченные работы.

## Separate later work

A White Label profile needs the agreed licence and explicit presentation/contact
adapter. Formula changes are never a branding setting. Thematic RU/KK SEO pages,
reciprocal published-URL SEO checks and external Formspree operations remain in
the main map, outside the partner-build PR. Historic online-import failures must
be reproduced on current main before they can be declared fixed or still open.
