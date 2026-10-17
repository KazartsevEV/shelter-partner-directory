'use strict';
// The only authorised edits to the accepted application's HTML in SEO-07.
const canonical='    <link rel="canonical" href="https://kazartsevev.github.io/shelter-partner-directory/Marketing_calc.HTML">\n';
const language='<script src="./nomad360_seo_language.js"></script>\n';
const fs=require('node:fs'),path=require('node:path');
const original=fs.readFileSync(path.join(__dirname,'../fixtures/seo-original-results.html'),'utf8');
const banner=fs.readFileSync(path.join(__dirname,'../fixtures/seo-keyword-banner.html'),'utf8');
module.exports={stripSEO:source=>require('./return-contract.cjs').stripReturn('Marketing_calc.HTML',require('./task09-html-scope.cjs').stripTask09Html(source)).replace(canonical,'').replace(language,'').replace(banner,original),canonical,language,banner,original};
