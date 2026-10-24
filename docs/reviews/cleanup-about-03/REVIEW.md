# C3 — exact About CSS duplicate cleanup

Base: owner-accepted #249 merge `c45187fa5190ee6ce4bc88a6266337439867a8f6`.

Only runtime change: delete two early duplicate rules (360 bytes) from
`nomad360_about_banner.css`. Preserve later copies, all intervening cascade
bytes and every media/layer wrapper. Original accepted photograph inside SVG,
colours, composition, translations and all other app resources stay exact.

## Verified locally

| Check | Result |
| --- | --- |
| Source, negative guards, financial modules, drafts and exports | 81 passed; [log](unit.log) |
| Original photograph, V1/V2 parity and shopper oracle | 34 passed; overlaps the suite above, not an additional unique count; [log](about-unit.log) |
| Frozen VAT references | 48 exact cases; [log](vat.log) |
| Main, US demo and real standalone | 111 pairs, 333 comparisons |
| Scenic banner / legacy US block | 66 / 45 pairs |
| PNG comparison | 18/18 byte-identical pairs |
| Injected 1px padding regression | Detected |
| DOM counts, styles and geometry | Equal within every pair |
| Palette / L0 inventory / SEO / syntax | Passed; generated palette remains 282757 bytes |

The full [protocol](protocol.json) records all widths, language/state pairs,
image hashes, actual package resources and raw timings. [Summary](summary.json).

Main and US demo use RU/EN/KK at 320, 360, 390, 430, 699, 700, 701, 768,
999, 1000, 1001, 1280, 1440, 1920 and 2560 px. Fresh standalone uses
320/700/701/1000/1001/1280/2560. Each pair compares default, service hover and
contact focus. Every About node has all computed properties and geometry
compared; rendered pseudo elements have all properties compared too. Absent
pseudo elements are checked by `content`. Only local before/after URL prefixes
are canonicalized. Colours, sizes, text and image content are not masked.

US demo retains its existing legacy information block, without the About CSS,
scenic photograph or service-card anchors. Tests assert that real distinction;
they do not inject the redesigned banner into this older entrypoint. Its list
items are hovered instead of nonexistent card links. All production files
outside the two CSS deletions remain byte-identical to accepted main.

The original packer built both offline files from clean committed checkouts.
Every non-About resource has the same size and SHA. The local after package
used `73e70b1`; subsequent commits contain only reporting. Final PR HEAD is
checked again by CI.

## Size and performance

| Resource | Before | After | Delta |
| --- | ---: | ---: | ---: |
| About CSS | 30635 B | 30275 B | −360 B |
| gzip | 7125 B | 7036 B | −89 B |
| Brotli | 5930 B | 5847 B | −83 B |
| Real standalone HTML | 13231625 B | 13231265 B | −360 B |

Nine alternating paired readiness samples per variant/width produced:

| Width | Before median | After median | Difference |
| --- | ---: | ---: | ---: |
| 390 px | 669.05 ms | 684.89 ms | +2.37% |
| 1280 px | 678.82 ms | 650.33 ms | −4.20% |

Ranges overlap broadly: 647–726 / 615–720 ms at 390 px and 627–703 / 613–689 ms
at 1280 px. The opposite-direction median differences are small relative to
within-run variation. No speedup or production performance guarantee is claimed.
There are no added resources, DOM nodes or listeners; 259 listeners were
recorded in every sample. Post-GC heap medians differ by 28/220 bytes and are
recorded without inferring zero leakage. All raw samples remain in the protocol.

## Older guard compatibility

The older C2 paired builder compares with pre-C2 `6ce8298`. It now recognizes
only exact original/C3 About bytes, SHA and byte count, so its offline size
comparison includes the inherited 360 bytes alongside its own 44 bytes.
All other resources remain exact; wrong hashes, sizes, partial/later-copy
deletions, appended changes, altered fonts and colours are rejected by tests.
[Local real-package preflight](inherited-c2-package.log) explicitly contains
timing-only validation, not extra visual cases. CI runs the complete C2 matrix.

The old pinned-controls guard also fails on clean accepted main after C2 merge:
it normalized only the current CSS, while `origin/main` already contained the
accepted C2 deletion. [Reproduced baseline failure](main-pinned-guard-red.log).
It now normalizes both sides through the same exact C2 adapter; the frozen logo
tail and all other CSS restrictions remain. [Positive check](pinned-guard-green.log).
CI reproduces the baseline failure before running the corrected checks.

All existing workflows, original artwork, numerical fixtures, C1 tooling and
the rest of C2 tooling remain byte-identical. The only C2 comparator edits are
the exact inherited-resource/byte-count bridge, checked against its old source.
The protected task-09 workflow and its widget are unchanged.

## Visual receipts and remaining limits

Six representative pairs are committed here, covering RU/EN/KK on mobile and
desktop. All 18 pairs are generated and retained as CI artifacts for 14 days;
the protocol preserves every filename/hash.

- [RU mobile before](ru-320-before.png) / [after](ru-320-after.png)
- [EN desktop before](en-1280-before.png) / [after](en-1280-after.png)
- [KK mobile before](kk-320-before.png) / [after](kk-320-after.png)

Snapshots use the real page, including existing floating navigation. This slice
preserves accepted design; it is not a new visual redesign acceptance.
Local measurements are not production CWV, native printer certification or a
new Microsoft Excel Desktop check. No forms, emails or partner data were sent.
CI results are linked from the PR and do not follow from local GREEN alone.

C4 has not started. C3 requires owner acceptance and separate merge permission.
Changed files: [FILES.txt](FILES.txt).
