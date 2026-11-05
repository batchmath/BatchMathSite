"""Verify both integration sources without relaxing mathematical source guards."""
import hashlib
import json
import re
import subprocess
import runpy
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MATHLIVE = '919ca1806f07e3cd2af552142926e7ca2b78e8d5'
CONTENT = 'bba32f929d6630d096bc4510ceafd586ab8c4a53'
UNIT6 = 'ap-calculus/unit-6-applications-integration/'
UNIT6_APPROVED = 'e265804f440b2e521de00ecff0f6bc33118a12f1'  # Unit 6 corrections (v12.9.B and the graph fix)


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode()


def source(ref, name):
    return git('show', ref + ':' + name)


class Markup(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.links, self.inputs, self.selects, self.options = [], [], [], []
        self.headings, self.pending = [], None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'a':
            self.links.append(a.get('href'))
        if tag == 'input':
            self.inputs.append(a)
        if tag == 'select':
            self.selects.append(a)
        if tag == 'option':
            self.options.append(a.get('value'))
        if tag in ['title', 'h1', 'h2', 'h3']:
            self.pending = [tag, '']

    def handle_data(self, data):
        if self.pending:
            self.pending[1] += data

    def handle_endtag(self, tag):
        if self.pending and self.pending[0] == tag:
            self.headings.append(self.pending)
            self.pending = None


def executable(text):
    return [(attrs, code) for attrs, code in re.findall(
        r'<script\b([^>]*)>([\s\S]*?)</script>', text)
        if 'application/ld+json' not in attrs]


def verify():
    # Approved hierarchy edits may change instructional markup only. The video
    # audit independently verifies every recording and the complete untouched
    # remainder of each page against the tested integration checkpoint.
    sys.path.insert(0, str(ROOT / 'tools'))
    video_audit = runpy.run_path(str(ROOT / 'tools/video-hierarchy-audit.py'))
    video_result = video_audit['audit']()
    video_changes = {r['path'] for r in video_result['pages'] if r['changed']}
    ancestor = git('merge-base', MATHLIVE, CONTENT).strip()
    changed_math = set(git('diff', '--name-only', ancestor, MATHLIVE).splitlines())
    changed_content = set(git('diff', '--name-only', ancestor, CONTENT).splitlines())
    overlaps = sorted(changed_math & changed_content)
    assert len(overlaps) == 34 and all(p.startswith('im1/') and '/practice/' in p for p in overlaps)
    records = []
    for name in overlaps:
        before, content, final = source(MATHLIVE, name), source(CONTENT, name), (ROOT / name).read_text()
        a, b, c = Markup(before), Markup(content), Markup(final)
        assert executable(final) == executable(before), name + ': executable scripts/order changed'
        assert (c.inputs, c.selects, c.options) == (a.inputs, a.selects, a.options), name + ': input/selector contract changed'
        assert c.links == b.links, name + ': content navigation/resources changed'
        assert c.headings == b.headings, name + ': approved headings changed'
        records.append({'path': name, 'executableScriptsEqualMathLive': True,
                        'inputContractsEqualMathLive': True, 'linksAndHeadingsEqualContent': True,
                        'sha256': hashlib.sha256(final.encode()).hexdigest()})
    exact_content = []
    authorized_video = []
    for name in sorted(changed_content - set(overlaps)):
        if name.startswith(UNIT6) or not name.endswith('.html'):
            continue
        final = (ROOT / name).read_text()
        expected = source(CONTENT, name)
        if name in video_changes:
            outside = video_audit['outside_instructional_sections']
            assert outside(final) == outside(expected), name + ': non-video content changed'
            authorized_video.append(name)
        else:
            # exact, apart from an approved v12.9.A/B practice launch-row relabel (Unit 5 Growth: Calculator Practice)
            assert final == video_audit['approved_launch_rows'](expected, name), name
            exact_content.append(name)
    im1_pages = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / 'im1').rglob('*.html'))
    for name in im1_pages:
        expected, final = Markup(source(CONTENT, name)), Markup((ROOT / name).read_text())
        assert final.links == expected.links, name + ': resource or navigation href differs'
        assert final.headings == expected.headings, name + ': content heading differs'
        assert not any(link and re.search(r'(?:^|[/_-])notes?(?:[/_.-]|$)', link, re.I) for link in final.links), name + ': notes link restored'
    # Unit 6 comes from the approved Unit 6 corrections; only its five topic video pages adopt the content source's
    # video markup (verified above by the video audit). Nothing else in the Unit 6 tree differs from that source.
    unit6_changed = set(git('diff', '--name-only', UNIT6_APPROVED, '--', UNIT6).splitlines())
    unit6_video = {UNIT6 + 'topics/' + t + '/index.html' for t in ['area-below-and-between-curves', 'finding-area-in-terms-of-y', 'integrals-on-piecewise-defined-functions', 'solids-of-revolution', 'volume-by-cross-sections']}
    # the Unit 6 practice pages load the MathLive fields (head) and defer the practice driver; nothing else changes
    # apart from the build version
    ml_head = '<link rel="stylesheet" href="/assets/mathlive/pilot.css"><script type="module" src="/assets/mathlive/unit6.mjs"></script>'
    def unwired(t):
        t = t.replace(ml_head, '').replace('<script defer src="/assets/ap-topic-practice.js">', '<script src="/assets/ap-topic-practice.js">')
        return re.sub(r'generatorVersion("?:)"12\.9\.[A-Z]"', r'generatorVersion\1"V"', t)
    unit6_practice = set()
    for name in sorted(unit6_changed - unit6_video):
        final = (ROOT / name).read_text()
        assert '/practice/index.html' in name or '-practice/index.html' in name, name
        assert ml_head in final and unwired(final) == unwired(source(UNIT6_APPROVED, name)), name + ': changed beyond the MathLive wiring'
        unit6_practice.add(name)
    assert git('diff', MATHLIVE, '--', '*.pdf') == '', 'Underlying PDFs changed'
    # MathLive/IM1 code is as on the MathLive source, except the Unit 6 integration (v12.9.C): two new modules for the
    # Unit 6 fields (unit6.mjs, integral-setup.mjs) and lines added, none removed or changed, in the keypad bridge
    # (the integral, dx and dy keys)
    assert git('diff', MATHLIVE, '--', 'assets/im1-*.js') == '', 'IM1 code assets changed'
    ml = {line.split('\t')[2]: line.split('\t')[:2] for line in git('diff', '--numstat', MATHLIVE, '--', 'assets/mathlive').splitlines()}
    assert set(ml) <= {'assets/mathlive/unit6.mjs', 'assets/mathlive/integral-setup.mjs', 'assets/mathlive/keypad-bridge.mjs'}, sorted(ml)
    assert ml.get('assets/mathlive/keypad-bridge.mjs', ['0', '0'])[1] == '0', 'keypad bridge lines removed or changed'
    assert git('ls-tree', MATHLIVE, '--', 'assets/mathlive/unit6.mjs', 'assets/mathlive/integral-setup.mjs') == '', 'Unit 6 modules not new'
    report = {'ok': True, 'mathliveSource': MATHLIVE, 'contentSource': CONTENT,
              'commonAncestor': ancestor, 'overlapsReconciled': len(overlaps),
              'overlaps': records, 'nonoverlapContentHtmlExact': exact_content,
              'authorizedVideoLayoutHtml': authorized_video,
              'approvedNonoverlapContentHtmlVerified': len(exact_content) + len(authorized_video),
              'im1PagesChecked': len(im1_pages), 'studentNotesLinks': 0,
              'pdfsUnchanged': True, 'unit6Source': UNIT6_APPROVED, 'unit6VideoPagesAdopted': len(unit6_video), 'unit6PracticePagesWiredForMathLive': len(unit6_practice)}
    return report


if __name__ == '__main__':
    result = verify()
    target = ROOT / 'docs/integration/evidence/content-preservation.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2) + '\n')
    print(f"PASS: {result['overlapsReconciled']} reconciled overlaps, {result['im1PagesChecked']} IM1 pages, "
          f"{len(result['nonoverlapContentHtmlExact'])} exact content HTML pages + "
          f"{len(result['authorizedVideoLayoutHtml'])} metadata-preserved video layouts; PDFs, code assets and Unit 6 preserved.")
