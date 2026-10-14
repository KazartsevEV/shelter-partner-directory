# L6 · постоянные доказательства RU / EN / KK

Реализация `2f7d1c09e677a996d38e75c43870453e27032cd9`, [Chromium CI](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38550401202). Файлы извлечены из фактического CI-артефакта `11887055658`, а не подменены локальными снимками. SHA256 ZIP и CRC всех 56 файлов проверены; [происхождение и хеши](provenance.json).

- [Основная матрица](browser-census.json): 486 состояний, 27 сценариев, 4 433 наблюдаемых текста, RU/EN/KK, ширины 320/360/390/430/768/1280. Пропуски и переполнения — 0; входы и числовые результаты сохраняются.
- [Дополнительная матрица](protocol.json): 54 состояния, стартовая предпочтительная локаль KK, дальнейшее переключение RU/EN/KK. Проверены сохранённые карточки V1, настоящие PDF V1, пользовательские строки, финансовые суммы в одну строку и воспроизведение переполнения на настоящем CSS принятой базы.
- В репозитории сохранены 19 контрольных PNG. Полный CI-артефакт содержит 54 PNG: полные страницы и отдельные виды на 320/390/1280. Доступность временного ZIP — 14 дней; файлы этой папки постоянные.

[Все 10 успешных рабочих CI](ci-implementation.json) относятся к этой реализации. Исторический visual workflow пропущен по конфигурации и не считается успешной визуальной проверкой.

## Контрольные виды · 320 px

| Сценарий | RU | EN | KK |
| --- | --- | --- | --- |
| Самостоятельный V2, кредит, название «Выручка» | [PNG](standalone-name-ru-320-detail.png) | [PNG](standalone-name-en-320-detail.png) | [PNG](standalone-name-kk-320-detail.png) |
| Полная услуга, Cash Flow и защищённое название | [PNG](full-service-name-ru-320-detail.png) | [PNG](full-service-name-en-320-detail.png) | [PNG](full-service-name-kk-320-detail.png) |
| Сохранённая карточка V1 с кавычками и HTML-подобным названием | [PNG](native-v1-name-ru-320-detail.png) | [PNG](native-v1-name-en-320-detail.png) | [PNG](native-v1-name-kk-320-detail.png) |

[Полная страница KK 320 px](full-service-name-kk-320.png) показывает ledger: `108,59`, `686,59` и `1 164,27` помещаются целиком. DOM Range проверяет это автоматически.

## Контрольные виды · 1280 px

| Сценарий | RU | EN | KK |
| --- | --- | --- | --- |
| Самостоятельный V2 | [PNG](standalone-name-ru-1280-detail.png) | [PNG](standalone-name-en-1280-detail.png) | [PNG](standalone-name-kk-1280-detail.png) |
| Полная услуга | [PNG](full-service-name-ru-1280-detail.png) | [PNG](full-service-name-en-1280-detail.png) | [PNG](full-service-name-kk-1280-detail.png) |
| Сохранённая карточка V1 | [PNG](native-v1-name-ru-1280-detail.png) | [PNG](native-v1-name-en-1280-detail.png) | [PNG](native-v1-name-kk-1280-detail.png) |

Кириллица в пользовательских названиях сохраняется намеренно. Все `<b>`, `$&`, `{name}` и кавычки отображаются буквально. Финансовый JSON сравнивается независимо от формата отображения чисел. Сам демонстрационный бизнес пока прежний: его перерасчёт — следующая отдельная задача 5.

[Отчёт](../localization-review.md), [47 терминов](../../localization/nomad360-terminology.md), [согласованные T1–T4](../../localization/terminology-decisions.md). GREEN подтверждает технические проверки; языковая и визуальная пользовательская приёмка L0–L6 ещё не получена. PR #135 остаётся Draft, merge не выполнен.
