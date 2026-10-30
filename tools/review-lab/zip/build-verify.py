#!/usr/bin/env python3
"""Build the site ZIP from a commit with git archive and verify it.

Usage: python3 zip/build-verify.py <commit> <version> [outdir]
  e.g. python3 zip/build-verify.py HEAD 12.8.W
Writes <outdir>/batchmath-site-v<version>.zip (default $REVIEW_HOME/out/zip) (top folder batchmath-site-v<version>/) and its .sha256.

Checks: unzip test; every file byte-identical to its git blob; every file of the commit is in the ZIP unless
.gitattributes marks it export-ignore (this review lab, for example); Windows-safe names (no reserved characters
or device names, no trailing dot or space, no case collisions, path length); no node_modules, QA output or OS
junk; assets/app-version.json and the service worker carry the version.
"""
import fnmatch, hashlib, os, re, subprocess, sys, zipfile
from collections import Counter

if len(sys.argv) < 3:
    sys.exit(__doc__)
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
commit = subprocess.run(['git', '-C', REPO, 'rev-parse', sys.argv[1]], check=True, capture_output=True, text=True).stdout.strip()
version = sys.argv[2]
home = os.environ.get('REVIEW_HOME') or os.path.join(os.environ.get('XDG_CACHE_HOME') or os.path.expanduser('~/.cache'), 'batchmath-review-lab')
outdir = os.path.abspath(sys.argv[3] if len(sys.argv) > 3 else os.path.join(home, 'out', 'zip'))
os.makedirs(outdir, exist_ok=True)
prefix = f'batchmath-site-v{version}/'
package = os.path.join(outdir, f'batchmath-site-v{version}.zip')
if os.path.exists(package):
    os.remove(package)
subprocess.run(['git', '-C', REPO, 'archive', '--format=zip', '-9', f'--prefix={prefix}', f'--output={package}', commit], check=True)
subprocess.run(['unzip', '-tq', package], check=True)

def git(*args):
    return subprocess.run(['git', '-C', REPO, *args], check=True, capture_output=True).stdout

tree = {}
for line in git('ls-tree', '-r', '-z', commit).decode().split('\0'):
    if line:
        meta, path = line.split('\t', 1)
        tree[path] = meta.split()[2]
try:
    attributes = git('show', f'{commit}:.gitattributes').decode()
except subprocess.CalledProcessError:
    attributes = ''
ignored = [l.split()[0] for l in attributes.splitlines() if l.strip() and not l.startswith('#') and 'export-ignore' in l.split()[1:]]
def export_ignored(path):
    for pat in ignored:
        pat = pat.strip('/')
        if path == pat or path.startswith(pat + '/') or fnmatch.fnmatch(path, pat) or ('/' not in pat and fnmatch.fnmatch(os.path.basename(path), pat)):
            return True
    return False

problems = []
with zipfile.ZipFile(package) as z:
    files = {i.filename[len(prefix):]: i for i in z.infolist() if not i.is_dir()}
    if any(not i.filename.startswith(prefix) for i in z.infolist()):
        problems.append('entries outside the top folder')
    for path in files:
        if path not in tree:
            problems.append(f'not in the commit: {path}')
            continue
        data = z.read(prefix + path)
        if hashlib.sha1(b'blob %d\0' % len(data) + data).hexdigest() != tree[path]:
            problems.append(f'differs from git: {path}')
    missing = [p for p in tree if p not in files and not export_ignored(p)]
    problems += [f'missing: {p}' for p in missing]
    reserved = {'CON', 'PRN', 'AUX', 'NUL', *[f'COM{i}' for i in range(1, 10)], *[f'LPT{i}' for i in range(1, 10)]}
    for path in files:
        parts = (prefix + path).split('/')
        if any(c in path for c in '<>:"\\|?*') or any(p.endswith((' ', '.')) for p in parts) or any(p.split('.')[0].upper() in reserved for p in parts):
            problems.append(f'not Windows-safe: {path}')
    problems += [f'case collision: {p}' for p, n in Counter(p.lower() for p in files).items() if n > 1]
    longest = max(len(prefix + p) for p in files)
    if longest > 200:
        problems.append(f'path of {longest} characters (Windows limit 260 including the folder it is extracted to)')
    junk = [p for p in files if re.search(r'(^|/)(node_modules|qa-results|__MACOSX)/|(^|/)(\.DS_Store|Thumbs\.db)$', p)]
    problems += [f'should not ship: {p}' for p in junk]
    app = z.read(prefix + 'assets/app-version.json').decode() if 'assets/app-version.json' in files else ''
    sw = z.read(prefix + 'sw.js').decode() if 'sw.js' in files else ''
    if f'"{version}"' not in app:
        problems.append(f'assets/app-version.json does not say {version}')
    if not re.search(r"VERSION\s*=\s*['\"]" + re.escape(version), sw):
        problems.append(f'sw.js VERSION is not {version}')
    excluded = len([p for p in tree if p not in files])

digest = hashlib.sha256(open(package, 'rb').read()).hexdigest()
open(package + '.sha256', 'w').write(f'{digest}  {os.path.basename(package)}\n')
print(f'{package}\n  commit {commit}\n  {len(files)} files ({excluded} export-ignored), {os.path.getsize(package):,} bytes, longest path {longest}\n  sha256 {digest}')
if problems:
    print('PROBLEMS:'); [print('  ' + p) for p in problems[:50]]; sys.exit(1)
print('  all checks passed')
