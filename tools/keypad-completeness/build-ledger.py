"""Build the field ledger from explicit browser evidence, retaining failures."""
import argparse,hashlib,json,os,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];E=ROOT/'docs/audits/evidence'
SOURCES=[
'keypad-completeness-unit2.json','keypad-completeness-unit2-absolute-before.json','keypad-completeness-unit2-absolute-semantic-before.json',
'keypad-completeness-unit1.json','keypad-completeness-unit1-location-verified.json',
'keypad-completeness-im1.json','keypad-completeness-im1-contracts-verified.json','keypad-completeness-im1-equation-verified.json','keypad-completeness-im1-unit3-verified.json',
'keypad-completeness-prep-verified.json','keypad-completeness-prep-rrt-verified.json',
'keypad-completeness-dynamic-verified.json','keypad-completeness-dynamic-review-recheck.json','keypad-completeness-dynamic-unit3-before.json',
'keypad-completeness-dynamic-unit4-before.json','keypad-completeness-dynamic-newton-complete.json','keypad-completeness-dynamic-unit4-expanded-before.json','keypad-completeness-dynamic-unit4-control-coverage-before.json','keypad-completeness-dynamic-unit4-driver-recheck.json',
'keypad-completeness-dynamic-unit5-before.json','keypad-completeness-dynamic-unit5-expanded-before.json','keypad-completeness-dynamic-unit5-control-coverage-before.json','keypad-completeness-dynamic-unit5-cube-verified.json','keypad-completeness-dynamic-unit5-driver-recheck.json','keypad-completeness-dynamic-unit5-last-driver-recheck.json',
'keypad-completeness-dynamic-unit3-control-coverage-before.json','keypad-completeness-dynamic-unit3-required-gap-witness.json','keypad-completeness-dynamic-assignment-decimal-semantic-before.json',
'keypad-completeness-unit2-indexed-roots-before.json','keypad-completeness-dynamic-unit4-root-representations-before.json','keypad-completeness-dynamic-unit5-root-representations-before.json','keypad-completeness-dynamic-unit5-indexed-forms-before.json',
'keypad-completeness-slope.json','keypad-degree-investigation-semantic-before.json','keypad-approximation-investigation-negative-verified.json']
INTERRUPTED={'keypad-completeness-dynamic-verified.json','keypad-completeness-dynamic-unit4-expanded-before.json','keypad-completeness-dynamic-unit5-expanded-before.json'}
UTILITIES={'Clear','Check','←','→','↑','↓','⌫','Del'}
def compact_rows(value,key):
 rows=value[key];meta={k:v for k,v in value.items() if k!=key};head=json.dumps(meta,indent=2)[:-2] if meta else '{';text=head+(',' if meta else '')+'\n  '+json.dumps(key)+':[\n'+',\n'.join(json.dumps(r,separators=(',',':')) for r in rows)+'\n  ]\n}\n';assert json.loads(text)==value;return text

def build(sources,state,output=None):
 inventory=json.loads((ROOT/'tools/mathlive-sitewide/artifacts/final-field-inventory.json').read_text());cases={};references=[];route_runs={};proofs=[];cancelled=[]
 for name in sources:
  p=E/name
  if not p.exists():continue
  data=json.loads(p.read_text());references.append({'file':'docs/audits/evidence/'+name,'pageErrors':data.get('errors',[])})
  for original in data.get('results',[]):
   r=dict(original)
   if name in INTERRUPTED and 'Target page, context or browser has been closed' in r.get('error',''):
    cancelled.append({'route':r.get('route'),'questionId':r.get('questionId'),'evidence':name,'reason':'Browser process was intentionally stopped while repairing the test driver; no pass is inferred.'});continue
   if r.get('coverage'):
    route_runs.setdefault(r['route'],[]).append({'evidence':name,**r})
    if r.get('featureCoverage'):proofs.append({'route':r['route'],'evidence':name,**r['featureCoverage']})
    continue
   r.setdefault('route',data.get('route'))
   if name.startswith('keypad-degree-'):
    r.update(passed=r.get('feedback')=='feedback correct',wrongRejected=r.get('wrongKeypadRejected',False),requiredAnswer=r.get('requiredAnswer') or (r['question']['correct'] if isinstance(r.get('question'),dict) else None),field='answerRaw',semanticAlternativeAccepted=r.get('originalCheckerCorrectAccepted'))
   if name.startswith('keypad-approximation-'):
    r.update(course='AP Calculus',unit=3,family='exact-approximation/native-classification',questionId=r['id'],requiredAnswer=r['requiredAnswer'],latex=r['enteredLatex'],field='exact numerical part',wrongRejected=r.get('wrongFractionRejected',False))
   root_form=bool(r.get('meaningfulAlternative')) or any(p.get('meaningfulRootAlternative') for p in r.get('parts',[])) or 'root-representations' in name or 'indexed-forms' in name or 'indexed-roots' in name
   representation='indexed-root' if root_form else 'canonical'
   r['representation']=representation;r['evidence']='docs/audits/evidence/'+name
   key=(r.get('route'),r.get('questionId'),r.get('family'),representation,r.get('width'),r.get('prior'))
   cases[key]=r
 controls={};button_sets={}
 def control_id(control):
  control={'label':control['label'],'aria':control.get('aria')}
  key='k'+hashlib.sha256(json.dumps(control,sort_keys=True).encode()).hexdigest()[:10];controls[key]=control;return key
 def pad_id(buttons):
  if not buttons:return None
  keys=[control_id(b) for b in buttons];key='p'+hashlib.sha256(json.dumps(keys).encode()).hexdigest()[:10];button_sets[key]=keys;return key
 rows=[];correct_parts=wrong_parts=accepted_alternatives=0
 for r in cases.values():
  fields=[];parts=r.get('parts',[])
  if parts:
   for p in parts:
    if p.get('answers') is not None:
     if p.get('correctAccepted'):correct_parts+=1
     if p.get('wrongRejected'):wrong_parts+=1
     for i,answer in enumerate(p['answers']):
      fs=p.get('fields',[]);f=dict(fs[i]) if i<len(fs) else {};f.update(part=p.get('index'),field=f.get('field',i),requiredAnswer=(p.get('requiredAnswers') or p['answers'])[i],requiredRepresentation=answer,profile=f.get('profile') or p.get('runtimeProfile') or p.get('profile'),buttons=f.get('buttons') or p.get('buttons'),wrongRejected=p.get('wrongRejected',False),correctAccepted=bool(p.get('correctAccepted')),blocked=i>=len(fs),answerForms=r.get('answerForms'))
      fields.append(f)
    elif p.get('retainedChoice') or p.get('retainedSpecialControl'):
     fields.append({'field':p.get('retainedSpecialControl') or 'native choices','part':p.get('index'),'retainedControl':True,'profile':'native control'})
  else:
   fields=[dict(f) for f in r.get('fields',[])]
   if not fields and not r.get('retainedChoice'):fields=[{k:r.get(k) for k in ['field','raw','requiredAnswer','latex','profile','buttons','used']}]
   if r.get('retainedChoice'):fields=[{'field':'native choices','retainedControl':True,'profile':'native control'}]
   typed=any(not f.get('retainedControl') for f in fields)
   if typed and r.get('passed'):correct_parts+=1+len(r.get('meaningfulAlternatives',[]))
   if typed and r.get('wrongRejected'):wrong_parts+=1
   for i,f in enumerate(fields):
    f.setdefault('field',i);f.setdefault('profile',r.get('profile'));f.setdefault('requiredAnswer',r.get('requiredAnswer',r.get('answers',[None]*len(fields))[i] if r.get('answers') else f.get('raw')));f.setdefault('requiredRepresentation',r.get('meaningfulAlternative') or f.get('raw',f.get('requiredAnswer')));f.setdefault('buttons',r.get('buttons'));f.setdefault('correctAccepted',bool(r.get('passed')));f.setdefault('wrongRejected',bool(r.get('wrongRejected')))
  if r.get('semanticAlternativeAccepted'):accepted_alternatives+=1
  for f in fields:
   retained=bool(f.get('retainedControl'));correct=bool(f.get('correctAccepted'));error=r.get('error') if not correct and not retained and (not parts or f.get('blocked')) else None
   missing=re.search(r'MISSING CONTROL (.*?) for ',error or '')
   used=f.get('used') or []
   required=[control_id(b) for b in used if b.get('label') not in UTILITIES]
   rows.append({'course':r.get('course'),'unit':r.get('unit'),'route':r.get('route'),'family':r.get('family'),'questionId':r.get('questionId'),'selector':r.get('selector'),'seed':r.get('seed'),'representation':r['representation'],'part':f.get('part'),'field':f.get('field'),'runtimeProfile':f.get('profile'),'requiredAnswer':f.get('requiredAnswer'),'requiredRepresentation':f.get('requiredRepresentation'),'answerForms':f.get('answerForms',r.get('requiredForms')),'enteredLatex':f.get('latex'),'serializedSource':f.get('serializedSource',r.get('serializedSource',r.get('source'))),'buttonSet':pad_id(f.get('buttons')),'controlsUsed':[control_id(b) for b in used],'requiredControlsUsed':list(dict.fromkeys(required)),'keypadEnterable':None if retained else correct,'originalCorrectAccepted':None if retained else correct,'wrongRejected':f.get('wrongRejected',r.get('wrongRejected',False)),'retainedControl':retained,'missingControl':missing.group(1) if missing else None,'semanticCorrectAccepted':r.get('semanticAlternativeAccepted'),'meaningfulAlternatives':r.get('meaningfulAlternatives',[]),'error':error,'evidence':r['evidence'],'resumedFrom':r.get('resumedFrom'),'driverRetestEvidence':r.get('driverRetestEvidence'),'evidencePhase':'final' if '-final-d' in r['evidence'] else 'corrected' if '-corrected' in r['evidence'] else 'findings','profileEvidence':f.get('profileEvidence',r.get('profileEvidence'))})
 coverage=[]
 for item in inventory:
  rs=[r for r in cases.values() if r.get('route')==item['route']];runs=route_runs.get(item['route'],[])
  coverage.append({'route':item['route'],'kind':item['kind'],'caseCount':len(rs),'passingCases':sum(bool(r.get('passed')) for r in rs),'failingCases':sum(r.get('passed') is False for r in rs),'routeRuns':runs,'status':'retained specialized/navigation controller' if item['kind']!='mathematical' else 'reviewed' if runs else 'pending'})
 pending=[r['route'] for r in coverage if r['status']=='pending'];unresolved=[r for r in rows if r['error'] and not r['missingControl']]
 summary={'scopeRoutes':len(inventory),'mathematicalRoutes':sum(r['kind']=='mathematical' for r in inventory),'reviewedMathematicalRoutes':sum(r['kind']=='mathematical' and r['status']=='reviewed' for r in coverage),'retainedRoutes':sum(r['kind']!='mathematical' for r in inventory),'questionFormCases':len(cases),'fieldRows':len(rows),'mathematicalFieldRows':sum(not r['retainedControl'] for r in rows),'familyFieldContracts':len({(r['route'],r['family'],r['part'],r['field'],r['runtimeProfile']) for r in rows if not r['retainedControl']}),'keypadCorrectPartTests':correct_parts,'wrongPartTests':wrong_parts,'semanticOnlyAcceptanceWitnesses':accepted_alternatives,'runtimeProfileNames':len({r['runtimeProfile'] for r in rows if not r['retainedControl'] and r['runtimeProfile']}),'runtimeButtonSets':len(button_sets),'pendingRoutes':pending,'unresolvedDriverFailures':len(unresolved),'cancelledAttemptsExcluded':len(cancelled),'missingControlRows':sum(bool(r['missingControl']) for r in rows)}
 result={'state':state,'summary':summary,'controls':controls,'buttonSets':button_sets,'references':references,'coverage':coverage,'featureCoverage':proofs,'cancelledAttempts':cancelled,'fields':rows,'limitations':'Counts are finite question/form witnesses and unique asserted mathematical-part submissions; setup/replay submissions are not counted again. Native choice/drawing interactions are retained. A semantic-only legacy-checker witness is never counted as a keypad-only pass. These tests do not enumerate arbitrary equivalent identities.'}
 (Path(output) if output else ROOT/'docs/audits/KEYPAD-COMPLETENESS-INVENTORY.json').write_text(compact_rows(result,'fields'));print(json.dumps(summary,indent=2));return result
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--state',default='findings-in-progress');parser.add_argument('--extra-manifest');args=parser.parse_args()
 extra=[x for x in os.environ.get('KEYPAD_AUDIT_EXTRA','').split(',') if x]
 if args.extra_manifest:extra+=json.loads(Path(args.extra_manifest).read_text())
 build(SOURCES+extra,args.state)
