# P3 — private partner issuance implementation

## Main synchronization · 25 October 2026

Conflict repair uses accepted public main `6e3810befffb4f50767d879fd3715cecce2096a7`.
The three conflicts are documentation/task map and the SEO path allowlist;
current main wins for all unrelated accepted changes, while issuance-specific
paths are added explicitly. Original operator/Google/archive/vault code is
byte-identical to implementation `3314ec3`; current calculator/draft/financial
source and build/config remain byte-identical to accepted main. The source
scope now pins this reviewed main, including both new C6 modules, rather than
comparing accepted refactors with the obsolete pre-C5 snapshot.

This is conflict/test integration, not worker activation or Google authorization.
Private #494 is accepted/merged; read-only main preflight `40236324539` still
found no configured SDK owner OAuth or injected WIF input. Keep the historical
connector-mediated owner-mailbox receipt below as history, not current runtime
proof. R5 live auth/intake/delivery and current hosting/SEC-01 gates remain open.
Repeated CI and encrypted ZIP/browser parity receipts are reported after execution.


Base: merged PR #242, `d7df6102f8961e83e5eea78c91ae4d9fd0d55bae`.
Owner choice: Gmail `nomad260393@gmail.com`; applications/issuance registry on
their private Google Drive. No website runtime or financial code changes.

Implemented: independent package/vault/state/mail/registry adapters, one-time
email confirmation, explicit operator review, complete-package provenance,
AES-256 ZIP, Google owner checks, private Drive upload, Gmail MIME/attachments,
literal Google Sheet values and an explicit private operator command entrypoint.

The actual private Google Sheet has instructions plus three native tables:
applications, issuances and events. Sharing initially read back as owner only.
At the owner's request, their existing service account was subsequently granted
editor access to this registry only; the archive folder remains owner-only. Its IDs
and application/contact data are excluded from the public repo. No real partner
application was invented; one technical delivery is clearly labelled as a test.

A real calculator ZIP and manifest were encrypted and independently extracted
with pyzipper. Both files reject a wrong password. Extracted HTML equals the
accepted build. A private Drive copy and one owner-directed Gmail message were
created with the connected tools; the sent message was read back with INBOX and
SENT labels. The public receipt records no password, token, Drive link or Gmail
message ID. This was a connector-mediated test, not a deployed worker run.

Automated checks cover state transitions, replay/expiry/attempts, secret purpose
binding, concurrency, corruption, missing consent, immutable registration,
uncertain sends, correct Google identity, shared-folder rejection, MIME and
formula injection. The encrypted browser suite applies the existing real
source/package numeric and demo matrix to HTML extracted by the independent
reader, including RU/EN/KK and mobile widths. No live sends happen in CI.

Limitations are explicit in [the architecture contract](../../architecture/partner-issuance.md).
The permanent OAuth runtime and trusted Formspree intake are not configured.
External-recipient confirmation and the exact production worker's mail send are
not claimed. This PR therefore does not close P3 or activate public issuance.

## Local results

- 26 unit/provider/operator/source tests pass, including the full operator flow,
  archive tampering, explicit renewal of an expired confirmation challenge,
  concurrent registration, preservation of manual/partial Sheet rows and
  lifecycle-only updates. A shared projection lock serializes first-empty-row
  selection across distinct applications on the supported operator host.
- The real encrypted browser test at `462ffcc6b7346bbe1048010605179401b57bc89b`
  passed 18 language/width combinations and 1,278 scenarios with 65 source
  resources, zero numeric changes and identical independently extracted HTML.
  See [browser-protocol.json](browser-protocol.json).
- Subsequent changes add private confirmation renewal, owner OAuth refresh,
  separate existing-Sheets-identity support and test/report evidence; the packer,
  archive implementation and all browser sources remain
  unchanged from that successful encrypted matrix.
- The Drive copy was downloaded again through the authenticated connector;
  its ZIP SHA-256 and independently decrypted HTML match the original.
- JavaScript syntax and unchanged published-runtime checks pass. Source is
  published as draft PR #243. Current CI evidence is recorded in that PR.

The existing service identity was grounded against an existing owner-controlled
registry and repository deployment references. Its key and the owner OAuth
credential binding remain on another runtime, not in this cloud workspace.
Repository secrets listing is denied to this integration (403); secrets are not
extracted through workflows or source files. The reuse path accepts an existing
credential selector and does not create a new Google project/client or grant
mailbox access to a service account.


### Current-main local verification

26/26 operator/config/auth boundary tests passed. The refreshed browser protocol
uses local integration revision `e1f504f`: 18/18 RU/EN/KK × six-width cases,
1278 numerical/scenario comparisons, 65 bundled resources, zero numerical changes.
The real WinZip AES-256 archive was opened with independent pyzipper 0.3.6;
extracted HTML was byte-identical and the wrong password was rejected. The
[original protocol](browser-protocol-20261023.json) is preserved separately.
No real application or mail/Google write was used. Current HEAD CI is reported
in the PR, independently of the historical receipt below/above.
