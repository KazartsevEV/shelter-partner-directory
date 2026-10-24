'use strict';
// Replay the frozen C1 change against today's accepted assets, not the rejected
// pre-#248 artwork. The temporary clean commit is local-only and always removed.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),A=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
async function build(config,{browserFactory,original}){
 const pinned=git(['show','c4536e9edd60003efb0a9087ec60915d4c070bdd:nomad360_design_system.css']);A.equal(original,pinned);
 A.equal(git(['status','--porcelain','--untracked-files=no']).trim(),'','Replay requires a clean tracked source');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'nomad-c1-replay-')),fixture=path.join(temp,'fixture');let added=false;
 try{
  git(['worktree','add','--detach',fixture,'HEAD']);added=true;
  fs.writeFileSync(path.join(fixture,'nomad360_design_system.css'),original);
  const run=args=>execFileSync('git',args,{cwd:fixture,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  run(['add','nomad360_design_system.css']);run(['-c','user.name=Nomad360 test fixture','-c','user.email=test@example.invalid','commit','-m','Local-only isolated C1 replay']);
  return await require('../partners/build.cjs').buildPackage(config,{repositoryRoot:fixture,browserFactory});
 }finally{if(added)git(['worktree','remove','--force',fixture]);fs.rmSync(temp,{recursive:true,force:true});}
}
module.exports={build};
