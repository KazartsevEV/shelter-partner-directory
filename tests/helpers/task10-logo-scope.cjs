'use strict';
// LOGO-01: reverse exactly the approved, non-financial palette/crop changes.
// Immutable hashes cover the entire new CSS tail and JS boot insertion; all
// other source bytes remain protected by the established historic contracts.
const A=require('node:assert/strict');
const cssMarker='\n/* TASK-10 LOGO-01: the SAME wolf PNG, recolored by nomad360_header.js.';
const jsMarker='    // TASK-10 LOGO-01: recolor the existing PNG pixels in the browser, never redraw the wolf.';
const jsEnd='    // SEO-07: reuse the header asset; the existing HTML bundler inlines this URL.';
const oldRender='renderInformation();renderFooter();renderHeader();';
const newRender='renderInformation();renderFooter();renderHeader();fitOriginalWolfInHeader();recolorSiteWolfLogo();';
function fingerprint(s){
 let h=0xcbf29ce484222325n;
 for(let i=0;i<s.length;i++){h^=BigInt(s.charCodeAt(i));h=BigInt.asUintN(64,h*0x100000001b3n);}
 return h.toString(16).padStart(16,'0');
}
function stripTask10Logo(file,source){
 if(file==='nomad360_calculator_ui.css'){
   if(!source.includes(cssMarker))return source;
   A.equal(source.split(cssMarker).length,2,'exactly one LOGO-01 CSS tail');
   const at=source.indexOf(cssMarker);
   A.equal(fingerprint(source.slice(at)),'4c6c056ef6d68297','LOGO-01 CSS delta has changed');
   return source.slice(0,at);
 }
 if(file==='nomad360_header.js'){
   if(!source.includes(jsMarker))return source;
   A.equal(source.split(jsMarker).length,2,'exactly one LOGO-01 insertion');
   A.equal(source.split(jsEnd).length,2,'historic SEO anchor unchanged');
   const a=source.indexOf(jsMarker),b=source.indexOf(jsEnd,a);
   A.ok(b>a,'logo insertion must precede SEO initializer');
   A.equal(fingerprint(source.slice(a,b)),'738a2331d709900f','LOGO-01 JS delta has changed');
   const restored=source.slice(0,a)+'    '+oldRender+'\n'+source.slice(b);
   const newLanguage='      '+newRender;
   A.equal(restored.split(newLanguage).length,2,'exactly one logo language refresh');
   return restored.replace(newLanguage,'      '+oldRender);
 }
 return source;
}
module.exports={stripTask10Logo};
