# C6 final — explicit V1 state preparation

Accepted base: `adc77e3baec5f22f0c97cdc9788f43603ac36946`, main after accepted #270.

`nomad360_v1_state.js` receives plain field/row records, normalized numbers,
read-only business selections, payroll reference tables and captured payment/UI
state. It prepares the complete persisted product snapshot and production,
logistics, selling, production-worker and employee costs. No DOM, storage,
transport, formatting or locale dependencies are allowed. Progressive tax and
employer-charge helpers have one implementation; compatible globals delegate.
The financial V1/V2 engines, tax tables, payment normalization, draft format and
business formulas are unchanged.

`v1StateInput` in each HTML entrypoint is the DOM adapter. It reads only the field
IDs/number IDs/row groups required by that operation. It passes plain values,
never DOM nodes. Payment capture and UI-state capture happen only for a product
snapshot. Existing renderers, messages, global/inline handlers and update order
remain in HTML. Display-only subtotals, rounding, labels, navigation, DOM row
creation and persistence orchestration remain UI responsibilities, not an
additional financial model. This closes the remaining C6 preparation boundary;
it does not attempt to relocate the entire form or retire supported globals.

The reversible receipt records all exact HTML edits and source/module hashes.
Historical C6-1/C5 source and package projections first reverse this precise
receipt. Unknown changes, incorrect or duplicated module resources still fail.
The production delivery/builder remains unchanged and bundles the new module.

Validation:

- 480 accepted-source comparisons across all six operations, with immutable
  inputs, own/resale/dropship/service sources, import/payer choices, pending NaN,
  equipment rows, fractional quantities and RU/KZ payroll (including high salary).
- 101 financial/state tests pass locally; original engine, draft and historical
  guards remain in place. L0 text inventory and SEO pass without new UI strings.
- Original full first-user save/restore/delete journey passes.
- Paired browser matrix compares both entrypoints and fresh standalone HTML in
  RU/EN/KK on 320/360/390/430/768/1280, including explicit RU/KZ staff/production
  updates. [Raw protocol](protocol.json): **54 pairs / 1086 state-and-pixel comparisons**,
  **18 timing pairs**. Listener counts remain [321], with identical DOM/listener
  samples over five repeated visits. Local median readiness: 1560.7 ms
  before / 1570.1 ms after; median paired delta
  +43.9 ms. These are lab measurements, not a
  production speed claim. Resource delta: {'bytes': 6794, 'gzip': 2008, 'brotli': 2278}.
- Original real Excel suite passes 36 cases / 72 downloaded workbooks. Full-service
  agent restore/PDF and the original production/credit E2E pass unchanged.
- Historical C5/C6 guards pass 26 tests; module/package projection negative cases
  reject tampering and duplicate resources. A real versioned partner package
  projects byte-for-byte to accepted main: [result](package-projection.json).
- [Local summary](local-checks.json); representative unchanged hero images:
  [RU mobile](ru-320.png), [EN mobile](en-320.png), [KK mobile](kk-320.png),
  [RU desktop](ru-1280.png), [EN desktop](en-1280.png), [KK desktop](kk-1280.png).
  Final HEAD CI will be linked from the PR; no merge before separate acceptance.

C6 is ready to close only after completed checks and owner acceptance/merge.
C7 and partner/hosting deployment are not started. Partner customization uses
existing validated configuration; it does not override formulas in these modules.
