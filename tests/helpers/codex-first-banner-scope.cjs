'use strict';
/* Narrow, reversible presentation-only exception for Codex R2 first-hero loaders.
   Never mask calculator content, locale dictionaries, prices or tax code. */
const A=require('node:assert/strict');
const style='    <link rel="stylesheet" href="./nomad360_codex_first_banner.css">\n';
const script='<script src="./nomad360_codex_first_banner.js"></script>\n';
const headAnchor=style+'    <link rel="stylesheet" href="./nomad360_design_system.css">\n';
const scriptAnchor='<script src="./nomad360_sales_tax_service_v1.js"></script>\n'+script;
function strip(source){
 const a=source.includes(style),b=source.includes(script);
 A.equal(a,b,'Codex first hero stylesheet/script must be paired');
 if(!a)return source;
 A.equal(source.split(style).length,2,'exactly one first hero CSS');
 A.equal(source.split(script).length,2,'exactly one first hero JS');
 A.ok(source.includes(headAnchor),'CSS must precede original design-system link');
 A.ok(source.includes(scriptAnchor),'JS follows existing approved sales-tax scripts');
 return source.replace(style,'').replace(script,'');
}
module.exports={strip,style,script};
