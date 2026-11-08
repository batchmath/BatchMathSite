"""Exercise unchanged Unit 6 MathLive grading on both 3D topics and both device sizes."""
import json,os,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(os.environ.get('ENTRY_OUT',str(ROOT/'docs/v13.0.F/evidence/entry')));OUT.mkdir(parents=True,exist_ok=True)
summary=[]
for topic in ['volume-by-cross-sections','solids-of-revolution']:
 for calc in ['non-calculator','calculator']:
  for width,height,mobile in [(1366,768,False),(390,844,True)]:
   name=f'{topic}-{calc}-{width}'
   args=['node','tools/review-lab/unit6/entry.mjs',f'ap-calculus/unit-6-applications-integration/topics/{topic}/{calc}-practice','6',str(width),str(height)]+(['mobile'] if mobile else [])
   result=subprocess.run(args,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
   (OUT/(name+'.json')).write_bytes(result.stdout)
   row={'name':name,'command':args,'exitCode':result.returncode}
   if result.returncode==0:
    d=json.loads(result.stdout);assert not any(d[k] for k in ['failures','errors','scrollBoxes','pageOverflow']),name
    row.update({k:d[k] for k in ['checked','parts','integrals','mathliveFields','blankAtStart','locked']})
   summary.append(row);(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(name,result.returncode,flush=True)
assert len(summary)==8 and all(r['exitCode']==0 for r in summary),summary
print('PASS',json.dumps({k:sum(r[k] for r in summary) for k in ['checked','parts','integrals','mathliveFields']}),flush=True)
