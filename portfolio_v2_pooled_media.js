/* #31F1 pooled-media schedule. Verified V1 CAC is the only paid-acquisition
   conversion rate. Advertising payment, attribution and fulfilled basket
   quantities have distinct ledgers. This module does not set period prices. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.LinkedPortfolioPooledMedia=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const EPS=1e-7;
 const num=v=>Number.isFinite(Number(v))?Number(v):0;
 const pos=v=>Math.max(0,num(v));
 const sum=a=>a.reduce((v,x)=>v+x,0);
 const stockSource=s=>s.source==='own'||s.source==='resale';
 const near=(x,y)=>Math.abs(x-y)<1e-8;
 function plan(state,projectOffers,items){
  const errors=[],fieldErrors=[],report=(path,msg)=>{errors.push(msg);fieldErrors.push({path,message:msg})};
  const H=Number(state.forecastMonths||1),skus=state.skus||[],
    campaigns=(state.resources||[]).filter(r=>r.kind==='campaign').slice()
      .sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  const byId=Object.fromEntries(skus.map(s=>[s.id,s]));
  const priceById=Object.fromEntries((items||[]).map(s=>[s.id,pos(s.standaloneNet)]));
  const ids=skus.map(s=>s.id).slice().sort();
  const idSet=new Set(ids),stock=Object.fromEntries(skus.filter(stockSource)
    .map(s=>[s.id,pos(s.inventoryQty)]));
  const replaced=Object.fromEntries(ids.map(id=>[id,0]));
  for(let index=0;index<campaigns.length;index++){
   const r=campaigns[index];
   if(r.cadence!=='monthly'&&r.cadence!=='once')
     report('resources','Кампания «'+r.label+'»: неизвестный график платежей.');
   if(r.cadence==='once'&&r.pool!=='none')
     report('resources','Разовая кампания не может заменять ежемесячный V1 бюджет.');
   if(r.pool==='adBudget'){
    for(const [id,amount] of Object.entries(r.includedBySku||{}))
     replaced[id]=(replaced[id]||0)+pos(amount);
   }
   if(r.payer&&r.payer!=='owner')
     report('resources','Кампания «'+r.label+'»: внешняя оплата требует отдельного подтверждённого контракта плательщика.');
  }
  for(const id of ids){
   const s=byId[id];
   if(replaced[id]>pos(s.adBudget)+EPS)
     report('skus.'+id,'Из рекламы V1 списано больше исходного бюджета «'+s.name+'».');
   if(campaigns.some(r=>(r.skuIds||[]).includes(id))&&pos(s.adBudget)<=EPS)
     report('skus.'+id,'У «'+s.name+'» нет проверенного владельческого CAC V1 для назначения общей рекламы: исходный внешний спрос сохраняется, но эффективность новой рекламы неизвестна.');
  }
  if(errors.length)return {ready:false,errors,fieldErrors,months:[],forecastMonths:H};
  const months=[];
  for(let m=0;m<H;m++){
   const beginning=m*30;
   const orders=Object.fromEntries(ids.map(id=>[id,0]));
   const baseOrders=Object.fromEntries(ids.map(id=>[id,0]));
   const discountedUnits=Object.fromEntries(ids.map(id=>[id,0]));
   const availableDays=Object.fromEntries(ids.map(id=>[id,0]));
   const allocBySku=Object.fromEntries(ids.map(id=>[id,0]));
   const retainedBySku=Object.fromEntries(ids.map(id=>[id,0]));
   const paidByCampaign=Object.fromEntries(campaigns.map(r=>[r.id,0]));
   const idleByCampaign=Object.fromEntries(campaigns.map(r=>[r.id,0]));
   const dailyAllocated=Object.fromEntries(ids.map(id=>[id,[]]));
   const dailyPaid=[],dailyCashPaid=[],eventsById=new Map();
   const serviceUsed=Object.fromEntries(ids.map(id=>[id,0]));
   for(let day=0;day<30;day++){
    const timestamp=beginning+day;
    const eligible=Object.fromEntries(ids.map(id=>{
     const s=byId[id];
     return [id,stockSource(s)?
      pos(stock[id])>EPS&&timestamp+EPS>=pos(s.supplyDays)+pos(s.productionDays):
      (s.source==='offline-service'?serviceUsed[id]<pos(s.serviceCapacity)-EPS:true)];
    }));
    const retained=Object.fromEntries(ids.map(id=>[id,
      eligible[id]?Math.max(0,pos(byId[id].adBudget)-pos(replaced[id]))/30:0]));
    const activeCampaigns=campaigns.filter(r=>r.cadence==='monthly'||(r.cadence==='once'&&m===0));
    const expenses=Object.fromEntries(activeCampaigns.map(r=>[r.id,pos(r.amount)/30]));
    for(const r of activeCampaigns)paidByCampaign[r.id]+=expenses[r.id];
    const allocate=basis=>{
     const bySku=Object.fromEntries(ids.map(id=>[id,0]));
     const byCampaign={},unassigned={};
     for(const r of activeCampaigns){
      const members=(r.skuIds||[]).filter(id=>eligible[id]).slice().sort();
      const weights=members.map(id=>{
       if(r.allocation==='usage'){
        return r.usageMode==='per-unit'?
         pos(r.loadPerUnit?.[id])*pos(basis[id]?.units):
         pos(r.usage?.[id]);
       }
       return pos(basis[id]?.revenue);
      });
      const denominator=sum(weights),row={};
      for(let i=0;i<members.length;i++){
       const amount=denominator>EPS?expenses[r.id]*weights[i]/denominator:0;
       bySku[members[i]]+=amount;
       row[members[i]]=amount;
      }
      byCampaign[r.id]=row;
      unassigned[r.id]=denominator>EPS?0:expenses[r.id];
     }
     return {bySku,byCampaign,unassigned};
    };
    const demand=bySku=>{
     const independent={};
     for(const id of ids){
      const s=byId[id],v1Media=pos(s.adBudget),ownerMedia=retained[id]+pos(bySku[id]);
      let raw=v1Media>EPS?pos(s.forecastUnitsPerMonth)*ownerMedia/v1Media:
       pos(s.forecastUnitsPerMonth)/30;
      if(!eligible[id])raw=0;
      independent[id]=stockSource(s)?Math.min(raw,pos(stock[id])):raw;
     }
     const basket=projectOffers(state.offers||[],independent,idSet);
     const basis=Object.fromEntries(ids.map(id=>[id,{
      units:pos(basket.orders[id]),
      revenue:pos(priceById[id])*
       Math.max(0,pos(basket.orders[id])-pos(basket.discountedUnits[id]))
     }]));
     return {independent,basket,basis};
    };
    // Bootstrap symmetric campaigns with V1 demand, so zero retained media
    // cannot erase a SKU before the allocator has a chance to fund it.
    let basis=Object.fromEntries(ids.map(id=>[id,{
     units:eligible[id]?pos(byId[id].forecastUnitsPerMonth)/30:0,
     revenue:eligible[id]?pos(priceById[id])*pos(byId[id].forecastUnitsPerMonth)/30:0
    }]));
    let solution=null,settled=activeCampaigns.length===0;
    for(let k=0;k<250;k++){
     const alloc=allocate(basis),actual=demand(alloc.bySku);
     solution={alloc,actual};
     const next={},diff=[];
     for(const id of ids){
      next[id]={units:basis[id].units*.5+actual.basis[id].units*.5,
       revenue:basis[id].revenue*.5+actual.basis[id].revenue*.5};
      diff.push(Math.abs(next[id].units-basis[id].units));
      diff.push(Math.abs(next[id].revenue-basis[id].revenue));
     }
     basis=next;
     if(Math.max(...diff,0)<1e-8){settled=true;break}
    }
    if(!settled)report('resources','Месяц '+(m+1)+', день '+(day+1)+
      ': общий рекламный бюджет не сошёлся по спросу и выручке.');
    // Re-evaluate from converged weight basis, no one-iteration lag.
    const allocation=allocate(basis),result=demand(allocation.bySku);
    for(const e of result.basket.fieldErrors)
     report(e.path,'Месяц '+(m+1)+', день '+(day+1)+': '+e.message);
    for(const id of ids){
     const s=byId[id],q=pos(result.basket.orders[id]);
     if(stockSource(s)&&q>pos(stock[id])+EPS)
      report('skus.'+id,'Месяц '+(m+1)+', день '+(day+1)+
       ': комплект требует '+q.toFixed(3)+' ед. «'+s.name+
       '», доступно '+pos(stock[id]).toFixed(3)+'.');
     if(s.source==='offline-service'&&serviceUsed[id]+q>pos(s.serviceCapacity)+EPS)
      report('skus.'+id,'Месяц '+(m+1)+', день '+(day+1)+
       ': мощность услуги «'+s.name+'» исчерпана.');
     baseOrders[id]+=pos(result.independent[id]);
     orders[id]+=q;
     discountedUnits[id]+=pos(result.basket.discountedUnits[id]);
     if(eligible[id])availableDays[id]++;
     retainedBySku[id]+=retained[id];
     allocBySku[id]+=pos(allocation.bySku[id]);
     dailyAllocated[id].push(retained[id]+pos(allocation.bySku[id]));
     if(stockSource(s))stock[id]=Math.max(0,pos(stock[id])-q);
     if(s.source==='offline-service')serviceUsed[id]+=q;
    }
    for(const e of result.basket.events){
     if(!eventsById.has(e.id))eventsById.set(e.id,{...e,transactions:0,
      items:e.items.map(p=>({...p,grossUnits:0,overlapUnits:0,netAddedUnits:0}))});
     const saved=eventsById.get(e.id);saved.transactions+=e.transactions;
     e.items.forEach((p,i)=>{
      saved.items[i].grossUnits+=p.grossUnits;
      saved.items[i].overlapUnits+=p.overlapUnits;
      saved.items[i].netAddedUnits+=p.netAddedUnits;
     });
    }
    let currentPay=sum(Object.values(retained));
    for(const r of activeCampaigns){
     const idle=pos(allocation.unassigned[r.id]);
     idleByCampaign[r.id]+=idle;
     currentPay+=expenses[r.id];
    }
    dailyPaid.push(currentPay);
    dailyCashPaid.push(sum(Object.values(retained))+
     sum(activeCampaigns.filter(r=>r.cadence==='monthly').map(r=>expenses[r.id]))+
     (day===0?sum(activeCampaigns.filter(r=>r.cadence==='once').map(r=>pos(r.amount))):0));
   }
   // No SKU-level cost may exceed the payment to owner; idle is explicit.
   const ownerPaid=sum(dailyCashPaid),allocated=sum(Object.values(allocBySku))+
      sum(Object.values(retainedBySku)),unattributed=sum(Object.values(idleByCampaign));
   if(Math.abs(ownerPaid-allocated-unattributed)>.000001)
    report('resources','Месяц '+(m+1)+': нарушено сохранение рекламного бюджета.');
   for(let j=0;j<(state.resources||[]).length;j++){
    const r=state.resources[j];
    if(r.usageMode!=='per-unit'||!(pos(r.capacity)>0))continue;
    const load=sum((r.skuIds||[]).map(id=>pos(r.loadPerUnit?.[id])*pos(orders[id])));
    if(load>pos(r.capacity)+EPS)
     report('resources.'+j+'.capacity','Месяц '+(m+1)+
      ': ресурс «'+r.label+'» требует '+load.toFixed(2)+
      ' при мощности '+pos(r.capacity)+'.');
   }
   months.push({month:m+1,baseOrders,orders,discountedUnits,
    events:Array.from(eventsById.values()),remainingStock:{...stock},
    availability:Object.fromEntries(ids.map(id=>[id,availableDays[id]/30])),
    units:sum(Object.values(orders)),media:{
     ownerPaid,allocated,unattributed,retainedBySku,allocatedBySku:allocBySku,
     paidByCampaign,idleByCampaign,dailyPaid,dailyCashPaid,dailyAllocated,
     source:'v1-paid-cac-daily'
    }});
  }
  return {ready:errors.length===0,errors,fieldErrors,months,
   forecastMonths:H,initialStock:Object.fromEntries(skus.filter(stockSource)
    .map(s=>[s.id,pos(s.inventoryQty)])),finalStock:{...stock}};
 }
 return Object.freeze({plan});
});
