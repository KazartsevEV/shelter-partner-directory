'use strict';
// The bridge must be purely cosmetic and inherit TASK-10 palette tokens.
// Verify the loader order, scope and absence of duplicated brand HEX colors.
const fs=require('node:fs'), assert=require('node:assert/strict');
const html=fs.readFileSync('Marketing_calc.HTML','utf8');
const css=fs.readFileSync('nomad360_banner_theme_bridge.css','utf8');
const palette=fs.readFileSync('nomad360_palette.css','utf8');
const href='./nomad360_banner_theme_bridge.css';
assert.ok(html.includes('./nomad360_palette.css'),'TASK-10 palette is installed');
assert.ok(!html.includes(href),'do not activate the bridge before original Codex banner acceptance');
for(const token of ['navy','orange','white','blue']) {
  assert.match(palette,new RegExp('--p10-'+token+':#','i'),'TASK-10 owns '+token);
  assert.match(css,new RegExp('var\\(--p10-'+token+'\\)'),'banner inherits '+token);
}
assert.doesNotMatch(css,/#[0-9a-f]{3,8}\b/i,'never duplicate a branded HEX in bridge');
assert.doesNotMatch(css,/\b(?:rgb|hsl)a?\s*\(/i,'no independent RGB/HSL swatches');
assert.match(css,/#nomad360-commercial-banner/);
assert.doesNotMatch(css,/(?:^|[;{])\s*(?:display|width|height|padding|margin|transform|position|grid-template)\s*:/gm,'never change composition');
assert.doesNotMatch(css,/\.nomad-logo\b|\.nomad-seo-logo\b/,'leave original live wolf untouched');
console.log('CODEX_BANNER_PALETTE_BRIDGE_GREEN');
