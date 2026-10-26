# Tax notice deduplication

The V1 Sales Tax hints contained their own short deduction/accountant warning and
then appended the shared `tax.v2NoticeFull` warning. Users saw the same advice
twice in one paragraph.

Removed only the short warning from the goods and service hints in RU/EN/KK.
The Sales Tax explanation and shared full warning remain. Both downloadable
filled HTML examples receive exactly the same six literal copy edits; their
remaining bundled sources are preserved. No financial formula, rate, saved state,
common localization entry, layout or tax-selection behavior changes.

Historical storage/source guards normalize only the exact three approved hint
strings per adapter, bound to complete before/after SHA256 hashes. All original
storage and financial byte comparisons, including rejection of appended edits,
remain enforced. No workflow or historical fixture was replaced.

Validation:

- JavaScript syntax checks for both adapters and the copy guard.
- 32 existing tests passed: tax quoting/projection/final audit, semantic financial
  AST protection, storage and module-boundary guards. Zero failures/skips.
- Chromium:18 checks — goods, full services and simple services; RU/EN/KK;
  widths320/1280. Each rendered hint contains the full shared warning exactly once
  and mentions the accountant once. No page errors.

Base: public `main` at `2c83c35`. Separate branch from the private Release1 work;
no change to private frozen calculator snapshots, cloud configuration or public
deployment. GitHub CI is recorded separately in the PR.
