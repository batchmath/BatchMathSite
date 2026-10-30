#!/usr/bin/env python3
"""v12.8.W: wire the Unit 5 practice pages to the Unit 5 engines.

For each page: Unit 5 stylesheets and scripts, the Practice Type dropdown, the page config (slug, modes,
generator version) and the student-facing description. Head metadata (SEO, PWA, analytics) is kept; new
practice pages are created from the Basic First-Order page with their own titles and URLs.
Run from the repository root: python3 tools/build-unit5-pages.py
"""
import html, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
U5 = ROOT / 'ap-calculus/unit-5-differential-equations/topics'
VERSION = '12.8.W'
COMMON_HEAD = ['/assets/derivative-expression-checker.js', '/assets/unit4-exact-answers.js', '/assets/calculus-keypad.js']
COMMON_BODY = ['/assets/unit5-core.js', '/assets/unit5-answers.js', '/assets/unit5-ui.js']

PAGES = [
    dict(topic='basic-first-order-differential-equations', page='practice', slug='basic-first-order-differential-equations',
         title='Basic First-Order Differential Equations', engine_id='ap_topic_basic_first_order_differential_equations',
         scripts=['/assets/unit5-basic.js'],
         modes=[('mixed', 'Mixed Practice'), ('poly_power', 'Polynomial, Power and Radical IVPs'), ('trig', 'Trigonometric and Inverse-Trig IVPs'),
                ('exp_composition', 'Exponential and Composition IVPs'), ('log_domain', 'Logarithmic and Domain-Restricted IVPs'),
                ('calculator_ftc', 'Calculator IVPs (FTC)'), ('general_solution', 'General Solutions')]),
    dict(topic='motion-problems', page='practice', slug='motion-problems', title='Motion Problems', engine_id='ap_topic_motion_problems',
         scripts=['/assets/unit5-motion.js'],
         modes=[('mixed', 'Mixed Practice'), ('recover', 'Recover Velocity or Position'), ('displacement_distance', 'Displacement and Total Distance'),
                ('direction_speed', 'Direction, Rest and Speed'), ('calculator', 'Calculator Motion'), ('multipart', 'Connected Multi-Part Problems')]),
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
    dict(topic='rate-problems', page='practice', slug='rate-problems', title='Rate Problems', engine_id='ap_topic_rate_problems', scripts=['/assets/unit5-rate.js'],
         description='Most problems are calculator active: set up the accumulation integral, include the starting amount when it matters, and round to three decimal places. Use the worked explanation to see every step.',
         modes=[('mixed', 'Mixed Practice'), ('one_rate', 'Accumulate One Rate'), ('initial_change', 'Initial Amount Plus or Minus Change'), ('in_out', 'Inflow and Outflow'),
                ('delayed_piecewise', 'Delayed Starts and Piecewise Rates'), ('monotonic', 'Increasing, Decreasing and Extreme Amounts'), ('multipart', 'Connected Multi-Part Problems')]),
    dict(topic='slope-fields', page='practice', new=True, slug='slope-fields', title='Slope Fields', engine_id='ap_topic_slope_fields', scripts=['/assets/unit5-slope-fields.js'],
         description='Draw slope segments and solution curves with a mouse, pen or finger (or type slopes and points instead), match fields with equations, and analyze slopes. After you check a drawing, the correct segments or curve appear on the same grid.',
         modes=[('mixed', 'Mixed Practice'), ('draw_segments', 'Draw Slope Segments'), ('draw_curve', 'Draw Solution Curves'), ('match', 'Match Fields, Equations and Curves'), ('analyze', 'Analyze Slopes and Solutions')]),
    dict(topic='comprehensive-review', page='assignment-practice', slug='unit5-comprehensive-review', analytics_slug='unit5_assignment_review',
         title='Differential Equations Review', engine_id='ap_unit5_assignment_review',
         scripts=['/assets/unit5-basic.js', '/assets/unit5-motion.js', '/assets/unit5-slope-fields.js', '/assets/unit5-separable.js', '/assets/unit5-growth.js', '/assets/unit5-rate.js', '/assets/unit5-review.js'],
         description='A mixed review of all six Unit 5 topics, from short skills to a smaller share of challenging problems. Each question uses the same input, checking and worked explanations as its topic practice page.',
         modes=[('mixed', 'Mixed Review'), ('basic', 'Basic First-Order Differential Equations'), ('motion', 'Motion Problems'), ('slope', 'Slope Fields'),
                ('separable', 'Separable Differential Equations'), ('growth', "Growth, Decay, Interest and Newton's Law"), ('rate', 'Rate Problems'),
                ('foundational', 'Foundational (all topics)'), ('intermediate', 'Intermediate (all topics)'), ('challenging', 'Challenging (all topics)')]),
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
    if cfg.get('analytics_slug') and not cfg.get('slugs'):
        conf = {'slug': cfg['slug'], 'analyticsSlug': cfg['analytics_slug'], 'title': cfg['title'], 'generatorVersion': VERSION, 'modeSelectIds': ['u5Mode']}
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
    path.write_text(text, encoding='utf-8')
    return path

if __name__ == '__main__':
    for cfg in PAGES:
        if cfg.get('new'):
            if create_page(cfg): print('created', cfg['topic'])
            if add_launch(cfg): print('launch link added to', cfg['topic'])
            if add_sitemap(cfg): print('sitemap entry added for', cfg['topic'])
        p = U5 / cfg['topic'] / cfg['page'] / 'index.html'
        print('wired', wire(p, cfg).relative_to(ROOT))
