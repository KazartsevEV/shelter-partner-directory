/* Import of actual order histories. The report is observational and never changes
   forecasts until the user explicitly transfers a rule and sets demand overlap. */
(function(root){
'use strict';
const Engine=root.LinkedPortfolioMBAObserved;
// Observed metrics are presentation only; canonical orders and association
// probabilities remain in LinkedPortfolioMBAObserved without locale mutations.
const locale=()=>root.Nomad360LocaleCore?.displayLocale?.()||'ru-RU';
const money=v=>Number.isFinite(Number(v))?
 '<span data-nomad-display-number="'+Number(v)+'" data-nomad-display-fractions="compact">'+
 Number(v).toLocaleString(locale(),{maximumFractionDigits:2})+'</span>':'—';
const pct=v=>Number.isFinite(Number(v))?
 '<span data-nomad-display-number="'+(Number(v)*100)+'" data-nomad-display-fractions="2" data-nomad-display-suffix="%">'+
 (Number(v)*100).toLocaleString(locale(),{minimumFractionDigits:2,maximumFractionDigits:2})+'%</span>':'—';
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#39;');

const dateLabel=iso=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return esc(iso||'—');
 const lang=root.Nomad360LocaleCore?.displayLocale?.()||'ru-RU';
 const rendered=new Intl.DateTimeFormat(lang,{year:'numeric',month:'2-digit',day:'2-digit',
  timeZone:'UTC'}).format(new Date(iso+'T00:00:00Z'));
 return '<time data-nomad-display-date="'+esc(iso)+'" datetime="'+esc(iso)+'">'+rendered+'</time>';
};
function render(state,onChange){
 const target=document.getElementById('linked-basket-panel')||document.getElementById('linked-results');
 if(!target)return;
 let panel=document.getElementById('linked-mba-panel');
 if(!panel){panel=document.createElement('section');panel.id='linked-mba-panel';target.before(panel);}
 const history=state.mbaHistory||null,source=history?.source||null;
 const skus=state.skus||[],name=id=>skus.find(s=>s.id===id)?.name||id;
 // Raw import is retained for traceability. MBA works only over current SKUs:
 // an explicitly removed SKU must not poison recomputation as an unmapped ID.
 const excluded=new Set(history?.excludedRawSkuIds||[]);
 const activeSource=source?{...source,lines:source.lines.filter(l=>!excluded.has(l.rawSku))}:null;
 const data=activeSource?Engine.analyze(activeSource,new Set(skus.map(s=>s.id)),history.mapping||{},
   history.filter||{}):null;
 const raws=activeSource?[...new Set(activeSource.lines.filter(l=>l.quantity>0).map(l=>l.rawSku))].sort():[];
 const unresolved=raws.filter(raw=>!skus.some(s=>s.id===((history.mapping||{})[raw]||raw)));
 const channels=source?[...new Set(source.lines.map(x=>x.channel))].sort():[];
 panel.className='rounded-2xl border border-slate-200 bg-white p-4 mb-5';
 panel.innerHTML='<h2 class="text-xl font-bold">История покупок · наблюдаемая MBA</h2>'+
 '<p class="text-sm text-slate-600 mt-2">Загрузите реальные оплаченные чеки в CSV/JSON. Метрики описывают совместные покупки, но не доказывают причинный прирост продаж и не меняют прогноз без вашего решения.</p>'+
 '<p class="text-xs text-slate-500 mt-2">Столбцы: order_id, date (YYYY-MM-DD), sku_id, quantity, unit_price, currency, channel. Дополнительно: status, line_id, returned_quantity, canceled, returned, buyer_id. Один заказ = один чек. Повторные покупки клиента считаются отдельными чеками. Отмены и возвраты исключаются.</p>'+
 '<label class="block text-sm font-semibold mt-3">Файл чеков (локально, без отправки на сервер)<input data-mba-file type="file" accept=".csv,.json,text/csv,application/json" class="block mt-2 text-xs w-full"></label>'+
 '<div data-mba-message class="text-xs mt-2" role="status"></div>'+
 (source?'<div class="rounded-lg bg-slate-50 p-3 mt-4 text-xs">'+
 'Исходных строк: <b>'+money(source.rawLines)+'</b>; точных дублей line_id: <b>'+money(source.deduplicated)+'</b>; '+
 'подтверждённых чеков в фильтре: <b>'+money(data.N)+'</b>; период: <b>'+dateLabel(data.period.from)+' — '+dateLabel(data.period.to)+
 '</b>; валюты: <b>'+esc(data.currencies.join(', ')||'—')+'</b>. Валюты не суммируются в одну сумму.'+
 (data.ready&&data.aovByCurrency.length?'<br>Наблюдаемый средний чек по валютам (из цены файла, без предположений о НДС): '+
 data.aovByCurrency.map(v=>esc(v.currency)+' '+money(v.averageOrderValue)+
 ' / '+money(v.orders)+' чеков').join('; '):'')+'</div>'+
 '<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">'+
 '<label class="text-xs">Канал<select class="input-field mt-1" data-mba-filter="channel">'+
   [['all','Все'],...channels.map(c=>[c,c])].map(([v,t])=>'<option value="'+esc(v)+'" '+((history.filter?.channel||'all')===v?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label>'+
 '<label class="text-xs">С даты<input class="input-field mt-1" data-mba-filter="from" type="date" value="'+esc(history.filter?.from||'')+'"></label>'+
 '<label class="text-xs">По дату<input class="input-field mt-1" data-mba-filter="to" type="date" value="'+esc(history.filter?.to||'')+'"></label></div>'+
 (unresolved.length?'<div class="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">'+
   '<h3 class="font-bold text-sm text-amber-950">Сопоставьте неизвестные SKU ('+unresolved.length+')</h3>'+
   unresolved.map(raw=>'<label class="block text-xs mt-2">'+esc(raw)+
    '<select data-mba-map="'+esc(raw)+'" class="input-field mt-1"><option value="">— выберите позицию V1 —</option>'+
    skus.map(s=>'<option data-nomad-no-translate value="'+esc(s.id)+'" '+((history.mapping||{})[raw]===s.id?'selected':'')+'>'+esc(s.name)+' · '+esc(s.id)+'</option>').join('')+
    '</select></label>').join('')+'</div>':'')+
 (data.errors.length?'<div class="mt-3 text-sm text-rose-800">'+data.errors.map(esc).join('; ')+'</div>':'')+
 (data.ready?
  (data.rules.length?'<div class="overflow-x-auto mt-3"><table class="min-w-full text-xs"><thead><tr>'+
  ['Основа → дополнение','Вместе, чеков','Support совместной корзины','Confidence','Lift','Сценарий']
  .map(h=>'<th class="text-right p-2">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+
  data.rules.slice(0,60).map((r,i)=>'<tr class="border-t border-slate-200">'+
  '<td class="p-2" data-nomad-no-translate>'+esc(r.antecedent.map(name).join(' + ')+' → '+name(r.consequent))+'</td>'+
  '<td class="text-right p-2">'+money(r.count)+' / '+money(r.N)+'</td>'+
  '<td class="text-right p-2">'+pct(r.support)+'</td>'+
  '<td class="text-right p-2">'+pct(r.confidence)+'</td>'+
  '<td class="text-right p-2">'+money(r.lift)+'</td>'+
  '<td class="p-2">'+(r.antecedent.length===1?
   '<label class="block text-xs">Пересечение с V1, % (введите вручную)<input type="number" min="0" max="100" step="any" class="input-field mt-1" data-mba-overlap="'+i+'" placeholder="0–100"></label>'+
   '<button type="button" data-mba-transfer="'+i+'" class="text-emerald-800 underline mt-1">Утвердить сценарий</button>':
   'Кортеж · только анализ')+'</td></tr>').join('')+
  '</tbody></table></div><p class="text-xs text-slate-500 mt-2">Confidence = совместные чеки / чеки с основой; lift = confidence / долю чеков с дополнением. Всего в отчёте '+money(data.rules.length)+' направленных правил; показано до 60. Для кортежей A+B → C не делается ложная конвертация в одноякорную связку.</p>':
  '<p class="text-sm text-slate-500 mt-3">Нет подтверждённых совместных покупок в этой выборке. Правила не создаются.</p>'):'')+
 '<button type="button" data-mba-clear class="text-xs text-rose-700 underline mt-4">Удалить загруженную историю из черновика</button>':'')+
 '<p class="text-xs text-slate-500 mt-3">Перенос правила добавляет cross-sell по наблюдаемой confidence, но процент уже самостоятельных продаж дополнения нужно ввести вручную. Пока вы не введёте её, перенос недоступен. История и прогноз V1 остаются разными источниками.</p>';
 const message=(text,bad=false)=>{const el=panel.querySelector('[data-mba-message]');if(el){el.textContent=text;el.className='mt-2 text-xs '+(bad?'text-rose-700':'text-emerald-700')}};
 panel.querySelector('[data-mba-file]').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
   const text=await file.text(),parsed=Engine.read(text);
   // No source is written until every record passes strict validation.
   const mappings=source?(history.mapping||{}):{};
   onChange({mbaHistory:{source:parsed,mapping:{...mappings},filter:{channel:'all',from:'',to:''}}},true);
  }catch(error){message(error.message||String(error),true);}
 };
 panel.querySelectorAll('[data-mba-map]').forEach(select=>select.onchange=e=>{
  const next=JSON.parse(JSON.stringify(history)),raw=e.target.dataset.mbaMap;
  if(e.target.value)next.mapping[raw]=e.target.value;else delete next.mapping[raw];
  onChange({mbaHistory:next},true);
 });
 panel.querySelectorAll('[data-mba-filter]').forEach(input=>input.onchange=e=>{
  const next=JSON.parse(JSON.stringify(history));
  next.filter=next.filter||{};next.filter[e.target.dataset.mbaFilter]=e.target.value;
  onChange({mbaHistory:next},true);
 });
 const clear=panel.querySelector('[data-mba-clear]');
 if(clear)clear.onclick=()=>onChange({mbaHistory:null},true);
 panel.querySelectorAll('[data-mba-transfer]').forEach(button=>button.onclick=e=>{
  const rule=data?.rules[Number(e.target.dataset.mbaTransfer)];
  if(!rule||rule.antecedent.length!==1)return;
  const input=panel.querySelector('[data-mba-overlap="'+e.target.dataset.mbaTransfer+'"]');
  const entered=String(input?.value??'').trim(),overlap=Number(entered);
  if(!entered||!Number.isFinite(overlap)||overlap<0||overlap>100){
   message('Перед переносом укажите оценку пересечения 0–100% вручную. Из истории заказов нельзя вычислить причинный uplift.',true);return;
  }
  const anchor=rule.antecedent[0],addon=rule.consequent;
  const offers=JSON.parse(JSON.stringify(state.offers||[]));
  if(offers.some(x=>x.anchorSkuId===anchor&&x.items?.some(p=>p.skuId===addon))){
   message('Такая направленная связь уже есть в прогнозе. Нельзя учесть покупку дважды.',true);return;
  }
  if(offers.some(x=>x.anchorSkuId===anchor)){
   message('Для этой основной позиции уже существует связка. Одни и те же покупатели могут одновременно купить несколько дополнений: объедините их в один кортеж вручную, чтобы не посчитать одну корзину дважды.',true);return;
  }
  const seq=1+Math.max(0,...offers.map(x=>Number(String(x.id).replace(/\D/g,''))||0));
  offers.push({id:'observed-'+seq,mode:'cross_sell',anchorSkuId:anchor,
   attachPct:Number((rule.confidence*100).toFixed(4)),overlapPct:overlap,
   observedRuleId:JSON.stringify([rule.antecedent,rule.consequent]),
   observedSnapshot:{N:rule.N,count:rule.count,confidence:rule.confidence,lift:rule.lift,
     period:{...data.period},channels:[...data.channels]},
   items:[{skuId:addon,qty:1}]});
  onChange({offers},true);
 });
}
root.LinkedPortfolioV2MBAUI=Object.freeze({render});
})(window);
