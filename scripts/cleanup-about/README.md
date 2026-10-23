# C3 — two early About duplicates

Use Node 22+, the lock-pinned `scripts/palette` and `scripts/localization`
packages, and Playwright Chromium. Create a clean baseline worktree at
`c45187fa5190ee6ce4bc88a6266337439867a8f6` and set `C3_BASELINE_ROOT` to it.
Compile utilities as in `.github/workflows/cleanup-about.yml`, then run from a
clean committed checkout:

```sh
node --test tests/cleanup_about.test.cjs
node scripts/cleanup-about/compare.cjs artifacts/cleanup-c3
```

The only runtime difference is 360 bytes removed from the About stylesheet:
the early `max-width:700px` padding rule and early `min-width:1001px` scenic
background-size/position/repeat rule. Later copies, media/layer wrappers and
every other byte are preserved. No image conversion, new colours or layout.

The comparator uses real V1 and US-demo pages, plus actual offline packages
built by the accepted packer. It covers RU/EN/KK at 320, 360, 390, 430, 699,
700, 701, 768, 999, 1000, 1001, 1280, 1440, 1920 and 2560 px; standalone
covers 320/700/701/1000/1001/1280/2560. There are 111 pairs and 333 comparisons
(default, service hover, contact focus). The 45 US-demo pairs preserve its real
legacy information block: it has no About stylesheet, photograph or card links.
The other 66 pairs verify the scenic banner. All About nodes and both pseudo
elements have their complete computed styles and geometry compared; absent
pseudo elements are checked by their `content` value instead. Only
before/after local URL prefixes are canonicalized; no colour/geometry masking.
All 18 screenshot pairs must match byte for byte. A separate injected 1px
padding change must be detected. No forms or external services are contacted.

Nine alternating paired readiness measurements per width (390/1280) also
record listeners and post-GC heap. These are local samples, not production CWV
or a promised speedup. Every non-About packaged resource must match exactly.

The historical C2 runtime guard and paired packager recognize only the exact
original/C3 About bytes, SHA and byte count through `cleanup-about-scope.cjs`.
Its old standalone comparison now includes this explicit inherited 360-byte
delta as well as C2's own 44 bytes. All other resources remain protected.
No old numeric fixture or workflow is changed. C4 starts only after C3 review.
