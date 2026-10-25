'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),{verify}=require('../../tests/shopper_v1_oracle.cjs');
const root=path.resolve(__dirname,'../..'),config=require('./pages.json'),out=path.join(root,'artifacts/seo-phase-b');fs.mkdirSync(out,{recursive:true});
const snap=()=>({currency:Nomad360Currency.get(),product:productPortfolio[0],model:calculateProductPortfolio(),cash:calculateProductCashFlow(calculateProductPortfolio()),cycle:aggregatePlanMetrics(productPortfolio[0]),credit:calculateAggregateCredit(productPortfolio[0]),priceList:calculatePriceListRange(productPortfolio[0])});
(async()=>{
 const server=http.createServer((req,res)=>{
  let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!name.startsWith(config.basePath)){res.writeHead(404);return res.end();}
  name=name.slice(config.basePath.length);if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.HTML':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port,base=origin+config.basePath;
 const local=url=>url.replace(config.origin,origin);
 const browser=await chromium.launch({headless:true}),pages=[],handoff=[],demos=[],downloads=[];
 try{
 for(const record of require('./build_pages.cjs').generate().pages)for(const width of [320,360,390,430,768,1280,1440]){
  const ctx=await browser.newContext({javaScriptEnabled:false,viewport:{width,height:900}}),p=await ctx.newPage(),requests=[];
  p.on('request',r=>requests.push(r.url()));const response=await p.goto(local(record.canonicalUrl));A.equal(response.status(),200);
  const source=await response.text();A.ok(source.includes(record.h1));A.doesNotMatch(source,/<script\b/i);
  A.equal(await p.title(),record.title);A.equal(await p.locator('html').getAttribute('lang'),record.locale);A.equal(await p.locator('h1').count(),1);A.equal(await p.locator('h1').textContent(),record.h1);
  A.equal(await p.locator('link[rel=canonical]').count(),1);A.equal(await p.locator('link[rel=canonical]').getAttribute('href'),record.canonicalUrl);
  A.equal(await p.locator('meta[name=description]').getAttribute('content'),record.description);
  A.equal(await p.locator('link[hreflang]').count(),3);for(const lang of ['en','ru','kk'])A.equal(await p.locator('link[hreflang='+lang+']').getAttribute('href'),record.canonicalUrl.replace('/'+record.locale+'/','/'+lang+'/'));
  A.equal(await p.locator('a.cta').getAttribute('href'),record.primaryCtaHref);
  const logo=await p.locator('img').evaluateAll(es=>es.map(e=>({src:e.currentSrc,loaded:e.complete&&e.naturalWidth===1024,width:e.getBoundingClientRect().width})));
  A.equal(logo.length,2);A.equal(logo[0].src,logo[1].src);A.ok(logo.every(r=>r.loaded));A.equal(requests.filter(u=>u.endsWith('/nomad360_wolf_open_circle.png')).length,1,'Header/banner must share one image request');
  A.equal(await p.locator('.intro-logo-mask .intro-logo').count(),1,'White circular mask preserves original wolf asset');
  A.equal(await p.locator('.intro-brand-tagline').textContent(),'Sky allows, guys deliver');
  A.equal(await p.locator('.intro-logo-mask').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
  A.ok(await p.locator('.intro-brand-mark').evaluate(e=>getComputedStyle(e).transform!=='none'),'Top banner logo is raised slightly');
  A.ok(requests.every(u=>u.startsWith(origin+'/')));A.equal(requests.filter(u=>/\.js(?:\?|$)/.test(u)).length,0);
  A.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await p.keyboard.press('Tab');A.equal(await p.locator('.skip-link').evaluate(e=>e===document.activeElement),true);
  await p.locator('.skip-link').evaluate(e=>e.blur());
  const links=await p.locator('a[href]').evaluateAll(es=>es.map(e=>e.href));
  for(const href of links){const target=new URL(href);if(target.hash==='#main')continue;const res=await p.request.get(local(href));A.equal(res.status(),200,href);if(target.hash&&target.pathname.endsWith('Marketing_calc.HTML'))A.ok(['#nomad360-selling-choice','#nomad360-embed','#nomad360-data','#nomad360-license'].includes(target.hash));}
  if([390,1280].includes(width)){
   // Chromium occasionally rejects capture of a fully loaded static page;
   // re-attempt the *same* required full-page screenshot, never skip it.
   const target=path.join(out,record.id+'-'+width+'.png');
   for(let attempt=0;attempt<3;attempt++){
    try{await p.screenshot({path:target,fullPage:true});break;}
    catch(err){
     if(attempt===2||!/Page\.captureScreenshot|Unable to capture screenshot/i.test(String(err)))throw err;
     await p.waitForTimeout((attempt+1)*250);
    }
   }
   A.ok(fs.existsSync(target)&&fs.statSync(target).size>0,'Required SEO screenshot is missing: '+target);
  }
  pages.push({id:record.id,width,sourceBytes:Buffer.byteLength(source),requests:requests.length,sharedLogo:true,javaScript:false});await ctx.close();
 }
 async function applicationContext(stored='ru',blocked=false){
  const ctx=await browser.newContext({locale:'kk-KZ',viewport:{width:390,height:1000},acceptDownloads:true});
  await ctx.addInitScript(({stored,blocked})=>{if(blocked){Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});}else localStorage.setItem('nomad360PreferredLanguage',stored);},{stored,blocked});
  await ctx.route(/^https?:\/\//,r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  return ctx;
 }
 for(const blocked of [false,true])for(const lang of ['en','ru','kk']){
  const ctx=await applicationContext(lang==='ru'?'en':'ru',blocked),p=await ctx.newPage();
  await p.goto(base+'Marketing_calc.HTML?lang='+lang+'#nomad360-selling-choice');await p.waitForFunction(l=>window.Nomad360UI?.getLanguage()===l,lang);
  A.equal(await p.locator('#nomad360-lang-select').inputValue(),lang);handoff.push({lang,blockedStorage:blocked});await ctx.close();
 }
 for(const bad of ['', 'xx', 'EN']){const ctx=await applicationContext('ru'),p=await ctx.newPage();await p.goto(base+'Marketing_calc.HTML?lang='+bad);A.equal(await p.evaluate(()=>Nomad360UI.getLanguage()),'ru');handoff.push({invalid:bad,preservedStored:true});await ctx.close();}
 for(const lang of ['en','ru','kk'])for(const finance of ['cash','credit']){
  const ctx=await applicationContext('ru'),p=await ctx.newPage();await p.goto(base+'Marketing_calc.HTML?lang='+lang+'&demo=shopper&finance='+finance+'#product-screen');
  await p.waitForFunction(()=>document.getElementById('product-demo-banner')?.dataset.demoReady==='true'&&productPortfolio.length===1&&calculateProductCashFlow(calculateProductPortfolio()).ready);
  A.equal(await p.evaluate(()=>Nomad360UI.getLanguage()),lang);const data=await p.evaluate(snap);verify(data,finance);
  const before=await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k!=='nomad360PreferredLanguage')));
  await p.locator('#nomad360-lang-select').selectOption(lang==='ru'?'en':'ru');
  A.deepEqual(await p.evaluate(snap),data);A.deepEqual(await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k!=='nomad360PreferredLanguage'))),before);
  let url=new URL(p.url());A.equal(url.searchParams.get('demo'),'shopper');A.equal(url.searchParams.get('finance'),finance);A.equal(url.hash,'#product-screen');
  if(finance==='cash'){
   await p.evaluate(()=>showHome());await p.locator('[data-nomad-embed-toggle]').click();const wait=p.waitForEvent('download');await p.locator('[data-nomad-download-html]').click();const d=await wait;A.equal(await d.failure(),null);const html=fs.readFileSync(await d.path(),'utf8');A.match(html,/data-nomad-bundled="\.\/nomad360_seo_language.js"/);A.doesNotMatch(html,/<script src="\.\/nomad360_seo_language.js"/);
   A.equal(await p.locator('[data-nomad-embed-retry]').isVisible(),true);
   const filename='portable-'+lang+'.html';fs.writeFileSync(path.join(out,filename),html);
   const saved=await ctx.newPage();await saved.goto(base+'artifacts/seo-phase-b/'+filename+'?lang='+lang);A.equal(await saved.evaluate(()=>Nomad360UI.getLanguage()),lang);await saved.close();fs.unlinkSync(path.join(out,filename));
   downloads.push({lang,bytes:Buffer.byteLength(html),bundledLanguage:true,portableLanguage:true});
  }
  demos.push({lang,finance,oracle:true,languagePreservesModelAndStorage:true});await ctx.close();
 }
 const ctx=await applicationContext('ru');
 // Exercise actual published hrefs on one simulated deployment origin.
 await ctx.route(config.origin+'/**',async r=>{const response=await ctx.request.get(local(r.request().url()));await r.fulfill({response});});
 const p=await ctx.newPage();await p.goto(config.origin+config.basePath+'en/');await p.locator('a.cta').click();await p.waitForFunction(()=>window.Nomad360UI?.getLanguage?.()==='en');
 for(const id of ['nomad360-selling-choice','nomad360-embed','nomad360-data','nomad360-license'])A.equal(await p.locator('#'+id).count(),1);
 await p.locator('#start-multi-portfolio').click();await p.locator('[data-p2-path="skus.0.name"]').fill('Мой Қап #=1');await p.locator('[data-p2-path="skus.0.unitCost"]').fill('35');await p.locator('[data-p2-path="skus.0.unitCost"]').blur();
 const draft=await p.evaluate(()=>PortfolioV2UI.getState());
 await p.locator('#nomad360-lang-select').selectOption('kk');A.deepEqual(await p.evaluate(()=>PortfolioV2UI.getState()),draft);
 await p.goto(config.origin+config.basePath+'en/pricing/');await p.locator('a.cta').click();await p.locator('#start-multi-portfolio').click();A.deepEqual(await p.evaluate(()=>PortfolioV2UI.getState()),draft);
 A.equal(new URL(p.url()).searchParams.get('lang'),'en');await ctx.close();
 fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({pages,handoff,demos,downloads,actualCtaAndDraftRestoration:true},null,2));console.log('SEO_PHASE_B_GREEN',JSON.stringify({pages:pages.length,handoff:handoff.length,demos:demos.length,downloads:downloads.length,draftRestore:true}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
