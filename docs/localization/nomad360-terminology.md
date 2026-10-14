# Nomad360 terminology · L1 working glossary

Reviewed 14 October 2026 against accepted financial code at `9e5a7f51`. **T1–T4 were separately agreed with the user on 14 October 2026; the final labels are in [terminology decisions](terminology-decisions.md). EN is declared canonical only after L0–L6 acceptance.**

English terms establish professional meaning, agreed Russian explains that meaning, and Kazakh sentences follow Russian while retaining the listed English professional terms. Saved data, internal enums, source names, rates and formulas are never translated. Semantic IDs are explicit in `nomad360_locale_core.js`; legacy Russian labels remain compatibility aliases. This glossary governs new terminology; it does not retroactively declare every legacy label professionally verified.

Statuses: **verified-scope** = source meaning and implemented scope checked; **scenario/formula-qualified** = name requires the stated model boundary; **definition-only** = professional definition checked but no matching UI metric asserted; **project-contract** = project-owned operational meaning, not a claim of external standardization; **Tn-agreed-label** = scoped name separately accepted by the user. None of these statuses replaces linguistic and browser acceptance in L6.

Formula sources: `Marketing_calc.HTML` (`calculate()`, `updateEmployerEstimate()`, full V1 cash model), `portfolio_v2_engine.js` (`build`, `operatingPlan`), `portfolio_v2_linked_engine.js` (`build`), `portfolio_v2_full_service.js` (`build`), and existing V1/V2 pricing modules. Source anchors are field/function names so presentation changes do not invalidate a line number. Financial engines remain the numeric source of truth. The calculator is a scenario model, not a claim of IFRS-compliant financial statements or statutory tax advice.

## Metric definitions and decisions

### G01 · Revenue

- **Meaning (EN):** Consideration earned for delivering products or services; distinguish recognition from cash collection.
- **Actual formula / model anchor:** `mRevTotal; V2 revenue = price excluding VAT × forecast quantity. Simple V1 month-one recognition follows its existing scenario rule.`
- **RU:** Выручка.
- **KK explanation / retained term:** Өнім не қызмет бойынша есептелген Revenue. Ақша түсу мерзімі бөлек көрсетіледі.
- **UI decision / scope:** V1/V2; preserve formula and identifiers.
- **Sources:** [S1](#s1). **Status:** `verified-scope`.

### G02 · Cash Receipts

- **Meaning (EN):** Money received in the model cash schedule, including amounts that may not be revenue.
- **Actual formula / model anchor:** `V2 months.receipt / inflow; inflow also includes loanDraw or ownerDraw.`
- **RU:** Денежные поступления.
- **KK explanation / retained term:** Кезеңде нақты түсетін Cash Receipts; несие не өз қаражаты Revenue болып саналмайды.
- **UI decision / scope:** V1/V2 cash calendar; preserve formula and identifiers.
- **Sources:** [S2](#s2). **Status:** `verified-scope`.

### G03 · Gross Profit

- **Meaning (EN):** Revenue less cost of goods sold; selling and administrative expenses are excluded.
- **Actual formula / model anchor:** `Definition only: revenue - COGS. Do not substitute sku.ebitda or accountingNetProfit.`
- **RU:** Валовая прибыль.
- **KK explanation / retained term:** Revenue пен COGS айырмасы — Gross Profit; жарнама мен әкімшілік шығындары бөлек.
- **UI decision / scope:** No automatic relabel; preserve formula and identifiers.
- **Sources:** [S3](#s3), [S4](#s4), [S5](#s5). **Status:** `definition-only`.

### G04 · Net Profit

- **Meaning (EN):** Accrued period result after applicable expenses, depreciation, interest and business tax within the declared model scope.
- **Actual formula / model anchor:** `Simple V1 accountingNetProfit = ΣmEbitda - ΣmTax - siteAmort - magnetAmort; linked V2 includes interest in netProfit; standalone base-month netProfit has narrower scope (T4).`
- **RU:** Чистая прибыль.
- **KK explanation / retained term:** Кезеңнің шығындары мен қолданылатын салықтары шегерілген Net Profit. Әр модельдің шекарасы көрсетіледі.
- **UI decision / scope:** V1 / linked V2; standalone qualified; preserve formula and identifiers.
- **Sources:** [S1](#s1), [S2](#s2). **Status:** `T4-agreed-label`.

### G05 · Cash Flow

- **Meaning (EN):** Cash inflows less cash outflows for the period; noncash depreciation is not a cash payment.
- **Actual formula / model anchor:** `Standalone monthly change = receipt + financing draws - outflow; full service operatingCash = revenue - variable - fixedCashMonthly - interest - tax.`
- **RU:** Денежный поток.
- **KK explanation / retained term:** Кезеңдегі ақша түсімдері мен төлемдердің айырмасы — Cash Flow. Амортизация ақша төлемі емес.
- **UI decision / scope:** V1/V2; preserve formula and identifiers.
- **Sources:** [S2](#s2). **Status:** `verified-scope`.

### G06 · Available Cash

- **Meaning (EN):** Scenario cash balance available after the explicitly locked reserve; not a standardized Free Cash Flow measure.
- **Actual formula / model anchor:** `Standalone freeCash = cumulative - reserve; full V1 freeCumulativeEnd = cumulativeEnd - reserveLocked; simple agent uses cumAgentNet.`
- **RU:** Доступные деньги / Живые деньги.
- **KK explanation / retained term:** Резерв шегерілген Available Cash. Бұл көрсеткіш Free Cash Flow деп аталмайды.
- **UI decision / scope:** Existing cash cards; preserve formula and identifiers.
- **Sources:** [S2](#s2). **Status:** `scenario-qualified`.

### G07 · Gross Margin

- **Meaning (EN):** Gross profit divided by revenue, normally expressed as a percentage.
- **Actual formula / model anchor:** `(revenue - COGS) / revenue × 100. Not (price - cost)/cost. V2 weightedGrossMargin includes additional operating costs.`
- **RU:** Валовая маржа.
- **KK explanation / retained term:** Gross Margin — Gross Profit-тің Revenue ішіндегі үлесі.
- **UI decision / scope:** Do not map to internal historical name; preserve formula and identifiers.
- **Sources:** [S4](#s4), [S5](#s5). **Status:** `definition-only`.

### G08 · Markup

- **Meaning (EN):** Price increase relative to cost; denominator is cost.
- **Actual formula / model anchor:** `Hired simple V1 executorCost = revenue/(1 + markup/100); 100 cost / 125 price = 25% markup.`
- **RU:** Наценка.
- **KK explanation / retained term:** Құнға қосылатын Markup: шығын 100, баға 125 болса, Markup 25%.
- **UI decision / scope:** Hired service; pricing.markup; preserve formula and identifiers.
- **Sources:** [S4](#s4). **Status:** `verified-scope`.

### G09 · Contribution Margin

- **Meaning (EN):** Revenue less all variable product and variable selling/administrative expenses; covers fixed costs and profit.
- **Actual formula / model anchor:** `Definition only; do not name a result Contribution Margin unless every subtracted cost is classified as variable.`
- **RU:** Маржинальный доход / маржа покрытия.
- **KK explanation / retained term:** Айнымалы шығындар шегерілген Contribution Margin тұрақты шығындар мен пайданы жабады.
- **UI decision / scope:** No new metric; preserve formula and identifiers.
- **Sources:** [S5](#s5). **Status:** `definition-only`.

### G10 · Product Operating Margin Before Shared Costs

- **Meaning (EN):** Revenue share remaining after modeled SKU COGS, advertising, processing and fulfillment, before portfolio shared costs.
- **Actual formula / model anchor:** `realizedMarginPct = (revenue-cogs-ad-acquiring-fulfillment)/revenue × 100; weightedMarginPct = Σ(revenue × realizedMarginPct)/Σrevenue.`
- **RU:** Операционная маржа товара до общих расходов.
- **KK explanation / retained term:** Тауардың ортақ шығындарға дейінгі Product Operating Margin көрсеткіші.
- **UI decision / scope:** Standalone V2; keep weightedGrossMargin ID; preserve formula and identifiers.
- **Sources:** [S4](#s4), [S5](#s5). **Status:** `scenario-qualified`.

### G11 · Target Net Margin

- **Meaning (EN):** Chosen share of revenue remaining after the costs and taxes covered by the particular price solver.
- **Actual formula / model anchor:** `V1 pricing denominator deducts margin, applicable sales commissions and tax; inspect branch-specific solver, not cost-based markup.`
- **RU:** Целевая чистая маржа.
- **KK explanation / retained term:** Таңдалған шығындар мен салықтардан кейінгі мақсатты Net Margin.
- **UI decision / scope:** V1 / V2 period price; preserve formula and identifiers.
- **Sources:** [S4](#s4). **Status:** `scenario-qualified`.

### G12 · Working Capital

- **Meaning (EN):** Balance-sheet current assets less current liabilities; operating funding need is a different concept.
- **Actual formula / model anchor:** `Definition: current assets - current liabilities. V2 financing.deficit is peak cash shortfall, not this balance-sheet metric.`
- **RU:** Оборотный капитал.
- **KK explanation / retained term:** Working Capital — ағымдағы активтер мен қысқа мерзімді міндеттемелер айырмасы; қаржы тапшылығымен теңестірілмейді.
- **UI decision / scope:** Capital labels must state scenario scope; preserve formula and identifiers.
- **Sources:** [S11](#s11). **Status:** `definition-only`.

### G13 · Initial Funding Requirement

- **Meaning (EN):** Cash funding required before receipts and for projected deficits, plus an explicit reserve.
- **Actual formula / model anchor:** `Standalone deficit = max(upfront, 0, -cumulative cash); principal = deficit + reserve. Owner funding or credit covers the same need.`
- **RU:** Потребность в стартовом финансировании.
- **KK explanation / retained term:** Бастапқы төлемдер, болжамды тапшылық және резерв үшін қажетті Initial Funding.
- **UI decision / scope:** Not net working capital; preserve formula and identifiers.
- **Sources:** [S2](#s2), [S11](#s11). **Status:** `scenario-qualified`.

### G14 · Initial Investment

- **Meaning (EN):** Scenario money committed to starting the business; define which assets, expenses and liquidity are included.
- **Actual formula / model anchor:** `Existing startup fields and cash calendar; ownerDraw is financing, not revenue. No universal IRR/NPV implied.`
- **RU:** Первоначальные вложения.
- **KK explanation / retained term:** Бизнесті бастауға салынатын Initial Investment; оның құрамын сценарий анықтайды.
- **UI decision / scope:** V1/V2 startup inputs; preserve formula and identifiers.
- **Sources:** [S2](#s2). **Status:** `scenario-qualified`.

### G15 · Capital Expenditure (CAPEX)

- **Meaning (EN):** Cash spent acquiring qualifying long-lived assets, distinct from recurring operating payments and noncash depreciation.
- **Actual formula / model anchor:** `equipmentPurchase / capex paid upfront in full service; equipmentAmortMonthly is a separate noncash expense.`
- **RU:** Капитальные затраты.
- **KK explanation / retained term:** Жабдықты сатып алуға жұмсалатын CAPEX; айлық Amortization бөлек есептеледі.
- **UI decision / scope:** Equipment / upfront costs; preserve formula and identifiers.
- **Sources:** [S2](#s2), [S3](#s3). **Status:** `verified-scope`.

### G16 · CPC

- **Meaning (EN):** Advertising cost per click; entered forecast parameter or spend divided by clicks.
- **Actual formula / model anchor:** `marketing clicks = budget/cpc; cpc > 0 when budget > 0.`
- **RU:** Цена клика.
- **KK explanation / retained term:** Бір жарнама клигінің құны — CPC.
- **UI decision / scope:** Advertising funnel; preserve formula and identifiers.
- **Sources:** [S8](#s8). **Status:** `verified-scope`.

### G17 · CTR

- **Meaning (EN):** Clicks as a share of ad impressions, expressed as a percentage.
- **Actual formula / model anchor:** `clicks/impressions × 100; model impressions = clicks/(ctrPct/100).`
- **RU:** Кликабельность.
- **KK explanation / retained term:** CTR — көрсетілімдер ішіндегі кликтердің пайыздық үлесі.
- **UI decision / scope:** Advertising funnel; preserve formula and identifiers.
- **Sources:** [S9](#s9). **Status:** `verified-scope`.

### G18 · Advertising Cost Per Forecast Customer

- **Meaning (EN):** Campaign spend divided by the scenario forecast of customers; not full cross-channel acquisition cost.
- **Actual formula / model anchor:** `totalBudget / totalMonth.mDeals; guardedCAC and weightedCAC have declared allocation/reserve scopes.`
- **RU:** Рекламные затраты на прогнозного клиента.
- **KK explanation / retained term:** Болжамды клиентке шаққандағы Advertising Cost; барлық арнаның CAC-ы емес.
- **UI decision / scope:** V1 CPA / V2 CAC inputs; preserve formula and identifiers.
- **Sources:** [S6](#s6), [S8](#s8). **Status:** `scenario-qualified`.

### G19 · Customer Acquisition Cost (CAC)

- **Meaning (EN):** Acquisition spend divided by new customers acquired in the same period, with stated cost and attribution boundaries.
- **Actual formula / model anchor:** `Definition only. Simple V1 accruedTotalCosts/mDeals includes fulfillment and overhead, hence T1.`
- **RU:** Стоимость привлечения клиента.
- **KK explanation / retained term:** CAC — сол кезеңдегі жаңа клиенттерді тарту шығындарының жаңа клиент санына қатынасы.
- **UI decision / scope:** Do not call all operating costs CAC; preserve formula and identifiers.
- **Sources:** [S6](#s6). **Status:** `T1-agreed-label`.

### G20 · Customer Acquisition and Service Cost to the Business

- **Meaning (EN):** Modeled operating expenses plus allocated amortization divided by forecast customers; before turnover tax.
- **Actual formula / model anchor:** `accruedTotalCosts / totalMonth.mDeals; zero-client display uses existing zero convention, not a new estimate.`
- **RU:** Стоимость привлечения и обслуживания клиента для бизнеса.
- **KK explanation / retained term:** Болжамды клиентке шаққандағы Operating Cost; орындау және амортизация шығындары кіреді.
- **UI decision / scope:** User-agreed name, no formula change; preserve formula and identifiers.
- **Sources:** [S6](#s6). **Status:** `T1-agreed-label`.

### G21 · Return on Ad Spend (ROAS)

- **Meaning (EN):** Attributed conversion value divided by advertising spend; declare whether value is revenue or another basis.
- **Actual formula / model anchor:** `V2 revenue/ad; simple V1 mNetRev/totalBudget (T3). No ad spend => existing branch-specific null/zero, never fabricate.`
- **RU:** Возврат рекламных расходов (коэффициент).
- **KK explanation / retained term:** ROAS — жарнамаға жатқызылған құнның жарнама шығынына қатынасы; есептеу негізі көрсетіледі.
- **UI decision / scope:** x, not percentage; preserve formula and identifiers.
- **Sources:** [S8](#s8), [S10](#s10). **Status:** `T3-agreed-label`.

### G22 · Return on Marketing Investment (ROMI)

- **Meaning (EN):** Net marketing contribution after marketing investment divided by that investment; incrementality is a separate attribution assumption.
- **Actual formula / model anchor:** `Simple V1 marketingSpend = mBudget+mgmt; contribution = mRevTotal-mExecutor-mAcq-mTax; ROMI = (contribution-marketingSpend)/marketingSpend × 100.`
- **RU:** Рентабельность маркетинговых вложений.
- **KK explanation / retained term:** ROMI — маркетинг салымына қатысты үлес. Бұл модель өлшенген себептік өсімді емес, сценарийлік болжамды қолданады.
- **UI decision / scope:** Simple non-agent service; preserve formula and identifiers.
- **Sources:** [S7](#s7). **Status:** `scenario-qualified`.

### G23 · Leads

- **Meaning (EN):** Forecast inquiries generated by clicks, not confirmed purchases.
- **Actual formula / model anchor:** `leads = clicks × clickLeadPct/100.`
- **RU:** Обращения / лиды.
- **KK explanation / retained term:** Кликтен кейінгі болжамды өтініштер — Leads; бұлар әлі сатып алушылар емес.
- **UI decision / scope:** Funnel stage; preserve formula and identifiers.
- **Sources:** [S8](#s8). **Status:** `scenario-qualified`.

### G24 · Conversion Rate

- **Meaning (EN):** Share progressing from one explicitly named funnel stage to the next.
- **Actual formula / model anchor:** `clickLeadPct and leadOrderPct; never swap denominators or use a single rate for every stage.`
- **RU:** Конверсия.
- **KK explanation / retained term:** Conversion Rate — нақты көрсетілген кезеңнен келесі кезеңге өткендердің үлесі.
- **UI decision / scope:** Clicks → leads → orders; preserve formula and identifiers.
- **Sources:** [S8](#s8). **Status:** `verified-scope`.

### G25 · Customer Lifetime Value (LTV)

- **Meaning (EN):** Expected customer economic value over the relationship lifetime; assumptions and contribution basis must be stated.
- **Actual formula / model anchor:** `Definition only. No full discounted lifetime-value calculation exists merely because the UI has LTV Factor.`
- **RU:** Пожизненная ценность клиента.
- **KK explanation / retained term:** LTV — бүкіл қарым-қатынас кезеңіндегі клиенттің болжамды экономикалық құны.
- **UI decision / scope:** No new lifetime metric; preserve formula and identifiers.
- **Sources:** [S16](#s16). **Status:** `definition-only`.

### G26 · LTV Factor

- **Meaning (EN):** Existing scenario percentage converting forecast first-service deals into additional package demand.
- **Actual formula / model anchor:** `packs = deals × ltv / 100; retain unit percent and input ID.`
- **RU:** LTV Factor (сценарный параметр).
- **KK explanation / retained term:** LTV Factor — қосымша пакетке сұранысты болжайтын сценарийлік пайыз; классикалық LTV емес.
- **UI decision / scope:** Simple V1 service; preserve formula and identifiers.
- **Sources:** [S16](#s16). **Status:** `scenario-qualified`.

### G27 · Value Added Tax (VAT)

- **Meaning (EN):** Consumption tax modeled separately from VAT-exclusive selling prices and business profit taxes.
- **Actual formula / model anchor:** `netPrice = grossPrice/(1+vatPct/100); priceWithVat = price × (1+vatPct/100); legacy input-VAT convention unchanged.`
- **RU:** НДС.
- **KK explanation / retained term:** VAT (ҚҚС) — тұтынуға салынатын салық; Revenue пен бизнес пайдасына салынатын салықтан бөлек.
- **UI decision / scope:** Model convention, not statutory compliance claim; preserve formula and identifiers.
- **Sources:** [S15](#s15). **Status:** `verified-scope`.

### G28 · Turnover Tax

- **Meaning (EN):** Business tax calculated on the modeled revenue base rather than profit.
- **Actual formula / model anchor:** `tax = revenue × pct/100; simple V1 mTax = mRevTotal × taxTurnover/100.`
- **RU:** Налог с оборота.
- **KK explanation / retained term:** Turnover Tax — модельдегі Revenue негізіне есептелетін салық.
- **UI decision / scope:** Scenario rate, no legal rate changes; preserve formula and identifiers.
- **Sources:** [S1](#s1). **Status:** `formula-qualified`.

### G29 · Profit Tax

- **Meaning (EN):** Business tax on the model-defined nonnegative taxable profit base.
- **Actual formula / model anchor:** `Standalone max(0,overallEBITDA)×pct/100; full service max(0,earningsBeforeTax)×pct/100; branch scopes differ.`
- **RU:** Налог на прибыль.
- **KK explanation / retained term:** Profit Tax — модель белгілеген оң салық салынатын пайдаға есептеледі.
- **UI decision / scope:** Do not unify different tax bases; preserve formula and identifiers.
- **Sources:** [S1](#s1). **Status:** `formula-qualified`.

### G30 · Gross Pay

- **Meaning (EN):** Employee contractual pay before employee withholding; excludes employer-only contributions.
- **Actual formula / model anchor:** `HTML updateEmployerEstimate(): gross = count × grossPerEmployee.`
- **RU:** Начисленная зарплата до удержаний.
- **KK explanation / retained term:** Gross Pay — қызметкерден ұсталатын сомалар шегерілмеген жалақы; жұмыс берушінің қосымша төлемдері кірмейді.
- **UI decision / scope:** Payroll; preserve formula and identifiers.
- **Sources:** [S12](#s12), [S17](#s17). **Status:** `verified-scope`.

### G31 · Net Pay

- **Meaning (EN):** Gross pay less modeled employee withholding, not employer contributions.
- **Actual formula / model anchor:** `gross - employeeSocialWithheld - employeeOtherWithheld - employeeIncomeTax.`
- **RU:** Зарплата на руки.
- **KK explanation / retained term:** Net Pay — қызметкердің салықтары мен ұсталымдарынан кейінгі жалақы.
- **UI decision / scope:** Payroll; preserve formula and identifiers.
- **Sources:** [S12](#s12), [S17](#s17). **Status:** `verified-scope`.

### G32 · Employer Contributions

- **Meaning (EN):** Employer-only mandatory costs paid in addition to gross payroll under entered rates and caps.
- **Actual formula / model anchor:** `employerContributions = gross × contributionRate / 100, with the existing caps; employerMandatoryTotal separately sums these contributions, payroll tax, injury, other mandatory costs and fixed charges.`
- **RU:** Взносы и налоги работодателя.
- **KK explanation / retained term:** Employer Contributions — Gross Pay-ға қосымша жұмыс беруші төлейтін жарналар мен салықтар.
- **UI decision / scope:** No rate/cap changes; preserve formula and identifiers.
- **Sources:** [S12](#s12), [S17](#s17). **Status:** `verified-scope`.

### G33 · Total Employer Cost / Payroll

- **Meaning (EN):** Payroll includes gross salaries; total employer cost adds employer-only mandatory contributions and charges.
- **Actual formula / model anchor:** `employerTotalCost = gross + employerMandatoryTotal; employee withholding is already included in gross.`
- **RU:** Полные расходы работодателя / фонд оплаты труда.
- **KK explanation / retained term:** Total Employer Cost — Gross Pay және жұмыс берушінің міндетті төлемдері; қызметкер ұсталымдары қайта қосылмайды.
- **UI decision / scope:** Payroll; preserve formula and identifiers.
- **Sources:** [S12](#s12), [S17](#s17). **Status:** `verified-scope`.

### G34 · Loan Principal

- **Meaning (EN):** Amount borrowed, distinct from interest expense and agent/principal terminology.
- **Actual formula / model anchor:** `funding.principal; loanDraw inflow, principalRepayment outflow at maturity in bullet loan.`
- **RU:** Основная сумма кредита.
- **KK explanation / retained term:** Loan Principal — қарыздың негізгі сомасы; агенттің Principal ұғымынан бөлек.
- **UI decision / scope:** Bullet financing; preserve formula and identifiers.
- **Sources:** [S13](#s13). **Status:** `verified-scope`.

### G35 · Interest

- **Meaning (EN):** Cost of borrowing according to the entered loan rate and existing model schedule.
- **Actual formula / model anchor:** `interestPerMonth = principal × annualRatePct/1200; monthly until term ends.`
- **RU:** Проценты по кредиту.
- **KK explanation / retained term:** Loan Interest — енгізілген мөлшерлеме бойынша қарыз үшін төлем.
- **UI decision / scope:** No implicit fees / spreads; preserve formula and identifiers.
- **Sources:** [S13](#s13). **Status:** `verified-scope`.

### G36 · Repayment

- **Meaning (EN):** Payment reducing loan principal; may be separate from periodic interest payments.
- **Actual formula / model anchor:** `Standalone principalRepayment occurs at funding.months-1; full service principalDue at maturity.`
- **RU:** Погашение кредита.
- **KK explanation / retained term:** Loan Repayment — негізгі қарызды өтеу; Interest бөлек көрсетіледі.
- **UI decision / scope:** Do not rename bullet schedule annuity; preserve formula and identifiers.
- **Sources:** [S13](#s13). **Status:** `verified-scope`.

### G37 · Loan Term

- **Meaning (EN):** Number of months in the loan repayment schedule, independent of sales horizon.
- **Actual formula / model anchor:** `funding.months / creditMonths; cash calendar continues to maturity.`
- **RU:** Срок кредита.
- **KK explanation / retained term:** Loan Term — қарызды өтеу мерзімі, аймен; сату кезеңінен бөлек болуы мүмкін.
- **UI decision / scope:** Credit; preserve formula and identifiers.
- **Sources:** [S13](#s13). **Status:** `verified-scope`.

### G38 · Cost of Goods Sold (COGS)

- **Meaning (EN):** Cost assigned to the goods or services sold; distinguish from cash spent acquiring remaining stock.
- **Actual formula / model anchor:** `cogs = unitCost × shipped quantity; initialPurchase and stockPurchase are cash inventory payments.`
- **RU:** Себестоимость продаж.
- **KK explanation / retained term:** COGS — сатылған өнімнің құны; қоймада қалған қор үшін төлеммен теңестірілмейді.
- **UI decision / scope:** Products / inventory; preserve formula and identifiers.
- **Sources:** [S3](#s3). **Status:** `verified-scope`.

### G39 · Inventory

- **Meaning (EN):** Unsold goods/materials held for production or sale; movements must respect available quantity.
- **Actual formula / model anchor:** `batchUnits, remaining stock, shipped, initialPurchase; no forced complete sellout.`
- **RU:** Запасы.
- **KK explanation / retained term:** Inventory — сатуға не өндіруге арналған қор; сатылым қалдық қордан аспайды.
- **UI decision / scope:** Goods; not service capacity; preserve formula and identifiers.
- **Sources:** [S3](#s3). **Status:** `verified-scope`.

### G40 · Fulfillment

- **Meaning (EN):** Entered per-order execution/packing/delivery costs; responsibility depends on the contract.
- **Actual formula / model anchor:** `fulfillment = fulfillmentPerOrder × orders; no extra implicit logistics costs.`
- **RU:** Исполнение заказа.
- **KK explanation / retained term:** Fulfillment — тапсырысты орындау, қаптау және жеткізуге енгізілген шығындар.
- **UI decision / scope:** Declared fields only; preserve formula and identifiers.
- **Sources:** [S14](#s14). **Status:** `scenario-qualified`.

### G41 · Dropshipping

- **Meaning (EN):** Supplier fulfills customer demand without the modeled business holding a purchased sales batch.
- **Actual formula / model anchor:** `source=dropship; supplier settlement and direct order costs modeled on demand; preserve enum.`
- **RU:** Дропшиппинг.
- **KK explanation / retained term:** Dropshipping кезінде жеткізуші тапсырысты орындайды; модель алдын ала сатып алынған қойма партиясын талап етпейді.
- **UI decision / scope:** Project contract; ICC does not define this enum; preserve formula and identifiers.
- **Sources:** [S14](#s14). **Status:** `scenario-qualified`.

### G42 · SKU

- **Meaning (EN):** Stable identifier for a portfolio position; user identifiers and names are data, not translated labels.
- **Actual formula / model anchor:** `sku.id / sourceId, SKU / ID in Excel, import mappings.`
- **RU:** SKU / идентификатор позиции.
- **KK explanation / retained term:** SKU — позицияның тұрақты коды; пайдаланушы коды мен атауы аударылмайды.
- **UI decision / scope:** Not a newly standardized inventory measure; preserve formula and identifiers.
- **Sources:** [S3](#s3). **Status:** `project-contract`.

### G43 · Product Mix

- **Meaning (EN):** Portfolio unit or revenue proportions; identify the denominator explicitly.
- **Actual formula / model anchor:** `mix = mixPct/100; revenueWeight = SKU revenue basis/portfolio revenue basis.`
- **RU:** Структура продаж по товарам.
- **KK explanation / retained term:** Product Mix — тауарлар үлесі; дана мен Revenue бойынша үлестер бөлек.
- **UI decision / scope:** No allocation formula changes; preserve formula and identifiers.
- **Sources:** [S4](#s4). **Status:** `formula-qualified`.

### G44 · Shared Costs / Cost Allocation

- **Meaning (EN):** Costs shared across selected positions and assigned using the existing declared allocation basis.
- **Actual formula / model anchor:** `allocateResources / resourceShares; selected beneficiaries; unit/revenue/manual bases retained.`
- **RU:** Общие расходы / распределение затрат.
- **KK explanation / retained term:** Shared Costs таңдалған позицияларға көрсетілген Cost Allocation тәсілімен бөлінеді.
- **UI decision / scope:** Do not double-count costs already in V1; preserve formula and identifiers.
- **Sources:** [S3](#s3), [S5](#s5). **Status:** `project-contract`.

### G45 · Principal / Agent

- **Meaning (EN):** Party providing the underlying service versus an intermediary earning the agreed fee; determine presentation from the actual role contract.
- **Actual formula / model anchor:** `Agent income = agreed commission; principal sales distinct from agent income; internal payer enum partner stays unchanged.`
- **RU:** Принципал / агент.
- **KK explanation / retained term:** Principal қызметті ұсынады, Agent келісілген сыйақыны алады; олардың Revenue көрсеткіштері бөлек.
- **UI decision / scope:** Agency UI; not legal adjudication; preserve formula and identifiers.
- **Sources:** [S1](#s1). **Status:** `verified-scope`.

### G46 · Revenue After Payment-Processing Fees

- **Meaning (EN):** Scenario revenue remaining after modeled acquiring charges, not an unqualified Net Revenue accounting subtotal.
- **Actual formula / model anchor:** `mNetRev = mRevTotal - mAcq.`
- **RU:** Выручка после эквайринга.
- **KK explanation / retained term:** Payment Processing Fees шегерілген Revenue.
- **UI decision / scope:** Simple V1; preserve formula and identifiers.
- **Sources:** [S1](#s1). **Status:** `T2-agreed-label`.

### G47 · Base-Month Profit Before Loan Interest

- **Meaning (EN):** Standalone V2 base-month result after entered business tax but before financing interest; depreciation is not a separate base-month charge.
- **Actual formula / model anchor:** `netProfit = businessEBITDA - tax; projectedCycleNet separately deducts period interest.`
- **RU:** Прибыль базового месяца до процентов по кредиту.
- **KK explanation / retained term:** Салықтан кейінгі Operating Result; Loan Interest әлі шегерілмеген.
- **UI decision / scope:** Standalone V2 base month; preserve formula and identifiers.
- **Sources:** [S1](#s1), [S2](#s2). **Status:** `T4-agreed-label`.

## Verified source references

Accessed 14 October 2026. Definitions are paraphrased, not copied. IFRS is used for accounting distinctions, AMA/Google for metric boundaries, ICC for transport responsibility, CFPB for loan terms. The primary pages do not endorse the calculator or its scenario assumptions. No country tax rates were changed or revalidated as part of L1.

### S1

[IFRS 15 — revenue](https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers/)

### S2

[IAS 7 — cash flows](https://www.ifrs.org/issued-standards/list-of-standards/ias-7-statement-of-cash-flows/)

### S3

[IAS 2 — inventories / cost](https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/)

### S4

[AccountingCoach — margin / markup](https://www.accountingcoach.com/blog/gross-margin-markup)

### S5

[AccountingCoach — gross / contribution margin](https://www.accountingcoach.com/blog/gross-margin-contribution-margin)

### S6

[AMA — CAC](https://www.ama.org/toolkits/ama-customer-acquisition-cost-calculator/)

### S7

[AMA — ROMI](https://www.ama.org/marketing-news/using-return-on-marketing-investment-effectively/)

### S8

[Google Ads — performance definitions](https://support.google.com/google-ads/answer/12851704?hl=en)

### S9

[Google Ads — CTR](https://support.google.com/google-ads/answer/2615875?hl=en)

### S10

[Google Ads — conversion values](https://support.google.com/google-ads/answer/13064207?hl=en)

### S11

[AccountingCoach — working capital](https://www.accountingcoach.com/working-capital/explanation)

### S12

[IAS 19 — employee benefits](https://www.ifrs.org/issued-standards/list-of-standards/ias-19-employee-benefits/)

### S13

[CFPB — loan terminology](https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/glossary/)

### S14

[ICC — Incoterms responsibilities / costs](https://iccwbo.org/business-solutions/incoterms-rules/)

### S15

[OECD — VAT](https://www.oecd.org/en/topics/policy-issues/consumption-taxes.html)

### S16

[AMA — lifetime value](https://www.ama.org/toolkits/ama-lifetime-value-calculator/)


### S17

[AccountingCoach — Gross Pay / Net Pay](https://www.accountingcoach.com/blog/what-is-gross-pay) and [HMRC — payslip and employer deductions](https://www.gov.uk/guidance/check-your-payslip-if-you-work-through-an-umbrella-company). Used for term boundaries only, not for changing any country rates.
