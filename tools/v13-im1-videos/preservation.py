"""Preserve the approved v13.0.E website outside five video additions and F build metadata."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'tools/v13-im1-videos/videos.json').read_text());BASE=manifest['baseline']
videos={r['path']:r for r in manifest['videos']}
versions={'assets/app-version.json','assets/pwa.js','assets/problem-tracking.js','assets/reproducible-rng.js','sw.js','package.json'}
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
records=[]
for row in git('ls-tree','-rz',BASE).split(b'\0'):
 if not row:continue
 meta,name=row.split(b'\t',1);name=name.decode()
 if name.startswith(('docs/','tools/','.github/')):continue
 data=(ROOT/name).read_bytes();blob=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest();old=meta.split()[2].decode();category='unchanged'
 if blob!=old:
  before=git('show',BASE+':'+name)
  if name in videos:
   s=data.decode();r=videos[name];assert s.count('data-video-id=')==1 and f'data-video-id="{r["id"]}"' in s
   assert s.count('/assets/instructional-videos.js')==s.count('/assets/instructional-videos.css')==1
   s,n=re.subn(r'<section class="video-section lecture-section im1-video-section".*?</section>','',s,flags=re.S);assert n==1
   s=s.replace('<link rel="stylesheet" href="/assets/instructional-videos.css"/><script defer src="/assets/instructional-videos.js"></script>','')
   assert s.encode()==before,name+': existing content changed'
   category='video-addition-only'
  elif name in ['LOCAL-TESTING.txt','BATCHMATH-WORKING-COPY.txt']:category='local-test-instructions'
  else:
   assert name in versions or name.startswith('ap-calculus/unit-6-applications-integration/') and name.endswith('/index.html'),name
   assert data==before.replace(b'13.0.E',b'13.0.F'),name
   category='version-only'
 records.append({'path':name,'category':category,'beforeBlob':old,'afterBlob':blob})
counts={k:sum(r['category']==k for r in records) for k in sorted({r['category'] for r in records})}
assert counts['video-addition-only']==5 and counts['version-only']==16 and counts['local-test-instructions']==2,counts
out={'baseline':BASE,'passed':True,'counts':counts,'all3dMathLiveGradersGeneratorsVideosAndOtherContentPreserved':True,'files':records}
target=ROOT/'docs/v13.0.F/evidence/preservation.json';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(counts))
