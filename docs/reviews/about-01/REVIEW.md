# ABOUT-01 — faithful original moon and Mangyshlak scenery

Status: **DRAFT. Owner visual acceptance required. DO NOT MERGE.**

## Immutable source and references
- Source of truth: `docs/approved-design/unified-banners/about-moon-scenery.webp`.
- Git blob: `7f87f43c7b3da84f87665273e38df7b404b39e07`. SHA is checked at every ABOUT-01 Chromium run with `git hash-object`; file **unchanged**.
- Actual source dimensions decoded in Chromium: **563 × 475**, not 563 × 470.
- Approved design reference: `docs/approved-design/unified-banners/about-desktop-reference.webp`.
- Approved mobile reference: `docs/approved-design/unified-banners/about-mobile-reference.webp`.

**Do not use** Codex's reconstructed `assets/nomad360-banners/about.webp` or Claude's repainted / cropped `about-full.webp` and `about-mobile.webp` in this implementation.

## Actual approach
- Source drawn in its native 563:475 ratio. `background-size:100% 100%` on matching aspect-ratio artwork layer; never `cover`, never stretch, never delete/repaint any natural object.
- On desktop the full scene is aligned to the right of the navy canvas, faded *only* along its left seam and bottom-most 6% to avoid a visible hard edge. No mid-image vertical fade or cropped moon/cliff.
- Mobile uniformly scales the entire source to 73% width rather than cropping its right edge. EN/KK long real headings are kept in a safe column left of the moon.
- Only under the mobile opening text, a subtle NAVY local alpha veil improves legibility. No image modification.
- Existing header-generated RU/EN/KK copy is reused directly, including the three original mottos (mapping `[2,0,1]`), three hash-navigation targets, existing Telegram/WhatsApp/email/Threads values.
- Mobile services stack into rows; desktop uses three full clickable cards. Contacts remain real accessible links. No footer, payment, financial or first-hero changes.

## Evidence
- [Browser receipt (RU/EN/KK × 320/390/768/1280/1440)](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/39117924272), GREEN on ABOUT-03 (source checksum, dimensions, aspect, three links, four contacts, no horizontal overflow, live-language change, JS page errors).
- Latest ABOUT-04 text wrapping requires same browser rerun; do not imply its old screenshot already depicts the latest commit.
- Official approved reference screenshots remain in main under `docs/approved-design/unified-banners/`.
- Full repository CI remains **not fully green** due old scope/SEO/palette contracts, requiring separate classification. Direct marketing regression, navigation and first hero were GREEN on the prior visual baseline.

## Owner acceptance gates
1. Compare original art and final physical composition at desktop 1280/1440 and phones 320/390 across RU/EN/KK.
2. Moon and rock formations must remain complete/recognizable; no cropped photo slab or mid-height dissolve.
3. Open all three service links and all four contacts; verify mobile hover/focus/hash/navigation.
4. Reconcile CI. Preserve protected financial formulas and historical frozen numeric baselines.
5. Merge this single About PR only after explicit owner approval; no other banner PR merged.
