'use strict';
// The only authorised edits to the accepted application's HTML in SEO-07.
const canonical='    <link rel="canonical" href="https://kazartsevev.github.io/shelter-partner-directory/Marketing_calc.HTML">\n';
const language='<script src="./nomad360_seo_language.js"></script>\n';
module.exports={stripSEO:source=>source.replace(canonical,'').replace(language,''),canonical,language};
