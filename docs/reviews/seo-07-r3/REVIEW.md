# SEO-07 R3 — generator RU/EN/KK & Kazakh editorial pass

25.10.2026. Based on #275 merged `5ede24e`. **Technical review candidate, not approved for production.**

## What changed

- Single Node renderer behind unchanged CLI entrypoint `python scripts/seo/build.py [--check]` produces 15 distinct static pages (EN/RU/KK × overview, business-idea, pricing, cash-flow, for-consultants), deterministic sitemap XML (15 URLs, 45 language alternates), self-canonical and 3-way reciprocal hreflang. Existing CSS verified byte-identical. No x-default until approval.
- All five translated navigation, footer, skip link, topic links, OG locale and financial CTA query/hash per language. No new JS on landing pages and no finance/Marketing_calc.HTML/SHELTER root changes.
- The R2 source JSON files deliberately retain `readyForReview=false`, `isPublished=false`: source approval and live HTTP 200 are **not yet evidenced**. The generated indexable HTML/sitemap are release candidates in this branch only. **DO NOT MERGE until native KK review, full browser tests, CI and approval.**

## Kazakh copy — AI editorial proofreading, not native certification

Reviewed terminology against the project glossary and RU/EN intent; checked margin versus markup, revenue versus cash and Cash Flow / Available Cash.

- KK pricing: «Бір сатылым қанша тұрады?» → «Бір тапсырысты орындау қанша тұрады?».
- KK pricing: «Пайдалы баға қолма-қол ақша жеткілікті деген сөз емес» → «Пайда әкелетін баға төлемге ақша жететінін білдірмейді».
- KK cash-flow: «Кіріс» → «Сатудан түскен түсім» in revenue/profit comparison.
- KK for-consultants: «Nomad360-тың» → «Nomad360 калькуляторының».

A proficient **native Kazakh reviewer must still approve all five pages**, microcopy and SEO snippets. This review cannot certify native style or keyword demand.

## Acceptance gates

Run `node scripts/seo/test_locales.cjs`, `python scripts/seo/build.py --check`, existing SEO+finance CI, mobile Chromium 320/360/390/430/768/1280, real URL navigation, keyboard, overflow, source/render parity. Validate 15 real HTTPS 200, canonical, sitemap and no incorrect hreflang after authorized merge/deployment. Never claim production 200 from a branch. The only allowed new root artifact is `sitemap.xml`.

## Routed-link correction

The Russian legal entrypoint is `license/`, not `license/ru/`; all five RU footers and the shared renderer use that existing local route. Dedicated URL assertions are included in `test_locales.cjs`.

## Owner approval / historical C5 CI compatibility

Owner waived *human* KK linguistic sign-off for this release. Terminology and algorithmic editorial pass remains, and native KK quality is explicitly **not certified**. It is not permissible to claim native approval.

Historical C5/C4 browser comparators used pinned bases preceding the accepted C6 V1 refactor, and compared all rebuilt downloadable HTML/resources byte-for-byte to that legacy revision. The R3-only gate `scripts/seo/r3_ci_scope.cjs` rejects every changed path outside the exact SEO generator/pages/tests/docs/workflow allowlist, asserts deterministic 15-page output, and leaves all financial engine, formula, export, legal and storage sources identical to the tested main. For R3 only, C5 runs live 15-page browser + original numeric demo/restore/oracles; C4 runs the same contemporary browser while retaining its exact financial unit tests, Excel/OOXML and PDF acceptance steps. The original historical C4/C5 comparators continue for stylesheet changes and all other branches. This is not an exemption for changed financial sources.
