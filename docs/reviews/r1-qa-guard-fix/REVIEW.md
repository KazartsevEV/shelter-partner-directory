# R1 QA guard correction

Base: main `9801d47`, including accepted R1 #278. This follows an independent
review of implementation `8904e7b`. Only the isolated content/fixture verifier,
its fixture data/review index and a new path-scoped CI are changed. The 174
translations, approved editorial markdown, runtime UI, financial modules,
licenses, public download and production delivery are unchanged.

## Reproduced failures

The original checker passed all 67 scenarios but:

1. `partner.offer` could use unknown origin `misspelledSourceTable` and a changed
   Russian text while `verifyCatalog()` still passed.
2. `advance('archiveReady', {event:'deliveryMailAccepted', evidence:'gmailRejected'})`
   returned `deliveryAccepted`. Empty objects and string `'false'` also passed.
3. Prepending a forbidden event to `ok.applicationRejected.reset` did not affect
   the aggregate fixture result; only the last step's rejection was asserted.

These were QA failures in a fixture-only tool, not demonstrated production mail
vulnerabilities. The baseline probes and results are included below.

## Correction and continued QA development

Canonical keys and source kinds are derived from the approved editorial source;
unknown kinds, reassignment and missing canonical identities fail. Every
canonical entry requires source comparison. The disk loader and pure validator
also bind to the existing approved editorial path. Review additions remain
non-binding and cannot replace canonical content by editing metadata.

Evidence is a synthetic object with exactly `type` and `confirmed: true`, where
`type` must match the transition's declared evidence. No truthy-value shortcut.
Each step has an asserted `expectReject`; aggregate rejection uses any rejected
step, preserving explicit recovery/reset sequences without forgetting an earlier
rejection. No real provider receipt is authenticated by this pure fixture tool.

The checker exposes an isolated factory, so regression tests invoke the actual
catalog/transition/fixture validators on fresh mutated inputs. The old assertion
that merely compared a fabricated string with the canonical value was removed.
The original 67 scenarios retain their IDs and final states; 19 negative cases
cover wrong evidence for every transition. CSV and Markdown review matrices are
updated together; CSV equality is checked automatically.

A new read-only, dependency-free Node 22 CI runs on changes to these files and
the approved source document. No protected workflow is modified. No credentials,
network service calls, email, archive issue or production activation.

## Validation

- Syntax checks for both CJS files.
- 86 fixtures: 22 successful, 64 blocked; same 174 translations / 23 canonical
  entries / 19 transitions / 9 form cases.
- 11 adversarial test groups: all 23 canonical values in all 3 languages;
  unknown/reassigned source types; alternate editorial path; valid and malformed
  evidence for every transition; illegal ordering; earlier rejected step;
  explicit step expectations; intended recovery; CSV parity.
- Baseline probes: [source](baseline-probe.cjs), [results](baseline-protocol.txt).
  Running them against the accepted #278 code requires that historical checkout;
  probes evaluate a copy in memory and do not edit its files or issue requests.
- Financial/browser regression is not re-run for this isolated verifier change;
  no runtime input, financial source or browser resource is changed.

GREEN here proves content/fixture QA. R1 preview acceptance, editorial approval
of candidate copy, authenticated production intake and actual delivery remain
separate. No native Kazakh review or full R1 completion is claimed.
