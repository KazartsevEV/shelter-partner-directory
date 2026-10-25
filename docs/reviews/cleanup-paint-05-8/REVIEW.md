# C5: final cascade and palette batch

Date: 2026-10-24. Base: accepted main `050bce789259867096d2d312e5b0dbea51454d5d` (#258).
Status: local acceptance checks passed. Final CI is recorded in the current [PR #267 checks](https://github.com/KazartsevEV/shelter-partner-directory/pull/267/checks). Accepted by the owner and merged on 2026-10-25 as `72221d1` (#267); see [closeout](CLOSEOUT.md). C6 and partner issuance unchanged.

## Change and scope

The owner requested larger C5 slices without functionality changes. Remove 85 source declarations whose complete selector/context/property/priority has a later owner: UI 21 (475 B), design system 43 (1533 B), hero 12 (692 B), IRBIS 9 (252 B). Consulting is unchanged. The deterministic palette generator removes shadowed generated declarations (3162 B), using a shared, build-only PostCSS module. Total runtime CSS saving: 6114 B; no runtime JS dependency added.

All source asset URLs and named-layer creation order remain intact. In source mode, multi-property fallback pairs, URLs, content/src, vendor values and revert are protected; a shared selector rule is pruned only when every selector has a later owner in the same context and priority. Empty named layers must survive. Generated mode is restricted to the controlled palette output; the existing seven-pair deduplicator is unchanged.

Source-color discovery previously coupled generated inline-style compatibility to dead source paint declarations. `scripts/palette/inline-paints.json` now explicitly retains the ordered 210 legacy inputs before RGB expansion. This does not add rendered colors: the four approved colors stay #173B58, #FFFFFF, #FF913F and #38678B. The 375 generated inline paint alias rules retain their exact order and declarations. Full palette winner maps and source winner maps remain equal.

## Current ownership, without historical normalization

`node scripts/cleanup-paint/ownership.cjs` reads the actual 73 audited sources. Raw groups: 100 → 31; retired: 69; reviewed retained: 31; unreviewed: 0. Original C5 count 224 → proposed final 31 (193 retired across accepted stages and this candidate).

Retentions have explicit evidence in `ownership.json`: 19 accepted page-family owners; two independent body paint defaults across resources; one Consulting `100vw` → `100cqw` feature fallback; nine shared defaults with sibling selectors that still need the declaration. A nonzero raw count is expected and is not itself an error. The owner accepted the final package and authorized merge on 2026-10-25. The code was merged in #267; the remaining owner ledger is retained by design.

## Historical contracts

Old checks restore only exact immutable Git snapshots and the frozen C5-8 ranges/fingerprints in `tests/fixtures/cleanup-paint/`. These projections are test-only. The actual packer and public code never import them. Current-source tests require the actual candidate bytes, independently of all historical projections. Old byte-size deltas exclude this stage first; its five resource deltas are counted once. SEO still hashes the actual HERO file and allows only exact accepted/candidate blobs. Unknown bytes, fingerprints, deletion ranges, or packaged style blocks fail closed.

C1 replay keeps today's accepted artwork and all other resources, replaying only the original C1 design-system source; its separate C5-8 design-system saving is 1533 B. Financial numerical expectations, drafts, frozen audit archive, all old workflows, license, original artwork/fonts and runtime JS stay unchanged.

## Existing drafts and independent work

Drafts #261/#262 propose smaller overlapping UI/IRBIS removals. #264/#265/#266 classify remaining palette/design/UI/Hero groups. This consolidated alternative must be reviewed together with Issue #263; those drafts must not subsequently be merged over the consolidated source. After #267 merge, superseded drafts are closed with explicit replacement records; none is falsely recorded as merged or as separate runtime acceptance. The reconciled group counts are in [closeout](CLOSEOUT.md). File recovery Issue #260 and diagnostics #259 are independent; CSS cleanup does not close them.

## Verification

Local results are recorded in `verified-summary.json`, `local-checks.json`, the complete protocols and selected before/after screenshots. All runtime inputs were tested at `3086801`; later commits change test/verification code and evidence only. The actual five runtime stylesheet hashes remain pinned to the same candidate.

| Check | Result |
| --- | --- |
| Core + supplemental tests | 128 + 23 passed (151 unique); stronger binary/source guard rechecked separately |
| Frozen VAT values | 48/48 exact |
| Palette / L0 / SEO / pinned controls | passed |
| Calculator pairs | 126/126, 1008 route comparisons |
| Banner disclosure pairs | 18/18, 72 state comparisons |
| Independent SEO / help / legal pages | 66/66 with real palette and loaded Inter faces |
| PNG pairs | 76/76 identical |
| Standalone | 12,972,564 → 12,966,450 B (−6114 B) |
| Packaged resources | 63; 58 byte-identical; only five CSS changed |
| Listener samples | 279 before/after in all 12 samples |
| New horizontal overflow | none |

Selected screenshots: [mobile About](screenshots/banner-nomad360-about-closed-ru-320-after.png), [desktop About](screenshots/banner-nomad360-about-closed-en-1280-after.png), [mobile IRBIS](screenshots/banner-nomad360-irbis-banner-closed-ru-320-after.png), [open products](screenshots/banner-nomad360-irbis-banner-products-open-kk-1280-after.png), [RU help](screenshots/static-ru_help_index.html-320-after.png), [EN license](screenshots/static-license_en_index.html-1280-after.png). Both before/after files are committed for all selected views. The complete 152 PNG files are available in the CI artifact; all hashes are retained in the committed protocols. Selected mobile/desktop About, IRBIS, home and form images were inspected manually.

Timings are laboratory observations over three paired repetitions at each width, not proof of a production speed gain. Median ready times: 390 px, 1019.7 → 913.5 ms; 1280 px, 950.2 → 929.6 ms. Heap samples remain close and are recorded raw. Byte and cascade reductions are proven; no significant speed improvement is claimed.

The initial static replay missed absolute assets and its results were discarded. The corrected replay checks every successful resource response, the exact palette hash, loaded Inter faces and font errors. The earlier reported help overflow does not reproduce with actual styles; it is not a production defect. No source fix for that false diagnosis was made.

C5 acceptance/merge was authorized on 2026-10-25 and completed in #267. CI at merge was 35 success / 1 failure / 1 historical visual skip; the observed #260 failure remains open. Source-code equality and fixture tests do not complete hosting, live partner mail/issuance, C6/C7 or independent file recovery #260. No real forms, emails or payments were sent.

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
The corrected matrix has no horizontal overflow; font and resource evidence is recorded per case in `static-protocol.json`.
