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

def mask_stage_7b5_pdf(raw):
    # Exact bounded exception: only the V1 print renderer may differ.
    start = b'function exportProductCalculationPdf() {'
    end = b'\n        function aggregateDaysText('
    assert raw.count(start) == 1
    a = raw.index(start)
    b = raw.index(end, a + len(start))
    return raw[:a] + b'<ACCEPTED-7B5-PDF-RENDERER>' + raw[b:]



def strip_task09_html(raw):
    # One exact, standalone widget asset pair is approved after 7B-6.
    # Refuse a duplicate, unpaired asset or changed insertion position.
    css = b'    <link rel="stylesheet" href="./nomad360_bug_report.css">\n'
    script = b'<script src="./nomad360_bug_report.js"></script>\n'
    css_anchor = b'<link rel="stylesheet" href="./nomad360_calculator_ui.css">\n' + css
    script_anchor = script + b'</body>'
    assert raw.count(css) == raw.count(script) == 1, 'Task09 unexpected loader count'
    assert css_anchor in raw and script_anchor in raw, 'Task09 loader moved'
    return raw.replace(css, b'', 1).replace(script, b'', 1)


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
        if name == 'Marketing_calc.HTML':
            raw = strip_task09_html(raw)
            assert raw.count(b'<script src="./nomad360_sales_tax_v2.js"></script>\n') == 1
        if name in ('portfolio_v2_ui.js', 'portfolio_v2_linked_ui.js'):
            # Only the exact reviewed stage-4 UI integration is exempt from
            # historical pre-Sales-Tax bytes. A later unapproved edit is RED.
            approved = subprocess.check_output(
                ['git', 'show', '6c5c0e3a4927fb50b88ab99914145bb9016bb24a:' + name], cwd=ROOT)
            source = subprocess.check_output(['node', '-e',
                "process.stdout.write(require('./tests/helpers/sales-tax-7b5-v2-scope.cjs').revertApprovedV2TaxUi(process.argv[1],require('node:fs').readFileSync(0,'utf8')))", name],
                input=raw, cwd=ROOT)
            assert source == approved, 'Unreviewed V2 UI delta outside exact 7B-5 tax hunks: ' + name
            continue
        if name == 'nomad360_repo_traffic.json':
            # The Insights bot refreshes this file directly on main.
            # On a PR merge require exact equality with the tested base,
            # not an obsolete historical SHA; never allow PR edits here.
            base = comparison_base(os.environ.get('SEO_BASE_REF', 'origin/main'))
            current = subprocess.check_output(['git', 'show', base + ':' + name], cwd=ROOT)
            assert raw == current, 'Repo traffic differs from tested main; PR edit forbidden'
            continue
        if name == 'nomad360_calculator_ui.css':
            # Check full shipping CSS before the established RET-07A stripping
            # helper removes later presentation sections.
            status = b'\n/* Explicit status colour: no faded grey when installation was confirmed. */\n#nomad360-return p.nomad-return-status{color:#16375a!important;opacity:1!important;font:400 16px/1.5 var(--nd-font)}'
            sample = b'/* Simple service examples only: user controls remain free to edit after selecting a sample. */\n'
            ret = b'\n/* RET-07A presentation additions. */'
            assert raw.count(status) == 1
            assert raw.count(sample) == 1
            assert raw.count(b'.nomad-simple-demo-note{') == 1
            assert raw.count(ret) == 1
            assert raw.index(status) > raw.index(ret)
            assert raw.index(sample) > raw.index(ret)
        if name in {'Marketing_calc.HTML','nomad360_header.js','nomad360_locale_core.js','nomad360_calculator_ui.js','nomad360_calculator_ui.css'}:
            raw = subprocess.check_output(['node','-e',
                "process.stdout.write(require('./tests/helpers/return-contract.cjs').stripReturn(process.argv[1],require('node:fs').readFileSync(0,'utf8')))",name],
                input=raw,cwd=ROOT)
        # Exact permitted presentation delta; accepted B2B/legal bytes stay protected.
        if name == 'nomad360_calculator_ui.css':
            # Keep the historical immutable SEO snapshot comparison unchanged.
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
            if raw.count(marker) == 1:
                prefix, suffix = raw.split(marker, 1)
                assert b'.nomad-footer .nomad-embed-b2b-benefits' in suffix
                assert b'.nomad-embed-toggle{' in suffix
                raw = prefix + b'\n' + suffix[suffix.index(b'.nomad-embed-toggle{'):]
            else:
                # B2B-BANNER is an explicitly approved presentation-only delta.
                # Restore just the old consulting CSS from its frozen accepted SHA,
                # preserving the protected remainder of the file byte-for-byte.
                new_marker = b'\n/* B2B-BANNER: native responsive HTML, visually paired with the upper SEO banner. */\n'
                assert raw.count(new_marker) == 1
                begin = raw.index(new_marker)
                end = raw.index(b'.nomad-embed-toggle{', begin)
                approved_css = subprocess.check_output(
                    ['git', 'show', accepted_marketing_commit + ':nomad360_calculator_ui.css'], cwd=ROOT)
                reference_start = approved_css.index(b'.nomad-footer .nomad-embed-actions{')
                reference_end = approved_css.index(b'.nomad-embed-toggle{', reference_start)
                raw = raw[:begin] + b'\n' + approved_css[reference_start:reference_end] + raw[end:]
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
            assert sum(b'"embedB2BSlogan": ' in line for line in lines) in (0, 3)
            raw = b''.join(line for line in lines if not any(
                token in line for token in (b'"embedB2BPoints": ', b'"embedB2BFocus": ', b'"embedB2BSlogan": ')))
            new_start = b'    // Inline SVG icons are decoration: every sales message stays translatable HTML.\n'
            old_start = b'    const b2bBenefits=t.embedB2BPoints.map(line=>{\n'
            start = new_start if new_start in raw else old_start
            end = b'    }).join(\'\');\n'
            assert raw.count(start) == 1 and raw.count(end) == 1
            a = raw.index(start)
            b = raw.index(end, a) + len(end)
            raw = raw[:a] + raw[b:]
            benefits_line = b'      \'<ul class="nomad-embed-b2b-benefits">\'+b2bBenefits+\'</ul>\'+\n'
            if benefits_line in raw:
                raw = raw.replace(benefits_line, b'', 1)
            else:
                # Replace only the B2B HTML header/cards/brand, up to the unchanged
                # toggle. Keep every comparison, download and legal element intact.
                new_section = b'      \'<section id="nomad360-embed" class="nomad-embed-actions" tabindex="-1" aria-labelledby="nomad360-embed-heading">\'+\n'
                button = b'      \'<button type="button" class="nomad-embed-download nomad-embed-toggle"'
                assert raw.count(new_section) == 1 and raw.count(button) == 1
                approved_header = subprocess.check_output(
                    ['git', 'show', accepted_marketing_commit + ':nomad360_header.js'], cwd=ROOT)
                old_section = b'      \'<section id="nomad360-embed" class="nomad-embed-actions" tabindex="-1">\'+\n'
                assert approved_header.count(old_section) == 1 and approved_header.count(button) == 1
                a, b = raw.index(new_section), raw.index(button, raw.index(new_section))
                c, d = approved_header.index(old_section), approved_header.index(button, approved_header.index(old_section))
                raw = raw[:a] + approved_header[c:d] + raw[b:]
        if name == 'nomad360_locale_core.js':
            rows = raw.splitlines(keepends=True)
            extra = b'"interface.header.embedB2BPoints.'
            focus = b'"interface.header.embedB2BFocus"'
            assert sum(extra in line for line in rows) in (3, 5)
            assert sum(focus in line for line in rows) == 1
            assert sum(b'"interface.header.embedB2BSlogan"' in line for line in rows) in (0, 1)
            raw = b''.join(line for line in rows if extra not in line and focus not in line
                           and b'"interface.header.embedB2BSlogan"' not in line)
            from_title = ' ["interface.header.embedB2BTitle","Do you work in consulting?","Занимаетесь консалтингом?","Консалтингпен айналысасыз ба?"],'.encode('utf-8')
            to_title = ' ["interface.header.embedB2BTitle","Work in B2B? Attract relevant traffic for free.","Работаете в B2B? Привлеките полезный трафик бесплатно.","B2B саласында жұмыс істейсіз бе? Пайдалы трафикті тегін тартыңыз."],'.encode('utf-8')
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
                    # 7B-4 adds seven named display-only translations. Permit
                    # exactly these new keys, without accepting edits to any
                    # existing translations or application/financial code.
                    tax_keys = {
                        'tax.v2SalesTaxLabel', 'tax.v2NoneLabel',
                        'tax.v2SalesTaxRate', 'tax.v2BuyerSummary',
                        'tax.v2DeductionsNotice', 'tax.v2DeductionsNoticeLinked',
                        'tax.v2TaxMode', 'tax.v2VatLabel', 'tax.v2NoticeFull'
                    }
                    tax_rows = [x for x in lines if x.startswith(' ["tax.v2')]
                    actual_keys = [x.split('"')[1] for x in tax_rows]
                    assert len(actual_keys) == len(set(actual_keys))
                    assert set(actual_keys) in (set(), tax_keys), 'Unapproved 7B-4 locale row'
                    return '\n'.join('<ACCEPTED-LICENSE-ROW>' if
                                     '"interface.header.licenseCopy"' in x else x
                                     for x in lines if x not in tax_rows)
                assert mask_license_locale(raw) == mask_license_locale(approved), name
            else:
                assert raw == approved, 'Approved PR #145 source changed: ' + name
            continue
        if name == 'Marketing_calc.HTML':
            # Stage 7B-3 contributes exactly one optional service module loader.
            stage3 = b'<script src="./nomad360_sales_tax_service_v1.js"></script>\n'
            # Stage 4 loader has already been removed by stripReturn above.
            assert b'<script src="./nomad360_sales_tax_v2.js"></script>' not in raw
            assert raw.count(stage3) == 1
            raw = raw.replace(stage3, b'', 1)
            raw = raw.replace((ROOT / 'tests/fixtures/seo-keyword-banner.html').read_bytes(),
                              (ROOT / 'tests/fixtures/seo-original-results.html').read_bytes(), 1)
            # Phase B adds exactly one canonical and one isolated language module.
            raw = raw.replace(b'    <link rel="canonical" href="https://kazartsevev.github.io/shelter-partner-directory/Marketing_calc.HTML">\n', b'', 1)
            raw = raw.replace(b'<script src="./nomad360_seo_language.js"></script>\n', b'', 1)
        if name == 'nomad360_price_export.js':
            # Sales Tax extends the DOCUMENT projection only, not XLSX writer
            # or the accepted locale table. Audit every other byte against 7B-4.
            approved = subprocess.check_output(
                ['git','show','817e5e14ae65091f474442a672831d93a3ea8f28:' + name], cwd=ROOT)
            assert hashlib.sha256(approved).hexdigest() == expected, 'Accepted exporter baseline drift'
            document_fn = re.compile(rb'(?ms)^function document\([^\n]*\)\{.*?^\}\n')
            assert len(document_fn.findall(raw)) == len(document_fn.findall(approved)) == 1
            assert document_fn.sub(b'function document(/* 7B5 projection */){}\n', raw) == (
                document_fn.sub(b'function document(/* 7B5 projection */){}\n', approved)), name
            continue
        if name == 'nomad360_calculator_ui.js':
            # Later approved 7B-5 changes only table, printable and language
            # lifecycle renderers. Pin every OTHER byte to the accepted 7B-4
            # source, which itself must match the frozen SEO protected SHA.
            accepted = subprocess.check_output(
                ['git','show','817e5e14ae65091f474442a672831d93a3ea8f28:' + name], cwd=ROOT)
            accepted = subprocess.check_output(['node','-e',
                "process.stdout.write(require('./tests/helpers/return-contract.cjs').stripReturn(process.argv[1],require('node:fs').readFileSync(0,'utf8')))",name],
                input=accepted,cwd=ROOT)
            assert hashlib.sha256(accepted).hexdigest() == expected, 'Stage 4 SEO protected source drift'
            def mask_approved_print_functions(source):
                for label in (b'table', b'printable', b'setLanguage'):
                    matcher = re.compile(rb'(?ms)^function ' + label + rb'\([^\n]*\)\{.*?^\}\n')
                    assert len(matcher.findall(source)) == 1, 'Unbounded export function: ' + label.decode()
                    source = matcher.sub(b'function ' + label + b'(/* 7B5 approved */){}\n', source, count=1)
                return source
            assert mask_approved_print_functions(raw) == mask_approved_print_functions(accepted), name
            continue
        if name == 'Marketing_calc.HTML':
            # Preserve the exact SEO-era source outside the approved 7B-5 PDF function.
            old = subprocess.check_output(['git','show','85d98d9:Marketing_calc.HTML'], cwd=ROOT)
            assert hashlib.sha256(old).hexdigest() == expected, 'SEO historic baseline drift'
            assert mask_stage_7b5_pdf(raw) == mask_stage_7b5_pdf(old), name
        else:
            assert hashlib.sha256(raw).hexdigest() == expected, name
    # Synthetic PR merges also include newer main documentation. Compare this
    # PR to its actual base; keep the production-byte guard on the audited SHA.
    base_ref = os.environ.get('SEO_BASE_REF', 'origin/main')
    merge_base = comparison_base(base_ref)
    changed = subprocess.check_output(['git', 'diff', '--name-only', merge_base, '--'],
                                      cwd=ROOT, text=True).splitlines()
    assert all(p.startswith(('docs/seo/', 'scripts/seo/', 'en/', 'docs/localization/l0/',
                             'license/', 'scripts/legal/', 'docs/reviews/return-7a/',
                             'docs/reviews/unified-banners-01/', 'assets/nomad360-banners/',
                             'tests/fixtures/unified-banners/')) or p in (
        'nomad360_return.js', 'nomad360.webmanifest', 'nomad360_calculator_ui.js',
        'scripts/build-return-icons.py', 'assets/nomad360-icons/nomad360.ico',
        'assets/nomad360-icons/icon-180.png', 'assets/nomad360-icons/icon-192.png',
        'assets/nomad360-icons/icon-512.png',
        'tests/return_7a_browser.cjs', 'tests/return_7a_scope.test.cjs', 'tests/helpers/return-contract.cjs',
        '.github/workflows/return-7a.yml',
        'nomad360_header.js', 'nomad360_locale_core.js', 'assets/nomad360-legal.css',
        'tests/nomad360_marketing_browser.cjs', 'tests/nomad360_embed_footer_browser.test.cjs',
        'tests/nomad360_public_license.test.cjs', '.github/workflows/nomad360-public-license.yml',
        'docs/nomad360-codex-task-map.md', 'docs/reviews/sales-tax-7b/STAGE_7B3_ACCEPTANCE.md', 'docs/reviews/seo-07-phase-a-review.md',
        'docs/reviews/seo-07-phase-b-review.md', 'docs/reviews/seo-banner-review.md', 'docs/reviews/marketing-consulting-banner-review.md', 'Marketing_calc.HTML',
        'nomad360_seo_language.js', 'assets/nomad360-seo.css', 'nomad360_calculator_ui.css',
        'tests/nomad360_calculator_ui_browser.test.cjs',
        'tests/nomad360_price_export_browser.test.cjs',
        'tests/marketing_calc_first_user_journey.test.cjs',
        'tests/fixtures/seo-keyword-banner.html', 'tests/fixtures/seo-original-results.html',
        'tests/helpers/seo-html-contract.cjs', 'tests/seo_language.test.cjs',
        'tests/nomad360_marketing_scope.test.cjs', 'tests/type02_scope.test.cjs',
        'tests/nomad360_locale_semantic.test.cjs',
        '.github/workflows/seo-07-phase-a.yml',
        'nomad360_simple_service_examples.js', 'tests/simple_service_examples_browser.cjs',
        '.github/workflows/simple-service-examples.yml',
        # 7B-1 adds a NEW standalone module and tests only; no SEO or VAT source edits.
        'nomad360_sales_tax.js', 'tests/sales_tax_7b_pure.test.cjs',
        '.github/workflows/sales-tax-7b-pure.yml',
        # 7B-2: protected HTML is checked byte-for-byte after the two exact
        # standalone script tags are removed by return-contract.cjs.
        'nomad360_sales_tax_v1.js', 'tests/sales_tax_7b_goods_browser.cjs',
        '.github/workflows/sales-tax-7b-goods.yml',
        # Stage 7B-3: separate, self-tested service adapter and exact scope guards.
        'nomad360_sales_tax_service_v1.js', 'tests/sales_tax_7b_services_browser.cjs',
        'nomad360_sales_tax_v2.js', 'tests/sales_tax_7b_v2_projection.test.cjs',
        'tests/sales_tax_7b_v2_browser.cjs', '.github/workflows/sales-tax-7b-v2.yml',
        '.github/workflows/sales-tax-7b4-refresh-l0.yml',
        'portfolio_v2_ui.js', 'portfolio_v2_linked_ui.js',
        '.github/workflows/sales-tax-7b-services.yml',
        'tests/return_7a_scope.test.cjs', 'scripts/seo/check_phase_a.py',
        'tests/helpers/return-contract.cjs', 'tests/nomad360_locale_semantic.test.cjs',
        'tests/v1_service_v2_numeric_parity.test.cjs',
        'docs/reviews/sales-tax-7b/STAGE_7B4_ACCEPTANCE.md',
        # UNIFIED-BANNERS-01: presentation scope only. Exact source hunks and
        # every pre-change finance byte are guarded by unified_banners_scope.
        'nomad360_banners.js', 'tests/unified_banners_browser.cjs',
        'tests/unified_banners_scope.test.cjs', 'tests/unified_banners_vat_receipts.cjs', 'tests/unified_banners_contrast.cjs', 'tests/unified_banners_financial_links.cjs',
        'tests/seo_language.test.cjs',
        'tests/helpers/unified-banners-contract.cjs', 'tests/helpers/rendered-contrast.cjs',
        '.github/workflows/unified-banners.yml',
        'tests/nomad360_calculator_ui_browser.test.cjs',
        'tests/nomad360_embed_footer_browser.test.cjs',
        # 7B-5: independent tax UI, historical drafts and prices across exports.
        'nomad360_price_export.js', 'tests/sales_tax_7b5_price_export.test.cjs',
        'tests/sales_tax_7b5_v1_pdf_browser.cjs', 'tests/sales_tax_7b5_v2_export_browser.cjs',
        'tests/helpers/sales-tax-7b5-pdf-scope.cjs',
        'tests/helpers/sales-tax-7b5-v2-scope.cjs',
        'tests/type02_acceptance_browser.cjs',
        '.github/workflows/sales-tax-7b5-export.yml',
        'docs/reviews/sales-tax-7b/STAGE_7B5_ACCEPTANCE.md',
         # Task 09 permits only isolated widget assets and sharply audited guards.
         'nomad360_bug_report.js', 'nomad360_bug_report.css',
         'tests/nomad360_bug_report_browser.cjs',
         '.github/workflows/bug-report-09.yml',
         'docs/reviews/bug-report-09/REVIEW.md',
         'tests/helpers/task09-html-scope.cjs') for p in changed), changed
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
