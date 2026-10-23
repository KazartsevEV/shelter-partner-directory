# Frozen Nomad360 runtime audit

Development tooling only; never loaded by the website. Accepted application base:
`c4536e9edd60003efb0a9087ec60915d4c070bdd` (after #244). No credentials are needed.
Open draft partner/backend/preview PRs are not treated as deployed application code.

## Reproduce

Use a **clean committed checkout**. The existing package builder refuses tracked
uncommitted changes. Output and dependencies must not be committed as app assets.
Use Node.js 22+ and the existing lockfiles; no additional dependency catalogue.

```sh
npm ci --prefix scripts/localization --ignore-scripts --no-audit --no-fund
npm ci --prefix scripts/palette --ignore-scripts --no-audit --no-fund
scripts/palette/node_modules/.bin/playwright install --with-deps chromium
node --test tests/runtime_audit.test.cjs
mkdir -p artifacts/runtime-audit
printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > artifacts/runtime-audit/input.css
scripts/palette/node_modules/.bin/tailwindcss -i artifacts/runtime-audit/input.css -o artifacts/runtime-audit/utilities.css --content './Marketing_calc.HTML,./portfolio_v2_*ui.js,./nomad360_*.js' --minify
node scripts/audit/runtime-browser.cjs artifacts/runtime-audit
node scripts/audit/runtime-summary.cjs artifacts/runtime-audit artifacts/runtime-audit/summary
```

`AUDIT_QUICK=1` runs a smoke subset; the summary generator deliberately refuses
to certify smoke output as the complete baseline. CI runs the full matrix plus
real Excel downloads and the existing PDF print-projection test. Initial
utilities are the same pinned build used by accepted browser checks.

`runtime-inventory.cjs output.json` independently regenerates the static census.
It reads tracked baseline application files and rejects any changed source.
The summary requires exact equality of all static/runtime source fingerprints.
Archived results must not be overwritten just to make a cleanup pass. A future
cleanup needs an explicit candidate-comparison protocol retaining this original
baseline and the existing numeric oracles.

## What the data means

- Acorn parses JS and inline handlers; parse5 parses the two live HTML entrypoints,
  static Help/SEO/licence and literal/interpolated HTML templates. PostCSS records
  selectors, layers/conditions, declarations, exact duplicates and differing
  values at the same selector/context/property. CSS font/background dependencies
  are included. Constructed IDs/selectors, observers/timers and inline styles
  remain visible rather than being declared unreachable.
- Function/call/global-member maps are **syntactic**, not scope-resolved
  reachability. A `root` alias might be a component rather than the window;
  computed references and dynamic CSS remain review-required. Counts include
  independent source occurrences in both calculator HTML files, not unique
  functions simultaneously loaded on one page.
- Browser measurements use fresh contexts, local HTTP and blocked external
  requests. Existing utility CSS is injected. Code is not monkey-patched:
  listeners/heap come from CDP, including GC before heap samples. Heap means V8
  heap, not total browser/GPU/image memory. Profilers and coverage add overhead.
- Navigation/resource/ready timings are **lab observations**, not production
  Core Web Vitals or a physical-mobile speed claim. These are one load per
  language/width, not three repeated statistical samples per identical case.
  Future timing acceptance requires paired repeated runs on the same environment.
- DOM selector presence does not imply that its media rule applied. Coverage is
  collected across the main matrix; Help/US demo/fresh standalone also receive
  DOM/metric probes. Static/standalone probes do not expand the precise main-page
  coverage set. Pseudo-element/keyframe/unsupported selectors are retained.
- V8 nested zero-count ranges override enclosing executed ranges, so an executed
  outer function does not falsely mark every inner branch as used. Range unions
  avoid double counting bytes. Missing source text is reported explicitly.

The full audit captures 18 main load cases, 358 case rows and 430 heap/listener
samples. Routes include product/resale/dropship, both V2, full/offline/simple
self/hired/agent services, footer, bug/partner dialogs, actual reload/restore and
five repeated navigation cycles. Fresh partner HTML is built through the accepted
packer and visited for ten routes on EN/RU/KK × mobile/desktop. Main coverage and
DOM-presence findings never authorise automatic dead-code deletion.

No production forms are submitted, exchange rates are not fetched, and no Google
credentials are touched. Only existing demo and test inputs enter isolated
contexts. Source-file fingerprints, numeric leaves and manifest connect the data
to the accepted app. PDF tests exercise the print projection; they do not inspect
a physical printer or a platform PDF driver.
