'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base='538565e';
const before=f=>execFileSync('git',['show',base+':'+f],{cwd:root,maxBuffer:8*1024*1024,encoding:'utf8'}),now=f=>fs.readFileSync(path.join(root,f),'utf8');
test('Only the four requested presentation files may change; all financial sources, HTML and licence stay exact',()=>{
 const editable=new Set(['nomad360_header.js','nomad360_calculator_ui.js','nomad360_locale_core.js','nomad360_calculator_ui.css']);
 const files=execFileSync('git',['ls-tree','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/\.(js|css|html)$/i.test(f)||f==='CALCULATOR_LICENSE.md');
 const maskB2BCta=css=>css
  .replace(/\.nomad-embed-download:hover:not\(:disabled\)\{[^\n]*\}/g,'<B2B-DOWNLOAD-HOVER>')
  .replace(/\/\* (?:CTA-01:|B2B conversion hierarchy:)[\s\S]*?(?=\.nomad-embed-retry\[hidden\])/,'<B2B-CTA-COLORS>\n');
 A.ok(maskB2BCta(now('nomad360_calculator_ui.css')).startsWith(maskB2BCta(before('nomad360_calculator_ui.css'))),'Accepted typography and support styling remain intact outside the explicitly changed B2B CTA colors');
 A.ok(files.length>20);for(const file of files)if(!editable.has(file))A.equal(now(file),before(file),file);
});
const boot=src=>{const win={};new Function('window','document',src)(win,{readyState:'loading',addEventListener(){}});return win.Nomad360LocaleCore;};
test('Published hero, legal/privacy text, payment details and every financial translation remain unchanged',()=>{
 const old=boot(before('nomad360_locale_core.js')),current=boot(now('nomad360_locale_core.js'));
 const changed=new Set(['interface.header.embedButton','interface.header.customButton','interface.header.trafficTitle']);
 for(const key of old.keys())if(!changed.has(key))for(const language of ['ru','en','kk'])A.equal(current.t(key,language),old.t(key,language),language+' '+key);
 A.match(current.t('interface.shell.introLead','en'),/validation/);A.doesNotMatch(current.t('interface.shell.introLead','ru'),/validation/);
 A.equal(current.t('interface.header.comparison.own','ru'),'Хочу собственную версию');A.equal(current.t('interface.header.comparison.own','en'),'White Label');
});
test('Download, retry, clipboard, header navigation and financial export logic stay exact outside named presentation renderers',()=>{
 const acorn=require('../scripts/localization/node_modules/acorn');
 function norm(src,allowed){
  function walk(x){if(!x||typeof x!=='object')return x;if(x.type==='FunctionDeclaration'&&allowed.has(x.id.name))return {type:'ApprovedRenderer',name:x.id.name};if(x.type==='VariableDeclarator'&&['COPY','L'].includes(x.id.name))return {type:'SemanticDictionary',name:x.id.name};if(Array.isArray(x))return x.map(walk);return Object.fromEntries(Object.entries(x).filter(([key])=>!['start','end','raw'].includes(key)).map(([key,v])=>[key,walk(v)]));}
  return walk(acorn.parse(src,{ecmaVersion:'latest'}));
 }
 for(const [file,allowed] of [['nomad360_calculator_ui.js',new Set(['buildShell'])],['nomad360_header.js',new Set(['infoMarkup','footerMarkup','renderFooter','boot'])]])A.deepEqual(norm(now(file),allowed),norm(before(file),allowed),file);
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
