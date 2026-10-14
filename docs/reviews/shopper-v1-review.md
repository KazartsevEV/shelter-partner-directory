# Task 5 · cotton tote in real V1 · review

14 October 2026. Base `main` / `4af9cbdebc902f2c9277fa1cc1c56319fb38a648`, after accepted localization #135 and task-map #138. Branch `feature/shopper-v1-realistic`. **Implementation presented for review; not accepted, not merged.** TYPE-02 and tasks 6–9 have not started. CI status will be recorded here after verification on the published HEAD.

## Result

The existing `Marketing_calc.HTML?demo=shopper&finance=cash` and `finance=credit` URLs now populate the real V1 with one dated Almaty cotton-tote campaign in **KZT**. The United States/Oregon is excluded by the owner's instruction. The scenario uses Kazakhstan **VAT 16% and corporate profit tax 20%**, not US sales tax.

Four material rows, rented equipment, one production employee, rejection allowance, inbound and declining-stock storage, outsourced sales/support, Kaspi payment acceptance, advertising funnel, funding, tax and pricing are filled through existing public form/event handlers. The banner explains assumptions, payment-fee normalization, tax limits and demand uncertainty in RU/EN/KK. No decorative substitute calculator is introduced.

[Inputs, dated sources, complete financial reconciliation and limits](../demos/shopper-v1-assumptions.md). Material, tax and acquiring references are verified benchmarks; other prices, production yield, schedule and funnel are explicitly assumptions. Procurement VAT status is a scenario assumption, not an assertion about the fabric supplier.

## Independent results · KZT

| Result | Own funds | Loan |
| --- | ---: | ---: |
| Raw kits / saleable stock | 516 / 500 | 516 / 500 |
| Funnel orders per active month | 150 | 150 |
| Material batch including inbound | 285 141.60 | 285 141.60 |
| Production budget | 405 412.37 | 405 412.37 |
| Allocated unit COGS | 1 426.11 | 1 426.11 |
| Initial funding including reserve | 2 104 359.37 | 2 104 359.37 |
| Protected reserve | 191 305.40 | 191 305.40 |
| V1 buyer price including VAT | 5 177.20 | 5 871.47 |
| Price-list range before 10% discount | 6 278.59–7 340.62 | 6 906.45–8 074.69 |
| Net profit of full active month in model | 70 537.56 | 113 508.75 |
| Net margin of that month | 10.54% | 14.95% |
| Horizon / selling ends | 137 days / day 137 | 180 days / day 137 |
| Final cash after reserve | 2 148 179.16 | 98 206.38 |

The own-funds balance includes the original contribution; it is **not profit**. Excluding initial funding, net cash surplus is 235 125.19. Recovering all original funding while keeping reserve leaves 43 819.79; the first qualifying monthly checkpoint is month 5. The loan case repays principal at month 6; different calculated buyer prices mean the two net margins are not a same-price financing comparison.

At months 1 / 3 / 12, modeled total sales are 0 / 265 / 500. Month 1 includes stock allocated/in production; production completes on day 37. Remaining allocated bags: 500 / 235 / 0. Loans of 1, 3 and 12 months keep total sales at 500. Early repayment exposes a cash shortfall; after depletion there are no invented receipts. Production/equipment/marketing activity is a finite campaign, not a year of automatically repeated business.

## Checks

- `tests/shopper_v1_oracle.cjs` has explicit dated inputs, no application imports, and folds daily transactions into monthly payments. Fees are independently calculated from VAT-inclusive customer payments; V1's equivalent ex-VAT rate is checked.
- The browser compares every monthly inflow, outflow, tax, interest, principal, financing inflow, accumulated balance and reserve against that oracle. Unit COGS, initial capital, prices, monthly profit and price-list boundaries are also independently reconciled.
- Local dedicated matrix: **36 cases** (cash/credit × RU/EN/KK × 320/360/390/430/768/1280), complete stage screenshots at 320/390/1280, three loan-term controls, six actual XLSX downloads read by ExcelJS, native PDF, downloaded embedded edition, save/restore, old save without currency, zero-demand and empty-page states.
- Financial amounts are checked with DOM Range for line breaks inside numbers; page overflow, invalid populated inputs, localization markers and visible untranslated messages are checked separately.
- Personal saved calculations are generated through the real V1 serializer before opening the demo and must remain byte-for-byte intact. A copy saved after leaving demo mode restores all dynamic rows, inputs and results. The original demo URL still blocks writing over personal saves; no new “save demo” action is claimed.
- Local broader localization: **486 scenarios**, plus **54 acceptance cases**, no visible translation gaps or page overflow. Existing aliases and economic meanings are preserved. One previously untested profit-tax field label is mapped using the existing `Profit Tax` terminology; no T1–T4 decision is reopened.
- Financial AST/pure-module guard remains against accepted Excel baseline `9e5a7f51`. Only explicit demo initializer functions are additionally exempted; financial functions, arithmetic and engine files remain protected. Deterministic localization census is regenerated for the changed HTML/core.
- Existing quantity-error checks use 516/500 instead of 106/100; the second-SKU probe preserves the new first SKU's 60 000 sales contractor and 50 000 management budget. The linked-V2 test now confirms rejection against an existing USD portfolio before testing import into a separate KZT portfolio. Assertions are retained.
- The historical `second=shirt` two-SKU fixture stays unchanged. Normal URLs remain empty; older drafts and historical calculated values remain supported.

Dedicated CI: `.github/workflows/shopper-v1.yml`; numerical/XLSX/HTML/loan-control artifact and separate RU/EN/KK screenshot artifacts, 14-day retention. Permanent review evidence will be linked below after the published run is examined. Screenshots are genuine Chromium captures of real controls and results.

## Limits for acceptance

The published fabric benchmark is not a binding purchase offer. Salary, rent, packaging, contractors, electricity, reject rate and demand remain scenario assumptions. The 4 500 KZT Ademi-Ai comparator is a different printed cotton product; it does not validate demand for the higher calculated demo prices. Inputs have not been tuned to manufacture an attractive profit.

KZ employer charges stay at the accepted V1 flat planning estimate: 40 250 for gross 230 000. An independent ordinary-salary comparison with prescribed bases gives 37 444, a difference of 2 806. This limitation is explicit in the scenario/UI. The protected model is not silently changed into a statutory payroll calculator.

V1 output VAT is shown in buyer prices and treated as pass-through, without a VAT settlement account. No input tax credit is invented. Profit tax follows positive monthly model profit, without annual loss carryforward; the model calendar is not Kazakhstan's filing/payment calendar. The detailed assumptions explain the distinction between base V1 buyer price and the separate price-list range. A 20% pricing target does not guarantee the displayed base-month margin.

Microsoft Excel Desktop manual inspection is not claimed. The existing Excel/LibreOffice CI remains part of regression. Thirteen historical online-import failures remain a separate debt; this task does not close or include them as successful tests. Historical visual workflow skips, if any, will be reported separately from working GREEN jobs.

**Stop after task-5 review. No merge or next-task implementation without user acceptance and separate merge authorization.**
