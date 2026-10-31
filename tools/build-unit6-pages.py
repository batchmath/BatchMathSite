#!/usr/bin/env python3
"""v12.9.A: wire the Unit 6 (Applications of Integration) practice pages to the Unit 6 engines.

Area Below and Between Curves, Volume by Cross Sections and Solids of Revolution get Non-Calculator Practice and
Calculator Practice pages (created from the topic's practice/ page, which becomes a redirect to the topic page);
the Comprehensive Review gets a Non-Calculator Review and a Calculator Review (from assignment-practice/, which
becomes a redirect). Finding Area in Terms of y keeps its single practice/ page (non-calculator problems only).
Integrals on Piecewise Defined Functions is unchanged. Each wired page loads the Unit 4 checker and keypad, the Unit 5
core, answers and multi-part UI (as libraries), the Unit 6 core, controls and regions, and its engines.
Run from the repository root: python3 tools/build-unit6-pages.py
"""
import html, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UNIT = 'unit-6-applications-integration'
U6 = ROOT / 'ap-calculus' / UNIT / 'topics'
SITE = 'https://batchmath.net'
VERSION = '12.9.A'
COMMON_HEAD = ['/assets/derivative-expression-checker.js', '/assets/unit4-exact-answers.js', '/assets/calculus-keypad.js']
COMMON_BODY = ['/assets/unit5-core.js', '/assets/unit5-answers.js', '/assets/unit5-ui.js', '/assets/unit6-core.js', '/assets/unit6-ui.js', '/assets/unit6-regions.js']
STYLES = ['/assets/calculus-keypad.css', '/assets/unit5.css', '/assets/unit6.css']
AREA = ['/assets/unit6-area.js']
VOLUME = ['/assets/unit6-volume.js']
REVIEW = ['/assets/unit6-area.js', '/assets/unit6-volume.js', '/assets/unit6-frq.js', '/assets/unit6-review.js']

AREA_MODES = [('mixed', 'All Problems'), ('under_curve', 'Area Under a Curve'), ('between', 'Area Between Curves')]
CS_MODES = [('mixed', 'All Problems'), ('perp_x', 'Perpendicular to the x-axis'), ('perp_y', 'Perpendicular to the y-axis')]
SOLID_MODES = [('mixed', 'All Problems'), ('disks_washers', 'Disks and Washers'), ('shells', 'Cylindrical Shells')]
REVIEW_NONCALC = [('mixed', 'All Review Problems'), ('frq_region', 'Area and Volume Free Response'), ('frq_graph', 'Graph Free Response'), ('short', 'Shorter Problems')]
REVIEW_CALC = [('mixed', 'All Review Problems'), ('frq_region', 'Area and Volume Free Response'), ('short', 'Shorter Problems')]

def two(topic, title, scripts, modes, noncalc, calc, seo=None):
    base = topic.replace('-', '_')
    return [dict(topic=topic, page='non-calculator-practice', source='practice', calc='non-calculator', slug=topic, analytics_slug=f'{topic}_noncalculator',
                 title=title, seo_title=seo or title, label='Non-Calculator Practice', engine_id=f'ap_topic_{base}_noncalculator', scripts=scripts,
                 description=noncalc, modes=modes),
            dict(topic=topic, page='calculator-practice', source='practice', calc='calculator', slug=topic, analytics_slug=f'{topic}_calculator',
                 title=title, seo_title=seo or title, label='Calculator Practice', engine_id=f'ap_topic_{base}_calculator', scripts=scripts,
                 description=calc, modes=modes)]

PAGES = [
    *two('area-below-and-between-curves', 'Area Below and Between Curves', AREA, AREA_MODES,
         'No calculator. Find areas under a curve and between curves with exact values: find the intersections yourself, split the region where the curves switch or where a curve crosses the axis, and work with polynomial, radical, exponential, logarithmic and trigonometric boundaries. Enter answers with the math keypad; integral setups are typed as integrals.',
         'Calculator active. Find the intersections with your calculator and store them, set up the area integral, and evaluate it numerically. Round to three decimal places as each question directs.'),
    *two('volume-by-cross-sections', 'Volume by Cross Sections', VOLUME, CS_MODES,
         'No calculator. Cross sections perpendicular to the x-axis or the y-axis: squares, rectangles, semicircles, quarter circles, equilateral triangles and isosceles right triangles. Find the area of a cross section, write integral setups (including "write, but do not evaluate"), and find exact volumes.',
         'Calculator active. Cross sections over regions whose intersections need the calculator. Set up the volume integral and evaluate it numerically; round to three decimal places.'),
    *two('solids-of-revolution', 'Solids of Revolution', VOLUME, SOLID_MODES,
         'No calculator. Disks and washers (dx about a horizontal axis, dy about a vertical axis) and cylindrical shells (dx about a vertical axis, dy about a horizontal axis), about the coordinate axes and shifted lines. Measure each radius from the axis, write integral setups and find exact volumes.',
         'Calculator active. Revolve regions bounded by logarithmic, exponential and trigonometric curves about the axes and shifted lines, set up the integral, and evaluate it with the calculator. Round to three decimal places.'),
    dict(topic='finding-area-in-terms-of-y', page='practice', slug='finding-area-in-terms-of-y', title='Finding Area in Terms of y', engine_id='ap_topic_finding_area_in_terms_of_y',
         scripts=AREA, modes=None,
         description='No calculator. Use horizontal slices: right minus left, with bounds in y. Rewrite curves as x in terms of y, split the region when the right or left boundary changes, and decide when integrating in y is the better choice.'),
    dict(topic='comprehensive-review', page='non-calculator-practice', source='assignment-practice', calc='non-calculator', slug='unit6-comprehensive-review',
         analytics_slug='unit6_assignment_review_noncalculator', title='Applications of Integration', label='Non-Calculator Review', engine_id='ap_unit6_assignment_review_noncalculator',
         scripts=REVIEW, modes=REVIEW_NONCALC,
         description='No calculator. A review of Unit 6: area in terms of x and of y, cross sections, disks and washers, shells, multipart area and volume free-response problems, graph free-response problems (functions defined by integrals of graphs made of segments and circles) and piecewise integrals, from short skills to a share of challenging problems.'),
    dict(topic='comprehensive-review', page='calculator-practice', source='assignment-practice', calc='calculator', slug='unit6-comprehensive-review',
         analytics_slug='unit6_assignment_review_calculator', title='Applications of Integration', label='Calculator Review', engine_id='ap_unit6_assignment_review_calculator',
         scripts=REVIEW, modes=REVIEW_CALC,
         description='Calculator active. A review of the calculator topics: area, cross sections and solids of revolution with intersections from the calculator, and multipart area and volume free-response problems. Round to three decimal places.'),
]

# the retired combined pages: each URL keeps working as a redirect to its topic page
LEGACY = [('area-below-and-between-curves', 'practice', 'Area Below and Between Curves', 'Non-Calculator Practice or Calculator Practice'),
          ('volume-by-cross-sections', 'practice', 'Volume by Cross Sections', 'Non-Calculator Practice or Calculator Practice'),
          ('solids-of-revolution', 'practice', 'Solids of Revolution', 'Non-Calculator Practice or Calculator Practice'),
          ('comprehensive-review', 'assignment-practice', 'Applications of Integration Review', 'the Non-Calculator Review or the Calculator Review')]
LEGACY_PAGE = '''<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>{title} | AP Calculus AB | BatchMath</title>
<meta name="robots" content="noindex"><link rel="canonical" href="{topic_url}"><meta http-equiv="refresh" content="0; url=../">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="stylesheet" href="/assets/site.css">
</head>
<body><main id="main-content" class="main"><h1 class="page-title">{title}</h1><p>This page has moved. Choose {choice} on the <a href="../">{title} page</a>.</p></main></body></html>
'''
KIND_ICON = {'calculator': '<span aria-hidden="true" class="bm-practice-icon bm-practice-icon-calculator"><span class="bm-calculator-glyph"></span></span>'}
INTEGRAL_ICON = '<span aria-hidden="true" class="bm-practice-icon bm-practice-icon-integral">∫</span>'

def page_url(topic, page):
    return f'{SITE}/ap-calculus/{UNIT}/topics/{topic}/{page}/'

def tag(src):
    return f'<script src="{src}"></script>'

def create_sibling(cfg):
    """A calculator or non-calculator page, copied from the topic's own practice page (before it is retired)."""
    dst = U6 / cfg['topic'] / cfg['page'] / 'index.html'
    if dst.exists():
        return False
    text = (U6 / cfg['topic'] / cfg['source'] / 'index.html').read_text(encoding='utf-8')
    if 'window.BM_TOPIC_PRACTICE=' not in text:
        raise SystemExit(f"{cfg['topic']}/{cfg['source']}: not a practice page (already retired?)")
    text = text.replace(f"/{cfg['topic']}/{cfg['source']}/", f"/{cfg['topic']}/{cfg['page']}/")
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(text, encoding='utf-8')
    return True

def set_identity(text, cfg):
    """Title, heading, breadcrumb, canonical URL, descriptions, structured data of a labeled page."""
    heading = f"{cfg['title']} {cfg['label']}"
    full = f"{cfg.get('seo_title', cfg['title'])} {cfg['label']} | AP Calculus AB | BatchMath"
    url = page_url(cfg['topic'], cfg['page'])
    summary = f"{cfg['label'][0]}{cfg['label'][1:].lower()} for {cfg['title']} in AP Calculus AB: randomized BatchMath questions with immediate feedback and worked explanations."
    attr = html.escape(summary, quote=True)
    text = re.sub(r'<title>[^<]*</title>', f'<title>{html.escape(full, quote=False)}</title>', text, count=1)
    for key in ('og:title', 'twitter:title'):
        text = re.sub(rf'(<meta (?:property|name)="{key}" content=")[^"]*(")', lambda m: m.group(1) + html.escape(full, quote=True) + m.group(2), text, count=1)
    for key in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        text = re.sub(rf'(<meta {key} content=")[^"]*(")', lambda m: m.group(1) + attr + m.group(2), text, count=1)
    text = re.sub(r'(<link rel="canonical" href=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), text, count=1)
    text = re.sub(r'(<meta property="og:url" content=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), text, count=1)
    text = re.sub(r'<h1 class="page-title">[^<]*</h1>', f'<h1 class="page-title">{html.escape(heading, quote=False)}</h1>', text, count=1)
    text = re.sub(r'(<li aria-current="page"><span>)[^<]*(</span></li>)', lambda m: m.group(1) + html.escape(heading, quote=False) + m.group(2), text, count=1)
    def ld(m):
        data = json.loads(m.group(2))
        for node in data['@graph']:
            if node.get('@type') == 'WebPage':
                node.update({'@id': url + '#page', 'name': full, 'url': url, 'description': summary})
            if node.get('@type') == 'BreadcrumbList':
                node['itemListElement'][-1].update({'name': heading, 'item': url})
        return m.group(1) + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + m.group(3)
    text, n = re.subn(r'(<script type="application/ld\+json"[^>]*>)(.*?)(</script>)', ld, text, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"{cfg['topic']}/{cfg['page']}: structured data not found")
    text = re.sub(r'(data-batchmath-seo-context="11">Use this interactive AP Calculus AB practice to work on )[^<]*?( with immediate answer checking\.)',
                  lambda m: m.group(1) + html.escape(cfg['title'], quote=False) + m.group(2), text, count=1)
    return text

def wire(cfg):
    path = U6 / cfg['topic'] / cfg['page'] / 'index.html'
    text = path.read_text(encoding='utf-8')
    prev = '<link rel="stylesheet" href="/assets/ap-topic-practice.css">'
    for href in STYLES:
        link = f'<link rel="stylesheet" href="{href}">'
        if link not in text:
            text = text.replace(prev, prev + link, 1)
        prev = link
    for src in COMMON_HEAD:
        if src not in text:
            text = text.replace('<script>window.MathJax=', tag(src) + '<script>window.MathJax=', 1)
    text = re.sub(r'<script src="/assets/unit[56]-[a-z0-9-]+\.js"></script>', '', text)
    body = ''.join(tag(s) for s in COMMON_BODY + cfg['scripts'])
    if text.count('<script src="/assets/ap-topic-practice.js"></script>') != 1:
        raise SystemExit(f'{path}: practice driver not found')
    text = text.replace('<script src="/assets/ap-topic-practice.js"></script>', body + '<script src="/assets/ap-topic-practice.js"></script>', 1)
    # analytics: engine id and generator version
    text = re.sub(r'(BM_ANALYTICS_CONFIG=\{[^}]*engineId:")[^"]*(")', lambda m: m.group(1) + cfg['engine_id'] + m.group(2), text, count=1)
    text = re.sub(r'(BM_ANALYTICS_CONFIG=\{[^}]*generatorVersion:")[^"]*(")', rf'\g<1>{VERSION}\g<2>', text)
    # page config
    conf = {'slug': cfg['slug'], 'title': cfg['title'], 'generatorVersion': VERSION, 'modeSelectIds': ['u6Mode']}
    if cfg.get('calc'):
        conf = {'slug': cfg['slug'], 'analyticsSlug': cfg['analytics_slug'], 'calculator': cfg['calc'], 'title': f"{cfg['title']} {cfg['label']}",
                'generatorVersion': VERSION, 'modeSelectIds': ['u6Mode']}
    if not cfg['modes']:
        conf['modeSelectIds'] = []
    js = 'window.BM_TOPIC_PRACTICE=' + json.dumps(conf, separators=(',', ':')) + ';'
    text, n = re.subn(r'window\.BM_TOPIC_PRACTICE=\{.*?\};', lambda _: js, text, count=1)
    if n != 1:
        raise SystemExit(f'{path}: page config not found')
    # Practice Type dropdown: the old Unit 6 controls (one or two selects) are replaced by one compact menu
    text = re.sub(r'<div class="controls">.*?(?=<div class="stats">)', '', text, count=1, flags=re.S)
    text = re.sub(r'<div class="practice-controls">.*?</select></div>', '', text, flags=re.S)
    if cfg['modes']:
        options = ''.join(f'<option value="{v}"{" selected" if i == 0 else ""}>{html.escape(l)}</option>' for i, (v, l) in enumerate(cfg['modes']))
        controls = f'<div class="practice-controls"><label for="u6Mode" class="bm-practice-select-label">Practice Type</label><select id="u6Mode" class="bm-practice-select">{options}</select></div>'
        text = text.replace('<section class="practice-shell">', '<section class="practice-shell">' + controls, 1)
    text = re.sub(r'<p class="topic-description">.*?</p>', '<p class="topic-description">' + html.escape(cfg['description'], quote=False) + '</p>', text, count=1, flags=re.S)
    text = re.sub(r'<div class="calculator-active-note">.*?</div>', '', text, count=1, flags=re.S)
    if cfg.get('calc') == 'calculator':
        text = text.replace('<div class="stats">', '<div class="calculator-active-note"><strong>Calculator Active</strong> — use your graphing calculator for intersections and numerical integration.</div><div class="stats">', 1)
    if cfg.get('label'):
        text = set_identity(text, cfg)
    path.write_text(text, encoding='utf-8')
    return path

def launch_row(topic):
    """One launch button per labeled page of a topic: Non-Calculator first, then Calculator."""
    cfgs = [c for c in PAGES if c['topic'] == topic and c.get('label')]
    order = {'non-calculator-practice': 1, 'calculator-practice': 2}
    links = []
    for c in sorted(cfgs, key=lambda c: order.get(c['page'], 9)):
        label = html.escape(f"{c['title']} {c['label']}", quote=False)
        icon = KIND_ICON.get(c.get('calc'), INTEGRAL_ICON)
        links.append(f'<a aria-label="{label}" class="resource-link bm-practice-launch bm-practice-integral" data-bm-resource="practice" href="{c["page"]}/">'
                     f'{icon}<span class="bm-practice-label">{label}</span><span aria-hidden="true" class="bm-practice-arrow">›</span></a>')
    return f'<section class="resource-section" data-bm-topic-practice="1"><div class="resource-actions bm-practice-launch-row">{"".join(links)}</div></section>'

def set_launch_row(topic):
    path = U6 / topic / 'index.html'
    text = path.read_text(encoding='utf-8')
    new, n = re.subn(r'<section class="resource-section" data-bm-topic-practice="1">.*?</section>', lambda _: launch_row(topic), text, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f'{path}: practice launch section not found')
    if new != text:
        path.write_text(new, encoding='utf-8')
        return True
    return False

def add_sibling_sitemap(cfg):
    """The new page's sitemap entry, after its topic page's entry (siblings in PAGES order)."""
    path = ROOT / 'sitemap.xml'
    text = path.read_text(encoding='utf-8')
    entry = f"  <url><loc>{page_url(cfg['topic'], cfg['page'])}</loc></url>\n"
    if entry.strip() in text:
        return False
    after = f"  <url><loc>{SITE}/ap-calculus/{UNIT}/topics/{cfg['topic']}/</loc></url>\n"
    if after not in text:
        raise SystemExit(f'sitemap: {after.strip()} not found')
    pos = text.index(after) + len(after)
    for c in [c for c in PAGES if c['topic'] == cfg['topic'] and c.get('source')]:
        if c is cfg:
            break
        e = f"  <url><loc>{page_url(c['topic'], c['page'])}</loc></url>\n"
        if text.startswith(e, pos):
            pos += len(e)
    path.write_text(text[:pos] + entry + text[pos:], encoding='utf-8')
    return True

def write_legacy(topic, page, title, choice):
    path = U6 / topic / page / 'index.html'
    text = LEGACY_PAGE.format(title=html.escape(title, quote=False), choice=choice, topic_url=f'{SITE}/ap-calculus/{UNIT}/topics/{topic}/')
    if path.read_text(encoding='utf-8') == text:
        return False
    path.write_text(text, encoding='utf-8')
    return True

def remove_sitemap(topic, page):
    path = ROOT / 'sitemap.xml'
    text = path.read_text(encoding='utf-8')
    entry = f'  <url><loc>{page_url(topic, page)}</loc></url>\n'
    if entry not in text:
        return False
    path.write_text(text.replace(entry, '', 1), encoding='utf-8')
    return True

if __name__ == '__main__':
    for cfg in PAGES:
        if cfg.get('source'):
            if create_sibling(cfg): print('created', cfg['topic'], cfg['page'])
            if add_sibling_sitemap(cfg): print('sitemap entry added for', cfg['topic'], cfg['page'])
    for cfg in PAGES:
        print('wired', wire(cfg).relative_to(ROOT))
    for topic in sorted({c['topic'] for c in PAGES if c.get('label')}):
        if set_launch_row(topic): print('launch buttons updated for', topic)
    for topic, page, title, choice in LEGACY:
        if write_legacy(topic, page, title, choice): print('redirect written for', topic, page)
        if remove_sitemap(topic, page): print('sitemap entry removed for', topic, page)
