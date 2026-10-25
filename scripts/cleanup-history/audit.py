#!/usr/bin/env python3
"""Conservative C7 evidence ledger; absence is never deletion authorization."""
import argparse,gzip,hashlib,json,subprocess,urllib.request,urllib.error,urllib.parse
from pathlib import Path
from html.parser import HTMLParser
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[2]
BASE='0e47899e0583b3654c6b7f438ca246f80963e489'
CANDIDATES=['index.html','.github/workflows/index.html','.github/workflows/Marketing_calc.HTML','US_Retail_Demo_FILLED.html','US_Retail_Demo_EN_FILLED.html']
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def sha(data):return hashlib.sha256(data).hexdigest()
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ('href','src','action') and v:self.links.append((tag,k,v))
def references(files,content,candidate):
 result=[]
 for file in files:
  if file==candidate or file.startswith(('docs/reviews/','tests/fixtures/','scripts/cleanup-history/')):continue
  text=content.get(file,'')
  # Full repository paths distinguish archived index.html from the public index.
  token=candidate if candidate.startswith('.github/') else candidate
  if candidate=='index.html':
   if file.lower().endswith(('.html','.htm')):
    p=Links();p.feed(text)
    for tag,attr,url in p.links:
     u=urllib.parse.urlsplit(url)
     if u.scheme and u.netloc!='kazartsevev.github.io':continue
     target=urllib.parse.urljoin('https://kazartsevev.github.io/shelter-partner-directory/'+file,url)
     if urllib.parse.urlsplit(target).hostname=='kazartsevev.github.io' and urllib.parse.urlsplit(target).path in ('/shelter-partner-directory/','/shelter-partner-directory/index.html'):result.append({'file':file,'kind':'html-link','value':url})
  else:
   for n,line in enumerate(text.splitlines(),1):
    if token in line:result.append({'file':file,'line':n,'kind':'literal-reference','matchedToken':token})
 return result

def scan():
 files=git('ls-tree','-r','--name-only',BASE).decode().splitlines()
 content={}
 for f in files:
  if Path(f).suffix.lower() not in ('.html','.js','.cjs','.py','.md','.yml','.yaml','.json','.css'):continue
  if f.startswith(('vendor/','docs/localization/l0/','tests/fixtures/')):continue
  data=(ROOT/f).read_bytes()
  if len(data)<3000000:content[f]=data.decode('utf8','replace')
 runtime={f:{'bytes':len((ROOT/f).read_bytes()),'sha256':sha((ROOT/f).read_bytes())} for f in files if (f.startswith(('nomad360_','portfolio_v2_','vendor/','assets/')) or (f.startswith(('en/','ru/','kk/','license/')) and f.endswith('.html')) or f in CANDIDATES+['sitemap.xml','robots.txt','Marketing_calc.HTML','US_Retail_Demo.HTML','CALCULATOR_LICENSE.md','.github/workflows/static.yml','.github/workflows/deploy-static.yml','.github/workflows/us-retail-filled-html.yml']) and (ROOT/f).is_file()}
 rows=[]
 for f in CANDIDATES:
  data=(ROOT/f).read_bytes();p=Links();p.feed(data.decode('utf8','replace'))
  reason='active SHELTER entrypoint, outside calculator cleanup' if f=='index.html' else 'supported generated standalone; generator/CI and direct URL contract' if 'FILLED' in f else 'archived source; no automatic retirement authorization and unknown external consumers'
  rows.append({'file':f,'bytes':len(data),'sha256':sha(data),'references':references(files,content,f),'outgoingLinks':[{'tag':t,'attribute':a,'value':v if len(v)<512 else v[:120]+'…','valueBytes':len(v.encode()),'valueSha256':sha(v.encode())} for t,a,v in p.links], 'decision':'retain','reason':reason})
 frozen=json.load(gzip.open(ROOT/'docs/reviews/runtime-audit-01/runtime-browser.json.gz','rt'))
 inv=json.load(gzip.open(ROOT/'docs/reviews/runtime-audit-01/runtime-inventory.json.gz','rt'))
 css={}
 for row in inv['cssRules']:
  for selector in row['selectors']:css.setdefault(selector,[]).append({'file':row['file'],'line':row['line'],'context':row['context']})
 selectors=[]
 for kind in ['notObserved','unsupported']:
  for selector in frozen['selectors'][kind]:
   owners=css.get(selector,[])
   fileset=sorted({o['file'] for o in owners})
   tokens=__import__('re').findall(r'[.#]([A-Za-z_][\w-]*)',selector)
   witnesses=[]
   for f,text in content.items():
    active_html=f in ['Marketing_calc.HTML','US_Retail_Demo.HTML'] or (f.startswith(('en/','ru/','kk/','license/')) and f.endswith('.html'))
    active_js=f.startswith(('nomad360_','portfolio_v2_')) and f.endswith('.js')
    if not (active_html or active_js):continue
    found=[t for t in tokens if t in text]
    if found:witnesses.append({'file':f,'tokens':found})
   selectors.append({'selector':selector,'historicStatus':kind,'historicOwners':owners,'currentOwnerFingerprints':{f:sha((ROOT/f).read_bytes()) for f in fileset if (ROOT/f).exists()},'currentLiteralSelectorWitnesses':[f for f in fileset if selector in content.get(f,'')],'currentLiteralTokenWitnesses':witnesses,'decision':'no-new-removal','reason':'missing DOM observation is not proof; dynamic/hidden/export/pseudo-element and condition coverage required'})
 return {'schemaVersion':1,'base':BASE,'copies':rows,'selectors':selectors,'runtime':runtime,'counts':{'copies':len(rows),'notObserved':len(frozen['selectors']['notObserved']),'unsupported':len(frozen['selectors']['unsupported']),'dynamicSelectorAccesses':sum(bool(x.get('dynamic')) for x in inv['selectors'])},'limits':['Reference search excludes generated evidence and inventory to avoid self-references. Literal witnesses are candidates, not scope-resolved reachability.','Selector observations/owners are explicitly HISTORICAL; current owner hashes are recorded separately. No current full-browser absence claim.','Reference scan caps text files at 3000000 bytes; larger generated standalones are fingerprinted and parsed for real HTML attributes, not dynamically evaluated templates.', 'No external backlink or historical license revocation evidence. HTTP 404 alone does not authorize deletion.','No runtime files, published URLs, selectors, deployment workflows or generated standalone copies are removed.']}

def live():
 rows=[]
 for f in CANDIDATES:
  url='https://kazartsevev.github.io/shelter-partner-directory/'+urllib.parse.quote(f)
  r={'file':f,'url':url,'observedAt':datetime.now(timezone.utc).isoformat()}
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Nomad360-C7-readonly-audit'}),timeout=25) as response:
    h=hashlib.sha256();n=0
    while data:=response.read(65536):h.update(data);n+=len(data)
    r.update(status=response.status,finalUrl=response.url,bytes=n,sha256=h.hexdigest(),contentType=response.headers.get('Content-Type'))
  except urllib.error.HTTPError as e:r.update(status=e.code,finalUrl=e.url)
  except Exception as e:r.update(error=type(e).__name__+': '+str(e))
  rows.append(r)
 return {'observations':rows,'limits':'Point-in-time public GET observations, not server analytics, external backlink inventory or permission to retire URLs.'}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--live',action='store_true');p.add_argument('--check',action='store_true');a=p.parse_args()
 target=ROOT/'docs/reviews/cleanup-history-07'/('live-urls.json' if a.live else 'inventory.json.gz')
 data=live() if a.live else scan();text=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
 if a.check:
  if gzip.decompress(target.read_bytes()).decode()!=text:raise SystemExit('C7 ledger stale')
 else:
  if a.live:target.write_text(text)
  else:target.write_bytes(gzip.compress(text.encode(),mtime=0))
 print('C7_LIVE_RECORDED' if a.live else 'C7_INVENTORY_GREEN',len(data.get('selectors',data.get('observations',[]))))
