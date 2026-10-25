'use strict';
// HELP-SEO-01: frozen production scope. Historical C4/C5 snapshots predate
// accepted releases and are invalid as direct comparisons for content-only Help metadata.
// Original financial tests, actual downloads, VAT, PDF and all source oracles STILL RUN.
const A=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const branch='feature/help-seo-index-20261025';
const enabled=process.env.GITHUB_EVENT_NAME==='pull_request'&&process.env.GITHUB_HEAD_REF===branch;
if(enabled){
 const roots=cp.execFileSync('git',['rev-list','--parents','-n','1','HEAD'],{encoding:'utf8'}).trim().split(/\s+/);
 A.equal(roots.length,3,'This release gate works ONLY with GitHub PR test-merge commits');
 const changed=cp.execFileSync('git',['diff','--name-only','HEAD^1','HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const allowed=new Set([
  '.github/workflows/style-ownership.yml',
  'docs/seo/reviews/help-index-01.md',
  'scripts/seo/build.py','scripts/seo/build_pages.cjs',
  'scripts/seo/help_ci_scope.cjs','scripts/seo/test_locales.cjs',
  'scripts/seo/test_help_index.cjs','scripts/seo/test_browser.cjs',
  'tests/helpers/seo-r3-compat.cjs',
  'sitemap.xml',
  'en/help/index.html','ru/help/index.html','kk/help/index.html'
 ]);
 A.ok(changed.includes('sitemap.xml')&&changed.includes('scripts/seo/build_pages.cjs'),
  'Help indexing gate requires generator and sitemap modifications');
 A.ok(changed.includes('en/help/index.html')&&changed.includes('ru/help/index.html')&&changed.includes('kk/help/index.html'),
  'Cannot silently omit a locale from Help indexing');
 for(const file of changed)A.ok(allowed.has(file),'Unreviewed production/finance or other file changed: '+file);
 const {generate,helpPages}=require('./build_pages.cjs');
 const {cfg,pages,outputs}=generate();
 A.equal(pages.length,15,'All 15 existing thematic SEO records remain');
 A.equal(helpPages(cfg).length,3,'All Help pages must validate before indexing');
 for(const [path,expected] of Object.entries(outputs))A.equal(fs.readFileSync(path,'utf8'),expected,'Generated artifact differs: '+path);
 A.equal((outputs['sitemap.xml'].match(/<url>/g)||[]).length,18);
 A.equal((outputs['sitemap.xml'].match(/<xhtml:link /g)||[]).length,54);
 const restore=require('../../tests/helpers/seo-r3-compat.cjs').restore;
 for(const locale of ['en','ru','kk']){
  const name=locale+'/help/index.html';
  const source=fs.readFileSync(name,'utf8'),original=restore(name,source);
  A.ok(original.includes('<meta name="robots" content="noindex,follow">'));
  A.ok(source.includes('<meta name="robots" content="index,follow">'));
 }
 // In addition to exact diff allowlist, the browser/integration CI below runs
 // original arithmetic, tax, exporter and PDF tests; never bypass those.
 console.log('HELP_SEO_CI_SCOPE_GREEN',JSON.stringify({changed:changed.length,pages:18,protectedFinancialFilesUnchanged:true}));
}
if(process.env.GITHUB_ENV)fs.appendFileSync(process.env.GITHUB_ENV,'HELP_SEO_SCOPE='+(enabled?'true':'false')+'\n');
