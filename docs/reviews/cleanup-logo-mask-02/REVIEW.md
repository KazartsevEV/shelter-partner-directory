# C2 — remove the superseded early mobile logo mask rule

Base: accepted main `97b3a21deb6159622f464074f0586af815270a76`.
Implementation and tests: `d5a596e` (application change in `452f6e4`).

Removes only the first 44-byte `.nomad-seo-logo-mask{width:64px;height:64px}` rule. The later identical mobile declaration and frozen LOGO-01 tail remain byte-identical. No financial formulas, UI text, assets or storage formats change.

## Local checks completed

- 74 selected unit/scope tests passed; pinned controls scope guard passed.
- Palette generation, L0 inventory, SEO Phase A and 48 VAT reference cases passed.
- Before/after Chromium: 84 pairs, 252 state comparisons, 12 byte-identical screenshot pairs; live HTML and real standalone package included.
- Six PDF print projections passed. This does not certify native printer drivers.

## Open verification

The unchanged Excel browser regression timed out twice on the PDF export button after restoration (`nomad360_price_export_browser.test.cjs:79`). Do not describe the full Excel regression as passed. Diagnose and complete it before presenting this stage as ready.

This branch is preserved while the user-requested About/Consulting visual fixes are worked on separately. C2 is not merged and is not ready for acceptance. Raw local receipts remain under `artifacts/cleanup-c2/` and `/workspace/scratch/c2-*.log`; publish final receipts when the remaining verification is resolved.
