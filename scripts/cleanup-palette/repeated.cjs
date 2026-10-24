'use strict';
const fs=require('node:fs'),path=require('node:path'),A=require('node:assert/strict'),H=require('../../tests/helpers/task10-palette.cjs'),{route}=require('./scenarios.cjs');
const out=path.resolve(process.argv[2]||'artifacts/cleanup-c4'),baseline=process.env.C4_BASELINE_ROOT;
(async()=>{
 A.ok(baseline);const servers={before:await H.serve(baseline),after:await H.serve()},browser=await H.launch(),cases=[];
 try{
  for(const width of [320,360,390,430,768,1280])for(const language of ['ru','en','kk']){
   const pair={};
   for(const variant of ['before','after']){
    const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'}),page=await context.newPage(),client=await context.newCDPSession(page);await client.send('Performance.enable');
    await H.ready(page,servers[variant].base,'Marketing_calc.HTML?lang='+language+'&demo=shopper&finance=cash');await page.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true');
    // Match runtime-audit-01's complete route priming, including lazily mounted dialogs.
    for(const kind of ['v1','home','resale','dropship','standalone','linked','full-service','simple-self','simple-hired','simple-agent','offline','footer','partner','bug']){
     if(['resale','dropship'].includes(kind))await page.evaluate(source=>{showProductBranch();selectProductSource(source);},kind);
     else if(kind==='footer'){await route(page,'home');await page.locator('[data-nomad-embed-toggle]').click();await page.evaluate(()=>document.querySelectorAll('#nomad360-footer details').forEach(e=>e.open=true));}
     else if(['partner','bug'].includes(kind)){await route(page,'home');await page.locator(kind==='partner'?'#nomad360-partner-trigger':'#nomad360-bug-launcher').click();await page.keyboard.press('Escape');}
     else await route(page,kind);
     await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    }
    await route(page,'standalone');await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const samples=[];
    for(let repeat=0;repeat<5;repeat++){
     await route(page,'home');await route(page,'standalone');await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     await client.send('HeapProfiler.collectGarbage');const m=Object.fromEntries((await client.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
     samples.push({listeners:m.JSEventListeners,heapBytes:m.JSHeapUsedSize,domNodes:await page.locator('body *').count()});
    }
    A.equal(new Set(samples.map(s=>s.listeners)).size,1,'No listener growth across five home/V2 renders: '+JSON.stringify(samples));A.equal(new Set(samples.map(s=>s.domNodes)).size,1,'No DOM growth');pair[variant]=samples;await context.close();
   }
   A.deepEqual(pair.before.map(s=>[s.listeners,s.domNodes]),pair.after.map(s=>[s.listeners,s.domNodes]));cases.push({width,language,...pair});console.log('C4_REPEAT_CASE_GREEN',width,language);
  }
  fs.writeFileSync(path.join(out,'repeated-navigation.json'),JSON.stringify({base:require('../../tests/helpers/cleanup-palette-scope.cjs').base,cases},null,2)+'\n');console.log('C4_REPEAT_GREEN',JSON.stringify({pairs:cases.length,roundTripsPerVariant:5}));
 }finally{await browser.close();await Promise.all(Object.values(servers).map(s=>s.close()));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
