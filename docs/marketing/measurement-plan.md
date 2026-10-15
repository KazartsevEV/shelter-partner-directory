# MKT-L10N-01 — measurement after commercial launch

Status: design only, 15 October 2026. No new analytics SDK, tracking endpoint,
identifier, event persistence or lead collection is installed by task 6.

The existing public GitHub visitor snapshot describes repository visits only.
It is explicitly labelled and kept in project information, outside the offers.
It must never be used as evidence of calculator adoption or conversion.

| Proposed event | Evidence and limit |
| --- | --- |
| B2B section opened | A future approved observer may record one visible section opening per page session. A menu click alone does not prove the section was seen. |
| Complete HTML downloaded | The current page can know that HTML was built and a download was requested. It cannot verify that the browser saved a file. A future supported confirmation must be distinguished from this UI event. Chromium tests verify the actual bytes and browser download completion; tests are not production business metrics. |
| White Label CTA clicked | The mailto link opens a draft. It does not submit or deliver an enquiry. |
| Enquiry received | Count actual incoming enquiries in the project mailbox, with duplicate/spam handling and only the data needed for an agreed purpose. No mailbox integration is added. |
| Donation confirmed | Count only provider-confirmed settled donations or reconciled bank receipts. An iframe load, click or copied bank number is not a donation. No webhook or access to donor data is added. |

Before connecting any collection, agree the provider/architecture, access,
retention and consent requirements and update Data & Privacy. Do not send SKU,
amounts, currencies, financial inputs or outputs, localStorage, saved drafts,
URL parameters containing financial information or stable user identifiers.
No endpoint, client ID or guessed conversion event is reserved in this release.

Commercial launch date remains unset until the owner launches the accepted
offer. Schedule reviews for launch +30 and +60 days, using only approved actual
sources. Report each metric's source, time range, availability and limitations;
leave unavailable metrics unavailable. Set no invented numerical KPI and make
no causal claim about traffic, retention, leads or income without evidence.
