# TASK-09 — Floating “Report a bug” widget

**Branch:** `feature/bug-report-widget-09` (PR [#174](https://github.com/KazartsevEV/shelter-partner-directory/pull/174)); base `40c792ef06e754ea2ce44f64e68f717f27e8cdb7`.

**Status (2026-10-17):** Owner-approved Formspree public form `https://formspree.io/f/mwlvadod` is wired into the isolated bug-report module. **LIVE transport acceptance and real Gmail notification delivered**, in addition to the successful mocked-browser matrix. User-facing calculator deployment, a real public-browser submission from the deployed page, independent physical mobile/screen-reader acceptance and explicit owner permission to merge remain outstanding. **PR stays Draft.**

## Product contract and scope

- Right-hand fixed loudspeaker launcher, native accessible `dialog`, explicit close / Escape / focus restoration, RU/EN/KK updates without losing unsent text, responsive layout.
- Required message (up to 4000 characters), optional reproduction steps (3000) and optional reply email (254); no account or required name.
- Explicit FormData allowlist: `message`, optional `steps`, optional `email`, `interface_language`, `viewport_width`, fixed `_subject`. No URL path/query, user agent fingerprint, cookies, localStorage, financial drafts, SKU values, attachments, screenshots, documents or other finance data are put in the form body.
- The provider may see the sender's network IP and referring **site origin**. For compatibility with Formspree's domain restriction, cross-origin requests use `strict-origin-when-cross-origin`: browser referer is only the origin, not page path/query. See [Formspree domain restriction guidance](https://help.formspree.io/articles/form-and-project-settings/restrict-to-domain). Strict `no-referrer` would cause domain-restricted submissions to be classified as spam.
- An explicitly owner-approved **public routing ID**, `mwlvadod`, is configured only in `nomad360_bug_report.js`. No password, API secret, private token or email routing address appears in the HTML. Protected calculator markup remains unchanged except the two original stylesheet/script includes.
- POST without credentials. UI success requires both HTTP 2xx **and** JSON `{ok:true}`; 429, HTTP 500, 200 `{ok:false}`, malformed response and network error do not show false success and permit retry.
- Autonomous downloadable partner HTML does not initialize this Nomad-owned support widget. No financial engine, VAT fixtures, Sales Tax calculations, pricing logic, autosave or stored draft format changed.

## Live service and receipt — verified

The owner created and supplied Formspree's public endpoint `https://formspree.io/f/mwlvadod` on the Free plan. The endpoint is integrated in PR #174 and not yet published to `main` / GitHub Pages.

- **Actual transport probe:** a single owner-authorized POST with multipart `FormData` containing a synthetic text-only report, language `ru`, viewport 390 and no visitor email. It used `Accept: application/json` and the intended site's Referer origin `https://kazartsevev.github.io/`. The probe ran in [GitHub Actions job for HEAD `539f3d25`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38965249716) and reported `FORM_SPREE_LIVE_ACCEPTANCE` with **HTTP 200, `ok:true`, `providerOk:true`**, no errors. Trace: `TASK09-LIVE-SMOKE-1792184168256`.
- **Mailbox verification:** the connected Gmail mailbox `nomad260393@gmail.com` received a real message from `noreply@formspree.io`, subject **“Nomad360 lite bug report - TASK09 live acceptance”**, timestamp 2026-10-16 20:56:08 UTC. [Open actual Gmail notification](https://mail.google.com/mail/u/?authuser=nomad260393%40gmail.com#all/1a14680371e017ca).
- This proves the approved endpoint accepts anonymous reports and generates the owner's notification email. It **does not** prove that a user's post-merge browser request or an email containing arbitrary content will always be delivered. The temporary live-smoke job and its temporary L0-generation workflow have been removed; future PR CI is mock-only and will not consume Formspree quota.
- The connected Gmail inbox also contained a Formspree account-linked email verification notice. Email receipt above is verified; the account linked-email verification status, notification workflow and domain-restriction setting inside Formspree's authenticated dashboard have **not** been independently inspected. Basic provider spam protection is available; do not claim that reCAPTCHA/Turnstile or domain restriction was enabled.

## Automated acceptance

| Check | Result / evidence |
| --- | --- |
| RU / EN / KK × 320/360/390/430/768/1280 px | **18 browser cases GREEN**, including mobile touch emulation, native modal, no added overflow; [task-09 workflow on `7b4dca51`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38972817970) |
| Accessible controls and behavior | **GREEN**: labels, Escape, focus return, close, dynamic language switch |
| Safe payload and anonymous send | **GREEN**: allowlist, no finance/localStorage in intercepted request; no email or steps required |
| Handler failure/retry | **GREEN, mocked**: HTTP 500, fake success body, HTTP 429, subsequent valid receipt |
| Valid handler configuration | **GREEN**: approved ID enables send, arbitrary non-Formspree hostname rejected, no secret |
| Real handler `2xx/{ok:true}` | **GREEN, external live POST**; see trace above |
| Real Gmail delivery | **GREEN**: notification actually found in owner's mailbox |
| Frozen VAT and protected finance scope | **GREEN** within task-09 workflow's dedicated finance job on the live test commit |
| Global regression suite | **22/22 GREEN, 0 failed, 0 pending** on source-code HEAD [`7b4dca51e36c`](https://github.com/KazartsevEV/shelter-partner-directory/commit/7b4dca51e36cbac8b9e68b5d58ddf968fc0c85ea), **after** the browser-evidence stabilization and CSS rollback; the earlier source HEAD [`4ae96ea75a9e`](https://github.com/KazartsevEV/shelter-partner-directory/commit/4ae96ea75a9ea2b80712d425312f7559238a58ca) also had 22/22 GREEN. The latest report-only commit(s) must pass their own CI before merge. |
| Formspree dashboard security settings | **NOT VERIFIED (account access required)**: actual `Restrict to Domain`, CAPTCHA and notification workflow toggles. Formspree documents domain restriction and CAPTCHA as available on all plans; availability **does not prove** this account enables them. |
| Public production page, physical phones / screen reader | **NOT YET ACCEPTED**: changes are in Draft branch only |

[All files and diff](https://github.com/KazartsevEV/shelter-partner-directory/pull/174/files) · [18 settled screenshot artifacts](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38972817970/artifacts/12077553472) · [Original task map](https://github.com/KazartsevEV/shelter-partner-directory/blob/main/docs/nomad360-codex-task-map.md).

## Visual audit and provider settings — 2026-10-17

- Inspected the **18 Chromium screenshots** for RU/EN/KK × 320/360/390/430/768/1280. Mobile labels, textarea, optional fields, privacy notice, and submit button are legible and within the dialog. The 320 px dialog fits the available height (850 px test viewport); no widget-induced horizontal overflow was reported. A single screenshot at RU 390 intentionally shows English: the test switches locale mid-dialog and verifies unsent text survives.
- Initial screenshots on emulated touch widths showed a **transient cyan touch highlight** over the lower-right region matching the floating launcher position. A 500 ms settle before screenshots removes it. Production CSS was restored byte-for-byte, retaining the localization inventory checksum; only `tests/nomad360_bug_report_browser.cjs` now waits before capturing. Stable 320 px images with and without the reverted cosmetic CSS line were pixel-identical. This is a screenshot/touch highlight, not a persistent dialog overlay in the observed Chromium run.
- Browser test and visual screenshot review **PASS** in emulated Chromium; real Android/iOS devices, assistive screen reader, and published production URL **are not accepted** and remain owner sign-off items. There is no public production deploy of this Draft PR.
- Formspree documentation: [Restrict to Domain](https://help.formspree.io/articles/form-and-project-settings/restrict-to-domain) and [reCAPTCHA settings](https://help.formspree.io/articles/form-and-project-settings/recaptcha-settings/) are available on all plans. If domain restriction is enabled, enter `kazartsevev.github.io` (without protocol/path); the code's `strict-origin-when-cross-origin` sends that origin. Account settings **cannot be verified from source code or provider docs**; a logged-in owner session is required. Do not claim that CAPTCHA, restriction, or extra filtering are active.
- Intermediate commit `d2aaca2` changed CSS without regenerating L0, causing `Stale L0 inventory: catalog.json` in CI. Corrected by reverting that CSS on `7b4dca51`; the L0 inventory remains unchanged and the dedicated widget workflow is GREEN. This documents a recovered transient CI failure, not a suppressed numeric/financial test.

## Final merge gate

1. Confirm that the user-selected Gmail address remains the target in Formspree Workflow and, if a linked-address verification is still pending, complete it. Enable/test provider anti-spam as appropriate. The [domain restriction](https://help.formspree.io/articles/form-and-project-settings/restrict-to-domain) (if enabled) must match `kazartsevev.github.io`; never substitute site path or leave `no-referrer`.
2. Review the visual screenshots and native mobile/screen-reader behavior. Test real user-submitted browser report from public environment before announcing end-to-end production acceptance; do not conflate CI stubs with published-site testing.
3. Verify **final HEAD** overall CI with 0 failures; preserve original frozen VAT and Sales Tax numerical baselines. The 22/22 completed success above includes the stabilized code HEAD `7b4dca51`; this report-only commit creates a newer Git SHA and must also be checked independently before merger.
4. Keep PR #174 **Draft** until user explicitly approves and authorizes merge. Do not change `main` or start a subsequent task here.

## Operational limitations

Free tier has a monthly submission allowance. A successful handler HTTP receipt does not guarantee every email notification will arrive in Gmail; monitor Formspree submissions, spam, quota and target mailbox. Provider sees technical network data and the originating domain. Screenshots are not collected automatically; users' calculations remain local.
