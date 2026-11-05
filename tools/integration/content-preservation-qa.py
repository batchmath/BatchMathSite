"""Verify both integration sources without relaxing mathematical source guards."""
import hashlib
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MATHLIVE = '919ca1806f07e3cd2af552142926e7ca2b78e8d5'
CONTENT = 'bba32f929d6630d096bc4510ceafd586ab8c4a53'
UNIT6 = 'ap-calculus/unit-6-applications-integration/'


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
    for name in sorted(changed_content - set(overlaps)):
        if name.startswith(UNIT6) or not name.endswith('.html'):
            continue
        assert (ROOT / name).read_bytes() == subprocess.check_output(['git', 'show', CONTENT + ':' + name], cwd=ROOT), name
        exact_content.append(name)
    im1_pages = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / 'im1').rglob('*.html'))
    for name in im1_pages:
        expected, final = Markup(source(CONTENT, name)), Markup((ROOT / name).read_text())
        assert final.links == expected.links, name + ': resource or navigation href differs'
        assert final.headings == expected.headings, name + ': content heading differs'
        assert not any(link and re.search(r'(?:^|[/_-])notes?(?:[/_.-]|$)', link, re.I) for link in final.links), name + ': notes link restored'
    assert git('diff', MATHLIVE, '--', UNIT6) == '', 'Unit 6 differs from exact MathLive base'
    assert git('diff', MATHLIVE, '--', '*.pdf') == '', 'Underlying PDFs changed'
    assert git('diff', MATHLIVE, '--', 'assets/mathlive', 'assets/im1-*.js') == '', 'MathLive/IM1 code assets changed'
    report = {'ok': True, 'mathliveSource': MATHLIVE, 'contentSource': CONTENT,
              'commonAncestor': ancestor, 'overlapsReconciled': len(overlaps),
              'overlaps': records, 'nonoverlapContentHtmlExact': exact_content,
              'im1PagesChecked': len(im1_pages), 'studentNotesLinks': 0,
              'pdfsUnchanged': True, 'unit6TreeUnchanged': True,
              'unit6Tree': git('rev-parse', MATHLIVE + ':' + UNIT6.rstrip('/')).strip()}
    return report


if __name__ == '__main__':
    result = verify()
    target = ROOT / 'docs/integration/evidence/content-preservation.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2) + '\n')
    print(f"PASS: {result['overlapsReconciled']} reconciled overlaps, {result['im1PagesChecked']} IM1 pages, "
          f"{len(result['nonoverlapContentHtmlExact'])} exact content HTML pages; PDFs, code assets and Unit 6 preserved.")
