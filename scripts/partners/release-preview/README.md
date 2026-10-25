# R1 — isolated release preview

This is an operator review tool, not an active public issuance flow. It uses the
unchanged real partner form with a memory-only fixture transport. No live
credentials, Google/Formspree calls, mail, archives or applicant records are used.
Enter fictional data only. EN is canonical; KK needs language acceptance.

Run from a clean source checkout with Node.js 22+:

```sh
node scripts/partners/release-preview/server.cjs --config scripts/partners/release-preview/config.preview.json
```

Open the printed `http://127.0.0.1:<port>/preview/en/` URL. Select EN/RU/KK.
Submit a fictional application with company and website blank; required processing
consent and optional public-profile consent retain their real form behaviour.
Simulate 429/422/network failures and retry. After fixture acceptance, close
the form and use the explicitly labelled simulation controls to inspect expiry,
email confirmation, preparation, unknown mail outcome and accepted mail.
Switching language preserves fields and lifecycle. Reset clears this preview
through a page reload. Nothing is saved to localStorage, a backend or a sheet.

## Release boundary

`../release-policy.cjs` is a build-time v1 contract. Missing config normalizes to
`legacy`; explicit legacy config leaves public download unchanged. Only `legacy`
and `preview` with `issuanceEnabled: false` are accepted. Unknown keys, unsupported
versions, production modes and `issuanceEnabled: true` fail closed. The CLI
requires an explicit non-secret config file; legacy starts no server. It does
not change public pages or patch the accepted partner packer.

The preview binds only IPv4 loopback with a random port, checks Host, serves an
exact asset allowlist, denies POST and sends noindex/no-store/CSP headers. No
production endpoints or keys can be selected through URL parameters. The real
Formspree transport is not loaded; browser connections and form navigation are
also denied by CSP. Do not reverse-proxy or deploy this tool as a public form.
No credentials are needed to run the tests.

The public calculator does not load any preview source, release config or copy.
Its download, official licence, Help, financial engines, storage and submission
handler remain byte-identical to accepted base `6fbae87` (PR #244).
Never treat a simulated provider acknowledgement as authentication or proof
of delivery. There is no production status endpoint in this slice.

## Remaining dependencies

The no-website path is a preview of the agreed target; it does not remove the
current private builder's domain requirement. Real registration/package/install
states and trusted intake still need separate implementation. Actual recipient
verification and delivery remain R5. Full future policy/licence and retention
decisions remain separate; current terms are not replaced here. These limitations
are also displayed in the preview rather than disguised as active capabilities.

Checks:

```sh
node --test tests/partner_release_preview.test.cjs
node tests/partner_release_preview_browser.cjs
```

Browser tests require the project's existing pinned Playwright 1.58.0/Chromium.
Artifacts default to `artifacts/partner-release-preview`; optionally set
`PARTNER_PREVIEW_ARTIFACTS` to a directory outside the checkout. Do not commit
personal application screenshots. The matrix uses fictional values only.
