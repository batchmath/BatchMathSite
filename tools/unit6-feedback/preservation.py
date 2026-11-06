"""Verify the F correction scope against the exact approved E foundation."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
BASE='6de1b027f45f43285be9fdc98d38d5f49419aecd'
E=ROOT/'docs/feedback-audit/evidence'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def blob(data):return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
def normal(name,data):
    if name in ['assets/app-version.json','assets/pwa.js','assets/problem-tracking.js','assets/reproducible-rng.js','sw.js','package.json']:
        return data.replace(b'12.9.E',b'BUILD').replace(b'12.9.F',b'BUILD')
    if name.startswith('ap-calculus/unit-6-applications-integration/') and name.endswith('.html'):
        return re.sub(rb'(generatorVersion["\s]*:["\s]*)12\.9\.[EF]',rb'\g<1>BUILD',data)
    return data
approved=json.loads((ROOT/'tools/unit6-feedback/approved-feedback.json').read_text());assert approved['baseline']==BASE
before={}
for row in git('ls-tree','-rz',BASE).split(b'\0'):
    if row:
        meta,name=row.split(b'\t',1);before[name.decode()]=meta.split()[2].decode()
names=set(git('ls-files','-z').decode().strip('\0').split('\0'));assert set(before)<=names
records=[]
for name in sorted(names-{'docs/feedback-audit/evidence/source-preservation.json'}):
    data=(ROOT/name).read_bytes();after=blob(data)
    if name.startswith(('docs/','tools/','.github/')):
        kind='retained' if before.get(name)==after else 'qa-documentation'
    elif name in ['LOCAL-TESTING.txt','BATCHMATH-WORKING-COPY.txt']:
        kind='test-build-instructions'
    elif name in approved['assets']:
        entry=approved['assets'][name];assert before[name]==entry['before'] and after==entry['after'],name
        kind='approved-feedback-only'
    elif after==before.get(name):kind='retained'
    else:
        assert name in before,name
        assert normal(name,data)==normal(name,git('show',BASE+':'+name)),name
        kind='version-only'
    records.append({'path':name,'category':kind,'baselineBlob':before.get(name),'currentBlob':after})
counts={k:sum(r['category']==k for r in records) for k in sorted({r['category'] for r in records})}
assert counts['approved-feedback-only']==3
report={'baseline':BASE,'ok':True,'counts':counts,'allMathematicalGradersMathLiveKeypadsAndVideosUnchanged':True,
        'note':'Only three exact approved feedback modules and final build metadata/instructions may differ outside QA/docs. Deterministic mathematical/RNG comparison is recorded separately in audit-after.json and modes-and-reviews.json.',
        'files':records}
E.mkdir(parents=True,exist_ok=True);(E/'source-preservation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['baseline','ok','counts']},indent=2))
