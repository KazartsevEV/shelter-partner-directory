/* Isolated US-retail study copy of the actual V2 interface. Original remains unchanged.
   Portfolio v2 interface: own workspace, not an extension of service calculate().
   Data stays in a separate user-owned draft. No sample data is inserted. */
(function(root){
'use strict';
const Engine=root.PortfolioV2Engine;
const taxText=()=>root.Nomad360LocaleCore?.locales?.('tax')?.[root.Nomad360UI?.getLanguage?.()||'ru']||{};
const storageKey='marketingCalcPortfolioV2';
const usDemoStorageKey='marketingCalcPortfolioV2USRetailDemo';
const usDemoResetKey='marketingCalcPortfolioV2USRetailReset';
let activeStorageKey=storageKey;
let model=null,sequence=1;
const kinds={own:'Делаю сам',resale:'Покупаю у других',dropship:'Дропшиппинг'};
const labels={premises:'Помещение',workers:'Работники',warehouse:'Аренда склада',equipment:'Оборудование',certification:'Сертификат / лицензия',salesStaff:'Сотрудники продаж',marketingManager:'Ведение рекламы',campaign:'Отдельная рекламная кампания',website:'Сайт',hosting:'Хостинг',domain:'Домен',content:'Контент',other:'Другие общие расходы'};
const stage={certification:'purchase',premises:'production',workers:'production',equipment:'production',
 warehouse:'logistics',salesStaff:'sales',campaign:'advertising',marketingManager:'advertising',
 website:'business',hosting:'business',domain:'business',content:'business',other:'business'};
const uiLocale=()=>root.Nomad360UI?.getLanguage?.()==='en'?'en-US':root.Nomad360UI?.getLanguage?.()==='kk'?'kk-KZ':'ru-RU';
const money=n=>new Intl.NumberFormat(uiLocale(),{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const pct=n=>new Intl.NumberFormat(uiLocale(),{maximumFractionDigits:2}).format(Number(n)||0)+'%';
const safe=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const initial=()=>({
 version:2,
 currency:root.Nomad360Currency?.get()||'USD',
 businessCurrency:root.Nomad360Currency?.get()||'USD',
 marketing:{budget:'',cpc:'',ctrPct:'',clickLeadPct:'',leadOrderPct:'',periodMonths:3,cacReservePct:100},
 skus:[{id:'sku-1',name:'',source:'own',unitCost:'',marginPct:25,mixPct:100,
   batchUnits:'',initialCashOut:'',fulfillmentPerOrder:'',storagePerUnitDay:'',acquiringPct:0}],
 resources:[],
 funding:{kind:'cash',annualRatePct:12,months:6,reservePct:10},
 tax:{type:'turnover',pct:0,vatPct:0}
});
function load(){try{const raw=JSON.parse(localStorage.getItem(storageKey));return raw?.version===2&&Array.isArray(raw.skus)&&raw.skus.length?raw:null}catch(_){return null}}
function studyWasReset(){try{return localStorage.getItem(usDemoResetKey)==='1'}catch(_){return false}}
function loadStudy(){try{
 const raw=JSON.parse(localStorage.getItem(usDemoStorageKey));
 return raw?.version===2&&Array.isArray(raw.skus)&&raw.skus.length&&Array.isArray(raw.resources)?raw:null;
}catch(_){return null}}
function save(){try{root.Nomad360PaymentUI?.syncPortfolio(model);localStorage.setItem(activeStorageKey,JSON.stringify(model));if(activeStorageKey===usDemoStorageKey)localStorage.removeItem(usDemoResetKey);const el=document.getElementById('p2-draft-status');if(el)el.textContent='Автосохранено в этом браузере';if(activeStorageKey===storageKey)updateEntry();return true}catch(_){const el=document.getElementById('p2-draft-status');if(el)el.textContent='Браузер не разрешает сохранять черновик';return false}}
function updateEntry(){
 const existing=load(),el=document.getElementById('portfolio-v2-resume-home');
 if(el){el.hidden=!existing;el.classList.toggle('hidden',!existing);}
}
function open(options={}){
  activeStorageKey=storageKey;
 if(!options.resume)root.Nomad360Currency?.beginNew();
 const saved=load();model=options.resume&&saved?saved:initial();
 model.currency=root.Nomad360Currency?.adopt(model.currency)||model.currency||'USD';
 model.businessCurrency=model.currency;
 sequence=Math.max(0,...model.skus.map(v=>Number(String(v.id).replace(/\D/g,''))||0),
 ...model.resources.map(v=>Number(String(v.id).replace(/\D/g,''))||0))+1;
 root.showOnly('portfolio-v2-screen');
 render();
 if(!options.resume)save();
}
// A study model never overwrites the visitor's own V2 autosave.
function openDemo(rawState,options={}){
  const next=JSON.parse(JSON.stringify(rawState||{}));
  if(options.resume){
    if(next.version!==2||!Array.isArray(next.skus)||!next.skus.length||!Array.isArray(next.resources))
      throw Error('Invalid saved US retail study');
  }else if(next.version!==2||next.currency!=='USD'||next.tax?.taxRegime!=='sales_tax'||next.tax?.salesTaxPct!==6.25)
    throw Error('Invalid US retail demonstration data');
  if(!options.resume){
    const checked=Engine.build(next);
    if(!checked.ready||checked.months?.length!==12)
      throw Error('US retail demonstration requires a valid twelve-month V2 model: '+(checked.errors||[]).join('; '));
  }
  activeStorageKey=usDemoStorageKey;
  root.Nomad360Currency?.beginNew();
  root.Nomad360Currency?.adopt('USD');
  model=next;
  sequence=Math.max(0,...model.skus.map(v=>Number(String(v.id).replace(/\D/g,''))||0),
    ...model.resources.map(v=>Number(String(v.id).replace(/\D/g,''))||0))+1;
  root.showOnly('portfolio-v2-screen');
  render();
  save();
}
// Change only unchanged canonical study names. Preserve any reviewer edits
// and all financial inputs. The visitor's ordinary V2 model is never touched.
function localizeStudyNames(dictionary){
 if(activeStorageKey!==usDemoStorageKey||!model||!dictionary)return false;
 let changed=false;
 for(const [kind,field] of [['skus','name'],['resources','label']]){
  for(const entry of model[kind]||[]){
   const option=dictionary[kind]?.[entry.id];
   if(!option||!Array.isArray(option.known)||!option.known.includes(entry[field])||typeof option.target!=='string')continue;
   if(entry[field]!==option.target){entry[field]=option.target;changed=true;}
  }
 }
 if(changed){save();render();}
 return changed;
}
// English study copy is presentation-only; user-entered names and finance state stay unchanged.
const studyEnglishCopy=[["«Живые деньги» = накопленный денежный остаток с учётом начального собственного взноса или кредита, минус защищённый резерв. Это не прибыль. Проценты уплачиваются ежемесячно, тело кредита — в последний месяц. Месяц = 30 дней.","Available cash = cumulative cash including initial owner funding or loan, minus the protected reserve. It is not profit. Interest is paid monthly and principal in the final month. Each model month has 30 days."],["рассчитывается по базовому CAC и целевой марже. Фактическая SKU-маржа после Weighted CAC может отличаться от целевой. Начальные закупки — денежный аванс, а COGS признаётся при продаже, без двойного счёта.","is calculated using base CAC and target SKU margin. Actual SKU margin may differ after weighted CAC. Initial purchases are cash advances, with COGS recognized on sale to avoid double counting."],["Кредит: ежемесячные проценты и возврат всего тела в последний месяц (bullet). Тело кредита — выплата денежных средств, а не налоговый расход. Внесённые собственные деньги — тоже не прибыль.","Loan interest is paid monthly; the full principal is repaid in the final month (bullet). Repaying principal is a cash outflow, not a business tax deduction. Owner's capital is not profit."],["Общий бюджет воронки уже распределяется по денежной доле SKU. Здесь добавляйте ОТДЕЛЬНЫЕ кампании и гонорары; дополнительный бюджет учитывается ровно один раз и не подменяет общий.","The shared funnel budget is already allocated by revenue share. Add only SEPARATE campaigns and fees here; each extra payment is counted once."],["Один сертификат можно распределить на несколько товаров только если он действительно покрывает их тип, страну и срок. Материалы / закупка — в себестоимости соответствующего SKU.","Share a certificate only when it covers the relevant products, country, and validity period. Procurement is recorded in each SKU's costs."],["Добавьте одну общую аренду или одну бригаду для нескольких товаров либо две отдельные записи. При известной загрузке задайте её по товарам и ограничение мощности.","Use one shared lease or workforce across products, or separate resources. Set usage by SKU and available capacity when known."],["Одна воронка на портфель: бюджет → CPC → клики → лиды → заказы. CTR нужен для показов. Отдельные дополнительные кампании можно назначить конкретным SKU ниже.","One funnel for the portfolio: budget → CPC → clicks → leads → orders. CTR determines impressions. Assign additional standalone campaigns to specific SKUs below."],["Общие помещения, сотрудники, сертификаты и кампании задаются ниже как отдельные оплачиваемые ресурсы — не копируйте их стоимость в этот SKU.","Shared facilities, staff, permits and campaigns are separate paid resources below. Do not duplicate them in the SKU."],["Единая команда продаж — один фонд оплаты; независимые команды — отдельные записи ресурсов. Комиссия каждого товара уже в карточке SKU.","One sales team is one payroll resource; independent teams have separate entries. SKU commissions are defined in each product card."],["Демонстрация реального V2: 10 SKU, 14 ресурсов и годовой кредит. Все поля можно изменять; сохранение изолировано от личного расчёта.","Live V2 demonstration: 10 SKUs, 14 resources, and a 12-month loan. Every field is editable; the study is saved separately from your personal calculation."],["Общую аренду склада платим один раз. Хранение каждого товара по остаткам и дням остаётся индивидуальным — в его карточке.","The shared warehouse lease is paid once. Per-SKU holding costs depend on stock and days in storage."],["Начните с рекламной воронки. Добавляйте товары, а общие расходы оплачивайте один раз. Здесь нет подставленных примеров.","Start with the marketing funnel, add products, and account for shared expenses once. No example data is inserted."],["Три модели используют одну формулу цены; меняются состав себестоимости, наличие склада и момент расчёта с поставщиком.","All three sourcing models use the same pricing formula; unit costs, inventory, and supplier payment timing differ."],["Сайт, домен, контент и другие расходы относятся к бизнесу: один реальный платёж на список выбранных товаров.","Website, domain, content and other business expenses are each paid once and allocated across selected products."],["Нет собственного склада и первоначальной закупки. Платёж поставщику возникает после каждого заказа.","No own inventory or initial stock purchase. Supplier settlement follows each order."],["Рекламный бюджет распределяется строго по денежной доле выручки товаров, входящих в кампанию.","Ad spend is allocated by the revenue share of SKUs covered by this campaign."],["Аванс: выплата в начале цикла. Не прибавляется повторно к COGS","Advance is paid at the start and not added again to COGS"],["Если указана партия, прогноз ведётся до её полной распродажи","When a batch is specified, the forecast continues until sell-through"],["Дропшиппинг: доставка поставщика; иначе отправка покупателю","Dropshipping: supplier delivery; otherwise ship to customer"],["Исправьте поля, выделенные красным, рядом с местом ввода.","Correct the fields highlighted in red."],["Один платёж на группу товаров, без повторного списания.","One payment across the selected products, with no double-counting."],["Стартовая закупка сырья / товара, у.е. (необязательно)","Initial stock / raw-material purchase, currency units (optional)"],["Хранение 1 ед. за день, у.е. (по фактическим остаткам)","Storage per unit per day (based on actual stock)"],["Закупочная себестоимость с доставкой до меня за 1 шт.","Purchase cost incl. delivery to me per unit"],["4. Производство: помещения, работники, оборудование","4. Production: facilities, labor and equipment"],["Это основное поле себестоимости для выбранной ветки","Primary unit cost for this sourcing method"],["Полная переменная себестоимость производства 1 шт.","Full variable production cost per unit"],["Общие ресурсы — одна оплата, несколько получателей","Shared resources: one payment, multiple beneficiaries"],["Размер первоначальной партии, шт. (необязательно)","Initial batch, units (optional)"],["+ Добавить ресурс / связать с другими товарами","+ Add resource / link to other products"],["Платёж относится только к выбранному товару.","Payment applies to the selected product only."],["Дополнительно: закупка, логистика и комиссия","Additional: inventory, logistics and fees"],["Черновик сохраняется только в этом браузере","Draft is saved in this browser only"],["Страна, тип продукта и область сертификата","Country, product type and certification coverage"],["Браузер не разрешает сохранять черновик","Browser storage is unavailable"],["НДС для цены покупателя, % (транзитный)","VAT charged to customer, % (pass-through)"],["Защитный резерв, % от кассового разрыва","Protected reserve, % of cash gap"],["Часы, дни или доля — одинаковая единица","Use the same unit for hours, days, or share"],["Введите корректную ставку Sales Tax, %.","Enter a valid Sales Tax rate, %."],["9. Налоги, собственные деньги и кредит","9. Taxes, equity and loan"],["Дополнительный рекламный бюджет, /мес.","Additional ad budget / month"],["Исполнение и доставка заказа, у.е./шт.","Fulfillment and shipment per unit"],["Изменения сохраняются в этом браузере","Changes are saved in this browser"],["Оставьте пустым, если ограничения нет","Leave blank if unconstrained"],["Рентабельность товара (взвешенная), %","Weighted SKU margin, %"],["Поставщику за один исполненный заказ","Supplier cost per fulfilled order"],["Налог с продаж — итог для покупателя","Sales tax — customer total"],["100% — без запаса; 75% — CAC / 0,75","100% = no uplift; 75% = CAC / 0.75"],["Самостоятельная портфельная модель","Standalone portfolio model"],["7. Рекламные бюджеты и маркетологи","7. Advertising and marketing contractors"],["Прогнозная доля продаж в ШТУКАХ, %","Forecast unit sales mix, %"],["1. Общий маркетинговый двигатель","1. Shared marketing funnel"],["Целевая маржинальность товара, %","Target SKU margin, %"],["Подтверждаю охват обоих товаров","I confirm the coverage of both products"],["Эквайринг / комиссия от цены, %","Payment processing fee, % of price"],["Портфель: цены, доли и нагрузка","Portfolio: pricing, mix and utilization"],["Общий рекламный бюджет / месяц","Shared ad budget / month"],["Чистая прибыль · базовый месяц","Model profit · reference month"],["Автосохранено в этом браузере","Autosaved in this browser"],["Мои товары и реальные деньги","My products and cash flow"],["Отдельная рекламная кампания","Additional ad campaign"],["Сумма по всем товарам = 100%","All products must sum to 100%"],["Минимальный период, месяцев","Minimum period, months"],["Как распределить по товарам","Allocation across products"],["Коэффициент запаса CAC, %","CAC safety factor, %"],["8. Прочие расходы бизнеса","8. Other business expenses"],["Ставка кредита, % годовых","Annual loan interest rate, %"],["Ресурс обслуживает товары","Products using this resource"],["3. Закупка и сертификаты","3. Procurement and certification"],["Цена без налога с продаж","Price excl. sales tax"],["2. Товары и доли продаж","2. Products and sales mix"],["По фактической загрузке","By actual usage"],["Сумма долей по штукам:","Sales unit mix total:"],["Общая мощность ресурса","Total resource capacity"],["Название своего товара","Product name"],["Операционный cash flow","Operating cash flow"],["EBITDA · базовый месяц","EBITDA · reference month"],["Всего рекламы в месяц:","Monthly total ad spend:"],["Денежные доли суммарно","Revenue shares total"],["Помесячный cash flow ·","Monthly cash flow ·"],["Без налога на продажу","No sales tax"],["Срок кредита, месяцев","Loan term, months"],["Сертификат / лицензия","Certification / permit"],["5. Склад и логистика","5. Warehouse and logistics"],["6. Продажи и команда","6. Sales and staff"],["Другие общие расходы","Other shared expenses"],["Укажите точный охват","Specify exact coverage"],["На SKU распределено:","Allocated across SKUs:"],["Ставка Sales Tax, %","Sales Tax rate, %"],["По денежной выручке","By revenue"],["Результат портфеля","Portfolio results"],["Проверок осталось:","Validation issues remaining:"],["покупатель платит ","customer pays "],["сумма покупателей ","customer total "],["Источник капитала","Funding source"],["Сотрудники продаж","Sales staff"],["Откуда беру товар","Sourcing method"],["Сохранить расчёт","Save calculation"],["+ Новый портфель","+ New portfolio"],["+ Добавить товар","+ Add product"],["Ставка налога, %","Tax rate, %"],["Покупаю у других","Resale / purchased"],["Итого Sales Tax ","Total Sales Tax "],["Рекламный бюджет","Ad budget"],["Деньги на запуск","Startup funding"],["CPC, цена клика","CPC, cost per click"],["НДС (VAT / IVA)","VAT / IVA"],["Ведение рекламы","Ad management"],["Прогноз, шт/мес","Forecast units / month"],["Лид → заказ, %","Lead → order, %"],["Накопленный CF","Cumulative cash flow"],["Клик → лид, %","Click → lead, %"],["Налог бизнеса","Business tax"],["Аренда склада","Warehouse lease"],["заказы/месяц ","orders/month "],["Кредит / свои","Loan / equity"],["Кому отнесено","Allocated to"],["Автосохранено","Autosaved"],["Введите число","Enter a number"],["Режим налога","Sales tax regime"],["Оборудование","Equipment"],["Действует до","Valid until"],["базовый CAC ","base CAC "],["Цена без НДС","Price excl. VAT"],["Возврат тела","Principal repayment"],["ЖИВЫЕ ДЕНЬГИ","AVAILABLE CASH"],["ROAS бизнеса","Business ROAS"],["Свои деньги","Owner's cash"],["Дропшиппинг","Dropshipping"],["Тип ресурса","Resource type"],["Сумма, у.е.","Amount, currency units"],["Mix выручки","Revenue mix"],["Ежемесячно","Monthly"],["← Главная","← Home"],["С оборота","On revenue"],["С прибыли","On profit"],["Делаю сам","Made in-house"],["Помещение","Premises"],["Работники","Workers"],["Загрузка:","Usage:"],["Чистый CF","Net cash flow"],["Один раз","One-off"],["Название","Name"],["Выручка ","Revenue "],["Проценты","Interest"],["Хостинг","Hosting"],["Контент","Content"],["Удалить","Remove"],["Себест.","Unit cost"],["Mix шт.","Unit mix"],["Продажи","Sales"],["Выплаты","Outflows"],["Частота","Frequency"],["месяцев","months"],["Кредит","Loan"],["Платёж","Payment schedule"],["Товар ","Product "],["Клики ","Clicks "],["Резерв","Reserve"],["Ресурс","Resource"],["Домен","Domain"],["лиды ","leads "],["Товар","Product"],["Месяц","Month"],["месяц","month"],["Сумма","Amount"],["Сайт","Website"],["раз","one-off"]];
const studyEnglishLang=()=>root.Nomad360UI?.getLanguage?.()==='en'&&activeStorageKey===usDemoStorageKey;
function translateEnglishStudyText(){
 if(!studyEnglishLang())return;
 const host=document.getElementById('portfolio-v2-root');if(!host)return;
 const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);let n;
 while((n=walker.nextNode())){
  if(!/[А-Яа-яЁё]/.test(n.nodeValue||''))continue;
  if(n.parentElement?.closest('[data-nomad-no-translate],script,style,textarea,code'))continue;
  let value=n.nodeValue;
  for(const [ru,en] of studyEnglishCopy)if(value.includes(ru))value=value.replaceAll(ru,en);
  if(value!==n.nodeValue)n.nodeValue=value;
 }
 for(const input of host.querySelectorAll('[placeholder]')){
  let v=input.getAttribute('placeholder');if(!v||!/[А-Яа-яЁё]/.test(v))continue;
  for(const [ru,en] of studyEnglishCopy)if(v.includes(ru))v=v.replaceAll(ru,en);
  input.setAttribute('placeholder',v);
 }
}
function numberField(label,path,value,hint,extra=''){
 const surface=/^(marketing|tax|funding|skus)\./.test(path);
 const field='<label class="nd-v2-field block min-w-0"><span class="block font-semibold text-xs text-slate-700 mb-1'+(surface?' nd-v2-field-label':'')+'">'+safe(label)+'</span>'+
 '<input type="number" inputmode="decimal" step="any" min="0" '+extra+' data-p2-path="'+safe(path)+'" value="'+safe(value)+'" '+
 'class="input-field w-full" placeholder="Введите число">'+(hint?'<span class="block text-xs text-slate-500 mt-1'+(surface?' nd-v2-field-help':'')+'">'+safe(hint)+'</span>':'')+'</label>';
 const payment=root.Nomad360PaymentUI?.paymentField(path,value,model)||'';
 return payment?'<div class="nd-v2-field nd-payment-v2-field">'+field+payment+'</div>':field;
}
function selField(label,path,value,items){
 const surface=/^(tax|funding|skus)\./.test(path);
 return '<label class="nd-v2-field block"><span class="block font-semibold text-xs text-slate-700 mb-1'+(surface?' nd-v2-field-label':'')+'">'+safe(label)+'</span><select class="input-field w-full" data-p2-path="'+safe(path)+'">'+items.map(([v,t])=>'<option value="'+safe(v)+'" '+(String(v)===String(value)?'selected':'')+'>'+safe(t)+'</option>').join('')+'</select></label>';
}
function box(title,body,id) {
 return '<section id="'+safe(id)+'" class="nd-v2-section rounded-2xl border border-slate-200 p-4 md:p-5 mb-4"><h3 class="nd-v2-title text-lg font-bold mb-3">'+title+'</h3>'+body+'</section>';
}
function resourceCard(r,index){
 let all=model.skus.map(s=>'<label class="nd-v2-check-row flex gap-2 items-center text-xs text-slate-700"><input type="checkbox" data-p2-resource-member="'+index+'" value="'+safe(s.id)+'" '+((r.skuIds||[]).includes(s.id)?'checked':'')+'><span'+(s.name?' data-nomad-no-translate':'')+'>'+safe(s.name||'Товар '+(model.skus.indexOf(s)+1))+'</span></label>').join('');
 const usable=(r.skuIds||[]).length;
 return '<article class="border border-indigo-200 bg-indigo-50 rounded-xl p-3 mt-3" data-p2-resource="'+safe(r.id)+'">'+
 '<div class="nd-v2-card-heading flex items-start justify-between gap-3"><strong class="nd-v2-card-title text-slate-900"'+(r.label?' data-nomad-no-translate':'')+'>'+safe(r.label||labels[r.kind]||'Ресурс')+'</strong>'+
 '<button type="button" data-p2-delete-resource="'+safe(r.id)+'" class="nd-v2-action nd-v2-action-outline nd-v2-card-remove text-xs text-rose-700 underline">Удалить</button></div>'+
 '<div class="nd-v2-form-grid grid grid-cols-2 gap-2 mt-3">'+
 selField('Тип ресурса','resources.'+index+'.kind',r.kind,Object.entries(labels))+
 numberField(r.kind==='campaign'?'Дополнительный рекламный бюджет, /мес.':'Сумма, у.е.','resources.'+index+'.amount',r.amount)+
 selField('Платёж','resources.'+index+'.cadence',r.cadence,[['monthly','Ежемесячно'],['once','Один раз']])+
 (r.kind==='campaign'?'<div class="nd-v2-field-full col-span-2 text-xs rounded-lg bg-white p-3 text-blue-900">Рекламный бюджет распределяется строго по денежной доле выручки товаров, входящих в кампанию.</div>':
 selField('Как распределить по товарам','resources.'+index+'.allocation',r.allocation,[['revenue','По денежной выручке'],['usage','По фактической загрузке']]))+
 '</div>'+
 '<div class="mt-3" data-p2-resource-members><span class="text-xs font-bold">Ресурс обслуживает товары</span><div class="nd-v2-check-list flex flex-wrap gap-3 mt-2">'+all+'</div>'+
 '<div class="text-xs mt-1 text-slate-600">'+(usable>1?'Один платёж на группу товаров, без повторного списания.':'Платёж относится только к выбранному товару.')+'</div></div>'+
 (r.allocation==='usage'?'<div class="nd-v2-form-grid mt-3 grid grid-cols-2 gap-2">'+
 model.skus.filter(s=>(r.skuIds||[]).includes(s.id)).map(s=>numberField('Загрузка: '+(s.name||s.id),'resources.'+index+'.usage.'+s.id,r.usage?.[s.id]||'', 'Часы, дни или доля — одинаковая единица')).join('')+
 numberField('Общая мощность ресурса','resources.'+index+'.capacity',r.capacity||'','Оставьте пустым, если ограничения нет')+'</div>':'')+
 (r.kind==='certification'?'<div class="nd-v2-form-grid mt-3 grid grid-cols-2 gap-2">'+
 '<label class="nd-v2-field nd-v2-field-full block col-span-2"><span class="block text-xs font-bold mb-1">Страна, тип продукта и область сертификата</span><input class="input-field w-full" data-p2-path="resources.'+index+'.validFor" value="'+safe(r.validFor||'')+'" placeholder="Укажите точный охват"></label>'+
 '<label class="nd-v2-field block"><span class="block text-xs font-bold mb-1">Действует до</span><input type="date" class="input-field w-full" data-p2-path="resources.'+index+'.validUntil" value="'+safe(r.validUntil||'')+'"></label>'+
 '<label class="nd-v2-check-row flex items-center gap-2 text-xs"><input type="checkbox" data-p2-path="resources.'+index+'.confirmedCoverage" '+(r.confirmedCoverage?'checked':'')+'>Подтверждаю охват обоих товаров</label></div>':'')+
 '</article>';
}
function stageResources(which,label,help,kind){
 const selected=model.resources.map((r,i)=>({r,i})).filter(({r})=>stage[r.kind]===which);
 return box(label,
 '<div class="nd-v2-description text-sm">'+help+'</div>'+
 selected.map(({r,i})=>resourceCard(r,i)).join('')+
 '<button type="button" data-p2-add-resource="'+kind+'" class="nd-v2-action nd-v2-action-secondary mt-3 w-full border border-blue-300 text-blue-800 bg-blue-50 rounded-xl p-3 font-semibold">+ Добавить ресурс / связать с другими товарами</button>','p2-stage-'+which);
}
function skuCard(s,i) {
 const path='skus.'+i+'.';
 const from=s.source==='own'?'Полная переменная себестоимость производства 1 шт.':
 s.source==='resale'?'Закупочная себестоимость с доставкой до меня за 1 шт.':'Поставщику за один исполненный заказ';
 const variant=selField('Откуда беру товар',path+'source',s.source,Object.entries(kinds));
 const extras=(s.source==='dropship'?
 '<p class="nd-v2-field-full nd-v2-description nd-v2-info-panel col-span-2 text-xs p-2 rounded">Нет собственного склада и первоначальной закупки. Платёж поставщику возникает после каждого заказа.</p>':
 numberField('Размер первоначальной партии, шт. (необязательно)',path+'batchUnits',s.batchUnits,'Если указана партия, прогноз ведётся до её полной распродажи')+
 numberField('Стартовая закупка сырья / товара, у.е. (необязательно)',path+'initialCashOut',s.initialCashOut,
 'Аванс: выплата в начале цикла. Не прибавляется повторно к COGS')+
 numberField('Хранение 1 ед. за день, у.е. (по фактическим остаткам)',path+'storagePerUnitDay',s.storagePerUnitDay));
 return '<article class="nd-v2-product-card mb-4 rounded-2xl border-2 border-blue-200 p-4" data-p2-sku="'+safe(s.id)+'">'+
 '<div class="nd-v2-card-heading flex justify-between gap-3 mb-3"><h3 class="nd-v2-card-title nd-v2-title text-xl font-extrabold">Товар '+(i+1)+'</h3>'+
 '<button class="nd-v2-action nd-v2-action-outline nd-v2-card-remove text-rose-700 text-sm underline" type="button" data-p2-remove-sku="'+safe(s.id)+'">Удалить</button></div>'+
 '<label class="nd-v2-field block mb-3"><span class="nd-v2-field-label text-xs font-bold block mb-1">Название</span><input class="input-field w-full" data-p2-path="'+path+'name" value="'+safe(s.name)+'" placeholder="Название своего товара"></label>'+
 '<div class="nd-v2-form-grid grid grid-cols-1 sm:grid-cols-2 gap-3">'+variant+
 numberField(from,path+'unitCost',s.unitCost,'Это основное поле себестоимости для выбранной ветки')+
 numberField('Целевая маржинальность товара, %',path+'marginPct',s.marginPct)+
 numberField('Прогнозная доля продаж в ШТУКАХ, %',path+'mixPct',s.mixPct,'Сумма по всем товарам = 100%')+
 '</div>'+
 '<details class="nd-v2-info-panel mt-4 rounded-xl border border-slate-200 p-3"><summary class="nd-v2-title font-semibold cursor-pointer">Дополнительно: закупка, логистика и комиссия</summary>'+
 '<div class="nd-v2-form-grid grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">'+
 extras+
 numberField('Исполнение и доставка заказа, у.е./шт.',path+'fulfillmentPerOrder',s.fulfillmentPerOrder,
 'Дропшиппинг: доставка поставщика; иначе отправка покупателю')+
 numberField('Эквайринг / комиссия от цены, %',path+'acquiringPct',s.acquiringPct)+
 '</div></details>'+
 '<p class="nd-v2-description mt-3 text-xs">Общие помещения, сотрудники, сертификаты и кампании задаются ниже как отдельные оплачиваемые ресурсы — не копируйте их стоимость в этот SKU.</p></article>';
}
function render(){
 const host=document.getElementById('portfolio-v2-root');if(!host||!model)return;
 const demoLanguage=root.Nomad360UI?.getLanguage?.()||'ru';
  const demoCopy={
    ru:'Учебный пример магазина США · 12 месяцев · USD · Sales Tax 6,25%. Цифры — предположения, не прогноз спроса. Личный портфель не изменяется. «+ Новый портфель» действительно очищает поля.',
    en:'US retail study example · 12 months · USD · 6.25% Sales Tax. Values are assumptions, not verified demand. Your personal portfolio is untouched. “+ New portfolio” clears the fields.',
    kk:'АҚШ дүкенінің оқу мысалы · 12 ай · USD · Sales Tax 6,25%. Сандар — болжам, расталған сұраныс емес. Жеке портфеліңіз өзгермейді. «+ Жаңа портфель» өрістерді тазалайды.'
  };
  const demoBanner=activeStorageKey===usDemoStorageKey?'<aside id="us-retail-demo-notice" class="rounded-xl border-2 border-orange-400 p-4 mb-4 font-semibold" role="note" data-nomad-no-translate>'+safe(demoCopy[demoLanguage]||demoCopy.en)+'</aside>':'';
  host.innerHTML=demoBanner+'<div class="nd-v2-hero mb-5 rounded-2xl text-white p-5">'+
 '<div class="nd-v2-eyebrow text-xs tracking-widest uppercase">Самостоятельная портфельная модель · v2</div>'+
 '<h1 class="nd-v2-title text-2xl font-black mt-2">Мои товары и реальные деньги</h1>'+
 '<p class="mt-2" data-nomad-no-translate data-business-currency-note>'+safe(root.Nomad360Currency?.caption()||model.currency)+'</p>'+
 (activeStorageKey===usDemoStorageKey?
    '<p class="nd-v2-description text-sm mt-2">Демонстрация реального V2: 10 SKU, 14 ресурсов и годовой кредит. Все поля можно изменять; сохранение изолировано от личного расчёта.</p>':
    '<p class="nd-v2-description text-sm mt-2">Начните с рекламной воронки. Добавляйте товары, а общие расходы оплачивайте один раз. Здесь нет подставленных примеров.</p>')+
 '<div class="flex flex-wrap gap-2 mt-4"><button class="nd-v2-action nd-v2-action-outline bg-white text-slate-900 px-3 py-2 rounded-lg text-sm font-bold" type="button" data-p2-home>← Главная</button>'+
 '<button class="nd-v2-action nd-v2-action-primary nd-cta-primary px-3 py-2 rounded-lg text-sm font-bold" type="button" data-p2-save>Сохранить расчёт</button>'+
 '<button class="nd-v2-action nd-v2-action-outline border border-white/40 px-3 py-2 rounded-lg text-sm" type="button" data-p2-new>+ Новый портфель</button></div>'+
 '<div id="p2-draft-status" class="nd-v2-status mt-2 text-xs">Черновик сохраняется только в этом браузере</div></div>'+
 box('1. Общий маркетинговый двигатель',
 '<p class="nd-v2-description text-xs mb-3">Одна воронка на портфель: бюджет → CPC → клики → лиды → заказы. CTR нужен для показов. Отдельные дополнительные кампании можно назначить конкретным SKU ниже.</p>'+
 '<div class="nd-v2-form-grid grid grid-cols-2 gap-3">'+
 numberField('Общий рекламный бюджет / месяц','marketing.budget',model.marketing.budget)+
 numberField('CPC, цена клика','marketing.cpc',model.marketing.cpc)+
 numberField('CTR, %','marketing.ctrPct',model.marketing.ctrPct)+
 numberField('Клик → лид, %','marketing.clickLeadPct',model.marketing.clickLeadPct)+
 numberField('Лид → заказ, %','marketing.leadOrderPct',model.marketing.leadOrderPct)+
 numberField('Минимальный период, месяцев','marketing.periodMonths',model.marketing.periodMonths)+
 numberField('Коэффициент запаса CAC, %','marketing.cacReservePct',model.marketing.cacReservePct,'100% — без запаса; 75% — CAC / 0,75')+
 '</div>','p2-stage-marketing')+
 box('2. Товары и доли продаж','<p class="nd-v2-description text-sm mb-3">Три модели используют одну формулу цены; меняются состав себестоимости, наличие склада и момент расчёта с поставщиком.</p>'+
 model.skus.map(skuCard).join('')+
 '<div class="nd-v2-status text-sm font-semibold mb-3" id="p2-mix-sum">Сумма долей по штукам: '+pct(model.skus.reduce((a,s)=>a+Number(s.mixPct||0),0))+'</div>'+
 '<button type="button" data-p2-add-sku class="nd-v2-action nd-v2-action-secondary w-full rounded-xl bg-blue-700 px-4 py-4 text-white font-bold">+ Добавить товар</button>','p2-stage-skus')+
 stageResources('purchase','3. Закупка и сертификаты','Один сертификат можно распределить на несколько товаров только если он действительно покрывает их тип, страну и срок. Материалы / закупка — в себестоимости соответствующего SKU.','certification')+
 stageResources('production','4. Производство: помещения, работники, оборудование','Добавьте одну общую аренду или одну бригаду для нескольких товаров либо две отдельные записи. При известной загрузке задайте её по товарам и ограничение мощности.','premises')+
 stageResources('logistics','5. Склад и логистика','Общую аренду склада платим один раз. Хранение каждого товара по остаткам и дням остаётся индивидуальным — в его карточке.','warehouse')+
 stageResources('sales','6. Продажи и команда','Единая команда продаж — один фонд оплаты; независимые команды — отдельные записи ресурсов. Комиссия каждого товара уже в карточке SKU.','salesStaff')+
 stageResources('advertising','7. Рекламные бюджеты и маркетологи','Общий бюджет воронки уже распределяется по денежной доле SKU. Здесь добавляйте ОТДЕЛЬНЫЕ кампании и гонорары; дополнительный бюджет учитывается ровно один раз и не подменяет общий.','campaign')+
 stageResources('business','8. Прочие расходы бизнеса','Сайт, домен, контент и другие расходы относятся к бизнесу: один реальный платёж на список выбранных товаров.','website')+
 box('9. Налоги, собственные деньги и кредит',
 '<div class="nd-v2-form-grid grid grid-cols-2 gap-3">'+
 selField('Налог бизнеса','tax.type',model.tax.type,[['turnover','С оборота'],['profit','С прибыли']])+
 numberField('Ставка налога, %','tax.pct',model.tax.pct)+
 selField(taxText().v2TaxMode||'Режим налога','tax.taxRegime',model.tax.taxRegime||'vat', [['vat',taxText().v2VatLabel||'НДС (VAT / IVA)'],['sales_tax','Sales Tax'],['none',taxText().v2NoneLabel||'Без налога на продажу']])+ ((model.tax.taxRegime||'vat')==='vat'?numberField('НДС для цены покупателя, % (транзитный)','tax.vatPct',model.tax.vatPct):  (model.tax.taxRegime==='sales_tax'?numberField(taxText().v2SalesTaxRate||'Ставка Sales Tax, %','tax.salesTaxPct',model.tax.salesTaxPct??''):''))+
 numberField('Защитный резерв, % от кассового разрыва','funding.reservePct',model.funding.reservePct)+
 selField('Источник капитала','funding.kind',model.funding.kind,[['cash','Свои деньги'],['credit','Кредит']])+
 (model.funding.kind==='credit'?
 numberField('Ставка кредита, % годовых','funding.annualRatePct',model.funding.annualRatePct)+
 numberField('Срок кредита, месяцев','funding.months',model.funding.months):'')+
 '</div><p class="nd-v2-description text-xs mt-3" data-v2-tax-advisory>'+safe(taxText().v2NoticeFull||taxText().v2DeductionsNotice)+'</p><p class="nd-v2-description text-xs mt-3">Кредит: ежемесячные проценты и возврат всего тела в последний месяц (bullet). Тело кредита — выплата денежных средств, а не налоговый расход. Внесённые собственные деньги — тоже не прибыль.</p>',
 'p2-stage-financing')+
 '<section id="p2-results" class="nd-v2-result-frame rounded-2xl text-white p-5 mb-6" aria-live="polite"></section>';
 const status=document.getElementById('p2-draft-status');if(status)status.textContent='Изменения сохраняются в этом браузере';
 root.Nomad360PaymentUI?.paintPortfolio(model);
 updateResult();
 translateEnglishStudyText();
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
 const taxMode=model.tax?.taxRegime||'vat',taxRate=model.tax?.salesTaxPct;
 let prepared;
 try{prepared=root.Nomad360SalesTaxV2?.prepareStandalone(model,{mode:taxMode,ratePct:taxRate})||model;}
 catch(error){
   displayInlineValidation([{path:'tax.salesTaxPct',message:'Введите корректную ставку Sales Tax, %. '+error.message}]);
   el.textContent='Проверьте ставку Sales Tax: расчёт приостановлен.';
   return;
 }
 const out=root.Nomad360PaymentUI?.buildPortfolio(prepared)||Engine.build(prepared);
 if(out.paymentPending){el.innerHTML='<p class="nd-payment-pending" data-nomad-no-translate role="alert">'+safe(root.Nomad360PaymentUI.pendingMessage())+'</p>';root.Nomad360UI?.syncPortfolioActions?.(out,model,'standalone');return;}
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
   root.Nomad360UI?.syncPortfolioActions?.(out,model,'standalone');return;
 }
 const r=taxMode==='vat'?out:root.Nomad360SalesTaxV2.project(out,{mode:taxMode,ratePct:taxRate});
 const taxLines=taxMode!=='vat'?'<section data-p2-sales-tax-summary class="rounded-xl border border-white/25 p-3 mt-3">'+
 '<h3 class="font-bold">'+safe(taxText().v2BuyerSummary||'Налог с продаж — итог для покупателя')+'</h3>'+
 r.salesTaxSummary.lines.map(q=>'<p data-tax-sku="'+safe(q.id)+'">Выручка '+money(q.net)+
 ' + Sales Tax '+money(q.salesTax)+' = покупатель платит '+money(q.customerTotal)+'</p>').join('')+
 '<p><b>Итого Sales Tax '+money(r.salesTaxSummary.salesTax)+
 '; сумма покупателей '+money(r.salesTaxSummary.customerTotal)+'</b></p></section>':'';
 const heads=['Товар',taxMode==='vat'?'Цена без НДС':'Цена без налога с продаж','Себест.','Mix шт.','Mix выручки','Weighted CAC','Прогноз, шт/мес','Рекламный бюджет','EBITDA SKU','ROAS'];
 const skuRows=r.items.map(s=>'<tr class="border-t border-white/20">'+
 [safe(s.name),money(s.price),money(s.unitCost),pct(s.mix*100),pct(s.revenueWeight*100),
 money(s.weightedCAC),money(s.forecastOrders),money(s.adBudget),money(s.ebitda),
 s.roas===null?'—':money(s.roas)+'×'].map((k,column)=>'<td class="px-2 py-3 whitespace-nowrap"'+(column===0?' data-nomad-no-translate':'')+'>'+k+'</td>').join('')+'</tr>').join('');
 const cashHeads=['Месяц','Продажи','Выплаты','Операционный cash flow','Кредит / свои','Проценты','Возврат тела','Чистый CF','Накопленный CF','ЖИВЫЕ ДЕНЬГИ'];
 const cashRows=r.months.map(m=>'<tr class="border-t border-white/20">'+
 [m.month,money(m.receipt),money(m.outflow),money(m.preFinancing),
 money(m.loanDraw+m.ownerDraw),money(m.interest),money(m.principalRepayment),
 money(m.cashFlow),money(m.cumulative),money(m.freeCumulative)]
 .map(k=>'<td class="px-2 py-2 whitespace-nowrap">'+k+'</td>').join('')+'</tr>').join('');
 const resourceRows=r.resources.map(v=>'<tr class="border-t border-white/20"><td class="p-2" data-nomad-no-translate>'+safe(v.label)+'</td><td class="p-2">'+
 money(v.amount)+'</td><td class="p-2">'+(v.cadence==='once'?'раз':'месяц')+'</td><td class="p-2">'+
 Object.entries(v.bySku).map(([id,amount])=>'<span data-nomad-no-translate>'+safe(r.items.find(s=>s.id===id)?.name||id)+'</span>: '+money(amount)).join('; ')+'</td></tr>').join('');
 el.innerHTML=intro+taxLines+
 '<div class="nd-v2-financial-grid grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">'+
 [['Чистая прибыль · базовый месяц',r.netProfit],['Рентабельность товара (взвешенная), %',r.weightedMarginPct],
 ['Деньги на запуск',r.financing.principal],['Резерв',r.financing.reserve],
 ['ROAS бизнеса',r.totalROAS],['EBITDA · базовый месяц',r.businessEBITDA],
 ['Накопленный CF',r.finalCash],['ЖИВЫЕ ДЕНЬГИ',r.freeCash]]
 .map(([t,v],i)=>'<div class="nd-v2-financial-cell rounded-xl '+(i===7?'bg-emerald-200 text-emerald-950':'bg-white/15 text-white')+
 ' p-3"><div class="text-xs">'+safe(t)+'</div><div class="nd-v2-number-value text-xl font-black mt-1">'+
 (i===1?pct(v):i===4?money(v)+'×':money(v))+'</div></div>').join('')+'</div>'+
 '<p class="text-xs text-emerald-50 mt-3">'+(taxMode==='vat'?'Цена без НДС':'Цена без налога с продаж')+' рассчитывается по базовому CAC и целевой марже. Фактическая SKU-маржа после Weighted CAC может отличаться от целевой. Начальные закупки — денежный аванс, а COGS признаётся при продаже, без двойного счёта.</p>'+
 '<h3 class="font-bold mt-5">Портфель: цены, доли и нагрузка</h3>'+
 '<div class="overflow-x-auto mt-2"><table class="text-xs text-left w-full"><thead><tr>'+
 heads.map(h=>'<th class="px-2 py-3 whitespace-nowrap">'+safe(h)+'</th>').join('')+'</tr></thead><tbody>'+skuRows+'</tbody></table></div>'+
 '<p class="text-sm mt-3">Всего рекламы в месяц: <strong>'+money(r.marketingBudget)+'</strong>. На SKU распределено: <strong>'+money(r.invariants.adAllocated)+'</strong>. Денежные доли суммарно '+pct(r.invariants.weightSum*100)+'.</p>'+
 '<h3 class="font-bold mt-5">Общие ресурсы — одна оплата, несколько получателей</h3>'+
 '<div class="overflow-x-auto"><table class="text-xs w-full text-left"><thead><tr><th class="p-2">Ресурс</th><th class="p-2">Сумма</th><th class="p-2">Частота</th><th class="p-2">Кому отнесено</th></tr></thead><tbody>'+resourceRows+'</tbody></table></div>'+
 '<p class="text-xs mt-3" data-i18n="finance.theBaseMonthResultIsAfterBusinessTaxAndBeforeLoanInterestDepreciationIsNotCalculatedS"></p>'+
 '<h3 class="font-bold mt-5">Помесячный cash flow · '+r.months.length+' месяцев</h3>'+
 '<div class="overflow-x-auto mt-2"><table class="text-xs text-left w-full"><thead><tr>'+
 cashHeads.map(h=>'<th class="px-2 py-3 whitespace-nowrap">'+safe(h)+'</th>').join('')+'</tr></thead><tbody>'+cashRows+'</tbody></table></div>'+
 '<p class="text-xs mt-3">«Живые деньги» = накопленный денежный остаток с учётом начального собственного взноса или кредита, минус защищённый резерв. Это не прибыль. Проценты уплачиваются ежемесячно, тело кредита — в последний месяц. Месяц = 30 дней.</p>';
 root.Nomad360UI?.syncPortfolioActions?.(r,model,'standalone');
 translateEnglishStudyText();
}
function applyPaymentConversion(path,quote){
 const [,i,key]=path.split('.'),sku=model.skus[Number(i)];
 if(!root.Nomad360Payments.fields(sku).includes(key))throw Error('Invalid payment field');
 sku.payments=sku.payments||{};
 sku.payments[key]=root.Nomad360Payments.apply(sku[key],sku.payments[key]?.paymentCurrency??model.currency,model.currency,root.Nomad360Currency.valid,quote);
 save();root.Nomad360PaymentUI.paintPortfolio(model);updateResult();
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
 if(t.matches?.('[data-payment-currency]')){
   if(event.type!=='change')return;
   const path=t.closest('[data-payment-path]')?.dataset.paymentPath;
   if(path){root.Nomad360PaymentUI.updatePortfolio(model,path,t.value);save();root.Nomad360PaymentUI.paintPortfolio(model);updateResult();root.Nomad360LocaleCore?.localizeAll?.();}
   return;
 }
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
   root.Nomad360PaymentUI?.paintPortfolio(model);
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
 if('p2New'in hit.dataset){model=initial();save();if(activeStorageKey===usDemoStorageKey){try{localStorage.setItem(usDemoResetKey,'1')}catch(_){}}render();return;}
 if('p2AddSku'in hit.dataset){addSku();save();render();return;}
 if('p2RemoveSku'in hit.dataset){if(removeItem('sku',hit.dataset.p2RemoveSku)){save();render();}return;}
 if('p2AddResource'in hit.dataset){addResource(hit.dataset.p2AddResource);save();render();return;}
 if('p2DeleteResource'in hit.dataset){removeItem('resource',hit.dataset.p2DeleteResource);save();render();}
}
function mount(){
 const el=document.getElementById('portfolio-v2-root');
 if(el){el.addEventListener('input',handleEvent);el.addEventListener('change',handleEvent);el.addEventListener('click',handleEvent);}
 updateEntry();
 document.addEventListener('nomad360:languagechange',()=>{if(model)render();});
}
root.PortfolioV2UI=Object.freeze({open,openDemo,localizeStudyNames,load,loadStudy,studyWasReset,updateEntry,applyPaymentConversion,getState:()=>model?JSON.parse(JSON.stringify(model)):null,refreshPayments:()=>{root.Nomad360PaymentUI?.paintPortfolio(model);updateResult();}});
root.openPortfolioV2=function(resume=false){open({resume});};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
else mount();
})(window);

/* V2_FIELDS_PRESENTATION_START
   Native selects keep their existing events and keyboard behavior. When the
   chosen value is clipped, repeat its full text below that same field. */
(function(root){
 'use strict';
 const host=document.getElementById('portfolio-v2-root');if(!host)return;
 const canvas=document.createElement('canvas'),measure=canvas.getContext('2d');
 let scheduled=false,lastWidth=-1;
 function refresh(){
  scheduled=false;
  for(const select of host.querySelectorAll('.nd-v2-field select')){
   if(!select.getClientRects().length)continue;
   const style=getComputedStyle(select),text=select.selectedOptions[0]?.textContent?.trim()||'';
   measure.font=[style.fontStyle,style.fontWeight,style.fontSize,style.fontFamily].join(' ');
   const spacing=Number.parseFloat(style.letterSpacing)||0;
   const available=select.clientWidth-Number.parseFloat(style.paddingLeft)-Number.parseFloat(style.paddingRight)-24;
   const clipped=measure.measureText(text).width+Math.max(0,text.length-1)*spacing>available+1;
   let note=select.nextElementSibling?.matches('.nd-v2-selected-value')?select.nextElementSibling:null;
   if(!clipped||!text){note?.remove();continue;}
   if(!note){
    note=document.createElement('span');note.className='nd-v2-selected-value';
    note.setAttribute('aria-hidden','true');note.setAttribute('data-nomad-no-translate','');
    select.after(note);
   }
   if(note.textContent!==text)note.textContent=text;
  }
 }
 function schedule(){if(!scheduled){scheduled=true;root.requestAnimationFrame(refresh);}}
 host.addEventListener('change',schedule);
 root.addEventListener('resize',schedule);
 document.fonts?.addEventListener('loadingdone',schedule);
 new MutationObserver(schedule).observe(host,{childList:true,subtree:true,characterData:true});
 new ResizeObserver(()=>{if(host.clientWidth!==lastWidth){lastWidth=host.clientWidth;schedule();}}).observe(host);
 root.Nomad360V2Fields=Object.freeze({refresh});schedule();
})(window);
/* V2_FIELDS_PRESENTATION_END */

