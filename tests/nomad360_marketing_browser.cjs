'use strict';
// MKT-L10N-01: exercise the actual page, complete portable HTML and both offers.
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/marketing');
fs.mkdirSync(out,{recursive:true});
const headlines={ru:'Бизнес-калькулятор',en:'Business calculator',kk:'Бизнес-калькулятор'};
const subheads={ru:'Каким бизнесом мне выгодно заниматься?',en:'What kind of business makes financial sense for me?',kk:'Маған қандай бизнеспен айналысқан тиімді?'};
const widths=(process.env.MARKETING_WIDTHS||'320,360,390,430,768,1280,1440').split(',').map(Number);
let portable='';
function audit(){
 const visible=e=>e.getClientRects().length&&!e.closest('[hidden],.hidden');
 const nodes=[...document.querySelectorAll('#nomad360-hero *,#nomad360-for-website *,#nomad360-support *,#nomad360-license *')].filter(visible);
 const bad=nodes.filter(e=>e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).filter(e=>{const s=getComputedStyle(e);return parseFloat(s.fontSize)<14||!['400','500','600','700'].includes(s.fontWeight)}).map(e=>({tag:e.tagName,text:e.textContent.slice(0,80),font:getComputedStyle(e).font}));
 return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,bad,gaps:Nomad360LocaleCore.auditVisibleGaps(),diagnostics:Nomad360LocaleCore.diagnostics()};
}
async function settle(page){await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(180);}
(async()=>{
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  if(name==='/portable.html'){res.setHeader('Content-Type','text/html');res.end(portable);return;}
  const file=path.resolve(root,'.'+decodeURIComponent(name));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.HTML':'text/html','.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),cases=[],exports=[];
 try{
  for(const lang of ['ru','en','kk'])for(const width of widths){
   const context=await browser.newContext({locale:lang==='kk'?'kk-KZ':lang==='en'?'en-US':'ru-RU',viewport:{width,height:1000},acceptDownloads:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
   await page.goto(base+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
   await page.addStyleTag({path:path.join(out,'utilities.css')});await settle(page);
   A.equal(await page.locator('#nomad360-hero h1').textContent(),headlines[lang]);
   A.equal(await page.locator('#nomad360-hero h2').textContent(),subheads[lang]);
   A.equal(await page.locator('#home-screen h1').count(),1);
   A.equal(await page.locator('#nomad360-calculation-list li').count(),6);
   A.match(await page.locator('#nomad360-calculation-list li').first().textContent(),lang==='ru'?/Денежный поток/:/Cash Flow/);
   A.equal(await page.locator('#nomad360-hero > .nomad-hero').evaluate(e=>e.children.length),3);
   A.equal(await page.locator('#nomad360-hero').evaluate(e=>e.nextElementSibling.id),'nomad360-selling-choice');
   A.match(await page.locator('#nomad360-hero h3').innerText(),/20/);
   A.equal(await page.locator('#nomad360-calculation-list').evaluate(e=>e.open),false);
   await page.locator('#nomad360-calculation-list>summary').click();
   A.match(await page.locator('#nomad360-data').innerText(),/NOWPayments/);
   A.equal(await page.locator('.nomad-partner-card').count(),2);
   A.equal(await page.locator('.nomad-free-edition .nomad-edition-price').textContent(),'€0');
   A.match(await page.locator('.nomad-paid-edition .nomad-edition-price').textContent(),/€600/);
   const mail=new URL(await page.locator('.nomad-embed-contact').getAttribute('href'));
   A.equal(mail.pathname,'nomad260393@gmail.com');A.ok(mail.searchParams.get('body').includes('\n'));
   A.doesNotMatch(mail.searchParams.get('body'),/skuIds|unitCost|marketingCalc|KZT|USD|IBAN/);
   A.equal(await page.locator('#nomad360-license a[href$="/CALCULATOR_LICENSE.md"]').count(),1);
   A.match(await page.locator('#nomad360-license').innerText(),/Evgenii Kazartsev|Евгений Казарцев/);
   A.doesNotMatch(await page.locator('#nomad360-license').innerText(),/ИИН|ИНН|ЖСН/);
   A.match(await page.locator('#nomad360-official .nomad-traffic-title').innerText(),/GitHub/);
   A.equal(await page.locator('#nomad360-for-website [data-nomad-traffic-value]').count(),0);
   const support=page.locator('#nomad360-support');
   A.equal(await support.locator('[data-nomad-copy]').count(),6);
   for(const selector of ['.nomad-pay-bank','.nomad-russian-transfer'])await support.locator(selector+' summary').click();
   const grid=await support.evaluate(el=>{const a=el.querySelector('.nomad-crypto-panel').getBoundingClientRect(),b=el.querySelector('.nomad-support-methods').getBoundingClientRect();return {crypto:a.toJSON(),methods:b.toJSON()};});
   if(width>=900){A.ok(Math.abs(grid.crypto.top-grid.methods.top)<1);A.ok(grid.methods.left>grid.crypto.right);}
   else A.ok(grid.methods.top>grid.crypto.bottom);
   const cards=await page.locator('.nomad-partner-card').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
   if(width>=900)A.ok(Math.abs(cards[0].top-cards[1].top)<1&&cards[1].left>cards[0].right);else A.ok(cards[1].top>cards[0].bottom);
   const link=page.locator('#nomad360-header a[data-nomad-go="nomad360-for-website"]');A.equal(await link.count(),1);
   const burger=page.locator('.nomad-burger');if(await burger.isVisible()){await burger.click();await page.keyboard.press('Escape');A.equal(await burger.getAttribute('aria-expanded'),'false');await burger.click();}
   await link.focus();await page.keyboard.press('Enter');await settle(page);
   A.equal(await page.evaluate(()=>document.activeElement.id),'nomad360-for-website');
   if(await burger.isVisible())A.equal(await burger.getAttribute('aria-expanded'),'false');
   A.ok(await page.locator('#nomad360-for-website').evaluate(e=>e.getBoundingClientRect().top>=-1&&e.getBoundingClientRect().top<innerHeight));
   const geometry=await page.evaluate(audit);A.ok(geometry.scrollWidth<=width+1,JSON.stringify(geometry));A.deepEqual(geometry.bad,[]);A.deepEqual(geometry.gaps,[]);A.deepEqual(errors,[]);
   await page.addScriptTag({path:path.join(root,'tests/helpers/contrast.cjs')});
   const contrast=await page.evaluate(()=>Object.fromEntries(['#nomad360-hero','#nomad360-for-website','#nomad360-support','#nomad360-license'].map(s=>{const a=NomadContrast.audit(document.querySelector(s));return [s,{count:a.count,minimum:a.minimum,failures:a.failures}]})));
   for(const result of Object.values(contrast))A.deepEqual(result.failures,[],'Marketing text contrast');
   const screenshots=[];
   for(const [name,selector] of [['home','#home-screen'],['about','#nomad360-about'],['support','#nomad360-support'],['offers','#nomad360-for-website'],['legal','#nomad360-license']]){
    if(name==='home')await page.locator('#nomad360-calculation-list').evaluate(e=>e.open=false);
    const file=`${lang}-${width}-${name}.png`;await page.locator(selector).screenshot({path:path.join(out,file),animations:'disabled'});screenshots.push(file);
   }
   if(width===390){
    // The error state must retain a working action, then a real complete download and retry.
    await page.route('**/Marketing_calc.HTML',r=>r.abort());
    await page.locator('[data-nomad-download-html]').click();await page.waitForFunction(()=>!document.querySelector('[data-nomad-download-html]').disabled);
    A.equal(await page.locator('[data-nomad-embed-retry]').isVisible(),false);await page.unroute('**/Marketing_calc.HTML');
    let downloadPromise=page.waitForEvent('download');await page.locator('[data-nomad-download-html]').click();let download=await downloadPromise;
    A.equal(await download.failure(),null);portable=fs.readFileSync(await download.path(),'utf8');
    A.equal(download.suggestedFilename(),'Nomad360-calculator-embed.html');
    A.match(portable,/data:font\/woff2;base64/);A.match(portable,/CALCULATOR_LICENSE.md/);A.doesNotMatch(portable,/src="\.\/|href="\.\/(?:[^"#]+\.css)/);
    A.equal(await page.locator('[data-nomad-embed-retry]').isVisible(),true);
    downloadPromise=page.waitForEvent('download');await page.locator('[data-nomad-retry-download]').click();download=await downloadPromise;A.equal(await download.failure(),null);A.equal(fs.readFileSync(await download.path(),'utf8'),portable);
    const saved=await context.newPage();await saved.goto(base+'portable.html',{waitUntil:'domcontentloaded'});await saved.addStyleTag({path:path.join(out,'utilities.css')});await saved.evaluate(l=>Nomad360UI.setLanguage(l),lang);await settle(saved);
    for(const id of ['nomad360-header','nomad360-ai','nomad360-factory','nomad360-contacts','nomad360-support','nomad360-for-website','nomad360-license','nomad360-data'])A.equal(await saved.locator('#'+id).count(),1,'complete embed '+id);
    A.match(await saved.locator('.nomad-logo').getAttribute('src'),/^data:image\/png/);A.equal(await saved.locator('.nomad-copy').count(),6);
    A.equal(await saved.locator('#nomad360-hero h1').textContent(),headlines[lang]);A.ok((await saved.evaluate(audit)).scrollWidth<=390+1);
    await saved.locator('#nomad360-for-website').screenshot({path:path.join(out,`${lang}-390-portable.png`)});
    exports.push({lang,bytes:Buffer.byteLength(portable),downloads:2,complete:true});await saved.close();
   }
   cases.push({lang,width,geometry,grid,contrast,screenshots});await context.close();
  }
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({base:'cf17252fdb89cea7e83689f3ea7ebaa4363e2f86',cases,exports},null,2));
  console.log('MARKETING_BROWSER_GREEN',JSON.stringify({cases:cases.length,screenshots:cases.length*5+exports.length,exports:exports.length,downloads:exports.length*2}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error('MARKETING_BROWSER_RED',e);process.exitCode=1;});
