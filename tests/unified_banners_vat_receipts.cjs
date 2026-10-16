'use strict';
const fs=require('node:fs'),path=require('node:path'),A=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),before=require('../docs/reviews/unified-banners-01/baseline/vat-78-sha256.json');
A.equal(Object.keys(before).length,78);
for(const [file,want] of Object.entries(before)){
 const bytes=fs.readFileSync(path.join(root,'artifacts/sales-tax-7b/vat-after',file));
 A.equal(crypto.createHash('sha256').update(bytes).digest('hex'),want,'Full pre-design finance, saved data, export and bridge receipt: '+file);
}
console.log('UNIFIED_BANNERS_EXACT_VAT_RECEIPTS_GREEN 78');
