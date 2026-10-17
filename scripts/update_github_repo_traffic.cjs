// Publish only GitHub Insights' unique visitors for the last 14 days.
// GitHub's Traffic REST API requires an owner-authorized token.
// The public site reads this JSON; no access token is ever sent to browsers.
'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const REPOSITORY='KazartsevEV/shelter-partner-directory';
const DATA_FILE=path.resolve(__dirname,'../nomad360_repo_traffic.json');
function normalizeTraffic(data,now=new Date()){
  if(!Number.isSafeInteger(data?.uniques)||data.uniques<0)
    throw Error('GitHub Traffic API did not return a valid unique visitor count');
  return {
    status:'ok',source:'github-repository-traffic',repository:REPOSITORY,
    updatedAt:now.toISOString(),visitors14:data.uniques
  };
}
async function refresh(){
  const token=process.env.NOMAD360_TRAFFIC_TOKEN;
  if(!token)throw Error('Missing NOMAD360_TRAFFIC_TOKEN (GitHub repository Administration: read)');
  const response=await fetch('https://api.github.com/repos/'+REPOSITORY+'/traffic/views',{
    headers:{
      'Authorization':'Bearer '+token,
      'Accept':'application/vnd.github+json',
      'X-GitHub-Api-Version':'2022-11-28',
      'User-Agent':'nomad360-github-repository-traffic'
    }
  });
  if(!response.ok)throw Error('GitHub traffic API returned HTTP '+response.status);
  const output=normalizeTraffic(await response.json());
  await fs.writeFile(DATA_FILE,JSON.stringify(output,null,2)+'\n','utf8');
  console.log('Updated unique visitors for last 14 days at',output.updatedAt);
}
if(require.main===module)refresh().catch(e=>{
  console.error(e.message);process.exitCode=1;
});
module.exports={normalizeTraffic};
