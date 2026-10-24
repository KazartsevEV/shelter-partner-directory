# C5-11 — точная декомпозиция design-system CSS

**Документальный аудит (0 B runtime changes)** по `main` `050bce7` после C5-7.

Оставшиеся **35** групп в `nomad360_design_system.css` классифицированы по AST с полными occurrences, selector, context и property; не заявлены удалёнными.

- **29** paint/decoration groups: old canvas/background vs approved dark canvas, branded Hero, full-service dark→light visual restoration, borders and links. Некоторые исходные значения участвуют в generated palette, поэтому удалять их без byte-exact palette comparison и полноценного браузерного сопоставления нельзя.
- **2** `font` shorthands: первые низкорисковые кандидаты на отдельный C5-12 точный CSS-diff.
- **4** `margin` группы: старые margin находятся в multi-selector правилах, которые имеют живых соседей; удаление без разрезания соответствующих правил нарушит компоновку.

## DoD следующего кода
Для каждого кандидата отдельный proof: frozen old source → exact candidate → AST winner parity → unchanged generator output → before/after Chromium (RU/EN/KK, mobile/desktop, focus/hover, standalone) → unchanged ZIP asset SHA/finance/taxes/storage/export; все прежние source guards принимают только точные правки. Не делать обычный find/replace для цветовых строк.

Сырой счётчик остаётся на main **100 / 19 already retained / 81 unreviewed** до merge. Результаты C5-8/C5-9/C5-10 — самостоятельные Draft. Итоговая сводка: Issue #263. Это не закрытие C5, а полная спецификация следующего безопасного чанка.
