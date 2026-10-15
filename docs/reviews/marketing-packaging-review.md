# Task 6 — current MKT-L10N-01 implementation

15 October 2026 · PR #144 · branch `feature/marketing-packaging`.
Specification: **main `538565e`**, read directly with the task map. Earlier
marketing specifications and their test results do not establish acceptance
for this revision. The current specification file is retained without edits.

## Changes

- Existing RU/EN/KK three-line offer, styling and placement preserved.
- New requested introduction immediately below it: one sentence, exactly three
  benefits, “Our calculator. Your result.” and one arrow to the existing
  `#nomad360-selling-choice`. Existing six results and calculator blocks keep
  their original order and content.
- About: three sequential blocks, horizontal on desktop and vertical on mobile,
  with the exact RU titles/questions. Only the requested sentence below the
  diagram; only “действительно важно” is italic. EN/KK follow the same structure.
- Existing B2B heading, one disclosure button, a comparison table closed by
  default. The button toggles the table and never starts downloading. Exact
  requested rows and RU/EN/KK action labels; RU “Хочу собственную версию”,
  EN “White Label”. At narrow widths row labels span both value columns.
- Free download calls the **unchanged** complete-HTML generator. Preparation,
  ready/error status, actual download and retry link retained. Order uses the
  existing mailto mechanism. The existing GitHub repository visitor counter
  remains under the download action, with its original source, period and math.
- Legal/privacy and existing long product information are closed disclosures.
  Their text and links are preserved. Header navigation opens a collapsed target
  before scrolling to it. Support methods remain in their original section.
  The official contact is one always-visible label/email line.

No new offer cards, market segmentation, analytics, forms, servers, SEO campaign,
licence interpretation or marketing strategy is included.

## Preservation checks

Only four production files change: `nomad360_header.js`,
`nomad360_calculator_ui.js`, `nomad360_locale_core.js`,
`nomad360_calculator_ui.css`. The CSS appends rules to the accepted stylesheet.
The original hero function and all existing financial translations are exact.
Only existing download/order/counter labels change in the old catalogue;
new semantic messages use its existing registry and synchronised snapshots.

The published HTML and all four published presentation assets were downloaded
and matched the corresponding main files byte-for-byte before implementation.

The source guard pins every other top-level HTML/JS/CSS asset and the full
licence to `538565e`. In particular, Marketing_calc.HTML, V1 inline scripts,
V2, payment/currency engines, saved formats, financial exports and HTML head
are unchanged. The download, retry, payment-detail, clipboard and header-renderer
ASTs are protected separately. No financial model or user data is read by the
new presentation blocks.

## Browser evidence

[Current screenshots](marketing-packaging/index.md) ·
[Current protocol](marketing-packaging/protocol.json) ·
[File hashes](marketing-packaging/implementation.json) ·
[Changed files](marketing-packaging/changed-files.txt).

Dedicated Chromium matrix: RU/EN/KK × 320, 360, 390, 430, 768, 1280, 1440 px;
21 scenarios, 129 screenshots, three complete portable HTML editions and six
completed downloads including retry. It checks intro/arrow, preserved result
order, exact diagram text/italic, keyboard table toggle without download,
comparison rows, counter placement, disclosure defaults, visible email,
header links into collapsed information, clipboard, download failure/recovery,
complete downloaded app, text roles, contrast and page overflow.

Local checks: 29 source/font/semantic/diagnostic tests passed; 486 route/language
cases passed with zero visible gaps, zero page overflow and unchanged financial
inputs/results. Existing packaging
regression passed all three languages, PDF and financial parity. Existing full
HTML/Excel download regression passed. Full route/language and financial checks
also run independently in CI.

[Current HEAD CI](https://github.com/KazartsevEV/shelter-partner-directory/pull/144/checks)
is authoritative for the final CI verdict. No result from an older specification
is substituted for those checks.

## Limits and acceptance

The screenshot matrix blocks external resources, including the hosted donation
iframe. Its original URL, dimensions, methods and renderer are retained; no
real donation, order email or lead submission is sent during testing. The
GitHub counter uses a clearly labelled fixture in deterministic browser tests;
its production module and public snapshot are unchanged.

Manual inspection covers RU 390 home/About, KK 320 expanded comparison and
English desktop controls. It is not a claim that every PNG was inspected by a
person or that an independent native-language/legal certification was performed.
The old online-import failures remain separate debt.

This PR awaits user acceptance and a separate merge instruction. Task 7 is not
started.
