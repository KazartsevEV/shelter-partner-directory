'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const base=path.resolve(__dirname,'..'),SHA='9e5a7f51b22ff9240cb9a520203182e0b448d623';
const source=fs.readFileSync(path.join(base,'nomad360_locale_core.js'),'utf8');
function boot(src){const win={Nomad360UI:{getLanguage:()=> 'en'}};new Function('window','document',src)(win,{readyState:'loading',addEventListener(){}});return win.Nomad360LocaleCore}
const core=boot(source),baseline=boot(execFileSync('git',['show',SHA+':nomad360_locale_core.js'],{cwd:base,encoding:'utf8'}));
test('every established alias keeps its exact RU/EN/KK meaning after semantic migration',()=>{
 const keys=core.keys();A.ok(keys.length>=1295);A.equal(new Set(keys).size,keys.length);
 const aliases=core.aliases().filter(alias=>baseline.hasTranslation(alias));
 A.equal(aliases.length,1289,'two extra V2 explanatory sentences intentionally retired; all other historical aliases remain');
 A.deepEqual(['ru','en','kk'].map(lang=>core.t('ui.value1SharedMarketingEngine',lang)),
  ['1. Реклама и маркетинг','1. Advertising and marketing','1. Жарнама және маркетинг']);
 const approved=new Set(['Чистая прибыль · базовый месяц','Чистая выручка (после эквайринга)','Чистая выручка','ROAS (возврат рекламы)','CAC (цена клиента полная)','CPA / CAC','Рекламный / Полный']);
 for(const alias of aliases)for(const lang of ['ru','en','kk']){
  if(approved.has(alias))A.equal(core.translate(alias,lang),core.t(core.keyForLegacy(alias),lang),'approved label '+alias);
  else if(lang==='kk')A.deepEqual(core.translate(alias,lang).match(/\d+(?:[.,]\d+)*/g)||[],baseline.translate(alias,lang).match(/\d+(?:[.,]\d+)*/g)||[],'numeric tokens changed in KK: '+alias);
  else A.equal(core.translate(alias,lang),baseline.translate(alias,lang),lang+' '+alias);
 }
 A.equal(core.keyForLegacy('Выручка'),'finance.revenue');A.equal(core.keyForLegacy('Наценка'),'pricing.markup');
 A.equal(core.t('finance.revenue','en'),'Revenue');
});
test('missing semantic messages and parameters are explicit and diagnosed without Russian fallback',()=>{
 core.clearDiagnostics();
 A.equal(core.t('finance.doesNotExist','kk'),'⟦finance.doesNotExist:kk⟧');
 A.ok(core.diagnostics().some(d=>d.type==='missing-translation'&&d.key==='finance.doesNotExist'&&d.language==='kk'));
 A.ok(core.t('validation.receipt.invalidItem','en',{receipt:'X'}).includes('{item}'));
 A.ok(core.diagnostics().some(d=>d.type==='missing-parameter'&&d.details==='item'));
 core.translate('Неизвестная интерфейсная строка','en');
 A.ok(core.diagnostics().some(d=>d.type==='missing-legacy-alias'));
 A.equal(core.keyForLegacy('user-product-id'),null);
});
test('receipt parameters, numbers and user-owned names are inserted literally; old real diagnostics now translate',()=>{
 const unusual='Товар <b>20</b> $& {item}';
 A.equal(core.t('validation.receipt.invalidItem','en',{receipt:unusual,item:35}),`Receipt ${unusual}: invalid item 35.`);
 A.equal(core.translate('Чек 1: нужен непустой список items.','en'),'Receipt 1: items must contain at least one product.');
 A.equal(baseline.translate('Чек 1: нужен непустой список items.','en'),'Чек 1: нужен непустой список items.','Confirm real baseline defect');
 A.equal(baseline.translate('Чек R1: неверная позиция 2.','kk'),'Чек R1: неверная позиция 2.','Confirm second baseline defect');
 A.equal(core.translate('Чек R1: неверная позиция 2.','kk'),'R1-чек: 2-позиция жарамсыз.');
 A.equal(core.translate('Для ad_budget укажите, кто платит: я или принципал.','en'),'For ad_budget, select the payer: me or principal.');
 A.equal(core.translate('SKU-2026-10','kk'),'SKU-2026-10');
});
test('all calculation ASTs and pure financial assets remain unchanged; only named renderers and explicit demo initializers may change',()=>{
 const acorn=require('../scripts/localization/node_modules/acorn');
 const demoInitializers=new Set(['populateShopperDemonstration','populateRealisticShopperDemonstration']);
 const allowedRenderers=new Set(['exportProductCalculationPdf','renderResalePurchaseComposition','renderProductPortfolio','renderProductBusinessSummary','updateProductPortfolioBusinessSummary','freezeCurrentProductOnPage','document','write']);
 function canonical(value){
  // New localized XLSX headings live outside the historical tax-engine baseline.
  // The downloaded workbook and its numeric cells are guarded by dedicated tests.
  if(value?.type==='VariableDeclaration'&&value.declarations?.length===1&&value.declarations[0].id?.name==='salesTaxColumns')return null;
  if(!value||typeof value!=='object')return value;
  if(value.type==='FunctionDeclaration'&&(allowedRenderers.has(value.id?.name)||demoInitializers.has(value.id?.name)))return null;
  if(value.type==='ObjectExpression'&&['ru','en','kk'].every(language=>value.properties.some(p=>(p.key?.name??p.key?.value)===language&&p.value?.type==='ObjectExpression')))return {type:'LocaleDictionary'};
  if(value.type==='LogicalExpression'&&value.operator==='||'&&value.right.type==='ObjectExpression'&&JSON.stringify(value.left).includes('Nomad360LocaleCore')&&JSON.stringify(value.left).includes('locales'))return canonical(value.right);
  if(Array.isArray(value))return value.map(canonical).filter(value=>value!==null);
  return Object.fromEntries(Object.entries(value).filter(([key])=>!['start','end','loc','raw'].includes(key)).map(([key,x])=>[key,canonical(x)]));
 }
 const old=execFileSync('git',['show',SHA+':Marketing_calc.HTML'],{cwd:base,encoding:'utf8'});
 const now=require('./helpers/refactor-boundaries-scope.cjs').restore('Marketing_calc.HTML',fs.readFileSync(path.join(base,'Marketing_calc.HTML'),'utf8'));
 const scripts=s=>[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim()).map(s=>canonical(acorn.parse(s,{ecmaVersion:'latest'})));
 A.deepEqual(scripts(now),scripts(old),'financial or navigation AST changed outside named display renderers');
 function arithmetic(source){
  const result=[];
  function hasString(n){if(!n||typeof n!=='object')return false;if(n.type==='Literal'&&typeof n.value==='string'||n.type==='TemplateLiteral')return true;return Object.values(n).some(v=>Array.isArray(v)?v.some(hasString):hasString(v))}
  function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&demoInitializers.has(n.id?.name))return;if(n.type==='BinaryExpression'&&['+','-','*','/','%','**'].includes(n.operator)&&!hasString(n))result.push(canonical(n));for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v)}
  for(const m of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(m[1].trim())walk(acorn.parse(m[1],{ecmaVersion:'latest'}));
  return result;
 }
 A.deepEqual(arithmetic(now),arithmetic(old),'arithmetic changed even inside a renderer');
 // 7Б-5 intentionally updates the exporter; historical VAT semantics are checked
 // in frozen VAT and dedicated XLSX/PDF parity tests, not the 7Б-0 AST equality.
 // Only the 7Б-5 price DOCUMENT projection may change. The XLSX writer,
 // fallback translations and all other exporter functions remain AST-identical
 // to accepted 7Б-4; real VAT and Sales Tax numbers are checked separately.
 const exporter='nomad360_price_export.js';
 A.deepEqual(canonical(acorn.parse(fs.readFileSync(path.join(base,exporter),'utf8'),{ecmaVersion:'latest'})),
   canonical(acorn.parse(execFileSync('git',['show','817e5e14ae65091f474442a672831d93a3ea8f28:'+exporter],{cwd:base,encoding:'utf8'}),{ecmaVersion:'latest'})),
   '7Б-5 exporter only modifies the explicitly accepted document renderer');
 const presentation=new Set(['nomad360_currency.js','nomad360_navigation.js']);
 // The approved stage-5 exporter is covered by exact VAT/XLSX/Sales Tax numeric tests;
 // preserve AST byte-parity for all remaining presentation adapters.
 for(const file of presentation){
  const old=execFileSync('git',['show',SHA+':'+file],{cwd:base,encoding:'utf8'}),now=fs.readFileSync(path.join(base,file),'utf8');
  A.deepEqual(canonical(acorn.parse(now,{ecmaVersion:'latest'})),canonical(acorn.parse(old,{ecmaVersion:'latest'})),file+' changed beyond message registry lookup');
 }
 // SEO-07 adds a new UI-only URL adapter, absent from the financial baseline.
 // Its priority, URL preservation and untouched models have dedicated tests.
 const files=require('../docs/localization/l0/catalog.json').sources.map(s=>s.file).filter(f=>f.endsWith('.js')&&!/ui|header|locale_core/.test(f)&&!['nomad360_seo_language.js','nomad360_return.js','nomad360_simple_service_examples.js','nomad360_sales_tax.js','nomad360_sales_tax_v1.js','nomad360_sales_tax_service_v1.js','nomad360_sales_tax_v2.js','nomad360_price_export.js','nomad360_bug_report.js','nomad360_us_retail_live_entry.js','nomad360_delivery.js','nomad360_draft_store.js'].includes(f)&&!presentation.has(f));
 // A new locale-only link adapter is absent from the frozen 7B-0 SHA.
 // It has its own RU/EN/KK browser and portable-download tests; do not attempt
 // git show of a file that did not exist in that historical financial baseline.
 const liveEntry=fs.readFileSync(path.join(base,'nomad360_us_retail_live_entry.js'),'utf8');
 A.match(liveEntry,/nomad360:languagechange/);
 A.match(liveEntry,/us-retail-v2-live-link/);
 A.doesNotMatch(liveEntry,/localStorage|sessionStorage|fetch\(|\.buildPortfolio\(|\.save\(/);
 A.ok(files.length>=10);
 for(const file of [...files,'vendor/exceljs-4.4.0.min.js']){
  // PR #141 accepted a visitor-counter retry fix after the financial baseline.
  // Pin that non-financial widget to its accepted main, rather than excluding
  // it from protection. Every financial asset still uses the original SHA.
  const reference=file==='nomad360_traffic.js'?'b1cc9b50ae48c3c8f392e4342fb5243c7575bd8e':SHA;
  A.deepEqual(fs.readFileSync(path.join(base,file)),execFileSync('git',['show',reference+':'+file],{cwd:base,maxBuffer:4*1024*1024}),file);
 }
});
test('nested semantic component sections preserve arrays, immutable values and explicit empty presentation fields',()=>{
 A.deepEqual(core.section('interface.header','en').nav,['Calculator','AI Marketer','Content Factory','About','Contacts']);
 A.ok(Array.isArray(core.section('interface.header','kk').products));
 A.ok(Object.isFrozen(core.section('interface.header','kk').products));
 A.equal(core.section('interface.shell','en').privacy,'');
 A.equal(core.section('interface.header','ru').products[1].goal,'');
 for(const language of ['ru','en','kk']){
  A.equal(core.section('export.excel',language).id,'SKU / ID');
  A.equal(core.section('currency.business',language).question,core.t('business.currencyQuestion',language));
 }
});
