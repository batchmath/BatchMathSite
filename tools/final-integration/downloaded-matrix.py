"""Run the original 56 entry-matrix commands against a separately served extracted ZIP.

Only integral setups switch to full displayed-keypad construction. All original
grading, blank-field, locking, layout and JavaScript-error assertions remain.
"""
import argparse
import concurrent.futures
import json
import os
import re
import shlex
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--site', type=Path, required=True)
parser.add_argument('--port', required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
assert args.site.is_dir() and (args.site/'LOCAL-TESTING.txt').is_file()
assert json.loads((args.site/'assets/app-version.json').read_text())['version']=='12.9.E'
args.out.mkdir(parents=True, exist_ok=True)
source = (ROOT/'tools/review-lab/unit6/entry-matrix.sh').read_text()
specs = shlex.split(re.search(r'runs=\((.*?)\n\)',source,re.S)[1])
topic = 'ap-calculus/unit-6-applications-integration/topics'
jobs=[]
for spec in specs:
    page,modes=spec.replace('$T',topic).split(':')
    for mode in modes.split() or ['-']:
        for width,height,mobile in [(1366,768,False),(390,844,True)]:
            name='-'.join(page.split('/')[-2:])+f'-{mode}-{width}x{height}'+('xmobile' if mobile else '')
            jobs.append((name,page,mode,width,height,mobile))
assert len(jobs)==56
env={**os.environ,'BM_PORT':args.port,'BM_ROOT':str(args.site.resolve()),'BM_SETUP_KEYPAD_ONLY':'1',
     'REVIEW_OUT':str(args.out.parent/'downloaded-package-screenshots')}

def run(job):
    name,page,mode,width,height,mobile=job
    command=['node','tools/review-lab/unit6/entry.mjs',page,'6',str(width),str(height)]+(['mobile'] if mobile else [])
    options={**env,'BM_MODE':'' if mode in ['-','mixed'] else mode}
    try:
        result=subprocess.run(command,cwd=ROOT,env=options,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=900)
        output=result.stdout;rc=result.returncode
    except subprocess.TimeoutExpired as error:
        output=(error.stdout or b'')+b'\nOriginal 900-second per-run wrapper timeout\n';rc=124
    (args.out/(name+'.json')).write_bytes(output)
    row={'name':name,'exitCode':rc,'arguments':command,'mode':options['BM_MODE']}
    if rc==0:
        data=json.loads(output)
        assert not any(data.get(k) for k in ['failures','errors','scrollBoxes','pageOverflow']),name
        fields=data['fieldEvidence']
        assert len(fields)==data['mathliveFields']==data['blankAtStart']==data['locked'],name
        assert all(f['correctAccepted'] and f['locked'] and f['blankAtStart'] and f['enteredLatex'] and f['serializedSource'] and f['profile'] for f in fields),name
        setups=[f for f in fields if f['control']=='u6-integral']
        assert len(setups)==data['integrals'],name
        assert all(f['inputMethod']=='displayed-keypad-only' and f['buttonsUsed'] for f in setups),name
        row.update({k:data[k] for k in ['checked','parts','integrals','mathliveFields']})
    return row

summary=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    for row in pool.map(run,jobs):
        summary.append(row)
        (args.out.parent/'downloaded-package-matrix-runs.json').write_text(json.dumps(summary,indent=2)+'\n')
        print(f"{len(summary)}/56 {row['name']} rc={row['exitCode']}",flush=True)
assert len(summary)==56 and all(r['exitCode']==0 for r in summary)
totals={k:sum(r[k] for r in summary) for k in ['checked','parts','integrals','mathliveFields']}
print('PASS',json.dumps(totals),flush=True)
