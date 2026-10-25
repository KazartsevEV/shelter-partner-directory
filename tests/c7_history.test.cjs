'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib'),cp=require('node:child_process'),crypto=require('node:crypto');
const data=JSON.parse(z.gunzipSync(fs.readFileSync('docs/reviews/cleanup-history-07/inventory.json.gz'))),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function verifySources(expected,read=file=>fs.readFileSync(file)){
 for(const [file,r]of Object.entries(expected)){const b=read(file);A.equal(b.length,r.bytes);A.equal(hash(b),r.sha256,file);}
}
const oldBrowser=JSON.parse(z.gunzipSync(fs.readFileSync('docs/reviews/runtime-audit-01/runtime-browser.json.gz')));
const expectedSelectors=['notObserved','unsupported'].flatMap(kind=>oldBrowser.selectors[kind].map(selector=>[selector,kind]));
function verifySelectors(rows){A.deepEqual(rows.map(r=>[r.selector,r.historicStatus]),expectedSelectors);}
test('C7 preserves all 104 baseline runtime/assets/entrypoints and both generated downloads',()=>{
 A.equal(data.base,'5ede24e538b044f320ff5f211bb397e8f86de46c');A.equal(Object.keys(data.runtime).length,104);
 cp.execFileSync('git',['diff','--exit-code',data.base,'--',...Object.keys(data.runtime)],{stdio:'pipe'});
 verifySources(data.runtime);
 cp.execFileSync('git',['diff','--exit-code',data.base,'--','docs/reviews/runtime-audit-01/runtime-browser.json.gz','docs/reviews/runtime-audit-01/runtime-inventory.json.gz'],{stdio:'pipe'});
});
test('all historical candidates have explicit non-deletion decisions and provenance',()=>{
 A.equal(data.copies.length,5);for(const row of data.copies){A.equal(row.decision,'retain');A.ok(row.reason);A.ok(row.outgoingLinks);A.equal(row.sha256,hash(fs.readFileSync(row.file)));}
 verifySelectors(data.selectors);A.equal(data.selectors.length,2741);A.equal(data.counts.notObserved,2677);A.equal(data.counts.unsupported,64);A.equal(data.counts.dynamicSelectorAccesses,171);
 for(const row of data.selectors){A.equal(row.decision,'no-new-removal');A.ok(row.reason);A.ok(['notObserved','unsupported'].includes(row.historicStatus));A.ok(Array.isArray(row.currentLiteralTokenWitnesses));}
});
test('public GET observations are recorded separately; 404 is not deletion permission',()=>{
 const live=JSON.parse(fs.readFileSync('docs/reviews/cleanup-history-07/live-urls.json'));
 A.equal(live.observations.length,5);
 for(const row of live.observations){A.ok(row.observedAt);A.ok(row.url.startsWith('https://kazartsevev.github.io/shelter-partner-directory/'));A.ok(row.status||row.error);A.equal(data.copies.find(c=>c.file===row.file).decision,'retain');}
 A.match(live.limits,/not.*permission/);
});
test('unknown runtime and selector removals fail the frozen evidence contract',()=>{
 const bytes=Buffer.from('accepted'),expected={'fixture.html':{bytes:bytes.length,sha256:hash(bytes)}};
 verifySources(expected,()=>bytes);
 A.throws(()=>verifySources(expected,()=>Buffer.from('tampered')));
 A.throws(()=>verifySources(expected,()=>{throw Error('ENOENT');}));
 A.throws(()=>verifySelectors(data.selectors.slice(1)));
 A.throws(()=>verifySelectors([...data.selectors.slice(0,-1),{selector:'.unreviewed',historicStatus:'unsupported'}]));
});
