# V2 stage 2 — fields and mobile forms

Stage 1 was accepted by the user on 2026-10-12. Its reviewed commit
`0eb9fbc1226c98e32d1a653be7af532dac37f766` is the stage-2 baseline.
PR #129 and main remain unchanged. Stage 2 uses a separate branch/stacked PR.
No permission to merge has been requested or inferred from acceptance.

## Implementation scope

Existing templates gain named field, checkbox, heading and form-group classes.
Each form grid becomes one column below 640 px. Its own desktop layout remains
separate from product grids, nested resource assignments and report grids.
Full-width certificate fields span their form instead of creating an implicit
second column. Controls are at least 44 px high. Checkboxes remain 18 px and
cannot shrink. Labels and long names wrap; remove actions have separate space.
SKU statistics keep compact columns with wrapping instead of text spill.

Native selects retain their values, keyboard behavior and delegated handlers.
If the selected text does not fit, a wrapped copy appears directly below that
same control. It is copied from the translated option, marked aria-hidden to
avoid duplicate announcements, and never added to business state. The helper
reacts to rerender, language changes, field changes and container resize.
There are no custom dropdown menus, replacement forms or new financial inputs.

Runtime files: nomad360_design_system.css, portfolio_v2_ui.js,
portfolio_v2_linked_ui.js, portfolio_v2_basket_ui.js,
portfolio_v2_mba_observed_ui.js. Stage-1 colors and contrast remain protected.
Stage 3 button color hierarchy, stage 4 resource semantics and stage 5 result
order are not part of stage 2.

## Acceptance checks

144 Chromium cases per before/after phase: both routes, RU/EN/KK, six widths
320/360/390/430/768/1280. Standalone includes ready/unready, cash/credit and
own/resale/dropship forms. Linked includes five V1 source types, all basket modes,
shared resources, certification, warehouses and loaded/missing SKU mappings
in observed history. All details are opened to test conditional form content.
Long unbroken product and resource names stress wrapping and delete headings.

The comparison freezes financial results, saved state, field types/values/colors
and field inventory against accepted stage 1. It checks engine/V1/header/footer/
locale/navigation/currency sources byte for byte. Original UI code and copy must
match after stripping class attributes and the isolated presentation helper.

Geometry checks inspect actual rendered text rectangles, label position above
its control, control/text intersections, card boundaries, single-column phone
form grids, checkbox sizes, remove/title collisions and selected-value visibility.
Financial tables may scroll locally. Document overflow fails. Composited text
contrast stays at least 4.5:1. Original geometry defects must be observable in
the baseline, not just inferred from new class names.

Save/resume is checked in every case. Representative number/select/checkbox
interactions and conditional funding fields are exercised. Both routes also run
layout and contrast checks without optional utility CSS.

Screenshots show ready forms at 320/390/1280 and other conditions at 390, for
RU/EN/KK. Other widths have numeric geometry/contrast receipts. Standalone and
linked images are uploaded separately so each ZIP stays practical to download.

Publication: stage 2 remains draft pending its own review; main is unchanged.
