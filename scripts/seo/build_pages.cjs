'use strict';
const fs=require('node:fs'),path=require('node:path'),ROOT=path.resolve(__dirname,'../..');
const L={
  "en": {
    "skip": "Skip to content",
    "nav": "Main navigation",
    "home": "Overview",
    "price": "Pricing",
    "cash": "Cash flow",
    "related": "Related guides",
    "langs": "Languages",
    "disc": "Results describe the scenario you enter. They do not establish market demand or guarantee sales.",
    "foot": "Free, with no registration required. Calculations run in your browser. Optional exchange-rate requests and existing third-party resources have their own network behaviour.",
    "links": "Footer",
    "privacy": "Data and privacy",
    "licence": "Licence and use",
    "og": "en_US"
  },
  "ru": {
    "skip": "Перейти к содержимому",
    "nav": "Главная навигация",
    "home": "Обзор",
    "price": "Цены",
    "cash": "Денежный поток",
    "related": "Материалы по теме",
    "langs": "Языки",
    "disc": "Расчёты описывают ваш сценарий, но не подтверждают спрос и не гарантируют продажи.",
    "foot": "Бесплатно, без регистрации. Расчёты выполняются в браузере. Курсы валют и существующие сторонние ресурсы могут требовать доступа к сети.",
    "links": "Ссылки",
    "privacy": "Данные и конфиденциальность",
    "licence": "Лицензия и использование",
    "og": "ru_RU"
  },
  "kk": {
    "skip": "Негізгі мазмұнға өту",
    "nav": "Негізгі навигация",
    "home": "Шолу",
    "price": "Баға",
    "cash": "Ақша ағыны",
    "related": "Ұқсас материалдар",
    "langs": "Тілдер",
    "disc": "Есеп нәтижелері сіз енгізген болжамдарға негізделеді. Олар нақты нарық сұранысын растамайды және сатылымға кепілдік бермейді.",
    "foot": "Тегін, тіркелусіз. Есептеулер браузерде орындалады. Валюта бағамдары мен қолданыстағы сыртқы ресурстар үшін желі қажет болуы мүмкін.",
    "links": "Сілтемелер",
    "privacy": "Деректер мен құпиялық",
    "licence": "Лицензия және пайдалану",
    "og": "kk_KZ"
  }
};
function esc(x){return String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;");}
function link(u,t,attrs=""){return `<a href="${esc(u)}"${attrs}>${esc(t)}</a>`;}
function collect(cfg,reader){
 const pages=cfg.pages.map(p=>({...p}));
 const first=Object.fromEntries(pages.map(p=>[p.topic,p]));
 for(const locale of ["ru","kk"])for(const topic of ["overview","business-idea","pricing","cash-flow","for-consultants"]){
  const q=reader(locale,topic),ref=first[topic];
  if(q.schemaVersion!==1||q.locale!==locale||q.topic!==topic||q.sourceId!==ref.id||q.readyForReview!==false||q.isPublished!==false||q.path!==locale+"/"+(topic==="overview"?"":topic+"/")||q.hreflangGroup!==ref.hreflangGroup)throw Error("Bad R2 source "+locale+"/"+topic);
  if(q.sections.length!==ref.sections.length||q.related.join(",")!==ref.related.join(","))throw Error("Structural drift "+locale+"/"+topic);
  for(let i=0;i<ref.sections.length;i++)for(const key of ["paragraphs","cards","table"])if((q.sections[i][key]||[]).length!==(ref.sections[i][key]||[]).length)throw Error("Missing "+key+" "+locale+"/"+topic);
  const canonicalUrl=cfg.origin+cfg.basePath+q.path;
  if(q.plannedCanonicalUrl!==canonicalUrl||!q.primaryCtaHref.startsWith(cfg.origin+cfg.basePath+"Marketing_calc.HTML?lang="+locale+"#"))throw Error("Bad URL "+locale+"/"+topic);
  pages.push({...q,id:locale.toUpperCase()+ref.id.slice(2),canonicalUrl,robotsDirective:"index,follow"});
 }
 if(pages.length!==15||new Set(pages.map(x=>x.path)).size!==15)throw Error("Missing locale pages");
 return pages;
}
function render(cfg,p,all){
 const origin=cfg.origin+cfg.basePath,lang=p.locale,loc=L[lang],logo=cfg.basePath+"nomad360_wolf_open_circle.png",home=origin+lang+"/";
 const same=all.filter(x=>x.locale===lang),topics=Object.fromEntries(same.map(x=>[x.topic,x])),group=all.filter(x=>x.topic===p.topic);
 const alt=group.map(x=>`<link rel="alternate" hreflang="${x.locale}" href="${esc(x.canonicalUrl)}">`).join("\n");
 const menu=group.map(x=>link(x.canonicalUrl,x.locale.toUpperCase(),x.locale===lang?' aria-current="page"':'')).join("");
 let sections=[];
 for(const s of p.sections){
  const parts=[`<section class="section"><h2>${esc(s.heading)}</h2>`];
  for(const para of s.paragraphs||[])parts.push(`<p>${esc(para)}</p>`);
  if(s.cards){parts.push('<div class="grid">');for(const card of s.cards)parts.push(`<article class="card"><h3>${esc(card.heading)}</h3><p>${esc(card.text)}</p>${link(home+card.link,card.label)}</article>`);parts.push("</div>");}
  if(s.table){const [head,...rows]=s.table;parts.push("<table><thead><tr>"+head.map(x=>`<th scope="col">${esc(x)}</th>`).join("")+"</tr></thead><tbody>");for(const [x,y] of rows)parts.push(`<tr><th scope="row">${esc(x)}</th><td>${esc(y)}</td></tr>`);parts.push("</tbody></table>");}
  parts.push("</section>");sections.push(parts.join("\n"));
 }
 const related=p.related.length?`<nav class="section" aria-label="${esc(loc.related)}">${p.related.map(t=>link(topics[t].canonicalUrl,topics[t].h1)).join("")}</nav>`:"";
 return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta name="robots" content="${esc(p.robotsDirective)}">
<link rel="canonical" href="${esc(p.canonicalUrl)}">
${alt}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${esc(p.canonicalUrl)}">
<meta property="og:locale" content="${loc.og}">
<meta property="og:image" content="${esc(origin+"nomad360_wolf_open_circle.png")}">
<meta property="og:image:alt" content="Nomad360 wolf logo">
<link rel="stylesheet" href="${esc(cfg.basePath)}assets/nomad360-seo.css">
<link rel="stylesheet" href="${esc(cfg.basePath)}nomad360_static_fonts.css">
<link rel="stylesheet" href="${esc(cfg.basePath)}nomad360_palette.css">
</head>
<body>
<a class="skip-link" href="#main">${esc(loc.skip)}</a>
<header><div class="wrap"><a class="brand" href="${esc(home)}"><img src="${esc(logo)}" alt="" width="42" height="42">Nomad360 lite</a><nav aria-label="${esc(loc.nav)}">${link(home,loc.home)}${link(home+"pricing/",loc.price)}${link(home+"cash-flow/",loc.cash)}</nav><nav aria-label="${esc(loc.langs)}">${menu}</nav></div></header>
<main class="wrap" id="main">
<section class="intro"><div class="intro-copy"><p class="eyebrow">${esc(p.eyebrow)}</p><h1>${esc(p.h1)}</h1><p>${esc(p.lead)}</p>${link(p.primaryCtaHref,p.cta,' class="cta"')}</div><div class="intro-brand-mark"><span class="intro-logo-mask"><img class="intro-logo" src="${esc(logo)}" alt="" width="200" height="200"></span><h2 class="intro-brand-tagline">Sky allows, guys deliver</h2></div></section>
${sections.join("")}
${related}
<p>${esc(loc.disc)}</p>
</main>
<footer><div class="wrap"><p>${esc(loc.foot)}</p><nav aria-label="${esc(loc.links)}">${link(origin+"Marketing_calc.HTML?lang="+lang+"#nomad360-data",loc.privacy)}${link(origin+(lang==='ru'?'license/':'license/'+lang+'/'),loc.licence)}</nav></div></footer>
</body>
</html>
`;
}
// HELP-SEO-01: never advertise a Help URL until its real static page is indexable.
function helpPages(cfg){
 const base=cfg.origin+cfg.basePath,locales=['en','ru','kk'],out=[];
 for(const locale of locales){
  const name=locale+'/help/index.html',html=fs.readFileSync(path.join(ROOT,name),'utf8'),canonicalUrl=base+locale+'/help/';
  if(!html.includes('<html lang="'+locale+'">')||!html.includes('<meta name="robots" content="index,follow">')||
     !html.includes('<link rel="canonical" href="'+canonicalUrl+'">')||
     (html.match(/rel="canonical"/g)||[]).length!==1)throw Error('HELP-SEO-01 not indexable: '+name);
  for(const alt of locales)if(!html.includes('<link rel="alternate" hreflang="'+alt+'" href="'+base+alt+'/help/">'))throw Error('HELP-SEO-01 hreflang incomplete: '+name+' '+alt);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if(ids.length!==new Set(ids).size)throw Error('HELP-SEO-01 duplicate id: '+name);
  for(let n=1;n<=17;n++)if(ids.filter(id=>id==='h'+String(n).padStart(2,'0')).length!==1)throw Error('HELP-SEO-01 missing chapter '+n+' in '+name);
  for(const m of html.matchAll(/href="#([^"]+)"/g))if(!ids.includes(m[1]))throw Error('HELP-SEO-01 broken fragment '+m[1]+' in '+name);
  out.push({topic:'help',locale,canonicalUrl});
 }
 return out;
}
function mapXml(cfg,pages){
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${pages.map(p=>`  <url><loc>${esc(p.canonicalUrl)}</loc>\n${pages.filter(x=>x.topic===p.topic).map(x=>`    <xhtml:link rel="alternate" hreflang="${x.locale}" href="${esc(x.canonicalUrl)}" />`).join("\n")}\n  </url>`).join("\n")}\n</urlset>\n`;
}
function generate(){const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'scripts/seo/pages.json'),'utf8'));const pages=collect(cfg,(locale,topic)=>JSON.parse(fs.readFileSync(path.join(ROOT,'docs/seo/locale-drafts',locale,topic+'.json'),'utf8')));
const outputs={};for(const p of pages)outputs[p.path+'index.html']=render(cfg,p,pages);outputs['sitemap.xml']=mapXml(cfg,pages.concat(helpPages(cfg)));
const css=fs.readFileSync(path.join(ROOT,'docs/seo/mockups/review.css'),'utf8').replaceAll('../../../vendor/','../vendor/');const anchor='.brand{display:flex;align-items:center;gap:12px}';if(css.split(anchor).length!==2)throw Error('CSS anchor drift');outputs['assets/nomad360-seo.css']=css.slice(0,css.indexOf(anchor))+fs.readFileSync(path.join(ROOT,'scripts/seo/hero_banner.css'),'utf8').trimEnd()+'\n'+'\n.brand{text-decoration:none}.skip-link{position:absolute;left:16px;top:-100px}.skip-link:focus{top:8px;z-index:2;background:white;padding:12px}\n';return {cfg,pages,outputs};}
function main(){const argv=process.argv.slice(2);if(argv.some(x=>!['--check','--dry-run'].includes(x)))throw Error('Unexpected argument');const {outputs}=generate();for(const [name,value] of Object.entries(outputs)){const dest=path.join(ROOT,name);if(argv.includes('--check')){if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==value)throw Error('Stale SEO generated file: '+name);}else if(!argv.includes('--dry-run')){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,value,'utf8');}}console.log('SEO_BUILD_CURRENT',Object.keys(outputs).length);}
if(require.main===module)main();module.exports={generate,collect,render,mapXml,helpPages};
