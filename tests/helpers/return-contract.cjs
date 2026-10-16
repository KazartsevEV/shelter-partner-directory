'use strict';
// Exact presentation edits authorised by RET-07A; everything else stays byte-exact.
const script='<script src="./nomad360_return.js"></script>\n';
const logo='<img class="nomad-seo-logo" src="./nomad360_wolf_open_circle.png" alt="" width="140" height="140" loading="lazy">';
const brand='<div class="nomad-seo-brand"><div class="nomad-seo-logo-mask">'+logo+'</div><h3 class="nomad-seo-tagline" lang="en"><span>Sky allows,</span> <span>guys deliver</span></h3></div>';
const embed="      // RET-07A: independent embeds do not promote shortcuts to the original host.\n      doc.documentElement.setAttribute('data-nomad-embedded','');\n      doc.querySelector('script[src$=\"nomad360_return.js\"]')?.remove();\n";
function stripReturn(file,source){
 if(file==='Marketing_calc.HTML')return source.replace(script,'').replace('<script src="./nomad360_simple_service_examples.js"></script>\n','')
  .replace('<script src="./nomad360_sales_tax.js"></script>\n','')
  .replace('<script src="./nomad360_sales_tax_v1.js"></script>\n','');
 if(file==='nomad360_calculator_ui.css')return source.split('\n/* RET-07A presentation additions. */')[0];
 if(file==='nomad360_locale_core.js')return source.replace(/messages\.push\(\n( \[\"return\.[^\n]+\n)+\);\n/g,'').replace(/^ \["return\.[^\n]+\n/gm,'');
 if(file==='nomad360_calculator_ui.js')return source.replace("  heroNode.querySelector('h3').after(intro.querySelector('.nomad-intro-cta'));\n",'').replace("  (document.getElementById('nomad360-seo-banner')||heroNode).after(intro);","  if(!intro.isConnected)heroNode.after(intro);");
 if(file==='nomad360_header.js')return source
  .replace(/  \/\/ RET-07A about icons:[\s\S]*?  \/\/ RET-07A about icons end\.\n/,'')
  .replace("t.flow.map((step,index)=>'<li>'+aboutIcon(index)+'<h3>'","t.flow.map(step=>'<li><h3>'")
  .replace(brand,logo).replace(embed,'');
 return source;
}
module.exports={stripReturn,script};
