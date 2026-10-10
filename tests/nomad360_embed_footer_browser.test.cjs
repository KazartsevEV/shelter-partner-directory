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
  const license=page.locator('#nomad360-license');
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
  A.match(await license.textContent(),/Встроить калькулятор на мой сайт/);
  const b2b=await license.evaluate(el=>{
    const offer=el.querySelector('.nomad-embed-b2b-offer');
    const question=el.querySelector('.nomad-embed-b2b-question');
    const answer=el.querySelector('.nomad-embed-b2b-answer');
    const pos=node=>node.getBoundingClientRect().top;
    return {
      question:question?.textContent,offer:offer?.textContent,answer:answer?.textContent,
      color:getComputedStyle(offer).color,
      separateLines:pos(question)<pos(offer)&&pos(offer)<pos(answer)
    };
  });
  A.deepEqual(b2b,{
    question:'Работаете в B2B?',
    offer:'Привлеките полезный трафик',
    answer:'Бесплатно.',
    color:'rgb(237, 142, 99)',
    separateLines:true
  },'B2B question, orange offer and free answer occupy distinct lines');
  A.match(await license.textContent(),/За последние 14 дней уникальных посетителей:/);
  A.equal(await license.locator('[data-nomad-traffic-value]').textContent(),'—',
    'Before a real GitHub Insights snapshot exists the number is unavailable');
  A.equal(await license.locator('[data-nomad-traffic-stats] a').count(),0,
    'Do not add a GitHub link to the visitor label');
  A.doesNotMatch(await license.locator('[data-nomad-traffic-stats]').textContent(),
    /GitHub|просмотры|за 7 дней/i,'Only one visitor metric in the footer');
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
  A.equal(visual.downloadBackground,'rgb(237, 142, 99)','Embed is the orange primary footer CTA');
  A.equal(visual.downloadColor,'rgb(22, 55, 90)','Primary CTA label uses navy');
  A.equal(visual.secondaryBackground,'rgba(0, 0, 0, 0)','Custom request is not a second orange CTA');
  A.equal(visual.secondaryColor,'rgb(255, 255, 255)','Footer secondary action stays white');
  A.ok(visual.hintFont>=14,'Embed instruction must remain legible');
  const mail=await license.locator('.nomad-embed-contact').getAttribute('href');
  A.ok(mail.startsWith('mailto:nomad260393@gmail.com?subject='));
  A.match(decodeURIComponent(mail),/Заказать кастомную разработку/);
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
    /За последние 14 дней уникальных посетителей:.*63/);
  A.equal(await stats.locator('[data-nomad-traffic-stats] a').count(),0,
    'One statistic without a GitHub link');
  await stats.close();
  const embed=await browser.newPage({locale:'ru-RU',viewport:{width:390,height:844}});
  const embeddedErrors=[];
  embed.on('pageerror',e=>embeddedErrors.push(e.message));
  await embed.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
  await embed.goto(url+'Nomad360-calculator-embed.html',{waitUntil:'domcontentloaded'});
  A.equal(await embed.locator('#nomad360-header').count(),1);
  A.equal(await embed.locator('#nomad360-footer').count(),1);
  A.equal(await embed.locator('#start-own-product').count(),1);
  A.ok(await embed.evaluate(()=>!!window.LinkedPortfolioV2UI&&!!window.PortfolioV2UI));
  await embed.locator('#start-own-product').click();
  A.equal(await embed.locator('#product-screen').isVisible(),true);
  A.deepEqual(embeddedErrors,[],'Exported HTML must execute in its new context');
  const font=await embed.locator('#product-name-input').evaluate(x=>getComputedStyle(x).fontFamily);
  A.match(font,/IBM Plex Sans/);
  console.log('NOMAD360_EMBED_DOWNLOAD_GREEN',JSON.stringify({bytes:snapshot.length,
    logoBundled:true,scriptsBundled:true,standaloneCalculator:true}));
  await embed.close();
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error('NOMAD360_EMBED_DOWNLOAD_RED',e.stack||e);process.exitCode=1;});
