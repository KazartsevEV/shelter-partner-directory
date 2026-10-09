const {test}=require('node:test');
const A=require('node:assert/strict');
const adapter=require('../portfolio_v2_online_adapter.js'),E=require('../portfolio_v2_linked_engine.js');
const close=(got,want,msg)=>A.ok(Number.isFinite(got)&&Math.abs(got-want)<.00001,
 msg+': got '+got+', independently expected '+want);
const defaults=()=>({monthlyBudget:400,cpc:4,ctr:2,cvrLead:20,cvrDeal:50,
 costConsult:100,costPack:200,ltv:30,months:3,mgmt:0,site:0,hosting:0,dom:0,
 magnet:0,acq:10,taxTurnover:5,agentPct:20,agentTaxTurnover:10,markup:25});
const kinds=['monthlyBudget','mgmt','site','hosting','dom','magnet'];
const everyPayer=which=>Object.fromEntries(kinds.map(key=>[key,which]));
const source=(mode,settings={},payers=everyPayer('me'),name='Онлайн-консультация')=>
 adapter.fromOnlineV1({mode,name,values:{...defaults(),...settings},payers});
const build=(...skus)=>E.build(E.fromV1({skus,tax:{type:'turnover',pct:0}}));
test('V1 30-day self — exact approved month-1 double ramp and single acquiring, tax, media',()=>{
 const s=source('self');
 close(s.forecastUnitsPerMonth,5,'month-1 deals');
 close(s.onlineGrossPerDeal,65,'weighted consultation+package');
 close(s.priceMax,65,'contractual receipt/deal');
 close(s.onlineFirstMonthRevenue,325,'real first-month V1 gross');
 const out=build(s);A.equal(out.ready,true,JSON.stringify(out.errors));
 close(out.totals.revenue,325,'V2 self revenue');
 close(out.totals.media,400,'V2 paid advertising');
 close(out.totals.cogs,0,'own online service has no invented contractor');
 close(out.totals.tax,16.25,'tax on seller gross');
 close(out.items[0].commission,32.5,'acquiring paid once');
 close(out.totals.netProfit,-123.75,'independent V1 first-month money');
 close(out.cashflow.months[0].cashFlow,-123.75,'V2 first-month owner cash');
});
test('V1 30-day hired — executor receives reverse-markup amount; one deduction in V2',()=>{
 const s=source('hired'),out=build(s);
 A.equal(out.ready,true,JSON.stringify(out.errors));
 close(s.unitCost,52,'contractor paid per deal');
 close(out.totals.cogs,260,'contractor monthly wages');
 close(out.totals.revenue,325,'client revenue not contractor revenue');
 close(out.totals.netProfit,-383.75,'hired owner after cost, acquiring, tax, ads');
 close(out.cashflow.months[0].cashFlow,-383.75,'hired cash');
});
test('V1 30-day agent — my commission only; partner gross separate, taxes independently',()=>{
 const s=source('agent'),out=build(s);
 A.equal(out.ready,true,JSON.stringify(out.errors));
 close(s.priceMax,13,'my commission per deal');
 close(out.totals.revenue,65,'my revenue not partner GMV');
 close(out.totals.media,400,'my media ownership');
 close(out.totals.tax,6.5,'my agent turnover tax');
 close(out.totals.netProfit,-341.5,'my agent cash/earnings');
 close(out.cashflow.months[0].cashFlow,-341.5,'my paid cash');
 close(out.counterpart[0].gross,325,'partner turnover separate');
 close(out.counterpart[0].commission,65,'partner owes me');
 close(out.counterpart[0].acquiring,32.5,'partner acquiring');
 close(out.counterpart[0].partnerTax,16.25,'partner turnover tax');
 close(out.counterpart[0].profit,211.25,'partner own P&L');
 A.equal(out.items[0].priceGross,13,'V2 shows agent fee not client check');
});
test('Partner-funded campaign yields positive demand but ZERO phantom agent acquisition costs',()=>{
 const payer=everyPayer('partner'),s=source('agent',{},payer);
 const out=build(s);A.equal(out.ready,true,JSON.stringify(out.errors));
 close(s.adBudget,0,'zero own media');
 close(s.onlineExternalAdBudget,400,'partner-funded marketing');
 close(out.items[0].forecastOrders,5,'external funnel is preserved');
 close(out.totals.revenue,65,'commission unchanged');
 close(out.totals.media,0,'partner advertising is not mine');
 close(out.totals.netProfit,58.5,'agent after only own agent turnover tax');
 close(out.counterpart[0].partnerOpex,400,'partner paid advertising');
 close(out.counterpart[0].profit,-188.75,'partner P&L including own ads');
});
test('A genuinely mixed portfolio has company tax on goods and agent tax only on commission',()=>{
 const a=source('agent',{},everyPayer('partner'));
 const product={id:'cream',name:'Крем',source:'resale',unitCost:20,
   forecastUnitsPerMonth:5,adBudget:50,baseCac:10,priceMin:70,priceMax:200,
   maxDiscountPct:0,minimumMarginPct:10,targetMarginPct:20,
   salesFixedMonthly:0,adManagement:0,variableSalesPct:0,
   creditServiceMonthly:0,vatPct:0,inventoryQty:12,materialsBatchTotal:240,
   productionTotal:0,reserveAmount:0};
 const state=E.fromV1({skus:[a,product],tax:{type:'turnover',pct:3}});
 state.offers=[{id:'x',mode:'cross_sell',anchorSkuId:a.id,attachPct:40,
   overlapPct:0,items:[{skuId:'cream',qty:1}]}];
 const x=E.build(state);A.equal(x.ready,true,JSON.stringify(x.errors));
 close(x.items[0].forecastOrders,5,'agent deals remain baseline');
 close(x.items[1].forecastOrders,7,'two additional creams');
 close(x.items[0].incomeTax,6.5,'agent separate 10% tax');
 close(x.totals.tax,6.5+x.items[1].revenue*.03,'company goods tax is only on goods');
 close(x.counterpart[0].gross,325,'partner gross is NOT counted as my business gross');
 close(x.cashflow.months.reduce((z,m)=>z+m.receipt,0),x.totals.revenue,
   'cash revenue is exact owner receipts');
});
test('Online resource shared with product is paid once; no online inventory or phantom materials',()=>{
 const s=source('self'),product={id:'membership',name:'Подписка',source:'dropship',
   unitCost:10,forecastUnitsPerMonth:5,adBudget:50,baseCac:10,
   priceMin:40,priceMax:150,maxDiscountPct:0,minimumMarginPct:10,targetMarginPct:20,
   salesFixedMonthly:0,adManagement:0,variableSalesPct:0,creditServiceMonthly:0,
   vatPct:0,inventoryQty:0,dropshipDeliveryDays:0,dropshipPayoutLagDays:0,
   dropshipPayoutMode:'before',reserveAmount:0};
 const state=E.fromV1({skus:[s,product],tax:{type:'turnover',pct:0}});
 state.resources=[{id:'space',kind:'premises',label:'Помещение',amount:60,cadence:'monthly',
   pool:'none',allocation:'usage',usage:{[s.id]:1,membership:1},skuIds:[s.id,'membership'],
   includedBySku:{}}];
 const r=E.build(state);A.equal(r.ready,true,JSON.stringify(r.errors));
 close(r.totals.monthlyResources,60,'one shared rent');
 close(r.resources[0].bySku[s.id]+r.resources[0].bySku.membership,60,'resource conservation');
 A.ok(r.cashflow.ownerCapital>=0);
 state.resources[0].kind='warehouse';const invalid=E.build(state);
 A.equal(invalid.ready,false);
 A.ok(invalid.errors.some(e=>e.includes('Складской ресурс')));
});
test('Site CAPEX is paid once and amortized only in profit; no duplicate payment',()=>{
 const s=source('self',{site:120,magnet:60});
 const r=build(s);A.equal(r.ready,true,JSON.stringify(r.errors));
 close(s.onlineCapex,180,'original asset purchases');
 close(r.totals.depreciation,15,'1 month of 12 month amortization');
 close(r.totals.netProfit,-138.75,'accounting income includes 15');
 close(r.cashflow.months[0].cashFlow,-303.75,'cash includes 180');
 close(r.cashflow.freeCash-r.cashflow.ownerCapital+r.cashflow.reserve,
   r.totals.netProfit-165,'cash vs amortized accrual');
});
test('Agent payer 64 combinations conserve commission, taxes, direct costs and both balance sheets',()=>{
 const extras={mgmt:30,site:120,hosting:12,dom:6,magnet:60};
 for(let mask=0;mask<64;mask++){
  const payers=Object.fromEntries(kinds.map((k,i)=>[k,(mask&(1<<i))?'me':'partner']));
  const s=source('agent',extras,payers);
  const r=build(s);A.equal(r.ready,true,'mask '+mask+' '+JSON.stringify(r.errors));
  const ownSpend=k=>payers[k]==='me'?(k==='monthlyBudget'?400:extras[k]):0;
  const partnerSpend=k=>payers[k]==='partner'?(k==='monthlyBudget'?400:extras[k]):0;
  const myOps=ownSpend('monthlyBudget')+ownSpend('mgmt')+ownSpend('hosting')+ownSpend('dom');
  const myCapex=ownSpend('site')+ownSpend('magnet');
  const partnerOps=partnerSpend('monthlyBudget')+partnerSpend('mgmt')+
    partnerSpend('hosting')+partnerSpend('dom');
  const partnerCapex=partnerSpend('site')+partnerSpend('magnet');
  close(r.totals.netProfit,65-6.5-myOps-myCapex/12,'agent income mask '+mask);
  close(r.cashflow.months[0].cashFlow,65-6.5-myOps-myCapex,'agent cash mask '+mask);
  close(r.counterpart[0].profit,211.25-partnerOps-partnerCapex/12,'partner profit mask '+mask);
  close(r.counterpart[0].cash,211.25-partnerOps-partnerCapex,'partner cash mask '+mask);
  close(r.cashflow.months[0].cashFlow+r.counterpart[0].cash,
      325-32.5-16.25-6.5-400-30-120-12-6-60,'joint cash conservation mask '+mask);
 }
});
test('Reject false source/corrupt taxpayer provenance and unchanged zero-conversion',()=>{
 const v=defaults();v.cvrDeal=0;
 A.throws(()=>adapter.fromOnlineV1({mode:'self',name:'bad',values:v}),/воронк/);
 const a=source('agent',{},everyPayer('partner'));delete a.onlinePartner;
 const r=build(a);A.equal(r.ready,false);
 A.ok(r.errors.some(x=>x.includes('контур партнёра')));
});

test('Negative owner online earnings cannot shield unrelated profit-taxed goods',()=>{
 const service=source('self'); // 325 gross - 400 media - 32.5 acquiring, 5% own turnover tax
 const goods={id:'g',name:'Цифровой товар',source:'dropship',unitCost:10,
   forecastUnitsPerMonth:5,adBudget:50,baseCac:10,priceMin:70,priceMax:150,
   maxDiscountPct:0,minimumMarginPct:10,targetMarginPct:20,
   salesFixedMonthly:0,adManagement:0,variableSalesPct:0,creditServiceMonthly:0,
   vatPct:0,inventoryQty:0,dropshipDeliveryDays:0,dropshipPayoutLagDays:0,
   dropshipPayoutMode:'before',reserveAmount:0};
 const portfolio=E.fromV1({skus:[service,goods],tax:{type:'profit',pct:20}});
 const result=E.build(portfolio);
 A.equal(result.ready,true,JSON.stringify(result.errors));
 const realGoods=result.items.find(s=>s.id==='g');
 const independentlyTaxedGoods=Math.max(0,realGoods.preTaxProfit)*.2;
 close(result.totals.tax,16.25+independentlyTaxedGoods,'unrelated positive profits taxed independently');
 close(result.cashflow.months.reduce((a,m)=>a+m.tax,0),
   16.25+independentlyTaxedGoods,'cash tax not shielded by another entity loss');
});
test('Online service reallocation never converts partner-funded media to my costs',()=>{
 const agent=source('agent',{},everyPayer('partner'));
 const input=E.fromV1({skus:[agent],tax:{type:'turnover',pct:3}});
 input.resources.push({id:'commonCampaign',kind:'campaign',label:'Моя дополнительная реклама',
  amount:200,cadence:'monthly',pool:'none',allocation:'usage',usage:{[agent.id]:1},
  skuIds:[agent.id],includedBySku:{}});
 const result=E.build(input);
 A.equal(result.ready,true,JSON.stringify(result.errors));
 close(result.totals.media,200,'owner pays only incremental shared ad budget');
 close(result.items[0].forecastOrders,7.5,'partner campaign 400 + my new 200 = 1.5× demand');
 close(result.counterpart[0].gross,487.5,'partner GMV follows approved acquired deals');
 close(result.counterpart[0].partnerOpex,400,'original partner spend remains owned by partner');
 close(result.items[0].revenue,97.5,'my commission on new deals');
});

test('Online CAPEX cannot create profit tax on company goods when online is a separate turnover taxpayer',()=>{
 const svc=source('agent',{site:120,magnet:60},everyPayer('me'));
 const state=E.fromV1({skus:[svc],tax:{type:'profit',pct:24}});
 const r=E.build(state);A.equal(r.ready,true,JSON.stringify(r.errors));
 close(r.totals.tax,6.5,'agent own turnover tax only, no artificial corporate profit tax');
 close(r.cashflow.months.reduce((a,m)=>a+m.tax,0),6.5,
   'cash tax includes agent tax but never taxes own depreciation');
});
