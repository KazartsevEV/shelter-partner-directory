#!/usr/bin/env python3
"""Validate the review package, not the unimplemented SEO-07 application."""
import csv
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'docs/seo/evidence'


def read(name):
    return json.loads((EVIDENCE / name).read_text(encoding='utf-8'))



def comparison_base(base_ref):
    # GitHub's tested merge can contain newer main documentation than event.base.sha.
    # Its first parent is the actual tested base; never charge those files to the PR.
    if os.environ.get('GITHUB_EVENT_NAME') == 'pull_request' and os.environ.get('GITHUB_REF','').endswith('/merge'):
        parents = subprocess.check_output(['git','show','-s','--format=%P','HEAD'],cwd=ROOT,text=True).split()
        assert len(parents) == 2, 'Expected the GitHub pull-request test merge'
        return parents[0]
    return subprocess.check_output(['git','merge-base',base_ref,'HEAD'],cwd=ROOT,text=True).strip()

def main():
    manifest = read('protected-files.json')
    # PR #145 was already approved and merged before this SEO branch.
    # Check its exact accepted bytes instead of misclassifying those three
    # intentional marketing changes as SEO damage; retain the phase-A
    # immutable SHA-256 baseline for every other protected file.
    accepted_marketing_commit = '5c3df1fdfa12114366518c0271d7866a0f2dc8bf'
    approved_marketing_files = {
        'nomad360_calculator_ui.css',
        'nomad360_header.js',
        'nomad360_locale_core.js',
    }
    for name, expected in manifest['files'].items():
        raw = (ROOT / name).read_bytes()
        if name in {'Marketing_calc.HTML','nomad360_header.js','nomad360_locale_core.js','nomad360_calculator_ui.js','nomad360_calculator_ui.css'}:
            raw = subprocess.check_output(['node','-e',
                "process.stdout.write(require('./tests/helpers/return-contract.cjs').stripReturn(process.argv[1],require('node:fs').readFileSync(0,'utf8')))",name],
                input=raw,cwd=ROOT)
        # Exact permitted presentation delta; accepted B2B/legal bytes stay protected.
        if name == 'nomad360_calculator_ui.css':
            raw = raw.split(b'\n/* SEO-07 approved keyword banner; original offer unchanged. */', 1)[0]
        if name == 'nomad360_locale_core.js':
            raw = re.sub(rb'^ \["business\.ideaSeo(?:Title|Copy)",[^\n]+\n', b'', raw, flags=re.M)
        if name == 'nomad360_header.js':
            raw = raw.replace(b'''    // SEO-07: reuse the header asset; the existing HTML bundler inlines this URL.
    const seoBanner=document.getElementById('nomad360-seo-banner');
    if(seoBanner&&!seoBanner.querySelector('.nomad-seo-logo'))seoBanner.insertAdjacentHTML('beforeend','<img class="nomad-seo-logo" src="./nomad360_wolf_open_circle.png" alt="" width="140" height="140" loading="lazy">');
''', b'', 1)
        # An independently approved later B2B-copy edit must not weaken the old
        # SEO baseline: undo ONLY its exact white/orange consulting presentation
        # before comparing the protected source with the accepted snapshot.
        if name == 'nomad360_calculator_ui.css':
            marker = b'\n/* Consulting offer: white question, orange benefits following the Nomad360 brand palette. */\n'
            assert raw.count(marker) == 1
            prefix, suffix = raw.split(marker, 1)
            assert b'.nomad-footer .nomad-embed-b2b-benefits' in suffix
            assert b'.nomad-embed-toggle{' in suffix
            raw = prefix + b'\n' + suffix[suffix.index(b'.nomad-embed-toggle{'):]
        if name == 'nomad360_header.js':
            for updated, approved in [
                ('Занимаетесь консалтингом?', 'Работаете в B2B? Привлеките полезный трафик бесплатно.'),
                ('Do you work in consulting?', 'Work in B2B? Attract relevant traffic for free.'),
                ('Консалтингпен айналысасыз ба?', 'B2B саласында жұмыс істейсіз бе? Пайдалы трафикті тегін тартыңыз.'),
            ]:
                after, before = updated.encode(), approved.encode()
                assert raw.count(b'"embedB2BTitle": "' + after) == 1
                raw = raw.replace(b'"embedB2BTitle": "' + after, b'"embedB2BTitle": "' + before, 1)
            lines = raw.splitlines(keepends=True)
            assert sum(b'"embedB2BPoints": ' in line for line in lines) == 3
            assert sum(b'"embedB2BFocus": ' in line for line in lines) == 3
            raw = b''.join(line for line in lines if b'"embedB2BPoints": ' not in line and b'"embedB2BFocus": ' not in line)
            start = b'    const b2bBenefits=t.embedB2BPoints.map(line=>{\n'
            end = b'    }).join(\'\');\n'
            assert raw.count(start) == 1 and raw.count(end) == 1
            a = raw.index(start)
            b = raw.index(end, a) + len(end)
            raw = raw[:a] + raw[b:]
            benefits_line = b'      \'<ul class="nomad-embed-b2b-benefits">\'+b2bBenefits+\'</ul>\'+\n'
            assert raw.count(benefits_line) == 1
            raw = raw.replace(benefits_line, b'', 1)
        if name == 'nomad360_locale_core.js':
            rows = raw.splitlines(keepends=True)
            extra = b'"interface.header.embedB2BPoints.'
            focus = b'"interface.header.embedB2BFocus"'
            assert sum(extra in line for line in rows) == 5
            assert sum(focus in line for line in rows) == 1
            raw = b''.join(line for line in rows if extra not in line and focus not in line)
            from_title = b' ["interface.header.embedB2BTitle","Do you work in consulting?","Занимаетесь консалтингом?","Консалтингпен айналысасыз ба?"],'
            to_title = b' ["interface.header.embedB2BTitle","Work in B2B? Attract relevant traffic for free.","Работаете в B2B? Привлеките полезный трафик бесплатно.","B2B саласында жұмыс істейсіз бе? Пайдалы трафикті тегін тартыңыз."],'
            assert raw.count(from_title) == 1
            raw = raw.replace(from_title, to_title, 1)
        if name in approved_marketing_files:
            approved = subprocess.check_output(
                ['git', 'show', accepted_marketing_commit + ':' + name], cwd=ROOT)
            if name == 'nomad360_header.js':
                # Licence fix changes exactly three fall-back strings and one href.
                # Every other byte from approved PR #145 remains protected.
                def mask_license_footer(content):
                    lines = content.decode('utf-8').splitlines()
                    copy_rows = sum('"licenseCopy": ' in x for x in lines)
                    link_rows = sum('nomad360-license" class="nomad-meta-block"' in x for x in lines)
                    assert copy_rows == 3 and link_rows == 1
                    return '\n'.join('<ACCEPTED-LICENSE-EDIT>' if
                                     ('"licenseCopy": ' in x or
                                      'nomad360-license" class="nomad-meta-block"' in x)
                                     else x for x in lines)
                assert mask_license_footer(raw) == mask_license_footer(approved), name
            elif name == 'nomad360_locale_core.js':
                def mask_license_locale(content):
                    lines = content.decode('utf-8').splitlines()
                    assert sum('"interface.header.licenseCopy"' in x for x in lines) == 1
                    return '\n'.join('<ACCEPTED-LICENSE-ROW>' if
                                     '"interface.header.licenseCopy"' in x else x
                                     for x in lines)
                assert mask_license_locale(raw) == mask_license_locale(approved), name
            else:
                assert raw == approved, 'Approved PR #145 source changed: ' + name
            continue
        if name == 'Marketing_calc.HTML':
            raw = raw.replace((ROOT / 'tests/fixtures/seo-keyword-banner.html').read_bytes(),
                              (ROOT / 'tests/fixtures/seo-original-results.html').read_bytes(), 1)
            # Phase B adds exactly one canonical and one isolated language module.
            raw = raw.replace(b'    <link rel="canonical" href="https://kazartsevev.github.io/shelter-partner-directory/Marketing_calc.HTML">\n', b'', 1)
            raw = raw.replace(b'<script src="./nomad360_seo_language.js"></script>\n', b'', 1)
        assert hashlib.sha256(raw).hexdigest() == expected, name
    # Synthetic PR merges also include newer main documentation. Compare this
    # PR to its actual base; keep the production-byte guard on the audited SHA.
    base_ref = os.environ.get('SEO_BASE_REF', 'origin/main')
    merge_base = comparison_base(base_ref)
    changed = subprocess.check_output(['git', 'diff', '--name-only', merge_base, '--'],
                                      cwd=ROOT, text=True).splitlines()
    assert all(p.startswith(('docs/seo/', 'scripts/seo/', 'en/', 'docs/localization/l0/',
                             'license/', 'scripts/legal/', 'docs/reviews/return-7a/')) or p in (
        'nomad360_return.js', 'nomad360.webmanifest', 'nomad360_calculator_ui.js',
        'scripts/build-return-icons.py', 'assets/nomad360-icons/nomad360.ico',
        'assets/nomad360-icons/icon-180.png', 'assets/nomad360-icons/icon-192.png',
        'assets/nomad360-icons/icon-512.png',
        'tests/return_7a_browser.cjs', 'tests/return_7a_scope.test.cjs', 'tests/helpers/return-contract.cjs',
        '.github/workflows/return-7a.yml',
        'nomad360_header.js', 'nomad360_locale_core.js', 'assets/nomad360-legal.css',
        'tests/nomad360_marketing_browser.cjs', 'tests/nomad360_embed_footer_browser.test.cjs',
        'tests/nomad360_public_license.test.cjs', '.github/workflows/nomad360-public-license.yml',
        'docs/nomad360-codex-task-map.md', 'docs/reviews/seo-07-phase-a-review.md',
        'docs/reviews/seo-07-phase-b-review.md', 'docs/reviews/seo-banner-review.md', 'Marketing_calc.HTML',
        'nomad360_seo_language.js', 'assets/nomad360-seo.css', 'nomad360_calculator_ui.css',
        'tests/nomad360_calculator_ui_browser.test.cjs',
        'tests/marketing_calc_first_user_journey.test.cjs',
        'tests/fixtures/seo-keyword-banner.html', 'tests/fixtures/seo-original-results.html',
        'tests/helpers/seo-html-contract.cjs', 'tests/seo_language.test.cjs',
        'tests/nomad360_marketing_scope.test.cjs', 'tests/type02_scope.test.cjs',
        'tests/nomad360_locale_semantic.test.cjs',
        '.github/workflows/seo-07-phase-a.yml') for p in changed), changed
    audit = read('live-url-audit.json')['results']
    assert len(audit) == 29 and not any('error' in r for r in audit)
    assert sum(r['status'] == 200 for r in audit) == 10
    assert sum(r['status'] == 404 for r in audit) == 19
    proposal = json.loads((ROOT / 'docs/seo/url-proposal.json').read_text())['records']
    assert len(proposal) == 15 and len({r['canonicalUrl'] for r in proposal}) == 15
    observed = {r['url']: r['status'] for r in audit}
    for r in proposal:
        assert r['isPublished'] is False and r['observedStatus'] == 404
        assert observed[r['canonicalUrl']] == 404
        assert '/shelter-partner-directory/' + r['locale'] + '/' in r['canonicalUrl']
    with (ROOT / 'docs/seo/semantic-map.csv').open(encoding='utf-8', newline='') as f:
        semantic = list(csv.DictReader(f))
    assert len(semantic) == 21
    research = read('search-observations.json')['queries']
    assert len(research) == 15 and all(r['results'] for r in research)
    assert len({r['id'] for r in research}) == 15
    browser = read('live-browser.json')
    assert {r['storedLanguage'] for r in browser['cases']} == {'en', 'ru', 'kk'}
    for r in browser['cases']:
        assert not r['errors'] and r['storedLanguage'] == r['initial']['language']
        assert r['queryLanguage'] != r['initial']['language']
        assert r['v2Opened'] and r['b2bOpened'] and 'service-work-screen' in r['serviceVisibleSections']
    assert {r['finance'] for r in browser['demoCases']} == {'cash', 'credit'}
    assert all(r['independentOraclePassed'] and r['languageChangePreservesNumbers']
               for r in browser['demoCases'])
    assert all(r['localMatch'] is True and r['outcome'] == 200 for r in browser['network']
               if r['url'].startswith('https://kazartsevev.github.io/shelter-partner-directory/'))
    for record in read('artifact-manifest.json')['files']:
        raw = (ROOT / 'docs/seo' / record['path']).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == record['sha256'], record['path']
    print(json.dumps({'phase': 'A only', 'protectedFiles': len(manifest['files']),
                      'httpObservations': len(audit), 'queries': len(research),
                      'scopeExclusions': 6, 'candidateUrls': len(proposal),
                      'liveBrowserCases': 3, 'independentDemoChecks': 2}))


if __name__ == '__main__':
    main()
