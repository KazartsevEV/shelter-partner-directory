# Business currency — queue #119, items 4–5

This change replaces abstract monetary units with an explicit calculation currency.
The home page offers flag + ISO-code options; USD is the initial value. A choice
on Home applies to a new business, while continuing a saved V1/V2 business restores
its own currency. The UI language does not determine the currency or change numbers.

V1 snapshots, product browser drafts, standalone V2, linked V2 and legacy full-service
drafts store currency metadata. Linked imports reject a different calculation
currency instead of adding unlike monetary amounts. Existing drafts without a
currency use the explicit default USD; there is no automatic rate conversion.
Currency appears in monetary labels, calculated money, V2 price-list headings,
the footer and PDF headings. Physical units and quoted user names are preserved.

The financial equations are unchanged. Foreign payment currencies/rates, XLSX,
full L0–L6 localization and replacement of the cotton-shopper demo are subsequent
separate changes, not delivered by this PR.

## Verification in this workspace

- 27 non-browser test files passed, including financial V1/V2 oracles and locale
  diagnostics. The three new currency tests passed, with a validated five-source
  linked portfolio proving identical numeric results for USD/KZT/EUR metadata.
- `portfolio_v2_online_import.test.cjs` fails both here and in an untouched worktree
  of the same baseline; its provenance/margin failures predate this change.
- JavaScript syntax and `git diff --check` passed.
- Local browser verification is blocked: the bundled Playwright browser is absent,
  and the system Chromium exits under the workspace socket restrictions.
- `currency-acceptance.yml` adds browser checks for 320/390/768 px, RU/EN/KK,
  preservation of input values and source names, saved-state currency restoration,
  and V2 price/PDF currency. These checks still need a successful GitHub Actions run.

Status: draft; no merge, no Pages deployment and no live acceptance claimed.
