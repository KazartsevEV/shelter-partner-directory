/* V1 financial engine. Explicit input state; no DOM, browser storage, network or language state.
 * Extracted from accepted main c0a1e834e7ee0b36a008cca50ebccb2fa87c60da. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Nomad360V1Engine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// V1-FUNCTION-BEGIN:serviceAgencyExpenseSplit
function serviceAgencyExpenseSplit(item,receipts=0){
            const agency=item.serviceAgency||{},lines=Array.isArray(agency.lineItems)?agency.lineItems:[];
            const qty=Math.max(0,Number(item.forecastUnitsPerMonth)||0);
            const blank=()=>({direct:0,production:0,electricity:0,advertising:0,
                management:0,selling:0,commission:0,commissionPct:0,capex:0,amort:0});
            const agent=blank(),partner=blank();
            for(const line of lines){
                const payer=line.payer==='agent'?agent:line.payer==='partner'?partner:null;
                if(!payer)continue;
                if(line.bucket==='equipment'){
                    payer.capex+=Math.max(0,Number(line.capex)||0);
                    payer.amort+=Math.max(0,Number(line.amort)||0);
                }else if(line.bucket==='commission'){
                    const rate=Math.max(0,Number(line.ratePct)||0);
                    payer.commissionPct+=rate;
                    payer.commission+=receipts*rate/100;
                }else if(line.bucket in payer){
                    payer[line.bucket]+=Math.max(0,Number(line.monthly)||0);
                }
            }
            return {agent,partner,qty,
                valid:lines.every(x=>x.payer==='agent'||x.payer==='partner')};
        }
// V1-FUNCTION-END:serviceAgencyExpenseSplit

// V1-FUNCTION-BEGIN:aggregateQuantityDetails
function aggregateQuantityDetails(item) {
            if (!item) return [];
            const materials = Math.max(0, Number(item.materialsBatchQty) || 0);
            const made = Math.max(0, Number(item.productionQty) || 0);
            const stored = Math.max(0, Number(item.logisticsQty) || 0);
            const sales = Math.max(0, Number(item.salesQty) || 0);
            const defect = Math.min(99.99, Math.max(0, Number(item.productionDefectPct) || 0));
            const rawNeeded = Math.ceil(made / Math.max(0.0001, 1 - defect / 100));
            const forecasts = Math.max(0, Number(item.forecastUnitsPerMonth) || 0);
            const details = [];
            if(item.source==='offline-service'){
                const capacity=Number(item.offlineServiceCapacity)||0;
                if(!(forecasts>0))details.push({kind:'ads',message:'Для расчёта цены услуги заполните рекламную воронку и бюджет — нужен прогноз клиентов.'});
                if(item.serviceChannel!=='online'){
                    if(!(capacity>0))details.push({kind:'service-capacity',message:'Укажите физическую вместимость салона: сколько услуг могут оказать мастера за месяц.'});
                    else if(forecasts>capacity+0.000001)details.push({kind:'service-capacity',message:'Прогноз '+forecasts.toFixed(1)+' клиентов превышает доступные '+capacity+' процедур за месяц. Увеличьте количество рабочих мест / мастеров или скорректируйте рекламу.'});
                }
                if(item.serviceFinanceMode==='full'&&item.serviceRole==='agent'){
                    const a=item.serviceAgency||{};
                    const gross=Number(a.grossPrice),pct=Number(a.feePct),fixed=Number(a.fixedFee);
                    if(!(gross>0)||!(pct>=0&&pct<=100)||!(fixed>=0)||
                        !(gross*pct/100+fixed>0))
                        details.push({kind:'agency',message:'Введите цену принципала и положительное вознаграждение агента.'});
                    if(Array.isArray(a.lineItems)){
                        for(const line of a.lineItems)
                            if(!['agent','partner'].includes(line.payer))
                                details.push({kind:'agency',message:'Выберите плательщика: '+line.label+'.'});
                        // No unallocated amount may disappear when an input
                        // changes after the agent chose an expense payer.
                        const lines=a.lineItems,quantity=Math.max(0,forecasts);
                        const sum=(bucket,key='monthly')=>lines.filter(x=>x.bucket===bucket)
                            .reduce((n,x)=>n+Math.max(0,Number(x[key])||0),0);
                        const original={direct:quantity*Math.max(0,Number(item.materialsUnitCost)||0),
                            production:Math.max(0,Number(item.productionFixedMonthly)||0)-
                                Math.max(0,Number(item.serviceAmortMonthly)||0),
                            electricity:quantity*Math.max(0,Number(item.productionElectricityPerUnit)||0),
                            advertising:Math.max(0,Number(item.adBudget)||0),
                            management:Math.max(0,Number(item.adManagement)||0),
                            selling:Math.max(0,Number(item.salesFixedMonthly)||0)};
                        for(const [key,value] of Object.entries(original))
                            if(Math.abs(value-sum(key))>0.05)
                                details.push({kind:'agency',message:'Пересчитайте плательщика: '+key+'.'});
                        if(Math.abs(Math.max(0,Number(item.serviceCapex)||0)-sum('equipment','capex'))>0.05)
                            details.push({kind:'agency',message:'Пересчитайте плательщика оборудования.'});
                        if(Math.abs(Math.max(0,Number(item.serviceAmortMonthly)||0)-sum('equipment','amort'))>0.05)
                            details.push({kind:'agency',message:'Пересчитайте амортизацию оборудования.'});
                        const variablePct=lines.filter(x=>x.bucket==='commission')
                            .reduce((n,x)=>n+Math.max(0,Number(x.ratePct)||0),0);
                        if(Math.abs(variablePct-((Number(item.salesVariablePct)||0)+(Number(item.penaltiesPct)||0)))>0.01)
                            details.push({kind:'agency',message:'Пересчитайте плательщиков комиссий и удержаний.'});
                    }else{
                        const buckets={direct:forecasts*(Number(item.materialsUnitCost)||0),
                            production:Number(item.productionFixedMonthly)||0,
                            advertising:Number(item.adBudget)||0,management:Number(item.adManagement)||0,
                            selling:Number(item.salesFixedMonthly)||0,
                            commission:(Number(item.salesVariablePct)||0)+(Number(item.penaltiesPct)||0),
                            equipment:Number(item.serviceCapex)||0};
                        for(const [key,value]of Object.entries(buckets))
                            if(value>0&&!['agent','partner'].includes(a.payers?.[key]))
                                details.push({kind:'agency',message:'Выберите плательщика: '+key+'.'});
                    }
                }
                return details;
            }
            if(item.source==='dropship'){
                if(!(Number(item.inputs?.['resale-buy-total'])>0))details.push({kind:'materials',message:'Укажите закупочную цену у поставщика.'});
                if(item.inputs?.['dropship-delivery-days']===''||item.inputs?.['dropship-delivery-days']==null)details.push({kind:'logistics',message:'Укажите срок доставки покупателю.'});
                if(!(forecasts>0))details.push({kind:'ads',message:'Заполните рекламную воронку и бюджет для прогноза заказов.'});
                return details;
            }
            if(item.source==='resale'){
                if(!(Number(item.inputs?.['resale-buy-total'])>0))details.push({kind:'materials',message:'Себестоимость минимальной закупочной партии не заполнена. Вернитесь в закупку и введите сумму больше нуля.'});
                if(materials < stored)details.push({kind:'materials',message:'Закуплено '+materials+' шт., но для склада указано '+stored+' шт. Увеличьте закупку или уменьшите склад.'});
            }else{
            if (materials < rawNeeded) details.push({kind:'materials',
                message:'Нужно не менее ' + rawNeeded + ' ед. материала для ' + made +
                    ' годных изделий при браке ' + defect + '%. Цена единицы материала не меняется.'});
            if (made < stored) details.push({kind:'logistics',
                message:'Готового товара меньше, чем планируется положить на склад: ' + stored + ' шт. при выпуске ' + made + '. Уменьшите склад или увеличьте выпуск.'});
            }
            if (stored < sales) details.push({kind:'sales',
                message:'План продаж партии (' + sales + ' шт.) превышает складские остатки (' +
                    stored + ' шт.). Уменьшите план либо увеличьте запас.'});
            if (forecasts > 0 && stored < Math.ceil(forecasts)) details.push({kind:'ads',
                message:'Прогноз продаж за месяц (' + forecasts.toLocaleString('ru-RU') +
                    ' шт.) превышает запас партии (' + stored +
                    ' шт.). Скорректируйте рекламу или количество товара.'});
            return details;
        }
// V1-FUNCTION-END:aggregateQuantityDetails

// V1-FUNCTION-BEGIN:aggregateQuantityIssues
function aggregateQuantityIssues(item) {
            return aggregateQuantityDetails(item).map(issue => issue.message);
        }
// V1-FUNCTION-END:aggregateQuantityIssues

// V1-FUNCTION-BEGIN:allocatedMaterialCostPerGood
function allocatedMaterialCostPerGood(item) {
            if(['resale','dropship','offline-service'].includes(item?.source))return Math.max(0,Number(item.materialsUnitCost)||0);
            const manufactured = Math.max(0, Number(item?.productionQty) || 0);
            const rawBought = Math.max(0, Number(item?.materialsBatchQty) || 0);
            if (!manufactured || !rawBought) return null;
            const defect = Math.min(99.99, Math.max(0, Number(item.productionDefectPct) || 0));
            const rawUsed = Math.min(rawBought, Math.ceil(manufactured / Math.max(.0001, 1 - defect / 100)));
            // The input material price never receives a "scrap surcharge".
            // Allocate the actual consumed material quantity over sellable goods.
            // Extra unconsumed material is inventory, not COGS.
            return Math.max(0, Number(item.materialsBatchTotal) || 0) * rawUsed / rawBought / manufactured;
        }
// V1-FUNCTION-END:allocatedMaterialCostPerGood

// V1-FUNCTION-BEGIN:projectedStoragePerUnit
function projectedStoragePerUnit(item) {
            if(['dropship','offline-service'].includes(item?.source))return 0;
            const stock = Math.max(0, Number(item?.logisticsQty) || 0);
            const velocity = Math.max(0, Number(item?.forecastUnitsPerMonth) || 0);
            const dailyRate = Math.max(0, Number(item?.warehouseDayCost) || 0);
            if (!stock || !velocity) return null;
            // Constant sales rate: stock declines linearly to zero. Integral of inventory.
            const sellDays = stock / velocity * 30;
            return dailyRate * sellDays / 2;
        }
// V1-FUNCTION-END:projectedStoragePerUnit

// V1-FUNCTION-BEGIN:dropshipCycleMetrics
function dropshipCycleMetrics(item){
            // One 30-day ad cycle: only orders not yet paid out need supplier financing.
            const orders=Math.max(0,Number(item?.forecastUnitsPerMonth)||0);
            const deliveryDays=Math.max(0,Number(item?.dropshipDeliveryDays)||0);
            const payoutLagDays=Math.max(0,Number(item?.dropshipPayoutLagDays)||0);
            const payoutBefore=item?.dropshipPayoutMode==='before';
            const untilReceipt=payoutBefore?0:deliveryDays+payoutLagDays;
            const unitPurchase=Math.max(0,Number(item?.materialsUnitCost)||0);
            const unitDelivery=Math.max(0,Number(item?.logisticsUnitCost)||0);
            const fulfilmentUnit=unitPurchase+unitDelivery;
            const ad=Math.max(0,Number(item?.adBudget)||0);
            const management=Math.max(0,Number(item?.adManagement)||0);
            const salesFixed=Math.max(0,Number(item?.salesFixedMonthly)||0);
            const advanceMarketing=ad+management+salesFixed;
            const inFlightOrders=payoutBefore?0:Math.min(orders,Math.max(orders/30,orders*untilReceipt/30));
            const supplierFloat=inFlightOrders*fulfilmentUnit;
            const capitalBase=advanceMarketing+supplierFloat;
            const reservePct=Math.min(1000,Math.max(0,Number(item?.planning?.reservePct)||0));
            const reserveAmount=capitalBase*reservePct/100;
            const fullOperatingCosts=orders*fulfilmentUnit+advanceMarketing;
            const salesRate=(Math.max(0,Number(item?.salesVariablePct)||0)+Math.max(0,Number(item?.penaltiesPct)||0))/100;
            const zeroMarginRevenue=1-salesRate>0?fullOperatingCosts/(1-salesRate):null;
            return {
                requiredCapital:orders>0?capitalBase+reserveAmount:null,
                baseRequiredCapital:orders>0?capitalBase:null,
                reservePct,reserveAmount:orders>0?reserveAmount:null,
                quantityIssues:aggregateQuantityIssues(item),
                totalCycleDays:orders>0?30+deliveryDays+(payoutBefore?0:payoutLagDays):null,
                waitAfterAdvanceDays:0,productionDays:0,sellThroughDays:orders>0?30:null,
                salesSpeedPerMonth:orders,advanceAmount:0,
                zeroMarginRevenue,zeroMarginUnitPrice:orders>0&&zeroMarginRevenue!==null?zeroMarginRevenue/orders:null,
                nonRevenueCosts:orders>0?fullOperatingCosts:null,
                variableSalesRate:salesRate,stockQty:orders,
                productionTotal:0,warehouseTotal:0,salesTotal:salesFixed,adTotal:ad+management,
                customerDeliveryTotal:unitDelivery*orders,
                supplierFloat,inFlightOrders,supplierFulfilmentTotal:unitPurchase*orders,
                customerDeliveryDays:deliveryDays,payoutLagDays
            };
        }
// V1-FUNCTION-END:dropshipCycleMetrics

// V1-FUNCTION-BEGIN:offlineServiceCycleMetrics
function offlineServiceCycleMetrics(item) {
            const count=Math.max(0,Number(item.forecastUnitsPerMonth)||0);
            const agent=item.serviceFinanceMode==='full'&&item.serviceRole==='agent';
            const owns=k=>!agent||item.serviceAgency?.payers?.[k]==='agent';
            const lineSplit=agent&&Array.isArray(item.serviceAgency?.lineItems)?
                serviceAgencyExpenseSplit(item):null;
            const owner=lineSplit?.agent;
            const countSafe=Math.max(.00000001,count);
            const materialsPerService=owner?owner.direct/countSafe:
                owns('direct')?Math.max(0,Number(item.materialsUnitCost)||0):0;
            const fullDepreciation=Math.max(0,Number(item.serviceAmortMonthly)||0);
            const operatingFixed=Math.max(0,(Number(item.productionFixedMonthly)||0)-fullDepreciation);
            const fixedPremisesAndWorkers=owner?owner.production+owner.amort:
                (owns('production')?operatingFixed:0)+(owns('equipment')?fullDepreciation:0);
            const electricityPerService=owner?owner.electricity/countSafe:
                owns('production')?Math.max(0,Number(item.productionElectricityPerUnit)||0):0;
            const salesFixed=owner?owner.selling:
                owns('selling')?Math.max(0,Number(item.salesFixedMonthly)||0):0;
            const ad=owner?owner.advertising+owner.management:
                (owns('advertising')?Math.max(0,Number(item.adBudget)||0):0)+
                (owns('management')?Math.max(0,Number(item.adManagement)||0):0);
            const serviceCost=count*(materialsPerService+electricityPerService)+fixedPremisesAndWorkers;
            const nonRevenueCosts=serviceCost+salesFixed+ad;
            // Original simplified microbusiness economics must remain intact.
            // Day-zero CAPEX and noncash amortization apply only to full V1.
            const fullV1=item.serviceFinanceMode==='full';
            const depreciation=fullV1?(owner?owner.amort:
                owns('equipment')?Math.max(0,Number(item.serviceAmortMonthly)||0):0):0;
            const capex=fullV1?(owner?owner.capex:
                owns('equipment')?Math.max(0,Number(item.serviceCapex)||0):0):0;
            const committedCashCosts=Math.max(0,nonRevenueCosts-depreciation)+capex;
            const reservePct=Math.min(1000,Math.max(0,Number(item.planning?.reservePct)||0));
            const reserveAmount=Math.max(0,nonRevenueCosts-depreciation)*reservePct/100;
            const salesRate=owner?owner.commissionPct/100:
                owns('commission')?
                (Math.max(0,Number(item.salesVariablePct)||0)+Math.max(0,Number(item.penaltiesPct)||0))/100:0;
            const zeroMarginRevenue=salesRate<1?nonRevenueCosts/(1-salesRate):null;
            return {
                requiredCapital:count>0?committedCashCosts+reserveAmount:null,
                baseRequiredCapital:count>0?committedCashCosts:null,
                reservePct,reserveAmount:count>0?reserveAmount:null,
                quantityIssues:aggregateQuantityIssues(item),
                totalCycleDays:count>0?30:null,
                waitAfterAdvanceDays:0,productionDays:0,sellThroughDays:count>0?30:null,
                salesSpeedPerMonth:count,advanceAmount:0,
                zeroMarginRevenue,zeroMarginUnitPrice:count>0&&zeroMarginRevenue!==null?zeroMarginRevenue/count:null,
                nonRevenueCosts:count>0?nonRevenueCosts:null,
                variableSalesRate:salesRate,stockQty:count,
                productionTotal:fixedPremisesAndWorkers+count*electricityPerService,warehouseTotal:0,salesTotal:salesFixed,adTotal:ad,
                customerDeliveryTotal:0,consumablesTotal:materialsPerService*count,
                premisesWorkersMonthly:fixedPremisesAndWorkers
            };
        }
// V1-FUNCTION-END:offlineServiceCycleMetrics

// V1-FUNCTION-BEGIN:aggregatePlanMetrics
function aggregatePlanMetrics(item) {
            if(Object.values(item?.payments||{}).some(p=>p.active!==false&&(p.status==='invalid'||p.status==='conversion-required'))){
                return {paymentPending:true,quantityIssues:[],requiredCapital:null,baseRequiredCapital:null,
                    reservePct:Math.max(0,Number(item?.planning?.reservePct)||0),reserveAmount:null,
                    totalCycleDays:null,waitAfterAdvanceDays:null,productionDays:null,sellThroughDays:null,
                    salesSpeedPerMonth:null,advanceAmount:null,zeroMarginRevenue:null,zeroMarginUnitPrice:null,
                    nonRevenueCosts:null,variableSalesRate:null,stockQty:null,productionTotal:null,
                    warehouseTotal:null,salesTotal:null,adTotal:null,customerDeliveryTotal:null};
            }
            if(item?.source==='offline-service')return offlineServiceCycleMetrics(item);
            if(item?.source==='dropship')return dropshipCycleMetrics(item);
            const planning = item?.planning || {};
            const materialsTotal = Math.max(0, Number(item?.materialsBatchTotal || 0));
            const stockQty = Math.max(0, Number(item?.logisticsQty || 0));
            const productionQty = Math.max(0, Number(item?.productionQty || 0));
            const salesSpeedPerMonth = Math.max(0, Number(item?.forecastUnitsPerMonth || 0));

            const advancePct = Math.min(100, Math.max(0, Number(planning.advancePct) || 0));
            const advanceAmount = materialsTotal * advancePct / 100;

            const supplyDays = Math.max(0, Number(planning.supplyDays) || 0);
            const hasExplicitAdvanceLead =
                planning.advanceLeadDays !== '' &&
                planning.advanceLeadDays !== null &&
                planning.advanceLeadDays !== undefined;
            const waitAfterAdvanceDays =
                advancePct <= 0
                    ? 0
                    : (hasExplicitAdvanceLead
                        ? Math.max(0, Number(planning.advanceLeadDays) || 0)
                        : supplyDays);

            const productionDays = item?.source==='resale'?0:Math.max(0, Number(planning.productionDays) || 0);

            const sellThroughDays =
                salesSpeedPerMonth > 0 && stockQty > 0
                    ? stockQty / salesSpeedPerMonth * 30
                    : null;
            const totalCycleDays =
                sellThroughDays === null
                    ? null
                    : waitAfterAdvanceDays + productionDays + sellThroughDays;

            const productionTotal = item?.source==='resale'?0:Math.max(0, Number(item?.productionTotal || 0));

            const warehouseInboundTotal =
                Math.max(0, Number(item?.warehouseInboundUnitCost || 0)) * stockQty;
            const warehouseDayCost = Math.max(0, Number(item?.warehouseDayCost || 0));

            const costBeforeCustomerDelivery =
                Math.max(0, Number(item?.materialsUnitCost || 0)) +
                Math.max(0, Number(item?.productionUnitCost || 0));
            const customerDeliveryPct = Math.max(0, Number(item?.customerDeliveryPct || 0));
            const customerReturnPct = Math.max(0, Number(item?.customerReturnPct || 0));
            const customerDeliveryPerUnit =
                costBeforeCustomerDelivery *
                customerDeliveryPct / 100 *
                (1 + customerReturnPct / 100);
            const customerDeliveryTotal = customerDeliveryPerUnit * stockQty;

            const salesFixedMonthly = Math.max(0, Number(item?.salesFixedMonthly || 0));
            const adBudgetMonthly = Math.max(0, Number(item?.adBudget || 0));
            const adManagementMonthly = Math.max(0, Number(item?.adManagement || 0));
            const variableSalesPct = Math.min(
                99.99,
                Math.max(
                    0,
                    Number(item?.salesVariablePct || 0) +
                    Number(item?.penaltiesPct || 0)
                )
            );
            const variableSalesRate = variableSalesPct / 100;

            if (sellThroughDays === null) {
                return {
                    requiredCapital: null,
                    reservePct: Math.max(0, Number(planning.reservePct) || 0),
                    reserveAmount: null,
                    quantityIssues: aggregateQuantityIssues(item),
                    totalCycleDays: null,
                    waitAfterAdvanceDays,
                    productionDays,
                    sellThroughDays: null,
                    salesSpeedPerMonth,
                    advanceAmount,
                    zeroMarginRevenue: null,
                    zeroMarginUnitPrice: null,
                    nonRevenueCosts: null,
                    variableSalesRate,
                    stockQty,
                    productionTotal,
                    warehouseTotal: null,
                    salesTotal: null,
                    adTotal: null,
                    customerDeliveryTotal
                };
            }

            const sellThroughMonths = sellThroughDays / 30;

            // Inventory declines linearly while the planned quantity is sold.
            const warehouseStorageTotal =
                warehouseDayCost * stockQty * sellThroughDays / 2;
            const warehouseTotal =
                warehouseInboundTotal + warehouseStorageTotal;

            // These costs cannot be switched off until the planned stock is sold.
            const salesTotal = salesFixedMonthly * sellThroughMonths;
            const adMediaTotal = adBudgetMonthly * sellThroughMonths;
            const adManagementTotal = adManagementMonthly * sellThroughMonths;
            const adTotal = adMediaTotal + adManagementTotal;

            // Capital that must be financed by the owner before taxes.
            // Revenue does not reduce this planning amount: it is the money committed
            // to executing the whole business cycle at the stated assumptions.
            const nonRevenueCosts =
                materialsTotal +
                productionTotal +
                warehouseTotal +
                customerDeliveryTotal +
                salesTotal +
                adTotal;
            const reservePct = Math.min(1000, Math.max(0, Number(planning.reservePct) || 0));
            const reserveAmount = nonRevenueCosts * reservePct / 100;
            // A liquidity buffer: additional capital committed, NOT operating expense and
            // NOT a deduction from taxable profit. If unused, it stays as cash.
            const requiredCapital = nonRevenueCosts + reserveAmount;

            // At zero enterprise margin, revenue must cover all fixed/absolute costs
            // plus percentage-of-turnover sales costs.
            const retainedRevenueRate = 1 - variableSalesRate;
            const zeroMarginRevenue =
                retainedRevenueRate > 0
                    ? nonRevenueCosts / retainedRevenueRate
                    : null;
            const zeroMarginUnitPrice =
                zeroMarginRevenue !== null && stockQty > 0
                    ? zeroMarginRevenue / stockQty
                    : null;

            return {
                requiredCapital,
                baseRequiredCapital: nonRevenueCosts,
                reservePct,
                reserveAmount,
                quantityIssues: aggregateQuantityIssues(item),
                totalCycleDays,
                waitAfterAdvanceDays,
                productionDays,
                sellThroughDays,
                salesSpeedPerMonth,
                advanceAmount,
                zeroMarginRevenue,
                zeroMarginUnitPrice,
                nonRevenueCosts,
                variableSalesRate,
                stockQty,
                productionTotal,
                warehouseTotal,
                salesTotal,
                adTotal,
                customerDeliveryTotal
            };
        }
// V1-FUNCTION-END:aggregatePlanMetrics

// V1-FUNCTION-BEGIN:priceListRequiredCustomerPrice
function priceListRequiredCustomerPrice(unitLoad, netMargin, variableRate, turnoverTaxRate, profitTaxRate, vatRate, discountRate) {
            const profitRetention = 1 - profitTaxRate;
            if (profitRetention <= 0 || discountRate < 0 || discountRate >= 1) return null;

            const retainedRevenueRate =
                1 - variableRate - turnoverTaxRate - netMargin / profitRetention;
            if (retainedRevenueRate <= 0) return null;

            const price = unitLoad / retainedRevenueRate *
                (1 + vatRate) / (1 - discountRate);
            return Number.isFinite(price) && price >= 0 ? price : null;
        }
// V1-FUNCTION-END:priceListRequiredCustomerPrice

// V1-FUNCTION-BEGIN:calculateAggregateCredit
function calculateAggregateCredit(item) {
            const cycle = aggregatePlanMetrics(item);
            const principal =
                cycle.requiredCapital === null
                    ? null
                    : Math.max(0, Number(cycle.requiredCapital) || 0);

            const rawRate = item?.planning?.creditRatePct;
            const hasRate =
                rawRate !== '' &&
                rawRate !== null &&
                rawRate !== undefined &&
                Number.isFinite(Number(rawRate));
            const annualRatePct =
                hasRate ? Math.max(0, Number(rawRate)) : null;

            const rawMonths =
                item?.planning?.creditTermMonths !== undefined
                    ? item.planning.creditTermMonths
                    : (
                        item?.planning?.creditTermDays !== '' &&
                        item?.planning?.creditTermDays !== null &&
                        item?.planning?.creditTermDays !== undefined &&
                        Number.isFinite(Number(item.planning.creditTermDays))
                            ? Math.max(1, Math.ceil(Number(item.planning.creditTermDays) / 30))
                            : ''
                    );
            const hasTerm =
                rawMonths !== '' &&
                rawMonths !== null &&
                rawMonths !== undefined &&
                Number.isFinite(Number(rawMonths));
            const termMonths =
                hasTerm ? Math.max(1, Math.ceil(Number(rawMonths))) : null;

            const monthlyServiceCost =
                principal !== null &&
                annualRatePct !== null
                    ? principal * annualRatePct / 100 / 12
                    : null;

            const totalInterest =
                monthlyServiceCost !== null &&
                termMonths !== null
                    ? monthlyServiceCost * termMonths
                    : null;

            const totalRepayment =
                principal !== null &&
                totalInterest !== null
                    ? principal + totalInterest
                    : null;

            const forecastSalesPerMonth =
                Math.max(0, Number(item?.forecastUnitsPerMonth || 0));
            const stockQty = Math.max(0, Number(item?.logisticsQty) || 0);
            const serviceUnits=item?.source==='offline-service'&&item?.serviceFinanceMode==='full'?
                forecastSalesPerMonth*Math.max(1,Number(item.serviceHorizonMonths)||1,
                    Number(termMonths)||1):stockQty;
            const servicePerUnit = totalInterest !== null && serviceUnits > 0
                ? totalInterest / serviceUnits
                : null;

            const marginPct =
                item?.planning?.targetMarginPct !== '' &&
                item?.planning?.targetMarginPct !== null &&
                item?.planning?.targetMarginPct !== undefined &&
                Number.isFinite(Number(item.planning.targetMarginPct))
                    ? Math.max(0, Number(item.planning.targetMarginPct))
                    : null;

            return {
                principal,
                annualRatePct,
                termMonths,
                monthlyServiceCost,
                totalInterest,
                totalRepayment,
                servicePerUnit,
                marginPct
            };
        }
// V1-FUNCTION-END:calculateAggregateCredit

// V1-FUNCTION-BEGIN:v1FullServiceSku
function v1FullServiceSku(item,row,model,draftSku,cycle,credit,ownerTaxType,ownerTaxPct) {
                    // Import the SAME approved V1 service quote; do not rebuild it
                    // with the retired Nomad360FullServiceV2 adapter.
                    const sku={...draftSku},agency=item.serviceAgency||{};
                    const agent=item.serviceRole==='agent';
                    const owns=k=>!agent||agency.payers?.[k]==='agent';
                    const lineSplit=agent&&Array.isArray(agency.lineItems)?
                        serviceAgencyExpenseSplit(item).agent:null;
                    const qty=Math.max(.0000001,Number(item.forecastUnitsPerMonth)||0);
                    const amort=lineSplit?lineSplit.amort:
                        owns('equipment')?Math.max(0,Number(item.serviceAmortMonthly)||0):0;
                    const capex=lineSplit?lineSplit.capex:
                        owns('equipment')?Math.max(0,Number(item.serviceCapex)||0):0;
                    const online=item.serviceChannel==='online';
                    const quote=row.price*model.taxPriceMultiplier*(1+sku.vatPct/100);
                    sku.source=online?'online-service':'offline-service';
                    sku.unitCost=Math.max(0,row.unitCost);
                    sku.fullServiceV2=true;
                    sku.nativeProductV1=true;
                    sku.nativeV1Funding=item.planning?.fundingMode||'cash';
                    sku.nativeV1StartCapital=Number(cycle.requiredCapital)||0;
                    sku.fullServiceChannel=online?'online':'offline';
                    sku.fullServiceRole=item.serviceRole||'self';
                    sku.fullServiceAgency=agent?JSON.parse(JSON.stringify(agency)):null;
                    sku.fullServiceOperatingMonths=Number(item.serviceHorizonMonths)||1;
                    sku.fullServiceHorizon=Math.max(sku.fullServiceOperatingMonths,
                        item.planning?.fundingMode==='credit'?Number(credit.termMonths)||1:1);
                    // The explicit zero tail cannot be mistaken for extra sales.
                    sku.fullServiceForecast=Array.from({length:sku.fullServiceHorizon},
                        (_,month)=>month<sku.fullServiceOperatingMonths?
                            Number(row.forecastSales)||0:0);
                    // A loan extending beyond the selected service horizon
                    // extends the real V1 cash calendar through its maturity.
                    sku.fullServiceReservePct=Number(item.planning?.reservePct)||0;
                    sku.fullServiceReserveFunded=item.planning?.fundingMode==='credit'?
                        Math.max(0,Number(cycle.reserveAmount)||0):0;
                    sku.fullServiceMonthlyAmort=amort;
                    sku.fullServiceCapex=online?0:capex;
                    sku.onlineCapex=online?capex:0;
                    sku.onlineAmortMonthly=online?amort:0;
                    sku.ownerTax={type:ownerTaxType,
                        pct:ownerTaxPct,entity:'business'};
                    sku.fixedPriceFromV1=true;
                    // Transfer the exact V1 unit quote; round only UI labels.
                    // Early two-decimal rounding changes 20+ transaction PnL.
                    sku.priceMin=quote;
                    sku.priceMax=quote;
                    sku.maxDiscountPct=0;
                    sku.minimumMarginPct=0;
                    sku.targetMarginPct=0;
                    sku.salesFixedMonthly=lineSplit?lineSplit.selling:
                        owns('selling')?Number(item.salesFixedMonthly)||0:0;
                    sku.adBudget=lineSplit?lineSplit.advertising:
                        owns('advertising')?Number(item.adBudget)||0:0;
                    sku.adManagement=lineSplit?lineSplit.management:
                        owns('management')?Number(item.adManagement)||0:0;
                    sku.baseCac=sku.adBudget>0?sku.adBudget/row.forecastSales:0;
                    sku.variableSalesPct=lineSplit?lineSplit.commissionPct:
                        owns('commission')?
                        (Number(item.salesVariablePct)||0)+(Number(item.penaltiesPct)||0):0;
                    sku.creditPrincipal=item.planning?.fundingMode==='credit'?
                        Number(credit.principal)||0:0;
                    sku.creditServiceMonthly=item.planning?.fundingMode==='credit'?
                        Number(credit.monthlyServiceCost)||0:0;
                    sku.creditMonths=item.planning?.fundingMode==='credit'?
                        Number(credit.termMonths)||0:0;
                    sku.serviceMaterialsUnit=lineSplit?lineSplit.direct/qty:
                        owns('direct')?Number(item.materialsUnitCost)||0:0;
                    sku.serviceElectricityUnit=lineSplit?lineSplit.electricity/qty:
                        owns('production')?Number(item.productionElectricityPerUnit)||0:0;
                    sku.serviceFixedMonthly=lineSplit?lineSplit.production:
                        owns('production')?
                        Math.max(0,(Number(item.productionFixedMonthly)||0)-
                            (Number(item.serviceAmortMonthly)||0)):0;
                    sku.serviceCapacity=online?0:Number(item.offlineServiceCapacity)||0;
                    sku.inventoryQty=0;
                    sku.materialsBatchTotal=0;
                    sku.productionTotal=0;
                    sku.warehouseInboundUnitCost=0;
                    sku.warehouseDayCost=0;
                    if(online)sku.onlineProvenance={
                        periodMonths:sku.fullServiceHorizon,
                        fullServiceCalculated:true,
                        ownerRevenueInPeriod:row.forecastSales*row.price*sku.fullServiceHorizon,
                        sourceRole:item.serviceRole||'self'
                    };
                    return sku;
        }
// V1-FUNCTION-END:v1FullServiceSku

function validateSimpleService(v) {
const serviceInputIssues=[];
            const invalid=(key,message)=>serviceInputIssues.push({key,message});
            const nonNegative=['monthlyBudget','cpc','costConsult','costPack','mgmt','site',
              'hosting','dom','magnet','markup'];
            const percentages=['ctr','cvrLead','cvrDeal','ltv','acq','taxTurnover',
              'agentPct','agentTaxTurnover'];
            for(const key of nonNegative)
              if(!Number.isFinite(v[key])||v[key]<0)invalid(key,'Значение не может быть отрицательным.');
            for(const key of percentages)
              if(!Number.isFinite(v[key])||v[key]<0||v[key]>100)
                invalid(key,'Процент должен быть от 0 до 100.');
            if(!Number.isInteger(v.months)||v.months<1||v.months>120)
              invalid('months','Период должен быть целым числом от 1 до 120 месяцев.');
            if(v.monthlyBudget>0&&!(v.cpc>0))
              invalid('cpc','При положительном рекламном бюджете CPC должен быть больше нуля.');
            if(v.monthlyBudget>0&&!(v.ctr>0))
              invalid('ctr','Без положительного CTR нельзя получить клики из показов.');

return serviceInputIssues;
}
function unassignedSimpleAgentExpenses(v,mode,payers) {
if(mode!=='agent')return [];
return ['monthlyBudget','mgmt','site','hosting','dom','magnet'].filter(key=>{
const amount=Number(v[key])||0;return amount>0&&payers[key]!=='me'&&payers[key]!=='partner';
});
}
function calculateSimpleService(input) {
const v=input.values,serviceMode=input.mode,agentPayers=input.payers||{};
const issues=validateSimpleService(v),unassignedPayers=unassignedSimpleAgentExpenses(v,serviceMode,agentPayers);
if(issues.length||unassignedPayers.length)return {ready:false,issues,unassignedPayers};
const months=v.months,isHired=serviceMode==='hired',isAgent=serviceMode==='agent';
const markup=Math.max(0,v.markup||0),agentPct=Math.max(0,v.agentPct||0);
const totalBudget = v.monthlyBudget * months;
            const ctrDec = v.ctr / 100;
            const clicks = v.cpc > 0 ? totalBudget / v.cpc : 0;
            const impressions = ctrDec > 0 ? Math.floor(clicks / ctrDec) : 0;
            const leads = clicks * (v.cvrLead / 100);
            const deals = Math.max(0, leads * (v.cvrDeal / 100));
            const packs = deals * (v.ltv / 100);

            const grossRevConsult = deals * v.costConsult;
            const grossRevPack = packs * v.costPack;
            const grossSales = grossRevConsult + grossRevPack;

            // In agent mode grossSales remains the partner's revenue.
            // The agent's percentage is a separate payout and therefore an extra partner expense.
            const revConsult = grossRevConsult;
            const revPack = grossRevPack;
            const revenue = grossSales;
            const agentIncome = isAgent ? grossSales * (agentPct / 100) : 0;
            const agentIncomePerDeal = deals > 0 ? agentIncome / deals : 0;

            const avgCheck = deals > 0 ? revenue / deals : 0;
            const acqAmount = revenue * (v.acq / 100);
            const netRevenue = revenue - acqAmount;

            const executorCost = isHired ? (markup >= 0 ? revenue / (1 + markup / 100) : 0) : 0;
            const agentCost = isAgent ? agentIncome : 0;

            const partnerBudget = isAgent ? (agentPayers.monthlyBudget === 'partner' ? totalBudget : 0) : totalBudget;
            const partnerMgmt = isAgent ? (agentPayers.mgmt === 'partner' ? v.mgmt : 0) : v.mgmt;
            const partnerHosting = isAgent ? (agentPayers.hosting === 'partner' ? v.hosting : 0) : v.hosting;
            const partnerDom = isAgent ? (agentPayers.dom === 'partner' ? v.dom : 0) : v.dom;
            const siteAmort = isAgent ? (agentPayers.site === 'partner' ? v.site * Math.min(months,12) / 12 : 0) : v.site * Math.min(months,12) / 12;
            const magnetAmort = isAgent ? (agentPayers.magnet === 'partner' ? v.magnet * Math.min(months,12) / 12 : 0) : v.magnet * Math.min(months,12) / 12;

            const agentCashExpenses = isAgent
                ? (agentPayers.monthlyBudget === 'me' ? totalBudget : 0)
                    + (agentPayers.mgmt === 'me' ? v.mgmt : 0)
                    + (agentPayers.site === 'me' ? v.site : 0)
                    + (agentPayers.hosting === 'me' ? v.hosting : 0)
                    + (agentPayers.dom === 'me' ? v.dom : 0)
                    + (agentPayers.magnet === 'me' ? v.magnet : 0)
                : 0;

            const opex = partnerBudget + partnerMgmt + partnerHosting + partnerDom + acqAmount + executorCost + agentCost;
            const totalCosts = opex + siteAmort + magnetAmort;

            const ebitda = revenue - opex; // acquiring is already included in OPEX
            const tax = revenue * (v.taxTurnover / 100);
            const netProfit = ebitda - tax;

            const roas = totalBudget > 0 ? netRevenue / totalBudget : 0;
            const cpa = deals > 0 ? totalBudget / deals : 0;
            const cac = deals > 0 ? totalCosts / deals : 0;
            const romi = totalCosts > 0 ? (netRevenue - totalCosts) / totalCosts : 0;

            // Agent payout follows the same monthly ramp-up scenario as the table below.
            let agentIncomeScenario = agentIncome;
            let agentDealsScenario = deals;
            if (isAgent) {
                agentIncomeScenario = 0;
                agentDealsScenario = 0;
                for (let m = 1; m <= months; m++) {
                    const mBudgetPreview = v.monthlyBudget;
                    const mClicksPreview = v.cpc > 0 ? mBudgetPreview / v.cpc : 0;
                    const mLeadsPreview = mClicksPreview * (v.cvrLead / 100);
                    const baseDealsPreview = Math.max(0, mLeadsPreview * (v.cvrDeal / 100));
                    const mDealsPreview = (m === 1) ? baseDealsPreview * 0.5 : baseDealsPreview;
                    const mPacksBasePreview = mDealsPreview * (v.ltv / 100);
                    const mPacksPreview = (m === 1) ? mPacksBasePreview * 0.5 : mPacksBasePreview;
                    const mRevConsBasePreview = mDealsPreview * v.costConsult;
                    const mGrossRevConsPreview = (m === 1) ? mRevConsBasePreview * 0.5 : mRevConsBasePreview;
                    const mRevPackBasePreview = mPacksPreview * v.costPack;
                    const mGrossRevPackPreview = (m === 1) ? mRevPackBasePreview * 0.5 : mRevPackBasePreview;
                    const mGrossSalesPreview = mGrossRevConsPreview + mGrossRevPackPreview;
                    agentIncomeScenario += mGrossSalesPreview * (agentPct / 100);
                    agentDealsScenario += mDealsPreview;
                }
            }
            const agentIncomePerDealScenario = agentDealsScenario > 0 ? agentIncomeScenario / agentDealsScenario : 0;
            const agentTaxScenario = isAgent ? agentIncomeScenario * (Math.max(0, v.agentTaxTurnover || 0) / 100) : 0;
            const agentNetScenario = agentIncomeScenario - agentCashExpenses - agentTaxScenario;

            let monthData = [];
            let totalMonth = {};
            let cumCash = 0;
            let cumAgentNet = 0;

            for (let m = 1; m <= months; m++) {
                let mBudget = v.monthlyBudget;
                let mClicks = v.cpc > 0 ? mBudget / v.cpc : 0;
                let mLeads = mClicks * (v.cvrLead / 100);

                let baseDeals = Math.max(0, mLeads * (v.cvrDeal / 100));
                let mDeals = (m === 1) ? baseDeals * 0.5 : baseDeals;
                let mPacksBase = mDeals * (v.ltv / 100);
                let mPacks = (m === 1) ? mPacksBase * 0.5 : mPacksBase; // Logic from Python script

                let mRevConsBase = mDeals * v.costConsult;
                let mGrossRevCons = (m === 1) ? mRevConsBase * 0.5 : mRevConsBase; // Existing first-month scenario logic

                let mRevPackBase = mPacks * v.costPack;
                let mGrossRevPack = (m === 1) ? mRevPackBase * 0.5 : mRevPackBase; // Existing first-month scenario logic

                let mGrossSales = mGrossRevCons + mGrossRevPack;
                let mRevCons = mGrossRevCons;
                let mRevPack = mGrossRevPack;
                let mRevTotal = mGrossSales;
                let mAgentIncome = isAgent ? mGrossSales * (agentPct / 100) : 0;
                let mAcq = mRevTotal * (v.acq / 100);
                let mNetRev = mRevTotal - mAcq;
                let mExecutor = isHired ? mRevTotal / (1 + markup / 100) : 0;

                const mPartnerBudget = isAgent
                    ? (agentPayers.monthlyBudget === 'partner' ? mBudget : 0)
                    : mBudget;
                const mAgentBudget = isAgent && agentPayers.monthlyBudget === 'me' ? mBudget : 0;

                const firstMonthPartnerExtras = m === 1
                    ? (isAgent
                        ? (agentPayers.mgmt === 'partner' ? v.mgmt : 0)
                            + (agentPayers.site === 'partner' ? v.site : 0)
                            + (agentPayers.hosting === 'partner' ? v.hosting : 0)
                            + (agentPayers.dom === 'partner' ? v.dom : 0)
                            + (agentPayers.magnet === 'partner' ? v.magnet : 0)
                        : v.mgmt + v.site + v.hosting + v.dom + v.magnet)
                    : 0;

                // Cash buys site/magnet once; EBITDA recognizes operations, not capital.
                // Their depreciation belongs to the period P&L, never to cash payments.
                const mPartnerCapex = m === 1
                    ? (isAgent
                        ? (agentPayers.site === 'partner' ? v.site : 0)
                            + (agentPayers.magnet === 'partner' ? v.magnet : 0)
                        : v.site + v.magnet)
                    : 0;
                const mPartnerOperatingExtras = firstMonthPartnerExtras - mPartnerCapex;

                const firstMonthAgentExtras = isAgent && m === 1
                    ? (agentPayers.mgmt === 'me' ? v.mgmt : 0)
                        + (agentPayers.site === 'me' ? v.site : 0)
                        + (agentPayers.hosting === 'me' ? v.hosting : 0)
                        + (agentPayers.dom === 'me' ? v.dom : 0)
                        + (agentPayers.magnet === 'me' ? v.magnet : 0)
                    : 0;

                let mAgentExpenses = isAgent ? mAgentBudget + firstMonthAgentExtras : 0;
                let mAgentTax = isAgent ? mAgentIncome * (Math.max(0, v.agentTaxTurnover || 0) / 100) : 0;
                let mAgentNet = isAgent ? mAgentIncome - mAgentExpenses - mAgentTax : 0;
                cumAgentNet += mAgentNet;
                let mAgentCum = cumAgentNet;

                let mPartnerDirect = mPartnerBudget + mPartnerOperatingExtras + mExecutor;
                let mCosts = mPartnerDirect + mAcq + mAgentIncome;

                let mEbitda = mRevTotal - mCosts; // acquiring is already in mCosts
                let mTax = mRevTotal * (v.taxTurnover / 100);
                let mCash = mEbitda - mTax - mPartnerCapex;
                cumCash += mCash;

                let row = { mBudget, mClicks, mLeads, mDeals, mPacks, mGrossRevCons, mGrossRevPack, mGrossSales, mAgentIncome, mAgentExpenses, mAgentTax, mAgentNet, mAgentCum, mPartnerDirect, mPartnerCapex, mRevCons, mRevPack, mRevTotal, mAcq, mNetRev, mExecutor, mCosts, mEbitda, mTax, mCash, mCum: cumCash };
                monthData.push(row);

                // Accumulate totals
                for (let k in row) {
                    if (k === 'mCum' || k === 'mAgentCum') continue;
                    totalMonth[k] = (totalMonth[k] || 0) + row[k];
                }
            }
            totalMonth.mCum = cumCash;
            totalMonth.mAgentCum = cumAgentNet;
            // Agent's own net receipts must never be replaced with the principal's cash flow.
            const simpleSpendableCash=isAgent?cumAgentNet:cumCash;
            const accountingNetProfit = totalMonth.mEbitda - totalMonth.mTax - siteAmort - magnetAmort;
            const accruedTotalCosts = totalMonth.mCosts + siteAmort + magnetAmort;
            // Classic marketing ROMI: attributed revenue (first consultations
            // plus later packages) minus direct fulfillment, payment processing,
            // turnover tax, ad spend and ad management, divided by ad+management.
            // General overhead/site/CAPEX remains in the full-cost ratio above.
            const marketingSpend = totalMonth.mBudget + v.mgmt;
            const marketingContribution = totalMonth.mRevTotal - totalMonth.mExecutor -
              totalMonth.mAcq - totalMonth.mTax;
            const classicRomiPercent = marketingSpend>0
              ? 100 * (marketingContribution-marketingSpend) / marketingSpend
              : null;
            const metrics={averageCheck:totalMonth.mDeals?totalMonth.mRevTotal/totalMonth.mDeals:0,
agentIncomePerDeal:totalMonth.mDeals?totalMonth.mAgentIncome/totalMonth.mDeals:0,
roas:totalBudget?totalMonth.mNetRev/totalBudget:0,
cpa:totalMonth.mDeals?totalBudget/totalMonth.mDeals:0,
cac:totalMonth.mDeals?accruedTotalCosts/totalMonth.mDeals:0,
returnOnCosts:accruedTotalCosts?(totalMonth.mRevTotal-accruedTotalCosts)/accruedTotalCosts:0};
return {ready:true,months,isHired,isAgent,markup,agentPct,totalBudget,ctrDec,clicks,impressions,leads,deals,packs,grossRevConsult,grossRevPack,grossSales,revConsult,revPack,revenue,agentIncome,agentIncomePerDeal,avgCheck,acqAmount,netRevenue,executorCost,agentCost,partnerBudget,partnerMgmt,partnerHosting,partnerDom,siteAmort,magnetAmort,agentCashExpenses,opex,totalCosts,ebitda,tax,netProfit,roas,cpa,cac,romi,agentIncomeScenario,agentDealsScenario,agentIncomePerDealScenario,agentTaxScenario,agentNetScenario,monthData,totalMonth,cumCash,cumAgentNet,simpleSpendableCash,accountingNetProfit,accruedTotalCosts,marketingSpend,marketingContribution,classicRomiPercent,metrics};
}
function create(input={}) {
const productPortfolio=input.portfolio||[];
const productBusinessTaxType=input.businessTaxType??null;
const productOwnChoices={salesVat:input.salesVatChoice??null};
const productNumber=id=>id==='own-business-tax-pct'?input.businessTaxPct||0:
 id==='own-sales-vat-pct'?input.salesVatPct||0:0;
// V1-FUNCTION-BEGIN:calculateProductPortfolio
function calculateProductPortfolio() {
            const items = productPortfolio.slice();

            const paymentPending=items.some(item=>Object.values(item.payments||{}).some(p=>
                p.active!==false&&(p.status==='invalid'||p.status==='conversion-required')));
            if (!items.length || paymentPending) {
                return {
                    items: [],
                    pricingReady: false,
                    ...(paymentPending?{paymentPending:true}:{}),
                    totalAdBudget: 0,
                    totalForecastOrders: 0,
                    totalRevenue: null,
                    totalEbitdaBeforeShared: null,
                    sharedBusinessCosts: 0,
                    businessEbitda: null,
                    financingCostsMonthly: 0,
                    profitBeforeTax: null,
                    tax: null,
                    netProfit: null,
                    taxPriceMultiplier: null,
                    adjustedRevenue: null,
                    adjustedEbitda: null,
                    adjustedTax: null,
                    adjustedNetProfit: null
                };
            }

            const prepared = items.map(item => {
                const input = item.inputs || {};

                const budget = Math.max(0, Number(input['own-product-ad-budget']) || 0);
                const cpc = Math.max(0, Number(input['own-product-ad-cpc']) || 0);
                const ctrPct = Math.max(0, Number(input['own-product-ad-ctr']) || 0);
                const clickLeadPct = Math.max(0, Number(input['own-product-ad-click-lead']) || 0);
                const leadSalePct = Math.max(0, Number(input['own-product-ad-lead-sale']) || 0);
                const management = Math.max(0, Number(input['own-product-ad-management']) || 0);

                const clicks = cpc > 0 ? budget / cpc : 0;
                const impressions = ctrPct > 0 ? clicks / (ctrPct / 100) : 0;
                const leads = clicks * clickLeadPct / 100;
                const orders = leads * leadSalePct / 100;
                const baseCac = orders > 0 ? budget / orders : null;

                const storedCostPerUnit = Math.max(0, Number(item.warehouseStorageUnitCost) || 0);
                const projectedStorage = projectedStoragePerUnit(item);
                const consumedMaterialCost = allocatedMaterialCostPerGood(item);
                const agencyOwner=item.serviceFinanceMode==='full'&&item.serviceRole==='agent';
                const own=p=>!agencyOwner||item.serviceAgency?.payers?.[p]==='agent';
                const ownSplit=agencyOwner&&Array.isArray(item.serviceAgency?.lineItems)?
                    serviceAgencyExpenseSplit(item).agent:null;
                const perUnit=Math.max(.0000001,Number(item.forecastUnitsPerMonth)||0);
                const unitCost =ownSplit?
                    (ownSplit.direct+ownSplit.production+ownSplit.electricity+ownSplit.amort)/perUnit:
                    (own('direct')?(consumedMaterialCost === null ? Math.max(0, Number(item.materialsUnitCost) || 0) : consumedMaterialCost):0) +
                    (own('production')?Math.max(0,Number(item.productionUnitCost||0)-
                        Math.max(0,Number(item.serviceAmortMonthly)||0)/perUnit):0) +
                    (own('equipment')?Math.max(0,Number(item.serviceAmortMonthly)||0)/perUnit:0) +
                    Math.max(0, Number(item.logisticsUnitCost || 0)) -
                    storedCostPerUnit +
                    (projectedStorage === null ? storedCostPerUnit : projectedStorage);
                const cycle = aggregatePlanMetrics(item);
                const servicePricingMonths=item.source==='offline-service'&&item.serviceFinanceMode==='full'?
                    Math.max(1,Number(item.serviceHorizonMonths)||1):1;
                // Loan interest is priced over approved operating sales only;
                // debt maturity never creates extra forecast customers.
                const reserveUnits=['dropship','offline-service'].includes(item.source)?
                    Number(item.forecastUnitsPerMonth)*servicePricingMonths:Number(item.logisticsQty);
                const reservePerUnit = cycle.reserveAmount !== null && reserveUnits > 0
                    ? cycle.reserveAmount / reserveUnits : 0;

                const credit = calculateAggregateCredit(item);
                const usesCredit = item?.planning?.fundingMode === 'credit';
                const creditUnits=['dropship','offline-service'].includes(item.source)?
                    Number(item.forecastUnitsPerMonth)*servicePricingMonths:Number(item.logisticsQty);
                const creditReady =
                    !usesCredit ||
                    (
                        credit.monthlyServiceCost !== null &&
                        credit.totalInterest !== null &&
                        Math.max(0, Number(creditUnits) || 0) > 0
                    );
                const creditServicePerUnit =
                    usesCredit && creditReady
                        ? credit.totalInterest / creditUnits
                        : 0;
                const pricingUnitLoad =
                    unitCost + creditServicePerUnit + reservePerUnit;

                const rawMargin = item?.planning?.targetMarginPct;
                const hasMargin =
                    rawMargin !== '' &&
                    rawMargin !== null &&
                    rawMargin !== undefined &&
                    Number.isFinite(Number(rawMargin));
                const marginPct = hasMargin
                    ? Math.min(99.99, Math.max(0, Number(rawMargin)))
                    : null;
                const marginRate = marginPct === null ? null : marginPct / 100;

                const agencyFeeGross=agencyOwner?
                    Math.max(0,Number(item.serviceAgency?.grossPrice)||0)*
                    Math.max(0,Number(item.serviceAgency?.feePct)||0)/100+
                    Math.max(0,Number(item.serviceAgency?.fixedFee)||0):0;
                const agencyVat=agencyOwner&&item.uiState?.choices?.salesVat==='yes'?
                    Math.max(0,Number(item.inputs?.['own-sales-vat-pct'])||0)/100:0;
                const price=agencyOwner?
                    (agencyFeeGross>0?agencyFeeGross/(1+agencyVat):null):
                    (!['resale','dropship'].includes(item.source) || Math.max(0,Number(item.inputs?.['resale-buy-total'])||0)>0) &&
                    baseCac !== null &&
                    marginRate !== null &&
                    creditReady &&
                    1 - marginRate > 0
                        ? (pricingUnitLoad + baseCac) / (1 - marginRate)
                        : null;

                return {
                    item,
                    budget,
                    management,
                    cpc,
                    ctrPct,
                    clickLeadPct,
                    leadSalePct,
                    clicks,
                    impressions,
                    leads,
                    orders,
                    baseCac,
                    unitCost,
                    usesCredit,
                    creditServiceMonthly: usesCredit ? credit.monthlyServiceCost : 0,
                    creditServicePerUnit,
                    reservePerUnit,
                    consumedMaterialsPerUnit: consumedMaterialCost,
                    projectedStoragePerUnit: projectedStorage,
                    quantityIssues: cycle.quantityIssues,
                    marginPct,
                    marginRate,
                    price
                };
            });

            const totalForecastOrders =
                prepared.reduce((sum, row) => sum + row.orders, 0);

            prepared.forEach(row => {
                row.salesMix =
                    totalForecastOrders > 0
                        ? row.orders / totalForecastOrders
                        : 0;
            });

            const pricingReady =
                prepared.every(
                    row => row.price !== null && Number.isFinite(row.price) && !row.quantityIssues.length
                );

            const revenueWeightDenominator =
                pricingReady
                    ? prepared.reduce(
                        (sum, row) => sum + row.price * row.salesMix,
                        0
                      )
                    : null;

            prepared.forEach(row => {
                row.revenueWeight =
                    pricingReady &&
                    revenueWeightDenominator !== null &&
                    revenueWeightDenominator > 0
                        ? row.price * row.salesMix / revenueWeightDenominator
                        : null;
            });

            const totalAdBudget =
                prepared.reduce((sum, row) => sum + row.budget, 0);

            const resultItems = prepared.map(row => {
                const forecastSales = row.orders;
                const adBudget = row.budget;
                const actualCac =
                    forecastSales > 0
                        ? adBudget / forecastSales
                        : null;

                const cogs =
                    row.unitCost * forecastSales;

                const revenue =
                    row.price !== null && Number.isFinite(row.price)
                        ? row.price * forecastSales
                        : null;

                const rowAgent=row.item.serviceFinanceMode==='full'&&row.item.serviceRole==='agent';
                const rowSplit=rowAgent&&Array.isArray(row.item.serviceAgency?.lineItems)?
                    serviceAgencyExpenseSplit(row.item).agent:null;
                const turnoverExpenseRate=rowSplit?rowSplit.commissionPct/100:
                    Math.max(0,Number(row.item.salesVariablePct||0)+
                        Number(row.item.penaltiesPct||0))/100;

                const turnoverExpenses =
                    revenue === null
                        ? null
                        : revenue * turnoverExpenseRate;

                const agencyOwner=row.item.serviceFinanceMode==='full'&&row.item.serviceRole==='agent';
                const ownerPays=key=>!agencyOwner||row.item.serviceAgency?.payers?.[key]==='agent';
                const paidAd=rowSplit?rowSplit.advertising:
                    ownerPays('advertising')?adBudget:0;
                const ebitda =
                    revenue === null || turnoverExpenses === null
                        ? null
                        : revenue - cogs - paidAd - turnoverExpenses;

                const roas =
                    revenue !== null && adBudget > 0
                        ? revenue / adBudget
                        : null;

                return {
                    id: row.item.id,
                    name: row.item.name,
                    source: row.item.source,
                    funnel: {
                        budget: row.budget,
                        cpc: row.cpc,
                        ctrPct: row.ctrPct,
                        clickLeadPct: row.clickLeadPct,
                        leadSalePct: row.leadSalePct,
                        clicks: row.clicks,
                        impressions: row.impressions,
                        leads: row.leads,
                        orders: row.orders
                    },
                    unitCost: row.unitCost,
                    creditServiceMonthly: row.creditServiceMonthly,
                    creditServicePerUnit: row.creditServicePerUnit,
                    reservePerUnit: row.reservePerUnit,
                    marginPct: row.marginPct,
                    salesMix: row.salesMix,
                    revenueWeight: row.revenueWeight,
                    baseCac: row.baseCac,
                    weightedCac: actualCac,
                    adBudget,
                    forecastSales,
                    price: row.price,
                    revenue,
                    cogs,
                    turnoverExpenses,
                    ebitda,
                    roas
                };
            });

            const totalManagement =
                prepared.reduce((sum,row)=>{
                    const owner=row.item.serviceRole==='agent'&&
                        Array.isArray(row.item.serviceAgency?.lineItems)?
                        serviceAgencyExpenseSplit(row.item).agent:null;
                    return sum+(owner?owner.management:
                        row.item.serviceRole==='agent'&&row.item.serviceFinanceMode==='full'&&
                        row.item.serviceAgency?.payers?.management!=='agent'?0:row.management);
                },0);
            const salesFixedShared = Math.max(
                0,
                ...items.map(item=>{
                    const owner=item.serviceRole==='agent'&&
                        Array.isArray(item.serviceAgency?.lineItems)?
                        serviceAgencyExpenseSplit(item).agent:null;
                    return owner?owner.selling:
                        item.serviceRole==='agent'&&item.serviceFinanceMode==='full'&&
                        item.serviceAgency?.payers?.selling!=='agent'?0:Number(item.salesFixedMonthly || 0);
                })
            );
            const sharedBusinessCosts =
                totalManagement + salesFixedShared;

            const financingCostsMonthly =
                prepared.reduce(
                    (sum, row) =>
                        sum +
                        (
                            row.usesCredit &&
                            Number.isFinite(Number(row.creditServiceMonthly))
                                ? Number(row.creditServiceMonthly)
                                : 0
                        ),
                    0
                );

            const totalRevenue =
                pricingReady
                    ? resultItems.reduce((sum, row) => sum + row.revenue, 0)
                    : null;

            const totalEbitdaBeforeShared =
                pricingReady
                    ? resultItems.reduce((sum, row) => sum + row.ebitda, 0)
                    : null;

            const businessEbitda =
                totalEbitdaBeforeShared === null
                    ? null
                    : totalEbitdaBeforeShared - sharedBusinessCosts;

            const profitBeforeTax =
                businessEbitda === null
                    ? null
                    : businessEbitda - financingCostsMonthly;

            const taxRate =
                Math.max(0, productNumber('own-business-tax-pct')) / 100;

            let tax = null;
            if (
                pricingReady &&
                productBusinessTaxType === 'turnover'
            ) {
                tax = totalRevenue * taxRate;
            } else if (
                pricingReady &&
                productBusinessTaxType === 'profit'
            ) {
                tax = Math.max(0, profitBeforeTax) * taxRate;
            }

            const priceSensitiveRevenueNet =
                pricingReady
                    ? resultItems.reduce(
                        (sum, row) =>
                            sum + row.revenue - row.turnoverExpenses,
                        0
                      )
                    : null;

            const priceIndependentCosts =
                pricingReady
                    ? resultItems.reduce(
                        (sum, row) =>
                            sum + row.cogs + row.adBudget,
                        0
                      ) + sharedBusinessCosts
                    : null;

            let taxPriceMultiplier = null;

            if (
                pricingReady &&
                productBusinessTaxType === 'turnover'
            ) {
                const denominator =
                    priceSensitiveRevenueNet -
                    taxRate * totalRevenue;

                taxPriceMultiplier =
                    denominator > 0
                        ? priceSensitiveRevenueNet / denominator
                        : null;
            } else if (
                pricingReady &&
                productBusinessTaxType === 'profit'
            ) {
                if (profitBeforeTax <= 0 || taxRate <= 0) {
                    taxPriceMultiplier = 1;
                } else {
                    const afterTaxRetained = 1 - taxRate;
                    taxPriceMultiplier =
                        afterTaxRetained > 0 &&
                        priceSensitiveRevenueNet > 0
                            ? (
                                priceIndependentCosts +
                                financingCostsMonthly +
                                profitBeforeTax / afterTaxRetained
                              ) / priceSensitiveRevenueNet
                            : null;
                }
            }

            if(items.length===1&&items[0].serviceFinanceMode==='full'&&items[0].serviceRole==='agent'&&pricingReady)
                taxPriceMultiplier=1; // contractual fee, no unilateral tax gross-up
            const adjustedRevenue =
                taxPriceMultiplier === null
                    ? null
                    : totalRevenue * taxPriceMultiplier;

            const adjustedTurnoverExpenses =
                taxPriceMultiplier === null
                    ? null
                    : resultItems.reduce(
                        (sum, row) =>
                            sum +
                            row.turnoverExpenses * taxPriceMultiplier,
                        0
                    );

            const adjustedEbitda =
                taxPriceMultiplier === null
                    ? null
                    : adjustedRevenue -
                      adjustedTurnoverExpenses -
                      priceIndependentCosts;

            const adjustedProfitBeforeTax =
                adjustedEbitda === null
                    ? null
                    : adjustedEbitda - financingCostsMonthly;

            const adjustedTax =
                taxPriceMultiplier === null
                    ? null
                    : (
                        productBusinessTaxType === 'turnover'
                            ? adjustedRevenue * taxRate
                            : Math.max(0, adjustedProfitBeforeTax) * taxRate
                    );

            const adjustedNetProfit =
                adjustedProfitBeforeTax === null || adjustedTax === null
                    ? null
                    : adjustedProfitBeforeTax - adjustedTax;

            return {
                items: resultItems,
                pricingReady,
                totalAdBudget,
                totalForecastOrders,
                totalRevenue,
                totalEbitdaBeforeShared,
                sharedBusinessCosts,
                businessEbitda,
                financingCostsMonthly,
                profitBeforeTax,
                tax,
                netProfit:
                    profitBeforeTax === null || tax === null
                        ? null
                        : profitBeforeTax - tax,
                taxPriceMultiplier,
                adjustedRevenue,
                adjustedEbitda,
                adjustedProfitBeforeTax,
                adjustedTax,
                adjustedNetProfit
            };
        }
// V1-FUNCTION-END:calculateProductPortfolio

// V1-FUNCTION-BEGIN:aggregatePricingMetrics
function aggregatePricingMetrics(item) {
            const model = calculateProductPortfolio();
            const row = model.items.find(entry => entry.id === item?.id) || null;

            if (!row) {
                return {
                    marginPct: null,
                    priceBeforeTax: null,
                    priceBeforeTaxWithVat: null,
                    taxAdjustedPrice: null,
                    taxAdjustedPriceWithVat: null,
                    salesMix: 0,
                    revenueWeight: null,
                    baseCac: null,
                    weightedCac: null,
                    adBudget: 0,
                    forecastSales: 0,
                    revenue: null,
                    cogs: 0,
                    creditServiceMonthly: 0,
                    creditServicePerUnit: 0,
                    ebitda: null,
                    roas: null
                };
            }

            const salesVatChoice = productOwnChoices.salesVat;
            const salesVatEnabled = salesVatChoice === 'yes';
            const vatPct = salesVatEnabled
                ? Math.max(0, productNumber('own-sales-vat-pct'))
                : 0;
            const vatReady = salesVatEnabled && vatPct > 0;
            const vatRate = vatReady ? vatPct / 100 : 0;

            const priceBeforeTaxWithVat =
                row.price === null || !vatReady
                    ? null
                    : row.price * (1 + vatRate);

            const taxAdjustedPrice =
                row.price === null || model.taxPriceMultiplier === null
                    ? null
                    : row.price * model.taxPriceMultiplier;

            const taxAdjustedPriceWithVat =
                taxAdjustedPrice === null || !vatReady
                    ? null
                    : taxAdjustedPrice * (1 + vatRate);

            return {
                marginPct: row.marginPct,
                priceBeforeTax: row.price,
                priceBeforeTaxWithVat,
                taxAdjustedPrice,
                taxAdjustedPriceWithVat,
                salesVatChoice,
                vatPct,
                vatReady,
                salesMix: row.salesMix,
                revenueWeight: row.revenueWeight,
                baseCac: row.baseCac,
                weightedCac: row.weightedCac,
                adBudget: row.adBudget,
                forecastSales: row.forecastSales,
                revenue: row.revenue,
                cogs: row.cogs,
                creditServiceMonthly: row.creditServiceMonthly,
                creditServicePerUnit: row.creditServicePerUnit,
                ebitda: row.ebitda,
                roas: row.roas
            };
        }
// V1-FUNCTION-END:aggregatePricingMetrics

// V1-FUNCTION-BEGIN:calculateDropshipCashFlow
function calculateDropshipCashFlow(model) {
            // A single ad campaign is active for days 0-29. Orders are paid to the
            // supplier on placement and settled by the customer at the declared time.
            const items=productPortfolio.filter(item=>item.source==='dropship');
            const schedules=items.map(item=>{
                const row=model.items.find(r=>r.id===item.id);
                const plan=dropshipCycleMetrics(item),loan=calculateAggregateCredit(item);
                const usesCredit=item?.planning?.fundingMode==='credit';
                return {item,row,plan,loan,usesCredit};
            });
            if(schedules.some(x=>!x.row||x.plan.requiredCapital===null||
                (x.usesCredit&&x.loan.principal===null))){
                return {ready:false,months:[],cumulativeEnd:null,freeCumulativeEnd:null};
            }
            const horizonDays=Math.max(30,...schedules.map(x=>
                Math.max(x.plan.totalCycleDays||30,
                    x.usesCredit?Math.max(1,Number(x.loan.termMonths)||1)*30:0)));
            const monthCount=Math.max(1,Math.ceil(horizonDays/30));
            const months=Array.from({length:monthCount},(_,index)=>({
                month:index+1,inflow:0,outflow:0,cashFlow:0,cumulative:0,
                taxPaid:0,interestPaid:0,principalRepaid:0,financedInflow:0,
                taxableProfit:0,freeCumulative:0
            }));
            const idx=day=>Math.min(monthCount-1,Math.max(0,Math.floor(day/30)));
            const sharedFixed=Math.max(0,...schedules.map(x=>Number(x.item.salesFixedMonthly)||0));
            const reserveLocked=schedules.reduce((sum,x)=>sum+(x.plan.reserveAmount||0),0);
            for(const x of schedules){
                const {item,row,plan,loan,usesCredit}=x;
                const capital=plan.requiredCapital||0;
                months[0].inflow+=capital;months[0].financedInflow+=capital;
                const perDayOrders=Math.max(0,Number(item.forecastUnitsPerMonth)||0)/30;
                const supplierCost=Math.max(0,Number(item.materialsUnitCost)||0);
                const deliveryCost=Math.max(0,Number(item.logisticsUnitCost)||0);
                const promoDaily=(Math.max(0,Number(item.adBudget)||0)+
                    Math.max(0,Number(item.adManagement)||0))/30;
                const customerPayoutDelay=item.dropshipPayoutMode==='before'?0:
                    Math.max(0,Number(item.dropshipDeliveryDays)||0)+
                    Math.max(0,Number(item.dropshipPayoutLagDays)||0);
                const variableRate=(Math.max(0,Number(item.salesVariablePct)||0)+
                    Math.max(0,Number(item.penaltiesPct)||0))/100;
                for(let day=0;day<30;day++){
                    const outgoing=months[idx(day)];
                    const fulfillment=perDayOrders*(supplierCost+deliveryCost);
                    outgoing.outflow+=promoDaily+fulfillment;
                    outgoing.taxableProfit-=promoDaily+fulfillment;
                    const receipt=months[idx(day+customerPayoutDelay)];
                    const revenue=perDayOrders*row.price*model.taxPriceMultiplier;
                    receipt.inflow+=revenue;
                    const commission=revenue*variableRate;
                    receipt.outflow+=commission;
                    receipt.taxableProfit+=revenue-commission;
                }
                if(usesCredit){
                    const monthsOfLoan=Math.max(1,Number(loan.termMonths)||1);
                    const interest=Math.max(0,Number(loan.monthlyServiceCost)||0);
                    for(let month=0;month<Math.min(monthCount,monthsOfLoan);month++){
                        months[month].outflow+=interest;
                        months[month].interestPaid+=interest;
                        months[month].taxableProfit-=interest;
                    }
                    const due=months[Math.min(monthCount-1,monthsOfLoan-1)];
                    due.outflow+=Math.max(0,Number(loan.principal)||0);
                    due.principalRepaid+=Math.max(0,Number(loan.principal)||0);
                }
            }
            months[0].outflow+=sharedFixed;
            months[0].taxableProfit-=sharedFixed;
            const taxRate=Math.max(0,productNumber('own-business-tax-pct'))/100;
            let cumulative=0;
            for(const month of months){
                const taxableTurnover=Math.max(0,month.inflow-month.financedInflow);
                month.taxPaid=productBusinessTaxType==='turnover'?
                    taxableTurnover*taxRate:Math.max(0,month.taxableProfit)*taxRate;
                month.outflow+=month.taxPaid;
                month.cashFlow=month.inflow-month.outflow;
                cumulative+=month.cashFlow;
                month.cumulative=cumulative;
                month.freeCumulative=cumulative-reserveLocked;
            }
            return {
                ready:true,months,horizonDays,saleEndDays:horizonDays,reserveLocked,
                cumulativeEnd:cumulative,freeCumulativeEnd:cumulative-reserveLocked
            };
        }
// V1-FUNCTION-END:calculateDropshipCashFlow

// V1-FUNCTION-BEGIN:calculateCanonicalV1ServiceCashFlow
function calculateCanonicalV1ServiceCashFlow(model,finishV1FinancialLedger) {
            const items=productPortfolio.filter(item=>item.source==='offline-service');
            if(items.length!==1||productPortfolio.length!==1)
                return {ready:false,months:[],reason:'Полный V1 рассчитывает одну услугу. Несколько услуг объединяются в V2.'};
            const item=items[0];
            if(!(Number(item.forecastUnitsPerMonth)>0))
                return {ready:false,months:[],reason:'Для расчёта цены нужен прогноз клиентов первого месяца. Поздний старт с нулевыми продажами требует отдельного помесячного плана.'};
            if(!model?.pricingReady)
                return {ready:false,months:[],reason:'Уточните себестоимость, рекламный прогноз и цену услуги перед расчётом денежного потока.'};
            if(!productBusinessTaxType||model.taxPriceMultiplier===null)
                return {ready:false,months:[],reason:'Выберите налог бизнеса и ставку, чтобы рассчитать денежный поток.'};
            const row=model.items.find(x=>x.id===item.id);
            const cycle=aggregatePlanMetrics(item),credit=calculateAggregateCredit(item);
            const funded=item.planning?.fundingMode;
            const usesCredit=funded==='credit';
            const horizon=Number(item.serviceHorizonMonths);
            if(!row||!Number.isInteger(horizon)||horizon<1||horizon>120||
                cycle.requiredCapital===null||cycle.quantityIssues?.length||
                !['cash','credit'].includes(funded)||
                (usesCredit&&(credit.principal===null||credit.monthlyServiceCost===null||
                    !(Number.isInteger(Number(credit.termMonths))&&credit.termMonths>=1))))
                return {ready:false,months:[],reason:'Проверьте период, рекламу, себестоимость, мощность услуги и финансирование.'};
            const n=Math.max(horizon,usesCredit?Number(credit.termMonths):1);
            const months=Array.from({length:n},(_,i)=>({month:i+1,inflow:0,outflow:0,
                cashFlow:0,cumulative:0,taxPaid:0,interestPaid:0,principalRepaid:0,
                financedInflow:0,taxableProfit:0,freeCumulative:0,
                capexPaid:0,depreciation:0}));
            const capital=usesCredit?Number(credit.principal):Number(cycle.requiredCapital);
            const reserved=Math.max(0,Number(cycle.reserveAmount)||0);
            const qty=Math.max(0,Number(item.forecastUnitsPerMonth)||0);
            const agent=item.serviceRole==='agent',agency=item.serviceAgency||{};
            const owns=k=>!agent||agency.payers?.[k]==='agent';
            const partnerPays=k=>agent&&agency.payers?.[k]==='partner';
            const receipt=qty*row.price*model.taxPriceMultiplier;
            const lineSplit=agent&&Array.isArray(agency.lineItems)?
                serviceAgencyExpenseSplit(item,receipt):null;
            const owner=lineSplit?.agent,partner=lineSplit?.partner;
            const allDirect=qty*Math.max(0,Number(item.materialsUnitCost)||0);
            const allElectricity=qty*Math.max(0,Number(item.productionElectricityPerUnit)||0);
            const allDepreciation=Math.max(0,Number(item.serviceAmortMonthly)||0);
            const allOperatingFixed=Math.max(0,(Number(item.productionFixedMonthly)||0)-allDepreciation);
            const allSalesFixed=Math.max(0,Number(item.salesFixedMonthly)||0);
            const allAd=Math.max(0,Number(item.adBudget)||0);
            const allManagement=Math.max(0,Number(item.adManagement)||0);
            const allCommissions=receipt*
                (Math.max(0,Number(item.salesVariablePct)||0)+Math.max(0,Number(item.penaltiesPct)||0))/100;
            const direct=owner?owner.direct+owner.electricity:
                (owns('direct')?allDirect:0)+(owns('production')?allElectricity:0);
            const amort=owner?owner.amort:owns('equipment')?allDepreciation:0;
            const fixed=owner?
                owner.production+owner.amort+owner.selling+owner.advertising+owner.management:
                (owns('production')?allOperatingFixed:0)+amort+
                (owns('selling')?allSalesFixed:0)+
                (owns('advertising')?allAd:0)+(owns('management')?allManagement:0);
            const variableCommissions=owner?owner.commission:
                owns('commission')?allCommissions:0;
            const capex=owner?owner.capex:
                owns('equipment')?Math.max(0,Number(item.serviceCapex)||0):0;
            const partnerPriceNet=agent?Math.max(0,Number(agency.grossPrice)||0)/
                (1+Math.max(0,Number(agency.partnerVatPct)||0)/100):0;
            const partnerRevenue=qty*partnerPriceNet;
            const partnerCosts=partner?
                partner.direct+partner.production+partner.electricity+partner.amort+
                partner.selling+partner.advertising+partner.management+
                partner.commission+receipt:
                (partnerPays('direct')?allDirect:0)+
                (partnerPays('production')?allElectricity+allOperatingFixed:0)+
                (partnerPays('equipment')?allDepreciation:0)+
                (partnerPays('selling')?allSalesFixed:0)+
                (partnerPays('advertising')?allAd:0)+
                (partnerPays('management')?allManagement:0)+
                (partnerPays('commission')?allCommissions:0)+receipt;
            const partnerTaxRate=Math.max(0,Number(agency.partnerTaxPct)||0)/100;
            const partnerTax=agency.partnerTaxType==='profit'?
                Math.max(0,partnerRevenue-partnerCosts)*partnerTaxRate:
                partnerRevenue*partnerTaxRate;
            for(let serviceMonth=0;serviceMonth<horizon;serviceMonth++){
                const month=months[serviceMonth];
                // Service sales and fixed operations stop after approved months.
                // Longer credit terms only extend debt and interest payments.
                // Costs remain payable in zero-sales months; amort is noncash.
                month.inflow+=receipt;
                month.outflow+=direct+fixed-amort+variableCommissions;
                month.taxableProfit+=receipt-direct-fixed-variableCommissions;
                month.depreciation+=amort;
                if(agent){
                    month.partnerRevenue=partnerRevenue;
                    month.partnerCosts=partnerCosts;
                    month.partnerTax=partnerTax;
                    month.partnerProfit=partnerRevenue-partnerCosts-partnerTax;
                }
            }
            months[0].inflow+=capital;
            months[0].financedInflow+=capital;
            months[0].outflow+=capex;
            months[0].capexPaid=capex;
            if(usesCredit){
                for(let m=0;m<Math.min(n,Number(credit.termMonths));m++){
                    const interest=Math.max(0,Number(credit.monthlyServiceCost)||0);
                    months[m].outflow+=interest;
                    months[m].interestPaid+=interest;
                    months[m].taxableProfit-=interest;
                }
                const maturity=months[Number(credit.termMonths)-1];
                maturity.outflow+=capital;
                maturity.principalRepaid+=capital;
            }
            return finishV1FinancialLedger(months,reserved,n*30,n*30);
        }
// V1-FUNCTION-END:calculateCanonicalV1ServiceCashFlow

// V1-FUNCTION-BEGIN:calculateOfflineServiceCashFlow
function calculateOfflineServiceCashFlow(model) {
            const items=productPortfolio.filter(item=>item.source==='offline-service');
            const schedules=items.map(item=>({
                item,row:model.items.find(row=>row.id===item.id),
                plan:offlineServiceCycleMetrics(item),credit:calculateAggregateCredit(item),
                borrowed:item.planning?.fundingMode==='credit',
                operatingMonths:item.serviceHorizonMonths===undefined||item.serviceHorizonMonths===null?
                    1:Number(item.serviceHorizonMonths)
            }));
            if(!model?.pricingReady||!productBusinessTaxType||model.taxPriceMultiplier===null||
                schedules.some(x=>!x.row||x.plan.requiredCapital===null||x.plan.quantityIssues?.length||
                    !Number.isInteger(x.operatingMonths)||x.operatingMonths<1||x.operatingMonths>120||
                    (x.borrowed&&x.credit.principal===null)))
                return {ready:false,months:[],cumulativeEnd:null,freeCumulativeEnd:null};
            // Only the selected months repeat service demand. A loan lasting longer
            // extends the payment calendar, never creates extra clients or revenue.
            const demandMonths=Math.max(1,...schedules.map(x=>x.operatingMonths));
            const n=Math.max(demandMonths,...schedules.map(x=>
                x.borrowed?Math.max(1,Number(x.credit.termMonths)||1):1));
            const months=Array.from({length:n},(_,i)=>({
                month:i+1,inflow:0,outflow:0,cashFlow:0,cumulative:0,
                taxPaid:0,interestPaid:0,principalRepaid:0,financedInflow:0,
                taxableProfit:0,freeCumulative:0
            }));
            const rate=Math.max(0,productNumber('own-business-tax-pct'))/100;
            let reserveLocked=0;
            for(const {item,row,plan,credit,borrowed,operatingMonths} of schedules){
                const qty=Math.max(0,Number(item.forecastUnitsPerMonth)||0);
                const revenue=qty*row.price*model.taxPriceMultiplier;
                const materials=qty*Math.max(0,Number(item.materialsUnitCost)||0);
                const electricity=qty*Math.max(0,Number(item.productionElectricityPerUnit)||0);
                const operations=Math.max(0,Number(item.productionFixedMonthly)||0);
                const salesFixed=Math.max(0,Number(item.salesFixedMonthly)||0);
                const advertising=Math.max(0,Number(item.adBudget)||0)+Math.max(0,Number(item.adManagement)||0);
                const commission=revenue*(Math.max(0,Number(item.salesVariablePct)||0)+
                    Math.max(0,Number(item.penaltiesPct)||0))/100;
                const operating=materials+electricity+operations+salesFixed+advertising+commission;
                const start=borrowed?Math.max(0,Number(credit.principal)||0):plan.requiredCapital;
                reserveLocked+=plan.reserveAmount||0;
                months[0].inflow+=start;
                months[0].financedInflow+=start;
                for(let i=0;i<operatingMonths;i++){
                    months[i].inflow+=revenue;
                    months[i].outflow+=operating;
                    months[i].taxableProfit+=revenue-operating;
                }
                if(borrowed){
                    const term=Math.max(1,Number(credit.termMonths)||1);
                    const interest=Math.max(0,Number(credit.monthlyServiceCost)||0);
                    for(let i=0;i<Math.min(n,term);i++){
                        months[i].interestPaid+=interest;
                        months[i].outflow+=interest;
                        months[i].taxableProfit-=interest;
                    }
                    const last=months[Math.min(n-1,term-1)];
                    last.outflow+=Math.max(0,Number(credit.principal)||0);
                    last.principalRepaid+=Math.max(0,Number(credit.principal)||0);
                }
            }
            let total=0;
            for(const month of months){
                const revenue=month.inflow-month.financedInflow;
                month.taxPaid=productBusinessTaxType==='turnover'?Math.max(0,revenue)*rate:
                    Math.max(0,month.taxableProfit)*rate;
                month.outflow+=month.taxPaid;
                month.cashFlow=month.inflow-month.outflow;
                total+=month.cashFlow;
                month.cumulative=total;
                month.freeCumulative=total-reserveLocked;
            }
            return {ready:true,months,horizonDays:n*30,saleEndDays:demandMonths*30,
                operatingMonths:demandMonths,reserveLocked,
                cumulativeEnd:total,freeCumulativeEnd:total-reserveLocked};
        }
// V1-FUNCTION-END:calculateOfflineServiceCashFlow

// V1-FUNCTION-BEGIN:calculateProductCashFlow
function calculateProductCashFlow(model) {
        function finishV1FinancialLedger(months,reserveLocked,horizonDays,saleEndDays) {
            // Common V1 settlement for goods and services: VAT is passed through,
            // financing is not revenue, debt principal is not an expense for P&L.
            const taxRate=Math.max(0,productNumber('own-business-tax-pct'))/100;
            let cumulative=0;
            for(const month of months){
                const taxableTurnover=Math.max(0,month.inflow-month.financedInflow);
                month.taxPaid=productBusinessTaxType==='turnover'
                    ?taxableTurnover*taxRate
                    :Math.max(0,month.taxableProfit)*taxRate;
                month.outflow+=month.taxPaid;
                month.cashFlow=month.inflow-month.outflow;
                cumulative+=month.cashFlow;
                month.cumulative=cumulative;
                month.freeCumulative=cumulative-reserveLocked;
            }
            return {ready:true,months,horizonDays,saleEndDays,reserveLocked,
                cumulativeEnd:cumulative,freeCumulativeEnd:cumulative-reserveLocked};
        }
            if(productPortfolio.some(item=>item.source==='offline-service')){
                if(productPortfolio.some(item=>item.source!=='offline-service'))
                    return {ready:false,months:[],reason:'Для смешанных товаров и офлайн-услуг используйте общий Cash flow V2.',cumulativeEnd:null,freeCumulativeEnd:null};
                return productPortfolio.every(item=>item.serviceFinanceMode==='full')
                    ?calculateCanonicalV1ServiceCashFlow(model,finishV1FinancialLedger)
                    :calculateOfflineServiceCashFlow(model);
            }
            if (model?.pricingReady && productPortfolio.some(item=>item.source==='dropship')) {
                // Mixed physical-stock and dropship cash schedules have different timing.
                if(productPortfolio.some(item=>item.source!=='dropship'))return {ready:false,months:[],reason:'Для смешанного ассортимента нужен единый календарь платежей',cumulativeEnd:null,freeCumulativeEnd:null};
                if(!productBusinessTaxType||model.taxPriceMultiplier===null)return {ready:false,months:[],cumulativeEnd:null,freeCumulativeEnd:null};
                return calculateDropshipCashFlow(model);
            }
            if (!model?.pricingReady || !model.items.length || !productBusinessTaxType || model.taxPriceMultiplier === null) {
                return { ready: false, months: [], cumulativeEnd: null, freeCumulativeEnd: null };
            }

            const schedules = productPortfolio.map(item => {
                const row = model.items.find(entry => entry.id === item.id);
                if (!row || row.price === null || !Number.isFinite(row.price)) return null;

                const planning = item.planning || {};
                const materialsTotal = Math.max(0, Number(item.materialsBatchTotal || 0));
                const advancePct = Math.min(100, Math.max(0, Number(planning.advancePct) || 0));
                const advanceAmount = materialsTotal * advancePct / 100;
                const materialsRemainder = Math.max(0, materialsTotal - advanceAmount);

                const supplyDays = Math.max(0, Number(planning.supplyDays) || 0);
                const advanceLeadDays =
                    planning.advanceLeadDays === '' ||
                    planning.advanceLeadDays === null ||
                    planning.advanceLeadDays === undefined
                        ? supplyDays
                        : Math.max(0, Number(planning.advanceLeadDays) || 0);
                const advanceDay =
                    advancePct > 0
                        ? Math.max(0, supplyDays - advanceLeadDays)
                        : null;

                const productionDays = item.source==='resale'?0:Math.max(0, Number(planning.productionDays) || 0);
                const productionStart = supplyDays;
                const saleStart = productionStart + productionDays;

                const stockQty = Math.max(0, Number(item.logisticsQty || 0));
                const salesPerMonth = Math.max(0, Number(row.forecastSales || 0));
                const unitsPerDay = salesPerMonth / 30;
                const sellThroughDays =
                    stockQty > 0 && unitsPerDay > 0
                        ? stockQty / unitsPerDay
                        : null;
                const saleEnd =
                    sellThroughDays === null
                        ? null
                        : saleStart + sellThroughDays;

                const productionTotal = item.source==='resale'?0:Math.max(0, Number(item.productionTotal || 0));
                const warehouseInboundTotal =
                    Math.max(0, Number(item.warehouseInboundUnitCost || 0)) * stockQty;
                const warehouseDayCost = Math.max(0, Number(item.warehouseDayCost || 0));

                const costBeforeCustomerDelivery =
                    Math.max(0, Number(item.materialsUnitCost || 0)) +
                    Math.max(0, Number(item.productionUnitCost || 0));
                const customerDeliveryPct = Math.max(0, Number(item.customerDeliveryPct || 0));
                const customerReturnPct = Math.max(0, Number(item.customerReturnPct || 0));
                const customerDeliveryPerUnit =
                    costBeforeCustomerDelivery *
                    customerDeliveryPct / 100 *
                    (1 + customerReturnPct / 100);

                const turnoverExpenseRate =
                    Math.max(
                        0,
                        Number(item.salesVariablePct || 0) +
                        Number(item.penaltiesPct || 0)
                    ) / 100;

                const credit = calculateAggregateCredit(item);
                const usesCredit = item?.planning?.fundingMode === 'credit';
                const creditMonthlyService =
                    usesCredit && credit.monthlyServiceCost !== null
                        ? Math.max(0, Number(credit.monthlyServiceCost) || 0)
                        : 0;
                const creditTermMonths =
                    usesCredit && credit.termMonths !== null
                        ? Math.max(1, Number(credit.termMonths) || 1)
                        : 0;

                const cycle = aggregatePlanMetrics(item);
                const usesCash = item?.planning?.fundingMode === 'cash';
                return {
                    item,
                    row,
                    cashFunding: usesCash ? cycle.requiredCapital : 0,
                    reserveAmount: cycle.reserveAmount || 0,
                    loanPrincipal: usesCredit ? credit.principal : 0,
                    materialsTotal,
                    advanceAmount,
                    materialsRemainder,
                    advanceDay,
                    supplyDays,
                    productionDays,
                    productionStart,
                    productionTotal,
                    saleStart,
                    saleEnd,
                    stockQty,
                    unitsPerDay,
                    warehouseInboundTotal,
                    warehouseDayCost,
                    customerDeliveryPerUnit,
                    turnoverExpenseRate,
                    adBudgetMonthly: Math.max(0, Number(item.adBudget || 0)),
                    adManagementMonthly: Math.max(0, Number(item.adManagement || 0)),
                    salesFixedMonthly: Math.max(0, Number(item.salesFixedMonthly || 0)),
                    usesCredit,
                    creditMonthlyService,
                    creditTermMonths
                };
            }).filter(Boolean);

            if (!schedules.length || schedules.some(schedule => schedule.saleEnd === null)) {
                return { ready: false, months: [], cumulativeEnd: null };
            }

            const horizonDays = Math.max(
                1,
                ...schedules.map(schedule =>
                    Math.max(
                        schedule.saleEnd || 0,
                        schedule.usesCredit
                            ? schedule.creditTermMonths * 30
                            : 0
                    )
                )
            );
            const monthCount = Math.max(1, Math.ceil(horizonDays / 30));
            const months = Array.from({ length: monthCount }, (_, index) => ({
                month: index + 1,
                inflow: 0,
                outflow: 0,
                cashFlow: 0,
                cumulative: 0,
                taxPaid: 0,
                interestPaid: 0,
                principalRepaid: 0,
                financedInflow: 0,
                taxableProfit: 0,
                freeCumulative: 0
            }));

            const addEvent = (day, amount) => {
                if (!(amount > 0)) return;
                const monthIndex = Math.min(
                    monthCount - 1,
                    Math.max(0, Math.floor(Math.max(0, day) / 30))
                );
                months[monthIndex].outflow += amount;
            };

            const overlap = (startA, endA, startB, endB) =>
                Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));

            const taxRate = Math.max(0, productNumber('own-business-tax-pct')) / 100;
            const reserveLocked = schedules.reduce((sum, schedule) => sum + schedule.reserveAmount, 0);
            schedules.forEach(schedule => {
                // Financing is NOT a sale or taxable income. Cash contributions are
                // recognized once, not deducted as operating cost.
                const funding = Math.max(0, Number(schedule.cashFunding) || 0) +
                    Math.max(0, Number(schedule.loanPrincipal) || 0);
                months[0].inflow += funding;
                months[0].financedInflow += funding;
                if (schedule.advanceDay !== null) {
                    addEvent(schedule.advanceDay, schedule.advanceAmount);
                }
                addEvent(schedule.supplyDays, schedule.materialsRemainder);

                if (schedule.productionDays > 0) {
                    for (let m = 0; m < monthCount; m++) {
                        const monthStart = m * 30;
                        const monthEnd = (m + 1) * 30;
                        const days = overlap(
                            monthStart,
                            monthEnd,
                            schedule.productionStart,
                            schedule.saleStart
                        );
                        if (days > 0) {
                            months[m].outflow +=
                                schedule.productionTotal *
                                days / schedule.productionDays;
                        }
                    }
                } else {
                    addEvent(schedule.productionStart, schedule.productionTotal);
                }

                addEvent(schedule.saleStart, schedule.warehouseInboundTotal);

                for (let m = 0; m < monthCount; m++) {
                    const monthStart = m * 30;
                    const monthEnd = (m + 1) * 30;
                    const sellStart = Math.max(monthStart, schedule.saleStart);
                    const sellEnd = Math.min(monthEnd, schedule.saleEnd);
                    const sellingDays = Math.max(0, sellEnd - sellStart);
                    if (!(sellingDays > 0)) continue;

                    const relativeStart = sellStart - schedule.saleStart;
                    const relativeEnd = sellEnd - schedule.saleStart;
                    const soldUnits = Math.min(
                        schedule.stockQty,
                        schedule.unitsPerDay * sellingDays
                    );
                    const revenue = soldUnits * schedule.row.price * model.taxPriceMultiplier;

                    const inventoryIntegral =
                        schedule.stockQty * (relativeEnd - relativeStart) -
                        schedule.unitsPerDay *
                        (relativeEnd * relativeEnd - relativeStart * relativeStart) / 2;
                    const warehouseCost =
                        schedule.warehouseDayCost *
                        Math.max(0, inventoryIntegral);

                    const customerDelivery =
                        soldUnits * schedule.customerDeliveryPerUnit;
                    const turnoverExpenses =
                        revenue * schedule.turnoverExpenseRate;
                    const adMedia =
                        schedule.adBudgetMonthly / 30 * sellingDays;
                    const adManagement =
                        schedule.adManagementMonthly / 30 * sellingDays;

                    months[m].inflow += revenue;
                    // Accrual-based tax profit (not cash purchases). The SKU COGS
                    // includes the entire sell-through holding period; monthly cash
                    // storage outlay is tracked independently below.
                    months[m].taxableProfit += revenue -
                        soldUnits * schedule.row.unitCost -
                        turnoverExpenses - adMedia - adManagement;
                    months[m].outflow +=
                        warehouseCost +
                        customerDelivery +
                        turnoverExpenses +
                        adMedia +
                        adManagement;
                }
            });

            // Sales staff/platform fixed cost is a shared business cost.
            // Charge it once per month while at least one SKU is actively selling.
            for (let m = 0; m < monthCount; m++) {
                const monthStart = m * 30;
                const monthEnd = (m + 1) * 30;
                let sharedSalesCost = 0;

                schedules.forEach(schedule => {
                    const activeDays = overlap(
                        monthStart,
                        monthEnd,
                        schedule.saleStart,
                        schedule.saleEnd
                    );
                    if (activeDays > 0) {
                        sharedSalesCost = Math.max(
                            sharedSalesCost,
                            schedule.salesFixedMonthly / 30 * activeDays
                        );
                    }
                });

                months[m].outflow += sharedSalesCost;
                months[m].taxableProfit -= sharedSalesCost;
            }

            schedules.forEach(schedule => {
                if (!schedule.usesCredit ||
                    schedule.creditMonthlyService === null ||
                    !(schedule.creditTermMonths > 0)) return;

                const count = Math.min(monthCount, schedule.creditTermMonths);
                for (let m = 0; m < count; m++) {
                    const interest = schedule.creditMonthlyService;
                    months[m].outflow += interest;
                    months[m].interestPaid += interest;
                    months[m].taxableProfit -= interest;
                }
                // Declared credit contract: interest-only, BULLET repayment at term.
                // Repayment of borrowed capital is a financing cash-flow, never P&L.
                const due = Math.min(monthCount - 1, Math.max(0, schedule.creditTermMonths - 1));
                const principal = Math.max(0, Number(schedule.loanPrincipal) || 0);
                months[due].outflow += principal;
                months[due].principalRepaid += principal;
            });

            return finishV1FinancialLedger(months,reserveLocked,horizonDays,
                Math.max(...schedules.map(schedule=>schedule.saleEnd)));
        }
// V1-FUNCTION-END:calculateProductCashFlow

// V1-FUNCTION-BEGIN:calculatePriceListRange
function calculatePriceListRange(item) {
            const model = calculateProductPortfolio();
            const row = model.items.find(entry => entry.id === item?.id) || null;
            if(item?.serviceFinanceMode==='full'&&item?.serviceRole==='agent'){
                const price=Number(row?.price),vat=item.uiState?.choices?.salesVat==='yes'?
                    Math.max(0,Number(item.inputs?.['own-sales-vat-pct'])||0)/100:0;
                return Number.isFinite(price)&&price>0?
                    {ready:true,error:'',minPrice:Math.round(price*(1+vat)*100)/100,
                        maxPrice:Math.round(price*(1+vat)*100)/100}:
                    {ready:false,error:'Укажите вознаграждение агента.',minPrice:null,maxPrice:null};
            }
            const pricing = aggregatePricingMetrics(item);

            const rawDiscount = item?.planning?.maxDiscountPct;
            const rawMinimumMargin = item?.planning?.minimumMarginPct;
            const rawTargetMargin = item?.planning?.targetMarginPct;

            const hasValue = value =>
                value !== '' && value !== null && value !== undefined &&
                Number.isFinite(Number(value));

            if (!hasValue(rawDiscount) || !hasValue(rawMinimumMargin) || !hasValue(rawTargetMargin)) {
                return { ready: false, error: 'Введите максимальную скидку, минимальную и целевую маржинальность.', minPrice: null, maxPrice: null };
            }
            if (!row || !model.pricingReady || row.baseCac === null ||
                model.totalForecastOrders <= 0 || !productBusinessTaxType) {
                return { ready: false, error: 'Сначала завершите расчёт товара, продаж и налога бизнеса.', minPrice: null, maxPrice: null };
            }

            const discountPct = Number(rawDiscount);
            const minimumMarginPct = Number(rawMinimumMargin);
            const targetMarginPct = Number(rawTargetMargin);

            if (discountPct < 0 || discountPct >= 100 ||
                minimumMarginPct <= 0 || minimumMarginPct >= 100 ||
                targetMarginPct <= 0 || targetMarginPct >= 100) {
                return { ready: false, error: 'Скидка — от 0 до менее 100%; маржинальность — строго больше 0% и меньше 100%.', minPrice: null, maxPrice: null };
            }
            if (minimumMarginPct > targetMarginPct) {
                return { ready: false, error: 'Минимальная маржинальность не должна быть выше вашей целевой маржинальности.', minPrice: null, maxPrice: null };
            }
            if (!pricing.salesVatChoice || (pricing.salesVatChoice === 'yes' && !pricing.vatReady)) {
                return { ready: false, error: 'Укажите, применяется ли НДС, и его ставку.', minPrice: null, maxPrice: null };
            }

            const taxRate = Math.max(0, productNumber('own-business-tax-pct')) / 100;
            const turnoverTaxRate = productBusinessTaxType === 'turnover' ? taxRate : 0;
            const profitTaxRate = productBusinessTaxType === 'profit' ? taxRate : 0;
            const variableRate = (
                Math.max(0, Number(item.salesVariablePct) || 0) +
                Math.max(0, Number(item.penaltiesPct) || 0)
            ) / 100;
            const vatRate = pricing.salesVatChoice === 'yes' ? pricing.vatPct / 100 : 0;

            // Shared fixed costs are a monthly business obligation, allocated across
            // all forecast sold units; loan interest is already SKU-specific.
            const sharedCostPerUnit = model.sharedBusinessCosts / model.totalForecastOrders;
            const unitLoad =
                Math.max(0, Number(row.unitCost) || 0) +
                Math.max(0, Number(row.baseCac) || 0) +
                Math.max(0, Number(row.creditServicePerUnit) || 0) +
                Math.max(0, Number(row.reservePerUnit) || 0) +
                Math.max(0, sharedCostPerUnit);
            const priceForMinimumMargin = priceListRequiredCustomerPrice(
                unitLoad, minimumMarginPct / 100, variableRate,
                turnoverTaxRate, profitTaxRate, vatRate, discountPct / 100
            );
            const priceForTargetMargin = priceListRequiredCustomerPrice(
                unitLoad, targetMarginPct / 100, variableRate,
                turnoverTaxRate, profitTaxRate, vatRate, discountPct / 100
            );

            if (priceForMinimumMargin === null || priceForTargetMargin === null) {
                return { ready: false, error: 'При этих ставках налогов, комиссий и маржинальности прибыльная цена невозможна. Снизьте нагрузку или маржу.', minPrice: null, maxPrice: null };
            }
            return {
                ready: true,
                error: '',
                // Customer-visible amounts are rounded UP to cents, never below the promised margin.
                minPrice: Math.ceil(Math.min(priceForMinimumMargin, priceForTargetMargin) * 100) / 100,
                maxPrice: Math.ceil(Math.max(priceForMinimumMargin, priceForTargetMargin) * 100) / 100
            };
        }
// V1-FUNCTION-END:calculatePriceListRange

return Object.freeze({serviceAgencyExpenseSplit,aggregateQuantityDetails,aggregateQuantityIssues,allocatedMaterialCostPerGood,projectedStoragePerUnit,dropshipCycleMetrics,offlineServiceCycleMetrics,aggregatePlanMetrics,calculateProductPortfolio,aggregatePricingMetrics,calculateDropshipCashFlow,calculateCanonicalV1ServiceCashFlow,calculateOfflineServiceCashFlow,calculateProductCashFlow,priceListRequiredCustomerPrice,calculatePriceListRange,calculateAggregateCredit,v1FullServiceSku});
}
return Object.freeze({create,validateSimpleService,unassignedSimpleAgentExpenses,calculateSimpleService,serviceAgencyExpenseSplit,aggregateQuantityDetails,aggregateQuantityIssues,allocatedMaterialCostPerGood,projectedStoragePerUnit,dropshipCycleMetrics,offlineServiceCycleMetrics,aggregatePlanMetrics,priceListRequiredCustomerPrice,calculateAggregateCredit,v1FullServiceSku});
});
