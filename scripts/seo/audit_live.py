#!/usr/bin/env python3
"""Read-only SEO-07 baseline audit. Uses normal urllib proxy/CA configuration."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import urllib.error
import urllib.request

BASE = 'https://kazartsevev.github.io/shelter-partner-directory/'
HOST = 'https://kazartsevev.github.io/'


class Metadata(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.data = {'lang': None, 'title': '', 'description': [], 'canonical': [],
                     'hreflang': [], 'robots': [], 'h1': [], 'scriptSources': []}
        self.active = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html':
            self.data['lang'] = a.get('lang')
        if tag in ('title', 'h1'):
            self.active = tag
            if tag == 'h1':
                self.data['h1'].append('')
        if tag == 'meta' and a.get('name', '').lower() in ('description', 'robots'):
            self.data[a['name'].lower()].append(a.get('content', ''))
        if tag == 'link' and a.get('rel') == 'canonical':
            self.data['canonical'].append(a.get('href'))
        if tag == 'link' and a.get('hreflang'):
            self.data['hreflang'].append({'lang': a['hreflang'], 'href': a.get('href')})
        if tag == 'script' and a.get('src'):
            self.data['scriptSources'].append(a['src'])

    def handle_endtag(self, tag):
        if self.active == tag:
            self.active = None

    def handle_data(self, value):
        if self.active == 'title':
            self.data['title'] += value
        if self.active == 'h1':
            self.data['h1'][-1] += value


def inspect(url):
    record = {'url': url, 'checkedAt': datetime.now(timezone.utc).isoformat()}
    try:
        try:
            response = urllib.request.urlopen(url, timeout=40)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            raw = response.read()
            record.update(status=response.status, finalUrl=response.url,
                          contentType=response.headers.get('Content-Type'),
                          xRobotsTag=response.headers.get('X-Robots-Tag'),
                          bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
        if 'html' in (record['contentType'] or '').lower():
            parser = Metadata()
            parser.feed(raw.decode('utf-8', errors='replace'))
            record['source'] = parser.data
        if url.endswith('robots.txt') and record['status'] == 200:
            record['robotsText'] = raw.decode('utf-8', errors='replace')
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        record['error'] = str(error)
    return record


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    paths = ['', 'index.html', 'Marketing_calc.HTML',
             'Marketing_calc.HTML?lang=en',
             'Marketing_calc.HTML?demo=shopper&finance=cash',
             'Marketing_calc.HTML?demo=shopper&finance=credit',
             'sitemap.xml', 'robots.txt', 'seo-07-missing-page-check/',
             'nomad360_calculator_ui.js', 'nomad360_header.js',
             'nomad360_locale_core.js', 'nomad360_calculator_ui.css']
    paths += [locale + '/' + topic for locale in ('en', 'ru', 'kk')
              for topic in ('', 'business-idea/', 'pricing/', 'cash-flow/', 'for-consultants/')]
    urls = [BASE + path for path in paths] + [HOST + 'robots.txt']
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(inspect, urls))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({'baseUrl': BASE, 'results': results},
                                      ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'requests': len(results),
                      'http200': sum(r.get('status') == 200 for r in results),
                      'http404': sum(r.get('status') == 404 for r in results),
                      'errors': sum('error' in r for r in results)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
