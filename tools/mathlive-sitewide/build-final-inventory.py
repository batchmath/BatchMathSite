"""Rebuild route/field metadata from HTML controllers and retained QA evidence.
Does not certify a route from a script tag: completion also needs its cited
checker/browser evidence and the uninstrumented route sweep.
"""
from pathlib import Path
import csv,json,re,hashlib,subprocess,collections
root=Path(__file__).resolve().parents[2]
docs=root/'docs/mathlive-migration';qa=root/'tools/mathlive-sitewide/artifacts'
rows=list(csv.DictReader((docs/'ROUTES.csv').open()));known={r['Route'] for r in rows}
def read(name):return json.loads((qa/(name+'.json')).read_text())
def paths_manifest(name):return json.loads((root/('tools/mathlive-sitewide/'+name+'.json')).read_text())
node={}
for name in ['unit2-node','applications-node','unit1-node','im1-batch5-node','im1-batch6-node','reviews-static-node','reviews-dynamic-node','im1-review-unit3-node']:
 for r in read(name):node.setdefault(r['route'],[]).append({'artifact':name+'.json','data':r})
for unit,path in [('Unit1','ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html'),('Unit2','ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html')]:node[path]=node.pop(unit)
for name in ['im1-review-unit2-node','continuity-node']:
 r=read(name);node.setdefault(r['route'],[]).append({'artifact':name+'.json','data':r})
for r in read('prep-node'):node.setdefault('calculus-prep/'+r['slug']+'/index.html',[]).append({'artifact':'prep-node.json','data':r})
sm=paths_manifest('staged-routes');data=read('staged-node');keys={4:{'usub':'u-substitution-integrals','log':'integrals-resulting-in-natural-log-and-inverse-trigonometric-functions','mvt':'mean-value-theorem-for-integrals','sigma':'introduction-to-sigma-notation','rect':'rectangular-approximations','trap':'trapezoidal-approximations','geometry':'integrals-using-geometry'},5:{'basic':'basic-first-order-differential-equations','growth':'exponential-growth-and-decay-interest-newton-s-law-of-cooling','motion':'motion-problems','rate':'rate-problems','slope':'slope-fields'}}
for r in sm:
 d=next(x for x in data if x['unit']==r['unit'] and keys[x['unit']][x['key']]==r['slug']);node.setdefault(r['path'],[]).append({'artifact':'staged-node.json','scope':'shared generator; calculator/non-calculator axes retained','data':d})
im1={r['route']:r for r in read('field-contracts-im1')};u2={r['path']:r for r in paths_manifest('unit2-routes')}
# Routes named practice are insufficient: scan every course HTML/controller.
actual=set()
marker=re.compile(r'<input\b[^>]*(?:type="(?:text|number)"|id="(?:answer|[^" ]*answer[^" ]*)")|(?:ap-topic-practice|im1-unit[23]-practice|topic-derivative-at-point-practice|calc-prep-(?:unit-circle|angle-skills|trig-equations|factoring|synthetic|algebra))\.js')
for prefix in ['ap-calculus','im1','calculus-prep']:
 for p in (root/prefix).rglob('*.html'):
  name=str(p.relative_to(root))
  if '/unit-6' in name:continue
  s=p.read_text()
  if p.parent.name.endswith('practice') or marker.search(s):actual.add(name)
# Top-level specialized Prep engines share the course's public registry.
actual.update('calculus-prep/'+s+'/index.html' for s in ['domains','function-graphs','log-rules','rational-functions','trig-identities'])
assert actual==known,{'missingFromLedger':sorted(actual-known),'staleLedger':sorted(known-actual)}
result=[]
for row in rows:
 route=row['Route'];html=(root/route).read_text();modules=re.findall(r'<script[^>]+src="([^"]*mathlive/[^"?]+)',html);mod=modules[0].rsplit('/',1)[-1] if modules else None
 nav=not mod and ('navigation' in row['Status'] or 'redirect' in row['Status']);kind='mathematical' if mod else 'navigation' if nav else 'specialized'
 selectors={m[0]:re.findall(r'<option\b[^>]*value="([^"]*)"',m[1]) for m in re.findall(r'<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)</select>',html)}
 scripts=re.findall(r'<script[^>]+src="([^"]+)"',html);controllers=[s for s in scripts if '/assets/' in s and any(t in s for t in ['generators','practice.js','derivative','calc-prep-','unit1-','unit5-'])]
 evidence=node.get(route,[]);families={};profiles=[];fields='';retained='Original choices, hints and displayed graphs where generated'
 for record in evidence:
  d=record['data'];families[record['artifact']]=d.get('families',d.get('variants',d.get('signatures',[])))
  profiles+=list(d.get('profiles',d.get('modes',{}))) if isinstance(d.get('profiles',d.get('modes',{})),dict) else []
 if mod=='unit2.mjs':fields='symbolic derivative' if u2[route]['contract'] in ['expression','nested'] else 'exact derivative value';profiles=['derivative-chain' if u2[route]['contract']=='nested' else u2[route]['profile']];retained='Existing topic/difficulty selectors and read-only givens'
 elif mod in ['power-rule.mjs','chain-rule.mjs','rule-derivative.mjs']:fields='#answer: symbolic derivative; original simplified-form gate';profiles=['derivative-power' if 'power-rule.mjs'==mod else 'derivative-chain' if mod=='chain-rule.mjs' else 'derivative-product'];evidence.append({'artifact':'original pilot / Batch 1 checker and browser suites','docs':'docs/mathlive-batch1/CHECKPOINT.md'})
 elif mod=='unit1.mjs':fields='exact scalar / discontinuity location / continuity parameter parts; current route-specific contract';tag=re.search(r'data-mathlive-unit1="([^"]+)"',html);k=tag[1];profiles=['ml-unit1-rational-value'] if k in ['course','location'] else ['ml-unit1-trig-value'] if k=='advanced' else re.findall(r'data-bm-calc-keypad="([^"]+)"',html)
 elif mod=='review-static.mjs':fields='scalar, k/a/b multipart parameters and discontinuity-location stages' if '/unit-1-' in route else '#answer: symbolic derivatives, h difference quotients and inverse numerical values';profiles=['migration-limit-finite','migration-limit-signed','ml-unit1-rational-value'] if '/unit-1-' in route else ['ml-review-difference','derivative-power','derivative-product','migration-derivative-trig','migration-derivative-exp','migration-derivative-implicit','migration-derivative-log','migration-derivative-inverse','migration-derivative-rational','migration-derivative-comprehensive-value'];retained='Conceptual/graph/table/result classifications; custom-part choice progression'
 elif mod in ['applications.mjs','reviews-dynamic.mjs','staged-units.mjs']:
  fields='; '.join(dict.fromkeys(profiles)) or 'per-part exact/rounded mathematical fields'
  if '/unit-3-' in route:retained='Theorem/applicability/qualitative choices and original graph displays; calculator policy separate'
  elif '/unit-4-' in route:retained='Qualitative estimate/applicability selections and original diagrams'
  else:retained='Qualitative selections, graph matching and slope/solution drawing; optional typed entries separately migrated'
  if 'slope-fields' in route or '/unit-5-' in route and 'comprehensive-review' in route:
   fields+='; optional typed slope fractions/Undefined and decimal curve y-values';profiles+=['ml-slope-entry','ml-curve-point']
 elif mod in ['basic-integrals.mjs','newton.mjs','ftc-rules.mjs','separable.mjs']:
  fields,profiles={'basic-integrals.mjs':('antiderivative in x with student-entered C; exact definite scalar',['unit4-basic-indef','unit4-basic-def']), 'newton.mjs':('editable sum/limit construction in k/n; exact value part',['unit4-newton','unit4-newton-value']), 'ftc-rules.mjs':('exact integral-rule scalar / symbolic FTC function',['unit4-exact' if 'integral-rules-practice/' in route else 'unit4-ftc']), 'separable.mjs':('IVP functions in x/t/theta; validity interval',['unit5-sep-x','unit5-sep-t','unit5-sep-theta','unit5-sep-interval'])}[mod];evidence.append({'artifact':'tools/mathlive-advanced-pilot/artifacts / original pilot suites','docs':'docs/mathlive-batch1/CHECKPOINT.md'})
 elif mod=='im1.mjs':
  if '/unit-1-' in route:
   names=re.findall(r'data-bm-keypad="([^"]+)"',html);profiles=['ml-im1-'+x for x in dict.fromkeys(names)] or ['ml-im1-(current literal number category)'];fields='#answer: literal numeric/decimal/fraction; original reduction and decimal rules'
  else:fields='simplified integer polynomial; literal equation solution; integer-endpoint interval (as generated)';profiles=['ml-im1-polynomial-(actual variables)','ml-im1-equation-value','ml-im1-interval'];retained='Graph/inequality/conceptual choices; multipart choice-only continuation'
 elif mod=='im1-unit3.mjs':
  defs=im1[route]['fields'];fields='; '.join(x['id']+':'+x['checker'] for x in defs);profiles=[x['profile'] for x in defs];retained='Yes/No/arithmetic decisions, collinearity and graph displays; numerical follow-up remains mathematical'
 elif mod=='prep.mjs':
  slug=route.split('/')[1];fields,profiles={'unit-circle-values':('answerRaw: single exact trig value / Undefined',['ml-prep-value']),'trig-angle-skills':('answerRaw: degree/radian scalar or unit-circle coordinate pair',['ml-prep-degrees','ml-prep-radians','ml-prep-coordinates']),'trig-equations':('answerRaw: exact solution list',['ml-prep-solutions']),'special-factoring':('factorAnswer: required factors; pascalAnswer: literal coefficient list',['ml-prep-factor','ml-prep-coefficients']),'synthetic-division':('rrtAnswer: candidates; quotient: polynomial; remainder: literal number',['ml-prep-rrt','ml-prep-quotient','ml-prep-remainder']),'calculus-algebra':('freeAnswer: form-sensitive polynomial expression',['ml-prep-algebra'])}[slug];retained='Original multiple choice branches, difficulty/angle/mode selections'
 if mod in ['power-rule.mjs','chain-rule.mjs','rule-derivative.mjs','basic-integrals.mjs','newton.mjs','ftc-rules.mjs','separable.mjs']:
  load=lambda p:json.loads((root/p).read_text())
  if mod=='power-rule.mjs':families['actual generator modes']=['first / higher derivative','mixed','polynomial','negative powers','fractional powers','irrational constants (first derivative)']
  elif mod=='chain-rule.mjs':families['tools/mathlive-derivatives-pilot/artifacts/mathematical-results.json']=load('tools/mathlive-derivatives-pilot/artifacts/mathematical-results.json')['families']
  elif mod=='rule-derivative.mjs':families['tools/mathlive-batch1/artifacts/math.json']=load('tools/mathlive-batch1/artifacts/math.json')['product' if '/the-product-rule/' in route else 'quotient']['families']
  elif mod=='basic-integrals.mjs':families['tools/mathlive-advanced-pilot/artifacts/basic-math.json']=[x['family'] for x in load('tools/mathlive-advanced-pilot/artifacts/basic-math.json')['families']]
  elif mod=='newton.mjs':
   d=load('tools/mathlive-advanced-pilot/artifacts/newton-math.json');families['tools/mathlive-advanced-pilot/artifacts/newton-math.json']={'families':d['families'],'nonpolynomialSubtypes':d['nonpolynomialSubtypes']}
  elif mod=='ftc-rules.mjs':families['tools/mathlive-advanced-pilot/artifacts/ftc-math.json']=next(x['families'] for x in load('tools/mathlive-advanced-pilot/artifacts/ftc-math.json') if x['engine']==('rules' if 'integral-rules-practice/' in route else 'ftc'))
  else:families['tools/mathlive-advanced-pilot/artifacts/separable-math.json']=load('tools/mathlive-advanced-pilot/artifacts/separable-math.json')['families']
 if kind=='specialized':families['source contract']='Original choice/classification/feature generator; no typed mathematical branch (source and existing batch evidence)'
 if kind=='navigation':families['source contract']='No question generator or typed mathematical control'
 if kind!='mathematical':fields='None';profiles=[];retained='Existing navigation/redirect and topic links' if nav else 'Existing specialized choice/classification/feature selection controls'
 assert kind!='mathematical' or evidence,('No checker evidence',route)
 result.append({'route':route,'kind':kind,'course':route.split('/')[0],'unit':route.split('/')[1] if not route.startswith('calculus-prep/') else 'topic collection','module':mod,'controllers':controllers,'selectors':selectors,'families':families,'fields':fields,'profiles':list(dict.fromkeys(profiles)),'retained':retained,'legacy':'?editor=legacy retained; browser/group evidence + final three-mode sweep' if mod else 'not applicable (specialized original UI)','evidence':evidence,'limits':'Bounded generator/family/accepted-alternative samples; no physical-device or assistive-technology certification','status':row['Status']})
result=json.loads(subprocess.check_output(['node','tools/mathlive-sitewide/resolve-inventory-profiles.mjs'],cwd=root,input=json.dumps(result).encode()))
assert collections.Counter(r['kind'] for r in result)=={'mathematical':118,'navigation':5,'specialized':15}
(qa/'final-field-inventory.json').write_text(json.dumps(result,indent=2)+'\n')
columns=['Route','Kind','Course','Unit','Controller / bridge','Families and modes','Mathematical fields','MathLive fields','Specialized controls retained','Keypad profiles','Legacy fallback','Test evidence','Limitations','Status']
with (docs/'ROUTES.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,columns,lineterminator='\n');w.writeheader()
 for r in result:w.writerow(dict(zip(columns,[r['route'],r['kind'],r['course'],r['unit'],r['module'] or 'original specialized UI',json.dumps(r['selectors'],separators=(',',':'))+'; complete family enumeration in final-field-inventory.json',r['fields'],r['fields'] if r['module'] else 'None',r['retained'],'; '.join(r['profiles']),r['legacy'],'; '.join(x.get('artifact','') for x in r['evidence'])+'; route-sweep.json',r['limits'],r['status']])))
print(len(result),'routes:',dict(collections.Counter(r['kind'] for r in result)))
