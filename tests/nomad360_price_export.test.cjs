'use strict';
const A=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),path=require('node:path');
const Export=require('../nomad360_price_export.js'),Excel=require('../vendor/exceljs-4.4.0.min.js');
const linked=()=>({kind:'linked',state:{currency:'KZT'},out:{ready:true,items:[
 {id:'0007',name:'Қазақша русский English',source:'own',priceList:123.456,discountSelected:12.5,priceGross:108.024,status:'TARGET_MET',priceMin:99,priceMax:150,targetMarginPct:25,actualAfterTaxMargin:26.75},
 {id:'=1+1',name:'=HYPERLINK("https://invalid.example","x")',source:'online-service',priceList:0,discountSelected:0,priceGross:0,status:'FIXED_V1'}
]}});
test('XLSX stores original calculated numbers and literal user strings, with no formulas',async()=>{
 const c=linked(),snapshot=JSON.stringify(c),doc=Export.document(c,'ru'),bytes=await Export.write(doc,Excel);
 A.equal(bytes.subarray(0,2).toString(),'PK');const w=new Excel.Workbook();await w.xlsx.load(bytes);
 A.deepEqual(w.worksheets.map(s=>s.name),['Прайс-лист','Примечания']);
 const s=w.worksheets[0];A.equal(s.rowCount,3);A.equal(s.getCell('A2').value,'0007');A.equal(s.getCell('B2').value,'Қазақша русский English');
 A.equal(s.getCell('E2').value,123.456);A.equal(s.getCell('F2').value,12.5);A.equal(s.getCell('G2').value,108.024);
 A.equal(s.columnCount,12,'linked V1→V2 exposes V1 bounds and V2 margin');
 A.deepEqual([s.getCell('I2').value,s.getCell('J2').value,s.getCell('K2').value,s.getCell('L2').value],[99,150,25,26.75]);
 A.equal(s.getCell('A3').value,'=1+1');A.equal(s.getCell('B3').type,Excel.ValueType.String);A.equal(s.getCell('B3').formula,undefined);A.equal(s.getCell('E3').value,0);
 A.equal(JSON.stringify(c),snapshot);A.ok(w.worksheets[1].rowCount>4);
});
test('unsupported or undefined numeric data remains blank, including standalone discounts',async()=>{
 const c={kind:'standalone',state:{currency:'USD'},out:{ready:true,items:[{id:'a',name:'+SUM(1)',source:'dropship',price:0,priceWithVat:undefined},{id:'b',name:'@SUM(1)',source:'resale',price:NaN,priceWithVat:Infinity},{id:'c',name:'-1+2',source:'own',price:null,priceWithVat:''}]}};
 const doc=Export.document(c,'en');A.deepEqual(doc.rows.map(r=>r.slice(4,7)),[[0,null,null],[null,null,null],[null,null,null]]);
 const bytes=await Export.write(doc,Excel),w=new Excel.Workbook();await w.xlsx.load(bytes);A.equal(w.worksheets[0].getCell('E2').value,0);
 for(const cell of ['F2','G2','E3','F3','G3','E4','G4'])A.equal(w.worksheets[0].getCell(cell).value,null);
});
test('all three languages retain financial values and describe provisional and constrained prices',()=>{
 const c=linked();c.out.cashflow={periodPnl:{accountingCompleteness:'PROVISIONAL'}};c.out.items[0].status='MINIMUM_ONLY';
 const docs=['en','ru','kk'].map(l=>Export.document(c,l));
 for(const d of docs){
  A.equal(d.columns.length,12);A.equal(d.notes.length,6);
  A.deepEqual(d.rows.map(r=>r.slice(3,7)),docs[0].rows.map(r=>r.slice(3,7)));
  A.deepEqual(d.rows[0].slice(8),[99,150,25,26.75]);
  A.ok(d.rows[0][7]);A.ok(d.columns[8]&&d.columns[9]&&d.columns[10]&&d.columns[11]);
  A.ok(d.notes[0].length>100&&d.notes[1].length>100);
 }
 A.throws(()=>Export.document({...c,out:{ready:false,items:c.out.items}},'ru'));A.throws(()=>Export.document({...c,out:{ready:true,items:[]}},'en'));
 A.throws(()=>Export.document({...c,state:{currency:'usd'}},'en'));A.throws(()=>Export.document(c,'missing'));
});
test('actual browser bundle is pinned and included in local HTML and embed bundling',()=>{
 const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'Marketing_calc.HTML'),'utf8');
 for(const file of ['vendor/exceljs-4.4.0.min.js','nomad360_price_export.js'])A.ok(source.includes('<script src="./'+file+'"></script>'));
 A.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'vendor/exceljs-4.4.0.min.js'))).digest('hex'),'7e49da68588e250dbb8bba190d2caa8ab3787cc0284bda1d8b2f805c4df742c9');
});

test('V1→V2 price range and actual margin stay numeric, never reconstructed from prices',async()=>{
 const c=linked();c.state.tax={taxRegime:'vat',vatPct:12};
 const names=['en','ru','kk'];
 const docs=names.map(lang=>Export.document(c,lang));
 for(const d of docs){
  A.equal(d.kind,'linked');
  A.deepEqual(d.rows[0].slice(8),[99,150,25,26.75]);
  A.deepEqual(d.rows[1].slice(8),[null,null,null,null],'unknown bound/margin must remain blank');
  A.equal(d.columns.length,12);
  A.notEqual(d.columns[4],d.columns[6],'V2 list price and buyer price need distinct captions');
  A.ok(d.columns[4].includes('V2'),'V2 list price is unambiguously labeled');
 }
 A.notEqual(docs[0].columns[8],docs[1].columns[8]);
 A.notEqual(docs[1].columns[8],docs[2].columns[8]);
 const binary=await Export.write(docs[0],Excel);
 const w=new Excel.Workbook();await w.xlsx.load(binary);
 const sheet=w.getWorksheet('Price list');
 for(let col=9;col<=12;col++){
  A.equal(typeof sheet.getRow(2).getCell(col).value,'number');
  A.equal(sheet.getRow(2).getCell(col).numFmt,'0.00');
  A.equal(sheet.getRow(3).getCell(col).value,null);
 }
 A.equal(sheet.autoFilter.to.column,12,'filter includes all V1/V2 fields');
});
