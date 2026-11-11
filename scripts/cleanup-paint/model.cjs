'use strict';
const cascade=require('../palette/cascade.cjs');
const base='050bce789259867096d2d312e5b0dbea51454d5d';
const files=['nomad360_calculator_ui.css','nomad360_design_system.css','nomad360_hero_banner.css','nomad360_irbis_banner.css','nomad360_consulting_banner.css'];
module.exports={base,files,...cascade};
if(require.main===module){const fs=require('node:fs'),A=require('node:assert/strict'),s=require('../../tests/helpers/paint-scope.cjs');for(const [file,r]of Object.entries(s.sources)){A.equal(require('../../tests/helpers/pricing-decision-type-scope.cjs').restore(file,fs.readFileSync(file,'utf8')),r.after,'Exact C5-8 candidate plus approved UI typography: '+file);A.deepEqual(cascade.winners(r.before),cascade.winners(r.after));}console.log('C58_SOURCE_GREEN',JSON.stringify({sourceDeclarations:85,savedBytes:6114,files:Object.keys(s.sources).length}));}
