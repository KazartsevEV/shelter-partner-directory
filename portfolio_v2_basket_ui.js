/* V2 market-basket editor. UI-only; the LinkedPortfolioV2Engine remains authoritative. */
(function(root){
'use strict';
const locale=()=>root.Nomad360LocaleCore?.displayLocale?.()||'ru-RU';
const money=v=>Number.isFinite(Number(v))?Number(v).toLocaleString(locale(),{maximumFractionDigits:2}):'—';
// Display-only values never write into V2 transactions or saved state.
const shown=(v,suffix='')=>Number.isFinite(Number(v))?
 '<span data-nomad-display-number="'+Number(v)+'" data-nomad-display-fractions="compact"'+
 (suffix?' data-nomad-display-suffix="'+suffix+'"':'')+'>'+money(v)+suffix+'</span>':'—';
const safe=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const option=(id,label,selected)=>'<option value="'+safe(id)+'" '+(id===selected?'selected':'')+'>'+safe(label)+'</option>';
const modes=[['cross_sell','Добавляют к покупке'],['upsell','Выбирают вместо основного'],['bundle','Покупают комплект']];
let offerSequence=1;
function render(state,onChange){
 const target=document.getElementById('linked-results');
 if(!target)return;
 let panel=document.getElementById('linked-basket-panel');
 if(!panel){panel=document.createElement('section');panel.id='linked-basket-panel';target.before(panel);}
 const skus=state.skus||[],offers=state.offers||[];
 const select=(current,exclude=[])=>'<option value="">Выберите позицию</option>'+
   skus.filter(s=>!exclude.includes(s.id)).map(s=>
     option(s.id,s.name+(['offline-service','online-service'].includes(s.source)?' · услуга':' · товар'),current)).join('');
 panel.className='rounded-2xl border border-slate-200 bg-white p-4 mb-5';
 panel.innerHTML='<h2 class="text-xl font-bold text-slate-900">3. Покупки вместе и комплекты</h2>'+
   '<p class="text-sm text-slate-700 mt-2">Дополнительные продажи и готовые комплекты: выберите товары, которые покупатель может взять вместе. Расчёт сразу покажет изменение выручки, прибыли и доступных остатков.</p>'+
   '<details class="mt-3 rounded-lg border border-blue-200 bg-white p-3 text-sm">'+
   '<summary class="font-semibold text-blue-900 cursor-pointer">Как рассчитываются совместные покупки</summary>'+
   '<p class="mt-2 text-slate-700">За основу берём покупателей из рекламного прогноза V1. Один покупатель учитывается в рекламе один раз.</p>'+
   '<p class="mt-2 text-slate-700">Можно добавить товар к заказу, заменить покупку другим товаром или предложить комплект. Для каждого варианта проверяются остатки и загрузка.</p></details>'+
   offers.map((r,i)=>
    '<article class="rounded-xl border border-blue-200 bg-white p-4 mt-4" data-basket-offer="'+i+'">'+
    '<div class="flex justify-between gap-2"><b class="text-base text-blue-900">Предложение '+safe(i+1)+'</b>'+
    '<button type="button" data-basket-action="remove" data-i="'+i+'" class="text-xs text-rose-700 underline">Удалить</button></div>'+
    '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">'+
    '<label class="text-sm font-semibold text-slate-800">Что выберет покупатель?<select class="input-field mt-1" data-basket-field="mode" data-i="'+i+'">'+
      modes.map(x=>option(x[0],x[1],r.mode)).join('')+'</select></label>'+
    '<label class="text-sm font-semibold text-slate-800">Основная покупка<select class="input-field mt-1" data-basket-field="anchorSkuId" data-i="'+i+'">'+
      select(r.anchorSkuId)+'</select></label>'+
    '<label class="text-sm font-semibold text-slate-800">Сколько покупателей выберут предложение, %<input class="input-field mt-1" type="number" min="0" max="100" step="any" data-basket-field="attachPct" data-i="'+i+'" value="'+safe(r.attachPct)+'"><span class="block text-xs font-normal text-slate-600 mt-1">Например, 20% — каждый пятый покупатель основной позиции.</span></label>'+
    '<label class="text-sm font-semibold text-slate-800">Какая доля дополнительных покупок уже учтена в V1, %<input class="input-field mt-1" type="number" min="0" max="100" step="any" data-basket-field="overlapPct" data-i="'+i+'" value="'+safe(r.overlapPct)+'"><span class="block text-xs font-normal text-slate-600 mt-1">0% — все покупки добавятся к прогнозу. 100% — все уже входят в прогноз другого товара.</span></label>'+
    '</div>'+
    (r.mode==='bundle'?'<label class="block text-xs font-semibold mt-2">Скидка на весь комплект, % (всем позициям пропорционально цене)<input type="number" min="0" max="99.99" step="any" class="input-field mt-1" data-basket-field="bundleDiscountPct" data-i="'+i+'" value="'+safe(r.bundleDiscountPct??0)+'"></label>':'')+
    '<p class="text-xs text-slate-600 mt-2">'+
      (r.mode==='upsell'?'Вместо основного товара покупатель выбирает предложенную замену.':
       r.mode==='bundle'?'Основная позиция и дополнения продаются одним набором.':
       'К основной покупке клиент добавляет ещё один товар или услугу.')+
    '</p><div class="mt-3 text-sm font-bold text-slate-800">Что предложить покупателю</div>'+
    (r.items||[]).map((item,j)=>
      '<div class="grid grid-cols-1 sm:grid-cols-[1fr_110px_auto] gap-2 items-end mt-2 rounded-lg bg-white p-2">'+
      '<label class="text-xs font-semibold">Товар или услуга<select class="input-field mt-1" data-basket-field="skuId" data-i="'+i+'" data-j="'+j+'">'+
      select(item.skuId,[r.anchorSkuId])+'</select></label>'+
      '<label class="text-xs font-semibold">Кол-во<input class="input-field mt-1" type="number" min="1" max="100" step="1" value="'+safe(item.qty)+'" data-basket-field="qty" data-i="'+i+'" data-j="'+j+'"></label>'+
      '<button type="button" data-basket-action="remove-item" data-i="'+i+'" data-j="'+j+'" class="p-2 text-xs text-rose-700 underline">Убрать</button></div>').join('')+
    '<button type="button" data-basket-action="add-item" data-i="'+i+'" '+(!skus.some(s=>s.id!==r.anchorSkuId&&!r.items.some(p=>p.skuId===s.id))?'disabled':'')+
    ' class="mt-2 rounded border border-blue-300 px-3 py-2 text-sm text-blue-900 disabled:opacity-40">+ Добавить позицию</button></article>').join('')+
   '<button type="button" data-basket-action="add" '+(skus.length<2?'disabled':'')+
   ' class="w-full mt-4 rounded-lg border-2 border-dashed border-blue-300 bg-white p-3 font-bold text-blue-900 disabled:opacity-40">+ Создать предложение</button>'+
   '<div id="linked-basket-projection" class="mt-3" aria-live="polite"></div>';
 const commit=(next,structural)=>onChange(next,structural);
 panel.onclick=e=>{
   const hit=e.target.closest('button[data-basket-action]');if(!hit)return;
   const next=JSON.parse(JSON.stringify(offers)),i=Number(hit.dataset.i),j=Number(hit.dataset.j);
   if(hit.dataset.basketAction==='add'){
     if(skus.length<2)return;
     const anchor=skus[0].id,targetSku=skus.find(s=>s.id!==anchor).id;
     offerSequence=1+Math.max(offerSequence,...next.map(x=>Number(String(x.id).replace(/\D/g,''))||0));
     next.push({id:'offer-'+offerSequence++,mode:'cross_sell',anchorSkuId:anchor,attachPct:10,
       overlapPct:0,bundleDiscountPct:0,items:[{skuId:targetSku,qty:1}]});
   }else if(hit.dataset.basketAction==='remove')next.splice(i,1);
   else if(hit.dataset.basketAction==='add-item'){
     const r=next[i];if(!r)return;
     const available=skus.find(s=>s.id!==r.anchorSkuId&&!r.items.some(p=>p.skuId===s.id));
     if(!available)return;
     r.items.push({skuId:available.id,qty:1});
   }else if(hit.dataset.basketAction==='remove-item'){
     if(!next[i])return;next[i].items.splice(j,1);
   }
   commit(next,true);
 };
 function edit(e){
   const field=e.target.closest('[data-basket-field]');if(!field)return;
   if(e.type==='input'&&field.tagName==='SELECT')return;
   if(e.type==='change'&&field.tagName!=='SELECT')return;
   const next=JSON.parse(JSON.stringify(offers)),i=Number(field.dataset.i),j=Number(field.dataset.j);
   if(!next[i])return;
   if(field.dataset.j!==undefined)next[i].items[j][field.dataset.basketField]=field.value;
   else next[i][field.dataset.basketField]=field.value;
   if(field.dataset.basketField==='mode'&&field.value!=='bundle')
      next[i].bundleDiscountPct=0;
   commit(next,field.tagName==='SELECT');
 }
 panel.oninput=edit;panel.onchange=edit;
}
function updateResult(out){
 const host=document.getElementById('linked-basket-projection');if(!host)return;
 const basket=out?.basket,problems=(out?.fieldErrors||[]).filter(x=>x.path.startsWith('offers'));
 if(problems.length){
   host.innerHTML='<div class="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">'+
     problems.map(p=>'<p>'+safe(p.message)+'</p>').join('')+'</div>';return;
 }
 if(!basket?.events?.length){host.innerHTML='<p class="text-xs text-slate-500">Связей пока нет. Обычные расчёты V2 остаются неизменными.</p>';return;}
 host.innerHTML='<h3 class="font-bold mt-3">Прогноз привязанных покупок</h3>'+
  (basket.bundleSavingsGross>0?
    '<p class="text-sm mt-2 text-emerald-800">Скидки по комплектам за месяц: <b>'+shown(basket.bundleSavingsGross)+
    '</b> с НДС; уменьшение выручки без НДС: <b>'+shown(basket.bundleSavingsNet)+'</b>. Пересчёт включён в цену, налог, маржу и Cash Flow.</p>':'')+
  '<div class="overflow-x-auto mt-2"><table class="min-w-full text-xs"><thead><tr>'+
  ['Вариант','Основная позиция','Чеков со связкой','Дополнения (шт. в чеке)','Дополнительно, ед.','Пересечение, ед.','Скидка комплекта','Цена чека до','Покупатель платит']
  .map(h=>'<th class="p-2 text-right">'+h+'</th>').join('')+'</tr></thead><tbody>'+
  (basket.transactions||basket.events).map(e=>{
    const main=out.items.find(s=>s.id===e.anchorSkuId)?.name||e.anchorSkuId;
    const extra=e.items.map(p=>(out.items.find(s=>s.id===p.skuId)?.name||p.skuId)+' × '+p.qty).join('; ');
    const values=[e.mode==='bundle'?'Набор':e.mode==='upsell'?'Upsell':'Cross-sell',
       main,e.transactions,extra,e.items.reduce((v,p)=>v+p.netAddedUnits,0),
       e.items.reduce((v,p)=>v+p.overlapUnits,0),e.bundleDiscountPct,e.buyerPriceBefore,e.buyerPriceAfter];
    return '<tr class="border-t border-slate-200">'+values.map((v,i)=>
      '<td class="p-2 text-right whitespace-nowrap"'+([1,3].includes(i)?' data-nomad-no-translate':'')+'>'+
      ([0,1,3].includes(i)?safe(v):i===6&&e.mode!=='bundle'?'—':shown(v,i===6?'%':''))+'</td>'
    ).join('')+'</tr>';
  }).join('')+'</tbody></table></div>'+
  '<p class="text-xs text-slate-600 mt-2">Изменение выручки при тех же рассчитанных ценах: <b>'+shown(basket.revenueLift)+'</b>; изменение переменного вклада (до общих расходов и налогов): <b>'+shown(basket.variableContributionLift)+'</b>. Включено в V2, в том числе прогнозы себестоимости, загрузки и Cash Flow.</p>'+
  (out.ready?'':'<p class="text-xs text-rose-700 mt-2">Весь портфель ещё не подтверждён: проверьте лимиты запасов, загрузку и маржу.</p>');
}
root.LinkedPortfolioV2BasketUI=Object.freeze({render,updateResult});
})(window);
