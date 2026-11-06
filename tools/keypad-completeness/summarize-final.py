"""Require complete fresh final runs, then produce the final QA summary."""
import importlib.util,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];E=ROOT/'docs/audits/evidence'
CANONICAL=[f'keypad-completeness-{name}-final-d.json' for name in ['unit1','unit2','dynamic','im1','im1-unit3','prep','slope']]+['keypad-approximation-investigation-final-d.json','keypad-degree-investigation-final-d.json']
FOCUSED=['keypad-completeness-unit2-roots-final-d.json','keypad-completeness-dynamic-unit4-roots-final-d.json','keypad-completeness-dynamic-unit5-roots-final-d.json','keypad-completeness-dynamic-unit3-gaps-final-d.json','keypad-completeness-dynamic-assignment-gap-final-d.json','keypad-completeness-unit1-multipart-final-d.json','keypad-completeness-dynamic-multipart-final-d.json']
FILES=CANONICAL+FOCUSED
for name in FILES:
 data=json.loads((E/name).read_text())
 assert not data.get('errors'),name
 for row in data['results']:
  if row.get('coverage'):continue
  assert row.get('passed') is True or row.get('feedback')=='feedback correct',(name,row)
spec=importlib.util.spec_from_file_location('ledger',Path(__file__).with_name('build-ledger.py'))
ledger=importlib.util.module_from_spec(spec);spec.loader.exec_module(ledger)
fresh=ledger.build(FILES,'final-fresh-post-c',E/'keypad-final-fresh-field-inventory.json')
assert fresh['summary']['reviewedMathematicalRoutes']==118
assert fresh['summary']['missingControlRows']==0 and fresh['summary']['unresolvedDriverFailures']==0
assert all(row['runtimeProfile'] and row['enteredLatex'] and row['serializedSource'] and row['originalCorrectAccepted'] and row['wrongRejected'] for row in fresh['fields'] if not row['retainedControl'])
def load(name):return json.loads((E/name).read_text())
route=load('keypad-final-route-sweep.json');assert len(route['results'])==374 and all(r['passed'] for r in route['results']);assert route['unexpectedErrors']==0
stability=load('keypad-stability-keypad-final-d.json');assert len(stability['results'])==130 and all(r['passed'] for r in stability['results']) and not stability['errors']
overlap=load('keypad-final-overlap/overlap-responsive.json');assert len(overlap['results'])==102 and all(r['passed'] for r in overlap['results']) and not overlap['errors']
size=load('video-sizing-keypad-final-d.json');assert len(size['results'])==340 and all(r['passed'] for r in size['results']) and not size['errors'];assert sum(len(r['players']) for r in size['results'])==1056
video=load('keypad-final-video-presentation.json');assert video['ok'] and video['pageLoads']==198 and video['selections']==288 and not video['errors']
node=(E/'keypad-final-node.tap').read_text();assert re.search(r'^# tests 274$',node,re.M) and re.search(r'^# pass 274$',node,re.M) and re.search(r'^# fail 0$',node,re.M)
focus=[]
for group in ['pilots','contracts']:
 rows=load('keypad-final-focused/'+group+'-summary.json');assert all(r['exitCode']==0 for r in rows);focus+=rows
assert len(focus)==11
focused_rows=[];focused_pairs=0
for path in (E/'keypad-final-focused').glob('*/*.json'):
 data=json.loads(path.read_text());assert not data.get('errors') and not data.get('pageErrors');focused_rows+=data['results'];focused_pairs+=data.get('checkerPairs',data.get('gradingPairs',0))
assert len(focused_rows)==132 and all(row['passed'] for row in focused_rows) and focused_pairs==543
summary={'testedProductionCommit':'f5d0a73a446e0fe55b285aab5c933cf1548911bf','freshKeypad':fresh['summary'],'freshKeypadFiles':FILES,'allPreviouslyBlockedFields':{'before':119,'resolved':119,'unresolved':0,'evidence':'keypad-corrections-before-after.json'},'node':{'tests':274,'passed':274,'failed':0},'nativeDegreeRadianAdvance':load('keypad-degree-native-advance-final-d.json'),'legacyRootCompleteAnswers':load('keypad-legacy-root-grading-final-d.json'),'routes':{'visits':374,'routes':138,'knownMathJaxErrors':route.get('knownMathJaxErrors',0),'unexpectedErrors':0},'stability':{'cases':130,'controllers':stability['controllerCount'],'routes':stability['routeCount'],'actions':stability['actions'],'pageErrors':0},'overlap':{'checks':102,'pageErrors':0},'focusedSuites':focus,'focusedBrowser':{'cases':132,'countedGraderPairs':543,'suites':11,'pageErrors':0},'driverCorrections':load('keypad-final-attempt-review.json'),'videoPresentation':video,'videoSizing':{'visits':340,'playerChecks':1056,'pageErrors':0},'preservation':load('keypad-final-preservation.json'),'static':load('keypad-final-static.json'),'protection':load('keypad-final-protected-refs.json'),'excludedAttempts':load('keypad-final-interrupted-attempts.json'),'limitations':'Finite generated educational forms and meaningful accepted alternatives; no arbitrary equivalence, physical-device or assistive-technology certification. YouTube is simulated; external playback/audio is not verified.'}
(E/'KEYPAD-FINAL-QA.json').write_text(json.dumps(summary,indent=2)+'\n')
corrections=json.loads((ROOT/'tools/keypad-completeness/correction-evidence.json').read_text())
(ROOT/'tools/keypad-completeness/final-evidence.json').write_text(json.dumps(corrections+FILES,indent=2)+'\n')
ledger.build(ledger.SOURCES+corrections+FILES,'final-verified')
print('All fresh final suites complete; summary and cumulative inventory written.')
