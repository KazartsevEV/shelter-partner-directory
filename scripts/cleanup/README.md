# C1: paired verification of the service-input grid cleanup

Use a clean committed checkout and the existing pinned palette/localization
packages. Create a clean baseline worktree at `c4536e9` and set
`C1_BASELINE_ROOT` to its absolute path. The paired browser tool builds both
standalone packages with the accepted packer and never submits forms or calls
external APIs. It rejects a dirty package source checkout.

Compile the same utility CSS as the accepted tests into
`artifacts/cleanup-c1/utilities.css`, then run:

```sh
node --test tests/cleanup_service_grid.test.cjs
node scripts/palette/build.cjs --check
node scripts/cleanup/compare-service-grid.cjs artifacts/cleanup-c1
node scripts/cleanup/verify-report.cjs artifacts/cleanup-c1/protocol.json
```

The workflow contains the full reproducible commands and unchanged Excel/print
checks. Comparison covers both live entrypoints on RU/EN/KK at 320, 360, 390,
430, 559, 560, 561, 768, 1280 px plus fresh standalone mobile/desktop. All eight
routes have visible-node geometry and selected computed styles compared;
the affected grid additionally has every computed CSS property compared.
Six screenshot pairs of the input panel must be byte-identical.

Three paired timing repetitions per case (RU at 390/1280 px) alternate ordering.
They are local lab observations with blocked remote resources and pinned utility
CSS, not production speed or Core Web Vitals. V8 heap is not total browser
memory. Listener counts must match; noisy timing/heap changes are reported and
reviewed rather than hidden behind a fabricated tolerance.

`tests/helpers/cleanup-service-grid-scope.cjs` permits only the exact early
three-line deletion from the frozen CSS, preserving the later rule and both
mobile overrides. Historical guards restore those exact bytes and retain all
other checks. Original financial fixtures and the palette output stay unchanged.
