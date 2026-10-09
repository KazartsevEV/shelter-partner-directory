/* F4 exact deployed-asset parity. Safe to run on PR (presence only) and
   on post-merge main (SHA256 byte-for-byte parity). No browser/API key needed. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const https=require('node:https');
const crypto=require('node:crypto');
const A=require('node:assert/strict');
const base='https://kazartsevev.github.io/shelter-partner-directory/';
const files=[
 'Marketing_calc.HTML',
 'portfolio_v2_linked_engine.js',
 'portfolio_v2_temporal.js',
 'portfolio_v2_pooled_media.js',
 'portfolio_v2_temporal_cash.js',
 'portfolio_v2_period_price.js',
 'portfolio_v2_online_adapter.js',
 'portfolio_v2_linked_ui.js',
 'portfolio_v2_basket_ui.js',
 'portfolio_v2_mba_observed.js',
 'portfolio_v2_mba_observed_ui.js',
 'nomad360_calculator_ui.js',
 'nomad360_calculator_ui.css'
];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function fetchFile(url,redirects=0){
 return new Promise((resolve,reject)=>{
  const req=https.get(url,{headers:{'User-Agent':'calculator-f4-release-audit/1.0',
    'Accept':'*/*','Cache-Control':'no-cache'}},res=>{
   const status=res.statusCode;
   if(status>=300&&status<400&&res.headers.location&&redirects<3){
    res.resume();return resolve(fetchFile(new URL(res.headers.location,url).href,redirects+1));
   }
   if(status!==200){
    res.resume();return reject(Error(url+' returned HTTP '+status));
   }
   const chunks=[];res.on('data',x=>chunks.push(x));
   res.on('end',()=>resolve(Buffer.concat(chunks)));
  });
  req.setTimeout(20000,()=>req.destroy(Error('timeout '+url)));
  req.on('error',reject);
 });
}
async function verify(mode){
 const source=fs.readFileSync(path.join(__dirname,'..','Marketing_calc.HTML'),'utf8');
 for(const file of files.slice(1)){
  const inclusion=file.endsWith('.css')?
   '<link rel="stylesheet" href="./'+file+'">':
   '<script src="./'+file+'"></script>';
  A.ok(source.includes(inclusion),
   'HTML must reference canonical asset: '+file);
  A.ok(fs.existsSync(path.join(__dirname,'..',file)),
   'HTML references missing local script: '+file);
 }
 const strict=mode==='--parity',maxAttempts=strict?24:3;
 // Newly authored PR assets are only on git, not on the public site until merge.
 const checked=strict?files:files.filter(file=>!file.startsWith('nomad360_'));
 let last=[];
 for(let attempt=1;attempt<=maxAttempts;attempt++){
  const result=await Promise.all(checked.map(async file=>{
   try{
    const remote=await fetchFile(base+file+'?f4='+Date.now());
    const local=fs.readFileSync(path.join(__dirname,'..',file));
    const same=hash(local)===hash(remote);
    return {file,remoteBytes:remote.length,localSha:hash(local),
      remoteSha:hash(remote),available:true,matching:same};
   }catch(e){return {file,available:false,error:String(e.message||e)}}
  }));
  last=result;
  if(result.every(x=>x.available&&(!strict||x.matching))){
   console.log('F4_GITHUB_PAGES_'+(strict?'EXACT_SHA256_PARITY':'ALL_ASSETS_AVAILABLE')+
    '_GREEN',JSON.stringify({assets:checked.length,mode,attempt,
     verifiedFiles:result.map(x=>x.file),commit:process.env.GITHUB_SHA||null}));
   return;
  }
  if(attempt===maxAttempts)break;
  await delay(strict?10000:3000);
 }
 console.error('F4_GITHUB_PAGES_RED',JSON.stringify({
  mode,commit:process.env.GITHUB_SHA||null,
  mismatches:last.filter(x=>!x.available||(strict&&!x.matching))}));
 process.exitCode=1;
}
verify(process.argv[2]||'--presence').catch(e=>{console.error('F4_PAGES_RED',e);process.exitCode=1});
