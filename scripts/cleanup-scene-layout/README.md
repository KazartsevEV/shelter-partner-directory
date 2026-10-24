# C5-3 — About decoration geometry and masks

Base: accepted #253 merge `25572021ae685ed8fc85da689f528957b0c6986f`.
The scoped `::before`/`::after` own the scenic decoration. Nineteen historical
rules become ten canonical base/responsive rules. All other selectors and their
declarations/context stay exact. Root geometry, text, DOM and financial code
are separate owners and stay unchanged. The approved SVG is not regenerated.

The removal receipt freezes 17 exact source ranges and hashes. The canonical
fixture keeps the old winning geometry, scales, masks, composites and overlay
colours. Unknown changes still fail source/package guards. The original AST
analyzer reports 216 → 190 groups; decoration 26 → 0. The remaining 190 are
unreviewed, not dead code. Future C5 components/C6 await separate acceptance.

Keep the original min-width/max-width semantics. A non-mobile branch beginning
at 701px intentionally also covers 1000.5px; the tablet-specific image size
ends at 1000px and desktop starts at 1001px. Tests exercise 700.5/1000.5px using
fractional iframe CSS boxes and record the actual rounded media viewport.
Chromium rounds these media widths; this is not claimed as execution of a
fractional media gap. A separate AST cascade test compares effective declaration
values at 700/700.5/701/1000/1000.5/1001px for both pseudo-elements.

With locked tools and a clean tracked checkout, follow
`.github/workflows/cleanup-scene-layout.yml`. Set `C53_BASELINE_ROOT` to a clean
accepted worktree at the revision above, compile pinned utilities, then run:

```sh
node --test tests/cleanup_scene_layout.test.cjs
node scripts/cleanup-scene-layout/ownership.cjs artifacts/cleanup-c53/ownership.json
node scripts/cleanup-scene-layout/compare.cjs artifacts/cleanup-c53
```

Main RU/EN/KK: 320/360/390/430/699/700/701/768/999/1000/1001/1280/1440/1920/2560.
Actual standalone: 320/700/701/1000/1001/1280/2560. Compare every computed
property and geometry of all About nodes/rendered pseudos: 66 pairs,
198 default/hover/focus comparisons, 18 exact PNG pairs, 21 live resize pairs,
6 fractional iframe pairs and 6 final-image-unavailable pairs. A wrong scenic
width must be detected even while root full width still passes.

Raw CSS and actual standalone shrink by exactly 3168 bytes. The URL still
occurs once; no image resource is added/removed. Every non-About packaged
resource keeps its bytes/SHA. Old C5-2 size/ownership tools have only explicit
inherited bridges, and its historical ownership report is marked normalized.
The new ownership tool analyzes raw current sources. Numerical oracles and
existing workflows are unchanged. A separate CI job reruns accepted C4's full
business/restoration/repeated-navigation/real-Excel/OOXML/PDF contracts.

Nine alternating startup samples per width record readiness/listeners/heap.
These are laboratory samples, not production CWV or proof against memory leaks.
