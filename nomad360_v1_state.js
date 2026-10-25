/* V1 state preparation: plain field/row records, normalized numbers and explicit state. No DOM, storage or transport. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Nomad360V1State=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(input){
const {productSource,productOwnChoices,productLogisticsPayers,productImportPayers,productionLaborMode,latestMaterialsLandedUnitCost,latestProductionUnitCost,latestLogisticsUnitCost,currentProductSequence,productName,selectedServiceRole,serviceChannel,serviceFinancialMode,serviceAgentPayerChoices,payrollCountryRules,payrollManualOverrides,employerContributionRates,employerPayrollTaxRates,currency,payments,agencyLines,uiState,view,numbers,texts}=input;
        function progressiveTax(amount, brackets) {
            let tax = 0;
            let previousLimit = 0;
            let remaining = Math.max(0, amount);

            for (const [limit, rate] of brackets) {
                const band = Math.max(0, Math.min(remaining, limit - previousLimit));
                tax += band * rate / 100;
                remaining -= band;
                previousLimit = limit;
                if (remaining <= 0) break;
            }
            return tax;
        }
        function productionEmployerChargesForWorker(country, grossMonthly) {
            const gross = Math.max(0, Number(grossMonthly) || 0);
            if (!gross) return 0;

            if (country === 'RU') {
                const rules = payrollCountryRules.RU;
                const annualGross = gross * 12;
                const belowLimit = Math.min(annualGross, rules.employerSocialAnnualLimit);
                const aboveLimit = Math.max(0, annualGross - rules.employerSocialAnnualLimit);
                const socialAnnual =
                    belowLimit * rules.employerSocialBaseRate / 100 +
                    aboveLimit * rules.employerSocialOverLimitRate / 100;
                const injuryAnnual = annualGross * rules.injuryDefaultRate / 100;
                return (socialAnnual + injuryAnnual) / 12;
            }

            const employerSocialRate = Math.max(0, Number(employerContributionRates[country]) || 0);
            const payrollTaxRate = Math.max(0, Number(employerPayrollTaxRates[country]) || 0);
            return gross * (employerSocialRate + payrollTaxRate) / 100;
        }
const productNumber=id=>numbers[id],productNumberFromText=id=>texts[id];
const materialsCostWithVat=()=>input.materialsWithVat;
function snapshot(){
            const expectedServiceUnits=Math.max(0,productNumberFromText('own-product-ad-units'));
            const materialsBatchQty = productSource==='offline-service'?Math.max(1,Math.ceil(expectedServiceUnits)):Math.max(1, Math.floor(productNumber('own-materials-batch-qty') || 1));
            const productionQty = productSource==='offline-service'?Math.max(1,Math.ceil(expectedServiceUnits)):['resale','dropship'].includes(productSource) ? materialsBatchQty : Math.max(1, Math.floor(productNumber('own-production-monthly-qty') || 1));
            const forecastSales=Math.max(0,productNumberFromText('own-product-ad-units'));
            const logisticsQty = ['dropship','offline-service'].includes(productSource) ? Math.max(1,Math.ceil(forecastSales)) : Math.max(1, Math.floor(productNumber('own-logistics-qty') || 1));
            const salesQty = ['dropship','offline-service'].includes(productSource) ? logisticsQty : Math.max(1, Math.floor(productNumber('own-sales-monthly-qty') || 1));

            const warehouseInboundUnitCost =
                productLogisticsPayers.warehouseInbound === 'me'
                    ? productNumber('own-warehouse-inbound-unit-cost')
                    : 0;
            const warehouseStorageUnitCost =
                productLogisticsPayers.warehouse === 'me'
                    ? productNumber('own-warehouse-cost') * Math.max(0, productNumber('own-warehouse-days'))
                    : 0;

            const materialsBase = productNumber('own-materials-cost');
            const materialsWithVat = materialsCostWithVat();
            const vatAdded = Math.max(0, materialsWithVat - materialsBase);
            const inboundDelivery =
                productOwnChoices.inboundIncluded === 'no'
                    ? productNumber('own-inbound-delivery-cost')
                    : 0;
            const imported = productOwnChoices.materialsImported === 'yes';
            const materialsInsurance =
                imported && productImportPayers.cargoInsurance === 'me'
                    ? materialsWithVat * productNumber('own-cargo-insurance-cost') / 100
                    : 0;
            const materialsDuties =
                imported && productImportPayers.duties === 'me'
                    ? productNumber('own-duties-cost')
                    : 0;
            const materialsFixedBatch =
                (imported && productImportPayers.broker === 'me' ? productNumber('own-broker-cost') : 0) +
                (imported && productImportPayers.certification === 'me' ? productNumber('own-certification-cost') : 0);
            const materialsVariableUnit =
                materialsBase + vatAdded + inboundDelivery + materialsInsurance + materialsDuties;

            const agency=productSource==='offline-service'&&selectedServiceRole==='agent'?{
                grossPrice:productNumber('service-agent-partner-price'),
                feePct:productNumber('service-agent-fee-pct'),
                fixedFee:productNumber('service-agent-fee-fixed'),
                partnerVatPct:productNumber('service-agent-partner-vat'),
                partnerTaxType:view.fields['service-agent-partner-tax-type']?.value||'turnover',
                partnerTaxPct:productNumber('service-agent-partner-tax-pct'),
                lineItems:agencyLines.map(line=>({
                    ...line,payer:serviceAgentPayerChoices[line.key]||''
                })),
                // Retain a compatible category shape only for old saved models.
                payers:{}
            }:null;
            const serviceEquipment=productOwnChoices.equipmentPurchase==='yes'?Array.from(view.groups['.equipment-purchase-row']).reduce((total,row)=>{
                const count=Math.max(1,Math.floor(Number(row.fields['.equipment-purchase-qty']?.value)||1));
                const price=Math.max(0,Number(row.fields['.equipment-purchase-cost']?.value)||0);
                const life=Math.max(1,Number(row.fields['.equipment-useful-life']?.value)||1);
                return {capex:total.capex+count*price,amort:total.amort+count*price/life};
            },{capex:0,amort:0}):{capex:0,amort:0};
            const productionFixedMonthly = Math.max(
                0,
                latestProductionUnitCost *
                    Math.max(0.0001, 1 - productNumber('own-production-defect-pct') / 100) *
                    productionQty -
                    (productOwnChoices.productionElectricity === 'yes'
                        ? productNumber('own-production-electricity-tariff') *
                          productNumber('own-production-electricity-usage') *
                          productionQty
                        : 0)
            );
            const productionElectricityPerUnit =
                productOwnChoices.productionElectricity === 'yes'
                    ? productNumber('own-production-electricity-tariff') *
                      productNumber('own-production-electricity-usage')
                    : 0;
            const productionDefectPct = Math.min(99.99, Math.max(0, productNumber('own-production-defect-pct')));

            return {
                id: currentProductSequence,
                name: productName,
                currency: currency,
                businessCurrency: currency,
                payments: payments,
                source: productSource,
                serviceChannel:productSource==='offline-service'?serviceChannel:null,
                serviceRole:productSource==='offline-service'?selectedServiceRole:null,
                serviceAgency:agency,
                serviceFinanceMode:productSource==='offline-service'?serviceFinancialMode:null,
                serviceHorizonMonths:productSource==='offline-service'?Number(view.fields['service-v1-horizon']?.value||12):0,
                serviceCapex:productSource==='offline-service'?serviceEquipment.capex:0,
                serviceAmortMonthly:productSource==='offline-service'?serviceEquipment.amort:0,
                unit: view.fields['product-sales-unit']?.value || (productSource==='offline-service'?'услуга':'шт'),
                materialsUnitCost: latestMaterialsLandedUnitCost,
                materialsVariableUnit,
                materialsFixedBatch,
                materialsBatchQty,
                materialsBatchTotal: latestMaterialsLandedUnitCost * (productSource==='offline-service'?expectedServiceUnits:materialsBatchQty),
                offlineServiceCapacity:productSource==='offline-service'?productNumber('offline-service-monthly-capacity'):0,
                dropshipDeliveryDays:productSource==='dropship'?productNumber('dropship-delivery-days'):0,
                dropshipPayoutLagDays:productSource==='dropship'?productNumber('dropship-payout-lag'):0,
                dropshipPayoutMode:productSource==='dropship'?(view.fields['dropship-payout-mode']?.value||'after'):null,
                productionUnitCost: ['resale','dropship'].includes(productSource) ? 0 : latestProductionUnitCost,
                productionFixedMonthly: ['resale','dropship'].includes(productSource) ? 0 : productSource==='offline-service'?Math.max(0,latestProductionUnitCost*expectedServiceUnits-(productOwnChoices.productionElectricity==='yes'?productNumber('own-production-electricity-tariff')*productNumber('own-production-electricity-usage')*expectedServiceUnits:0)):productionFixedMonthly,
                productionElectricityPerUnit: ['resale','dropship'].includes(productSource) ? 0 : productionElectricityPerUnit,
                productionDefectPct: ['resale','dropship'].includes(productSource) ? 0 : productionDefectPct,
                productionQty,
                productionTotal: ['resale','dropship'].includes(productSource) ? 0 : latestProductionUnitCost * (productSource==='offline-service'?expectedServiceUnits:productionQty),
                logisticsUnitCost: latestLogisticsUnitCost,
                logisticsQty,
                warehouseInboundUnitCost:['dropship','offline-service'].includes(productSource)?0:warehouseInboundUnitCost,
                warehouseDayCost:
                    productLogisticsPayers.warehouse === 'me'
                        ? productNumber('own-warehouse-cost')
                        : 0,
                warehouseStorageUnitCost:['dropship','offline-service'].includes(productSource)?0:warehouseStorageUnitCost,
                customerDeliveryPct:
                    productLogisticsPayers.customerDelivery === 'me'
                        ? productNumber('own-customer-delivery-pct')
                        : 0,
                customerReturnPct:
                    productLogisticsPayers.customerDelivery === 'me'
                        ? productNumber('own-return-rate')
                        : 0,
                warehouseStageTotal: ['dropship','offline-service'].includes(productSource)?0:(warehouseInboundUnitCost + warehouseStorageUnitCost) * logisticsQty,
                salesFixedMonthly: productNumberFromText('own-sales-fixed-monthly'),
                salesFixedPerUnit: productNumberFromText('own-sales-fixed-per-unit'),
                salesQty,
                salesVariablePct: productNumber('own-sales-commission-pct'),
                penaltiesPct: productNumber('own-platform-penalties-pct'),
                adCostPerUnit: productNumberFromText('own-product-ad-cac-unit'),
                forecastUnitsPerMonth: productNumberFromText('own-product-ad-units'),
                adBudget: productNumber('own-product-ad-budget'),
                adManagement: productNumber('own-product-ad-management'),
                adTotal: productNumber('own-product-ad-budget') + productNumber('own-product-ad-management'),
                planning: {
                    supplyDays: '',
                    advancePct: '',
                    advanceLeadDays: '',
                    productionDays: '',
                    targetMarginPct: '',
                    creditRatePct: '',
                    creditTermMonths: '',
                    maxDiscountPct: '',
                    minimumMarginPct: '',
                    reservePct: ''
                },
                inputs: Object.fromEntries(
                    Array.from(view.groups['#product-own-form input[id], #product-own-form select[id], #offline-service-monthly-capacity'])
                        .map(el => [el.id, el.value])
                ),
                uiState: uiState
            };
        
}
function production(){            const offlineForecast=productNumberFromText('own-product-ad-units');
            const qty = productSource==='offline-service'?Math.max(1,offlineForecast):Math.max(1, Math.floor(Number(view.fields['own-production-monthly-qty']?.value) || 1));
            const defectPct = productSource==='offline-service'?0:Math.min(99.99, Math.max(0, productNumber('own-production-defect-pct')));
            const yieldFactor = Math.max(0.0001, 1 - defectPct / 100);

            const premisesMonthly =
                productOwnChoices.productionPremises === 'yes'
                    ? productNumber('own-production-premises-monthly')
                    : 0;

            const equipmentRentalMonthly =
                productOwnChoices.equipmentRental === 'yes'
                    ? Array.from(view.groups['.equipment-rental-row'])
                        .reduce((sum, row) => {
                            const itemQty = Math.max(1, Math.floor(Number(row.fields['.equipment-rental-qty']?.value) || 1));
                            const itemCost = Math.max(0, Number(row.fields['.equipment-rental-cost']?.value) || 0);
                            return sum + itemQty * itemCost;
                        }, 0)
                    : 0;

            const equipmentDepreciationMonthly =
                productOwnChoices.equipmentPurchase === 'yes'
                    ? Array.from(view.groups['.equipment-purchase-row'])
                        .reduce((sum, row) => {
                            const itemQty = Math.max(1, Math.floor(Number(row.fields['.equipment-purchase-qty']?.value) || 1));
                            const cost = Math.max(0, Number(row.fields['.equipment-purchase-cost']?.value) || 0);
                            const life = Math.max(1, Number(row.fields['.equipment-useful-life']?.value) || 1);
                            return sum + itemQty * cost / life;
                        }, 0)
                    : 0;

            const gasMonthly =
                productOwnChoices.productionGas === 'yes'
                    ? productNumber('own-production-gas-tariff') * productNumber('own-production-gas-usage')
                    : 0;

            const electricityPerProducedUnit =
                productOwnChoices.productionElectricity === 'yes'
                    ? productNumber('own-production-electricity-tariff') * productNumber('own-production-electricity-usage')
                    : 0;

            const overheadMonthly =
                productOwnChoices.productionOverheads === 'yes'
                    ? productNumber('own-production-overheads-monthly')
                    : 0;

            const productionWorkersMonthly =
                productionLaborMode === 'workers'
                    ? (() => {
                        const count = Math.max(0, Math.floor(Number(view.fields['own-production-workers-count']?.value) || 0));
                        const grossPerWorker = Math.max(0, Number(view.fields['own-production-worker-gross']?.value) || 0);
                        const country = view.fields['own-production-workers-country']?.value || 'KZ';
                        const grossTotal = count * grossPerWorker;
                        const chargesTotal = count * productionEmployerChargesForWorker(country, grossPerWorker);
                        return grossTotal + chargesTotal;
                    })()
                    : 0;

            const fixedMonthly =
                premisesMonthly +
                equipmentRentalMonthly +
                equipmentDepreciationMonthly +
                gasMonthly +
                productionWorkersMonthly +
                overheadMonthly;

            const fixedPerProducedUnit = fixedMonthly / qty;
            const beforeDefect =
                fixedPerProducedUnit +
                electricityPerProducedUnit;

            const unitCost = beforeDefect / yieldFactor;
            const defectUplift = unitCost - beforeDefect;


return {offlineForecast,qty,defectPct,premisesMonthly,equipmentRentalMonthly,equipmentDepreciationMonthly,gasMonthly,productionWorkersMonthly,overheadMonthly,electricityPerProducedUnit,unitCost,defectUplift};
}
function logistics(){
            const warehouseInboundIsMine = !['dropship','offline-service'].includes(productSource) && productLogisticsPayers.warehouseInbound === 'me';
            const warehouseIsMine = !['dropship','offline-service'].includes(productSource) && productLogisticsPayers.warehouse === 'me';
            const deliveryIsMine = productSource!=='offline-service'&&productLogisticsPayers.customerDelivery === 'me';

            const warehouseInboundPerUnit = warehouseInboundIsMine
                ? productNumber('own-warehouse-inbound-unit-cost')
                : 0;
            const warehouseDayCost = warehouseIsMine ? productNumber('own-warehouse-cost') : 0;
            const warehouseDaysInput = view.fields['own-warehouse-days'];
            const hasWarehouseDays =
                warehouseIsMine &&
                warehouseDaysInput &&
                warehouseDaysInput.value !== '' &&
                Number(warehouseDaysInput.value) >= 0;
            const warehouseDays = hasWarehouseDays ? Math.max(0, Number(warehouseDaysInput.value) || 0) : 0;
            const warehousePerUnit = warehouseDayCost * warehouseDays;

            const costBeforeLogistics = latestMaterialsLandedUnitCost + latestProductionUnitCost;
            const deliveryPct = deliveryIsMine ? productNumber('own-customer-delivery-pct') : 0;
            const returnPct = deliveryIsMine ? productNumber('own-return-rate') : 0;
            const baseDelivery = costBeforeLogistics * deliveryPct / 100;
            const returnDeliveryUplift = baseDelivery * returnPct / 100;
            const deliveryPerUnit = baseDelivery + returnDeliveryUplift;

            const total = warehouseInboundPerUnit + warehousePerUnit + deliveryPerUnit;
            const selectedQty = Math.max(1, Math.floor(Number(view.fields['own-logistics-qty']?.value) || 1));
            const selectedTotal = total * selectedQty;


return {warehouseIsMine,hasWarehouseDays,warehouseInboundPerUnit,warehousePerUnit,baseDelivery,returnDeliveryUplift,total,selectedTotal};
}
function sales(){
            const payrollMonthly =
                productOwnChoices.payroll === 'yes'
                    ? productNumber('own-payroll-rewards')
                    : 0;

            // The employee block's gross salary is the basis for statutory calculations.
            // To avoid double-counting salary when it is already entered above as payroll/rewards,
            // only employer-side mandatory charges are added here.
            const employerMandatory =
                productOwnChoices.employees === 'yes'
                    ? productNumberFromText('own-employer-mandatory-total-estimate')
                    : 0;

            const fixedMonthly = payrollMonthly + employerMandatory;
            const isService=productSource==='offline-service';
            // Never read the service quantity from an editable sales field:
            // sales, production and the financial snapshot use one funnel forecast.
            const forecast=isService?productNumberFromText('own-product-ad-units'):0;
            const monthlySalesQty=isService?forecast:
                Math.max(1,Math.floor(Number(view.fields['own-sales-monthly-qty']?.value)||1));
            const fixedPerUnit=monthlySalesQty>0?fixedMonthly/monthlySalesQty:NaN;
            const commissionPct =
                productOwnChoices.salesCommission === 'yes'
                    ? productNumber('own-sales-commission-pct')
                    : 0;
            const penaltiesPct =
                productOwnChoices.platformPenalties === 'yes'
                    ? productNumber('own-platform-penalties-pct')
                    : 0;
            const variableTotalPct = commissionPct + penaltiesPct;


return {fixedMonthly,fixedPerUnit,commissionPct,penaltiesPct,variableTotalPct};
}
function workers(){
            const enabled = productionLaborMode === 'workers';
            const count = enabled
                ? Math.max(0, Math.floor(Number(view.fields['own-production-workers-count']?.value) || 0))
                : 0;
            const grossPerWorker = enabled
                ? Math.max(0, Number(view.fields['own-production-worker-gross']?.value) || 0)
                : 0;
            const country = view.fields['own-production-workers-country']?.value || 'KZ';

            const grossTotal = count * grossPerWorker;
            const chargesPerWorker = productionEmployerChargesForWorker(country, grossPerWorker);
            const chargesTotal = count * chargesPerWorker;
            const total = grossTotal + chargesTotal;

            const values = {
                'own-production-workers-gross-total': grossTotal,
                'own-production-workers-taxes-total': chargesTotal,
                'own-production-workers-total': total
            };


return {country,values};
}
function employees(){
            const count = Math.max(0, Number(view.fields['own-employees-count']?.value) || 0);
            const salary = Math.max(0, Number(view.fields['own-employee-salary']?.value) || 0);
            const gross = count * salary;
            const code = view.fields['own-insurance-country']?.value || 'KZ';

            const contributionRate = Math.max(0, Number(view.fields['own-insurance-contribution-pct']?.value) || 0);
            const employerTaxRate = Math.max(0, Number(view.fields['own-employer-payroll-tax-pct']?.value) || 0);
            const injuryRate = Math.max(0, Number(view.fields['own-employer-injury-pct']?.value) || 0);
            const employerOtherRate = Math.max(0, Number(view.fields['own-employer-other-pct']?.value) || 0);
            const fixedPerEmployee = Math.max(0, Number(view.fields['own-employer-fixed-per-employee']?.value) || 0);

            const employeeTaxRate = Math.max(0, Number(view.fields['own-employee-income-tax-pct']?.value) || 0);
            const employeeWithholdingRate = Math.max(0, Number(view.fields['own-employee-withholding-pct']?.value) || 0);
            const employeeOtherWithholdingRate = Math.max(0, Number(view.fields['own-employee-other-withholding-pct']?.value) || 0);

            let employerContributions = gross * contributionRate / 100;
            let employeeIncomeTax = gross * employeeTaxRate / 100;

            if (code === 'RU' && count > 0) {
                const rules = payrollCountryRules.RU;
                const annualSalaryPerEmployee = salary * 12;

                if (!payrollManualOverrides.employerSocial) {
                    const belowLimit = Math.min(annualSalaryPerEmployee, rules.employerSocialAnnualLimit);
                    const aboveLimit = Math.max(0, annualSalaryPerEmployee - rules.employerSocialAnnualLimit);
                    const annualEmployerSocialPerEmployee =
                        belowLimit * rules.employerSocialBaseRate / 100 +
                        aboveLimit * rules.employerSocialOverLimitRate / 100;
                    employerContributions = annualEmployerSocialPerEmployee / 12 * count;
                }

                if (!payrollManualOverrides.employeeIncomeTax) {
                    const annualPitPerEmployee = progressiveTax(annualSalaryPerEmployee, rules.employeeIncomeTaxBrackets);
                    employeeIncomeTax = annualPitPerEmployee / 12 * count;
                }
            }

            const employerPayrollTax = gross * employerTaxRate / 100;
            const employerInjury = gross * injuryRate / 100;
            const employerOther = gross * employerOtherRate / 100;
            const employerFixed = count * fixedPerEmployee;
            const employerMandatoryTotal =
                employerContributions +
                employerPayrollTax +
                employerInjury +
                employerOther +
                employerFixed;
            const employerTotalCost = gross + employerMandatoryTotal;

            const employeeSocialWithheld = gross * employeeWithholdingRate / 100;
            const employeeOtherWithheld = gross * employeeOtherWithholdingRate / 100;
            const employeeNet = Math.max(0, gross - employeeIncomeTax - employeeSocialWithheld - employeeOtherWithheld);

            const values = {
                'own-payroll-gross-estimate': gross,
                'own-insurance-monthly-estimate': employerContributions,
                'own-employer-payroll-tax-estimate': employerPayrollTax,
                'own-employer-injury-estimate': employerInjury,
                'own-employer-other-estimate': employerOther,
                'own-employer-fixed-estimate': employerFixed,
                'own-employer-mandatory-total-estimate': employerMandatoryTotal,
                'own-employer-total-cost-estimate': employerTotalCost,
                'own-employee-net-estimate': employeeNet
            };


return {values};
}
return {snapshot,production,logistics,sales,workers,employees,progressiveTax,productionEmployerChargesForWorker};
}
return Object.freeze({create});
});
