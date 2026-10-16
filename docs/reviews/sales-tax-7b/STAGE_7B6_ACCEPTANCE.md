# SALES-TAX-07B-6 — заключительная сквозная приёмка

**Статус:** Draft; окончательный результат CI пока не получен. Не объединять до приёмки владельца.
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

**Итоговые CI ссылки и фактические результаты:** добавить только после завершения работы на одном SHA; failures и skips указывать явно. Никакого смягчения эталонов или незаметного пропуска проверки. До этого статус **NOT ACCEPTED**.

После GREEN предоставить Draft PR на отдельную приёмку и **не сливать** без разрешения.
