'use strict';
// Exact, isolated first-hero resource loaders. The protected application HTML,
// financial engine and semantic copy remain byte-identical after normalization.
const A=require('node:assert/strict');
const css='    <link rel="stylesheet" href="./nomad360_first_hero.css">\n';
const js='<script src="./nomad360_first_hero.js"></script>\n';
function stripFirstHeroLoaders(source){
  const present=source.includes(css)||source.includes(js);
  if(!present)return source;
  A.equal(source.split(css).length,2,'exactly one first-hero style loader');
  A.equal(source.split(js).length,2,'exactly one first-hero script loader');
  A.ok(source.includes('    <link rel="stylesheet" href="./nomad360_bug_report.css">\n'+css),
   'first-hero stylesheet must follow, never split, protected Task09 stylesheet pair');
  A.ok(source.includes('<script src="./nomad360_header.js"></script>\n'+js),
   'first-hero script must follow accepted header/logo, never replace it');
  return source.replace(css,'').replace(js,'');
}
module.exports={stripFirstHeroLoaders};
