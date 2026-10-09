/* Linked V2 UI: no duplicated unit-cost or funnel inputs. */
(function(root){
'use strict';
const Engine=root.LinkedPortfolioV2Engine;
const storageKey='marketingCalcLinkedPortfolioV2';
const kinds=[['premises','Помещение / аренда'],['workers','Работники / производство'],
 ['warehouse','Общий склад'],['equipment','Оборудование'],['certification','Сертификат'],
 ['salesStaff','Команда продаж'],['marketingManager','Ведение рекламы'],
 ['campaign','Общий рекламный бюджет'],['website','Сайт / платформа'],
 ['hosting','Хостинг'],['domain','Домен'],['content','Контент'],['other','Другие расходы']];
const pools=[['none','Новый расход (не учитывался в V1)'],
 ['unitCost','Уже в себестоимости SKU'],['salesFixed','Уже в расходах на продажи SKU'],
 ['marketingManagement','Уже в гонораре маркетолога SKU'],
 ['adBudget','Уже в рекламном бюджете SKU']];
const money=v=>Number.isFinite(Number(v))?Number(v).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
const safe=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const num=v=>v===''?0:Number(v)||0;
let state=null,sequence=1;
function read(){try{const x=JSON.parse(localStorage.getItem(storageKey));return x?.version===3&&x.source==='v1-calculated'&&Array.isArray(x.skus)?x:null}catch(_){return null}}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));updateEntry();return true}catch(_){return false}}
function updateEntry(){
 const el=document.getElementById('portfolio-v2-linked-resume-home'),saved=read();
 if(el){el.hidden=!saved;el.classList.toggle('hidden',!saved);}
}
function resetSequence(){sequence=1+Math.max(0,...(state.resources||[]).map(r=>Number(String(r.id).replace(/\D/g,''))||0));}
function enter(){
 root.showOnly('portfolio-v2-screen');
 const host=document.getElementById('portfolio-v2-root');
 if(!host)return;
 host.replaceChildren();
 render();
}
function importFromV1(payload){
 const fresh=Engine.fromV1(payload),prior=state||read();
 // Preserve individually imported online services when the product portfolio
 // is re-imported. Each online SKU retains its own owner-tax provenance.
 if(prior)fresh.skus.push(...prior.skus.filter(s=>s.source==='online-service'&&
   !fresh.skus.some(x=>x.id===s.id)).map(s=>JSON.parse(JSON.stringify(s))));
 // Reimporting V1 after adding another item must not wipe the user's portfolio.
 // Preserve settings only for the exact overlapping canonical IDs; never silently
 // grant newly imported products access to old shared resources or offer tuples.
 if(prior){
  const allowed=new Set(fresh.skus.map(s=>s.id));
  const shared=new Set((prior.skus||[]).filter(s=>allowed.has(s.id)).map(s=>s.id));
  if(shared.size){
   fresh.resources=(prior.resources||[]).filter(r=>
     (r.skuIds||[]).some(id=>allowed.has(id))).map(r=>{
      const keep=new Set((r.skuIds||[]).filter(id=>allowed.has(id)));
      const copy=JSON.parse(JSON.stringify(r));
      copy.skuIds=Array.from(keep);
      for(const prop of ['includedBySku','usage','loadPerUnit'])
       if(copy[prop])copy[prop]=Object.fromEntries(Object.entries(copy[prop])
         .filter(([id])=>keep.has(id)));
      return copy;
     });
   fresh.offers=(prior.offers||[]).filter(r=>
      allowed.has(r.anchorSkuId)&&Array.isArray(r.items)&&
      r.items.length>0&&r.items.every(item=>allowed.has(item.skuId)))
      .map(r=>JSON.parse(JSON.stringify(r)));
   fresh.skus.forEach(s=>{
    const previous=prior.skus.find(x=>x.id===s.id);
    if(previous)s.discountSelected=Math.min(s.maxDiscountPct,
       Math.max(0,Number(previous.discountSelected)||0));
   });
  }
 }
 fresh.mbaHistory=prior?.mbaHistory||null;
 state=fresh;resetSequence();save();enter();
}
function appendOnline(sku){
 if(!sku||sku.source!=='online-service'||!sku.onlineProvenance)
  throw Error('Ожидается проверенный расчёт онлайн-услуги V1.');
 const previous=state||read();
 const next=previous?JSON.parse(JSON.stringify(previous)):Engine.fromV1({
   tax:sku.ownerTax,skus:[sku]});
 if(previous){
   if(next.skus.some(s=>s.id===sku.id))throw Error('Такой ID услуги уже включён в портфель.');
   next.skus.push({...JSON.parse(JSON.stringify(sku)),priceSelected:sku.priceMax,discountSelected:0});
 }
 next.lastOrigin='online';
 state=next;resetSequence();save();enter();
}
function resume(){const previous=read();if(!previous)return false;state=previous;state.offers=state.offers||[];resetSequence();enter();return true;}
function options(items,value){return items.map(([v,label])=>'<option value="'+safe(v)+'" '+(v===value?'selected':'')+'>'+safe(label)+'</option>').join('');}
function field(label,path,value,extra=''){
 return '<label class="block min-w-0 text-xs font-semibold text-slate-700">'+safe(label)+
 '<input data-linked-path="'+safe(path)+'" type="number" step="0.01" min="0" class="input-field mt-1" value="'+safe(value)+'" '+extra+'></label>';
}
function resourceCard(r,i){
 const skuCards=state.skus.filter(s=>r.kind!=='warehouse'||!['offline-service','online-service'].includes(s.source)).map(s=>{
  const checked=r.skuIds.includes(s.id);
  const baseline=r.pool==='unitCost'?num(s.unitCost)*num(s.forecastUnitsPerMonth):
   r.pool==='salesFixed'?num(s.salesFixedMonthly):
   r.pool==='marketingManagement'?num(s.adManagement):
   r.pool==='adBudget'?num(s.adBudget):0;
  return '<div class="rounded-lg border border-slate-200 p-3 min-w-0">'+
   '<label class="flex gap-2 items-center text-sm"><input type="checkbox" data-linked-member="'+i+'" value="'+safe(s.id)+'" '+(checked?'checked':'')+'><b>'+safe(s.name)+'</b></label>'+
   (checked?'<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">'+
    (r.pool!=='none'?field('Уже учтено в V1, у.е. / мес (доступно '+money(baseline)+')',
      'resources.'+i+'.includedBySku.'+s.id,r.includedBySku?.[s.id]??0):'')+
    (r.allocation==='usage'?(r.usageMode==='per-unit'?
      field('Ресурс на 1 продажу / посещение','resources.'+i+'.loadPerUnit.'+s.id,r.loadPerUnit?.[s.id]??0):
      field('Загрузка этого товара (ед.)','resources.'+i+'.usage.'+s.id,r.usage?.[s.id]??0)):'')+
   '</div>':'')+'</div>';
 }).join('');
 return '<article class="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 mt-4" data-linked-resource="'+i+'">'+
 '<div class="flex justify-between gap-3 items-center"><b>'+safe(r.label||'Новый ресурс')+'</b>'+
 '<button type="button" data-linked-delete="'+i+'" class="text-rose-700 underline text-sm">Удалить</button></div>'+
 '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">'+
 '<label class="text-xs font-semibold text-slate-700">Название<input data-linked-path="resources.'+i+'.label" type="text" class="input-field mt-1" value="'+safe(r.label)+'"></label>'+
 '<label class="text-xs font-semibold text-slate-700">Тип ресурса<select data-linked-path="resources.'+i+'.kind" class="input-field mt-1">'+options(kinds,r.kind)+'</select></label>'+
 field('Один реальный платёж, у.е.','resources.'+i+'.amount',r.amount)+
 '<label class="text-xs font-semibold text-slate-700">Периодичность<select data-linked-path="resources.'+i+'.cadence" class="input-field mt-1">'+options([['monthly','Ежемесячно'],['once','Разово']],r.cadence)+'</select></label>'+
 '<label class="text-xs font-semibold text-slate-700">Что заменить в старых расчётах?<select data-linked-path="resources.'+i+'.pool" class="input-field mt-1">'+options(pools,r.pool)+'</select></label>'+
 (r.pool==='unitCost'?'<label class="text-xs font-semibold text-slate-700">Из какого платежа V1 вычесть старый расход?<select data-linked-path="resources.'+i+'.cashOrigin" class="input-field mt-1">'+options([['','Выберите исходный платёж'],['materials','Закупка / материалы'],['production','Производство'],['fulfillment','Доставка / исполнение заказа']],r.cashOrigin||'')+'</select></label>':'')+
 '<label class="text-xs font-semibold text-slate-700">Распределять по<select data-linked-path="resources.'+i+'.allocation" class="input-field mt-1">'+options([['revenue','Прогнозной выручке V1'],['usage','Реальной загрузке']],r.allocation)+'</select></label>'+
 (r.allocation==='usage'?'<label class="block text-xs">Как считать загрузку<select data-linked-path="resources.'+i+'.usageMode" class="input-field mt-1">'+
  options([['fixed','Вручную (старые черновики)'],['per-unit','На единицу продажи / посещения']],r.usageMode||'fixed')+'</select></label>'+
  field('Максимальная месячная мощность (0 — не ограничена)','resources.'+i+'.capacity',r.capacity):'')+
 '</div>'+
 '<p class="text-xs text-slate-600 mt-3">Укажите, какими товарами используется ресурс. Если его стоимость уже была включена в V1, внесите первоначальные суммы по товарам — они будут заменены одним реальным платежом. Нулевые значения ничего не списывают.</p>'+
 '<div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">'+skuCards+'</div>'+
 (r.kind==='certification'&&r.skuIds.length>1?'<div class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">'+
 '<p class="text-xs">Один сертификат на несколько SKU допустим только при совпадении области действия.</p>'+
 '<label class="block text-xs mt-2">Страна, товарные группы, назначение<input type="text" data-linked-path="resources.'+i+'.validFor" class="input-field mt-1" value="'+safe(r.validFor||'')+'"></label>'+
 '<label class="block text-xs mt-2">Действителен до<input type="date" data-linked-path="resources.'+i+'.validUntil" class="input-field mt-1" value="'+safe(r.validUntil||'')+'"></label>'+
 '<label class="flex gap-2 text-sm items-center mt-2"><input type="checkbox" data-linked-path="resources.'+i+'.confirmedCoverage" '+(r.confirmedCoverage?'checked':'')+'>Проверил покрытие всех товаров</label></div>':'')+
 '</article>';
}
function render(){
 const host=document.getElementById('portfolio-v2-root');if(!host||!state)return;
 const scenario=Engine.build(state);
 const byId=new Map((scenario.items||[]).map(v=>[v.id,v]));
 const skus=state.skus.map((s,i)=>'<article class="rounded-xl border border-slate-200 bg-white p-4" data-linked-sku="'+i+'">'+
 '<div class="font-bold text-slate-900 text-lg" data-nomad-no-translate>'+safe(s.name)+'</div>'+
 '<div class="text-xs text-slate-500">'+safe({own:'Делаю сам',resale:'Покупаю у других',dropship:'Дропшиппинг','offline-service':'Офлайн-услуга','online-service':'Онлайн-услуга'}[s.source]||s.source)+' · ID '+safe(s.id)+'</div>'+
 '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-slate-700 mt-3">'+
 [['Себестоимость V1 / шт.',money(s.unitCost)],['Прогноз V1 / мес.',money(s.forecastUnitsPerMonth)],
 ['Реклама V1 / мес.',money(s.adBudget)],['CAC V1',money(s.baseCac)],['Цена от',money(s.priceMin)],
 ['Цена до',money(s.priceMax)],['Дельта цены',money(num(s.priceMax)-num(s.priceMin))]].map(([label,value])=>
 '<div class="rounded-lg bg-slate-50 p-2"><div class="text-xs text-slate-500">'+label+'</div><b>'+value+'</b></div>').join('')+'</div>'+
 '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">'+
 field('Плановая скидка покупателю, % (макс. '+money(s.maxDiscountPct)+'%)','skus.'+i+'.discountSelected',s.discountSelected,
 'max="'+safe(s.maxDiscountPct)+'"')+'</div>'+
 '<div class="rounded-xl bg-emerald-50 text-emerald-900 p-3 mt-3" data-linked-live="'+safe(s.id)+'">'+
 '<div class="text-xs">Автоматическая цена прайса V2</div><div class="text-xl font-black" data-linked-price-list>'+money(byId.get(s.id)?.priceList)+'</div>'+
 '<div class="text-xs mt-2">Покупатель платит за отдельную позицию (без скидки комбо)</div><div class="text-xl font-black" data-linked-price-paid>'+money(byId.get(s.id)?.priceGross)+'</div></div>'+
 '<div class="text-xs text-slate-700 mt-2" data-linked-unit-meta></div>'+
 '<p class="text-xs text-slate-500 mt-2">Цену рассчитывает V2 по продажам, денежному весу, рекламной и общей нагрузке. Диапазон цены V1 не меняется.</p>'+
 '</article>').join('');
 host.innerHTML=
 '<div class="rounded-2xl bg-emerald-900 text-white p-5 mb-5">'+
 '<div class="text-xs font-semibold uppercase tracking-widest text-emerald-200">V2 · Связанный портфель</div>'+
 '<h1 class="text-2xl font-black mt-2">Портфель товаров и услуг</h1>'+
 '<p class="text-sm text-emerald-100 mt-2">Цены, прогнозы, рекламные бюджеты, себестоимость и налоги взяты из V1. Повторно их заполнять не нужно.</p>'+
 '<div class="flex flex-wrap gap-2 mt-4">'+
 '<button type="button" data-linked-back class="rounded-lg border border-white/40 p-2 text-sm font-bold">← К расчёту V1</button>'+
 '<button type="button" data-linked-save class="rounded-lg bg-white text-emerald-900 p-2 text-sm font-bold">Сохранить портфель</button></div>'+
 '<div id="linked-save-message" class="text-xs mt-2">Черновик хранится в этом браузере</div></div>'+
 '<section class="mb-5"><h2 class="text-xl font-bold mb-2">1. Экономика товаров и услуг V1</h2>'+
 '<p class="text-xs text-slate-600 mb-3">Каждая позиция сохраняет ID, себестоимость, прогноз и ценовой диапазон из V1.</p>'+
 '<div class="grid grid-cols-1 xl:grid-cols-2 gap-3">'+skus+'</div></section>'+
 '<section class="rounded-2xl border border-slate-200 bg-white p-4 mb-5">'+
 '<h2 class="text-xl font-bold">2. Общие ресурсы</h2>'+
 '<p class="text-sm text-slate-600 mt-2">Ресурсы общие для товаров и услуг; складские расходы относятся только к товарам. Списывайте старые начисления V1, чтобы не учитывать их повторно.</p>'+
 '<div id="linked-resources">'+state.resources.map(resourceCard).join('')+'</div>'+
 '<button type="button" data-linked-add class="w-full rounded-lg border-2 border-dashed border-indigo-300 text-indigo-800 font-bold p-3 mt-4">+ Добавить общий ресурс</button></section>'+
 '<section class="rounded-2xl border border-sky-200 bg-sky-50 p-4 mb-5" data-temporal-controls>'+
 '<h2 class="text-lg font-bold text-slate-900">Помесячный прогноз · остатки и мощности</h2>'+
 '<p class="text-sm text-slate-600 mt-2">Повторение спроса V1 в следующих месяцах — ваше сценарное допущение, а не подтверждённые будущие заказы.</p>'+
 '<div class="max-w-xs mt-3">'+field('Горизонт, месяцев (1–120)','forecastMonths',state.forecastMonths??1,'min="1" max="120" step="1"')+'</div>'+
 '<label class="flex items-start gap-2 text-sm text-slate-800 mt-3"><input type="checkbox" data-linked-path="recurringDemandApproved" '+(state.recurringDemandApproved===true?'checked':'')+'><span>Подтверждаю повторение месячного спроса V1 в пределах выбранного горизонта.</span></label>'+
 '<div id="linked-temporal-result" class="mt-3 text-sm text-slate-700"></div></section>'+
 '<section id="linked-results" class="rounded-2xl bg-slate-900 text-white p-5 mb-6" aria-live="polite"></section>';
 root.LinkedPortfolioV2BasketUI?.render(state,(offers,structural)=>{
   state.offers=offers;save();if(structural)render();else updateResult();
 });
 root.LinkedPortfolioV2MBAUI?.render(state,(patch,structural)=>{
   if(Object.prototype.hasOwnProperty.call(patch,'mbaHistory'))state.mbaHistory=patch.mbaHistory;
   if(Object.prototype.hasOwnProperty.call(patch,'offers'))state.offers=patch.offers;
   save();if(structural)render();else updateResult();
 });
 updateResult();
}
function updateResult(){
 const el=document.getElementById('linked-results');if(!el||!state)return;
 const out=Engine.build(state);
 const preview=document.getElementById('linked-temporal-result');
 if(preview){
  const plan=out.temporal;
  if(plan?.ready){
   const names=Object.fromEntries(state.skus.map(s=>[s.id,s.name]));
   const values=entries=>Object.entries(entries).map(([id,quantity])=>
    safe(names[id]||id)+': '+money(quantity)).join('; ');
   const rows=plan.months.map(m=>'<tr class="border-t border-slate-200">'+
    '<td class="p-2">'+m.month+'</td><td class="p-2 text-right">'+money(m.units)+'</td>'+
    '<td class="p-2">'+values(m.orders)+'</td>'+
    '<td class="p-2">'+values(m.remainingStock)+'</td></tr>').join('');
   preview.innerHTML='<p class="text-emerald-800 font-bold">Остатки и мощности проверены по месяцам.</p>'+
    '<div class="overflow-x-auto mt-2"><table class="min-w-full text-xs"><thead><tr>'+
    '<th class="p-2">Месяц</th><th class="p-2">Количество</th><th class="p-2">Продажи</th>'+
    '<th class="p-2">Остатки</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<p class="mt-2 text-xs text-amber-800">Этот объёмный прогноз используется в Cash Flow ниже. Денежные потоки учитывают только выбранный горизонт и сроки фактического поступления денег.</p>';
  }else preview.textContent=Number(state.forecastMonths??1)>1?
   'Для многомесячного прогноза требуется подтверждение повторения спроса и проверка запасов.':
   'По умолчанию используется исходный 30-дневный прогноз V2.';
 }
 root.LinkedPortfolioV2BasketUI?.updateResult(out);
 for(const node of document.querySelectorAll('[data-linked-live]')){
  const sku=out.items?.find(s=>s.id===node.dataset.linkedLive);
  const list=node.querySelector('[data-linked-price-list]');
  const paid=node.querySelector('[data-linked-price-paid]');
  if(list)list.textContent=money(sku?.priceList);
  if(paid)paid.textContent=money(sku?.priceGross);
  const meta=node.closest('[data-linked-sku]')?.querySelector('[data-linked-unit-meta]');
  if(meta)meta.textContent=sku?
    'Цена для целевой маржи: '+money(sku.requiredTargetPrice)+
    '; для минимальной: '+money(sku.requiredFloorPrice)+
    '; денежная доля: '+money(sku.revenueWeight*100)+'%; '+
    ({TARGET_MET:'целевая маржа достигнута',MINIMUM_ONLY:'минимальная маржа достигнута',INFEASIBLE:'минимальная маржа недостижима',LOSS:'Фиксированная цена V1 убыточна',FIXED_V1:'Фиксированная цена/комиссия V1 сохранена',PROVISIONAL:'предварительно: амортизация не подтверждена'}[sku.status]||'ожидает проверки'):
    'Заполните общие ресурсы.';
 }
 document.querySelectorAll('[data-linked-error]').forEach(x=>x.remove());
 document.querySelectorAll('[data-linked-path][aria-invalid]').forEach(x=>x.removeAttribute('aria-invalid'));
 if(!out.ready){
  el.innerHTML='<h2 class="text-xl font-black">Портфель пока экономически не подтверждён</h2>'+
   '<p class="text-sm mt-2">Расчёт V1 остаётся неизменным. V2 не повышает цену за пределы диапазона — исправьте распределение или расходы.</p>'+
   '<div class="mt-3 space-y-2">'+[...new Set(out.errors||[])].map(message=>
    '<div class="rounded-lg bg-rose-100 p-3 text-rose-900 text-sm">'+safe(message)+'</div>').join('')+'</div>'+
   (out.items?.length?'<div class="mt-3 space-y-2">'+out.items.map(item=>
    '<div class="border border-white/25 rounded-lg p-3 text-sm"><b>'+safe(item.name)+'</b>: диапазон V1 '+
    money(item.priceMin)+'–'+money(item.priceMax)+', цена для минимальной маржи '+
    money(item.requiredFloorPrice)+', максимально допустимая цена '+money(item.priceList)+
    ', итоговая маржа '+money(item.actualAfterTaxMargin)+'%</div>').join('')+'</div>':'');
  for(const issue of out.fieldErrors||[]){
   const field=Array.from(document.querySelectorAll('[data-linked-path]')).find(x=>x.dataset.linkedPath===issue.path);
   const m=/^resources\.(\d+)/.exec(issue.path),n=/^skus\.(\d+)/.exec(issue.path);
   const parent=field?.closest('label')||field?.parentElement||
    (m?document.querySelector('[data-linked-resource="'+m[1]+'"]'):null)||
    (n?document.querySelector('[data-linked-sku="'+n[1]+'"]'):null);
   if(parent){
    if(field)field.setAttribute('aria-invalid','true');
    const note=document.createElement('div');note.dataset.linkedError='yes';
    note.className='mt-2 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 p-2 text-xs';
    note.textContent=issue.message;parent.append(note);
   }
  }
  root.Nomad360UI?.syncPortfolioActions(out);
  return;
 }
 const t=out.totals,cf=out.cashflow;
 const wholeStockCycle=out.items.length>0&&
  out.items.every(s=>['own','resale'].includes(s.source))&&
  out.resources.every(r=>r.kind!=='campaign')&&
  !(Array.isArray(state.offers)&&state.offers.length);
 const periodOptimized=out.cashflow?.periodPnl?.pricePolicy==='full-period-actual-sku-margin-pricing';
 const cards=[['Продано позиций за 30 дней',t.forecast],['Выручка без НДС / 30 дней',t.revenue],
  ['Рекламный бюджет / 30 дней',t.media],['Себестоимость / 30 дней',t.cogs],
  ['Общие расходы / мес.',t.monthlyResources],['EBITDA / 30 дней',t.ebitda],
  ['Налог бизнеса / 30 дней',t.tax],['Чистая прибыль / 30 дней',t.netProfit]];
 const priceTable='<div class="overflow-x-auto mt-3"><table class="min-w-full text-xs"><thead><tr>'+
  ['Товар / услуга','Диапазон V1','Прайс V2','Скидка','Цена вне набора','Прогноз, ед.','Денежный вес','Реклама',periodOptimized?'Маржа за период':'Маржа / 30 дней'].map(label=>
   '<th class="p-2 text-right">'+label+'</th>').join('')+'</tr></thead><tbody>'+
  out.items.map(s=>'<tr class="border-t border-white/20">'+
   [safe(s.name),money(s.priceMin)+'–'+money(s.priceMax),money(s.priceList),
    money(s.discountSelected)+'%',money(s.priceGross),money(s.forecastOrders),
    money(s.revenueWeight*100)+'%',money(s.adBudgetEffective),s.actualAfterTaxMargin===null?'нет продаж':money(s.actualAfterTaxMargin)+'%']
   .map((v,i)=>'<td class="p-2 text-right whitespace-nowrap"'+(i===0?' data-nomad-no-translate':'')+'>'+v+'</td>').join('')+'</tr>').join('')+
  '</tbody></table></div>';
 const resources='<div class="mt-2 space-y-2 text-xs">'+out.resources.map(r=>
  '<div class="rounded-lg bg-white/10 p-3">'+
   '<b>'+safe(r.label)+' — '+money(r.amount)+(r.cadence==='once'?' разово':' / мес.')+'</b>'+
   '<div>Заменённые начисления из V1: '+money(r.previousTotal)+'</div>'+
   (r.usageMode==='per-unit'?'<div>Мощность ресурса: '+money(r.projectedLoad)+
     ' / '+(num(r.capacity)>0?money(r.capacity):'без лимита')+
     ', остаток '+(r.remainingCapacity===null?'—':money(r.remainingCapacity))+'</div>':'')+
   Object.entries(r.bySku).map(([id,amount])=>
    '<div>'+safe(out.items.find(s=>s.id===id)?.name||id)+': '+money(amount)+'</div>').join('')+
  '</div>').join('')+'</div>';
 const period=cf.periodPnl;
 const periodPanel=period?.ready?
  '<section class="mt-5 rounded-lg border border-white/25 p-3">'+
  '<h3 class="font-bold">Экономика за '+period.horizonMonths+' мес. · '+(periodOptimized?'расчётная цена за весь период':'по месячным ценам V2')+'</h3>'+
  '<p class="text-xs text-slate-200 mt-2">Цена каждого SKU рассчитана по фактической марже за выбранный период, включая долю рекламы, расходов, проценты и налоги. Все цены в пределах V1. Резерв и тело кредита влияют на денежную потребность, но не являются расходом прибыли. Карточки / 30 дней выше — базовая месячная модель, а не сумма периода.</p>'+
  '<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">'+
  [['Выручка без НДС',money(period.revenue)],['EBITDA',money(period.ebitda)],
   ['Налог начислен',money(period.taxAccrued)],['Чистая прибыль',money(period.netProfit)],
   ['Маржа за период',period.netMargin===null?'не определена':money(period.netMargin)+'%'],
   ['Налог начислен − уплачен',money(period.taxTimingDifference)],
   ['Проценты после горизонта',money(period.postHorizonInterest)]].map(([label,value])=>
    '<div class="bg-white/10 p-2 rounded text-xs">'+safe(label)+': <b>'+safe(value)+'</b></div>').join('')+'</div>'+
  '<div class="overflow-x-auto mt-3"><table class="w-full min-w-[750px] text-xs"><thead><tr>'+
  ['Месяц','Выручка','Себестоимость','Реклама','Общие расходы','Фикс. услуги','EBITDA',
   'Амортизация','Проценты','Налог начислен','Прибыль'].map(s=>
   '<th class="p-2 text-right">'+s+'</th>').join('')+'</tr></thead><tbody>'+
  period.months.map(m=>'<tr class="border-t border-white/20">'+
   [m.month,m.revenue,m.cogs,m.marketing,m.operatingShared,m.serviceFixed,
    m.ebitda,m.amort,m.interest,m.taxAccrued,m.netProfit].map((v,i)=>
    '<td class="p-2 text-right">'+(i===0?v:money(v))+'</td>').join('')+'</tr>').join('')+
  '</tbody></table></div>'+
  (periodOptimized?'<h4 class="font-semibold mt-4">Проверка цены и маржи SKU за весь период</h4>'+
    '<div class="overflow-x-auto mt-2"><table class="w-full min-w-[640px] text-xs"><thead><tr>'+
    ['Товар / услуга','Цена за период','Маржа за период','Статус','Для минимума','Для цели'].map(x=>'<th class="p-2 text-right">'+x+'</th>').join('')+'</tr></thead><tbody>'+
    (period.priceDiagnostics||[]).map(d=>'<tr class="border-t border-white/20">'+
      [safe(out.items.find(x=>x.id===d.id)?.name||d.id),money(d.price),
       d.margin===null?'нет продаж':money(d.margin)+'%',safe(d.status),
       Number.isFinite(d.requiredFloorPrice)?money(d.requiredFloorPrice):'недостижима',
       Number.isFinite(d.requiredTargetPrice)?money(d.requiredTargetPrice):'недостижима'].map(x=>
         '<td class="p-2 text-right whitespace-nowrap">'+x+'</td>').join('')+'</tr>').join('')+
    '</tbody></table></div>':'')+
  (period.onceAssetAmortizationUnverified?
   '<p class="mt-2 text-xs text-amber-200">Есть разовые активы без подтверждённой амортизации; полная бухгалтерская прибыль пока не подтверждена.</p>':'')+
  '</section>':'';
 const advertising=out.temporal?.months?.some(m=>m.media)?
  '<h3 class="font-bold mt-5">Общая реклама по месяцам · реальные платежи и спрос</h3>'+
  '<p class="text-xs text-slate-200 mt-2">При распродаже товара его доля прекращается. Нераспределённые деньги остаются фактическим расходом кампании. Нераспределённые платежи входят в прибыль и цену всего выбранного периода.</p>'+
  '<div class="overflow-x-auto mt-3"><table class="w-full min-w-[550px] text-xs"><thead><tr>'+
  ['Месяц','Оплачено','По SKU','Нераспределено','Неисполненный спрос, ед.','Кампании'].map(s=>
   '<th class="text-right p-2">'+s+'</th>').join('')+'</tr></thead><tbody>'+
  out.temporal.months.map(m=>'<tr class="border-t border-white/20">'+
    '<td class="p-2 text-right">'+m.month+'</td>'+
    '<td class="p-2 text-right">'+money(m.media.ownerPaid)+'</td>'+
    '<td class="p-2 text-right">'+Object.keys(m.media.allocatedBySku).map(id=>
      safe(out.items.find(s=>s.id===id)?.name||id)+': '+
      money(num(m.media.allocatedBySku[id])+num(m.media.retainedBySku[id]))).join('; ')+'</td>'+
    '<td class="p-2 text-right">'+money(m.media.unattributed)+'</td>'+
    '<td class="p-2 text-right">'+Object.entries(m.unservedIndependent||{}).filter(([,qty])=>num(qty)>.001).map(([id,qty])=>
      safe(out.items.find(s=>s.id===id)?.name||id)+': '+money(qty)).join('; ')+'</td>'+
    '<td class="p-2 text-right">'+Object.entries(m.media.paidByCampaign).map(([id,amount])=>
      safe(state.resources.find(r=>r.id===id)?.label||id)+': '+money(amount)).join('; ')+'</td>'+
   '</tr>').join('')+'</tbody></table></div>':'';
 const flow='<div class="overflow-x-auto mt-3"><table class="min-w-full text-xs"><thead><tr>'+
  ['Месяц','Поступления без НДС','Расходы','Налог бизнеса','Проценты','Тело кредита','Деньги владельца','CF','Остаток','Живые деньги'].map(s=>
   '<th class="text-right p-2">'+s+'</th>').join('')+'</tr></thead><tbody>'+
  cf.months.map(m=>'<tr class="border-t border-white/20">'+
   [m.month,money(m.receipt),money(m.operatingOutflow),money(m.tax),money(m.interest),
    money(m.principalRepaid),money(m.ownerCapital),money(m.cashFlow+m.ownerCapital),
    money(m.cumulative),money(m.freeCumulative)]
    .map(v=>'<td class="p-2 text-right whitespace-nowrap">'+v+'</td>').join('')+'</tr>').join('')+
  '</tbody></table></div>';
 el.innerHTML='<h2 class="text-xl font-black">4. Прайс и экономика портфеля</h2>'+
 '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">'+cards.map(([label,value])=>
  '<div class="rounded-lg bg-white/10 p-3"><div class="text-xs text-slate-200">'+safe(label)+'</div>'+
  '<div class="text-xl font-black">'+money(value)+'</div></div>').join('')+'</div>'+
 (period?.accountingCompleteness==='PROVISIONAL'?
   '<p class="text-amber-200 text-sm mt-3">ПРЕДВАРИТЕЛЬНЫЙ РАСЧЁТ. Разовые расходы или активы без подтверждённой амортизации: целевая маржа за весь период НЕ подтверждена, даже если численная оценка выше цели.</p>':
  t.targetMet?'<p class="text-emerald-200 text-sm mt-3">'+(period?'Целевая маржа подтверждена по фактическому плану всего периода.':'Целевая маржа достигнута для всех позиций.')+'</p>':
  '<p class="text-amber-200 text-sm mt-3">Часть позиций обеспечивает минимальную, но не целевую маржу. Прайс остаётся в пределах диапазона V1.</p>')+
 periodPanel+
 '<h3 class="font-bold mt-5">Конечные цены покупателей</h3>'+priceTable+
 '<h3 class="font-bold mt-5">Общие ресурсы оплачиваются один раз</h3>'+resources+
 '<h3 class="font-bold mt-5">5. Стартовый капитал и Cash flow</h3>'+
 '<p class="text-sm text-slate-200 mt-2">'+
 (cf.temporal?
  'Утверждённый сценарий '+cf.scenarioHorizonMonths+' мес.: помесячные денежные поступления без НДС, физические закупки, исполнение услуг, скидки комплектов, регулярные расходы и сроки кредитов. Цена SKU рассчитывается по полному периоду, а прибыль и Cash Flow сверяются по каждому месяцу отдельно.':
  wholeStockCycle?'Cash flow показывает реализацию всех закупленных партий по индивидуальной месячной скорости каждого товара V1. Общие ресурсы оплачиваются один раз за фактические дни использования, в том числе после распродажи одной позиции. В цене товара учтена его доля общих расходов за цикл; показатели прибыли выше — прогноз за первые 30 дней продаж.':
  'Cash flow отражает первые 30 дней прогнозных продаж, плюс сроки поступлений и погашения кредита; закупка партии возможна целиком. Это не прогноз полной распродажи всего смешанного портфеля.')+
 '</p>'+
 '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">'+
 [['Всего капитал',t.startupCapital],['Собственные деньги',cf.ownerCapital],['Кредит',cf.borrowedCapital],
  ['Резерв',t.reserve],['Итоговый остаток',t.finalCash],['ЖИВЫЕ ДЕНЬГИ',t.freeCash]]
 .map(([label,value])=>'<div class="bg-white/10 rounded-lg p-3"><div class="text-xs">'+label+'</div>'+
  '<b class="text-lg">'+money(value)+'</b></div>').join('')+'</div>'+advertising+flow+
 '<p class="mt-5 pt-3 border-t border-white/15 text-slate-400" style="font-size:11px;line-height:1.5">'+
 'Примечания к расчёту: при изменении цены прогноз продаж пока использует исходные CAC и конверсии из V1. '+
 'Разовые вложения учитываются в Cash flow, но без автоматически начисленной амортизации в EBITDA. '+
 'Месяц принят равным 30 дням; налоги моделируются помесячно, без переноса убытков.</p>';
 root.Nomad360UI?.syncPortfolioActions(out);
}
function setPath(path,value){
 const parts=path.split('.');let current=state;
 for(let i=0;i<parts.length-1;i++){
  const key=parts[i];if(current[key]===undefined||current[key]===null)current[key]={};
  current=current[key];
 }
 current[parts.at(-1)]=value;
}
function onEvent(e){
 const field=e.target;
 if(field.dataset?.linkedMember!==undefined&&e.type==='change'){
  const r=state.resources[Number(field.dataset.linkedMember)];
  if(field.checked&&!r.skuIds.includes(field.value))r.skuIds.push(field.value);
  else if(!field.checked){r.skuIds=r.skuIds.filter(x=>x!==field.value);delete r.includedBySku[field.value];delete r.usage[field.value];delete r.loadPerUnit?.[field.value];}
  save();render();return;
 }
 if(field.dataset?.linkedPath){
  const structural=field.tagName==='SELECT'||field.type==='checkbox';
  if(structural&&e.type==='input')return;
  setPath(field.dataset.linkedPath,field.type==='checkbox'?field.checked:field.value);
  if(/^resources\\.\\d+\\.kind$/.test(field.dataset.linkedPath)&&field.value==='warehouse'){
   const r=state.resources[Number(field.dataset.linkedPath.split('.')[1])];
   r.skuIds=r.skuIds.filter(id=>!['offline-service','online-service'].includes(state.skus.find(s=>s.id===id)?.source));
   for(const key of Object.keys(r.includedBySku||{}))
    if(!r.skuIds.includes(key))delete r.includedBySku[key];
   for(const key of Object.keys(r.usage||{}))
    if(!r.skuIds.includes(key))delete r.usage[key];
  }
  save();
  if(structural&&e.type==='change')render();else updateResult();
  return;
 }
 if(e.type!=='click')return;
 const hit=field.closest('button');if(!hit)return;
 if(hit.hasAttribute('data-linked-back')){
   if(state.lastOrigin==='online')root.showOnly('calculator-screen');
   else root.showProductBranch();
   return;
 }
 if(hit.hasAttribute('data-linked-save')){
  const el=document.getElementById('linked-save-message');
  if(el)el.textContent=save()?'Сохранено в этом браузере':'Не удалось сохранить: хранилище недоступно';
  return;
 }
 if(hit.hasAttribute('data-linked-add')){
  state.resources.push({id:'common-'+sequence++,kind:'premises',label:'Общий ресурс',
    amount:'',cadence:'monthly',pool:'none',allocation:'revenue',
    skuIds:state.skus.map(s=>s.id),includedBySku:{},usage:{},loadPerUnit:{},usageMode:'fixed',capacity:''});
  save();render();return;
 }
 if(hit.hasAttribute('data-linked-delete')){
  state.resources.splice(Number(hit.dataset.linkedDelete),1);save();render();
 }
}
function mount(){
 const el=document.getElementById('portfolio-v2-root');
 if(el){el.addEventListener('input',onEvent);el.addEventListener('change',onEvent);el.addEventListener('click',onEvent);}
 updateEntry();
}
root.LinkedPortfolioV2UI=Object.freeze({importFromV1,appendOnline,resume,read,updateEntry,getState:()=>state?JSON.parse(JSON.stringify(state)):null});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(window);
