# About photographic SVG composition

The owner approved the same approach as the accepted Consulting banner: an original raster photograph inside SVG, with SVG scenery extensions and gradients. This is deliberately not a traced vector illustration.

Run `python scripts/about/build_vector_scene.py` (Python standard library only). The source `assets/nomad360-banners/about-bozzhyra-desktop-extended-20261019.webp` is embedded once, byte for byte, and reused with SVG `use` elements. No resampling, colour quantisation, image recompression, blur or replacement moon is applied. Existing edge clips prevent a second moon. Copy remains live localized HTML; CSS provides responsive geometry and the brand-navy transition.

Checks:

- `node --test tests/banner_vector_quality.test.cjs` verifies byte identity, single image embedding, scene bounds and a 160 KB size budget.
- Compile the site utilities to `artifacts/about-01/utilities.css`, then run `node scripts/about/preview.cjs` with Playwright 1.58.0 and Chromium.
- Accepted Consulting code, artwork and layout remain unchanged by this correction.
