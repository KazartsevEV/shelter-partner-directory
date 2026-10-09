/* Observed MBA UI: never turn association into incremental uplift automatically.
 * Import is local-only; no CSV or customer/order identifiers are persisted.
 */
(function(root){
'use strict';
const Engine=root.LinkedPortfolioObservedMBA;
const safe=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const pct=x=>(100*x).toLocaleString('ru-RU',{maximumFractionDigits:1})+'%';
const dec=x=>Number(x).toLocaleString('ru-RU',{maximumFractionDigits:2});
let analysis=null,error='',rawCsv='',minimum=2;
function render(state,onAttach){
 const old=document.getElementById('linked-mba-history');
 const basket=document.getElementById('linked-basket-panel'),
       target=document.getElementById('linked-results');
 if(!target||!Engine)return;
 const el=old||document.createElement('section');el.id='linked-mba-history';
 el.className='rounded-2xl border border-slate-200 bg-white p-4 mb-5';
 if(!old)(basket||target).before(el);
 const byId=new Map((state.skus||[]).map(s=>[s.id,s.name]));
 const table=(rules,kind)=>rules.length?
  '<h3 class="font-semibold text-slate-900 mt-4">'+kind+'</h3>'+
  '<div class="overflow-x-auto"><table class="min-w-full text-xs mt-2"><thead><tr>'+
  ['Основная покупка → дополнение','Чеков вместе','Support','Confidence','Lift','Сценарий']
   .map(x=>'<th class="text-left p-2">'+x+'</th>').join('')+'</tr></thead><tbody>'+
  rules.slice(0,20).map((r,i)=>{
   const n=(byId.get(r.anchorSkuId)||r.anchorSkuId)+' → '+
     r.items.map(p=>byId.get(p.skuId)||p.skuId).join(' + ');
   const key=kind==='Пары'?'pairs':'tuples';
   return '<tr class="border-t border-slate-200"><td class="p-2">'+safe(n)+'</td>'+
    '<td class="p-2">'+r.cooccurrence+' / '+r.baseCount+'</td>'+
    '<td class="p-2">'+pct(r.support)+'</td><td class="p-2">'+pct(r.confidence)+
    '</td><td class="p-2">'+dec(r.lift)+'</td><td class="p-2">'+
    '<label class="block text-[11px]">Пересечение с прогнозом V1, %'+
    '<input class="input-field mt-1 w-28" type="number" min="0" max="100" step="any" required placeholder="Укажите" data-mba-overlap="'+key+':'+i+'"></label>'+
    '<button type="button" class="mt-1 underline text-emerald-800 font-semibold" data-mba-apply="'+key+':'+i+'">Применить</button>'+
    '</td></tr>';
  }).join('')+'</tbody></table></div>':
  '<p class="mt-2 text-sm text-slate-500">Нет подтверждённых сочетаний с выбранным минимальным числом чеков.</p>';
 el.innerHTML='<h2 class="text-xl font-bold">3. MBA по настоящим чекам</h2>'+
  '<p class="text-sm mt-2 text-slate-600">Загрузите оплаченные заказы: <code>order_id,sku_id,quantity,date,status,channel</code>.'+
  ' ID должны точно совпадать с позициями V2. Отмены и возвраты исключаются, повторяющиеся строки заказа объединяются.</p>'+
  '<p class="text-xs text-slate-500 mt-2">Данные обрабатываются только на устройстве, история чеков не сохраняется в портфеле и не отправляется на сервер. Минимум 2 чека и 2 совпадения; лучше 30+ заказов.</p>'+
  '<label class="block text-xs font-semibold mt-3">CSV-файл (UTF-8, до 3 МБ)<input type="file" accept=".csv,text/csv" class="input-field mt-1" data-mba-file></label>'+
  '<label class="block text-xs font-semibold mt-3">Или вставьте CSV<textarea data-mba-csv class="input-field mt-1 w-full" rows="3" placeholder="order_id,sku_id,quantity,date,status,channel"></textarea></label>'+
  '<div class="flex flex-wrap gap-2 items-end mt-2"><label class="text-xs">Минимум совместных чеков'+
  '<input data-mba-min type="number" min="2" step="1" class="input-field mt-1 w-28" value="'+minimum+'"></label>'+
  '<button type="button" data-mba-run class="rounded-lg bg-slate-900 text-white px-4 py-3 text-sm font-semibold">Анализировать чеки</button></div>'+
  (error?'<p role="alert" class="mt-2 rounded-lg bg-rose-50 text-rose-800 text-sm p-3">'+safe(error)+'</p>':'')+
  (analysis?'<div class="mt-4 rounded-lg bg-slate-50 p-3 text-sm">'+
    '<b>Оплаченных заказов: '+analysis.transactions+'</b>. Исключённых строк отмен/возвратов: '+analysis.excludedLines+
    '. Период: '+safe(analysis.dateFrom)+' — '+safe(analysis.dateTo)+
    '. Каналы: '+safe(analysis.channels.join(', '))+
    '<p class="text-xs text-amber-800 mt-2">'+safe(analysis.warning)+'</p>'+
    '<p class="text-xs mt-2">Support — доля всех чеков с сочетанием; Confidence — доля покупателей основной позиции с сочетанием; Lift — ассоциация относительно базовой частоты. Это НЕ доказательство инкрементальных продаж.</p>'+
    table(analysis.pairs,'Пары')+table(analysis.tuples,'Наборы из трёх позиций')+
    '<p class="text-xs text-slate-600 mt-3">При применении обязательно укажите пересечение с независимым прогнозом V1. Его нельзя достоверно вывести из совместных чеков. Созданная связь останется редактируемым сценарием.</p></div>':'');
 el.querySelector('[data-mba-file]').onchange=async event=>{
   const file=event.target.files?.[0];if(!file)return;
   rawCsv=await file.text();
   el.querySelector('[data-mba-csv]').value=rawCsv;
 };
 el.querySelector('[data-mba-run]').onclick=()=>{
   rawCsv=el.querySelector('[data-mba-csv]').value||rawCsv;
   const rawMin=Number(el.querySelector('[data-mba-min]').value);
   if(!Number.isInteger(rawMin)||rawMin<2){error='Минимум совместных чеков должен быть целым числом от 2.';render(state,onAttach);return;}
   minimum=rawMin;
   try{
     analysis=Engine.analyze(rawCsv,(state.skus||[]).map(s=>s.id),{minCount:minimum});
     error='';
   }catch(e){analysis=null;error=e.message;}
   rawCsv='';render(state,onAttach);
 };
 el.querySelectorAll('[data-mba-apply]').forEach(button=>button.onclick=()=>{
   const [type,index]=button.dataset.mbaApply.split(':'),rule=analysis?.[type]?.[Number(index)];
   if(!rule)return;
   const overlapField=el.querySelector('[data-mba-overlap="'+type+':'+index+'"]');
   const val=overlapField.value,overlap=Number(val);
   if(val===''||!Number.isFinite(overlap)||overlap<0||overlap>100){
     overlapField.setCustomValidity('Укажите пересечение от 0 до 100%.');
     overlapField.reportValidity();return;
   }
   overlapField.setCustomValidity('');
   const id='mba-'+Date.now()+'-'+index;
   onAttach({id,mode:rule.type==='tuple'?'bundle':'cross_sell',
     anchorSkuId:rule.anchorSkuId,
     attachPct:Math.round(rule.confidence*10000)/100,
     overlapPct:overlap,bundleDiscountPct:0,items:rule.items.map(p=>({...p})),
     evidence:{source:'observed-orders',transactions:analysis.transactions,
       cooccurrence:rule.cooccurrence,confidence:rule.confidence,
       lift:rule.lift,dateFrom:analysis.dateFrom,dateTo:analysis.dateTo}});
 });
}
root.LinkedPortfolioV2MBAUI=Object.freeze({render});
})(window);
