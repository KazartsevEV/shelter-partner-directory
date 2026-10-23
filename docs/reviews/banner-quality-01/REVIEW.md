# About vector quality and Consulting scenic coverage

Base: accepted main `97b3a21deb6159622f464074f0586af815270a76`. This is a separate visual correction; the unfinished C2 cleanup remains in `cleanup/mobile-logo-mask-c2`.

## Changes

- Rebuilt the About scenery from the unchanged approved Bozzhyra source as detailed native cubic contours. The moon has a circular vector rim and radial light gradient; continuous native gradients replace the broad colour bands in the left sky. No raster image, external image reference, blur filter or baked-in text is present in the SVG.
- Use the native SVG on phones, tablets and desktop. Tablet canvas geometry remains unchanged and the complete central panorama fits without stretching. The Kazakh subtitle follows the panorama at 430 px instead of intruding on it.
- The Consulting background now scales its **original central scene** to fill the viewport, rather than treating dark decorative side extensions as part of the useful image width. Proportions, approved artwork bytes, live text, cards and controls remain unchanged. At very wide aspect ratios the lower scenery is cropped vertically, as with a cover image.
- No financial module, draft format, translation string, logo, site palette or error widget changes.

## Receipts

- 38 selected checks passed: native SVG guards, V1 and V2 financial tests, parity, shopper budget and browser palette/font/state oracles. See [validation.log](validation.log).
- About: 24 Chromium scenarios, RU/EN/KK × 320/360/390/430/768/1280/1440/1920 px; separate rendered-pixel edge checks at 1024/1180/2560 px. See [about-protocol.json](about-protocol.json) and [about-painted-bounds.json](about-painted-bounds.json).
- Consulting: 13 Chromium scenarios including mobile widths and desktop up to 3840 px, 15 screenshots, existing comparison/download checks. See [consulting-protocol.json](consulting-protocol.json).
- The new central-image coverage assertion rejects the old CSS on 3840 px: original scene width 1439.23 px for a 3840 px viewport. See [baseline failure](consulting-baseline-red.log). It passes after the correction.
- Palette generator remains byte-identical (282757 bytes); SEO Phase A passed. JavaScript syntax and Python compilation passed.
- Rebuilding with pinned VTracer 0.6.11 and SVGO 4.0.0 reproduced the SVG SHA-256 `922ad22553ff0063b3b57d6aa6ef6cd9983974545a558ffa20b2076ab2f281eb`.

## Visual review

- [About desktop](about-desktop.png) · [About mobile](about-mobile.png) · [Kazakh 430 px](about-kk-430.png)
- [Consulting desktop](consulting-desktop.png) · [Consulting ultrawide](consulting-ultrawide.png)

The implementation remains a vector interpretation of a photographic reference. Automated contour, geometry or image-distance checks do not replace the owner's visual acceptance.

## Resource tradeoff

The optimized SVG grows from 2392538 to 4543613 bytes; gzip comparison grows from 752910 to 1720744 bytes. This is the cost of finer native contour detail. The 10–17 MB unoptimized experimental outputs are not shipped. No new runtime dependency is loaded. See [vector-metrics.json](vector-metrics.json). Lower pixel RMSE against the source (0.04824 → 0.03322) indicates closer source reproduction, not automatic design acceptance.

CI results are recorded on the PR. Merge and publication require separate acceptance; no claim of production deployment is made here.
