# SALES-TAX-07B · нулевой этап: VAT до реализации

Исходный `main`: **12c1ad7d8490c08f0f11b2899b6df4e801d024a5**, после слияния PR #151. Финансовый код и адаптеры до фиксации пакета не менялись. Оба драйвера capture проверяют SHA и отсутствие изменений tracked-файлов отдельного detached checkout. Все эталоны сняты именно из него.

## Покрытие

- **48 полных машинных эталонов**: standalone V2, linked V2 (5 источников, агент, bundle/cross-sell/upsell), полная услуга × VAT 0/12%, turnover/profit, cash/credit, 1/3 месяца. Входы: `tests/fixtures/sales-tax-7b/vat-inputs.json`; все поля результатов, месяцы и дни: `baseline/engine-results.json.gz`; читаемые итоги: `baseline/engine-summary.json`.
- **78 Chromium-кейсов**: own cash/credit, resale, dropship, offline, full online self/hired/agent, simple online self/hired/agent, standalone/linked V2 × RU/EN/KK × 320/1280. Сохранены поля/значения, порядок стадий, модели, себестоимость, капитал, резерв, кредит, Cash Flow, диапазон цен, черновики до/после восстановления и **66 успешных переходов V1→V2**. Во всех 48 применимых V1-кейсах Cash Flow готов. Полные JSON: `baseline/browser-results.json.gz` и отдельные `baseline/browser/*.json.gz`; PNG оригинальные.
- **6 XLSX и 6 PDF**: оба V2 × 3 языка. Excel прочитан библиотекой, таблицы и печатный текст сохранены в браузерных JSON; PDF находятся рядом с PNG.
- **214 unit-тестов GREEN** по действующему calculator-tests workflow; **9 браузерных финансовых тестов** простых онлайн-услуг GREEN; полный расчёт услуг и PDF GREEN. Точные команды/результаты — журналы `baseline/*.log`, перечень unit-файлов — исходный `.github/workflows/calculator-tests.yml`.
- Существующий Embed-тест скачал автономный HTML **8 669 937 байт**, открыл его и сформировал Excel (`EMBED_EXCEL_DOWNLOAD_GREEN`, `NOMAD360_EMBED_DOWNLOAD_GREEN`). Фикстуры и маршрут теста закреплены исходным SHA; дубликат HTML на 8 МБ в репо не добавляется.

## Формулы и форматы

V1: `calculateProductPortfolio`, `aggregatePricingMetrics`, `calculateProductCashFlow`, `calculatePriceListRange` в Marketing_calc.HTML. Отдельные налог бизнеса и транзитный VAT. Полные услуги/агент: `serviceAgencyExpenseSplit`, `v1FullServiceSku`, согласованные плательщики и отдельные агент/принципал. Простая онлайн-услуга: `calculate`, `onlineV1PortfolioSnapshot`, прежние ramp/исполнитель/денежные потоки.

Standalone: portfolio_v2_engine, цена без VAT, customer price = price × (1+VAT/100). Linked: portfolio_v2_linked_engine + temporal/cash/period_price; выручка после скидок и наборов без VAT. Full service: portfolio_v2_full_service, net = priceGross/(1+VAT/100), прежние CAPEX/амортизация/кредит/daily/monthly cash.

Хранилища: V1 `marketingCalcProductResultV1`; standalone `marketingCalcPortfolioV2` version 2; linked `marketingCalcLinkedPortfolioV2` version 3. Входы и восстановленные состояния сохранены. SHA-256 исходников — `baseline/source-sha256.json`, пакета — `baseline-manifest.json`.

## Известные исходные ограничения

- Старый `portfolio_v2_online_import.test.cjs`: **13/13 падают** до разработки (прежний first-month контракт). Это отдельный технический долг; не включён в 214 GREEN. Журнал сохранён.
- Старый online_import_browser ждёт русскую кнопку «Я сам» при исходном английском UI и падает по timeout. Новый драйвер использует стабильные onclick-селекторы; перенос всех трёх простых онлайн-ролей проходит. Продукт и старый тест ради baseline не менялись.
- Raw HTML динамических строк uiState при восстановлении меняет локализованные labels (исходный EN → выбранный RU/KK). Оба полных состояния сохранены. Внутри проверки сохранение→восстановление финансовые части сравниваются точно без uiState. Для последующего сравнения baseline→реализация оба сохранённых состояния проверяются по всем прежним ключам.
- Физические устройства и Excel Desktop не проверены. Браузерные PDF/XLSX не означают ручную офисную приёмку.

## Воспроизведение и правило сравнения

Node local 24.19.0, CI 22; Playwright 1.58.0 / Chromium 145, Tailwind 3.4.17; локальная ExcelJS 4.4.0. Требуются Playwright/Chromium и `artifacts/sales-tax-7b/utilities.css`, собранный из того же Tailwind content-набора проекта.

```bash
git worktree add --detach /tmp/nomad-vat-before 12c1ad7d8490c08f0f11b2899b6df4e801d024a5
SALES_TAX_BASELINE_ROOT=/tmp/nomad-vat-before node tests/sales_tax_7b_baseline.cjs --capture
SALES_TAX_BASELINE_ROOT=/tmp/nomad-vat-before node tests/sales_tax_7b_vat_browser.cjs --capture
# Текущая реализация против неизменённого эталона, без --capture:
node tests/sales_tax_7b_baseline.cjs
node tests/sales_tax_7b_vat_browser.cjs
```

Все прежние числовые поля сравниваются точно; новые поля метаданных могут добавляться. Прежние допуски независимых тестов не расширяются. После публикации этого коммита фикстуры и эталоны не подгонять под новый код. Финансовую реализацию Sales Tax начинать только после фиксации данного пакета.

| Scenario | Revenue | Profit | Business tax | Cash |
|---|---:|---:|---:|---:|
| standalone-profit-vat12-credit-3 | 1781.3333333333335 | 204.74400000000014 | 10.776000000000009 | 151.19600000000082 |
| linked-profit-vat12-credit-3 | 2424.370982142857 | 712.7202901785711 | 43.1506919642857 | 3783.131510416663 |
| full-profit-vat12-credit-3 | 4821.428571428571 | 2204.987321428571 | 116.05196428571426 | 1979.9873214285708 |
