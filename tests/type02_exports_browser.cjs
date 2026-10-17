'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),{fixture}=require('./portfolio_v2_f3_fixture.cjs'),Linked=require('../portfolio_v2_linked_engine.js');
const root=path.resolve(__dirname,'..'),baseline=process.env.TYPE02_BASELINE_ROOT||'/workspace/scratch/type02-baseline',out=path.join(root,'artifacts/type02-b');
fs.mkdirSync(out,{recursive:true});
function printSnapshot(){return [...document.querySelectorAll('#nomad360-print-sheet,#nomad360-print-sheet *')].map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {tag:e.tagName,text:e.childElementCount?null:e.textContent,font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,color:s.color,width:r.width,height:r.height};});}
// TASK-10 changes print paint/font as well as screen paint. Normalize ONLY those
// approved styles on the frozen document, then retain exact text/box comparisons.
const interFaces=fs.readFileSync(path.join(root,'nomad360_calculator_ui.css'),'utf8').match(/@font-face\s*\{[\s\S]*?\}/g).join('\n');
const approvedPaints=new Set(['rgb(23, 59, 88)','rgb(255, 255, 255)','rgb(255, 145, 63)','rgb(56, 103, 139)']);
function probeSnapshot(){const e=document.getElementById('type02-portable-probe'),s=getComputedStyle(e);return {family:s.fontFamily,size:s.fontSize,weight:s.fontWeight};}
(async()=>{
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),base=u.pathname.startsWith('/baseline/'),dir=base?baseline:root,file=path.resolve(dir,decodeURIComponent(base?u.pathname.slice(10):u.pathname.slice(1)));if(!file.startsWith(dir+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':({'.HTML':'text/html','.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']}),rows=[];
 try{
  for(const lang of ['ru','en','kk']){
   let before;
   for(const variant of ['before','after']){
    const c=await browser.newContext({viewport:{width:1280,height:900}}),p=await c.newPage();await p.route(/^https?:\/\//,r=>r.request().url().startsWith(url)?r.continue():r.abort());await p.goto(url+(variant==='before'?'baseline/':'')+'Marketing_calc.HTML');await p.addStyleTag({path:path.join(root,'artifacts/type02/utilities.css')});await p.locator('#nomad360-lang-select').selectOption(lang);
    const f=fixture(),state={...Linked.fromV1({...f,currency:'USD'}),resources:f.resources,offers:f.offers,forecastMonths:f.forecastMonths,recurringDemandApproved:true,importedAt:'2026-10-12T00:00:00Z'};
    await p.evaluate(s=>{localStorage.setItem('marketingCalcLinkedPortfolioV2',JSON.stringify(s));LinkedPortfolioV2UI.resume();window.print=()=>{};},state);await p.waitForTimeout(150);A.equal(await p.evaluate(()=>Nomad360UI.savePrint('report')),true);await p.emulateMedia({media:'print'});if(variant==='before'){await p.addStyleTag({content:interFaces});await p.addStyleTag({path:path.join(root,'nomad360_palette.css')});}await p.evaluate(()=>document.fonts.ready);const print=await p.evaluate(printSnapshot);A.ok(print.every(x=>x.font.startsWith('Inter')),'Owned print report uses Inter');A.ok(print.every(x=>approvedPaints.has(x.color)),'Owned print report uses only approved ink');if(variant==='before'){before=print;}else A.deepEqual(print,before,'Print report content and geometry against the palette-normalized frozen document: '+lang);rows.push({type:'print-parity',lang,variant,baselinePaintNormalized:variant==='before',print});
    if(variant==='after'){
     await p.pdf({path:path.join(out,lang+'-report.pdf'),printBackground:true});await p.emulateMedia({media:'screen'});
     await p.locator('[data-nomad-embed-toggle]').click();
     A.equal(await p.locator('#nomad360-embed-comparison').isVisible(),true,'Portable export follows the task-6 comparison disclosure');
     const download=p.waitForEvent('download');await p.locator('[data-nomad-download-html]').click();const d=await download,file=path.join(out,lang+'-portable.html');await d.saveAs(file);const html=fs.readFileSync(file,'utf8');A.equal((html.match(/data:font\/woff2;base64,/g)||[]).length,4);A.ok(!html.includes('fonts.googleapis.com/css2?family=IBM'));
     const embedded=await c.newPage(),errors=[];embedded.on('pageerror',e=>errors.push(e.message));await embedded.route(/^https?:\/\//,r=>r.request().url().startsWith(url)?r.continue():r.abort());await embedded.goto(url+'artifacts/type02-b/'+lang+'-portable.html');await embedded.addStyleTag({path:path.join(root,'artifacts/type02/utilities.css')});await embedded.locator('#nomad360-lang-select').selectOption(lang);
     await embedded.evaluate(async()=>{const e=document.createElement('span');e.id='type02-portable-probe';e.textContent='Ә ә Ғ ғ Қ қ Ң ң Ө ө Ұ ұ Ү ү Һ һ І і';document.body.append(e);await document.fonts.load('400 17px Inter',e.textContent);await document.fonts.ready;});A.match((await embedded.evaluate(probeSnapshot)).family,/^Inter/);
     const cd=await c.newCDPSession(embedded);await cd.send('DOM.enable');await cd.send('CSS.enable');const {root:doc}=await cd.send('DOM.getDocument');const {nodeId}=await cd.send('DOM.querySelector',{nodeId:doc.nodeId,selector:'#type02-portable-probe'});const fonts=await cd.send('CSS.getPlatformFontsForNode',{nodeId});A.ok(fonts.fonts.length&&fonts.fonts.every(f=>f.familyName==='Inter'&&f.isCustomFont));A.deepEqual(errors,[]);rows.push({type:'portable-html',lang,bytes:Buffer.byteLength(html),fonts:fonts.fonts});await cd.detach();
    }
    await c.close();
   }
  }
  fs.writeFileSync(path.join(out,'exports-protocol.json'),JSON.stringify({rows},null,2)+'\n');console.log('TYPE02_EXPORTS_GREEN '+JSON.stringify({printParity:3,portableHTML:3,pdf:3}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
