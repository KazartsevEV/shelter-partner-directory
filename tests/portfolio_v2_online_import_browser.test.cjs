'use strict';
/* Current real V1 UI -> V2, with independent period oracles. Historical harness
   is preserved in docs/reviews/online-contract-maintenance-01/. */
const A=require('node:assert/strict'),{chromium}=require('playwright');
const path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const near=(a,b,label)=>A.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-7,label+': '+a+' != '+b);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const cases=[],url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
 try{
  for(const lang of ['en','ru','kk'])for(const width of [320,360,390,430,768,1280]){
   const context=await browser.newContext({viewport:{width,height:900},locale:lang==='kk'?'kk-KZ':lang==='ru'?'ru-RU':'en-US'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:\/\//,r=>r.abort());
   try{
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#nomad360-lang-select').selectOption(lang);
    await page.locator('#start-service').click();await page.locator('#service-work-online').click();
    const stages=[];
    for(const [index,role]of ['self','hired','agent'].entries()){
     if(index){await page.locator('[data-linked-back]').click();await page.evaluate(()=>showServiceChooser());}
     if(role==='agent'){
      await page.locator('#service-screen button[onclick="showAgentChooser()"]').click();
      await page.locator('#agent-screen button[onclick="selectServiceMode(\'agent\')"]').click();
     }else await page.locator('#service-screen button[onclick="selectServiceMode(\''+role+'\')"]').click();
     for(const [key,value]of Object.entries({months:3,monthlyBudget:400,cpc:4,ctr:2,cvrLead:20,cvrDeal:50,costConsult:100,costPack:200,ltv:30,mgmt:0,site:0,hosting:0,dom:0,magnet:0,acq:10,taxTurnover:5,...(role==='hired'?{markup:25}:role==='agent'?{agentPct:20,agentTaxTurnover:10}:{})}))await page.locator('#in-'+key).fill(String(value));
     if(role==='agent')await page.locator('input[name="payer-monthlyBudget"][value="me"]').check();
     await page.locator('#online-v2-name').fill(lang+' '+role+' Онлайн қызмет');
     await page.locator('#online-v2-add').click();A.equal(await page.locator('#portfolio-v2-screen').isVisible(),true);
     const current=await page.evaluate(()=>({state:LinkedPortfolioV2UI.getState(),result:LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState())}));
     A.equal(current.result.ready,true,JSON.stringify(current.result.errors));A.equal(current.state.skus.length,index+1);
     const item=current.result.items.find(x=>x.onlineRole===role);near(item.forecastOrders,25/3,role+' demand');
     near(item.revenue,role==='agent'?235:1175,role+' monthly revenue');near(item.priceGross,role==='agent'?28.2:141,role+' fixed price');
     if(role==='hired')near(item.cogs,940,'contractor');
     if(role==='agent')near(item.onlineProvenance.partnerGrossRevenue,3525,'principal provenance');
     near(current.result.totals.netProfit,[598.75,257.5,69][index],role+' cumulative profit');
     stages.push({role,revenue:item.revenue,profit:current.result.totals.netProfit});
    }
    const before=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
    await page.locator('[data-linked-save]').click();await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#portfolio-v2-linked-resume-home button').click();
    A.equal(await page.locator('[data-linked-sku]').count(),3);
    const after=await page.evaluate(()=>({state:LinkedPortfolioV2UI.getState(),result:LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState())}));
    A.deepEqual(after.state.skus,before.skus);near(after.result.totals.netProfit,69,'restored profit');
    A.deepEqual(errors,[]);cases.push({lang,width,stages,restored:true});console.log('ONLINE_IMPORT_CASE_GREEN',lang,width);
   }finally{await context.close();}
  }
  const out=process.env.ONLINE_CONTRACT_PROTOCOL||'artifacts/online-contract/protocol.json';fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify({cases,scope:'Actual configured-period UI bridge; no retired first-month/capacity UI claims'},null,2)+'\n');
  console.log('ONLINE_IMPORT_CURRENT_GREEN',JSON.stringify({cases:cases.length,roles:cases.length*3,restores:cases.length}));
 }finally{await browser.close();}
})().catch(e=>{console.error('ONLINE_IMPORT_CURRENT_RED',e.stack||e);process.exitCode=1;});
