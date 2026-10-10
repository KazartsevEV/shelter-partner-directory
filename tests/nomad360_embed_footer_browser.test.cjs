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
  const header=page.locator('#nomad360-header');
  async function verifyBrand(width,minLogo,minWordmark){
    await page.setViewportSize({width,height:844});
    const layout=await header.evaluate(el=>{
      const logo=el.querySelector('.nomad-logo');
      const mark=el.querySelector('.nomad-wordmark');
      const brand=el.querySelector('.nomad-brand').getBoundingClientRect();
      const lang=el.querySelector('#nomad360-lang-select').getBoundingClientRect();
      const burger=el.querySelector('.nomad-burger').getBoundingClientRect();
      const box=el.getBoundingClientRect();
      return {logo:getComputedStyle(logo).width,word:parseFloat(getComputedStyle(mark).fontSize),
        bounds:{left:brand.left,right:brand.right,langLeft:lang.left,
                langRight:lang.right,burgerLeft:burger.left,burgerRight:burger.right},
        width:box.width,viewport:innerWidth};
    });
    A.ok(parseFloat(layout.logo)>=minLogo,'Logo must be enlarged at '+width+'px: '+JSON.stringify(layout));
    A.ok(layout.word>=minWordmark,'Nomad360 wordmark must be readable at '+width+'px');
    A.ok(layout.bounds.right<=layout.bounds.langLeft+2,'Brand and locale selector must not overlap at '+width+'px');
    A.ok(layout.bounds.langRight<=layout.bounds.burgerLeft+2,'Locale and menu must not overlap at '+width+'px');
    A.ok(layout.bounds.burgerRight<=layout.viewport+1,'Header must fit mobile viewport at '+width+'px');
    return layout;
  }
  await verifyBrand(390,46,24);
  await verifyBrand(320,40,21);
  await page.setViewportSize({width:390,height:844});
  const license=page.locator('#nomad360-license');
  A.equal(await license.locator('[data-nomad-download-html]').count(),1);
  A.match(await license.textContent(),/Встроить калькулятор на мой сайт/);
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
  const fallback=license.locator('[data-nomad-embed-manual]');
  const retry=license.locator('[data-nomad-embed-retry]');
  A.equal(await fallback.isVisible(),true,'Manual recovery must become visible only after HTML assembly');
  A.match(await fallback.textContent(),/Если загрузка не началась,\s*нажмите здесь/);
  const preparedHref=await retry.getAttribute('href');
  A.match(preparedHref,/^blob:/,'Fallback needs an actual persistent Blob URL');
  A.equal(await retry.getAttribute('download'),'Nomad360-calculator-embed.html');
  const retryColors=await retry.evaluate(el=>({
    bg:getComputedStyle(el).backgroundColor,fg:getComputedStyle(el).color,
    width:el.getBoundingClientRect().width, height:el.getBoundingClientRect().height
  }));
  A.equal(retryColors.bg,'rgb(237, 142, 99)','Retry must be orange');
  A.equal(retryColors.fg,'rgb(22, 55, 90)','Retry must have navy text');
  A.ok(retryColors.height>=48&&retryColors.width>200,'Manual download is a full-sized mobile tap target');
  const secondDownload=page.waitForEvent('download',{timeout:10000});
  await retry.click();
  A.equal((await secondDownload).suggestedFilename(),'Nomad360-calculator-embed.html',
    'A manual retry must trigger a real browser download without rebuilding the file');
  await page.locator('#nomad360-lang-select').selectOption('en');
  A.equal(await retry.isVisible(),true,'Language switch must preserve the prepared fallback link');
  A.equal(await retry.getAttribute('href'),preparedHref,'Locale switch cannot invalidate the prepared Blob URL');
  A.match(await fallback.textContent(),/If the download did not start,\s*click here/);
  await page.locator('#nomad360-lang-select').selectOption('ru');
  A.match(await fallback.textContent(),/Если загрузка не началась,\s*нажмите здесь/);


  await page.setViewportSize({width:1440,height:900});
  A.equal(await header.locator('.nomad-burger').isVisible(),false,'Desktop navigation remains horizontal');
  const desktopBrand=await header.locator('.nomad-logo').evaluate(el=>({
    logo:parseFloat(getComputedStyle(el).width),
    word:parseFloat(getComputedStyle(el.nextElementSibling).fontSize)
  }));
  A.ok(desktopBrand.logo>=56&&desktopBrand.word>=29,'Desktop brand should be larger');
  A.deepEqual(errors,[],'Export click must not introduce script errors');
  await page.close();
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
