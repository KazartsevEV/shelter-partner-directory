#!/usr/bin/env python3
"""Build a local, verified public site directory; never deploys or reads credentials."""
import argparse,hashlib,json,os,shutil,subprocess,tempfile
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[2]
DENIED={'.git','.github','scripts','tests','docs','node_modules','state','secrets','private','operator'}
def digest(b):return hashlib.sha256(b).hexdigest()
def git(root,*args):return subprocess.check_output(['git',*args],cwd=root)
def safe(name):
 p=PurePosixPath(name)
 if not isinstance(name,str) or not name or p.is_absolute() or any(x in ('..','.') or x in DENIED or x.startswith('.') for x in p.parts) or '\\' in name or str(p)!=name:raise ValueError('Forbidden public path: '+str(name))
 if p.suffix.lower() not in {'.html','.js','.css','.json','.webmanifest','.svg','.png','.webp','.jpg','.jpeg','.ico','.woff','.woff2','.txt','.md','.xml'}:raise ValueError('Non-client release source: '+name)
 if name=='index.html' or any(x in name.lower() for x in ['credential','client_secret','refresh_token','application-state','partner-issuance']) or p.suffix.lower() in {'.zip','.pem','.key','.env','.sqlite','.db'}:raise ValueError('Forbidden public source: '+name)
 return name
def check(root):
 if (root/'release-manifest.json').is_symlink():raise ValueError('Symlink manifest rejected')
 manifest=json.loads((root/'release-manifest.json').read_text())
 expected={r['path']:r for r in manifest['files']}
 if len(expected)!=len(manifest['files']):raise ValueError('Duplicate manifest path')
 actual={p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()}
 if actual!=set(expected)|{'release-manifest.json'}:raise ValueError('Unexpected or missing artifact files')
 for name,row in expected.items():
  if name!='index.html':safe(name)
  p=root/name
  if p.is_symlink() or p.resolve()!=p.absolute():raise ValueError('Symlink in artifact')
  b=p.read_bytes()
  if len(b)!=row['bytes'] or digest(b)!=row['sha256']:raise ValueError('Artifact fingerprint mismatch: '+name)
 if (root/'index.html').read_bytes()!=(root/'Marketing_calc.HTML').read_bytes():raise ValueError('Root alias must be the unchanged calculator')
 canonical=json.dumps({'revision':manifest['sourceRevision'],'basePath':manifest['basePath'],'files':manifest['files']},sort_keys=True,separators=(',',':')).encode()
 if manifest['artifactSha256']!=digest(canonical):raise ValueError('Invalid artifact digest')
 return manifest

def build(root,out,config):
 spec=json.loads(config.read_text())
 if set(spec)!={'schemaVersion','basePath','files'} or spec['schemaVersion']!=1 or spec['basePath']!='/shelter-partner-directory/':raise ValueError('Unsupported release configuration; origin migration requires R4')
 files=spec['files']
 if not isinstance(files,list) or len(files)!=len(set(files)) or 'Marketing_calc.HTML' not in files:raise ValueError('Invalid allowlist')
 for f in files:safe(f)
 if git(root,'status','--porcelain','--untracked-files=no').strip():raise ValueError('Commit tracked changes before release build')
 tracked=set(git(root,'ls-files','-z').decode().split('\0'))
 if config.relative_to(root).as_posix() not in tracked:raise ValueError('Untracked release configuration')
 revision=git(root,'rev-parse','HEAD').decode().strip()
 if out.exists() or out.is_symlink():raise ValueError('Output exists; use a fresh release directory')
 if out.resolve()!=out.absolute():raise ValueError('Noncanonical or symlink output path')
 if out==root or root in out.parents and any(part in DENIED for part in out.relative_to(root).parts):raise ValueError('Unsafe output directory')
 out.parent.mkdir(parents=True,exist_ok=True)
 temp=Path(tempfile.mkdtemp(prefix='.nomad-release-',dir=out.parent));rows=[]
 try:
  for name in sorted(files):
   if name not in tracked:raise ValueError('Untracked release source: '+name)
   src=root/name
   if src.is_symlink() or src.resolve()!=src.absolute() or not src.is_file():raise ValueError('Invalid release source: '+name)
   b=src.read_bytes()
   if b'-----BEGIN PRIVATE KEY-----' in b or b'-----BEGIN RSA PRIVATE KEY-----' in b:raise ValueError('Private key material rejected')
   target=temp/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
   rows.append({'path':name,'source':name,'bytes':len(b),'sha256':digest(b)})
  b=(temp/'Marketing_calc.HTML').read_bytes();(temp/'index.html').write_bytes(b)
  rows.append({'path':'index.html','source':'Marketing_calc.HTML','bytes':len(b),'sha256':digest(b)})
  rows.sort(key=lambda r:r['path'])
  canonical=json.dumps({'revision':revision,'basePath':spec['basePath'],'files':rows},sort_keys=True,separators=(',',':')).encode()
  manifest={'schemaVersion':1,'sourceRevision':revision,'basePath':spec['basePath'],'artifactSha256':digest(canonical),'files':rows}
  (temp/'release-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
  check(temp)
  if git(root,'rev-parse','HEAD').decode().strip()!=revision or git(root,'status','--porcelain','--untracked-files=no').strip():raise ValueError('Source changed during build')
  for row in rows:
   if digest((root/row['source']).read_bytes())!=row['sha256']:raise ValueError('Source changed during build: '+row['source'])
  temp.rename(out);return manifest
 finally:
  if temp.exists():shutil.rmtree(temp)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--out',type=Path);p.add_argument('--verify',type=Path);a=p.parse_args()
 if bool(a.out)==bool(a.verify):p.error('Choose --out or --verify')
 result=check(a.verify.resolve()) if a.verify else build(ROOT,a.out.absolute(),ROOT/'scripts/site-release/public-files.json')
 print('PUBLIC_SITE_ARTIFACT_GREEN',json.dumps({'revision':result['sourceRevision'],'files':len(result['files']),'sha256':result['artifactSha256']}))
