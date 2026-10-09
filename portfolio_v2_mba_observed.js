/* Empirical Market Basket Analysis for V2. No forecasting or causality.
   One completed order ID = one denominator observation, irrespective of line count or repeat buyer. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.LinkedPortfolioMBAObserved=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const fail=m=>{throw Error(m)};
 const wanted=['order_id','date','sku_id','quantity','unit_price','currency','channel'];
 function csvRows(text){
   const sep=String(text).split(/\r?\n/,1)[0].split(';').length>
     String(text).split(/\r?\n/,1)[0].split(',').length?';':',';
   const rows=[];let row=[],cell='',quote=false;
   for(let i=0;i<text.length;i++){
     const c=text[i];
     if(c==='"'){
       if(quote&&text[i+1]==='"'){cell+='"';i++;}
       else if(!quote&&cell.trim())fail('Некорректное экранирование CSV.');
       else quote=!quote;
     }else if(!quote&&c===sep){row.push(cell);cell='';}
     else if(!quote&&(c==='\n'||c==='\r')){
       if(c==='\r'&&text[i+1]==='\n')i++;
       row.push(cell);if(row.some(x=>String(x).trim()))rows.push(row);row=[];cell='';
     }else cell+=c;
   }
   if(quote)fail('CSV содержит незакрытую кавычку.');
   row.push(cell);if(row.some(x=>String(x).trim()))rows.push(row);
   if(!rows.length)fail('Файл чеков пуст.');
   const headings=rows.shift().map(x=>x.trim().toLowerCase());
   for(const h of wanted)if(!headings.includes(h))fail('В CSV отсутствует столбец '+h+'.');
   const dup=headings.filter((x,i)=>headings.indexOf(x)!==i);
   if(dup.length)fail('Повторяющийся заголовок CSV: '+dup[0]);
   return rows.map((cells,i)=>{
     if(cells.length!==headings.length)fail('CSV строка '+(i+2)+': неверное число колонок.');
     return Object.fromEntries(headings.map((h,j)=>[h,cells[j].trim()]));
   });
 }
 function read(text,format='auto'){
   if(typeof text!=='string'||!text.trim())fail('Выберите непустой CSV или JSON с чеками.');
   if(text.length>3500000)fail('Файл больше лимита 3,5 МБ. Разделите историю на периоды.');
   const kind=format==='auto'?( /^[\s]*[\[{]/.test(text)?'json':'csv'):format;
   if(!['csv','json'].includes(kind))fail('Поддерживается только CSV или JSON.');
   let records;
   if(kind==='json'){
     try{const raw=JSON.parse(text);records=Array.isArray(raw)?raw:raw?.lines}
     catch(_){fail('Некорректный JSON чеков.')}
     if(!Array.isArray(records))fail('JSON должен содержать массив строк или поле lines.');
   }else records=csvRows(text);
   if(records.length>20000)fail('Не больше 20 000 строк за один импорт.');
   const seen=new Map(),lines=[];
   const bool=v=>v===true||v===1||['true','1','yes','да'].includes(String(v??'').toLowerCase());
   for(let i=0;i<records.length;i++){
     const r=records[i];
     if(!r||typeof r!=='object'||Array.isArray(r))fail('Строка '+(i+1)+' не является объектом.');
     const id=String(r.order_id??'').trim(),sku=String(r.sku_id??'').trim(),
       date=String(r.date??'').trim().slice(0,10),channel=String(r.channel??'').trim(),
       currency=String(r.currency??'').trim().toUpperCase(),
       quantity=Number(r.quantity),price=Number(r.unit_price);
     if(!id||!sku||!channel||!currency)fail('Строка '+(i+1)+': заполните order_id, sku_id, channel, currency.');
     if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||
        new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)
       fail('Строка '+(i+1)+': дата должна быть YYYY-MM-DD.');
     if(!Number.isInteger(quantity)||quantity<1||!Number.isFinite(price)||price<0)
       fail('Строка '+(i+1)+': quantity — целое положительное, unit_price — неотрицательный.');
     const status=String(r.status||'completed').trim().toLowerCase();
     if(!['completed','paid','fulfilled','canceled','cancelled','refunded','returned'].includes(status))
       fail('Строка '+(i+1)+': неизвестный статус '+status);
     const cancelled=bool(r.canceled)||['canceled','cancelled'].includes(status);
     const returned=bool(r.returned)||['returned','refunded'].includes(status);
     const returnedQuantity=r.returned_quantity===undefined||r.returned_quantity===''?0:Number(r.returned_quantity);
     if(!Number.isInteger(returnedQuantity)||returnedQuantity<0||returnedQuantity>quantity)
       fail('Строка '+(i+1)+': возвращено больше единиц, чем куплено.');
     const remaining=cancelled||returned?0:quantity-returnedQuantity;
     const lineId=String(r.line_id??'').trim();
     const line={orderId:id,date,rawSku:sku,quantity:remaining,originalQuantity:quantity,
       price,currency,channel,status,lineId,buyerId:String(r.buyer_id??'').trim()};
     if(lineId){
       if(seen.has(lineId)){
         if(JSON.stringify(seen.get(lineId))!==JSON.stringify(line))
           fail('line_id '+lineId+' противоречит предыдущей строке.');
         continue;
       }
       seen.set(lineId,line);
     }
     lines.push(line);
   }
   return {format:kind,lines,rawLines:records.length,deduplicated:records.length-lines.length};
 }
 function analyze(dataset,knownIds,mapping={},filter={}){
   const errors=[],unresolved=new Set(),known=new Set(knownIds||[]);
   const selected=(dataset?.lines||[]).filter(l=>
     (!filter.channel||filter.channel==='all'||l.channel===filter.channel)&&
     (!filter.from||l.date>=filter.from)&&(!filter.to||l.date<=filter.to));
   const grouped=new Map(),meta={};
   for(const l of selected){
     if(l.quantity<=0)continue;
     const canonical=Object.prototype.hasOwnProperty.call(mapping,l.rawSku)?mapping[l.rawSku]:l.rawSku;
     if(!known.has(canonical)){unresolved.add(l.rawSku);continue;}
     const existing=grouped.get(l.orderId);
     if(existing&&(existing.currency!==l.currency||existing.channel!==l.channel||
         existing.date!==l.date))errors.push('Заказ '+l.orderId+' содержит разные даты, валюты или каналы.');
     if(!existing)grouped.set(l.orderId,{id:l.orderId,date:l.date,currency:l.currency,
       channel:l.channel,buyerId:l.buyerId,items:{},recordedAmount:0});
     const g=grouped.get(l.orderId);
     g.items[canonical]=(g.items[canonical]||0)+l.quantity;
     g.recordedAmount+=l.quantity*l.price;
   }
   if(unresolved.size)errors.push('Сопоставьте неизвестные SKU с позициями V1 перед расчётом ассоциаций.');
   const baskets=[...grouped.values()],N=baskets.length;
   const items=new Map(),joint=new Map();
   function combinations(ids,max){
     const result=[];
     function rec(start,prefix){
       if(prefix.length>=1)result.push([...prefix]);
       if(prefix.length===max)return;
       for(let i=start;i<ids.length;i++){prefix.push(ids[i]);rec(i+1,prefix);prefix.pop();}
     }
     rec(0,[]);return result;
   }
   for(const b of baskets){
     const ids=Object.keys(b.items).sort();
     for(const id of ids)items.set(id,(items.get(id)||0)+1);
     for(const combo of combinations(ids,3)){
       if(combo.length<2)continue;
       const id=JSON.stringify(combo);joint.set(id,(joint.get(id)||0)+1);
     }
   }
   const rules=[];
   if(!errors.length&&N){
     for(const [serialized,count] of joint){
       const set=JSON.parse(serialized);
       for(const consequent of set){
         const antecedent=set.filter(x=>x!==consequent);
         const aCount=antecedent.length===1?items.get(antecedent[0]):
           joint.get(JSON.stringify(antecedent));
         const bCount=items.get(consequent);
         if(!aCount||!bCount)continue;
         const support=count/N,confidence=count/aCount,base=bCount/N;
         rules.push({antecedent,consequent,count,antecedentCount:aCount,consequentCount:bCount,N,
           supportAntecedent:aCount/N,supportConsequent:base,support,confidence,lift:confidence/base,
           tuple:set.length>2});
       }
     }
   }
   rules.sort((a,b)=>b.lift-a.lift||b.count-a.count||
      a.antecedent.join('|').localeCompare(b.antecedent.join('|'))||
      a.consequent.localeCompare(b.consequent));
   const aovByCurrency=[...new Set(baskets.map(b=>b.currency))].sort().map(currency=>{
     const scoped=baskets.filter(b=>b.currency===currency);
     const amount=scoped.reduce((v,b)=>v+b.recordedAmount,0);
     return {currency,orders:scoped.length,recordedAmount:amount,
       averageOrderValue:amount/scoped.length};
   });
   const dates=baskets.map(b=>b.date).sort(),channels=[...new Set(baskets.map(b=>b.channel))].sort(),
     currencies=[...new Set(baskets.map(b=>b.currency))].sort();
   return {ready:!errors.length,errors,unresolved:[...unresolved].sort(),
     N,rules,sourceLines:dataset?.rawLines??0,retainedLines:selected.filter(l=>l.quantity>0).length,
     period:{from:dates[0]||null,to:dates.at(-1)||null},channels,currencies,aovByCurrency,
     rejectedLines:(dataset?.lines?.length||0)-selected.filter(l=>l.quantity>0).length,
     duplicateLines:dataset?.deduplicated||0,
     items:Object.fromEntries(items),baskets};
 }
 return Object.freeze({read,analyze});
});
