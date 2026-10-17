# SALES-TAX-07B-4 — Приёмка V2 (standalone / linked / агент / VAT)

**Дата:** 16 октября 2026 года  
**PR:** [#165](https://github.com/KazartsevEV/shelter-partner-directory/pull/165)  
**Замороженный эталон VAT:** `12c1ad7d8490c08f0f11b2899b6df4e801d024a5` (48 движковых эталонов, 78 Chromium-сценариев; эталоны и числовые допуски не изменялись).  
**Исходная база этапа 7Б-4:** merge 7Б-3 `e29d5642c2c4ff7b66066aa4e7182264e5f71399`.
**Синхронизация с `main`:** merge-коммит [`ef0e418`](https://github.com/KazartsevEV/shelter-partner-directory/commit/ef0e418fe460cd121b88e3fd0562b90a53f36836) добавил `da80dc8` (документация и утверждённые баннерные эталоны, без пересечений с файлами налогового PR). 12 файлов текущего `main` перенесены без потерь.

## Объём и финансовый контракт

- В V2 отдельный `taxRegime=vat|sales_tax|none`, пользовательская `salesTaxPct`. Исторические VAT-состояния направляются напрямую в прежний engine, без нового пересчёта.
- Для Sales Tax весь уплачиваемый покупателем налог считается единожды от **фактической выручки после скидок, bundle, upsell и cross-sell**, без повторного применения скидки; транзитный налог не включается в выручку, прибыль, проценты, погашения и чистый Cash Flow.
- Для агентских услуг база Sales Tax принципала — подтверждённая продажа **принципала**, а не комиссия агента. Нет подтверждённой базы — fail closed; расчёт не подставляет сумму комиссии как оборот принципала.
- Оставлены прежние способы финансирования, помесячные горизонты, SKU/ресурсы, плательщики агент/принципал и ставка бизнес-налога.

## Реальные Chromium-маршруты V2

Машинные результаты из `SALES_TAX_7B4_BROWSER_GREEN` в профильно успешном запуске stage-4 на исходном коммите `5b3f1b5270e18307e32959f5fb6190274fb2e199`. Ставка Sales Tax = 8%; цифры округлены **только для документа**, сравнения выполняются на точных исходных значениях.

| Маршрут | Нетто-продажи | Sales Tax | Покупатель платит | Свободный Cash Flow |
| --- | ---: | ---: | ---: | ---: |
| Standalone V2 (2 SKU, кредит) | 1 942.86 | 155.43 | 2 098.29 | 719.57 |
| Linked cross-sell | 7 004.50 | 560.36 | 7 564.87 | 3 402.35 |
| Linked upsell | 6 869.58 | 549.57 | 7 419.15 | 3 192.83 |
| Linked bundle | 7 229.21 | 578.34 | 7 807.55 | 3 635.57 |

Отдельно доказан перенос товара V1→V2: потолок покупательской цены **110.98** и нетто-граница **102.759259…**; разность — только 8% покупательского налога. Все три offer-маршрута подтверждают события корзины, целевые цены, положительные ценовые границы SKU, расчёт маржи, трёхмесячный period P&L и неизменность Cash Flow.

## Дополнительные матрицы агент/принципал

Тест `tests/v1_service_v2_numeric_parity.test.cjs` расширен новой матрицей **8 маршрутов × 3 месяца = 24 помесячные проверки**: online/offline × свои деньги/кредит × налог бизнеса с оборота/прибыли. Источник истинных сумм — **реальный V1**, его `partnerRevenue`, `inflow`, `financedInflow` и `freeCumulative`; проверяются:
- доход принципала в V2, отдельная комиссия агента и отсутствие подмены базы Sales Tax;
- Sales Tax = подтверждённая выручка принципала × 8%, покупательская сумма = нетто × 1.08;
- равенство всех месяцев принципала исходному V1, без фиктивных продаж за пределами периода;
- неизменность прибыли агента, бизнес-налога, кредита, выручки и свободных денежных остатков V2 относительно старой нетто-модели.

`tests/sales_tax_7b_v2_projection.test.cjs` дополнен самостоятельным проверяемым **реальным смешанным портфелем из 5 SKU**, включая online-агента: подтверждённый оборот принципала **1 800**, комиссия агента **360**, транзитный Sales Tax **144**, покупательская сумма принципала **1 944**. На каждом из трёх месяцев проверяются нетто-выручка всех SKU, выручка принципала отдельно от комиссии и неизменность Cash Flow. Тестовые данные взяты из ранее принятого `portfolio_v2_f3_fixture.cjs`; не генерируются из уже пересчитанного результата.

### Фактический результат агентских тестов

Дополнительная числовая матрица **успешно пройдена** в [stage-4 CI на `d2ea4cc`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38906386473), где зафиксирован маркер `7B4_AGENT_PRINCIPAL_MATRIX`:

| Показатель | Online/Offline × cash/credit × turnover/profit (8 маршрутов) |
| --- | ---: |
| Выручка принципала, 3 месяца | 5 454.55 |
| Комиссия агента, 3 месяца | 1 200.00 |
| Транзитный Sales Tax 8% | 436.36 |
| Платёж покупателей | 5 890.91 |
| Проверено месячных срезов | 24 |

Для каждого из восьми маршрутов отдельно подтверждены **все три месяца** выручки принципала и комиссии агента относительно действующего V1, неизменность чистой прибыли, кредита и Cash Flow. Для смешанного портфеля отмечен `7B4_ONLINE_AGENT_REAL_GREEN`: принципал **1 800**, комиссия **360**, Sales Tax **144**, покупательская сумма **1 944**, три месяца. Результаты контролируются автоматическими тестами, а не ручным сопоставлением округлённых цифр.

## Локализация и воспроизводимость

В `nomad360_locale_core.js` внесены RU/EN/KK переводы налоговых меток и сообщений V2. Каталог L0 пересобран **штатным** `node scripts/localization/inventory.cjs`, затем проверен `--check`; ожидаемые значения или пороги не подменялись.

```bash
npm ci --prefix scripts/localization --ignore-scripts --no-audit --no-fund
node scripts/localization/inventory.cjs --check
node tests/sales_tax_7b_baseline.cjs
node --test tests/sales_tax_7b_v2_projection.test.cjs tests/v1_service_v2_numeric_parity.test.cjs tests/portfolio_v2_engine.test.cjs tests/portfolio_v2_online_adapter.test.cjs
# При установленном Playwright Chromium и NODE_PATH:
node tests/sales_tax_7b_v2_browser.cjs
node tests/sales_tax_7b_services_browser.cjs
```

Профильная CI: `.github/workflows/sales-tax-7b-v2.yml`. Полный CI: все действующие workflow на последнем HEAD PR, включая товары V1, услуги V1, frozen VAT, локализацию, маркетинг, Inter, SEO и Chromium-аудит.

## Финальная приёмка и merge (16.10.2026)

**Задача 7Б-4 принята и объединена:** [PR #165](https://github.com/KazartsevEV/shelter-partner-directory/pull/165) → [merge `9af19b7`](https://github.com/KazartsevEV/shelter-partner-directory/commit/9af19b7bfd43a769d2b05635cf5b887be67d34d0). Последний проверенный PR HEAD: [`aedc2e8`](https://github.com/KazartsevEV/shelter-partner-directory/commit/aedc2e89ac1de56815e0299f78faec5de56ea0ca).

**Финальные GitHub Actions на этом точном HEAD:** 23 завершённых workflow = **22 `success`, 1 `skipped`, 0 `failure`**, нет ожидающих/запущенных. Условно пропущен только исторический `V2 buttons visual review`; его результат не выдаётся за проведённую визуальную приёмку.

- [V2 stage-4 — run 38914816143](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38914816143) — GREEN.
- [Stage-1 чистая формула + VAT — run 38914815968](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38914815968) — GREEN после исправления scope guard.
- [Frozen VAT baseline — run 38914816399](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38914816399) — GREEN.
- [Localization + browser census — run 38914816054](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38914816054) — GREEN.
- [Все 23 workflow / CI итогового PR](https://github.com/KazartsevEV/shelter-partner-directory/pull/165/checks).

Проверено перед merge: отставание от `main` = 0; защищённые `portfolio_v2_*_engine` и связанные финансовые engines не менялись; матрица агент/принципал (8 маршрутов × 3 месяца), покупательский налог, VAT baseline, чистый Cash Flow — все GREEN. UI, старые сохранения и Excel/PDF/HTML завершаются отдельно в 7Б-5, итоговый сквозной аудит — 7Б-6.

## Ворота merge и результаты общего CI

**Подтверждено на pre-sync HEAD [`6551e5c`](https://github.com/KazartsevEV/shelter-partner-directory/commit/6551e5cc837d57229cbe1cbc0e1d1a67f02b3e13):** все 22 зарегистрированных workflow завершились: **21 `success`, 1 `skipped` (условный `V2 buttons visual review`), 0 `failure`**. `skipped` не является визуальной приёмкой. Обязательные VAT baseline, Sales Tax V1 goods/services, standalone/linked V2, numeric audit, localization, SEO и marketing завершились `success`.

- [Stage-4 V2 — run 38909164555](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38909164555): `v2-tax-projection` и все шаги, включая frozen VAT, V2 engines, матрицу агента и Chromium, успешны.
- [Localization census — run 38909164289](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38909164289): `inventory`, semantic и Chromium успешно.
- [Numeric Chromium audit — run 38909164315](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38909164315): `browser-audit` успешно.
- [Агентская матрица — run 38906386473](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38906386473): `7B4_AGENT_PRINCIPAL_MATRIX`, 8 маршрутов × 3 месяца; числа зафиксированы выше.

### Примечание к историческому CI 7Б-1

Первый заключительный прогон на `6bfd02f` выявил [ошибку stage-1 scope gate (run 38914160199)](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38914160199): правка общей карты 7Б запускала workflow **7Б-1**, где исторический запрет изменений UI ошибочно применялся к законным интеграциям 7Б-4 (`Marketing_calc.HTML`, `nomad360_locale_core.js`). Числовые тесты и frozen VAT не успели выполниться из-за этого раннего guard.

В [`.github/workflows/sales-tax-7b-pure.yml`](../../../.github/workflows/sales-tax-7b-pure.yml) guard ограничен изменениями **самих файлов чистой математики 7Б-1**, а шесть защищённых исторических финансовых engines проверяются независимо на любой последующей стадии. Шаги строгих unit-тестов 7Б-1 и `tests/sales_tax_7b_baseline.cjs` оставлены обязательными и без изменений; эталоны/пороги не смягчались. Новый запуск после исправления выполнен успешно: stage-1 run 38914815968, frozen VAT run 38914816399.

**Заключительная проверка выполнена на \`aedc2e8\`:** [проверки PR #165](https://github.com/KazartsevEV/shelter-partner-directory/pull/165/checks), [профильный workflow](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38914816143). Все обязательные workflow GREEN, после чего PR объединён.

**Нельзя объединять** при красном обязательном workflow, изменённых frozen VAT-эталонах, утрате контекста принципала или непроверенной помесячной математике. Прежние VAT-формулы, числовые допуски и эталоны не менять. UI/экспорт/восстановление старых черновиков в окончательном виде относятся к отдельной задаче 7Б-5; заключительная сквозная приёмка всей 7Б — 7Б-6.

