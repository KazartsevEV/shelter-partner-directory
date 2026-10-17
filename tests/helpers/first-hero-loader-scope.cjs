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
  const bugStyle='    <link rel="stylesheet" href="./nomad360_bug_report.css">\n';
  const originalStyle='    <link rel="stylesheet" href="./nomad360_calculator_ui.css">\n';
  const anchor=source.includes(bugStyle)?bugStyle:originalStyle;
  // Some historic guards have already removed Task09 loaders before calling us.
  A.ok(source.includes(anchor+css),'hero stylesheet must follow existing style stack');
  A.ok(source.includes('<script src="./nomad360_header.js"></script>\n'+js),
   'first-hero script must follow accepted header/logo, never replace it');
  return source.replace(css,'').replace(js,'');
}
module.exports={stripFirstHeroLoaders};
