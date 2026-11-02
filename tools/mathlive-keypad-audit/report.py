"""Read production sources; write audit documents only. Run from repository root."""
import csv,json,pathlib,re,subprocess
ROOT=pathlib.Path('.');OUT=ROOT/'docs/mathlive-keypad-audit';OUT.mkdir(parents=True,exist_ok=True)
d=json.loads(subprocess.check_output(['node','tools/mathlive-keypad-audit/probe.mjs'],text=True))
BASE='d01896853c8af0950089714fdc2a7a8eccba23d0'
def ref(path,needle=''):
 s=pathlib.Path(path).read_text();i=s.find(needle) if needle else 0;return f'{path}:{s[:max(0,i)].count(chr(10))+1}'
def buttons(p):
 v=[str(i) for i in range(10)]+['minus']
 for flag,names in {'decimal':['decimal point'],'fraction':['stacked fraction'],'radical':['square root'],'cubeRoot':['cube root'],'nthRoot':['nth root'],'exponent':['exponent'],'logarithm':['ln'],'arithmetic':['plus','multiply'],'parentheses':['left parenthesis','right parenthesis'],'equality':['equals'],'list':['comma'],'pair':['comma'],'dne':['DNE'],'dna':['Does not apply'],'none':['None'],'infinity':['infinity','negative infinity'],'riemann':['limit template','summation template'],'sequence':['a₁','aₙ','aₙ₋₁'],'recursive':['a₁','aₙ','aₙ₋₁'],'equation':['f(x)'],'classification':['Underestimate','Overestimate']}.items():
  if p.get(flag):v+=names
 if p.get('plus'):v+=['plus']
 if p.get('interval'):
  if p.get('brackets') is not False:v+=['left bracket','right bracket']
  if p.get('union') is not False:v+=['union']
 v+=p.get('variables',[])+[{'pi':'π'}.get(x,x) for x in p.get('constants',[])]+[x[0] for x in p.get('functions',[])]
 return list(dict.fromkeys(v))
profiles=d['profiles'];rows=[];routes=[];excluded=[]
records={(r['course'],r['slug']):r for r in d['records']}
cols=['Course','Unit','Engine','Answer field or question family','Current keypad profile','Current buttons','Required buttons','Confirmed missing buttons','Confirmed unnecessary buttons','Conditional buttons','Recommended future MathLive profile','Translation/adapter requirements','Verification status','Source references']
dispatch={'numeric':'unit3-number','exact-expression':'unit3-exact','line-equation':'unit3-equation','interval-answer':'unit3-interval','value-list':'unit3-list','ordered-pair':'unit3-pair','coordinate-fields':'unit3-coordinate','extremum-fields':'unit3-coordinate','approximation-fields':'unit3-approximation','approx-classification':'unit3-approximation','rounded-line-fields':'unit3-rounded-line','formula':'unit3-formula'}
def infer_required(ex):
 v=['digits 0–9','minus'];mapping=[(r'\\(?:d?frac)|(?<!\\)/','fraction'),(r'\\sqrt','square root or indexed root'),(r'\^','exponent'),(r'\\pi','π'),(r'\\infty','infinity'),(r'\\cup','union'),(r'\\sum','summation template'),(r'\\lim','limit template'),(r'\+C','C')]
 for pat,key in mapping:
  if re.search(pat,ex):v.append(key)
 for f in ['sin','cos','tan','sec','csc','cot','ln','log','arcsin','arccos','arctan']:
  if re.search(r'\\'+f+r'(?![a-z])',ex):v.append(f)
 if ',' in ex:v.append('comma')
 return '; '.join(v)+'; lower bound from observed answers only; accepted-alternative closure unresolved'
for course,folder in [('AP Calculus AB','ap-calculus'),('Integrated Math 1','im1'),('Calculus Prep','calculus-prep')]:
 for p in sorted(pathlib.Path(folder).rglob('*.html')):
  s=p.read_text();path=str(p)
  if 'unit-6' in path:continue
  if re.search(r'http-equiv=["\x27]refresh',s,re.I):excluded.append(path);continue
  practice=('practice' in p.parent.name or ('calc-prep-' in s and course=='Calculus Prep' and p.parent.name!='calculus-prep'))
  if not practice:continue
  cfg=re.search(r'(?:BM_TOPIC_PRACTICE|BM_UNIT[23]_PRACTICE)\s*=\s*(\{[^;]+\})',s)
  slugm=re.search(r'["\x27]?slug["\x27]?\s*:\s*["\x27]([^"\x27]+)',cfg[1]) if cfg else None
  slug=slugm[1] if slugm else (p.parent.parent.name if p.parent.name=='practice' else p.parent.name)
  title=re.search(r'<title>(.*?)</title>',s,re.S);title=title[1].split('|')[0].strip() if title else slug
  unit=next((x for x in p.parts if x.startswith('unit-')),'Topic collection')
  reg='AP' if folder=='ap-calculus' else 'IM1-U2' if unit.startswith('unit-2') else 'IM1-U3' if unit.startswith('unit-3') else ''
  r=records.get((reg,slug));schemas=r['schemas'] if r and r['schemas'] else [{'field':'inline/renderer fields — enumeration unfinished','profile':'local/inline','example':''}]
  # Unit 1 inline routing overrides older generic AP generator registrations.
  if folder=='ap-calculus' and unit.startswith('unit-1'):schemas=[{'field':'page-native fields; see route ledger','profile':'page-local/conditional','example':''}]
  if course=='Calculus Prep':
   kinds={'calculus-algebra':['free expression (slash gate)','choice'],'special-factoring':['factored expression','Pascal coefficient list'],'synthetic-division':['polynomial quotient','numeric remainder','rational-root candidate list','choice'],'rational-functions':['hole / vertical asymptote / end asymptote / intercept selectors'],'domains':['choice'],'function-graphs':['choice'],'log-rules':['choice'],'trig-identities':['choice'],'unit-circle-values':['exact trig value / Undefined'],'trig-equations':['solution list'],'trig-angle-skills':['exact degree/radian answer','choice']}
   schemas=[{'field':x,'profile':'BMExactEditor' if slug in ['unit-circle-values','trig-equations','trig-angle-skills'] and x!='choice' else 'local input / selection','example':''} for x in kinds.get(slug,['unfinished'])]
  attr=re.findall(r'data-bm-(?:calc-)?keypad=["\x27]([^"\x27]+)',s)
  routes.append((course,unit,title,path,slug,','.join(attr),str('calculus-keypad.js' in s),str('BMUnit1UI.render' in s)))
  for schema in schemas:
   kind=schema.get('kind',schema['field']);profile=schema['profile'];explicit=profile in profiles
   if profile=='dispatcher/local':profile=dispatch.get(kind,profile)
   if attr and profile in ['local/inline','page-local/conditional']:
    profile='HTML '+','.join(attr)+'; contextual remap applies'
    if attr==['limits'] and slug in ['limits-of-continuous-functions','basic-techniques-indeterminate-limits']:profile='limits-finite'
   current='; '.join(buttons(profiles[profile])) if profile in profiles else 'Unresolved: inspect page/local renderer; do not infer from displayed mathematics'
   if profile=='unit4-newton' and 'mathlive/newton.mjs' in s:current+='; infinity; negative infinity; bare limit operator; subscript; approach arrow'
   if profile=='unit5-sep-interval' and 'mathlive/separable.mjs' in s:current+='; left bracket; right bracket; union (page-specific override)'
   if schema['profile']=='BMExactEditor':current='digits 0–9; π; square root; fraction; minus; parentheses; Undefined; decimal point; comma; degrees'
   choice=kind in ['choice','mc','arithmetic-identification'] or schema['field']=='choice' or 'selectors' in schema['field']
   required='No mathematical keypad: retain selection control' if choice else infer_required(schema.get('example',''))
   status='Strongly supported: observed field/profile; accepted-alternative completeness unresolved' if explicit else 'Unresolved: field route, profile or exhaustive reachable kinds still need tracing'
   if choice:current='selection buttons / selectors';status='Strongly supported: selection route; no expression keypad required'
   missing='None confirmed for this row (not a completeness claim)';unused='None proved; do not remove from sample absence'
   refs=[ref(path)]
   if profile in profiles:refs.append(ref('assets/calculus-keypad.js','const contextualUnit3='))
   if r:refs.append(ref('assets/im1-unit3-generators.js' if reg=='IM1-U3' else 'assets/im1-unit2-generators.js' if reg=='IM1-U2' else 'assets/ap-topic-generators.js',slug))
   if slug=='limits-of-continuous-functions':missing='common logarithm log(base 10): accepted log(100)=2; no dedicated log key in limits-finite';required='digits 0–9; signs; fraction; arithmetic; parentheses; powers; square/cube/nth root; π; e; ln; common log';status='Verified missing common-log representation control; remaining alternatives unresolved';refs += [ref('assets/unit1-practice-ui.js',"name[0]==='log'"),ref('assets/unit1-core-expansions.js',"family==='constant'")]
   if slug=='common-difference-next-terms' and schema['field']=='fields: number':current='digits 0–9; minus; decimal point; Backspace; Clear; Check';profile='local numberEntries';missing='division/fraction control on local numberEntries fallback';status='Verified accepted fractional alternative and actual numeric-multi fallback route';refs += [ref('assets/im1-unit3-practice.js','const numberEntries='),ref('assets/im1-unit3-practice.js','function normalizeNumber'),ref('assets/im1-unit3-practice.js','if(fields.some(')]
   if slug=='unit-circle-values':unused='comma';required='digits 0–9; signs; fraction; square root; parentheses; conditional Undefined; other accepted numeric expressions remain possible';status='Verified comma rejection in both finite/Undefined branches; full profile closure unresolved';refs += [ref('assets/calc-prep-common.js','BM.safeExactEval='),ref('assets/calc-prep-unit-circle.js','function check()'),ref('assets/calc-prep-exact-editor.js','const defs=')]
   adapter='Preserve checker/form gates; existing bridge insertion does not establish grading compatibility'
   if profile in ['unit4-newton','unit4-newton-value']:adapter='Existing Newton notation / scalar adapters; infinity styling is cosmetic, not missing functionality'
   if profile.startswith('unit5-'):adapter='Reuse advanced expression/interval adapter by answer kind; numeric/list/general-solution contracts differ'
   if choice:adapter='Retain specialized control'
   row=[course,unit,title,schema['field']+' '+schema.get('kind',''),profile,current,required,missing,unused,'Select by active part, exact/rounded policy and reachable family; do not infer from unit number',('retain selection' if choice else profile+' — candidate; pending unresolved requirements'),adapter,status,'; '.join(dict.fromkeys(refs))];rows.append(row)
with (OUT/'MATHLIVE-KEYPAD-MATRIX.csv').open('w',newline='') as f:w=csv.writer(f);w.writerow(cols);w.writerows(rows)
# Keep evidence sufficient to reproduce counts and failures, without adding production hooks.
evidence=['# Keypad evidence and coverage boundaries',f'Reference: `{BASE}`. Deterministic sampler uses 16 seeds per registry engine. No production source is changed.','## Executed results',f"{len(d['records'])} registry entries examined; {sum(r['generated'] for r in d['records'])} generated instances; {len(d['errors'])} recorded generator failures; {len(d['probes'])} focused probe calls. These are not exhaustive family enumerations and not migration regression runs.",'## Checker probes','| Checker | Input | Result |','| --- | --- | --- |']
for q in d['probes']:evidence.append('| '+q['checker']+' | `'+q['raw']+'` | `'+json.dumps(q['result'],ensure_ascii=False).replace('|','\\|')+'` |')
evidence+=['## Deterministic reachable examples','| Registry / engine | Samples | Observed families | Representative question ID and answer |','| --- | ---: | --- | --- |']
for r in d['records']:evidence.append('| '+r['course']+' / '+r['slug']+' | '+str(r['generated'])+' | '+', '.join(r['families'])+' | '+json.dumps(r['examples'][:1],ensure_ascii=False).replace('|','\\|')+' |')
evidence+=['## Page-route ledger','This includes alternate drills and nonstandard pages; listed routes are not automatically distinct mathematical factories. Unit 1 HTML `limits` routes must pass through `contextualMode()` before selecting a final pad. A false `BMUnit1UI.render` flag does not mean that no Unit 1 parsing helper is used.','| Course/unit/page | Source | Slug | Static keypad attribute | Loads calculus keypad | Calls Unit 1 renderer |','| --- | --- | --- | --- | --- | --- |']
for c,u,t,p,slug,a,b,v in routes:evidence.append('| '+c+'/'+u+'/'+t+' | `'+p+'` | '+slug+' | '+a+' | '+b+' | '+v+' |')
evidence+=['## Excluded redirects',*[f'- `{p}`' for p in excluded],'Unit 6 is deliberately excluded. The route ledger may include navigation/landing false positives: those rows remain unresolved and must not be counted as verified engines. Registry entries without a current reachable page are evidence of code, not proof of a live student route.','## Reproduce','Run `python3 tools/mathlive-keypad-audit/report.py` from a Git checkout at this audit snapshot. It executes only focused VM sampling and writes this audit directory. The page scanner uses static HTML/config inspection, not a browser. No claim is made that every select-option family or calculator variant was exercised.']
(OUT/'MATHLIVE-KEYPAD-EVIDENCE.md').write_text('\n\n'.join(evidence)+'\n')
summary={'reference':BASE,'page_routes':len(routes),'matrix_rows':len(rows),'registry_entries':len(d['records']),'generated_instances':sum(r['generated'] for r in d['records']),'probe_calls':len(d['probes']),'fully_verified_profiles':0,'confirmed_missing_engine_control_pairs':2,'confirmed_unnecessary_engine_control_pairs':1};print(json.dumps(summary))
