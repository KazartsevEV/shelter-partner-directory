# #47 — RU / KK / EN localization: release acceptance contract

**Release branch:** `feature/47-localization-core-no-redesign`, draft PR #49.
**Live:** `https://kazartsevev.github.io/shelter-partner-directory/Marketing_calc.HTML`, deployed from `main` by `.github/workflows/static.yml`.

## Authorised release condition

The owner has authorised merging and publishing #47 **after completion of the remaining repair and acceptance criteria**. This is conditional authorisation, not permission to publish incomplete localization. The separate visual redesign #48 is explicitly **HOLD**.

## Technical gate

- [ ] Exactly the selected PR HEAD has **4/4 successful completed** Actions: calculator regression, two-SKU, independent V2 model, 390px Chromium.
- [ ] All relevant business/numeric tests pass, including canonical model identity under RU/KK/EN, credit and own-cash, offline/online services, dropship, resale and manufacture.
- [ ] Interactive invalid and hidden states (input errors, unready VAT, discount/margin bounds, save/resume, incomplete V2 transfer, MBA imports and payer assignments) have no untranslated UI errors and never mutate saved source state during locale switching.
- [ ] No untranslated Russian UI is detected on fully rendered EN screens, no unmapped RU-source text on KK screens, and accessible labels, placeholders, title and alt attributes are checked in visible branches; user-supplied SKU and source IDs remain unchanged.
- [ ] Editable numeric fields remain canonical; **rendered** numbers/dates are localized from raw attributes without reparsing displayed text.
- [ ] Verify all four checks on the **merge commit on `main`** and successful GitHub Pages deployment, then independently smoke-check live HTML in RU/KK/EN at 390px including V1 and linked V2. Close issue only after live receipt.

## Independent linguistic gate — still requires a qualified reviewer

**Automated tests and AI editorial analysis are not professional human proof-reading and must not be recorded as such.** Before release, obtain independent qualified EN and Kazakh reviewers' approval on the actual full visible business strings and dynamic templates.

Review the whole source catalog in `nomad360_locale_core.js` (1,144 RU/EN/KK entries as of #47AY, including six redundant identical source keys), anchored dynamic diagnostic templates, payroll caption, V1 pricing and VAT, offline/online service economics, product portfolio V2, MBA and basket reporting, PDF/print language, accessibility names and user-origin copy boundaries.

High-risk terms to check in context:

| Concept | RU source | EN preferred | KK terminology |
|---|---|---|---|
| Input money unit, not a physical item | у.е.* | currency units* | ш.б.* |
| Revenue, excluding VAT when specified | выручка | revenue | түсім |
| Net accounting profit | чистая прибыль | net profit | таза пайда |
| Gross/product contribution | маржа | margin | маржа |
| Price markup (not margin) | наценка | markup | үстеме баға |
| Value-added tax | НДС | VAT | ҚҚС / қосылған құн салығы |
| Tax on revenue vs profit | налог с оборота / с прибыли | tax on revenue / profit | айналымнан / пайдадан алынатын салық |
| Cash flow / free cash | денежный поток / свободный остаток | cash flow / available cash | ақша ағыны / қолжетімді ақша қалдығы |
| Employer pension contribution | ОПВР | employer mandatory pension contribution | ЖМЗЖ — жұмыс берушінің міндетті зейнетақы жарналары |
| Employer social health insurance | ОСМС | employer compulsory social health insurance contribution | МӘМС аударымдары |
| Cash shortfall | кассовый разрыв | cash shortfall / cash deficit | кассалық алшақтық |
| Customer acquisition cost | CAC | customer acquisition cost | клиент тарту құны |

**Terminology sources:** Kazakhstan official social-contributions overview
<https://www.gov.kz/memleket/entities/kgd-vko/press/news/details/1113284?lang=kk>,
Kazakhstan Social Code / employer pension contribution guidance
<https://www.gov.kz/memleket/entities/vko-shemonaiha-usttalovka/press/news/details/1138403?lang=kk>,
and official current Tax Code §503 (VAT)
<https://adilet.kz/laws/nk/st-503/>.
These are terminology references only; they **do not authorize changes** to the calculator's configured tax rates, finance algorithms or deliberately entered demo values.

Reviewer acceptance record (complete with actual reviewer identity and independently recorded sign-off; no self-certification):

| Area | Reviewer | Date | Verdict / corrections |
|---|---|---|---|
| EN finance, product/service wording | — | — | PENDING |
| KK finance, legal/tax vocabulary | — | — | PENDING |
| Live mobile labels / runtime errors | — | — | PENDING |

## Release path after both gates

1. Recheck exact PR HEAD and all four workflow results; ensure no failing/non-blocking checks; inspect current diff against `main` to confirm **only approved #47 scope**.
2. Remove draft status through GitHub review workflow where applicable, merge with `expected_head_sha` to prevent a concurrent-head race.
3. Track `main` build `static.yml` and all post-merge business/numeric workflows. The `deploy-static.yml` alternative uploads only `index.html` on index-only changes, so the complete repo Pages workflow `static.yml` is the appropriate live publishing receipt for `Marketing_calc.HTML`.
4. Fetch/visually verify the live `Marketing_calc.HTML` and language assets; check actual deployment SHA, locale switch, restored draft, linked V2 and unchanged reference business prices in mobile.
5. Close #47 with actual reviewers, test receipts, deployment URL and SHA. **Do not start #48** unless the owner separately approves a UX redesign.

**Release policy:** if any outstanding technical or professional language gate remains, keep PR #49 DRAFT and `main`/live unchanged. Do not report the task as done.
