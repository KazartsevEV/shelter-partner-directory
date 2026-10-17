'use strict';
/* Construct a browser-only integration preview from Codex revision 2.
   Production Marketing_calc.HTML is NOT edited. Hero CSS, JS and WebP are
   extracted from the historical Codex branch in CI, without creative changes. */
const fs=require('node:fs'),path=require('node:path'),A=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/codex-hero-audit');
fs.mkdirSync(out,{recursive:true});
const css=fs.readFileSync(path.join(out,'codex-original-ui.css'),'utf8');
const js=fs.readFileSync(path.join(out,'codex-original-banners.js'),'utf8');
const start=css.indexOf('/* UNIFIED-BANNERS-01: scoped presentation');
const end=css.indexOf('/* ABOUT: full composition',start);
A.ok(start>=0&&end>start,'Exact Codex revision-2 hero styling must exist');
let hero=css.slice(start,end);
function mediaRule(keyword,anchor,endMarker) {
 const i=css.indexOf(keyword);A.ok(i>=0,'media '+keyword);
 const from=css.indexOf(anchor,i);
 const to=css.indexOf(endMarker,from+anchor.length);
 A.ok(from>i&&to>from,'range '+anchor);
 return css.slice(from,to);
}
// The only responsive declarations extracted are scoped to Codex first hero.
// The other banners remain from main and do not receive Codex styling.
const mid=mediaRule('@media(max-width:1000px)',' body #nomad360-commercial-banner #nomad360-seo-banner',' body #nomad360-information');
const mobile=mediaRule('@media(max-width:600px)',' .nomad-banner{--nb-pad:20px}',' body #nomad360-information');
hero+='\n@media(max-width:1000px){\n'+mid+'}\n@media(max-width:600px){\n'+mobile+'}\n';
A.equal((hero.match(/\.nomad-banner\{/g)||[]).length,2);
fs.writeFileSync(path.join(out,'codex-hero.css'),hero.replaceAll("url('./assets/nomad360-banners/hero.webp')","url('../../assets/nomad360-banners/hero.webp')"));
const sectionStart=js.indexOf(" const information=byId('nomad360-information')");
const sectionEnd=js.indexOf(" const select=byId('nomad360-lang-select')",sectionStart);
A.ok(sectionStart>=0&&sectionEnd>sectionStart,'isolate only original hero decorator');
let first=js.slice(0,sectionStart)+js.slice(sectionEnd);
A.ok(first.includes("seo.querySelector('.nomad-seo-copy')?.remove();"),'Codex original SEO deletion known');
first=first.replace("seo.querySelector('.nomad-seo-copy')?.remove();","/* Preserve original indexed SEO text from main. */");
A.ok(first.includes("group('nomad360-commercial-banner'"));
fs.writeFileSync(path.join(out,'codex-hero.js'),first);
const image=path.join(root,'assets/nomad360-banners/hero.webp');
A.ok(fs.existsSync(image)&&fs.statSync(image).size>30000,'original Codex WebP must have been fetched');
console.log('CODEX_HERO_AUDIT_PREVIEW_BUILT',{cssBytes:hero.length,jsBytes:first.length,originalArtworkBytes:fs.statSync(image).size});
