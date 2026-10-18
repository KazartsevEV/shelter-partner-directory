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
const salesTaxColumns={
 ru:{sheet:'Sales Tax',id:'SKU / ID',name:'Товар / услуга',base:'Чья выручка',owner:'Мой доход',principal:'Доход принципала',net:'Выручка без Sales Tax',tax:'Sales Tax',buyer:'Покупатель оплачивает',total:'Итого',period:'Базовый месяц'},
 en:{sheet:'Sales Tax',id:'SKU / ID',name:'Product / service',base:'Whose revenue',owner:'Owner revenue',principal:'Principal revenue',net:'Revenue excl. Sales Tax',tax:'Sales Tax',buyer:'Customer pays',total:'Total',period:'Reference month'},
 kk:{sheet:'Sales Tax',id:'SKU / ID',name:'Тауар / қызмет',base:'Түсім кімге тиесілі',owner:'Менің түсімім',principal:'Принципал түсімі',net:'Sales Tax-сыз түсім',tax:'Sales Tax',buyer:'Сатып алушы төлейді',total:'Барлығы',period:'Негізгі ай'}
};
const number=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
const text=value=>value===undefined||value===null?'':String(value);
function document(context,language='en'){
 const {state,out,kind}=context||{},t=copy[language];
 // Display labels only; V1 price bounds, V2 money and margin are taken
 // unchanged from the accepted V1→V2 calculation.
 const x={
  ru:{id:'Артикул / ID',type:'Способ продажи',status:'Статус расчёта',marginStatus:'Статус маржи',
   linkedVat:'Цена по прайсу V2 за ед. с НДС',vatNet:'Цена продажи за ед. без НДС',
   salesNet:'Цена за ед. без Sales Tax',untaxed:'Цена продажи за единицу',
   buyerVat:'Цена за ед. со скидкой и НДС',buyerStandaloneVat:'Цена за ед. с НДС',
   buyerSales:'Цена за ед. с Sales Tax',buyerLinkedSales:'Цена за ед. со скидкой и Sales Tax',
   buyerUntaxed:'Цена за ед. к оплате',
   min:'Минимальная цена V1',max:'Максимальная цена V1',
   target:'Целевая маржа V1, %',realized:'Маржа по расчёту V2, %',
   units:'В прайс-листе указаны цены за одну единицу; лист Sales Tax содержит суммы по SKU за расчётный период.',
   bounds:'Минимальная и максимальная цены перенесены из V1 без изменения. V2 подбирает цену внутри диапазона. Маржа по расчёту V2 и статус взяты из результата движка, а не вычислены в Excel.',
   salesPeriod:'В самостоятельной V2 лист Sales Tax отражает базовый месяц, а не годовой налоговый регистр.',
   principal:'Для агентской позиции цена покупателю может быть пустой: комиссия агента не является розничной ценой принципала.'},
  en:{id:'SKU / ID',type:'Sales method',status:'Calculation status',marginStatus:'Margin status',
   linkedVat:'V2 list price per unit incl. VAT',vatNet:'Unit selling price excl. VAT',
   salesNet:'Unit price excl. Sales Tax',untaxed:'Unit selling price',
   buyerVat:'Unit price after discount incl. VAT',buyerStandaloneVat:'Unit price incl. VAT',
   buyerSales:'Unit price incl. Sales Tax',buyerLinkedSales:'Unit price after discount incl. Sales Tax',
   buyerUntaxed:'Unit amount payable',
   min:'V1 minimum price',max:'V1 maximum price',
   target:'V1 target margin, %',realized:'V2 calculated margin, %',
   units:'Price-list amounts are per unit; the Sales Tax worksheet shows SKU totals for the calculation period.',
   bounds:'The V1 minimum and maximum prices are preserved. V2 selects a price within that range. The calculated V2 margin and status come from the engine result, not Excel formulas.',
   salesPeriod:'For standalone V2, the Sales Tax sheet covers the reference month, not an invented annual tax ledger.',
   principal:'For an agency item, the customer unit price can be blank: the agent fee is not the principal retail price.'},
  kk:{id:'Артикул / ID',type:'Сату тәсілі',status:'Есептеу күйі',marginStatus:'Маржа күйі',
   linkedVat:'ҚҚС-пен бірлікке V2 прайс бағасы',vatNet:'ҚҚС-сыз бірлік сату бағасы',
   salesNet:'Sales Tax-сыз бірлік бағасы',untaxed:'Бірлік сату бағасы',
   buyerVat:'Жеңілдіктен кейінгі ҚҚС-пен бірлік бағасы',buyerStandaloneVat:'ҚҚС-пен бірлік бағасы',
   buyerSales:'Sales Tax-пен бірлік бағасы',buyerLinkedSales:'Жеңілдіктен кейінгі Sales Tax-пен бірлік бағасы',
   buyerUntaxed:'Бірлік үшін төлем',
   min:'V1 ең төменгі баға',max:'V1 ең жоғарғы баға',
   target:'V1 мақсатты маржа, %',realized:'V2 есептелген маржа, %',
   units:'Прайс-парақтағы бағалар бір бірлікке берілген; Sales Tax парағында есептік кезеңдегі әр SKU бойынша жиынтық көрсетілген.',
   bounds:'V1 ең төменгі және ең жоғарғы бағалары өзгеріссіз сақталады. V2 осы аралықтан баға таңдайды. V2 маржасы мен күйі Excel-де есептелмейді, есептеу модулінің нәтижесінен алынады.',
   salesPeriod:'Дербес V2 үшін Sales Tax парағы жылдық тізілімді емес, негізгі айды көрсетеді.',
   principal:'Агенттік позицияда сатып алушының бірлік бағасы бос болуы мүмкін: агент комиссиясы принципалдың бөлшек сауда бағасы емес.'}
 }[language];
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
 // Keep the established VAT Excel terminology byte-identical; UI print may
 // use its independently accepted translated heading.
 const priceLabel=taxMode==='vat'?(kind==='linked'?x.linkedVat:x.vatNet):
  taxMode==='sales_tax'?x.salesNet:x.untaxed;
 const buyerLabel=taxMode==='vat'?(kind==='linked'?x.buyerVat:x.buyerStandaloneVat):
  taxMode==='sales_tax'?(kind==='linked'?x.buyerLinkedSales:x.buyerSales):x.buyerUntaxed;
 // Keep the established eight numeric/string columns in their original positions,
 // as PDF/preview and historic Excel consumers depend on those positions.
 // Four audited V1→V2 columns are appended only for linked portfolios.
 const columns=[x.id,t.name,x.type,t.currency,priceLabel,t.discount,buyerLabel,
  kind==='linked'?x.marginStatus:x.status,
  ...(kind==='linked'?[x.min,x.max,x.target,x.realized]:[])];
 const notes=[t.source,taxMode==='vat'?(kind==='linked'?t.linked:t.standalone):
   (labels.v2BuyerSummary||'Sales Tax')+'. '+(labels.v2DeductionsNotice||''),t.missing];
 notes[0]+=' '+x.units;
 if(kind==='linked'){
  notes[1]+=' '+x.bounds;
  notes.splice(2,0,t.offers);
 }else if(taxMode==='sales_tax')notes[1]+=' '+x.salesPeriod;
 if(kind==='linked'&&taxMode==='sales_tax')notes[1]+=' '+x.principal;
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
   buyer,t[status]||text(status),
   ...(kind==='linked'?[
    number(item.priceMin),number(item.priceMax),
    number(item.targetMarginPct),number(item.actualAfterTaxMargin)
   ]:[])];
 });
 // The accepted V2 projection is the ONLY source of tax amounts.
 // An owner/principal line is a monetary aggregate for this model's
 // period, not a per-invoice tax ledger or a unit retail price.
 let taxTable=null;
 if(taxMode==='sales_tax'){
  const labels=salesTaxColumns[language],byId=new Map(out.items.map(item=>[String(item.id),item]));
  if(!Array.isArray(summary.lines)||summary.lines.length!==out.items.length||
     new Set(summary.lines.map(line=>String(line.id))).size!==out.items.length)
   throw Error('Incomplete V2 Sales Tax projection for spreadsheet');
  const taxRows=summary.lines.map(line=>{
   const item=byId.get(String(line.id));
   if(!item||!['owner','principal'].includes(line.base)||
      [line.net,line.salesTax,line.customerTotal].some(value=>number(value)===null))
    throw Error('Invalid V2 Sales Tax row');
   return [text(line.id),text(item.name),
     line.base==='principal'?labels.principal:labels.owner,
     line.net,line.salesTax,line.customerTotal];
  });
  if([summary.net,summary.salesTax,summary.customerTotal].some(value=>number(value)===null))
   throw Error('Invalid V2 Sales Tax summary');
  taxTable={
   sheet:labels.sheet,period:kind==='standalone'?labels.period:null,
   columns:[labels.id,labels.name,labels.base,labels.net,labels.tax,labels.buyer],
   rows:taxRows,
   totals:[labels.total,'','',summary.net,summary.salesTax,summary.customerTotal]
  };
 }
 return {language,currency,kind,taxMode,ratePct:taxMode==='sales_tax'?Number(rate):null,
   sheet:t.sheet,notesSheet:t.notes,noteColumn:t.note,columns,rows,notes,taxTable};
}
async function write(doc,ExcelJS){
 if(!ExcelJS?.Workbook)throw Error('Local Excel library is unavailable');
 const workbook=new ExcelJS.Workbook();workbook.creator='Nomad360';
 const sheet=workbook.addWorksheet(doc.sheet,{views:[{state:'frozen',ySplit:1}]});
 sheet.columns=doc.columns.map((header,index)=>({header,width:[24,38,24,12,32,24,37,30,24,24,24,29][index]}));
 for(const values of doc.rows){
  const row=sheet.addRow(values);
  for(const index of [5,6,7,...(doc.kind==='linked'?[9,10,11,12]:[])])
   row.getCell(index).numFmt='0.00';
  row.alignment={vertical:'top',wrapText:true};
 }
 sheet.autoFilter={from:{row:1,column:1},to:{row:doc.rows.length+1,column:doc.columns.length}};
 const notes=workbook.addWorksheet(doc.notesSheet);notes.columns=[{header:doc.noteColumn,width:110}];
 for(const note of doc.notes)notes.addRow([note]).alignment={wrapText:true,vertical:'top'};
 let salesSheet=null;
 if(doc.taxTable){
  // Numeric projection: preserve original JS numbers in cells; Excel displays
  // two decimal places. No formulas, derived tax or invented monthly invoices.
  salesSheet=workbook.addWorksheet(doc.taxTable.sheet,{views:[{state:'frozen',ySplit:1}]});
  salesSheet.columns=doc.taxTable.columns.map((header,index)=>({header,width:[20,39,25,25,20,27][index]}));
  for(const values of [...doc.taxTable.rows,doc.taxTable.totals]){
   const row=salesSheet.addRow(values);
   for(const col of [4,5,6])row.getCell(col).numFmt='#,##0.00';
   row.alignment={vertical:'top',wrapText:true};
  }
  salesSheet.getRow(doc.taxTable.rows.length+2).font={bold:true};
  salesSheet.autoFilter={from:{row:1,column:1},to:{row:doc.taxTable.rows.length+1,column:6}};
  if(doc.taxTable.period){
   salesSheet.getCell('H1').value=doc.taxTable.period;
   salesSheet.getColumn(8).width=23;
  }
 }
 for(const s of [sheet,notes,...(salesSheet?[salesSheet]:[])]){
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
