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
