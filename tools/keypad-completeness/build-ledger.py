"""Assemble explicit evidence references; never infer missing routes are tested."""
import json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
E=ROOT/'docs/audits/evidence'
SOURCES=['keypad-completeness-unit2.json','keypad-completeness-im1.json','keypad-completeness-im1-contracts-verified.json','keypad-completeness-im1-equation-verified.json','keypad-completeness-im1-unit3-verified.json','keypad-completeness-prep-verified.json','keypad-completeness-prep-rrt-verified.json','keypad-completeness-slope.json']
def build(sources=SOURCES,state='in-progress'):
 inventory=json.loads((ROOT/'tools/mathlive-sitewide/artifacts/final-field-inventory.json').read_text());cases={};references=[]
 for name in sources:
  p=E/name
  if not p.exists():continue
  data=json.loads(p.read_text());references.append({'file':'docs/audits/evidence/'+name,'pageErrors':data.get('errors',[])})
  for r in data['results']:
   if r.get('coverage'):continue
   key=(r.get('route'),r.get('questionId'),r.get('family'))
   cases[key]={**r,'evidence':'docs/audits/evidence/'+name}
 rows=[]
 for r in cases.values():
  fields=[]
  for part in r.get('parts',[]):
   for i,f in enumerate(part.get('fields',[])):
    fields.append({**f,'part':part.get('index'),'requiredAnswer':(part.get('requiredAnswers') or part.get('answers') or [None]*(i+1))[i], 'wrongRejected':part.get('wrongRejected',False),'correctAccepted':part.get('correctAccepted',False)})
  fields+=r.get('fields',[])
  if r.get('latex') is not None:fields.append({k:r.get(k) for k in ['field','raw','requiredAnswer','latex','profile','buttons','used','wrongRejected']})
  if not fields:fields=[{'retainedControl':bool(r.get('retainedChoice') or r.get('optionalTypedAlternative')),'field':'retained control or unresolved field'}]
  for f in fields:
   rows.append({'course':r.get('course'),'unit':r.get('unit'),'route':r.get('route'),'family':r.get('family'),'questionId':r.get('questionId'),'selector':r.get('selector'),'seed':r.get('seed'),'part':f.get('part'),'field':f.get('field'),'runtimeProfile':f.get('profile'),'requiredAnswer':f.get('requiredAnswer',f.get('raw')),'enteredLatex':f.get('latex'),'displayedControls':f.get('buttons'),'controlsUsed':f.get('used'),'keypadCasePassed':r.get('passed',False),'wrongRejected':f.get('wrongRejected',r.get('wrongRejected',False)),'meaningfulAlternatives':r.get('meaningfulAlternatives',[]),'error':r.get('error'),'evidence':r['evidence']})
 controls={};button_sets={}
 def control_id(control):
  key='k'+hashlib.sha256(json.dumps(control,sort_keys=True).encode()).hexdigest()[:10];controls[key]=control;return key
 for row in rows:
  buttons=row.pop('displayedControls',None)
  if buttons:
   keys=[control_id(b) for b in buttons];key='p'+hashlib.sha256(json.dumps(keys).encode()).hexdigest()[:10];button_sets[key]=keys;row['buttonSet']=key
  used=row.get('controlsUsed')
  if used:row['controlsUsed']=[control_id(b) for b in used]
 coverage=[]
 for item in inventory:
  rs=[r for r in cases.values() if r.get('route')==item['route']]
  coverage.append({'route':item['route'],'kind':item['kind'],'caseCount':len(rs),'passingCases':sum(r.get('passed',False) for r in rs),'failingCases':sum(r.get('passed') is False for r in rs),'status':'retained specialized/navigation controller' if item['kind']!='mathematical' else 'partial findings available' if rs else 'pending in this ledger'})
 result={'state':state,'scopeRoutes':len(inventory),'mathematicalRoutes':sum(r['kind']=='mathematical' for r in inventory),'caseCount':len(cases),'fieldRows':len(rows),'controls':controls,'buttonSets':button_sets,'references':references,'coverage':coverage,'fields':rows,'limitations':'This recovery ledger includes only the explicitly listed completed runs. Pending routes, initial harness failures and ongoing tests are not claimed complete. B/C/D remain unfinished. Finite seeded examples do not enumerate arbitrary equivalent expressions.'}
 meta={k:v for k,v in result.items() if k!='fields'};encoded=json.dumps(meta,indent=2)[:-2]+',\n  \"fields\":[\n'+',\n'.join(json.dumps(row,separators=(',',':')) for row in rows)+'\n  ]\n}\n';assert json.loads(encoded)==result;(ROOT/'docs/audits/KEYPAD-COMPLETENESS-INVENTORY.json').write_text(encoded);print(result['caseCount'],'cases',result['fieldRows'],'field rows')
if __name__=='__main__':build()
