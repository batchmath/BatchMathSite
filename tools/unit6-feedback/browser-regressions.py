"""Retain legacy, delayed-graph, display and phone-piecewise browser regressions."""
import concurrent.futures
import json
import os
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/feedback-audit/evidence/browser-regressions'
OUT.mkdir(parents=True,exist_ok=True)
topic='ap-calculus/unit-6-applications-integration/topics/'
jobs=[]
legacy=[('area-below-and-between-curves/non-calculator-practice','choose'),
        ('volume-by-cross-sections/non-calculator-practice',''),
        ('solids-of-revolution/non-calculator-practice','shells'),
        ('comprehensive-review/non-calculator-practice','frq_region'),
        ('integrals-on-piecewise-defined-functions/practice',''),
        ('comprehensive-review/non-calculator-practice','frq_graph')]
for i,(page,mode) in enumerate(legacy):
    for width,height,mobile in [(1366,768,False),(390,844,True)]:
        jobs.append((f'legacy-{i}-{width}',['node','tools/review-lab/unit6/entry.mjs',topic+page,'5',str(width),str(height)]+(['mobile'] if mobile else []),{'BM_EDITOR':'legacy','BM_MODE':mode}))
for mode in ['perp_x','perp_y']:
    for width,height,mobile in [(1366,768,False),(390,844,True)]:
        jobs.append((f'graph-after-{mode}-{width}',['node','tools/review-lab/unit6/entry.mjs',topic+'volume-by-cross-sections/calculator-practice','6',str(width),str(height)]+(['mobile'] if mobile else []),{'BM_GRAPH_AFTER':'1','BM_MODE':mode}))
env={**os.environ}
def run(job):
    name,args,options=job
    result=subprocess.run(args,cwd=ROOT,env={**env,**options},stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    (OUT/(name+'.json')).write_bytes(result.stdout)
    return {'name':name,'exitCode':result.returncode,'command':args,'options':options}
summary=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    for row in pool.map(run,jobs):
        summary.append(row);(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(row['name'],row['exitCode'],flush=True)
# Render many split explanations at once only after the entry jobs finish.
for job in [('piecewise-fit',['node','tools/review-lab/unit6/piecewise-fit.mjs','30'],{}),
            ('render-check',['node','tools/review-lab/unit6/render-check.mjs'],{})]:
    row=run(job);summary.append(row);(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(row['name'],row['exitCode'],flush=True)
raise SystemExit(any(r['exitCode'] for r in summary))
