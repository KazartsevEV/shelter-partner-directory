'use strict';
const A=require('node:assert/strict');
const loader='    <link rel="stylesheet" href="./nomad360_palette.css">\n';
const anchor='    <link rel="stylesheet" href="./nomad360_design_system.css">\n';
function stripTask10PaletteHtml(source){
 source=require('./codex-first-banner-scope.cjs').strip(source);
 if(!source.includes('nomad360_palette.css'))return source;
 A.equal(source.split(loader).length,2,'exactly one passive Task10 stylesheet loader');
 A.ok(source.includes(anchor+loader+'</head>'),'Task10 palette follows the original design-system link; no scripts or markup exemption');
 return source.replace(loader,'');
}
module.exports={stripTask10PaletteHtml,loader};
function stripTask10StaticHtml(file,source){
 if(!source.includes('nomad360_palette.css'))return source;
 A.ok(/^(en|license)\/.*index\.html$/.test(file),'only known static Nomad360 pages');
 const base=file.startsWith('en/')?'/shelter-partner-directory/':'https://kazartsevev.github.io/shelter-partner-directory/';
 const links=['nomad360_static_fonts.css','nomad360_palette.css'].map(f=>'<link rel="stylesheet" href="'+base+f+'">\n');
 for(const link of links)A.equal(source.split(link).length,2,'one exact static stylesheet loader');
 A.ok(source.includes(links.join('')+'</head>'),'static loaders retain the original head/body boundary');
 return source.replace(links.join(''),'');
}
module.exports.stripTask10StaticHtml=stripTask10StaticHtml;

function stripTask10StaticSource(file,source){
 if(file==='scripts/seo/build.py'){
  const links=['nomad360_static_fonts.css','nomad360_palette.css'].map(f=>'<link rel="stylesheet" href="{e(asset)}'+f+'">\n');
  for(const link of links)A.equal(source.split(link).length,2,'one exact SEO-template stylesheet loader');
  A.ok(source.includes(links.join('')+'</head>'));return source.replace(links.join(''),'');
 }
 if(/^(en|license)\/.*index\.html$/.test(file))return stripTask10StaticHtml(file,source);
 return source;
}
module.exports.stripTask10StaticSource=stripTask10StaticSource;
