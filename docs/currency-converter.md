# Explicit payment conversion · task 2

Base: merged PR #132, `3dd32d82cdd125c9a9640bd5efd7b77709697861`.
Date: 2026-10-12. Provider substitution to Frankfurter was explicitly approved by the user.

## Source investigation

Google's former Finance API was deprecated and scheduled for shutdown ([Google Developers, 2012](https://developers.googleblog.com/changes-to-deprecation-policies-and-api-spring-cleaning/)). No documented supported direct browser exchange-rate API was identified in the official sources reviewed. Google's documented alternative is the Sheets `GOOGLEFINANCE` function, whose historical values cannot be accessed via Sheets API/Apps Script and whose professional use is restricted ([official help](https://support.google.com/docs/answer/3093281?hl=en)). Google Finance's current [data disclaimer](https://www.google.com/intl/en/googlefinance/disclaimer/) requires prior written consent for copying, reprocessing, redistribution or commercial use. A Google HTML scraper, mirror, hidden spreadsheet or server proxy is therefore not part of this implementation.

The approved alternative is [Frankfurter v2](https://frankfurter.dev/), an API aggregating daily official reference rates. [Browser documentation](https://frankfurter.dev/javascript/) explicitly permits direct fetch via open CORS and requires no API key. These are daily reference rates, not a bank execution quote or Google's market feed. The source and actual returned date are displayed. The provider's response identifies a directed pair `base`, `quote`, numeric `rate` and ISO `date`. Only ISO currency codes are sent; payment amounts, product names and saved calculations remain local. No fees, spread or surcharge is inferred.

## Application contract

- Lookup is explicit and produces a proposal; it does not modify the financial model.
- The equation is `1 paymentCurrency = rate businessCurrency`; the normalized expense is raw amount × rate, without intermediate rounding.
- Only “Apply to calculation” commits the proposal. Manual input requires a positive finite rate, a real non-future date and a nonempty source label.
- Metadata retains the raw quote, normalized amount and `conversion` snapshot: directed pair, applied amount, rate, source ID/label and date.
- Any subsequent change in amount or either currency invalidates the snapshot. A new explicit application is required.
- Repeated calculation, explicit reapplication, autosave, language switches and draft restoration do not compound conversion. Restoring a draft never fetches or refreshes a rate.
- A newer retrieved quote does not replace the previous applied quote until confirmed.
- Pair mismatches, malformed numbers/dates, non-OK HTTP responses, timeouts and offline errors leave a manual entry path available. An already applied snapshot stays valid if a later lookup fails.
- A delayed response for a changed amount or currency is discarded.
- Zero stays zero in every supported currency. Empty/invalid/unconverted positive expenses retain the task-1 readiness gates.

V2 normalizes a copy before calling its existing engine. V1 normalizes payment reads before its existing material/logistics calculations; derived totals already in the business currency are not converted again. An automatic domestic delivery default cannot overwrite a foreign raw delivery quote. All financial engines, tax/loan structures, Cash Flow and allocation formulas remain unchanged.

Controls are available alongside task-1 payment selectors in V1/V2 and use EN-authored RU/EN/KK text. A details panel keeps the converter compact. New FX assets are bundled by the existing standalone export and included in release asset checks. No server is introduced.
