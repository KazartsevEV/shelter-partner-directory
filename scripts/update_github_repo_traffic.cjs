// Creates a public, token-free snapshot from GitHub repository Traffic API.
// API requires owner-authorized token: fine-grained PAT, Administration: read.
// The website reads the generated JSON only; it never sees the token.
'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const REPOSITORY='KazartsevEV/shelter-partner-directory';
const DATA_FILE=path.resolve(__dirname,'../nomad360_repo_traffic.json');
const DAY_MS=86400000;
function normalizeTraffic(data,now=new Date()){
  if(!data||!Number.isSafeInteger(data.count)||!Number.isSafeInteger(data.uniques)||
     data.count<0||data.uniques<0||!Array.isArray(data.views)){
    throw Error('Malformed or incomplete GitHub Traffic API response');
  }
  const utcToday=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
  const sevenDayStart=utcToday-6*DAY_MS;
  let views7=0;
  for(const item of data.views){
    if(!item||!Number.isSafeInteger(item.count)||item.count<0||
       !Number.isSafeInteger(item.uniques)||item.uniques<0){
      throw Error('Malformed GitHub daily traffic entry');
    }
    const ts=Date.parse(item.timestamp);
    if(!Number.isFinite(ts))throw Error('Invalid traffic timestamp');
    if(ts>=sevenDayStart&&ts<utcToday+DAY_MS)views7+=item.count;
  }
  if(views7>data.count)throw Error('Seven-day views cannot exceed 14-day views');
  return {
    status:'ok',source:'github-repository-traffic',repository:REPOSITORY,
    updatedAt:now.toISOString(),window:'github-last-14-days',
    views14:data.count,visitors14:data.uniques,views7
  };
}
async function refresh(){
  const token=process.env.NOMAD360_TRAFFIC_TOKEN;
  if(!token){
    throw Error('Missing NOMAD360_TRAFFIC_TOKEN: add a fine-grained PAT with repository Administration: read to GitHub Actions secrets');
  }
  const response=await fetch('https://api.github.com/repos/'+REPOSITORY+'/traffic/views?per=day',{
    headers:{
      'Authorization':'Bearer '+token,
      'Accept':'application/vnd.github+json',
      'X-GitHub-Api-Version':'2022-11-28',
      'User-Agent':'nomad360-github-repository-traffic'
    }
  });
  if(!response.ok)throw Error('GitHub traffic API status '+response.status);
  const output=normalizeTraffic(await response.json());
  await fs.writeFile(DATA_FILE,JSON.stringify(output,null,2)+'\n','utf8');
  console.log('GitHub traffic snapshot refreshed:',output.updatedAt,
    'views14='+output.views14,'visitors14='+output.visitors14,'views7='+output.views7);
}
if(require.main===module)refresh().catch(e=>{
  console.error(e.message);process.exitCode=1;
});
module.exports={normalizeTraffic};
