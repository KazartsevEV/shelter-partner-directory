'use strict';
// The only authorised edits to the accepted application's HTML in SEO-07.
const canonical='    <link rel="canonical" href="https://kazartsevev.github.io/shelter-partner-directory/Marketing_calc.HTML">\n';
const language='<script src="./nomad360_seo_language.js"></script>\n';
const fs=require('node:fs'),path=require('node:path');
const original=fs.readFileSync(path.join(__dirname,'../fixtures/seo-original-results.html'),'utf8');
const banner=fs.readFileSync(path.join(__dirname,'../fixtures/seo-keyword-banner.html'),'utf8');
const liveStudyAnchor="                <a id=\"us-retail-v2-live-link\" data-nomad-no-translate href=\"./US_Retail_Demo.HTML?demo=us-retail-12m&amp;lang=ru\" class=\"nomad-example-link nd-type-action\">Пример V2: магазин в США · 12 месяцев</a>\n";
const liveStudyLoader='<script src="./nomad360_us_retail_live_entry.js"></script>\n';
function stripLiveStudy(source){
 if(!source.includes('id="us-retail-v2-live-link"'))return source;
 for(const exact of [liveStudyAnchor,liveStudyLoader]){
  if(source.split(exact).length!==2)throw Error('Duplicate or modified V2 live entry: '+exact.slice(0,65));
  source=source.replace(exact,'');
 }
 return source;
}
module.exports={stripSEO:source=>require('./return-contract.cjs').stripReturn('Marketing_calc.HTML',require('./task09-html-scope.cjs').stripTask09Html(stripLiveStudy(source))).replace(canonical,'').replace(language,'').replace(banner,original),canonical,language,banner,original};
