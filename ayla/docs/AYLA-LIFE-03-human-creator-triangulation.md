# AYLA-LIFE-03 — Human Creator Pattern Learning & Triangulated Life Synthesis

> **Проект:** Nomad360 Business Solutions / самостоятельная подсистема Ayla в корневом каталоге [ayla/](../README.md).
> **Статус:** технический проект v0.1 на согласование, 21.10.2026.
> **Инициирующее решение владельца:** Ayla не внедряется в калькулятор. Она должна формировать естественную жизнь, наблюдая за **реальными людьми, не AI-персонажами**, в близкой нише и географии. Возможный способ — триангуляция: **социальный рисунок из публикации автора A; место из B; эмоциональная динамика из C**.
> **Обязательные зависимости:** утверждённый [AYLA-CORE-01](../../docs/ayla/AYLA-CORE-01-persona-life-engine.md), проект аудитории [AYLA-PERSONA-02](../../docs/ayla/AYLA-PERSONA-02-audience-aspirational-life.md) и контентный workflow [AYLA-JOB-03](../../docs/ayla/AYLA-JOB-03-content-production-feedback-loop.md).
> **Важное различие:** выбор реального автора для изучения не означает права копировать его тексты, лицо, фотографии, личную жизнь и конкретные истории. Производить **новое авторское событие Ayla**, а не коллаж из чужих постов.

## 0. Определение задачи

Ayla — персонаж, живущий современной американской жизнью женщины около 27–29 лет, с постоянной внешностью, друзьями, отношениями, привычками, работой и памятью. Для естественности она регулярно анализирует то, как живые люди в сопоставимой городской/психографической среде **действительно строят и рассказывают социальные истории**.

**Модель не переписывает чужие истории.** Она извлекает повторяемые принципы:
- какие поводы вызывают встречи, споры, недоразумения, знакомства;
- как среда (парк, кафе, поездка, работа, квартира) ограничивает сцену;
- как меняется настроение: ожидание, неловкость, раздражение, теплота, восторг, разочарование;
- какие повседневные детали делают событие достоверным;
- как события получают продолжение через дни или недели.

Полученные абстрактные признаки комбинируются с собственной биографией, расписанием, отношениями и мотивацией Ayla.

**Три независимых источника — рекомендованный начальный композиционный оператор, а не единственный способ сочинения.** По решению креативного планировщика могут применяться комбинации 2–5 независимых источников, последовательное продолжение уже существующей арки, опора на один собственный LifeEvent или событие из источника владельца. Для режима TRIANGULATE_3 требуется минимум **три разных автора** и по одному независимому источнику на каждую роль.

## 1. Чёткая граница с калькулятором

- Структура: repository root / ayla — **соседняя** самостоятельная подсистема, не модуль внутри Calculator.
- Runtime Ayla не импортирует финансовый движок, не подключается к пользовательской форме калькулятора и не читает её расчёты.
- Системы Persona, social observation, LifeState, Creative Production, Her Job и Platform Adapters используют собственные данные и очередь.
- Her Job может отдельно и только для проверенных публичных фактов Nomad360 читать ProductFacts API / проверенные релизные документы.
- Жизненная история Ayla возникает из собственного состояния и наблюдений живых блогеров, **не** из коммерческих сценариев V1/V2.
- Калькулятор остаётся текущим продуктом, продвижением которого Ayla занимается как профессиональной работой; личная жизнь не обязана о нём упоминать.

## 2. Кого наблюдать: Human Creator Registry

### 2.1. Кандидаты

**Приоритет:** авторы, у которых есть собственная реальная жизнь (не виртуальные/AI-инфлюенсеры), публичная и наблюдаемая повседневная история, естественный язык, активные социальные отношения и локальная среда в США.

Совпадение по нише означает **психографическую близость** аудитории и лайфстайл, а не только публикации о бизнесе: городская самостоятельность, любовь/свидания, дружба, маленькие путешествия, работа, культурные мероприятия, творчество, юмор, жизненные эксперименты.

### 2.2. Фильтрация

**HC-01:** не считать автора «точно человеком» по фото: допустимые статусы verified_human / human_likely / unknown / synthetic_detected с evidence. На автоматическую выборку TRIANGULATE_3 допускать verified_human или human_likely после проверки владельцем правил отбора; для неизвестных — ручная проверка.
**HC-02:** предпочтительно география того же города/агломерации Ayla. Пока домашний город не утверждён, использовать provisional_geo=US и **не заявлять локальную достоверность конкретного квартала**.
**HC-03:** географический критерий — public self-disclosed/home city или достоверные факты открытых публикаций; не выводить точный адрес/место жительства из фотографий и геолокации частных людей.
**HC-04:** выбирать **несколько независимых авторов**, чтобы Ayla не наследовала характер, круг друзей и стиль одного блогера.
**HC-05:** учитывать свежесть, разнообразие ситуаций, спонтанность, разговорный язык и повторяющиеся человеческие детали, а не только максимальные просмотры.
**HC-06:** не использовать закрытые сторис, личные сообщения, сайты за логином без прав, сведения о детях/партнёрах/адресах или интимные подробности, не предназначенные для переиспользования.
**HC-07:** сохранять URL/remote ID наблюдения, дату, доступность, метод сбора, provenance и ограничения платформы.

### 2.3. HumanCreatorRecord

Поля: creator_id; platform; account_ref; source_url; city_or_region_public; geography_confidence; content_niches[]; shared_value_tags[]; public_format_types[]; human_assessment_state; evidence_refs[]; last_observed_at; sampling_status; provider_capability; reuse_restrictions; approved_for_abstract_patterns.

Система не обязана хранить личные данные автора, не необходимые для анализа опубликованных социальных паттернов.

## 3. Сбор материала и распознавание живых паттернов

Pipeline:
**Discovery → Provider permission check → Public post ingest → Source normalization → Naturalness tagging → Pattern extraction → Human review/quality check → Pattern Library.**

### 3.1. SourcePost

Минимальные поля: source_post_id, creator_id, original_platform, remote_id, url, published_at, observed_at, coarse_public_geo, media_kind, text_or_transcript_ref (при разрешённом доступе), description, source_visibility, provider_permission, rights_status, analysis_quality, canonical_event_reference_nullable.

**SRC-01:** хранить публичные тексты/транскрипты и медиа только в допустимом объёме и на срок, разрешённый условиями API/платформы. Для ограниченных источников хранить ссылку, доступные метаданные и **новые абстрактные признаки**, не копию поста.
**SRC-02:** нельзя выдавать AI-реконструкцию недоступной публикации за прочитанный источник.
**SRC-03:** отмечать sponsor/advertisement и постановочный контент, чтобы не обучать бытовую естественность исключительно на рекламных сценариях.
**SRC-04:** качество источника: enough_context, current/local, original_creator, non_synthetic_confidence, exposure_bias_warning; нерепрезентативность блогеров обязательна как метка.
**SRC-05:** не считать географическую совместимость равной наличию одинакового визуального фона. Проверять маршруты/сезон и доступность локации отдельно.

### 3.2. PatternExtractor — три разные оси

**SocialPattern** из A:
- social_role_map (друзья/знакомые/партнёр/коллеги как роли, не реальные имена);
- interaction_trigger (просьба, приглашение, недоразумение, встреча, совместное занятие);
- interaction_shape (кто инициирует, кто сопротивляется, чем меняется ситуация);
- conversation_style (ирония, поддержка, спор, неловкое молчание);
- social_norms (типичные правила группы);
- open_loop / possible_consequence;
- abstraction_level=generalized.

**PlacePattern** из B:
- place_type (общедоступное кафе, библиотека, парк, рынок, поезд, культурное пространство);
- verifiable city/area, если релевантно и действительно публично;
- time_of_day/season;
- sensory details (свет, шум, температура, плотность людей);
- affordances (что там обычно можно делать, как добраться, сколько времени занимает);
- scene_constraints (не ходить туда, если персонаж в другом городе);
- **не копировать** личные квартиры, домашние адреса и идентифицирующие координаты автора.

**EmotionPattern** из C:
- baseline mood;
- trigger → feeling change → reaction → aftermath;
- emotional contrast (например, энтузиазм → неловкость → облегчение);
- vulnerability/unfinishedness;
- narrative pacing;
- **не копировать** личную травму, исповедь, специфические слова или уникальную жизненную историю автора.

**PAT-01:** поле pattern может содержать абстрактную схему, но не дословный пост/цитату/уникальное имя автора.
**PAT-02:** это **три независимых сигнала**, а не три абзаца, склеенных в один.
**PAT-03:** оригинальные и конфликтующие детали фиксируются только в source evidence, не в будущем публичном текстовом плане.
**PAT-04:** разделять изучение содержания, ритма жизни, тона и структуры — нельзя воспроизводить узнаваемую манеру письма одного автора.
**PAT-05:** повторно использовать обобщённые паттерны можно, но с ограничением повторяемости конкретных комбинаций.

## 4. Триангуляция — один из композиционных операторов

### 4.1. TRIANGULATE_3

Вход: три SourcePost ID из **трёх различных approved HumanCreatorRecord**, один и тот же жизненный/географический контекст или убедительная совместимость, плюс сохранённый LifeState Ayla.

**A → SocialPattern**: например, неидеально организованная встреча друзей.  
**B → PlacePattern**: например, читальный зал или публичное кафе в подходящем американском районе.  
**C → EmotionPattern**: например, ожидание → тревога → неожиданная теплота.

Далее LifeNarrativeComposer решает, **что реально могла бы сделать именно Ayla** с её отношениями, привычками и обязательствами, чтобы получилась оригинальная история.

Выход: EpisodeProposal со сценами, временем, существующими второстепенными персонажами, мотивацией, эмоциональным ходом, последствиями и открытой нитью на будущее.

### 4.2. Другие операторы, которые не должны блокироваться правилом «ровно 3»

- **CONTINUE_ARC:** развить ранее опубликованную ситуацию без новых чужих постов, используя текущую память Ayla.
- **ROUTINE_VARIATION:** обычная сцена с новым поворотом из Pattern Library; не каждый день требует триангуляции.
- **TOPIC_TO_LIFE:** впечатление от живого разговора/события становится поводом для собственной реакции Ayla.
- **TRIANGULATE_N:** тематическая композиция из 2–5 независимых обобщённых паттернов, с ограничением на зависимость от одного автора.
- **PERSONA_INITIATED:** событие возникает из планов, отношений, переживаний и интересов самого персонажа.

**TRI-01:** при TRIANGULATE_3 убедиться, что три source_post_id принадлежат **трём разным creator_id**; источник нельзя назначить на несколько ролей.
**TRI-02:** смысловой synthesis обязан отличаться от каждого исходного поста: собственные персонажи, мотивы, решения, последовательность и последствия.
**TRI-03:** запрет копирования длинных фраз, подписей, фирменных хуков, узнаваемых «историй один в один» и покадровой композиции видео.
**TRI-04:** результаты триангуляции не вправе переписывать Canon/Relationships/TravelState.
**TRI-05:** поддерживать воспроизводимую provenance цепочку, но сторонние source IDs хранить **во внутренних данных**, не в публичной биографии Ayla.
**TRI-06:** если источники концептуально несовместимы, разрешается rejected/reselect; не склеивать несвязанные сцены ради формального выполнения «трёх».

## 5. Continuity Constraint Solver — как возникает ЕЁ собственная жизнь

До утверждения EpisodeProposal проверить:
1. Время и локацию: домашний город, поездки, реалистичную длительность маршрутов, погодный/сезонный фон.
2. SocialGraph: этот друг знаком с Ayla? Кто кого пригласил? Есть ли ранее начатая история?
3. Motivation: зачем Ayla идёт на встречу/меняет планы/отвечает человеку?
4. Emotion: соответствует ли реакция темпераменту и предыдущим отношениям?
5. Aspirational gap: жизнь привлекательна, но достижима; нет непрерывной дорогой роскоши и идеальности.
6. Visual Canon: согласованный портрет, гардероб, квартира, транспорт, устойчивые второстепенные персонажи.
7. Work/Life balance: время работы Nomad360 и жизненные события не обязаны превращаться друг в друга.
8. Originality/privacy: не воспроизводятся реальные чужие личные истории, имена, жильё или снимки.

**LIFE-01:** отвергнуть эпизод, где Ayla уже занята, уехала, болеет, общается с другим персонажем без реалистичного перехода или где друг внезапно имеет иную биографию.
**LIFE-02:** эпизод не обязан содержать продукт или ссылку на калькулятор.
**LIFE-03:** если сюжет продолжает отношение, сохранить причинность между предыдущими и новыми событиями.
**LIFE-04:** не допускать 100% только счастливых/идеальных эпизодов; показывать типичную рутину, сомнения и незавершённость.
**LIFE-05:** в каждом EpisodeProposal есть минимум одна **оригинальная** деталь, вытекающая из канона Ayla, а не из наблюдённых авторов.
**LIFE-06:** если Ayla вымышленно посещает реальное место, сверить публичные факты и не утверждать, что реальный владелец/посетитель видел её физически.

## 6. Структурированный выход и состояния

[Machine-readable JSON Schema](../contracts/life-synthesis.schema.json) обязателен как baseline validation для режима TRIANGULATE_3.

### 6.1. Пример EpisodeSynthesis (синтетический, не по реальным авторам)

~~~json
{
  "schema_version": 1,
  "episode_id": "episode-example-1",
  "project_id": "nomad360",
  "persona_version": "approved-canon-version",
  "synthesis_method": "TRIANGULATE_3",
  "sources": [
    {"creator_id":"human-A","post_id":"post-A","role":"SOCIAL","pattern_id":"pattern-social-1"},
    {"creator_id":"human-B","post_id":"post-B","role":"PLACE","pattern_id":"pattern-place-1"},
    {"creator_id":"human-C","post_id":"post-C","role":"EMOTION","pattern_id":"pattern-emotion-1"}
  ],
  "life_state_snapshot_id": "ayla-state-301",
  "summary": "Ayla changes an ordinary plan and meets a friend at a quiet public cafe",
  "original_persona_motivation": "Her own recent decision to reconnect with a friend",
  "location": {"city":"TBD","place_type":"public_cafe","verified_place_id":null},
  "emotional_arc": ["anticipation","awkwardness","warmth"],
  "participants": ["ayla","fictional-friend-from-canon"],
  "scene_count": 2,
  "novelty_checks": {"verbatim_copy":false,"distinctive_story_copy":false,"real_person_biography_copy":false},
  "continuity_status": "pending_review",
  "publication_approval": "not_requested",
  "status": "proposed"
}
~~~

Этот DTO показывает структуру, а не подтверждает города, людей или события. Значения creator_id/post_id/episode_id — тестовые placeholders.

### 6.2. Lifecycle

HumanCreator candidate → checked → observed → pattern_extracted → approved_pattern → synthesis_proposed → continuity_checked → originality_checked → episode_approved → life_event_committed → production_brief_created → published → audience_feedback_analyzed → followup_proposed.

**ST-01:** до episode_approved разрешено отвергнуть/пересоздать композицию, но нельзя менять публичный канон.
**ST-02:** запись события в LifeState происходит после одобрения сюжета, а не при обнаружении чужого поста.
**ST-03:** после публикации событие, отношения и последствия являются устойчивой памятью Ayla, даже если позднее изменились исходные посты.
**ST-04:** review/learn может влиять на выбор новых паттернов, но **не переписывает прошлые эпизоды**.
**ST-05:** если human-likelihood/source consent отозваны, прекращается сбор; уже использованные обобщённые признаки проходят privacy review.

## 7. Что означает «обучается» технически

Для первого выпуска **обучение не равно fine-tuning на скопированных публикациях**. Рекомендуется:

- Platform adapter / permitted retrieval → локальный корпус **ограниченных нормализованных наблюдений**.
- PatternExtractor → Pattern Library (структурированные признаки, ID, confidence, provenance).
- Retrieval / ranking → выбор подходящих паттернов по нише/географии/Persona.
- Composition → оригинальный LifeEpisode с ограничениями памяти.
- Feedback → обновление **весов предпочтения абстрактных паттернов**, интереса к типам жизненных ситуаций, длине арок и месту публикации.

**LEARN-01:** не утверждать, что веса базовой нейросети изменены: без отдельной задачи на training/fine-tune это retrieval + статистическое обучение стратегии, а не model training.
**LEARN-02:** raw posts third parties не должны попадать в постоянный произвольный prompt контекст без проверок прав и возможности удаления.
**LEARN-03:** не пытаться писать «точно в стиле Blogger A»; изучать общие дискурсивные и повествовательные закономерности.
**LEARN-04:** следить за источниковым разнообразием и долей использований одного автора; распределение должно быть обнаруживаемым и редактируемым владельцем.
**LEARN-05:** source signals с низкой confidence не должны превращаться в личные факты Ayla.
**LEARN-06:** использовав чужую эмоциональную динамику, система не заимствует интимные обстоятельства, конкретную травму/разрыв/болезнь и голос автора.

## 8. ContentBrief и производственный контур

EpisodeProposal трансформируется в ContentBrief по [AYLA-JOB-03](../../docs/ayla/AYLA-JOB-03-content-production-feedback-loop.md) с полями:

- content_mode=life_narrative; обязательно life_event_id, approved PersonaVersion.
- mode of synthesis, abstract_pattern_ids[], source evidence refs (internal only).
- platform and format target: Threads/Reel/Story/carousel etc.
- premise, point of view, scene sequence, emotional rhythm, ordinary anchor, unresolved thread/aftermath.
- visual references to **approved exact face of Ayla**, continuity environment and friend assets.
- source-independent, original American English copy and video script.
- QA: story originality, temporal geography, canonical identity, supported channel features.
- success measures: meaningful replies, identification, returning followers, story follow-up interest; **не обязательный переход к калькулятору**.

**BRIEF-01:** без publish permission/story identity pass нет внешней публикации.
**BRIEF-02:** нельзя вставлять имена реальных блогеров в вымышленную социальную сцену Ayla или выдавать её за их знакомую.
**BRIEF-03:** каждый готовый материал остаётся фактически **про Ayla**, не реэкранизацией исходной публикации.
**BRIEF-04:** подписчикам не раскрываются лишние персональные сведения реальных авторов; публичное AI disclosure Ayla и маркировка generated media выполняются согласно правилам платформы.

## 9. Аналитика и личный сюжет: замкнутый цикл

**ObservedFeedback**: replies/comments; follow-up requests; сохранения и пересылки; returning viewers, если provider позволяет; authenticity/continuity complaints; engagement by story arc; creative fatigue.

- Счётчики и фактические source metrics хранятся отдельно от модельных интерпретаций.
- Комментарий может быть одновременно поводом для ответа и источником «какой сюжет интересен», но сам не меняет LifeState.
- Анализировать **почему** люди возвращаются: к героине, отношениям, месту, конфликту, юмору, разговору.
- Не оптимизировать исключительно по романтической драме или острым конфликтам, иначе жизнь Ayla станет неправдоподобной.
- Сохранять отсутствие данных как unavailable/unknown, а не 0.
- Не выводить индивидуальные интимные или чувствительные характеристики подписчиков.

**FB-01:** каждый новый выбор схемы должен показывать previous hypothesis, evidence, change and confidence.
**FB-02:** success signal = возвращаемость и качественное взаимодействие, не только просмотры.
**FB-03:** approved Persona identity не меняется моделью только потому, что альтернативный внешний облик «набрал больше».
**FB-04:** не пристраивать рекламу Nomad360 к каждому эпизоду.

## 10. Минимальный независимый контракт операций (логические Actions)

| ID | Action | Input | Output | Блокировки |
|---|---|---|---|---|
| LS-01 | creators.discover | geo, values/niche, platform | candidate creators | privacy/synthetic unknown |
| LS-02 | creators.verify | candidate ID, public evidence | HumanCreatorRecord status | confidence low |
| LS-03 | posts.collect | approved creator IDs, window | SourcePost[] + coverage | forbidden API |
| LS-04 | patterns.extract | source_post_id | abstract Social/Place/Emotion patterns | missing provenance |
| LS-05 | patterns.index | validated pattern | versioned Pattern Library | copied personal detail |
| LS-06 | triangulation.plan | 3 distinct creator IDs/posts, roles | TriangulationPlan | duplicate creator |
| LS-07 | episodes.synthesize | plan, LifeState snapshot | EpisodeProposal | unavailable model |
| LS-08 | episodes.validate | proposal, canon | continuity/originality QA | mismatch |
| LS-09 | episodes.approve | exact proposal version | approval record | owner policy |
| LS-10 | life.commit_event | approved episode | LifeEvent ID | stale snapshot |
| LS-11 | content.create_brief | approved episode, channels | production brief | missing person/visual ref |
| LS-12 | learning.evaluate | published episodes + feedback | pattern ranking proposal | insufficient evidence |

**API-01:** all operations return typed status, evidence IDs, actor, version, timing, error. No created/published/success if only model text exists.
**API-02:** collecting source materials requires verified provider permissions; manual-only fallback should be explicit.
**API-03:** runtime scheduling, platform accounts and background inference stay separate from calculator.
**API-04:** a draft does not initiate social publication without an approved exact-version ContentBrief and platform permission.

## 11. Приёмка

| Test | Scenario | Expected |
|---|---|---|
| LS-T01 | Input: три разрешённых поста **трёх разных людей** | One Social, Place, Emotion pattern, separate source IDs |
| LS-T02 | Input: три поста одного автора | TRIANGULATE_3 invalid; no synthesis |
| LS-T03 | Один автор явно AI/synthetic | Source rejected by human-only filter |
| LS-T04 | География персонажа не утверждена | No claim of an exact neighborhood/local lived experience |
| LS-T05 | Place pattern implies private home address | Reject identifying location; choose general public setting |
| LS-T06 | Emotional source discloses private trauma | Keep abstract affect only, no personal circumstances |
| LS-T07 | Composer reproduces distinctive source wording/plot | Originality QA fails |
| LS-T08 | New episode contradicts Ayla's relationship/itinerary | Continuity QA fails, no LifeEvent commit |
| LS-T09 | All source patterns valid, but no original Ayla motivation | Episode incomplete; revise |
| LS-T10 | Three inputs valid, scene implausible | Reject/reselect allowed rather than forced collage |
| LS-T11 | Owner approves, life event committed | Versioned LifeEvent with lineage; not rewritable by new post |
| LS-T12 | Created episode has no Calculator promotion | Correct LifeNarrative, no forced CTA |
| LS-T13 | Story published and audience responds | ContentBrief → remote post → feedback → next pattern selection traceable |
| LS-T14 | No access to creator post by official API | unavailable/manual, no inferred fake post |
| LS-T15 | One creator dominates source selection | Diversity warning, owner review |
| LS-T16 | User asks if Ayla is AI | Accurate disclosure without invented real-life physical proof |
| LS-T17 | Calculator unavailable or refactored | Ayla Life Engine still operates independently |
| LS-T18 | Review modified only Ayla directory and docs navigation | No Calculator code/finance change |

**E2E:** выбрать трёх конкретных проверенных реальных блогеров из совместимой географии/ниши; получить три разрешённых поста; сохранить abstract patterns; synthesize ONE original life episode with Ayla's existing friend and time; validate canon + originality; generate a ContentBrief/finished scene in a supported format; obtain owner approval; publish to test account only when authorised; collect real metrics/available comments; produce versioned feedback suggestion. Если нет аккаунтов/провайдера, выполнение отмечается unproven, не production-ready.

## 12. Вопросы для дальнейшего утверждения

- **Город жизни Ayla** в США — определит точность географии и начальный пул живых блогеров.
- Количество и разнообразие исследуемых авторов: owner configurable, не «три блогера навсегда».
- Можно ли использовать публичные места, которые встречаются у наблюдаемых авторов, если это распространённые городские локации (не приватные/идентифицирующие).
- Уровень автономии: автоматическое предложение сюжета или автоматическая запись LifeEvent/публикация; по умолчанию только proposals.
- Допустимый бюджет и provider для анализа постов/видеотранскриптов и генерации контента.

**Отличие от контентной фабрики:** это жизнь и память самостоятельного персонажа Ayla, а не generic генерация случайных Reels по конкурентам.

**Definition of Done:** Ayla наблюдает разные реальные человеческие истории через разрешённые источники, учится на абстрактных социальных и эмоциональных закономерностях, создает **собственную** непротиворечивую жизнь, производит готовые материалы и использует реакции аудитории для следующего оригинального эпизода. Ни зависимость от калькулятора, ни копирование чужих личностей не допускаются.
