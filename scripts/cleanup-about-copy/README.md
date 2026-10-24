# C5-4 — About introduction layout

Base: accepted #254 merge `8c2f51dbfe3d497d5b6ad9dfdf5b787ea5813530`.
The existing opening/scene-copy selectors own the introduction rhythm. Twenty
seven historical rules become eighteen definitions. Copy, fonts, decoration,
SVG, palette, root geometry, DOM, financial code and draft formats stay exact.

Twenty-one source ranges/SHA and a canonical fixture freeze the boundary.
The independent test oracle evaluates selector specificity, source order,
margin expansion and media intervals for 300 combinations of widths, locales
(including absent/empty/unknown lang), legacy wrappers and opening pseudo state.
Negative controls must detect changed offsets, lost priority and wrong ranges.
The suppressed opening pseudo retains its background/mask declarations and
`content:none`: no rendering or computed-property contract is removed.

Set `C54_BASELINE_ROOT` to a clean accepted worktree at the revision above;
use locked tools, pinned utilities and a clean tracked checkout as in
`.github/workflows/cleanup-about-copy.yml`, then:

```sh
node --test tests/cleanup_about_copy.test.cjs
node scripts/cleanup-about-copy/ownership.cjs artifacts/cleanup-c54/ownership.json
node scripts/cleanup-about-copy/compare.cjs artifacts/cleanup-c54
```

The raw analyzer reports 190 → 185 groups; introduction 5 → 0. Remaining groups
are unreviewed, not dead code. Main/offline compare 66 pairs × three states,
18 exact PNG pairs, 21 resizes, six image-unavailable and six fractional iframe
pairs. Chromium rounds media viewport sizes; a separate static cascade oracle
checks exact fractional intervals. Warm RU → EN → KK → RU adds 12 paired states
at 320/701/1280px on the same pages. A wrong introduction margin must be detected
while the full-width root remains correct. Every non-About packaged resource
keeps its size/SHA; raw CSS and real HTML shrink by exactly 1346 bytes.

Old C5-3 comparison/ownership tools have only exact inherited bridges; its old
190 result is explicitly marked normalized. New ownership analyzes raw source.
Existing workflows/numeric oracles stay exact. The unchanged C5-3 workflow is
triggered by About CSS and reruns full business/restoration/repeated navigation,
72 actual Excel/OOXML checks and six PDF projections. Startup uses nine
alternating samples per width; timings/heap are laboratory observations.
