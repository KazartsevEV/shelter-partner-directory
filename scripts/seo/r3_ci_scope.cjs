'use strict';
// C5's historical C4/C5 comparisons are valid for style work, not the
// SEO-07 R3 content-only release atop newer approved C6 runtime changes.
// Permit a modern route ONLY for the explicitly reviewed R3 branch, and
// fail closed if ANY production/financial/legacy asset appears in the diff.
const A=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const branch='feature/seo07-r3-locales-generator';
const isR3=process.env.GITHUB_EVENT_NAME==='pull_request'&&process.env.GITHUB_HEAD_REF===branch;
if(isR3){
 const count=cp.execFileSync('git',['rev-list','--parents','-n','1','HEAD'],{encoding:'utf8'}).trim().split(/\s+/).length;
 A.equal(count,3,'Only a synthetic PR test merge (two parents) is accepted for this scoped gate');
 const changed=cp.execFileSync('git',['diff','--name-only','HEAD^1','HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const allowed=new Set([
  '.github/workflows/style-ownership.yml',
  'docs/nomad360-codex-task-map.md',
  'docs/seo/locale-drafts/README.md',
  'docs/reviews/seo-07-r3/REVIEW.md',
  'scripts/seo/build.py','scripts/seo/build_pages.cjs',
  'scripts/seo/test_browser.cjs','scripts/seo/test_locales.cjs',
  'scripts/seo/check_phase_a.py','scripts/seo/r3_ci_scope.cjs',
  'tests/helpers/seo-r3-compat.cjs',
  'tests/partner_build_scope.test.cjs','tests/return_7a_scope.test.cjs',
  'tests/task10_palette_source.test.cjs','tests/style_ownership.test.cjs','sitemap.xml',
  ...['cash-flow','for-consultants','pricing'].map(t=>'docs/seo/locale-drafts/kk/'+t+'.json'),
  ...['en','ru','kk'].flatMap(l=>['','business-idea/','pricing/','cash-flow/','for-consultants/'].map(t=>l+'/'+t+'index.html')),
 ]);
 A.ok(changed.includes('scripts/seo/build_pages.cjs'),'Only the R3 SEO generator may take this path');
 A.ok(changed.includes('sitemap.xml'),'Only the full 15-page SEO release may take this path');
 for(const file of changed)A.ok(allowed.has(file),'Protected/unknown path changed in SEO-only review: '+file);
 // Product, financial, style, storage, legal and stand-alone HTML source files
 // are all blocked by the exact allowlist; no blanket financial exceptions.
 const {generate}=require('./build_pages.cjs');
 const {pages,outputs}=generate();
 A.equal(pages.length,15);
 for(const [file,expected] of Object.entries(outputs)){
  A.equal(fs.readFileSync(file,'utf8'),expected,'Generated artifact mismatch: '+file);
 }
 A.equal((outputs['sitemap.xml'].match(/<url>/g)||[]).length,15);
 console.log('SEO_R3_CI_SCOPE_GREEN',JSON.stringify({changed:changed.length,pages:pages.length,protectedFilesUnchanged:true}));
}
if(process.env.GITHUB_ENV)fs.appendFileSync(process.env.GITHUB_ENV,'SEO_R3_SCOPE='+(isR3?'true':'false')+'\n');
