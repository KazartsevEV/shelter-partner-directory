# ABOUT-05 — Nomad360 «О проекте»: original-wide landscape implementation

**Status:** DRAFT — pending visual acceptance, do not merge to main/Live.

## Approved and actual assets

- **Approved desktop composition:** `docs/approved-design/unified-banners/about-desktop-reference.webp`.
- **Approved mobile composition:** `docs/approved-design/unified-banners/about-mobile-reference.webp`.
- **Selected full-width artistic underlay (no raster text):** `assets/nomad360-banners/about-bozzhyra-approved.webp`, native **1672 × 941**, Git blob `303328b9be8afb985f0e057e6f57000676bea493`. This is the owner-selected cold nighttime Bozzhyra panorama, with full moon and local white chalk pinnacles.
- The older `docs/approved-design/unified-banners/about-moon-scenery.webp` (563 × 475) is **NOT** the site background: it only includes the cropped right-hand scenery and caused the earlier ABOUT-01/04 visual rejection. Do not restore that as the active image.
- No AI-generated text, invented contact data or pixel-edit to the selected underlay was included during code integration.

## Actual implementation

- Desktop: one **full-width** layer across the entire About banner, original 1672:941 aspect ratio, with left text overlay, gentle navy left gradient, and a bottom transition into `#173B58` behind services/contacts. No right-only isolated image.
- Mobile: use the SAME full-width scene; **crop only the left side**, preserve the full moon and right-side cliffs; image is full-bleed across the About frame with a left-hand navy readability veil. No separate picture strip.
- Real translated DOM for RU/EN/KK is provided by existing Nomad360 header module, arranged by `nomad360_about_banner.js`. Three service links use the site's existing internal hash targets. Four existing contact links remain live.
- Scope limited to About CSS/JS/HTML wiring, workflow, screenshot test and asset. Do not change first hero, formulas, licenses, SEO copy, or any other banners.

## Acceptance

1. Open real Chromium screenshots for RU/EN/KK at 320/390/768/1280/1440 on the latest PR HEAD, **not** the discarded screenshot rounds.
2. Compare directly with the approved Codex desktop and mobile references. Pay particular attention to landscape filling entire width, relative height of cliff/moon, no edge seam, and smooth navy transition over three services and contacts.
3. Verify live locale switching, official contacts and service navigation; no horizontal scroll.
4. Verify SHA of the new underlay has not changed.
5. Confirm scoped regression checks and identify unrelated historical CI failures; do not merge merely because the mechanical image-integrity check passed.
6. Merge **only after the owner accepts** the desktop and mobile browser screenshots.

## CI

Last automated visual check for head `1fcafa0caf03656c054d16c03e97016eb91a3709` was queued when this note was updated. No visual acceptance is claimed.
