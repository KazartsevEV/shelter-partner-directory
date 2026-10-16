'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(path.join(root,'nomad360_seo_language.js'),'utf8');
function boot(url,initial='ru'){
 const events={},calls=[],financial={currency:'KZT',cost:35,paymentCurrency:'CNY'},state={kept:true};let language=initial;
 const win={location:{href:url},history:{state,replaceState(s,_,href){A.equal(s,state);win.location.href=href;}},addEventListener(k,f){events[k]=f;},Nomad360UI:{getLanguage:()=>language,setLanguage(next){language=next;calls.push(next);events['nomad360:languagechange']?.();}}};
 const doc={readyState:'loading',addEventListener(k,f){events[k]=f;}};
 vm.runInNewContext(code,{window:win,document:doc,URL,Set});events.DOMContentLoaded();
 return {win,calls,financial,events,get language(){return language;}};
}
test('URL language overrides the UI even without access to browser storage',()=>{
 for(const lang of ['en','ru','kk']){const s=boot('https://example.test/Marketing_calc.HTML?lang='+lang,lang==='ru'?'kk':'ru');A.equal(s.language,lang);A.equal(s.calls.length,1);A.deepEqual(s.financial,{currency:'KZT',cost:35,paymentCurrency:'CNY'});}
});
test('Missing, empty, unsupported and case-variant query values preserve existing preference',()=>{
 for(const suffix of ['', '?lang=', '?lang=fr','?lang=EN','?lang=__proto__']){const s=boot('https://example.test/Marketing_calc.HTML'+suffix,'kk');A.equal(s.language,'kk');A.deepEqual(s.calls,[]);}
});
test('Manual language change preserves demo, funding, extra parameters and hash with no reload',()=>{
 const s=boot('https://example.test/Marketing_calc.HTML?lang=en&demo=shopper&finance=credit&extra=a%26b#product-screen');
 s.win.Nomad360UI.setLanguage('kk');const url=new URL(s.win.location.href);
 A.equal(url.searchParams.get('lang'),'kk');A.equal(url.searchParams.get('demo'),'shopper');A.equal(url.searchParams.get('finance'),'credit');A.equal(url.searchParams.get('extra'),'a&b');A.equal(url.hash,'#product-screen');
 s.win.location.href=url.href.replace('lang=kk','lang=ru');s.events.popstate();A.equal(s.language,'ru');
});
test('Portable file URLs retain their original path and demo parameters',()=>{
 const s=boot('file:///tmp/portable.html?demo=shopper&finance=cash&lang=en');s.win.Nomad360UI.setLanguage('ru');
 const url=new URL(s.win.location.href);A.equal(url.protocol,'file:');A.equal(url.pathname,'/tmp/portable.html');A.equal(url.searchParams.get('finance'),'cash');A.equal(url.searchParams.get('lang'),'ru');
});
test('Application HTML changes only the approved results banner, canonical and isolated language module',()=>{
 const {stripSEO,canonical,language,banner}=require('./helpers/seo-html-contract.cjs');const source=fs.readFileSync(path.join(root,'Marketing_calc.HTML'),'utf8');
 const old=execFileSync('git',['show','85d98d9:Marketing_calc.HTML'],{cwd:root,encoding:'utf8'});
 A.equal(source.split(canonical).length-1,1);A.equal(source.split(language).length-1,1);A.equal(stripSEO(source.replace('<script src="./nomad360_sales_tax_service_v1.js"></script>\n','').replace('<script src="./nomad360_sales_tax_v2.js"></script>\n','')),old);
 A.equal(source.split(banner).length-1,1);
 A.ok(source.indexOf('nomad360_seo_language.js')>source.indexOf('<script src="./nomad360_calculator_ui.js"'));
});
