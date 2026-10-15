const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {createServer}=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');

const ROOT=path.resolve(__dirname,'..');
let snapshot=null;
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.css':'text/css;charset=utf-8','.png':'image/png','.HTML':'text/html;charset=utf-8'};
const server=createServer(async(req,res)=>{
 try{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=path.resolve(ROOT,'.'+name);
  if(name==='/Nomad360-calculator-embed.html'&&snapshot){
   res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(snapshot);return;
  }
  if(!target.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}
  const bytes=await fs.readFile(target);
  res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'});
  res.end(bytes);
 }catch(e){res.writeHead(404);res.end('Not found');}
});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/';
  const page=await browser.newPage({acceptDownloads:true,locale:'ru-RU',viewport:{width:390,height:844}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
  await page.goto(url+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
  // Embedded NOWPayments form replaces the Trybit link. No checkout route
  // can displace the donation form, and the remaining bank options stay intact.
  const support=page.locator('#nomad360-support');
  const crypto=support.locator('.nomad-crypto-panel');
  const iframe=crypto.locator('iframe.nomad-crypto-frame');
  A.equal(await crypto.count(),1,'One prominent crypto donation panel');
  A.equal(await iframe.getAttribute('src'),'https://nowpayments.io/embeds/donation-widget?api_key=47aebf88-76b9-4871-9217-d3f5b46de839');
  A.equal(await iframe.getAttribute('loading'),'lazy');
  A.equal(await iframe.getAttribute('title'),'Поддержать Nomad360 криптовалютой');
  A.equal(await support.locator('.nomad-donate-checkout-link').count(),0,
    'Legacy Trybit checkout link removed');
  A.doesNotMatch(await support.innerText(),/Trybit/i);
  const brand=await crypto.evaluate(el=>{
    const heading=getComputedStyle(el.querySelector('.nomad-crypto-heading'));
    const title=getComputedStyle(el.querySelector('h3'));
    return {background:heading.backgroundColor,color:title.color};
  });
  A.deepEqual(brand,{background:'rgb(237, 142, 99)',color:'rgb(22, 55, 90)'},
    'The visible widget panel has Nomad360 orange and navy branding');
  A.equal(await support.locator('.nomad-pay-kaspi .nomad-kz-flag').textContent(),'🇰🇿');
  A.match(await support.locator('.nomad-pay-kaspi').innerText(),
    /Перевод по номеру телефона для владельцев казахстанских карт/);
  A.match(await support.locator('.nomad-pay-kaspi').innerText(),/\+7 777 129 56 93/);
  A.equal(await support.locator('.nomad-pay-kaspi [data-nomad-copy]').getAttribute('data-nomad-copy'),
    '+7 777 129 56 93');
  A.equal(await support.locator('.nomad-pay-bank').getAttribute('open'),null);
  await support.locator('.nomad-pay-bank summary').click();
  A.equal(await support.locator('.nomad-pay-bank').getAttribute('open'),'');
  for(const [label,value] of [['Получатель','Kazartsev Evgenii'],
    ['Банк','АО Kaspi Bank'],['SWIFT/BIC','CASPKZKA'],
    ['IBAN','KZ53722C000089313796']]){
    const row=support.locator('.nomad-bank-row').filter({hasText:value});
    A.equal(await row.count(),1,label+' shown once');
    A.equal(await row.locator('[data-nomad-copy]').getAttribute('data-nomad-copy'),value);
  }
  A.equal(await support.locator('.nomad-russian-transfer').getAttribute('open'),null);
  await support.locator('.nomad-russian-transfer summary').click();
  A.match(await support.locator('.nomad-russian-transfer').innerText(),/Озон Банк/);
  A.match(await support.locator('.nomad-russian-transfer').innerText(),/\+7 977 986 74 41/);
  A.equal(await support.locator('.nomad-russian-transfer [data-nomad-copy]')
    .getAttribute('data-nomad-copy'),'+7 977 986 74 41');
  A.equal(await support.locator('.nomad-russian-details strong')
    .evaluate(node=>getComputedStyle(node).color),'rgb(237, 142, 99)',
    'Bank name Ozon is orange');
  A.equal(await support.evaluate(el=>{
    const last=el.querySelector('.nomad-russian-transfer');
    const footerChildren=[...el.children];
    return footerChildren[footerChildren.length-1]===last;
  }),true,'Russia card link is the LAST support option');
  A.doesNotMatch(await support.textContent(),/Bybit|Байбит|Байбит картасы/i);
  A.equal(await support.locator('.nomad-direct-crypto, .nomad-qr, .nomad-pay-crypto').count(),0,
    'NOWPayments widget replaces standalone USDT/BTC wallet links entirely');
  A.equal(await support.locator('.nomad-copy').count(),6,
    'KZ phone + four SWIFT details + Ozon number');
  for(const width of [320,390,1440]){
    await page.setViewportSize({width,height:844});
    const geometry=await support.evaluate(el=>({
      viewport:innerWidth,
      maxRight:Math.max(...[el,...el.querySelectorAll('.nomad-pay-fiat > *, .nomad-crypto-panel, .nomad-crypto-frame, .nomad-bank-row, .nomad-russian-transfer')].map(n=>n.getBoundingClientRect().right)),
      minLeft:Math.min(...[el,...el.querySelectorAll('.nomad-pay-fiat > *, .nomad-crypto-panel, .nomad-crypto-frame')].map(n=>n.getBoundingClientRect().left))
    }));
    A.ok(geometry.maxRight<=width+1&&geometry.minLeft>=-1,
      'Donation cards fit '+width+' viewport: '+JSON.stringify(geometry));
    const widgetLayout=await crypto.evaluate(el=>{
      const iframe=el.querySelector('iframe');
      const frame=iframe.getBoundingClientRect();
      const clip=el.querySelector('.nomad-crypto-viewport').getBoundingClientRect();
      const section=el.getBoundingClientRect();
      const next=el.nextElementSibling?.getBoundingClientRect();
      return {height:frame.height,width:frame.width,
        nativeHeight:iframe.clientHeight,
        viewportHeight:clip.height,viewportWidth:clip.width,
        extraBottom:section.bottom-clip.bottom,
        gapToFiat:next?next.top-section.bottom:null,
        transform:getComputedStyle(iframe).transform};
    });
    A.equal(widgetLayout.nativeHeight,623,'Hosted iframe viewport retains its full native 623px at '+width);
    A.ok(Math.abs(widgetLayout.height-485.94)<1,
      'Whole live widget compresses to approximately 486px at '+width+': '+JSON.stringify(widgetLayout));
    A.equal(widgetLayout.viewportHeight,487,'Tight clipping wrapper reserves only scaled height at '+width);
    A.ok(widgetLayout.width<=346.5,'Scaled iframe fits mobile width at '+width);
    A.ok(widgetLayout.extraBottom<=22,'No whitespace below scaled widget at '+width+': '+JSON.stringify(widgetLayout));
    A.ok(widgetLayout.gapToFiat===null||widgetLayout.gapToFiat<=32,
      'Kaspi follows scaled widget without excessive spacing at '+width+': '+JSON.stringify(widgetLayout));
  }
  A.equal(await iframe.getAttribute('height'),'623',
    'HTML height attribute agrees with the provider recommended iframe size');
  await page.setViewportSize({width:390,height:844});
  const snapshotDir=path.resolve(ROOT,'artifacts/donation-footer');
  await fs.mkdir(snapshotDir,{recursive:true});
  await support.screenshot({path:path.join(snapshotDir,'donations-mobile-390.png'),animations:'disabled'});
  for(const [lang,headline] of [['en','Support Nomad360 with cryptocurrency'],
    ['kk','Nomad360 жобасын криптовалютамен қолдау'],
    ['ru','Поддержать Nomad360 криптовалютой']]){
    await page.evaluate(language=>Nomad360UI.setLanguage(language),lang);
    A.match(await support.locator('.nomad-crypto-heading h3').innerText(),new RegExp(headline));
    A.equal(await support.locator('iframe.nomad-crypto-frame').getAttribute('src'),
      'https://nowpayments.io/embeds/donation-widget?api_key=47aebf88-76b9-4871-9217-d3f5b46de839');
    A.equal(await support.locator('iframe.nomad-crypto-frame').count(),1);
    A.equal(await support.locator('.nomad-pay-bank summary').count(),1);
    A.equal(await support.locator('.nomad-russian-transfer summary').count(),1);
    A.doesNotMatch(await support.textContent(),/Bybit|Байбит/i);
  }
  await page.setViewportSize({width:1440,height:900});
  await support.screenshot({path:path.join(snapshotDir,'donations-desktop-1440.png'),animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  const license=page.locator('#nomad360-footer');
  await page.locator('[data-nomad-embed-toggle]').click();
  await page.locator('#nomad360-license summary').click();
  A.equal(await license.evaluate(el=>{
    const embed=el.querySelector('.nomad-embed-actions');
    const terms=el.querySelector('.nomad-license-terms');
    const contact=embed?.querySelector('.nomad-embed-contact');
    return !!embed&&!!terms&&!!contact&&
      !!(contact.compareDocumentPosition(terms)&Node.DOCUMENT_POSITION_FOLLOWING)&&
      terms.parentElement.querySelector('summary')?.textContent==='Лицензия и использование'&&
      terms.querySelector('a')?.getAttribute('href')?.endsWith('/CALCULATOR_LICENSE.md');
  }),true,'License and usage must be below the entire calculator embed block');
  A.equal(await license.locator('[data-nomad-download-html]').count(),1);
   A.equal(await license.locator('[data-nomad-embed-retry]').isVisible(),false,
     'Manual fallback is hidden until the HTML has been prepared');
   const mobileBrand=await page.locator('.nomad-brand').evaluate(el=>({
     logo:getComputedStyle(el.querySelector('.nomad-logo')).width,
     word:getComputedStyle(el.querySelector('.nomad-wordmark')).fontSize
   }));
   A.deepEqual(mobileBrand,{logo:'42px',word:'21px'},'Mobile header branding enlarged');
   A.equal(await page.locator('.nomad-bar').evaluate(el=>el.scrollWidth<=el.clientWidth),true,
     'Branding must fit the mobile header');
  A.match(await license.textContent(),/Скачать бесплатную версию/);
  A.match(await license.textContent(),/Работаете в B2B\? Привлеките полезный трафик бесплатно/);
  A.match(await license.textContent(),/Уникальные посетители GitHub-репозитория за последние 14 дней:/);
  const visitors=(await license.locator('[data-nomad-traffic-value]').textContent()).trim();
  A.match(visitors,/^(?:—|[0-9][0-9\s\u00a0\u202f]*)$/,
    'Visitor counter may be unavailable or populated from the real 14-day snapshot');
  A.equal(await license.locator('[data-nomad-traffic-stats] a').count(),0,
    'Do not add a GitHub link to the visitor label');
  A.doesNotMatch(await license.locator('[data-nomad-traffic-stats]').textContent(),
    /просмотры|за 7 дней/i,'Only one visitor metric in the footer');
  A.equal(await license.evaluate(el=>{
    const button=el.querySelector('[data-nomad-download-html]');
    const stats=el.querySelector('[data-nomad-traffic-stats]');
    return !!button&&!!stats&&!!(button.compareDocumentPosition(stats)&Node.DOCUMENT_POSITION_FOLLOWING);
  }),true,'Traffic widget must sit below the embed button');
  A.match(await license.textContent(),/Автоматическое обновление не поддерживается/);
  const visual=await license.evaluate(el=>{
    const download=getComputedStyle(el.querySelector('.nomad-embed-download'));
    const secondary=getComputedStyle(el.querySelector('.nomad-embed-contact'));
    return {
      downloadBackground:download.backgroundColor,downloadColor:download.color,
      secondaryBackground:secondary.backgroundColor,secondaryColor:secondary.color,
      hintFont:parseFloat(getComputedStyle(el.querySelector('.nomad-embed-hint')).fontSize)
    };
  });
  A.equal(visual.downloadBackground,'rgb(244, 247, 252)','Free Embed download is the light secondary footer action');
  A.equal(visual.downloadColor,'rgb(22, 55, 90)','Free Embed label remains navy');
  A.equal(visual.secondaryBackground,'rgb(237, 142, 99)','Custom order is the orange primary CTA');
  A.equal(visual.secondaryColor,'rgb(22, 55, 90)','Custom order label uses navy');
  A.ok(visual.hintFont>=14,'Embed instruction must remain legible');
  const mail=await license.locator('.nomad-embed-contact').getAttribute('href');
  A.ok(mail.startsWith('mailto:nomad260393@gmail.com?subject='));
  A.match(decodeURIComponent(mail),/Nomad360 — Заказать/);
  const wait=page.waitForEvent('download',{timeout:45000});
  await license.locator('[data-nomad-download-html]').click();
  const download=await wait;
  A.equal(download.suggestedFilename(),'Nomad360-calculator-embed.html');
  snapshot=await fs.readFile(await download.path(),'utf8');
  A.ok(snapshot.length>500000,'Export must contain the actual calculator and all modules');
  A.match(snapshot,/data-nomad-bundled="\.\u002fnomad360_design_system\.css"/);
  A.match(snapshot,/data-nomad-bundled="\.\u002fportfolio_v2_linked_ui\.js"/);
  A.match(snapshot,/data:image\/png;base64,/);
  A.doesNotMatch(snapshot,/<script[^>]*src="\.\//i,'No broken relative JS');
  A.doesNotMatch(snapshot,/<link[^>]*href="\.\//i,'No broken relative CSS');
  A.ok(snapshot.includes('function deleteCalculatedProduct('),'Full current V1 must be bundled');
  A.equal(await license.locator('[data-nomad-embed-status]').textContent(),'HTML готов к скачиванию');
   const retry=license.locator('[data-nomad-embed-retry]');
   A.equal(await retry.isVisible(),true,'Recovery CTA appears after preparation');
   A.match(await retry.textContent(),/Если загрузка не началась, нажмите здесь/);
   const fallback=retry.locator('[data-nomad-retry-download]');
   A.match(await fallback.getAttribute('href'),/^blob:/);
   A.equal(await fallback.getAttribute('download'),'Nomad360-calculator-embed.html');
   const retryColors=await retry.evaluate(el=>({
     background:getComputedStyle(el).backgroundColor,
     text:getComputedStyle(el.querySelector('a')).color
   }));
   A.deepEqual(retryColors,{background:'rgb(237, 142, 99)',text:'rgb(22, 55, 90)'},
     'Fallback CTA uses orange background and navy action text');
   const repeated=page.waitForEvent('download',{timeout:10000});
   await fallback.click();
   A.equal((await repeated).suggestedFilename(),'Nomad360-calculator-embed.html',
     'Manual fallback downloads the already-prepared file');
   await page.setViewportSize({width:1280,height:900});
   const desktopBrand=await page.locator('.nomad-brand').evaluate(el=>({
     logo:getComputedStyle(el.querySelector('.nomad-logo')).width,
     word:getComputedStyle(el.querySelector('.nomad-wordmark')).fontSize
   }));
   A.deepEqual(desktopBrand,{logo:'58px',word:'29px'},'Desktop header branding enlarged');
  A.deepEqual(errors,[],'Export click must not introduce script errors');
  await page.close();
  const stats=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
  await stats.route('**/nomad360_repo_traffic.json',route=>route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify({
      status:'ok',source:'github-repository-traffic',
      repository:'KazartsevEV/shelter-partner-directory',
      updatedAt:new Date().toISOString(),visitors14:63
    })
  }));
  await stats.goto(url+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
  await stats.waitForFunction(()=>document.querySelector('[data-nomad-traffic-value]')?.textContent==='63');
  A.match(await stats.locator('[data-nomad-traffic-stats]').textContent(),
    /Уникальные посетители GitHub-репозитория за последние 14 дней:.*63/);
  A.equal(await stats.locator('[data-nomad-traffic-stats] a').count(),0,
    'One statistic without a GitHub link');
  await stats.close();
  // Reproduce a transient browser fetch failure. The number must appear
  // automatically after a retry, without reloading the calculator.
  const counterRetryPage=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
  let attempts=0;
  await counterRetryPage.route('**/nomad360_repo_traffic.json',route=>{
    attempts+=1;
    if(attempts===1)return route.abort('failed');
    return route.fulfill({
      status:200,contentType:'application/json',body:JSON.stringify({
        status:'ok',source:'github-repository-traffic',
        repository:'KazartsevEV/shelter-partner-directory',
        updatedAt:new Date().toISOString(),visitors14:63
      })
    });
  });
  await counterRetryPage.goto(url+'Marketing_calc.HTML',{waitUntil:'domcontentloaded'});
  await counterRetryPage.waitForFunction(
    ()=>document.querySelector('[data-nomad-traffic-value]')?.textContent==='63',
    null,{timeout:15000});
  A.equal(attempts,2,'The counter retries once after a network error');
  await counterRetryPage.close();
  const embed=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
  const embeddedErrors=[];
  embed.on('pageerror',e=>embeddedErrors.push(e.message));
  await embed.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
  await embed.goto(url+'Nomad360-calculator-embed.html',{waitUntil:'domcontentloaded'});
  A.equal(await embed.locator('#nomad360-header').count(),1);
  A.equal(await embed.locator('#nomad360-footer').count(),1);
  A.equal(await embed.locator('#start-own-product').count(),1);
  A.ok(await embed.evaluate(()=>!!window.LinkedPortfolioV2UI&&!!window.PortfolioV2UI));
  A.ok(await embed.evaluate(()=>!!window.ExcelJS?.Workbook&&!!window.Nomad360PriceExport));
  await embed.evaluate(()=>{
    const s={version:2,currency:'USD',marketing:{budget:1000,cpc:5,ctrPct:2,clickLeadPct:20,leadOrderPct:25,periodMonths:2,cacReservePct:100},skus:[{id:'embed',name:'Embedded Excel',source:'resale',unitCost:20,marginPct:25,mixPct:100,batchUnits:20,initialCashOut:400,fulfillmentPerOrder:0,storagePerUnitDay:0,acquiringPct:0}],resources:[],funding:{kind:'cash',reservePct:10},tax:{type:'turnover',pct:6,vatPct:0}};
    localStorage.setItem('marketingCalcPortfolioV2',JSON.stringify(s));openPortfolioV2(true);
  });
  await embed.locator('[data-nomad-price-toggle]').click();
  const xlsxEvent=embed.waitForEvent('download');await embed.locator('[data-nomad-excel]').last().click();const xlsxDownload=await xlsxEvent;
  A.match(xlsxDownload.suggestedFilename(),/USD\.xlsx$/);console.log('EMBED_EXCEL_DOWNLOAD_GREEN');
  await embed.evaluate(()=>showHome());
  await embed.locator('#start-own-product').click();
  A.equal(await embed.locator('#product-screen').isVisible(),true);
  A.deepEqual(embeddedErrors,[],'Exported HTML must execute in its new context');
  const font=await embed.locator('#product-name-input').evaluate(x=>getComputedStyle(x).fontFamily);
  A.match(font,/^Inter,/);
  console.log('NOMAD360_EMBED_DOWNLOAD_GREEN',JSON.stringify({bytes:snapshot.length,
    logoBundled:true,scriptsBundled:true,standaloneCalculator:true}));
  await embed.close();
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error('NOMAD360_EMBED_DOWNLOAD_RED',e.stack||e);process.exitCode=1;});
