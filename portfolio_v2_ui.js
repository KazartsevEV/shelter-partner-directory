/* Portfolio v2 interface: own workspace, not an extension of service calculate().
   Data stays in a separate user-owned draft. No sample data is inserted. */
(function(root){
'use strict';
const Engine=root.PortfolioV2Engine;
const storageKey='marketingCalcPortfolioV2';
let model=null,sequence=1;
const kinds={own:'Делаю сам',resale:'Покупаю у других',dropship:'Дропшиппинг'};
const labels={premises:'Помещение',workers:'Работники',warehouse:'Аренда склада',equipment:'Оборудование',certification:'Сертификат / лицензия',salesStaff:'Сотрудники продаж',marketingManager:'Ведение рекламы',campaign:'Отдельная рекламная кампания',website:'Сайт',hosting:'Хостинг',domain:'Домен',content:'Контент',other:'Другие общие расходы'};
const stage={certification:'purchase',premises:'production',workers:'production',equipment:'production',
 warehouse:'logistics',salesStaff:'sales',campaign:'advertising',marketingManager:'advertising',
 website:'business',hosting:'business',domain:'business',content:'business',other:'business'};
const money=n=>new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const pct=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(Number(n)||0)+'%';
const safe=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const initial=()=>({
 version:2,
 marketing:{budget:'',cpc:'',ctrPct:'',clickLeadPct:'',leadOrderPct:'',periodMonths:3,cacReservePct:100},
 skus:[{id:'sku-1',name:'',source:'own',unitCost:'',marginPct:25,mixPct:100,
   batchUnits:'',initialCashOut:'',fulfillmentPerOrder:'',storagePerUnitDay:'',acquiringPct:0}],
 resources:[],
 funding:{kind:'cash',annualRatePct:12,months:6,reservePct:10},
 tax:{type:'turnover',pct:0,vatPct:0}
});
function load(){try{const raw=JSON.parse(localStorage.getItem(storageKey));return raw?.version===2&&Array.isArray(raw.skus)&&raw.skus.length?raw:null}catch(_){return null}}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(model));const el=document.getElementById('p2-draft-status');if(el)el.textContent='Автосохранено в этом браузере';updateEntry();return true}catch(_){const el=document.getElementById('p2-draft-status');if(el)el.textContent='Браузер не разрешает сохранять черновик';return false}}
function updateEntry(){
 const existing=load(),el=document.getElementById('portfolio-v2-resume-home');
 if(el){el.hidden=!existing;el.classList.toggle('hidden',!existing);}
}
function open(options={}){
 const saved=load();model=options.resume&&saved?saved:initial();
 sequence=Math.max(0,...model.skus.map(v=>Number(String(v.id).replace(/\D/g,''))||0),
 ...model.resources.map(v=>Number(String(v.id).replace(/\D/g,''))||0))+1;
 root.showOnly('portfolio-v2-screen');
 render();
 if(!options.resume)save();
}
function numberField(label,path,value,hint,extra=''){
 return '<label class="block min-w-0"><span class="block font-semibold text-xs text-slate-700 mb-1">'+safe(label)+'</span>'+
 '<input type="number" inputmode="decimal" step="any" min="0" '+extra+' data-p2-path="'+safe(path)+'" value="'+safe(value)+'" '+
 'class="input-field w-full" placeholder="Введите число">'+(hint?'<span class="block text-xs text-slate-500 mt-1">'+safe(hint)+'</span>':'')+'</label>';
}
function selField(label,path,value,items){
 return '<label class="block"><span class="block font-semibold text-xs text-slate-700 mb-1">'+safe(label)+'</span><select class="input-field w-full" data-p2-path="'+safe(path)+'">'+items.map(([v,t])=>'<option value="'+safe(v)+'" '+(String(v)===String(value)?'selected':'')+'>'+safe(t)+'</option>').join('')+'</select></label>';
}
function box(title,body,id) {
 return '<section id="'+safe(id)+'" class="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 mb-4 shadow-sm"><h3 class="text-lg font-bold text-slate-900 mb-3">'+title+'</h3>'+body+'</section>';
}
function resourceCard(r,index){
 let all=model.skus.map(s=>'<label class="flex gap-2 items-center text-xs text-slate-700"><input type="checkbox" data-p2-resource-member="'+index+'" value="'+safe(s.id)+'" '+((r.skuIds||[]).includes(s.id)?'checked':'')+'><span>'+safe(s.name||'Товар '+(model.skus.indexOf(s)+1))+'</span></label>').join('');
 const usable=(r.skuIds||[]).length;
 return '<article class="border border-indigo-200 bg-indigo-50 rounded-xl p-3 mt-3" data-p2-resource="'+safe(r.id)+'">'+
 '<div class="flex items-start justify-between gap-3"><strong class="text-slate-900">'+safe(r.label||labels[r.kind]||'Ресурс')+'</strong>'+
 '<button type="button" data-p2-delete-resource="'+safe(r.id)+'" class="text-xs text-rose-700 underline">Удалить</button></div>'+
 '<div class="grid grid-cols-2 gap-2 mt-3">'+
 selField('Тип ресурса','resources.'+index+'.kind',r.kind,Object.entries(labels))+
 numberField(r.kind==='campaign'?'Дополнительный рекламный бюджет, /мес.':'Сумма, у.е.','resources.'+index+'.amount',r.amount)+
 selField('Платёж','resources.'+index+'.cadence',r.cadence,[['monthly','Ежемесячно'],['once','Один раз']])+
 (r.kind==='campaign'?'<div class="col-span-2 text-xs rounded-lg bg-white p-3 text-blue-900">Рекламный бюджет распределяется строго по денежной доле выручки товаров, входящих в кампанию.</div>':
 selField('Как распределить по товарам','resources.'+index+'.allocation',r.allocation,[['revenue','По денежной выручке'],['usage','По фактической загрузке']]))+
 '</div>'+
 '<div class="mt-3" data-p2-resource-members><span class="text-xs font-bold">Ресурс обслуживает товары</span><div class="flex flex-wrap gap-3 mt-2">'+all+'</div>'+
 '<div class="text-xs mt-1 text-slate-600">'+(usable>1?'Один платёж на группу товаров, без повторного списания.':'Платёж относится только к выбранному товару.')+'</div></div>'+
 (r.allocation==='usage'?'<div class="mt-3 grid grid-cols-2 gap-2">'+
 model.skus.filter(s=>(r.skuIds||[]).includes(s.id)).map(s=>numberField('Загрузка: '+(s.name||s.id),'resources.'+index+'.usage.'+s.id,r.usage?.[s.id]||'', 'Часы, дни или доля — одинаковая единица')).join('')+
 numberField('Общая мощность ресурса','resources.'+index+'.capacity',r.capacity||'','Оставьте пустым, если ограничения нет')+'</div>':'')+
 (r.kind==='certification'?'<div class="mt-3 grid grid-cols-2 gap-2">'+
 '<label class="block col-span-2"><span class="block text-xs font-bold mb-1">Страна, тип продукта и область сертификата</span><input class="input-field w-full" data-p2-path="resources.'+index+'.validFor" value="'+safe(r.validFor||'')+'" placeholder="Укажите точный охват"></label>'+
 '<label class="block"><span class="block text-xs font-bold mb-1">Действует до</span><input type="date" class="input-field w-full" data-p2-path="resources.'+index+'.validUntil" value="'+safe(r.validUntil||'')+'"></label>'+
 '<label class="flex items-center gap-2 text-xs"><input type="checkbox" data-p2-path="resources.'+index+'.confirmedCoverage" '+(r.confirmedCoverage?'checked':'')+'>Подтверждаю охват обоих товаров</label></div>':'')+
 '</article>';
}
function stageResources(which,label,help,kind){
 const selected=model.resources.map((r,i)=>({r,i})).filter(({r})=>stage[r.kind]===which);
 return box(label,
 '<div class="text-sm text-slate-600">'+help+'</div>'+
 selected.map(({r,i})=>resourceCard(r,i)).join('')+
 '<button type="button" data-p2-add-resource="'+kind+'" class="mt-3 w-full border border-blue-300 text-blue-800 bg-blue-50 rounded-xl p-3 font-semibold">+ Добавить ресурс / связать с другими товарами</button>','p2-stage-'+which);
}
function skuCard(s,i) {
 const path='skus.'+i+'.';
 const from=s.source==='own'?'Полная переменная себестоимость производства 1 шт.':
 s.source==='resale'?'Закупочная себестоимость с доставкой до меня за 1 шт.':'Поставщику за один исполненный заказ';
 const variant=selField('Откуда беру товар',path+'source',s.source,Object.entries(kinds));
 const extras=(s.source==='dropship'?
 '<p class="col-span-2 text-xs text-blue-800 bg-blue-50 p-2 rounded">Нет собственного склада и первоначальной закупки. Платёж поставщику возникает после каждого заказа.</p>':
 numberField('Размер первоначальной партии, шт. (необязательно)',path+'batchUnits',s.batchUnits,'Если указана партия, прогноз ведётся до её полной распродажи')+
 numberField('Стартовая закупка сырья / товара, у.е. (необязательно)',path+'initialCashOut',s.initialCashOut,
 'Аванс: выплата в начале цикла. Не прибавляется повторно к COGS')+
 numberField('Хранение 1 ед. за день, у.е. (по фактическим остаткам)',path+'storagePerUnitDay',s.storagePerUnitDay));
 return '<article class="mb-4 rounded-2xl border-2 border-blue-200 bg-white p-4" data-p2-sku="'+safe(s.id)+'">'+
 '<div class="flex justify-between gap-3 mb-3"><h3 class="text-xl font-extrabold text-blue-950">Товар '+(i+1)+'</h3>'+
 '<button class="text-rose-700 text-sm underline" type="button" data-p2-remove-sku="'+safe(s.id)+'">Удалить</button></div>'+
 '<label class="block mb-3"><span class="text-xs font-bold text-slate-700 block mb-1">Название</span><input class="input-field w-full" data-p2-path="'+path+'name" value="'+safe(s.name)+'" placeholder="Название своего товара"></label>'+
 '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">'+variant+
 numberField(from,path+'unitCost',s.unitCost,'Это основное поле себестоимости для выбранной ветки')+
 numberField('Целевая маржинальность товара, %',path+'marginPct',s.marginPct)+
 numberField('Прогнозная доля продаж в ШТУКАХ, %',path+'mixPct',s.mixPct,'Сумма по всем товарам = 100%')+
 '</div>'+
 '<details class="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3"><summary class="font-semibold text-slate-800 cursor-pointer">Дополнительно: закупка, логистика и комиссия</summary>'+
 '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">'+
 extras+
 numberField('Исполнение и доставка заказа, у.е./шт.',path+'fulfillmentPerOrder',s.fulfillmentPerOrder,
 'Дропшиппинг: доставка поставщика; иначе отправка покупателю')+
 numberField('Эквайринг / комиссия от цены, %',path+'acquiringPct',s.acquiringPct)+
 '</div></details>'+
 '<p class="mt-3 text-xs text-slate-500">Общие помещения, сотрудники, сертификаты и кампании задаются ниже как отдельные оплачиваемые ресурсы — не копируйте их стоимость в этот SKU.</p></article>';
}
function render(){
 const host=document.getElementById('portfolio-v2-root');if(!host||!model)return;
 host.innerHTML='<div class="mb-5 rounded-2xl bg-slate-900 text-white p-5">'+
 '<div class="text-xs tracking-widest uppercase text-sky-200">Самостоятельная портфельная модель · v2</div>'+
 '<h1 class="text-2xl font-black mt-2">Мои товары и реальные деньги</h1>'+
 '<p class="text-sm mt-2 text-slate-200">Начните с рекламной воронки. Добавляйте товары, а общие расходы оплачивайте один раз. Здесь нет подставленных примеров.</p>'+
 '<div class="flex flex-wrap gap-2 mt-4"><button class="bg-white text-slate-900 px-3 py-2 rounded-lg text-sm font-bold" type="button" data-p2-home>← Главная</button>'+
 '<button class="nd-cta-primary px-3 py-2 rounded-lg text-sm font-bold" type="button" data-p2-save>Сохранить расчёт</button>'+
 '<button class="border border-white/40 px-3 py-2 rounded-lg text-sm" type="button" data-p2-new>+ Новый портфель</button></div>'+
 '<div id="p2-draft-status" class="mt-2 text-xs text-emerald-200">Черновик сохраняется только в этом браузере</div></div>'+
 box('1. Общий маркетинговый двигатель',
 '<p class="text-xs text-slate-600 mb-3">Одна воронка на портфель: бюджет → CPC → клики → лиды → заказы. CTR нужен для показов. Отдельные дополнительные кампании можно назначить конкретным SKU ниже.</p>'+
 '<div class="grid grid-cols-2 gap-3">'+
 numberField('Общий рекламный бюджет / месяц','marketing.budget',model.marketing.budget)+
 numberField('CPC, цена клика','marketing.cpc',model.marketing.cpc)+
 numberField('CTR, %','marketing.ctrPct',model.marketing.ctrPct)+
 numberField('Клик → лид, %','marketing.clickLeadPct',model.marketing.clickLeadPct)+
 numberField('Лид → заказ, %','marketing.leadOrderPct',model.marketing.leadOrderPct)+
 numberField('Минимальный период, месяцев','marketing.periodMonths',model.marketing.periodMonths)+
 numberField('Коэффициент запаса CAC, %','marketing.cacReservePct',model.marketing.cacReservePct,'100% — без запаса; 75% — CAC / 0,75')+
 '</div>','p2-stage-marketing')+
 box('2. Товары и доли продаж','<p class="text-sm text-slate-600 mb-3">Три модели используют одну формулу цены; меняются состав себестоимости, наличие склада и момент расчёта с поставщиком.</p>'+
 model.skus.map(skuCard).join('')+
 '<div class="text-sm font-semibold mb-3" id="p2-mix-sum">Сумма долей по штукам: '+pct(model.skus.reduce((a,s)=>a+Number(s.mixPct||0),0))+'</div>'+
 '<button type="button" data-p2-add-sku class="w-full rounded-xl bg-blue-700 px-4 py-4 text-white font-bold">+ Добавить товар</button>','p2-stage-skus')+
 stageResources('purchase','3. Закупка и сертификаты','Один сертификат можно распределить на несколько товаров только если он действительно покрывает их тип, страну и срок. Материалы / закупка — в себестоимости соответствующего SKU.','certification')+
 stageResources('production','4. Производство: помещения, работники, оборудование','Добавьте одну общую аренду или одну бригаду для нескольких товаров либо две отдельные записи. При известной загрузке задайте её по товарам и ограничение мощности.','premises')+
 stageResources('logistics','5. Склад и логистика','Общую аренду склада платим один раз. Хранение каждого товара по остаткам и дням остаётся индивидуальным — в его карточке.','warehouse')+
 stageResources('sales','6. Продажи и команда','Единая команда продаж — один фонд оплаты; независимые команды — отдельные записи ресурсов. Комиссия каждого товара уже в карточке SKU.','salesStaff')+
 stageResources('advertising','7. Рекламные бюджеты и маркетологи','Общий бюджет воронки уже распределяется по денежной доле SKU. Здесь добавляйте ОТДЕЛЬНЫЕ кампании и гонорары; дополнительный бюджет учитывается ровно один раз и не подменяет общий.','campaign')+
 stageResources('business','8. Прочие расходы бизнеса','Сайт, домен, контент и другие расходы относятся к бизнесу: один реальный платёж на список выбранных товаров.','website')+
 box('9. Налоги, собственные деньги и кредит',
 '<div class="grid grid-cols-2 gap-3">'+
 selField('Налог бизнеса','tax.type',model.tax.type,[['turnover','С оборота'],['profit','С прибыли']])+
 numberField('Ставка налога, %','tax.pct',model.tax.pct)+
 numberField('НДС для цены покупателя, % (транзитный)','tax.vatPct',model.tax.vatPct)+
 numberField('Защитный резерв, % от кассового разрыва','funding.reservePct',model.funding.reservePct)+
 selField('Источник капитала','funding.kind',model.funding.kind,[['cash','Свои деньги'],['credit','Кредит']])+
 (model.funding.kind==='credit'?
 numberField('Ставка кредита, % годовых','funding.annualRatePct',model.funding.annualRatePct)+
 numberField('Срок кредита, месяцев','funding.months',model.funding.months):'')+
 '</div><p class="text-xs text-slate-500 mt-3">Кредит: ежемесячные проценты и возврат всего тела в последний месяц (bullet). Тело кредита — выплата денежных средств, а не налоговый расход. Внесённые собственные деньги — тоже не прибыль.</p>',
 'p2-stage-financing')+
 '<section id="p2-results" class="rounded-2xl bg-emerald-900 text-white p-5 mb-6" aria-live="polite"></section>';
 const status=document.getElementById('p2-draft-status');if(status)status.textContent='Изменения сохраняются в этом браузере';
 updateResult();
}
function displayInlineValidation(fieldErrors) {
 const rootEl=document.getElementById('portfolio-v2-root');
 if(!rootEl)return;
 // Remove old messages and visual state before painting fresh errors.
 rootEl.querySelectorAll('[data-p2-inline-error]').forEach(node=>node.remove());
 rootEl.querySelectorAll('[data-p2-path][aria-invalid]').forEach(node=>{
   node.removeAttribute('aria-invalid');
   node.style.borderColor='';
 });
 const distinct=new Map();
 for(const issue of fieldErrors||[]) {
   if(!issue?.path||!issue.message)continue;
   if(!distinct.has(issue.path))distinct.set(issue.path,[]);
   if(!distinct.get(issue.path).includes(issue.message))
     distinct.get(issue.path).push(issue.message);
 }
 const addNote=(holder,messages)=>{
   if(!holder)return;
   const note=document.createElement('div');
   note.dataset.p2InlineError='true';
   note.setAttribute('role','alert');
   note.style.cssText='display:block;margin-top:6px;padding:8px 10px;border:1px solid #fda4af;border-radius:8px;background:#fff1f2;color:#9f1239;font-size:12px;font-weight:650;line-height:1.4;white-space:normal;overflow-wrap:anywhere';
   note.textContent=messages.join(' ');
   holder.appendChild(note);
 };
 for(const [path,messages] of distinct) {
   if(path==='mix'){
     const holder=rootEl.querySelector('#p2-mix-sum');
     addNote(holder,messages);
     continue;
   }
   const field=Array.from(rootEl.querySelectorAll('[data-p2-path]'))
     .find(node=>node.dataset.p2Path===path);
   if(field){
     field.setAttribute('aria-invalid','true');
     field.style.borderColor='#e11d48';
     const details=field.closest('details');
     if(details&&!details.open)details.open=true;
     addNote(field.closest('label')||field.parentElement,messages);
     continue;
   }
   const membership=/^resources\.(\d+)\.skuIds$/.exec(path);
   if(membership){
     const article=rootEl.querySelectorAll('[data-p2-resource]')[Number(membership[1])];
     const container=article?.querySelector('[data-p2-resource-members]');
     addNote(container||article,messages);
     continue;
   }
   const unmatched=/^resources\.(\d+)\./.exec(path);
   if(unmatched){
     const article=rootEl.querySelectorAll('[data-p2-resource]')[Number(unmatched[1])];
     addNote(article,messages);
     continue;
   }
   if(path==='skus'||path==='resources'){
     addNote(rootEl.querySelector(path==='skus'?'#p2-stage-skus':'#p2-stage-production'),messages);
   }
 }
}
function updateResult(){
 if(!model)return;const el=document.getElementById('p2-results');if(!el)return;
 const out=Engine.build(model);
 displayInlineValidation(out.fieldErrors);
 const funnel=out.marketing;
 let intro='<h2 class="text-2xl font-black">Результат портфеля</h2><p class="mt-2 text-sm">Клики '+money(funnel?.clicks||0)+
 ', лиды '+money(funnel?.leads||0)+', заказы/месяц '+money(funnel?.orders||0)+
 ', базовый CAC '+money(funnel?.baseCAC||0)+'</p>';
 if(!out.ready){
   // The detailed reason now appears alongside the actual input. This summary
   // does not repeat the error out of sight at the end of a long form.
   el.innerHTML=intro+'<p class="rounded-xl bg-white text-rose-800 p-4 mt-4 text-sm">'+
     'Исправьте поля, выделенные красным, рядом с местом ввода. '+
     (out.errors.length?'Проверок осталось: '+out.errors.length+'.':'')+'</p>';
   return;
 }
 const r=out;
 const heads=['Товар','Цена без НДС','Себест.','Mix шт.','Mix выручки','Weighted CAC','Прогноз, шт/мес','Рекламный бюджет','EBITDA SKU','ROAS'];
 const skuRows=r.items.map(s=>'<tr class="border-t border-white/20">'+
 [safe(s.name),money(s.price),money(s.unitCost),pct(s.mix*100),pct(s.revenueWeight*100),
 money(s.weightedCAC),money(s.forecastOrders),money(s.adBudget),money(s.ebitda),
 s.roas===null?'—':money(s.roas)+'×'].map(k=>'<td class="px-2 py-3 whitespace-nowrap">'+k+'</td>').join('')+'</tr>').join('');
 const cashHeads=['Месяц','Продажи','Выплаты','Операционный cash flow','Кредит / свои','Проценты','Возврат тела','Чистый CF','Накопленный CF','ЖИВЫЕ ДЕНЬГИ'];
 const cashRows=r.months.map(m=>'<tr class="border-t border-white/20">'+
 [m.month,money(m.receipt),money(m.outflow),money(m.preFinancing),
 money(m.loanDraw+m.ownerDraw),money(m.interest),money(m.principalRepayment),
 money(m.cashFlow),money(m.cumulative),money(m.freeCumulative)]
 .map(k=>'<td class="px-2 py-2 whitespace-nowrap">'+k+'</td>').join('')+'</tr>').join('');
 const resourceRows=r.resources.map(v=>'<tr class="border-t border-white/20"><td class="p-2">'+safe(v.label)+'</td><td class="p-2">'+
 money(v.amount)+'</td><td class="p-2">'+(v.cadence==='once'?'раз':'месяц')+'</td><td class="p-2">'+
 Object.entries(v.bySku).map(([id,amount])=>safe(r.items.find(s=>s.id===id)?.name||id)+': '+money(amount)).join('; ')+'</td></tr>').join('');
 el.innerHTML=intro+
 '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">'+
 [['Чистая прибыль · базовый месяц',r.netProfit],['Рентабельность товара (взвешенная), %',r.weightedMarginPct],
 ['Деньги на запуск',r.financing.principal],['Резерв',r.financing.reserve],
 ['ROAS бизнеса',r.totalROAS],['EBITDA · базовый месяц',r.businessEBITDA],
 ['Накопленный CF',r.finalCash],['ЖИВЫЕ ДЕНЬГИ',r.freeCash]]
 .map(([t,v],i)=>'<div class="rounded-xl '+(i===7?'bg-emerald-200 text-emerald-950':'bg-white/15 text-white')+
 ' p-3"><div class="text-xs">'+safe(t)+'</div><div class="text-xl font-black mt-1">'+
 (i===1?pct(v):i===4?money(v)+'×':money(v))+'</div></div>').join('')+'</div>'+
 '<p class="text-xs text-emerald-50 mt-3">Цена без НДС рассчитывается по базовому CAC и целевой марже. Фактическая SKU-маржа после Weighted CAC может отличаться от целевой. Начальные закупки — денежный аванс, а COGS признаётся при продаже, без двойного счёта.</p>'+
 '<h3 class="font-bold mt-5">Портфель: цены, доли и нагрузка</h3>'+
 '<div class="overflow-x-auto mt-2"><table class="text-xs text-left w-full"><thead><tr>'+
 heads.map(h=>'<th class="px-2 py-3 whitespace-nowrap">'+safe(h)+'</th>').join('')+'</tr></thead><tbody>'+skuRows+'</tbody></table></div>'+
 '<p class="text-sm mt-3">Всего рекламы в месяц: <strong>'+money(r.marketingBudget)+'</strong>. На SKU распределено: <strong>'+money(r.invariants.adAllocated)+'</strong>. Денежные доли суммарно '+pct(r.invariants.weightSum*100)+'.</p>'+
 '<h3 class="font-bold mt-5">Общие ресурсы — одна оплата, несколько получателей</h3>'+
 '<div class="overflow-x-auto"><table class="text-xs w-full text-left"><thead><tr><th class="p-2">Ресурс</th><th class="p-2">Сумма</th><th class="p-2">Частота</th><th class="p-2">Кому отнесено</th></tr></thead><tbody>'+resourceRows+'</tbody></table></div>'+
 '<h3 class="font-bold mt-5">Помесячный cash flow · '+r.months.length+' месяцев</h3>'+
 '<div class="overflow-x-auto mt-2"><table class="text-xs text-left w-full"><thead><tr>'+
 cashHeads.map(h=>'<th class="px-2 py-3 whitespace-nowrap">'+safe(h)+'</th>').join('')+'</tr></thead><tbody>'+cashRows+'</tbody></table></div>'+
 '<p class="text-xs mt-3">«Живые деньги» = накопленный денежный остаток с учётом начального собственного взноса или кредита, минус защищённый резерв. Это не прибыль. Проценты уплачиваются ежемесячно, тело кредита — в последний месяц. Месяц = 30 дней.</p>';
}
function updatePath(path,value){
 const parts=path.split('.');let cur=model;for(let i=0;i<parts.length-1;i++){
  if(cur[parts[i]]===undefined)cur[parts[i]]={};
  cur=cur[parts[i]];
 }
 cur[parts.at(-1)]=value;
}
function removeItem(which,skuId){
 if(which==='sku'){
  const entry=model.skus.find(s=>s.id===skuId);
  if(!entry)return false;
  if(!root.confirm('Удалить «'+(entry.name||'эту позицию')+'» из V2? Распределение общих расходов и финансовые результаты изменятся.'))return false;
  model.skus=model.skus.filter(s=>s.id!==skuId);
  model.resources.forEach(r=>{
   r.skuIds=(r.skuIds||[]).filter(id=>id!==skuId);
   if(r.usage)delete r.usage[skuId];
  });
  model.resources=model.resources.filter(r=>r.skuIds.length);
  if(!model.skus.length){
   // A draft requires one editable blank slot. Remove the calculated item,
   // its expenses and all values instead of keeping it as a fake survivor.
   model.skus=[{...initial().skus[0],id:'sku-'+sequence++}];
  }else{
   const total=model.skus.reduce((a,s)=>a+Number(s.mixPct||0),0);
   if(total>0)model.skus.forEach(s=>s.mixPct=100*Number(s.mixPct||0)/total);
   else model.skus.forEach(s=>s.mixPct=100/model.skus.length);
  }
 } else {
  if(!model.resources.some(r=>r.id===skuId))return false;
  model.resources=model.resources.filter(r=>r.id!==skuId);
 }
 return true;
}
function addSku(){
 const n=20;
 model.skus.forEach(s=>s.mixPct=Number(s.mixPct||0)*(100-n)/100);
 model.skus.push({id:'sku-'+sequence++,name:'',source:'own',unitCost:'',marginPct:25,
 mixPct:n,batchUnits:'',initialCashOut:'',fulfillmentPerOrder:'',storagePerUnitDay:'',acquiringPct:0});
 // A previously all-SKU shared resource remains only on former beneficiaries
 // until the user EXPLICITLY selects the newly added product.
}
function addResource(kind){
 const id='resource-'+sequence++;
 model.resources.push({id,kind:kind in stage?kind:'other',label:labels[kind]||'Общий ресурс',
   amount:'',cadence:kind==='certification'||kind==='equipment'||kind==='domain'?'once':'monthly',
   allocation:'revenue',skuIds:[model.skus[0].id],usage:{},capacity:'',confirmedCoverage:false});
}
function handleEvent(event) {
 const t=event.target;
 if(t.dataset?.p2Path){
   // Blur/change fires on every number/text input. Rebuilding the form on blur
   // detaches the NEXT focused input and silently loses half the user fields.
   // Rebuild only when structure changes (a select or a checkbox).
   const structural=t.tagName==='SELECT'||t.type==='checkbox';
   // Selects fire input BEFORE change. Mutating a sourcing mode on both events
   // loses the old inventory parameters before they can be stashed safely.
   if(structural&&event.type==='input')return;
   if(t.dataset.p2Path.endsWith('.source')&&event.type==='change'){
     const skuId=t.dataset.p2Path.split('.')[1],sku=model.skus[Number(skuId)];
     if(sku){
       if(t.value==='dropship'&&sku.source!=='dropship'){
         sku._inventoryDraft={batchUnits:sku.batchUnits,initialCashOut:sku.initialCashOut,
           storagePerUnitDay:sku.storagePerUnitDay};
         sku.batchUnits='';sku.initialCashOut='';sku.storagePerUnitDay='';
       }else if(sku.source==='dropship'&&t.value!=='dropship'&&sku._inventoryDraft){
         Object.assign(sku,sku._inventoryDraft);
       }
     }
   }
   updatePath(t.dataset.p2Path,t.type==='checkbox'?t.checked:t.value);
   save();
   if(event.type==='change'&&structural)render();else updateResult();
   return;
 }
 if(event.type!=='click'&&event.type!=='change')return;
 const member=t.closest('[data-p2-resource-member]');
 if(member&&event.type==='change'){
  const r=model.resources[Number(member.dataset.p2ResourceMember)];
  if(!r)return;
  r.skuIds=r.skuIds||[];
  if(member.checked&&!r.skuIds.includes(member.value))r.skuIds.push(member.value);
  if(!member.checked)r.skuIds=r.skuIds.filter(x=>x!==member.value);
  save();render();return;
 }
 if(event.type!=='click')return;
 const hit=t.closest('button');if(!hit)return;
 if('p2Home'in hit.dataset){root.showHome();return;}
 if('p2Save'in hit.dataset){save();return;}
 if('p2New'in hit.dataset){model=initial();save();render();return;}
 if('p2AddSku'in hit.dataset){addSku();save();render();return;}
 if('p2RemoveSku'in hit.dataset){if(removeItem('sku',hit.dataset.p2RemoveSku)){save();render();}return;}
 if('p2AddResource'in hit.dataset){addResource(hit.dataset.p2AddResource);save();render();return;}
 if('p2DeleteResource'in hit.dataset){removeItem('resource',hit.dataset.p2DeleteResource);save();render();}
}
function mount(){
 const el=document.getElementById('portfolio-v2-root');
 if(el){el.addEventListener('input',handleEvent);el.addEventListener('change',handleEvent);el.addEventListener('click',handleEvent);}
 updateEntry();
}
root.PortfolioV2UI=Object.freeze({open,load,updateEntry,getState:()=>model?JSON.parse(JSON.stringify(model)):null});
root.openPortfolioV2=function(resume=false){open({resume});};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
else mount();
})(window);
