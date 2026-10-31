#!/usr/bin/env python3
"""v12.8.W/X: wire the Unit 5 practice pages to the Unit 5 engines.

For each page: Unit 5 stylesheets and scripts, the Practice Type dropdown, the page config (slug, modes,
generator version) and the student-facing description. Head metadata (SEO, PWA, analytics) is kept; new
practice pages are created from the Basic First-Order page with their own titles and URLs.
v12.8.X: topics with both kinds of problems also get calculator-practice/ and non-calculator-practice/ pages
(created from the topic's practice/ page, which becomes "Mixed Practice"); the page config carries the calculator
mode, and the topic page gets one launch button per page.
v12.8.Y: the combined Mixed Practice pages (Basic, Motion, Rate) and the Mixed Review are retired; their URLs
become small redirects to the topic page, where the student chooses Calculator or Non-Calculator.
Run from the repository root: python3 tools/build-unit5-pages.py
"""
import html, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
U5 = ROOT / 'ap-calculus/unit-5-differential-equations/topics'
VERSION = '12.8.X'
COMMON_HEAD = ['/assets/derivative-expression-checker.js', '/assets/unit4-exact-answers.js', '/assets/calculus-keypad.js']
COMMON_BODY = ['/assets/unit5-core.js', '/assets/unit5-answers.js', '/assets/unit5-ui.js']

# Practice Types on the calculator pages: only families with calculator problems (checked by qa/calc-eligibility.mjs)
REVIEW_SCRIPTS = ['/assets/unit5-basic.js', '/assets/unit5-motion.js', '/assets/unit5-slope-fields.js', '/assets/unit5-separable.js', '/assets/unit5-growth.js',
                  '/assets/unit5-rate.js', '/assets/unit5-review.js']
REVIEW_TOPICS = [('basic', 'Basic First-Order Differential Equations'), ('motion', 'Motion Problems'), ('slope', 'Slope Fields'),
                 ('separable', 'Separable Differential Equations'), ('growth', "Growth, Decay, Interest and Newton's Law"), ('rate', 'Rate Problems')]
REVIEW_TIERS = [('foundational', 'Foundational (all topics)'), ('intermediate', 'Intermediate (all topics)'), ('challenging', 'Challenging (all topics)')]

RATE_MODES = [('mixed', 'Mixed Practice'), ('one_rate', 'Accumulate One Rate'), ('initial_change', 'Initial Amount Plus or Minus Change'),
              ('in_out', 'Inflow and Outflow'), ('delayed_piecewise', 'Delayed Starts and Piecewise Rates'), ('multipart', 'Connected Accumulation Problems')]

CALC_MODES = {
    'basic': [('mixed', 'Mixed Calculator Practice'), ('calc_value', 'Values from an Initial Condition'), ('calc_initial', 'Find the Starting Value'),
              ('calc_two_point', 'Net Change and Two Values')],
    'motion': [('mixed', 'Mixed Calculator Practice'), ('calc_position', 'Position and Average Velocity'), ('calc_distance', 'Displacement and Total Distance'),
               ('calc_speed', 'Velocity, Acceleration and Speed'), ('calc_direction', 'Rest and Direction of Motion')],
}

PAGES = [
    dict(topic='basic-first-order-differential-equations', page='calculator-practice', source='practice', calc='calculator',
         slug='basic-first-order-differential-equations', analytics_slug='basic-first-order-differential-equations_calculator',
         title='Basic First-Order Differential Equations', seo_title='Basic First-Order DEs', label='Calculator Practice',
         engine_id='ap_topic_basic_first_order_differential_equations_calculator', scripts=['/assets/unit5-basic.js'],
         description='Calculator active. Use the Fundamental Theorem of Calculus with your calculator to find values of solutions of initial-value problems, and round as each question directs.',
         modes=CALC_MODES['basic']),
    dict(topic='basic-first-order-differential-equations', page='non-calculator-practice', source='practice', calc='non-calculator',
         slug='basic-first-order-differential-equations', analytics_slug='basic-first-order-differential-equations_noncalculator',
         title='Basic First-Order Differential Equations', seo_title='Basic First-Order DEs', label='Non-Calculator Practice',
         engine_id='ap_topic_basic_first_order_differential_equations_noncalculator', scripts=['/assets/unit5-basic.js'],
         description='No calculator. Solve initial-value problems exactly, state where each solution is defined, and find general solutions. Enter answers with the math keypad and use the worked explanation to see every step.',
         modes=[('mixed', 'Mixed Non-Calculator Practice'), ('poly_power', 'Polynomial, Power and Radical IVPs'), ('trig', 'Trigonometric and Inverse-Trig IVPs'),
                ('exp_composition', 'Exponential and Composition IVPs'), ('log_domain', 'Logarithmic and Domain-Restricted IVPs'), ('general_solution', 'General Solutions')]),
    dict(topic='motion-problems', page='calculator-practice', source='practice', calc='calculator',
         slug='motion-problems', analytics_slug='motion-problems_calculator', title='Motion Problems', label='Calculator Practice',
         engine_id='ap_topic_motion_problems_calculator', scripts=['/assets/unit5-motion.js'],
         description='Calculator active. Use numerical integration and your calculator to find positions, displacement, total distance traveled, velocity, acceleration and speed, and round as each question directs.',
         modes=CALC_MODES['motion']),
    dict(topic='motion-problems', page='non-calculator-practice', source='practice', calc='non-calculator',
         slug='motion-problems', analytics_slug='motion-problems_noncalculator', title='Motion Problems', label='Non-Calculator Practice',
         engine_id='ap_topic_motion_problems_noncalculator', scripts=['/assets/unit5-motion.js'],
         description='No calculator. Recover velocity and position, compare displacement with total distance, and analyze direction, rest and speed with exact values.',
         modes=[('mixed', 'Mixed Non-Calculator Practice'), ('recover', 'Recover Velocity or Position'), ('displacement_distance', 'Displacement and Total Distance'),
                ('direction_speed', 'Direction, Rest and Speed'), ('multipart', 'Connected Multi-Part Problems')]),
    dict(topic='separable-differential-equations', page='practice', slug='separable-differential-equations', title='Separable Differential Equations',
         engine_id='ap_topic_separable_differential_equations', scripts=['/assets/unit5-separable.js'],
         description='Solve each initial-value problem, then state the interval of validity of your solution. Enter answers with the math keypad and use the worked explanation to see every step.',
         modes=[('mixed', 'Mixed Practice'), ('product', 'Product Forms'), ('powers_y', 'Powers of y'), ('log_rational', 'Logarithmic and Rational'),
                ('trig', 'Trigonometric'), ('exp_y', 'Exponentials of y'), ('radical_branch', 'Radicals, Implicit Solutions and Branches')]),
    dict(topic='exponential-growth-and-decay-interest-newton-s-law-of-cooling', page='practice', new=True,
         slug='exponential-growth-and-decay-interest-newton-s-law-of-cooling',
         title="Exponential Growth and Decay, Interest, Newton's Law of Cooling", seo_title="Growth, Decay and Newton's Law",
         engine_id='ap_topic_exponential_growth_and_decay_interest_newton_s_law_of_cooling', scripts=['/assets/unit5-growth.js'],
         description='Calculator active. Build the exponential model from the given information, keep k exact until the end, and round as each part directs. Use the worked explanation to see every step.',
         modes=[('mixed', 'Mixed Practice'), ('growth', 'Exponential Growth'), ('decay', 'Exponential Decay and Half-Life'), ('cooling', "Newton's Law: Cooling"),
                ('heating', "Newton's Law: Warming"), ('interest', 'Compound and Continuous Interest'), ('reverse', 'Find the Unknown (Initial Amount, Rate, Dose)')]),
    # v12.8.X: accumulation only; the Increasing, Decreasing and Extreme Amounts type is retired
    dict(topic='rate-problems', page='calculator-practice', source='practice', calc='calculator', slug='rate-problems', analytics_slug='rate-problems_calculator',
         title='Rate Problems', label='Calculator Practice', engine_id='ap_topic_rate_problems_calculator', scripts=['/assets/unit5-rate.js'],
         description='Calculator active. Set up each accumulation integral, evaluate it with the calculator, include the starting amount when it matters, and round to three decimal places.',
         modes=[('mixed', 'Mixed Calculator Practice')] + RATE_MODES[1:]),
    dict(topic='rate-problems', page='non-calculator-practice', source='practice', calc='non-calculator', slug='rate-problems', analytics_slug='rate-problems_noncalculator',
         title='Rate Problems', label='Non-Calculator Practice', engine_id='ap_topic_rate_problems_noncalculator', scripts=['/assets/unit5-rate.js'],
         description='No calculator. Integrate polynomial, square-root, trigonometric and reciprocal rates exactly, include the starting amount when it matters, and give exact answers.',
         modes=[('mixed', 'Mixed Non-Calculator Practice')] + RATE_MODES[1:]),
    dict(topic='slope-fields', page='practice', new=True, slug='slope-fields', title='Slope Fields', engine_id='ap_topic_slope_fields', scripts=['/assets/unit5-slope-fields.js'],
         description='Draw slope segments and solution curves with a mouse, pen or finger (or type slopes and points instead), match fields with equations, and analyze slopes. After you check a drawing, the correct segments or curve appear on the same grid.',
         modes=[('mixed', 'Mixed Practice'), ('draw_segments', 'Draw Slope Segments'), ('draw_curve', 'Draw Solution Curves'), ('match', 'Match Fields, Equations and Curves'), ('analyze', 'Analyze Slopes and Solutions')]),
    dict(topic='comprehensive-review', page='calculator-practice', source='assignment-practice', calc='calculator', slug='unit5-comprehensive-review',
         analytics_slug='unit5_assignment_review_calculator', title='Differential Equations', label='Calculator Review', engine_id='ap_unit5_assignment_review_calculator',
         scripts=REVIEW_SCRIPTS,
         description='Calculator active. A review of the calculator topics: Basic First-Order Differential Equations, Motion, Growth and Decay, and Rate Problems (weighted 2 : 2 : 1 : 1), from short skills to a smaller share of challenging problems.',
         modes=[('mixed', 'Mixed Calculator Review')] + [m for m in REVIEW_TOPICS if m[0] in ('basic', 'motion', 'growth', 'rate')] + REVIEW_TIERS),
    dict(topic='comprehensive-review', page='non-calculator-practice', source='assignment-practice', calc='non-calculator', slug='unit5-comprehensive-review',
         analytics_slug='unit5_assignment_review_noncalculator', title='Differential Equations', label='Non-Calculator Review', engine_id='ap_unit5_assignment_review_noncalculator',
         scripts=REVIEW_SCRIPTS,
         description='No calculator. A review of Basic First-Order Differential Equations, Motion, Slope Fields (including drawing), Separable Differential Equations and Rate Problems (weighted 2 : 2 : 2 : 2 : 1), from short skills to a smaller share of challenging problems.',
         modes=[('mixed', 'Mixed Non-Calculator Review')] + [m for m in REVIEW_TOPICS if m[0] in ('basic', 'motion', 'slope', 'separable', 'rate')] + REVIEW_TIERS),
]

TEMPLATE = U5 / 'basic-first-order-differential-equations' / 'practice' / 'index.html'
TEMPLATE_TITLE = 'Basic First-Order Differential Equations'
LAUNCH = ('<section class="resource-section" data-bm-topic-practice="1"><div class="resource-actions bm-practice-launch-row">'
          '<a aria-label="{label}" class="resource-link bm-practice-launch bm-practice-integral" data-bm-resource="practice" href="practice/">'
          '<span aria-hidden="true" class="bm-practice-icon bm-practice-icon-integral">∫</span><span class="bm-practice-label">{label}</span>'
          '<span aria-hidden="true" class="bm-practice-arrow">›</span></a></div></section>')

def create_page(cfg):
    """A new practice page: the Basic page with this topic's titles, URLs, structured data and engine id."""
    dst = U5 / cfg['topic'] / cfg['page'] / 'index.html'
    if dst.exists():
        return False
    text = TEMPLATE.read_text(encoding='utf-8')
    seo = cfg.get('seo_title', cfg['title'])
    text = text.replace(f'{TEMPLATE_TITLE} Practice | AP Calculus AB | BatchMath', f'{seo} Practice | AP Calculus AB | BatchMath')
    text = text.replace('basic-first-order-differential-equations', cfg['topic'])
    text = text.replace('ap_topic_basic_first_order_differential_equations', cfg['engine_id'])
    text = text.replace(TEMPLATE_TITLE, cfg['title'])
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(text, encoding='utf-8')
    return True

def add_launch(cfg):
    """The practice launch button on the topic page, after the resources and before the topic pager."""
    path = U5 / cfg['topic'] / 'index.html'
    text = path.read_text(encoding='utf-8')
    if 'data-bm-topic-practice' in text:
        return False
    nav = '<nav aria-label="Previous and next calculus topics" class="topic-pager">'
    if text.count(nav) != 1:
        raise SystemExit(f'{path}: topic pager not found')
    text = text.replace(nav, LAUNCH.format(label=html.escape(cfg['title'] + ' Practice', quote=False)) + nav)
    path.write_text(text, encoding='utf-8')
    return True

def add_sitemap(cfg):
    path = ROOT / 'sitemap.xml'
    text = path.read_text(encoding='utf-8')
    base = f'https://batchmath.net/ap-calculus/unit-5-differential-equations/topics/{cfg["topic"]}/'
    page = f'  <url><loc>{base}{cfg["page"]}/</loc></url>\n'
    if page.strip() in text:
        return False
    topic = f'  <url><loc>{base}</loc></url>\n'
    if topic not in text:
        raise SystemExit(f'sitemap: {base} not found')
    path.write_text(text.replace(topic, topic + page, 1), encoding='utf-8')
    return True

SITE = 'https://batchmath.net'
KIND_ICON = {'calculator': '<span aria-hidden="true" class="bm-practice-icon bm-practice-icon-calculator"><span class="bm-calculator-glyph"></span></span>'}
INTEGRAL_ICON = '<span aria-hidden="true" class="bm-practice-icon bm-practice-icon-integral">∫</span>'

def page_url(cfg):
    return f"{SITE}/ap-calculus/unit-5-differential-equations/topics/{cfg['topic']}/{cfg['page']}/"

def create_sibling(cfg):
    """v12.8.X: a calculator or non-calculator page, copied from the topic's own practice page."""
    dst = U5 / cfg['topic'] / cfg['page'] / 'index.html'
    if dst.exists():
        return False
    text = (U5 / cfg['topic'] / cfg['source'] / 'index.html').read_text(encoding='utf-8')
    text = text.replace(f"/{cfg['topic']}/{cfg['source']}/", f"/{cfg['topic']}/{cfg['page']}/")
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(text, encoding='utf-8')
    return True

def set_identity(text, cfg):
    """Title, heading, breadcrumb, canonical URL, descriptions, structured data and analytics id of a labeled page."""
    heading = f"{cfg['title']} {cfg['label']}"
    full = f"{cfg.get('seo_title', cfg['title'])} {cfg['label']} | AP Calculus AB | BatchMath"
    url = page_url(cfg)
    summary = cfg.get('meta') or f"{cfg['label'][0]}{cfg['label'][1:].lower()} for {cfg['title']} in AP Calculus AB: randomized BatchMath questions with immediate feedback and worked explanations."
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
    text = re.sub(r'(BM_ANALYTICS_CONFIG=\{[^}]*engineId:")[^"]*(")', lambda m: m.group(1) + cfg['engine_id'] + m.group(2), text, count=1)
    return text

def launch_row(topic):
    """One launch button per practice page of a topic: Mixed, Non-Calculator, Calculator (the Unit 3 order)."""
    cfgs = [c for c in PAGES if c['topic'] == topic and c.get('label')]
    order = {'practice': 0, 'assignment-practice': 0, 'non-calculator-practice': 1, 'calculator-practice': 2}
    links = []
    for c in sorted(cfgs, key=lambda c: order.get(c['page'], 9)):
        label = html.escape(f"{c['title']} {c['label']}", quote=False)
        icon = KIND_ICON.get(c.get('calc'), INTEGRAL_ICON)
        links.append(f'<a aria-label="{label}" class="resource-link bm-practice-launch bm-practice-integral" data-bm-resource="practice" href="{c["page"]}/">'
                     f'{icon}<span class="bm-practice-label">{label}</span><span aria-hidden="true" class="bm-practice-arrow">›</span></a>')
    return f'<section class="resource-section" data-bm-topic-practice="1"><div class="resource-actions bm-practice-launch-row">{"".join(links)}</div></section>'

def set_launch_row(topic):
    path = U5 / topic / 'index.html'
    text = path.read_text(encoding='utf-8')
    new, n = re.subn(r'<section class="resource-section" data-bm-topic-practice="1">.*?</section>', lambda _: launch_row(topic), text, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f'{path}: practice launch section not found')
    if new != text:
        path.write_text(new, encoding='utf-8')
        return True
    return False

def add_sibling_sitemap(cfg):
    """The sibling page's sitemap entry, after its topic's practice/ entry."""
    path = ROOT / 'sitemap.xml'
    text = path.read_text(encoding='utf-8')
    entry = f'  <url><loc>{page_url(cfg)}</loc></url>\n'
    if entry.strip() in text:
        return False
    after = f'  <url><loc>{SITE}/ap-calculus/unit-5-differential-equations/topics/{cfg["topic"]}/{cfg["source"]}/</loc></url>\n'
    if after not in text:
        raise SystemExit(f'sitemap: {after.strip()} not found')
    siblings = [c for c in PAGES if c['topic'] == cfg['topic'] and c.get('source') == cfg['source']]
    # keep the siblings in PAGES order right after the source entry
    pos = text.index(after) + len(after)
    for c in siblings:
        e = f'  <url><loc>{page_url(c)}</loc></url>\n'
        if c is cfg:
            break
        if text.startswith(e, pos):
            pos += len(e)
    path.write_text(text[:pos] + entry + text[pos:], encoding='utf-8')
    return True

# v12.8.Y: the retired combined pages; each URL keeps working as a redirect to its topic page
LEGACY = [('basic-first-order-differential-equations', 'practice', 'Basic First-Order Differential Equations', 'Calculator Practice or Non-Calculator Practice'),
          ('motion-problems', 'practice', 'Motion Problems', 'Calculator Practice or Non-Calculator Practice'),
          ('rate-problems', 'practice', 'Rate Problems', 'Calculator Practice or Non-Calculator Practice'),
          ('comprehensive-review', 'assignment-practice', 'Differential Equations Review', 'the Calculator Review or the Non-Calculator Review')]
LEGACY_PAGE = '''<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>{title} | AP Calculus AB | BatchMath</title>
<meta name="robots" content="noindex"><link rel="canonical" href="{topic_url}"><meta http-equiv="refresh" content="0; url=../">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="stylesheet" href="/assets/site.css">
</head>
<body><main id="main-content" class="main"><h1 class="page-title">{title}</h1><p>This page has moved. Choose {choice} on the <a href="../">{title} page</a>.</p></main></body></html>
'''

def write_legacy(topic, page, title, choice):
    """v12.8.Y: a retired combined page becomes a redirect to its topic page (no questions, not in the sitemap)."""
    path = U5 / topic / page / 'index.html'
    text = LEGACY_PAGE.format(title=html.escape(title, quote=False), choice=choice,
                              topic_url=f'{SITE}/ap-calculus/unit-5-differential-equations/topics/{topic}/')
    if path.read_text(encoding='utf-8') == text:
        return False
    path.write_text(text, encoding='utf-8')
    return True

def remove_sitemap(topic, page):
    path = ROOT / 'sitemap.xml'
    text = path.read_text(encoding='utf-8')
    entry = f'  <url><loc>{SITE}/ap-calculus/unit-5-differential-equations/topics/{topic}/{page}/</loc></url>\n'
    if entry not in text:
        return False
    path.write_text(text.replace(entry, '', 1), encoding='utf-8')
    return True

def tag(src):
    return f'<script src="{src}"></script>'

def wire(path, cfg):
    text = path.read_text(encoding='utf-8')
    # stylesheets
    if '/assets/calculus-keypad.css' not in text:
        text = text.replace('<link rel="stylesheet" href="/assets/ap-topic-practice.css">',
                            '<link rel="stylesheet" href="/assets/ap-topic-practice.css"><link rel="stylesheet" href="/assets/calculus-keypad.css">', 1)
    if '/assets/unit5.css' not in text:
        text = text.replace('<link rel="stylesheet" href="/assets/calculus-keypad.css">',
                            '<link rel="stylesheet" href="/assets/calculus-keypad.css"><link rel="stylesheet" href="/assets/unit5.css">', 1)
    # head scripts (checkers and keypad) before the MathJax configuration
    for src in COMMON_HEAD:
        if src not in text:
            text = text.replace('<script>window.MathJax=', tag(src) + '<script>window.MathJax=', 1)
    # engine scripts right before the practice driver
    text = re.sub(r'<script src="/assets/unit5-[a-z-]+\.js"></script>', '', text)
    body = ''.join(tag(s) for s in COMMON_BODY + cfg['scripts'])
    text = text.replace('<script src="/assets/ap-topic-practice.js"></script>', body + '<script src="/assets/ap-topic-practice.js"></script>', 1)
    # analytics generator version
    text = re.sub(r'(BM_ANALYTICS_CONFIG=\{[^}]*generatorVersion:")[^"]*(")', rf'\g<1>{VERSION}\g<2>', text)
    # page config
    conf = {'slug': cfg['slug'], 'title': cfg['title'], 'generatorVersion': VERSION, 'modeSelectIds': ['u5Mode']}
    if cfg.get('calc'):
        conf = {'slug': cfg['slug'], 'analyticsSlug': cfg['analytics_slug'], 'calculator': cfg['calc'], 'title': f"{cfg['title']} {cfg['label']}",
                'generatorVersion': VERSION, 'modeSelectIds': ['u5Mode']}
    elif cfg.get('analytics_slug') and not cfg.get('slugs'):
        conf = {'slug': cfg['slug'], 'analyticsSlug': cfg['analytics_slug'], 'title': cfg.get('conf_title', cfg['title']), 'generatorVersion': VERSION, 'modeSelectIds': ['u5Mode']}
    if cfg.get('slugs'):
        conf = {'slugs': cfg['slugs'], 'analyticsSlug': cfg['analytics_slug'], 'title': cfg['title'], 'generatorVersion': VERSION, 'modeSelectIds': ['u5Mode']}
    js = 'window.BM_TOPIC_PRACTICE=' + json.dumps(conf, separators=(',', ':')) + ';'
    text, n = re.subn(r'window\.BM_TOPIC_PRACTICE=\{.*?\};', lambda _: js, text, count=1)
    if n != 1:
        raise SystemExit(f'{path}: page config not found')
    # Practice Type dropdown
    options = ''.join(f'<option value="{v}"{" selected" if i == 0 else ""}>{html.escape(l)}</option>' for i, (v, l) in enumerate(cfg['modes']))
    controls = f'<div class="practice-controls"><label for="u5Mode" class="bm-practice-select-label">Practice Type</label><select id="u5Mode" class="bm-practice-select">{options}</select></div>'
    text = re.sub(r'<div class="practice-controls">.*?</select></div>', '', text, flags=re.S)
    text = text.replace('<section class="practice-shell">', '<section class="practice-shell">' + controls, 1)
    # description
    text = re.sub(r'<p class="topic-description">.*?</p>',
                  '<p class="topic-description">' + cfg.get('description', 'Enter your answers with the math keypad, check each part, and use the worked explanation to see every step.') + '</p>',
                  text, count=1, flags=re.S)
    # the static "Calculator Active" note (from W's calculator-only Rate page) belongs only on calculator pages;
    # Mixed and Non-Calculator pages rely on each problem's own badge
    if cfg.get('calc') != 'calculator':
        text = re.sub(r'<div class="calculator-active-note">.*?</div>', '', text, count=1, flags=re.S)
    if cfg.get('label'):
        text = set_identity(text, cfg)
    path.write_text(text, encoding='utf-8')
    return path

if __name__ == '__main__':
    for cfg in PAGES:
        if cfg.get('new'):
            if create_page(cfg): print('created', cfg['topic'])
            if add_launch(cfg): print('launch link added to', cfg['topic'])
            if add_sitemap(cfg): print('sitemap entry added for', cfg['topic'])
        if cfg.get('source'):
            if create_sibling(cfg): print('created', cfg['topic'], cfg['page'])
            if add_sibling_sitemap(cfg): print('sitemap entry added for', cfg['topic'], cfg['page'])
        p = U5 / cfg['topic'] / cfg['page'] / 'index.html'
        print('wired', wire(p, cfg).relative_to(ROOT))
    for topic in sorted({c['topic'] for c in PAGES if c.get('source')}):
        if set_launch_row(topic): print('launch buttons updated for', topic)
    for topic, page, title, choice in LEGACY:
        if write_legacy(topic, page, title, choice): print('redirect written for', topic, page)
        if remove_sitemap(topic, page): print('sitemap entry removed for', topic, page)
