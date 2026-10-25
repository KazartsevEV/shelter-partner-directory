# R1 · Partner release localization & negative-case QA

**25.10.2026 · separate documentation / fixture scope.** Source: accepted #274 requirements and [existing R1 copy](../../../partners/partner-release-copy.md); branch based on merged SEO R3 #276 (`0e47899`). C7 #277 remains independent.

## Inventory

- **58** stable keys × 3 locales = **174** populated strings. **23** pinned to the existing source (11 compact offer/bug/WL rows, 6 delivery state phrases, 5 pre-contract legal fragments, 1 Help excerpt); **35** editorial review additions.
- **19** permitted evidence-tagged lifecycle transitions; **12** reachable workflow states; **67** fixtures (positive, negative and special gates).
- **0** changed production HTML, CSS, JS, financial oracles, source licence, data storage, live intake endpoints or credential bindings.
- Historical privacy/legal snippets are explicitly **non-binding** and may not be substituted into the public licence/policy without determining legal operator, retention, processors and consent.
- Human Kazakh review **not performed**. The owner waived human KK copy review for SEO R3; that does not constitute professional approval of these future R1 partner texts.

## Scenario groups

| Group | Count |
| --- | ---: |
| acceptedTransitions | 19 |
| missingEvidence | 19 |
| illegalOrder | 12 |
| applicationValidation | 9 |
| productionGates | 8 |

## Disclosure/protection checkpoints

1. Company and website optional at application; processing consent required, directory listing consent not required.
2. Provider receipt ≠ verification email Gmail acceptance ≠ user verifies code ≠ archive prepared ≠ provider accepts delivery ≠ recipient receives email.
3. Unknown response cannot automatically retry/send or claim success, and retries require operator/provider evidence.
4. No screenshot upload, ZIP issue or White Label deployment is enabled by QA flags or wording. Only text-only public bug-report remains available until separate approved endpoint.
5. €600 is *starting project adaptation*, not lifetime updates. CI/CD managed updates and preservation of client branding are contractual/future.
6. Existing online calculator remains free to use without login and current public download unchanged; no embedded customer lead collection is introduced.
7. The 58 IDs are a **review catalog**, not a silently published runtime localization registry; #245 already provides the actual isolated local preview.

## Execution

```bash
node scripts/partners/r1-content/verify.cjs
```

Expected receipt starts `R1_PARTNER_CONTENT_QA_GREEN`, with `translations:174`, `canonical:23`, `stateTransitions:19`, `externalRequests:0`.

No new scheduled workflow was attached in this slice to avoid overlapping C7's guard and CI changes. An executable local check is included; CI integration can be gated in a separate path-scoped follow-up once C7 changes settle. Do not claim this standalone checker ran inside CI unless logs show it did.

## Explicit remaining work

- Review the 35 candidate keys in real #245 preview, keyboard and responsive states and perform product-owner approval before release.
- Integrate durable, authenticated registration and verification separately from missing-site placement; implement protected intake only with owner-approved R4/R5.
- Select actual screenshot mail transport and privacy/storage terms, then real inbox receiving test with an actual image.
- Prepare a White Label tenant profile and genuine deploy rollback, plus separate paid agreement. No public release before R6.

## Follow-up: QA guard correction

The original 67-case receipt above is historical. The [guard correction](../../r1-qa-guard-fix/REVIEW.md) replaces truthy boolean evidence with typed fixture evidence, validates each step and all canonical identities, adds 19 mismatched-evidence scenarios, and connects a separate read-only CI. Current result: 86 scenarios / 22 successful / 64 blocked, plus 11 adversarial test groups. This still does not complete R1 UI or enable production delivery.
