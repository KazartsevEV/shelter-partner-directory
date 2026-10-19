const A=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
const entry=pathToFileURL(path.join(__dirname,'..','Marketing_calc.HTML')).href;
const BASE='https://kazartsevev.github.io/shelter-partner-directory/';
const cases=[['ru','Справка','маржа'],['en','Help','margin'],['kk','Анықтама','маржа']];
(async()=>{
  // Static pages: same anchors, one H1, reciprocal hreflang, self canonical.
  const ids={};
  for(const [lang] of cases){
    const html=fs.readFileSync(path.join(__dirname,'..',lang,'help','index.html'),'utf8');
    A.equal((html.match(/<h1[ >]/g)||[]).length,1,lang+' one H1');
    A.match(html,new RegExp('<html lang="'+lang+'"'));
    A.match(html,new RegExp('rel="canonical" href="'+BASE+lang+'/help/"'));
    for(const l of ['en','ru','kk'])A.match(html,new RegExp('hreflang="'+l+'" href="'+BASE+l+'/help/"'));
    A.doesNotMatch(html,/x-default/);
    ids[lang]=(html.match(/id="(h\d\d|example-a|example-b|glossary)"/g)||[]).join();
    for(let i=1;i<=17;i++)A.ok(html.includes('id="h'+String(i).padStart(2,'0')+'"'),lang+' h'+i);
  }
  A.equal(ids.en,ids.ru);A.equal(ids.en,ids.kk);

  const browser=await chromium.launch();
  try{
    for(const [lang,label,q] of cases){
      for(const width of [320,390,768,1280,1440]){
        const page=await (await browser.newContext({viewport:{width,height:900}})).newPage();
        const errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.route(/^https?:\/\//,r=>r.abort());
        await page.goto(entry+'?lang='+lang);
        const header=page.locator('#nomad360-header');
        if(await header.locator('.nomad-burger').isVisible())await header.locator('.nomad-burger').click();
        const link=header.locator('.nomad-help-link');
        A.equal((await link.textContent()).trim(),label);
        A.equal(await link.getAttribute('href'),BASE+lang+'/help/');
        const toggle=header.locator('.nomad-help-toggle');
        A.equal(await toggle.getAttribute('aria-expanded'),'false');
        await toggle.click();
        A.equal(await toggle.getAttribute('aria-expanded'),'true');
        A.equal(await header.locator('.nomad-help-list li').count(),17);
        await header.locator('.nomad-help-input').fill(q);
        const visible=await header.locator('.nomad-help-list li:not([hidden])').count();
        A.ok(visible>=1&&visible<17,lang+' search narrows at '+width+': '+visible);
        const href=await header.locator('.nomad-help-list li:not([hidden]) a').first().getAttribute('href');
        A.match(href,new RegExp('^'+BASE.replace(/\./g,'\\.')+lang+'/help/#h\\d\\d$'));
        await header.locator('.nomad-help-input').fill('zzzzqq');
        A.equal(await header.locator('.nomad-help-list li:not([hidden])').count(),0);
        A.ok((await header.locator('.nomad-help-status').textContent()).length>0);
        await page.keyboard.press('Escape');
        A.equal(await toggle.getAttribute('aria-expanded'),'false');
        A.equal(await header.locator('.nomad-help-panel').isHidden(),true);
        A.deepEqual(errors,[]);
        await page.context().close();
      }
    }
    // Language switch re-renders the Help link.
    const page=await (await browser.newContext({viewport:{width:1440,height:900}})).newPage();
    await page.route(/^https?:\/\//,r=>r.abort());
    await page.goto(entry+'?lang=ru');
    A.equal((await page.locator('.nomad-help-link').textContent()).trim(),'Справка');
    await page.selectOption('#nomad360-lang-select','en');
    A.equal((await page.locator('.nomad-help-link').textContent()).trim(),'Help');
    A.equal(await page.locator('.nomad-help-link').getAttribute('href'),BASE+'en/help/');
  }finally{await browser.close();}
  console.log('nomad360 help menu: ok');
})().catch(e=>{console.error(e);process.exit(1)});
