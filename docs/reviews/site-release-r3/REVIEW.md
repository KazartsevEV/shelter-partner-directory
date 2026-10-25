# R3-ARTIFACT-01 — explicit public directory preparation

Independent of R1 PR #278. This slice prepares a local public artifact from the
accepted client files. It does not deploy, select a host/domain, modify Pages,
copy the private operator, activate partner issuance or change the R1 interface.
Private lazysellerV2 CI integration remains a separate R3 step.

`public-files.json` is an explicit, reviewed allowlist seeded from the existing
production standalone builder's resource manifest, extended with the existing
static SEO/Help/license pages, direct US Retail standalone downloads, shortcut/PWA
icons, traffic JSON, Inter fonts and license notices. It is not a recursive copy
of the repository or a file-extension glob. Browser verification serves only
this artifact, so missing dynamic dependencies fail as local 404s.

`build.py` requires clean tracked sources and tracked configuration/resources;
rejects path traversal, symlinks, private/operational directories, ZIP/state/key
paths and PEM private-key material; writes a fresh temporary directory; hashes
all outputs; checks source stability and publishes the directory only after
verification. Existing output is never removed or overwritten. Source revision,
basePath, file bytes/SHA256 and deterministic artifact digest are recorded.
Verification rejects unexpected/missing/tampered files. A digest is an integrity
check, not a digital signature or an assertion that an untrusted manifest is
an authenticated release.

The source SHELTER `index.html` is excluded. Only inside the artifact, `index.html`
is an exact alias of `Marketing_calc.HTML`, preserving its offer, query handling
and calculation code. Source URLs, canonical/hreflang/sitemap, PWA scope and the
current download/license/bug form remain unchanged. The artifact is prepared for
the existing `/shelter-partner-directory/` prefix; changing origin/path is R4.

## Checks and explicit limits

Eleven negative/reproducibility tests cover prohibited files, dirty source,
unknown resources, duplicate/config errors, symlinks, private-key content,
existing output, tampering and injected files. Two independent builds from the
same clean revision must be byte-identical.

The browser uses only the isolated artifact server: 18 language/width cases,
V1 shopper, online self/hired/agent, both real V2 builds and full-service result,
all shipped HTML, actual generated standalone and missing-resource checks.
External calls are blocked; the same pinned local Tailwind used by accepted
browser tests is test instrumentation, not a replacement production stylesheet.

This packaging slice preserves the current external Tailwind CDN dependency.
Production dependency vendoring, private CI/tenant overlays, target-origin URL
migration, staging/TLS/headers, runtime credentials and rollback activation
remain separate R3/R4–R6 work. No production/offline readiness claim is made from
blocked-provider browser tests. Future host compression/cache settings are not
simulated as production speed. No credentials, applications, email codes or
financial drafts are read or copied by the builder.

R1 remains untouched. Its resulting PR is reviewed separately after this slice.
Local checks pass: 11 unit/negative tests; two byte-identical builds; 112 listed
public outputs plus their release manifest; 18 language/width cases; all 25 HTML
entrypoints; valid V1/online/full-service/both V2 results; zero missing local
resources; downloaded standalone financial smoke with HTTP blocked; synthetic
browser-draft/DOM marker excluded from the download.
[Browser protocol](protocol.json), [file/commit/hash manifest](release-manifest.json).
Screenshots: [RU mobile](ru-320.png), [EN mobile](en-320.png), [KK mobile](kk-320.png),
[RU desktop](ru-1280.png), [EN desktop](en-1280.png), [KK desktop](kk-1280.png).
The evidence manifest records clean build revision `e39299a`; subsequent edits
are test instrumentation/documentation only. Final-HEAD CI will rebuild from its
own clean checkout and is reported in the PR. The normal runtime CDN remains
an explicit limitation; this slice does not claim to close all of R3.
