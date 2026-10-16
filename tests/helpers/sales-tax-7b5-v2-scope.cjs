'use strict';
// Exact byte-level whitelist generated from the accepted 7B-4 V2 sources.
// Undo only the explicitly approved 7B-5 tax-label, advisory and export UI hunks,
// then compare all remaining bytes against the frozen accepted V2 UI.
const A=require('node:assert/strict');
const rules={
  "portfolio_v2_ui.js": [
    {
      "from": "const taxText=()=>root.Nomad360LocaleCore?.locales?.('tax')?.[root.Nomad360UI?.getLanguage?.()||'ru']||{};\n",
      "to": ""
    },
    {
      "from": " selField(taxText().v2TaxMode||'Режим налога','tax.taxRegime',model.tax.taxRegime||'vat', [['vat',taxText().v2VatLabel||'НДС (VAT / IVA)'],['sales_tax','Sales Tax'],['none',taxText().v2NoneLabel||'Без налога на продажу']])+ ((model.tax.taxRegime||'vat')==='vat'?numberField('НДС для цены покупателя, % (транзитный)','tax.vatPct',model.tax.vatPct):  (model.tax.taxRegime==='sales_tax'?numberField(taxText().v2SalesTaxRate||'Ставка Sales Tax, %','tax.salesTaxPct',model.tax.salesTaxPct??''):''))+",
      "to": " selField('Налог на продажу','tax.taxRegime',model.tax.taxRegime||'vat', [['vat','НДС (VAT / IVA)'],['sales_tax','Sales Tax'],['none','Без налога на продажу']])+ ((model.tax.taxRegime||'vat')==='vat'?numberField('НДС для цены покупателя, % (транзитный)','tax.vatPct',model.tax.vatPct):  (model.tax.taxRegime==='sales_tax'?numberField('Ставка Sales Tax, %','tax.salesTaxPct',model.tax.salesTaxPct??''):''))+"
    },
    {
      "from": " '</div><p class=\"nd-v2-description text-xs mt-3\" data-v2-tax-advisory>'+safe(taxText().v2NoticeFull||taxText().v2DeductionsNotice)+'</p><p class=\"nd-v2-description text-xs mt-3\">Кредит: ежемесячные проценты и возврат всего тела в последний месяц (bullet). Тело кредита — выплата денежных средств, а не налоговый расход. Внесённые собственные деньги — тоже не прибыль.</p>',",
      "to": " '</div><p class=\"nd-v2-description text-xs mt-3\">Индивидуальные налоговые вычеты и льготы в расчёте не учитываются. Для оптимизации налогообложения проконсультируйтесь с бухгалтером.</p><p class=\"nd-v2-description text-xs mt-3\">Кредит: ежемесячные проценты и возврат всего тела в последний месяц (bullet). Тело кредита — выплата денежных средств, а не налоговый расход. Внесённые собственные деньги — тоже не прибыль.</p>',"
    },
    {
      "from": " '<h3 class=\"font-bold\">'+safe(taxText().v2BuyerSummary||'Налог с продаж — итог для покупателя')+'</h3>'+",
      "to": " '<h3 class=\"font-bold\">Налог с продаж — итог для покупателя</h3>'+"
    },
    {
      "from": " root.Nomad360UI?.syncPortfolioActions?.(r,model,'standalone');",
      "to": " root.Nomad360UI?.syncPortfolioActions?.(out,model,'standalone');"
    },
    {
      "from": " document.addEventListener('nomad360:languagechange',()=>{if(model)render();});\n",
      "to": ""
    }
  ],
  "portfolio_v2_linked_ui.js": [
    {
      "from": "const taxText=()=>root.Nomad360LocaleCore?.locales?.('tax')?.[root.Nomad360UI?.getLanguage?.()||'ru']||{};\n",
      "to": ""
    },
    {
      "from": " '<h2 class=\"nd-v2-title text-lg font-bold\">'+safe(taxText().v2SalesTaxLabel||'Налог на продажу')+'</h2>'+\n '<label class=\"nd-v2-field block text-sm mt-2\">'+safe(taxText().v2TaxMode||'Режим налога')+'<select class=\"input-field mt-1\" data-linked-tax-mode>'+\n [['vat',taxText().v2VatLabel||'НДС (VAT / IVA)'],['sales_tax','Sales Tax'],['none',taxText().v2NoneLabel||'Без налога на продажу']].map(([key,label])=>",
      "to": " '<h2 class=\"nd-v2-title text-lg font-bold\">Налог на продажу</h2>'+\n '<label class=\"nd-v2-field block text-sm mt-2\">Режим налога<select class=\"input-field mt-1\" data-linked-tax-mode>'+\n [['vat','НДС (VAT / IVA)'],['sales_tax','Sales Tax'],['none','Без налога на продажу']].map(([key,label])=>"
    },
    {
      "from": "  '<label class=\"nd-v2-field block text-sm mt-2\">'+safe(taxText().v2SalesTaxRate||'Ставка Sales Tax, %')+'<input class=\"input-field mt-1\" type=\"number\" step=\"0.01\" min=\"0\" inputmode=\"decimal\" data-linked-tax-rate value=\"'+safe(state.tax?.salesTaxPct??'')+'\"></label>':'')+\n '<p class=\"text-xs mt-2\" data-v2-tax-advisory>'+safe(taxText().v2NoticeFull||taxText().v2DeductionsNoticeLinked)+'</p></section>'+",
      "to": "  '<label class=\"nd-v2-field block text-sm mt-2\">Ставка Sales Tax, %<input class=\"input-field mt-1\" type=\"number\" step=\"0.01\" min=\"0\" inputmode=\"decimal\" data-linked-tax-rate value=\"'+safe(state.tax?.salesTaxPct??'')+'\"></label>':'')+\n '<p class=\"text-xs mt-2\">Индивидуальные налоговые вычеты и льготы не учитываются. Для оптимизации налогообложения проконсультируйтесь с бухгалтером.</p></section>'+"
    },
    {
      "from": "  '<h3 class=\"font-bold\">'+safe(taxText().v2BuyerSummary||'Sales Tax — транзитный налог покупателей')+'</h3>'+",
      "to": "  '<h3 class=\"font-bold\">Sales Tax — транзитный налог покупателей</h3>'+"
    },
    {
      "from": " document.addEventListener('nomad360:languagechange',()=>{if(state)render();});\n",
      "to": ""
    }
  ]
};
function revertApprovedV2TaxUi(file,source){
 if(!Object.prototype.hasOwnProperty.call(rules,file))throw Error('Unexpected file: '+file);
 let out=source;
 for(const {from,to} of rules[file]){
  A.equal(out.split(from).length-1,1,'7B5 approved hunk drift in '+file);
  out=out.replace(from,to);
 }
 return out;
}
module.exports={revertApprovedV2TaxUi};
