# R1 partner copy QA · pre-release only

This is an independently reviewable localization and workflow fixture contract. It **does not** modify or replace [Draft #245](https://github.com/KazartsevEV/shelter-partner-directory/pull/245), the current partner form, `Marketing_calc.HTML`, the current licence, the Formspree endpoint or any calculator formula.

```bash
node scripts/partners/r1-content/verify.cjs
```

- `catalog.json`: 58 stable IDs, origin and disclosure flags. 23 entries are checked *verbatim* against `docs/partners/partner-release-copy.md` (11 existing short source rows, 6 provider-specific status paragraphs, 5 non-binding privacy/legal fragments and the partner installation Help excerpt). 35 entries are **new editorial review copy**, not published terms.
- `locales/en.json`, `ru.json`, `kk.json`: 174 translations, complete keys in every locale. EN is the reference; no claim of native Kazakh review.
- `state-contract.json`: 19 evidence-tagged possible transitions and **no executable delivery implementation**. Distinguishes submission acceptance, actual email verification, archive build, Gmail acceptance and uncertain receipt. Real-world event evidence is not asserted by these fixtures.
- `scenarios.json`: accepted transitions, missing evidence, invalid order, consent/email validation, no-website applicant, optional public directory, screenshot unavailable, White Label unavailable, no automatic resend and preserved public HTML behaviour.
- `scenarios.csv`: human-checkable index of expected outcomes, not test execution proof. The Node checker is the executable contract.

**Release boundary**: `preview-only`; no network request, registration, token, Gmail, Google Sheet, upload, archive, standalone HTML issue or customer deploy. Screenshot attachment remains disabled until a real approved backend can send one message with actual file; White Label managed deployment needs contracted CI/CD. Source markdown is unchanged. Those activation tasks belong to R4/R5/R6.

**Scope isolation**: all runnable QA files live only in `scripts/partners/r1-content/`. No changes to `scripts/seo/check_phase_a.py` or `docs/nomad360-codex-task-map.md`, which are being edited in C7/#277. This PR can be independently reviewed and later wired into #245 preview or the P3 pipeline after their acceptance. It is not itself a production UI and contains no route to deploy.

**Review**: `docs/reviews/partner-build-01/r1-content/REVIEW.md` and the matrix below. Merges require the owner's separate approval.
