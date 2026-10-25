'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const base='5ebf83374d553250b6721c94de4c0f1400bbfb7d';
const allow=new Set([
 'scripts/security/turnstile.cjs','scripts/security/edge-proof.cjs',
 'scripts/security/policy.cjs','scripts/security/admission.cjs','scripts/security/redis-store.cjs',
 'tests/sec01_admission.test.cjs','tests/sec01_redis.test.cjs','tests/sec01_scope.test.cjs',
 'docs/security/SEC-01.md','docs/security/sec01-edge-policy.sample.json',
 'docs/nomad360-production-readiness-plan.md','docs/nomad360-codex-task-map.md',
 '.github/workflows/sec01-security.yml','scripts/seo/check_phase_a.py'
]);
const production=['Marketing_calc.HTML','US_Retail_Demo.HTML','index.html',
 'nomad360_partner_application.js','nomad360_partner_transport.js',
 'nomad360_v1_engine.js','nomad360_v1_operations.js','nomad360_v1_state.js',
 'nomad360_palette.css','nomad360_calculator_ui.css',
 '.github/workflows/static.yml','.github/workflows/deploy-static.yml'];
test('SEC-01 PR cannot alter an application, its public publisher or unrelated resources',()=>{
 const changed=execFileSync('git',['diff','--name-only',base,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 A.ok(changed.length>4);
 for(const name of changed)A.ok(allow.has(name),'not SEC-01 scope: '+name);
 for(const name of production){
  const old=execFileSync('git',['show',base+':'+name],{maxBuffer:24e6});
  A.deepEqual(fs.readFileSync(name),old,'unexpected production modification: '+name);
 }
});
test('no security secret or server-side module is linked from current production HTML',()=>{
 for(const file of ['Marketing_calc.HTML','US_Retail_Demo.HTML','nomad360_partner_transport.js']){
  const s=fs.readFileSync(file,'utf8');
  A.doesNotMatch(s,/scripts\/security\//);
  A.doesNotMatch(s,/challenges\.cloudflare\.com\/turnstile/);
 }
 const edges=require('../docs/security/sec01-edge-policy.sample.json');
 A.equal(edges.status,'PREPARATION_ONLY_NOT_DEPLOYABLE');
 A.deepEqual(edges.privateOnlyOperations,['prepare_zip','deliver_zip']);
 A.equal(edges.publicRoutes.length,3);
});
