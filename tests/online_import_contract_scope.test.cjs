'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),manifest=require('../docs/reviews/online-contract-maintenance-01/source-hashes.json');
test('all accepted root runtime files and both archived RED suites remain byte-identical',()=>{
 A.equal(manifest.base,'6e3810befffb4f50767d879fd3715cecce2096a7');A.ok(Object.keys(manifest.files).length>50);
 for(const [file,hash]of Object.entries(manifest.files))A.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,file);
});
