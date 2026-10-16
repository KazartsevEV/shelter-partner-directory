# UNIFIED-BANNERS-01 scenery — revision 2

Decorative assets only. All copy, controls, numbers, disclosures and payment UI remain live DOM. The original approved references are unchanged in `docs/approved-design/unified-banners/`.

| Asset | Source and treatment |
| --- | --- |
| `hero.webp` | Text/logo/panel-free reconstruction of `hero-desktop-reference.webp`; blue mountains, orange sun and winding river. Unchanged in revision 2. |
| `about.webp` | Revision 2 reconstruction of `about-desktop-reference.webp`: all raster UI removed; cold white moon, Mangyshlak cliffs and uninterrupted negative space on the left. Replaces the narrow isolated photo crop. |
| `support.webp` | Reconstruction of `support-desktop-reference.jpg`; same irbis with a long fully visible tail, snow and waterfall. Unchanged in revision 2. |
| `support-mobile.webp` | Revision 2 reconstruction of `support-mobile-proposal.webp`; original portrait composition with all text/buttons removed, entire leopard and fluffy tail retained. |
| `consulting.webp` | Reconstruction of `consulting-desktop-reference.webp`; two Alatau rams touching horns. Unchanged in revision 2. |
| `consulting-mobile.webp` | Revision 2 reconstruction of `consulting-mobile-reference.webp`; original portrait arrangement, all text/cards/controls removed. |

Reconstructions use the image editing tool with the owner's source artwork as the reference. WebP encoding (quality 84–88) only optimizes delivery; no source artwork was overwritten. CSS masks blend the decorative layers into the single approved `--nd-ink: #16375a`, while real controls use the existing white/orange palette. No arbitrary alternative blue surface or nested blue card is introduced.

All six images are local and cached across languages. The original wolf PNG is reused by URL; there is no second logo download. The existing portable HTML builder includes every referenced image as a data URL. No new external image service is called by the website.
