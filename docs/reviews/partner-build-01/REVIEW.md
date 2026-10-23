# Versioned partner package build

Baseline: merged PR #240, `9c59e920be7dccd698403d2821a71ac4a56c8a5b`.

This stage adds a build-time configuration contract and a package/provenance
builder. Every pre-existing runtime JS/CSS/HTML file, financial engine, selector,
public form and filled demo remains byte-exact. The site UI is unchanged.

The existing standalone packer runs in a blank loopback Chromium context with
external requests blocked. Outputs include a complete calculator HTML and a
manifest with normalized config, source revision, output SHA-256, and exact local
resource byte lengths/digests. Inert config data is included in the package.
The only supported v1 profile preserves original branding/contacts and complete
V1/V2/Excel/PDF capability. No unimplemented configuration flag is accepted.

The roadmap now has a current status block above the old 17 October history:
Help and later merged UI work are no longer listed as unimplemented. Partner
issuance, RU/KK thematic SEO, operational Formspree checks and revalidation of
old reported debt remain explicit.

Validation is documented with exact final HEAD and CI links in the PR body:
config negative tests, immutable-runtime source guard, actual generated file and
manifest inspection, reproducible repeated builds, injection test and before/
after financial comparisons RU/EN/KK on six widths.

Limits: no application form, email verification/sending, password ZIP or domain
access enforcement is delivered in this stage. Partner identity is public package
metadata, not a live white-label renderer. Digests are not digital signatures or
copy protection. Existing external service dependencies remain as before.
