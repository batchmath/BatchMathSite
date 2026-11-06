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


def approved_keypad_source(name, current):
    approved = json.loads((ROOT / 'tools/keypad-completeness/approved-corrections.json').read_text())
    entry = approved['assets'].get(name)
    if not entry:
        return current
    raw = current.encode()
    blob = hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
    assert blob == entry['after'], name + ': edit outside the exact tested keypad correction'
    assert git('rev-parse', approved['baseline'] + ':' + name).strip() == entry['before']
    return source(approved['baseline'], name)


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
    assert git('diff', MATHLIVE, '--', 'assets/im1-*.js') == '', 'IM1 generator/checker assets changed'
    name = 'assets/im1-keypad.css'
    expected = source(MATHLIVE, name).replace('grid-auto-rows:32px;', 'grid-auto-rows:minmax(32px,auto);').replace('grid-auto-rows:48px;', 'grid-auto-rows:minmax(48px,auto);') + '\n/* Keep a legacy answer above positioned MathJax overflow from the question. */\ninput.bm-keypad-input{position:relative}\n/* Exercise panels are form containers, not navigation cards. Ancestor :active\n   otherwise scales the entire question/keypad while a descendant key is held. */\nsection.card:has(.bm-keypad-input):hover,\nsection.card:has(.bm-keypad-input):active{transform:none}\n'
    assert (ROOT / name).read_text() == expected, 'Unapproved IM1 editor styling change'
    name = 'assets/calculus-keypad.js'
    original = source(MATHLIVE, name)
    current = approved_keypad_source(name, (ROOT / name).read_text()).replace('\n      input.focus=()=>{if(!input.disabled)activateBinding(binding,true);};', '').replace('\n    input.focus=()=>{if(!input.disabled)editor.focus({preventScroll:true});};', '')
    assert current == original, 'Legacy keypad parsing/editing/serialization changed'
    review_path = 'ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html'
    before = source('9c395be1b765366b9459bd8db7af6d5d70468b9d', review_path)
    start = before.index('  let neutralPrompt=')
    end = before.index('  return {cat,id,q:', start)
    expected = (before[:start] + '  const taskPrompt=String(prompt||"Find the derivative.");\n' + before[end:]).replace('${neutralPrompt}', '${taskPrompt}')
    assert (ROOT / review_path).read_text() == expected, 'Review change extends beyond authored prompt handling'
    editor_changes = git('diff', '--name-only', MATHLIVE, '--', 'assets/mathlive').splitlines()
    approved = json.loads((ROOT / 'tools/keypad-completeness/approved-corrections.json').read_text())
    permitted = set(approved['assets'])
    # Preserve both exact approved sources. Every Unit 6-side asset change is
    # checked against B, while A's eight tested keypad corrections keep their hashes.
    final_b = '049e8a49d22f3d5ff67f5a79a855ec0028452ab7'
    integration_base = git('merge-base', '98c9beb3c0eb58a952f6bb29e410e63aa280003e', final_b).strip()
    unit6_assets = set(git('diff', '--name-only', integration_base, final_b, '--', 'assets').splitlines())
    assert set(git('diff', '--name-only', approved['baseline'], '--', 'assets').splitlines()) <= permitted | unit6_assets, 'Unexpected production asset changed since findings'
    for name in permitted:
        approved_keypad_source(name, (ROOT / name).read_text())
    for name in unit6_assets - permitted:
        assert (ROOT / name).read_text() == source(final_b, name), name + ': Unit 6 approved asset changed'
    unit6_modules = {'assets/mathlive/unit6.mjs', 'assets/mathlive/integral-setup.mjs'}
    assert git('ls-tree', MATHLIVE, '--', *sorted(unit6_modules)) == '', 'Unit 6 modules not new'
    assert set(editor_changes) <= {'assets/mathlive/keypad-bridge.mjs', 'assets/mathlive/pilot.css', 'assets/mathlive/answer-field.mjs', 'assets/mathlive/native-fields.mjs', 'assets/mathlive/dynamic-fields.mjs'} | permitted | unit6_modules, editor_changes
    focus_routes = {
        'assets/mathlive/answer-field.mjs': '  dispose.push(redirectInputFocus(source,()=>legacy.focus(),()=>active&&!source.disabled));\n',
        'assets/mathlive/native-fields.mjs': '    removes.push(redirectInputFocus(r.input,guard(()=>{active=index;focus();}),()=>ready&&!disposed&&!r.input.disabled));\n',
        'assets/mathlive/dynamic-fields.mjs': '        removers.push(redirectInputFocus(r.input,guard(()=>{active=index;selectPad();focus();}),()=>ready&&alive()&&!r.input.disabled));\n'
    }
    for name, added in focus_routes.items():
        current = (ROOT / name).read_text().replace(',redirectInputFocus', '').replace(added, '')
        assert current == source(MATHLIVE, name), name + ': non-focus contract changed'
    if 'assets/mathlive/pilot.css' in editor_changes:
        name = 'assets/mathlive/pilot.css'
        expected = source(MATHLIVE, name).replace('min-height:56px;padding:8px', 'min-height:64px;padding:8px').replace('min-height:50px;padding:7px', 'min-height:56px;padding:7px')
        assert (ROOT / name).read_text() == expected, 'Unapproved MathLive styling change'
    if 'assets/mathlive/keypad-bridge.mjs' in editor_changes:
        name = 'assets/mathlive/keypad-bridge.mjs'
        before, final = source(MATHLIVE, name), (ROOT / name).read_text()
        # Only focus/viewport policy is authorized here. Every command mapping,
        # inserted token, change/check callback and error path stays exact.
        marker = 'export function bridgeKeypad'
        body = final[final.index(marker):]
        body = body.replace('const mf=active();if(!mf)return;\n      stableKeypadAction(mf,()=>{\n      focusMathfield(mf);', 'const mf=active();if(!mf)return;focusMathfield(mf);')
        body = body.replace('onChange();\n      });', 'onChange();')
        # v12.9.C Unit 6: the integral, dx and dy keys, exactly these two added mappings
        unit6_keys = ("      // Unit 6 integral setups (v12.9.C): an editable definite integral, and its differential\n"
                      "      else if(aria==='Insert definite integral')mf.insert('\\\\int_{#?}^{#?}#?');\n"
                      "      else if(button.dataset.u6Key==='dx'||button.dataset.u6Key==='dy')mf.insert('\\\\,'+button.dataset.u6Key);\n")
        assert body.count(unit6_keys) == 1, 'Unit 6 keypad mappings missing or changed'
        body = body.replace(unit6_keys, '')
        assert body == before[before.index(marker):], 'Keypad dispatch or checker callbacks changed'
        assert final.split('export function focusMathfield')[0] == before.split('export function focusMathfield')[0], 'Keypad token/command definitions changed'
    report = {'ok': True, 'mathliveSource': MATHLIVE, 'contentSource': CONTENT,
              'commonAncestor': ancestor, 'overlapsReconciled': len(overlaps),
              'overlaps': records, 'nonoverlapContentHtmlExact': exact_content,
              'authorizedVideoLayoutHtml': authorized_video,
              'approvedNonoverlapContentHtmlVerified': len(exact_content) + len(authorized_video),
              'im1PagesChecked': len(im1_pages), 'studentNotesLinks': 0,
              'pdfsUnchanged': True, 'unit6Source': UNIT6_APPROVED, 'unit6VideoPagesAdopted': len(unit6_video),
              'unit6PracticePagesWiredForMathLive': len(unit6_practice), 'unit6MathLiveModules': sorted(unit6_modules),
              'approvedEditorViewportChanges': editor_changes,
              'approvedReviewInstructionChange': review_path,
              'reviewGeneratorsAnswersAndGradersUnchanged': True}
    return report


if __name__ == '__main__':
    result = verify()
    target = ROOT / 'docs/integration/evidence/content-preservation.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2) + '\n')
    print(f"PASS: {result['overlapsReconciled']} reconciled overlaps, {result['im1PagesChecked']} IM1 pages, "
          f"{len(result['nonoverlapContentHtmlExact'])} exact content HTML pages + "
          f"{len(result['authorizedVideoLayoutHtml'])} metadata-preserved video layouts; PDFs, mathematical contracts and Unit 6 preserved.")
