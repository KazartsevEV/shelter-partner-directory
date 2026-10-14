# Cotton tote · Kazakhstan · V1 demonstration

Working case for task 5, reviewed 14 October 2026. Base: `4af9cbde`, after accepted localization #135. The United States is excluded by the owner's instruction. Country and financial currency: Kazakhstan / KZT. This document records inputs before changing the demonstration. Calculations use the existing V1; no financial formula is changed.

## Case and physical plan

Hypothetical small workshop in Almaty. A plain, unbleached cotton tote, approximately 38 × 43 cm, with two handles made from the same fabric; no print, lining or zipper. One production batch, **500 saleable bags**. Planning rejection rate **3%** requires **516 material kits**. No repeat production is assumed automatically.

Fabric benchmark: local supplier Tehnoart offers 100% cotton, 220 g/m², 1.6 m wide, in 100 m bales, at **1 000 KZT per linear metre**. The 900 KZT rate applies only from 500 m and is not used. Purchase budget: two 100 m bales. Planned fabric per kit: **0.3876 m**, including layout/cutting allowance; 516 kits allocate 200.0016 m. The 0.0016 m excess is rounding, not a claimed supplier quantity. Prototype consumption and rejection rate require validation; both are scenario assumptions.

| Input | KZT / value | Evidence status |
| --- | ---: | --- |
| Fabric per metre | 1 000 | Published local benchmark [S1]; no purchase contract claimed |
| Fabric per raw kit | 0.3876 m | Scenario cutting plan; includes handles and cutting allowance |
| Thread per kit | 25 | Scenario budget |
| Label per kit | 40 | Scenario budget |
| Paper packaging per kit | 50 | Scenario budget; includes packaging wasted on rejected kits conservatively |
| Delivery of materials per kit | 50 | Scenario budget, separate from material price |
| Production employee | 1 | Scenario: 20 working days × 8 h; 18 minutes per attempt, 516 attempts = 154.8 h |
| Employee gross pay per production month | 230 000 | Scenario salary; not presented as the market median |
| Production premises per month | 80 000 | Scenario rental budget for the production month |
| Sewing machine/table/iron rental package per month | 25 000 | Scenario rental budget; no equipment purchase, depreciation or unfinanced CapEx |
| Other production overhead per month | 15 000 | Scenario maintenance, consumables and insurance budget |
| Electricity | 40 KZT/kWh × 0.15 kWh/attempt | Scenario tariff and consumption; heating included in premises budget |
| Finished-goods receiving per bag | 20 | Scenario budget |
| Storage per bag per day | 0.50 | Scenario marginal storage budget while stock remains |
| Customer delivery | Buyer pays separately | Product-only receipts/costs; delivery is not silently paid by the business |
| Sales/customer-service contractor per month | 60 000 | Scenario; outsourced work, no second production employee |
| Advertising per month | 250 000 | Scenario test budget |
| CPC / CTR / click-to-lead / lead-to-sale | 100 / 2% / 20% / 30% | Unvalidated demand assumptions, not observed market performance |
| Advertising management per month | 50 000 | Scenario contractor budget |
| Supply / advance / production | 7 days / 50%, 3 days before receipt / 30 calendar days | Scenario schedule |
| Funding buffer | 10% | Scenario liquidity reserve; not a tax-deductible expense |
| Loan | 20% annual, 6 months, interest monthly, principal at maturity | Scenario contract matching existing V1 bullet model; not a bank offer or annuity |
| Target net margin / minimum / maximum discount | 20% / 10% / 10% | Scenario pricing goals; they do not prove willingness to pay |

Monthly funnel: 2 500 clicks, 125 000 impressions, 500 leads, **150 projected orders**; one bag per order. This is a demand hypothesis. The stock is not sold in the first month or automatically because financing lasts six months. Sales begin on day 37; at the assumed constant rate, the last sale is day 137. The cash horizon is five calendar months; the default credit horizon is six. Separate 1/3/12-month checks must expose remaining stock, premature debt repayment and zero sales after depletion.

## Tax scope and model boundaries

Scenario taxpayer: a Kazakhstan LLP on the general regime, registered for VAT. **Output VAT 16%**, **corporate profit tax 20%**, from the Ministry of Finance [S2–S3]. VAT registration is an explicit assumption, not a claim that every small workshop must register.

Procurement assumption: domestic purchases from general-regime suppliers who are not VAT payers; no recoverable input VAT. The market benchmark [S1] does not establish the seller's tax status. The form therefore records material VAT as not applicable (0%). No refund or input credit is invented. If the actual seller issues a VAT invoice, the existing goods model's input-VAT treatment needs separate assessment before using the demo as that purchasing case.

Kaspi Gold/QR payment benchmark: **0.95% of the customer payment**, updated 1 October 2026 [S4]. V1 variable fees apply to VAT-exclusive revenue. To preserve the same actual fee with output VAT 16%, use **1.102% = 0.95% × 1.16** in the model and explain this normalization beside the demo. It is not an extra fee, marketplace commission, installment campaign tariff or currency spread.

V1's accepted KZ employee estimator applies **17.5% of gross** (5 + 3 + 3.5 + 6), without statutory tax-base adjustments. For the assumed 230 000 gross it displays 40 250 employer charges and 270 250 total. These are the **existing model's planning amounts**, not a statutory payroll declaration. Sources [S5–S7] specify different bases and limits; independently compare them and retain the variance in the review rather than calling the flat 17.5% exact. Employee deductions are part of gross and must not be added again as an employer expense. The existing production rejection uplift is also a budget allocation, not a second payroll invoice.

All model taxes remain planning amounts on the V1 calendar, not a representation of statutory filing or deposit dates. Prices from V1 must be reported as calculated prices and compared with market references; advertising conversion at that price is still unverified. Available Cash includes financing cash flows and is not personal income or accounting profit.

## Sources

All sources observed 14 October 2026. Store only a short factual extract/provenance in the review; do not copy whole commercial pages.

- **S1:** [Tehnoart · cotton double-thread fabric](https://tehnoart.kz/p129436598-tkan-dvunitka-surovaya.html): 1 000 KZT/m, 100% cotton, 220 g/m², 1.6 m width, 100 m bale; 900 KZT/m only from 500 m. Published benchmark, not stock/quality/VAT confirmation by the supplier.
- **S2:** [Ministry of Finance / KGD · VAT changes in 2026](https://www.gov.kz/org/kgd/press/news/details/1128796): ordinary VAT rate 16%; input-credit rules are separate.
- **S3:** [KGD · new Tax Code Q&A](https://www.gov.kz/org/kgd/press/article/details/232086): ordinary corporate income tax 20%, social tax 6% with defined exceptions.
- **S4:** [Kaspi · payment acceptance tariffs](https://guide.kaspi.kz/partner/ru/pos/conditions/q3567): Kaspi Gold/QR 0.95%; different products/categories have different fees.
- **S5:** [Kaspi · employee taxes on the general regime, 2026](https://guide.kaspi.kz/partner/ru/tax/conditions/general-mode/q2759): employer pension/medical rates and employer social-tax base after employee deductions.
- **S6:** [Government · employer pension contributions](https://www.gov.kz/situations/332/1464): 3.5% in 2026 for applicable employees born after 1 January 1975. Assume the employee is in that category (born in 1990), works a complete month and has ordinary salary only.
- **S7:** [State Social Insurance Fund · employee contribution base](https://gfss.kz/ru/плательщикам-социальных-отчислений/работодатели/): 5% of the prescribed base after mandatory employee pension contributions and statutory excluded income, subject to minimum/maximum bases. Primary fund guidance.

- **S8:** [Ademi-Ai · Kazakhstan cotton tote](https://ademi-ai.kz/aksessuary/shopper_kazahstan): advertised 4 500 KZT, 100% cotton, designer print. A dated price comparator, not an identical specification or validated demand for this demo.

## Independent reconciliation · 14 October 2026

`tests/shopper_v1_oracle.cjs` derives quantities, pricing and a daily transaction ledger without importing application code. Its checks against the actual V1 cover every monthly inflow, outflow, tax, interest, principal, cumulative balance and reserve. These are scenario results in KZT, not forecasts supported by observed orders.

| Result | Own funds | Six-month loan |
| --- | ---: | ---: |
| Materials including inbound · batch | 285 141.60 | 285 141.60 |
| Production · batch | 405 412.37 | 405 412.37 |
| Receiving + declining-stock storage · batch | 22 500.00 | 22 500.00 |
| Allocated COGS per saleable bag | 1 426.11 | 1 426.11 |
| Advertising CAC | 1 666.67 | 1 666.67 |
| Cycle budget before reserve | 1 913 053.97 | 1 913 053.97 |
| Protected reserve | 191 305.40 | 191 305.40 |
| Total initial funding | 2 104 359.37 | 2 104 359.37 |
| V1 buyer price including VAT | 5 177.20 | 5 871.47 |
| Price-list range before maximum 10% discount | 6 278.59–7 340.62 | 6 906.45–8 074.69 |
| Profit of full active-sales month after model tax | 70 537.56 | 113 508.75 |
| Actual base-month net margin | 10.54% | 14.95% |
| Model profit tax over the cash horizon | 58 781.30 | 89 914.27 |
| Total loan interest | 0 | 210 435.94 |
| Final bank balance including financing flows | 2 339 484.56 | 289 511.77 |
| Balance available after protecting reserve | 2 148 179.16 | 98 206.38 |

**Price distinction:** the existing V1 base-price calculation and its price-list range are separate contracts. Cash Flow uses the displayed V1 buyer price, excluding the VAT pass-through; it does not silently substitute the range maximum. The price-list range separately includes shared costs and minimum/target net-margin constraints with maximum discount. A target of 20% in the form does not make the base-month margin 20%. Financing raises the calculated customer price; equal funnel assumptions at two different prices require separate demand validation.

Both calculated buyer prices exceed the 4 500 KZT comparator [S8]; the products are not identical. This exposes the need to test pricing and acquisition costs. Costs and funnel inputs have not been tuned to make the offer competitive or guarantee profit. At 4 500 KZT gross and the same assumed 150 monthly sales, the operating result before profit tax and interest is only approximately 1 567.86 KZT; loan interest would exceed it.

**Funding distinction:** the own-funds final balance includes the original 2 104 359.37 contribution. The cycle's net cash surplus excluding that contribution is 235 125.19. Recovering the entire original contribution while retaining the protected reserve leaves 43 819.79 available; the first monthly checkpoint permitting this is month 5. Neither 2.34 million nor 2.15 million is called profit. The credit balance is after full principal repayment at month 6; 98 206.38 is available after the reserve.

### Inventory and monthly money · own funds

| Month | Sales | Remaining allocated bags | Trading receipts, ex VAT | All payments, incl model tax | Available closing balance after reserve |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | 500 | 0 | 595 957.75 | 1 317 096.22 |
| 2 | 115 | 385 | 513 257.00 | 404 860.76 | 1 425 492.46 |
| 3 | 150 | 235 | 669 465.65 | 389 661.90 | 1 705 296.20 |
| 4 | 150 | 85 | 669 465.65 | 387 411.90 | 1 987 349.95 |
| 5 | 85 | 0 | 379 363.87 | 218 534.66 | 2 148 179.16 |

Month 1 stock is allocated/in production, not 500 ready bags in the warehouse. Production finishes on day 37. By month 3 only 265 of 500 bags have been sold; month 12 creates no additional production or orders. The complete loan ledger and 1/3/12-month term tests are in the browser protocol. Short bullet loans expose a negative balance before stock sells; this is not clamped to zero. Extending the loan to 12 months adds interest, not sales.

### Independent payroll comparison

For the assumed regular-salary employee, with no special income exclusions and no contribution cap reached: employee pension withholding 23 000, medical withholding 4 600; employer pension 8 050, medical 6 900, social insurance 10 350, social tax 12 144. Illustrative employer charges: **37 444**, compared with the unchanged V1 planning estimate **40 250** (difference **2 806**). The scenario deliberately budgets the V1 amount and labels its approximation. It does not claim statutory payroll precision; employment category, excluded income, applications and applicable limits must be verified in an actual payroll process [S3, S5–S7].

The manufacturing model allocates fixed cost through a 3% rejection uplift; its 405 412.37 budget is not a statement that a second payroll or rental invoice is paid. Gross salary already includes employee deductions. No second salary, depreciation, bank spread or platform fee is added automatically.

### Calendar and compatibility boundaries

- This is one finite production/sales campaign. Premises, equipment rental and production employee are budgeted for the production period. Sales/marketing contractors and media run only during the modeled selling interval. No continuing twelve-month workshop overhead, recurring sales or repeat manufacturing is invented.
- Profit tax in V1 is assessed on positive monthly model profit without annual loss carryforward. Actual Kazakhstan filing/payment calendars and deductions can differ; the demo retains the accepted engine and does not represent a tax return.
- Output VAT is shown in buyer prices and excluded from the operating cash ledger as pass-through. The ledger does not track an actual VAT settlement account. No input VAT credit is claimed in this scenario.
- Normal URLs remain empty unless the user requests restoration. Demo URLs do not overwrite a personal save. A saved copy is tested through the existing public V1 save/restore functions after leaving demonstration mode; this is not a new “save demo” UI feature.
- Old drafts without a currency restore as USD with their original numbers. The existing two-SKU `second=shirt` path stays a historical regression fixture and is not advertised as the new realistic case.
- V1→V2 retains KZT and model values. A KZT demo cannot overwrite an existing USD V2 portfolio; the currency guard is preserved.
- The full downloaded HTML includes this scenario and all local scripts. Source documentation uses an absolute GitHub link so moving the file does not break it. XLSX is tested against V2 values; Excel Desktop manual inspection is not claimed.

## Required independent reconciliation

Acceptance checks compare material budget and purchased lengths, production budget and rejection uplift, each monthly payment, VAT-exclusive/gross prices, fees, profit tax, reserve, original capital, credit interest/principal, monthly sales and remaining stock. Check both cash and credit, 1/3/12-month checkpoints/terms, V1→V2, saving/restoring, exports, RU/EN/KK and six widths. Financial engine code remains protected.
