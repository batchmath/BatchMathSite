"""Verify every byte in the N committed-tree ZIP and write release provenance."""
import hashlib
import json
import os
import subprocess
import zipfile
from pathlib import Path

version = '12.8.N'
prefix = 'batchmath-site-v' + version + '/'
package = Path(prefix.rstrip('/') + '.zip')
commit = os.environ['GITHUB_SHA']
assert json.loads(Path('package.json').read_text())['version'] == version
metadata = json.loads(Path('assets/app-version.json').read_text())
assert metadata['version'] == version and metadata['release'] == 'v' + version
for filename, declaration in [('assets/pwa.js', 'APP_VERSION'), ('sw.js', 'VERSION')]:
    assert f"const {declaration} = '{version}';" in Path(filename).read_text()
tracked = {}
for entry in subprocess.check_output(['git', 'ls-tree', '-rz', commit]).split(b'\0'):
    if not entry:
        continue
    meta, name = entry.split(b'\t', 1)
    mode, kind, oid = meta.split()
    assert kind == b'blob'
    tracked[name.decode()] = oid.decode()
required = {
    'index.html', '.github/workflows/batchmath-qa.yml',
    '.github/workflows/unit4-v128m-qa.yml', '.github/workflows/unit4-v128n-qa.yml',
    '.github/workflows/package-v12-8-n.yml',
    'archive/index.html', 'archive/problem-list/index.html',
    'mogollon2026/index.html', 'mogollon2026/problem-list/index.html',
    'assets/archive-running-document.js', 'assets/archive-running-document.css',
    'assets/ap-topic-generators.js', 'assets/ap-topic-practice.js',
    'assets/ap-topic-practice.css', 'assets/unit4-exact-answers.js', 'assets/calculus-keypad.js',
    'docs/v12.8.N-curriculum-audit.md', 'docs/v12.8.N-results.md',
    'tools/unit4-v128n-curriculum.json', 'tools/unit4-v128n-qa.mjs',
    'tools/unit4-v128n-browser-qa.mjs', 'tools/unit4-v128n-production-parity.py',
    'tools/answered-enter-browser-qa.mjs', 'tools/seeded-browser-qa.mjs',
    'ap-calculus/unit-2-derivatives/topics/the-chain-rule/index.html',
    'ap-calculus/unit-2-derivatives/topics/the-quotient-rule/index.html',
}
base = 'ap-calculus/unit-4-integrals/topics/'
for route in ['rectangular-approximations/practice', 'trapezoidal-approximations/practice',
              'introduction-to-sigma-notation/practice',
              'evaluating-definite-integrals-with-a-limit-and-summation/practice',
              'integrals-using-geometry/practice',
              'fundamental-theorem-of-calculus-and-integral-rules/practice',
              'fundamental-theorem-of-calculus-and-integral-rules/integral-rules-practice',
              'comprehensive-review/practice']:
    required.add(base + route + '/index.html')
with zipfile.ZipFile(package) as archive:
    names = archive.namelist()
    assert len(names) == len(set(names)), 'Duplicate ZIP entries'
    assert {name.split('/')[0] for name in names} == {prefix.rstrip('/')}
    assert archive.testzip() is None
    files = {i.filename[len(prefix):] for i in archive.infolist() if not i.is_dir()}
    assert files == set(tracked), 'ZIP must contain the entire committed tree'
    assert required <= files, sorted(required - files)
    assert not any(name.startswith('qa-results/') and name != 'qa-results/.gitkeep' for name in files)
    assert not any(name.startswith(('node_modules/', 'test-results/', 'playwright-report/')) for name in files)
    for name, oid in tracked.items():
        data = archive.read(prefix + name)
        actual = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        assert actual == oid, 'ZIP blob differs: ' + name
checksum = hashlib.sha256(package.read_bytes()).hexdigest()
assert package.stat().st_size > 0
repo = os.environ['GITHUB_REPOSITORY']
qa_sha = os.environ['QA_COMMIT']
qa_run = os.environ['QA_RUN_ID']
notes = [
    'Complete BatchMath v12.8.N prerelease for teacher testing. No production deployment.', '',
    'Continued source-map checkpoint: 78bd74a341e4bc82d28751187111d729b2af8c01',
    'Final version-sync / green QA commit: ' + qa_sha,
    'N targeted and full production-equivalent QA: https://github.com/' + repo + '/actions/runs/' + qa_run,
    'The production-equivalent job executes all 17 ordered commands from unchanged BatchMath QA, including complete seeded browser QA.',
    'Package commit / tag target: ' + commit, '',
    'Source-supported redesign: constructed Newton sums and finite-sum limits; typed signed geometry with worked diagrams; typed FTC derivatives; separate Combining Integral Rules engine. Topic 7 and all resource/video links remain. Comprehensive Review shares these factories and keeps the existing eleven-topic mix.',
    'Independent deterministic sample: 12,000 per engine, 48,000 total. All four mathematical oracles pass; weights remain within 1.6 percentage points of source targets. All four engines use typed student production.',
    'Unique IDs/tasks: Newton 8384; Geometry 7194; FTC 8331; Rules 11753. Immediate-repeat rates: 0.0167%, 0.0417%, 0%, 0%. Site total: 133 unique instrumented engines.',
    'Curriculum evidence, before/after findings and all target/generated family shares: https://github.com/' + repo + '/blob/' + commit + '/docs/v12.8.N-results.md',
    'The existing Rectangular seed regression is fixed in the QA helper; no Rectangular curriculum redesign was made.',
    'Final package checks repeat N independent math and actual desktop/mobile editor QA plus retained M print/PDF, graph, Sigma, archive and walkthrough regressions.',
    'ZIP includes every committed repository file; generated QA output/screenshots and installed dependencies are excluded.',
    'Main and completed J/K/L/M branches remain untouched.', '',
    'ZIP: ' + package.name,
    'ZIP bytes: ' + str(package.stat().st_size),
    'Committed files verified: ' + str(len(tracked)),
    'SHA-256: ' + checksum,
]
Path('release-notes.md').write_text('\n'.join(notes) + '\n')
Path('batchmath-site-v12.8.N.sha256').write_text(checksum + '  ' + package.name + '\n')
print('\n'.join(notes))
with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
    summary.write('\n'.join(notes) + '\n')
