# C5 final cascade batch

The runtime does not import anything in this directory.

- `../palette/cascade.cjs`: pure PostCSS analysis and range-based deletion. Source mode preserves fallback declarations, URLs and layer creation order. `generated: true` is reserved for the controlled output of `../palette/build.cjs`.
- `../palette/inline-paints.json`: ordered legacy input aliases, before RGB augmentation. These are generator inputs, not additional approved output colors. Removing a dead source color must not remove support for a historic inline style.
- `model.cjs`: pinned source contract; `node .../model.cjs --check` rejects any unrecognized actual candidate.
- `ownership.cjs`: reads actual current audited sources, never historical projections. Every retained group needs a reason and, for a shared default, an actual sibling-owner witness.
- `compare.cjs`: paired real calculator/standalone routes and native banner disclosures. Uses a clean baseline worktree at accepted main.
- `static.cjs`: independent EN SEO, RU/EN/KK help and license pages. Baseline help overflow is recorded and compared; no new overflow or layout difference is accepted.
- `verify.cjs`: independently checks the complete route/width/language matrix, downloaded/bundled resources, size differences, PNG hashes and listener samples.

Historical compatibility lives only in `tests/helpers/paint-scope.cjs`. Its immutable Git inputs and exact patches are in `tests/fixtures/cleanup-paint/`. The packer must keep reporting actual source hashes and sizes. Never apply normalized records to real artifacts, infer an approved fingerprint from the working tree, replace actual-file SEO hashing with normalized hashing, or add permissive wildcard CSS exceptions.

For a future source change, compare full selector/context/property/priority winners and all asset URLs; inspect grouped selectors, fallback pairs and layer ordering. Regenerate the palette and verify aliases before running paired browsers. Unknown ranges/fingerprints must remain errors. A raw override count need not be zero: reviewed shared defaults, independent resources and feature fallbacks remain intentional.

See `.github/workflows/cleanup-paint.yml` for locked dependencies, commands and artifact paths. Run `buildPackage` only from a clean tracked checkout. Tests send no forms, mail, financial data or payment actions.
