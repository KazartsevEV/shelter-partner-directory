const {test}=require('node:test');
const A=require('node:assert/strict');
const {normalizeTraffic}=require('../scripts/update_github_repo_traffic.cjs');
test('GitHub Insights: publish only one unique visitor metric, no extra metrics',()=>{
 const fixed=new Date('2026-10-10T15:00:00.000Z');
 const output=normalizeTraffic({count:417,uniques:63,views:[{timestamp:'2026-10-10T00:00:00Z',count:4,uniques:2}]},fixed);
 A.deepEqual(output,{
   status:'ok',source:'github-repository-traffic',
   repository:'KazartsevEV/shelter-partner-directory',
   updatedAt:'2026-10-10T15:00:00.000Z',visitors14:63
 });
 A.equal(Object.hasOwn(output,'views14'),false);
 A.equal(Object.hasOwn(output,'views7'),false);
 A.equal(Object.hasOwn(output,'sessions'),false);
 A.throws(()=>normalizeTraffic({count:5}),/valid unique visitor count/);
 A.throws(()=>normalizeTraffic({uniques:-1}),/valid unique visitor count/);
});
