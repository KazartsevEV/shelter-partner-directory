# Equal type for pricing decisions

The secondary “I need to think” button inherited16px, while “Calculate price
including taxes” used the responsive primary-action type scale. The shared
pricing-decision rule now sets both buttons to that existing larger scale and
line-height. Labels, financial inputs, handlers, colors and font family remain.

At widths up to480px this pair uses one column so long localized labels fit
without overflow or reduced type. Both downloadable filled HTML examples include
the identical scoped CSS. No global CTA size or color was changed.

| Width | Before: think / calculate | After: both |
| --- | --- | --- |
|320px|16 /20px|20px|
|390px|16 /22.62px|22.62px|
|1280px|16 /23px|23px|

Chromium:18 language/viewport cases, RU/EN/KK ×320/360/390/430/768/1280.
Normal/hover/focus type agrees; no button/page overflow, numerical change or page
error. Uses the real populated V1 shopper, local pinned Tailwind utilities and
Inter fonts. [Protocol](browser.json), [mobile](ru-320-buttons.png),
[desktop](ru-1280-buttons.png). Both screenshots inspected.

Historical guards normalize only full-hash-bound approved CSS/inline-bundle
hunks, package byte deltas and exact audit metadata. Compatibility also recognizes
already accepted SEO/Help source and the unchanged R4 workflow when comparing
against earlier C5 receipts; independent current SEO checks remain enforced.
Original financial assets, cleanup proofs, workflow files and historical fixtures
are not rewritten. No broad source exemption or disabled check.

Relevant existing numerical/source/font suites, C1/C5/payment-grid/C6 guards,
palette reproducibility, localization inventory and SEO checks are recorded in
the PR. No deployment or merge; stacked on the tax-notice correction #289.

Additional regression: the unmodified current UI is tested before any historical
alignment.18 cases compare all2436 other button instances before/after this CSS
change, and require exact matching type, color and background; only the pricing
decision pair changes. Current deduction advice is also required exactly once.
This caught and removed an initially overbroad aggregate-action selector.

For historical cleanup/reference browser comparisons, a QA-only helper applies
the exact approved pricing CSS and literal hint correction to BOTH peer DOMs
immediately before capture. Baseline files remain untouched; numeric, clipping,
contrast, all other text/style and package comparisons stay enabled. Whole-source
SHA guards and the independent unaligned current-UI probe prevent this comparison
alignment from masking unrelated changes. No workflow or baseline fixture edit.

Historical package checks now project the exact inline CSS/script bytes together
with their resource hashes and byte counts. C1 continues reporting actual source
sizes and includes the explicit typography delta instead of attributing it to
the earlier cascade cleanup. No runtime or workflow change accompanies this fix.
