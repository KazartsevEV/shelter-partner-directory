# HELP-SEO-01 · Indexed EN/RU/KK Help + generator-owned sitemap

Date: 2026-10-25. Owner explicitly directed all three published Help pages to be indexable. C7 #277 was merged before this change. R1 #278 also merged independently.

## Change scope

- Only the three previously published `en/help/`, `ru/help/`, `kk/help/` pages change `<meta name="robots" content="noindex,follow">` → `index,follow`, with the obsolete draft-only comment replaced by an owner-approval note. Title, description, canonical, all 3 language alternates, 17 H-chapter content, links and functional scripts remain intact.
- The common SEO generator checks that **each Help page is really indexable**, has exactly one self-canonical, 3 reciprocal `hreflang`, no duplicate anchor IDs, and H01–H17 with valid fragment targets **before** putting any Help URL into the sitemap.
- Generator now creates **18 sitemap URLs and 54 sitemap alternates** for five existing thematic groups plus Help (EN/RU/KK). The thematic 15 existing HTML outputs and SEO CSS are intentionally byte-identical. No `x-default` is invented.
- `python scripts/seo/build.py --check` still validates generated HTML/CSS/sitemap, and its `test_locales.cjs` assertions now include Help. Additional `node scripts/seo/test_help_index.cjs` verifies the complete 18-page language indexability/anchor/link matrix.

## Safety and acceptance

- No changes to `Marketing_calc.HTML`, V1/V2 financial formulas, tax logic, customer drafts, Excel, PDF, standalone partner HTML, licence, release keys, Formspree or DNS.
- Human Kazakh proofreading was waived by the owner. This does not imply native-speaker certification.
- Green CI and Pages deploy indicate technical publication, but **Google/Bing indexing is never guaranteed**. Index status must be checked in search consoles separately; do not report indexed search results based only on `index,follow`.
- A live check after Pages release is needed to verify the published Help robots, canonical, the actual sitemap response and the 18 URL availability.

## Commands

```sh
python scripts/seo/build.py --check
node scripts/seo/test_help_index.cjs
```

No change to C7 inventory/ledger or shared roadmap in this isolated PR.
