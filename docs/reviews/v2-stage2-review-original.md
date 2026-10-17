> Исторический первоначальный отчёт для версии `3df23f55e004ee299b86aee1296c65bcc91f7d49`. Пользователь отклонил эту версию из-за разрыва сумм на 320 px. Зелёные проверки этого отчёта не проверяли число строк финансовых значений. [Актуальный отчёт](v2-stage2-review.md).
>
> Текст первоначального отчёта сохранён; локальные ссылки заменены доступными ссылками на GitHub и исходные ZIP. Они показывают историческую версию, а не исправленные результаты.

# PR #130 — этап 2: поля и мобильная сетка

Этап 2 завершён для приёмки. [PR #130](https://github.com/KazartsevEV/shelter-partner-directory/pull/130), коммит `3df23f55e004ee299b86aee1296c65bcc91f7d49`, основан на принятом этапе 1 / PR #129 (`0eb9fbc`). PR остаётся черновым; main и рабочий сайт не изменены. Этап 3 не начат.

Мобильные группы форм используют одну колонку до 640 px. У товарных карточек, вложенных назначений ресурсов, фильтров истории и позиций корзины собственные сетки для широкого экрана. Подписи находятся над контролами; длинные названия переносятся, удаление не перекрывает заголовок. Поля имеют высоту не менее 44 px, чекбоксы — 18 px и не сжимаются.

Нативные списки и их обработчики сохранены. Если выбранный текст не помещается в строку списка, полный вариант показывается под тем же полем. Он копируется из уже переведённой опции, исключён из повторного озвучивания и не попадает в данные бизнеса. Копия обновляется при смене значения, языка, ширины окна и загрузке шрифта.

**Проверки:** 8/8 CI успешны. [Chromium-проверка](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130): 162 сценария до и 162 после, RU/EN/KK, обе ветки, 320/360/390/430/768/1280 px. Открыты все details; проверены свои деньги/кредит, own/resale/dropship, пять источников V1, полная услуга, все режимы корзин, сертификаты, склад, история и сопоставление неизвестных SKU.

Финансовые результаты и черновики совпали **162/162**. Состав, значения, типы и цвета полей сохранены. Проверены **14 796 контролов**; нарушений геометрии и переполнения ширины страницы нет. Подписи и поля проверяются по фактическим текстовым прямоугольникам и координатам Chromium. В исходной версии тест воспроизводит обрезание выбранных значений, выход текста и наложения — он проверяет отображение, а не наличие новых классов.

Проверены **91 985 образцов текста**, минимум контраста **4,77:1**, нарушений порога 4,5:1 нет. Расчёт учитывает прозрачность всех фонов родителей. Дополнительно прошли семь сценариев без Tailwind, смена языка и ширины на уже открытой странице, числовые поля, списки, чекбоксы, условное отображение кредита и локальное сохранение/восстановление. Поле сценария в таблице истории доступно через локальную прокрутку; это отдельно проверено Chromium.

Движки, V1, HTML, хедер/футер, навигация, валюты и локализация сравниваются с эталоном побайтово. Код существующих UI и подписи совпадают после исключения только class-атрибутов и изолированного помощника отображения выбранного значения. Формулы, структура черновиков, события и порядок операций не менялись.

**306 PNG:** готовые сценарии 320/390/1280 px и остальные состояния 390 px, обе ветки RU/EN/KK. Включены отдельные кадры дат сертификата, загрузки и фильтров истории, сопоставления SKU и исходных платежей полной услуги. На 360/430/768 px имеются численные проверки геометрии и контраста, без PNG.

[Самостоятельный V2 — архив](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742132405) · [Связанный V2 — архив](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) · Галерея была локальной; все исходные PNG находятся в двух архивах · [JSON после (`after/receipts.json` в архиве)](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433)

| Группа форм | До — принятый этап 1 | После — этап 2 |
| --- | --- | --- |
| Воронка RU, 320 | [до — `before/standalone-ready-ru-320-marketing.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742132405) | [после — `after/standalone-ready-ru-320-marketing.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742132405) |
| Ресурсы EN, 390 | [до — `before/standalone-ready-en-390-resources.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742132405) | [после — `after/standalone-ready-en-390-resources.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742132405) |
| Сертификат KK, 390 | [до — `before/standalone-ready-kk-390-certificate-dates.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742132405) | [после — `after/standalone-ready-kk-390-certificate-dates.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742132405) |
| Кредит RU, 390 | [до — `before/standalone-credit-ru-390-financing.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742132405) | [после — `after/standalone-credit-ru-390-financing.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742132405) |
| Связанные ресурсы RU, 320 | [до — `before/linked-ready-ru-320-resources.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) | [после — `after/linked-ready-ru-320-resources.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) |
| Корзина EN, 390 | [до — `before/linked-ready-en-390-basket.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) | [после — `after/linked-ready-en-390-basket.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) |
| Загрузка истории KK, 390 | [до — `before/linked-ready-kk-390-history.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) | [после — `after/linked-ready-kk-390-history.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) |
| Сопоставление истории RU, 390 | [до — `before/linked-unmapped-ru-390-history.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) | [после — `after/linked-unmapped-ru-390-history.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) |
| Расходы полной услуги EN, 390 | [до — `before/linked-full-service-en-390-resource-pools.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) | [после — `after/linked-full-service-en-390-resource-pools.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) |
| Воронка RU, 1280 | [до — `before/standalone-ready-ru-1280-marketing.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742132405) | [после — `after/standalone-ready-ru-1280-marketing.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742132405) |
| Связанные ресурсы RU, 1280 | [до — `before/linked-ready-ru-1280-resources.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) | [после — `after/linked-ready-ru-1280-resources.png`](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38239538130/artifacts/11742087433) |

Изменённые рабочие файлы:

- [nomad360_design_system.css](https://github.com/KazartsevEV/shelter-partner-directory/blob/3df23f55e004ee299b86aee1296c65bcc91f7d49/nomad360_design_system.css)
- [portfolio_v2_ui.js](https://github.com/KazartsevEV/shelter-partner-directory/blob/3df23f55e004ee299b86aee1296c65bcc91f7d49/portfolio_v2_ui.js)
- [portfolio_v2_linked_ui.js](https://github.com/KazartsevEV/shelter-partner-directory/blob/3df23f55e004ee299b86aee1296c65bcc91f7d49/portfolio_v2_linked_ui.js)
- [portfolio_v2_basket_ui.js](https://github.com/KazartsevEV/shelter-partner-directory/blob/3df23f55e004ee299b86aee1296c65bcc91f7d49/portfolio_v2_basket_ui.js)
- [portfolio_v2_mba_observed_ui.js](https://github.com/KazartsevEV/shelter-partner-directory/blob/3df23f55e004ee299b86aee1296c65bcc91f7d49/portfolio_v2_mba_observed_ui.js)

Проверки и критерии приёмки:

- [tests/nomad360_v2_containers_browser.test.cjs](https://github.com/KazartsevEV/shelter-partner-directory/blob/3df23f55e004ee299b86aee1296c65bcc91f7d49/tests/nomad360_v2_containers_browser.test.cjs)
- [tests/helpers/v2-layout.cjs](https://github.com/KazartsevEV/shelter-partner-directory/blob/3df23f55e004ee299b86aee1296c65bcc91f7d49/tests/helpers/v2-layout.cjs)
- [.github/workflows/v2-container-review.yml](https://github.com/KazartsevEV/shelter-partner-directory/blob/3df23f55e004ee299b86aee1296c65bcc91f7d49/.github/workflows/v2-container-review.yml)
- [docs/v2-fields-stage2.md](https://github.com/KazartsevEV/shelter-partner-directory/blob/3df23f55e004ee299b86aee1296c65bcc91f7d49/docs/v2-fields-stage2.md)

Ограничения: проверка контраста касается обычного отображения; скрытый текст и отключённые элементы исключены. Таблицы отчётов сохраняют локальную горизонтальную прокрутку. Нативные кнопки выбора файла и формат даты зависят от языка браузера; в Chromium-снимках они могут быть английскими. В расширенной ветке полной услуги обнаружены прежние непереведённые подписи исходных платежей; файл локализации не менялся, полная локализация остаётся отдельной задачей. Имена из данных намеренно не переводятся.

Вручную просмотрены мобильные воронка, ресурсы, сертификаты, кредит, корзина, история и поля полной услуги в RU/EN/KK, а также десктопные группы. Длинные имена без пробелов в тестовых данных специально проверяют переносы.

Этап 3 — цветовая иерархия кнопок; этап 4 — семантика ресурсов и зарплаты; этап 5 — порядок результатов. Они не выполнялись в этом PR.
