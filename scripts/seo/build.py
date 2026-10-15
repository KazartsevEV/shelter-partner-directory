#!/usr/bin/env python3
"""Generate small static entry pages; never import the financial engine."""
import argparse
from html import escape as e
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def render(config, page):
    base = config['origin'] + config['basePath']
    asset = config['basePath']
    home = base + page['locale'] + '/'
    topics = {p['topic']: p for p in config['pages'] if p['locale'] == page['locale']}
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
        related = '<nav class="section" aria-label="Related guides">' + ''.join(
            link(topics[t]['canonicalUrl'], topics[t]['h1']) for t in page['related']) + '</nav>'
    # Self only in phase B; unpublished RU/KK are never advertised as alternates.
    alternates = '<link rel="alternate" hreflang="en" href="' + e(page['canonicalUrl']) + '">'
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
<meta property="og:locale" content="en_US">
<meta property="og:image" content="{e(base + 'nomad360_wolf_open_circle.png')}">
<meta property="og:image:alt" content="Nomad360 wolf logo">
<link rel="stylesheet" href="{e(asset)}assets/nomad360-seo.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header><div class="wrap"><a class="brand" href="{e(home)}"><img src="{e(logo)}" alt="" width="42" height="42">Nomad360 lite</a><nav aria-label="Main navigation">{link(home, 'Overview')}{link(base + 'en/pricing/', 'Pricing')}{link(base + 'en/cash-flow/', 'Cash flow')}</nav></div></header>
<main class="wrap" id="main">
<section class="intro"><div class="intro-copy"><p class="eyebrow">{e(page['eyebrow'])}</p><h1>{e(page['h1'])}</h1><p>{e(page['lead'])}</p>{link(page['primaryCtaHref'], page['cta'], ' class="cta"')}</div><img class="intro-logo" src="{e(logo)}" alt="" width="200" height="200"></section>
{''.join(body)}
{related}
<p>Results describe the scenario you enter. They do not establish market demand or guarantee sales.</p>
</main>
<footer><div class="wrap"><p>Free, with no registration required. Calculations run in your browser. Optional exchange-rate requests and existing third-party resources have their own network behaviour.</p><nav aria-label="Footer">{link(base + 'Marketing_calc.HTML?lang=en#nomad360-data', 'Data and privacy')}{link(base + 'Marketing_calc.HTML?lang=en#nomad360-license', 'Licence and use')}</nav></div></footer>
</body>
</html>
'''


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    config = json.loads((ROOT / 'scripts/seo/pages.json').read_text())
    for field in ('id', 'path', 'canonicalUrl', 'title', 'description', 'h1'):
        values = [p[field] for p in config['pages']]
        assert len(values) == len(set(values)), 'Duplicate page ' + field
    for page in config['pages']:
        assert page['canonicalUrl'] == config['origin'] + config['basePath'] + page['path']
        assert page['path'].startswith(page['locale'] + '/') and '..' not in page['path']
        assert page['locale'] == 'en', 'Phase B is English only'
    outputs = {page['path'] + 'index.html': render(config, page) for page in config['pages'] if page['readyForReview']}
    css = (ROOT / 'docs/seo/mockups/review.css').read_text().replace('../../../vendor/', '../vendor/')
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
