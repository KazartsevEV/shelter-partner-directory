'use strict';
// V2-OUTPUT-TRUTH-01: strict post-approval PRESENTATION-only source normalization.
// Every byte outside the three accepted HTML output regions and marketing title
// must match the merged PR189 main. No engines, state, finance or tax projections
// can be covered by this exception.
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const repo=path.resolve(__dirname,'../..');
const base='cfc7e3d4f429004def715a4acc586a3b3fb984d1';
const original=()=>execFileSync('git',['show',base+':portfolio_v2_ui.js'],{cwd:repo,encoding:'utf8'});
function exactOnce(source,part,label){
 assert.equal(source.split(part).length-1,1,'Missing/duplicate audited '+label);
 return part;
}
function block(source,start,end,label){
 exactOnce(source,start,label+' start');exactOnce(source,end,label+' end');
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(b>a,'Inverted '+label);
 return source.slice(a,b);
}
function restore(file,source){
 if(file!=='portfolio_v2_ui.js')return source;
 const historic=original();
 let current=source;
 // UI-COPY-04: normalize exactly the two user-approved prose removals
 // before the pre-existing strict V2 output-only financial byte guard.
 const trimmed="Одна воронка на портфель: бюджет → CPC → клики → лиды → заказы. Отдельные дополнительные кампании можно назначить конкретным SKU ниже.";
 const historicFunnel="Одна воронка на портфель: бюджет → CPC → клики → лиды → заказы. CTR нужен для показов. Отдельные дополнительные кампании можно назначить конкретным SKU ниже.";
 exactOnce(current,trimmed,'user-approved shortened marketing guidance');
 current=current.replace(trimmed,historicFunnel);
 const products="box('2. Товары и доли продаж',\n model.skus.map(skuCard).join('')+";
 const originalProducts="box('2. Товары и доли продаж','<p class=\\"nd-v2-description text-sm mb-3\\">Три модели используют одну формулу цены; меняются состав себестоимости, наличие склада и момент расчёта с поставщиком.</p>'+\n model.skus.map(skuCard).join('')+";
 exactOnce(current,products,'removed redundant sourcing explanation');
 current=current.replace(products,originalProducts);
 const added=block(current,' const presentationLocale=',' const heads=[', 'reference-month presentation');
 const prior=block(historic,' const taxLines=',' const heads=[','historical tax presentation');
 for(const ref of ['salesTaxSummary.lines','salesTaxSummary.net','salesTaxSummary.salesTax','salesTaxSummary.customerTotal','q.net','q.salesTax','q.customerTotal']){
  assert.ok(added.includes(ref),'Missing source projection field: '+ref);
 }
 assert.doesNotMatch(added,/Engine\.build\(|Nomad360SalesTaxV2\.project\(|localStorage|save\(|\.push\(|\.splice\(/,'Tax panel must be read-only');
 current=current.replace(added,prior);
 const resources=block(current,' const resourceCards=',' el.innerHTML=intro+taxLines+', 'resource recipient presentation');
 const oldResources=block(historic,' const resourceRows=',' el.innerHTML=intro+taxLines+', 'historical resource rows');
 for(const ref of ['r.resources.map','Object.entries(v.bySku)','v.amount','v.cadence'])assert.ok(resources.includes(ref),'Resource display lost '+ref);
 assert.doesNotMatch(resources,/localStorage|save\(|Engine\.build\(|\.push\(|\.splice\(/,'Resource panel must be read-only');
 current=current.replace(resources,oldResources);
 const latest="'<div data-p2-resource-cards class=\"grid grid-cols-1 lg:grid-cols-2 gap-3 mt-2\">'+resourceCards+'</div>'+";
 const old="'<div class=\"overflow-x-auto\"><table class=\"text-xs w-full text-left\"><thead><tr><th class=\"p-2\">Ресурс</th><th class=\"p-2\">Сумма</th><th class=\"p-2\">Частота</th><th class=\"p-2\">Кому отнесено</th></tr></thead><tbody>'+resourceRows+'</tbody></table></div>'+";
 exactOnce(current,latest,'responsive resource card mount');exactOnce(historic,old,'original resource table mount');
 current=current.replace(latest,old);
 exactOnce(current,"box('1. Реклама и маркетинг',",'approved heading');
 current=current.replace("box('1. Реклама и маркетинг',","box('1. Общий маркетинговый двигатель',");
 assert.equal(current,historic,'Unapproved V2 UI delta outside reviewed output-only regions');
 return current;
}
module.exports={restore};
