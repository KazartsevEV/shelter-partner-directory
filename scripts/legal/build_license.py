#!/usr/bin/env python3
"""Render the published Nomad360 licence from CALCULATOR_LICENSE.md.

Single legal source of truth: never hand-edit the generated HTML. All three
outputs contain the complete corresponding legal edition (sections 1-12).
No third-party Python modules, external assets or JavaScript required.
"""
from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "CALCULATOR_LICENSE.md"
ORIGIN = "https://kazartsevev.github.io/shelter-partner-directory/"
VERSIONS = {
    "ru": {
        "path": "license/index.html",
        "url": ORIGIN + "license/",
        "title": "Лицензия Nomad360 lite",
        "eyebrow": "Правовые условия · Nomad360 lite",
        "summary": "Калькулятор предоставляется бесплатно «как есть». Разрешено размещать полную неизменённую версию с сохранением бренда, атрибуции, информации о проекте, контактов и ссылок на поддержку. Для изменений или собственной версии требуется отдельное письменное соглашение.",
        "version": "Версия 2.3 · 12 октября 2026 года · правообладатель: Евгений Казарцев",
        "back": "Вернуться к калькулятору",
        "contents": "Содержание лицензии",
        "legal_name": "Русская редакция",
        "copyright": "© 2026 Евгений Казарцев · Текст лицензии v2.3",
    },
    "en": {
        "path": "license/en/index.html",
        "url": ORIGIN + "license/en/",
        "title": "Nomad360 lite License",
        "eyebrow": "Legal terms · Nomad360 lite",
        "summary": "The calculator is free to use “as is”. You may host the complete, unmodified edition while keeping its branding, attribution, project information, contacts and support links. Alterations and custom editions require a separate written agreement.",
        "version": "Version 2.3 · 12 October 2026 · Rights holder: Evgenii Kazartsev",
        "back": "Back to the calculator",
        "contents": "License contents",
        "legal_name": "English controlling text",
        "copyright": "© 2026 Evgenii Kazartsev · License text v2.3",
    },
    "kk": {
        "path": "license/kk/index.html",
        "url": ORIGIN + "license/kk/",
        "title": "Nomad360 lite лицензиясы",
        "eyebrow": "Құқықтық шарттар · Nomad360 lite",
        "summary": "Калькулятор «сол күйінде» тегін беріледі. Бренд, авторлық атрибуция, жоба туралы ақпарат, байланыс деректері мен қолдау сілтемелері сақталған толық өзгертілмеген нұсқаны орналастыруға болады. Өзгерістер мен жеке нұсқа үшін бөлек жазбаша келісім қажет.",
        "version": "2.3 нұсқасы · 2026 жылғы 12 қазан · құқық иесі: Евгений Казарцев",
        "back": "Калькуляторға оралу",
        "contents": "Лицензия мазмұны",
        "legal_name": "Қазақша редакция",
        "copyright": "© 2026 Евгений Казарцев · 2.3 лицензия мәтіні",
    },
}

LANG_HEADINGS = re.compile(r"^# (EN — [^\n]+|RU — [^\n]+|KK — [^\n]+)\s*$", re.M)
VERSION = "**Version:** 2.3 · 12 October 2026"

def inline_md(text: str) -> str:
    """The source licence uses bold spans and plain URLs; escape everything."""
    encoded = html.escape(text.strip())
    encoded = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", encoded)
    # Linkify plain HTTPS/HTTP URLs in text without adding any scripts.
    def link(match):
        full = match.group(0)
        url = full.rstrip(".,;")
        trailing = full[len(url):]
        return '<a href="' + html.escape(html.unescape(url), quote=True) + '" rel="noopener noreferrer">' + url + "</a>" + trailing
    encoded = re.sub(r"https?://[^\s<]+", link, encoded)
    return encoded

def parse_markdown(source: str):
    body = []
    toc = []
    paragraph = []
    section_count = 0
    def flush():
        if paragraph:
            body.append("<p>" + inline_md(" ".join(paragraph)) + "</p>")
            paragraph.clear()
    for line in source.splitlines():
        cleaned = line.strip()
        if not cleaned:
            flush()
            continue
        if cleaned == "---":
            flush()
            continue
        if cleaned.startswith("## "):
            flush()
            section_count += 1
            heading = cleaned[3:]
            anchor = "section-" + str(section_count)
            body.append('<h2 id="' + anchor + '">' + inline_md(heading) + "</h2>")
            toc.append((anchor, heading))
            continue
        # The selected sections have no level-1 headings.
        if cleaned.startswith("# "):
            raise ValueError("Unexpected language heading within legal edition")
        paragraph.append(cleaned)
    flush()
    if len(toc) != 12:
        raise ValueError("Expected 12 complete sections; found " + str(len(toc)))
    return "\n".join(body), toc

def lang_parts(src: str):
    matches = list(LANG_HEADINGS.finditer(src))
    if len(matches) != 3 or [m.group(1)[:2] for m in matches] != ["EN", "RU", "KK"]:
        raise ValueError("Unexpected legal language boundaries")
    fragments = {}
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(src)
        fragments[m.group(1)[:2].lower()] = src[m.end():end].strip()
    return fragments

def make_page(language: str, edition: str) -> str:
    cfg = VERSIONS[language]
    content, toc = parse_markdown(edition)
    title = html.escape(cfg["title"])
    menu = "\n".join(
        '<a href="' + conf["url"] + '" hreflang="' + lang + '"' +
        (' aria-current="page"' if language == lang else "") + ">" +
        {"ru":"Русский", "en":"English", "kk":"Қазақша"}[lang] + "</a>"
        for lang, conf in VERSIONS.items()
    )
    alternate = "\n".join('<link rel="alternate" hreflang="' + lang + '" href="' + conf["url"] + '">'
                          for lang, conf in VERSIONS.items())
    toc_html = "\n".join('<li><a href="#' + anchor + '">' + html.escape(name) + "</a></li>"
                         for anchor, name in toc)
    return f"""<!doctype html>
<html lang="{language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Nomad360</title>
<meta name="description" content="{html.escape(cfg['summary'], quote=True)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="{cfg['url']}">
{alternate}
<link rel="alternate" hreflang="x-default" href="{VERSIONS['ru']['url']}">
<link rel="stylesheet" href="{ORIGIN}assets/nomad360-legal.css">
</head>
<body>
<a class="skip" href="#full-license">Skip to license / К тексту лицензии</a>
<header class="site-header"><div class="header-inner">
<a class="brand" href="{ORIGIN}Marketing_calc.HTML?lang={language}"><img alt="" src="{ORIGIN}nomad360_wolf_open_circle.png" width="50" height="50"><span>Nomad360 lite</span></a>
<a class="back" href="{ORIGIN}Marketing_calc.HTML?lang={language}">{html.escape(cfg['back'])}</a>
</div></header>
<main>
<div class="intro">
<p class="eyebrow">{html.escape(cfg['eyebrow'])}</p>
<h1>{title}</h1>
<p>{html.escape(cfg['summary'])}</p>
<p class="version">{html.escape(cfg['version'])}</p>
</div>
<nav class="language-picker" aria-label="Language / Язык / Тіл">{menu}</nav>
<div class="layout">
<nav class="contents" aria-label="{html.escape(cfg['contents'],quote=True)}">
<h2>{html.escape(cfg['contents'])}</h2>
<ol>{toc_html}</ol>
</nav>
<article class="legal-article" id="full-license" aria-label="{html.escape(cfg['legal_name'],quote=True)}">
{content}
</article>
</div>
</main>
<footer class="legal-footer">
<span>{html.escape(cfg['copyright'])}</span>
<a href="mailto:nomad260393@gmail.com">nomad260393@gmail.com</a>
<a href="{ORIGIN}Marketing_calc.HTML?lang={language}">{html.escape(cfg['back'])}</a>
</footer>
</body>
</html>
"""

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Verify generated HTML matches the legal source")
    args = parser.parse_args()
    src = SOURCE.read_text(encoding="utf-8")
    if VERSION not in src:
        raise ValueError("Legal source version differs from the public page template")
    fragments = lang_parts(src)
    for lang, cfg in VERSIONS.items():
        output = ROOT / cfg["path"]
        expected = make_page(lang, fragments[lang])
        if args.check:
            if not output.exists() or output.read_text(encoding="utf-8") != expected:
                raise AssertionError("Stale public license page: " + cfg["path"] + "; run python scripts/legal/build_license.py")
        else:
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(expected, encoding="utf-8")
    print("Nomad360 public license: complete EN/RU/KK 2.3 editions " + ("verified" if args.check else "generated"))

if __name__ == "__main__":
    main()
