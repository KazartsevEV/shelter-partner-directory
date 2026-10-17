/* Build one openable, filled Nomad360 V2 file from the *actual* PR HTML.
 * This is packaging only: no synthetic calculator, no rewritten engines. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.resolve(root,f),'utf8');
const original=read('US_Retail_Demo.HTML');
const input=JSON.parse(read('docs/demos/us-main-street-12m/model.json'));
if(input.skus.length!==10 || input.resources.length!==14 || input.marketing.periodMonths!==12)
 throw Error('Wrong canonical scenario');
let result=original;
const dataRegex=/url\(\s*(["']?)(?!data:|https?:|#)(\.\/[^)"']+)\1\s*\)/gi;
function assetEmbed(css){
 return css.replace(dataRegex,(whole,quote,uri)=>{
   const file=path.resolve(root,uri);
   if(!fs.existsSync(file))throw Error('Missing local CSS asset '+uri);
   const mime=/\.png$/i.test(uri)?'image/png':/\.svg$/i.test(uri)?'image/svg+xml':/\.woff2$/i.test(uri)?'font/woff2':/\.jpe?g$/i.test(uri)?'image/jpeg':'application/octet-stream';
   return "url('data:"+mime+";base64,"+fs.readFileSync(file).toString('base64')+"')";
 });
}
let includedCss=[],includedJs=[];
result=result.replace(/<link\b([^>]*?)rel=["']stylesheet["']([^>]*?)href=["']\.\/([^"']+\.css)["']([^>]*?)>/gi,(m,a,b,file,c)=>{
 includedCss.push(file);
 const css=assetEmbed(read(file)).replace(/<\/style/gi,'<\\/style');
 return '<style data-inline-source="'+file+'">\n'+css+'\n</style>';
});
result=result.replace(/<script\b([^>]*?)src=["']\.\/([^"']+\.js)["']([^>]*?)><\/script>/gi,(m,a,file,b)=>{
 includedJs.push(file);
 const js=read(file).replace(/<\/script/gi,'<\\/script');
 return '<script data-inline-source="'+file+'">\n'+js+'\n</script>';
});
const vendorTag='<script src="https://cdn.tailwindcss.com"></script>';
const compiled=process.env.NOMAD360_TAILWIND_CSS;
if(!compiled||!fs.existsSync(compiled))throw Error('Missing compiled Tailwind styles from CLI');
if(!result.includes(vendorTag))throw Error('Tailwind CDN anchor changed');
result=result.replace(vendorTag,'<style data-inline-source="tailwind-css-cli-v3">\n'+fs.readFileSync(compiled,'utf8').replace(/<\/style/gi,'<\\/style')+'\n</style>');
// Offline opening must display the actual filled editable V2, not the landing screen.
const seed='<script data-study-autostart="true">document.addEventListener("DOMContentLoaded",function(){if(!window.PortfolioV2UI||!window.Nomad360USRetailDemo)throw Error("US study calculator unavailable");window.Nomad360USRetailDemo.launch();});</script>';
if(!result.includes('</body>'))throw Error('HTML body close missing');
result=result.replace('</body>',seed+'\n</body>');
// All third-party/runtime local files are now truly embedded.
const paths=[...result.matchAll(/<(?:script|link)[^>]+(?:src|href)=["']\.\/([^"']+)/g)].map(m=>m[1]);
if(paths.length)throw Error('Standalone still has unresolved linked scripts/styles: '+paths.join(','));
if(!includedJs.includes('portfolio_v2_us_demo_ui.js')||!includedJs.includes('nomad360_us_retail_demo.js'))throw Error('Real V2 study scripts missing');
const out=path.resolve(root,'artifacts/us-retail-demo/US_Retail_Demo_FILLED.html');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,result);
const stats={source:'US_Retail_Demo.HTML from PR #183',generatedAt:new Date().toISOString(),target:path.relative(root,out),sha256:crypto.createHash('sha256').update(result).digest('hex'),bytes:Buffer.byteLength(result),inlineCss:includedCss,inlineJs:includedJs,autoLoaded:true,skuCount:input.skus.length,resourceCount:input.resources.length};
fs.writeFileSync(path.resolve(root,'artifacts/us-retail-demo/manifest.json'),JSON.stringify(stats,null,2)+'\n');
console.log('US_RETAIL_FILLED_STANDALONE_CREATED',JSON.stringify(stats));
