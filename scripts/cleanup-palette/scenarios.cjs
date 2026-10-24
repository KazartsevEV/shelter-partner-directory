'use strict';
const fixture=require('../../tests/fixtures/sales-tax-7b/vat-inputs.json');
const service={months:2,monthlyForecast:[10,8],capacity:20,priceGross:112,vatPct:12,discountPct:0,taxType:'profit',taxPct:15,unitCashCost:20,commissionPct:3,fixedCashMonthly:50,equipmentPurchase:500,equipmentAmortMonthly:10,reservePct:10,funding:'credit',annualRatePct:12,creditMonths:3};
async function route(p,kind){
 if(kind==='home')return p.evaluate(()=>showHome());
 if(kind==='v1')return p.evaluate(()=>showProductBranch());
 if(kind==='standalone'||kind==='linked'){const input=fixture.cases.find(c=>c.kind===kind&&c.id.endsWith('profit-vat12-credit-3')).input;return p.evaluate(({kind,input})=>{localStorage.setItem(kind==='standalone'?'marketingCalcPortfolioV2':'marketingCalcLinkedPortfolioV2',JSON.stringify(input));kind==='standalone'?PortfolioV2UI.open({resume:true}):LinkedPortfolioV2UI.resume();},{kind,input});}
 if(kind==='full-service')return p.evaluate(input=>Nomad360FullServiceUI.open(input,{kind:'offline',name:'TASK10 · толық сервис'}),service);
 if(kind==='offline')return p.evaluate(()=>{showServiceWorkChooser();selectServiceFinancialMode('simple');chooseServiceChannel('offline');startOfflineServiceCalculation();});
 return p.evaluate(role=>{showServiceWorkChooser();selectServiceFinancialMode('simple');chooseServiceChannel('online');selectServiceMode(role);},kind.slice('simple-'.length));
}
async function model(p,kind){return p.evaluate(kind=>{if(kind==='v1'){const v=calculateProductPortfolio();return {model:v,cash:calculateProductCashFlow(v)};}if(kind==='standalone'){const s=PortfolioV2UI.getState();return Nomad360PaymentUI.buildPortfolio(s);}if(kind==='linked')return LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState());if(kind==='full-service')return Nomad360FullServiceUI.getResult();return null;},kind);}

module.exports={route,model};
