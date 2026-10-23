'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process'),{buildPackage,writePackage}=require('../scripts/partners/build.cjs');
const config=require('./fixtures/partner-build/example.json');
test('unsupported configs fail before opening a browser or serving files',async()=>{
 let launched=false;await A.rejects(()=>buildPackage({...config,taxRate:5},{browserFactory(){launched=true;throw Error('unexpected launch')}}),/unsupported key/);A.equal(launched,false);
});
test('a dirty source checkout cannot be labelled with the committed revision',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'partner-dirty-'));
 try{
  const git=args=>execFileSync('git',args,{cwd:dir,stdio:'pipe'});
  git(['init']);await fs.writeFile(path.join(dir,'tracked.txt'),'before');git(['add','.']);git(['-c','user.name=Build test','-c','user.email=build@example.invalid','commit','-m','fixture']);
  await fs.writeFile(path.join(dir,'tracked.txt'),'after');let launched=false;
  await A.rejects(()=>buildPackage(config,{repositoryRoot:dir,browserFactory(){launched=true;}}),/Commit tracked changes/);A.equal(launched,false);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('exclusive output preserves previously issued HTML and manifest on retry/collision',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'partner-output-'));
 try{
  const result={filename:'example.html',html:'calculator',manifest:{schemaVersion:1}};
  await writePackage(result,dir);await A.rejects(()=>writePackage({...result,html:'changed'},dir),/EEXIST/);
  A.equal(await fs.readFile(path.join(dir,'example.html'),'utf8'),'calculator');
  A.deepEqual(JSON.parse(await fs.readFile(path.join(dir,'example.manifest.json'),'utf8')),result.manifest);
  // Collision with an existing HTML must remove only the new incomplete manifest.
  await fs.writeFile(path.join(dir,'other.html'),'previous');
  await A.rejects(()=>writePackage({...result,filename:'other.html'},dir),/EEXIST/);
  A.equal(await fs.readFile(path.join(dir,'other.html'),'utf8'),'previous');await A.rejects(()=>fs.stat(path.join(dir,'other.manifest.json')),/ENOENT/);
  await A.rejects(()=>writePackage({...result,filename:'../escape.html'},dir),/Unsafe/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
