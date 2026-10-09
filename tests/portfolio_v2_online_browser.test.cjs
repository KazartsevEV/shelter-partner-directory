const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\//,r=>r.abort());
 const url=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
 const fill=async id=>{for(const [key,val]of Object.entries({
   months:3,monthlyBudget:400,cpc:4,ctr:2,cvrLead:20,cvrDeal:50,
   costConsult:100,costPack:200,ltv:30,mgmt:0,site:0,hosting:0,
   dom:0,magnet:0,acq:10,taxTurnover:5,...id
 }))await page.locator('#in-'+key).fill(String(val));};
 const close=(a,b)=>A.ok(Math.abs(a-b)<.01,a+' != '+b);
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#start-service').click();
  await page.locator('#service-work-online').click();
  await page.getByRole('button',{name:'Я сам'}).click();
  await fill({});
  await page.locator('#online-v2-name').fill('Консультации онлайн');
  await page.locator('#online-v2-add').click();
  A.equal(await page.locator('#portfolio-v2-screen').isVisible(),true);
  let s=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  A.equal(s.skus.length,1);
  A.equal(s.skus[0].onlineRole,'self');
  A.equal(s.skus[0].name,'Консультации онлайн');
  let out=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(out.ready,true,JSON.stringify(out.errors));
  close(out.totals.netProfit,598.75);
  await page.locator('[data-linked-back]').click();
  A.equal(await page.locator('#calculator-screen').isVisible(),true);
  await page.evaluate(()=>showServiceChooser());
  await page.getByRole('button',{name:'Нанимаю другого'}).click();
  await fill({markup:25});
  await page.locator('#online-v2-name').fill('Видеоконсультация подрядчика');
  await page.locator('#online-v2-add').click();
  s=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  A.equal(s.skus.length,2);
  A.equal(s.skus[1].onlineRole,'hired');
  out=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(out.ready,true,JSON.stringify(out.errors));
  close(out.items.find(x=>x.onlineRole==='hired').cogs,940);
  await page.locator('[data-linked-back]').click();
  await page.evaluate(()=>showServiceChooser());
  await page.getByRole('button',{name:'Я агент'}).click();
  await page.getByRole('button',{name:'Мне платят % с объёма продаж'}).click();
  await fill({agentPct:20,agentTaxTurnover:10});
  await page.locator('input[name="payer-monthlyBudget"][value="me"]').check();
  await page.locator('#online-v2-name').fill('Агент по консультациям');
  await page.locator('#online-v2-add').click();
  s=await page.evaluate(()=>LinkedPortfolioV2UI.getState());
  A.equal(s.skus.length,3);
  A.deepEqual(s.skus.map(x=>x.onlineRole),['self','hired','agent']);
  out=await page.evaluate(()=>LinkedPortfolioV2Engine.build(LinkedPortfolioV2UI.getState()));
  A.equal(out.ready,true,JSON.stringify(out.errors));
  const agent=out.items.find(x=>x.onlineRole==='agent');
  close(agent.revenue,235);
  close(agent.priceList,28.2);
  A.equal(agent.onlineProvenance.partnerGrossRevenue,3525);
  close(out.totals.netProfit,69);
  await page.locator('[data-linked-save]').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#portfolio-v2-linked-resume-home button').click();
  A.equal(await page.locator('[data-linked-sku]').count(),3);
  A.deepEqual(errors,[]);
  console.log('ONLINE_V2_BRIDGE_BROWSER_GREEN',{roles:s.skus.map(x=>x.onlineRole),profit:out.totals.netProfit});
 }finally{await browser.close()}
})().catch(e=>{console.error('ONLINE_V2_BRIDGE_BROWSER_RED',e.stack||e);process.exitCode=1});
