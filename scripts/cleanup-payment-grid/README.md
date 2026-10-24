# C5-6 — one owner for the base fiat support grid

Base #256: `5e2b37431948f7d866ba18809d45bda4ddc74d05`.
Three exact edits in `nomad360_calculator_ui.css` keep one base (two columns,
20px margin, 12px gap) and one <=900px override (one column). The old shared
mobile selector keeps every other grid. This is fallback/classic layout:
the main page's existing, more specific IRBIS layer keeps one column, 16px
margin, zero gap and native disclosures. Providers, account data, links,
copy actions, locale rules, fonts, artwork, palette and mathematics stay exact.

Raw CSS and real standalone shrink by 95 bytes; every other packaged resource
has identical size/SHA. Palette regeneration --check remains 281853 bytes.
The frozen edit receipt and negative tests protect fonts, logo tail, colors,
900px interval (including 900.5px), all unrelated selectors and shared siblings.

Use locked tools/pinned utilities and clean tracked before/after checkouts as
in `.github/workflows/payment-grid.yml`. Set `C56_BASELINE_ROOT` to the base:

```sh
node --test tests/payment_grid.test.cjs
node scripts/cleanup-payment-grid/ownership.cjs artifacts/payment-grid/ownership.json
node scripts/cleanup-payment-grid/compare.cjs artifacts/payment-grid
```

Main: 320/360/390/430/768/899/900/901/1280/1920. US demo:
320/360/390/430/768/899/900/901/1280. Real standalone:
320/390/768/899/900/901/1280. RU/EN/KK: 78 pairs × four states (closed bank,
open bank, revealed copy hover, keyboard focus), 24 exact PNG pairs plus one separate classic desktop receipt, 18 resize
and 12 warm-locale pairs. Main is IRBIS; US/standalone are classic. Native
support/Kaspi/bank disclosures are opened via their real controls, payment
links and copy actions are not activated. All foreign requests are blocked.
A negative control reinstates obsolete 3-column/28px settings and must fail.
Nine alternating startup samples per width record readiness/listeners/heap.

Historical comparators normalize only known UI CSS resource fingerprints and
count 95 bytes once. Historical C5-5 HTML equality reverses only the three
exact packaged CSS segments; unrelated HTML changes remain visible. Its
normalized census is explicitly historical. The new analyzer uses raw current
sources: 185 → 183, grid 2 → 0, 19 retained page groups, 164 unreviewed.
Localization inventory restores this exact geometry-only delta before scanning,
retaining text IDs/offsets without hiding new copy or regenerating dictionaries.
Existing workflows and numeric oracles stay exact. Full C5/C6 await acceptance.
