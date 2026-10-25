# R1 — preview формы и состояний без рабочих ключей

## Main synchronization · 25 October 2026

Accepted main: `6e3810befffb4f50767d879fd3715cecce2096a7`. Resolve the two conflicts
(task map and SEO paths) by retaining all unrelated accepted main work and adding
only preview-specific paths. Keep the existing automatic distribution-plan merge.
The release policy, preview server/model/copy/styles/application code are identical
to original implementation `45033dbe`; this refresh does not rewrite the other
reviewer's content or activate a public feature. The immutable source test now
uses the accepted C6/C7 baseline and explicitly covers both new C6 modules.

The original R1 limitations below remain: loopback-only fixture preview is not a
working production release/registration service. BUG-09-SCREENSHOT/WL-CICD-01,
complete future terms, no-site issuance policy, real Google/intake and hosting/
SEC-01 require their own implementation/integration and acceptance. Google main
preflight `40236324539` still found no configured owner ADC/WIF input; do not
substitute fixtures for target-runtime authorization.

Current checks/receipt follow after re-execution, separate from original CI.


База: принятый PR #244, merge `c4536e9edd60003efb0a9087ec60915d4c070bdd`.
#244 объединён после 3/3 успешных CI jobs с разрешения владельца. P3 #243 остаётся
отдельным Draft; его код и выдача этим срезом не объединяются и не включаются.

## Что реализовано

- Build-time `release-policy.cjs`: default/явный `legacy`, явный `preview`;
  только `issuanceEnabled: false`. Неизвестные ключи/версии, production и true
  отклоняются. CLI legacy не запускает сервер. Калькулятор не читает этот конфиг.
- Изолированный сервер preview, IPv4 loopback, случайный порт, проверка Host,
  точный список разрешённых ресурсов, отказ POST, noindex/no-store, CSP с
  `connect-src 'none'`/`form-action 'none'`. Исходное дерево нельзя просматривать
  как обычный статический каталог; symlink-ресурсы отклоняются.
- Реальные неизменённые форма/модель/стили P2, но с отдельным memory-only
  transport fixture. Настоящий Formspree transport в preview не загружается.
  Принятый обработчик submit, действующий endpoint и текущие страницы не меняются.
- EN/RU/KK: будущие CTA, пояснение ZIP/JavaScript, инструкция установки,
  состояния заявки, письма подтверждения, истечения, подтверждённой почты,
  подготовки архива, неизвестной и принятой отправки. Во всех языках заметно
  указано: это имитация, письма/заявки не отправляются.
- Сайт и компания необязательны в реальной форме; отдельная карточка preview
  объясняет разницу регистрации и размещения. Реальное требование домена в
  сборщике не снято и не представлено как исправленное.

Preview не сохраняет контакты/платёжные или финансовые данные. В lifecycle-модели
только phase и два булевых признака; поля формы сбрасываются после fixture
acceptance. Неизвестный результат письма не разрешает автоматический новый
build/send. Повтор принятой выдачи и неверный порядок переходов отклоняются.
Языковой переключатель сохраняет состояние и введённые поля.

## Проверка

1. Syntax checks четырёх source modules и browser test.
2. 30 unit/source/financial tests: release gate и отрицательные конфиги;
   пустой company/site; provider acknowledgement вместо ложного успеха;
   истечение/повторы/unknown outcome; whitelist/cookie-free transport;
   localhost Host/POST/CSP; CLI не раскрывает содержимое ошибочного конфига;
   полная матрица ключей EN/RU/KK и только утверждённые четыре цвета;
   неизменность публичных HTML/CSS/JS, Help/лицензии; прежние form/V1/V2 tests.
3. Chromium / Playwright 1.58.0: **18 комбинаций** EN/RU/KK ×
   **320/360/390/430/768/1280**, **54 снимка**, плюс отдельный сценарий с сайтом.
   Проверены обязательное согласие, необязательная публикация профиля, ошибки
   429/422/network, сохранность ввода при повторе и смене языка, expiry/renewal,
   unknown delivery без автоматического повторения, Escape/возврат фокуса,
   отсутствие горизонтального переполнения. Внешних запросов, POST и page errors нет.
4. Побайтная проверка действующих root HTML/CSS/JS и языковых страниц против
   принятой базы #244; источник расчётов/сохранений/экспортов не изменён.
5. SEO scope guard сохраняет финансовые/HTML оракулы; добавлены только точные
   пути новых тестов/workflow и каталог этого отчёта. Diff whitespace и SEO
   generation/source checks выполняются перед публикацией.

Локальные числовые/языковые проверки не означают production-выдачу. CI нового
PR проверяет актуальный HEAD; результат добавляется в PR по завершении.

[Полный protocol](protocol.json) содержит SHA-256 проверенных source files,
версию браузерного инструмента и результаты всех комбинаций. Скриншоты содержат
только закрытую форму/состояния и вымышленные сценарии:

- [RU 320, заявка без сайта](ru-320-application-no-site.png)
- [KK 390, неизвестная отправка](kk-390-delivery-unknown.png)
- [EN 1280, имитация принятого письма](en-1280-delivery-accepted.png)

Эти три снимка осмотрены визуально; полный набор 54 PNG сохраняет CI artifact.
Скриншоты показывают review tool, а не изменённый коммерческий экран сайта.

## Как открыть

```sh
node scripts/partners/release-preview/server.cjs --config scripts/partners/release-preview/config.preview.json
```

Открыть напечатанный loopback URL. Подробности:
[README](../../../scripts/partners/release-preview/README.md). Не размещать сервер
публично; реальные контакты не вводить. Ключи не нужны.

## Что ещё не закрыто

R1 завершён только в части review tool/состояний и fail-closed конфигурации.
Публичное применение release mode, автоматическая регистрация/выдача без сайта,
приём последующего URL/проверка бренда и полная будущая политика/лицензия — не
реализованы этим PR. KK требует языковой приёмки. Сроки хранения и production
intake/runtime остаются отдельными решениями. Реальные почта/архив/Google
credentials и проверка получателя — R5, одновременное включение с условиями — R6.

Действующие условия, скачивание HTML, PDF/Excel, математика V1/V2, черновики,
Formspree endpoint, DNS/Pages и видимость репозиториев сохранены. Preview
переходы не являются механизмом авторизации production и не закрывают P3.
