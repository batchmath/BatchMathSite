"""Verify all runtime files against production F, allowing only reviewed prompts/version metadata."""
import hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='0bf61ebd86ae0da06d9f9e4f580ab9b3d386a81a'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
approved=json.loads((ROOT/'docs/unit2-hotfix/evidence/preservation.json').read_text())
prompts={r['path']:r for r in approved['pages']}
version={'assets/app-version.json','assets/pwa.js','assets/problem-tracking.js','assets/reproducible-rng.js','sw.js','package.json'}
instructions={'LOCAL-TESTING.txt','BATCHMATH-WORKING-COPY.txt'}
records=[]
for row in git('ls-tree','-rz',BASE).split(b'\0'):
 if not row:continue
 meta,name=row.split(b'\t',1);name=name.decode()
 if name.startswith(('tools/','docs/','.github/')):continue
 data=(ROOT/name).read_bytes();h=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest();old=meta.split()[2].decode()
 category='unchanged'
 if h!=old:
  if name in prompts:
   assert h==prompts[name]['afterBlob'] and old==prompts[name]['beforeBlob'];category='reviewed-prompt-only'
  elif name in instructions:category='reviewed-local-test-instructions'
  else:
   assert name in version or (name.startswith('ap-calculus/unit-6-applications-integration/') and name.endswith('/index.html')),name
   assert data==git('show',BASE+':'+name).replace(b'12.9.F',b'12.9.G'),name
   category='version-only'
 records.append({'path':name,'category':category,'beforeBlob':old,'afterBlob':h})
counts={k:sum(r['category']==k for r in records) for k in sorted({r['category'] for r in records})}
assert counts['reviewed-prompt-only']==2 and counts['version-only']==16 and counts['reviewed-local-test-instructions']==2,counts
result={'baseline':BASE,'passed':True,'counts':counts,'allOtherRuntimeFilesByteIdenticalToF':True,'files':records}
(ROOT/'docs/unit2-hotfix/evidence/website-preservation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(counts))
