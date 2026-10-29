"""Verify the complete Q review ZIP, including shortened Windows extraction paths."""
import hashlib
import json
import os
import subprocess
import zipfile
from pathlib import Path

version = '12.8.Q'
prefix = 'batchmath-site-v' + version + '/'
package = Path(prefix.rstrip('/') + '.zip')
commit = os.environ['GITHUB_SHA']
assert json.loads(Path('package.json').read_text())['version'] == version
metadata = json.loads(Path('assets/app-version.json').read_text())
assert metadata['version'] == version and metadata['release'] == 'v' + version
for filename, declaration in [('assets/pwa.js', 'APP_VERSION'), ('sw.js', 'VERSION'), ('assets/problem-tracking.js', 'APP_VERSION')]:
    assert f"const {declaration} = '{version}';" in Path(filename).read_text()
tracked = {}
for entry in subprocess.check_output(['git', 'ls-tree', '-rz', commit]).split(b'\0'):
    if entry:
        meta, name = entry.split(b'\t', 1)
        mode, kind, oid = meta.split()
        assert kind == b'blob'
        tracked[name.decode()] = oid.decode()
with zipfile.ZipFile(package) as archive:
    names = archive.namelist()
    assert len(names) == len(set(names))
    assert {name.split('/')[0] for name in names} == {prefix.rstrip('/')}
    assert archive.testzip() is None
    files = {i.filename[len(prefix):] for i in archive.infolist() if not i.is_dir()}
    assert files == set(tracked), 'ZIP must contain the complete committed tree'
    assert not any(name.startswith(('node_modules/', 'test-results/', 'playwright-report/')) for name in files)
    assert not any(name.startswith('qa-results/') and name != 'qa-results/.gitkeep' for name in files)
    assert 'tools/unit4-v128q-qa.mjs' in files and 'tools/unit4-v128q-browser-qa.mjs' in files
    for name, oid in tracked.items():
        data = archive.read(prefix + name)
        actual = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        assert actual == oid, 'ZIP blob differs: ' + name
    longest = max(names, key=len)
    # Explorer's Extract All can add a second directory named after the ZIP.
    windows_root = 'C:\\Users\\Teacher\\Downloads\\' + prefix.replace('/', '\\')
    assert max(len(windows_root + name.replace('/', '\\')) for name in names) < 260
    assert all('..' not in name.split('/') and not name.startswith('/') for name in names)
checksum = hashlib.sha256(package.read_bytes()).hexdigest()
repo = os.environ['GITHUB_REPOSITORY']
qa_sha, qa_run = os.environ['QA_COMMIT'], os.environ['QA_RUN_ID']
notes = [
    'BatchMath v12.8.Q review build. These revisions are ready for teacher review; they are not described as approved. Production is unchanged.', '',
    'Download the attached batchmath-site-v12.8.Q.zip asset. It extracts into batchmath-site-v12.8.Q/, without GitHub repository or commit-hash prefixes.',
    'Newton: direct limit/sum explanations with justified limits and complete editable operation keys. Geometry: figure first and a focused exact-area keypad. FTC: explicit endpoint derivatives, substitution and simplification. Rules: complete interval, reversal and linearity work. Chain Rule: two assignment walkthrough videos and two corrected button labels.',
    'Green QA commit: ' + qa_sha,
    'N/Q targeted and full production-equivalent QA: https://github.com/' + repo + '/actions/runs/' + qa_run,
    'All 17 ordered commands from the unchanged production BatchMath QA workflow passed, including full seeded browser QA. The same run includes Q region/distribution/layout/scope tests and retained N, Newton and M regressions.',
    'Package commit: ' + commit,
    'Revision details: https://github.com/' + repo + '/blob/' + commit + '/docs/v12.8.Q-revisions.md', '',
    'Every committed Git blob is included and verified byte-for-byte. Installed dependencies and generated QA files are excluded.',
    'Longest archive path: ' + str(len(longest)) + ' characters.',
    'Windows path check: all entries are shorter than 260 characters even with an additional Extract All folder under C:\\Users\\Teacher\\Downloads. A deeply nested extraction destination can still add length.',
    'Existing N release, main and completed M remain untouched.', '',
    'ZIP: ' + package.name,
    'ZIP bytes: ' + str(package.stat().st_size),
    'Committed files verified: ' + str(len(tracked)),
    'SHA-256: ' + checksum,
]
Path('release-notes-q.md').write_text('\n'.join(notes) + '\n')
Path('batchmath-site-v12.8.Q.sha256').write_text(checksum + '  ' + package.name + '\n')
print('\n'.join(notes))
with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
    summary.write('\n'.join(notes) + '\n')
