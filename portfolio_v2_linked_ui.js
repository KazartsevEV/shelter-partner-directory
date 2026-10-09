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
 const fresh=Engine.fromV1(payload),prior=read();
 // Explicit import: match exact source IDs; old mappings not silently discarded.
 if(prior){
  const same=prior.skus.length===fresh.skus.length&&
    prior.skus.every(s=>fresh.skus.some(x=>x.id===s.id));
  if(same){
   fresh.resources=prior.resources.map(r=>JSON.parse(JSON.stringify(r)));
   fresh.skus.forEach(s=>{
    const old=prior.skus.find(x=>x.id===s.id);
    s.priceSelected=Math.min(s.priceMax,Math.max(s.priceMin,Number(old.priceSelected)||s.priceMax));
    s.discountSelected=Math.min(s.maxDiscountPct,Math.max(0,Number(old.discountSelected)||0));
   });
  }
 }
 state=fresh;resetSequence();save();enter();
}
function resume(){const previous=read();if(!previous)return false;state=previous;resetSequence();enter();return true;}
function options(items,value){return items.map(([v,label])=>'<option value="'+safe(v)+'" '+(v===value?'selected':'')+'>'+safe(label)+'</option>').join('');}
function field(label,path,value,extra=''){
 return '<label class="block min-w-0 text-xs font-semibold text-slate-700">'+safe(label)+
 '<input data-linked-path="'+safe(path)+'" type="number" step="0.01" min="0" class="input-field mt-1" value="'+safe(value)+'" '+extra+'></label>';
}
function resourceCard(r,i){
 const skuCards=state.skus.map(s=>{
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
    (r.allocation==='usage'?field('Загрузка этого товара (ед.)','resources.'+i+'.usage.'+s.id,r.usage?.[s.id]??0):'')+
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
 '<label class="text-xs font-semibold text-slate-700">Распределять по<select data-linked-path="resources.'+i+'.allocation" class="input-field mt-1">'+options([['revenue','Прогнозной выручке V1'],['usage','Реальной загрузке']],r.allocation)+'</select></label>'+
 (r.allocation==='usage'?field('Максимальная мощность (0 — не ограничена)','resources.'+i+'.capacity',r.capacity):'')+
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
 const skus=state.skus.map((s,i)=>'<article class="rounded-xl border border-slate-200 bg-white p-4" data-linked-sku="'+i+'">'+
 '<div class="font-bold text-slate-900 text-lg">'+safe(s.name)+'</div>'+
 '<div class="text-xs text-slate-500">'+safe({own:'Делаю сам',resale:'Покупаю у других',dropship:'Дропшиппинг'}[s.source]||s.source)+' · ID '+safe(s.id)+'</div>'+
 '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-slate-700 mt-3">'+
 [['Себестоимость V1 / шт.',money(s.unitCost)],['Прогноз V1 / мес.',money(s.forecastUnitsPerMonth)],
 ['Реклама V1 / мес.',money(s.adBudget)],['CAC V1',money(s.baseCac)],['Цена от',money(s.priceMin)],
 ['Цена до',money(s.priceMax)],['Дельта цены',money(num(s.priceMax)-num(s.priceMin))]].map(([label,value])=>
 '<div class="rounded-lg bg-slate-50 p-2"><div class="text-xs text-slate-500">'+label+'</div><b>'+value+'</b></div>').join('')+'</div>'+
 '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">'+
 field('Цена прайса (внутри диапазона V1)','skus.'+i+'.priceSelected',s.priceSelected,
 'min="'+safe(s.priceMin)+'" max="'+safe(s.priceMax)+'"')+
 field('Рабочая скидка, % (не выше '+money(s.maxDiscountPct)+'%)','skus.'+i+'.discountSelected',s.discountSelected,
 'max="'+safe(s.maxDiscountPct)+'"')+'</div>'+
 '<p class="text-xs text-slate-500 mt-2">Диапазон цены и максимальная скидка получены из V1 и здесь не редактируются. Меняются только сценарная цена и фактическая скидка.</p>'+
 '</article>').join('');
 host.innerHTML=
 '<div class="rounded-2xl bg-emerald-900 text-white p-5 mb-5">'+
 '<div class="text-xs font-semibold uppercase tracking-widest text-emerald-200">V2 · Связанный портфель</div>'+
 '<h1 class="text-2xl font-black mt-2">Портфель из рассчитанных товаров</h1>'+
 '<p class="text-sm text-emerald-100 mt-2">Цены, прогнозы, рекламные бюджеты, себестоимость и налоги взяты из V1. Повторно их заполнять не нужно.</p>'+
 '<div class="flex flex-wrap gap-2 mt-4">'+
 '<button type="button" data-linked-back class="rounded-lg border border-white/40 p-2 text-sm font-bold">← К товарам V1</button>'+
 '<button type="button" data-linked-save class="rounded-lg bg-white text-emerald-900 p-2 text-sm font-bold">Сохранить портфель</button></div>'+
 '<div id="linked-save-message" class="text-xs mt-2">Черновик хранится в этом браузере</div></div>'+
 '<section class="mb-5"><h2 class="text-xl font-bold mb-2">1. Готовая экономика товаров</h2>'+
 '<p class="text-xs text-slate-600 mb-3">Для каждого SKU — отдельный результат V1 и его допустимый диапазон цены после решения о скидках.</p>'+
 '<div class="grid grid-cols-1 xl:grid-cols-2 gap-3">'+skus+'</div></section>'+
 '<section class="rounded-2xl border border-slate-200 bg-white p-4 mb-5">'+
 '<h2 class="text-xl font-bold">2. Общие ресурсы</h2>'+
 '<p class="text-sm text-slate-600 mt-2">Помещение, сотрудники, сертификаты, реклама, склад и другие общие расходы могут работать на несколько товаров. Списывайте уже учтённые суммы по SKU, а реальную общую оплату указывайте один раз.</p>'+
 '<div id="linked-resources">'+state.resources.map(resourceCard).join('')+'</div>'+
 '<button type="button" data-linked-add class="w-full rounded-lg border-2 border-dashed border-indigo-300 text-indigo-800 font-bold p-3 mt-4">+ Добавить общий ресурс</button></section>'+
 '<section id="linked-results" class="rounded-2xl bg-slate-900 text-white p-5 mb-6" aria-live="polite"></section>';
 updateResult();
}
function updateResult(){
 const result=document.getElementById('linked-results');if(!result||!state)return;
 const out=Engine.build(state);
 document.querySelectorAll('[data-linked-error]').forEach(el=>el.remove());
 document.querySelectorAll('[data-linked-path][aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
 if(!out.ready){
  const list=[...new Set(out.errors||[])];
  result.innerHTML='<h2 class="text-xl font-bold">Портфель требует уточнения</h2>'+
   '<p class="mt-2 text-sm">Исправьте данные общих ресурсов. Расчёты V1 не менялись.</p>';
  for(const issue of out.fieldErrors||[]){
   const field=Array.from(document.querySelectorAll('[data-linked-path]')).find(x=>x.dataset.linkedPath===issue.path);
   let owner=field?.closest('label')||field?.parentElement;
   if(!owner){
    const m=/^resources\.(\d+)/.exec(issue.path),n=/^skus\.(\d+)/.exec(issue.path);
    owner=m?document.querySelector('[data-linked-resource="'+m[1]+'"]'):
      n?document.querySelector('[data-linked-sku="'+n[1]+'"]'):null;
   }
   if(owner){
    if(field)field.setAttribute('aria-invalid','true');
    const note=document.createElement('div');
    note.dataset.linkedError='yes';note.className='mt-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs p-2';
    note.textContent=issue.message;owner.append(note);
   }
  }
  if(!out.fieldErrors?.length)result.innerHTML+='<p class="text-rose-300 mt-2">'+safe(list.join(' '))+'</p>';
  return;
 }
 const {totals:t}=out;
 result.innerHTML='<h2 class="text-xl font-black">3. Экономика общего портфеля · 30 дней</h2>'+
 '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">'+
 [['Прогноз заказов',t.forecast],['Выручка без НДС',t.revenue],['Медиа-бюджет',t.media],
 ['Себестоимость заказов',t.cogs],['Общие месячные расходы',t.monthlyResources],
 ['EBITDA',t.ebitda],['Налоги',t.tax],['Чистый результат',t.netProfit]]
 .map(([label,value])=>'<div class="rounded-lg bg-white/10 p-3"><span class="text-xs text-slate-200">'+label+'</span><div class="text-lg font-bold">'+money(value)+'</div></div>').join('')+'</div>'+
 '<div class="overflow-x-auto mt-5"><table class="min-w-full text-xs"><thead><tr>'+
 ['Товар','Цена с НДС / скидкой','Продажи','Реклама','Себестоимость','Доля выручки','Общ. ресурсы','EBITDA'].map(v=>'<th class="p-2 text-right">'+v+'</th>').join('')+
 '</tr></thead><tbody>'+out.items.map(s=>'<tr class="border-t border-white/20">'+
 [safe(s.name),money(s.priceGross),money(s.forecastOrders),money(s.adBudgetEffective),
 money(s.cogs),money(s.revenueWeight*100)+'%',money(s.resourceShares),money(s.ebitda)]
 .map((v,i)=>'<td class="p-2 text-right '+(i===0?'text-left':'')+'">'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+
 '<h3 class="font-bold mt-5">Единые платежи и распределение</h3>'+
 '<div class="mt-2 space-y-2 text-xs">'+out.resources.map(r=>'<div class="rounded-lg bg-white/10 p-2">'+
 '<b>'+safe(r.label)+' — '+money(r.amount)+' '+(r.cadence==='once'?'разово':'в месяц')+'</b>'+
 '<div>Было учтено в V1: '+money(r.previousTotal)+'. '+
 Object.entries(r.bySku).map(([id,v])=>safe(out.items.find(s=>s.id===id)?.name||id)+': '+money(v)).join('; ')+'</div></div>').join('')+'</div>'+
 '<p class="text-xs text-slate-300 mt-4">Разовые ресурсы: '+money(t.onceResources)+
 ' у.е. — показаны отдельно, не включены в месячную EBITDA без срока амортизации. '+
 'Изменение общего рекламного бюджета переоценивает количество заказов по ранее рассчитанному CAC каждого товара. '+
 'Совместный кассовый разрыв и кредитный график для смешанного ассортимента ещё не рассчитаны, поэтому стартовый капитал V2 здесь не показывается.</p>'+
 '<p class="text-xs text-emerald-200 mt-2">Инварианты: расходы на кампании и общие ресурсы распределены без дублирования.</p>';
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
  else if(!field.checked){r.skuIds=r.skuIds.filter(x=>x!==field.value);delete r.includedBySku[field.value];delete r.usage[field.value];}
  save();render();return;
 }
 if(field.dataset?.linkedPath){
  const structural=field.tagName==='SELECT'||field.type==='checkbox';
  if(structural&&e.type==='input')return;
  setPath(field.dataset.linkedPath,field.type==='checkbox'?field.checked:field.value);
  save();
  if(structural&&e.type==='change')render();else updateResult();
  return;
 }
 if(e.type!=='click')return;
 const hit=field.closest('button');if(!hit)return;
 if(hit.hasAttribute('data-linked-back')){root.showProductBranch();return;}
 if(hit.hasAttribute('data-linked-save')){
  const el=document.getElementById('linked-save-message');
  if(el)el.textContent=save()?'Сохранено в этом браузере':'Не удалось сохранить: хранилище недоступно';
  return;
 }
 if(hit.hasAttribute('data-linked-add')){
  state.resources.push({id:'common-'+sequence++,kind:'premises',label:'Общий ресурс',
    amount:'',cadence:'monthly',pool:'none',allocation:'revenue',
    skuIds:state.skus.map(s=>s.id),includedBySku:{},usage:{},capacity:''});
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
root.LinkedPortfolioV2UI=Object.freeze({importFromV1,resume,read,updateEntry,getState:()=>state?JSON.parse(JSON.stringify(state)):null});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(window);
