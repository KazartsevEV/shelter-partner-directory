'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {build,files}=require('../scripts/localization/inventory.cjs');
test('L0 enumerates conditional copy without executing it, keeps IDs/parameters, detects missing module languages',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nomad-l0-'));
 try{
  fs.writeFileSync(path.join(dir,'Marketing_calc.HTML'),'<html><head><meta name="description" content="Описание"><script src="./nomad360_locale_core.js"></script><script src="./branch.js"></script><link rel="stylesheet" href="./screen.css"></head><body><template><button title="Скрытая кнопка">Скрытая ветка</button></template><input value="User SKU"><input type="button" value="Действие"><span data-nomad-no-translate>Имя пользователя</span></body></html>');
  fs.writeFileSync(path.join(dir,'nomad360_locale_core.js'),"const rows=[['Подпись','Label','Жазу']];const patterns=[[/^Месяц (\\d+)$/,'Month $1','$1-ай']];throw new Error('Never execute inventory input');");
  fs.writeFileSync(path.join(dir,'branch.js'),"const COPY={ru:{button:'Новая кнопка',nested:{label:'Вложенная'}},en:{button:'New button',nested:{label:'Nested'}},kk:{nested:{label:'Ішкі'}}};if(false){const el=`<b>${sku.name}: скрытая цена ${amount}</b>`;const markup='<input aria-label=\"Подпись\"><span>Подпись</span>';}const enumId='agent';");
  fs.writeFileSync(path.join(dir,'screen.css'),'.label::after {content:"Итог"}');
  const r=build(dir),e=r.catalog.entries;
  A.equal(r.summary.sources,4);A.ok(e.some(x=>x.text==='Скрытая ветка'));
  A.ok(e.some(x=>x.text==='Описание'&&x.attribute==='content'));
  A.ok(e.some(x=>x.text==='Действие'&&x.attribute==='value'));
  A.ok(!e.some(x=>x.text==='User SKU'),'input values are user data, not interface labels');
  A.ok(e.some(x=>x.text==='Имя пользователя'&&x.protectedNode));
  A.ok(e.some(x=>x.kind==='js-template'&&x.parameters.includes('sku.name')&&x.parameters.includes('amount')));
  A.ok(e.some(x=>x.kind==='markup-attribute'&&x.attribute==='aria-label'&&x.coverage==='legacy-exact'));
  A.ok(e.some(x=>x.kind==='css-content'&&x.text==='Итог'));
  A.ok(e.some(x=>x.text==='agent'&&x.coverage==='technical-or-latin-review'));
  A.equal(r.summary.dictionaryIssues.length,1);A.equal(r.summary.dictionaryIssues[0].key,'button');
  A.equal(r.summary.patterns,1);A.equal(r.catalog.patterns[0].en,'Month $1');
  A.equal(new Set(e.map(x=>x.id)).size,e.length);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('committed source census is reproducible and has no stale pages or unowned entries',()=>{
 const r=build(),out=files(r),base=path.join(__dirname,'../docs/localization/l0');
 for(const [file,data] of Object.entries(out))A.equal(fs.readFileSync(path.join(base,file),'utf8'),JSON.stringify(data,null,2)+'\n','stale '+file);
 A.ok(r.summary.sources>=29);A.ok(r.summary.legacyUniqueKeys>1200);A.ok(r.summary.moduleKeys>250);
 A.ok(r.catalog.entries.every(e=>e.owner===e.file&&e.line>0&&/^L[1-5]$/.test(e.stage)));
 A.equal(new Set(r.catalog.entries.map(x=>x.id)).size,r.catalog.entries.length);
 A.ok(r.catalog.entries.some(e=>e.file==='nomad360_price_export.js'));
 A.ok(r.catalog.entries.some(e=>e.file==='portfolio_v2_engine.js'&&/[А-Яа-яЁё]/.test(e.text)));
 A.ok(r.catalog.entries.some(e=>e.file==='Marketing_calc.HTML'&&e.kind==='html-attribute'));
 const altered=structuredClone(r);altered.catalog.entries[0].text+=' changed';A.notDeepEqual(files(altered),out,'source changes must make inventory stale');
});
