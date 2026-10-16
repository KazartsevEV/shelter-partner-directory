# UNIFIED-BANNERS-01 — review

Status: **Draft, final parity/CI in progress. No merge or production deployment.**

Source main: `40c792ef06e754ea2ce44f64e68f717f27e8cdb7`. Pre-change evidence committed separately as `546dc8b`; production implementation `c9c5d464173603def27270d7418a3be2065ab70b`.

The current unified specification is `docs/nomad360-unified-banners-task.md`; historical separate banner drafts were not implemented as parallel tasks. This PR preserves the approved offer, “Каким бизнесом мне выгодно заниматься?”, the 20-minute narrative and exactly one existing main CTA. It changes presentation only.

## Implementation

| Requirement | Result |
| --- | --- |
| One hero / intro / SEO composition | Shared mountain/sun scenery, one CTA, one intro; original indexed HTML is updated to the approved intro text, IDs/metadata/language handoff preserved. Redundant old SEO heading/copy no longer appears. |
| About and contacts | Existing umbrella-brand text and automation caption retained; caption above three fully linked cards, approved existing mottos placed individually. Cold white moon scene; contacts remain their own section. |
| Return / support | Original shortcuts and instructions, no-app/funding copy, live NOWPayments and exact payment values; methods collapsed individually by default, details expand naturally. Irbis/full tail preserved. |
| Legal strip | Existing license/data disclosures moved before B2B, existing internal license pages retained; official email/currency/copyright remain. |
| B2B | Original three localized cards, online-chat wording, emphasis and actions preserved; wolf removed only here, Alatau rams added. Free/White Label, €600, actual downloads/retry/mailto/traffic retained. |
| RU/EN/KK | Existing catalogs reused without changing their accepted translations. Single switch, EN/RU/KK option order, selected language retained, disclosures/comparison survive switching. |
| Accessibility | Native links/details, complete linked cards, direct hashes open ancestors and focus the target, visible focus and reduced-motion behavior. |
| Portable HTML | Four local scenery assets are inlined by the existing bundler; no new hosting dependency or financial network request. |

## Baseline and validation

[Pre-change protocol](baseline/BASELINE.md): local and actual deployed website each 12 cases; all affected closed/open areas, dialogs, DOM styles, copy, hrefs, actual clipboard values and NOWPayments URL captured before source edits. Deployed affected files exactly matched source main. Independent pre-change 95 finance tests, historical VAT 48 engines / 78 Chromium routes, Sales Tax and actual PDF/XLSX/portable HTML were GREEN.

Current validations already GREEN: 26 scope/language tests, 20 localization extraction/diagnostics tests, SEO protected-source audit; original return browser matrix 26 cases (21 viewports/locales plus five synthetic install branches); existing calculator UI and real portable HTML/XLSX regression. Final 21-case screenshot/action matrix and exact 78-receipt comparison are running; final results will replace this status before handoff.

## Composition adaptations and limits

- Inter, brand blue, white text and orange actions take priority over raster mockup typography. Images contain no fake UI.
- Mobile places the moon, irbis and rams in separate scenery areas where overlay text would impair contrast. No text overlaps heads or the moon. Normal vertical scrolling remains; no attempt to fit all expanded payment UI into one screen.
- Original source SEO copy was replaced with the explicitly approved introduction to eliminate repetition; canonical/hreflang/navigation and semantic anchor IDs are unchanged.
- The SEO path allowlist now names only this task's module/assets/tests/evidence. A separate exact-hunk guard checks all old production files, and the baseline evidence itself is immutable. No financial tolerance or historical expected value was changed.
- Chromium is not a physical iOS/Android/Windows installation test. No payment was made. Main remains unchanged pending owner acceptance.
