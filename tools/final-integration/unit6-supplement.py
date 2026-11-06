"""Recheck the retained legacy editor, delayed graphs, phone explanations and the original 100-sample split audit."""
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/final-integration/evidence/unit6/supplement'
OUT.mkdir(parents=True,exist_ok=True)
env={**os.environ,'REVIEW_HOME':'/workspace/work/v12.9.E/review',
     'REVIEW_OUT':str(OUT)}
topic='ap-calculus/unit-6-applications-integration/topics/'
jobs=[('split-100',['node','tools/review-lab/unit6/qa/split-audit.mjs','100'],{})]
legacy=[('area-below-and-between-curves/non-calculator-practice','choose'),
        ('volume-by-cross-sections/non-calculator-practice',''),
        ('solids-of-revolution/non-calculator-practice','shells'),
        ('comprehensive-review/non-calculator-practice','frq_region'),
        ('integrals-on-piecewise-defined-functions/practice','')]
for i,(page,mode) in enumerate(legacy):
    for width,height,mobile in [(1366,768,False),(390,844,True)]:
        jobs.append((f'legacy-{i}-{width}', ['node','tools/review-lab/unit6/entry.mjs',topic+page,'5',str(width),str(height)]+(['mobile'] if mobile else []), {'BM_EDITOR':'legacy','BM_MODE':mode}))
for mode in ['perp_x','perp_y']:
    for width,height,mobile in [(1366,768,False),(390,844,True)]:
        jobs.append((f'graph-after-{mode}-{width}', ['node','tools/review-lab/unit6/entry.mjs',topic+'volume-by-cross-sections/calculator-practice','6',str(width),str(height)]+(['mobile'] if mobile else []), {'BM_GRAPH_AFTER':'1','BM_MODE':mode}))
jobs.append(('piecewise-fit',['node','tools/review-lab/unit6/piecewise-fit.mjs','30'],{}))
summary=[]
for name,args,options in jobs:
    result=subprocess.run(args,cwd=ROOT,env={**env,**options},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=900)
    (OUT/(name+'.json')).write_bytes(result.stdout)
    summary.append({'name':name,'exitCode':result.returncode,'arguments':args,'options':options})
    (OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(name,result.returncode,flush=True)
sys.exit(any(r['exitCode'] for r in summary))
