# Marketing Calculator — 31F: Pooled Campaigns and Full-Period Economics

Status: SPECIFICATION / DoD LOCK CANDIDATE (no production implementation in this change).
Scope: existing V1 goods and services + linked V2 only, before checkout.
Parent development issue: #31.
Baseline at authoring: main 156d243068076275af1b858789246a8a29967cd4, #37/#38 merged.

## 1. Required outcome

For one explicitly approved time horizon and set of V1 source contracts, V2 must compute one self-consistent scenario from:
V1 inputs -> common paid acquisition -> independent demand -> attached/bundled demand ->
availability and capacity -> fulfilled quantities -> net sales and costs -> monthly P&L ->
whole-period profit and margin -> chronological financing/cash -> price feasibility.

No parallel pricing, demand and cash models may imply incompatible numbers.
A positive result in an isolated test does not override any failed invariant.

### Preserved boundaries
- Do not mutate V1 source inputs, approved price bounds or separate branches.
- Supported categories: own manufacturing, resale, dropship, offline service, online self/hired/agent.
- Preserve V1 contractor-versus-owner payers, VAT rates, turnover/profit taxation, commissions,
  acquisition, logistics, storage, reserves, supplier prepayments, staff, premises, capex,
  depreciation/amortization, financing, stock and service capacities.
- Existing cross-sell, upsell, bundle, historical MBA, discounts and resource replace-offsets survive.
- Never change checkout or postpayment logic, website SEO, media, unrelated UI or site pricing.
- Default 1-month V2 and single-SKU V1 parity remain regression-protected.

## 2. Time and source of truth

- H = approved 1..120-month operating forecast (explicit recurringDemandApproved for H>1).
- H_cash = max(H, contracted last payout, interest and debt repayment date, required
  startup/supplier payment), independently displayed. No receipt or payment may be
  forcibly moved to the final visible month.
- Monthly period = 30 scenario days as already defined by calculator; boundaries are
  stable and disclosed, not silently switched to varying calendar months.
- V1 first-month acquisition funnel (CPC, CTR, lead conversion, deal conversion,
  externally funded acquisition if applicable) is the calibration baseline.
- Repeating the monthly V1 demand after month 1 is a named scenario assumption,
  never presented as observed history or guaranteed orders.
- V1 online period provenance is authoritative. An H beyond verified online source
  months is rejected, not extrapolated.
- The same SKU, resource, offer and payer IDs must be used in monthly revenue,
  allocations, period P&L, tax and cash ledgers.
- Retained physical inventory at H is an unsold ASSET and liquidity exposure, not
  automatically COGS, sales, depreciation or liquidation income.

## 3. Pooled media: business contract

### 3.1 Owner-funded media budget conservation

For each period m:
  owner_paid_media(m)
    = SUM_i retained_individual_media(i,m)
    + SUM_c actual_owner_paid_campaign(c,m).

When campaign c replaces old V1 advertising via pool=adBudget:
  retained_individual_media(i,m)
    = original_V1_owner_ad(i,m) - approved_includedBySku(c,i,m),
  with exact no-negative and no-double-deduction checks.

When pool=none, the campaign is incremental and cannot silently replace old CAC.
Campaign management fees, staff and creative production are separate operating
cost objects, not implicitly included twice in the media budget.
If external partner pays, do not include the partner spend in owner's cash costs;
preserve independently verified partner-driven demand.

### 3.2 Time/cadence, active beneficiaries, idle spend

- A monthly committed campaign is payable for each explicitly selected forecast
  month (unless an actual cancellation/contract end has been explicitly set in
  the calculator). Never silently cancel a committed bill when a SKU sells out.
- A once-only campaign is paid once, credited to acquisition only in its actual
  active period; it must not turn into a recurring campaign or capex.
- Eligibility for allocation depends on actual product stock/arrival, service
  available capacity, source contract period, and constraints in that month.
- A sold-out SKU gets ZERO new allocated media/demand. A different eligible SKU
  may get a larger share only under the approved revenue/usage allocation rule.
- If there are no eligible beneficiaries, the actual committed payment remains
  a visible **unattributed/idle campaign expense**; attributed units and
  conversions are zero. Neither expense disappearance nor phantom sales is allowed.
- Advertising paid while stock is unavailable must still be expensed if the
  payment contract requires it; no fictional delayed backorders.
- Changing the campaign schedule, allocation policy or amount recalculates
  affected sales, feasible baskets, price, profit, tax and cash consistently.

### 3.3 Allocation policy and causality

For each campaign c and month m:
  allocated_media(c,i,m) = paid_campaign(c,m) * w(c,i,m);
  SUM over eligible i of w(c,i,m) = 1 when a positive eligible denominator exists.

- Revenue allocation weights use current-month expected realized revenue
  **exclusive of VAT and after discounts**, not historical lifetime total.
- Usage allocation weights use the real configured usage/units and current-month
  demand. A fixed usage value cannot preserve an allocation to an inactive SKU.
- If the denominator is zero, all allocated shares are zero and expense becomes
  unattributed; never divide by zero or fabricate a fallback beneficiary.
- The revenue-weighted loop may be nonlinear (price affects allocation; media
  affects independent demand; offers affect revenue). Solve as one deterministic
  fixed point with explicit convergence or reject the scenario.
- Fixed-point results are independent of SKU/resource iteration order; no
  silent fallback to priceMax or arbitrary final allocation.
- Allocation explains a real media payment. A shared campaign is NOT a second
  advertising acquisition on top of an already included V1 media spend.
- Only verified V1 funnel ratios determine incremental independent conversions;
  no invented organic growth, arbitrary ROAS, price elasticity or automatically
  improved CPC/CVR from consolidation.
- An organic/partner-funded baseline with owner ad=0 stays as verified;
  it cannot be scaled by division by zero or by fictional owner CAC.

## 4. Demand, baskets, fulfillment and capacities

For each i,m:
  independent_demand(i,m) = V1_calibrated_acquisition(i, effective_media(i,m))
  requested_orders(i,m) = independent_demand + valid_offer_additions - substitutions
  fulfilled_orders(i,m) <= physical_stock/availability or service/resource_capacity.

- Every forecast month reruns cross-sell, upsell, bundle and overlap using
  independent baseline demand as anchor. Attached child sales do not acquire
  a second media CAC.
- A physical unit in a bundle is counted once in sold stock; an upsell replaces
  anchor units; an overlap offsets already-independent child demand.
- Bundle percentages reduce the realized price only for discounted units,
  excluding VAT before booked revenue. Fixed owner online fees cannot be
  discounted without a verified payer/permission contract.
- Supply and production arrival are dates, not cosmetic labels; no sale before
  arrival, no stock below zero, no two offers sharing the same units.
- Offline material per visit, rent, master salaries and available appointments
  are period-specific. Offline services do not have finished-goods inventory.
- Shared staff/equipment/premises per-unit capacity is tested for EACH month,
  including combined load from newly attached basket items.
- Do not silently clip orders to capacity and still claim requested sales.
  Mark scenario NOT READY with month, SKU, shortage and affected offers.
  Unserved-demand simulation would require an explicitly separate contract.
- When one SKU sells out, media may reallocate to eligible SKUs, triggering a
  fresh demand/capacity/price equilibrium; the old basket anchor must not keep
  producing child demand without a valid sale/substitution.

## 5. Period financial statements: definitions

For SKU i and period m:
  R_net(i,m) = actual fulfilled sales at realized price exclusive of VAT,
               AFTER solo discount, allocated bundle discount, commissions
               treated correctly as expenses, and applicable returns/refunds.
  Sold_COGS(i,m) = cost basis of units ACTUALLY sold or services fulfilled.
  Contribution(i,m) = R_net - actually variable COGS/fulfillment - sales
                       commissions and proportional variable marketing.
  EBITDA(i,m) = R_net - sold COGS - variable operating costs - ads
                - attributed common operating resources and other fixed OPEX.
  EBIT(i,m) = EBITDA - correct depreciation/amortization.
  Pretax(i,m) = EBIT - attributable accrued loan interest.
  NetProfit(i,m) = Pretax - applicable tax attributable to this entity/stream.
  NetMargin(i,m) = NetProfit / R_net when R_net>0; else **not defined**, not 0%.

Portfolio and H-period values derive by summing independently recognized
period entries; never by multiplying first-month profit by H.

- Report both month-by-month P&L AND sum for the selected H, including months
  with zero revenue and continuing contractual overhead/interest.
- Report SKU allocations and actual PORTFOLIO profit separately. An allocation
  can make SKU margins useful, but cannot invent a second group expense.
- SUM_i attributed shared cost + unattributed shared cost = actual resource
  expense for the period. The same is true for campaign spending.
- A physical full-batch purchase is a CASH payment once. Its unsold part is
  inventory asset; sold units become COGS when sold, not when bought.
- Dropship supplier/fulfillment expenses occur per fulfilled order, and owner
  cash receipt may be delayed by contract.
- Offline rent/wages repeat in the scheduled periods; consumables follow visits.
- CAPEX cash is paid once and not called EBITDA expense; only permitted
  amortization/depreciation is recognized as an expense by period.
- Loan principal and owner funding are financing CASH entries, never profit.
  Interest is both accrued finance cost and a scheduled cash payment.
- Liquidity reserve is restricted cash/funding, not COGS, tax or operating profit.
  If price policy loads a reserve recovery objective, label it separately from
  actual profitability and never charge it again as a cost.
- Turnover/profit tax uses the documented owner/regime and period basis.
  Do not tax agent's third-party partner GMV. No cross-owner mixing,
  unsupported loss carryforward or guessed jurisdictional tax rule.
- Net VAT is pass-through, not profit. Until gross-VAT banking is modeled,
  receipts MUST be labeled 'net-of-VAT operating cash', not bank balance.

### Required exact accounting equalities (internal unrounded precision)
  period_R_net = SUM_m SUM_i R_net(i,m)
  period_NetProfit = SUM_m NetProfit_portfolio(m)
  period_AttributedCost + period_UnattributedCost = period_ActualCost
  openingStock + actualInbound - SUM_m fulfilledGoods - writeoffs = closingStock >= 0
  bankBasis_cash_delta(m) =
      own_receipts_netVAT + loan_draw + owner_injection
    - supplier_and_fulfillment_cash - media_cash - shared_operating_cash
    - business_tax_cash - loan_interest_cash - principal_repaid - capex_cash.
  closingCash(m) = closingCash(m-1) + bankBasis_cash_delta(m)
  freeCash(m) = closingCash(m) - lockedReserve(m).

No reconciliation via arbitrary balancing plugs, rounding-based hiding,
double allocation, silent writeoffs, or negative entries clipped to zero.

## 6. Full-horizon pricing and margin feasibility

- V1's approved buyer-price minimum/maximum, max discount, VAT rates,
  owner tax and target/minimum margin constraints remain authoritative.
- A V2 scenario calculates ONE explicit SKU list price for the selected H;
  it is held constant across periods unless the user actively changes the
  scenario. No unrequested automatic monthly price escalation.
- Pricing uses the whole approved demand, actual projected discounts and
  media/common costs over H, full relevant loan-service obligations and
  verified feasibility (inventory, payroll and resource capacity).
- Reserve recovery is a PRICE/FUNDING policy variable, not a P&L expense.
- Price solver and period P&L must be evaluated using the exact same sales and
  cost scenarios. A target can only be called TARGET_MET when the measured
  whole-period after-tax margin actually meets it.
- Distinguish per-SKU target/minimum margins from whole-portfolio margin.
  If the whole-period target needs price above V1 approved max, report
  INFEASIBLE with required price, actual allowed price, margin deficit,
  month/expense cause and candidate sensitivity — never silently exceed bounds.
- If minimum is met but target is missed, show MINIMUM_ONLY truthfully.
  If neither is met or actual profit is negative, show the corresponding
  numerical deficit rather than a positive green badge.
- No guarantee that feasible unit margins create a positive cash balance:
  unsold inventory and debt principal create liquidity demands separately.
- H_operating profit and extended H_cash financing tail have distinct
  definitions. Interest after H must still be disclosed and reflected in the
  complete debt service/price policy; do not quietly move it into H profit.
- Changing margin goal, horizon or campaign attribution reruns the same
  deterministic price-and-demand fixed point and recalculates actual cash.

## 7. Contractual cost ownership (no hardcoded payer assumptions)

Every financial line contains, directly or by verified source:
  source SKU/resource/offer ID, owner/payer, transaction type,
  cash date, profit-recognition period, quantity, nominal amount,
  VAT basis, tax regime and double-count-offset provenance where applicable.

If one shared payment serves different legal/tax owners, expense ownership
must be established before the profit-tax margin is reported. Existing
multi-month online + shared resources + profit-tax HOLD remains until an
independent exact-number reconciliation demonstrates ownership.
Never silently charge the partner or reassign the owner in field labels.

## 8. User-facing evidence

The existing V2 result must distinctly show:
- 30-day V1-derived unit/price baseline (where still useful);
- selected scenario H, approvals and demand assumptions;
- month-by-month volumes, offer attachments, stock, capacity and media;
- real campaign expenditure and attributable/unattributed split;
- SKU P&L and full portfolio P&L for H, with tax regime and VAT treatment;
- min/target achieved or infeasible at H with price restrictions and reasons;
- H_cash monthly receipts/outflows, debt financing and free money;
- explicit distinction between net-of-VAT operational cash and bank cash.

Error explanations appear near the responsible input in mobile and desktop.
When an input changes, dependent results update automatically; no silent
reuse of an old GREEN receipt or stale saved scenario.
Navigation back to V1, save/reopen of edited SKUs and mobile narrow tables
preserve the financial state and remain testable.

## 9. Exact independent test matrix

Every scenario must assert actual arithmetic, not only that a function returns
a value, and must validate identities in section 5. Required fixtures:

A01 — Single stock item: 20/60/100/200 units, 20 sales/month; V1/V2 identical
       price, tax and funding => exact monthly and whole-cycle reconciliation.
A02 — Two separate media budgets versus pooled campaign replacing the same
       total amount: actual paid media unchanged; no second CAC.
A03 — Incremental campaign (pool=none): extra cost exactly once; conversions
       follow the verified V1 funnel, not a fabricated boost.
A04 — SKU A sells out in month 1, SKU B remains through month 3:
       A gets no further allocated media; B receives permitted new share;
       actual budget continues according to its cadence/commitment.
A05 — All eligible SKUs gone while a fixed campaign remains committed:
       no revenue, no phantom units, visible unattributed media expense.
A06 — Both retained and transferred individual campaigns, multiple pools,
       distinct owners and independent management fees: cost conservation.
A07 — Revenue-weighted versus usage-weighted resource assignment with
       changing discounted prices: converges or fails with explicit issue;
       invariant under reordered input rows.
A08 — Bundle attach/overlap/quantity>1, cross-sell and upsell over multiple
       periods; stock and attach constraints, no double CAC/discount/COGS.
A09 — Offline procedures, supplies, rent, shared masters, combined capacity,
       tied/unrelated customers and staff overload in a specific month.
A10 — Online self/hired/agent, partner-paid and owner-paid media; verified
       online V1 period, contractual commission, agent tax only on owner revenue.
A11 — Dropship payout after delivery, supplier funding timing and negative
       cash gap despite positive reported P&L.
A12 — V1 owner ads=0/partner-funded acquisition: no division by zero,
       zero fabricated owner CAC and preserved verified independent demand.
A13 — VAT 0/20, turnover/profit tax 0/5/10, commissions, refund and
       no-sales months. For tax-ownership ambiguity: fail closed.
A14 — Loan 1/3/6/12-month interest and principal + reserve 0/10%:
       credit burden price impact vs principal/reserve cash-only.
A15 — Supply 0/90 days and part-month use; storage physical integral,
       partial sell-through leaves a nonnegative valued stock balance.
A16 — H=1 and approved H>1: legacy V1/V2 unchanged where equivalent,
       revised horizon produces mathematically consistent period totals.
A17 — Hard V1 priceMax/minimum target conflict: correct target/minimum
       status, required unbounded price and visible reason, no clamping lie.
A18 — Metamorphic: increasing owner ad without changing conversion
       performance changes only causally related orders/cost/margins; resource
       splitting with identical ownership preserves group totals;
       inputs reordered cannot change financial output.
A19 — Real Chromium: import V1 -> configure pooled campaign + bundle ->
       approve H -> see correct monthly campaign reallocation and P&L ->
       change price/stock/capacity -> fail/recover -> save -> back -> resume.
A20 — Complete mixed category 3-to-6 SKU portfolio: two physical source
       types, dropship, offline and online agent, capacity and offer links;
       compare every month to independently computed receipt, cost,
       tax, profit and finance oracles.
A21 — One-time campaign compared with monthly committed campaign; no
       accidental repetition, disappearing payment or assumed conversions.

Tests require no rounding-dependent compensation: calculate in full precision,
round only display money to cents; assert exact conservation to 1e-6 internally
or <=0.01 at explicitly rounded UI boundaries.
Each named failure must be RED before fixing and GREEN after causal repair.

## 10. Release / Definition of Done gates

F0 — SPEC LOCK: this contract linked to issue #31, unresolved assumptions
     identified, and no production code mutated by authoring the specification.
F1 — SHARED MEDIA: independent monthly acquisition/eligibility allocation
     passes A02–A07/A12/A21, no media double accounting; source V1 unchanged.
F2 — PERIOD P&L + PRICE: period ledger, attribution, interest, tax and
     whole-horizon target pricing satisfy section 5 and A01/A08–A18.
F3 — MIXED E2E: A19–A20 browser scenarios, persistence, mobile readability,
     source provenance, and full independent numeric reconciliation.
F4 — EXACT-HEAD CI: all required GitHub Actions GREEN on the exact head SHA;
     no skipped/softened financial assertions. Document PRs, commit SHAs,
     residual gates and rerun evidence inside the development issue.

#31 must remain OPEN if any P0 monetary invariant, mixed ownership/tax gate,
full-horizon margin, campaign conservation or end-to-end receipt fails.
Fail-closed paths are allowed as documented temporary protection, but they
must not be reported as completed support for that business scenario.

## 11. Known current deficits before implementation

- Pooled campaign is supported in 30-day V2 allocation but forbidden in
  the approved multi-month plan. No dynamic beneficiary lifecycle.
- Common ad cost replacement, fixed/usage/revenue allocation and first-month
  iterative price solver exist; they are not yet one multi-month fixed point.
- Multi-month basket-demand feasibility and cash are implemented, but
  monthly portfolio P&L and all-period profitability are not a single
  published invariant-driven account. Current headline P&L is 30 days.
- V2 published whole-horizon margin is not independently verified, and
  first-month price constraints must not be called full-period targets.
- VAT-neutral operating cash is NOT a VAT-inclusive bank statement.
- Shared online/service cost attribution under profit tax is explicitly
  blocked for ambiguous ownership rather than mathematically closed.

F1-F4 implementation must be separately staged; no user-facing GREEN for
unsupported source combinations until all relevant invariants are proved.
