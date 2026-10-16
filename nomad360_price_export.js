/* Local XLSX projection of existing V2 outputs. No financial formulas. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.Nomad360PriceExport=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=(globalThis.Nomad360LocaleCore?.locales("export.excel") || {
 en:{sheet:'Price list',notes:'Notes',id:'SKU / ID',name:'Product / service',type:'Type',currency:'Currency',base:'V2 list price',baseNet:'V2 price excluding VAT',discount:'Individual discount, %',customer:'Customer price',status:'Status',note:'Note',
  own:'Own production',resale:'Resale',dropship:'Dropshipping','offline-service':'Offline service','online-service':'Online service',
  CALCULATED:'Calculated',TARGET_MET:'Target met',MINIMUM_ONLY:'Minimum only',FIXED_V1:'Fixed V1 price',LOSS:'Loss',PROVISIONAL:'Provisional',INFEASIBLE:'Infeasible',
  source:'Source: your local Nomad360 V2 calculation. Values depend on your inputs and scenario assumptions.',
  linked:'The V2 list price and customer price are the existing VAT-inclusive engine outputs. Individual discounts are shown in percentage points.',
  standalone:'The V2 base price excludes VAT. Customer price is the existing engine output including VAT. This model has no individual discount; the discount cells are empty.',
  offers:'Bundle discounts and linked offers apply separately; this price list shows standalone item prices.',
  provisional:'One-off cost amortization remains unconfirmed; full accounting margin is provisional.',
  missing:'Empty numeric cells mean the model has no defined value. They do not mean zero.',
  review:'Review the status of this item before using its price.'},
 ru:{sheet:'Прайс-лист',notes:'Примечания',id:'SKU / ID',name:'Товар / услуга',type:'Тип',currency:'Валюта',base:'Прайс V2',baseNet:'Цена V2 без НДС',discount:'Индивидуальная скидка, %',customer:'Цена покупателю',status:'Статус',note:'Примечание',
  own:'Делаю сам',resale:'Покупаю у других',dropship:'Дропшиппинг','offline-service':'Офлайн-услуга','online-service':'Онлайн-услуга',
  CALCULATED:'Рассчитано',TARGET_MET:'Целевая маржа достигнута',MINIMUM_ONLY:'Только минимальная маржа',FIXED_V1:'Фиксированная цена V1',LOSS:'Убыток',PROVISIONAL:'Предварительно',INFEASIBLE:'Невыполнимо',
  source:'Источник: локальный расчёт Nomad360 V2. Значения зависят от исходных данных и сценарных допущений.',
  linked:'Прайс V2 и цена покупателю — действующие результаты движка с НДС. Индивидуальная скидка указана в процентных пунктах.',
  standalone:'Базовая цена V2 указана без НДС. Цена покупателю — действующий результат движка с НДС. Индивидуальная скидка в этой модели не поддерживается; её ячейки пустые.',
  offers:'Скидки комплектов и связанные продажи применяются отдельно; прайс показывает цены отдельных позиций.',
  provisional:'Амортизация разовых затрат не подтверждена; полная бухгалтерская маржа предварительная.',
  missing:'Пустая числовая ячейка означает отсутствие определённого значения в модели, а не ноль.',
  review:'Проверьте статус этой позиции перед использованием цены.'},
 kk:{sheet:'Прайс-парақ',notes:'Ескертпелер',id:'SKU / ID',name:'Тауар / қызмет',type:'Түрі',currency:'Валюта',base:'V2 прайс',baseNet:'ҚҚС-сыз V2 бағасы',discount:'Жеке жеңілдік, %',customer:'Сатып алушы бағасы',status:'Күйі',note:'Ескертпе',
  own:'Өзім өндіремін',resale:'Қайта сату',dropship:'Dropshipping','offline-service':'Офлайн қызмет','online-service':'Онлайн қызмет',
  CALCULATED:'Есептелді',TARGET_MET:'Мақсатты деңгейге жетті',MINIMUM_ONLY:'Тек ең төменгі деңгей',FIXED_V1:'V1 бағасы бекітілген',LOSS:'Залал',PROVISIONAL:'Алдын ала',INFEASIBLE:'Орындалмайды',
  source:'Дереккөз: браузердегі Nomad360 V2 есебі. Мәндер бастапқы деректер мен сценарий болжамдарына байланысты.',
  linked:'V2 прайс пен сатып алушы бағасы — есептеу модулінің ҚҚС қосылған нәтижелері. Жеке жеңілдік пайыздық тармақпен көрсетілген.',
  standalone:'V2 базалық бағасы ҚҚС-сыз көрсетілген. Сатып алушы бағасы — модульдің ҚҚС қосылған нәтижесі. Бұл модельде жеке жеңілдік жоқ; оның ұяшықтары бос.',
  offers:'Жинақ жеңілдіктері мен байланысты сатылымдар бөлек қолданылады; прайс жеке позиция бағаларын көрсетеді.',
  provisional:"Біржолғы шығындардың амортизациясы расталмаған; толық бухгалтерлік Margin алдын ала көрсетілген.",
  missing:'Бос сандық ұяшық модельде анықталған мән жоқ екенін білдіреді, нөлді емес.',
  review:'Бағаны пайдаланбас бұрын осы позицияның күйін тексеріңіз.'}
});
const number=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
const text=value=>value===undefined||value===null?'':String(value);
function document(context,language='en'){
 const {state,out,kind}=context||{},t=copy[language];
 if(!t||!state||!out?.ready||!Array.isArray(out.items)||!out.items.length||!['linked','standalone'].includes(kind))throw Error('Price list is not ready');
 const currency=state.currency||'USD';if(!/^[A-Z]{3}$/.test(currency))throw Error('Invalid business currency');
 const taxMode=state.tax?.taxRegime||'vat';
 if(!['vat','sales_tax','none'].includes(taxMode))throw Error('Invalid sales tax regime');
 // The accepted 7B-4 projection is the only authority for pass-through Sales Tax.
 // Do not infer it from a commission, divide input VAT or discount a second time.
 const summary=out.salesTaxSummary;
 const rate=taxMode==='sales_tax'?state.tax?.salesTaxPct:null;
 if(taxMode!=='vat'){
  if(!summary||summary.mode!==taxMode||
    (taxMode==='sales_tax'&&Number(summary.ratePct)!==Number(rate)))
   throw Error('Missing or stale Sales Tax projection');
 }
 const salesQuote=taxMode==='sales_tax'?
  (globalThis.Nomad360SalesTax || (typeof require==='function'?require('./nomad360_sales_tax.js'):null)):null;
 if(taxMode==='sales_tax'&&!salesQuote?.quote)throw Error('Sales Tax quote unavailable');
 if(taxMode==='sales_tax')salesQuote.quote({mode:'sales_tax',enteredPrice:0,ratePct:rate});
 const labels=globalThis.Nomad360LocaleCore?.locales?.('tax')?.[language]||{};
 const columns=[t.id,t.name,t.type,t.currency,kind==='linked'||taxMode!=='vat'?t.base:t.baseNet,t.discount,t.customer,t.status];
 const notes=[t.source,taxMode==='vat'?(kind==='linked'?t.linked:t.standalone):
   (labels.v2BuyerSummary||'Sales Tax')+'. '+(labels.v2DeductionsNotice||''),t.missing];
 if(kind==='linked')notes.splice(2,0,t.offers);
 const provisional=out.cashflow?.periodPnl?.accountingCompleteness==='PROVISIONAL';if(provisional)notes.push(t.provisional);
 const rows=out.items.map(item=>{
  const status=kind==='standalone'?'CALCULATED':item.status;
  if(['MINIMUM_ONLY','LOSS','PROVISIONAL','INFEASIBLE'].includes(status))notes.push(text(item.id)+' · '+text(item.name)+': '+(t[status]||status)+'. '+t.review);
  const source=item.source||item.sourcing?.source;
  const basePrice=number(kind==='linked'?item.priceList:item.price);
  const historicCustomer=number(kind==='linked'?item.priceGross:item.priceWithVat);
  let buyer=historicCustomer;
  if(taxMode==='sales_tax'){
   const line=summary.lines?.find(line=>String(line.id)===String(item.id));
   if(!line||!Number.isFinite(line.net)||!Number.isFinite(line.salesTax))
    throw Error('Missing SKU Sales Tax ledger');
   // Agent fee is NOT the principal's retail price. The V2 projection has
   // independently verified aggregate principal revenue, not a unit quote.
   buyer=line.base==='principal'?null:
    historicCustomer===null?null:number(salesQuote.quote({
     mode:'sales_tax',enteredPrice:historicCustomer,ratePct:rate}).customerTotal);
  }
  return [text(item.id),text(item.name),t[source]||text(source),currency,
   basePrice,number(kind==='linked'?item.discountSelected:null),
   buyer,t[status]||text(status)];
 });
 if(taxMode!=='vat'){
  for(const line of summary.lines||[])
   notes.push(text(line.id)+' · '+(labels.v2SalesTaxLabel||'Sales Tax')+
    ': '+text(line.salesTax)+'; '+t.customer+': '+text(line.customerTotal));
  notes.push((labels.v2BuyerSummary||'Sales Tax')+': '+
   text(summary.customerTotal)+'; Sales Tax: '+text(summary.salesTax));
 }
 return {language,currency,kind,taxMode,ratePct:taxMode==='sales_tax'?Number(rate):null,
   sheet:t.sheet,notesSheet:t.notes,noteColumn:t.note,columns,rows,notes};
}
async function write(doc,ExcelJS){
 if(!ExcelJS?.Workbook)throw Error('Local Excel library is unavailable');
 const workbook=new ExcelJS.Workbook();workbook.creator='Nomad360';
 const sheet=workbook.addWorksheet(doc.sheet,{views:[{state:'frozen',ySplit:1}]});
 sheet.columns=doc.columns.map((header,index)=>({header,width:[24,38,24,12,22,24,22,30][index]}));
 for(const values of doc.rows){
  const row=sheet.addRow(values);for(const index of [5,6,7])row.getCell(index).numFmt='0.00';
  row.alignment={vertical:'top',wrapText:true};
 }
 sheet.autoFilter={from:{row:1,column:1},to:{row:doc.rows.length+1,column:8}};
 const notes=workbook.addWorksheet(doc.notesSheet);notes.columns=[{header:doc.noteColumn,width:110}];
 for(const note of doc.notes)notes.addRow([note]).alignment={wrapText:true,vertical:'top'};
 for(const s of [sheet,notes]){
  s.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};
  s.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF16375A'}};
  s.getRow(1).alignment={wrapText:true,vertical:'middle'};s.getRow(1).height=32;
  s.pageSetup={paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};
 }
 // Explicit strings remain strings, including =,+,-,@ names. No formula,
 // hyperlink, external connection or remote request is created.
 return workbook.xlsx.writeBuffer();
}
return {document,write};
});
