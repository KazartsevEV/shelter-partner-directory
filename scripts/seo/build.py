#!/usr/bin/env python3
"""Generate small static entry pages; never import the financial engine."""
import argparse
from html import escape as e
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def render(config, page, pages, released, ui):
    base = config['origin'] + config['basePath']
    asset = config['basePath']
    home = base + page['locale'] + '/'
    topics = {p['topic']: p for p in pages if p['locale'] == page['locale']}
    chrome = ui[page['locale']]
    locale = page['locale']
    def link(href, label, extra=''):
        return '<a href="' + e(href, quote=True) + '"' + extra + '>' + e(label) + '</a>'
    body = []
    for section in page['sections']:
        parts = ['<section class="section"><h2>' + e(section['heading']) + '</h2>']
        parts += ['<p>' + e(p) + '</p>' for p in section.get('paragraphs', [])]
        if 'cards' in section:
            parts.append('<div class="grid">')
            for card in section['cards']:
                parts.append('<article class="card"><h3>' + e(card['heading']) + '</h3><p>' +
                             e(card['text']) + '</p>' + link(home + card['link'], card['label']) + '</article>')
            parts.append('</div>')
        if 'table' in section:
            head, *rows = section['table']
            parts.append('<table><thead><tr>' + ''.join('<th scope="col">' + e(t) + '</th>' for t in head) + '</tr></thead><tbody>')
            for first, second in rows:
                parts.append('<tr><th scope="row">' + e(first) + '</th><td>' + e(second) + '</td></tr>')
            parts.append('</tbody></table>')
        parts.append('</section>')
        body.append('\n'.join(parts))
    related = ''
    if page['related']:
        related = '<nav class="section" aria-label="' + e(chrome['related'], quote=True) + '">' + ''.join(
            link(topics[t]['canonicalUrl'], topics[t]['h1']) for t in page['related']) + '</nav>'
    # Reciprocal alternates are emitted ONLY for explicitly indexable locales.
    # Nonindexable preview pages never join the searchable hreflang graph.
    siblings = {p['locale']: p for p in pages if p['topic'] == page['topic']}
    alternates = '\n'.join(
        '<link rel="alternate" hreflang="' + lang + '" href="' +
        e(siblings[lang]['canonicalUrl'], quote=True) + '">'
        for lang in ('en', 'ru', 'kk') if locale in released and
        lang in released and lang in siblings
    )
    logo = asset + 'nomad360_wolf_open_circle.png'
    return f'''<!doctype html>
<html lang="{e(page['locale'])}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(page['title'])}</title>
<meta name="description" content="{e(page['description'], quote=True)}">
<meta name="robots" content="{e(page['robotsDirective'])}">
<link rel="canonical" href="{e(page['canonicalUrl'])}">
{alternates}
<meta property="og:type" content="website">
<meta property="og:title" content="{e(page['title'], quote=True)}">
<meta property="og:description" content="{e(page['description'], quote=True)}">
<meta property="og:url" content="{e(page['canonicalUrl'])}">
<meta property="og:locale" content="{e(chrome['ogLocale'])}">
<meta property="og:image" content="{e(base + 'nomad360_wolf_open_circle.png')}">
<meta property="og:image:alt" content="{e(chrome['logoAlt'], quote=True)}">
<link rel="stylesheet" href="{e(asset)}assets/nomad360-seo.css">
<link rel="stylesheet" href="{e(asset)}nomad360_static_fonts.css">
<link rel="stylesheet" href="{e(asset)}nomad360_palette.css">
</head>
<body>
<a class="skip-link" href="#main">{e(chrome['skip'])}</a>
<header><div class="wrap"><a class="brand" href="{e(home)}"><img src="{e(logo)}" alt="" width="42" height="42">Nomad360 lite</a><nav aria-label="{e(chrome['navLabel'], quote=True)}">{link(home, chrome['overview'])}{link(base + locale + '/pricing/', chrome['pricing'])}{link(base + locale + '/cash-flow/', chrome['cash'])}</nav></div></header>
<main class="wrap" id="main">
<section class="intro"><div class="intro-copy"><p class="eyebrow">{e(page['eyebrow'])}</p><h1>{e(page['h1'])}</h1><p>{e(page['lead'])}</p>{link(page['primaryCtaHref'], page['cta'], ' class="cta"')}</div><div class="intro-brand-mark"><span class="intro-logo-mask"><img class="intro-logo" src="{e(logo)}" alt="" width="200" height="200"></span><h2 class="intro-brand-tagline">Sky allows, guys deliver</h2></div></section>
{''.join(body)}
{related}
<p>{e(chrome['disclaimer'])}</p>
</main>
<footer><div class="wrap"><p>{e(chrome['footerCopy'])}</p><nav aria-label="{e(chrome['footerLabel'], quote=True)}">{link(base + 'Marketing_calc.HTML?lang=' + locale + '#nomad360-data', chrome['privacy'])}{link(base + chrome['licensePath'], chrome['license'])}</nav></div></footer>
</body>
</html>
'''



def read_pages(config, release):
    """Load editorial drafts without declaring them published or indexable."""
    en_pages = config['pages']
    assert len(en_pages) == 5 and {p['topic'] for p in en_pages} == {
        'overview', 'business-idea', 'pricing', 'cash-flow', 'for-consultants'
    }, 'Unexpected English source contract'
    released = tuple(release['indexableLocales'])
    assert len(set(released)) == len(released) and 'en' in released
    assert set(released) <= {'en', 'ru', 'kk'}
    assert set(released) <= set(release['approvedForReleaseLocales'])
    assert set(released) - {'en'} <= set(release['nativeReviewedLocales'])
    all_pages = list(en_pages)
    for locale in ('ru', 'kk'):
        for src in en_pages:
            filename = ROOT / 'docs/seo/locale-drafts' / locale / (src['topic'] + '.json')
            draft = json.loads(filename.read_text(encoding='utf-8'))
            expected = src['path'].replace('en/', locale + '/', 1)
            assert draft['sourceId'] == src['id'] and draft['path'] == expected
            assert draft['locale'] == locale and draft['topic'] == src['topic']
            assert draft['stage'] == 'editorial-draft-not-published'
            assert draft['isPublished'] is False and draft['readyForReview'] is False
            assert draft['related'] == src['related']
            assert len(draft['sections']) == len(src['sections'])
            assert draft['plannedCanonicalUrl'] == (
                config['origin'] + config['basePath'] + expected
            )
            assert draft['primaryCtaHref'] == src['primaryCtaHref'].replace(
                '?lang=en#', '?lang=' + locale + '#'
            )
            for mine, original in zip(draft['sections'], src['sections']):
                for field in ('cards', 'paragraphs', 'table'):
                    assert len(mine.get(field, [])) == len(original.get(field, [])), (
                        locale, src['topic'], field
                    )
                for mine_card, old_card in zip(
                    mine.get('cards', []), original.get('cards', [])
                ):
                    assert mine_card['link'] == old_card['link']
            page = dict(draft)
            page['id'] = locale.upper() + src['id'][2:]
            page['canonicalUrl'] = draft['plannedCanonicalUrl']
            page['robotsDirective'] = ('index,follow' if locale in released
                                       else 'noindex,follow')
            page['readyForReview'] = True
            all_pages.append(page)
    assert len(all_pages) == 15
    for field in ('id', 'path', 'canonicalUrl', 'title', 'description', 'h1'):
        values = [p[field] for p in all_pages]
        assert len(values) == len(set(values)), 'Duplicate page ' + field
    for page in all_pages:
        assert page['canonicalUrl'] == (
            config['origin'] + config['basePath'] + page['path']
        )
        assert page['path'].startswith(page['locale'] + '/')
        assert '..' not in page['path']
    return all_pages, released


def sitemap(config, pages, released):
    # Do not list preview/noindex/404 URLs; help pages are managed elsewhere.
    emitted = [p for p in pages if p['locale'] in released and
               p['readyForReview'] and p['robotsDirective'] == 'index,follow']
    by_topic = {p['topic']: {q['locale']: q for q in emitted
                            if q['topic'] == p['topic']} for p in emitted}
    blocks = []
    for page in emitted:
        langs = by_topic[page['topic']]
        alternates = ''.join(
            '    <xhtml:link rel="alternate" hreflang="' + lang +
            '" href="' + e(langs[lang]['canonicalUrl'], quote=True) + '"/>\n'
            for lang in ('en', 'ru', 'kk') if lang in released and lang in langs
        )
        blocks.append('  <url>\n    <loc>' + e(page['canonicalUrl']) +
                      '</loc>\n' + alternates + '  </url>')
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
            '\n'.join(blocks) + '\n</urlset>\n')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    config = json.loads((ROOT / 'scripts/seo/pages.json').read_text())
    release = json.loads((ROOT / 'scripts/seo/release-gates.json').read_text())
    ui = json.loads((ROOT / 'scripts/seo/locale-ui.json').read_text())
    assert set(ui) == {'en', 'ru', 'kk'}
    pages, released = read_pages(config, release)
    outputs = {page['path'] + 'index.html': render(config, page, pages, released, ui)
               for page in pages if page['readyForReview']}
    outputs['sitemap.xml'] = sitemap(config, pages, released)
    css = (ROOT / 'docs/seo/mockups/review.css').read_text().replace('../../../vendor/', '../vendor/')
    # Keep accepted phase-A mockups and their SHA-256 evidence immutable.
    # SEO phase B layers approved hero presentation into the generated output.
    banner_start = '.brand{display:flex;align-items:center;gap:12px}'
    assert css.count(banner_start) == 1
    css = css[:css.index(banner_start)] + (ROOT / 'scripts/seo/hero_banner.css').read_text(encoding='utf-8').rstrip('\n') + '\n'
    css += '\n.brand{text-decoration:none}.skip-link{position:absolute;left:16px;top:-100px}.skip-link:focus{top:8px;z-index:2;background:white;padding:12px}\n'
    outputs['assets/nomad360-seo.css'] = css
    for name, contents in outputs.items():
        target = ROOT / name
        if args.check:
            assert target.exists() and target.read_text() == contents, 'Stale generated file: ' + name
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(contents, encoding='utf-8')
    print('SEO_BUILD_CURRENT', len(outputs))


if __name__ == '__main__':
    main()
