'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const arg=(key,fallback)=>process.argv.find(v=>v.startsWith('--'+key+'='))?.split('=').slice(1).join('=')||fallback;
const root=path.resolve(__dirname,'..'),artifacts=path.resolve(arg('artifacts','artifacts/v2-money-lines'));
const rejected=path.resolve(arg('rejected','/tmp/nomad-v2-stage2-rejected'));
const utilities=path.resolve(arg('utilities','artifacts/v2-utilities.css'));
const fixtures=JSON.parse(fs.readFileSync(path.resolve(arg('receipts','artifacts/v2-containers/after/receipts.json')),'utf8'));
const widths=[320,360,390,430,768,1280],languages=['ru','en','kk'];
async function business(page,route){return page.evaluate(route=>{
 const ui=route==='standalone'?PortfolioV2UI:LinkedPortfolioV2UI;
 const engine=route==='standalone'?PortfolioV2Engine:LinkedPortfolioV2Engine;
 const state=ui.getState();return {state,finance:engine.build(state)};
},route);}
async function inspect(page,route){return page.evaluate(route=>NomadMoneyLines.audit(
 document.getElementById(route==='standalone'?'p2-results':'linked-results')),route);}
(async()=>{
 fs.mkdirSync(artifacts,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),receipts={};
 const failures=[];
 try{
  for(const version of ['rejected','fixed']){
   fs.mkdirSync(path.join(artifacts,version),{recursive:true});
   for(const route of ['standalone','linked'])for(const language of languages)for(const width of widths){
    const key=[route,language,width].join('-'),fixture=fixtures[route+'-ready-'+language+'-'+width];
    const context=await browser.newContext({locale:language==='kk'?'kk-KZ':language==='en'?'en-US':'ru-RU',viewport:{width,height:900}});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route(/^https?:\/\//,r=>r.abort());
    await page.goto(pathToFileURL(path.join(version==='fixed'?root:rejected,'Marketing_calc.HTML')).href,{waitUntil:'domcontentloaded'});
    await page.addStyleTag({path:utilities});
    await page.addScriptTag({path:path.join(__dirname,'helpers/v2-money-lines.cjs')});
    await page.evaluate(language=>Nomad360UI.setLanguage(language),language);
    await page.evaluate(({route,state})=>{
     localStorage.setItem(route==='standalone'?'marketingCalcPortfolioV2':'marketingCalcLinkedPortfolioV2',JSON.stringify(state));
     if(route==='standalone')PortfolioV2UI.open({resume:true});else LinkedPortfolioV2UI.resume();
    },{route,state:fixture.state});
    await page.waitForTimeout(80);
    const original=await business(page,route),actual=await inspect(page,route);
    A.ok(original.finance.ready);A.ok(actual.count>=8,'actual result values '+key);
    if(version==='fixed'){
     A.deepEqual(original,receipts['rejected-'+key].business,'same state and finance '+key);
     if(actual.failures.length)failures.push({key,phase:'actual',failures:actual.failures});
    }
    if([320,390,1280].includes(width)){
     const selector=route==='standalone'?'#p2-results':'#linked-results';
     await page.locator(selector).evaluate(el=>el.scrollIntoView({block:'start'}));
     await page.screenshot({path:path.join(artifacts,version,key+'-results.png')});
     if(route==='linked'){
      await page.locator('#linked-results > .grid').last().evaluate(el=>el.scrollIntoView({block:'start'}));
      await page.screenshot({path:path.join(artifacts,version,key+'-capital.png')});
     }
    }
    // Display-only probes cover the exact reported decimal splits, grouping,
    // negative cash and a larger amount. They never change the business inputs.
    await page.evaluate(({route,language})=>{
     const host=document.getElementById(route==='standalone'?'p2-results':'linked-results');
     const values=[...host.querySelectorAll('div.font-black')].filter(el=>!el.closest('table'));
     const numbers=[2706,1419.09,2551.34,-25051.34,-99999999.99];
     const formatter=new Intl.NumberFormat(language==='kk'?'kk-KZ':language==='en'?'en-US':'ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2});
     numbers.forEach((n,i)=>{
      values[i].setAttribute('data-nomad-display-number',String(n));
      values[i].textContent=formatter.format(n);
     });
    },{route,language});
    await page.waitForTimeout(50);
    const probes=await inspect(page,route);
    A.deepEqual(await business(page,route),original,'display probes do not change finance '+key);
    if(version==='fixed'&&probes.failures.length)failures.push({key,phase:'probes',failures:probes.failures});
    receipts[version+'-'+key]={business:original,actual,probes};
    A.deepEqual(errors,[],key);await context.close();
   }
  }
  for(const route of ['standalone','linked']){
   A.ok(receipts['rejected-'+route+'-ru-320'].actual.failures.some(v=>v.lineCount>1),
    'rejected CSS reproduces split digits at 320 '+route);
   A.ok(receipts['rejected-'+route+'-ru-320'].probes.failures.some(v=>/706|419|551/.test(v.text)&&v.lineCount>1),
    'reported amounts reproduce split decimal parts '+route);
  }
  fs.writeFileSync(path.join(artifacts,'receipts.json'),JSON.stringify(receipts,null,2));
  A.deepEqual(failures,[],'every actual and probe value is one line and fully visible');
  console.log('V2_MONEY_LINES_GREEN 36 rejected + 36 fixed cases; one line, fit, unchanged finance');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
