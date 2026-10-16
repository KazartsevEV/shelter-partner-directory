# TASK-09 — Floating 'Report a bug' widget

**Branch:** `feature/bug-report-widget-09`, based on `40c792ef06e754ea2ce44f64e68f717f27e8cdb7` (main after 7Б-6).
**Status:** UI and mocked-transport delivery acceptance in a Draft PR; **real email backend deliberately not activated pending owner's explicit provider approval**, and actual Gmail inbox delivery not yet verified.

## Product contract and implementation

- Small fixed loudspeaker launcher at the right, accessible native modal dialog with Escape, keyboard focus, visible close button, RU/EN/KK; widths 320, 390, 768 and 1280.
- Required bug explanation (up to 4000 chars), optional reproduction steps (up to 3000 chars), optional contact email (up to 254 chars); no name or account. Uses only validated explicit user inputs.
- Visible privacy note: transmitted keys are only `message`, optional `steps`, optional `email`, `interface_language`, `viewport_width`, constant `_subject`. The form handler may see IP. No `location.href`, query, user-agent fingerprint, cookies, localStorage, calculations, SKU, financial data, attachments or hidden screenshot transfer.
- Submit is disabled when no endpoint is configured; only an approved Formspree endpoint `https://formspree.io/f/<id>` is accepted. No endpoint is configured on the site in this PR, per roadmap's approval-first rule. Formspree identifier is a public routing ID, not a secret.
- Transport, after approval: POST with explicit `FormData` allowlist, no credentials, `Referrer-Policy: no-referrer`, 15-second timeout. Requires HTTP 2xx AND JSON `{ok:true}` for success. 429/network/invalid response are failure and allow retry. No false success.
- Downloadable standalone HTML disables the widget in `data-nomad-embedded` context, preventing third-party copies from sending reports to the project's mailbox.
- No VAT/financial calculation, tariff, workflow selection, autosave, existing localized text or numerical allowance is modified.

## External provider recommendation — requires explicit approval

**Formspree:** https://formspree.io/plans — Free tier $0, up to 50 submissions/month, up to two linked notification emails, 30-day archived submissions, basic spam filtering and optional reCAPTCHA; Personal tier $15/month or $120/year ($10/mo paid annually), 200 submissions/month. External form processor receives the actual user message and processing/network metadata such as IP; not absolutely anonymous. Configure a Formspree form in the owner's account and link notification email `nomad260393@gmail.com`, enable spam filtering, restrict to calculator domain, then provide the *form ID* for owner-approved activation. See https://help.formspree.io/articles/account-management/account-limits and https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax.

**Owner gate:** Do not publish an unapproved endpoint or declare the final DoD complete until a real test message is confirmed received at `nomad260393@gmail.com`. The Draft PR contains form/UX work only and mock network tests.

## Acceptance matrix

| Check | Implementation | Result |
| --- | --- | --- |
| User language and labels | RU / EN / KK | CI pending |
| Width and overlay | 320/390/768/1280, no horizontal overflow | CI pending |
| Keyboard/accessibility | aria-label, dialog, close, Escape, focus restoration | CI pending |
| No financial/personal fields | allowlist payload, intercepted POST and fake private localStorage | CI pending |
| Successful handler response | real-like `{ok:true}` mocked only | CI pending |
| Handler failure | mocked HTTP 500, misleading 200 `{ok:false}`, 429, retry | CI pending |
| Before owner approves external provider | sending disabled, honest no-service message | CI pending |
| Backward finance/VAT behavior | original frozen VAT engine and Sales Tax tests | CI pending |
| Actual Gmail email delivery | provider not approved/connected | BLOCKED — owner approval |

## Scope: what is not being built

No server database, account, analytics pixel, automatic screenshot, financial logging, hidden capture of drafts or products; the support widget is separate from item 8 (site help) and 7В (commercial banner).
