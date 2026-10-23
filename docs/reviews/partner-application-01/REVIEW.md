# Partner application and consent (P2)

Stacked after PR #241, base `8a150115193b0e1117b6d12babfdf9e50ad15ae0`.
This is the separately requested application form, not archive issuance.

## Behaviour

A secondary CTA immediately below the visible embedding action opens an accessible
native dialog without expanding the comparison table. The two actions retain their
direct-child CSS contracts and have equal responsive dimensions. The form includes company,
business activity, intended use, employee count, main client segment, website,
full name, role, email and phone/messenger. Optional fields are labelled.
Required processing consent and optional public-profile consent are independent
and unchecked by default. Only company name, website and activity are within the
public-profile consent; private contact details are excluded from that scope.

EN/RU/KK copy is owned by the component. Language/currency/footer rerenders retain
field values and consent choices and create exactly one CTA. Escape/close restore
focus. Inputs and consent remain editable after an unsuccessful submission;
concurrent clicks and repeats of an accepted application are blocked.

The data contract, UI and transport are separate modules. The payload explicitly
allows only application fields, the two consents, consent version/time, application
ID and interface language. No URL/query, cookies, calculator values, drafts or
attachments are read. Inputs remain in memory only and are cleared on acceptance.
Retries preserve their application ID; server-side issuance/idempotency is future
work, not claimed by this UI.

## Backend and notice

Owner supplied the separate public handler `https://formspree.io/f/xqppzrbp` in
this conversation. The bug endpoint `mwlvadod` is explicitly rejected by the
partner transport. Only a successful HTTP response with JSON `ok: true` becomes
“application received”. A 2xx response alone, 422, 429, offline and timeout remain
unsuccessful. Requests omit credentials and send only the site origin as referrer.

The inline notice names Nomad360/Formspree, describes the submitted data and
technical metadata, and gives nomad260393@gmail.com for correction/deletion.
It does not claim GitHub/Google registration storage or a sent archive code.
Full issuance, email verification, encrypted ZIP, directory release and their
final public policy changes remain the next product stages.

## Verification

The exact two HTML loader additions are fingerprinted/reversible. Existing
header, bug report, formula engines, draft storage, FX and delivery sources remain
unchanged. Old guards normalize only these exact loader pairs before performing
their original checks. Negative unreviewed changes still fail.

Browser matrix: two entrypoints × three languages × six widths. It checks equal
CTA dimensions, visible field borders/padding, independent consents, required
validation, language/currency rerender, error/retry/acceptance, duplicate blocking,
payload allowlist, focus return, overflow, page errors, and exact financial/draft
state preservation. CI uses mocked transport only. The separate opt-in live test
is never run by CI and marks its application as synthetic.

Final source hashes, CI links, protocol counts and live handler result are recorded
in the PR description and committed live evidence. Initial local live networking
failed without a response; no success was shown. The execution environment's
configured proxy/CA trust was then used for the controlled acceptance attempt.
No claim of mailbox delivery or archive-code delivery is made from a handler ACK.


## Recorded live acceptance

A labelled synthetic application was accepted by the owner-supplied partner
handler: HTTP 200, JSON `ok: true`, at `2026-10-23T08:00:19.813Z`.
The implementation at `41bbf0883e24f8f9e5e015043c38fe7069bcb83d` is identified by
UI/model/transport/CSS SHA-256 values in [live-acceptance.json](live-acceptance.json).
The published evidence contains no application or contact field values.
Review screenshots show the empty form only, before entering test data.
Mailbox arrival, production deployment and archive-code delivery are separate
checks and are not claimed from the handler ACK.


The final UI exposes the partnership CTA immediately below the main embed action.
This layout-only update follows the recorded handler ACK. The transport, data
model and submit handler remain byte-identical to the live-tested implementation;
[submission-integrity.json](submission-integrity.json) records that narrower
comparison. The final layout is checked by the current Chromium/CI matrix.

Existing marketing acceptance now requires both visible actions before comparison
expansion. TYPE-02 excludes only the isolated partner dialog from the calculator
input snapshot and the new CTA from the old text equality comparison. Its geometry,
font and overflow audits still cover the new visible action; the dedicated form
matrix covers dialog controls. Existing calculator inputs and text remain subject
to the original exact comparisons.

The legacy file-URL service restore scenario intermittently failed immediately
after reload in CI (and passed locally and in a subsequent CI attempt). Its test
now checks exact stored bytes and validated draft readiness before the single
restore action. It does not inject or rewrite a draft. Two CI attempts also ran
out of their existing time limits after unusually slow Chromium installation;
neither cancellation is counted as a successful check.
