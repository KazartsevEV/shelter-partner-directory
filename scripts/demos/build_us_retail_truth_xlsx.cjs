'use strict';
// Build the XLSX proof from the SAME frozen V2 model and its real tax projection.
// Nothing is inferred from screenshot text or annualized tax estimates.
const fs=require('node:fs'),path=require('node:path'),A=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const state=JSON.parse(fs.readFileSync(path.join(root,'docs/demos/us-main-street-12m/model.json'),'utf8'));
const Engine=require('../../portfolio_v2_engine.js');
const SalesTax=require('../../nomad360_sales_tax_v2.js');
const Export=require('../../nomad360_price_export.js');
const Excel=require('../../vendor/exceljs-4.4.0.min.js');
const near=(a,b)=>A.ok(Math.abs(a-b)<1e-8,'Value parity: '+a+' != '+b);
(async()=>{
 const raw=Engine.build(SalesTax.prepareStandalone(state,{mode:'sales_tax',ratePct:state.tax.salesTaxPct}));
 A.equal(raw.ready,true,JSON.stringify(raw.errors));
 A.equal(raw.months.length,12);
 const out=SalesTax.project(raw,{mode:'sales_tax',ratePct:state.tax.salesTaxPct});
 A.equal(out.salesTaxSummary.byMonth.length,0,'V2 standalone has no fake monthly tax invoices');
 const document=Export.document({state,out,kind:'standalone'},'ru');
 A.equal(document.taxTable.rows.length,state.skus.length);
 for(let i=0;i<document.taxTable.rows.length;i++){
  const row=document.taxTable.rows[i],projected=out.salesTaxSummary.lines[i];
  A.equal(row[0],projected.id);
  near(row[3],projected.net);near(row[4],projected.salesTax);near(row[5],projected.customerTotal);
  // Independent tax arithmetic for every actual V2 SKU (not a copied engine subtotal).
  near(row[4],row[3]*state.tax.salesTaxPct/100);
  near(row[3]+row[4],row[5]);
 }
 const sum=key=>out.salesTaxSummary.lines.reduce((total,line)=>total+line[key],0);
 near(sum('net'),out.salesTaxSummary.net);
 near(sum('salesTax'),out.salesTaxSummary.salesTax);
 near(sum('customerTotal'),out.salesTaxSummary.customerTotal);
 near(document.taxTable.totals[3],out.salesTaxSummary.net);
 near(document.taxTable.totals[4],out.salesTaxSummary.salesTax);
 near(document.taxTable.totals[5],out.salesTaxSummary.customerTotal);
 const cents=value=>Math.round(value*100)/100;
 A.equal(cents(out.salesTaxSummary.net),29790.48,'Independent screenshot net control');
 A.equal(cents(out.salesTaxSummary.salesTax),1861.91,'Independent screenshot tax control');
 A.equal(cents(out.salesTaxSummary.customerTotal),31652.39,'Independent screenshot buyer total');
 const bytes=await Export.write(document,Excel),dir=path.join(root,'artifacts/us-retail-demo');
 fs.mkdirSync(dir,{recursive:true});
 const filename='US_Retail_12M_Tax_RU.xlsx';
 fs.writeFileSync(path.join(dir,filename),Buffer.from(bytes));
 const workbook=new Excel.Workbook();await workbook.xlsx.load(Buffer.from(bytes));
 const worksheet=workbook.getWorksheet(document.taxTable.sheet);
 A.ok(worksheet,'Sales Tax tab must exist');
 for(let i=0;i<document.taxTable.rows.length;i++)
  for(let col=4;col<=6;col++){
   const cell=worksheet.getRow(i+2).getCell(col);
   near(cell.value,document.taxTable.rows[i][col-1]);
   A.equal(cell.numFmt,'#,##0.00');
  }
 A.ok(workbook.getWorksheet(document.notesSheet));
 console.log('V2_CANONICAL_TAX_XLSX_GREEN',JSON.stringify({
  file:filename,skus:state.skus.length,months:raw.months.length,
  referenceMonthNet:out.salesTaxSummary.net,
  referenceMonthSalesTax:out.salesTaxSummary.salesTax,
  referenceMonthBuyer:out.salesTaxSummary.customerTotal,
  standaloneMonthTaxLedger:out.salesTaxSummary.byMonth.length,
  excelRows:document.taxTable.rows.length,currency:document.currency
 }));
})().catch(error=>{console.error('V2_CANONICAL_TAX_XLSX_RED',error.stack||error);process.exitCode=1});
