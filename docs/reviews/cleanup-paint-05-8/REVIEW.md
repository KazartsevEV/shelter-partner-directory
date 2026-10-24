# C5: final cascade and palette batch

Date: 2026-10-24. Base: accepted main `050bce789259867096d2d312e5b0dbea51454d5d` (#258).
Status: implementation under verification; not accepted or merged. C6 and partner issuance unchanged.

## Change and scope

The owner requested larger C5 slices without functionality changes. Remove 85 source declarations whose complete selector/context/property/priority has a later owner: UI 21 (475 B), design system 43 (1533 B), hero 12 (692 B), IRBIS 9 (252 B). Consulting is unchanged. The deterministic palette generator removes shadowed generated declarations (3162 B), using a shared, build-only PostCSS module. Total runtime CSS saving: 6114 B; no runtime JS dependency added.

All source asset URLs and named-layer creation order remain intact. In source mode, multi-property fallback pairs, URLs, content/src, vendor values and revert are protected; a shared selector rule is pruned only when every selector has a later owner in the same context and priority. Empty named layers must survive. Generated mode is restricted to the controlled palette output; the existing seven-pair deduplicator is unchanged.

Source-color discovery previously coupled generated inline-style compatibility to dead source paint declarations. `scripts/palette/inline-paints.json` now explicitly retains the ordered 210 legacy inputs before RGB expansion. This does not add rendered colors: the four approved colors stay #173B58, #FFFFFF, #FF913F and #38678B. The 375 generated inline paint alias rules retain their exact order and declarations. Full palette winner maps and source winner maps remain equal.

## Current ownership, without historical normalization

`node scripts/cleanup-paint/ownership.cjs` reads the actual 73 audited sources. Raw groups: 100 → 31; retired: 69; reviewed retained: 31; unreviewed: 0. Original C5 count 224 → proposed final 31 (193 retired across accepted stages and this candidate).

Retentions have explicit evidence in `ownership.json`: 19 accepted page-family owners; two independent body paint defaults across resources; one Consulting `100vw` → `100cqw` feature fallback; nine shared defaults with sibling selectors that still need the declaration. A nonzero raw count is expected and is not itself an error. C5 can close only after acceptance and merge of the final package.

## Historical contracts

Old checks restore only exact immutable Git snapshots and the frozen C5-8 ranges/fingerprints in `tests/fixtures/cleanup-paint/`. These projections are test-only. The actual packer and public code never import them. Current-source tests require the actual candidate bytes, independently of all historical projections. Old byte-size deltas exclude this stage first; its five resource deltas are counted once. SEO still hashes the actual HERO file and allows only exact accepted/candidate blobs. Unknown bytes, fingerprints, deletion ranges, or packaged style blocks fail closed.

C1 replay keeps today's accepted artwork and all other resources, replaying only the original C1 design-system source; its separate C5-8 design-system saving is 1533 B. Financial numerical expectations, drafts, frozen audit archive, all old workflows, license, original artwork/fonts and runtime JS stay unchanged.

## Existing drafts and independent work

Drafts #261/#262 propose smaller overlapping UI/IRBIS removals. #264/#265/#266 classify remaining palette/design/UI/Hero groups. This consolidated alternative must be reviewed together with Issue #263; those drafts must not subsequently be merged over the consolidated source. No draft has been silently merged/closed and no audit-only PR is treated as runtime acceptance. File recovery Issue #260 and diagnostics #259 are independent; CSS cleanup does not close them.

## Verification

Pending: complete Chromium matrix, real standalone resource/HTML comparison, timing/listener samples, CI. Source, ownership, palette, 48 VAT numerical cases, pinned-controls, L0 source inventory and SEO checks have passed locally. The final receipt will record actual counts, hashes, screenshots and limitations. No claim of measured speed improvement is made from byte reduction alone.

## Reproducible verification commands

The new workflow pins Node 22 and existing package locks. It checks 128 core tests,
48 VAT cases, source/palette/L0/SEO/pinned-controls boundaries, the raw census,
126 calculator pairs (1008 routes), 18 disclosure pairs (72 states), and 66 static
page pairs. It independently verifies 76 PNG pairs and actual standalone resources.
The dedicated 60-minute job budget includes the expanded matrix and dependency
installation; old job limits and checks stay unchanged.

Local supplemental TYPE-02/payment/agent/MBA suite: 23 tests passed.
Static replay resolves both absolute project paths and public-origin asset URLs
to the selected local variant, requiring successful responses, the exact palette
fingerprint and loaded Inter fonts. Initial receipts produced by an incomplete
resource router are discarded and are not evidence of a production defect.
The corrected static matrix and overflow results are recorded in the final receipt.
