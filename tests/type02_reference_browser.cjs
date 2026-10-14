'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),baseline=process.env.TYPE02_BASELINE_ROOT||'/workspace/scratch/type02-baseline';
const out=path.join(root,'artifacts/type02'),proof=path.join(root,'docs/reviews/type02-reference');
const widths=[320,390,768,1280],langs=['ru','en','kk'],variants=['before','plex','inter'],extrasOnly=process.argv.includes('--extras-only');
fs.mkdirSync(out,{recursive:true});
const fixture=()=>({version:2,currency:'KZT',businessCurrency:'KZT',asOf:'2026-10-14',
 marketing:{budget:250000,cpc:100,ctrPct:2,clickLeadPct:20,leadOrderPct:30,periodMonths:3,cacReservePct:100},
 skus:[{id:'a',name:'Cotton tote',source:'own',unitCost:1400,marginPct:25,mixPct:60,acquiringPct:1,batchUnits:300,initialCashOut:420000,fulfillmentPerOrder:0,storagePerUnitDay:.5},
 {id:'b',name:'Cotton pouch',source:'resale',unitCost:900,marginPct:25,mixPct:40,acquiringPct:1,batchUnits:200,initialCashOut:180000,fulfillmentPerOrder:0,storagePerUnitDay:.5}],
 resources:[{id:'certificate',kind:'certification',label:'',amount:90000,cadence:'once',skuIds:['a','b'],allocation:'revenue',validFor:'Kazakhstan: cotton accessories, domestic sales',validUntil:'2027-12-31',confirmedCoverage:true,usage:{a:60,b:40},capacity:100}],
 funding:{kind:'cash',annualRatePct:20,months:6,reservePct:10},tax:{type:'profit',pct:20,vatPct:16}});
function snap(){
 const state=PortfolioV2UI.getState();return {state,financial:Nomad360PaymentUI.buildPortfolio(state),stored:localStorage.getItem('marketingCalcPortfolioV2')};
}
function styles(){
 const scope=document.getElementById('p2-stage-purchase');
 const selectors={section:':scope > .nd-v2-title',body:':scope > .nd-v2-description',card:'.nd-v2-card-title',label:'.nd-v2-field > span:first-child',input:'input[data-p2-path="resources.0.amount"]',select:'select[data-p2-path="resources.0.kind"]',checkbox:'.nd-v2-check-row',note:'[data-p2-resource-members] > div:last-child',action:'[data-p2-add-resource]',error:'[data-p2-inline-error]'};
 const rows={};for(const [key,selector] of Object.entries(selectors)){
  const el=scope.querySelector(selector);if(!el)continue;const s=getComputedStyle(el),r=el.getBoundingClientRect();
  rows[key]={selector,text:el.textContent.trim(),fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,fontSynthesis:s.fontSynthesis,color:s.color,width:r.width,height:r.height};
 }
 const placeholder=getComputedStyle(scope.querySelector('input[data-p2-path="resources.0.validFor"]'),'::placeholder');
 rows.placeholder={fontSize:placeholder.fontSize,fontWeight:placeholder.fontWeight,color:placeholder.color};
 return rows;
}
function outside(){
 const host=document.getElementById('portfolio-v2-root');
 return [...host.querySelectorAll('h1,h3,label>span,input,select,button,p,.nd-v2-description')].filter(e=>!e.closest('#p2-stage-purchase')).map(e=>{
  const s=getComputedStyle(e);return [e.tagName,e.getAttribute('data-p2-path'),e.textContent,s.fontFamily,s.fontSize,s.fontWeight,s.lineHeight];
 });
}
function geometry(){
 const scope=document.getElementById('p2-stage-purchase'),visible=e=>e.getClientRects().length;
 const bad=[...scope.querySelectorAll('*')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1;}).map(e=>({tag:e.tagName,class:e.className}));
 const controls=[...scope.querySelectorAll('input:not([type=checkbox]),select,button,.nd-v2-check-row')].filter(visible).map(e=>({type:e.type,height:e.getBoundingClientRect().height,size:parseFloat(getComputedStyle(e).fontSize)}));
 const c=document.createElement('canvas'),ctx=c.getContext('2d');
 const clipped=[...scope.querySelectorAll('input[type=number]')].filter(visible).filter(e=>{const s=getComputedStyle(e);ctx.font=s.font;return ctx.measureText(e.value).width>e.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)-16+1;}).map(e=>e.value);
 return {pageOverflow:document.documentElement.scrollWidth>innerWidth+1,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,bad,controls,clipped,gaps:Nomad360LocaleCore.auditVisibleGaps()};
}
async function fonts(page,family){
 const probe=await page.evaluate(async family=>{
  const el=document.createElement('span');el.id='type02-glyph-probe';el.textContent='Ә ә Ғ ғ Қ қ Ң ң Ө ө Ұ ұ Ү ү Һ һ І і';
  el.style.cssText='display:block;font-size:20px;font-family:"'+family+'";font-synthesis:none';document.getElementById('p2-stage-purchase').appendChild(el);
  for(const weight of [400,500,600,700])await document.fonts.load(weight+' 20px "'+family+'"',el.textContent);
  await document.fonts.ready;return el.textContent;
 },family);
 const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const {root:doc}=await cdp.send('DOM.getDocument');const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:doc.nodeId,selector:'#type02-glyph-probe'});
 const rows=[];for(const weight of [400,500,600,700]){
  await page.locator('#type02-glyph-probe').evaluate((e,w)=>e.style.fontWeight=String(w),weight);
  const actual=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
  A.ok(actual.fonts.length);A.ok(actual.fonts.every(f=>f.familyName===family&&f.isCustomFont),JSON.stringify(actual));rows.push({weight,fonts:actual.fonts});
 }
 await page.locator('#type02-glyph-probe').evaluate(e=>e.remove());await cdp.detach();return {text:probe,rows};
}
async function matched(page){
 const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const {root:doc}=await cdp.send('DOM.getDocument');const result={};
 for(const [role,selector] of Object.entries({label:'#p2-stage-purchase .nd-v2-field > span',body:'#p2-stage-purchase > .nd-v2-description',section:'#p2-stage-purchase > .nd-v2-title'})){
  const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:doc.nodeId,selector});const x=await cdp.send('CSS.getMatchedStylesForNode',{nodeId});
  result[role]=x.matchedCSSRules.map(r=>({selector:r.rule.selectorList.text,properties:r.rule.style.cssProperties.filter(p=>/^font|^line-height/.test(p.name)).map(p=>({name:p.name,value:p.value,important:p.important||false}))})).filter(r=>r.properties.length);
 }
 await cdp.detach();return result;
}
async function prepare(page,base,lang){
 await page.route('https://**/*',route=>route.abort());
 await page.goto(base+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
 await page.addStyleTag({path:path.join(out,'utilities.css')});
 await page.addStyleTag({url:baseURL+'docs/reviews/type02-reference/fonts.css'});
 await page.evaluate(state=>{localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(state));PortfolioV2UI.open({resume:true});},fixture());
 await page.locator('#nomad360-lang-select').selectOption(lang);await page.waitForTimeout(80);
 await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>Nomad360V2Fields.refresh());await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));A.equal((await page.evaluate(snap)).financial.ready,true);
}
function apply(variant){
 const scope=document.getElementById('p2-stage-purchase');if(variant==='before')return;
 scope.classList.add('nd-type02-reference');scope.dataset.ndType02Font=variant;
}
async function activate(page,variant){
 await page.evaluate(apply,variant);await page.evaluate(()=>document.fonts.ready);
 // The original .input-field transitions all properties over 200ms, including
 // weight and size. Inspect the final value rather than an animation frame.
 if(variant!=='before')await page.waitForTimeout(250);
 await page.evaluate(()=>Nomad360V2Fields.refresh());
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
let baseURL;
(async()=>{
 A.ok(fs.existsSync(path.join(baseline,'Marketing_calc.HTML')),'Archive the exact base first');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');const isBase=url.pathname.startsWith('/baseline/'),dir=isBase?baseline:root;
  const relative=decodeURIComponent(isBase?url.pathname.slice(10):url.pathname.slice(1)),file=path.resolve(dir,relative);
  if(!file.startsWith(dir+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  const type={'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.json':'application/json'}[path.extname(file)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));baseURL='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const receipts=[],glyphs={},reflow=[],fallback=[],restoration=[];
 try{
  if(!extrasOnly)for(const lang of langs)for(const width of widths){
   const context=await browser.newContext({viewport:{width,height:1000}});
   const archived=await context.newPage();await prepare(archived,baseURL+'baseline/',lang);const before=await archived.evaluate(snap),originalOutside=await archived.evaluate(outside),originalStyles=await archived.evaluate(styles);
   const normal=await context.newPage();await prepare(normal,baseURL,lang);A.deepEqual(await normal.evaluate(snap),before);A.deepEqual(await normal.evaluate(outside),originalOutside);A.deepEqual(await normal.evaluate(styles),originalStyles,'Unactivated current CSS is byte-equivalent in rendered roles');await normal.close();
   const baselineGaps={},baselineFinancial={};
   for(const variant of variants){
    const page=variant==='before'?archived:await context.newPage();if(variant!=='before')await prepare(page,baseURL,lang);
    await activate(page,variant);
    A.deepEqual(await page.evaluate(snap),before);A.deepEqual(await page.evaluate(outside),originalOutside,'Other sections stay unchanged');
    if(lang==='kk'&&width===390)glyphs[variant]=await fonts(page,variant==='inter'?'Inter':'IBM Plex Sans');
    const style=await page.evaluate(styles);
    if(variant!=='before'){
     for(const [role,weight] of Object.entries({section:600,body:400,card:600,label:500,input:400,select:400,checkbox:500,note:400,action:600}))A.equal(Number(style[role].fontWeight),weight,role);
     A.equal(style.input.fontSize,'16px');A.equal(style.body.fontSize,'17px');A.equal(style.note.fontSize,'14px');
    }
    const rules=width===390?await matched(page):undefined;
    for(const state of ['valid','coverage-error']){
     if(state==='coverage-error'){await page.locator('[data-p2-path="resources.0.confirmedCoverage"]').uncheck();await page.waitForTimeout(80);}
     // Structural rerenders replace the section; the review harness reactivates
     // the same opt-in class after each real controller transition.
     await activate(page,variant);
     const current=await page.evaluate(snap),s=await page.evaluate(styles),g=await page.evaluate(geometry);
     A.equal(current.financial.ready,state==='valid');if(state==='coverage-error'){
      A.ok(current.financial.fieldErrors.some(e=>e.path==='resources.0.confirmedCoverage'));
      A.equal(await page.locator('#p2-stage-purchase [role=alert]').count(),1);
      A.equal(await page.locator('[data-p2-path="resources.0.confirmedCoverage"]').getAttribute('aria-invalid'),'true');
      if(variant!=='before'){A.equal(s.error.fontSize,'14px');A.equal(s.error.fontWeight,'500');}
     }
     A.equal(g.pageOverflow,false);A.deepEqual(g.bad,[]);A.deepEqual(g.clipped,[]);
     if(variant==='before'){baselineGaps[state]=g.gaps;baselineFinancial[state]=current;}
     else {A.deepEqual(g.gaps,baselineGaps[state],'Typography must not introduce or hide localization gaps');A.deepEqual(current,baselineFinancial[state],'Every field, draft byte and financial/error result matches the base');}
     A.ok(g.controls.every(c=>c.height>=44));A.ok(g.controls.filter(c=>c.type&&c.type!=='button'&&c.type!=='submit'&&c.type!=='checkbox').every(c=>c.size>=16));
     await page.addScriptTag({path:path.join(root,'tests/helpers/contrast.cjs')});const contrast=await page.evaluate(()=>NomadContrast.audit(document.getElementById('p2-stage-purchase')));A.deepEqual(contrast.failures,[]);
     const name=`${lang}-${width}-${variant}-${state}.png`;await page.locator('#p2-stage-purchase').screenshot({path:path.join(out,name)});
     receipts.push({lang,width,variant,state,styles:s,geometry:g,contrast,financial:current.financial,stored:current.stored,screenshot:name,matchedRules:state==='valid'?rules:undefined});
    }
    await page.close();
   }
   await context.close();
  }
  for(const lang of langs)for(const variant of ['plex','inter']){
   const context=await browser.newContext({viewport:{width:390,height:1000}}),page=await context.newPage();await prepare(page,baseURL,lang);await activate(page,variant);
   await page.locator('[data-p2-path="resources.0.allocation"]').selectOption('usage');await activate(page,variant);
   A.equal(await page.locator('[data-p2-path="resources.0.capacity"]').count(),1);
   await page.locator('[data-p2-path="resources.0.amount"]').fill('125000');await page.locator('[data-p2-path="resources.0.amount"]').blur();
   const edited=await page.evaluate(snap);A.equal(edited.state.resources[0].amount,'125000');A.equal(edited.financial.ready,true);
   const hints=await page.locator('#p2-stage-purchase .nd-v2-field > span:not(:first-child)').evaluateAll(nodes=>nodes.map(e=>({size:getComputedStyle(e).fontSize,weight:getComputedStyle(e).fontWeight})));
   A.ok(hints.length>=3);A.ok(hints.every(h=>h.size==='14px'&&h.weight==='400'));
   await page.reload({waitUntil:'domcontentloaded'});await page.addStyleTag({path:path.join(out,'utilities.css')});await page.addStyleTag({url:baseURL+'docs/reviews/type02-reference/fonts.css'});
   await page.evaluate(()=>PortfolioV2UI.open({resume:true}));await activate(page,variant);A.deepEqual(await page.evaluate(snap),edited,'Restoration retains edited amount, currency, allocation and output');
   const g=await page.evaluate(geometry);A.equal(g.pageOverflow,false);A.deepEqual(g.bad,[]);A.deepEqual(g.clipped,[]);
   const name=`${lang}-390-${variant}-usage-restored.png`;await page.locator('#p2-stage-purchase').screenshot({path:path.join(out,name)});restoration.push({lang,variant,amount:125000,currency:edited.state.currency,geometry:g,screenshot:name});await context.close();
  }
  for(const lang of langs)for(const variant of ['plex','inter']){
   // Desktop 200% layout equivalent: 1280 physical px, 640 CSS px, DPR 2.
   // Unlike CSS zoom this also evaluates media queries at the zoomed width.
   const context=await browser.newContext({viewport:{width:640,height:500},deviceScaleFactor:2}),page=await context.newPage();await prepare(page,baseURL,lang);const before=await page.evaluate(snap);
   await activate(page,variant);
   const g=await page.evaluate(geometry);A.equal(g.pageOverflow,false,JSON.stringify(g));A.deepEqual(g.bad,[]);A.deepEqual(await page.evaluate(snap),before);
   const name=`${lang}-1280-${variant}-zoom200.png`;await page.locator('#p2-stage-purchase').screenshot({path:path.join(out,name)});reflow.push({lang,variant,method:'1280 physical px / 640 CSS px / DPR 2; manual browser zoom remains for acceptance',geometry:g,screenshot:name});await context.close();
   for(const width of [320,1280]){
    const c=await browser.newContext({viewport:{width,height:1000}}),p=await c.newPage();await p.route('**/*.woff2',r=>r.abort());await prepare(p,baseURL,lang);const input=await p.evaluate(snap);await activate(p,variant);
    const geo=await p.evaluate(geometry);A.equal(geo.pageOverflow,false);A.deepEqual(geo.bad,[]);A.deepEqual(geo.clipped,[]);A.deepEqual(await p.evaluate(snap),input);
    fallback.push({lang,variant,width,geometry:geo});await c.close();
   }
  }
  const record={base:'b1cc9b50ae48c3c8f392e4342fb5243c7575bd8e',stage:'TYPE-02 A only',receipts,glyphs,reflow,fallback,restoration};
  if(!extrasOnly)fs.writeFileSync(path.join(out,'protocol.json'),JSON.stringify(record,null,2)+'\n');
  console.log((extrasOnly?'TYPE02_EXTRAS_GREEN ':'TYPE02_REFERENCE_GREEN ')+JSON.stringify({screens:receipts.length,restoration:restoration.length,zoom:reflow.length,fallback:fallback.length,glyphCandidates:Object.keys(glyphs),numericChanges:0,outsideChanges:0}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
