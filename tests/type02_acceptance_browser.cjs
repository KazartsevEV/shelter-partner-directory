'use strict';
// TYPE-02 B: real screens, exact accepted-main data and original screenshots.
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),{fixture}=require('./portfolio_v2_f3_fixture.cjs');
const Linked=require('../portfolio_v2_linked_engine.js'),{verify}=require('./shopper_v1_oracle.cjs');
const root=path.resolve(__dirname,'..'),baseline=process.env.TYPE02_BASELINE_ROOT||'/workspace/scratch/type02-baseline';
const out=path.join(root,'artifacts/type02-b'),utilities=path.join(root,'artifacts/type02/utilities.css');
const widths=(process.env.TYPE02_WIDTHS||'320,360,390,430,768,1280').split(',').map(Number),langs=(process.env.TYPE02_LANGS||'ru,en,kk').split(',');
fs.mkdirSync(out,{recursive:true});
function standalone(){return {version:2,currency:'KZT',businessCurrency:'KZT',asOf:'2026-10-14',marketing:{budget:250000,cpc:100,ctrPct:2,clickLeadPct:20,leadOrderPct:30,periodMonths:3,cacReservePct:100},skus:[{id:'a',name:'Cotton tote',source:'own',unitCost:1400,marginPct:25,mixPct:60,acquiringPct:1,batchUnits:300,initialCashOut:420000,fulfillmentPerOrder:0,storagePerUnitDay:.5},{id:'b',name:'Cotton pouch',source:'resale',unitCost:900,marginPct:25,mixPct:40,acquiringPct:1,batchUnits:200,initialCashOut:180000,fulfillmentPerOrder:0,storagePerUnitDay:.5}],resources:[{id:'certificate',kind:'certification',label:'',amount:90000,cadence:'once',skuIds:['a','b'],allocation:'revenue',validFor:'Kazakhstan: cotton accessories, domestic sales',validUntil:'2027-12-31',confirmedCoverage:true,usage:{a:60,b:40},capacity:100}],funding:{kind:'cash',annualRatePct:20,months:6,reservePct:10},tax:{type:'profit',pct:20,vatPct:16}};}
function linked(){const p=fixture();return {...Linked.fromV1({...p,currency:'USD'}),resources:p.resources,offers:p.offers,forecastMonths:p.forecastMonths,recurringDemandApproved:true,importedAt:'2026-10-12T00:00:00Z'};}
function snapshot(route){
 if(route==='v1')return {currency:Nomad360Currency.get(),product:productPortfolio[0],model:calculateProductPortfolio(),cash:calculateProductCashFlow(calculateProductPortfolio()),cycle:aggregatePlanMetrics(productPortfolio[0]),credit:calculateAggregateCredit(productPortfolio[0]),priceList:calculatePriceListRange(productPortfolio[0])};
 if(route==='home')return {currency:Nomad360Currency.get(),inputs:[...document.querySelectorAll('input,select,textarea')].filter(e=>e.id!=='nomad360-lang-select').map(e=>[e.id,e.value,e.checked])};
 const state=(route==='standalone'?PortfolioV2UI:LinkedPortfolioV2UI).getState();return {state,financial:route==='standalone'?Nomad360PaymentUI.buildPortfolio(state):LinkedPortfolioV2Engine.build(state),stored:localStorage.getItem(route==='standalone'?'marketingCalcPortfolioV2':'marketingCalcLinkedPortfolioV2')};
}
function audit(){
 const visible=e=>e.getClientRects().length&&!e.closest('[hidden],.hidden,#nomad360-print-sheet');
 const controls=[...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]):not([type=file]),select,textarea')].filter(visible).map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {key:e.id||e.dataset.p2Path||e.dataset.linkedPath||e.name,size:parseFloat(s.fontSize),weight:s.fontWeight,height:r.height,left:r.left,right:r.right};});
 const ctx=document.createElement('canvas').getContext('2d');
 const clipped=[...document.querySelectorAll('input[type=number]')].filter(visible).filter(e=>{const s=getComputedStyle(e);ctx.font=s.font;return ctx.measureText(e.value).width>e.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)-16+1;}).map(e=>({key:e.id||e.dataset.p2Path||e.dataset.linkedPath,value:e.value}));
 const text=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
 while((n=walker.nextNode())){const e=n.parentElement;if(!n.textContent.trim()||!visible(e)||e.closest('script,style,select,textarea,svg,[aria-hidden=true]'))continue;const s=getComputedStyle(e);text.push({tag:e.tagName,id:e.id,cls:e.className,text:n.textContent.trim().slice(0,110),size:parseFloat(s.fontSize),weight:s.fontWeight,font:s.fontFamily});}
 const money=[...document.querySelectorAll('.nd-v2-number-value,[data-nomad-display-number]')].filter(visible).filter(e=>{const r=document.createRange();r.selectNodeContents(e);if(e.matches('[data-nomad-display-number]')&&e.firstChild?.nodeType===Node.TEXT_NODE)r.setEnd(e.firstChild,e.firstChild.textContent.replace(/\s[A-Z]{3}$/,'').length);return new Set([...r.getClientRects()].filter(r=>r.width&&r.height).map(r=>Math.round(r.top))).size>1;}).map(e=>({text:e.textContent,html:e.outerHTML}));
 return {overflow:document.documentElement.scrollWidth>innerWidth+1,scrollWidth:document.documentElement.scrollWidth,controls,clipped,money,text,gaps:Nomad360LocaleCore.auditVisibleGaps()};
}
async function settle(page){await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>window.Nomad360V2Fields?.refresh());await page.waitForTimeout(250);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function glyphs(page){
 await page.evaluate(async()=>{const p=document.createElement('span');p.id='type02-inter-probe';p.textContent='Ә ә Ғ ғ Қ қ Ң ң Ө ө Ұ ұ Ү ү Һ һ І і';p.style.cssText='display:block;font-family:Inter;font-size:20px;font-synthesis:none';document.body.append(p);for(const w of [400,500,600,700])await document.fonts.load(w+' 20px Inter',p.textContent);});
 const c=await page.context().newCDPSession(page);await c.send('DOM.enable');await c.send('CSS.enable');const {root:doc}=await c.send('DOM.getDocument');const {nodeId}=await c.send('DOM.querySelector',{nodeId:doc.nodeId,selector:'#type02-inter-probe'});const rows=[];
 for(const w of [400,500,600,700]){await page.locator('#type02-inter-probe').evaluate((e,w)=>e.style.fontWeight=String(w),w);const r=await c.send('CSS.getPlatformFontsForNode',{nodeId});A.ok(r.fonts.length);A.ok(r.fonts.every(f=>f.isCustomFont&&f.familyName==='Inter'),JSON.stringify(r));rows.push({weight:w,fonts:r.fonts});}
 await page.locator('#type02-inter-probe').evaluate(e=>e.remove());await c.detach();return rows;
}
let baseURL;
async function prepare(page,variant,lang,route,funding='cash',fallback=false){
 await page.route(/^https?:\/\//,r=>r.request().url().startsWith(baseURL)?r.continue():r.abort());
 if(fallback)await page.route('**/nomad360_calculator_ui.css',async r=>{const x=await r.fetch();await r.fulfill({response:x,body:(await x.text()).replace(/@font-face\s*\{[^}]*\}/g,'')});});
 await page.goto(baseURL+(variant==='before'?'baseline/':'')+'Marketing_calc.HTML'+(route==='v1'?'?demo=shopper&finance='+funding:''),{waitUntil:'domcontentloaded'});
 await page.addStyleTag({path:utilities});
 if(variant==='before')await page.addStyleTag({content:fs.readFileSync(path.join(root,'docs/reviews/type02-reference/fonts.css'),'utf8').replace(/@font-face\s*\{[^}]*font-family:\s*'Inter'[^}]*\}/g,'').replaceAll("url('/vendor/","url('"+baseURL+"vendor/").replaceAll("url('../../../vendor/","url('"+baseURL+"vendor/")});
 if(route==='v1')await page.waitForFunction(()=>document.querySelector('[data-nomad-shopper-demo]')?.dataset.demoReady==='true'||(typeof productPortfolio!=='undefined'&&productPortfolio.length&&calculateProductPortfolio()));
 if(route==='standalone'||route==='linked'){const state=route==='standalone'?standalone():linked();if(route==='standalone')state.funding.kind=funding;await page.evaluate(({route,state})=>{localStorage.setItem(route==='standalone'?'marketingCalcPortfolioV2':'marketingCalcLinkedPortfolioV2',JSON.stringify(state));if(route==='standalone')PortfolioV2UI.open({resume:true});else LinkedPortfolioV2UI.resume();},{route,state});}
 await page.locator('#nomad360-lang-select').selectOption(lang);await settle(page);
}
async function pictures(page,variant,lang,width,route){
 const targets=route==='home'?['#nomad360-hero','.nd-currency-settings','#nomad360-about','#nomad360-contacts']:route==='v1'?['#product-materials-block','#product-portfolio-business-summary']:route==='standalone'?['#p2-stage-purchase','#p2-stage-financing','#p2-results']:['#linked-resources','#linked-results'];
 const files=[];for(let i=0;i<targets.length;i++){const el=page.locator(targets[i]);if(!await el.count())continue;const file=`${lang}-${width}-${variant}-${route}-${i}.png`;await el.scrollIntoViewIfNeeded();if(route==='v1')await page.screenshot({path:path.join(out,file)});else await el.screenshot({path:path.join(out,file)});files.push({target:targets[i],file});}return files;
}
(async()=>{
 A.ok(fs.existsSync(path.join(baseline,'Marketing_calc.HTML')));A.ok(fs.existsSync(utilities));
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),isBase=u.pathname.startsWith('/baseline/'),dir=isBase?baseline:root,file=path.resolve(dir,decodeURIComponent(isBase?u.pathname.slice(10):u.pathname.slice(1)));if(!file.startsWith(dir+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':({'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.json':'application/json'})[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));baseURL='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']}),receipts=[],extras=[],fonts=[];
 try{
  for(const lang of langs)for(const width of widths)for(const route of ['home','v1','standalone','linked']){
   let previous;
   for(const variant of ['before','after']){
    const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await prepare(page,variant,lang,route);
    const data=await page.evaluate(snapshot,route),geometry=await page.evaluate(audit);fs.writeFileSync(path.join(out,'latest-audit.json'),JSON.stringify({lang,width,route,variant,geometry},null,2));A.deepEqual(errors,[]);
    if(variant==='before')previous={data,geometry};else{
     A.deepEqual(data,previous.data,`${lang}/${width}/${route}: source, saved bytes and calculated results`);A.equal(geometry.overflow,false,`${lang}/${width}/${route}: page overflow`);
     await page.screenshot({path:path.join(out,'latest.png')});A.deepEqual(geometry.clipped,[],`${lang}/${width}/${route}: numeric input clipping`);A.deepEqual(geometry.money,[],`${lang}/${width}/${route}: split monetary value`);
     A.ok(geometry.controls.every(c=>c.size>=16),JSON.stringify(geometry.controls.filter(c=>c.size<16)));A.ok(geometry.controls.every(c=>c.height>=44),JSON.stringify(geometry.controls.filter(c=>c.height<44)));
     A.deepEqual(geometry.gaps,previous.geometry.gaps,'Preserve existing localization diagnostics');
     A.deepEqual(geometry.text.filter(t=>t.cls!=='nomad-lite'&&(t.size<14||!['400','500','600','700'].includes(t.weight))),[],'Meaningful text has readable sizes and supported role weights');
     if(lang==='kk'&&width===390&&route==='standalone')fonts.push(...await glyphs(page));
     if(route==='v1')verify(data,'cash');
    }
    let contrast;if(variant==='after'&&['home','standalone'].includes(route)){await page.addScriptTag({path:path.join(root,'tests/helpers/contrast.cjs')});contrast=await page.evaluate(r=>NomadContrast.audit(document.querySelector(r==='home'?'#nomad360-hero':'#p2-stage-purchase')),route);A.deepEqual(contrast.failures,[],'Contrast after role changes');}
    const files=await pictures(page,variant,lang,width,route);receipts.push({lang,width,route,variant,geometry,contrast,files,numericParity:variant==='after'});await context.close();
   }
   console.log('TYPE02_CASE '+lang+' '+width+' '+route);
  }
  for(const lang of langs){
   for(const width of [320,1280]){const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage();await prepare(page,'after',lang,'standalone','cash',true);const g=await page.evaluate(audit);A.equal(g.overflow,false);A.deepEqual(g.clipped,[]);A.ok(g.controls.every(c=>c.size>=16));extras.push({type:'font-fallback',lang,width,geometry:g});await context.close();}
   const context=await browser.newContext({viewport:{width:640,height:500},deviceScaleFactor:2}),page=await context.newPage();await prepare(page,'after',lang,'standalone');const g=await page.evaluate(audit);A.equal(g.overflow,false);A.deepEqual(g.clipped,[]);extras.push({type:'200-percent-layout-equivalent',lang,physicalWidth:1280,cssWidth:640,deviceScaleFactor:2,geometry:g});await context.close();
   const c=await browser.newContext({viewport:{width:390,height:1000}}),p=await c.newPage();await prepare(p,'after',lang,'standalone');await p.locator('[data-p2-path="resources.0.amount"]').fill('125000');await p.locator('[data-p2-path="resources.0.amount"]').blur();const edited=await p.evaluate(snapshot,'standalone');await p.reload();await p.addStyleTag({path:utilities});await p.evaluate(()=>PortfolioV2UI.open({resume:true}));await settle(p);A.deepEqual(await p.evaluate(snapshot,'standalone'),edited);await p.locator('[data-p2-path="resources.0.confirmedCoverage"]').uncheck();await settle(p);A.equal((await p.evaluate(snapshot,'standalone')).financial.ready,false);const error=await p.locator('#p2-stage-purchase [role=alert]').evaluate(e=>({size:getComputedStyle(e).fontSize,weight:getComputedStyle(e).fontWeight,text:e.textContent}));A.equal(error.size,'14px');A.equal(error.weight,'500');extras.push({type:'restoration-and-visible-error',lang,error});await c.close();
  }
  fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify({base:'b1cc9b50ae48c3c8f392e4342fb5243c7575bd8e',stage:'TYPE-02 B / Inter',receipts,extras,fonts},null,2)+'\n');
  console.log('TYPE02_ACCEPTANCE_GREEN '+JSON.stringify({cases:receipts.length,screens:receipts.reduce((n,r)=>n+r.files.length,0),extras:extras.length,numericChanges:0}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
