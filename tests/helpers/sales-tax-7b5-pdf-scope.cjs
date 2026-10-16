'use strict';
// Only the V1 print renderer is authorized by SALES-TAX-07B-5.
// The historical site-level byte guards keep every other script/finance path
// immutable. The new export is independently checked against VAT and Sales Tax.
function maskV1PdfRenderer(content){
 const from='function exportProductCalculationPdf() {';
 const until='\n        function aggregateDaysText(';
 const pos=content.indexOf(from);
 const next=content.indexOf(until,pos+from.length);
 if(pos<0||next<0||content.indexOf(from,pos+from.length)!==-1)
   throw Error('Expected one bounded V1 PDF renderer in Marketing_calc.HTML');
 return content.slice(0,pos)+'/* [7B5-APPROVED-V1-PDF-RENDERER] */'+content.slice(next);
}
module.exports={maskV1PdfRenderer};
