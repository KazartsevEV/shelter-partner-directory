/* Empirical basket analytics only. No causal or incremental sales claims.
 * All observed rules use DISTINCT completed order IDs, not line quantities.
 * Source CSV remains in the browser session and is never uploaded by this module.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.LinkedPortfolioObservedMBA=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function parseCsv(text){
  if(typeof text!=='string'||text.length>3e6)throw Error('CSV должен быть текстом до 3 МБ.');
  const head=text.replace(/^\uFEFF/,'').split(/\r?\n/,1)[0]||'';
  const delimiter=head.includes(';')?';':',';
  const rows=[],out=[];let quoted=false,field='';
  const source=text.replace(/^\uFEFF/,'');
  for(let i=0;i<source.length;i++){
   const c=source[i];
   if(c==='"'){
    if(quoted&&source[i+1]==='"'){field+='"';i++}
    else quoted=!quoted;
   }else if(c===delimiter&&!quoted){out.push(field);field='';}
   else if((c==='\n'||c==='\r')&&!quoted){
    if(c==='\r'&&source[i+1]==='\n')i++;
    out.push(field);field='';
    if(out.some(x=>x.trim()))rows.push(out.slice());
    out.length=0;
   }else field+=c;
  }
  if(quoted)throw Error('CSV: незакрытые кавычки.');
  out.push(field);if(out.some(x=>x.trim()))rows.push(out);
  if(rows.length<2)throw Error('CSV не содержит историю оплаченных строк заказов.');
  const headers=rows.shift().map(s=>s.trim().toLowerCase());
  const required=['order_id','sku_id','quantity','date','status'];
  for(const f of required)if(!headers.includes(f))throw Error('В CSV отсутствует колонка '+f+'.');
  if(new Set(headers).size!==headers.length)throw Error('Дублирующиеся колонки CSV.');
  const lines=rows.map((values,index)=>{
   if(values.length!==headers.length)throw Error('Неверное число колонок CSV, строка '+(index+2)+'.');
   return Object.fromEntries(headers.map((name,i)=>[name,values[i].trim()]));
  });
  if(lines.length>50000)throw Error('CSV содержит больше 50 000 строк.');
  return lines;
 }
 const ownStatuses=new Set(['paid','completed','fulfilled','success','succeeded']);
 const rejectedStatuses=new Set(['cancelled','canceled','refunded','returned','void','chargeback']);
 const pairsKey=(a,b)=>[a,b].sort().join('\u0000');
 function analyze(csv,knownSkuIds,config={}){
  const rows=parseCsv(csv);
  const known=new Set(Array.from(knownSkuIds||[],String));
  if(!known.size)throw Error('Сначала добавьте товары или услуги в V2.');
  const orders=new Map(),unknown=new Set(),channels=new Set();
  let excluded=0;
  for(let i=0;i<rows.length;i++){
   const r=rows[i],status=r.status.toLowerCase(),sku=r.sku_id;
   if(rejectedStatuses.has(status)){excluded++;continue;}
   if(!ownStatuses.has(status))throw Error('Неизвестный статус '+r.status+' в строке '+(i+2)+'.');
   if(!r.order_id||!sku||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||
      !Number.isFinite(Date.parse(r.date)))throw Error('Некорректный заказ, SKU или дата в строке '+(i+2)+'.');
   const qty=Number(r.quantity);
   if(!Number.isInteger(qty)||qty<=0)throw Error('Количество в строке '+(i+2)+' должно быть целым положительным.');
   if(!known.has(sku)){unknown.add(sku);continue;}
   const channel=r.channel||'не указан';
   const row=orders.get(r.order_id);
   if(row&&(row.date!==r.date||row.channel!==channel))
    throw Error('Один заказ имеет разные даты или каналы: '+r.order_id);
   if(!row)orders.set(r.order_id,{date:r.date,channel,skus:new Set([sku])});
   else row.skus.add(sku);
   channels.add(channel);
  }
  if(unknown.size)throw Error('SKU отсутствуют в V2 (сопоставьте ID перед анализом): '+
    Array.from(unknown).slice(0,20).join(', '));
  const baskets=Array.from(orders.values());
  const n=baskets.length;
  if(n<2)throw Error('Для MBA нужны хотя бы два завершённых заказа.');
  const single=new Map(),pair=new Map(),triple=new Map();
  for(const basket of baskets){
   const ids=Array.from(basket.skus).sort();
   if(ids.length>30)throw Error('В одном заказе больше 30 различных SKU; проверьте данные.');
   ids.forEach(id=>single.set(id,(single.get(id)||0)+1));
   for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
    const ab=pairsKey(ids[i],ids[j]);pair.set(ab,(pair.get(ab)||0)+1);
    for(let k=j+1;k<ids.length;k++){
     const abc=[ids[i],ids[j],ids[k]].join('\u0000');
     triple.set(abc,(triple.get(abc)||0)+1);
    }
   }
  }
  const threshold=Math.max(2,Math.ceil(Number(config.minCount)||2)),rules=[],tuples=[];
  for(const [key,count] of pair){
   if(count<threshold)continue;
   const [a,b]=key.split('\u0000');
   for(const [anchor,child] of [[a,b],[b,a]]){
    const base=single.get(anchor)||0,bought=single.get(child)||0;
    const confidence=count/base,childSupport=bought/n;
    rules.push({anchorSkuId:anchor,items:[{skuId:child,qty:1}],
      cooccurrence:count,baseCount:base,support:count/n,
      confidence,lift:childSupport?confidence/childSupport:0,type:'pair'});
   }
  }
  for(const [key,count]of triple){
   if(count<threshold)continue;
   const ids=key.split('\u0000');
   for(const anchor of ids){
    const children=ids.filter(s=>s!==anchor),base=single.get(anchor)||0,
      childPairCount=pair.get(pairsKey(children[0],children[1]))||0;
    const confidence=count/base,childPairSupport=childPairCount/n;
    tuples.push({anchorSkuId:anchor,items:children.map(skuId=>({skuId,qty:1})),
      cooccurrence:count,baseCount:base,support:count/n,
      confidence,lift:childPairSupport?confidence/childPairSupport:0,type:'tuple'});
   }
  }
  const sort=(a,b)=>b.cooccurrence-a.cooccurrence||b.lift-a.lift||
    a.anchorSkuId.localeCompare(b.anchorSkuId);
  rules.sort(sort);tuples.sort(sort);
  const dates=baskets.map(b=>b.date).sort();
  return {source:'observed-orders',transactions:n,excludedLines:excluded,
    dateFrom:dates[0],dateTo:dates.at(-1),channels:Array.from(channels).sort(),
    singles:Object.fromEntries(single),pairs:rules,tuples,
    warning:n<30?'Малая выборка. Частоты нестабильны; lift не доказывает дополнительную прибыль.':
      'Совместные покупки не доказывают причинного прироста продаж.'};
 }
 return Object.freeze({parseCsv,analyze});
});
