'use strict';
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const {normalize}=require('../release-policy.cjs');
const root=path.resolve(__dirname,'../../..'),copy=require('./copy.json');
const files=new Set([
 'scripts/partners/release-preview/model.js','scripts/partners/release-preview/app.js','scripts/partners/release-preview/style.css',
 'nomad360_partner_application.js','nomad360_partner_application_model.js','nomad360_partner_application.css',
 'vendor/fonts/type02/inter-latin.woff2','vendor/fonts/type02/inter-cyrillic.woff2','vendor/fonts/type02/inter-cyrillic-ext.woff2'
]);
const escape=value=>value.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
function html(language){return `<!doctype html><html lang="${language}" data-nomad-release-preview><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(copy[language].title)}</title><link rel="stylesheet" href="/nomad360_partner_application.css"><link rel="stylesheet" href="/scripts/partners/release-preview/style.css"></head><body><main>
<p class="preview-notice" data-preview-copy="notice"></p><h1 data-preview-copy="title"></h1>
<label for="preview-language" data-preview-copy="language"></label> <select id="preview-language"><option value="en">English</option><option value="ru">Русский</option><option value="kk">Қазақша</option></select>
<section><h2 data-preview-copy="offer"></h2><p data-preview-copy="online"></p><div id="nomad360-embed"><button type="button" data-nomad-embed-toggle disabled data-preview-copy="offer"></button></div><small data-preview-copy="zip"></small></section>
<section><h2 data-preview-copy="states"></h2><p data-preview-copy="simulation"></p><label for="preview-response" data-preview-copy="responseLabel"></label> <select id="preview-response"><option value="accepted" data-preview-copy="responseAccepted"></option><option value="rate">429</option><option value="rejected">422</option><option value="failure" data-preview-copy="responseFailure"></option></select><p id="preview-status" role="status" aria-live="polite" aria-atomic="true"></p><p id="preview-site" hidden></p><div id="preview-actions"></div><p><button type="button" id="preview-reset" data-preview-copy="reset"></button></p></section>
<section><h2 data-preview-copy="helpTitle"></h2><ol id="preview-help"></ol><small data-preview-copy="future"></small></section>
</main><script src="/preview-copy.js"></script><script src="/scripts/partners/release-preview/model.js"></script><script src="/nomad360_partner_application_model.js"></script><script src="/scripts/partners/release-preview/app.js"></script><script src="/nomad360_partner_application.js"></script></body></html>`;}
async function startPreview(configuration){
 const policy=normalize(configuration);if(policy.mode!=='preview')throw Error('Explicit preview configuration required');
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'");
  if(req.method!=='GET'){res.writeHead(405);return res.end();}
  try{
   // Refuse arbitrary Host values (including DNS-rebinding names).
   if(req.headers.host!==`127.0.0.1:${server.address().port}`){res.writeHead(403);return res.end();}
   const pathname=new URL(req.url,'http://127.0.0.1').pathname;
   const entry=/^\/preview\/(en|ru|kk)\/$/.exec(pathname);
   if(entry){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html(entry[1]));}
   if(pathname==='/preview-copy.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');return res.end('window.Nomad360PartnerPreviewCopy='+JSON.stringify(copy).replace(/</g,'\\u003c')+';');}
   const name=decodeURIComponent(pathname).slice(1);if(!files.has(name)){res.writeHead(404);return res.end();}
   const file=path.join(root,name),real=await fs.realpath(file);
   if(real!==file||!real.startsWith(root+path.sep))throw Error('Invalid preview asset');
   const bytes=await fs.readFile(real);res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2'})[path.extname(real)]);res.end(bytes);
  }catch(_){res.writeHead(404);res.end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 return {server,url:`http://127.0.0.1:${server.address().port}/preview/en/`,policy};
}
if(require.main===module){
 (async()=>{
  const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--config')throw Error('Usage: node scripts/partners/release-preview/server.cjs --config preview.json');
  const file=await fs.open(args[1]);let input;try{if((await file.stat()).size>65536)throw Error('Configuration too large');input=JSON.parse(await file.readFile('utf8'));}finally{await file.close();}
  const policy=normalize(input);
  if(policy.mode==='legacy'){console.log('RELEASE_LEGACY: public download unchanged; issuance disabled');return;}
  const {server,url}=await startPreview(policy);console.log('RELEASE_PREVIEW_ONLY',url);
  process.once('SIGINT',()=>server.close());process.once('SIGTERM',()=>server.close());
 })().catch(()=>{console.error('RELEASE_PREVIEW_FAILED: check the non-secret configuration and local runtime');process.exitCode=1;});
}
module.exports={startPreview,html};
