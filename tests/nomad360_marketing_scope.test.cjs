'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base='cf17252fdb89cea7e83689f3ea7ebaa4363e2f86';
const before=f=>execFileSync('git',['show',base+':'+f],{cwd:root,maxBuffer:8*1024*1024,encoding:'utf8'}),now=f=>fs.readFileSync(path.join(root,f),'utf8');
test('Marketing preserves every financial asset, inline application script, input ID and HTML head from accepted TYPE-02',()=>{
 const editable=new Set(['nomad360_header.js','nomad360_calculator_ui.js','nomad360_locale_core.js','nomad360_calculator_ui.css','Marketing_calc.HTML','portfolio_v2_ui.js']);
 const files=execFileSync('git',['ls-tree','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/\.(js|css|html)$/i.test(f)||f==='CALCULATOR_LICENSE.md');
 A.ok(files.length>20);
 for(const file of files)if(!editable.has(file))A.equal(now(file),before(file),file);
 const old=before('Marketing_calc.HTML'),html=now('Marketing_calc.HTML');
 const scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(m=>m[0]);
 A.deepEqual(scripts(html),scripts(old),'all inline code and script loading order');
 A.equal(html.match(/<head>[\s\S]*?<\/head>/i)[0],old.match(/<head>[\s\S]*?<\/head>/i)[0],'SEO head belongs to task 7');
 A.deepEqual([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]).sort(),[...old.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]).sort());
 const strip=s=>s.replace(/        <(?:div|details) id="nomad360-calculation-list"[\s\S]*?        <\/(?:div|details)>\n\n/,'');
 A.equal(strip(html),strip(old),'only the existing six-result block may move and become expandable');
 A.equal(now('portfolio_v2_ui.js'),before('portfolio_v2_ui.js').replace(' Здесь нет подставленных примеров.',''),'only the requested V2 presentation sentence is removed');
});
test('Marketing has a single localised hero, separate complete/free and contract/paid offers, no added tracking',()=>{
 const header=now('nomad360_header.js'),shell=now('nomad360_calculator_ui.js');
 A.doesNotMatch(header+shell,/за один вечер|полезный трафик бесплатно/);
 A.match(header,/encodeURIComponent\(t.mailBody\)/);
 A.match(header,/nomad360-for-website/);
 A.match(header,/nomad-paid-edition/);A.match(header,/nomad-free-edition/);
 A.equal((shell.match(/'<h1>'/g)||[]).length,1);
 A.doesNotMatch(header,/sendBeacon|gtag\(|postMessage\(|method:\s*['"]POST|localStorage/);
 A.equal(now('CALCULATOR_LICENSE.md'),before('CALCULATOR_LICENSE.md'));
});
test('Financial terminology and unrelated component messages retain all three accepted translations',()=>{
 const boot=src=>{const win={};new Function('window','document',src)(win,{readyState:'loading',addEventListener(){}});return win.Nomad360LocaleCore;};
 const old=boot(before('nomad360_locale_core.js')),current=boot(now('nomad360_locale_core.js'));
 const marketing=new Set(['finance.monthlyCashFlowAndAvailableCashBalance','credit.calculatedSellingPriceIncludingTaxesLoansAndYourTargetMargin','marketing.startWithTheAdvertisingFunnelAddProductsAndPaySharedCostsOnceNoSampleDataIsPrefilled']);
 for(const key of old.keys())if(!key.startsWith('interface.header.')&&!key.startsWith('interface.shell.')&&!marketing.has(key))for(const language of ['ru','en','kk'])A.equal(current.t(key,language),old.t(key,language),language+' '+key);
});
test('Existing export, payment-detail and shell logic remains exact outside approved presentation renderers',()=>{
 const acorn=require('../scripts/localization/node_modules/acorn');
 function normalise(src,allowed){
  const tree=acorn.parse(src,{ecmaVersion:'latest'});
  function walk(x){
   if(!x||typeof x!=='object')return x;
   if(x.type==='FunctionDeclaration'&&allowed.has(x.id.name))return {type:'ApprovedMarketingRenderer',name:x.id.name};
   if(x.type==='VariableDeclarator'&&['COPY','L'].includes(x.id.name))return {type:'SemanticDictionary',name:x.id.name};
   if(Array.isArray(x))return x.map(walk);
   return Object.fromEntries(Object.entries(x).filter(([key])=>!['start','end','raw'].includes(key)).map(([key,v])=>[key,walk(v)]));
  }
  return walk(tree);
 }
 for(const [file,allowed] of [['nomad360_calculator_ui.js',new Set(['hero','buildShell'])],['nomad360_header.js',new Set(['footerMarkup','renderHeader','boot'])]]){
  // Only the header's declarative route table gains the B2B anchor.
  const source=now(file).replace("'nomad360-contacts','nomad360-for-website'","'nomad360-contacts'");
  A.deepEqual(normalise(source,allowed),normalise(before(file),allowed),file);
 }
});
