# About landscape vector build

The approved source is `assets/nomad360-banners/about-bozzhyra-desktop-extended-20261019.webp`. Do not replace or resample it in place.

Development requirements: Python 3.12, `vtracer==0.6.11`, ImageMagick 7 (`magick`), Node 22. Install the pinned optimisation tool with `npm ci --prefix scripts/about`, then run `python scripts/about/build_vector_scene.py`. No dependency is added to the website runtime.

The generator traces cubic curves with full colour precision, reconstructs the circular moon rim and continuous left sky using native SVG gradients, and reuses the central scene for horizontal extensions without adding another moon. SVGO 4.0.0 compacts the paths to two decimal places. There is no embedded raster, external image reference or blur filter. All copy remains real localized HTML.

This is a detailed vector interpretation of the photographic reference. Automated geometry or contour counts do not replace visual acceptance. More detail increases the asset from about 2.39 MB to 4.54 MB before HTTP compression; do not ship the unoptimised 10–17 MB trial outputs.

Checks:

- `node --test tests/banner_vector_quality.test.cjs`
- Compile the site's Tailwind utilities into `artifacts/about-01/utilities.css`, then run `node scripts/about/preview.cjs` with Playwright 1.58.0 and Chromium installed.
- `scripts/consulting/preview.cjs` checks the separate ram banner. Its approved SVG artwork remains unchanged; the central original scene now fills the viewport through uniform CSS scaling.
