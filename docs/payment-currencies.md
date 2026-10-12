# Actual-payment currencies · task 1

Scope: procurement and import-payment metadata, not an exchange-rate converter.
Base: accepted and merged PR #131, `4f3a7d51e7ba78efeb560710ebff0fec6419dc05`.

The existing business-currency catalogue, default USD, home question and legacy
`currency` field are preserved. `businessCurrency` identifies the model currency;
each `payments` entry records `businessCurrency`, `paymentCurrency`,
`paymentAmount`, `convertedAmount` and its readiness status. V1 also records whether
the payment belongs to the active sourcing/expense branch. Hidden choices persist
without blocking an unrelated branch. Model amounts are
independent from the UI language.

Only an amount already in the business currency is normalized. Zero is zero in
any supported currency. A positive foreign payment has `convertedAmount: null`
and `status: conversion-required`: no rate is invented, obtained or applied.
Empty and invalid values are distinguished from zero. Selecting a currency does
not change the original input. Pending payments prevent final prices, portfolio
results, capital/loan previews, V1→V2 import and price export from becoming ready.

## Economically applicable fields

| Surface | Actual payments | Excluded fields |
| --- | --- | --- |
| V1 resale / dropshipping | Supplier order | Quantities, percentage-based delivery |
| V1 own production / applicable service supplies | Known supply cost or each material price | Aggregate production cost, wages, rent |
| V1 import | Inbound delivery, broker, duties/fees, certification | Insurance percentage, VAT/tax percentages |
| Standalone V2 resale | Delivered supplier unit quote, initial procurement advance | Domestic customer delivery, storage |
| Standalone V2 dropshipping | Supplier order quote, supplier fulfillment/delivery | Own inventory or initial procurement |
| Standalone V2 production | Initial raw-material procurement advance | Aggregate production unit cost |
| Linked V2 | Immutable source payments retained with the accepted V1 SKU | No duplicate selectors on derived unit cost |

An initial procurement advance remains a cash outflow and is not added to COGS a
second time. No financial engine formulas, taxes, funding structures or allocation
rules change. `nomad360_payments.js` adds metadata/readiness only. The V2 adapter
passes a normalized copy to the existing engine; an unconverted amount never
enters it as 1:1 or as a zero expense. V1 has equivalent readiness gates.

## Save / restore

V1 retains original input strings and dynamic-row HTML/positional fields. Payment
metadata is restored after legacy dynamic fields, so old positional arrays do not
shift. Stable material keys prevent collisions when another material is added
after resume. Currency selection also preserves a separate manual delivery quote.
Missing payment metadata inherits the saved business currency,
without changing the saved amount. V2 retains per-SKU metadata in its existing
local draft. Inactive inventory payments remain preserved when switching sourcing
modes, but do not block dropshipping.

The payment selector and new hints/statuses use explicit EN/RU/KK strings.
Amount labels show the selected payment ISO; financial results retain the business
ISO. Switching languages changes neither inputs nor localStorage snapshots.
The historical stage-3 design audit freezes all behavior at stage 2 and is scoped
to design branches; this behavior change is verified by its own Chromium workflow
and the existing finance/navigation/currency workflows.

## Acceptance

- Supported flags and ISO codes come only from `nomad360_currency.js`.
- A new payment defaults to the business currency, including non-USD businesses.
- Separate supplier and delivery currencies persist with the unchanged amounts.
- Positive foreign amounts remain pending without an applied course/rate.
- Prices, capital, credit and exports do not present an incomplete foreign-payment
  model as a valid calculation.
- Legacy drafts, source names, normalized values and finance formulas remain intact.
- Chromium covers RU/EN/KK at 320, 360, 390, 430, 768 and 1280 px, including
  negative/readiness states, save/resume, dynamic rows and overflow.
- Review evidence belongs in `docs/reviews/payment-currencies-review.md`.

## Following work

After user acceptance only: research lawful/stable Google rate access for task 2;
alternative providers require separate agreement. Do not implement a hidden server,
Google HTML extraction, market-rate refresh or automatic exchange spread here.

Tasks 3–5 remain Excel, complete localization and the realistic cotton-shopper demo.
The existing L0–L6 map is [issue #101](https://github.com/KazartsevEV/shelter-partner-directory/issues/101);
the current queue is [issue #119](https://github.com/KazartsevEV/shelter-partner-directory/issues/119).
EN defines professional terminology after formula/source verification; RU is its
checked professional equivalent; KK prose is translated from the agreed RU while
retaining glossary-approved English terms. English terminology does not override
the financial engine. Semantic-key migration and the full glossary are later work.
Help/SEO menu pages and the anonymous bug-report widget are separate future tasks.

Each task requires its own branch, PR, tests, review and user acceptance. GREEN
does not authorize the next task. Merge requires separate explicit permission.
