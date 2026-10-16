'use strict';
// Task 09 adds exactly two passive asset loader tags. Historical VAT/SEO
// source guards must compare all other bytes exactly to their original inputs.
const A=require('node:assert/strict');
const css='    <link rel="stylesheet" href="./nomad360_bug_report.css">\n';
const script='<script src="./nomad360_bug_report.js"></script>\n';
const cssAnchor='<link rel="stylesheet" href="./nomad360_calculator_ui.css">\n'+css;
const scriptAnchor='<script src="./nomad360_sales_tax_service_v1.js"></script>\n'+script;
function stripTask09Html(source){
 const cssCount=source.split(css).length-1,scriptCount=source.split(script).length-1;
 A.equal(cssCount,scriptCount,'Both Task09 assets must be paired');
 A.ok(cssCount===0||cssCount===1,'Exactly one Task09 asset pair is permitted');
 if(cssCount===0)return source;
 A.ok(source.includes(cssAnchor),'Task09 stylesheet must follow the existing calculator stylesheet');
 A.ok(source.includes(scriptAnchor),'Task09 script must follow the existing service adapter');
 return source.replace(css,'').replace(script,'');
}
module.exports={stripTask09Html,css,script};
