'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const {analyze,capture,BASE}=require('../scripts/audit/runtime-inventory.cjs'),{union,numericLeaves,usedV8Ranges}=require('../scripts/audit/runtime-browser.cjs');
test('AST census includes inline handlers, global exports and interpolated DOM, without treating strings as calls',()=>{
 const data=analyze([{name:'example.HTML',text:'<html><script>\nfunction shared(){return 2;}\n</script><script type="application/json">{"not": "javascript code"}</script><button id="fixed" onclick="shared()">OK</button></html>'},
  {name:'feature.js',text:'root.Public = function named(){ document.querySelector(".fixed"); document.getElementById(`row-${id}`); node.innerHTML = `<button class="generated" id="row-${id}" onclick="shared()">X</button>`; node.addEventListener("click", named); node.removeEventListener(eventName, named); const referenceText="notACall()"; };'}]);
 A.ok(data.globals.some(x=>x.name==='shared'&&x.line===2));A.ok(data.globals.some(x=>x.name==='root.Public'));
 A.equal(data.events.filter(x=>x.event==='click').length,3);A.ok(data.events.some(x=>x.kind==='removeEventListener'&&x.event===null));
 A.ok(data.selectors.some(x=>x.value==='.fixed'&&!x.dynamic));A.ok(data.selectors.some(x=>x.dynamic&&x.expression.includes('row-')));
 A.ok(data.domTokens.some(x=>x.value==='generated'&&x.dynamic));A.ok(data.domTokens.some(x=>x.value.includes('__DYNAMIC__')&&x.interpolated));
 A.equal(data.calls.filter(x=>x.callee==='shared').length,2);A.equal(data.calls.some(x=>x.callee==='notACall'),false);
});
test('CSS duplicates retain separate cascade contexts and exact offsets, including minified same-line rules',()=>{
 const data=analyze([{name:'example.css',text:'@layer first { .x { color:white!important } .x { color:white!important } } @layer second { .x { color:white!important } }'}]);
 A.equal(data.summary.cssRules,3);A.equal(data.summary.importantDeclarations,3);A.equal(data.exactDuplicateCssGroups.length,1);
 const group=data.exactDuplicateCssGroups[0];A.equal(group.occurrences.length,2);A.equal(group.occurrences[0].line,group.occurrences[1].line);A.notEqual(group.occurrences[0].start,group.occurrences[1].start);A.deepEqual(group.context,['@layer first']);
 A.equal(data.cssLayers.length,2);
});
test('unparseable application JS/CSS fails instead of silently omitting a source',()=>{
 A.throws(()=>analyze([{name:'broken.js',text:'function {'}]),/broken\.js/);
 A.throws(()=>analyze([{name:'broken.css',text:'.x {'}]));
});
test('computed global candidates, observers, timers and inline styles stay visible to review',()=>{
 const data=analyze([{name:'dynamic.js',text:'root[name] = callback; new MutationObserver(callback); requestAnimationFrame(callback); node.style.width="10px"; node.style.setProperty("color","white","important");'}]);
 A.ok(data.globals.some(x=>x.computed&&x.aliasNotScopeResolved));A.ok(data.asyncSources.some(x=>x.kind==='MutationObserver'));A.ok(data.asyncSources.some(x=>x.kind==='requestAnimationFrame'));
 A.equal(data.styleWrites.length,2);A.ok(data.styleWrites.some(x=>x.priority==='important'));
});
test('CSS font/background dependencies are recorded without copying embedded binary data',()=>{
 const data=analyze([{name:'fonts.css',text:'@font-face {src:url("../vendor/font.woff2")} .x {background:url(data:image/png;base64,AAA)}'}]);
 A.ok(data.resources.some(x=>x.kind==='css-url'&&x.value==='../vendor/font.woff2'));
 A.ok(data.resources.some(x=>x.value==='data:[embedded]'));A.equal(JSON.stringify(data.resources).includes('base64,AAA'),false);
});
test('identical inputs produce reproducible inventory, and exact source bytes determine digests',()=>{
 const sources=[{name:'test.js',text:'function test(){return 1;}'}];
 A.deepEqual(analyze(sources),analyze(sources));
 A.notEqual(analyze(sources).files[0].sha256,analyze([{name:'test.js',text:'function test(){return 2;}'}]).files[0].sha256);
});
test('coverage ranges merge overlaps so bytes are not counted twice; numeric baseline is independent of labels',()=>{
 A.deepEqual(union([{start:0,end:5},{start:3,end:7},{start:7,end:9},{start:12,end:15}]),[{start:0,end:9},{start:12,end:15}]);
 A.deepEqual(numericLeaves({label:'RU',cash:5,costs:[1,2],missing:null}),numericLeaves({label:'EN',cash:5,costs:[1,2],missing:null}));
 A.deepEqual(numericLeaves({invalid:Infinity}),[['.invalid','Infinity']]);
 A.deepEqual(usedV8Ranges([{ranges:[{startOffset:0,endOffset:100,count:1},{startOffset:20,endOffset:70,count:0},{startOffset:40,endOffset:50,count:1}]}]),[{start:0,end:20},{start:40,end:50},{start:70,end:100}]);
});
test('frozen runtime and generated artifacts remain equal to accepted source revision',()=>{
 const data=capture();A.equal(data.baseRevision,BASE);A.equal(data.files.length,73);
 A.ok(data.dependencyEdges.some(x=>x.from==='Marketing_calc.HTML'&&x.to==='nomad360_v1_engine.js'&&x.status==='tracked'));
 A.ok(data.additionalFingerprints.some(x=>x.file==='US_Retail_Demo_FILLED.html'));
 A.equal(data.summary.dynamicSelectorSites>0,true);A.equal(data.summary.importantDeclarations>0,true);
});
test('summary rejects smoke runs and inconsistent static/runtime source fingerprints',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{summarize}=require('../scripts/audit/runtime-summary.cjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nomad-audit-summary-'));
 try{
  fs.writeFileSync(path.join(dir,'inventory.json'),JSON.stringify({baseRevision:BASE,files:[{file:'test.js',sha256:'a'}]}));
  const browser={baseRevision:BASE,method:{quick:true},failures:[],sourceHashes:{'test.js':'b'}};
  fs.writeFileSync(path.join(dir,'browser.json'),JSON.stringify(browser));A.throws(()=>summarize(dir,path.join(dir,'summary')),/Smoke/);
  browser.method.quick=false;fs.writeFileSync(path.join(dir,'browser.json'),JSON.stringify(browser));A.throws(()=>summarize(dir,path.join(dir,'summary')),/fingerprints/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
