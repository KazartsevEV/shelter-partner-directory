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
 panel.className='nd-v2-section rounded-2xl border border-slate-200 p-4 mb-5';
 panel.innerHTML='<h2 class="nd-v2-title text-xl font-bold">История чеков и совместные покупки</h2>'+
 '<p class="nd-v2-description text-sm mt-2"><strong>Необязательный анализ.</strong> Загрузите оплаченные чеки, чтобы увидеть, какие товары и услуги клиенты выбирают вместе.</p>'+
 '<p class="nd-v2-description text-sm mt-2">Это помогает оценить спрос на комплекты и дополнительные продажи. История показывает фактические сочетания покупок; прогноз V1 меняется только после вашего решения.</p>'+
 '<div class="flex flex-wrap gap-3 mt-4 text-sm">'+
 '<a href="#" data-mba-download="csv" class="nd-v2-section-link font-semibold underline underline-offset-4">Скачать шаблон CSV · 3 чека</a>'+
 '<a href="#" data-mba-download="json" class="nd-v2-section-link font-semibold underline underline-offset-4">Скачать шаблон JSON · 3 чека</a></div>'+
 '<details class="nd-v2-info-panel mt-3 rounded-lg border border-slate-200 p-3 text-sm">'+
 '<summary class="nd-v2-title font-semibold cursor-pointer">Как заполнить шаблон</summary>'+
 '<ol class="nd-v2-description list-decimal pl-5 mt-2 space-y-2">'+
 '<li>Скачайте CSV или JSON с тремя примерами чеков.</li>'+
 '<li>Удалите все три демонстрационных чека и заполните файл своими оплаченными покупками.</li>'+
 '<li>Один order_id — один чек. Для нескольких товаров в чеке используйте несколько строк CSV или items в JSON.</li>'+
 '<li>Указывайте SKU ваших позиций V1, дату, количество, цену, валюту и канал. Отменённые и возвращённые покупки исключаются.</li>'+
 '<li>Сохраните файл и загрузите его ниже. Вы сможете удалить историю из черновика.</li></ol>'+
 '<p class="nd-v2-description text-xs mt-3">CSV: order_id, date, sku_id, quantity, unit_price, currency, channel. JSON Nomad360: orders → items. Данные остаются в браузере.</p>'+
 '</details>'+
 '<div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">'+
 '<label class="nd-v2-field-label block text-sm font-semibold">Формат файла'+
 '<select data-mba-format class="input-field mt-2"><option value="auto">Определить автоматически</option><option value="csv">CSV</option><option value="json">JSON</option></select></label>'+
 '<label class="nd-v2-field-label block text-sm font-semibold">Загрузить заполненный файл'+
 '<input data-mba-file type="file" accept=".csv,.json,text/csv,application/json" class="nd-v2-upload-control block mt-2 text-xs w-full"></label></div>'+
 '<div data-mba-message class="text-xs mt-2" role="status"></div>'+
 (source?'<div class="nd-v2-light-note rounded-lg bg-slate-50 p-3 mt-4 text-xs">'+
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
  '</tbody></table></div><p class="nd-v2-description text-xs mt-2">Confidence = совместные чеки / чеки с основой; lift = confidence / долю чеков с дополнением. Всего в отчёте '+money(data.rules.length)+' направленных правил; показано до 60. Для кортежей A+B → C не делается ложная конвертация в одноякорную связку.</p>':
  '<p class="nd-v2-description text-sm mt-3">Нет подтверждённых совместных покупок в этой выборке. Правила не создаются.</p>'):'')+
 '<button type="button" data-mba-clear class="text-xs text-rose-700 underline mt-4">Удалить загруженную историю из черновика</button>':'')+
 '<p class="nd-v2-description text-xs mt-3">Данные истории показывают совместные покупки. Добавление связки в прогноз требует вашего решения и оценки уже учтённых продаж.</p>';
 const message=(text,bad=false)=>{const el=panel.querySelector('[data-mba-message]');if(el){el.textContent=text;el.className='mt-2 text-xs '+(bad?'text-rose-700':'text-emerald-700')}};
 panel.querySelectorAll('[data-mba-download]').forEach(link=>link.onclick=e=>{
  e.preventDefault();
  try{
   const example=Engine.exampleReceipts(skus.map(s=>s.id));
   const json=e.currentTarget.dataset.mbaDownload==='json';
   const output=json?JSON.stringify(example,null,2):'\uFEFF'+Engine.receiptCsv(example);
   const blob=new Blob([output],{type:json?'application/json;charset=utf-8':'text/csv;charset=utf-8'});
   const url=URL.createObjectURL(blob),anchor=document.createElement('a');
   anchor.href=url;anchor.download='Nomad360-receipts-example.'+(json?'json':'csv');
   document.body.append(anchor);anchor.click();anchor.remove();
   root.setTimeout(()=>URL.revokeObjectURL(url),3000);
  }catch(error){message(error.message||String(error),true);}
 });
 panel.querySelector('[data-mba-file]').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
   const text=await file.text(),selected=panel.querySelector('[data-mba-format]')?.value||'auto',
    parsed=Engine.read(text,selected);
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

