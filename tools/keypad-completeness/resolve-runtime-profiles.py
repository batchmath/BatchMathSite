"""Name earlier observations by matching their actual visible button sequences."""
import json
from pathlib import Path
E=Path(__file__).resolve().parents[2]/'docs/audits/evidence'
def fingerprint(buttons):return json.dumps([[b['label'],b.get('aria')] for b in buttons],ensure_ascii=False)
known={}
for source in ['keypad-runtime-profile-observations.json','keypad-runtime-profile-observations-unit1.json']:
 data=json.loads((E/source).read_text());assert not data['errors'],data['errors']
 for o in data['observations']:
  key=(o['route'],fingerprint(o['buttons']));known.setdefault(key,set()).add((o['profile'],source))
for name in ['keypad-completeness-unit2.json','keypad-completeness-unit2-indexed-roots-before.json','keypad-completeness-unit1.json']:
 p=E/name;obj=json.loads(p.read_text());resolved=missing=0
 for r in obj['results']:
  if r.get('coverage'):continue
  for field in [r]+r.get('fields',[]):
   if field.get('profile') or not field.get('buttons'):continue
   modes=known.get((r['route'],fingerprint(field['buttons'])),set())
   if len(modes)==1:
    mode,source=next(iter(modes));field['profile']=mode;field['profileEvidence']={'file':'docs/audits/evidence/'+source,'method':'Exact route and actual visible-button sequence match; runtime mode stamped inside buildPad.'};resolved+=1
   else:missing+=1
 results=obj.pop('results');p.write_text('{"results":[\n'+',\n'.join(json.dumps(r,separators=(',',':')) for r in results)+'\n]'+''.join(','+json.dumps(k)+':'+json.dumps(v,separators=(',',':')) for k,v in obj.items())+'}\n');print(name,resolved,'resolved',missing,'unresolved')
