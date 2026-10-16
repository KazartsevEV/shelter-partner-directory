# TASK-09 — Floating 'Report a bug' widget

**Branch:** `feature/bug-report-widget-09`, based on `40c792ef06e754ea2ce44f64e68f717f27e8cdb7` (main after 7Б-6).
**Status (2026-10-17):** UI, privacy and mocked-transport acceptance GREEN on `2f64ddba` ([task 09 CI](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38959953956), both jobs success). Six-viewport touch regression was added in `646f470c` and requires separate current-HEAD CI confirmation. **Real Formspree email delivery remains BLOCKED pending account access and a verified form ID**; PR remains Draft. No actual Gmail receipt is claimed.

## Product contract and implementation

- Small fixed loudspeaker launcher at the right, accessible native modal dialog with Escape, keyboard focus, visible close button, RU/EN/KK; widths 320, 390, 768 and 1280.
- Required bug explanation (up to 4000 chars), optional reproduction steps (up to 3000 chars), optional contact email (up to 254 chars); no name or account. Uses only validated explicit user inputs.
- Visible privacy note: transmitted keys are only `message`, optional `steps`, optional `email`, `interface_language`, `viewport_width`, constant `_subject`. The form handler may see IP. No `location.href`, query, user-agent fingerprint, cookies, localStorage, calculations, SKU, financial data, attachments or hidden screenshot transfer.
- Submit is disabled when no endpoint is configured; only an approved Formspree endpoint `https://formspree.io/f/<id>` is accepted. No endpoint is configured on the site in this PR, per roadmap's approval-first rule. Formspree identifier is a public routing ID, not a secret.
- Transport, after approval: POST with explicit `FormData` allowlist, no credentials, `Referrer-Policy: no-referrer`, 15-second timeout. Requires HTTP 2xx AND JSON `{ok:true}` for success. 429/network/invalid response are failure and allow retry. No false success.
- Downloadable standalone HTML disables the widget in `data-nomad-embedded` context, preventing third-party copies from sending reports to the project's mailbox.
- No VAT/financial calculation, tariff, workflow selection, autosave, existing localized text or numerical allowance is modified.

## External provider recommendation — requires explicit approval

**Formspree:** https://formspree.io/plans — Free tier $0, up to 50 submissions/month, up to two linked notification emails, 30-day archived submissions, basic spam filtering, domain restriction and optional reCAPTCHA; Personal tier $15/month or $120/year ($10/mo paid annually), 200 submissions/month. External form processor receives the actual user message and processing/network metadata such as IP; not absolutely anonymous. Configure a Formspree form in the owner's account and link notification email `nomad260393@gmail.com`, enable spam filtering, restrict to calculator domain, then provide the *form ID* for owner-approved activation. See https://help.formspree.io/articles/account-management/account-limits and https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax.

**Owner gate:** Do not publish an unapproved endpoint or declare the final DoD complete until a real test message is confirmed received at `nomad260393@gmail.com`. The Draft PR contains form/UX work only and mock network tests.

## Acceptance matrix

| Check | Implementation | Evidence / result |
| --- | --- | --- |
| User language and labels | RU / EN / KK, in-place language switch | GREEN, [task 09 CI](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38959953956) |
| Width and overlay | 320/390/768/1280, no added horizontal overflow | GREEN on previous 12-case Chromium matrix; new 320/360/390/430/768/1280 **touch/mobile** matrix added on `646f470c`, CI to confirm |
| Keyboard/accessibility | aria-label, native dialog, Escape, focus restoration | GREEN in Chromium automation; not an independent screen-reader or physical-phone test |
| No financial/personal fields | allowlist payload, intercepted POST and fake private localStorage | GREEN |
| Successful handler response | mocked HTTP 200 `{ok:true}` only | GREEN **mock**, not email delivery |
| Handler failure | mocked HTTP 500, deceptive 200 `{ok:false}`, 429, retry | GREEN |
| Unconfigured handler | sending disabled, honest no-service message | GREEN |
| Backward finance/VAT behavior | original frozen VAT engine and Sales Tax tests | GREEN, guard workflow and other financial CI on previous HEAD |
| Actual Gmail email delivery | real Formspree handler not created/linked | **BLOCKED — sign in, create form, configure inbox, verify delivered email** |

**Workflow state by exact HEAD:** previous `2f64ddba` had 21 of 22 workflows successful and one typography workflow still in progress at inspection; 0 failures. The task-09 workflow's two jobs both succeeded and generated [12 screenshots](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38959953956/artifacts/12072805242). The new `646f470c` increases the browser matrix to 18 cases with touch/mobile emulation; its CI is distinct and must be read before declaring HEAD GREEN.

**Provider setup and delivery gate:** Sign in to Formspree under an owner-controlled account; create a form named `Nomad360 Lite — Bug Reports`; set its notification target to `nomad260393@gmail.com` and verify address as required; enable basic spam filtering and reCAPTCHA if appropriate; restrict accepted domains to the actual production calculator domain. Copy only the form's publicly safe `https://formspree.io/f/<form-id>` endpoint into the page attribute `data-nomad-bug-endpoint` in a subsequent commit; never use private API tokens in the frontend. Submit one real report through the calculator and verify both the Formspree submission record **and actual receipt in Gmail**. Recheck RU/EN/KK, mobile layout, an anonymous report without reply email, provider failures, 429, and protected finance baseline. Do not merge without user acceptance.

**Operational limitation:** Formspree's Free tier has a monthly cap; over-limit messages may be stored by Formspree without email notification. HTTP 2xx / `{ok:true}` confirms **acceptance by Formspree**, not the ultimate arrival of a notification in Gmail. Monitor provider usage and its over-limit alerts; do not claim guaranteed mailbox delivery. The privacy disclosure already says that the provider may see IP/network information.

## Scope: what is not being built

No server database, account, analytics pixel, automatic screenshot, financial logging, hidden capture of drafts or products; the support widget is separate from item 8 (site help) and 7В (commercial banner).
