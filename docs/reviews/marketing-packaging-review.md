# Task 6 — MKT-L10N-01 marketing packaging

Date: 15 October 2026. Base: `cf17252fdb89cea7e83689f3ea7ebaa4363e2f86`,
including accepted TYPE-02 merge `e9071470` and the latest MKT-L10N-01
approved 20-minute offer and concise-copy contract.
Branch: `feature/marketing-packaging`. Status: prepared for PR / CI.

## Implemented scope

- One existing hero, approved RU headings, EN “Business calculator”, equivalent KK and the approved 20-minute line.
  The existing calculation choice immediately follows these three lines.
  Six results and scenario explanations are expandable below the choice;
  free/browser terms and privacy stay in their appropriate sections.
- Six existing result items; Cash Flow and Available Cash first. Existing
  product/service/portfolio entry points remain. Available Cash is not renamed
  to net profit or owner income.
- Umbrella-brand About with goal, values and three products/statuses. Future
  product descriptions and contact destinations remain available.
- One header anchor to two cards: complete Free Embed €0 and an indicative
  White Label from €600, written agreement, scope and separately quoted extras.
  Paid CTA opens a localised email draft; no form submission or delivery claim.
- Licence footer summarises v2.3, current individual licensor and legal email;
  full terms link and historical licence preserved. Legal source unchanged.
- Support methods share a responsive grid: NOWPayments left, Kaspi/bank/Ozon
  right on desktop; one column on mobile. Original iframe dimensions, scaling,
  payment values, copy actions and links retained.
- Only the specified final sentence removed from standalone V2 introduction.
- Existing GitHub counter clearly identifies repository visits in project
  information. No new analytics. [Measurement plan](../marketing/measurement-plan.md)
  distinguishes clicks, downloads, received enquiries and confirmed donations.

All text lives in the existing semantic registry. Compatibility module snapshots
are synchronised; old static aliases remain resolvable. Financial terminology
decisions T1–T4 and the L1 glossary are not reopened.

## Evidence and verification

The dedicated Chromium test covers RU/EN/KK at 320, 360, 390, 430, 768, 1280
and 1440 px. It checks actual headings/order, six results, two cards, mobile
menu/Escape/keyboard focus/scroll, mailto contents, layout, text roles, contrast,
licence/contacts, support disclosures, failed download recovery, real completed
downloads, repeat links and rendering the complete portable application.

Source guard pins all financial assets and inline application scripts, script
order, field IDs and the entire HTML head to the accepted base. It allows only
moving/expanding the existing homepage list and the single requested V2 sentence to change in
those files. Existing financial unit, numeric browser, currencies, Excel,
localisation, shopper, restore and export checks are retained in CI.

[Screenshots](marketing-packaging/index.md) and [numeric/layout protocol](marketing-packaging/protocol.json).
Local final matrix: 21 cases, 129 PNG, three complete portable editions, six successful
downloads. Do not interpret this as 129 manually inspected images.

## Limits and handoff

- Deterministic screenshots block external services; the NOWPayments body is
  blank in these captures. They verify host geometry, not third-party checkout
  or a donation. No real enquiry or donation is sent during verification.
- Manual inspection covers RU 390 homepage, EN 1280 support/offers and KK 320
  offers.
  Language checks use the accepted specification and glossary; no independent
  native-speaker or professional legal certification is claimed.
- Browser download initiation is not production confirmation of a saved file.
  No analytics provider, enquiry backend or donation webhook is connected.
- HTML head is byte-identical to the base. SEO URLs, title/description,
  canonical/hreflang and indexability belong to task 7.
- The historical online-import failures remain separate debt. No claim that
  marketing resolves them is made.
- Licence [release notice](../marketing/license-release-notice.md) preserves
  earlier permissions and records the legal review limitation.

Stop after this PR's checks and user acceptance. Do not merge or begin task 7
without the applicable user instruction.

Local checks: 30 source/font/semantic/diagnostic tests passed; existing packaging
checks passed for all three languages, including PDF and financial parity.
Localisation acceptance passed 54 cases with restore, user names, native PDF and
frozen-action regression. Full route matrix is also run independently in CI.

## Published implementation

[Draft PR #144](https://github.com/KazartsevEV/shelter-partner-directory/pull/144).
Application implementation: `f40287b8867a0cb8e7f48200eebef0d9057d3fa0`.
The subsequent verification update adds expanded-offer/clipboard checks and
updates the first-visit assertion to the latest approved collapsed-details
contract. All later application-source hashes must remain identical to this
implementation. Initial numeric CI stopped on the superseded always-visible
outcome-list assertion, after its financial checks passed; that assertion is
replaced by closed/open/choice-order checks, without removing numerical checks.
