# UNIFIED-BANNERS-02 scenery

Decorative layers only; every text, control, number and payment element is live DOM. All four pictures are **original pixels of the owner-approved references** in `docs/approved-design/unified-banners/` — no AI re-drawing, no recolouring. Where a reference carries baked-in text, only the text-free region is cropped (no resampling beyond the WebP re-encode); the same picture serves desktop and mobile.

| Asset | Source | Region |
| --- | --- | --- |
| `about.webp` | `about-moon-scenery.webp` | byte-identical copy, whole scene (563×475) |
| `hero.webp` | `hero-desktop-reference.webp` | x 760–1536, y 0–525: sun, mountains, river (776×525) |
| `support.webp` | `support-desktop-reference.jpg` | x 870–1536, y 0–614: whole irbis, waterfall, tail (666×614) |
| `consulting.webp` | `consulting-desktop-reference.webp` | x 810–1672, y 0–480: both rams, horns, Alatau (862×480) |

Colour: pictures are not edited. CSS blends them into the site blue with `rgba(var(--nb-rgb),α)` veils (`--nb-rgb: 23,59,88` = `#173B58`, the page background) and edge masks, so no hard seam is visible. All pictures are local and cached; the portable-HTML builder inlines each as a data URL.
