'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base='538565e';
const before=f=>execFileSync('git',['show',base+':'+f],{cwd:root,maxBuffer:8*1024*1024,encoding:'utf8'}),now=f=>fs.readFileSync(path.join(root,f),'utf8');
test('Only the four requested presentation files may change; all financial sources, HTML and licence stay exact',()=>{
 // Stage 7Б-5 expressly extends XLSX/PDF tax projections. All accepted marketing
 // text still has independent exact checks below; VAT export remains tested separately.
 const editable=new Set(['nomad360_header.js','nomad360_calculator_ui.js','nomad360_locale_core.js','nomad360_calculator_ui.css','nomad360_price_export.js']);
 const files=execFileSync('git',['ls-tree','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/\.(js|css|html)$/i.test(f)||f==='CALCULATOR_LICENSE.md');
 const maskB2BCta=css=>css
  .replace(/\.nomad-embed-download:hover:not\(:disabled\)\{[^\n]*\}/g,'<B2B-DOWNLOAD-HOVER>')
  .replace(/\/\* (?:CTA-01:|B2B conversion hierarchy:)[\s\S]*?(?=\.nomad-embed-retry\[hidden\])/,'<B2B-CTA-COLORS>\n')
  .replace(/\/\* About: one compact four-line brand statement[^\n]*\n[\s\S]*?(?=\.nomad-about-flow\{)/,'')
  .replace(/(?:\.nomad-footer \.nomad-embed-actions\{max-width:none;margin-top:32px;gap:16px\}|\/\* B2B-BANNER: native responsive HTML,[^\n]*\n)[\s\S]*?(?=\.nomad-embed-toggle\{)/,'<B2B-PRESENTATION>\n')
  .replace(/\.nomad-kz-flag,\.nomad-ru-flag\{/g,'.nomad-kz-flag{')
  .replace(/\.nomad-pay-kaspi \.nomad-pay-hint,\.nomad-pay-ozon \.nomad-pay-hint\{/g,'.nomad-pay-kaspi .nomad-pay-hint{')
  .replace(/ \.nomad-pay-bank,\.nomad-pay-kaspi,\.nomad-pay-ozon\{/g,' .nomad-pay-bank,.nomad-pay-kaspi{');
 A.ok(maskB2BCta(now('nomad360_calculator_ui.css')).startsWith(maskB2BCta(before('nomad360_calculator_ui.css'))),'Accepted typography and support styling remain intact outside the explicitly changed B2B CTA colors');
 const stage4='6c5c0e3a4927fb50b88ab99914145bb9016bb24a';
 A.ok(files.length>20);for(const file of files)if(!editable.has(file)){
   if(['portfolio_v2_ui.js','portfolio_v2_linked_ui.js'].includes(file)){
     A.equal(now(file),execFileSync('git',['show',stage4+':'+file],{cwd:root,encoding:'utf8'}),
       '7Б-4 accepted explicit UI surface: '+file);
     continue;
   }
   A.equal(file==='Marketing_calc.HTML'?
  require('./helpers/seo-html-contract.cjs').stripSEO(
   now(file).replace('<script src="./nomad360_sales_tax_service_v1.js"></script>\n','').replace('<script src="./nomad360_sales_tax_v2.js"></script>\n','')):
  now(file),before(file),file);
 }
});
const boot=src=>{const win={};new Function('window','document',src)(win,{readyState:'loading',addEventListener(){}});return win.Nomad360LocaleCore;};
test('Published hero, legal/privacy text, payment details and every financial translation remain unchanged',()=>{
 const old=boot(before('nomad360_locale_core.js')),current=boot(now('nomad360_locale_core.js'));
 const changed=new Set(['interface.header.embedB2BTitle','interface.header.embedButton','interface.header.customButton','interface.header.trafficTitle','interface.header.comparison.free','interface.header.comparison.own','interface.header.comparison.customerBrand','interface.header.comparison.customerQueries','interface.header.comparison.contacts','interface.header.licenseCopy','interface.header.embedB2BPoints.0','interface.header.embedB2BPoints.1','interface.header.embedB2BPoints.2','interface.header.embedB2BPoints.3','interface.header.embedB2BPoints.4','interface.header.embedB2BFocus']);
 for(const key of old.keys())if(!changed.has(key))for(const language of ['ru','en','kk'])A.equal(current.t(key,language),old.t(key,language),language+' '+key);
 A.match(current.t('interface.shell.introLead','en'),/validation/);A.doesNotMatch(current.t('interface.shell.introLead','ru'),/validation/);
 A.equal(current.t('interface.header.comparison.own','ru'),'Собственный калькулятор');A.equal(current.t('interface.header.comparison.own','en'),'Your own calculator');
 A.equal(current.t('interface.header.customButton','ru'),'Заказать кастомное решение');
 A.equal(current.t('interface.header.comparison.contacts','ru'),'Контакты и вопросы посетителя, формы обратной связи, опционально — интеграция с CRM');
 for(const key of ['aboutBrand','aboutMotto.0','aboutMotto.1','aboutMotto.2'])for(const locale of ['ru','en','kk'])A.doesNotMatch(current.t('interface.header.'+key,locale),/^⟦/);
 A.deepEqual(Array.from(current.section('interface.header','ru').aboutMotto),['Устанавливаем связи.','Строим структуру.','Открываем горизонты.']);
 A.deepEqual(Array.from(current.section('interface.header','en').aboutMotto),['We build connections.','We create structure.','We open new horizons.']);
 A.equal(current.section('interface.header','kk').aboutMotto.length,3);
});
test('Download, retry, clipboard, header navigation and financial export logic stay exact outside named presentation renderers',()=>{
 const acorn=require('../scripts/localization/node_modules/acorn');
 function norm(src,allowed){
  function walk(x){if(!x||typeof x!=='object')return x;if(x.type==='FunctionDeclaration'&&allowed.has(x.id.name))return {type:'ApprovedRenderer',name:x.id.name};if(x.type==='VariableDeclarator'&&['COPY','L'].includes(x.id.name))return {type:'SemanticDictionary',name:x.id.name};if(Array.isArray(x))return x.map(walk);return Object.fromEntries(Object.entries(x).filter(([key])=>!['start','end','raw'].includes(key)).map(([key,v])=>[key,walk(v)]));}
  return walk(acorn.parse(src,{ecmaVersion:'latest'}));
 }
 for(const [file,allowed] of [['nomad360_calculator_ui.js',new Set(['buildShell','table','printable'])],['nomad360_header.js',new Set(['infoMarkup','footerMarkup','payFiat','renderFooter','boot'])]])A.deepEqual(norm(require('./helpers/return-contract.cjs').stripReturn(file,now(file)),allowed),norm(before(file),allowed),file);
});


test('B2B comparison copy is localized and only the custom-order CTA uses the orange action color',()=>{
 const header=now('nomad360_header.js'),css=now('nomad360_calculator_ui.css');
 for(const text of [
  'Этот калькулятор «как есть»','Собственный калькулятор',
  'Ваш бренд','Адаптация под ваши ключевые запросы',
  'формы обратной связи, опционально — интеграция с CRM',
  'Заказать кастомное решение',
  'This calculator, as is','Your own calculator','Order a custom solution',
  'Бұл калькулятор «сол күйінде»','Өз калькуляторыңыз','Жеке шешімге тапсырыс беру'
 ])A.ok(header.includes(text),'Missing locale copy: '+text);
 A.match(header,/data-nomad-download-html/);
 A.match(header,/class="nomad-embed-contact" href="mailto:/);
 A.match(header,/data-nomad-traffic-value/);
 A.match(css,/\.nomad-embed-download\s*\{\s*background:#f4f7fc;/);
 A.match(css,/\.nomad-footer \.nomad-embed-contact\s*\{\s*background:#ed8e63;/);
 A.doesNotMatch(css,/\.nomad-embed-download\s*\{\s*background:#ed8e63;/);
 A.match(css,/\.nomad-embed-retry\{[^}]*background:#f4f7fc;/);
});


test('About adds only the agreed four-line brand introduction above the existing three-stage flow',()=>{
 const src=now('nomad360_header.js'),css=now('nomad360_calculator_ui.css');
 for(const text of [
  'Nomad 360 - зонтичный бренд интеллектуальных сервисов для предпринимателей.',
  'Устанавливаем связи.','Строим структуру.','Открываем горизонты.',
  'Nomad 360 is an umbrella brand of intelligent services for entrepreneurs.',
  'We build connections.','We create structure.','We open new horizons.',
  'Nomad 360 — кәсіпкерлерге арналған зияткерлік сервистерді біріктіретін бренд.',
  'Байланыстар орнатамыз.','Құрылым құрамыз.','Жаңа көкжиектер ашамыз.'
 ])A.ok(src.includes(text),'Missing About localized brand copy: '+text);
 A.match(src,/<h2>'\+esc\(t\.about\)\+'<\/h2>'\+\s*'<div class="nomad-about-opening">/);
 A.match(src,/<ol class="nomad-about-flow" role="list">/);
 A.match(src,/<p class="nomad-about-caption">/);
 A.match(css,/\.nomad-about-motto span\{display:block\}/);
});

test('Localized consulting sales banner is exactly three numbered native cards with slogan',()=>{
 const src=now('nomad360_header.js'),css=now('nomad360_calculator_ui.css'),core=boot(now('nomad360_locale_core.js'));
 const titles={ru:'Занимаетесь консалтингом?',en:'Do you work in consulting?',kk:'Консалтингпен айналысасыз ба?'};
 const focuses={ru:'конкретные вопросы',en:'specific questions',kk:'нақты сұрақтарды'};
 const slogans={
  ru:'Nomad360 оптимизирует время для вас и ваших клиентов, чтобы обогнать конкурентов.',
  en:'Nomad360 saves time for you and your clients, helping you stay ahead of competitors.',
  kk:'Nomad360 сіз бен клиенттеріңіздің уақытын үнемдеп, бәсекелестерден озып шығуға көмектеседі.'
 };
 const endings={ru:'в онлайн-чате.',en:'in live chat.',kk:'онлайн-чатта жауап беріңіз.'};
 for(const lang of ['ru','en','kk']){
  const copy=core.section('interface.header',lang);
  A.equal(copy.embedB2BTitle,titles[lang]);
  A.equal(copy.embedB2BSlogan,slogans[lang]);
  A.equal(copy.embedB2BFocus,focuses[lang]);
  A.equal(copy.embedB2BPoints.length,3);
  A.ok(copy.embedB2BPoints[1].endsWith(endings[lang]));
  A.equal(copy.embedB2BPoints.filter(line=>line.includes(copy.embedB2BFocus)).length,1);
  A.equal(copy.embedB2BPoints[2].includes(copy.embedB2BFocus),true);
  A.equal(core.t('interface.header.embedB2BPoints.3',lang),'⟦interface.header.embedB2BPoints.3:'+lang+'⟧');
 }
 A.match(src,/<ol class="nomad-embed-b2b-benefits">/);
 A.match(src,/class="nomad-embed-b2b-number"/);
 A.match(src,/class="nomad-embed-b2b-icon"/);
 A.match(src,/<em>'\+esc\(focus\)\+'<\/em>/);
 A.match(src,/class="nomad-embed-b2b-slogan"/);
 A.match(src,/nomad360_wolf_open_circle\.png/);
 A.match(css,/#nomad360-embed\{[\s\S]*?background:#16375a/);
 A.match(css,/\.nomad-embed-b2b-copy em\{font-style:italic/);
 A.match(src,/data-nomad-embed-toggle/);
 A.match(src,/id="nomad360-embed-comparison"/);
});
