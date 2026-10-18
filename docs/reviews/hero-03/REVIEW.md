# HERO-03 / First-banner acceptance snapshot

Base `main`: `cd80f877f20dde9d276683c83b99c6a9455dea5d`. Branch: `feature/hero-only-blue-extension-20261018`.

Owner-approved composition: `docs/approved-design/unified-banners/hero-desktop-reference.webp` and mobile equivalent. The scenic pixels come **unchanged** from `feature/unified-banners-02:assets/nomad360-banners/hero.webp` (Git blob `2bc551a71e2071acfd2d25be3ea3114cfc07381b`). That source is clipped on the **left**, therefore it is rendered only on the right side of an extended #173B58 canvas with a left-edge CSS fade. No inpainting, recoloring, stretching, synthetic logo, or background replacement.

The component moves the existing translated `nomad360-hero`, `nomad360-intro` and brand image into a single visible hero. Active logo file and its palette recoloring remain owned by `nomad360_header.js`. Text is live DOM with existing RU/EN/KK localization. One working CTA, original `#nomad360-selling-choice` anchor.

**Owner override of older SEO-07 / UNIFIED-BANNERS-02 T-7:** remove the second visually duplicative `business.ideaSeoTitle` / `business.ideaSeoCopy` SEO offer from the calculator HTML, not merely hide it for search engines. Site metadata, canonical URL, existing actual translated hero content and semantic headings remain. Legacy tests asserting this second block may fail and must be treated as stale; do not falsify their results.

Scope: one HTML markup hunk + two asset imports, one new hero JS, one new hero CSS, unchanged copied scenic art. Financial engines, bug widget, payment and footer files untouched. **Browser/screenshots and CI pending. Do not merge until visual acceptance.**
