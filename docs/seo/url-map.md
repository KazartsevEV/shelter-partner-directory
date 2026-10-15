# SEO-07 · URL-карта для приёмки фазы A

База: `main 919f9ad`, дата аудита 15.10.2026. [Наблюдаемые ответы](evidence/live-url-audit.json). Все 15 новых адресов пока HTTP 404. Ссылки self в таблице обозначают **предлагаемые конечные адреса**, а не опубликованные страницы.

Фаза A принята. [Фаза B](../reviews/seo-07-phase-b-review.md) реализует EN и язык перехода в Draft ветке; опубликованная база в этой таблице ещё не менялась. Активный EN-манифест: `scripts/seo/pages.json`.

## Решение о размещении

Origin `https://kazartsevev.github.io`, project path `/shelter-partner-directory/`. В будущей сборке это единая конфигурация, из которой строятся ссылки, canonical, hreflang и sitemap. Никаких URL в `https://kazartsevev.github.io/en/`.

Фактические настройки [Pages API](evidence/pages-settings.json): `build_type=legacy`, source `main:/`. В репозитории также существуют workflows публикации Pages. Их наличие не является доказательством того, что основной source — Actions. Новые каталоги должны попасть в опубликованный корень; после разрешённого merge обязательна проверка реальных HTTPS URL.

## Существующие URL: сохранить

| Адрес относительно base | Наблюдение | Решение |
|---|---|---|
| `/`, `index.html` | 200, SHELTER Partner Directory | Полностью сохранить; не редиректить и не ставить метаданные Nomad360 |
| `Marketing_calc.HTML` | 200, единое финансовое приложение | Сохранить приложение, добавить только self-canonical техническим изменением в фазе B |
| `Marketing_calc.HTML?demo=shopper&finance=cash` | 200, действующая демо-ссылка | Не перенаправлять, не включать query URL в sitemap |
| `Marketing_calc.HTML?demo=shopper&finance=credit` | 200, действующая кредитная демо-ссылка | То же; сохранить параметры до инициализации модели |
| `Marketing_calc.HTML?lang=en` | 200, но параметр не выбирает язык | Минимальный language handoff в фазе B, до этого не выдавать за рабочий маршрут EN |
| `sitemap.xml` | 404 | Создать в фазе C только для готового выпуска; не включать чужой SHELTER |
| `robots.txt` проекта | 404 | Не создавать бесполезный project robots как якобы настройку хоста |
| `https://kazartsevev.github.io/robots.txt` | 404 | Запрета обхода в полученном ответе нет; повторить перед выпуском, файл не менять |
| `seo-07-missing-page-check/` | Реальный 404 | Сохранить обычное поведение 404; новый общий handler не нужен |

## Новые страницы

| ID | Будущий путь | Canonical (предложение) | Эквиваленты | Основной ответ | Статус |
|---|---|---|---|---|---|
| EN0 | `en/` | [self](https://kazartsevev.github.io/shelter-partner-directory/en/) | EN0 ↔ RU0 ↔ KK0 | Обзор возможностей и подготовка исходных данных | сейчас 404; обязателен |
| EN1 | `en/business-idea/` | [self](https://kazartsevev.github.io/shelter-partner-directory/en/business-idea/) | EN1 ↔ RU1 ↔ KK1 | Условия финансовой состоятельности идеи | сейчас 404; кандидат |
| EN2 | `en/pricing/` | [self](https://kazartsevev.github.io/shelter-partner-directory/en/pricing/) | EN2 ↔ RU2 ↔ KK2 | Расходы и цена товара/услуги | сейчас 404; кандидат |
| EN3 | `en/cash-flow/` | [self](https://kazartsevev.github.io/shelter-partner-directory/en/cash-flow/) | EN3 ↔ RU3 ↔ KK3 | Месячные поступления/выплаты; несколько позиций | сейчас 404; кандидат |
| EN4 | `en/for-consultants/` | [self](https://kazartsevev.github.io/shelter-partner-directory/en/for-consultants/) | EN4 ↔ RU4 ↔ KK4 | Полезный инструмент на сайте консультанта | сейчас 404; кандидат |
| RU0 | `ru/` | [self](https://kazartsevev.github.io/shelter-partner-directory/ru/) | EN0 ↔ RU0 ↔ KK0 | Обзор возможностей и подготовка исходных данных | сейчас 404; обязателен |
| RU1 | `ru/business-idea/` | [self](https://kazartsevev.github.io/shelter-partner-directory/ru/business-idea/) | EN1 ↔ RU1 ↔ KK1 | Условия финансовой состоятельности идеи | сейчас 404; кандидат |
| RU2 | `ru/pricing/` | [self](https://kazartsevev.github.io/shelter-partner-directory/ru/pricing/) | EN2 ↔ RU2 ↔ KK2 | Расходы и цена товара/услуги | сейчас 404; кандидат |
| RU3 | `ru/cash-flow/` | [self](https://kazartsevev.github.io/shelter-partner-directory/ru/cash-flow/) | EN3 ↔ RU3 ↔ KK3 | Месячные поступления/выплаты; несколько позиций | сейчас 404; кандидат |
| RU4 | `ru/for-consultants/` | [self](https://kazartsevev.github.io/shelter-partner-directory/ru/for-consultants/) | EN4 ↔ RU4 ↔ KK4 | Полезный инструмент на сайте консультанта | сейчас 404; условный B2B-интент |
| KK0 | `kk/` | [self](https://kazartsevev.github.io/shelter-partner-directory/kk/) | EN0 ↔ RU0 ↔ KK0 | Обзор возможностей и подготовка исходных данных | сейчас 404; обязателен |
| KK1 | `kk/business-idea/` | [self](https://kazartsevev.github.io/shelter-partner-directory/kk/business-idea/) | EN1 ↔ RU1 ↔ KK1 | Условия финансовой состоятельности идеи | сейчас 404; кандидат |
| KK2 | `kk/pricing/` | [self](https://kazartsevev.github.io/shelter-partner-directory/kk/pricing/) | EN2 ↔ RU2 ↔ KK2 | Расходы и цена товара/услуги | сейчас 404; кандидат |
| KK3 | `kk/cash-flow/` | [self](https://kazartsevev.github.io/shelter-partner-directory/kk/cash-flow/) | EN3 ↔ RU3 ↔ KK3 | Месячные поступления/выплаты; несколько позиций | сейчас 404; кандидат |
| KK4 | `kk/for-consultants/` | [self](https://kazartsevev.github.io/shelter-partner-directory/kk/for-consultants/) | EN4 ↔ RU4 ↔ KK4 | Полезный инструмент на сайте консультанта | сейчас 404; условный B2B-интент |

[Машиночитаемый реестр предложений](url-proposal.json): все `isPublished=false`. Реестром не генерируются sitemap или публичные страницы на фазе A.

Различие EN0 и EN1: EN0 помогает **выбрать режим и подготовить данные**, EN1 объясняет **условия, при которых конкретный сценарий покрывает расходы**. Если итоговые тексты не сохранят это различие, объединить тему с обзором до выпуска, а не публиковать два сходных текста. Аналогично RU/KK.

RU4/KK4: страницы остаются кандидатами. Наблюдаемая выдача часто имеет другой смысл; публикация требует языковой приёмки содержательного ответа, без объявления локального спроса доказанным. Сама действующая возможность размещения калькулятора сохраняется независимо от решения о поисковой странице.

## Canonical и языковые альтернативы

- Обзорные и тематические URL — self-canonical; переводы не сводятся на EN.
- Эквиваленты только внутри одной темы; взаимные en/ru/kk и ссылка на себя.
- `x-default` не предлагается: нейтрального языкового селектора нет.
- `en/index.html` и `en/` должны иметь одну canonical `en/`; аналогично каждой вложенной странице. Вариант index.html не включать в sitemap.
- У приложения предлагается одна canonical `https://kazartsevev.github.io/shelter-partner-directory/Marketing_calc.HTML` для обычного URL и вариантов `lang`, `demo`, `finance`. Приложение не является переводом информационной статьи; не включать его в группы hreflang статей.
- У приложения не добавлять `noindex`: оно отличается от обзора интерактивными формами и результатами. Обзор не копирует оффер и весь интерфейс приложения.
- Sitemap содержит только канонические URL реально выпускаемых страниц и APP; без query, ассетов, документации review, SHELTER и 404. `lastmod` опустить, если нет достоверной даты содержательного изменения.
- Временные макеты в `docs/seo/mockups/` — `noindex,nofollow`, без canonical/hreflang, никогда не включаются в sitemap.
- Полный выпуск только после последовательной приёмки EN, RU, KK и функциональной матрицы. Ни sitemap, ни существующие публичные страницы не должны заранее ссылаться на отсутствующие переводы. После публикации сверить фактический набор HTTP 200 и reciprocity.

## Минимальный контракт языка: проектирование, не реализация

При загрузке приложения: допустимый `lang=en|ru|kk` → сохранённое предпочтение → язык браузера → существующий fallback. Пустой/неподдерживаемый lang игнорируется. Ручной переключатель меняет только UI и URL через History API, сохраняя `demo`, `finance`, прочие параметры и hash; не вызывает повторную загрузку и не пишет язык в финансовую модель.

Обязательные RED/GREEN проверки фазы B: конфликт query/stored/browser; неверный lang; ручная смена с непустым расчётом; кассовый и кредитный шоппер вместе с lang; восстановление; скачанный полный HTML. Все новые CTA используют этот контракт только после его реализации и теста.

Из pricing/business-idea ведём в `#nomad360-selling-choice`; из consultants — в `#nomad360-embed`. Это существующие ID. Ссылка не обещает автоматический выбор V1/V2, которого нет в текущем контракте.

## Раздельные продукты и собственный домен в будущем

Существующий корень остаётся SHELTER. Для текущего GitHub Pages вопрос корня разрешён этим разделением и **не требует смены домена**. Если впоследствии владелец передаст собственный домен, новая отдельная задача должна определить поведение его корня, origin/base path, соответствие старых и новых URL и реальные возможности HTTP-редиректов. Пока нет домена — нет CNAME, DNS-изменений и canonical на вымышленный hostname.

## Два макета для решения

[EN overview](mockups/home-en.html) и [EN pricing](mockups/pricing-en.html) — обзор с выбором вопросов и самостоятельная мини-инструкция с таблицей расходов. Это review-документы, не SEO-код приложения. CTA сейчас ведёт к существующему калькулятору **без неподдерживаемого lang**; примечание честно указывает будущий handoff.

Предлагается принять: project path и сохранение SHELTER; отдельные обзор/темы с проверкой отсутствия дублей; self-canonical APP; минимальный контракт языка; условный статус RU/KK consultant-тем; два макета как основу EN, сохраняя маркетинговый экран задачи 6.
