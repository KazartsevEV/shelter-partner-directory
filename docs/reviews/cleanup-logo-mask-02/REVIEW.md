# C2 — remove the superseded early mobile logo-mask rule

Base: owner-accepted main `6ce82985d46f9d29c4f7312753d1a0b62714a19a`, including merged #248. Earlier C2 work remains preserved in `cleanup/mobile-logo-mask-c2`.

## Result and scope

Removes only the first 44-byte `.nomad-seo-logo-mask{width:64px;height:64px}` declaration from `nomad360_calculator_ui.css`. The later identical mobile declaration restores the same 64 px size after the intervening desktop rule. Its order, the entire frozen LOGO-01 tail, original PNG, crop and dimensions remain byte-identical.

All other runtime code, artwork, generated palette and numerical fixtures are pinned byte-for-byte to accepted main. There are no financial, draft, translation or export-function changes. L0 inventory changes are source hash/offset metadata only. C3 and subsequent cleanup slices have not started.

## Current local verification

| Check | Result |
| --- | --- |
| Unit/source/financial tests | 75 passed; [log](unit.log) |
| Main app + US demo + fresh standalone | 84 before/after pairs, 252 view comparisons |
| Logo screenshot pairs | 12/12 byte-identical PNG pairs |
| DOM/visible-node counts and computed styles | Equal in every paired home/menu/embed view |
| Listener count | 259 before and after in each timing repeat |
| Excel browser matrix | 36 scenarios, 72 actual downloaded/restored workbooks, RU/EN/KK × six widths |
| Independent OOXML reader | All 72 books passed; numeric cells, text IDs, no formulas |
| V1 PDF print projection | Six RU/EN/KK mobile/desktop cases passed |
| Frozen VAT | 48 exact reference cases passed |
| Palette / L0 / SEO Phase A / syntax | Passed; generated palette unchanged at 282757 bytes |

The earlier Excel/PDF-button timeout was **not reproduced on this accepted base**. The complete original Excel browser test was used unchanged. No application fix or test workaround is attributed to C2.

Full paired browser receipts: [protocol.json](protocol.json). The real standalone packages differ by exactly 44 bytes; every other packaged resource hash and size matches. The before package is `6ce8298`, and the full local after run used runtime `344aac8`. Nine-repeat timing used `ef54e5e`; production application bytes are identical between those two commits. Subsequent local changes contain only CI/reporting. Final HEAD is checked afresh by CI.

[Excel protocol](excel-protocol.json) · [OOXML](ooxml.log) · [PDF projection](pdf.log) · [VAT](vat.log) · [L0](localization.log) · [SEO](seo.log)

## Size and performance

| Resource | Before | After | Difference |
| --- | ---: | ---: | ---: |
| Calculator stylesheet | 282155 B | 282111 B | −44 B |
| gzip | 190277 B | 190275 B | −2 B |
| Brotli | 187496 B | 187476 B | −20 B |
| Fresh standalone HTML | 13231669 B | 13231625 B | −44 B |

Initial three-repeat timings varied, including an 8.2% median increase at 390 px. Nine additional paired repeats per variant/width did not reproduce that increase:

| Width | Before median | After median | Difference |
| --- | ---: | ---: | ---: |
| 390 px | 692.76 ms | 693.39 ms | +0.09% |
| 1280 px | 658.76 ms | 664.88 ms | +0.93% |

Individual ranges overlap broadly (390 px: 624–783 / 621–781 ms; 1280 px: 640–713 / 646–691 ms). This is local readiness sampling, not production CWV or proof of a speedup. Heap snapshots fluctuate after GC; they are recorded without claiming zero memory leakage. Raw initial samples remain in `protocol.json`; [timing-repeat.json](timing-repeat.json) explicitly contains timing-only results, not additional visual scenarios. [Summary](summary.json).

## Historical guard compatibility

The unmodified historical partner-build guard also fails on clean accepted main `6ce8298`: it still expects About/Consulting CSS from its older `9c59e92` baseline. [Baseline failure](main-historical-guard-red.log).

A test-only bridge registers exactly the owner-accepted #248 CSS bytes. Appended edits and colour mutations are rejected. No financial exception or numerical fixture is changed. The independent C2 source gate pins all actual runtime/artwork files to `6ce8298`, so the historical bridge cannot hide an actual banner change or rollback. CI reproduces the old guard failure before running the corrected source checks.

The protected task-09 workflow, C1 tools/receipts, logo source and accepted banners remain unchanged. Its CSS guard accepts only this exact 44-byte removal and still rejects all other unreviewed changes.

## Visual receipts

All 12 before/after pairs are stored beside this report. Example crops:

- [RU 320 before](ru-320-before.png) / [after](ru-320-after.png)
- [EN 600 before](en-600-before.png) / [after](en-600-after.png)
- [KK 601 before](kk-601-before.png) / [after](kk-601-after.png)
- [Desktop before](ru-1280-before.png) / [after](ru-1280-after.png)

These are logo crops; full-page geometry and all relevant header/logo computed styles are compared in the protocol. They do not assert independent redesign acceptance.

## Limits and status

CI results are attached to the PR; local receipts do not substitute for final-HEAD CI. Print projection checks do not certify native PDF printer drivers, and no new manual Microsoft Excel Desktop certification is claimed. No live submissions, emails or partner data were used.

C2 remains separate from C3–C7 and requires owner acceptance and separate merge authorization. Changed paths: [FILES.txt](FILES.txt).
