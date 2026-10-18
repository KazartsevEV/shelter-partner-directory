'use strict';
// Normalizes only the accepted HERO-03 main-branch HTML delta, so historical
// financial/SEO source guards remain byte-exact across a newer tested base.
// Never erase arbitrary markup, scripts, pricing code or financial sources.
const A=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const baseline='cfc7e3d4f429004def715a4acc586a3b3fb984d1';
const css='    <link rel="stylesheet" href="./nomad360_hero_banner.css">\n';
const js='<script src="./nomad360_hero_banner.js"></script>\n';
const palette='    <link rel="stylesheet" href="./nomad360_palette.css">\n';
const modern='        <div id="nomad360-seo-banner" class="nomad-marketing nomad-seo-banner" data-nomad-no-translate aria-label="Nomad360 brand">\n        </div>\n\n';
const start='        <div id="nomad360-seo-banner"';
const end='        <section id="nomad360-selling-choice"';
function once(source,needle,label){A.equal(source.split(needle).length-1,1,label);}
function legacy(){
 const original=execFileSync('git',['show',baseline+':Marketing_calc.HTML'],{cwd:root,encoding:'utf8'});
 once(original,start,'Historical SEO banner start');
 once(original,end,'Historical selling-choice boundary');
 return original.slice(original.indexOf(start),original.indexOf(end));
}
function stripApprovedHeroHtml(source){
 if(!source.includes(css)&&!source.includes(js)&&!source.includes(modern))return source;
 for(const [term,name] of [[css,'HERO stylesheet'],[js,'HERO script'],[modern,'HERO empty SEO anchor']])once(source,term,name);
 A.ok(source.includes(palette+css+'</head>'),'Approved HERO stylesheet follows the palette link');
 A.ok(source.includes('<script src="./nomad360_header.js"></script>\n'+js+'<script src="./nomad360_return.js"></script>'),'Approved HERO script follows header only');
 A.ok(source.includes('    <section id="home-screen" class="max-w-4xl mx-auto">\n'+modern),'Approved HERO changes only the old SEO banner');
 return source.replace(css,'').replace(js,'').replace(modern,legacy());
}
module.exports={stripApprovedHeroHtml,css,js,modern};
