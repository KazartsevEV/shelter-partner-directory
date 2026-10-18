/* US-RETAIL-DEMO-12M — opt-in study case in the real Nomad360 standalone V2.
   The study autosave is isolated; never overwrite marketingCalcPortfolioV2. */
(function(root){
'use strict';
const STATE={
  "version": 2,
  "currency": "USD",
  "businessCurrency": "USD",
  "marketing": {
    "budget": 1800,
    "cpc": 1.05,
    "ctrPct": 2.4,
    "clickLeadPct": 30,
    "leadOrderPct": 25,
    "periodMonths": 12,
    "cacReservePct": 100
  },
  "skus": [
    {
      "id": "sku-1",
      "name": "Handmade holiday gift box",
      "source": "own",
      "unitCost": 38,
      "marginPct": 65,
      "mixPct": 10,
      "batchUnits": 180,
      "initialCashOut": 1710,
      "fulfillmentPerOrder": 5,
      "storagePerUnitDay": 0.002,
      "acquiringPct": 2.7
    },
    {
      "id": "sku-2",
      "name": "Personalized wooden keepsake",
      "source": "own",
      "unitCost": 55,
      "marginPct": 65,
      "mixPct": 10,
      "batchUnits": 180,
      "initialCashOut": 2475,
      "fulfillmentPerOrder": 6,
      "storagePerUnitDay": 0.002,
      "acquiringPct": 2.7
    },
    {
      "id": "sku-3",
      "name": "Woven throw blanket",
      "source": "resale",
      "unitCost": 80,
      "marginPct": 62,
      "mixPct": 12,
      "batchUnits": 216,
      "initialCashOut": 4320,
      "fulfillmentPerOrder": 10,
      "storagePerUnitDay": 0.002,
      "acquiringPct": 2.7
    },
    {
      "id": "sku-4",
      "name": "Home storage basket",
      "source": "resale",
      "unitCost": 55,
      "marginPct": 62,
      "mixPct": 12,
      "batchUnits": 216,
      "initialCashOut": 2970,
      "fulfillmentPerOrder": 9,
      "storagePerUnitDay": 0.002,
      "acquiringPct": 2.7
    },
    {
      "id": "sku-5",
      "name": "Electric kettle",
      "source": "resale",
      "unitCost": 110,
      "marginPct": 60,
      "mixPct": 10,
      "batchUnits": 180,
      "initialCashOut": 4950,
      "fulfillmentPerOrder": 11,
      "storagePerUnitDay": 0.002,
      "acquiringPct": 2.7
    },
    {
      "id": "sku-6",
      "name": "Table lamp",
      "source": "resale",
      "unitCost": 95,
      "marginPct": 62,
      "mixPct": 10,
      "batchUnits": 180,
      "initialCashOut": 4275,
      "fulfillmentPerOrder": 12,
      "storagePerUnitDay": 0.002,
      "acquiringPct": 2.7
    },
    {
      "id": "sku-7",
      "name": "Desk organizer",
      "source": "resale",
      "unitCost": 35,
      "marginPct": 60,
      "mixPct": 10,
      "batchUnits": 180,
      "initialCashOut": 1575,
      "fulfillmentPerOrder": 7,
      "storagePerUnitDay": 0.001,
      "acquiringPct": 2.7
    },
    {
      "id": "sku-8",
      "name": "Ceramic serving set",
      "source": "resale",
      "unitCost": 70,
      "marginPct": 62,
      "mixPct": 8,
      "batchUnits": 144,
      "initialCashOut": 2520,
      "fulfillmentPerOrder": 11,
      "storagePerUnitDay": 0.002,
      "acquiringPct": 2.7
    },
    {
      "id": "sku-9",
      "name": "Replacement vacuum filters",
      "source": "dropship",
      "unitCost": 32,
      "marginPct": 55,
      "mixPct": 8,
      "batchUnits": "",
      "initialCashOut": "",
      "fulfillmentPerOrder": 6,
      "storagePerUnitDay": 0,
      "acquiringPct": 2.7
    },
    {
      "id": "sku-10",
      "name": "Appliance repair adapter kit",
      "source": "dropship",
      "unitCost": 48,
      "marginPct": 58,
      "mixPct": 10,
      "batchUnits": "",
      "initialCashOut": "",
      "fulfillmentPerOrder": 6,
      "storagePerUnitDay": 0,
      "acquiringPct": 2.7
    }
  ],
  "resources": [
    {
      "id": "resource-1",
      "kind": "premises",
      "label": "Retail storefront lease",
      "amount": 2300,
      "cadence": "monthly",
      "allocation": "revenue",
      "skuIds": [
        "sku-1",
        "sku-2",
        "sku-3",
        "sku-4",
        "sku-5",
        "sku-6",
        "sku-7",
        "sku-8"
      ],
      "usage": {},
      "capacity": ""
    },
    {
      "id": "resource-2",
      "kind": "premises",
      "label": "Small production workshop lease",
      "amount": 800,
      "cadence": "monthly",
      "allocation": "usage",
      "skuIds": [
        "sku-1",
        "sku-2"
      ],
      "usage": {
        "sku-1": 80,
        "sku-2": 105
      },
      "capacity": 220
    },
    {
      "id": "resource-3",
      "kind": "salesStaff",
      "label": "Sales associate W-2 cost",
      "amount": 3600,
      "cadence": "monthly",
      "allocation": "usage",
      "skuIds": [
        "sku-1",
        "sku-2",
        "sku-3",
        "sku-4",
        "sku-5",
        "sku-6",
        "sku-7",
        "sku-8"
      ],
      "usage": {
        "sku-1": 10,
        "sku-2": 10,
        "sku-3": 20,
        "sku-4": 20,
        "sku-5": 20,
        "sku-6": 20,
        "sku-7": 15,
        "sku-8": 15
      },
      "capacity": 160
    },
    {
      "id": "resource-4",
      "kind": "workers",
      "label": "Part-time stockroom/loader W-2 cost",
      "amount": 1150,
      "cadence": "monthly",
      "allocation": "usage",
      "skuIds": [
        "sku-3",
        "sku-4",
        "sku-5",
        "sku-6",
        "sku-7",
        "sku-8"
      ],
      "usage": {
        "sku-3": 15,
        "sku-4": 20,
        "sku-5": 16,
        "sku-6": 18,
        "sku-7": 12,
        "sku-8": 10
      },
      "capacity": 100
    },
    {
      "id": "resource-5",
      "kind": "workers",
      "label": "Owner craft labor allowance",
      "amount": 1800,
      "cadence": "monthly",
      "allocation": "usage",
      "skuIds": [
        "sku-1",
        "sku-2"
      ],
      "usage": {
        "sku-1": 70,
        "sku-2": 95
      },
      "capacity": 200
    },
    {
      "id": "resource-6",
      "kind": "marketingManager",
      "label": "Contract marketing manager",
      "amount": 850,
      "cadence": "monthly",
      "allocation": "revenue",
      "skuIds": [
        "sku-1",
        "sku-2",
        "sku-3",
        "sku-4",
        "sku-5",
        "sku-6",
        "sku-7",
        "sku-8",
        "sku-9",
        "sku-10"
      ],
      "usage": {},
      "capacity": ""
    },
    {
      "id": "resource-7",
      "kind": "equipment",
      "label": "Rented shop display racks and POS",
      "amount": 275,
      "cadence": "monthly",
      "allocation": "revenue",
      "skuIds": [
        "sku-1",
        "sku-2",
        "sku-3",
        "sku-4",
        "sku-5",
        "sku-6",
        "sku-7",
        "sku-8"
      ],
      "usage": {},
      "capacity": ""
    },
    {
      "id": "resource-8",
      "kind": "equipment",
      "label": "Hand tools and engraving equipment purchase",
      "amount": 2400,
      "cadence": "once",
      "allocation": "revenue",
      "skuIds": [
        "sku-1",
        "sku-2"
      ],
      "usage": {},
      "capacity": ""
    },
    {
      "id": "resource-9",
      "kind": "other",
      "label": "Business liability and property insurance",
      "amount": 255,
      "cadence": "monthly",
      "allocation": "revenue",
      "skuIds": [
        "sku-1",
        "sku-2",
        "sku-3",
        "sku-4",
        "sku-5",
        "sku-6",
        "sku-7",
        "sku-8",
        "sku-9",
        "sku-10"
      ],
      "usage": {},
      "capacity": ""
    },
    {
      "id": "resource-10",
      "kind": "other",
      "label": "Utilities for storefront and workshop",
      "amount": 330,
      "cadence": "monthly",
      "allocation": "revenue",
      "skuIds": [
        "sku-1",
        "sku-2",
        "sku-3",
        "sku-4",
        "sku-5",
        "sku-6",
        "sku-7",
        "sku-8"
      ],
      "usage": {},
      "capacity": ""
    },
    {
      "id": "resource-11",
      "kind": "website",
      "label": "E-commerce website platform",
      "amount": 105,
      "cadence": "monthly",
      "allocation": "revenue",
      "skuIds": [
        "sku-1",
        "sku-2",
        "sku-3",
        "sku-4",
        "sku-5",
        "sku-6",
        "sku-7",
        "sku-8",
        "sku-9",
        "sku-10"
      ],
      "usage": {},
      "capacity": ""
    },
    {
      "id": "resource-12",
      "kind": "domain",
      "label": "Domain registration at launch",
      "amount": 20,
      "cadence": "once",
      "allocation": "revenue",
      "skuIds": [
        "sku-1",
        "sku-2",
        "sku-3",
        "sku-4",
        "sku-5",
        "sku-6",
        "sku-7",
        "sku-8",
        "sku-9",
        "sku-10"
      ],
      "usage": {},
      "capacity": ""
    },
    {
      "id": "resource-13",
      "kind": "warehouse",
      "label": "Stockroom shelf and offsite space rental",
      "amount": 340,
      "cadence": "monthly",
      "allocation": "revenue",
      "skuIds": [
        "sku-3",
        "sku-4",
        "sku-5",
        "sku-6",
        "sku-7",
        "sku-8"
      ],
      "usage": {},
      "capacity": ""
    },
    {
      "id": "resource-14",
      "kind": "campaign",
      "label": "Holiday gift workshop campaign extra spend",
      "amount": 300,
      "cadence": "monthly",
      "allocation": "revenue",
      "skuIds": [
        "sku-1",
        "sku-2"
      ],
      "usage": {},
      "capacity": ""
    }
  ],
  "funding": {
    "kind": "credit",
    "annualRatePct": 11.5,
    "months": 12,
    "reservePct": 10
  },
  "tax": {
    "type": "profit",
    "pct": 0,
    "vatPct": 0,
    "taxRegime": "sales_tax",
    "salesTaxPct": 6.25
  }
};
const copy=()=>JSON.parse(JSON.stringify(STATE));
// Only educational names are translated. Never translate ordinary user-entered
// SKU/resource names or rewrite a customized study label on a language switch.
const names={
 ru:{
  skus:[
   'Подарочный набор ручной работы',
   'Именной деревянный сувенир',
   'Плед',
   'Корзина для хранения вещей',
   'Электрический чайник',
   'Настольная лампа',
   'Настольный органайзер',
   'Керамический сервировочный набор',
   'Сменные фильтры для пылесоса',
   'Комплект переходников для ремонта бытовой техники'
  ],
  resources:[
   'Аренда торгового помещения',
   'Аренда небольшой мастерской',
   'Продавец (работник по форме W-2)',
   'Грузчик-кладовщик, неполная занятость (W-2)',
   'Оплата труда владельца в мастерской',
   'Маркетолог по договору',
   'Аренда торговых стеллажей и кассового оборудования',
   'Покупка инструментов и гравировального оборудования',
   'Страхование ответственности и имущества',
   'Коммунальные услуги магазина и мастерской',
   'Платформа интернет-магазина',
   'Регистрация домена при запуске',
   'Аренда складских стеллажей и дополнительного помещения',
   'Дополнительная рекламная кампания подарочной мастерской'
  ]},
 kk:{
  skus:[
   'Қолдан жасалған сыйлық жиынтығы',
   'Аты жазылған ағаш кәдесый',
   'Тоқылған жамылғы',
   'Зат сақтауға арналған себет',
   'Электр шәйнек',
   'Үстел шамы',
   'Үстел органайзері',
   'Қыштан жасалған дастарқан жиынтығы',
   'Шаңсорғыштың ауыстырмалы сүзгілері',
   'Тұрмыстық техниканы жөндеуге арналған жалғағыштар жиынтығы'
  ],
  resources:[
   'Дүкен үй-жайын жалға алу',
   'Шағын шеберхананы жалға алу',
   'Сатушының еңбек шығыны (W-2)',
   'Жарты күн жұмыс істейтін қоймашы-жүк тиеуші (W-2)',
   'Шеберханадағы иесінің еңбекақысы',
   'Келісімшарт бойынша маркетолог',
   'Сауда сөрелері мен касса жабдығын жалға алу',
   'Құрал-саймандар мен нақыштау жабдығын сатып алу',
   'Жауапкершілік пен мүлікті сақтандыру',
   'Дүкен мен шеберхананың коммуналдық шығындары',
   'Интернет-дүкен платформасы',
   'Іске қосу кезіндегі доменді тіркеу',
   'Қойма сөрелері мен қосымша бөлмені жалға алу',
   'Сыйлық шеберханасының қосымша жарнама науқаны'
  ]},
 en:{
  skus:STATE.skus.map(x=>x.name),
  resources:STATE.resources.map(x=>x.label)
 }
};
const isKnown=(kind,index,current)=>['ru','en','kk'].some(l=>names[l][kind][index]===current);
function relabel(state,language){
  const active=names[language]||names.ru;
  for(const [kind,property] of [['skus','name'],['resources','label']]){
    (state[kind]||[]).forEach(entry=>{
      const index=STATE[kind].findIndex(item=>item.id===entry.id);
      if(index<0||!isKnown(kind,index,entry[property]))return;
      entry[property]=active[kind][index];
    });
  }
  return state;
}
function localizedLabels(language){
  const target=names[language]||names.ru;
  const result={skus:{},resources:{}};
  for(const kind of ['skus','resources']){
    STATE[kind].forEach((item,index)=>{
      result[kind][item.id]={
        target:target[kind][index],
        known:['ru','en','kk'].map(l=>names[l][kind][index])
      };
    });
  }
  return result;
}
const messages={
  ru:{action:'Открыть учебный магазин США · 12 месяцев',hint:'10 товаров · 3 способа продаж · кредит · Sales Tax. Данные учебные, ваш расчёт не затрагивается.',error:'Не удалось открыть пример магазина. Проверьте данные и повторите попытку.'},
  en:{action:'Open the US shop study · 12 months',hint:'10 products · 3 sales methods · credit · Sales Tax. Example data only; your calculation is preserved.',error:'Could not open the US shop example. Check the data and try again.'},
  kk:{action:'АҚШ дүкенінің оқу мысалын ашу · 12 ай',hint:'10 тауар · 3 сату тәсілі · несие · Sales Tax. Оқу деректері; жеке есебіңіз сақталады.',error:'Дүкен мысалын ашу мүмкін болмады. Деректерді тексеріп, қайталаңыз.'}
};
const lang=()=>root.Nomad360UI?.getLanguage?.()||'ru';
const words=()=>messages[lang()]||messages.en;
function launch(){
  try{
    if(!root.PortfolioV2UI?.openDemo)throw Error('US retail V2 interface is not loaded');
    const saved=root.PortfolioV2UI.loadStudy?.();
    // Only the explicit reset action discards an autosaved study.
    // A one-SKU customized business is still a valid draft.
    const resume=Boolean(saved&&!root.PortfolioV2UI.studyWasReset?.());
    root.PortfolioV2UI.openDemo(relabel(resume?saved:copy(),lang()),{resume});
    const err=document.getElementById('us-retail-demo-error');
    if(err)err.hidden=true;
  }
  catch(error){const el=document.getElementById('us-retail-demo-error');if(el){el.textContent=words().error+' ('+String(error.message||error)+')';el.hidden=false;}else throw error;}
}
function refresh(){
  const button=document.getElementById('us-retail-demo-launch');
  const hint=document.getElementById('us-retail-demo-hint');
  if(button)button.textContent=words().action;
  if(hint)hint.textContent=words().hint;
  root.PortfolioV2UI?.localizeStudyNames?.(localizedLabels(lang()));
}
function mount(){
  const home=document.querySelector('#nomad360-selling-choice');
  if(!home||document.getElementById('us-retail-demo-launch'))return;
  const section=document.createElement('section');
  section.id='us-retail-demo-entry';
  section.setAttribute('data-nomad-no-translate','');
  section.className='mt-4 rounded-xl border-2 border-white/30 p-4';
  const button=document.createElement('button');
  button.type='button';
  button.id='us-retail-demo-launch';
  button.className='nd-v2-action nd-v2-action-secondary rounded-xl px-4 py-3 font-semibold w-full';
  button.addEventListener('click',launch);
  const hint=document.createElement('p');
  hint.id='us-retail-demo-hint';hint.className='nd-type-note mt-2 text-sm';
  const err=document.createElement('p');
  err.id='us-retail-demo-error';err.setAttribute('role','alert');err.hidden=true;
  section.append(button,hint,err);
  home.append(section);
  refresh();
  const params=new URLSearchParams(root.location.search);
  if(params.get('demo')==='us-retail-12m'){
    // English walkthrough link opts into the existing language system;
    // it never changes the main production calculator or its model.
    if(['ru','en','kk'].includes(params.get('lang')))root.Nomad360UI?.setLanguage?.(params.get('lang'));
    launch();
  }
}
root.Nomad360USRetailDemo=Object.freeze({getState:copy,launch});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
else mount();
document.addEventListener('nomad360:languagechange',refresh);
})(window);
