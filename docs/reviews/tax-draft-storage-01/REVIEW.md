# Tax/demo draft storage boundary

Accepted baseline: `d615271cbf6b7a6aa2951370a0354b8c5cee40e7` (merged PR #239).
Scope: the next storage boundary in `docs/architecture/nomad360-boundaries.md`.

## Result

`US_Retail_Demo.HTML` now uses the same validated V1 read, write and removal
adapter as `Marketing_calc.HTML`. Both goods and services Sales Tax wrappers
use the shared JSON transport. The original simple-service selection key
`nomad360SalesTaxSimpleV1` is now owned by that adapter too.

Tax wrappers retain their historical raw JSON read separately from validated
portfolio resume. This preserves partial old records without weakening the UI's
portfolio validation. No schema migration, new storage, automatic conversion,
new tax validation, or change of reset semantics is introduced.

Only four application files change. Exact reversible replacements and before /
after SHA-256 fingerprints are committed in
`tests/fixtures/tax-draft-storage/extraction.json`. Financial modules, the primary
HTML, payment/FX modules and V2 engines are byte-identical to accepted main.
Existing historical guards normalize only these fingerprinted changes before
performing their original comparisons; an extra source edit is rejected.

## Verification

- Syntax checks for changed JS and browser harness.
- 63 unit/source/numeric checks: storage errors, malformed JSON, partial records,
  independent simple tax key, exact reversibility, immutable V1 engine,
  historical VAT evidence, independent Sales Tax and V1/V2 parity.
- Chromium compares actual accepted main with this branch, not a recreated
  baseline. Two entrypoints × RU/EN/KK × 320/360/390/430/768/1280 px.
- Seven goods/service profiles per matrix row use the accepted numeric inputs.
  VAT / Sales Tax / none rotate across the matrix. Each profile resumes two SKUs,
  saves the tax selection, edits and saves, starts fresh without destroying the
  stored draft, resumes, removes one SKU, then removes the last SKU.
- Separate checks cover actual reload of the V1 record and simple tax selection,
  malformed JSON without deletion, forbidden localStorage getter and failed save.
- Full numeric results, serialized records (excluding only the save timestamp),
  tax state and operation outcomes are compared exactly before/after.
- Protocol and 72 screenshots are uploaded by `tax-draft-storage.yml`.
- L0 inventory regenerated for source offsets; UI copy and semantic keys unchanged.

Final local protocol counts and CI links are recorded in the PR description once
available. GREEN is a technical result; this PR remains Draft for user acceptance.

## Limits and remaining scope

No new partner form, password ZIP, server delivery, personal data policy or brand
configuration is part of this storage refactor. The next architectural boundary
is versioned partner configuration, separately from formulas. The original
filled US demo exports remain historical artifacts, not silently rebuilt here.
No manual Excel Desktop or physical mobile device run is claimed. Existing
browser/Excel/PDF/standalone regression workflows remain required.
