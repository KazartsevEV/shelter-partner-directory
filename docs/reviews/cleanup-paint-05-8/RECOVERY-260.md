# Recovery incident #260 — isolated trigger and fixture correction

Date: 2026-10-25. Base: main `72221d1`. Application code, financial formulas, draft keys, validators and payload formats are unchanged. This is a correction to browser-test setup, not a replacement storage backend.

## Evidence and causal isolation

The original real first-user journey failed twice in 15 instrumented runs. Before navigation its V1 draft had5079 characters and was valid; at document-start of the next identical file URL it was already absent, before calculator scripts ran. Traced application storage calls contained the expected save and no removal or clear. The recovery card was correctly hidden because the draft did not exist; neither CSS visibility nor validator rejection caused this failure.

A minimal empty HTML file, without any calculator code, reproduced the loss. Fresh browser contexts each wrote a5079-character synthetic value through normal `page.evaluate` after navigation, navigated to the same file again and read it. The initial three groups used the same browser, payload, URL and assertions; only document-start initialization differed:

| Document-start hook | Runs | Lost draft |
| --- | --- | --- |
| None | 200 | 0 |
| Hook setting an ordinary window variable | 200 | 0 |
| Hook calling `localStorage.setItem` for a different language key | 200 | 23 |
| Separate hook only reading `localStorage` | 200 | 12 |

The CDP storage key was `file:///` before and after in all cases. The surviving language key and missing independent synthetic draft demonstrate collateral storage loss under that setup. Reading the saved key early as diagnostic instrumentation can itself participate in the problem: a read-first guard and delayed writes were tested and did not reliably eliminate it. They are not used as fixes.

This isolates the trigger to early Web Storage access in the Chromium file-scheme test environment. It does not establish Chromium's internal IPC/cache defect or make a claim about all browsers. No application deletion path is involved, and no product data-loss defect independent of that test setup has been demonstrated here. Raw outcomes are in [recovery-260-minimal.json](recovery-260-minimal.json); all runs are experimental observations, not automatic retries of failed CI.

A second, interleaved experiment rotated all four conditions in one browser to control for execution order and browser age (100 fresh contexts each): {'none': {'n': 100, 'loss': 0}, 'noop': {'n': 100, 'loss': 0}, 'early-read': {'n': 100, 'loss': 8}, 'early-write': {'n': 100, 'loss': 11}}. Control groups again had zero losses. Playwright1.58.0 / Chromium145.0.7632.6, Linux. The separate early-read experiment confirms that instrumentation must not access Storage at document-start either.

## Correction

The affected fixtures already create native `ru-RU` browser contexts. The actual UI selects the supported native language when no stored preference exists. Their old unconditional document-start writers were unnecessary and their comments incorrectly claimed native locale did not select Russian. Remove27 such writers across25 file-scheme fixtures; leave all user actions, monetary oracles, exact stored-byte/validator checks, error collection and timeouts unchanged.

The separate saved-preference UI test still tests preference overriding native language: it now saves a preference through the real language selector on a normally loaded setup page, then opens its test page. It does not write or restore any financial draft, and installs no document-start storage hook.

No sleeps, retries, weakened assertions, validator relaxation, fallback draft injection, storage-key migration or runtime change are introduced. A guard around the early setter would not have fixed the observed behavior and was explicitly rejected by the controls.

## Validation

- Original first-user journey after correction:12 full independent runs,12 PASS, no failed run retried. Includes two SKU save/restore, explicit resume, fresh start preserving the save, real deletion and all original assertions.
- Original full-service/agent browser regression: PASS, exact saved raw bytes and validated state survive reload; original PDF and financial comparisons remain enabled.
- Saved-locale override / RU-EN-KK UI regression: PASS, all existing assertions retained.
- A deterministic source-boundary regression rejects the old early-locale hooks in file fixtures (26 original file-fixture files fail this guard); HTTP-only preference fixtures remain allowed.
- Draft-store unit tests and SEO source scope: PASS.
- Final CI and PR acceptance remain required. #260 stays open until the fix is accepted/merged; old diagnostic #259 is not treated as a runtime fix.

## Standalone reproduction

Run with the repository's pinned Playwright/Chromium. It creates a synthetic temporary empty file and logs only metadata; no real calculation is used. No group is retried until success, and the positive-trigger group remains an observation rather than an assertion required to fail probabilistically in normal CI.

```js
const {chromium}=require('playwright'),fs=require('fs');const {pathToFileURL}=require('url');
(async()=>{fs.writeFileSync(require('path').join(require('os').tmpdir(),'nomad260-storage-repro.html'),'<!doctype html><title>storage isolation</title>');const url=pathToFileURL(require('path').join(require('os').tmpdir(),'nomad260-storage-repro.html')).href,b=await chromium.launch({args:['--no-sandbox']});let all=[];
for(const localeInit of ["none","noop","early-write"])for(let n=0;n<200;n++){const c=await b.newContext();if(localeInit==='early-write')await c.addInitScript(()=>localStorage.setItem('nomad360PreferredLanguage','ru'));else if(localeInit==='noop')await c.addInitScript(()=>{window.testBootstrap=true});const p=await c.newPage();await p.goto(url);const cd=await c.newCDPSession(p);const sk=async()=>{const t=await cd.send('Page.getFrameTree');return cd.send('Storage.getStorageKeyForFrame',{frameId:t.frameTree.frame.id});};const beforeKey=await sk();await p.evaluate(()=>localStorage.setItem('testdraft','x'.repeat(5079)));await p.goto(url);const result=await p.evaluate(()=>({len:localStorage.getItem('testdraft')?.length,keys:Object.keys(localStorage)}));const afterKey=await sk();all.push({localeInit,n,...result,beforeKey,afterKey});if(!result.len)console.log('MINIMAL_LOSS',JSON.stringify(all.at(-1)));await c.close();}
fs.writeFileSync('recovery-260-factorial.json',JSON.stringify(all,null,2));console.log('MINIMAL_TOTAL',all.length,'lost',all.filter(x=>!x.len).length);await b.close();})();

```
