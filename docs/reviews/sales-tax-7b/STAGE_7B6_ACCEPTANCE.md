# SALES-TAX-07B-6 — заключительная сквозная приёмка

**Статус:** автоматическая приёмка 7Б-6 технически GREEN на исходном аудиторском коммите `f3304db`; после внесения фактического протокола требуется повторный CI на заключительном HEAD. PR остаётся Draft и не объединяется без отдельной приёмки владельца.
**Дата:** 16.10.2026. **Исходный `main`:** `10937a9ba54eb2d748eb0acccc35b323b6eb0f1c` (после [PR #169](https://github.com/KazartsevEV/shelter-partner-directory/pull/169)).
**Неизменяемый VAT эталон:** `12c1ad7d8490c08f0f11b2899b6df4e801d024a5`; его снимки, тестовые входы, SHA-256 и числовые допуски не корректировались.
**Объём изменения 7Б-6:** исключительно данный отчёт, тест `tests/sales_tax_7b6_final_audit.test.cjs` и отдельный workflow `.github/workflows/sales-tax-7b6-audit.yml`. Изменения математики, UI, экспортёров, фикстур и локализации запрещены.

## Матрица проверки

| Проверка | Содержание | Неприкосновенный источник |
| --- | --- | --- |
| 48 VAT engines | Standalone, linked, full; VAT 0/12%, turnover/profit, cash/credit, 1/3 мес.; все прежние числа и структуры | `tests/sales_tax_7b_baseline.cjs`, оригинал `baseline/engine-results.json.gz` |
| 78 VAT Chromium | 13 маршрутов × RU/EN/KK × 320/1280, 60 восстановлений, реальные контрольные экраны | `tests/sales_tax_7b_vat_browser.cjs`, `baseline/browser-results.json.gz` |
| 6 XLSX + 6 PDF | Исходные V2 standalone/linked × RU/EN/KK; числовые поля XLSX, печать и PDF | исходный протокол `baseline/browser/protocol.json` |
| Криптографическая защита | SHA-256 всего исторического пакета: JSON, PDF, PNG, логи, исходные контрольные значения | `baseline-manifest.json` (неизменённый) |
| 384 независимых цены | 8 цен × 4 ставки (0/6,25/8/12%) × 4 скидки × 3 режима (exclusive/inclusive/none); контроль цена→нетто→налог→покупатель | новый independent oracle, без формул из налогового модуля |
| Продажи товаров и услуг V1 | own/resale/dropship; полные online/offline self/hired/agent; simple; отдельный налог бизнеса, кредит, агентские плательщики | `sales_tax_7b_goods_browser.cjs` и `sales_tax_7b_services_browser.cjs` |
| V2 | standalone/linked, bundle/cross-sell/upsell, 5 SKU, агент/принципал, помесячный cash, прежний VAT identity | `sales_tax_7b_v2_browser.cjs` + числовые unit |
| Отчёты/сохранения | V1 PDF, V2 Excel/PDF, режимы VAT/Sales Tax/none, RU/EN/KK, мобильный, старые черновики, offline HTML | `sales_tax_7b5_v1_pdf_browser.cjs` и `sales_tax_7b5_v2_export_browser.cjs` |

## Согласованные изменения, не являющиеся VAT-регрессией

- **[PR #155](https://github.com/KazartsevEV/shelter-partner-directory/pull/155):** новый B2B-оффер для консалтинговых компаний, смысловые RU/EN/KK строки и оформление; не затрагивает цены, налоги или кредиты. Контроль `nomad360_marketing_scope.test.cjs`.
- **[PR #156](https://github.com/KazartsevEV/shelter-partner-directory/pull/156):** синий статус установки и шесть учебных примеров простых услуг с корректной очисткой полей; изменение **демонстрации и reset**, а не исторических VAT-формул. Контроль `simple_service_examples_browser.cjs`.
- Известный старый technical debt VAT baseline: 13 неактуальных тестов первого месяца online import и тест с русским селектором на английском интерфейсе документированы ещё до Sales Tax в `BASELINE.md`; они не подменяют 48 + 78 обязательных успешных исторических сценариев.

## Независимые принятые контрольные числа (исходные значения, не результаты 7Б-6)

| Сценарий | Нетто | Sales Tax | Сумма покупателя | Другие инварианты |
| --- | ---: | ---: | ---: | --- |
| 100, скидка 10%, Sales Tax 8% | 90.00 | 7.20 | 97.20 | 0% и none отдельно |
| Принципал в mixed V2 | 1800.00 | 144.00 | 1944.00 | Агентская комиссия 360.00, не налоговая база принципала |
| Standalone V2 / кредит | 1942.86 | 155.43 | 2098.29 | CF 719.57 |
| Linked cross-sell | 7004.50 | 560.36 | 7564.87 | CF 3402.35 |
| Linked upsell | 6869.58 | 549.57 | 7419.15 | CF 3192.83 |
| Linked bundle | 7229.21 | 578.34 | 7807.55 | CF 3635.57 |
| Агент: 8 маршрутов × 3 мес. | 5454.55 | 436.36 | 5890.91 | Комиссии 1200.00, 24 помесячных сверки |

Контрольные значения ранее приняты в [7Б-3](STAGE_7B3_ACCEPTANCE.md), [7Б-4](STAGE_7B4_ACCEPTANCE.md) и [7Б-5](STAGE_7B5_ACCEPTANCE.md); в этой таблице они не выдаются за вновь измеренные.

## CI / пользовательская приёмка

Профильный workflow содержит три независимых jobs: `frozen-vat-and-finance`, `historical-vat-78-browser`, `sales-tax-browser-exports`. Первый отвергает **любую правку вне трёх файлов аудита**, второй сравнивает исторические 78 браузерных маршрутов с неизменяемыми эталонами, третий перепроверяет новые налоговые маршруты, PDF/XLSX/HTML и учебные примеры.

**Фактические результаты первого полного CI на SHA `f3304db`:** оба независимых workflow успешны; реальный числовой протокол ниже. Повторить CI на коммите самого отчёта, чтобы окончательный GREEN относился к точной версии PR.

После GREEN предоставить Draft PR на отдельную приёмку и **не сливать** без разрешения.

## Фактическая приёмка 7Б-6 — 16 октября 2026 года

**Проверенный source HEAD:** `f3304db6f7f8725eb3606d1adfa576d794cedcc7` (три разрешённых файла).
- [7Б-6 final audit — успешный workflow](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38953445047): **3/3 jobs success** — `frozen-vat-and-finance`, `historical-vat-78-browser`, `sales-tax-browser-exports`.
- [Отдельный frozen VAT workflow](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38953444473): **2/2 jobs success** (`baseline-engine`, `baseline-browser`).
- Scope gate отказался бы выполнять audit при изменении любого файла кроме трёх разрешённых. Проверен успешно: `git diff origin/main...HEAD` перечислил только test/workflow/report.

### Контрольные маркеры и точные значения из GitHub Actions

| Источник | Фактически выполнено | Итог |
| --- | --- | --- |
| `7B6_INDEPENDENT_QUOTE_MATRIX_GREEN` | 384 независимых проверок exclusive/inclusive/none | GREEN |
| `SALES_TAX_7B_VAT_PARITY_GREEN` | 48/48 engine-сценариев, полная точность и прежние вложенные поля | GREEN |
| Запуск `node --test` финансового набора | 97 passed, 0 failed | GREEN |
| `SALES_TAX_7B_VAT_BROWSER_GREEN` | 78/78 исторических Chromium-сценариев, сравнение с оригинальными gzip | GREEN |
| Протокол исторических экспортов | 6 XLSX, 6 PDF, 60 restore; языки RU/EN/KK, ширины 320/1280 | GREEN |
| `SALES_TAX_7B_V1_GOODS_GREEN` | 6 V1 товаров, own/resale/dropship × 390/1280 | GREEN |
| `SALES_TAX_7B3_SERVICES_GREEN` | 9 V1 услуг: full 6, simple 3, кредит 6, агентские плательщики 2 | GREEN |
| `SALES_TAX_7B4_BROWSER_GREEN` | Standalone, V1→V2, cross-sell, upsell, bundle | GREEN |
| `7B5_V1_PDF_AND_NONE_GREEN` | 6 RU/EN/KK mobile/desktop, сохранение none | GREEN |
| `7B5_V2_EXPORT_BROWSER_GREEN` | 12 standalone/linked × RU/EN/KK × 390/1280, PDF/Excel, старые черновики, offline HTML | GREEN |
| `SIMPLE_SERVICE_EXAMPLES_GREEN` | 36 сценариев PR #156, 2 примера на роль, 3 языка, 2 ширины | GREEN |

### Сверенные значения по работающим браузерным расчётам (не скопированы в качестве actual из старых отчётов)

| Сценарий | Измеренное Sales Tax | Платёж покупателя | Другой фактический результат |
| --- | ---: | ---: | ---: |
| V2 standalone, кредит | 155.42857142857144 | 2098.285714285714 | free Cash Flow 719.5714285714291 |
| V1→V2 goods | — | Ценовой лимит покупателя 110.98 | нетто-лимит 102.75925925925925 |
| Linked cross-sell | 560.3604 | 7564.865400000001 | free CF 3402.345250000002 |
| Linked upsell | 549.5664 | 7419.146400000001 | free CF 3192.8329999999983 |
| Linked bundle | 578.337096 | 7807.5507959999995 | free CF 3635.5717516666705 |
| Агент/принципал, 5 SKU, 3 месяца | 144.00000000000003 | 1944.0000000000002 | оборот принципала 1800.0000000000002, комиссия агента 360.00000000000006 |
| V2 XLSX/PDF standalone, 2 SKU | 133.33333333333334 | 1800 | 6 комбинаций языка/ширины |
| V2 XLSX/PDF linked, 5 SKU | 716.7074400000001 | 9675.550440000003 | 6 комбинаций языка/ширины |

В контрольных суммах сохранена исходная полная числовая точность. Никакого преобразования ожидаемых VAT результатов, допуска тестов, обрезания отрицательных исходов или переписывания отчетных чисел в сторону красивого ответа не выполнялось.

### Регрессии и отдельные исключения

Весь принятый VAT baseline совпал; новых блокирующих финансовых/браузерных дефектов в этих прогонах не обнаружено. Ранее одобренные PR #155 (коммерческий B2B copy) и #156 (учебные значения/reset) остаются действующими; `nomad360_marketing_scope.test.cjs` и 36 Chromium-проверок примеров успешно прошли. Оговорки исходного `BASELINE.md` о старых непринимаемых import-тестах и отсутствии ручной проверки Excel Desktop/физических устройств остаются ограничениями, но не были скрыты.

**Итог:** 7Б-6 прошёл автоматическую приёмку на `f3304db`. Отчёт фиксируется отдельным коммитом; окончательный SHA считается принятым только после повторного успешного CI. Пользовательская приёмка и разрешение на merge — отдельно.
