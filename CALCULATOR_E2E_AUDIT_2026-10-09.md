# Calculator E2E business-logic audit — 2026-10-09

Source gate: `main` 88143f8 before corrections. Audit branch: `audit/calculator-full-e2e-20261009` (PR #20).

## Objective

Assert numerical and commercial validity rather than checking only whether JavaScript returns a value. Run Chrome at a 390px mobile viewport and deterministic Node test vectors with arithmetic oracles independent of calculator implementation.

## Coverage by business route

| Route | Functional/financial E2E | Core independent checks |
|---|---|---|
| Goods → own production | Chromium + deterministic | physical material consumption with defects, KZ payroll charges, warehouse holding 125 days, logistics, ad CPA/CAC, turnover/profit taxes, VAT, discounts, price ceilings, capital reserve, loan interest and principal |
| Goods → wholesale resale | Chromium first journey + deterministic | purchase quantity, cost per SKU, no production/scrap, oversold stock, capital/credit/price effects |
| Goods → dropshipping | Chromium + deterministic | buyer/supplier financing and delivery dates, no warehouse/production, commissions, delayed receipts, repayment |
| Service → offline | Chromium + deterministic | consumables per treatment, rent, master pay and accrual, no scrap/warehouse, appointments capacity, credit/tax and resume |
| Service → online → self | Independent browser oracle | funnel demand, zero demand, one acquiring fee, fixed costs, first-month ramp, VAT-independent turnover tax and total/month cash reconciliation |
| Service → online → hired | Independent browser oracle | full partner revenue, reverse markup gives contractor payout, withholding and profit/cash balance |
| Service → online → agent | Independent browser oracle | 64/64 ownership allocations for six cost types; partner acquisition, dual turnover taxes, partner P&L, agent net cash, full joint cash conservation |
| V2 combined goods/offline services | Deterministic numerical oracle + Chromium | shared rent/payroll and campaign de-dup, stock and capacity limits, credit terms, portfolio tax/VAT, standalone vs upsell vs cross-sell vs tuples, overlap and circular attribution |
| V2 drafts/navigation | Chromium | SKU edits/resume, persisted offer tuples, reimport with an added SKU without losing existing resources, exact beneficiary IDs |

## Numeric reference cases

- Online independent customer funnel: 400 units per month ad spend, CPC 4, click→lead 20%, lead→sale 50%, consultation 100, package 200, package rate 30%. Month-1 original approved double ramp yields gross sales **325**, following months **1,600** each. Three-month gross revenue **3,525**, NOT the old top-summary 4,800 (which ignored the ramp).
- At acquiring 10%, turnover tax 5%, ad 1,200 over the period, and zero further expenses, 3-month owner profit/cash = `3,525 − 352.5 − 176.25 − 1,200 = 1,796.25`.
- If an agent earns 20% and pays the 1,200 advertising budget plus 10% tax on commission, agent receives `705 − 1,200 − 70.5 = −565.5`. The partner receives `3,525 − 352.5 − 705 − 176.25 = 2,291.25`.
- The matrix additionally tests each ownership assignment of ads, marketing management, site, hosting, domain and lead magnet; the sum of partner + agent cash must equal gross partner revenue less acquiring, both entity taxes and all genuine external payments, with no duplicated costs.
- In V2, a salon with 10 treatments, fixed rent 300, per-procedure materials 5, plus 10 drop-shipped units costing 20 and ad budgets 100+100 has independent physical costs of `300 + 10×5 + 10×20 = 550`; each 40% cross-sell attach adds four creams and their variable contribution without a second CAC.
- With 12-month amortization assumptions, site and lead-magnet purchases are paid up-front in cash but are amortized into the income statement over at most 12 months. A 24-month forecast cannot write off the same asset twice.

## Defects identified and corrected in PR #20

1. **Phantom sales without advertising**: `Math.max(..., 0.1)` synthesized conversions even with zero leads. Corrected to a zero floor.
2. **Double acquiring**: commission was subtracted from net receipts and charged again in EBITDA. Exactly one booking of the fee is now enforced.
3. **Top summary ≠ monthly table**: summary used an un-ramped forecast whereas monthly cash flow used the explicitly approved first-month ramp. Single monthly accumulation now drives both results.
4. **CAPEX counted as EBITDA costs, plus amortization**: site and magnet cash investment is separated from OPEX. Period P&L includes only the amortization applicable to that period (capped at 100% of original asset cost).
5. **Unsafe online parameters**: reject out-of-range conversions, percentages, CPC with ad spend but no clicks, negative amounts and noninteger/invalid monthly terms instead of outputting misleading profit.
6. **V2 reimport lost work**: adding another V1 SKU previously erased valid shared resources and offer tuples. Exact ID-based subset preservation now retains live portfolio mappings, without leaking mappings to unknown new IDs.
7. **Offline warehouse attribution**: V2 disallows assigning warehouse capacity or rent to an offline service and removes such beneficiaries from warehouse UI.

## Known functional gap — not green

**V2 cannot currently import online self/hired/agent services.** Its linked adapter accepts goods and offline services only; the V1 online service engine is still standalone. Tracked as [issue #21](https://github.com/KazartsevEV/shelter-partner-directory/issues/21). Do not claim all-service portfolio E2E completion.

Full empirical Market Basket Analysis (transaction histories, support/confidence/lift and independent bundle discounts) remains in [issue #19](https://github.com/KazartsevEV/shelter-partner-directory/issues/19).

## Scope

No payment/checkout or downstream payment-provider integrations were changed. Static GitHub Pages publication is separately gated by Pages Actions after the tested merge.
