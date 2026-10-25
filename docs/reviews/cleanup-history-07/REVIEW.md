# C7 — historical HTML and unmatched-selector disposition

Base: accepted main `0e47899`, including accepted #271, #274/#275 and the merged #276 multilingual publication. C6 accepted/merged; no C7 deletion is
inferred from lack of coverage. This PR completes the requested conservative C7
review and records five explicit retention decisions, not a speculative cleanup.

| Candidate | Evidence | Decision |
| --- | --- | --- |
| `index.html` | Live 200; independent SHELTER partner directory; two existing deployment workflows | Keep: outside Nomad360 cleanup |
| `US_Retail_Demo_FILLED.html` | Live 200; generator, browser test and CI consumers | Keep: supported standalone download |
| `US_Retail_Demo_EN_FILLED.html` | Live 200; generator and bilingual download/browser contracts | Keep: supported standalone download |
| `.github/workflows/index.html` | Live 404; no literal incoming reference in scanned source | Keep until explicit archival-retirement decision; external/history consumers are unknown |
| `.github/workflows/Marketing_calc.HTML` | Live 404; no literal incoming reference in scanned source | Same: 404 and missing internal reference do not revoke historical permissions |

Actual public GET observations (time, URL, response/hash where available) are in
[live-urls.json](live-urls.json). They describe the observed deployment, not usage
analytics or an external backlink crawl. Neither deployment workflow was changed.

The C7 scope is added explicitly to the existing SEO checker allowlist; its
validation logic and protected runtime rules are unchanged.

The deterministic [compressed ledger](inventory.json.gz) contains all 2677
historically unobserved selectors plus 64 unsupported probes, their historical
owners/conditions, current owner-file hashes, exact-selector literal witnesses
and token witnesses in current calculator JS/HTML and all published EN/RU/KK
SEO/Help/license HTML, including the accepted #276 pages. The original 171 dynamic
selector accesses remain protected. Literal witnesses are not a scope-resolved
reachability proof. Old observations are labelled historical: this PR does not
pretend that its old browser census is a new exhaustive matrix. Selectors already
removed by accepted C1–C6 are not restored. No new deletion is authorized by this
ledger; hidden branches, inline handlers, exports, pseudo-elements and media
conditions cannot be disproved by a missing DOM match.

Reference search excludes generated review evidence/inventory/fixtures to avoid
self-references; generator/scripts/tests/current documentation are inspected. Text search is capped
at 3 MB per file; large generated standalones are fingerprinted and parsed for
actual HTML attributes, not reinterpreted as independent dynamic-template consumers.
Long embedded data URLs are represented with a prefix, byte length and full hash,
not copied as megabytes of duplicate artwork. The ledger is losslessly gzipped
with deterministic metadata and rebuilt by `scripts/cleanup-history/audit.py`.

## Acceptance and limit

All 126 baseline runtime/asset/entrypoint files are pinned to the accepted base
and checked byte-for-byte. No financial logic, CSS, generated HTML, live URL,
SHELTER content or delivery behavior changes, so numerical/browser retesting
cannot demonstrate a new runtime effect; the accepted #271 39/39 checks remain
the numeric/UI baseline. This PR checks the complete absence of runtime changes
and reproducibility of the evidence instead. Network observations are not
re-fetched as a nondeterministic CI gate.

No candidate meets the evidence/permission threshold for deletion under the
approved C7 rule. Retention is the concrete result of this audit. Any future
retirement must name the exact files/selectors, demonstrate consumers are handled
and receive the separate decision required by the queue. C7 audit acceptance and
merge remain separate; partner/hosting steps are not started.

The refreshed map retains SEC-01, BUG-09-SCREENSHOT and WL-CICD-01 as future
R1–R6 obligations. #275 is the merged editorial base; #276 has since merged the 15 multilingual
HTML pages and sitemap. C7 preserves that publication and does not repeat R3.
C7 does not activate screenshot uploads, partner issuance, White Label updates
or production WAF/CDN. Those updated contracts are preserved.
