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
]

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
        p = U5 / cfg['topic'] / cfg['page'] / 'index.html'
        print('wired', wire(p, cfg).relative_to(ROOT))
