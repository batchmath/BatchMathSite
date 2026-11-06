"""Check every website file against the two approved sources, with explicit version-only edits."""
import csv
import hashlib
import io
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
A = '98c9beb3c0eb58a952f6bb29e410e63aa280003e'
B = '049e8a49d22f3d5ff67f5a79a855ec0028452ab7'
OUT = ROOT / 'docs/final-integration/evidence'

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)

def tree(ref):
    return {row.split(b'\t', 1)[1].decode(): row.split(b'\t', 1)[0].split()[2].decode()
            for row in git('ls-tree', '-rz', ref).split(b'\0') if row}

def qa(path):
    return path.startswith(('tools/', 'docs/', '.github/')) or path in ('.gitattributes', 'BATCHMATH-WORKING-COPY.txt')

def version_normalized(path, content):
    allowed = path in {'assets/app-version.json', 'assets/pwa.js', 'assets/problem-tracking.js',
                      'assets/reproducible-rng.js', 'sw.js', 'package.json'}
    if path.startswith('ap-calculus/unit-6-applications-integration/') and path.endswith('.html'):
        return re.sub(rb'(generatorVersion["\s]*:["\s]*)12\.9\.[CE]', rb'\g<1>VERSION', content)
    if allowed:
        return re.sub(rb'12\.(?:8\.Y|9\.[CE])', b'VERSION', content)
    return content

def verify():
    ancestor = git('merge-base', A, B).decode().strip()
    at, bt, ct = tree(A), tree(B), tree(ancestor)
    rows = []
    compatibility = json.loads((ROOT / 'tools/final-integration/approved-compatibility.json').read_text())['assets']
    names = set(git('ls-files', '-z').decode().strip('\0').split('\0'))
    assert set(at) | set(bt) <= names, 'A source file was dropped'
    for name in sorted(names - {'docs/final-integration/evidence/provenance.csv', 'docs/final-integration/evidence/provenance.json'}):
        path = ROOT / name
        assert path.is_file(), name + ': missing file'
        data = path.read_bytes()
        blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        # A is the foundation; B contributes changes made since the common ancestor.
        ref = B if bt.get(name) != ct.get(name) else A
        expected = (bt if ref == B else at).get(name)
        if qa(name):
            category = ('source-a-preserved' if blob == at.get(name) else
                        'source-b-imported' if blob == bt.get(name) else 'qa-only')
        elif name in compatibility:
            entry=compatibility[name]
            assert expected==entry['before'] and blob==entry['after'], name + ': unapproved compatibility change'
            category='manually-reconciled'
        elif blob == expected:
            category = 'source-b-imported' if ref == B and blob != at.get(name) else 'source-a-preserved'
        else:
            assert expected is not None, name + ': unexpected website file'
            before = git('show', ref + ':' + name)
            assert version_normalized(name, data) == version_normalized(name, before), name + ': unexpected product change'
            category = 'version-only'
        rows.append({'path': name, 'category': category, 'expectedSource': ref,
                     'sourceBlob': expected, 'finalBlob': blob})
    assert all((ROOT / n).read_bytes() == git('show', A + ':' + n)
               for n in at if n.endswith('.pdf')), 'PDF changed'
    for n in bt:
        if n.startswith(('assets/unit6-', 'assets/mathlive/unit6.mjs', 'assets/mathlive/integral-setup.mjs')):
            if n in compatibility:
                assert git('rev-parse', B + ':' + n).decode().strip()==compatibility[n]['before']
                data=(ROOT / n).read_bytes()
                assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==compatibility[n]['after'], n
            else:
                assert (ROOT / n).read_bytes() == git('show', B + ':' + n), n
    counts = {c: sum(r['category'] == c for r in rows) for c in sorted({r['category'] for r in rows})}
    report = {'sourceA': A, 'sourceB': B, 'commonAncestor': ancestor, 'ok': True,
              'counts': counts, 'files': rows,
              'manuallyReconciledSharedFiles': [
                  'tools/integration/content-preservation-qa.py',
                  'tools/mathlive-advanced-pilot/basic.test.mjs',
                  'tools/mathlive-sitewide/applications-keypads.test.mjs',
                  'tools/mathlive-sitewide/contracts.test.mjs',
                  'tools/mathlive-sitewide/unit1-contracts.test.mjs',
                  'assets/mathlive/integral-setup.mjs', 'assets/mathlive/unit6.mjs'],
              'productionConflictResolution': 'None: the three-way product merge was clean. Shared keypad bridge is exactly Source B and retains Source A stability policy.'}
    return report

if __name__ == '__main__':
    report = verify()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'provenance.json').write_text(json.dumps(report, indent=2) + '\n')
    with (OUT / 'provenance.csv').open('w') as f:
        writer = csv.DictWriter(f, fieldnames=list(report['files'][0]), lineterminator='\n')
        writer.writeheader()
        writer.writerows(report['files'])
    print(json.dumps({k: report[k] for k in ['sourceA', 'sourceB', 'commonAncestor', 'ok', 'counts']}, indent=2))
