# C3 — exact About CSS duplicate cleanup

Base: owner-accepted #249 merge `c45187fa5190ee6ce4bc88a6266337439867a8f6`.

Only runtime change: delete two early duplicate rules (360 bytes) from
`nomad360_about_banner.css`. Preserve later copies, all intervening cascade
bytes and every media/layer wrapper. Original accepted photograph inside SVG,
colours, composition, translations and all other app resources stay exact.

Verification is in progress. The final protocol, paired screenshots, financial
checks, timing samples and limitations will be published here before review.
C4 has not started. C3 requires owner acceptance and separate merge permission.
