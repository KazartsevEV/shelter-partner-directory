# Partner package configuration v1

This is a build-time boundary, following merged PR #240. It packages the current
complete calculator through the accepted `Nomad360Delivery.buildStandalone`
implementation. It does not replace financial functions or modify the live site.

## Build

Install the existing pinned Playwright tool in the build environment, then run:

```sh
node scripts/partners/build.cjs --config tests/fixtures/partner-build/example.json --out /tmp/nomad360-example-1
```

The example uses reserved `.example` addresses, not an actual partner record.
The checkout must be committed and clean for tracked files. Output consists of
`<packageId>.html` and `<packageId>.manifest.json`. Existing files are never
silently overwritten. Keep the original manifest alongside the issued package.

The builder runs only the existing packer in a blank local Chromium context. It
never opens a user's browser profile or executes a filled calculator form during
packaging. External network requests are blocked. It serves the checkout on
loopback, checks fetched bytes against tracked source files and checks that the
checkout did not change during the build.

## Configuration

`config.cjs` validates schema version 1, release version `x.y.z`, package and
partner slugs, public company name, public HTTPS website, optional public company
email and intended deployment origin. Unknown fields, unsupported versions,
credentialed URLs and executable URL protocols are rejected before assembly.
Field order in the input does not change the normalized configuration.

Only `profile: nomad360-complete` is implemented in v1. The profile records the
original Nomad360 brand, logo, official contacts and the full V1/V2/PDF/Excel
capabilities. These are immutable profile values, not editable financial or UI
options. Partner identity is included as inert package metadata; it does not
replace the original brand/contact UI. Removing functions or branding through an
unsupported config is rejected, rather than silently ignored.

The source-of-truth for an option is its implemented build profile. A future
White Label profile requires a separately agreed licence and an explicit
presentation adapter, with numeric parity tests. Do not add ad-hoc engine flags,
CSS hides or string replacements of financial code to customise a partner.
Extend the schema/profile deliberately and migrate older configuration explicitly.

## Provenance

The manifest contains:

- Schema, package ID and package version.
- Exact Git source revision and normalized configuration SHA-256.
- Generated HTML byte length and SHA-256.
- Every bundled local source/resource path, byte length and SHA-256.

The HTML includes the normalized config in an inert `application/json` script.
`<`, `>` and `&` are escaped so even hostile company text cannot terminate the
script element. The data has no executable script privileges. It contains only
public package metadata; never put passwords, email tokens, registration details
or financial drafts in this configuration or a committed example.

SHA-256 detects changed bytes when checked against a trusted original manifest.
It is not a digital signature, confidentiality, copy protection or licence proof.
`deployment.origin` records the intended site; v1 does not enforce domain access.
Original external dependencies of the downloadable edition remain unchanged;
this stage does not claim fully disconnected operation of third-party services.

## Next product stages

Partner application and consent, email confirmation, password ZIP issuance,
delivery status and deployment/domain registration are separate work. Public
partner directory entries require the agreed consent/review flow. Public download
buttons, Help H12–H16 and privacy/licence text must describe the actual released
process; do not show “code sent” before delivery exists.
