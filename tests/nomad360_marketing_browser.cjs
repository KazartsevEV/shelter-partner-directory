'use strict';
// Current MKT-L10N-01, main 538565e; earlier marketing specifications are obsolete.
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/marketing-current');fs.mkdirSync(out,{recursive:true});
const widths=(process.env.MARKETING_WIDTHS||'320,360,390,430,768,1280,1440').split(',').map(Number);
let portable='';
function audit(){const visible=e=>e.getClientRects().length&&!e.closest('[hidden],.hidden');const hosts=['#nomad360-intro','#nomad360-about','#nomad360-embed','#nomad360-license','#nomad360-data','#nomad360-official'];const bad=[];for(const host of hosts)for(const e of document.querySelectorAll(host+' *'))if(visible(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const s=getComputedStyle(e);if(parseFloat(s.fontSize)<14||!['400','500','600','700'].includes(s.fontWeight))bad.push({text:e.textContent,font:s.font});}return {overflow:document.documentElement.scrollWidth>innerWidth+1,bad,gaps:Nomad360LocaleCore.auditVisibleGaps()};}
async function settle(p){await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(120);}
(async()=>{
 const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;if(name==='/portable.html'){res.setHeader('Content-Type','text/html');res.end(portable);return;}const file=path.resolve(root,'.'+decodeURIComponent(name));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),cases=[],exports=[];
 try{for(const lang of ['ru','en','kk'])for(const width of widths){
  const ctx=await browser.newContext({locale:lang==='kk'?'kk-KZ':lang==='en'?'en-US':'ru-RU',viewport:{width,height:1000},acceptDownloads:true,reducedMotion:'reduce'}),p=await ctx.newPage(),errors=[],downloads=[];let htmlRequests=0;
  p.on('pageerror',e=>errors.push(e.message));p.on('download',d=>downloads.push(d));p.on('request',r=>{if(r.url().endsWith('/Marketing_calc.HTML'))htmlRequests++;});
  await p.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await p.route('**/nomad360_repo_traffic.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({status:'ok',source:'github-repository-traffic',repository:'KazartsevEV/shelter-partner-directory',updatedAt:new Date().toISOString(),visitors14:63})}));
  await p.goto(base+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});await p.addStyleTag({path:path.join(out,'utilities.css')});await settle(p);
  const tr=k=>p.evaluate(k=>Nomad360LocaleCore.t(k),k);
  const offer=await p.locator('#nomad360-hero h1,#nomad360-hero h2,#nomad360-hero h3').allTextContents();
  if(lang==='ru')A.deepEqual(offer,['Бизнес-калькулятор','Каким бизнесом мне выгодно заниматься?','Рассчитайте идею или существующий бизнес за 20 минут и узнайте, что принесет живые деньги.']);
  A.equal(await p.locator('#nomad360-hero').evaluate(e=>e.nextElementSibling.id),'nomad360-intro');A.equal(await p.locator('#home-screen h1').count(),1);
  A.equal(await p.locator('#nomad360-intro li').count(),3);A.equal(await p.locator('#nomad360-intro p').count(),2);A.equal(await p.locator('#nomad360-intro a').count(),1);
  if(lang==='en')A.match(await p.locator('.nomad-intro-lead').textContent(),/validation/);if(lang==='ru')A.doesNotMatch(await p.locator('#nomad360-intro').textContent(),/validation/);
  A.equal(await p.locator('#nomad360-calculation-list li').count(),6);A.equal(await p.locator('#nomad360-calculation-list ul').isVisible(),true);
  A.equal(await p.locator('#home-screen').evaluate(e=>[...e.children].filter(n=>!['nomad360-hero','nomad360-intro'].includes(n.id)).slice(0,2).map(n=>n.id).join(',')),'nomad360-calculation-list,nomad360-selling-choice');
  await p.locator('.nomad-intro-cta').focus();await p.keyboard.press('Enter');await settle(p);A.ok(await p.locator('#nomad360-selling-choice').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.top<innerHeight;}));
  const about=p.locator('#nomad360-about');A.equal(await about.locator('.nomad-about-opening .nomad-about-motto span').count(),3);A.equal(await about.locator('.nomad-about-flow>li').count(),3);A.equal(await about.locator(':scope>p').count(),1);A.equal(await about.locator('em').count(),1);A.equal(await about.locator('em').evaluate(e=>getComputedStyle(e).fontStyle),'italic');
  if(lang==='ru'){A.deepEqual(await about.locator('li h3').allTextContents(),['Калькулятор','AI Маркетолог','Контент Фабрика']);A.equal(await about.locator(':scope>p').textContent(),'Применяя автоматизацию с Nomad 360, вы можете достичь больших целей быстрее, освободив личное время на то, что действительно важно.');A.equal(await about.locator('em').textContent(),'действительно важно');}
  const flow=await about.locator('li').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));if(width>=900)A.ok(flow[0].left<flow[1].left&&flow[1].left<flow[2].left&&Math.abs(flow[0].top-flow[2].top)<1);else A.ok(flow[0].top<flow[1].top&&flow[1].top<flow[2].top);
  const embed=p.locator('#nomad360-embed'),toggle=embed.locator('[data-nomad-embed-toggle]'),panel=embed.locator('#nomad360-embed-comparison');
  A.equal(await toggle.getAttribute('aria-expanded'),'false');A.equal(await panel.isVisible(),false);A.equal(await embed.locator('button:visible').count(),1);
  if(lang==='ru')A.equal(await embed.locator('h2').textContent(),'Работаете в B2B? Привлеките полезный трафик бесплатно.');
  const files=[];async function shot(name,selector){const f=`${lang}-${width}-${name}.png`;await p.locator(selector).screenshot({path:path.join(out,f)});files.push(f);}
  await shot('home','#home-screen');await shot('about','#nomad360-about');await shot('b2b-closed','#nomad360-embed');
  for(const id of ['nomad360-license','nomad360-data','nomad360-product-details'])A.equal(await p.locator('#'+id).evaluate(e=>e.open),false,id+' default closed');
  A.equal(await p.locator('#nomad360-official').locator('details').count(),0);A.equal(await p.locator('#nomad360-official a').isVisible(),true);A.equal((await p.locator('#nomad360-official a').textContent()).trim(),'nomad260393@gmail.com');A.equal(await p.locator('#nomad360-official p').count(),1);
  const ozon=p.locator('#nomad360-support .nomad-pay-ozon');
  A.equal(await ozon.count(),lang==='ru'?1:0,'Ozon card must exist only in RU, not just be hidden in EN/KK');
  A.equal(await p.locator('#nomad360-support .nomad-russian-transfer').count(),0,'Legacy disclosure removed');
  if(lang==='ru'){
   A.equal(await ozon.locator('.nomad-ru-flag').textContent(),'🇷🇺');
   A.equal(await ozon.locator('.nomad-pay-value').textContent(),'+7 977 986 74 41');
   A.equal(await ozon.locator('[data-nomad-copy]').count(),1);
   const fonts=await p.evaluate(()=>['.nomad-pay-kaspi','.nomad-pay-ozon'].map(sel=>['.nomad-pay-label','.nomad-pay-value','.nomad-copy'].map(child=>{
     const st=getComputedStyle(document.querySelector(sel+' '+child));return [st.fontFamily,st.fontSize,st.fontWeight];
   })));
   A.deepEqual(fonts[1],fonts[0],'Ozon matches Kaspi typography for label, value and copy');
  }
  await shot('footer-closed','.nomad-footer-meta');
  await toggle.focus();await p.keyboard.press('Enter');A.equal(await toggle.getAttribute('aria-expanded'),'true');A.equal(await panel.isVisible(),true);A.equal(downloads.length,0);A.equal(htmlRequests,1,'Disclosure must not start the HTML generator');
  if(width<=600){const rowWidths=await panel.locator('tbody th').evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,parent:e.parentElement.getBoundingClientRect().width})));A.ok(rowWidths.every(x=>Math.abs(x.width-x.parent)<2),'Mobile row labels occupy the full row');}
  A.equal(await panel.locator('tbody tr').count(),5);A.equal(await panel.locator('thead th').count(),3);A.equal(await panel.locator('thead th').nth(2).textContent(),lang==='ru'?'Собственный калькулятор':lang==='en'?'Your own calculator':'Өз калькуляторыңыз');
  await p.waitForFunction(()=>document.querySelector('[data-nomad-traffic-value]')?.textContent==='63');A.match(await panel.locator('[data-nomad-traffic-stats]').textContent(),/GitHub/);
  A.equal(await panel.locator('[data-nomad-download-html]').evaluate(e=>e.closest('td').querySelectorAll('[data-nomad-traffic-stats]').length),1);
  const mail=await panel.locator('.nomad-embed-contact').getAttribute('href');A.ok(mail.startsWith('mailto:nomad260393@gmail.com?subject='));
  await shot('b2b-open','#nomad360-embed');await toggle.click();A.equal(await panel.isVisible(),false);await toggle.click();
  for(const id of ['nomad360-license','nomad360-data']){const d=p.locator('#'+id);await d.locator('summary').focus();await p.keyboard.press('Enter');A.equal(await d.evaluate(e=>e.open),true);}
  A.equal((await p.locator('#nomad360-license .nomad-license-terms>p').first().textContent()),await tr('interface.header.licenseCopy'));A.equal(await p.locator('#nomad360-data>p').textContent(),await tr('interface.header.dataCopy'));A.equal(await p.locator('#nomad360-license a[href$="/CALCULATOR_LICENSE.md"]').count(),1);
  await shot('footer-open','.nomad-footer-meta');
  await p.addScriptTag({path:path.join(root,'tests/helpers/contrast.cjs')});const contrast=await p.evaluate(()=>Object.fromEntries(['#nomad360-intro','#nomad360-about','#nomad360-embed','.nomad-footer-meta'].map(s=>{const a=NomadContrast.audit(document.querySelector(s));return [s,{count:a.count,minimum:a.minimum,failures:a.failures}]})));for(const v of Object.values(contrast))A.deepEqual(v.failures,[]);
  const geometry=await p.evaluate(audit);A.equal(geometry.overflow,false);A.deepEqual(geometry.bad,[]);A.deepEqual(geometry.gaps,[]);A.deepEqual(errors,[]);
  if(width===390){
   await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:base});await p.locator('.nomad-pay-kaspi [data-nomad-copy]').click();A.equal(await p.evaluate(()=>navigator.clipboard.readText()),'+7 777 129 56 93');if(lang==='ru'){await p.locator('.nomad-pay-ozon [data-nomad-copy]').click();A.equal(await p.evaluate(()=>navigator.clipboard.readText()),'+7 977 986 74 41');}
   // Existing header links must reveal their collapsed targets.
   const burger=p.locator('.nomad-burger');if(await burger.isVisible())await burger.click();await p.locator('[data-nomad-go="nomad360-ai"]').click();await settle(p);A.equal(await p.locator('#nomad360-product-details').evaluate(e=>e.open),true);
   await p.route('**/Marketing_calc.HTML',r=>r.abort());await p.locator('[data-nomad-download-html]').click();await p.waitForFunction(()=>!document.querySelector('[data-nomad-download-html]').disabled);A.equal(await p.locator('[data-nomad-embed-retry]').isVisible(),false);await p.unroute('**/Marketing_calc.HTML');
   let wait=p.waitForEvent('download');await p.locator('[data-nomad-download-html]').click();let d=await wait;A.equal(await d.failure(),null);A.equal(d.suggestedFilename(),'Nomad360-calculator-embed.html');portable=fs.readFileSync(await d.path(),'utf8');A.match(portable,/data:font\/woff2;base64/);A.doesNotMatch(portable,/src="\.\/|href="\.\/[^"#]+\.css/);
   A.equal(await p.locator('[data-nomad-embed-status]').textContent(),await tr('interface.header.embedReady'));A.equal(await p.locator('[data-nomad-embed-retry]').isVisible(),true);wait=p.waitForEvent('download');await p.locator('[data-nomad-retry-download]').click();d=await wait;A.equal(await d.failure(),null);A.equal(fs.readFileSync(await d.path(),'utf8'),portable);
   const saved=await ctx.newPage();await saved.goto(base+'portable.html',{waitUntil:'domcontentloaded'});await saved.addStyleTag({path:path.join(out,'utilities.css')});await saved.evaluate(l=>Nomad360UI.setLanguage(l),lang);await settle(saved);
   for(const id of ['nomad360-intro','nomad360-about','nomad360-ai','nomad360-factory','nomad360-contacts','nomad360-support','nomad360-license','nomad360-data','nomad360-official'])A.equal(await saved.locator('#'+id).count(),1);
   A.equal(await saved.locator('#nomad360-support .nomad-pay-ozon').count(),lang==='ru'?1:0,'Portable HTML retains RU-only Ozon visibility');
   A.match(await saved.locator('.nomad-logo').getAttribute('src'),/^data:image/);A.equal(await saved.locator('[data-nomad-embed-toggle]').getAttribute('aria-expanded'),'false');A.equal(await saved.locator('#nomad360-official a').isVisible(),true);A.equal((await saved.evaluate(audit)).overflow,false);
   await saved.locator('#nomad360-about').screenshot({path:path.join(out,`${lang}-390-portable.png`)});exports.push({lang,bytes:Buffer.byteLength(portable),downloads:2,complete:true});await saved.close();
  }
  cases.push({lang,width,offer,geometry,flow,contrast,files});await ctx.close();
 }
 fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({specBase:'538565e',cases,exports},null,2));console.log('MARKETING_CURRENT_GREEN',JSON.stringify({cases:cases.length,screenshots:cases.reduce((n,c)=>n+c.files.length,0)+exports.length,exports:exports.length,downloads:exports.length*2}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error('MARKETING_CURRENT_RED',e);process.exitCode=1;});
