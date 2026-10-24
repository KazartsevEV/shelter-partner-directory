# C5-9 — IRBIS footer geometry

База — `main` после принятого #258, `050bce789259867096d2d312e5b0dbea51454d5d`. Изменён только `nomad360_irbis_banner.css` из runtime; JS, палитра, тексты, финансы, HTML, фотографии и ресурсы не меняются.

Убраны шесть ранее перекрытых деклараций, `−189 B`: исходная глобальная `min-height` футера, две декларации `width/max-width` у открытого блока лицензии, ранний `padding` на мобильных, ранний `font-size` заголовка и ранний `margin` мобильной иллюстрации. Действующие поздние владельцы `min-height:clamp(490px,42.1vw,650px)`, `58%/775px`, `padding:0`, `clamp(30px,8vw,43px)` и `14px -20px -12px` сохраняются.

**Приёмка:** exact source transform и полное равенство конечных CSS победителей по selector/context/property/important; paired Chromium 2 HTML × 5 widths (320, 390, 600, 601, 1280) × RU/EN/KK, все computed properties и геометрия IRBIS, ошибки JS, frozen V1/V2/налоги. Доказательства и CI не подменяют визуальную приёмку владельца. Числовые эталоны не меняются; `file://` Issue #260 не закрывается.
