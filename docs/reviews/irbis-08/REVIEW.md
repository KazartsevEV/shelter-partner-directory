# IRBIS-08 — scenic banner is the final site footer

## User requirement
The existing «Возвращайтесь к нам» snow-leopard block must become the final visual block of the calculator page. In this order: existing localized Windows/iOS/Android shortcuts; «Поддержать проект» disclosure; «На что идёт поддержка» disclosure; «Лицензия» disclosure; «Данные и конфиденциальность» disclosure; **Официальный контакт** as plain `mailto:nomad260393@gmail.com`, without a disclosure.

## Implementation invariants
- The original `<footer id="nomad360-footer">` remains the semantic footer. Inside its `.nomad-footer-inner`, the IRBIS scene is the **last direct child**. The existing B2B/embed unit and small footer-bottom text remain intact, before the scenic section.
- Original `#nomad360-license`, `#nomad360-data`, `#nomad360-official` are moved, **not cloned/reimplemented**. Language-specific legal URL, localized titles and descriptions, official mailto, DOM IDs, keyboard semantics, existing menu anchor targets and copy handlers survive. No financial or payment changes.
- Existing `#nomad360-support` and `#nomad360-product-details` remain genuine `<details>` and keep their currently localized content and nested payment methods.
- All disclosure summaries (main four and nested payment methods) have explicit left inset, flex vertical centering, `1px solid #38678B` separators, orange existing markers and Inter. Nested payment chevrons have explicit `#FF913F` contrast against the blue background. Main rows align horizontally when opened or closed. The final contact is a visible ordinary mail hyperlink with a blue rule.
- Preserved original snow-leopard WebP blobs; no rasterized text, new assets, invented copy, external providers or styling outside `#nomad360-irbis-banner`. Existing style palette `#173B58` / `#FFFFFF` / `#FF913F` / `#38678B`.
- Re-run the DOM assembler following native RU/EN/KK / currency re-render. Save disclosure open state through original event listeners.

## Regression acceptance
The existing `scripts/irbis/preview.cjs` exercises 21 browser cases (RU, EN, KK × 320, 360, 390, 430, 768, 1280, 1440), with explicit additional checks for: final footer order, exact presence/order of all four main disclosures, open/closed behavior, preservation of the real legal href, original contact mailto, lack of a contact disclosure, #38678B borders, flex-centered summaries, left text inset and state retention through language switches. Original screenshots, art blob verification, responsive dimensions, NOWPayments/Kaspi/Ozon/SWIFT, and platform actions remain required.

## Screenshot QA and release gate
- Chromium screenshot audit found that the native SWIFT/IBAN `<details class="nomad-pay nomad-pay-bank">` inherited TASK-10's white legacy card styling in the otherwise navy footer. It is now navy `#173B58`, with readable white header/bank text. Its existing disclosure and copied bank fields remain native and functional.
- All four primary disclosure chevrons and nested payment chevrons use approved orange `#FF913F`, overriding the TASK-10 global `::after` border reset in the same important cascade layer. Browser assertions check main/nested arrow colors, bank background/text and the bank's open state.
- The head-commit CI, Codex review and screenshots must be checked on the live PR before accepting it; prior GREEN runs are not a substitute for the latest head.
- Do not merge automatically. Owner approval of the actual desktop/mobile visual is required. PR #203 remains stacked on IRBIS-07 PR #202; merge the reviewed dependency first, then retarget #203 to `main` and rerun CI.
