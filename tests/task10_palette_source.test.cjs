'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process'),postcss=require('postcss');
const root=path.resolve(__dirname,'..'),base=require('./fixtures/task10-palette/base.json');
const calculatorLink='    <link rel="stylesheet" href="./nomad360_palette.css">\n';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
test('Task10: every established JS/engine, original CSS, logo and calculator byte is unchanged except the single passive stylesheet loader',()=>{
 for(const [file,hash] of Object.entries(base.hashes)){let b=require('./helpers/refactor-boundaries-scope.cjs').restore(file,fs.readFileSync(path.join(root,file)));if(file==='Marketing_calc.HTML'){const s=b.toString();A.equal(s.split(calculatorLink).length,2);A.ok(require('./helpers/task10-palette-scope.cjs').stripApprovedHeroHtml(s).includes(calculatorLink+'</head>'));b=Buffer.from(require('./helpers/seo-html-contract.cjs').stripLiveStudy(require('./helpers/task10-palette-scope.cjs').stripTask10PaletteHtml(s)));}if(file==='nomad360_locale_core.js'){
    const accepted=execFileSync('git',['show','78ef71b32256a1651c5bbc96e154e2f6df89a019:'+file],{cwd:root,encoding:'utf8'});
    const row=accepted.split('\n').find(x=>x.startsWith(' ["marketing.onePortfolioFunnelBudget'));
    const pricing=accepted.split('\n').find(x=>x.startsWith(' ["finance.allThreeModelsShare'));
    A.ok(row&&pricing);
    const shortened=row.replace('orders. CTR determines impressions; extra campaigns','orders. Extra campaigns')
      .replace('заказы. CTR нужен для показов. Отдельные','заказы. Отдельные')
      .replace('тапсырыс. CTR көрсетілімге қажет; қосымша','тапсырыс. Қосымша');
    let current=b.toString();
    A.equal(current.split(shortened).length,2,'Exactly one approved shortened RU/EN/KK marketing message');
    A.equal(current.includes(pricing),false,'Removed sourcing description must not remain');
    current=current.replace(shortened,row).replace(' ["ui.portfolioResult"',pricing+'\n ["ui.portfolioResult"');
    b=Buffer.from(current);
    const now='["ui.value1SharedMarketingEngine","1. Advertising and marketing","1. Реклама и маркетинг","1. Жарнама және маркетинг"]',then='["ui.value1SharedMarketingEngine","1. Shared marketing engine","1. Общий маркетинговый двигатель","1. Ортақ маркетинг моделі"]',s=b.toString();A.equal(s.split(now).length,2,'One approved marketing heading alias');b=Buffer.from(s.replace(now,then));}if(file==='nomad360_header.js')b=Buffer.from(require('./helpers/return-contract.cjs').stripConsultingExport(b.toString()));if(file==='portfolio_v2_ui.js')b=Buffer.from(require('./helpers/v2-output-truth-scope.cjs').restore(file,b.toString()));if(file==='nomad360_price_export.js')b=Buffer.from(require('./helpers/v2-output-truth-export-scope.cjs').restore(b.toString()));if(file==='nomad360_calculator_ui.js'){
    b=Buffer.from(require('./helpers/return-contract.cjs').stripHomeLocaleOrder(b.toString()));
    const approved=execFileSync('git',['show','78ef71b32256a1651c5bbc96e154e2f6df89a019:'+file],{cwd:root});
    A.equal(digest(b),digest(approved),'Main-accepted HERO three-step renderer remains unchanged');
  }else if(file==='nomad360_locale_core.js'){
    const mainText=execFileSync('git',['show','78ef71b32256a1651c5bbc96e154e2f6df89a019:'+file],{cwd:root,encoding:'utf8'});
    const now='["ui.value1SharedMarketingEngine","1. Advertising and marketing","1. Реклама и маркетинг","1. Жарнама және маркетинг"]';
    const then='["ui.value1SharedMarketingEngine","1. Shared marketing engine","1. Общий маркетинговый двигатель","1. Ортақ маркетинг моделі"]';
    A.equal(digest(b),digest(Buffer.from(mainText.replace(now,then))),
      'Main-accepted locale bytes preserved except narrowly restored V2 prose');
  }else A.equal(digest(b),hash,file);}
});
test('Task10: static-page text, links, SEO metadata, locale and legal content remain byte-exact',()=>{
 for(const dir of ['en','license']){const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name==='index.html'?[path.join(d,e.name)]:[]);for(const f of walk(path.join(root,dir))){const file=path.relative(root,f);if(file==='en/help/index.html')continue;const now=require('./helpers/seo-r3-compat.cjs').restore(file,fs.readFileSync(f,'utf8')),font=now.split('\n').find(l=>l.includes('rel="stylesheet"')&&l.includes('nomad360_static_fonts.css')),line=now.split('\n').find(l=>l.includes('rel="stylesheet"')&&l.includes('nomad360_palette.css'));A.ok(line,file);A.equal(now.split(line+'\n').length,2,file);const comparison=file.startsWith('license/')?execFileSync('git',['show','cd80f877f20dde9d276683c83b99c6a9455dea5d:'+file],{cwd:root,encoding:'utf8'}):execFileSync('git',['show',base.source+':'+file],{cwd:root,encoding:'utf8'});A.equal(file.startsWith('license/')?now:now.replace(line+'\n','').replace(font+'\n',''),comparison,file);}}
});
test('Task10: generated stylesheet contains exactly the four approved paints, no transparent painted tints or invented font',()=>{
 const css=fs.readFileSync(path.join(root,'nomad360_palette.css'),'utf8'),approved=new Set(['#173b58','#ffffff','#ff913f','#38678b']);
 const colors=new Set();postcss.parse(css).walkDecls(d=>{for(const c of d.value.match(/#[\da-f]{3,8}\b/gi)||[]){A.ok(approved.has(c.toLowerCase()),d.toString());colors.add(c.toLowerCase());}A.doesNotMatch(d.value,/rgba?\(|hsla?\(|color-mix\(|linear-gradient\(/,d.toString());if(d.prop==='font-family')A.match(d.value,/^'?Inter/);});A.deepEqual(colors,approved);
});
module.exports={calculatorLink};
