# Online import: current contract maintenance · 25 October 2026

Accepted base: `6e3810befffb4f50767d879fd3715cecce2096a7`. This is a test-only
repair, not a financial formula correction or revival of a retired interface.

## Diagnosis and boundary

Reproduced the original active Node suite on accepted main: 13 tests, 0 pass,
13 fail. Each passed the first-month `fromOnlineV1` DTO into the modern linked
engine, although the actual page imports `Adapter.build` using the V1 configured
period ledger. The browser harness also addressed removed
`#online-service-portfolio-name`, `openOnlineServicePortfolio()` and the old
online-capacity field. The existing current adapter tests and real UI bridge
already passed. No evidence of a current financial regression was established.

The exact old suites are retained as `legacy-import.test.cjs.txt` and
`legacy-import-browser.cjs.txt`; `source-hashes.json` freezes them and every
accepted root JS/CSS/HTML file. The legacy factory remains unchanged; an active
characterization verifies its original 5-deal/65 gross-per-deal values and that
the modern engine rejects that DTO. Original RED expectations are not called
GREEN, hidden with skips, or used to change production formulas.

## Updated verification

- 13 current contract groups, including all 64 agent expense-payer combinations;
  62 total Node checks with existing adapter, V1, linked and independent business
  oracle suites. All pass locally, no skips.
- Real Chromium UI: EN/RU/KK × 320/360/390/430/768/1280, 18 cases, 54 service
  imports and 18 actual save/reload/resume checks. Protocol attached.
- Existing separate current real UI bridge also passes unchanged.
- Fixed independent 3-month oracles: 25 actual deals, gross 3525, normalized
  monthly revenue 1175 for self/hired and 235 for agent; per-role monthly net
  598.75 / −341.25 / −188.5, combined 69. Agreed prices remain 141 / 141 / 28.2.
- Principal receipts remain provenance, not agent turnover; acquiring, agent
  turnover tax and profit tax on unrelated goods are not merged. Negative agent
  income or online CAPEX do not shelter the 1700 goods taxable profit.
- Shared expense conservation, real contractor loss, depreciation versus full
  asset cash acquisition, invalid payers/provenance, JSON state restoration and
  source/input immutability are asserted.

The new browser suite uses real inputs/buttons and persistence, not a mocked
adapter snapshot. External HTTP requests are blocked. It is a functional import
matrix, not a new visual/style audit. The retired online-capacity editor is not
restored or claimed covered; the existing offline-service capacity contract is
outside this test-only maintenance. A separate path-scoped CI executes the new
and existing bridge suites; source checks never rewrite runtime output.

## Delivery and remaining launch gates

No runtime files, financial engines, storage formats, policy, public download,
Google integrations or provider settings are changed. Hosting/domain are not
selected by the owner. Current Google owner OAuth/WIF injection, trusted intake,
full R1 no-site/URL verification and future terms, screenshot channel, White Label
release acceptance and real SEC-01/production verification remain separate gates.
This PR removes a stale test harness debt after acceptance; it does not declare
the whole product ready for activation. Keep Draft for review; no automatic merge.
