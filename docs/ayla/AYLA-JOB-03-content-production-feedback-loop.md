# AYLA-JOB-03 — Content Operations: от аналитического сигнала до публикации, комментариев и обучения

> **Статус:** технический проект на согласование; НЕ утверждён и НЕ означает реализованную функцию.  
> **Дата:** 21 октября 2026.  
> **Продукт:** Ayla / Nomad360 Business Solutions.  
> **Область:** только действующий Nomad360 Calculator V1/V2 и собственная узнаваемость Ayla внутри Nomad360.  
> **Тип:** детальный функциональный контракт Content Operations & Feedback Loop.  
> **Зависимости:** утверждённый [AYLA-CORE-01](AYLA-CORE-01-persona-life-engine.md); проекты [AYLA-JOB-01](AYLA-JOB-01-marketing-operations.md) и [AYLA-JOB-02](AYLA-JOB-02-functional-specification.md).  
> **Приоритет:** при противоречии с JOB-02 о выпуске материалов и анализе комментариев эта спецификация конкретизирует пайплайн, но не отменяет ограничения безопасности, разрешения, политику внешней записи и жизненный канон AYLA-CORE-01.
>
> **Определение успеха:** не количество выданных сценариев или постов, а проверяемое превращение источников и гипотез в качественные готовые материалы, допустимые публикации, обработанные реакции и обоснованный следующий цикл.

**Аудитория и ценности персонажа:** [AYLA-PERSONA-02 — Audience Values & Aspirational Life Architecture](AYLA-PERSONA-02-audience-aspirational-life.md) (проект на согласование). Этот документ определяет редакционные гипотезы о ценностях и достижимой жизни Ayla; ContentBrief учитывает их, но не переписывает канон по краткосрочным реакциям.

## 0. Целевой end-to-end процесс

**Публичные/внутренние источники → Evidence → аналитический вывод → Opportunity → гипотеза → формальное ContentBrief (ТЗ) → креативная разработка → готовые медиа → QA → платформенная адаптация → разрешение → очередь → подтверждённая публикация → метрики + комментарии → содержательный анализ → обучение/новые гипотезы.**

### 0.1. Обязательное разделение ответственности

- **Intelligence (AI):** извлекает темы, формулирует интерпретации, уточняет сегмент, гипотезу, оригинальный угол и ContentBrief.
- **Persona & Life Engine (AI + state):** отвечает за канон Ayla, согласование времени/места/отношений; жизненные сюжеты не превращаются автоматически в рекламу.
- **Creative Director (AI):** предлагает идею, хук, сценарий и раскадровку.
- **Production (providers + RT):** генерирует/собирает финальные файлы, выполняет монтаж/титры/звук и создаёт проверяемый manifest.
- **QA (deterministic + AI):** проверяет формат, факты, историю, идентичность и законность использования медиа.
- **Distribution (RT):** проверяет права, квоты, разрешение и отправляет точно утверждённую версию.
- **Engagement (RT + AI):** собирает реакции и комментарии, классифицирует, предлагает или отправляет разрешённые ответы.
- **Measurement/Learning (RT + AI):** хранит измерения, формирует решения с evidence lineage, закрывает цикл.

Все операции привязаны к одному ProjectID, исходной гипотезе, persona_version, платформе, версии артефакта и записи аудита. Никакой компонент не может самовольно включить внешний write.

### 0.2. Инварианты

- CO-INV-01: ни одна публикация не возникает без ContentBrief и опубликованного exact-version PublicationPackage.
- CO-INV-02: у каждого решения о теме есть хотя бы один тип источника: verified public data, product facts, LifeEvent, explicit owner editorial input или помеченная cold-start hypothesis. Отсутствующий evidence не выдумывать.
- CO-INV-03: «релевантность» определяется связью с интересами аудитории и/или цельной жизнью Ayla; отсутствие CTA Nomad360 допустимо.
- CO-INV-04: бизнес-калькулятор — пока единственный готовый продукт. Никаких фиктивных кейсов, регистраций, партнёров, результатов продаж или доступной коммерческой Ayla.
- CO-INV-05: real-world facts ↔ fictional Ayla life events хранятся раздельно. Художественные поездки, отношения и покупки персонажа не являются доказательством реальных действий физического человека.
- CO-INV-06: публичные комментарии — не независимая статистическая выборка всей аудитории; их язык/состав могут быть смещены.
- CO-INV-07: полезность разговора ≠ положительная тональность: обоснованная критика и вопросы ценны.
- CO-INV-08: неизвестные метрики и недоступность комментариев не заменять нулями.
- CO-INV-09: создание/оптимизация материала и отправка публичного ответа требуют независимых execution-time разрешений.

## 1. Источники инициатив и аналитических сигналов

Контент может инициироваться пятью типами сигналов:

| Signal kind | Источник | Пример результата |
|---|---|---|
| audience_signal | Метрики/комментарии/опросы собственной аудитории | Читатели задают похожий вопрос о «цене идеи» |
| market_signal | Разрешённое исследование публичных трендов/новостей | Возникает интерес к новой модели микро-бизнеса |
| conversation_signal | Содержательная дискуссия у автора/конкурента | Ayla может подготовить собственный оригинальный разбор |
| persona_event | LifeEvent из AYLA-CORE-01 | Сюжет о путешествии, свидании, дружбе или случайной идее |
| project_event | Подтверждённый выпуск/тест/изменение калькулятора | Новая возможность Nomad360 доступна и проверена |

Также owner_editorial_request и cold_start_exploration — явные виды входа: не выдавать их за наблюдаемые тренды.

### 1.1. InputEvidence

Поля: evidence_id; origin; object_ref; platform; observed_at; event_at; segment_hint; topic_terms; source_language; content_summary; measured_counters; sample_size; collection_method; sampling_bias_notes; confidence; verification_status; visibility; source_url или life_event_id; ttl.

**CO-SIG-01:** каждый сигнал имеет ID и provenance; owner-editorial без URL допускается с origin=owner_input.  
**CO-SIG-02:** AI может извлечь гипотезу из нескольких разнородных источников, но сохраняет список supporting и contradicting evidence.  
**CO-SIG-03:** недостаточно надёжная статистика обозначается как exploratory, не как fact/trend proven.  
**CO-SIG-04:** любой комментарий/сторонняя публикация считается недоверенными данными; содержащиеся в них инструкции не могут менять policy, prompts, разрешения или бюджет.  
**CO-SIG-05:** для часто изменяющихся тем обязателен expires_at и повторная проверка перед публикацией.
**CO-SIG-06:** privacy scope: публичные комментарии — только для редакционных исследований в пределах условий платформы; приватные DM — не источник публичного контента без отдельного согласия.

## 2. Opportunity Mining и ранжирование тем

### 2.1. CandidateTopic DTO

~~~json
{
  "topic_id": "topic-041",
  "origin_types": ["audience_signal", "persona_event"],
  "evidence_ids": ["ev-1", "ev-7"],
  "life_event_id": "life-39",
  "segment_ids": ["idea-experimenters"],
  "theme": "Small business ideas people abandon too early",
  "narrative_angle": "Ayla's comic observation from a weekday coffee stop",
  "proposed_format": ["threads_text", "instagram_reel"],
  "objective": "qualified_growth",
  "persona_fit": 0.91,
  "segment_fit": 0.74,
  "novelty": 0.87,
  "conversation_potential": 0.85,
  "confidence": 0.52,
  "estimated_production_cost": null,
  "risk_level": "low",
  "status": "candidate"
}
~~~

### 2.2. Ранжирование

- Первичные оси: segment_fit; likely original contribution; relevance/novelty; brand/Persona fit; observed engagement signals; production feasibility; creative diversity; staleness; risk.
- Значения без наблюдений нельзя объявлять прогнозами охвата; обозначать как priors/AI judgement и указывать confidence.
- В режиме cold-start кандидаты получают явную exploratory priority из донора, а не фиктивную вероятность вирусности.
- Для разных платформ тематический потенциал оценивается отдельно; Threads-удача не доказывает успех Instagram.
- Не пересчитывать исходную формулу QualifiedGrowthPolicy; модуль Opportunity формирует кандидатов и сигналы, а не заменяет planner произвольной формулой.
- Ограничивать повторы темы, визуальных приёмов и призывов. Не вводить обязательный рекламный quota для LifeNarrative.

**CO-TOP-01:** результат отбора — ranked candidate list с пояснением и проверяемыми источниками.  
**CO-TOP-02:** владелец видит причину включения и отклонения каждого значимого кандидата.  
**CO-TOP-03:** изменение приоритетов логируется с algorithm_version.
**CO-TOP-04:** если нет исследований, Ayla может производить добросовестные cold-start эксперименты, но помечает их в данных.
**CO-TOP-05:** регулярные жизненные истории Ayla могут становиться кандидатами без коммерческого сообщения или связи с расчётами.

## 3. Content Brief Generator — формальная постановка производственного ТЗ

### 3.1. Обязательные поля ContentBrief

~~~json
{
  "schema_version": 1,
  "brief_id": "brief-041",
  "brief_version": 1,
  "project_id": "nomad360",
  "owner_actor": "ayla",
  "created_from": {
    "topic_id": "topic-041",
    "evidence_ids": ["ev-1", "ev-7"],
    "life_event_id": "life-39"
  },
  "content_mode": "life_narrative",
  "target_segment_ids": ["idea-experimenters"],
  "platform_targets": ["threads", "instagram"],
  "primary_objective": "qualified_growth",
  "hypothesis_id": "hyp-21",
  "primary_metric": "relevant_follow_signal",
  "expected_audience_reaction": "recognition_and_discussion",
  "main_message": "A surprising small idea can be worth testing",
  "creative_angle": "observational humor",
  "hook_candidates": [
    "Most business ideas fail in the notes app."
  ],
  "narrative_constraints": {
    "persona_version": 2,
    "chronology_checked": false,
    "fact_mode": "fictional_life",
    "commercial_cta_required": false
  },
  "assets_requested": [
    {"platform": "threads", "format": "text"},
    {"platform": "instagram", "format": "reel"}
  ],
  "language": "en-US",
  "tone": "Ayla persona contract",
  "source_references": ["ev-1"],
  "platform_adaptations_required": true,
  "experiment_id": null,
  "budget_cap": null,
  "publication_window": null,
  "qa_criteria_ids": ["persona", "originality", "fact_mode", "platform"],
  "approval_mode": "per_brief",
  "status": "draft"
}
~~~

Это **пример структуры**, не реальное наблюдение или утверждённый контент для публикации.

### 3.2. Нормативные требования к брифу

**CO-BR-01:** каждый бриф содержит content_mode, цель/целевой сегмент, hypothesis, primary_metric, source_lineage, основной смысл, hook/angle, format target, language, PersonaVersion, fact_mode, обязательный QA и разрешение.  
**CO-BR-02:** если материал предлагает продуктовый факт, product_facts_version и конкретный источник обязательны.  
**CO-BR-03:** если материал описывает событие из жизни Ayla, life_event_id обязателен; время, персонажи, локация и внешность должны пройти CORE-проверку.  
**CO-BR-04:** story/life_narrative не получает автоматически ссылку на калькулятор или рекламный CTA.  
**CO-BR-05:** бриф фиксирует гипотезу, но не должен заранее утверждать измеренный результат.  
**CO-BR-06:** формат/площадка выбираются из действующей PlatformCapability matrix. Если выпуск возможен, но автоматическая публикация нет — отдельные статусы generate_ready и publish_manual_only.  
**CO-BR-07:** бриф хранит версии и автора решения; изменение смысла или метрики создаёт новую версию, а не подменяет исторический оригинал.  
**CO-BR-08:** у одной идеи может быть много platform variants, но они имеют общий concept_id и отдельные versions/measurements.
**CO-BR-09:** текст из аудитории может вдохновлять, но не должен переноситься дословно как пользовательская частная история без согласия/законного основания.

### 3.3. Заполняемые секции реального производственного ТЗ

Ayla должна уметь из ContentBrief выводить производственный ProductionSheet, пригодный к исполнению без ручного додумывания:

1. **Audience/JTBD:** кого цепляет, какая ситуация узнаваема, что читатель почувствует.
2. **Creative thesis:** одна конкретная мысль, тон/эмоция, зачем люди захотят досмотреть/ответить.
3. **Hook:** варианты opening line/first frame; цель удержания внимания.
4. **Narrative arc:** последовательность сцен или тезисов, момент напряжения/юмора/развязки.
5. **Script/Copy:** точный текст, отдельные on-screen captions, soundtrack/VO (если нужен).
6. **Visual references:** как выглядит Ayla, какие интерьеры/места/предметы и какой PersonaVersion применяется.
7. **Assets/rights:** из каких источников кадры, музыка, voice и изображения; разрешения и provenance.
8. **Platform constraints:** тип аккаунта, supported format, актуальные размеры/лимиты, safe areas, captions, interactive features.
9. **CTA policy:** no CTA / soft brand / project URL / community invite по смыслу и ограничениям площадки.
10. **QA requirements:** factual, visual, persona, brand, copyright, originality, disclosure, platform.
11. **Publish metadata:** target account, locale, scheduled window, hashtags/link strategy, approval scope.
12. **Measurement design:** primary metric, secondary signals, observation windows, expected discussion themes, experiment reference.
13. **Budget + fallback:** максимум допустимой стоимости и маршрут, если генерация видео или публикация не поддерживаются.

**CO-BR-10:** ProductionSheet имеет собственный version ID, cannot silently diverge from approved Brief.  
**CO-BR-11:** невозможность заполнить обязательный слот формирует needs_input или blocked, а не придумывание источника, возможностей провайдера или визуальной идентичности.
**CO-BR-12:** только факт подтверждённого продукта/релиза допускает «у Nomad360 появилась функция X».

## 4. Поддерживаемые типы контента

Два независимых классификатора: **смысловой тип** и **физический/платформенный формат**.

### 4.1. Смысловые ContentMode

| Mode | Источник | Содержание | Контракт |
|---|---|---|---|
| life_narrative | LifeEvent | Личная жизнь, отношения, путешествия, друзья, повседневность Ayla | Консистентность канона, **без обязательной рекламы** |
| life_reaction | Мир + Persona | Что Ayla думает о происходящем | Разделять личную точку зрения и объективный факт |
| audience_conversation | Комментарии/исследование | Интересный вопрос/спор/юмор/наблюдение | Оригинальность, прямой смысл для аудитории |
| entrepreneurial_idea | Исследования/история | Нестандартные бизнес-идеи и их экономическая логика | Не обещать спрос и прибыль |
| product_explainer | Верифицированные функции | Короткое объяснение реальной возможности калькулятора | ProductFacts + локализация |
| product_update | Подтверждённый релиз | Новая функция, тест, исправление | PR/release evidence, дата |
| community_co_creation | Telegram/обратная связь | Опросы, тестирование, предложенные изменения | Не обещать реализацию |
| build_in_public | Подтверждённый ход разработки | Профессиональная история Nomad360 | Не придумывать достижения |
| trend_commentary | Актуальные публичные источники | Оригинальный взгляд на новость | Источник и проверка свежести |

### 4.2. Форматы MediaFormat

text_short, text_long, image_single, image_series, image_carousel, video_short_vertical, video_feed, story_single, story_sequence, story_interactive_package, telegram_poll, linkedin_document, mixed_media.

**CO-TYPE-01:** MediaFormat и ContentMode не привязаны однозначно: личная история может быть текстом Threads, Reel или Story.  
**CO-TYPE-02:** каждая целевая площадка получает собственный VariantSpec с captions, crop, render, cover, metadata, text length, aspect ratio и platform QA.  
**CO-TYPE-03:** Story interactive package — медиа и инструкция/метаданные; нельзя считать автоматически опубликованными interactive stickers, если API не разрешает.  
**CO-TYPE-04:** LinkedIn organic multi-image/document разрешать только по действующему API, не выдавать paid Carousel ads за organic carousel.  
**CO-TYPE-05:** правила платформы (размеры/лимиты/кодеки) — внешняя версионированная capability config, не закодированная навсегда в промпте.

## 5. Слой сценариев и копирайтинга

### 5.1. TextScript DTO

Поля: script_id, brief_id/version, candidate_hook_ids, selected_hook_id, scene_or_paragraph_units[], exact_voiceover_text, exact_on_screen_text[], description/caption, alt_text, hashtags[], links[], content_mode, language, evidence_ids, persona_version, fact_mode, revision, QA state.

**CO-TXT-01:** для каждого материала можно отдельно редактировать хук, основное содержание, концовку и описание без полной потери lineage.  
**CO-TXT-02:** если пользователь попросил креатив без продаж, отсутствие CTA не считается ошибкой.  
**CO-TXT-03:** копирайтинг соответствует характеру Ayla, а не шаблонному корпоративному голосу.
**CO-TXT-04:** английский текст — естественный American English по AYLA-CORE-01; адаптация других языков — отдельная locale QA, не автоматическое предположение об идентичности культурных реакций.
**CO-TXT-05:** цитаты и чужие истории обрабатываются с указанием источника, без плагиата и скрытого переноса персональных данных.

## 6. Reel/Video Production Contract

### 6.1. VideoShotPlan

Поля: scene_id, order, duration_target_range, source_kind (generated_still/generated_video/owner_supplied/licensed_stock), image_or_video_prompt, persona_face_ref, environment_ref, exact_voiceover_segment, overlay_text, transition, sound_cue, crop_focus, source_evidence_refs.

### 6.2. Этапы

Brief → Script → ShotPlan → Source acquisition/generation → source QA → timeline assembly → voice/audio → captions/titles → deterministic render → inspect output → platform encode → MediaPackage.

**CO-VID-01:** финальный output — реальный локализуемый asset_ref видеофайла; текст сценария сам по себе не выполненное производство.  
**CO-VID-02:** постоянство лица/возраста/голоса/помещений/времени/одежды относительно LifeEvent и PersonaVersion.  
**CO-VID-03:** если реальный ролик использует чьи-то исходные видео, источник и разрешения сохраняются, включая отдельно доказанную музыку/саундтрек.  
**CO-VID-04:** для говорящих фрагментов Voice → lip-sync проверяется отдельно; несогласованность движения/голоса QA FAIL.  
**CO-VID-05:** spoken-source video → transcript/timecoded segments до монтажа, завершённые смысловые фразы; generated B-roll и немые сцены — отдельные требования.
**CO-VID-06:** для финального файла сохранять media duration, dimensions, frame_rate, codec, audio tracks, subtitles refs, thumbnail, sha256 и source manifest.  
**CO-VID-07:** если визуальное изображение Ayla отличается от канона, repair/re-render по ограниченному budget/attempt policy, затем blocked для ручного решения, а не бесконечные платные пробы.  
**CO-VID-08:** platform safe area проверяется на финальном рендере, а не только на макете.  
**CO-VID-09:** у готового видео есть описание + обложка + разрешённый package. Отсутствие обязательного элемента — incomplete.  
**CO-VID-10:** отсутствие готовой говорящей модели не запрещает создание полноценного Reel из B-roll, надписей и звука.

## 7. Stories, Carousels и static images

### 7.1. StorySequence

Поля: story_id; brief_id; cards[] (order, media_ref, overlay_text, interactive_intent, visual_safe_zone); narrative_start/end; platform; publishing_capability; action_if_manual.

**CO-ST-01:** Story sequence — логически связанный набор экранов. Тексты отдельными редактируемыми слоями до финального рендера.  
**CO-ST-02:** если Stories poll/question/link stickers не поддержаны соответствующим API, не имитировать их «написанной на картинке кнопкой» как рабочий элемент; сформировать manual_install_instruction.  
**CO-ST-03:** реальные interactive poll results собираются только при доступности источника и разрешённых правах.

### 7.2. CarouselSequence

Поля: carousel_id; brief_id; slides[] (order, headline, copy, media_ref, composition_template, typography tokens, source evidence); cover; closing_slide; export_manifest; platform_adaptations.

**CO-CAR-01:** финальный результат — отдельные полноразмерные слайды, упорядоченный manifest; не один коллаж, если платформа требует отдельные файлы.  
**CO-CAR-02:** дизайн/перенос текста и crop адаптируются к месту публикации; не использовать карусель ради количества слайдов.
**CO-CAR-03:** связанные карточки сохраняют визуальную непрерывность Ayla и читаемость при мобильном просмотре.
**CO-CAR-04:** Instagram feed carousel и Threads carousel требуют самостоятельных проверок адаптера; существующий Threads publisher донора сейчас бросает ошибку NotImplementedError для ContentFormat.CAROUSEL.  
**CO-CAR-05:** LinkedIn органическая multi-image публикация или документ — отдельные допустимые формы, не эквивалент рекламного Carousel.

## 8. MediaArtifact, VariantSpec и QA

### 8.1. MediaArtifact

~~~json
{
  "artifact_id": "asset-041",
  "brief_id": "brief-041",
  "script_version": 2,
  "persona_version": 2,
  "life_event_id": "life-39",
  "media_format": "video_short_vertical",
  "storage_ref": "content-addressed-ref",
  "sha256": "hex",
  "duration_ms": 18000,
  "dimensions": {"w": 1080, "h": 1920},
  "audio_ref": "audio-011",
  "subtitle_ref": "subs-011",
  "cover_ref": "cover-041",
  "rights_status": "verified",
  "provenance_manifest_ref": "manifest-041",
  "qa_evidence_refs": ["qa-014"],
  "status": "rendered"
}
~~~

Числа и ID — пример DTO, не навязанная текущая настройка платформ.

### 8.2. VariantSpec

Поля: variant_id; concept_id; platform; target_account_id; format; source_asset_ids; transformed_asset_ids; final_copy_ref; locale; caption; alt_text; target_aspect; compression_profile_version; platform_limits_version; schedule_window; CTA policy; QA status; approval scope; created_at.

**CO-MED-01:** финальный VariantSpec сохраняет точный список asset hashes; новые edits создают version+1 и требуют повторного QA/approval.  
**CO-MED-02:** quality gates (factual, Persona, rights, visual, speech, duplicate, platform) фиксируют pass/fail/evidence; AI не может объявить отсутствующий файл «проверенным».  
**CO-MED-03:** copyright/license clearance для реальных медиа и музыки обязателен до публикации.  
**CO-MED-04:** визуальные материалы life_narrative маркируются по правилам платформы, не вставляя постоянное «I am an AI» в каждый текст, если этого не требуется.
**CO-MED-05:** итог статуса READY_TO_PUBLISH только при наличии финального файла/финального текста для конкретной платформы и действующих разрешений.
**CO-MED-06:** publish_adapter не сам подбирает другой формат, если исходный approved format недоступен: новый VariantSpec+review.

## 9. Адаптация и публикация по площадкам

### 9.1. Форматная матрица (цель, не признак готовности)

| Канал | Входной VariantSpec | Целевое представление | Comments read / insights |
|---|---|---|---|
| Threads | text_short; image_single; video_short; carousel только после реализации | Самостоятельные ветки/ответы, возможные вложения | Собственные replies/thread replies, post-level insights; проверять права |
| Instagram | video_short_vertical; story_sequence; image_carousel; image_single | Reels / Stories / feed carousel / post | Media comments, media/account insights при professional API |
| Facebook | text/image/video/story where supported | Страница Nomad360, Reels и feed; индивидуальная проверка capabilities | Page comments, page/post insights |
| Telegram | text/image/video/storyboard package/telegram_poll | Публичный канал и опросы; отдельная discussion group | Бот видит только разрешённые updates/feedback |
| LinkedIn | text/image/video/linkedin_document/multi-image | Официальная страница Nomad360; профессиональные истории | Comments и analytics только по granted scopes |

- Instagram использует подходящий профессиональный тип аккаунта и отдельные разрешения на publish, comments/insights. Stories не считать поддержанными по факту успешного feed-post.
- Threads carousel в текущем доноре не реализована: доказательство — путь ai-content-marketer/src/ai_content_marketer/publishers/threads.py, ветка ContentFormat.CAROUSEL с NotImplementedError.
- Telegram Bot API поддерживает отправку сообщений, изображений/видео и polls при соответствующих правах; **из этого не следует автоматическая видимость любых пользовательских комментариев вне доступного боту чата**.
- LinkedIn Posts API поддерживает organic text/images/videos/documents/MultiImage; paid Carousel является отдельным рекламным форматом.
- Точные лимиты и размеры — версионируемая матрица PlatformCapabilities из AYLA-JOB-02, обновляемая по официальному API и реальным тестам.

### 9.2. PublicationPackage

Поля: publication_id, approved_brief_id/version, concept_id, variant_id/version, platform, account_id, approved_copy_sha256, asset_sha256[], QA hashes, owner_policy_scope, scheduled_at UTC, expiry_at, idempotency_key, optional experiment_id, PersonaVersion.

Publish state:
draft → variant_ready → qa_passed → awaiting_approval → approved → scheduled → leased → submitting → published(remote_post_id).

Ошибка: blocked_capability/blocked_permission/blocked_quota/expired/retry_wait/unknown_remote_result/failed/quarantined/cancelled.

**CO-PUB-01:** разные варианты одного concept_id могут публиковаться в разных сетях, но ведутся как **разные publication_id**.  
**CO-PUB-02:** successful publish только после подтверждения platform remote ID/URN/message_id, точного текста/медиа и времени.
**CO-PUB-03:** publish timeout → reconcile/unknown_remote_result; не повторять слепо и не дублировать.  
**CO-PUB-04:** после ручной публикации manual_only владелец может привязать подтверждённый URL/remote_id как manual_verified; нельзя объявлять автоматическим успешным publish.  
**CO-PUB-05:** все публикации связаны с brief/hypothesis/variant и будущими комментариями/метриками.
**CO-PUB-06:** ночные/временные предпочтения Ayla и целевой аудитории — отдельные timezone-aware ограничения; scheduled_at сохранять в UTC.
**CO-PUB-07:** если пользовательская правка меняет approved content, отменить старый permit и потребовать новый QA/version.

### 9.3. Расписание и распределение

Threads — начальная **цель 10–12 самостоятельных оригинальных веток ежедневно**, replies собственные и внешние — отдельные очереди/счётчики. Частоты Instagram, Facebook, LinkedIn, Telegram подлежат утверждению по ресурсам и наблюдениям; не выдумывать ежедневный минимум.

**CO-PUB-08:** система проверяет перегрузку одной темы/сегмента/аккаунта и не публикует дубль ради выполнения quota.  
**CO-PUB-09:** модель может выбрать другое время на основе verified evidence; недоступный account-level insights не выдавать за доказательство «идеального времени».
**CO-PUB-10:** каждое превышение бюджета/квот блокирует job и сообщает причину владельцу.

## 10. Post-Release Tracking: аналитика, комментарии и таймлайны

### 10.1. Точки измерений

После confirmed publish создать независимые задачи: +1h, +24h, +7d по контракту донора; дополнительный +30d — конфигурируемое расширение. Реальные условия платформ могут требовать задержку/backoff. Все окна сохранять без перезаписи и timestamp склейки.

**CO-TRK-01:** каждая точка имеет status queued/collected/partial/unavailable/failed, observed_at, raw source, metric definitions и значения.  
**CO-TRK-02:** собирать **post-level insights** отдельно от **account-level**; не пытаться причинно приписать все новые подписки одному посту.  
**CO-TRK-03:** edited/deleted/archived posts связывать с revision events и корректными временными окнами.
**CO-TRK-04:** комментарии собираются параллельно с числовыми insights и не требуют наличия метрик для обработки.

### 10.2. CommentCollectionJob

Поля: post_remote_id, account_id, platform, cursor, since_watermark, last_polled_at, webhook_event_ids, collection_window, next_run_at, provider_capabilities, privacy_class.

Использовать webhook, если разрешён и надёжно доступен, плюс reconciliation poll при необходимости. Сохранять cursor, обрабатывать pages, edits/deletes, parent/reply chain, author public reference, duplicate events и rate limits.

**CO-COM-01:** при published автоматически создавать наблюдение за доступными комментариями к публикации, пока действует policy/возможность платформы.  
**CO-COM-02:** preserve root_post_id, parent_comment_id, remote_comment_id, created/edited_at, text, author_ref, visibility и thread_context_snapshot_id.
**CO-COM-03:** webhook/poll доставили тот же comment ID → одно логическое событие с историей версий.
**CO-COM-04:** удалённый/отредактированный комментарий не должен оставлять устаревший auto-reply в очереди без recheck.
**CO-COM-05:** недоступность комментариев — явный unavailable state, а не «0 comments».
**CO-COM-06:** не собирать закрытые сообщения в публичную comment collection.
**CO-COM-07:** полная поддержка пагинации/ограничений API с backoff; ошибка отдельной страницы → partial collection и известный coverage.
**CO-COM-08:** учитывать различие комментариев о публикации Ayla и обсуждений в чужих ветках, где Ayla участвует.

## 11. Comment Intelligence: превращение обсуждения в данные

### 11.1. Многометочный CommentAnalysis DTO

~~~json
{
  "analysis_id": "ca-041",
  "post_id": "pub-041",
  "comment_id": "comment-19",
  "thread_context_version": 3,
  "source_snapshot_id": "snap-7",
  "language": "en",
  "intents": ["question", "business_idea"],
  "topics": ["cost_model", "customer_value"],
  "sentiment": "mixed",
  "stance": "curious",
  "meaningfulness": "substantive",
  "novelty": "repeated",
  "risk": "low",
  "confidence": 0.87,
  "requires_reply": true,
  "reply_authorization": "requires_policy",
  "content_opportunity": true,
  "product_feedback": false,
  "owner_escalation": false,
  "classifier_version": "comment-v1",
  "evidence_ref": "private-or-public-as-permission"
}
~~~

Значения sentiment: positive / neutral / negative / mixed / unknown; stance: agrees/disagrees/questions/unclear; meaningfulness: substantive/social/low_signal/spam/unknown; novelty: first_seen/repeated/unclear. **Sentiment не равен intent и не равен качеству.**

### 11.2. Типы запросов, которые Ayla должна выявлять

- Вопрос к Ayla о личной истории или событиях.
- Вопрос о реальных возможностях калькулятора.
- Непонимание экономической модели.
- Утверждение/аргументированное возражение.
- Предпринимательская идея читателя.
- Жалоба или воспроизводимая ошибка.
- Предложение функции.
- Вопрос о доступности/сотрудничестве.
- Юмор, поддержка, поздравление, комплимент.
- Спам/троллинг/абьюз.
- Возможная тема следующего материала.
- Комментарий, который вообще не требует ответа.

**CO-INT-01:** analysis может содержать несколько intents/topics; публичная реплика про дорогую себестоимость может одновременно быть вопросом и идеей для нового Reel.  
**CO-INT-02:** сохранять source_comment_id, classifier_version/confidence и объяснение; ручная редакция владельца — отдельная версия.
**CO-INT-03:** fallback при сбое анализа — unknown/high-review, никакого автоматического ответа или высокоуверенного вывода.
**CO-INT-04:** отличать sentiment от customer dissatisfaction: сарказм и несогласие не являются доказательством неисправности калькулятора.
**CO-INT-05:** не извлекать чувствительные атрибуты автора и не превращать текст комментария в профиль личности.
**CO-INT-06:** анализ должен учитывать полную доступную цепочку обсуждения, а не только одну реплику.
**CO-INT-07:** комментарий с предложением функции → Feedback Registry, с источником; но решение о разработке остаётся за владельцем.
**CO-INT-08:** комментарий из внешней ветки включается в общую тему исследования с типом source=external_comment, **не** считается реакцией на собственный пост.
**CO-INT-09:** если реальные пользователи говорят «Ayla выглядит нереально/слишком рекламно», это может стать evidence для Visual/Persona QA review, но канон не изменяется без владельца.

## 12. Replies: реакция на комментарии отдельно от аналитики

Сервис ReplyEngine получает CommentAnalysis и авторизацию из AYLA-JOB-02.

**CO-RPL-01:** ReplyDecision = no_reply / draft_for_owner / auto_reply_eligible / escalate_owner / moderation_only.  
**CO-RPL-02:** reply draft должен содержать точный текст, полную parent цепочку, classification_version, risk, QA и источник.
**CO-RPL-03:** low-risk approved auto-reply получает durable random delay **60–3600 секунд** с однократным выбором; после рестарта не пересоздавать.
**CO-RPL-04:** перед отправкой перепроверить источник, контекст, permissions, quotas, permit, text hash и kill switch.
**CO-RPL-05:** вопросы о лицензии, деловые обращения, жалобы и потенциально спорные обязательства → владельцу, не коммерческая импровизация Ayla.
**CO-RPL-06:** ReplyEvent содержит remote_reply_id и source_comment_id; при timeout reconcile прежде чем повторить.
**CO-RPL-07:** отдельный счётчик authored replies, их последующие реакции и влияние на discussion quality; эти события **не** должны искусственно раздувать organic audience engagement KPI.
**CO-RPL-08:** отсутствие ответа допустимо при spam, low_signal или отсутствии полезного вклада.
**CO-RPL-09:** ответ на чужую ветку проходит отдельный ExternalReplyPolicy (без продаж/ссылок), даже если классификатор считает reply low-risk.

## 13. Сбор статистики разговоров и sampling quality

### 13.1. Основные числовые показатели по комментариям

Для каждого опубликованного поста/интервала хранить:

- comments_total_observed (distinct remote IDs, если полный API доступен);
- comments_coverage (complete/partial/unknown и число просмотренных страниц);
- distinct_public_commenters **только если идентификаторы разрешённо и достоверно доступны**, иначе unavailable;
- substantive_comment_count / share;
- questions_count и topic frequency (включая multi-label);
- constructive_disagreement_count;
- product_questions_count;
- content_opportunities_count;
- negative_feedback_count; bug_reports_count;
- Ayla_replies_count;
- replies_to_Ayla_after_reply_count (наблюдаемая последовательность, **не причинная конверсия**);
- conversation_depth, continued_threads, response_latency;
- spam_count и suppressed_count;
- classifier_confidence_distribution, manual_review_rate;
- repeated_question_topics across posts.

**CO-STA-01:** denominators и coverage обязательны; «5 из 20 комментариев» — не «25% аудитории».  
**CO-STA-02:** при partial pagination выводы формулируются на наблюдаемой выборке, а не полном охвате.  
**CO-STA-03:** повторный комментарий одного автора в одной ветке — отдельное событие, но не новый уникальный человек.
**CO-STA-04:** реакции на ответы Ayla хранить отдельно от первоначальных комментариев к посту.
**CO-STA-05:** комментарии и лайки не дают статистически достоверной сегментации всей аудитории без дополнительных данных.
**CO-STA-06:** интервал измерения и канал обязательны; Meta/Threads/Telegram/LinkedIn имеют разные семантики реакции.
**CO-STA-07:** удалить/редактировать приватные сведения из аналитической выборки согласно retention policies; не хранить частные DM в срезе публичных комментариев.

### 13.2. Метрики и формулы

**SubstantiveCommentShare** = substantive_count / classified_eligible_comments, если знаменатель > 0 и известен.  
**QuestionRateInComments** = comments_with_question / classified_eligible_comments; не равен question rate среди зрителей.  
**OwnerEscalationRate** = owner_escalations / analyzed_comments (с явным исключением spam, если так утверждено), с версионированным определением denominator.  
**DiscussionContinuationRate** = threads_with_followup / observed_threads_replied_by_Ayla, если все нужные thread followups доступны; не заявлять причинность.  
**ReplyCoverage** = Ayla_or_owner_replied_eligible_comments / comments_eligible_for_reply; нет цели отвечать на каждый.
**ThemeRecurrence** = observed instances of topic across distinct comments/posts с сохранением количества уникальных источников.

Confidence/coverage/source count показываются рядом с любой долей. Метрики могут стать «unavailable», если API не выдаёт корректный знаменатель.

### 13.3. Отделение сигналов

- **Platform metric:** просмотры/сохранения/репосты/время просмотра, измерены провайдером.
- **Conversation metric:** наблюдаемая частота тем и качественных взаимодействий в комментариях.
- **Inferred topic:** вывод AI с указанной неопределённостью.
- **Product feedback:** пожелание или баг-репорт, требует проверки владельца.
- **Marketing learning:** решение о следующем брифе, не прямой факт о покупателях.

**CO-STA-08:** ни один AI-inferred topic не записывается как provider metric.  
**CO-STA-09:** неоднородные platform metrics не усреднять без сопоставимости и нормализации.
**CO-STA-10:** рост страницы Ayla не означает платное использование калькулятора; использовать only verified links/aggregated website analytics.

## 14. Из комментариев обратно в производственное ТЗ

### 14.1. ContentFeedbackSignal

~~~json
{
  "signal_id": "cfs-042",
  "derived_from_comment_analysis_ids": ["ca-019", "ca-041"],
  "topic": "How to decide whether a side business idea is worth testing",
  "summary": "Several observed commenters confused price with demand",
  "observation_scope": {"platform": "threads", "post_ids": ["pub-041"], "sample_size": 2},
  "sampling_limitations": ["self_selected_commenters"],
  "suggested_content_mode": "entrepreneurial_idea",
  "proposed_formats": ["threads_text", "instagram_reel"],
  "hypothesis": "A short visual paradox will clarify the difference",
  "confidence": 0.58,
  "status": "candidate"
}
~~~

### 14.2. Feedback-to-brief lifecycle

1. Normalize comment/event and store provenance.
2. Extract topics/questions/objections with confidence.
3. Cluster semantically similar, retaining source IDs and counts.
4. Detect patterns and contradictions, identify stale/duplicate themes.
5. Compare with existing brief/idea library (avoid publishing the same explanation repeatedly).
6. Form an explicit new hypothesis and segment.
7. Recommend content mode and platform-specific formats.
8. Construct **new ContentBrief** with feedback_signal_ids and limitations.
9. Execute production pipeline after appropriate approval.
10. Compare reactions in next observation window, update evidence/learning.

**CO-FBK-01:** нет прямого перехода public_comment → automatic_publication без brief, QA, rights and execution-time approval.  
**CO-FBK-02:** единичный яркий комментарий разрешён как editorial inspiration, но не как «массовый запрос».  
**CO-FBK-03:** сохранять отрицательные evidence — недосказанность/несогласие и смещение выборки.  
**CO-FBK-04:** каждое новое ТЗ указывает **почему** эта тема выбрана: numbers и примеры evidence, а не «AI считает, что зайдёт».
**CO-FBK-05:** полученный через DM частный вопрос не используется как публичная цитата без согласия.
**CO-FBK-06:** продуктовые замечания регистрировать для владельца/разработки, не автоматически превращать в PR или обещание исправления.

## 15. Platform + creative experiments

### 15.1. A/B и квазиэксперименты

Связать ConceptID, VariantID, ExperimentID и PostID. У каждого варианта одна primary_metric и оговорённый factor: hook, topic angle, voice, visual style, Ayla appearance, video duration, time slot, caption, platform CTA и т.д.

**CO-EXP-01:** заранее определить primary metric, окно, exposure, segment и критерий выбора.  
**CO-EXP-02:** платформа не предоставила рандомизированное разделение — метод=quasi/observational; не объявлять причинную эффективность.
**CO-EXP-03:** сравнивать same-platform варианты с явно фиксированными различиями; cross-platform сравнение только диагностическое.
**CO-EXP-04:** дополнить числовую результативность содержанием комментариев (какой смысл поняли, где возникли вопросы).
**CO-EXP-05:** сохранить все версии и не переписывать гипотезу задним числом.
**CO-EXP-06:** если комментариев нет, это отсутствие observed discussion, а не признак того, что аудитория поняла/не поняла смысл.

## 16. LearningDecision и редакционный цикл

### 16.1. Decision DTO

Поля: decision_id, period, source_metric_observation_ids[], content_feedback_signal_ids[], experiment_ids[], affected_segment_ids[], previous_policy_version, proposed_policy_change, evidence_summary, contradictory_evidence, uncertainty, owner_approval_required, action (repeat/modify/retire/explore), next_brief_candidate_ids[], status.

**CO-LRN-01:** после +1h и +24h допускается оперативное решение о следующем материале, но не окончательное объявление победителя.
**CO-LRN-02:** недельное/7d окно — сравнение и план, с отмеченными неполными источниками.
**CO-LRN-03:** новые insights могут изменить content mix, формат или идею; не менять самовольно Persona Canon, правила бренда, доступы, бюджет и лицензии.
**CO-LRN-04:** показывать владельцу три слоя отчёта: проверенное наблюдение; интерпретация; действие/эксперимент.
**CO-LRN-05:** сведения о споре/критике не должны автоматически исключать тему: проверять, породила ли публикация содержательный разговор.
**CO-LRN-06:** чрезмерное повторение успешной формулы должно контролироваться creative diversity limits, чтобы Ayla не стала шаблонным аккаунтом.
**CO-LRN-07:** только реально подтверждённые изменения проекта могут стать build_in_public новостью.

## 17. Логические API Actions / messages

Все операции ниже — **новые проектные контракты**, не утверждение, что они уже доступны в Custom GPT. Авторизация, ошибки и поля ответа наследуют AYLA-JOB-02. Внешняя write операция требует отдельной per-account capability и approval; низкорисковые операции чтения имеют scoped доступ.

| ID | Operation | IN | OUT | Основные ошибки |
|---|---|---|---|---|
| CP-01 | signals.collect | project, source types, window | evidence IDs, coverage | SOURCE_UNAVAILABLE |
| CP-02 | topics.mine | evidence IDs, segments | CandidateTopic[] | LOW_EVIDENCE |
| CP-03 | topics.rank | candidates, constraints | ranked topics with reasons | POLICY_CONFLICT |
| CP-04 | briefs.create | topic, format targets, hypothesis | ContentBrief v1 | FACT_SOURCE_MISSING |
| CP-05 | briefs.revise | brief id, patch, expected_version | ContentBrief v+1 | VERSION_CONFLICT |
| CP-06 | production.sheet | approved brief | ProductionSheet | MISSING_INPUT |
| CP-07 | scripts.generate | sheet, persona_version | script drafts | CANON_CONFLICT |
| CP-08 | media.assets_generate | script/shot plan, budget | source assets + rights | COST_LIMIT |
| CP-09 | media.render | assets, timeline, config | final MediaArtifact+manifest | RENDER_FAILED |
| CP-10 | media.quality_check | file hash, variant | QA evidence | QA_FAILED |
| CP-11 | variants.adapt | source artifact, platforms | VariantSpecs | UNSUPPORTED_FORMAT |
| CP-12 | packages.approve | exact variant+QA versions | Approval | NOT_AUTHORIZED |
| CP-13 | publications.schedule | approved package, due_at | job ID | CAPABILITY_UNAVAILABLE |
| CP-14 | publications.verify | job/remote post | remote receipt | REMOTE_UNKNOWN |
| CP-15 | comments.sync | account/post/cursor | comment events + coverage | COMMENTS_UNAVAILABLE |
| CP-16 | comments.analyze | comment ids, context | CommentAnalysis[] | LOW_CONFIDENCE |
| CP-17 | comments.reply_propose | analysis, exact context | reply draft/QA | RISK_BLOCKED |
| CP-18 | comments.reply_schedule | approved draft, delay policy | durable ReplyJob | QUOTA / PERMIT |
| CP-19 | signals.from_comments | analyses, observation window | ContentFeedbackSignal[] | INSUFFICIENT_SAMPLE |
| CP-20 | content_metrics.collect | publication ids + windows | MetricSnapshots | INSIGHTS_UNAVAILABLE |
| CP-21 | experiments.link_evaluate | variant IDs, metrics, rules | evaluation with uncertainty | INCOMPARABLE |
| CP-22 | learning.evaluate | observations + feedback | LearningDecision | INSUFFICIENT_EVIDENCE |
| CP-23 | briefs.from_learning | decision id | proposed next brief(s) | OWNER_APPROVAL_REQUIRED |
| CP-24 | content.operations_status | project/account/window | queues, blocking, coverage, costs, published count | ACCESS_DENIED |

### 17.1. Common response

~~~json
{
  "schema_version": 1,
  "request_id": "req-12",
  "status": "success",
  "project_id": "nomad360",
  "data_ref": "content-addressed-ref",
  "artifact_version": 1,
  "source_evidence_ids": ["ev-1"],
  "next_allowed_actions": ["production.sheet"],
  "observed_at": "2026-10-21T12:00:00Z"
}
~~~

### 17.2. Common error

~~~json
{
  "status": "error",
  "request_id": "req-12",
  "error": {
    "code": "FACT_SOURCE_MISSING",
    "retryable": false,
    "detail": "Product claim has no verified ProductFacts version",
    "manual_fallback": "Attach a verified release reference or remove the claim"
  }
}
~~~

**CO-API-01:** все actions возвращают typed status/artefact IDs, никакого «готово» на основании одного модельного текста.  
**CO-API-02:** версия brief/script/asset/variant/approval связана по lineage; если источники изменились, следующий этап не должен использовать старую версию незаметно.
**CO-API-03:** операции RT с повторной доставкой используют idempotency; AI креативная генерация создаёт новую версию, не новый remote publish.
**CO-API-04:** не включать непроверенную внешнюю автоматизацию, платных AI-провайдеров или персональные данные без решения владельца.
**CO-API-05:** Content Operations API не имеет прав менять финансовые формулы/лицензию/расчёты пользователей Nomad360.

## 18. Хранилище, lineage и дашборд

### 18.1. Обязательные сущности

Evidence → CandidateTopic → ContentBrief → ProductionSheet → Script → MediaArtifact → PlatformVariant → ApprovedPublicationPackage → Publication/RemoteID → MetricsSnapshots + CommentEvents → CommentAnalysis → ContentFeedbackSignal → LearningDecision → next ContentBrief.

Должны работать запросы:
- Найди все публикации и варианты, созданные по гипотезе.
- Из каких комментариев и наблюдений появился сценарий?
- Какой Reel создан по какой версии визуального эталона Ayla?
- Почему в следующем цикле отказались от выбранной темы?
- Какие посты привели к содержательным вопросам (не спутать с продажами)?
- Сколько публикаций в Threads были standalone, а сколько replies?
- Сколько источников/комментариев было доступно в период?
- Что реально опубликовано, что осталось в черновиках, а что blocked?
- Какие платформы не дали comments или insights, и почему?
- Какие подписчики пришли именно от конкретной публикации? **Только при доказуемой атрибуции**, иначе ответ «невозможно определить».

### 18.2. UI/operations dashboard

Общие поля: briefs pipeline, creative cost, asset storage/status, persona QA, scheduled/published posts, missing approvals, platform capability state, comments monitoring status, comment coverage, classification distribution, response queue, unanswered high-risk, content opportunity clusters, experiments, metrics+unknown, next-plan recommendations.

**CO-UI-01:** показывать источник числа и denominator; процент без denominator и окна — некорректный.
**CO-UI-02:** различать source coverage и observed reactions; нельзя показывать «нет комментариев» при API failure.
**CO-UI-03:** защита доступа owner-only к DM; их текст никогда не отображается в общедоступном дашборде производства.
**CO-UI-04:** allow owner approve/reject/revise Brief, Script, Variant, Publish и relevant content topic без обхода Exact-version policy.

## 19. Матрица приёмки Content Operations

| Case | Условие | Ожидаемый результат |
|---|---|---|
| CT-01 | Вход: 3 независимых комментария по теме | Evidence IDs → candidate topic, sources/coverage указаны |
| CT-02 | Один комментарий без других наблюдений | Candidate exploratory, не «массовая потребность» |
| CT-03 | Нет аналитики, cold start | Новый честно помеченный exploratory Brief |
| CT-04 | Brief описывает факт о калькуляторе без ProductFacts | Не допускать approve, FACT_SOURCE_MISSING |
| CT-05 | Brief о свидании Ayla без CTA | Корректный life_narrative без принудительной рекламы |
| CT-06 | Новая сцена Ayla противоречит её истории | Persona QA FAIL, revise |
| CT-07 | Из анализа сформирован Brief | Заполнены purpose, evidence, segment, metric, angle, format, QA |
| CT-08 | Brief изменён после Script approval | Требуется новая версия связанного Script/QA |
| CT-09 | Генератор создал только Reel script | Status script_ready, НЕ готовое видео |
| CT-10 | Reel создан, нет финального media hash | Status incomplete; publish blocked |
| CT-11 | Финальный Reel с устаревшим лицом Ayla | Persona visual QA FAIL |
| CT-12 | Story с unsupported poll sticker | Готовый story media + manual_install_instruction, не «интерактив опубликован» |
| CT-13 | Carousel на 6 слайдов | 6 отдельных assets, целостный manifest, platform layout QA |
| CT-14 | Текущий Threads carousel донор | blocked_unsupported до реализации typed media manifest |
| CT-15 | LinkedIn organic carousel запрошен | Адаптер предлагает approved multi-image/document, но не paid carousel автоматически |
| CT-16 | 1 concept → 3 платформы | 3 VariantSpecs, 3 PublicationIDs, одна concept lineage |
| CT-17 | Publish API тайм-аут после отправки | unknown_remote_result, reconciliation без слепого дубля |
| CT-18 | Published без remote ID | В publish состояние не переходить |
| CT-19 | Threads 10 standalone + 12 replies | Standalone=10, replies=12 раздельно |
| CT-20 | Пришёл комментарий через webhook и poll | 1 logical comment event, история source versions |
| CT-21 | Комментарий имеет 2 смысла (question + feature) | Multi-label analysis, возможен reply и FeedbackRegistry |
| CT-22 | Комментарий с сарказмом/критикой | Sentiment может быть mixed; не автоматически abuse |
| CT-23 | Comments API упал | coverage=unavailable, не 0 комментариев |
| CT-24 | Комментарии собраны лишь с первой страницы | partial, нельзя выдавать темы за полную выборку |
| CT-25 | Спам от неизвестного автора | no_reply; spam recorded, no public discussion promotion |
| CT-26 | Низкорисковый approved reply 1–60 min | durable delay 60..3600s, не сбрасывается при restart |
| CT-27 | Исходный комментарий удалён | cancel scheduled reply; no remote write |
| CT-28 | Ayla дала 10 ответов, выросли комментарии | Измерять authored replies отдельно, не искусственно завышать organic engagement |
| CT-29 | Комментатор указал реальный баг V2 | FeedbackRegistry + owner alert; не выдумать обещания |
| CT-30 | Подписчик рассказал личную историю в DM | Не включать в ContentBrief без отдельного разрешения |
| CT-31 | Разные Reels дают разные результаты | A/B или quasi с оговорённым exposure и неопределённостью |
| CT-32 | Из реакции на пост создана новая гипотеза | evidence/comment refs → ContentFeedbackSignal → new Brief |
| CT-33 | post-level views есть, profile follows unavailable | Unknown релевантных подписок; views только diagnostic |
| CT-34 | Model inference недоступен после завершения GPT-сеанса | RT собирает метрики, не притворяется создателем новой гипотезы |
| CT-35 | Owner нажал global pause | Нет новых внешних write, очередь и аналитика сохранены |
| CT-36 | Проверка diff | Изменены только Markdown требования, калькулятор и donor код не тронуты |

### 19.1. Нагрузочное и интеграционное испытание

**CT-E2E-01:** в разрешённом тестовом аккаунте взять реальный опубликованный вопрос/тему → создать источник → утверждённый ContentBrief → финальный Reel/Threads post → remote published ID → +1h/24h insights → один реальный доступный комментарий → multi-label analysis → safe reply with durable delay → ContentFeedbackSignal → следующий draft Brief. Требуется сохраняемая evidence chain, не симулированные удалённые ID.

**CT-E2E-02:** отдельно испытать publication by API и manual-only fallback для ограниченного формата; не записывать ручную публикацию как автоматическую.

**CT-E2E-03:** доказать корректный режим отсутствия комментариев/insights (permission revoked, timeout, limited pagination) без фальшивого нуля.

## 20. Донор и реализационные границы

Переиспользование **только после сверки** из приватного KazartsevEV/lazysellerV2/ai-content-marketer:
- existing ContentCandidate/ContentPlanItem/PublicationJob/ContentFormat из contracts.py;
- qualified_growth planner и evidence confidence;
- локальные content generation stages и контуры версионирования;
- source footage → transcript-first editing → FFmpeg deterministic render, QA, SHA provenance;
- Threads текст/одна картинка/одно видео publish + comments ingest + insights; **не** current Threads carousel;
- comment intent/risk/snapshots, controlled replies/permits, per-account/per-post limiter;
- scheduled metrics snapshots +1h/+24h/+7d и learning lineage.

**Открытые для реализации:** generative provider согласованного типа, Persona visual consistency, finished Stories/carousels, полные Instagram/Facebook/Telegram/LinkedIn adapters, cross-platform comments semantics, comment clustering/quality aggregates, готовая связь comments→brief, реальная E2E приёмка.

Обычный Custom GPT не обеспечивает круглосуточную самостоятельную генерацию новых сценариев и решений при закрытом чате; RT исполняет только доступные разрешённые фоновые jobs. Дополнительный автономный inference требует отдельной архитектурной санкции. Платные AI-провайдеры без OWNER approval не подключать.

## 21. Порядок реализации после отдельного утверждения

1. **Lineage & Brief schema:** Signal/Evidence → Topic → ContentBrief → ProductionSheet, state machine, fixture tests.
2. **Creative Studio:** text scripts, persona QA, source image/video assets, render provenance, finished format tests.
3. **Platform variants & publishing:** capability-specific exports, 5 каналов в пределах поддерживаемых функций, remote IDs.
4. **Post-release monitoring:** post/account metric windows, comments ingest with cursor/webhook/reconcile.
5. **Comment intelligence:** multi-label classification, sampling/coverage, sentiment/meaningfulness, owned vs external, reply queue.
6. **Feedback-to-brief:** topic clustering, repeated questions, product bug feedback, original hypotheses and new production brief.
7. **Learning & QA:** experiment comparison, content fatigue, traceability, reporting, 36 acceptance cases + E2E.

Каждый этап должен выполняться отдельным PR с проверками, без изменения финансового движка Nomad360. Этот документ **не** даёт разрешение на разработку, публикацию, доступ к соцаккаунтам или подключение платных сервисов.

---

**Определение завершённой функции:** Ayla способна получить исходные данные, документировать, **почему** выбран сюжет или тема, составить исполняемое творческое ТЗ, произвести качественные конечные файлы, разместить конкретные разрешённые варианты на целевых площадках, после публикации проследить числовые реакции и содержание доступных комментариев, обоснованно предложить следующий материал с полной обратной связью и проверяемыми источниками — сохраняя естественную жизнь и независимость личности Ayla по AYLA-CORE-01.
