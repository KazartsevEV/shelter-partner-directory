# US-RETAIL-DEMO-12M · Worcester household gifts / accessories

**Scope:** separate opt-in educational example in the **existing Nomad360 standalone V2**, not a new financial engine, a new market study or a change to existing V1/V2 defaults. All retail and staffing values below are explicit **hypotheses**; no real store has been surveyed. Prepared 2026-10-17.

## Open the real calculator
- On this development branch, open `Marketing_calc.HTML?demo=us-retail-12m` locally or on an equivalent branch preview with its dependent scripts. This query explicitly opens the editable **real V2** with the example loaded.
- Or open the usual `Marketing_calc.HTML` and click “Открыть учебный магазин США · 12 месяцев” under the selling-mode chooser.
- Edit any fields; **+ Новый портфель** empties the example. Study changes save only to `marketingCalcPortfolioV2USRetailDemo` and **never overwrite** a visitor's `marketingCalcPortfolioV2` personal draft. The original blank V2 and Kazakhstan cotton shopper remain unchanged.
- The browser-only file works with the local companion scripts. GitHub's `blob/main` view is **source code, not a functioning calculator preview**. Do not claim the branch is published to Pages until a production deploy is accepted.

## Scenario
Location: Worcester, Massachusetts. Currency USD. Twelve forecast months, starting conceptually November 2026; actual V2 does **not** encode calendar start dates or seasonal month-specific demand.

- 10 SKU: two in-house handicrafts (gift box and engraved keepsake), six purchased household retail lines (blanket, basket, kettle, lamp, desk organizer, ceramic serving set), two supplier-direct accessory lines (vacuum filters, repair adapter kit).
- **1,800 planned orders over 12 months**, with 150/month from the existing V2 marketing funnel: $1,800/month shared media plus a separately earmarked $300/month craft campaign; CPC $1.05, CTR 2.4%, click-to-lead 30%, lead-to-order 25%. These conversions are illustrative and optimistic; V2 does not verify demand.
- All SKU costs, margins, per-order fulfillment, 2.7% acquiring fees, warehouse costs, advance stock purchases, stock-days and unit mix are in [model.json](model.json). Sales mix is 20% own, 62% resale and 18% dropship by units.
- All inventory SKU batches equal the **full twelve months of forecast demand**; no mid-year restocking is modelled. The 25% advance is part of SKU inventory COGS, not an additional second expense. Dropship has no warehouse stock or advance.
- 14 standalone resources including two leases, store associate, part-time stockroom worker, paid craft labor, outsourced marketing manager, rented shop equipment, **one-time** tool purchase, insurance, utilities, website, domain, warehouse and a *separately named* extra marketing campaign. Workshop/team/stockroom usage and capacity are modelled in homogeneous **hypothetical hours per representative month**, not an hourly payroll engine or a calendar rostering service.
- Funding: `credit`, model-calculated borrowing, 11.5% illustrative APR, 12 months, 10% reserve, interest monthly and the **entire principal repaid in month 12**, not an annuity.
- Sales Tax: **6.25%**, manually selected, all products assumed taxable and sold to Massachusetts customers. Massachusetts DOR: <https://www.mass.gov/guides/sales-and-use-tax> (updated May 7, 2026, 6.25% general rate). Taxability/exemptions/nexus are deliberately **not adjudicated** by this example. State and federal profit tax rates are left at **0% as unmodelled inputs**, NOT a representation of actual liability. Payroll employer costs are illustrative all-in budgets.

## Engine-observed baseline (before visual owner acceptance)

The canonical inputs were run through **the repository's actual `PortfolioV2Engine.build`**, without replacing financial formulas. At the draft fixture date:
- 10 valid items, 14 resources, 12 months, 150 model orders/month, 1,800/year.
- Net product revenue (12 months, before collected sales tax): **$357,485.79**.
- Separate transit Sales Tax projection: **$22,342.86** aggregate, buyer payments **$379,828.65**. These are per-portfolio full-precision projections; exact invoice-by-invoice rounding is not modelled.
- Model-sized loan principal **$45,232**, bullet repayment at month 12; reserve **$4,112**.
- Model final cumulative cash balance **$45,413.03**, before subtracting reserve; model available cash after reserve **$41,301.03**.
- These **model outputs are not an independent audited income statement**. The separate Node and Chromium tests verify the active model and independent arithmetic control of the 6.25% pass-through.

## Important model limitations

1. V2 repeats one baseline monthly funnel; no true November/December Christmas demand peak is simulated. The calendar month names are narrative assumptions, not engine data.
2. The separate Sales Tax projection must not be mistaken for a state filing/account-payable ledger. **Standalone V2 intentionally does not fabricate a monthly tax invoice schedule from cash timing**. The original financial Cash Flow remains net of transit Sales Tax.
3. One-time tool purchases are treated by the current V2 cash/EBITDA logic; this does **not** imply formal depreciation, CapEx accounting or complete US GAAP.
4. No additional new taxes, payroll tax engine, tax exemptions, SKU-specific rates, supplier restocking, seasonal multipliers or missing V2 features have been invented.
5. Excel price list remains **the existing V2 Excel price list**, not a newly requested full financial-model spreadsheet. No Excel changes are part of this task.

## Verification and release gates

- `node tests/us_retail_demo_v2.test.cjs` validates the saved JSON equals actual embedded study data, the existing engine builds twelve months, resources are paid once, customer tax is independent of profit and credit follows the existing bullet schedule.
- `node tests/us_retail_demo_v2_browser.cjs` opens the **actual HTML and real V2** under Chromium with a pre-existing personal draft, verifies its isolation, makes screenshots at 390/1280 px and checks clear/EN routing.
- Corresponding CI: `.github/workflows/us-retail-demo-v2.yml`. Green CI and owner visual acceptance are required **before merge**. No changes to `main` or published Pages without explicit approval.
