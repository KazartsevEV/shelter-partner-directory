# C4 — generated palette duplicate cleanup

Base: owner-accepted #250 merge `27e38c752d89938fdfd1d1da4579164a8b43963c`.
The generator removes seven early duplicate rules (904 bytes). Named layers,
wrappers, later restorations, declarations, colours and fonts are preserved.

## Implementation and independent boundary

`scripts/palette/build.cjs` runs a development-only PostCSS deduplication pass.
It retains the last identical selector/declaration sequence in the same actual
parent within a named palette layer. It preserves the initial layer-order
statement and every media/supports/layer wrapper, selector, declaration order
and `!important` priority. Separate conditional blocks are never merged.

An independent frozen receipt records seven original early/late offsets and
rule lengths; expected CSS is formed by deleting those exact early spans from
accepted main, without calling the new deduper. The generated output must match
that receipt byte for byte. The groups are tagline `span+span`, home body,
hero `h1`, calculation-list `li`, home example link, full-service label and
full-service secondary action. Later copies can restore intervening values.

All other runtime, artwork, static fonts, numerical fixtures and existing
workflows remain byte-identical. L0 changes contain only source hash/offset
metadata. Original numeric oracles and financial formulas are unchanged.

## Local verification

| Check | Result |
| --- | --- |
| Source, independent deletion receipt, negative guards, finance/drafts/export | 85 passed; [log](unit.log) |
| Frozen VAT references | 48 exact cases; [log](vat.log) |
| Paired actual pages/offline contexts | 24 |
| Style/geometry route comparisons | 216 across nine routes |
| Complete financial model comparisons | 96: V1, both V2 and full service |
| Real V2 reload/restoration checks | 48 |
| Screenshot pairs | 8/8 byte-identical |
| Repeated home → V2 profile | 18 pairs × five round trips per variant; constant 304 listeners and matching DOM counts |
| Real Excel downloads | 36 cases, 72 books; RU/EN/KK × six widths |
| Independent OOXML reading | All 72 books; numeric cells/no formulas |
| V1 PDF projection | Six language/mobile/desktop cases |
| Generated CSS / L0 / SEO / syntax / frozen logo tail | Passed |

The actual calculator uses RU/EN/KK × 320/360/390/430/768/1280. Fresh standalone
packages use all three languages at 320/1280. Nine routes are shopper V1, home,
standalone V2, linked V2, full service, simple self/hired/agent and offline.
Every pair compares all computed properties of nodes matching the seven
affected selectors plus visible-page geometry/layout/paint/font properties.
Complete financial models are compared in the four applicable routes; simple
service branches additionally exercise their empty/default UI states.

The repeated-navigation profile primes the same fourteen routes, including
empty partner/bug dialogs, as the original runtime audit, then opens V2 before
five measured home/V2 round trips. This measures initialized navigation rather
than cold lazy setup. It reproduces the original audit's 304 listeners for all
18 language/width combinations and checks DOM/listener growth independently.
No forms are submitted. [Raw repeated profile](repeated-navigation.json).

An isolated browser fixture verifies a late restoration after an intervening
override; deleting the later copy produces a different real computed colour.
Negative source tests reject alternative fonts/colours, layer reordering,
important/declaration-order differences and unconfirmed resource SHA/size.

[Readable summary](summary.json) · [Full paired models/styles/package/timing
protocol, gzip](protocol.json.gz) · [Browser log](browser.log) · [Excel](excel.log)
· [OOXML](ooxml.log) · [PDF projection](pdf.log).
The complete JSON is also uploaded uncompressed as a CI artifact. The local
packages were built from clean tracked sources at `27e38c7` and `c11a06e`;
later commits contain test profiling/reporting only. Final HEAD is checked by CI.

## Size and paired timings

| Resource | Before | After | Difference |
| --- | ---: | ---: | ---: |
| Generated palette | 282757 B | 281853 B | −904 B |
| gzip | 18076 B | 18054 B | −22 B |
| Brotli | 13509 B | 13476 B | −33 B |
| Real standalone HTML | 13231265 B | 13230361 B | −904 B |

Every other packaged resource has the same size and SHA. Nine alternating
paired readiness samples per variant/width give:

| Width | Before median | After median | Difference |
| --- | ---: | ---: | ---: |
| 390 px | 842.56 ms | 837.84 ms | −0.56% |
| 1280 px | 833.15 ms | 839.33 ms | +0.74% |

Ranges overlap: 785–887 / 812–929 ms at 390 px, 776–918 / 796–885 ms at 1280 px.
These local samples include the existing harness's fixed settling interval;
they are not production CWV or comparable absolute timings to earlier harnesses.
No speedup is claimed. Initial readiness samples retain 259 listeners on both
sides. Post-GC heap varies; raw samples are preserved without claiming no leaks.

## Historical guard compatibility

Older C2/C3 guards restore only the exact original/new palette bytes and exact
generator hook. Package comparison accepts only those palette SHA/byte counts;
other resources remain protected. Old C3 standalone comparison now includes
its 360-byte change plus inherited C4 904 bytes; C2's cumulative difference also
includes its earlier 44 bytes. Historical reports/oracles are not rewritten.
Isolated old About-only unit fixtures remain valid; actual complete manifests
must match all baseline resources, so a missing palette cannot pass comparison.

All old workflows, including protected task 09, are unchanged. Old C3 comparator
has only the explicit inherited-resource/byte-count bridge; this precise diff is
also pinned by the C4 source test. The new deduper is development-only, with no
added runtime request or script.

## Visual evidence and status

All eight screenshot pairs are committed beside this report. Examples:

- [Mobile V1 before](ru-320-v1-before.png) / [after](ru-320-v1-after.png)
- [Desktop full service before](ru-1280-full-service-before.png) / [after](ru-1280-full-service-after.png)
- [Desktop home before](ru-1280-home-before.png) / [after](ru-1280-home-after.png)

They preserve the accepted UI, including its floating controls. This is not a
redesign. CI results are linked from the PR; local GREEN alone is not acceptance.
Native printer drivers and Microsoft Excel Desktop were not newly certified.
No live submissions, mail, partner data or credentials were used.

Changed files: [FILES.txt](FILES.txt). C5 has not started. Merge requires separate
owner permission after acceptance.
