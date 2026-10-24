# C4 — generated palette duplicate cleanup

Baseline: accepted #250 merge `27e38c752d89938fdfd1d1da4579164a8b43963c`.
`scripts/palette/deduplicate.cjs` removes only earlier identical declaration
rules within the same actual parent and named palette layer. It retains later
restorations, every wrapper, the initial layer-order statement and declaration
order/importance. It does not merge selectors or separate conditional blocks.

The independent guard freezes seven pairs/offsets from accepted main. Expected
output removes exactly those 904 bytes; it is not derived by the new deduper.
`node scripts/palette/build.cjs --check` verifies reproducibility. Static fonts,
all other runtime, financial fixtures and existing workflows remain exact.

Use the lock-pinned tools in `scripts/palette`/`scripts/localization`, Chromium,
and a clean committed checkout. Set `C4_BASELINE_ROOT` to a clean worktree at
the baseline above. Compile utilities as in the workflow. Then run:

```sh
node --test tests/cleanup_palette.test.cjs
node scripts/cleanup-palette/compare.cjs artifacts/cleanup-c4
```

The actual calculator covers RU/EN/KK × 320/360/390/430/768/1280 × nine routes:
shopper V1, home, both V2, full service, simple self/hired/agent and offline.
Real standalone files use the same nine routes at 320/1280 in all languages.
There are 24 paired contexts and 216 route comparisons, eight screenshot pairs,
complete computed styles for the seven affected selectors, visible-page style
and geometry comparison, numerical parity and real V2 reload/restoration.
`--quick` is explicitly diagnostic (two contexts), not full acceptance.

An isolated browser cascade fixture detects deletion of the later restoration.
Nine alternating paired readiness samples at 390/1280 record heap/listeners.
Local timings are not production CWV or evidence of a promised speedup.

Older C2/C3 package guards recognize only the exact inherited palette SHA/size
and generator hook. No financial fixture, old workflow or runtime exemption is
broadened. C5 starts only after C4 acceptance.
