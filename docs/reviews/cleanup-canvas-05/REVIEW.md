# C5-1 — About canvas geometry ownership

Base: accepted #251 merge `fda74ea466f84048f647fe7341e4b65d2a46ef70`.
The first C5 component consolidates canvas geometry into its canonical scoped
fullbleed rule, plus mobile top margin. Artwork, palette, content and financial
code stay exact. **This is C5-1, not completion of all C5.**

## Ownership and boundary

| Responsibility | Owner retained |
| --- | --- |
| Existing DOM, IDs and translated content | `nomad360_header.js` |
| Decoration, scenic composition and viewport variables | `nomad360_about_banner.js` |
| Canvas dimensions, clipping and outer margins | Existing scoped `#nomad360-information.nomad-information` component |
| Approved paint/foreground tokens | Existing palette layers |
| Inner About/Contacts 1138px content limit | Existing inner wrappers |

The existing class is the shared component; no second class, ID migration or
DOM rewrite is introduced. The final fullbleed root remains the canonical
width/max/min/box-sizing/overflow/margin definition. Mobile now overrides only
`margin-top:28px`, inheriting the same accepted width and left offset.

Seven historical conflict groups retire: unconditional max-width, width and
margin; mobile width, max-width and margin; desktop overflow. Old 1138/440px
canvas caps, inset widths, auto margins and visible overflow were already
overridden. The interior 1138px content limit, photographs, masks, background
scaling, fonts, colour tokens and all text remain byte-identical.

The unchanged original AST analyzer rechecks accepted main and current source:
**224 → 217 total conflicting-value groups; this component 7 → 0**.
[Ownership, reviewed groups and all 217 unreviewed groups](ownership.json).
Those remaining groups are not labelled dead code or authorized for automatic
deletion. C5 continues one component at a time after separate acceptance.

## Local verification

| Check | Result |
| --- | --- |
| Component/source/negative guards and financial modules/drafts/export | 89 passed; [log](unit.log) |
| Frozen VAT | 48 exact references; [log](vat.log) |
| Scenic main + real standalone | 66 before/after pairs |
| Default/service-hover/contact-focus | 198 complete style/geometry comparisons |
| Live viewport transitions | 21 paired resize checks across three languages |
| Screenshot pairs | 18/18 byte-identical |
| Negative old inset/max-width control | Loss of full width detected |
| Generated palette and static fonts | Unchanged; palette remains 281853 bytes |
| L0 inventory, SEO, syntax and frozen logo tail | Passed |

Main RU/EN/KK spans 320, 360, 390, 430, 699, 700, 701, 768, 999, 1000, 1001,
1280, 1440, 1920 and 2560 px. Actual offline packages span
320/700/701/1000/1001/1280/2560. Complete computed properties and geometry of all
About nodes/rendered pseudo elements are compared. Absent pseudo elements are
checked by `content`. Only local before/after URL prefixes are canonicalized.
The decoder loads the same original photograph; no colour/image/geometry masking.

Actual live resize uses 390 → 1280 → 700 → 701 → 1000 → 1001 → 320, waiting for
the unchanged controller's `documentElement.clientWidth` variable update. The
negative test reinstates the old inset width/440px cap and must fail full width.
The US demo has no About stylesheet and remains byte-identical; old C3 CI still
checks its legacy information block.

Both actual standalone files use the original packer and clean tracked
checkouts. Every non-About resource has exactly matching bytes/SHA. The local
runtime receipt uses `58576d6`; later commits add pure ownership analysis and
reporting only. Final PR HEAD is checked again by CI.

[Full protocol](protocol.json) · [Summary](summary.json) · [Browser log](browser.log)
· [Ownership analyzer result](ownership.log).

## Size and paired samples

| Resource | Before | After | Difference |
| --- | ---: | ---: | ---: |
| About stylesheet | 30275 B | 29792 B | −483 B |
| gzip | 7036 B | 6956 B | −80 B |
| Brotli | 5847 B | 5775 B | −72 B |
| Actual standalone HTML | 13230361 B | 13229878 B | −483 B |

Nine alternating paired readiness samples per variant/width:

| Width | Before median | After median | Difference |
| --- | ---: | ---: | ---: |
| 390 px | 628.74 ms | 644.26 ms | +2.47% |
| 1280 px | 692.08 ms | 676.51 ms | −2.25% |

Ranges overlap broadly: 603–670 / 606–689 ms at 390 px, 597–710 / 626–711 ms
at 1280 px. Opposite-direction small deltas are recorded without a speedup or
production CWV claim. Both sides retain 259 listeners in every readiness sample.
Post-GC heap samples fluctuate and do not certify absence of memory leaks.

## Historical contracts and required CI

Test-only adapters recognize only exact accepted/C5 About bytes, hashes and
sizes. The original C3 source is a separate exact pass-through for historical
guards. Extra inherited C5 bytes are counted relative to pre-C5 canonical bytes,
so they are not double-counted with earlier C3 changes. Unknown sources, margins,
breakpoints, caps, fonts, colours and asset URLs still fail negative tests.

Old C3/C4 comparators have only explicit inherited-resource/size bridges. Their
exact changes are also pinned by the new source gate. Every existing workflow,
numeric oracle, generator and other runtime/artwork file stays unchanged.
The protected task-09 workflow and its widget are untouched.

CI reruns old C3's full 111-pair matrix and old C4's 216 route comparisons,
complete models, restoration, five-cycle navigation, 72 real Excel downloads,
independent OOXML reading and six PDF projections. Those final-HEAD CI results
are linked from the PR; this local report does not substitute for them.

## Visual receipts and status

Six representative paired images are committed here. All 18 PNG pairs are
uploaded by the C5-1 workflow for 14 days; every hash remains in the protocol.

- [RU mobile before](ru-320-before.png) / [after](ru-320-after.png)
- [EN desktop before](en-1280-before.png) / [after](en-1280-after.png)
- [KK mobile before](kk-320-before.png) / [after](kk-320-after.png)

These preserve accepted design and existing floating controls. Native printer
drivers and Excel Desktop are not newly certified. No live applications, mail,
private partner data or credentials were used.

Changed files: [FILES.txt](FILES.txt). C5-1 needs owner acceptance and separate
merge permission. Other C5 components and C6 have not started.
