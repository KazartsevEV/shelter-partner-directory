# C6-1 — V1 form business operations

Date: 2026-10-25. Accepted base: `9851eff63a2c50d074ea7e1420f8ecc48812d0fc`
(main after accepted recovery fix #269). This is the first C6 slice, separate
from the accepted C5 CSS cleanup #267. It does not start C7 or partner deployment.

## Boundary

`nomad360_v1_operations.js` is a synchronous, DOM-free module with explicit inputs.
It owns material line sums, purchase VAT, imported landed cost allocation,
the product/service advertising funnel and simple-online-service preflight.
It delegates service validation and payer discovery to the unchanged V1 engine.
The financial V1/V2 engines, payment normalization, conversion, taxes, persistence,
templates, translations, styling and delivery code remain unchanged.

Both HTML entrypoints retain their existing global/inline handlers:
`updateCalculatedMaterialsCost`, `materialsCostWithVat`,
`recalculateMaterialsLandedCost`, `recalculateProductAdFunnel`, `calculate`.
The handlers read normalized fields, invoke operations and render the existing
output. Manual delivery reset, pending FX display, service forecast synchronization,
downstream logistics/aggregate updates and invalid-result clearing remain in UI.
The module installs no handlers, performs no I/O and does not mutate input.

Eight exact hunks per entrypoint are recorded in
`tests/fixtures/v1-operations/extraction.json`. The receipt reverses only those
hunks to the accepted base, with full before/after hashes. Historical source guards
run after this exact reversal; they still reject unrelated edits. Their negative
tests accept the new earlier guard's error label without allowing new edits.
L0 inventory uses the same exact receipt to preserve historical text offsets;
there are no new user-visible strings or translation keys in the new module.

## Validation

- 2592 import/payer/batch combinations execute arithmetic taken directly from the
  accepted HTML and compare against the extracted operation. VAT, fractional
  material rows, empty inputs, overflow, pending NaN and inactive foreign payments
  have separate checks. NaN is preserved where an active quote is not converted.
- Funnel outputs are compared against the accepted function's actual renderer,
  including impression rounding, zero CPC/conversions and fractional forecasts.
- Frozen inputs cover invalid, pending and ready service preflight; validation
  short-circuits payer discovery just as before. No alternate finance formula.
- Source guards prove both entrypoints changed only in the eight receipted hunks;
  V1 engine/payment/tax modules remain byte-identical to the accepted base.
- `scripts/cleanup-v1/compare.cjs` uses real input/change handlers and compares
  exact numeric/UI state, downstream callback order, visible geometry and text
  against accepted main for RU/EN/KK, 320/360/390/430/768/1280, two HTML entrypoints
  and fresh standalone HTML built by the unchanged production delivery module.
  It also takes paired hero screenshots and three paired timing samples per
  selected width/language, measuring listeners and DOM over five repeat visits.
- Development of the comparator exposed viewport-offset differences from the
  form's smooth scroll. Both variants now use identical disabled animation CSS
  and an explicit instant scroll to the same origin before geometry measurement.
  Numeric, text, callback and geometry assertions remain exact.

Local verification is complete: **101/101 unit tests**, the historical source suite
**38/38** (overlaps the unit suite), independent VAT **48/48**. Original first-user
journey and full-service exact-byte restore/PDF pass. The VAT/Sales Tax PDF matrix
passes in RU/EN/KK; the original Excel suite reads **72 files in 36 cases**.

The complete comparator passed **54 pairs / 978 state-and-pixel comparisons**,
including two entrypoints and fresh standalone HTML, and **18 timing pairs**.
Raw data: [protocol.json](protocol.json); [local-checks.json](local-checks.json).
Representative unchanged hero images: [RU mobile](ru-320.png), [EN mobile](en-320.png),
[KK mobile](kk-320.png), [RU desktop](ru-1280.png), [EN desktop](en-1280.png),
[KK desktop](kk-1280.png). The protocol records the matching before/after PNG hash.

Changed-resource delta (HTML + V1 engine + new operations module):
**+3015 bytes raw / +1219 gzip / +1087 Brotli**.
The new module is 3830 bytes raw. The 18 paired local ready-time samples have
medians 1494.8 ms before / 1493.7 ms after;
median paired difference +7.5 ms. This is a local
HTTP lab measurement, not a production CDN speed claim. A normal page gains one
small dependency request; hosting bundling/caching remains a separate delivery step.
All 5 repeated-visit listener/DOM samples match their baseline for every pair;
observed listener counts: [321] before and after.

The first CI run exposed three historical C5 audits whose whole-page/package
freeze predated this runtime extraction. Their compatibility now uses seven exact
source receipts plus the exact module hash, bundled-script content and the seven
handler hunks. Unknown code, extra scripts, duplicate resources and wrong hashes
still fail closed. The browser is served the actual new standalone HTML; only the
historical equality/size assertions project C6 separately from their CSS delta.
Raw reports retain actual bytes/resource counts, with the C6 delta explicit in
the verified summary. No CSS, workflow skip, financial oracle or application code
was changed to satisfy those historical assertions. Package projection and its
negative cases pass in the 24-test C5/C6 compatibility suite. The complete
historical CSS/finance/C6 contract suite also passes **136/136**. Runtime source
hashes are unchanged from the initial `317fc0a` browser protocol.

The actual versioned partner build also passes full byte-for-byte projection
against accepted main: 12,966,450 → 12,969,480 bytes (+3030), 63 → 64 resources.
Only the new module and its receipted handler changes are projected; all remaining
HTML/resource bytes match exactly. [Raw result](package-projection.json).

Completed final-HEAD CI will be linked in the PR. GREEN does not authorize merge.

## Maintenance and limits

The new module accepts normalized numbers; `Nomad360PaymentUI.readNumber` remains
the only form adapter responsible for foreign-payment normalization. Do not pass
raw CNY/EUR fields as business-currency numbers. Do not convert them a second time.
The UI keeps clamping raw material prices/quantities exactly as before. Operations
do not replace pending values with plausible zero/one-to-one costs.

The additional small local script is automatically embedded by
`Nomad360Delivery.buildStandalone` in its existing dependency order (V1 engine,
operations, inline handlers). There is one additional HTTP resource on a normal
page and none in the standalone file. Resource costs and paired timings are
reported, not claimed as a speed improvement without measurement.

This slice does not move the entire form. Product snapshot assembly, production,
payroll/logistics UI helpers and the large service renderer remain explicit future
C6 candidates. Their separation requires its own contract and acceptance; they
are not declared dead code. Keep the current global adapters until inline and
tax-extension callers have separately migrated. Partner customization remains
build-time configuration, never a fork of the financial formulas.
