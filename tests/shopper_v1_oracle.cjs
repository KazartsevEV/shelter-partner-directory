'use strict';
// Independent dated case, no application imports. Daily transactions are folded
// into months; fees start from VAT-inclusive customer payments (Kaspi tariff).
const assert=require('node:assert/strict');
const inputs=Object.freeze({currency:'KZT',rawKits:516,finished:500,defect:.03,
 fabricPrice:1000,fabricMetres:.3876,thread:25,label:40,packaging:50,inbound:50,
 wage:230000,employerRate:.175,premises:80000,rental:25000,overhead:15000,
 electricityTariff:40,electricityKwh:.15,receiving:20,storage:.5,
 adBudget:250000,cpc:100,ctr:.02,clickToLead:.2,leadToSale:.3,
 adManagement:50000,salesContractor:60000,supplyDay:7,productionDays:30,
 advance:.5,advanceLead:3,reserveRate:.1,vat:.16,profitTax:.2,
 kaspiGrossFee:.0095,targetMargin:.2,minimumMargin:.1,discount:.1,annualInterest:.2});
function oracle(financing='cash',term=6){
 const x=inputs;
 const forecast=x.adBudget/x.cpc*x.clickToLead*x.leadToSale;
 const kitsNeeded=Math.ceil(x.finished/(1-x.defect));
 assert.equal(kitsNeeded,x.rawKits);
 const materialKit=x.fabricPrice*x.fabricMetres+x.thread+x.label+x.packaging+x.inbound;
 const materials=materialKit*x.rawKits;
 const payroll=x.wage*(1+x.employerRate);
 const productionUnit=((payroll+x.premises+x.rental+x.overhead)/x.finished+x.electricityTariff*x.electricityKwh)/(1-x.defect);
 const production=productionUnit*x.finished;
 const saleStart=x.supplyDay+x.productionDays,unitsPerDay=forecast/30;
 const sellDays=x.finished/unitsPerDay,saleEnd=saleStart+sellDays;
 const receiving=x.receiving*x.finished,storage=x.storage*x.finished*sellDays/2;
 const baseCapital=materials+production+receiving+storage+(x.salesContractor+x.adBudget+x.adManagement)*sellDays/30;
 const reserve=baseCapital*x.reserveRate,capital=baseCapital+reserve;
 const interest=financing==='credit'?capital*x.annualInterest/12:0;
 const totalInterest=interest*(financing==='credit'?term:0);
 const unitCost=(materials+production+receiving+storage)/x.finished;
 const cac=x.adBudget/forecast;
 const basePrice=(unitCost+cac+reserve/x.finished+totalInterest/x.finished)/(1-x.targetMargin);
 const effectiveFee=x.kaspiGrossFee*(1+x.vat);
 const revenue=basePrice*forecast,fee=revenue*effectiveFee,cogs=unitCost*forecast;
 const shared=x.salesContractor+x.adManagement;
 const pretax=revenue-fee-cogs-x.adBudget-shared-interest;
 const taxMultiplier=pretax>0?(cogs+x.adBudget+shared+interest+pretax/(1-x.profitTax))/(revenue-fee):1;
 const priceExVat=basePrice*taxMultiplier,priceGross=priceExVat*(1+x.vat);
 const adjustedPretax=priceExVat*forecast*(1-effectiveFee)-cogs-x.adBudget-shared-interest;
 const adjustedTax=Math.max(0,adjustedPretax)*x.profitTax,adjustedNet=adjustedPretax-adjustedTax;
 const priceLoad=unitCost+cac+shared/forecast+reserve/x.finished+totalInterest/x.finished;
 const listFor=margin=>Math.ceil(priceLoad/(1-effectiveFee-margin/(1-x.profitTax))*(1+x.vat)/(1-x.discount)*100)/100;
 const horizon=Math.max(saleEnd,financing==='credit'?term*30:0);
 const months=Array.from({length:Math.ceil(horizon/30)},(_,i)=>({month:i+1,inflow:0,outflow:0,taxableProfit:0,interestPaid:0,principalRepaid:0,financedInflow:0,sold:0}));
 // End-of-day convention: a month contains [0,30), [30,60), ... .
 for(let day=0;day<horizon;day++){
  const m=months[Math.floor(day/30)];
  if(day===0){m.inflow+=capital;m.financedInflow+=capital;}
  if(day===x.supplyDay-x.advanceLead)m.outflow+=materials*x.advance;
  if(day===x.supplyDay)m.outflow+=materials*(1-x.advance);
  if(day>=x.supplyDay&&day<saleStart)m.outflow+=production/x.productionDays;
  if(day===saleStart)m.outflow+=receiving;
  if(day>=saleStart&&day<saleEnd){
   const sold=Math.min(unitsPerDay,x.finished-(day-saleStart)*unitsPerDay);
   const receipt=sold*priceExVat,customerPayment=receipt*(1+x.vat);
   const processing=customerPayment*x.kaspiGrossFee;
   const stockOpening=x.finished-(day-saleStart)*unitsPerDay;
   const storagePayment=(stockOpening-sold/2)*x.storage;
   const dailyMedia=x.adBudget/30,dailyManagement=x.adManagement/30,dailySales=x.salesContractor/30;
   m.sold+=sold;m.inflow+=receipt;
   m.outflow+=processing+storagePayment+dailyMedia+dailyManagement+dailySales;
   m.taxableProfit+=receipt-sold*unitCost-processing-dailyMedia-dailyManagement-dailySales;
  }
  if(financing==='credit'&&day%30===29&&day<term*30){
   m.interestPaid+=interest;m.outflow+=interest;m.taxableProfit-=interest;
   if(day===term*30-1){m.principalRepaid=capital;m.outflow+=capital;}
  }
 }
 let cumulative=0,soldToDate=0;
 for(const m of months){m.taxPaid=Math.max(0,m.taxableProfit)*x.profitTax;m.outflow+=m.taxPaid;m.cashFlow=m.inflow-m.outflow;cumulative+=m.cashFlow;m.cumulative=cumulative;m.freeCumulative=cumulative-reserve;soldToDate+=m.sold;m.remainingStock=x.finished-soldToDate;}
 return {inputs:x,financing,term,forecast,materials,materialKit,payroll,productionUnit,production,baseCapital,reserve,capital,unitCost,cac,interest,totalInterest,basePrice,taxMultiplier,priceExVat,priceGross,adjustedPretax,adjustedTax,adjustedNet,listMin:listFor(x.minimumMargin),listMax:listFor(x.targetMargin),saleStart,saleEnd,sellDays,horizon,months,cumulativeEnd:cumulative,freeCumulativeEnd:cumulative-reserve};
}
function close(actual,expected,label,tolerance=.012){assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance,`${label}: application=${actual}, independent=${expected}`)}
function verify(snapshot,financing='cash',term=6){
 const o=oracle(financing,term),p=snapshot.product,m=snapshot.model,cf=snapshot.cash,c=snapshot.cycle;
 assert.equal(snapshot.currency,'KZT');assert.equal(p.materialsBatchQty,516);assert.equal(p.productionQty,500);assert.equal(p.logisticsQty,500);assert.equal(p.salesQty,500);
 for(const [key,value] of Object.entries({materialsBatchTotal:o.materials,productionTotal:o.production}))close(p[key],value,key);
 for(const [key,value] of Object.entries({nonRevenueCosts:o.baseCapital,reserveAmount:o.reserve,requiredCapital:o.capital,sellThroughDays:o.sellDays}))close(c[key],value,'cycle '+key);
 const row=m.items[0];assert.equal(m.items.length,1);close(m.adjustedProfitBeforeTax,o.adjustedPretax,'Monthly accrual result before tax');close(m.adjustedTax,o.adjustedTax,'Monthly profit tax');close(m.adjustedNetProfit,o.adjustedNet,'Monthly net profit');close(row.forecastSales,o.forecast,'forecast');close(row.unitCost,o.unitCost,'COGS/unit');close(row.price,o.basePrice,'base price');close(m.taxPriceMultiplier,o.taxMultiplier,'profit-tax price multiplier',1e-10);
 assert.equal(snapshot.priceList.ready,true);close(snapshot.priceList.minPrice,o.listMin,'price-list floor',1e-8);close(snapshot.priceList.maxPrice,o.listMax,'price-list target',1e-8);
 assert.equal(cf.ready,true);assert.equal(cf.horizonDays,o.horizon);assert.equal(cf.saleEndDays,o.saleEnd);assert.equal(cf.months.length,o.months.length);
 for(let i=0;i<o.months.length;i++)for(const key of ['inflow','outflow','taxPaid','taxableProfit','interestPaid','principalRepaid','financedInflow','cashFlow','cumulative','freeCumulative'])close(cf.months[i][key],o.months[i][key],`month ${i+1}: ${key}`);
 close(cf.cumulativeEnd,o.cumulativeEnd,'final balance');close(cf.freeCumulativeEnd,o.freeCumulativeEnd,'final balance after reserve');
 return o;
}
module.exports={inputs,oracle,verify,close};
