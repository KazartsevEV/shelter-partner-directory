# C5-7: batch of dead layout declarations

Accepted base: #257, `6a0504139af2f28f5281d49a81559f90a968dd22`.
The owner authorized larger C5 batches. This batch covers the design system
and main hero stylesheet, without changing their computed design.

`model.cjs` proves that every removed declaration has a later declaration with
exactly the same selector, at-rule ancestry, property and important flag in the
same file. Every selector in a shared rule must have its own later winner.
Paint, font families, image sources, vendor fallbacks and duplicate-property
fallbacks inside a rule are retained. Empty rules/containers are removed only
when all their children are proven removals; comments remain.

`--check` reconstructs both candidates from the immutable Git base and frozen
range/SHA receipts. `--apply` refuses unknown source bytes. The default command
checks its proof against the receipt; only explicit `--write-receipt` regenerates
it from the pinned base. It never learns a baseline from the working tree.
Final selector/context/property/priority values must be identical. Supported
winner syntax is also checked in Chromium before acceptance.

133 declarations / 3589 bytes; raw groups 183 → 100, 19 retained page ownership
groups, 81 still unreviewed. Palette regeneration must remain byte-identical.

The browser matrix uses main/demo/real standalone, RU/EN/KK and 18 widths across
560/600/700/760/1021 breakpoints, eight financial/UI routes, hero/form PNGs,
focus/hover, whole visible geometry/text and complete computed/pseudo properties
for affected nodes. Source/runtime snapshots and financial oracles stay frozen.
External requests and submissions are blocked. Test source only; no real payments.

Historical checks normalize only exact approved source/resource fingerprints;
full standalone restoration replaces only the two identified bundled styles,
then compares the whole HTML. Current raw census is never normalized.
C1 replay builds a clean local-only fixture from current resources with the
original C1 stylesheet: old rejected artwork is not reintroduced into today's
visual oracle. It reports this baseline mode and actual manifest revision.
All old C1 numeric/route expectations remain; its packaging delta explicitly
includes this batch's design-system bytes. Temporary fixture cleanup is bounded
and cannot overwrite a working checkout. The original C1 baseline stays intact.

Run the commands in `.github/workflows/cleanup-typical.yml` with clean tracked
checkouts and `C57_BASELINE_ROOT` pointing to the accepted base.
