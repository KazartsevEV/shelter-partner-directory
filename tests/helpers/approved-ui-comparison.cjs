'use strict';
// QA only. Compare historical cleanup/layout with the same two approved UI
// corrections on BOTH peers. No numeric data, inputs, or source files change.
const A=require('node:assert/strict');
const type=require('../fixtures/pricing-decision-type/changes.json');
const copy=require('./tax-notice-copy-scope.cjs');
const cssFile=require('node:path').resolve(__dirname,'../../nomad360_design_system.css');
A.equal(require('node:crypto').createHash('sha256').update(require('node:fs').readFileSync(cssFile)).digest('hex'),type.afterSha256,'Align only the exact approved current CSS');
async function align(page){
 A.equal(type.edits.length,1);const {before,after}=type.edits[0];
 A.ok(after.endsWith(before));
 const css=after.slice(0,-before.length);
 await page.evaluate(({css,hints})=>{
  const id='nomad360-approved-ui-comparison';
  if(!document.getElementById(id)){
   const style=document.createElement('style');style.id=id;style.textContent=css;document.head.appendChild(style);
  }
  for(const el of document.querySelectorAll('[data-st-hint]')){
   const text=el.textContent;
   for(const hint of hints)if(text.startsWith(hint.before+' ')){
    el.textContent=hint.after+text.slice(hint.before.length);break;
   }
  }
 },{css,hints:copy.hintChanges()});
}
module.exports={align};
