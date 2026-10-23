# C2 — mobile logo-mask duplicate

Use a clean committed checkout, Node.js 22+, the existing lock-pinned packages
in `scripts/palette` and `scripts/localization`, and Playwright Chromium.
Create a baseline worktree at `6ce82985d46f9d29c4f7312753d1a0b62714a19a` and set
`C2_BASELINE_ROOT` to its absolute path. Compile pinned utility CSS into
`artifacts/cleanup-c2/utilities.css`, as shown in the workflow. Then run:

```sh
node --test tests/cleanup_logo_mask.test.cjs
node scripts/palette/build.cjs --check
node scripts/localization/inventory.cjs --check
node scripts/cleanup-logo-mask/compare.cjs artifacts/cleanup-c2
```

The paired browser check builds both real standalone packages through the
accepted packer. Only the calculator UI stylesheet differs. All other packaged
resources must match, and the standalone size decreases by exactly 44 bytes.
No external requests or form submissions are allowed. No credentials are used.

Both live entrypoints cover RU/EN/KK at 320, 360, 390, 430, 599, 600, 601, 660,
768, 1199, 1200 and 1280 px; fresh standalone covers 320/600/601/1280.
The 84 pairs compare home, menu (or focused desktop navigation), and expanded
embed information. Every logo's complete computed style, its geometry and
image dimensions are compared, as well as visible-page geometry/style samples.
A temporary offscreen probe verifies the legacy 64/140px fallback independently
of the current hero's more specific layout. It is removed immediately.
Twelve PNG pairs cover three languages and both sides of the 600px breakpoint.

Three paired timing runs at 390/1280 alternate order; they report V8 heap,
listener count and lab readiness, not production Core Web Vitals. No speed-up
claim should be made for the removal of a 44-byte duplicate.

This is separate from the frozen C1 tools/evidence, which remain unchanged.
The exact C2 scope restoration lives in historical test helpers, never on the site.
The task-09 workflow is not modified. Its CSS guard still compares every byte
outside this exact deletion and the already accepted logo tail.

After accepted #248, the historical partner-build guard needs a separate exact
CSS bridge for About/Consulting. It accepts only the old fixture bytes or the
owner-accepted `6ce8298` bytes; arbitrary colour, layout or appended edits fail.
The C2 application gate independently pins every other runtime/asset byte to
`6ce8298`, so the bridge cannot hide an actual banner rollback or modification.
