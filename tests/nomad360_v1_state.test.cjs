'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
const S=require('../nomad360_v1_state.js'),scope=require('./helpers/v1-state-scope.cjs');
const source=cp.execFileSync('git',['show',scope.manifest.base+':Marketing_calc.HTML'],{encoding:'utf8',maxBuffer:2e6});
const helper=n=>source.slice(source.indexOf('        function '+n+'('),source.indexOf('\n        function ',source.indexOf('        function '+n+'(')+1));
const names=['snapshot','production','logistics','sales','workers','employees'];
function freeze(x){if(x&&typeof x==='object'){Object.freeze(x);Object.values(x).forEach(freeze);}return x;}
const plain=x=>JSON.stringify(x,(k,v)=>typeof v==='number'&&!Number.isFinite(v)?String(v):v);
test('state module contains no DOM, storage, network or mutable global reads',()=>{
 const s=fs.readFileSync('nomad360_v1_state.js','utf8');A.equal(scope.hash(s),scope.manifest.moduleSha256);
 A.doesNotMatch(s,/\b(document|window|localStorage|sessionStorage|fetch|XMLHttpRequest|navigator)\b/);
 for(const [file,e]of Object.entries(scope.manifest.files))A.equal(scope.restore(file,fs.readFileSync(file,'utf8')),cp.execFileSync('git',['show',scope.manifest.base+':'+file],{encoding:'utf8',maxBuffer:2e6}));
});
test('all six preparations match accepted arithmetic and snapshot structure without mutating inputs',()=>{
 let checks=0;
 for(let i=0;i<80;i++)for(let j=0;j<names.length;j++){
  const api=names[j],[body,after]=scope.manifest.files['Marketing_calc.HTML'].replacements[j+1];
  const schema=JSON.parse(after.match(/v1StateInput\((\{.*?\})[,)]/)[1]);
  const input={productSource:['own','resale','dropship','offline-service'][i%4],productOwnChoices:{},productLogisticsPayers:{},productImportPayers:{},productionLaborMode:i%2?'workers':'self',latestMaterialsLandedUnitCost:17.35,latestProductionUnitCost:8.73,latestLogisticsUnitCost:3,currentProductSequence:1,productName:'Қазақша · cotton',selectedServiceRole:i%3?'self':'agent',serviceChannel:'offline',serviceFinancialMode:'full',serviceAgentPayerChoices:{},payrollCountryRules:{RU:{employerSocialAnnualLimit:2000000,employerSocialBaseRate:30,employerSocialOverLimitRate:15.1,injuryDefaultRate:0.2,employeeIncomeTaxBrackets:[[2400000,13],[Infinity,15]]}},payrollManualOverrides:{},employerContributionRates:{KZ:17.5},employerPayrollTaxRates:{KZ:0},currency:'KZT',payments:{},agencyLines:[],uiState:{},view:{fields:{},groups:{}},numbers:{},texts:{},materialsWithVat:22.4};
  for(const k of ['productionPremises','equipmentRental','equipmentPurchase','productionGas','productionElectricity','productionOverheads','payroll','employees','salesCommission','platformPenalties','inboundIncluded','materialsImported'])input.productOwnChoices[k]=i%2?'yes':'no';
  for(const k of ['warehouse','warehouseInbound','customerDelivery'])input.productLogisticsPayers[k]=i%2?'me':'supplier';
  for(const k of ['broker','cargoInsurance','duties','certification'])input.productImportPayers[k]=i%3?'me':'supplier';
  for(const id of schema.fields)input.view.fields[id]={value:id.includes('country')?(i%2?'RU':'KZ'):String(i%5===0?0:12.35)};
  for(const id of schema.numbers)input.numbers[id]=i%7===0?NaN:13.75;
  for(const id of schema.texts)input.texts[id]=i%5?12.35:0;
  for(const sel of schema.groups)input.view.groups[sel]=sel.includes('equipment')?[1,2].map(n=>({id:'row-'+n,value:String(n),fields:Object.fromEntries(['.equipment-rental-qty','.equipment-rental-cost','.equipment-purchase-qty','.equipment-purchase-cost','.equipment-useful-life'].map(k=>[k,{value:String(k.includes('life')?36:n*13.25)}]))})):[];
  for(const id of ['own-employee-salary','own-production-worker-gross'])if(input.view.fields[id]&&i%2)input.view.fields[id].value='300000';
  freeze(input);const before=plain(input);
  const context={...input,document:{getElementById:id=>input.view.fields[id],querySelectorAll:sel=>input.view.groups[sel].map(row=>({...row,querySelector:key=>row.fields[key]}))},productNumber:id=>input.numbers[id],productNumberFromText:id=>input.texts[id],materialsCostWithVat:()=>input.materialsWithVat,window:{Nomad360Currency:{get:()=>input.currency},Nomad360PaymentUI:{captureV1:()=>input.payments}},nomadPaymentContext:()=>({}),serviceAgencyExpenseLines:()=>input.agencyLines,captureProductOwnUiState:()=>input.uiState};
  vm.createContext(context);vm.runInContext(helper('progressiveTax')+'\n'+helper('productionEmployerChargesForWorker'),context);
  const returned=api==='snapshot'?'': 'return {'+after.match(/const \{([^}]+)\}/)[1]+'};';
  const expected=vm.runInContext('(function(){'+body+'\n'+returned+'})()',context);
  A.equal(plain(S.create(input)[api]()),plain(expected),api+'/'+i);A.equal(plain(input),before);checks++;
 }
 A.equal(checks,480);
});
test('portable projection accepts only the exact module, handler hunks and resource fingerprints',()=>{
 const e=scope.manifest.files['Marketing_calc.HTML'],module=fs.readFileSync('nomad360_v1_state.js','utf8');
 const html=fs.readFileSync('Marketing_calc.HTML','utf8').replace('    <script src="./nomad360_v1_state.js"></script>\n','    <script data-nomad-bundled="./nomad360_v1_state.js">'+module+'</script>\n');
 A.equal(scope.restoreStandalone(html),source);
 A.throws(()=>scope.restoreStandalone(html.replace('function create(input)','function create(wrong)')));
 const resources=[{path:'Marketing_calc.HTML',bytes:e.afterBytes,sha256:e.after},{path:'nomad360_v1_state.js',bytes:Buffer.byteLength(module),sha256:scope.manifest.moduleSha256}];
 A.equal(scope.packageProjection({html,manifest:{resources}}).html,source);
 A.equal(scope.recordProjection({htmlBytes:Buffer.byteLength(html),resources}).htmlBytes,Buffer.byteLength(source));
 A.throws(()=>scope.packageProjection({html,manifest:{resources:[...resources,resources[1]]}}));
 A.throws(()=>scope.packageProjection({html,manifest:{resources:[resources[0],{...resources[1],sha256:'wrong'}]}}));
 A.notEqual(scope.restoreStandalone(html+'unreviewed'),source);
});
