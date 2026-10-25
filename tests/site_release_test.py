import importlib.util,json,subprocess,tempfile,unittest,sys,copy,fnmatch,re
sys.dont_write_bytecode=True
from pathlib import Path
spec=importlib.util.spec_from_file_location('release',Path(__file__).resolve().parents[1]/'scripts/site-release/build.py');M=importlib.util.module_from_spec(spec);spec.loader.exec_module(M)
class ReleaseTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)/'source';self.root.mkdir();self.out=Path(self.temp.name)/'site'
  subprocess.run(['git','init','-q',str(self.root)],check=True)
  (self.root/'Marketing_calc.HTML').write_text('<!doctype html><title>Calculator</title>');(self.root/'index.html').write_text('SHELTER MUST STAY PRIVATE TO THIS ARTIFACT')
  self.config=self.root/'public-files.json';self.config.write_text(json.dumps({'schemaVersion':1,'basePath':'/shelter-partner-directory/','files':['Marketing_calc.HTML']}));self.commit()
 def tearDown(self):self.temp.cleanup()
 def commit(self):
  subprocess.run(['git','add','.'],cwd=self.root,check=True);subprocess.run(['git','-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','fixture'],cwd=self.root,check=True)
 def build(self):return M.build(self.root,self.out,self.config)
 def test_reproducible_clean_artifact_and_generated_root(self):
  a=self.build();b=M.build(self.root,Path(self.temp.name)/'second',self.config)
  self.assertEqual(a,b);self.assertEqual((self.out/'index.html').read_bytes(),(self.root/'Marketing_calc.HTML').read_bytes());self.assertNotEqual((self.out/'index.html').read_bytes(),(self.root/'index.html').read_bytes());self.assertEqual(M.check(self.out),a)
 def test_forbidden_paths_and_disguised_private_files(self):
  for p in ['../file.js','/file.js','.git/config','.github/workflows/x.yml','scripts/a.js','tests/model.json','docs/reviews/a.html','node_modules/a.js','state/queue.json','partner.zip','nomad360_credentials.json','private/key.json','index.html','a/../b','a\\b','nomad360_worker.py','bytecode.pyc','config.yml']:
   with self.subTest(path=p),self.assertRaises(ValueError):M.safe(p)
 def test_refuse_dirty_source(self):
  (self.root/'Marketing_calc.HTML').write_text('changed');self.assertRaises(ValueError,self.build);self.assertFalse(self.out.exists())
 def test_refuse_existing_output_without_removing_it(self):
  self.out.mkdir();(self.out/'keep').write_text('keep');self.assertRaises(ValueError,self.build);self.assertEqual((self.out/'keep').read_text(),'keep')
 def test_missing_or_untracked_resource(self):
  self.config.write_text(json.dumps({'schemaVersion':1,'basePath':'/shelter-partner-directory/','files':['Marketing_calc.HTML','missing.js']}));self.commit();self.assertRaises(ValueError,self.build);self.assertFalse(self.out.exists())
 def test_duplicate_allowlist_and_unapproved_origin(self):
  for entries,base in [(['Marketing_calc.HTML']*2,'/shelter-partner-directory/'),(['Marketing_calc.HTML'],'/new-host/')]:
   self.config.write_text(json.dumps({'schemaVersion':1,'basePath':base,'files':entries}));self.commit();self.assertRaises(ValueError,self.build)
 def test_tamper_and_injected_file(self):
  self.build();(self.out/'evil.json').write_text('x');self.assertRaises(ValueError,M.check,self.out);(self.out/'evil.json').unlink();(self.out/'Marketing_calc.HTML').write_text('tampered');self.assertRaises(ValueError,M.check,self.out)
 def test_symlink_resource_or_manifest(self):
  (self.root/'public.js').symlink_to(self.root/'Marketing_calc.HTML');self.config.write_text(json.dumps({'schemaVersion':1,'basePath':'/shelter-partner-directory/','files':['Marketing_calc.HTML','public.js']}));self.commit();self.assertRaises(ValueError,self.build)
 def test_manifest_symlink_rejected(self):
  self.build();original=self.out/'release-manifest.json';target=Path(self.temp.name)/'manifest.json';original.rename(target);original.symlink_to(target);self.assertRaises(ValueError,M.check,self.out)
 def test_existing_broken_output_link_is_not_replaced(self):
  self.out.symlink_to(Path(self.temp.name)/'missing');self.assertRaises(ValueError,self.build);self.assertTrue(self.out.is_symlink())
 def test_private_key_content_not_exported(self):
  (self.root/'Marketing_calc.HTML').write_text('-----BEGIN PRIVATE KEY-----');self.commit();self.assertRaises(ValueError,self.build);self.assertFalse(self.out.exists())
 def rewrite_manifest(self, manifest):
  canonical=json.dumps({'revision':manifest['sourceRevision'],'basePath':manifest['basePath'],'files':manifest['files']},sort_keys=True,separators=(',',':')).encode()
  manifest['artifactSha256']=M.digest(canonical)
  (self.out/'release-manifest.json').write_text(json.dumps(manifest))
 def test_structural_manifest_errors_fail_even_with_recomputed_digest(self):
  original=self.build()
  mutations=[('schemaVersion',2),('schemaVersion',True),('basePath','/other/'),('sourceRevision','unknown')]
  for key,value in mutations:
   with self.subTest(key=key,value=value):
    candidate=copy.deepcopy(original);candidate[key]=value;self.rewrite_manifest(candidate);self.assertRaises(ValueError,M.check,self.out)
  for field,value in [('source','scripts/operator.js'),('source','other.HTML'),('bytes',True),('sha256','invalid'),('unknown','x')]:
   with self.subTest(field=field,value=value):
    candidate=copy.deepcopy(original);candidate['files'][0][field]=value;self.rewrite_manifest(candidate);self.assertRaises(ValueError,M.check,self.out)
  candidate=copy.deepcopy(original);candidate['files']=[];self.rewrite_manifest(candidate);self.assertRaises(ValueError,M.check,self.out)
  candidate=copy.deepcopy(original);candidate['unknown']='x';self.rewrite_manifest(candidate);self.assertRaises(ValueError,M.check,self.out)
 def test_empty_directories_and_symlink_trees_rejected(self):
  self.build();extra=self.out/'private';extra.mkdir();self.assertRaises(ValueError,M.check,self.out);extra.rmdir()
  target=Path(self.temp.name)/'empty';target.mkdir();extra.symlink_to(target,target_is_directory=True);self.assertRaises(ValueError,M.check,self.out);extra.unlink()
  link=Path(self.temp.name)/'site-link';link.symlink_to(self.out,target_is_directory=True);self.assertRaises(ValueError,M.check,link)
 def test_all_release_sources_trigger_artifact_ci(self):
  project=Path(__file__).resolve().parents[1]
  sources=json.loads((project/'scripts/site-release/public-files.json').read_text())['files']
  workflow=(project/'.github/workflows/site-release.yml').read_text()
  patterns=re.findall(r"^      - '([^']+)'$",workflow,re.M)
  for source in sources:
   with self.subTest(source=source):self.assertTrue(any(fnmatch.fnmatchcase(source,p) for p in patterns),'Missing CI trigger: '+source)
if __name__=='__main__':unittest.main()
