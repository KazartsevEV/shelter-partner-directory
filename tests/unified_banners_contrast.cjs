'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),A=require('node:assert/strict'),{chromium}=require('playwright'),{auditRendered}=require('./helpers/rendered-contrast.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/unified-banners');
(async()=>{
 const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://x').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.HTML':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/',browser=await chromium.launch({headless:true,args:['--no-sandbox']}),cases=[];
 try{for(const lang of ['ru','en','kk'])for(const width of (process.env.BANNER_CONTRAST_WIDTHS||'320,360,390,430,768,1280,1440').split(',').map(Number)){
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage();await context.route(/^https?:\/\//,r=>r.request().url().startsWith(base)?r.continue():r.abort());await page.goto(base+'Marketing_calc.HTML?lang='+lang);await page.addStyleTag({path:path.join(out,'utilities.css')});await page.evaluate(()=>document.fonts.ready);await page.evaluate(async()=>Promise.all(['hero','about','support','consulting','support-mobile','consulting-mobile'].map(async name=>{const im=new Image();im.src='./assets/nomad360-banners/'+name+'.webp';await im.decode();})));
 for(const state of ['closed','open']){
 if(state==='open'){await page.evaluate(()=>document.querySelectorAll('#nomad360-footer details').forEach(e=>e.open=true));await page.locator('[data-nomad-embed-toggle]').click();}
 const result=await auditRendered(page,['#nomad360-commercial-banner','#nomad360-information','#nomad360-return-support','#nomad360-embed','#nomad360-legal-strip']);
 cases.push({lang,width,state,...result});fs.writeFileSync(path.join(out,'contrast.json'),JSON.stringify({cases},null,2)+'\n');A.ok(result.count>35,lang+'/'+width+'/'+state+' measured text');console.log('PAINTED_CONTRAST '+lang+' '+width+' '+state+' min='+result.minimum+' failures='+JSON.stringify(result.failures));
 }await context.close();
 }A.deepEqual(cases.flatMap(c=>c.failures.map(f=>({lang:c.lang,width:c.width,state:c.state,...f}))),[],'Every rendered text must meet the unchanged 4.5:1 threshold');console.log('PAINTED_CONTRAST_GREEN '+cases.length);}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
