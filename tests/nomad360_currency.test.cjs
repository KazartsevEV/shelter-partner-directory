const {test}=require('node:test');
const A=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
function runtime(){
 const listeners={},nodes={};
 const select={options:[],value:'',innerHTML:'',addEventListener(type,fn){listeners.select=fn;}};
 nodes['business-currency']=select;
 nodes['business-currency-question']={textContent:''};
 nodes['business-currency-help']={textContent:''};
 let lang='ru';
 const document={readyState:'loading',getElementById:id=>nodes[id],querySelectorAll:()=>[],
  addEventListener(type,fn){listeners[type]=fn;},dispatchEvent(event){listeners[event.type]?.(event);}};
 const window={Nomad360UI:{getLanguage:()=>lang}};
 const src=fs.readFileSync(path.join(root,'nomad360_currency.js'),'utf8');
 new Function('window','document','CustomEvent',src)(window,document,class {constructor(type,options){this.type=type;this.detail=options.detail;}});
 listeners.DOMContentLoaded();
 new Function('window','document',fs.readFileSync(path.join(root,'nomad360_locale_core.js'),'utf8'))(window,document);
 window.Nomad360LocaleCore={...window.Nomad360LocaleCore,localizeAll(){}};
 return {api:window.Nomad360Currency,locale:window.Nomad360LocaleCore,nodes,
  choose(code){select.value=code;listeners.select({target:select});},
  language(value){lang=value;listeners['nomad360:languagechange']?.();}};
}
test('new-business currency never relabels an existing calculation or follows locale',()=>{
 const r=runtime();
 A.equal(r.api.get(),'USD');
 r.choose('KZT');A.equal(r.api.get(),'USD','home choice is for the next calculation');
 r.api.beginNew();A.equal(r.api.get(),'KZT');
 for(const language of ['en','kk','ru']){
  r.language(language);A.equal(r.api.get(),'KZT');
  A.equal(r.locale.translate('Цена 1 ед. материала, у.е.*',language).includes('KZT'),true);
 }
 r.choose('EUR');A.equal(r.api.get(),'KZT','saved business retains its own currency');
 r.api.adopt('KZT');A.equal(r.api.get(),'KZT');
 r.api.beginNew();A.equal(r.api.get(),'EUR');
 A.throws(()=>r.api.assertSame('KZT'));
 A.throws(()=>r.api.assertSame(undefined),'legacy drafts have the explicit default USD');
 r.api.adopt('USD');A.doesNotThrow(()=>r.api.assertSame(undefined));
});
test('currency labels preserve physical units, canonical numeric inputs and ISO codes',()=>{
 const r=runtime();r.api.adopt('KZT');
 for(const text of ['Цена, у. е.','100 у.е.*','100 ш.б.*','100 currency units*','100 MU'])
  A.ok(r.api.replaceUnits(text).includes('KZT'));
 A.equal(r.api.replaceUnits('2 м² × 3 м, 5 шт., 10%'),'2 м² × 3 м, 5 шт., 10%');
 A.equal(r.api.replaceUnits('GEL 100'),'GEL 100');
 A.equal(r.api.replaceUnits('«Товар у.е.*» 100 у.е.*'),'«Товар у.е.*» 100 KZT');
 A.ok(r.api.options().includes('🇰🇿 KZT'));
 A.equal(r.api.valid('<script>'),false);
});
test('currency metadata cannot change linked portfolio financial outputs',()=>{
 const Engine=require('../portfolio_v2_linked_engine.js');
 const {fixture}=require('./portfolio_v2_f3_fixture.cjs');
 const payload=fixture();
 const base={...Engine.fromV1(payload),resources:payload.resources,offers:payload.offers,
  forecastMonths:payload.forecastMonths,recurringDemandApproved:true};
 const results=[];
 for(const code of ['USD','KZT','EUR']){
  const state=structuredClone(base);state.currency=code;
  const before=JSON.stringify(state);
  const out=Engine.build(state);A.equal(out.ready,true,JSON.stringify(out.errors));
  results.push(out);
  A.equal(JSON.stringify(state),before,'build never mutates saved source');
 }
 A.deepEqual(results[0],results[1]);A.deepEqual(results[1],results[2]);
});
