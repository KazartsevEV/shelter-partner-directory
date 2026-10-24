# C5-1 — About canvas geometry owner

This is one component from C5's 224 historical override groups, not completion
of all C5 work. DOM comes from `nomad360_header.js`; decoration and viewport
variables come from `nomad360_about_banner.js`. The scoped
`#nomad360-information.nomad-information` rule owns canvas geometry. Palette
layers own paint; inner About/Contacts sections own their 1138px content limit.

The accepted fullbleed root is the canonical width/min/max/overflow/margin
definition. Earlier contradictory caps/inset margins and desktop overflow
overrides are removed. Mobile keeps only `margin-top:28px`, inheriting all
other accepted geometry. No artwork, copy, palette, internal layout or JS changes.

Set `C5_BASELINE_ROOT` to a clean worktree at
`fda74ea466f84048f647fe7341e4b65d2a46ef70`, install the locked tools, compile
utilities as in `.github/workflows/cleanup-canvas.yml`, and use a clean commit:

```sh
node --test tests/cleanup_canvas.test.cjs
node scripts/cleanup-canvas/ownership.cjs artifacts/cleanup-c5/ownership.json
node scripts/cleanup-canvas/compare.cjs artifacts/cleanup-c5
```

Main RU/EN/KK spans 320/360/390/430/699/700/701/768/999/1000/1001/1280/1440/
1920/2560; real standalone spans 320/700/701/1000/1001/1280/2560. There are
66 pairs, 198 default/hover/focus comparisons and 18 byte-identical PNG pairs.
All About nodes' full computed styles and geometry are compared; absent pseudo
elements are checked by `content`, rendered pseudo elements by all properties.
Actual live resize 390→1280→700→701→1000→1001→320 adds 21 paired checks.
The negative control reinstates the old inset canvas and must lose full width.

Nine alternating paired readiness samples per width record heap/listeners.
The US demo has no About stylesheet and stays byte-identical; old C3's 111-pair
CI still covers its legacy information block. Old C4's business, repeated
navigation, actual Excel and PDF checks also run with exact inherited package
bridges. Historical sources and numerical oracles are preserved. Full C5 and
C6 remain pending separate component review/acceptance.
The pure original AST analyzer is reused without changing its frozen audit or
tools. Accepted-main/current reanalysis verifies seven canvas conflicts retire
(224 → 217 total) and records all remaining groups as unreviewed, not dead code.
