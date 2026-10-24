# C5-5 — page stylesheet ownership

Base #255: `930fc1bad7d34d9921bd543830e36caec2e2ef87`.
This slice changes no product source, CSS, page, asset, financial module or
existing workflow. It makes page-level ownership executable rather than
mistaking a combined AST census for one physical stylesheet cascade.

`model.cjs` parses actual stylesheet links/imports and palette markers for
13 declared pages: two calculators, five EN topics, three help pages, three
legal pages. Legal raw CSS is isolated from SEO/calculator; help deliberately
loads SEO then help; the final shared palette stays after page CSS. The model
rejects external CSS, duplicate loading, foreign family CSS, missing palette,
wrong markers and reversed help order. Current HTML in declared roots must
have an entry. The original AST analyzer is rerun on current runtime sources.

Raw conflicts remain **185**. Nineteen groups are reviewed and **retained**:
page-isolated cards/brand/intro/link styles, ordered help focus declarations,
and selected-language inversion. The final palette owns actual keyboard focus
(brand navy, 3px, 2px offset), independent of historical raw source values.
Two mixed calculator body groups stay unreviewed. Total unreviewed is **166**;
no count is presented as nineteen deleted conflicts.

Use clean tracked before/after checkouts, locked tools and pinned utilities as
in `.github/workflows/style-ownership.yml`. Set `C55_BASELINE_ROOT` to the base,
then run:

```sh
node --test tests/style_ownership.test.cjs
node scripts/style-ownership/model.cjs artifacts/style-ownership/ownership.json
node scripts/style-ownership/browser.cjs artifacts/style-ownership
```

Six widths: 320/360/390/430/768/1280. Static pages use their fixed language;
both calculators and real standalone use RU/EN/KK. Total 120 pairs, 22 exact
intro PNG pairs and 102 keyboard-focus probe pairs. Probe anchors/summaries
are explicitly synthetic inspection nodes; they are never product changes
or a claim that all source selectors have current visible DOM matches.
Loaded stylesheet order and runtime palette markers must equal the graph;
current help language must retain white foreground on brand navy. Every
before/after style/geometry/DOM hash matches. Real standalone HTML and all
63 resource records must be byte-identical; source revision differs only in
the external manifest. No speedup/CWV/memory-leak claim is made.

The separate business job reuses accepted C4's full models, restore/navigation,
actual Excel/OOXML and PDF tests. Generated palette, fonts, numerical oracles
and source hashes stay exact. Archived/filled HTML and SHELTER remain C7 work;
this ownership record authorizes no deletion or redesign there. Future hosting
must update the origin/prefix and page map explicitly, preserving isolation.
