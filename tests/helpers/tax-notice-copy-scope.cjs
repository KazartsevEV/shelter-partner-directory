'use strict';
// Exact copy-only exception for the deduplicated tax notice. Full hashes and
// three literal hints per adapter preserve every storage/calculation byte.
const A=require('node:assert/strict'),{createHash}=require('node:crypto');
const digest=source=>createHash('sha256').update(source).digest('hex');
const rules={
  "nomad360_sales_tax_v1.js": {
    "before": "a466e4d72ea8d47137ace2b8c0ff40e9fd39825fc48a94bd7f75fec556438a00",
    "after": "5634d6c65899b5139fd39abb641c1f0f9f4bcd7ed354f9056def6161ff9e07d0",
    "replacements": [
      {
        "before": "hint:'Sales Tax начисляется после скидки. Он не является выручкой и не вычитается из прибыли дважды. Индивидуальные вычеты и льготы не учитываются — обратитесь к бухгалтеру.'",
        "after": "hint:'Sales Tax начисляется после скидки. Он не является выручкой и не вычитается из прибыли дважды.'"
      },
      {
        "before": "hint:'Sales Tax is added after discounts. It is not business revenue and is not deducted twice. Individual deductions and reliefs are not included; consult an accountant.'",
        "after": "hint:'Sales Tax is added after discounts. It is not business revenue and is not deducted twice.'"
      },
      {
        "before": "hint:'Sales Tax жеңілдіктен кейін қосылады, кәсіпорынның табысы емес. Жеке шегерімдер мен жеңілдіктер ескерілмейді. Бухгалтермен кеңесіңіз.'",
        "after": "hint:'Sales Tax жеңілдіктен кейін қосылады, кәсіпорынның табысы емес.'"
      }
    ]
  },
  "nomad360_sales_tax_service_v1.js": {
    "before": "2df9589f4b2aee19839574e3e545139da1172594da47d953bd414538f9ce257c",
    "after": "29a34bea6a556c8b8005ff368e5b94450e6aa8e5be51cfe6fd77db45170052a6",
    "replacements": [
      {
        "before": "hint:'Налог добавляется к цене покупателя после скидки. Выручка, прибыль и Cash Flow остаются без транзитного налога. Вычеты и льготы не учтены — проконсультируйтесь с бухгалтером.'",
        "after": "hint:'Налог добавляется к цене покупателя после скидки. Выручка, прибыль и Cash Flow остаются без транзитного налога.'"
      },
      {
        "before": "hint:'Tax is added to the buyer price after discounts. Transit tax is excluded from revenue, profit and cash flow. Individual reliefs are excluded; consult an accountant.'",
        "after": "hint:'Tax is added to the buyer price after discounts. Transit tax is excluded from revenue, profit and cash flow.'"
      },
      {
        "before": "hint:'Салық жеңілдіктен кейін сатып алушы төлейтін бағаға қосылады. Транзиттік салық табысқа, пайдаға және ақша ағынына кірмейді. Жеке жеңілдіктер есептелмейді; бухгалтермен кеңесіңіз.'",
        "after": "hint:'Салық жеңілдіктен кейін сатып алушы төлейтін бағаға қосылады. Транзиттік салық табысқа, пайдаға және ақша ағынына кірмейді.'"
      }
    ]
  }
};
function restore(file,source){
 const rule=rules[file];if(!rule||digest(source)!==rule.after)return source;
 let text=source.toString();
 for(const {before,after} of rule.replacements){
  A.equal(text.split(after).length,2,'Exact tax notice copy: '+file);
  text=text.replace(after,before);
 }
 A.equal(digest(text),rule.before,'Tax notice changed outside approved copy: '+file);
 return Buffer.isBuffer(source)?Buffer.from(text):text;
}
module.exports={restore};
