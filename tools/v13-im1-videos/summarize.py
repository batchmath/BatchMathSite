"""Validate the completed focused QA outputs; do not turn partial runs into passes."""
import json,os,shutil,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
WORK=Path(os.environ.get('V13_QA_WORK',str(Path(tempfile.gettempdir())/'batchmath-v13-f-qa')))
E=ROOT/'docs/v13.0.F/evidence';E.mkdir(parents=True,exist_ok=True)
checks=[]
def read(path):return json.loads(path.read_text())
def record(name,stats):checks.append({'name':name,'passed':True,**stats})
for name,count in [('slice3d',41),('display3d',42),('solids3d',30)]:
 d=read(WORK/(name+'.json'));assert d['failures']==[] and len(d['runs'])==count,name
 assert all(v==0 for k,v in d.items() if k.startswith('errors ')),name
 shutil.copy2(WORK/(name+'.json'),E/(name+'.json'))
 stats={'runs':count,'failures':0}
 if 'models' in d:stats['models']=d['models']
 elif name=='solids3d':stats['models']=sum(len(r.get('models',[])) for r in d['runs'])
 record(name,stats)
d=read(WORK/'cross-sections3d.json');assert not d['failures'] and (len(d['nonCalculator']),len(d['calculator']))==(32,12)
shutil.copy2(WORK/'cross-sections3d.json',E/'cross-sections3d.json');record('cross-sections3d',{'nonCalculatorRuns':32,'calculatorRuns':12,'failures':0})
for name,expected in [('solid-geometry',617899),('revolution-geometry',32674)]:
 d=read(WORK/(name+'.json'));assert d['failures']==[] and d['checks']==expected
 shutil.copy2(WORK/(name+'.json'),E/(name+'.json'));record(name,{'checks':d['checks'],'failures':0})
d=read(E/'videos-browser.json');assert len(d['results'])==10 and all(r['passed'] for r in d['results']);record('videos',{'visits':10,'externalPlaybackVerified':False})
d=read(ROOT/'qa-results/video-presentation-qa.json');assert d['ok'] and d['errors']==[] and (d['videoPages'],d['pageLoads'],d['selections'])==(77,231,330)
shutil.copy2(ROOT/'qa-results/video-presentation-qa.json',E/'video-presentation.json');record('video-presentation',{'pages':77,'pageLoads':231,'selections':330})
d=read(E/'entry/summary.json');assert len(d)==8 and all(r['exitCode']==0 for r in d)
totals={k:sum(r[k] for r in d) for k in ['checked','parts','integrals','mathliveFields','blankAtStart','locked']};assert (totals['checked'],totals['parts'],totals['integrals'])==(48,78,21);assert totals['mathliveFields']==totals['blankAtStart']==totals['locked']==78
record('entry',{'runs':8,**totals})
for name in ['unit6-math','im1-math','static','pwa','analytics']:
 s=(E/(name+'.log')).read_text();assert 'PASS' in s and ('Errors: 0' in s or '"errors": 0' in s),name
 record(name,{'errors':0})
d=read(E/'preservation.json');assert d['passed'] and d['counts']['video-addition-only']==5 and d['counts']['version-only']==16;record('preservation',d['counts'])
for name,count in [('source-python-videos',10),('source-python-3d',4)]:
 d=read(WORK/(name+'.json'));assert len(d['results'])==count and all(r['passed'] for r in d['results']),name
 shutil.copy2(WORK/(name+'.json'),E/(name+'.json'));record(name,{'runs':count})
d=read(WORK/'unit6-source-smoke/zip-smoke.json');assert not d['failures'] and d['version']['version']=='13.0.F';assert (len(d['pages']),len(d['setup']),len(d['cubic']),len(d['fallback']))==(20,6,2,4)
shutil.copy2(WORK/'unit6-source-smoke/zip-smoke.json',E/'unit6-pages-smoke.json');record('unit6-pages-smoke',{'pageVisits':20,'sameValueWrongSetupsRejected':6,'cubicGraphs':2,'fallbackChecks':4})
out={'baseline':'0604079082f58c3168e52bc009d1330ba1f20c68','passed':True,'checks':checks,'finalSitewideProductionVerificationDeferredUntilManualApproval':True,'historicalSiteSuite':'Approved E documents 39/48 passing with nine inherited groups; not claimed as a fresh F full-site run.'}
(E/'qa-summary.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
