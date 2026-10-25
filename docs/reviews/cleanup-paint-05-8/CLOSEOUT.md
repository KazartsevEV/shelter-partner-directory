# C5: финальная сверка после принятия #267

Дата: 25 октября 2026. Проверенная база `main`: `72221d11ac4e1e1af41c6c35df5f186c8e7ac518`.

Владелец разрешил объединить #267 после предъявления результата CI с открытой оговоркой #260. Merge выполнен стандартным GitHub endpoint с проверкой HEAD `541c571b`; защиты ветки не обходились. [Pages deployment](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/40163259588) завершился успешно. Новая правка — только Markdown: код, CSS, формулы, черновики, ресурсы, workflows и контракты тестов остаются прежними.

## Итог C5

Повторно выполнена команда `node scripts/cleanup-paint/ownership.cjs artifacts/c5-closeout/ownership.json` по фактическим исходникам принятого main. Результат побайтово совпал с [принятым реестром](ownership.json); исторические нормализующие адаптеры для этого сырого census не использовались.

- Исходный C5: 224 группы; итог: 31; устранено за весь C5: 193.
- Финальный пакет #267: 100 → 31, устранено 69; непроверенных групп: 0.
- 31 сохранённая группа: 19 владельцев независимых семейств страниц, 2 независимых body-default, 1 fallback `100vw` / `100cqw`, 9 общих defaults с доказанным использованием у соседних селекторов.
- Производственные CSS-файлы уже сокращены на 6114 B в #267; этот документ не приписывает дополнительную экономию.

SHA-256 итогового реестра: `1f4bf9714902789b96b2b4541ac115da4fcb0f127e1ac5a761089885479af1bf`.

## Перекрытые предложения

| Draft | Предыдущий объём | Покрытие принятым #267 |
| --- | --- | --- |
| #261 | Две декларации UI | Обе входят в точные принятые удаления |
| #262 | Шесть деклараций/селекторов IRBIS | Все входят в точные принятые удаления |
| #264 | 27 групп старого census | 24 устранено; 3 намеренно сохранено |
| #265 | 35 групп старого census | 26 устранено; 9 намеренно сохранено |
| #266 | 11 групп старого census | 11 устранено; 0 намеренно сохранено |

Для #261/#262 сравнивались мультимножества `(context, selector, property, important, value)` до/после предложения: новых деклараций нет; каждое удаление входит в frozen proof #267. Для #264–266 все ключи проверены как непересекающиеся подмножества исходного census из 100 групп и сопоставлены с итоговыми 31. Это 73 ранее неразобранные группы: 61 устранена, 12 сохранены. Остальные восемь снятых групп покрыты #261/#262. Черновики закрываются как заменённые, их ветки и история сохраняются; они не считаются отдельно объединёнными PR.

## Реестр 31 сохранённой группы

Полные исходные адреса, условия, значения, владельцы и sibling witnesses остаются в [ownership.json](ownership.json). Ниже — стабильные ключи для сверки; существование такой группы само по себе не ошибка.

| ID | Selector | Property | Причина |
| --- | --- | --- | --- |
| `f80717fe0321` | `body` | `color` | independent-page-and-fallback-resources |
| `93289bd4e0fd` | `.card` | `border-radius` | accepted-page-ownership |
| `08e2269f6d63` | `.card` | `border` | accepted-page-ownership |
| `525bc7cf1e61` | `a:focus-visible` | `outline` | accepted-page-ownership |
| `b9adca011fc5` | `a:focus-visible` | `outline-offset` | accepted-page-ownership |
| `99a06bcd9af1` | `summary:focus-visible` | `outline` | accepted-page-ownership |
| `c483d8bd84cd` | `summary:focus-visible` | `outline-offset` | accepted-page-ownership |
| `eabff55657ce` | `.help-lang span` | `color` | accepted-page-ownership |
| `8f16af0da67f` | `.help-lang span` | `background` | accepted-page-ownership |
| `d9bbfd564a33` | `body` | `background` | independent-page-and-fallback-resources |
| `7f51520f95b7` | `a` | `color` | accepted-page-ownership |
| `32e13870b2b5` | `a` | `text-underline-offset` | accepted-page-ownership |
| `aabb68221099` | `.brand` | `display` | accepted-page-ownership |
| `0a4bcf3578e8` | `.brand` | `font-size` | accepted-page-ownership |
| `80da41866d04` | `.brand` | `font-weight` | accepted-page-ownership |
| `f74462e9c9d5` | `.brand img` | `border-radius` | accepted-page-ownership |
| `beb6f003d878` | `.intro` | `background` | accepted-page-ownership |
| `b3b78de07bd9` | `.intro` | `border-radius` | accepted-page-ownership |
| `6d515ab079b1` | `.intro` | `padding` | accepted-page-ownership |
| `ce7b46212bdc` | `.eyebrow` | `font-weight` | accepted-page-ownership |
| `7a3ecdfb4eaa` | `.intro p` | `max-width` | accepted-page-ownership |
| `e092f99f3fc9` | `body:has(#home-screen) #nomad360-footer #nomad360-embed` | `width` | inline-feature-fallback |
| `f2d8c712e74d` | `body .nd-currency-settings select` | `color` | shared-default-with-scoped-override |
| `f780b156c1dc` | `body #nomad360-home-secondary .nomad-example-copy p` | `color` | shared-default-with-scoped-override |
| `3c5f1eba0683` | `body #nomad360-hero h1` | `color` | shared-default-with-scoped-override |
| `dc4152c4298b` | `body #full-service-screen .nd-full-service-header` | `margin` | shared-default-with-scoped-override |
| `48815621cd67` | `body #full-service-screen h1` | `margin` | shared-default-with-scoped-override |
| `74038af9eae6` | `body #full-service-screen .nd-full-service-forecast-note` | `margin` | shared-default-with-scoped-override |
| `49d41e759957` | `body #full-service-screen .nd-full-service-credit p` | `margin` | shared-default-with-scoped-override |
| `6f84d5501a4f` | `body:has(#home-screen) #nomad360-home-secondary .nomad-example-copy p` | `color` | shared-default-with-scoped-override |
| `55b7530cd379` | `body:has(#home-screen) #nomad360-hero h1` | `color` | shared-default-with-scoped-override |

## Проверки и открытые ограничения

#267: [успешный C5 CI](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/40136065263), 128 core tests / 48 VAT / 126 calculator pairs / 1080 route-state comparisons / 66 static pairs / 76 identical PNG pairs. Локально также прошли 23 дополнительных теста. Полные данные и выбранные before/after снимки находятся в [отчёте #267](REVIEW.md).

Общий CI при merge #267 не был полностью зелёным: 35 success, 1 failure, 1 historical visual skip. [Browser-audit failure](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/40136065432) в исходном `file://`-сценарии совпадает с ранее зарегистрированным [#260](https://github.com/KazartsevEV/shelter-partner-directory/issues/260); причинность не установлена. Однократный исходный локальный тест на main и кандидате прошёл в обеих версиях; это не исправляет CI-падение. Ретраев ради GREEN, исключения тестов, увеличения таймаутов или перезаписи черновиков для обхода ошибки не было. #259 остаётся диагностическим Draft; #260 не закрывается.

Для этой Markdown-сверки повторно проверяются фактический ledger, точный кандидат CSS, детерминированная палитра, source boundaries и ссылки. Новые тесты, повторяющие документ, не добавляются. Результат CI самой сверки отражается в checks её PR; пользовательская приёмка и merge нового PR — отдельно.

## Граница следующего этапа

Непроверенных CSS-групп C5 нет. Следующий срез по действующей очереди — C6, отделение бизнес-операций и UI в HTML с сохранением формул и совместимых адаптеров. C7, исправление #260 и партнёрские R1–R6 остаются самостоятельными работами. В этом PR они не начаты.
