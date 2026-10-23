# About original-photo quality and accepted Consulting coverage

Base main: `97b3a21deb6159622f464074f0586af815270a76`.

## Owner decision and corrected implementation

The owner accepted the Consulting banner and rejected the traced About banner at `faa7653`. Investigation confirmed that Consulting preserved a photographic raster inside SVG, whereas About used automatic colour-contour tracing. Tracing removed photographic detail and produced visible posterisation. A higher contour count did not solve the visual defect.

The owner explicitly approved using the same photographic approach for About. This revision embeds the original approved 1536×768 WebP **byte for byte**, exactly once inside SVG. Existing SVG use elements extend its sides; the original moon, sky and cliff textures are preserved. SVG/CSS gradients retain the transition into brand navy. There is no tracing, quantisation, recompression, replacement moon or blur applied to the photograph. This is an SVG composition containing a raster, not a pure vector illustration.

The composition remains responsive on phone, tablet and desktop, with live localized HTML copy. Accepted Consulting CSS, artwork and test code remain byte-identical to `faa7653`; its acceptance is preserved. No financial module, saved draft, translation, logo or error-widget changes are introduced.

The previous VTracer/SVGO pipeline and its development dependencies are removed. The deterministic builder `scripts/about/build_vector_scene.py` now uses only Python's standard library.

## Current local verification

- 38 selected checks passed: original-image byte identity, no duplicate image payload, V1/V2 finance, numerical parity, shopper budget, palette/font/state browser oracles. [Log](validation.log).
- 24 About Chromium scenarios: RU/EN/KK × 320/360/390/430/768/1280/1440/1920 px. [Protocol](about-protocol.json).
- Actual painted-edge checks at 1024/1180/2560 px passed. [Pixel bounds](about-painted-bounds.json).
- Palette generator remains byte-identical (282757 bytes); SEO Phase A and syntax checks passed.
- Rebuilding the SVG reproduced identical bytes. Embedded image bytes match the unchanged approved source SHA-256 recorded in [size/provenance metrics](vector-metrics.json).

The previous HEAD had 8/8 successful CI checks. Those results do not certify this revised HEAD; consult the current PR checks for the new run.

## Visual receipts

[Desktop](about-desktop.png) · [Mobile](about-mobile.png) · [Tablet](about-tablet.png) · [Kazakh 430 px](about-kk-430.png)

Accepted and unchanged: [Consulting desktop](consulting-desktop.png) · [Consulting ultrawide](consulting-ultrawide.png). Its existing 13-case protocol and old-CSS regression failure remain in this review directory for provenance.

## Size

The rejected trace was 4543613 bytes. The photographic SVG is 147278 bytes, with a single original image payload and no new runtime dependency. Detailed metrics are in `vector-metrics.json`.

The owner still needs to inspect the corrected About screenshots. No merge or production publication has been performed for this PR. C2 work remains preserved separately in `cleanup/mobile-logo-mask-c2`.
