'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),all=['self','hired','agent'],languages=['ru','en','kk'];
const filesuffix={'.HTML':'text/html','.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webmanifest':'application/manifest+json'};
(async()=>{
  const server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
    res.setHeader('Content-Type',filesuffix[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/',browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  let cases=0;
  try{
    for(const language of languages)for(const width of [390,1280]){
      const context=await browser.newContext({viewport:{width,height:900},locale:language==='kk'?'kk-KZ':language==='en'?'en-US':'ru-RU',reducedMotion:'reduce'});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route(/^https?:\/\//,route=>route.request().url().startsWith(base)?route.continue():route.abort());
      await page.goto(base+'Marketing_calc.HTML?lang='+language,{waitUntil:'domcontentloaded'});
      A.equal(await page.locator('#nomad-simple-service-examples').count(),1,'Single sample UI');
      A.equal(await page.locator('#nomad360-return').count(),1);
      await page.evaluate(()=>dispatchEvent(new Event('appinstalled')));
      const confirmation=await page.locator('#nomad360-return p.nomad-return-status').evaluate(el=>({color:getComputedStyle(el).color,weight:getComputedStyle(el).fontWeight,opacity:getComputedStyle(el).opacity}));
      A.deepEqual(confirmation,{color:'rgb(255, 255, 255)',weight:'400',opacity:'1'});
      for(const role of all){
        await page.evaluate(role=>{selectServiceFinancialMode('simple');chooseServiceChannel('online');selectServiceMode(role);},role);
        const panel=page.locator('#nomad-simple-service-examples');
        A.equal(await panel.isVisible(),true,'Examples only for simple services');
        A.equal(await panel.locator('[data-simple-demo]').count(),2);
        for(const index of [0,1]){
          await panel.locator('[data-simple-demo="'+index+'"]').click();
          const sample=await page.evaluate(()=>({
            mode:serviceMode,values:{...currentValues},payers:{...agentPayers},
            freeCash:document.getElementById('service-simple-free-cash-detail')?.dataset.cashState,
            shown:Array.from(document.querySelectorAll('#inputs-container input[type=number]')).map(input=>({id:input.id,value:Number(input.value)}))
          }));
          A.equal(sample.mode,role);
          A.ok(sample.values.monthlyBudget>0&&sample.values.months>=1&&sample.values.costConsult>0,'Plausible nonzero demo');
          if(role==='hired')A.ok(sample.values.markup>0);
          if(role==='agent'){
            A.ok(sample.values.agentPct>0);
            A.equal(sample.freeCash,'ready','All nonzero agent expenses have assigned payers');
            for(const key of ['monthlyBudget','mgmt','site','hosting','dom','magnet'])if(sample.values[key]>0)A.ok(['me','partner'].includes(sample.payers[key]),key);
          }
          A.ok(sample.shown.length>=14);
          const note=await panel.locator('.nomad-simple-demo-note').textContent();
          A.ok(note.length>25,'Example is conspicuously identified');
          const demoRect=await panel.evaluate(x=>x.getBoundingClientRect().toJSON());
          A.ok(demoRect.left>=0&&demoRect.right<=width+1,'Examples fit the screen');

          // This button must clear to zero, not restore the built-in default fixture.
          await page.locator('#calculator-screen header button[onclick="resetDefaults()"]').click();
          const reset=await page.evaluate(()=>({
            values:{...currentValues},payers:{...agentPayers},
            shown:[...document.querySelectorAll('#inputs-container input[type=number]')].map(x=>({id:x.id,value:Number(x.value)}))
          }));
          for(const [key,value] of Object.entries(reset.values))A.equal(value,key==='months'?1:0,'Blank state '+role+'/'+key);
          for(const payer of Object.values(reset.payers))A.equal(payer,null,'Agent payers cleared');
          for(const input of reset.shown)A.equal(input.value,input.id==='in-months'?1:0,'Visible input cleared '+input.id);
          A.equal(await panel.locator('[aria-pressed="true"]').count(),0);
          cases++;
        }
      }
      // Changing language changes only the explanation, never entered sample state.
      await page.evaluate(()=>{selectServiceMode('self');Nomad360SimpleExamples.applyExample(0);});
      const before=await page.evaluate(()=>JSON.stringify(currentValues));
      await page.evaluate(()=>Nomad360UI.setLanguage('en'));
      A.equal(await page.evaluate(()=>JSON.stringify(currentValues)),before);
      await context.close();
      A.deepEqual(errors,[],'No browser errors');
    }
    console.log('SIMPLE_SERVICE_EXAMPLES_GREEN',JSON.stringify({cases,roles:all,examplesPerRole:2,languages,widths:[390,1280]}));
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error('SIMPLE_SERVICE_EXAMPLES_RED',error);process.exitCode=1;});
