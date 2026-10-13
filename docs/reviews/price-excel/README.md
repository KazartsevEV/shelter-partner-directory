# Excel V2 · доказательства PR #134

Источник: [успешный Excel CI](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/38454618035), код `a889cb4b2f05fee8290d3fe1d1a7cfb5e4111d00`, 13 октября 2026 года. Публикация доказательств не меняет исполняемый код. [Отчёт](../price-excel-review.md).

[protocol.json](protocol.json) содержит 36 сценариев, валюты, исходные рассчитанные цены, имена листов и подтверждение отсутствия запросов при экспорте. В CI проверены 72 скачивания до/после восстановления. Сохранённые здесь `.xlsx` — шесть первоначальных контрольных файлов; все 72 доступны в артефакте CI (14 дней).

| Язык | Связанный V2 · KZT | Самостоятельный V2 · USD |
| --- | --- | --- |
| RU | [XLSX](320-ru-linked.xlsx) · [320 px](320-ru-linked.png) | [XLSX](320-ru-standalone.xlsx) · [320 px](320-ru-standalone.png) |
| EN | [XLSX](320-en-linked.xlsx) · [320 px](320-en-linked.png) | [XLSX](320-en-standalone.xlsx) · [320 px](320-en-standalone.png) |
| KK | [XLSX](320-kk-linked.xlsx) · [320 px](320-kk-linked.png) | [XLSX](320-kk-standalone.xlsx) · [320 px](320-kk-standalone.png) |

Всего 36 исходных PNG: `{320,360,390,430,768,1280}-{ru,en,kk}-{linked,standalone}.png`. На узких экранах таблица прокручивается внутри блока. Проверяются оба интерфейса, состояния загрузки, сохранение и восстановление, исходный применённый CNY→USD платёж, языковая числовая инвариантность, PDF и буквальные названия с `=`, `+`, `-`, `@`.

Фактически открытые и пересохранённые LibreOffice Calc: [RU linked](calc/320-ru-linked.xlsx), [EN standalone](calc/320-en-standalone.xlsx), [KK linked](calc/320-kk-linked.xlsx). После пересохранения независимо проверены числа, пустые ячейки, строки, отсутствие формул/внешних связей.

Это синтетические тестовые данные, не рыночные цены и не модель пользователя. Microsoft Excel desktop в среде недоступен; проверка OOXML и реальное открытие в LibreOffice не заявляются как ручная проверка Microsoft Excel.
