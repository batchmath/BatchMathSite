"""Run the full merged site suite, then reproduce failures on both exact source checkouts."""
import json
import os
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/final-integration/evidence/site-suite'
SOURCES = {'source-a': Path('/workspace/work/v12.9.E/source-a'),
           'source-b': Path('/workspace/work/v12.9.E/source-b')}
scripts = [s.strip().removeprefix('npm run ') for s in
           json.loads((ROOT / 'package.json').read_text())['scripts']['qa:nobrowser'].split('&&')]
results = []

def run(label, tree, script):
    folder = OUT / label
    folder.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    try:
        result = subprocess.run(['npm', 'run', '-s', script], cwd=tree,
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=900)
        rc, output = result.returncode, result.stdout
    except subprocess.TimeoutExpired as error:
        rc, output = 124, error.stdout or b''
    (folder / (script + '.log')).write_bytes(output)
    row = {'tree': label, 'script': script, 'exitCode': rc,
           'seconds': round(time.monotonic() - started, 2)}
    results.append(row)
    (OUT / 'summary.json').write_text(json.dumps(results, indent=2) + '\n')
    print(label, script, rc, flush=True)
    return rc

if __name__ == '__main__':
    failed = [script for script in scripts if run('merged', ROOT, script)]
    for label, tree in SOURCES.items():
        assert (tree / 'package.json').exists(), 'Missing baseline checkout: ' + label
        for script in failed:
            run(label, tree, script)
    print('Merged:', len(scripts) - len(failed), '/', len(scripts), 'passed', flush=True)
