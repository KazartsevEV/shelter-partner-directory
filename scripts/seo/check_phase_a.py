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

def restore_approved_v2_copy_locale(raw):
    # UI-COPY-04: match exactly the three requested language versions and
    # restore only these two rows for legacy byte-identical SEO checks.
    # The live V2 screens never render the retired pricing explanation.
    base = subprocess.check_output(['git', 'show',
        '78ef71b32256a1651c5bbc96e154e2f6df89a019:nomad360_locale_core.js'], cwd=ROOT)
    prefix = b' ["marketing.onePortfolioFunnelBudget'
    old_rows = base.splitlines(keepends=True)
    marketing = next((row for row in old_rows if row.startswith(prefix)), None)
    pricing = next((row for row in old_rows if row.startswith(b' ["finance.allThreeModelsShare')), None)
    assert marketing and pricing and raw.count(prefix) == 1, 'Exact V2 copy locale source'
    new_marketing = (marketing
        .replace(b'orders. CTR determines impressions; extra campaigns', b'orders. Extra campaigns')
        .replace('заказы. CTR нужен для показов. Отдельные'.encode(), 'заказы. Отдельные'.encode())
        .replace('тапсырыс. CTR көрсетілімге қажет; қосымша'.encode(), 'тапсырыс. Қосымша'.encode()))
    assert new_marketing != marketing and raw.count(new_marketing) == 1, 'V2 CTR copy exactly shortened in three languages'
    assert pricing not in raw, 'Retired V2 pricing explanation must not be shipped'
    raw = raw.replace(new_marketing, marketing, 1)
    next_row = b' ["ui.portfolioResult"'
    assert raw.count(next_row) == 1
    return raw.replace(next_row, pricing + next_row, 1)


def mask_stage_7b5_pdf(raw):
    # Exact bounded exception: only the V1 print renderer may differ.
    start = b'function exportProductCalculationPdf() {'
    end = b'\n        function aggregateDaysText('
    assert raw.count(start) == 1
    a = raw.index(start)
    b = raw.index(end, a + len(start))
    return raw[:a] + b'<ACCEPTED-7B5-PDF-RENDERER>' + raw[b:]



def strip_live_v2_entry(raw):
    # Exact, reviewed landing-page addition; all other application bytes remain guarded.
    anchor = "                <a id=\"us-retail-v2-live-link\" data-nomad-no-translate href=\"./US_Retail_Demo.HTML?demo=us-retail-12m&amp;lang=ru\" class=\"nomad-example-link nd-type-action\">Пример V2: магазин в США · 12 месяцев</a>\n".encode('utf-8')
    loader = b'<script src="./nomad360_us_retail_live_entry.js"></script>\n'
    assert raw.count(anchor) == 1 and raw.count(loader) == 1
    assert raw.count(b'id="us-retail-v2-live-link"') == 1
    return raw.replace(anchor, b'', 1).replace(loader, b'', 1)


def strip_approved_hero_html(raw):
    # CONSULTING-01 — permit exactly one reviewed B2B stylesheet after IRBIS,
    # then restore all historic HTML byte-for-byte protections unchanged.
    consulting_css = b'    <link rel="stylesheet" href="./nomad360_consulting_banner.css">\n'
    if consulting_css in raw:
        assert raw.count(consulting_css) == 1, 'CONSULTING single CSS loader'
        assert (b'    <link rel="stylesheet" href="./nomad360_about_banner.css">\n'
                + b'    <link rel="stylesheet" href="./nomad360_irbis_banner.css">\n'
                + consulting_css + b'</head>') in raw, 'CONSULTING follows accepted IRBIS CSS'
        raw = raw.replace(consulting_css, b'', 1)
    # IRBIS-07: precisely two passive asset links added after accepted ABOUT + RETURN.
    # Source guards remove ONLY the approved link pair; never erase DOM/calculation text.
    irbis_css = b'    <link rel="stylesheet" href="./nomad360_irbis_banner.css">\n'
    irbis_js = b'<script src="./nomad360_irbis_banner.js"></script>\n'
    if irbis_css in raw or irbis_js in raw:
        assert raw.count(irbis_css) == raw.count(irbis_js) == 1, 'IRBIS link pair integrity'
        assert b'    <link rel="stylesheet" href="./nomad360_about_banner.css">\n' + irbis_css + b'</head>' in raw, 'IRBIS follows accepted ABOUT CSS'
        assert b'<script src="./nomad360_return.js"></script>\n' + irbis_js + b'<script src="./nomad360_navigation.js"></script>' in raw, 'IRBIS follows accepted RETURN and precedes navigation'
        raw = raw.replace(irbis_css, b'', 1).replace(irbis_js, b'', 1)
    # Exact approved HERO-03 transfer of the existing hero over the obsolete
    # second SEO headline. Restore only its bounded three HTML fragments.
    css = b'    <link rel="stylesheet" href="./nomad360_hero_banner.css">\n'
    script = b'<script src="./nomad360_hero_banner.js"></script>\n'
    modern = (b'        <div id="nomad360-seo-banner" class="nomad-marketing nomad-seo-banner" '
              b'data-nomad-no-translate aria-label="Nomad360 brand">\n'
              b'        </div>\n\n')
    # ABOUT-01 is a later already-merged main addition. Strictly validate and
    # normalize only its two passive loaders before applying historical HERO
    # source integrity; do not mask any business markup or financial code.
    about_css = b'    <link rel="stylesheet" href="./nomad360_about_banner.css">\n'
    about_js = b'<script src="./nomad360_about_banner.js"></script>\n'
    if about_css in raw or about_js in raw:
        assert raw.count(about_css) == raw.count(about_js) == 1, 'ABOUT-01 loader integrity'
        assert css + about_css + b'</head>' in raw, 'ABOUT CSS follows HERO CSS'
        assert script + about_js + b'<script src="./nomad360_return.js"></script>' in raw, 'ABOUT JS follows HERO JS'
        raw = raw.replace(about_css, b'', 1).replace(about_js, b'', 1)
    if css not in raw and script not in raw and modern not in raw:
        return raw
    assert raw.count(css) == raw.count(script) == raw.count(modern) == 1, 'HERO-03 loader and SEO anchor integrity'
    assert b'    <link rel="stylesheet" href="./nomad360_palette.css">\n' + css + b'</head>' in raw
    assert b'<script src="./nomad360_header.js"></script>\n' + script + b'<script src="./nomad360_return.js"></script>' in raw
    assert b'    <section id="home-screen" class="max-w-4xl mx-auto">\n' + modern in raw
    baseline = subprocess.check_output(
        ['git', 'show', 'cfc7e3d4f429004def715a4acc586a3b3fb984d1:Marketing_calc.HTML'],
        cwd=ROOT)
    start = b'        <div id="nomad360-seo-banner"'
    end = b'        <section id="nomad360-selling-choice"'
    assert baseline.count(start) == baseline.count(end) == 1
    legacy = baseline[baseline.index(start):baseline.index(end)]
    return raw.replace(css, b'', 1).replace(script, b'', 1).replace(modern, legacy, 1)


def strip_task09_html(raw):
    raw = strip_approved_hero_html(raw)
    # Task10 permits exactly one passive stylesheet link, no finance exemptions.
    palette = b'    <link rel="stylesheet" href="./nomad360_palette.css">\n'
    if b'nomad360_palette.css' in raw:
        assert raw.count(palette) == 1
        assert b'    <link rel="stylesheet" href="./nomad360_design_system.css">\n' + palette + b'</head>' in raw
        raw = raw.replace(palette, b'', 1)
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
        if name in ('nomad360_calculator_ui.css', 'nomad360_design_system.css', 'Marketing_calc.HTML', 'nomad360_header.js',
                    'portfolio_v2_ui.js', 'portfolio_v2_linked_ui.js',
                    'nomad360_irbis_banner.js'):
            # The architecture PR moves only persistence/delivery boundaries.
            # Its exact live-file hashes are checked before restoring the
            # accepted main bytes for historical SEO and finance guards.
            raw = subprocess.check_output(['node', '-e',
                "const fs=require('node:fs');process.stdout.write(require('./tests/helpers/refactor-boundaries-scope.cjs').restore(process.argv[1],fs.readFileSync(0)))",
                name], input=raw, cwd=ROOT)
        if name == 'CALCULATOR_LICENSE.md':
            # Owner-approved later legal release (#185, 2026-10-17) is a
            # separately validated prospective v2.4 licence, not an SEO edit.
            # Keep the phase-A historical manifest immutable. For current
            # branches, pin the entire approved replacement byte-for-byte.
            # A subsequent legal edit must explicitly update this accepted
            # release, never bypass the 46 remaining SEO-protected files.
            current_release = subprocess.check_output(
                ['git', 'show',
                 'c98b29e9527131ae4790e462a3b62f15827a4ccf:CALCULATOR_LICENSE.md'],
                cwd=ROOT)
            assert raw == current_release, 'Unreviewed change to accepted legal v2.4 release'
            continue
        if name in ('nomad360_header.js', 'nomad360_calculator_ui.css'):
            # The sole approved TASK-10 / LOGO-01 delta is hash-locked and
            # removed before ALL pre-existing immutable SEO/finance guards.
            raw = subprocess.check_output(['node', '-e',
                "process.stdout.write(require('./tests/helpers/task10-logo-scope.cjs').stripTask10Logo(process.argv[1],require('node:fs').readFileSync(0,'utf8')))", name],
                input=raw, cwd=ROOT)
        if name == 'Marketing_calc.HTML':
            raw = strip_live_v2_entry(raw)
            raw = strip_task09_html(raw)
            assert raw.count(b'<script src="./nomad360_sales_tax_v2.js"></script>\n') == 1
        if name in ('portfolio_v2_ui.js', 'portfolio_v2_linked_ui.js'):
            # Only the exact reviewed stage-4 UI integration is exempt from
            # historical pre-Sales-Tax bytes. A later unapproved edit is RED.
            approved = subprocess.check_output(
                ['git', 'show', '6c5c0e3a4927fb50b88ab99914145bb9016bb24a:' + name], cwd=ROOT)
            source = subprocess.check_output(['node', '-e',
                "const fs=require('node:fs'),source=fs.readFileSync(0,'utf8'),s=require('./tests/helpers/v2-output-truth-scope.cjs').restore(process.argv[1],source);process.stdout.write(require('./tests/helpers/sales-tax-7b5-v2-scope.cjs').revertApprovedV2TaxUi(process.argv[1],s))", name],
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
        # The RET-07A normalizer also fingerprints and reverses only the
        # reviewed CONSULTING-02 standalone-SVG packer in nomad360_header.js.
        # Every other original SEO/financial source byte remains protected.
        if name in {'Marketing_calc.HTML','nomad360_header.js','nomad360_locale_core.js','nomad360_calculator_ui.js','nomad360_calculator_ui.css'}:
            raw = subprocess.check_output(['node','-e',
                "process.stdout.write(require('./tests/helpers/return-contract.cjs').stripReturn(process.argv[1],require('node:fs').readFileSync(0,'utf8')))",name],
                input=raw,cwd=ROOT)
        # Exact permitted presentation delta; accepted B2B/legal bytes stay protected.
        if name == 'nomad360_calculator_ui.css':
            # Keep the historical immutable SEO snapshot comparison unchanged.
            raw = raw.split(b'\n/* SEO-07 approved keyword banner; original offer unchanged. */', 1)[0]
        if name == 'nomad360_locale_core.js':
            raw = restore_approved_v2_copy_locale(raw)
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
                    # HELP-08: the Help menu lives between two marker comments inside
                    # boot(); strip exactly those regions, then compare as before.
                    text = re.sub(r'^[ \t]*// HELP-08:BEGIN[^\n]*\n.*?^[ \t]*// HELP-08:END\n',
                                  '', content.decode('utf-8'), flags=re.S | re.M)
                    lines = text.splitlines()
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
                    # V2-OUTPUT-TRUTH-01: one approved marketing label changes,
                    # but every other RU/EN/KK semantic row stays byte-identical.
                    heading = 'ui.value1SharedMarketingEngine'
                    heading_rows = [x for x in lines if x.startswith(' ["'+heading+'"')]
                    assert len(heading_rows) == 1, 'Exact one marketing heading'
                    assert heading_rows[0] in (
                        ' ["ui.value1SharedMarketingEngine","1. Advertising and marketing","1. Реклама и маркетинг","1. Жарнама және маркетинг"],',
                        ' ["ui.value1SharedMarketingEngine","1. Shared marketing engine","1. Общий маркетинговый двигатель","1. Ортақ маркетинг моделі"],'
                    ), 'Unexpected marketing-heading change'
                    # Already accepted HERO-193 replaced one closing slogan
                    # with three RU/EN/KK steps. Normalize only these four keys.
                    hero_keys = {'interface.shell.introResult',
                                 'interface.shell.introStep1',
                                 'interface.shell.introStep2',
                                 'interface.shell.introStep3'}
                    assert sum(x.startswith(' ["interface.shell.introStep') for x in lines) in (0,3)
                    return '\n'.join('<ACCEPTED-LICENSE-ROW>' if
                                     '"interface.header.licenseCopy"' in x else
                                     '<APPROVED-V2-MARKETING-HEADING>' if heading in x else x
                                     for x in lines if x not in tax_rows
                                     and not any(x.startswith(' ["'+k+'"') for k in hero_keys))
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
            # Freeze every byte of the accepted Excel source EXCEPT the V2
            # document projection, numeric Sales Tax worksheet writer and the
            # bounded three-language heading dictionary. Preserve historic
            # pre-Sales-Tax engine SHA and independent VAT/XLSX browser oracles.
            approved = subprocess.check_output(
                ['git','show','817e5e14ae65091f474442a672831d93a3ea8f28:' + name], cwd=ROOT)
            assert hashlib.sha256(approved).hexdigest() == expected, 'Historic exporter baseline drift'
            accepted = subprocess.check_output(
                ['git','show','cfc7e3d4f429004def715a4acc586a3b3fb984d1:' + name], cwd=ROOT)
            def mask_output_only(raw_source, new):
                extras = re.compile(rb'(?ms)^const salesTaxColumns=\{.*?^\};\n')
                assert len(extras.findall(raw_source)) == (1 if new else 0), 'Unbounded V2 export headings'
                raw_source = extras.sub(b'', raw_source)
                for marker, pattern in (
                    (b'document', rb'(?ms)^function document\([^\n]*\)\{.*?^\}\n'),
                    (b'write', rb'(?ms)^async function write\([^\n]*\)\{.*?^\}\n'),
                ):
                    matcher = re.compile(pattern)
                    assert len(matcher.findall(raw_source)) == 1, 'Missing scoped Excel '+marker.decode()
                    raw_source = matcher.sub(b'function <'+marker+b'>(){}\n',raw_source)
                return raw_source
            assert mask_output_only(raw,True) == mask_output_only(accepted,False), name
            # The original implementation still matches the old frozen source
            # outside its separately accepted 7B-5 document projection.
            assert mask_output_only(accepted,False) == mask_output_only(approved,False), name
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
            # PR #193 was already merged into main before UI-COPY-04.
            # Pin the entire accepted code (including its three translated HERO
            # steps) byte-for-byte, rather than rejecting the approved intro.
            pinned = subprocess.check_output(
                ['git','show','78ef71b32256a1651c5bbc96e154e2f6df89a019:' + name], cwd=ROOT)
            pinned = subprocess.check_output(['node','-e',
                "process.stdout.write(require('./tests/helpers/return-contract.cjs').stripReturn(process.argv[1],require('node:fs').readFileSync(0,'utf8')))", name],
                input=pinned,cwd=ROOT)
            assert raw == pinned, 'Unapproved calculator UI delta outside accepted main HERO'
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
    # Preserve the main-accepted HERO artwork, layout, and all other selectors
    # byte-for-byte. Exactly two active-home burger paints use the
    # TASK-10 adaptive approved navy/white foreground instead of legacy RGB 22,55,90.
    if 'nomad360_hero_banner.css' in changed:
        approved_hero = subprocess.check_output(
            ['git','show','181be92bb92472cd032ecb9b7e8eb8124093e545:nomad360_hero_banner.css'], cwd=ROOT)
        old_paint = b'color:var(--nomad-burger-contrast,var(--p10-white,#FFFFFF))!important;'
        new_paint = b'color:var(--p10-fg)!important;'
        assert approved_hero.count(old_paint) == 2, 'Unexpected approved HERO CSS base'
        # Replay only the exact approved C5-7 layout removal for this historical prefix.
        current_hero = subprocess.check_output(['node', '-e',
            "const fs=require('node:fs');process.stdout.write(require('./tests/helpers/typical-scope.cjs').restore('nomad360_hero_banner.css',fs.readFileSync(0)))"],
            input=(ROOT / 'nomad360_hero_banner.css').read_bytes(), cwd=ROOT)
        # HERO-12/13 approved full-bleed, CTA and user-accepted desktop-only logo lift:
        # pin original styling and exact latest CSS/asset/controller presentation blobs.
        legacy = approved_hero.replace(old_paint, new_paint)
        assert current_hero.startswith(legacy), 'Historical HERO styling was modified, not extended by approved layout'
        # HERO-LOGO-TRANSPARENCY-01: original approved HERO prefix above is frozen;
        # the only accepted appended delta removes the dark rectangle behind
        # the imported logo in the same TASK-10 palette cascade layer, and\n        # reserves unobstructed mobile copy beside the unchanged circular mark.\n        # HERO-LANG-02 extends only the localized CTA type scale at 3 breakpoints.
        # Keep hashing the ACTUAL production file. Only the old accepted blob and
        # the exact C5-7 candidate pinned by its removal receipt are permitted.
        assert subprocess.check_output(['git','hash-object','nomad360_hero_banner.css'], cwd=ROOT, text=True).strip() in {'6c8632da780aaf6f8287c0e3b5b5b097e4fdca9e', 'acc53b2b853cf0d206bb9a02d58afa0c1ccbfb22', 'fa7b31f3016aa542c75711fcca4209cbd68af65d'}, 'HERO scene geometry or approved logo-transparent delta drift'
    if 'nomad360_hero_banner.js' in changed:
        assert subprocess.check_output(['git','hash-object','nomad360_hero_banner.js'], cwd=ROOT, text=True).strip() == '090e52aabab6bca4f923b9eb188dbcc366602b5a', 'Only the approved CTA alignment may change the HERO controller'
    if 'assets/nomad360-banners/hero-alpenglow-fullbleed.webp' in changed:
        assert subprocess.check_output(['git','hash-object','assets/nomad360-banners/hero-alpenglow-fullbleed.webp'], cwd=ROOT, text=True).strip() == '4e964652d04dd71c30ee562789090322d20014ec', 'Approved scenic source changed'
    if 'nomad360_design_system.css' in changed:
        # C1 allows only the exact early duplicate deletion; no general CSS exemption.
        subprocess.check_output(['node', '-e',
            "const fs=require('node:fs');process.stdout.write(require('./tests/helpers/cleanup-service-grid-scope.cjs').restore(process.argv[1],fs.readFileSync(0)))",
            'nomad360_design_system.css'], input=(ROOT / 'nomad360_design_system.css').read_bytes(), cwd=ROOT)
    if 'nomad360_palette.css' in changed:
        subprocess.check_output(['node', '-e',
            "const fs=require('node:fs');process.stdout.write(require('./tests/helpers/cleanup-palette-scope.cjs').restore(process.argv[1],fs.readFileSync(0)))",
            'nomad360_palette.css'], input=(ROOT / 'nomad360_palette.css').read_bytes(), cwd=ROOT)
    if 'nomad360_about_banner.css' in changed:
        subprocess.check_output(['node', '-e',
            "const fs=require('node:fs');process.stdout.write(require('./tests/helpers/cleanup-about-scope.cjs').restore(process.argv[1],fs.readFileSync(0)))",
            'nomad360_about_banner.css'], input=(ROOT / 'nomad360_about_banner.css').read_bytes(), cwd=ROOT)
    assert all(p.startswith(('docs/seo/', 'scripts/seo/', 'en/', 'ru/', 'kk/', 'docs/localization/l0/',
                             'docs/reviews/architecture-boundaries-01/', 'docs/reviews/v1-engine-01/', 'tests/fixtures/v1-engine/',
                             'docs/reviews/tax-draft-storage-01/', 'tests/fixtures/tax-draft-storage/',
                             'scripts/cleanup-v1/', 'tests/fixtures/v1-state/', 'docs/reviews/v1-state-06/', 'tests/fixtures/v1-operations/', 'docs/reviews/v1-operations-06/',
                             'scripts/cleanup/', 'docs/reviews/cleanup-service-grid-01/',
                             'scripts/cleanup-logo-mask/', 'docs/reviews/cleanup-logo-mask-02/',
                             'scripts/cleanup-about/', 'docs/reviews/cleanup-about-03/',
                             'scripts/cleanup-palette/', 'docs/reviews/cleanup-palette-04/',
                             'scripts/cleanup-canvas/', 'docs/reviews/cleanup-canvas-05/',
                             'scripts/cleanup-scene/', 'docs/reviews/cleanup-scene-05-2/',
                             'scripts/cleanup-scene-layout/', 'docs/reviews/cleanup-scene-layout-05-3/', 'tests/fixtures/cleanup-scene-layout/',
                             'scripts/cleanup-about-copy/', 'docs/reviews/cleanup-about-copy-05-4/', 'tests/fixtures/cleanup-about-copy/',
                             'scripts/style-ownership/', 'docs/reviews/style-ownership-05-5/', 'tests/fixtures/style-ownership/',
                             'scripts/cleanup-paint/', 'docs/reviews/cleanup-paint-05-8/', 'tests/fixtures/cleanup-paint/',
                             'scripts/cleanup-typical/', 'docs/reviews/cleanup-typical-05-7/', 'tests/fixtures/cleanup-typical/',
                             'scripts/cleanup-payment-grid/', 'docs/reviews/payment-grid-05-6/', 'tests/fixtures/payment-grid/',
                             'scripts/partners/', 'tests/fixtures/partner-build/', 'docs/reviews/partner-build-01/',
                             'scripts/audit/', 'docs/reviews/runtime-audit-01/',
                             'scripts/cleanup-history/', 'docs/reviews/cleanup-history-07/',
                             'tests/fixtures/partner-application/', 'docs/reviews/partner-application-01/',
                             'docs/reviews/about-vector-218/', 'docs/reviews/banner-quality-01/',
                             'license/', 'scripts/legal/', 'docs/reviews/return-7a/', 'scripts/palette/', 'tests/fixtures/task10-palette/', 'docs/reviews/task10-palette/', 'docs/reviews/us-retail-v2/', 'docs/reviews/v2-output-truth-01/')) or p in (
        # HERO-LANG-01: explicit RU fixture setup only; no engine or UI math edits.
        'tests/nomad360_locale_core_browser.test.cjs',  # Browser-locale matrix and saved-choice priority only.
        'tests/nomad360_global_tree_navigation_browser.test.cjs',
        'tests/simple_services_free_cash_browser.test.cjs',
        'tests/portfolio_v2_full_service_browser.test.cjs',
        'tests/nomad360_embed_footer_browser.test.cjs',
        'tests/nomad360_locale_v1_aggregate_cash_browser.test.cjs',
        'tests/nomad360_locale_v1_final_prices_browser.test.cjs',
        'tests/marketing_calc_browser_e2e.cjs',
        'tests/marketing_calc_prefilled_demo.test.cjs',
        'tests/marketing_calc_two_sku_demo.test.cjs',
        'tests/marketing_calc_first_user_journey.test.cjs',
        'tests/marketing_calc_inline_errors.test.cjs',
        'tests/marketing_calc_dropship_browser.test.cjs',
        'tests/portfolio_v2_linked_browser.test.cjs',
        'tests/portfolio_v2_temporal_browser.test.cjs',
        'tests/portfolio_v2_temporal_cash_browser.test.cjs',
        'tests/portfolio_v2_pooled_media_browser.test.cjs',
        'tests/portfolio_v2_period_pnl_browser.test.cjs',
        'tests/portfolio_v2_period_price_browser.test.cjs',
        'tests/portfolio_v2_f3_mixed_browser.test.cjs',
        'tests/portfolio_v2_f4_release_browser.test.cjs',
        'tests/portfolio_v2_resource_lifecycle_browser.test.cjs',
        'tests/portfolio_v2_mba_capacity_browser.test.cjs',
        'tests/portfolio_v2_mba_browser.test.cjs',
        'tests/portfolio_v2_online_browser.test.cjs',
        'tests/marketing_calc_offline_service_browser.test.cjs',
        'tests/nomad360_units_browser.test.cjs',
        'tests/marketing_calc_add_next_service_browser.test.cjs',
        # CONSULTING-01 changes only the B2B banner and its visual acceptance.
        '.github/workflows/consulting-01-visual.yml',
        'nomad360_consulting_banner.css', 'scripts/consulting/preview.cjs',
        'assets/nomad360-banners/consulting-horizontal-desktop-3200x941.svg',
        'assets/nomad360-banners/consulting-horizontal-mobile-1200x1671.svg',
        'tests/helpers/hero-main-contract.cjs', 'tests/helpers/task10-palette.cjs',
        'nomad360_return.js', 'nomad360.webmanifest', 'nomad360_calculator_ui.js',
        'scripts/build-return-icons.py', 'assets/nomad360-icons/nomad360.ico',
        'assets/nomad360-icons/icon-180.png', 'assets/nomad360-icons/icon-192.png',
        'assets/nomad360-icons/icon-512.png',
        'tests/return_7a_browser.cjs', 'tests/return_7a_scope.test.cjs', 'tests/helpers/return-contract.cjs',
        '.github/workflows/return-7a.yml',
        # HELP-08: three static Help pages, their assets and the header Help menu tests.
        'assets/nomad360-help.css', 'assets/nomad360-help.js',
        'tests/nomad360_help_menu_browser.test.cjs', 'tests/nomad360_calculator_ui_browser.test.cjs',
        'tests/task10_palette_source.test.cjs',
        'nomad360_header.js', 'nomad360_locale_core.js', 'assets/nomad360-legal.css',
        'nomad360_delivery.js', 'nomad360_draft_store.js',
        'nomad360_v1_engine.js', 'tests/nomad360_v1_engine.test.cjs',
        'nomad360_v1_state.js', 'tests/helpers/v1-state-scope.cjs', 'tests/nomad360_v1_state.test.cjs', '.github/workflows/v1-state.yml', 'nomad360_v1_operations.js', 'tests/nomad360_v1_operations.test.cjs',
        'tests/helpers/v1-operations-scope.cjs', '.github/workflows/v1-operations.yml',
        'tests/helpers/partner-application-scope.cjs', 'tests/partner_application_scope.test.cjs',
        'tests/nomad360_v1_engine_scope.test.cjs', 'tests/nomad360_v1_engine_browser.cjs',
        'tests/helpers/v1-engine-scope.cjs', 'tests/helpers/v1-function-source.cjs',
        'tests/helpers/tax-draft-storage-scope.cjs',
        'tests/tax_draft_storage_scope.test.cjs', 'tests/tax_draft_storage_browser.cjs',
        '.github/workflows/tax-draft-storage.yml',
        '.github/workflows/partner-package-build.yml',
        'tests/cleanup_paint.test.cjs', 'tests/helpers/paint-scope.cjs', '.github/workflows/cleanup-paint.yml',
        'tests/cleanup_typical.test.cjs', 'tests/helpers/typical-scope.cjs', '.github/workflows/cleanup-typical.yml',
        'tests/payment_grid.test.cjs', 'tests/helpers/payment-grid-scope.cjs', '.github/workflows/payment-grid.yml',
        'tests/style_ownership.test.cjs', '.github/workflows/style-ownership.yml', 'docs/architecture/nomad360-style-owners.json',
        'tests/cleanup_about_copy.test.cjs', 'tests/helpers/cleanup-about-copy-scope.cjs', 'tests/helpers/about-copy-cascade.cjs', '.github/workflows/cleanup-about-copy.yml',
        'tests/cleanup_scene_layout.test.cjs', 'tests/helpers/cleanup-scene-layout-scope.cjs', '.github/workflows/cleanup-scene-layout.yml',
        'tests/cleanup_scene.test.cjs', 'tests/helpers/cleanup-scene-scope.cjs', '.github/workflows/cleanup-scene.yml',
        'tests/cleanup_canvas.test.cjs', 'tests/helpers/cleanup-canvas-scope.cjs', '.github/workflows/cleanup-canvas.yml',
        'tests/cleanup_palette.test.cjs', 'tests/helpers/cleanup-palette-scope.cjs', '.github/workflows/cleanup-palette.yml',
        'tests/cleanup_about.test.cjs', 'tests/helpers/cleanup-about-scope.cjs', '.github/workflows/cleanup-about.yml',
        'tests/cleanup_logo_mask.test.cjs', 'tests/helpers/cleanup-logo-mask-scope.cjs', 'tests/helpers/accepted-banner-248-scope.cjs', '.github/workflows/cleanup-logo-mask.yml',
        'nomad360_design_system.css', 'tests/cleanup_service_grid.test.cjs', 'tests/helpers/cleanup-service-grid-scope.cjs', '.github/workflows/cleanup-service-grid.yml',
        'tests/partner_config.test.cjs', 'tests/partner_build_scope.test.cjs', 'tests/partner_build_browser.cjs', 'tests/partner_build.test.cjs',
        'docs/architecture/partner-package-config.md', 'docs/nomad360-partner-distribution-plan.md',
        # SEC-01 documentation only; server code belongs in private lazysellerV2.
        'docs/security/SEC-01.md', 'docs/security/sec01-edge-policy.sample.json',
        # Owner-approved preparation only: future copy is not connected to the site.
        'docs/nomad360-production-readiness-plan.md',
        'docs/partners/partner-release-copy.md',
        # R1 planned additions: screenshot bug report and White Label CI/CD contractual boundaries.
        'docs/partners/bug-report-screenshot-scope.md',
        'docs/partners/white-label-cicd-scope.md',
        'docs/reviews/production-readiness-01/REVIEW.md',
        'tests/runtime_audit.test.cjs', 'tests/c7_history.test.cjs', '.github/workflows/c7-history.yml', '.github/workflows/runtime-audit.yml',
        'nomad360_partner_application.js', 'nomad360_partner_application_model.js', 'nomad360_partner_transport.js', 'nomad360_partner_application.css',
        'tests/partner_application.test.cjs', 'tests/partner_application_browser.cjs', 'tests/partner_application_scope.test.cjs',
        'tests/helpers/partner-application-scope.cjs', '.github/workflows/partner-application.yml', 'tests/partner_application_live.cjs',
        '.github/workflows/v1-engine-extraction.yml',
        'tests/marketing_calc_full_cycle.test.cjs', 'tests/marketing_calc_resale.test.cjs',
        'tests/marketing_calc_dropship.test.cjs', 'tests/marketing_calc_offline_service.test.cjs',
        'tests/marketing_calc_regressions.test.cjs', 'tests/portfolio_v2_v1_parity.test.cjs',
        'tests/v1_service_v2_numeric_parity.test.cjs', 'tests/nomad360_payments.test.cjs',
        'docs/architecture/nomad360-boundaries.md',
        'tests/helpers/refactor-boundaries-scope.cjs',
        'tests/nomad360_draft_store.test.cjs', 'tests/nomad360_refactor_scope.test.cjs',
        '.github/workflows/marketing-packaging.yml',
        '.github/workflows/type02-reference.yml',
        'tests/nomad360_payments_browser.test.cjs',
        'tests/type02_scope.test.cjs',
        'tests/nomad360_marketing_browser.cjs', 'tests/nomad360_embed_footer_browser.test.cjs',
         'tests/nomad360_localization_l0_browser.cjs',
        'tests/nomad360_public_license.test.cjs', '.github/workflows/nomad360-public-license.yml',
        'docs/nomad360-codex-task-map.md', 'docs/nomad360-help-08-tz.md', 'docs/reviews/sales-tax-7b/STAGE_7B3_ACCEPTANCE.md', 'docs/reviews/seo-07-phase-a-review.md',
        'docs/reviews/seo-07-phase-b-review.md', 'docs/reviews/seo-banner-review.md', 'docs/reviews/marketing-consulting-banner-review.md', 'Marketing_calc.HTML',
        'nomad360_seo_language.js', 'assets/nomad360-seo.css', 'nomad360_calculator_ui.css',
        'tests/nomad360_calculator_ui_browser.test.cjs',
        'nomad360_hero_banner.css', 'nomad360_hero_banner.js',
        'scripts/hero/preview.cjs', 'assets/nomad360-banners/hero-alpenglow-fullbleed.webp',
        # FX live browser test: only retries real validated provider requests; financial source stays frozen.
        'tests/currency_converter_browser.test.cjs',
        'tests/nomad360_price_export_browser.test.cjs',
        'tests/marketing_calc_first_user_journey.test.cjs',
        'tests/fixtures/seo-keyword-banner.html', 'tests/fixtures/seo-original-results.html',
        'tests/helpers/seo-html-contract.cjs', 'tests/seo_language.test.cjs',
        'tests/nomad360_marketing_scope.test.cjs', 'tests/type02_scope.test.cjs',
        'tests/nomad360_locale_semantic.test.cjs',
        'tests/helpers/v2-output-truth-scope.cjs',
        'tests/helpers/v2-output-truth-export-scope.cjs',
        'scripts/demos/build_us_retail_truth_xlsx.cjs',
        # V2 proof builder is packaging-only; it must not change calculators or finance engines.
        'scripts/demos/build_us_retail_standalone.cjs',
        'docs/demos/us-main-street-12m/README.md',
        '.github/workflows/v2-output-refresh-artifacts.yml',
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
        # 7B-5: independent tax UI, historical drafts and prices across exports.
        'nomad360_price_export.js', 'tests/sales_tax_7b5_price_export.test.cjs',
        'tests/sales_tax_7b5_v1_pdf_browser.cjs', 'tests/sales_tax_7b5_v2_export_browser.cjs',
         'tests/sales_tax_7b_vat_browser.cjs',  # frozen values; revised header-only comparison
        'tests/helpers/sales-tax-7b5-pdf-scope.cjs',
        'tests/helpers/sales-tax-7b5-v2-scope.cjs',
        'tests/type02_acceptance_browser.cjs',
        'tests/type02_exports_browser.cjs',
        '.github/workflows/sales-tax-7b5-export.yml',
        'docs/reviews/sales-tax-7b/STAGE_7B5_ACCEPTANCE.md',
         # Task 09 permits only isolated widget assets and sharply audited guards.
         'nomad360_bug_report.js', 'nomad360_bug_report.css',
         'tests/nomad360_bug_report_browser.cjs',
         '.github/workflows/bug-report-09.yml',
         'docs/reviews/bug-report-09/REVIEW.md',
         'tests/helpers/task09-html-scope.cjs',
         # PINNED-CONTROLS-01: presentation-only UI guarded against the tested main.
         'tests/pinned_controls_browser.cjs',
         'tests/helpers/pinned-controls-css-scope.cjs',
         '.github/workflows/pinned-controls.yml',
         'docs/reviews/pinned-controls/REVIEW.md',
        # LOGO-01: exact hash-locked logo-only markup and screenshots.
        'tests/helpers/task10-logo-scope.cjs',
        'tests/task10_logo_browser.cjs', '.github/workflows/task10-logo.yml',
        'tests/helpers/pinned-controls-css-scope.cjs',
        'scripts/localization/inventory.cjs',
        'nomad360_palette.css', 'nomad360_static_fonts.css', 'tests/helpers/task10-palette.cjs',
        'tests/helpers/task10-palette-scope.cjs',
        'tests/task10_palette_source.test.cjs', 'tests/task10_palette_browser.cjs',
        'tests/task10_palette_oracles.test.cjs', 'tests/task10_palette_delivery.cjs',
        'tests/simple_services_free_cash_browser.test.cjs',
        'tests/marketing_calc_offline_service_browser.test.cjs',
        'tests/nomad360_global_tree_navigation_browser.test.cjs',
        'tests/nomad360_v2_containers_browser.test.cjs',
        'tests/nomad360_v2_buttons_browser.test.cjs',
        # US retail live entry: audited link, isolated study and browser receipts.
        'nomad360_us_retail_live_entry.js', 'nomad360_us_retail_demo.js',
        'portfolio_v2_us_demo_ui.js', 'US_Retail_Demo.HTML',
        'US_Retail_Demo_FILLED.html', 'US_Retail_Demo_EN_FILLED.html',
        'tests/us_retail_demo_v2.test.cjs', 'tests/us_retail_demo_v2_browser.cjs',
        '.github/workflows/us-retail-demo-v2.yml',
        '.github/workflows/us-retail-filled-html.yml',
        'tests/portfolio_v2_online_browser.test.cjs',
         # V2-OUTPUT-TRUTH-01: exact approved source and XLSX tests.
         'tests/helpers/hero-main-contract.cjs',
        # ABOUT desktop image-only PR: permit the four exact artwork/visual guard
        # paths. No calculator, SEO page, or mobile application source edits.
        'assets/nomad360-banners/about-moonlight-desktop-approved.webp',
        'assets/nomad360-banners/about-bozzhyra-desktop-extended-20261019.webp',
        'assets/nomad360-banners/about-moonlight-horizontal-only-2048x768.svg',
        'assets/nomad360-banners/about-moonlight-horizontal-only-3200x768.svg',
        'nomad360_about_banner.js',
        'nomad360_about_banner.css', 'scripts/about/preview.cjs',
        'scripts/about/build_vector_scene.py',
        'scripts/about/.gitignore',
        'scripts/about/README.md', 'tests/banner_vector_quality.test.cjs',
        '.github/workflows/about-01-visual.yml',
        # Owner-approved IRBIS-07: only original art, scoped visual controller,
        # exact test contracts and visual receipts, no financial engine changes.
        'nomad360_irbis_banner.css', 'nomad360_irbis_banner.js',
        'assets/nomad360-banners/support-wide.webp',
        'assets/nomad360-banners/support-wide-extended.webp',
        'assets/nomad360-banners/support-mobile.webp',
        'scripts/irbis/preview.cjs', '.github/workflows/irbis-07-visual.yml',
        'tests/return_7a_browser.cjs', 'tests/simple_service_examples_browser.cjs',
        'tests/nomad360_embed_footer_browser.test.cjs',
        'tests/nomad360_marketing_browser.cjs', 'tests/type02_acceptance_browser.cjs',
        'tests/helpers/task10-palette.cjs',
        'docs/reviews/irbis-07/REVIEW.md',
        # IRBIS-08 remains a scoped presentation-only footer change.
        'docs/reviews/irbis-08/REVIEW.md',
        # ABOUT/IRBIS-12: currency is validated in the model rather than
        # a removed duplicate footer label; no financial calculation changes.
        'tests/nomad360_currency_browser.test.cjs',
        'tests/nomad360_price_export.test.cjs',
         'tests/nomad360_price_export_openxml.py',
        '.github/workflows/task10-palette.yml') for p in changed), changed
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
