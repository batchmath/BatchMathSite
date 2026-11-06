"""Build and verify a complete static test ZIP from the exact committed tree."""
import functools,hashlib,http.server,json,os,subprocess,threading,urllib.request,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(os.environ.get('BATCHMATH_DELIVERY_DIR','/workspace/work/video-sizing-keypad-audit/delivery'))
OUT.mkdir(parents=True,exist_ok=True)
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
sha=git('rev-parse','HEAD');branch=git('branch','--show-current')
assert branch=='integration/mathlive-im1-videos-content'
assert not git('diff','919ca1806f07e3cd2af552142926e7ca2b78e8d5','--','ap-calculus/unit-6-applications-integration/')
excluded=['tools/','.github/','docs/integration/evidence/','docs/audits/evidence/']
excluded_files=['.gitattributes','docs/audits/COMPREHENSIVE-REVIEW-INSTRUCTIONS.json','docs/audits/VIDEO-HIERARCHY.json','docs/audits/VIDEO-SIZING-INVENTORY.json','docs/audits/KEYPAD-COMPLETENESS-INVENTORY.json','docs/audits/KEYPAD-COMPLETENESS-MATRIX.csv']
zpath=OUT/'batchmath-video-sizing-keypad-audit.zip'
subprocess.run(['git','archive','--format=zip','--prefix=BatchMathSite/','--output='+str(zpath),sha],cwd=ROOT,check=True)
expected={}
for line in git('ls-tree','-rl',sha).splitlines():
 meta,name=line.split('\t')
 if name in excluded_files or any(name.startswith(p) for p in excluded):continue
 expected[name]=meta.split()[2]
with zipfile.ZipFile(zpath) as z:
 names={n.removeprefix('BatchMathSite/') for n in z.namelist() if not n.endswith('/')}
 assert names==set(expected),(names-set(expected),set(expected)-names)
 for name,blob in expected.items():
  data=z.read('BatchMathSite/'+name)
  assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==blob,name
 lock=json.loads(z.read('BatchMathSite/assets/mathlive/dependency-lock.json'))['mathlive']
 for entry in lock['files']:
  data=z.read('BatchMathSite/assets/mathlive/'+entry['path'])
  assert len(data)==entry['bytes'] and hashlib.sha256(data).hexdigest()==entry['sha256'],entry['path']
 assert z.testzip() is None
 html=sum(n.endswith('.html') for n in names);pdf=sum(n.endswith('.pdf') for n in names)
 assert (html,pdf)==(280,290)
 preview=OUT/'preview';z.extractall(preview)
class QuietHandler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(preview/'BatchMathSite')))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
smoke=['index.html','ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html','calculus-prep/trig-angle-skills/index.html','assets/calculus-keypad.js','assets/mathlive/applications-profiles.mjs','assets/mathlive/vendor/mathlive/mathlive.min.mjs','assets/site.css', 'assets/mathlive/'+next(e['path'] for e in lock['files'] if e['path'].endswith('.woff2'))]
try:
 for name in smoke:
  with urllib.request.urlopen(f'http://127.0.0.1:{server.server_port}/'+name) as response:
   assert response.status==200 and response.read()==(preview/'BatchMathSite'/name).read_bytes(),name
finally:server.shutdown();server.server_close();thread.join()
manifest={'branch':branch,'finalCommit':sha,'zip':zpath.name,'bytes':zpath.stat().st_size,'sha256':hashlib.file_digest(zpath.open('rb'),'sha256').hexdigest(),'archiveUrl':'https://github.com/batchmath/BatchMathSite/archive/'+sha+'.zip','includedFiles':len(expected),'htmlPages':html,'pdfFiles':pdf,'allIncludedBlobsMatchFinalCommit':True,'mathliveIntegrityFiles':len(lock['files']),'extractedHttpChecks':len(smoke),'unit6Unchanged':True,'excluded':excluded+excluded_files+['Git metadata','untracked caches'],'deployed':False}
(OUT/'delivery-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'LOCAL-TESTING.txt').write_text(f'''BatchMath keypad/video test build
Branch: {branch}
Commit: {sha}

Extract {zpath.name}. Open a terminal inside BatchMathSite, beside index.html.
Run:

py -m http.server 8000

Open http://localhost:8000/ . Press Ctrl+C to stop.

Check inverse-chain absolute values, exact/rounded analysis intervals,
linearization decimals, degree/radian switching and editable indexed roots.
Use ?editor=legacy on a practice URL to compare the retained editor.
Check the lecture/supporting galleries, homework/review players, and keypad
focus and mobile layout. All pages, PDFs and local MathLive assets are included.
Normal MathJax CDN and YouTube use require internet.
Unit 6 is unchanged. Main/source branches are unchanged; nothing is deployed.
''')
print(json.dumps(manifest,indent=2))
