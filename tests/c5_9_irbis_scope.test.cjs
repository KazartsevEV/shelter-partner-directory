'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {winners}=require('../scripts/cleanup-typical/model.cjs');
const base='050bce789259867096d2d312e5b0dbea51454d5d',file='nomad360_irbis_banner.css';
const before=execFileSync('git',['show',base+':'+file],{encoding:'utf8',maxBuffer:24e6}),after=fs.readFileSync(file,'utf8');
const edits=[
 [' min-height:clamp(472px,40vw,615px);',''],
 ['#nomad360-irbis-banner #nomad360-product-details[open]{width:100%;max-width:100%}',''],
 ['#nomad360-irbis-banner{padding:0 0 10px;min-height:0}','#nomad360-irbis-banner{min-height:0}'],
 ['max-width:100%;font-size:clamp(29px,8vw,42px);line-height:1.14','max-width:100%;line-height:1.14'],
 ['display:block;width:calc(100% + 40px);margin:10px -20px -12px;aspect-ratio:896/614;','display:block;width:calc(100% + 40px);aspect-ratio:896/614;']
];
test('C5-9 exact six IRBIS geometry deletions, nothing else',()=>{
 let candidate=before;for(const [old,next]of edits){A.equal(candidate.split(old).length,2);candidate=candidate.replace(old,next);}
 A.equal(after,candidate);A.equal(Buffer.byteLength(before)-Buffer.byteLength(after),189);
});
test('C5-9 final selector/context/property/priority owners remain identical',()=>A.deepEqual(winners(before),winners(after)));
