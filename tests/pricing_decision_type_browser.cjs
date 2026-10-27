'use strict';
// Current, unprojected UI acceptance. Historical alignment is never used here.
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),scope=require('./helpers/pricing-decision-type-scope.cjs');
async function run({browser,baseUrl,utilities}){
 A.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'nomad360_design_system.css'))).digest('hex'),require('./fixtures/pricing-decision-type/changes.json').afterSha256);
 const beforeCss=scope.restore('nomad360_design_system.css',fs.readFileSync(path.join(root,'nomad360_design_system.css'),'utf8'));
 let cases=0,otherButtons=0;
 for(const width of [320,360,390,430,768,1280])for(const lang of ['ru','en','kk']){
  const values=[];
  for(const variant of ['before','after']){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.route(/^https?:\/\//,r=>{
     const url=r.request().url();
     if(variant==='before'&&url===baseUrl+'nomad360_design_system.css')return r.fulfill({contentType:'text/css',body:beforeCss});
     if(url.startsWith('https://cdn.tailwindcss.com'))return r.fulfill({contentType:'application/javascript',body:'const style=document.createElement("style");style.textContent='+JSON.stringify(utilities)+';document.head.appendChild(style);'});
     return url.startsWith(baseUrl)?r.continue():r.abort();
    });
    await page.goto(baseUrl+'Marketing_calc.HTML?demo=shopper&finance=cash',{waitUntil:'domcontentloaded'});
    await page.locator('[data-demo-ready="true"]').waitFor({state:'attached',timeout:60000});
    await page.evaluate(lang=>Nomad360UI.setLanguage(lang),lang);await page.evaluate(()=>document.fonts.ready);
    const result=await page.evaluate(()=>{
     const type=b=>{const s=getComputedStyle(b);return {size:s.fontSize,line:s.lineHeight,weight:s.fontWeight,font:s.fontFamily,color:s.color,bg:s.backgroundColor};};
     const pair=[...document.querySelectorAll('[data-pricing-decision]')].slice(0,2);
     const notice=Nomad360LocaleCore.t('tax.v2NoticeFull',Nomad360UI.getLanguage()),hint=document.querySelector('[data-sales-tax-v1-widget] [data-st-hint]').textContent;
     return {noticeCount:hint.split(notice).length-1,pair:pair.map(type),fits:pair.every(b=>b.getBoundingClientRect().width>0&&b.scrollWidth<=b.clientWidth+1),
      overflow:document.documentElement.scrollWidth>innerWidth+1,
      others:[...document.querySelectorAll('button:not([data-pricing-decision])')].map(b=>({id:b.id,text:b.textContent.trim(),...type(b)})),
      numbers:JSON.stringify(calculateProductPortfolio(),(key,value)=>typeof value==='string'?undefined:value)};
    });
    A.equal(result.noticeCount,1,'One current deduction notice');
    if(variant==='after'){
     A.equal(result.pair.length,2);for(const key of ['size','line','weight','font'])A.equal(result.pair[0][key],result.pair[1][key],width+'/'+lang+'/'+key);
     A.equal(result.fits,true,width+'/'+lang+' button fit');A.equal(result.overflow,false,width+'/'+lang+' page overflow');
    }
    A.deepEqual(errors,[]);values.push(result);
   }finally{await context.close();}
  }
  A.deepEqual(values[0].others,values[1].others,width+'/'+lang+' unrelated buttons');A.equal(values[0].numbers,values[1].numbers);
  otherButtons+=values[1].others.length;cases++;
 }
 return {cases,otherButtons,numberChanges:0};
}
module.exports={run};
