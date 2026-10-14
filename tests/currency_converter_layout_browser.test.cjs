const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.join(__dirname,'..'),art=path.join(root,'artifacts','converter','layout');fs.mkdirSync(art,{recursive:true});
const url=process.env.NOMAD360_TEST_URL||pathToFileURL(path.join(root,'Marketing_calc.HTML')).href;
// Check rendered word fragments, not just element boxes: a button can fit while
// its localized label breaks inside a word (the original 320px KK regression).
async function inspect(page){return page.evaluate(()=>{
 const issues=[],buttons=[];
 for(const button of document.querySelectorAll('#material-cost-entry-panel .material-cost-mode-choice,#material-cost-entry-panel [data-fx] button')){
  if(!button.getClientRects().length||button.closest('[hidden],.hidden')||button.closest('details')&&!button.closest('details').open)continue;
  const box=button.getBoundingClientRect(),style=getComputedStyle(button),words=[];
  if(box.x<0||box.right>innerWidth+1||box.height<44||button.scrollWidth>button.clientWidth+1)issues.push({type:'button-geometry',label:button.textContent.trim()});
  const walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);
  while(walker.nextNode())for(const match of walker.currentNode.textContent.matchAll(/\S+/gu)){
   const range=document.createRange();range.setStart(walker.currentNode,match.index);range.setEnd(walker.currentNode,match.index+match[0].length);
   const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0),lines=new Set(rects.map(r=>Math.round(r.top)));
   const word={text:match[0],lines:lines.size};words.push(word);
   if(lines.size>1)issues.push({type:'word-split',word:match[0],label:button.textContent.trim()});
   if(rects.some(r=>r.left<box.left-1||r.right>box.right+1))issues.push({type:'word-overflow',word:match[0]});
  }
  if(Number.parseFloat(style.fontSize)<16)issues.push({type:'small-font',label:button.textContent.trim(),font:style.fontSize});
  buttons.push({label:button.textContent.trim(),font:style.fontSize,width:box.width,height:box.height,words});
 }
 if(document.documentElement.scrollWidth>innerWidth+1)issues.push({type:'page-overflow'});
 return {issues,buttons,columns:getComputedStyle(document.querySelector('#material-cost-entry-panel>.grid')).gridTemplateColumns};
});}
async function open(browser,width,lang,baseline){
 const page=await browser.newPage({viewport:{width,height:1000}});
 await page.route(/^https?:\/\//,r=>url.startsWith('http')&&r.request().url().startsWith(new URL('./',url).href)?r.continue():r.abort());await page.goto(baseline?new URL('./artifacts/converter-layout-baseline/Marketing_calc.HTML',url).href:url,{waitUntil:'domcontentloaded'});
 await page.addStyleTag({path:path.join(root,'artifacts','converter-utilities.css')});
 await page.waitForFunction(()=>window.Nomad360PaymentUI&&window.Nomad360UI?.getLanguage());
 await page.locator('#nomad360-lang-select').selectOption(lang);
 await page.locator('#start-own-product').click();await page.locator('#product-name-input').fill('Layout / материал');await page.locator('#product-name-input').press('Enter');await page.evaluate(()=>selectProductSource('own'));
 const known=page.locator('[data-material-cost-mode="known"]'),calc=page.locator('[data-material-cost-mode="calculate"]');
 await known.click();A.equal(await known.getAttribute('aria-pressed'),'true');A.equal(await page.locator('#own-materials-known-wrap').isVisible(),true);
 await calc.click();A.equal(await calc.getAttribute('aria-pressed'),'true');A.equal(await known.getAttribute('aria-pressed'),'false');A.equal(await page.locator('#own-materials-calc-wrap').isVisible(),true);
 const wrap=page.locator('#own-material-rows [data-payment-field]').first();await page.locator('.material-cost-price').first().fill('1000');await wrap.locator('[data-payment-currency]').selectOption('CNY');
 const fx=wrap.locator('[data-fx]');await fx.evaluate(el=>el.open=true);
 await fx.locator('[data-fx-rate]').fill('2');await fx.locator('[data-fx-date]').fill('2026-01-02');await fx.locator('[data-fx-source]').fill('Layout fixture');await fx.locator('[data-fx-apply]').click();
 A.equal(await page.locator('.material-cost-price').first().inputValue(),'1000');A.equal(await page.evaluate(()=>Nomad360PaymentUI.readNumber(document.querySelector('.material-cost-price'))),2000);
 return {page,fx};
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.NOMAD360_CHROMIUM_PATH||undefined,args:['--no-sandbox']}),cases=[];let before;
 try{
  const baseline=fs.existsSync(path.join(root,'artifacts/converter-layout-baseline/Marketing_calc.HTML'));
  A.ok(baseline,'Archive accepted pre-TYPE-02 main with the original 26d8d01f payments CSS');
  const old=await open(browser,320,'kk',baseline);before=await inspect(old.page);fs.writeFileSync(path.join(art,'baseline-debug.json'),JSON.stringify(before,null,2));
  A.ok(before.issues.some(x=>x.type==='word-split'&&x.word.toLocaleLowerCase()==='анықтамалық'),'The original KK word split must reproduce');
  await old.fx.screenshot({path:path.join(art,'320-kk-before-fx.png')});await old.page.locator('#material-cost-entry-panel').screenshot({path:path.join(art,'320-kk-before-materials.png')});await old.page.close();
  console.log('CONVERTER_LAYOUT_BASELINE_RED_CONFIRMED',JSON.stringify(before.issues));
  for(const width of [320,360,390,430,768,1280])for(const lang of ['ru','en','kk']){
   console.log('CONVERTER_LAYOUT_CASE',width,lang);
   const {page,fx}=await open(browser,width,lang);const actual=await inspect(page);A.deepEqual(actual.issues,[],`${width}/${lang}`);
   A.equal(actual.buttons.length,4);A.equal(actual.columns.trim().split(/\s+/).length,width<768?1:2);
   if(width===320&&lang==='kk'){
    const oldFetch=before.buttons.find(b=>b.label.includes('Анықтамалық')),newFetch=actual.buttons.find(b=>b.label.includes('Анықтамалық'));A.equal(oldFetch.font,'18px');A.equal(newFetch.font,'16px','Accepted TYPE-02 action role, still >=16px');
   }
   await fx.screenshot({path:path.join(art,`${width}-${lang}-after-fx.png`)});await page.locator('#material-cost-entry-panel').screenshot({path:path.join(art,`${width}-${lang}-after-materials.png`)});
   cases.push({width,lang,...actual,knownAndCalculateWorking:true,rawAmount:1000,normalizedAmount:2000});await page.close();
  }
  fs.writeFileSync(path.join(art,'protocol.json'),JSON.stringify({baselineHead:'26d8d01f',before,cases},null,2));console.log('CONVERTER_LAYOUT_GREEN',JSON.stringify({cases:cases.length,wordSplits:0,actionFont:16,historicalActionFont:18}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
