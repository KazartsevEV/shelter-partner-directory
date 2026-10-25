/* V1 form business operations. Normalized numeric input only; no DOM or persistence.
 * Financial engines and all accepted arithmetic remain unchanged. */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./nomad360_v1_engine.js'):root.Nomad360V1Engine);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.Nomad360V1Operations=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(engine){
'use strict';
function materialCosts(rows){
 let total = 0;
 const lineTotals=rows.map(({price,qty})=>{
  const lineTotal = price * qty;
  total += lineTotal;
  return lineTotal;
 });
 return {total,lineTotals};
}
function materialsCostWithVat({materials,vatIncluded,vatRate}){
 if (vatIncluded !== 'no') return materials;
 return materials * (1 + Math.max(0, vatRate) / 100);
}
function materialsLandedCost(input){
            const qty = Math.max(1, Math.floor(Number(input.batchQty) || 1));
            const materialsBase = input.materialsBase;
            const materialsWithVat = input.materialsWithVat;
            const vatAdded = Math.max(0, materialsWithVat - materialsBase);

            const inboundDelivery =
                input.choices.inboundIncluded === 'no'
                    ? input.inboundDelivery
                    : 0;

            const imported = input.choices.materialsImported === 'yes';
            const brokerPerUnit =
                imported && input.importPayers.broker === 'me'
                    ? input.broker / qty
                    : 0;

            const insurancePct =
                imported && input.importPayers.cargoInsurance === 'me'
                    ? input.insurancePct
                    : 0;
            const insurancePerUnit = materialsWithVat * insurancePct / 100;

            const dutiesPerUnit =
                imported && input.importPayers.duties === 'me'
                    ? input.duties
                    : 0;

            const certificationPerUnit =
                imported && input.importPayers.certification === 'me'
                    ? input.certification / qty
                    : 0;

            const unitCost =
                materialsBase +
                vatAdded +
                inboundDelivery +
                brokerPerUnit +
                insurancePerUnit +
                dutiesPerUnit +
                certificationPerUnit;


 return {materialsBase,vatAdded,inboundDelivery,brokerPerUnit,insurancePerUnit,dutiesPerUnit,certificationPerUnit,unitCost};
}
function productAdFunnel({budget,cpc,ctrPct,clickLeadPct,leadSalePct,management}){
            const clicks = cpc > 0 ? budget / cpc : 0;
            const impressions = ctrPct > 0 ? clicks / (ctrPct / 100) : 0;
            const leads = clicks * clickLeadPct / 100;
            const orders = leads * leadSalePct / 100;
            const units = orders;

            const mediaPerUnit = units > 0 ? budget / units : 0;
            const managementPerUnit = units > 0 ? management / units : 0;
            const fullPerUnit = mediaPerUnit + managementPerUnit;
            const baseCac = mediaPerUnit;


 return {clicks,impressions,leads,orders,units,mediaPerUnit,managementPerUnit,fullPerUnit,baseCac};
}
function prepareSimpleService({values,mode,payers}){
 const issues=engine.validateSimpleService(values);
 // Preserve the invalid-input short circuit: do not resolve expense payers
 // until the existing financial validator accepts the input.
 const unassignedPayers=issues.length||mode!=='agent'?[]:
  engine.unassignedSimpleAgentExpenses(values,mode,payers);
 return {issues,unassignedPayers,status:issues.length?'invalid':unassignedPayers.length?'pending':'ready'};
}
return Object.freeze({materialCosts,materialsCostWithVat,materialsLandedCost,productAdFunnel,prepareSimpleService});
});
