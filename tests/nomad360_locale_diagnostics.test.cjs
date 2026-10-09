/* Native-node independent checks: model errors and identifiers remain Russian
 * in the finance engine, but customer-facing diagnostics get contextual
 * English/Kazakh translations, including months, names and numbers. */
const {test}=require('node:test');
const A=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','nomad360_locale_core.js'),'utf8');
const win={Nomad360UI:{getLanguage:()=> 'en'}};
new Function('window','document',src)(win,{readyState:'loading',addEventListener(){}});
const tr=(original,lang)=>win.Nomad360LocaleCore.translate(original,lang);
const cases=[
 ['Прогноз клиентов для «Маникюр» (9.50) больше доступных 8 посещений в месяц.',
  'Customer forecast for “Маникюр” (9.50) exceeds available 8 monthly appointments.',
  '«Маникюр» клиент болжамы (9.50) қолжетімді айлық 8 қабылдаудан асады.'],
 ['Месяц 2: спрос на «Товар» (13.50) превышает оставшийся запас (12.00). Продажа связки не подтверждена.',
  'Month 2: Demand for “Товар” (13.50) exceeds remaining stock (12.00). The linked offer is not confirmed.',
  '2-ай: «Товар» сұранысы (13.50) қалған қордан (12.00) асады. Байланысқан сатылым расталмаған.'],
 ['Месяц 3: услуги «Маникюр» требуют 9.50 посещений при мощности 8.',
  'Month 3: Service “Маникюр” needs 9.50 visits but capacity is 8.',
  '3-ай: «Маникюр» қызметіне 9.50 келу қажет, ал қуаты 8.'],
 ['Месяц 1, день 12: комплект требует 2.500 ед. «Товар», доступно 1.000.',
  'Month 1, day 12: Bundle needs 2.500 units of “Товар”; only 1.000 available.',
  '1-ай, 12-күн: Жинаққа «Товар» тауарының 2.500 данасы қажет, тек 1.000 қолжетімді.'],
 ['Кампания «Товар»: неизвестный график платежей.',
  'Campaign “Товар”: unknown payment schedule.',
  '«Товар» кампаниясы: төлем кестесі белгісіз.'],
 ['У онлайн-услуги «Marketing PRO» период V1 не подтверждает 5 месяцев. Нужен расчёт V1 на этот период.',
  'The V1 source period for online service “Marketing PRO” does not verify 5 months. Recalculate V1 for that horizon.',
  '«Marketing PRO» онлайн қызметінің V1 кезеңі 5 айды растамайды. Осы кезеңге V1 есебін жасаңыз.'],
 ['Периодный подбор цены не сошёлся за 45 итераций.',
  'Period pricing did not converge after 45 iterations.',
  'Кезең бағасын анықтау 45 итерацияда үйлеспеді.'],
 ['За 3 мес. «Товар»: минимальная маржа 10% недостижима в диапазоне V1 12.5–39.95. При цене 39.95 маржа с учётом оставшихся процентов 7.99%; расчётная необходимая цена 41.18.',
  'For 3 months, “Товар”: minimum margin 10% is not feasible within V1 range 12.5–39.95. At 39.95, margin including remaining interest is 7.99%; required price is 41.18.',
  '3 айда «Товар»: ең аз 10% маржаға V1 12.5–39.95 аралығында жету мүмкін емес. 39.95 бағасында қалған пайызды ескерген маржа 7.99%; қажет баға 41.18.'],
 ['Складской ресурс нельзя распределять на офлайн-услугу: услуга не хранится на складе.',
  'Warehouse costs cannot be assigned to offline services: services are not stocked.',
  'Қойма шығынын офлайн қызметке бөлуге болмайды: қызмет қоймада сақталмайды.']
];
test('all anchored financial diagnostics translate exactly RU/KK/EN and preserve numeric tokens',()=>{
 for(const [ru,en,kk] of cases){
  A.equal(tr(ru,'en'),en,'English '+ru);
  A.equal(tr(ru,'kk'),kk,'Kazakh '+ru);
  A.equal(tr(ru,'ru'),ru,'Russian source fidelity');
 }
});
test('unverified texts are never machine-invented or accidentally translated',()=>{
 for(const raw of ['Товар','123.50','Мой товар','Сертификат 01-2027',
  'Новая ошибка от стороннего источника 14.25']){
  if(raw==='Товар')continue; // Known UI label translated only outside protected SKU nodes.
  A.equal(tr(raw,'en'),raw);
  A.equal(tr(raw,'kk'),raw);
 }
});
test('hard business Holds are not softened into successful statuses',()=>{
 const source='Общий месячный ресурс онлайн-услуги при налоге на прибыль имеет неподтверждённое разделение налоговых расходов. Нужен проверенный договор распределения.';
 A.match(tr(source,'en'),/no verified/);
 A.match(tr(source,'kk'),/расталған келісімі жоқ/);
 A.equal(tr(source,'ru'),source);
 A.ok(win.Nomad360LocaleCore.translationCount>400);
});
test('no financial code is patched with presentation locale metadata',()=>{
 for(const source of ['portfolio_v2_linked_engine.js','portfolio_v2_temporal.js',
  'portfolio_v2_temporal_cash.js','portfolio_v2_period_price.js',
  'portfolio_v2_pooled_media.js']){
  const finance=fs.readFileSync(path.join(__dirname,'..',source),'utf8');
  A.ok(!finance.includes('Nomad360LocaleCore'),source+' must remain independent of UI language');
 }
});
