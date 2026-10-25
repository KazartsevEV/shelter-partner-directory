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
