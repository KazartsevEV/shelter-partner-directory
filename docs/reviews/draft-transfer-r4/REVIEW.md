# R4-DRAFT-TRANSFER-01 — local saved-draft portability

Base: public `main` `6e3810befffb4f50767d879fd3715cecce2096a7`.
Private #494 has been accepted/merged at `e4dd1ce7`. This slice does not deploy,
activate partner delivery, merge R1 #245/P3 #243, or certify Google authorization.

## User flow

The existing Help enhancement links to a separate same-origin `drafts/` page
in EN/RU/KK. Save the calculation in its calculator first, open the transfer page,
download JSON, then open the corresponding page on the target site and choose
that file. Preview distinguishes new, unchanged and conflicting records. Existing
data can be replaced only after downloading a backup of this browser and checking
the replacement permission. Browser download dispatch is not represented as
proof the user retained the file. Return to the calculator and explicitly resume;
previously open calculator tabs must be closed/reloaded to avoid old in-memory
autosaves. No automatic redirect or financial data in a URL/backend is used.

Only the seven explicit existing draft/reset keys are read. Pre-product V1 tax
preferences are retained without inventing a resumable product portfolio. Currency, original
payment amounts, applied FX metadata and raw stored JSON bytes are unchanged.
Other records absent from an import file are preserved, not cleared. Locale,
contact/application data, auth and unrelated localStorage are excluded. The JSON
is not encrypted or an authenticity signature; the UI tells the user to keep it
private. Unsaved fields and PDF/Excel are not represented as restorable drafts.
Simple online inputs that the current calculator never persisted are outside this
saved-draft transport; their saved Sales Tax choice is included. Legacy full-service
records are retained; the existing hidden legacy resume route is not reintroduced
by this change. Current full-service V1 drafts use the ordinary V1 resume path.

## Boundaries and failure behavior

- Core: pure file/schema validation, allowlist, preview, optimistic snapshot check,
  no-overwrite default, journalled writes and rollback/recovery. No formulas.
- UI: local File picker/Blob download only; no fetch/provider integration. The
  page has its own restrictive CSP including connect-src/form-action/frame-src none.
- Dynamic V1 row HTML is validated in an inert template against allowed tags,
  attributes and exact pre-existing row handlers; arbitrary HTML, scripts, SVG,
  frames, URLs in styles/attributes, duplicate global IDs and prototype keys are
  rejected before storage writes. Active/local URL schemes in saved fields
  are also rejected, including numeric-entity/control-character obfuscation. Markup outside the existing V1 dynamic paths is
  rejected. Unsupported old/custom markup fails visibly rather than being silently
  sanitized and changing a user's saved form.
- Format/version/inventory, 8 MiB UTF-8 limit, nesting/node bounds and safe IDs
  are checked. Source drafts and engine schemas are not migrated/recomputed.
- A journal is written before the first draft write; errors attempt a byte-exact
  rollback. An interrupted import rolls back on reopening. If a different tab has
  changed a value, recovery refuses to overwrite it and leaves the journal visible
  as a blocking condition. Storage failure is never reported as successful import.
- Web Locks serialize other transfer pages where available. Existing calculator
  autosaves do not share that lock: close other calculator tabs. Storage events
  invalidate preview/backup permission. This is not a claim of transactional
  localStorage against arbitrary concurrent writers.

`Marketing_calc.HTML`, `US_Retail_Demo.HTML`, current draft store, financial/FX/tax
engines, delivery and canonical locale source remain byte-identical. Public release
allowlist adds precisely the transport page, two modules and its stylesheet.
The historical SEO guard adds only this feature's paths; its financial hash
checks are retained. `draft_transfer_scope.test.cjs` independently freezes the
accepted calculators/engines and exact four added public resources.

## Verification

- 93 local Node tests (including four CI selector tests): transport/recovery/security/scope plus accepted storage and V1/V2
  financial suites. No skips.
- 15 public artifact policy tests; clean allowlisted artifact, 116 files.
- Chromium: distinct HTTP origins serving the built artifact, actual downloaded files and picker import,
  RU/EN/KK × 320/360/390/430/768/1280; both real calculator entrypoints; rotating
  real filled shopper and resale/dropship/full/simple/agent/online V1 fixture branches; live-generated
  dynamic rows; standalone and linked V2; canonical 10-SKU US Retail; saved service.
- Compare every transferred raw record and restored financial result (including
  an applied CNY/KZT quote, with no second conversion). V1 Cash Flow includes
  eight ready and ten unchanged pending states; all 72 standalone/linked/US Retail/
  saved-service result comparisons are ready; test conflict
  backup gate, real cross-tab invalidation, next-page recovery and unsafe markup and a real denied-storage getter; eleven additional markup attacks per viewport/language.
- No external/provider writes; helper page performs no upload. Six full-page
  screenshots and the sanitized numerical protocol accompany the final run.

Local built-artifact matrix passed 18/18, transferring 126 raw records; all
before/after financial/state comparisons matched. [Protocol](protocol.json).
Screenshots: [EN 320](en-320.png), [RU 320](ru-320.png), [KK 320](kk-320.png),
[EN 1280](en-1280.png), [RU 1280](ru-1280.png), [KK 1280](kk-1280.png).
The artifact code revision and digest are pinned in the protocol. Evidence-only
commits do not change runtime source. Final HEAD CI receipts are reported in PR.
 Local fixtures and
HTTP origins do not certify a real hosting origin, TLS, provider delivery or R4–R6.
The new page must be published on the OLD origin before retiring it. The accepted
private source lock is not silently changed: import this feature into private
source only after separate acceptance/merge, then rerun hosting package checks.

## Historical online-import debt reproduced

The accepted-base browser bridge passes for self/hired/agent and the current
adapter suite passes 7/7. The specific historical `portfolio_v2_online_import.test.cjs`
still fails 13/13, independently reproduced unchanged in this slice. Those tests
call the exported old `fromOnlineV1` first-30-day template, which emits
`source: online-self/hired/agent` without `fixedPriceFromV1`. The current linked
engine correctly accepts `online-service` provenance and fixed-price flags; the
live HTML calls the separate `build` period-ledger adapter. Source search found no
live UI caller of `fromOnlineV1`. Do not change accepted financial validation or
period formulas to make the incompatible historical tests green. Retiring/migrating
that obsolete path with current-V1 numerical oracles is a separate maintenance
slice; these 13 are not included in the 93 successful checks above.

## Historical comparison bridge

Initial CI caught the deliberate Help-link addition in old byte-frozen stylesheet
and partner guards. `tests/helpers/draft-transfer-scope.cjs` accepts only the pinned
old Help script or SHA256 of the entire reviewed new script, restoring old bytes
only for historical comparisons. Its one hook is in the existing V1 historical
restore chain; no shipping state/financial code is altered. The separately described CI routing
change is pinned as a second exact workflow fingerprint. Negative
tests reject changes to either the new link or the old search behavior. This does
not skip files or permit arbitrary later Help changes.

Actual main-branch read-only authorization recheck `40236324539` after #494 merge
again found no SDK owner account/ADC and no injected WIF input; legacy config was
present but opaque. No Google authorization is certified, no messages/cloud writes
were performed. This external runtime-binding gate remains open.

## Correct browser-oracle selection

The initial C4/C5 browser steps also failed before opening the transport page:
they unconditionally compared old package snapshots with accepted C6 source
extraction/projections. Calculator source is byte-identical to accepted main in
this feature. A new CSS file for an independent utility page does not modify any
of the historical owned styles.

`ci_scope.cjs` now selects historical comparisons when a stylesheet owned by C4/C5 (palette inputs and the three page families)
changes (including deletion, with rename detection disabled) or palette/cleanup
analyzer changes. Otherwise both jobs run the existing contemporary real-browser
suite. Manual/unknown contexts retain historical checks; malformed PR metadata
fails closed. All source guards, arithmetic, VAT, PDF and actual Excel/OOXML steps
remain unconditional. Four negative selector tests prove old styles/tools always
select history and a new component cannot mask an old-style change. The exact
workflow delta is pinned by the same historical projection, with negative tests
rejecting removal of any export or tax step. No jobs are disabled and no failure
is ignored. Historical comparators themselves are retained, not called GREEN.

Final local release-candidate matrix: 18/18 built-artifact cases, 126 raw records,
three Help-link discovery checks, next-page recovery/cross-tab invalidation and a
real denied-localStorage getter. All passed. Extended ownership/source/business
unit set: 131/131, no skips (overlaps the transport/core set; do not add the counts).
The private main authorization failure is separately reported above; it is not
included in the successful public CI count.
