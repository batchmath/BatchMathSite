"""Run the retained mathematical/explanation regressions without short-circuiting."""
import concurrent.futures
import json
import os
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/feedback-audit/evidence/regressions'
OUT.mkdir(parents=True,exist_ok=True)
jobs=[('main',['node','tools/unit6-qa.mjs']),
      ('adversarial',['node','tools/review-lab/unit6/qa/checker-adversarial.mjs']),
      ('setup-pipeline',['node','tools/review-lab/unit6/qa/setup-pipeline.mjs']),
      ('integral-entry',['node','tools/review-lab/unit6/qa/integral-entry.mjs']),
      ('graph-fit',['node','tools/review-lab/unit6/qa/graph-fit.mjs']),
      ('display',['node','tools/review-lab/unit6/qa/display-scan.mjs']),
      ('split-100',['node','tools/review-lab/unit6/qa/split-audit.mjs','100']),
      ('distributions',['node','tools/review-lab/unit6/qa/distributions.mjs'])]
def run(job):
    name,command=job
    result=subprocess.run(command,cwd=ROOT,env=os.environ,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    output=result.stdout.decode().replace(str(ROOT),'<repo>').rstrip()+'\n'
    (OUT/(name+'.log')).write_text(output)
    return {'name':name,'command':command,'exitCode':result.returncode}
summary=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    for row in pool.map(run,jobs):
        summary.append(row)
        (OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
        print(row['name'],row['exitCode'],flush=True)
raise SystemExit(any(r['exitCode'] for r in summary))
