#!/usr/bin/env python3
"""Validate the review package, not the unimplemented SEO-07 application."""
import csv
import hashlib
import json
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'docs/seo/evidence'


def read(name):
    return json.loads((EVIDENCE / name).read_text(encoding='utf-8'))


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
        if name in approved_marketing_files:
            approved = subprocess.check_output(
                ['git', 'show', accepted_marketing_commit + ':' + name], cwd=ROOT)
            assert raw == approved, 'Approved PR #145 source changed: ' + name
            continue
        if name == 'Marketing_calc.HTML':
            # Phase B adds exactly one canonical and one isolated language module.
            raw = raw.replace(b'    <link rel="canonical" href="https://kazartsevev.github.io/shelter-partner-directory/Marketing_calc.HTML">\n', b'', 1)
            raw = raw.replace(b'<script src="./nomad360_seo_language.js"></script>\n', b'', 1)
        assert hashlib.sha256(raw).hexdigest() == expected, name
    # Synthetic PR merges also include newer main documentation. Compare this
    # PR to its actual base; keep the production-byte guard on the audited SHA.
    base_ref = os.environ.get('SEO_BASE_REF', 'origin/main')
    merge_base = subprocess.check_output(['git', 'merge-base', base_ref, 'HEAD'],
                                        cwd=ROOT, text=True).strip()
    changed = subprocess.check_output(['git', 'diff', '--name-only', merge_base, '--'],
                                      cwd=ROOT, text=True).splitlines()
    assert all(p.startswith(('docs/seo/', 'scripts/seo/', 'en/', 'docs/localization/l0/')) or p in (
        'docs/nomad360-codex-task-map.md', 'docs/reviews/seo-07-phase-a-review.md',
        'docs/reviews/seo-07-phase-b-review.md', 'Marketing_calc.HTML',
        'nomad360_seo_language.js', 'assets/nomad360-seo.css',
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
