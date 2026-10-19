'use strict';
const A=require('node:assert/strict');
// Exact presentation edits authorised by RET-07A; everything else stays byte-exact.
const script='<script src="./nomad360_return.js"></script>\n';
const logo='<img class="nomad-seo-logo" src="./nomad360_wolf_open_circle.png" alt="" width="140" height="140" loading="lazy">';
const brand='<div class="nomad-seo-brand"><div class="nomad-seo-logo-mask">'+logo+'</div><h3 class="nomad-seo-tagline" lang="en"><span>Sky allows,</span> <span>guys deliver</span></h3></div>';
// B2B-BANNER: normalize only the approved live-language footer ownership fix.
const b2bFooterBefore=" const foot=document.getElementById('nomad360-footer');\n if(foot){foot.outerHTML=footer()}else{document.body.insertAdjacentHTML('beforeend',footer())}";
const b2bFooterAfter=" // The footer is owned by nomad360_header.js and refreshed on languagechange.\n // Keep its node intact so an open B2B comparison and disclosures survive.\n if(!document.getElementById('nomad360-footer'))document.body.insertAdjacentHTML('beforeend',footer());";
const previewFlag=" // V2 language listeners may replace their form root after the shell updates.\n const restorePricePreview=document.getElementById('nomad360-price-preview')?.hidden===false;\n";
const previewRestore=" // Re-open only a preview the user had already expanded before the rerender.\n if(restorePricePreview&&document.getElementById('nomad360-price-preview')?.hidden)showPreview();\n";
const printMode=" const originalPrintMode=document.getElementById('nomad360-print-sheet')?.dataset.mode;\n";
const printRestore=" // Rendering a new V2 root can remove a print sheet before the V2 model\n // finishes restoring. Rebuild the already requested document, never print.\n const current=readyOutput();\n if(originalPrintMode&&['price','report'].includes(originalPrintMode)&&current?.out?.ready&&\n    !document.getElementById('nomad360-print-sheet')){\n  const restored=document.createElement('section');restored.id='nomad360-print-sheet';\n  restored.dataset.mode=originalPrintMode;restored.innerHTML=printable(originalPrintMode,current);\n  document.body.append(restored);root.Nomad360LocaleCore?.localizeElement(restored);\n }\n";
const embed="      // RET-07A: independent embeds do not promote shortcuts to the original host.\n      doc.documentElement.setAttribute('data-nomad-embedded','');\n      doc.querySelector('script[src$=\"nomad360_return.js\"]')?.remove();\n";
// CONSULTING-02: strip ONLY the approved standalone-artwork packer when
// evaluating pre-consulting historical SEO and financial baselines.
// The exact 1127-character insertion is fingerprinted; arbitrary edits to
// downloads, mailto, calculations or copy must never be normalized away.
const consultingStart='        let css=await (await get(filename)).text();';
const consultingEnd="        const inline=doc.createElement('style');";
function fingerprint(s){
 let h=0xcbf29ce484222325n;
 for(let i=0;i<s.length;i++){h^=BigInt(s.charCodeAt(i));h=BigInt.asUintN(64,h*0x100000001b3n);}
 return h.toString(16).padStart(16,'0');
}
function stripConsultingExport(source){
 if(!source.includes(consultingStart))return source;
 A.equal(source.split(consultingStart).length,2,'Exactly one consulting HTML packer');
 A.equal(source.split(consultingEnd).length,2,'Exactly one original stylesheet inline point');
 const a=source.indexOf(consultingStart),b=source.indexOf(consultingEnd,a);
 A.ok(b>a,'Consulting packer must be inside the existing stylesheet loop');
 const block=source.slice(a,b);
 A.equal(block.length,1127,'Consulting packer size changed');
 A.equal(fingerprint(block),'bd1d6270c7246288','Consulting packer changed outside approved block');
 return source.slice(0,a)+'        const css=await (await get(filename)).text();\n'+source.slice(b);
}
function stripReturn(file,source){
 if(file==='Marketing_calc.HTML')return source.replace(script,'').replace('<script src="./nomad360_simple_service_examples.js"></script>\n','')
  .replace('<script src="./nomad360_sales_tax.js"></script>\n','')
  .replace('<script src="./nomad360_sales_tax_v1.js"></script>\n','')
  .replace('<script src="./nomad360_sales_tax_v2.js"></script>\n','');
 if(file==='nomad360_calculator_ui.css')return source.split('\n/* RET-07A presentation additions. */')[0];
 if(file==='nomad360_locale_core.js')return source.replace(/messages\.push\(\n( \[\"return\.[^\n]+\n)+\);\n/g,'').replace(/^ \["return\.[^\n]+\n/gm,'');
 if(file==='nomad360_calculator_ui.js')return source.replace(previewFlag,'').replace(previewRestore,'').replace(printMode,'').replace(printRestore,'').replace(b2bFooterAfter,b2bFooterBefore).replace("  heroNode.querySelector('h3').after(intro.querySelector('.nomad-intro-cta'));\n",'').replace("  (document.getElementById('nomad360-seo-banner')||heroNode).after(intro);","  if(!intro.isConnected)heroNode.after(intro);");
 if(file==='nomad360_header.js')return stripConsultingExport(source)
  .replace(/  \/\/ RET-07A about icons:[\s\S]*?  \/\/ RET-07A about icons end\.\n/,'')
  .replace("t.flow.map((step,index)=>'<li>'+aboutIcon(index)+'<h3>'","t.flow.map(step=>'<li><h3>'")
  .replace(brand,logo).replace(embed,'');
 return source;
}
module.exports={stripReturn,stripConsultingExport,script};
