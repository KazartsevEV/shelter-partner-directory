'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const {normalize,sha256}=require('./config.cjs');
const root=path.resolve(__dirname,'../..');
const mime={'.html':'text/html; charset=utf-8','.HTML':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
async function buildPackage(input,{repositoryRoot=root,browserFactory}={}){
 const config=normalize(input); // Reject unknown or unsupported settings before any network/file output.
 const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:repositoryRoot,encoding:'utf8'}).trim();
 const tracked=new Set(execFileSync('git',['ls-files','-z'],{cwd:repositoryRoot,encoding:'utf8'}).split('\0'));
 const dirty=execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:repositoryRoot,encoding:'utf8'});
 if(dirty.trim())throw Error('Commit tracked changes before building a versioned package');
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/__partner_builder__'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<!doctype html><meta charset="utf-8"><title>Build</title>');}
   const relative=decodeURIComponent(url.pathname).slice(1);
   if(relative.split('/').some(p=>p.startsWith('.')||p==='..'))throw Error('Invalid path');
   const file=path.resolve(repositoryRoot,relative);if(!file.startsWith(repositoryRoot+path.sep))throw Error('Outside build root');
   const real=await fs.realpath(file);if(!real.startsWith(repositoryRoot+path.sep))throw Error('Outside build root');
   const bytes=await fs.readFile(real);res.setHeader('Content-Type',mime[path.extname(real)]||'application/octet-stream');res.end(bytes);
  }catch(_){res.writeHead(404);res.end('Not found');}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const base='http://127.0.0.1:'+server.address().port+'/',resources=new Map(),pending=[],resourceErrors=[];
 let browser;
 try{
  const launch=browserFactory||(()=>require('playwright').chromium.launch({headless:true,args:['--no-sandbox']}));
  browser=await launch();const page=await browser.newPage();
  await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await page.goto(base+'__partner_builder__');
  // Run only the accepted packer in a clean page. Never execute a user's form,
  // read a saved draft, or copy data from an existing browser profile.
  await page.addScriptTag({path:path.join(repositoryRoot,'nomad360_delivery.js')});
  page.on('response',response=>{
   const url=new URL(response.url());
   pending.push((async()=>{
    if(!response.ok())throw Error('Build resource failed: '+url.pathname);
    const bytes=await response.body(),name=decodeURIComponent(url.pathname).slice(1);
    const previous=resources.get(name),record={path:name,bytes:bytes.length,sha256:sha256(bytes)};
    if(previous&&previous.sha256!==record.sha256)throw Error('Resource changed during build: '+name);
    resources.set(name,record);
   })().catch(error=>resourceErrors.push(error)));
  });
  const html=await page.evaluate(async({base,config})=>{
   const output=await Nomad360Delivery.buildStandalone(base),doc=new DOMParser().parseFromString(output,'text/html');
   if(doc.getElementById('nomad360-package-config'))throw Error('Source already contains package configuration');
   const data=doc.createElement('script');data.type='application/json';data.id='nomad360-package-config';
   data.textContent=JSON.stringify(config).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
   doc.head.append(data);doc.documentElement.dataset.nomadPackage=config.packageId;
   return '<!DOCTYPE html>\n'+doc.documentElement.outerHTML;
  },{base,config});
  await Promise.all(pending);
  if(resourceErrors.length)throw resourceErrors[0];
  const assetList=[...resources.values()].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  if(!assetList.some(x=>x.path==='nomad360_v1_engine.js')||!assetList.some(x=>x.path==='portfolio_v2_engine.js'))throw Error('Incomplete financial sources');
  // Check fetched bytes against the exact source checkout, not just response metadata.
  for(const record of assetList){if(!tracked.has(record.path))throw Error('Untracked source resource: '+record.path);const bytes=await fs.readFile(path.join(repositoryRoot,record.path));if(sha256(bytes)!==record.sha256)throw Error('Source/resource mismatch: '+record.path+' (response '+record.bytes+' bytes, source '+bytes.length+' bytes)');}
  const finalRevision=execFileSync('git',['rev-parse','HEAD'],{cwd:repositoryRoot,encoding:'utf8'}).trim();
  if(finalRevision!==revision||execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:repositoryRoot,encoding:'utf8'}).trim())throw Error('Source checkout changed during build');
  const filename=config.packageId+'.html';
  const manifest={schemaVersion:1,packageId:config.packageId,packageVersion:config.packageVersion,
   sourceRevision:revision,config,configSha256:sha256(JSON.stringify(config)),
   files:[{path:filename,bytes:Buffer.byteLength(html),sha256:sha256(html)}],resources:assetList};
  return {html,manifest,filename};
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==4||args[0]!=='--config'||args[2]!=='--out')throw Error('Usage: node scripts/partners/build.cjs --config config.json --out output-directory');
 const config=JSON.parse(await fs.readFile(args[1],'utf8')),out=path.resolve(args[3]);
 const result=await buildPackage(config);
 await writePackage(result,out);
 console.log('PARTNER_PACKAGE_GREEN',JSON.stringify({html:path.join(out,result.filename),manifest:path.join(out,result.filename.replace(/\.html$/,'.manifest.json')),sourceRevision:result.manifest.sourceRevision,resources:result.manifest.resources.length}));
}
async function writePackage(result,out){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*\.html$/.test(result.filename))throw Error('Unsafe package output filename');
 // Exclusive writes: never overwrite a previous issued package silently.
 await fs.mkdir(out,{recursive:true});
 const manifestPath=path.join(out,result.filename.replace(/\.html$/,'.manifest.json'));
 const htmlPath=path.join(out,result.filename),created=[];
 try{
  await fs.writeFile(manifestPath,JSON.stringify(result.manifest,null,2)+'\n',{flag:'wx'});created.push(manifestPath);
  await fs.writeFile(htmlPath,result.html,{flag:'wx'});created.push(htmlPath);
 }catch(error){await Promise.all(created.map(file=>fs.unlink(file)));throw error;}
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={buildPackage,writePackage};
