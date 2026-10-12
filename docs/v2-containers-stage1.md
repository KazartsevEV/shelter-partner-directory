# V2 redesign — stage 0/1 acceptance

User specification: `Pasted text.txt`, received 2026-10-12. Scope is stage 1 only:
the main containers and their text colors. Stage 2 and later require acceptance.

Baseline: `d0cf181aac92115a4f6f838e7a9b976733b21f88` on main, following the
restoration in PR #127 and the currency change in PR #128. Historical reference:
`6fbfa950ab773d6df3b6b91ebf5c9a874b22930b`. PR #124 styling must not be restored.

PR #128 passed 7/7 checks before merge. On its merge commit the regression suite
passed 210 tests; GitHub Pages deployment succeeded and exact SHA256 parity for
18 deployed assets, including `nomad360_currency.js`, was confirmed in
Actions run `38221371009`.

## Existing surfaces, before styling

| Module | Existing component | Layout owner |
| --- | --- | --- |
| `portfolio_v2_ui.js` | `box()` — nine standalone sections | Original padding, margins, grids and field helpers |
| `portfolio_v2_ui.js` | Hero, `#p2-results` | Original hero and financial result templates |
| `portfolio_v2_linked_ui.js` | Hero, V1 economics, resources, temporal controls, `#linked-results` | Existing linked render template |
| `portfolio_v2_basket_ui.js` | `#linked-basket-panel` | Existing basket render template |
| `portfolio_v2_mba_observed_ui.js` | `#linked-mba-panel` | Existing optional history render template |
| `nomad360_design_system.css` | Shared input colors, type sizes, focus, local table scrolling | Preserved shared rules |

Resource cards, SKU forms, allocations, periods, salary semantics, CTA hierarchy
and the order of result metrics remain owned by their existing code. They are
outside stage 1. Any pre-existing grid limitations will be recorded for stage 2.

## Visual evidence

The review workflow builds the exact baseline from a Git archive and captures
the existing standalone/linked V2 before any stage-1 styling. A local compiled
Tailwind stylesheet recreates the current utilities without CDN timing changes.
The browser matrix uses 320/360/390/430/768/1280 px and RU/EN/KK, both populated
and unready states. PNGs at 390/1280 px and machine-readable geometry/finance
receipts are uploaded as the `v2-containers-review` Actions artifact.

Stage 1 will compare original control geometry, resource-card markup and colors,
field values, stored drafts and numerical results against these receipts. It will
also test explicit colors with optional Tailwind styles absent.

Publication: a separate stage-1 PR remains unmerged until the user accepts it.

## Stage 0 receipt

Commit `7210fd0c19f67aece6b60936c6437f6566eecfed` captured the unchanged baseline:
72/72 Chromium cases passed in run `38222017824`, artifact `11733914453`.
Screenshots cover both routes, RU/EN/KK and 390/1280 px. At 320/390/1280 px,
document scrollWidth matched the viewport and all visible inputs stayed inside it.

## Stage 1 implementation

Named classes style the existing section, hero, product-information and result
surfaces. Main sections use the shared navy token; product/information insets use
`#31577C`. Descriptive text and labels have explicit white colors, separate from
the existing white input surfaces and navy input text. White page background is
scoped to the visible V2 screen. Existing border-radius token replaces large
surface corners; section shadows are removed. No layout, spacing or type sizes
are changed, and no new global utility selectors or important rules are added.

Runtime changes: `nomad360_design_system.css`, `portfolio_v2_ui.js`,
`portfolio_v2_linked_ui.js`, `portfolio_v2_basket_ui.js`,
`portfolio_v2_mba_observed_ui.js`. All displayed strings retain their existing
translation keys. No new product copy or untranslated labels are introduced.

Acceptance checks compare the before/after finance and saved-state receipts,
control values/geometry/colors, resource-card DOM/colors/geometry, section bounds
and document overflow. Additional checks verify actual surface/text colors with
and without utility styles. Protected V1/header/footer/locale and engine files
must be byte-identical to the baseline; resource-card templates must also match.

Stage 2 mobile layout, stage 3 CTA hierarchy, stage 4 resource-type/payroll fields
and stage 5 financial-result hierarchy remain pending user acceptance of stage 1.
