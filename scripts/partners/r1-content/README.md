# R1 partner copy QA · pre-release only

This is an independently reviewable localization and workflow fixture contract. It **does not** modify or replace [Draft #245](https://github.com/KazartsevEV/shelter-partner-directory/pull/245), the current partner form, `Marketing_calc.HTML`, the current licence, the Formspree endpoint or any calculator formula.

```bash
node scripts/partners/r1-content/verify.cjs
node scripts/partners/r1-content/verify.test.cjs
```

- `catalog.json`: 58 stable IDs, origin and disclosure flags. 23 entries are checked *verbatim* against `docs/partners/partner-release-copy.md` (11 existing short source rows, 6 provider-specific status paragraphs, 5 non-binding privacy/legal fragments and the partner installation Help excerpt). 35 entries are **new editorial review copy**, not published terms.
- `locales/en.json`, `ru.json`, `kk.json`: 174 translations, complete keys in every locale. EN is the reference; no claim of native Kazakh review.
- `state-contract.json`: 19 evidence-tagged possible transitions and **no executable delivery implementation**. Distinguishes submission acceptance, actual email verification, archive build, Gmail acceptance and uncertain receipt. Real-world event evidence is not asserted by these fixtures.
- `scenarios.json`: 86 scenarios, retaining the original 67 and adding one mismatched-evidence rejection for each of the 19 transitions. Each step declares `expectReject`; the scenario-level flag records whether **any** step was rejected. Evidence fixtures have the exact shape `{type: "gmailAccepted", confirmed: true}` with the type required by that transition. Strings, booleans, empty objects, mismatches and unconfirmed evidence are rejected. These tags do not authenticate real provider/operator evidence.
- `scenarios.csv`: human-checkable index of expected outcomes, not test execution proof. The Node checker is the executable contract.

**Release boundary**: `preview-only`; no network request, registration, token, Gmail, Google Sheet, upload, archive, standalone HTML issue or customer deploy. Screenshot attachment remains disabled until a real approved backend can send one message with actual file; White Label managed deployment needs contracted CI/CD. Source markdown is unchanged. Those activation tasks belong to R4/R5/R6.

**Scope isolation**: all runnable QA files live only in `scripts/partners/r1-content/`. No changes to `scripts/seo/check_phase_a.py` or `docs/nomad360-codex-task-map.md`, which are being edited in C7/#277. The path-scoped `R1 partner content QA` workflow runs on catalog, editorial-source and verifier changes; it has read-only permissions, no external-service credentials and no activation steps. The checker exports an input-isolated factory for mutation tests. It can later be wired into #245 preview or the P3 pipeline after their acceptance. It is not itself a production UI and contains no route to deploy.

**Review**: `docs/reviews/partner-build-01/r1-content/REVIEW.md` and the matrix below. Merges require the owner's separate approval.

The canonical key/source identity set is derived from the approved editorial document. Unknown source types and reassignment of canonical keys to review-only content fail before text comparison. [Guard-fix evidence](../../../docs/reviews/r1-qa-guard-fix/REVIEW.md) supersedes the original boolean-evidence QA limitations.
