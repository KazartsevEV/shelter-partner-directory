# C5-2 — one About scene source

Base: accepted #252 merge `6b3bdbebea65ea8e26a8dfd983842d5eb96bb735`.
Only two unconditional earlier `background-image` declarations are removed.
The final scoped `::before` SVG remains canonical. Historic assets, geometry,
masks, palette, DOM, content and financial sources stay unchanged.

The delivery packer embeds every CSS URL, including overridden images. Raw CSS
shrinks by 170 bytes; the actual standalone shrinks by 249116 bytes. The extra
248946 bytes come from two redundant base64 expansions. Browser requests for
these two images were already absent; this is not a site speedup claim.

Use a clean tracked checkout, locked dependencies and compiled utilities as in
`.github/workflows/cleanup-scene.yml`. Point `C52_BASELINE_ROOT` to a clean
accepted worktree at the revision above, then run:

```sh
node --test tests/cleanup_scene.test.cjs
node scripts/cleanup-scene/ownership.cjs artifacts/cleanup-c52/ownership.json
node scripts/cleanup-scene/compare.cjs artifacts/cleanup-c52
```

The comparator uses real before/after standalone builds. It asserts obsolete
resources exist before and disappear after; every other non-About resource
must have identical metadata. Historical comparators filter only the exact two
known image hashes/sizes and account for expanded HTML exactly once. They do
not change source or numerical baselines. The older C5-1 ownership report is
explicitly normalized to its historical contract; the new analyzer uses raw
current sources (217 → 216 conflict groups).

Main RU/EN/KK: 320/360/390/430/699/700/701/768/999/1000/1001/1280/1440/1920/2560.
Actual standalone: 320/700/701/1000/1001/1280/2560. Full computed styles and
geometry: 66 pairs × default/hover/focus, 18 exact PNG pairs, 21 live resize
pairs. Failed final-image requests add six language/width pairs and must not
reactivate earlier images or change full width. The negative inset control
still detects wrong geometry. Nine alternating startup samples per variant
at 390/1280 record readiness, listeners and heap without a speed guarantee.

The unchanged original AST analyzer records one reviewed source conflict and
all 216 remaining groups as unreviewed. Further C5 components/C6 await separate
acceptance. No live partner form, mail, credentials or private data is used.
